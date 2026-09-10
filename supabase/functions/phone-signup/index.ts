/**
 * phone-signup — telefon raqam orqali hisob yaratish.
 *
 * Nima uchun Edge Function (klientdagi supabase.auth.signUp emas):
 *  1. `@pro.com` HAQIQIY domen. Klient signUp ishlatilsa Supabase o'sha manzilga
 *     tasdiqlash xati yuborishga urinadi — begona domenga spam ketadi.
 *     Bu yerda hisob admin API bilan `email_confirm: true` qilib yaratiladi,
 *     ya'ni xat umuman yuborilmaydi.
 *  2. Raqam formati va suiiste'molga qarshi cheklovlar SERVERDA tekshiriladi.
 *
 * Bot himoyasi ikki xil:
 *  - Sayt Turnstile tokenini yuboradi → token serverda tekshiriladi.
 *  - Mobil ilova token yubormaydi (WebView captcha interfeysni qotirar va
 *    foydalanuvchiga keraksiz "men robot emasman" oynasini ko'rsatardi) →
 *    o'rniga IP bo'yicha chastota cheklovi qo'llanadi. Ikkala holatda ham
 *    cheklov ishlaydi, ya'ni tokensiz yo'l ochiq qolmaydi.
 *
 * verify_jwt = false: ro'yxatdan o'tayotgan odamda hali sessiya yo'q.
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const PHONE_EMAIL_DOMAIN = "pro.com";
const UZ_CODE = "998";
const LOCAL_DIGITS = 9;
const MIN_PASSWORD = 8;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });

const admin = () =>
  createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

/** "901234567" | "998901234567" | "+998 90 123 45 67" → "998901234567" */
function normalizeUzPhone(input: unknown): string | null {
  if (typeof input !== "string") return null;
  const digits = input.replace(/\D/g, "");
  if (!digits) return null;

  let local: string;
  if (digits.length === LOCAL_DIGITS) {
    local = digits;
  } else if (digits.length === UZ_CODE.length + LOCAL_DIGITS && digits.startsWith(UZ_CODE)) {
    local = digits.slice(UZ_CODE.length);
  } else {
    return null;
  }
  if (/^[01]/.test(local)) return null;
  return UZ_CODE + local;
}

function clientIp(req: Request): string | null {
  const ip = req.headers.get("cf-connecting-ip") ??
    req.headers.get("x-real-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return ip && ip.length > 0 ? ip : null;
}

/** IP manzilning o'zi saqlanmaydi — faqat xeshi. */
async function hashIp(ip: string): Promise<string> {
  const bytes = new TextEncoder().encode(`phone-signup:${ip}`);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Token kelgan bo'lsa tekshiradi. Token YO'Q bo'lsa — bu mobil ilova,
 * captcha ko'rsatolmaydi; null qaytariladi va himoyani chastota cheklovi
 * o'z zimmasiga oladi.
 */
async function verifyTurnstile(token: unknown, req: Request): Promise<string | null> {
  if (typeof token !== "string" || !token.trim()) return null;

  const secret = Deno.env.get("TURNSTILE_SECRET_KEY_WEB")?.trim() ??
    (await (async () => {
      const { data } = await admin().rpc("get_turnstile_secret_web");
      return typeof data === "string" ? data.trim() : undefined;
    })());

  if (!secret) {
    console.warn("[phone-signup] Turnstile kaliti yo'q — tekshiruvsiz davom etildi");
    return null;
  }

  const ip = clientIp(req);
  const form = new FormData();
  form.append("secret", secret);
  form.append("response", token.trim());
  if (ip) form.append("remoteip", ip);

  const res = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    { method: "POST", body: form },
  );
  const data = await res.json() as { success?: boolean; "error-codes"?: string[] };

  if (!data.success) {
    console.warn("[phone-signup] turnstile fail:", data["error-codes"]);
    return "Tekshiruv o'tmadi. Sahifani yangilab, qayta urinib ko'ring.";
  }
  return null;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return json({ ok: false, error: "method_not_allowed" }, 405);
  }

  try {
    let body: Record<string, unknown>;
    try {
      body = await req.json();
    } catch {
      return json({ ok: false, error: "invalid_body" }, 400);
    }

    const phone = normalizeUzPhone(body.phone);
    if (!phone) {
      return json({
        ok: false,
        error: "invalid_phone",
        message: "Telefon raqam noto'g'ri. Namuna: 90 123 45 67",
      }, 400);
    }

    const password = typeof body.password === "string" ? body.password : "";
    if (password.length < MIN_PASSWORD) {
      return json({
        ok: false,
        error: "weak_password",
        message: `Parol kamida ${MIN_PASSWORD} ta belgidan iborat bo'lishi kerak.`,
      }, 400);
    }

    // Token bo'lsa — tekshiriladi (sayt). Bo'lmasa — o'tkazib yuboriladi (ilova).
    const turnstileError = await verifyTurnstile(body.turnstileToken, req);
    if (turnstileError) {
      return json({ ok: false, error: "turnstile_failed", message: turnstileError }, 403);
    }

    const supabase = admin();

    // Chastota cheklovi: kirish ma'lumotlari to'g'ri bo'lgandan keyin, ya'ni
    // xato yozilgan raqam foydalanuvchining limitini yeb qo'ymaydi.
    const ip = clientIp(req);
    if (ip) {
      const { data: limit, error: limitErr } = await supabase.rpc(
        "register_signup_attempt",
        { p_ip_hash: await hashIp(ip) },
      );
      if (limitErr) {
        console.error("[phone-signup] rate limit rpc:", limitErr.message);
      } else if (limit && limit.ok === false) {
        console.warn(`[phone-signup] rate limited ${ip}`);
        return json({
          ok: false,
          error: "rate_limited",
          message:
            "Juda ko'p urinish bo'ldi. Bir ozdan so'ng qayta urinib ko'ring.",
          retry_after_seconds: limit.retry_after_seconds ?? 3600,
        }, 429);
      }
    }

    const email = `${phone}@${PHONE_EMAIL_DOMAIN}`;

    // Bu raqam allaqachon ro'yxatdan o'tganmi?
    const { data: existing, error: lookupErr } = await supabase
      .from("profiles")
      .select("id")
      .eq("email", email)
      .maybeSingle();

    if (lookupErr) {
      console.error("[phone-signup] lookup:", lookupErr.message);
      return json({ ok: false, error: "internal_error" }, 500);
    }
    if (existing) {
      return json({
        ok: false,
        error: "phone_taken",
        message: "Bu raqam allaqachon ro'yxatdan o'tgan. \"Kirish\" bo'limidan foydalaning.",
      }, 409);
    }

    // `email_confirm: true` — @pro.com ga tasdiqlash xati YUBORILMAYDI
    const { data: created, error: createErr } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { signup_method: "phone", phone_number: phone },
    });

    if (createErr) {
      const msg = createErr.message ?? "";
      if (/already been registered|already registered/i.test(msg)) {
        return json({
          ok: false,
          error: "phone_taken",
          message: "Bu raqam allaqachon ro'yxatdan o'tgan. \"Kirish\" bo'limidan foydalaning.",
        }, 409);
      }
      console.error("[phone-signup] createUser:", msg);
      return json({ ok: false, error: "internal_error", message: "Hisob yaratib bo'lmadi." }, 500);
    }

    console.log(`[phone-signup] created ${created.user?.id} for ${phone}`);
    return json({ ok: true, email });
  } catch (err) {
    console.error("[phone-signup] unexpected:", err);
    return json({ ok: false, error: "internal_error" }, 500);
  }
});
