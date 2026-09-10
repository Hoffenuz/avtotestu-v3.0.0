/**
 * Admin login + Cloudflare Turnstile.
 * Deploy: supabase functions deploy admin-auth
 * Secrets: TURNSTILE_SECRET_KEY (env yoki Vault), SUPABASE_SERVICE_ROLE_KEY, SUPABASE_ANON_KEY
 */
import { corsHeaders, jsonResponse, optionsResponse } from "../_shared/cors.ts";
import { createServiceClient } from "../_shared/auth.ts";
import { verifyTurnstileToken } from "../_shared/turnstile.ts";

type LoginBody = {
  email?: string;
  password?: string;
  turnstile_token?: string;
};

function getAnonKey(): string {
  return (
    Deno.env.get("SUPABASE_ANON_KEY") ??
    Deno.env.get("SUPABASE_PUBLISHABLE_KEY") ??
    ""
  );
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return optionsResponse();

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const body = (await req.json()) as LoginBody;
    const email = body.email?.trim().toLowerCase() ?? "";
    const password = body.password ?? "";

    await verifyTurnstileToken(body.turnstile_token, req, {
      action: "admin_login",
      email_attempt: email,
    });

    if (!email || !password) {
      return jsonResponse({ error: "Email va parol talab etiladi" }, 400);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const anonKey = getAnonKey();
    if (!supabaseUrl || !anonKey) {
      return jsonResponse({ error: "Server konfiguratsiyasi to'liq emas" }, 500);
    }

    const tokenRes = await fetch(
      `${supabaseUrl}/auth/v1/token?grant_type=password`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
        },
        body: JSON.stringify({ email, password }),
      }
    );

    const tokenPayload = await tokenRes.json().catch(() => ({}));
    if (!tokenRes.ok) {
      const msg =
        (tokenPayload as { error_description?: string }).error_description ??
        (tokenPayload as { message?: string }).message ??
        (tokenPayload as { msg?: string }).msg ??
        (tokenPayload as { error?: string }).error ??
        "Email yoki parol noto'g'ri";
      return jsonResponse({ error: msg }, 401);
    }

    const access_token = (tokenPayload as { access_token?: string }).access_token;
    const refresh_token = (tokenPayload as { refresh_token?: string }).refresh_token;
    const user = (tokenPayload as { user?: { id?: string } }).user;

    if (!access_token || !refresh_token || !user?.id) {
      return jsonResponse({ error: "Sessiya yaratilmadi" }, 500);
    }

    const service = createServiceClient();
    // has_role(..., 'admin') super_admin ni ham qabul qiladi
    const { data: hasAdmin, error: roleError } = await service.rpc("has_role", {
      _user_id: user.id,
      _role: "admin",
    });

    if (roleError || !hasAdmin) {
      return jsonResponse({ error: "Sizda admin huquqi yo'q" }, 403);
    }

    const { data: hasSuper } = await service.rpc("has_role", {
      _user_id: user.id,
      _role: "super_admin",
    });
    const adminRole = hasSuper ? "super_admin" : "admin";

    return jsonResponse({
      access_token,
      refresh_token,
      expires_in: (tokenPayload as { expires_in?: number }).expires_in,
      token_type: (tokenPayload as { token_type?: string }).token_type ?? "bearer",
      user: {
        id: user.id,
        email: (user as { email?: string }).email ?? email,
        role: adminRole,
      },
    });
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    const message = err instanceof Error ? err.message : "Server xatosi";
    return jsonResponse({ error: message }, status);
  }
});
