// ============================================================================
// licenseToken.ts — Offline imzolangan litsenziya kalitini tekshirish (Ed25519)
// ----------------------------------------------------------------------------
// Kalit formati (Edge Function `generate-license` yasaydi):
//   AVT2.<payloadB64url>.<signatureB64url>
//   payload = { v, d(deviceId), uid, iat(unix sek), exp(unix sek) }
//   signature = Ed25519_sign(PRIVATE_KEY, "AVT2.<payloadB64url>")
//
// Tekshirish butunlay offline (internetsiz). Maxfiy kalit ilovada YO'Q —
// faqat ochiq kalit bilan imzo tekshiriladi (asimmetrik).
// ============================================================================

import * as ed from "@noble/ed25519";
import { LICENSE_PUBLIC_KEY_HEX, TOKEN_PREFIX } from "@/lib/licenseKeys";

/** Qurilma sanasi token yasalganidan ortda bo'lishi mumkin bo'lgan tolerantlik (1 kun) */
const CLOCK_SKEW_SEC = 24 * 60 * 60;

export interface LicensePayload {
  v: number;
  d: string;
  uid: string;
  iat: number;
  exp: number;
}

export type LicenseReason =
  | "format"
  | "signature"
  | "payload"
  | "device_mismatch"
  | "expired"
  | "clock_backdated";

export interface LicenseVerifyResult {
  valid: boolean;
  reason?: LicenseReason;
  payload?: LicensePayload;
}

function base64UrlToBytes(b64url: string): Uint8Array {
  const b64 = b64url.replace(/-/g, "+").replace(/_/g, "/");
  const padded = b64 + "=".repeat((4 - (b64.length % 4)) % 4);
  const bin = atob(padded);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i);
  return bytes;
}

function hexToBytes(hex: string): Uint8Array {
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i += 1) {
    out[i] = parseInt(hex.substr(i * 2, 2), 16);
  }
  return out;
}

function utf8(s: string): Uint8Array {
  return new TextEncoder().encode(s);
}

const PUBLIC_KEY_BYTES = hexToBytes(LICENSE_PUBLIC_KEY_HEX);

export function parseLicensePayload(token: string): LicensePayload | null {
  try {
    const parts = token.trim().split(".");
    if (parts.length !== 3 || parts[0] !== TOKEN_PREFIX) return null;
    const payload = JSON.parse(
      new TextDecoder().decode(base64UrlToBytes(parts[1])),
    ) as LicensePayload;
    if (typeof payload.d !== "string" || typeof payload.exp !== "number") {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

export async function verifyLicenseToken(
  token: string,
  deviceId: string,
): Promise<LicenseVerifyResult> {
  const trimmed = (token || "").trim();
  const parts = trimmed.split(".");
  if (parts.length !== 3 || parts[0] !== TOKEN_PREFIX) {
    return { valid: false, reason: "format" };
  }

  const [prefix, payloadB64, sigB64] = parts;
  const message = utf8(`${prefix}.${payloadB64}`);

  let signatureOk = false;
  try {
    const sig = base64UrlToBytes(sigB64);
    signatureOk = await ed.verifyAsync(sig, message, PUBLIC_KEY_BYTES);
  } catch {
    signatureOk = false;
  }

  if (!signatureOk) {
    return { valid: false, reason: "signature" };
  }

  let payload: LicensePayload;
  try {
    payload = JSON.parse(
      new TextDecoder().decode(base64UrlToBytes(payloadB64)),
    ) as LicensePayload;
  } catch {
    return { valid: false, reason: "payload" };
  }

  if (payload.d !== deviceId) {
    return { valid: false, reason: "device_mismatch", payload };
  }

  const nowSec = Math.floor(Date.now() / 1000);

  if (nowSec + CLOCK_SKEW_SEC < payload.iat) {
    return { valid: false, reason: "clock_backdated", payload };
  }

  if (nowSec >= payload.exp) {
    return { valid: false, reason: "expired", payload };
  }

  return { valid: true, payload };
}

export function licenseReasonText(reason?: LicenseReason): string {
  switch (reason) {
    case "format":
      return "Kalit formati noto'g'ri";
    case "signature":
      return "Kalit imzosi yaroqsiz (soxta yoki buzilgan)";
    case "payload":
      return "Kalit ma'lumotini o'qib bo'lmadi";
    case "device_mismatch":
      return "Bu kalit boshqa qurilma uchun yaratilgan";
    case "expired":
      return "Kalit muddati tugagan";
    case "clock_backdated":
      return "Qurilma sanasi noto'g'ri (orqaga surilgan)";
    default:
      return "Kalit yaroqsiz";
  }
}
