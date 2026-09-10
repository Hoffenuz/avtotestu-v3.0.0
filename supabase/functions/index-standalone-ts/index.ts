/**
 * Avtotestu.uz (lvdndseuobzbgzrarygu) — Dashboard ga nusxalash uchun bitta fayl.
 * Deploy: Edge Functions → Create → name: admin-auth → Verify JWT: OFF
 *
 * ESLATMA: bu funksiya slug'i "index-standalone-ts" ostida deploy qilingan,
 * lekin mazmuni admin-auth bilan bir xil (eski, monolit nusxa — _shared/
 * fayllarga bo'linishidan oldingi versiya). Ehtimol, dashboard orqali qo'lda
 * joylashtirilganda avtomatik nom berilib, keyin "admin-auth" ga rename
 * qilishning o'rniga alohida funksiya sifatida qolib ketgan.
 * O'chirish nomzodi — Supabase dashboard orqali qo'lda (MCP orqali funksiya
 * o'chirish imkoni yo'q).
 */
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders: Record<string, string> = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
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

function createServiceClient() {
  const url = Deno.env.get("SUPABASE_URL");
  const key = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  if (!url || !key) {
    throw Object.assign(new Error("SUPABASE_SERVICE_ROLE_KEY sozlanmagan"), { status: 500 });
  }
  return createClient(url, key, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function getAnonKey(): string {
  return (
    Deno.env.get("SUPABASE_ANON_KEY") ??
    Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ??
    ""
  );
}

async function verifyTurnstileToken(
  token: string | undefined | null,
  req: Request,
  email: string
): Promise<void> {
  const secret = Deno.env.get("TURNSTILE_SECRET_KEY");
  if (!secret) {
    throw Object.assign(new Error("TURNSTILE_SECRET_KEY sozlanmagan"), { status: 500 });
  }
  if (!token?.trim()) {
    throw Object.assign(new Error("Turnstile tasdiqlanmadi"), { status: 400 });
  }

  const form = new FormData();
  form.append("secret", secret);
  form.append("response", token.trim());
  const ip =
    req.headers.get("cf-connecting-ip") ??
    req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (ip) form.append("remoteip", ip);

  const res = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    { method: "POST", body: form }
  );
  const data = await res.json();

  try {
    const service = createServiceClient();
    await service.from("admin_turnstile_verifications").insert({
      success: !!data.success,
      action: "admin_login",
      error_codes: data["error-codes"] ?? null,
      hostname: data.hostname ?? null,
      challenge_ts: data.challenge_ts ?? null,
      remote_ip: ip ?? null,
      email_attempt: email || null,
    });
  } catch (e) {
    console.error("turnstile log:", e);
  }

  if (!data.success) {
    throw Object.assign(new Error("Robot tekshiruvi muvaffaqiyatsiz"), { status: 403 });
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return optionsResponse();
  if (req.method !== "POST") return jsonResponse({ error: "Method not allowed" }, 405);

  try {
    const body = await req.json();
    const email = (body.email ?? "").trim().toLowerCase();
    const password = body.password ?? "";

    await verifyTurnstileToken(body.turnstile_token, req, email);

    if (!email || !password) {
      return jsonResponse({ error: "Email va parol talab etiladi" }, 400);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = getAnonKey();
    if (!supabaseUrl || !anonKey) {
      return jsonResponse({ error: "Server konfiguratsiyasi to'liq emas" }, 500);
    }

    const tokenRes = await fetch(`${supabaseUrl}/auth/v1/token?grant_type=password`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: anonKey,
        Authorization: `Bearer ${anonKey}`,
      },
      body: JSON.stringify({ email, password }),
    });

    const tokenPayload = await tokenRes.json().catch(() => ({}));
    if (!tokenRes.ok) {
      const msg =
        tokenPayload.error_description ??
        tokenPayload.msg ??
        tokenPayload.error ??
        "Email yoki parol noto'g'ri";
      return jsonResponse({ error: msg }, 401);
    }

    const { access_token, refresh_token, user, expires_in, token_type } = tokenPayload;
    if (!access_token || !refresh_token || !user?.id) {
      return jsonResponse({ error: "Sessiya yaratilmadi" }, 500);
    }

    const service = createServiceClient();
    const { data: isAdmin, error: roleError } = await service.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });

    if (roleError || !isAdmin) {
      return jsonResponse({ error: "Sizda admin huquqi yo'q" }, 403);
    }

    return jsonResponse({
      access_token,
      refresh_token,
      expires_in,
      token_type: token_type ?? "bearer",
      user: { id: user.id, email: user.email ?? email },
    });
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    const message = err instanceof Error ? err.message : "Server xatosi";
    return jsonResponse({ error: message }, status);
  }
});
