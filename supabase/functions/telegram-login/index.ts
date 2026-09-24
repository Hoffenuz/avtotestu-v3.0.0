/**
 * telegram-login — Telegram orqali PAROLSIZ kirish, DEEP-LINK asosida.
 *
 * NEGA WIDGET (iframe) EMAS: rasmiy Telegram Login Widget `oauth.telegram.org`
 * ni iframe sifatida ko'rsatadi. Ko'p zamonaviy brauzer buni ishlatmay qo'yadi
 * — Safari uchinchi tomon cookie'larini STANDART holatda bloklaydi (ITP),
 * Chrome/Firefox maxfiylik rejimlarida ham xuddi shunday. Iframe hech qachon
 * chizilmaydi va hech qanday xato ham chiqmaydi — koddan tuzatib bo'lmaydi.
 *
 * OQIM (iframe/cookie MUTLAQO ishlatilmaydi):
 *  1. "start" — bir martalik token yaratiladi (5 daqiqa amal qiladi).
 *  2. Foydalanuvchi `t.me/<bot>?start=login_<token>` ga o'tadi va "Start"
 *     bosadi — boshqa hech narsa qilishi shart emas.
 *  3. Bot darhol "confirm" chaqiradi va "kirdingiz" deb javob beradi.
 *  4. Sayt "poll" bilan holatni so'raydi va OTP ni oladi.
 *
 * ALOHIDA OQIM — "webapp": sayt bot ICHIDA (Telegram Mini App) ochilganda
 * yuqoridagi oqim ishlamaydi (Telegram allaqachon ochiq va WebView'ning
 * saqlash joyi brauzernikidan ajratilgan). U yerda Telegram'ning o'zi bergan
 * imzolangan `initData` tekshiriladi va sessiya darhol beriladi.
 *
 * ── XAVFSIZLIK ───────────────────────────────────────────────────────────
 *
 * a) MIJOZGA BOG'LASH (client_hash) — tokenni faqat uni YARATGAN brauzer
 *    poll qila oladi. Busiz hujumchi o'zi tasdiqlagan tokenni qurbonning
 *    brauzeriga "sovg'a qilib", uni o'z hisobiga kiritib qo'yishi mumkin edi
 *    (TikTok'da topilgan "session donation CSRF" hujumi).
 *
 * b) ATOMAR CLAIM — `confirmed`/`consumed` shartli UPDATE bilan olinadi
 *    (`.eq(..., false)`), shuning uchun bir vaqtda kelgan ikkita so'rov
 *    ikkita hisob yaratmaydi va OTP ikki marta berilmaydi (TOCTOU).
 *
 * c) IMZO SOHASI + VAQT — bot imzosi endi maqsad nomi va vaqt belgisini
 *    ham qamrab oladi, shuning uchun bir endpoint uchun imzolangan so'rovni
 *    boshqasiga qayta ishlatib bo'lmaydi va eski so'rov takrorlanmaydi.
 *
 * d) CORS — OTP qaytaradigan endpoint endi ixtiyoriy saytga emas, faqat
 *    o'z domenlarimizga javob beradi.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/** Bu funksiyaga murojaat qila oladigan domenlar. */
function resolveOrigin(req: Request): string | null {
  const origin = req.headers.get("Origin");
  if (!origin) return null;
  try {
    const { hostname, protocol } = new URL(origin);
    if (protocol !== "https:" && hostname !== "localhost" && hostname !== "127.0.0.1") return null;
    const allowed =
      hostname === "avtotestu.uz" ||
      hostname === "www.avtotestu.uz" ||
      hostname.endsWith(".avtotestu.uz") ||
      hostname.endsWith(".pages.dev") || // Cloudflare Pages preview
      hostname === "localhost" ||
      hostname === "127.0.0.1";
    return allowed ? origin : null;
  } catch {
    return null;
  }
}

function corsHeaders(req: Request): Record<string, string> {
  const origin = resolveOrigin(req);
  return {
    // Bot (server-server) so'rovlarida Origin yo'q — ular CORS ga bog'liq emas.
    "Access-Control-Allow-Origin": origin ?? "null",
    "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-bot-signature, x-bot-timestamp",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    Vary: "Origin",
  };
}

function jsonResponse(req: Request, body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders(req), "Content-Type": "application/json" },
  });
}

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const admin = () =>
  createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

async function loadBotToken(supabase: ReturnType<typeof admin>): Promise<string | null> {
  const { data, error } = await supabase.rpc("get_telegram_login_bot_token");
  if (error) {
    console.error("[telegram-login] bot token RPC:", error.message);
    return null;
  }
  return typeof data === "string" && data.trim() ? data.trim() : null;
}

function toHex(bytes: ArrayBuffer): string {
  return Array.from(new Uint8Array(bytes))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function sha256Hex(value: string): Promise<string> {
  return toHex(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)));
}

function constantTimeEquals(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** Bot imzosi eskirgan deb hisoblanadigan vaqt (soat farqiga ham chidamli). */
const SIGNATURE_MAX_AGE_SECONDS = 300;

/**
 * Bot imzosini tekshiradi.
 *
 * Imzolanadigan matn: `${purpose}\n${timestamp}\n${rawBody}`.
 * `purpose` — endpoint nomi: bitta endpoint uchun imzolangan so'rovni
 * boshqasiga qayta ishlatib bo'lmaydi. `timestamp` — eski so'rovni
 * takrorlashning oldini oladi.
 */
async function verifyBotSignature(
  req: Request,
  purpose: string,
  rawBody: string,
  botToken: string,
): Promise<boolean> {
  const signature = (req.headers.get("X-Bot-Signature") ?? "").trim().toLowerCase();
  const timestamp = (req.headers.get("X-Bot-Timestamp") ?? "").trim();
  if (!signature || !timestamp) return false;

  const ts = Number(timestamp);
  if (!Number.isFinite(ts)) return false;
  if (Math.abs(Date.now() / 1000 - ts) > SIGNATURE_MAX_AGE_SECONDS) {
    console.warn("[telegram-login] imzo vaqti eskirgan");
    return false;
  }

  const enc = new TextEncoder();
  const secretKey = await crypto.subtle.digest("SHA-256", enc.encode(botToken));
  const hmacKey = await crypto.subtle.importKey("raw", secretKey, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const computed = toHex(await crypto.subtle.sign("HMAC", hmacKey, enc.encode(`${purpose}\n${timestamp}\n${rawBody}`)));
  return constantTimeEquals(computed, signature);
}

/**
 * Token: 24 bayt (192 bit) tasodifiy → 48 ta hex belgi.
 *
 * NEGA 32 EMAS, 24 BAYT: token Telegram deep-link'ida
 * `?start=login_<token>` ko'rinishida uzatiladi, `start` parametri esa
 * QAT'IY 64 belgi bilan cheklangan va undan uzuni JIMGINA tashlab
 * yuboriladi (xato ham chiqmaydi). 32 bayt = 64 belgi + "login_" = 70
 * belgi bo'lib, aynan shu sabab bot hech qanday payload olmasdi.
 * Hozir: 6 + 48 = 54 belgi — chegaradan ancha past.
 * 192 bit bir martalik, 5 daqiqalik token uchun ortig'i bilan yetarli.
 */
function generateToken(): string {
  return toHex(crypto.getRandomValues(new Uint8Array(24)).buffer);
}

const TELEGRAM_EMAIL_DOMAIN = "tg.avtotestu.uz";

/** E.164 chegarasi: mamlakat kodi bilan birga eng ko'p 15 raqam. */
function normalizePhone(raw: string): string | null {
  const digits = raw.replace(/\D/g, "");
  if (digits.length < 7 || digits.length > 15) return null;
  return `+${digits}`;
}

/**
 * Mini App `initData` shuncha vaqtdan keyin qabul qilinmaydi.
 *
 * Telegram `initData` ni Mini App HAR ishga tushganda yangidan yaratadi,
 * biz esa uni sahifa ochilishining o'zida ishlatamiz — ya'ni amalda u doim
 * bir necha soniyalik bo'ladi. Oyna soatlab ochiq tursa ham muammo yo'q:
 * sessiya birinchi yuklanishdayoq olingan bo'ladi. Shuning uchun oyna qisqa
 * — o'g'irlangan `initData` ning qiymati shuncha kam bo'ladi.
 */
const INIT_DATA_MAX_AGE_SECONDS = 3600;

async function hmacRaw(keyBytes: Uint8Array, message: string): Promise<Uint8Array> {
  const key = await crypto.subtle.importKey("raw", keyBytes, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return new Uint8Array(await crypto.subtle.sign("HMAC", key, new TextEncoder().encode(message)));
}

/**
 * Telegram Mini App `initData` sini tekshiradi (rasmiy algoritm).
 *
 *   secret_key     = HMAC_SHA256(key: "WebAppData", data: <bot_token>)
 *   data_check_str = `hash` dan boshqa barcha maydonlar "kalit=qiymat"
 *                    ko'rinishida, alifbo tartibida, qator tashlash bilan ulangan
 *   hash           = HEX(HMAC_SHA256(key: secret_key, data: data_check_str))
 *
 * Imzo bot tokeni bilan hisoblangani uchun, u to'g'ri chiqsa foydalanuvchi
 * kimligiga ISHONISH mumkin — hech qanday qo'shimcha tasdiqlash kerak emas.
 *
 * Muvaffaqiyatda maydonlar obyekti, aks holda `null` qaytadi.
 */
async function verifyInitData(initData: string, botToken: string): Promise<Record<string, string> | null> {
  // Oqilona chegara: haqiqiy initData bir necha yuz bayt bo'ladi.
  if (!initData || initData.length > 4096) return null;

  const params = new URLSearchParams(initData);
  const hash = (params.get("hash") ?? "").toLowerCase();
  if (!/^[0-9a-f]{64}$/.test(hash)) return null;

  const authDate = Number(params.get("auth_date"));
  if (!Number.isFinite(authDate)) return null;
  if (Math.abs(Date.now() / 1000 - authDate) > INIT_DATA_MAX_AGE_SECONDS) {
    console.warn("[telegram-login] initData eskirgan");
    return null;
  }

  const secretKey = await hmacRaw(new TextEncoder().encode("WebAppData"), botToken);

  /**
   * `signature` maydoni (Ed25519, uchinchi tomon tekshiruvi uchun) keyinroq
   * qo'shilgan va uni imzolanadigan matnga KIRITISH kerakmi degan savolda
   * mijozlar/kutubxonalar bir xil emas. Ikkala variantni ham sinaymiz —
   * aks holda kirish foydalanuvchining Telegram versiyasiga qarab
   * tasodifan ishlamay qolardi.
   */
  for (const skipSignature of [true, false]) {
    const pairs: string[] = [];
    for (const [key, value] of params) {
      if (key === "hash") continue;
      if (skipSignature && key === "signature") continue;
      pairs.push(`${key}=${value}`);
    }
    pairs.sort();
    const computed = toHex((await hmacRaw(secretKey, pairs.join("\n"))).buffer);
    if (constantTimeEquals(computed, hash)) return Object.fromEntries(params.entries());
  }

  return null;
}

type TelegramAccount = { email: string; hasPhone: boolean };

/**
 * Telegram ID bo'yicha hisobni topadi, bo'lmasa yaratadi.
 *
 * Ikkala kirish yo'li — saytdagi deep-link (`confirm`) va bot ichidagi
 * Mini App (`webapp`) — SHU yerdan o'tadi, shunda hisob yaratish qoidalari
 * ikki joyda ayri-ayri o'zgarib ketmaydi.
 */
async function getOrCreateTelegramAccount(
  supabase: ReturnType<typeof admin>,
  telegramId: number,
  username: string | null,
  firstName: string | null,
): Promise<TelegramAccount | null> {
  const lookup = async () =>
    await supabase.from("profiles").select("id, email, phone").eq("telegram_id", telegramId).maybeSingle();

  const { data: existing, error: lookupErr } = await lookup();
  if (lookupErr) {
    console.error("[telegram-login] profil qidiruvi:", lookupErr.message);
    return null;
  }

  if (existing) {
    const row = existing as { id: string; email: string; phone: string | null };
    await supabase.from("profiles").update({ telegram_username: username }).eq("id", row.id);
    return { email: row.email, hasPhone: Boolean(row.phone) };
  }

  const email = `tg_${telegramId}@${TELEGRAM_EMAIL_DOMAIN}`;
  const { data: created, error: createErr } = await supabase.auth.admin.createUser({
    email,
    password: crypto.randomUUID() + crypto.randomUUID(),
    email_confirm: true,
    user_metadata: {
      signup_method: "telegram",
      telegram_id: telegramId,
      telegram_username: username,
      full_name: firstName,
    },
  });

  if (createErr) {
    /**
     * Bir vaqtda kelgan ikkinchi so'rov shu yerga tushadi: hisob endigina
     * yaratilgan bo'lsa `createUser` "already registered" beradi. Ikkinchi
     * hisob yaratishga urinmaymiz — mavjudini qaytadan o'qiymiz.
     */
    const { data: retry } = await lookup();
    if (retry) {
      const row = retry as { email: string; phone: string | null };
      return { email: row.email, hasPhone: Boolean(row.phone) };
    }
    console.error("[telegram-login] createUser:", createErr.message);
    return null;
  }

  await supabase
    .from("profiles")
    .update({ telegram_id: telegramId, telegram_username: username })
    .eq("id", created.user!.id);

  return { email, hasPhone: false };
}

type TokenRow = {
  token: string;
  mode: "login" | "link";
  linking_user_id: string | null;
  confirmed: boolean;
  consumed: boolean;
  result_ready: boolean;
  telegram_id: number | null;
  telegram_username: string | null;
  result_email: string | null;
  result_otp: string | null;
  client_hash: string | null;
  error: string | null;
  expires_at: string;
};

async function handleStart(req: Request, supabase: ReturnType<typeof admin>, body: Record<string, unknown>) {
  const mode = body.mode === "link" ? "link" : "login";
  const clientHash = typeof body.client_hash === "string" ? body.client_hash.trim().toLowerCase() : "";

  // Mijozga bog'lash MAJBURIY — busiz token boshqa brauzerga "sovg'a"
  // qilinishi mumkin (session donation CSRF).
  if (!/^[0-9a-f]{64}$/.test(clientHash)) {
    return jsonResponse(req, { ok: false, error: "invalid_payload" }, 400);
  }

  let linkingUserId: string | null = null;
  if (mode === "link") {
    const authHeader = req.headers.get("Authorization") ?? "";
    const bearer = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
    if (!bearer) return jsonResponse(req, { ok: false, error: "not_authenticated" }, 401);
    const { data: userData, error: userErr } = await supabase.auth.getUser(bearer);
    if (userErr || !userData?.user) return jsonResponse(req, { ok: false, error: "not_authenticated" }, 401);
    linkingUserId = userData.user.id;
  }

  const loginToken = generateToken();

  const { error } = await supabase.from("telegram_login_tokens").insert({
    token: loginToken,
    mode,
    linking_user_id: linkingUserId,
    client_hash: clientHash,
  });
  if (error) {
    console.error("[telegram-login] start insert:", error.message);
    return jsonResponse(req, { ok: false, error: "internal_error" }, 500);
  }

  // Eskirgan tokenlarni fursatdan foydalanib tozalaymiz — alohida cron shart emas.
  void supabase
    .from("telegram_login_tokens")
    .delete()
    .lt("expires_at", new Date(Date.now() - 60_000).toISOString())
    .then(() => {});

  return jsonResponse(req, { ok: true, token: loginToken });
}

async function handlePoll(req: Request, supabase: ReturnType<typeof admin>, body: Record<string, unknown>) {
  const token = typeof body.token === "string" ? body.token : "";
  const clientSecret = typeof body.client_secret === "string" ? body.client_secret : "";
  if (!token || !clientSecret) return jsonResponse(req, { ok: false, error: "invalid_payload" }, 400);

  const { data, error } = await supabase
    .from("telegram_login_tokens")
    .select("*")
    .eq("token", token)
    .maybeSingle<TokenRow>();

  if (error) {
    console.error("[telegram-login] poll lookup:", error.message);
    return jsonResponse(req, { ok: false, error: "internal_error" }, 500);
  }
  if (!data || new Date(data.expires_at).getTime() < Date.now()) {
    return jsonResponse(req, { ok: false, error: "expired" }, 404);
  }

  // Faqat tokenni YARATGAN brauzer natijani ola oladi.
  const expected = await sha256Hex(clientSecret);
  if (!data.client_hash || !constantTimeEquals(expected, data.client_hash)) {
    console.warn("[telegram-login] poll: mijoz mos kelmadi");
    return jsonResponse(req, { ok: false, error: "forbidden" }, 403);
  }

  if (data.error) return jsonResponse(req, { ok: false, error: data.error });
  // Tasdiqlangan, lekin natija hali tayyorlanmoqda — kutishda davom etamiz.
  if (!data.confirmed || !data.result_ready) return jsonResponse(req, { ok: true, status: "pending" });

  // ATOMAR: `consumed` ni faqat u hali `false` bo'lsa o'zgartiramiz.
  // Bir vaqtda kelgan ikkinchi so'rov bo'sh ro'yxat oladi va OTP ni
  // qayta ololmaydi.
  const { data: claimed, error: claimErr } = await supabase
    .from("telegram_login_tokens")
    .update({ consumed: true })
    .eq("token", token)
    .eq("consumed", false)
    .select("token");

  if (claimErr) {
    console.error("[telegram-login] poll claim:", claimErr.message);
    return jsonResponse(req, { ok: false, error: "internal_error" }, 500);
  }
  if (!claimed || claimed.length === 0) {
    return jsonResponse(req, { ok: true, status: "done", alreadyConsumed: true });
  }

  if (data.mode === "link") {
    return jsonResponse(req, { ok: true, status: "done", telegram_username: data.telegram_username });
  }
  return jsonResponse(req, { ok: true, status: "done", email: data.result_email, otp: data.result_otp });
}

async function handleConfirm(req: Request, supabase: ReturnType<typeof admin>, rawBody: string) {
  const body = JSON.parse(rawBody) as Record<string, unknown>;
  const token = typeof body.token === "string" ? body.token : "";
  const telegram = (body.telegram ?? {}) as Record<string, unknown>;
  const telegramId = Number(telegram.id);
  const username = typeof telegram.username === "string" ? telegram.username : null;
  const firstName = typeof telegram.first_name === "string" ? telegram.first_name : null;

  if (!token || !Number.isFinite(telegramId) || telegramId <= 0) {
    return jsonResponse(req, { ok: false, error: "invalid_payload" }, 400);
  }

  const { data: row, error: rowErr } = await supabase
    .from("telegram_login_tokens")
    .select("*")
    .eq("token", token)
    .maybeSingle<TokenRow>();

  if (rowErr) {
    console.error("[telegram-login] confirm lookup:", rowErr.message);
    return jsonResponse(req, { ok: false, error: "internal_error" }, 500);
  }
  if (!row || new Date(row.expires_at).getTime() < Date.now()) {
    return jsonResponse(req, { ok: false, error: "expired" }, 404);
  }

  // ATOMAR CLAIM: `confirmed` ni faqat u hali `false` bo'lsa belgilaymiz.
  // Shu sabab bir vaqtda kelgan ikkita tasdiq IKKITA hisob yaratmaydi.
  const { data: claimed, error: claimErr } = await supabase
    .from("telegram_login_tokens")
    .update({ confirmed: true, telegram_id: telegramId, telegram_username: username })
    .eq("token", token)
    .eq("confirmed", false)
    .select("token");

  if (claimErr) {
    console.error("[telegram-login] confirm claim:", claimErr.message);
    return jsonResponse(req, { ok: false, error: "internal_error" }, 500);
  }
  if (!claimed || claimed.length === 0) {
    return jsonResponse(req, { ok: false, error: "already_used" }, 409);
  }

  const fail = async (code: string) => {
    await supabase.from("telegram_login_tokens").update({ error: code, result_ready: true }).eq("token", token);
    return jsonResponse(req, { ok: false, error: code }, 400);
  };

  if (row.mode === "link") {
    if (!row.linking_user_id) return await fail("internal_error");

    const { data: owner } = await supabase
      .from("profiles")
      .select("id")
      .eq("telegram_id", telegramId)
      .maybeSingle();

    if (owner && (owner as { id: string }).id !== row.linking_user_id) {
      return await fail("telegram_already_linked");
    }

    const { error: bindErr } = await supabase
      .from("profiles")
      .update({ telegram_id: telegramId, telegram_username: username })
      .eq("id", row.linking_user_id);
    if (bindErr) {
      console.error("[telegram-login] bind:", bindErr.message);
      return await fail("internal_error");
    }

    await supabase.from("telegram_login_tokens").update({ result_ready: true }).eq("token", token);
    return jsonResponse(req, { ok: true, mode: "link", telegram_username: username });
  }

  // mode === "login"
  const account = await getOrCreateTelegramAccount(supabase, telegramId, username, firstName);
  if (!account) return await fail("internal_error");
  const { email, hasPhone } = account;

  const { data: linkData, error: linkGenErr } = await supabase.auth.admin.generateLink({ type: "magiclink", email });
  if (linkGenErr || !linkData?.properties?.email_otp) {
    console.error("[telegram-login] confirm generateLink:", linkGenErr?.message);
    return await fail("internal_error");
  }

  await supabase
    .from("telegram_login_tokens")
    .update({ result_email: email, result_otp: linkData.properties.email_otp, result_ready: true })
    .eq("token", token);

  return jsonResponse(req, { ok: true, mode: "login", has_phone: hasPhone });
}

/**
 * Bot Telegram'ning `request_contact` tugmasi orqali olingan raqamni
 * shu yerga yozadi — faqat allaqachon bog'langan (`telegram_id` bor)
 * profilga, boshqa hech narsani o'zgartirmasdan.
 */
async function handlePhone(req: Request, supabase: ReturnType<typeof admin>, rawBody: string) {
  const body = JSON.parse(rawBody) as Record<string, unknown>;
  const telegramId = Number(body.telegram_id);
  const phone = normalizePhone(typeof body.phone === "string" ? body.phone : "");

  if (!Number.isFinite(telegramId) || telegramId <= 0 || !phone) {
    return jsonResponse(req, { ok: false, error: "invalid_payload" }, 400);
  }

  const { data, error } = await supabase
    .from("profiles")
    .update({ phone })
    .eq("telegram_id", telegramId)
    .select("id");

  if (error) {
    console.error("[telegram-login] phone update:", error.message);
    return jsonResponse(req, { ok: false, error: "internal_error" }, 500);
  }
  if (!data || data.length === 0) {
    return jsonResponse(req, { ok: false, error: "not_linked" }, 404);
  }

  return jsonResponse(req, { ok: true });
}

/**
 * Bot ichidagi sayt (Mini App) uchun AVTOMATIK kirish.
 *
 * NEGA KERAK: Telegram Mini App ni o'z WebView'ida ochadi va uning
 * saqlash joyi (localStorage) brauzernikidan butunlay ajratilgan. Ya'ni
 * foydalanuvchi saytga Chrome'da kirgan bo'lsa ham, bot ichidagi oynada
 * MEHMON bo'lib qolardi va u yerdan qayta kirishning qulay yo'li yo'q —
 * deep-link oqimi Telegram ichidan ishlamaydi.
 *
 * Telegram bu holat uchun `initData` beradi: bot tokeni bilan imzolangan
 * foydalanuvchi ma'lumoti. Imzo to'g'ri bo'lsa — kim ekani isbotlangan.
 */
async function handleWebApp(req: Request, supabase: ReturnType<typeof admin>, body: Record<string, unknown>) {
  const initData = typeof body.init_data === "string" ? body.init_data : "";
  if (!initData) return jsonResponse(req, { ok: false, error: "invalid_payload" }, 400);

  const botToken = await loadBotToken(supabase);
  if (!botToken) {
    console.error("[telegram-login] TELEGRAM_LOGIN_BOT_TOKEN Vault'da topilmadi");
    return jsonResponse(req, { ok: false, error: "not_configured" }, 500);
  }

  const fields = await verifyInitData(initData, botToken);
  if (!fields) return jsonResponse(req, { ok: false, error: "invalid_init_data" }, 403);

  let tgUser: Record<string, unknown>;
  try {
    tgUser = JSON.parse(fields.user ?? "");
  } catch {
    return jsonResponse(req, { ok: false, error: "invalid_init_data" }, 403);
  }

  const telegramId = Number(tgUser.id);
  if (!Number.isFinite(telegramId) || telegramId <= 0) {
    return jsonResponse(req, { ok: false, error: "invalid_init_data" }, 403);
  }

  const account = await getOrCreateTelegramAccount(
    supabase,
    telegramId,
    typeof tgUser.username === "string" ? tgUser.username : null,
    typeof tgUser.first_name === "string" ? tgUser.first_name : null,
  );
  if (!account) return jsonResponse(req, { ok: false, error: "internal_error" }, 500);

  const { data: linkData, error: linkErr } = await supabase.auth.admin.generateLink({
    type: "magiclink",
    email: account.email,
  });
  if (linkErr || !linkData?.properties?.email_otp) {
    console.error("[telegram-login] webapp generateLink:", linkErr?.message);
    return jsonResponse(req, { ok: false, error: "internal_error" }, 500);
  }

  return jsonResponse(req, { ok: true, email: account.email, otp: linkData.properties.email_otp });
}

/** Bot chaqiradigan amallar — imzo talab qiladi. */
const BOT_ACTIONS = new Set(["confirm", "phone"]);

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: corsHeaders(req) });
  if (req.method !== "POST") return jsonResponse(req, { ok: false, error: "method_not_allowed" }, 405);

  try {
    const supabase = admin();
    const action = new URL(req.url).searchParams.get("action") ?? "";

    if (BOT_ACTIONS.has(action)) {
      // Imzo XOM tana ustidan hisoblanadi — tanani faqat bir marta o'qish mumkin.
      const rawBody = await req.text();
      const botToken = await loadBotToken(supabase);
      if (!botToken) {
        console.error("[telegram-login] TELEGRAM_LOGIN_BOT_TOKEN Vault'da topilmadi");
        return jsonResponse(req, { ok: false, error: "not_configured" }, 500);
      }
      if (!(await verifyBotSignature(req, `telegram-login:${action}`, rawBody, botToken))) {
        console.warn(`[telegram-login] ${action}: noto'g'ri imzo`);
        return jsonResponse(req, { ok: false, error: "invalid_signature" }, 403);
      }
      try {
        if (action === "confirm") return await handleConfirm(req, supabase, rawBody);
        return await handlePhone(req, supabase, rawBody);
      } catch {
        return jsonResponse(req, { ok: false, error: "invalid_body" }, 400);
      }
    }

    // Brauzer chaqiradigan amallar — faqat o'z domenlarimizdan.
    if (!resolveOrigin(req)) {
      return jsonResponse(req, { ok: false, error: "forbidden_origin" }, 403);
    }

    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body) return jsonResponse(req, { ok: false, error: "invalid_body" }, 400);

    if (action === "start") return await handleStart(req, supabase, body);
    if (action === "poll") return await handlePoll(req, supabase, body);
    if (action === "webapp") return await handleWebApp(req, supabase, body);

    return jsonResponse(req, { ok: false, error: "unknown_action" }, 400);
  } catch (err) {
    console.error("[telegram-login] unexpected:", err);
    return jsonResponse(req, { ok: false, error: "internal_error" }, 500);
  }
});
