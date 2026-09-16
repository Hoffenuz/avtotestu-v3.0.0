/**
 * telegram-login — Telegram orqali PAROLSIZ kirish, DEEP-LINK asosida.
 *
 * NEGA WIDGET (iframe) EMAS: rasmiy Telegram Login Widget `oauth.telegram.org`
 * ni iframe sifatida ko'rsatadi. Ko'p zamonaviy brauzer buni ishlatmay qo'yadi
 * — Safari uchinchi tomon cookie'larini STANDART holatda bloklaydi (ITP),
 * Chrome/Firefox maxfiylik rejimlarida ham xuddi shunday. Bu Telegram
 * ekotizimida keng tanilgan, KOD DARAJASIDA tuzatib bo'lmaydigan muammo —
 * iframe hech qachon chizilmaydi, hech qanday xato ham chiqmaydi.
 *
 * YANGI OQIM (iframe/cookie MUTLAQO ishlatilmaydi):
 *  1. Frontend "start" chaqiradi — bir martalik token yaratiladi (5 daqiqa
 *     amal qiladi).
 *  2. Frontend foydalanuvchini `https://t.me/<bot>?start=login_<token>`
 *     havolasiga yo'naltiradi (oddiy navigatsiya — iframe yo'q, cookie yo'q,
 *     hech qachon buzilmaydi).
 *  3. Foydalanuvchi Telegram'da /start bosadi. VPS'dagi bot buni qabul
 *     qiladi va "confirm" chaqiradi — so'rov bot TOKENI bilan imzolanadi
 *     (HMAC-SHA256, kalit = SHA256(bot_token)) — xuddi
 *     `telegram-leaderboard` bilan bir xil andoza, yangi sir shart emas.
 *     Foydalanuvchi haqiqatan o'sha Telegram akkaunti ekanligiga Telegram
 *     Bot API'ning o'zi kafolat beradi (/start xabari faqat haqiqiy
 *     foydalanuvchidan kelishi mumkin) — alohida hash tekshiruvi kerak emas.
 *  4. Frontend "poll" bilan token holatini so'raydi. Tasdiqlangach bir
 *     martalik OTP qaytadi, `supabase.auth.verifyOtp()` bilan sessiyaga
 *     almashtiriladi. Parol HECH QAYERDA ishlatilmaydi.
 *
 * "link" rejimi xuddi shunday, faqat yangi hisob yaratmaydi — ALLAQACHON
 * kirgan foydalanuvchi hisobiga Telegram biriktiradi ("start" chaqirilganda
 * Authorization sarlavhasidan aniqlanadi).
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-bot-signature",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

function optionsResponse(): Response {
  return new Response(null, { status: 204, headers: corsHeaders });
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

/** Bot tokenidan hosil qilingan kalit bilan HMAC imzoni tekshiradi (leaderboard bilan bir xil andoza). */
async function verifyBotSignature(rawBody: string, signature: string, botToken: string): Promise<boolean> {
  if (!signature) return false;
  const enc = new TextEncoder();
  const secretKey = await crypto.subtle.digest("SHA-256", enc.encode(botToken));
  const hmacKey = await crypto.subtle.importKey("raw", secretKey, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const computed = toHex(await crypto.subtle.sign("HMAC", hmacKey, enc.encode(rawBody)));
  if (computed.length !== signature.length) return false;
  let diff = 0;
  for (let i = 0; i < computed.length; i++) diff |= computed.charCodeAt(i) ^ signature.charCodeAt(i);
  return diff === 0;
}

/** Token: 32 bayt (256 bit) tasodifiy — taxmin qilib topish amaliy jihatdan imkonsiz. */
function generateToken(): string {
  return toHex(crypto.getRandomValues(new Uint8Array(32)).buffer);
}

const TELEGRAM_EMAIL_DOMAIN = "tg.avtotestu.uz";

type TokenRow = {
  token: string;
  mode: "login" | "link";
  linking_user_id: string | null;
  confirmed: boolean;
  consumed: boolean;
  telegram_id: number | null;
  telegram_username: string | null;
  result_email: string | null;
  result_otp: string | null;
  error: string | null;
  expires_at: string;
};

async function handleStart(req: Request, supabase: ReturnType<typeof admin>, body: Record<string, unknown>) {
  const mode = body.mode === "link" ? "link" : "login";
  let linkingUserId: string | null = null;

  if (mode === "link") {
    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
    if (!token) return jsonResponse({ ok: false, error: "not_authenticated" }, 401);
    const { data: userData, error: userErr } = await supabase.auth.getUser(token);
    if (userErr || !userData?.user) return jsonResponse({ ok: false, error: "not_authenticated" }, 401);
    linkingUserId = userData.user.id;
  }

  const loginToken = generateToken();
  const { error } = await supabase.from("telegram_login_tokens").insert({
    token: loginToken,
    mode,
    linking_user_id: linkingUserId,
  });
  if (error) {
    console.error("[telegram-login] start insert:", error.message);
    return jsonResponse({ ok: false, error: "internal_error" }, 500);
  }

  // Eskirgan tokenlarni fursatdan foydalanib tozalaymiz — alohida cron shart emas.
  void supabase
    .from("telegram_login_tokens")
    .delete()
    .lt("expires_at", new Date(Date.now() - 60_000).toISOString())
    .then(() => {});

  return jsonResponse({ ok: true, token: loginToken });
}

async function handlePoll(supabase: ReturnType<typeof admin>, body: Record<string, unknown>) {
  const token = typeof body.token === "string" ? body.token : "";
  if (!token) return jsonResponse({ ok: false, error: "invalid_payload" }, 400);

  const { data, error } = await supabase
    .from("telegram_login_tokens")
    .select("*")
    .eq("token", token)
    .maybeSingle<TokenRow>();

  if (error) {
    console.error("[telegram-login] poll lookup:", error.message);
    return jsonResponse({ ok: false, error: "internal_error" }, 500);
  }
  if (!data || new Date(data.expires_at).getTime() < Date.now()) {
    return jsonResponse({ ok: false, error: "expired" }, 404);
  }
  if (!data.confirmed) {
    return jsonResponse({ ok: true, status: "pending" });
  }
  if (data.error) {
    return jsonResponse({ ok: false, error: data.error });
  }
  if (data.consumed) {
    // Ma'lumot allaqachon bir marta berilgan — qayta yuborilmaydi (OTP
    // bir martalik). Frontend odatda buni ko'rmaydi, chunki u natijani
    // olgach polling'ni to'xtatadi; shunday bo'lsa ham xavfsizlik uchun.
    return jsonResponse({ ok: true, status: "done", alreadyConsumed: true });
  }

  await supabase.from("telegram_login_tokens").update({ consumed: true }).eq("token", token);

  if (data.mode === "link") {
    return jsonResponse({ ok: true, status: "done", telegram_username: data.telegram_username });
  }
  return jsonResponse({ ok: true, status: "done", email: data.result_email, otp: data.result_otp });
}

async function handleConfirm(req: Request, supabase: ReturnType<typeof admin>) {
  const botToken = await loadBotToken(supabase);
  if (!botToken) {
    console.error("[telegram-login] TELEGRAM_LOGIN_BOT_TOKEN Vault'da topilmadi");
    return jsonResponse({ ok: false, error: "not_configured" }, 500);
  }

  const rawBody = await req.text();
  const signature = (req.headers.get("X-Bot-Signature") ?? "").trim().toLowerCase();
  if (!(await verifyBotSignature(rawBody, signature, botToken))) {
    console.warn("[telegram-login] confirm: noto'g'ri imzo");
    return jsonResponse({ ok: false, error: "invalid_signature" }, 403);
  }

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(rawBody);
  } catch {
    return jsonResponse({ ok: false, error: "invalid_body" }, 400);
  }

  const token = typeof body.token === "string" ? body.token : "";
  const telegram = (body.telegram ?? {}) as Record<string, unknown>;
  const telegramId = Number(telegram.id);
  const username = typeof telegram.username === "string" ? telegram.username : null;
  const firstName = typeof telegram.first_name === "string" ? telegram.first_name : null;

  if (!token || !Number.isFinite(telegramId) || telegramId <= 0) {
    return jsonResponse({ ok: false, error: "invalid_payload" }, 400);
  }

  const { data: row, error: rowErr } = await supabase
    .from("telegram_login_tokens")
    .select("*")
    .eq("token", token)
    .maybeSingle<TokenRow>();

  if (rowErr) {
    console.error("[telegram-login] confirm lookup:", rowErr.message);
    return jsonResponse({ ok: false, error: "internal_error" }, 500);
  }
  if (!row || new Date(row.expires_at).getTime() < Date.now()) {
    return jsonResponse({ ok: false, error: "expired" }, 404);
  }
  // Token allaqachon tasdiqlangan — qayta ishlov berish YO'Q (bot xabarni
  // takror yuborishi yoki foydalanuvchi /start ni ikki marta bosishi mumkin,
  // bu ikkinchi hisob yaratib yubormasligi kerak).
  if (row.confirmed) {
    return jsonResponse({ ok: true, already: true });
  }

  if (row.mode === "link") {
    if (!row.linking_user_id) {
      await supabase.from("telegram_login_tokens").update({ confirmed: true, error: "internal_error" }).eq("token", token);
      return jsonResponse({ ok: false, error: "internal_error" }, 500);
    }

    const { data: owner } = await supabase
      .from("profiles")
      .select("id")
      .eq("telegram_id", telegramId)
      .maybeSingle();

    if (owner && (owner as { id: string }).id !== row.linking_user_id) {
      await supabase
        .from("telegram_login_tokens")
        .update({ confirmed: true, telegram_id: telegramId, telegram_username: username, error: "telegram_already_linked" })
        .eq("token", token);
      return jsonResponse({ ok: true }); // bot foydalanuvchiga umumiy xabar ko'rsatadi
    }

    await supabase
      .from("profiles")
      .update({ telegram_id: telegramId, telegram_username: username })
      .eq("id", row.linking_user_id);

    await supabase
      .from("telegram_login_tokens")
      .update({ confirmed: true, telegram_id: telegramId, telegram_username: username })
      .eq("token", token);

    return jsonResponse({ ok: true, telegram_username: username });
  }

  // mode === "login"
  const { data: existing, error: lookupErr } = await supabase
    .from("profiles")
    .select("id, email")
    .eq("telegram_id", telegramId)
    .maybeSingle();

  if (lookupErr) {
    console.error("[telegram-login] confirm lookup profiles:", lookupErr.message);
    return jsonResponse({ ok: false, error: "internal_error" }, 500);
  }

  let email: string;
  if (existing) {
    email = (existing as { email: string }).email;
    await supabase.from("profiles").update({ telegram_username: username }).eq("id", (existing as { id: string }).id);
  } else {
    email = `tg_${telegramId}@${TELEGRAM_EMAIL_DOMAIN}`;
    const randomPassword = crypto.randomUUID() + crypto.randomUUID();
    const { data: created, error: createErr } = await supabase.auth.admin.createUser({
      email,
      password: randomPassword,
      email_confirm: true,
      user_metadata: { signup_method: "telegram", telegram_id: telegramId, telegram_username: username, full_name: firstName },
    });
    if (createErr) {
      console.error("[telegram-login] confirm createUser:", createErr.message);
      await supabase.from("telegram_login_tokens").update({ confirmed: true, error: "internal_error" }).eq("token", token);
      return jsonResponse({ ok: false, error: "internal_error" }, 500);
    }
    await supabase
      .from("profiles")
      .update({ telegram_id: telegramId, telegram_username: username })
      .eq("id", created.user!.id);
  }

  const { data: linkData, error: linkGenErr } = await supabase.auth.admin.generateLink({ type: "magiclink", email });
  if (linkGenErr || !linkData?.properties?.email_otp) {
    console.error("[telegram-login] confirm generateLink:", linkGenErr?.message);
    await supabase.from("telegram_login_tokens").update({ confirmed: true, error: "internal_error" }).eq("token", token);
    return jsonResponse({ ok: false, error: "internal_error" }, 500);
  }

  await supabase
    .from("telegram_login_tokens")
    .update({
      confirmed: true,
      telegram_id: telegramId,
      telegram_username: username,
      result_email: email,
      result_otp: linkData.properties.email_otp,
    })
    .eq("token", token);

  return jsonResponse({ ok: true });
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return optionsResponse();
  if (req.method !== "POST") return jsonResponse({ ok: false, error: "method_not_allowed" }, 405);

  try {
    const supabase = admin();

    // "confirm" o'z tanasini XOM holda o'qishi kerak (imzo shu bayt ketma-
    // ketligi ustidan hisoblanadi), shuning uchun action'ni avval headerdan
    // emas, URL query'dan aniqlaymiz — tanani ikki marta o'qib bo'lmaydi.
    const url = new URL(req.url);
    const action = url.searchParams.get("action");

    if (action === "confirm") {
      return await handleConfirm(req, supabase);
    }

    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null;
    if (!body) return jsonResponse({ ok: false, error: "invalid_body" }, 400);

    if (action === "start") return await handleStart(req, supabase, body);
    if (action === "poll") return await handlePoll(supabase, body);

    return jsonResponse({ ok: false, error: "unknown_action" }, 400);
  } catch (err) {
    console.error("[telegram-login] unexpected:", err);
    return jsonResponse({ ok: false, error: "internal_error" }, 500);
  }
});
