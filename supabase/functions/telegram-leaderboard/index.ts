/**
 * telegram-leaderboard — VPS'dagi bot bilan Supabase o'rtasidagi YAGONA ko'prik.
 *
 * NEGA SHUNDAY: kelishuvga ko'ra VPS'da HECH QANDAY Supabase kaliti
 * saqlanmaydi. Bot faqat shu funksiyaga murojaat qiladi.
 *
 * AUTENTIFIKATSIYA — yangi sir YARATILMAYDI:
 * bot so'rov tanasini o'zining BOT_TOKEN i bilan imzolaydi, funksiya esa
 * Vault'dagi o'sha tokenni olib imzoni qayta hisoblaydi. Kalit hosil qilish
 * telegram-login bilan bir xil: key = SHA256(bot_token).
 * Ya'ni token hech qayerga uzatilmaydi va yangi maxfiy qiymat almashilmaydi.
 *
 * AMALLAR:
 *   {"action":"submit","entries":[{telegram_id,name,username,correct,total}]}
 *   {"action":"top","limit":10}
 */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-bot-signature, x-bot-timestamp",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const admin = () =>
  createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
    auth: { autoRefreshToken: false, persistSession: false },
  });

function toHex(bytes: ArrayBuffer): string {
  return Array.from(new Uint8Array(bytes))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/** Bot imzosi eskirgan deb hisoblanadigan vaqt. */
const SIGNATURE_MAX_AGE_SECONDS = 300;

/**
 * Imzoni bot tokenidan hosil qilingan kalit bilan tekshiradi.
 *
 * Imzolanadigan matn: `${purpose}\n${timestamp}\n${rawBody}`.
 * `purpose` (endpoint nomi) SHART: `telegram-login` bilan bir xil kalit
 * ishlatilgani uchun, u bo'lmasa bir endpoint uchun imzolangan so'rovni
 * ikkinchisiga qayta yuborish mumkin edi. `timestamp` esa eski so'rovni
 * takrorlashdan himoya qiladi.
 */
async function verifyBotSignature(req: Request, rawBody: string, botToken: string): Promise<boolean> {
  const signature = (req.headers.get("X-Bot-Signature") ?? "").trim().toLowerCase();
  const timestamp = (req.headers.get("X-Bot-Timestamp") ?? "").trim();
  if (!signature || !timestamp) return false;

  const ts = Number(timestamp);
  if (!Number.isFinite(ts)) return false;
  if (Math.abs(Date.now() / 1000 - ts) > SIGNATURE_MAX_AGE_SECONDS) {
    console.warn("[telegram-leaderboard] imzo vaqti eskirgan");
    return false;
  }

  const enc = new TextEncoder();
  const secretKey = await crypto.subtle.digest("SHA-256", enc.encode(botToken));
  const hmacKey = await crypto.subtle.importKey(
    "raw",
    secretKey,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const computed = toHex(
    await crypto.subtle.sign("HMAC", hmacKey, enc.encode(`telegram-leaderboard\n${timestamp}\n${rawBody}`)),
  );

  // Vaqt-doimiy solishtirish.
  if (computed.length !== signature.length) return false;
  let diff = 0;
  for (let i = 0; i < computed.length; i++) {
    diff |= computed.charCodeAt(i) ^ signature.charCodeAt(i);
  }
  return diff === 0;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 204, headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return jsonResponse({ ok: false, error: "method_not_allowed" }, 405);
  }

  try {
    const supabase = admin();

    const { data: tokenData, error: tokenErr } = await supabase.rpc("get_telegram_login_bot_token");
    const botToken = typeof tokenData === "string" ? tokenData.trim() : "";
    if (tokenErr || !botToken) {
      console.error("[telegram-leaderboard] bot token:", tokenErr?.message);
      return jsonResponse({ ok: false, error: "not_configured" }, 500);
    }

    // Imzo XOM tana ustidan hisoblanadi — JSON qayta seriyalanganda
    // maydonlar tartibi o'zgarib, imzo buzilmasligi uchun.
    const rawBody = await req.text();

    if (!(await verifyBotSignature(req, rawBody, botToken))) {
      console.warn("[telegram-leaderboard] noto'g'ri imzo");
      return jsonResponse({ ok: false, error: "invalid_signature" }, 403);
    }

    let body: Record<string, unknown>;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return jsonResponse({ ok: false, error: "invalid_body" }, 400);
    }

    if (body.action === "submit") {
      const entries = Array.isArray(body.entries) ? body.entries : [];
      if (entries.length === 0) {
        return jsonResponse({ ok: true, saved: 0 });
      }
      const { data, error } = await supabase.rpc("record_telegram_results", { p_entries: entries });
      if (error) {
        console.error("[telegram-leaderboard] submit:", error.message);
        return jsonResponse({ ok: false, error: "internal_error" }, 500);
      }
      return jsonResponse({ ok: true, saved: data ?? 0 });
    }

    if (body.action === "top") {
      const rawLimit = Number(body.limit);
      const limit = Number.isFinite(rawLimit) ? Math.min(Math.max(Math.trunc(rawLimit), 1), 50) : 10;

      const { data, error } = await supabase
        .from("telegram_leaderboard")
        .select("telegram_id, display_name, telegram_username, tests_completed, total_correct, total_questions, best_correct")
        .order("total_correct", { ascending: false })
        .order("tests_completed", { ascending: false })
        .limit(limit);

      if (error) {
        console.error("[telegram-leaderboard] top:", error.message);
        return jsonResponse({ ok: false, error: "internal_error" }, 500);
      }
      return jsonResponse({ ok: true, top: data ?? [] });
    }

    return jsonResponse({ ok: false, error: "unknown_action" }, 400);
  } catch (err) {
    console.error("[telegram-leaderboard] unexpected:", err);
    return jsonResponse({ ok: false, error: "internal_error" }, 500);
  }
});
