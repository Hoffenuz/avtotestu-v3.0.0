// ============================================================================
// generate-license — Offline desktop ilova uchun imzolangan litsenziya kaliti
// ----------------------------------------------------------------------------
// Xavfsizlik: JWT tekshiruvi + get_user_access_state + save_device_license RPC.
// 1 user = 1 qurilma. Obuna yangilanganda kalit refresh qilinadi.
// ============================================================================

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import * as ed from "https://esm.sh/@noble/ed25519@2";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const LICENSE_PRIVATE_KEY = Deno.env.get("LICENSE_PRIVATE_KEY") ?? "";

const TOKEN_PREFIX = "AVT2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type LicenseRow = {
  license_key: string;
  short_code: string;
  device_id: string;
  issued_at: string;
  expires_at: string;
  revoked?: boolean;
};

type SaveResult = {
  action: string;
  device_id: string;
  license_key: string;
  short_code: string;
  issued_at: string;
  expires_at: string;
  can_refresh?: boolean;
};

function base64UrlEncode(bytes: Uint8Array): string {
  let bin = "";
  for (const b of bytes) bin += String.fromCharCode(b);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function utf8(s: string): Uint8Array {
  return new TextEncoder().encode(s);
}

function hexToBytes(hex: string): Uint8Array {
  const clean = hex.trim();
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i += 1) {
    out[i] = parseInt(clean.substr(i * 2, 2), 16);
  }
  return out;
}

async function sha256Hex(message: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", utf8(message));
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function normalizeDeviceId(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const trimmed = raw.trim();
  if (trimmed.length < 4 || trimmed.length > 64) return null;
  if (!/^[A-Za-z0-9_-]+$/.test(trimmed)) return null;
  return trimmed;
}

async function buildSignedToken(
  deviceId: string,
  userId: string,
  issuedAtSec: number,
  expiresAtSec: number,
): Promise<string> {
  const payload = {
    v: 2,
    d: deviceId,
    uid: userId.slice(0, 8),
    iat: issuedAtSec,
    exp: expiresAtSec,
  };
  const payloadB64 = base64UrlEncode(utf8(JSON.stringify(payload)));
  const message = `${TOKEN_PREFIX}.${payloadB64}`;
  const priv = hexToBytes(LICENSE_PRIVATE_KEY);
  const sig = await ed.signAsync(utf8(message), priv);
  return `${message}.${base64UrlEncode(sig)}`;
}

async function buildShortCode(deviceId: string): Promise<string> {
  const hex = await sha256Hex(`avtotestlar:${deviceId}`);
  const raw = hex.slice(0, 16).toUpperCase();
  return raw.match(/.{1,4}/g)?.join("-") ?? raw;
}

function licensePayload(
  row: LicenseRow,
  opts: { locked?: boolean; refreshed?: boolean; can_refresh?: boolean; state?: string },
) {
  const expiresAtMs = new Date(row.expires_at).getTime();
  const remainingDays = Math.max(
    0,
    Math.ceil((expiresAtMs - Date.now()) / 86_400_000),
  );
  return {
    ok: true,
    license_key: row.license_key,
    short_code: row.short_code,
    device_id: row.device_id,
    issued_at: row.issued_at,
    expires_at: row.expires_at,
    remaining_days: remainingDays,
    locked: opts.locked ?? false,
    refreshed: opts.refreshed ?? false,
    can_refresh: opts.can_refresh ?? false,
    state: opts.state,
  };
}

function mapRpcError(message: string): { error: string; message?: string; status: number } {
  const m = message.toLowerCase();
  if (m.includes("no_active_subscription")) {
    return {
      error: "no_active_subscription",
      message: "Faol obuna (PRO) topilmadi. Avval to'lovni amalga oshiring.",
      status: 403,
    };
  }
  if (m.includes("subscription_expired")) {
    return { error: "subscription_expired", status: 403 };
  }
  if (m.includes("license_already_issued")) {
    return {
      error: "license_already_issued",
      message:
        "Sizda allaqachon litsenziya mavjud. Boshqa qurilmaga kalit olish mumkin emas.",
      status: 403,
    };
  }
  if (m.includes("refresh_required")) {
    return {
      error: "refresh_required",
      message: "Obuna yangilangan. Kalitni yangilash tugmasini bosing.",
      status: 409,
    };
  }
  if (m.includes("refresh_not_needed")) {
    return {
      error: "refresh_not_needed",
      message: "Kalitingiz hali amal qiladi. Yangilash shart emas.",
      status: 409,
    };
  }
  if (m.includes("no_license_to_refresh")) {
    return {
      error: "no_license_to_refresh",
      message: "Avval litsenziya oling, keyin yangilang.",
      status: 404,
    };
  }
  if (m.includes("device_mismatch")) {
    return {
      error: "device_mismatch",
      message: "Qurilma ID mavjud litsenziya bilan mos kelmaydi.",
      status: 403,
    };
  }
  if (m.includes("license_revoked")) {
    return { error: "license_revoked", message: "Litsenziya bekor qilingan.", status: 403 };
  }
  if (m.includes("refresh_rate_limited")) {
    return {
      error: "refresh_rate_limited",
      message: "Juda tez urinildi. Bir daqiqadan keyin qayta urinib ko'ring.",
      status: 429,
    };
  }
  if (m.includes("invalid_device_id")) {
    return { error: "invalid_device_id", status: 400 };
  }
  if (m.includes("invalid_license_expiry")) {
    return { error: "internal_error", status: 500 };
  }
  return { error: "internal_error", status: 500 };
}

function computeCanRefresh(
  existing: LicenseRow,
  subscriptionExpiresMs: number,
): boolean {
  const licenseExpiresMs = new Date(existing.expires_at).getTime();
  return (
    !existing.revoked &&
    (licenseExpiresMs <= Date.now() ||
      subscriptionExpiresMs > licenseExpiresMs + 60_000)
  );
}

async function fetchAccess(admin: ReturnType<typeof createClient>, userId: string) {
  const { data: accessRows, error: accessErr } = await admin.rpc(
    "get_user_access_state",
    { user_id: userId },
  );
  if (accessErr) throw new Error(`access_check_failed:${accessErr.message}`);

  const access = Array.isArray(accessRows) ? accessRows[0] : accessRows;
  const state: string = access?.state ?? "free_logged_in";
  const isPremium: boolean = !!access?.is_premium;
  const expiresAtIso: string | null = access?.expires_at ?? null;
  return { state, isPremium, expiresAtIso };
}

async function persistLicense(
  admin: ReturnType<typeof createClient>,
  userId: string,
  deviceId: string,
  licenseKey: string,
  shortCode: string,
  issuedAtIso: string,
  expiresAtIso: string,
  mode: "issue" | "refresh",
): Promise<SaveResult> {
  const { data, error } = await admin.rpc("save_device_license", {
    p_user_id: userId,
    p_device_id: deviceId,
    p_license_key: licenseKey,
    p_short_code: shortCode,
    p_issued_at: issuedAtIso,
    p_expires_at: expiresAtIso,
    p_mode: mode,
  });

  if (error) {
    throw new Error(error.message);
  }

  return data as SaveResult;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  try {
    if (req.method !== "POST") {
      return json({ ok: false, error: "method_not_allowed" }, 405);
    }

    if (!LICENSE_PRIVATE_KEY || LICENSE_PRIVATE_KEY.length < 64) {
      console.error("[generate-license] LICENSE_PRIVATE_KEY secret o'rnatilmagan");
      return json({ ok: false, error: "signing_not_configured" }, 500);
    }

    const authHeader = req.headers.get("Authorization") ?? "";
    const token = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (!token) {
      return json({ ok: false, error: "not_authenticated" }, 401);
    }

    const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    const { data: userData, error: userErr } = await admin.auth.getUser(token);
    if (userErr || !userData?.user) {
      return json({ ok: false, error: "invalid_token" }, 401);
    }
    const user = userData.user;

    let body: Record<string, unknown> = {};
    try {
      body = await req.json();
    } catch {
      return json({ ok: false, error: "invalid_body" }, 400);
    }

    const action = body.action === "refresh" ? "refresh" : "issue";
    const deviceIdInput = normalizeDeviceId(body.device_id);

    const { data: existing, error: existingErr } = await admin
      .from("device_licenses")
      .select("license_key, short_code, device_id, issued_at, expires_at, revoked")
      .eq("user_id", user.id)
      .maybeSingle();

    if (existingErr) {
      console.error("[generate-license] existing lookup:", existingErr.message);
      return json({ ok: false, error: "internal_error" }, 500);
    }

    let access;
    try {
      access = await fetchAccess(admin, user.id);
    } catch (err) {
      console.error("[generate-license] access:", err);
      return json({ ok: false, error: "access_check_failed" }, 500);
    }

    const { state, isPremium, expiresAtIso } = access;

    if (action === "refresh") {
      if (!existing) {
        return json({
          ok: false,
          error: "no_license_to_refresh",
          message: "Avval litsenziya oling, keyin yangilang.",
        }, 404);
      }

      const deviceId = deviceIdInput ?? existing.device_id;
      if (deviceId !== existing.device_id) {
        return json({
          ok: false,
          error: "device_mismatch",
          message: "Qurilma ID mavjud litsenziya bilan mos kelmaydi.",
        }, 403);
      }

      if (!isPremium || !expiresAtIso) {
        return json({
          ok: false,
          error: "no_active_subscription",
          state,
          message: "Faol obuna (PRO) topilmadi. Avval to'lovni amalga oshiring.",
        }, 403);
      }

      const expiresAtMs = new Date(expiresAtIso).getTime();
      if (Number.isNaN(expiresAtMs) || expiresAtMs <= Date.now()) {
        return json({ ok: false, error: "subscription_expired", state }, 403);
      }

      const nowMs = Date.now();
      const issuedAtSec = Math.floor(nowMs / 1000);
      const expiresAtSec = Math.floor(expiresAtMs / 1000);
      const licenseKey = await buildSignedToken(
        deviceId,
        user.id,
        issuedAtSec,
        expiresAtSec,
      );
      const shortCode = await buildShortCode(deviceId);
      const issuedAtIso = new Date(nowMs).toISOString();
      const licenseExpiresIso = new Date(expiresAtMs).toISOString();

      try {
        const saved = await persistLicense(
          admin,
          user.id,
          deviceId,
          licenseKey,
          shortCode,
          issuedAtIso,
          licenseExpiresIso,
          "refresh",
        );
        return json(
          licensePayload(saved, {
            locked: true,
            refreshed: true,
            can_refresh: false,
            state,
          }),
        );
      } catch (err) {
        const mapped = mapRpcError(String(err));
        return json({ ok: false, error: mapped.error, message: mapped.message, state }, mapped.status);
      }
    }

    // issue
    if (!deviceIdInput) {
      return json({ ok: false, error: "invalid_device_id" }, 400);
    }

    if (existing) {
      if (existing.device_id !== deviceIdInput) {
        return json({
          ok: false,
          error: "license_already_issued",
          message:
            "Sizda allaqachon litsenziya mavjud. Boshqa qurilmaga kalit olish mumkin emas.",
          device_id: existing.device_id,
        }, 403);
      }

      if (!isPremium || !expiresAtIso) {
        return json({
          ok: false,
          error: "no_active_subscription",
          state,
          message: "Faol obuna (PRO) topilmadi. Avval to'lovni amalga oshiring.",
        }, 403);
      }

      const subExpiresMs = new Date(expiresAtIso).getTime();
      const canRefresh = computeCanRefresh(existing, subExpiresMs);

      if (!canRefresh) {
        return json(
          licensePayload(existing, {
            locked: true,
            can_refresh: false,
            state,
          }),
        );
      }

      return json({
        ok: false,
        error: "refresh_required",
        message: "Obuna yangilangan yoki kalit muddati tugagan. Kalitni yangilash tugmasini bosing.",
        can_refresh: true,
        state,
      }, 409);
    }

    if (!isPremium || !expiresAtIso) {
      return json({
        ok: false,
        error: "no_active_subscription",
        state,
        message: "Faol obuna (PRO) topilmadi. Avval to'lovni amalga oshiring.",
      }, 403);
    }

    const expiresAtMs = new Date(expiresAtIso).getTime();
    const nowMs = Date.now();
    if (Number.isNaN(expiresAtMs) || expiresAtMs <= nowMs) {
      return json({ ok: false, error: "subscription_expired", state }, 403);
    }

    const issuedAtSec = Math.floor(nowMs / 1000);
    const expiresAtSec = Math.floor(expiresAtMs / 1000);
    const licenseKey = await buildSignedToken(
      deviceIdInput,
      user.id,
      issuedAtSec,
      expiresAtSec,
    );
    const shortCode = await buildShortCode(deviceIdInput);
    const issuedAtIso = new Date(nowMs).toISOString();
    const licenseExpiresIso = new Date(expiresAtMs).toISOString();

    try {
      const saved = await persistLicense(
        admin,
        user.id,
        deviceIdInput,
        licenseKey,
        shortCode,
        issuedAtIso,
        licenseExpiresIso,
        "issue",
      );

      if (saved.action === "return_existing") {
        return json(
          licensePayload(saved, {
            locked: true,
            can_refresh: !!saved.can_refresh,
            state,
          }),
        );
      }

      return json(
        licensePayload(saved, {
          locked: false,
          refreshed: false,
          can_refresh: false,
          state,
        }),
      );
    } catch (err) {
      const mapped = mapRpcError(String(err));
      return json({ ok: false, error: mapped.error, message: mapped.message, state }, mapped.status);
    }
  } catch (err) {
    console.error("[generate-license] unexpected:", err);
    return json({ ok: false, error: "internal_error" }, 500);
  }
});
