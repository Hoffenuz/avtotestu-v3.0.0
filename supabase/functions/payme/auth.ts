// ============================================================================
// Basic HTTP autentifikatsiya
// https://developer.help.paycom.uz/protokol-merchant-api/format-zaprosa
// ============================================================================
// Payme `Basic base64("Paycom:<merchant key>")` ko'rinishida keladi. Kalit bu
// funksiyada saqlanmaydi: u Supabase Vault ichida shifrlangan holda yotadi va
// solishtirish Postgres ichida (payme_verify_key) bajariladi.

import { admin } from "./client.ts";

export async function isAuthorized(req: Request): Promise<boolean> {
  const header = req.headers.get("Authorization") ?? "";
  const b64 = header.replace(/^Basic\s+/i, "").trim();
  if (!b64) return false;

  let decoded: string;
  try {
    decoded = atob(b64);
  } catch {
    return false;
  }

  // Faqat BIRINCHI ikki nuqta bo'yicha bo'linadi — kalit ichida ham bo'lishi mumkin.
  const sep = decoded.indexOf(":");
  if (sep === -1) return false;
  const key = decoded.slice(sep + 1);
  if (!key) return false;

  const { data, error } = await admin.rpc("payme_verify_key", { p_key: key });
  if (error) {
    console.error("[payme] auth check failed:", error.message);
    return false;
  }
  return data === true;
}
