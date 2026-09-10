/**
 * Generic Cloudflare Turnstile verification endpoint.
 * POST body: { token: string, action?: string, email_attempt?: string }
 * Response:  { success: true, hostname?, challenge_ts? } | { success: false, error }
 *
 * Kalit `action` bo'yicha tanlanadi (_shared/turnstile.ts):
 *   admin* → admin paneli widget'i, qolgan → asosiy sayt widget'i.
 */
import { jsonResponse, optionsResponse } from "../_shared/cors.ts";
import { verifyTurnstileToken } from "../_shared/turnstile.ts";

type Body = {
  token?: string;
  action?: string;
  email_attempt?: string;
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return optionsResponse();

  if (req.method !== "POST") {
    return jsonResponse({ error: "Method not allowed" }, 405);
  }

  try {
    const body = (await req.json().catch(() => ({}))) as Body;
    const action = body.action?.trim() || "generic";

    const result = await verifyTurnstileToken(body.token, req, {
      action,
      email_attempt: body.email_attempt,
    });

    return jsonResponse({
      success: true,
      hostname: result.hostname,
      challenge_ts: result.challenge_ts,
    });
  } catch (err) {
    const status = (err as { status?: number }).status ?? 500;
    const message = err instanceof Error ? err.message : "Server xatosi";
    return jsonResponse({ success: false, error: message }, status);
  }
});
