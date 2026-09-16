/**
 * telegram-login — rasmiy Telegram Login Widget orqali PAROLSIZ kirish.
 *
 * OQIM:
 *  1. Foydalanuvchi saytdagi Telegram tugmasini bosadi.
 *  2. Telegram (o'zining serverida) foydalanuvchini tasdiqlaydi va brauzerga
 *     imzolangan ma'lumot qaytaradi: id, first_name, username, auth_date, hash.
 *  3. Frontend shu ma'lumotni SHU funksiyaga yuboradi.
 *  4. Funksiya `hash` ni bot tokeni bilan qayta hisoblab, Telegram
 *     tomonidan chindan yuborilganini tasdiqlaydi (soxtalashtirib bo'lmaydi —
 *     token faqat bizda va Telegram serverida bor).
 *  5. `telegram_id` bo'yicha mavjud hisob qidiriladi:
 *       - Bor bo'lsa — o'sha hisobga kiritiladi.
 *       - Yo'q bo'lsa — yangi hisob yaratiladi (sun'iy email, parolsiz).
 *  6. Sessiya PAROLSIZ beriladi: `admin.generateLink` bilan bir martalik OTP
 *     kod olinadi, frontend uni `supabase.auth.verifyOtp()` ga uzatib,
 *     haqiqiy sessiyaga almashtiradi. Kodning HECH BIR joyida parol yo'q.
 *
 * XAVFSIZLIK — nega qo'shimcha captcha/chastota cheklovi SHART EMAS:
 * so'rovni faqat Telegram'ning o'zi to'g'ri imzolab bera oladi (bot tokenini
 * bilmasdan `hash` ni soxtalashtirib bo'lmaydi). Ya'ni imzo tekshiruvining
 * o'zi asosiy himoya — `phone-signup` dagi kabi IP chastota cheklovi bu
 * yerda ortiqcha.
 *
 * verify_jwt = false: hali sessiyasi yo'q foydalanuvchi chaqiradi.
 *
 * IKKI REJIM (`mode` maydoni):
 *  - "login" (standart) — yuqoridagi oqim: hisobga kiradi yoki yangi ochadi.
 *  - "link" — foydalanuvchi ALLAQACHON kirgan (profil sahifasi): mavjud
 *    hisobga Telegram biriktiriladi, sessiya berilmaydi. Bu rejimda
 *    Authorization sarlavhasidagi token SHU YERDA tekshiriladi.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

/*
  CORS yordamchilari SHU FAYLGA JOYLASHTIRILGAN (nisbiy `../_shared/`
  import emas) — deploy vositasi papka tuzilishini boshqacha kutadi va
  `_shared` ga havolani topa olmaydi. Boshqa funksiyalar (masalan
  `phone-signup`) ham xuddi shu sababdan CORS'ni o'z ichida saqlaydi.
*/
const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
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

/**
 * Login Widget'ni tan olgan bot tokeni.
 *
 * ATAYLAB @Avtotestubot (ommaviy bot) tokeni ishlatiladi — u allaqachon
 * foydalanuvchilarga tanish va @BotFather'da domen sozlanadigan bot aynan
 * shu. Boshqa (admin) bot bilan aralashtirilmasin.
 *
 * Token Supabase Vault'da saqlanadi (`get_telegram_login_bot_token()` RPC),
 * environment secret sifatida EMAS — bu loyihada shu andoza allaqachon
 * `get_turnstile_secret_web()` uchun ishlatiladi.
 */
async function loadBotToken(supabase: ReturnType<typeof admin>): Promise<string | null> {
  const { data, error } = await supabase.rpc("get_telegram_login_bot_token");
  if (error) {
    console.error("[telegram-login] bot token RPC:", error.message);
    return null;
  }
  return typeof data === "string" && data.trim() ? data.trim() : null;
}

/** Bu vaqtdan eskirgan `auth_date` — takroriy yuborishning oldini oladi. */
const MAX_AUTH_AGE_SECONDS = 24 * 60 * 60;

/**
 * Sun'iy email domeni. `phone-signup` dagi kabi HAQIQIY, o'zga egalik
 * qiluvchi domen EMAS — bu o'z domenimizning subdomeni, hech qachon
 * mavjud bo'lmasa ham xavfsiz (hech kim tasodifan shu domenga ega
 * bo'lolmaydi, chunki u bizning DNS zonamiz ostida).
 */
const TELEGRAM_EMAIL_DOMAIN = "tg.avtotestu.uz";

const admin = () =>
  createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

/** Baytlarni kichik harfli hex satrga aylantiradi. */
function toHex(bytes: ArrayBuffer): string {
  return Array.from(new Uint8Array(bytes))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Telegram Login Widget imzosini tekshiradi.
 * Rasmiy algoritm: https://core.telegram.org/widgets/login#checking-authorization
 *
 *  1. secret_key = SHA256(bot_token)
 *  2. data_check_string = "hash" dan BOSHQA barcha maydonlar,
 *     "kalit=qiymat" ko'rinishida, kalit bo'yicha ALFAVIT tartibida,
 *     "\n" bilan qo'shilgan
 *  3. hisoblangan = HMAC_SHA256(data_check_string, secret_key) hex ko'rinishida
 *  4. hisoblangan === kelgan hash bo'lishi SHART
 */
async function verifyTelegramAuth(
  payload: Record<string, unknown>,
  botToken: string,
): Promise<boolean> {
  const { hash, ...rest } = payload;
  if (typeof hash !== "string" || !hash) return false;

  const dataCheckString = Object.keys(rest)
    .filter((k) => rest[k] !== undefined && rest[k] !== null)
    .sort()
    .map((k) => `${k}=${rest[k]}`)
    .join("\n");

  const enc = new TextEncoder();
  const secretKey = await crypto.subtle.digest("SHA-256", enc.encode(botToken));
  const hmacKey = await crypto.subtle.importKey(
    "raw",
    secretKey,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", hmacKey, enc.encode(dataCheckString));
  const computedHash = toHex(signature);

  // Vaqt-doimiy solishtirish (timing attack'dan himoya) — oddiy `===` emas.
  if (computedHash.length !== hash.length) return false;
  let diff = 0;
  for (let i = 0; i < computedHash.length; i++) {
    diff |= computedHash.charCodeAt(i) ^ hash.charCodeAt(i);
  }
  return diff === 0;
}

/**
 * Telegram maydonlarini so'rov tanasidan ajratib oladi.
 *
 * MUHIM: imzo (`hash`) Telegram yuborgan maydonlarning AYNAN o'zi ustidan
 * hisoblanadi. Agar biz qo'shgan xizmat maydoni (`mode`) shu ro'yxatga tushib
 * qolsa, data-check-string o'zgarib, imzo HAR DOIM noto'g'ri chiqadi.
 * Shuning uchun Telegram ma'lumoti alohida `auth` obyektida yuboriladi.
 */
function extractAuthPayload(body: Record<string, unknown>): Record<string, unknown> {
  const nested = body.auth;
  if (nested && typeof nested === "object" && !Array.isArray(nested)) {
    return nested as Record<string, unknown>;
  }
  // Frontend'ning eski nusxasi Telegram maydonlarini to'g'ridan-to'g'ri
  // tanaga qo'yardi — keshda qolgan bundle ishlayotgan bo'lsa ham sinmasin.
  const { mode: _mode, auth: _auth, ...rest } = body;
  return rest;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") return optionsResponse();
  if (req.method !== "POST") {
    return jsonResponse({ ok: false, error: "method_not_allowed" }, 405);
  }

  try {
    const supabase = admin();
    const botToken = await loadBotToken(supabase);
    if (!botToken) {
      console.error("[telegram-login] TELEGRAM_LOGIN_BOT_TOKEN Vault'da topilmadi");
      return jsonResponse({ ok: false, error: "not_configured" }, 500);
    }

    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return jsonResponse({ ok: false, error: "invalid_body" }, 400);
    }

    const mode = body.mode === "link" ? "link" : "login";
    const authPayload = extractAuthPayload(body);

    const telegramId = Number(authPayload.id);
    const authDate = Number(authPayload.auth_date);
    if (!Number.isFinite(telegramId) || telegramId <= 0) {
      return jsonResponse({ ok: false, error: "invalid_payload" }, 400);
    }
    if (!Number.isFinite(authDate)) {
      return jsonResponse({ ok: false, error: "invalid_payload" }, 400);
    }

    // Eskirgan (qayta yuborilgan) so'rovni rad etamiz.
    const ageSeconds = Date.now() / 1000 - authDate;
    if (ageSeconds > MAX_AUTH_AGE_SECONDS || ageSeconds < -60) {
      return jsonResponse({ ok: false, error: "auth_expired" }, 403);
    }

    const validSignature = await verifyTelegramAuth(authPayload, botToken);
    if (!validSignature) {
      console.warn(`[telegram-login] noto'g'ri imzo: id=${telegramId}`);
      return jsonResponse({ ok: false, error: "invalid_signature" }, 403);
    }

    const firstName = typeof authPayload.first_name === "string" ? authPayload.first_name : null;
    const username = typeof authPayload.username === "string" ? authPayload.username : null;

    /*
      BOG'LASH REJIMI — foydalanuvchi ALLAQACHON kirgan (profil sahifasidan).
      Yangi hisob yaratilmaydi va sessiya berilmaydi: faqat mavjud hisobga
      Telegram biriktiriladi.

      verify_jwt = false bo'lgani uchun tokenni SHU YERDA o'zimiz
      tekshiramiz — `getUser(token)` imzoni Supabase Auth'da tasdiqlaydi.
    */
    if (mode === "link") {
      const authHeader = req.headers.get("Authorization") ?? "";
      const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
      if (!token) {
        return jsonResponse({ ok: false, error: "not_authenticated" }, 401);
      }

      const { data: userData, error: userErr } = await supabase.auth.getUser(token);
      if (userErr || !userData?.user) {
        return jsonResponse({ ok: false, error: "not_authenticated" }, 401);
      }
      const userId = userData.user.id;

      const { data: owner, error: ownerErr } = await supabase
        .from("profiles")
        .select("id")
        .eq("telegram_id", telegramId)
        .maybeSingle();

      if (ownerErr) {
        console.error("[telegram-login] link lookup:", ownerErr.message);
        return jsonResponse({ ok: false, error: "internal_error" }, 500);
      }

      // Bir Telegram hisobi bitta profilga tegishli (unique indeks ham bor) —
      // boshqasiga biriktirishga urinish aniq xato bilan rad etiladi.
      if (owner && (owner as { id: string }).id !== userId) {
        return jsonResponse({ ok: false, error: "telegram_already_linked" }, 409);
      }

      const { error: bindErr } = await supabase
        .from("profiles")
        .update({ telegram_id: telegramId, telegram_username: username })
        .eq("id", userId);

      if (bindErr) {
        console.error("[telegram-login] bind:", bindErr.message);
        return jsonResponse({ ok: false, error: "internal_error" }, 500);
      }

      return jsonResponse({ ok: true, linked: true, telegram_username: username });
    }

    // 1) Bu Telegram hisobi allaqachon bog'langanmi?
    const { data: existing, error: lookupErr } = await supabase
      .from("profiles")
      .select("id, email")
      .eq("telegram_id", telegramId)
      .maybeSingle();

    if (lookupErr) {
      console.error("[telegram-login] lookup:", lookupErr.message);
      return jsonResponse({ ok: false, error: "internal_error" }, 500);
    }

    let email: string;

    if (existing) {
      // Mavjud hisob — qayta kiritamiz.
      email = (existing as { email: string }).email;

      // Telegram'da @username o'zgarishi mumkin — profildagi ko'rsatuv
      // ma'lumotini har kirishda yangilab turamiz (xato bo'lsa ham kirishga
      // to'sqinlik qilmaydi, bu shunchaki ko'rsatuv maydoni).
      const { error: refreshErr } = await supabase
        .from("profiles")
        .update({ telegram_username: username })
        .eq("id", (existing as { id: string }).id);
      if (refreshErr) {
        console.warn("[telegram-login] username yangilanmadi:", refreshErr.message);
      }
    } else {
      // Yangi hisob — sun'iy email, PAROLSIZ (tasodifiy, hech qachon
      // ishlatilmaydigan parol — Supabase Auth parol maydonini talab qiladi,
      // lekin kirish faqat OTP orqali bo'ladi, bu parol hech qachon
      // ko'rsatilmaydi va ishlatilmaydi).
      email = `tg_${telegramId}@${TELEGRAM_EMAIL_DOMAIN}`;
      const randomPassword = crypto.randomUUID() + crypto.randomUUID();

      const { data: created, error: createErr } = await supabase.auth.admin.createUser({
        email,
        password: randomPassword,
        email_confirm: true,
        user_metadata: {
          signup_method: "telegram",
          telegram_id: telegramId,
          telegram_username: username,
          full_name: firstName,
        },
      });

      if (createErr) {
        console.error("[telegram-login] createUser:", createErr.message);
        return jsonResponse({ ok: false, error: "internal_error" }, 500);
      }

      const { error: linkErr } = await supabase
        .from("profiles")
        .update({ telegram_id: telegramId, telegram_username: username })
        .eq("id", created.user!.id);

      if (linkErr) {
        console.error("[telegram-login] profiles link:", linkErr.message);
        return jsonResponse({ ok: false, error: "internal_error" }, 500);
      }
    }

    // 2) Parolsiz kirish uchun bir martalik kod (OTP) yaratamiz.
    const { data: linkData, error: linkGenErr } = await supabase.auth.admin.generateLink({
      type: "magiclink",
      email,
    });

    if (linkGenErr || !linkData?.properties?.email_otp) {
      console.error("[telegram-login] generateLink:", linkGenErr?.message);
      return jsonResponse({ ok: false, error: "internal_error" }, 500);
    }

    return jsonResponse({
      ok: true,
      email,
      otp: linkData.properties.email_otp,
    });
  } catch (err) {
    console.error("[telegram-login] unexpected:", err);
    return jsonResponse({ ok: false, error: "internal_error" }, 500);
  }
});
