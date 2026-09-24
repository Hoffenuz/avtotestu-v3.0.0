/** Cloudflare Turnstile — server-side tekshiruv + DB log */

import { createServiceClient } from "./auth.ts";

export type TurnstileVerifyResult = {
  success: boolean;
  "error-codes"?: string[];
  challenge_ts?: string;
  hostname?: string;
};

export type TurnstileLogContext = {
  action?: string;
  email_attempt?: string;
};

function getRemoteIp(req?: Request): string | null {
  const forwarded = req?.headers.get("x-forwarded-for");
  const cfIp = req?.headers.get("cf-connecting-ip");
  return cfIp ?? forwarded?.split(",")[0]?.trim() ?? null;
}

/**
 * Admin paneli (admin.avtotestu.uz) va asosiy sayt (www.avtotestu.uz) —
 * ALOHIDA Turnstile widget'lari, ya'ni alohida kalit juftliklari.
 *
 * Site key va secret AYNAN bitta widget'dan bo'lishi shart; aralashtirilsa
 * Cloudflare "invalid-input-response" qaytaradi va tekshiruv hech qachon
 * o'tmaydi. Shuning uchun kalit `action` bo'yicha tanlanadi:
 *   admin* → TURNSTILE_SECRET_KEY      (eski, admin paneli)
 *   qolgan → TURNSTILE_SECRET_KEY_WEB  (asosiy sayt: ro'yxatdan o'tish)
 */
async function resolveTurnstileSecret(action: string): Promise<string | undefined> {
  const isAdmin = action.startsWith("admin");
  const envName = isAdmin ? "TURNSTILE_SECRET_KEY" : "TURNSTILE_SECRET_KEY_WEB";
  const rpcName = isAdmin ? "get_turnstile_secret" : "get_turnstile_secret_web";

  const fromEnv = Deno.env.get(envName)?.trim();
  if (fromEnv) return fromEnv;

  try {
    const service = createServiceClient();
    const { data, error } = await service.rpc(rpcName);
    if (error) {
      console.error(`${rpcName} rpc:`, error.message);
      return undefined;
    }
    if (typeof data === "string" && data.trim()) return data.trim();
  } catch (e) {
    console.error(`${rpcName} failed:`, e);
  }
  return undefined;
}

async function logTurnstileVerification(
  entry: {
    success: boolean;
    action: string;
    error_codes?: string[];
    hostname?: string;
    challenge_ts?: string;
    remote_ip?: string | null;
    email_attempt?: string;
  }
): Promise<void> {
  try {
    const service = createServiceClient();
    const { error } = await service.from("admin_turnstile_verifications").insert({
      success: entry.success,
      action: entry.action,
      error_codes: entry.error_codes?.length ? entry.error_codes : null,
      hostname: entry.hostname ?? null,
      challenge_ts: entry.challenge_ts ?? null,
      remote_ip: entry.remote_ip ?? null,
      email_attempt: entry.email_attempt ?? null,
    });
    if (error) {
      console.error("admin_turnstile_verifications insert:", error.message);
    }
  } catch (e) {
    console.error("admin_turnstile_verifications log failed:", e);
  }
}

export async function verifyTurnstileToken(
  token: string | undefined | null,
  req?: Request,
  logContext?: TurnstileLogContext
): Promise<TurnstileVerifyResult> {
  const action = logContext?.action ?? "admin_login";
  const emailAttempt = logContext?.email_attempt?.trim().toLowerCase();
  const remoteIp = getRemoteIp(req);

  const secret = await resolveTurnstileSecret(action);
  const skip =
    Deno.env.get("TURNSTILE_SKIP_VERIFY") === "true" &&
    Deno.env.get("ENVIRONMENT") !== "production";

  if (skip) {
    return { success: true, hostname: "skipped" };
  }

  if (!secret) {
    throw Object.assign(
      new Error("Turnstile maxfiy kaliti sozlanmagan (Edge Secrets yoki Vault)"),
      { status: 500 }
    );
  }

  if (!token || typeof token !== "string" || !token.trim()) {
    await logTurnstileVerification({
      success: false,
      action,
      error_codes: ["missing-input-response"],
      remote_ip: remoteIp,
      email_attempt: emailAttempt,
    });
    throw Object.assign(new Error("Turnstile tasdiqlanmadi. Qayta urinib ko'ring."), {
      status: 400,
    });
  }

  const form = new FormData();
  form.append("secret", secret);
  form.append("response", token.trim());
  if (remoteIp) form.append("remoteip", remoteIp);

  const res = await fetch(
    "https://challenges.cloudflare.com/turnstile/v0/siteverify",
    { method: "POST", body: form }
  );

  const data = (await res.json()) as TurnstileVerifyResult;

  await logTurnstileVerification({
    success: !!data.success,
    action,
    error_codes: data["error-codes"],
    hostname: data.hostname,
    challenge_ts: data.challenge_ts,
    remote_ip: remoteIp,
    email_attempt: emailAttempt,
  });

  if (!data.success) {
    const codes = data["error-codes"]?.join(", ") ?? "unknown";
    throw Object.assign(
      new Error(`Robot tekshiruvi muvaffaqiyatsiz (${codes})`),
      { status: 403 }
    );
  }

  return data;
}
