// ============================================================================
// authEntry — /auth sahifasi QAYSI tabda ochiladi va qayerga qaytaradi
// ----------------------------------------------------------------------------
// MUAMMO: "Kirish" tugmasi yoki hisob kerak bo'lgan joy (xato savollarim,
// saqlanganlar, PRO bo'lim...) bosilganda har doim KIRISH tabi ochilardi.
// Saytga birinchi marta kelgan odamning hisobi yo'q — u "telefon yoki email /
// parol" maydonini ko'rib, qaytib ketardi. Ro'yxatdan o'tish tabini o'zi
// topishi kerak edi.
//
// YECHIM — BITTA QAROR NUQTASI:
//   * shu qurilmada hech qachon hisobga kirilmagan  → RO'YXATDAN O'TISH;
//   * avval kirilgan (yoki sessiya saqlangan)       → KIRISH.
// Ikkala tab ham ko'rinib turadi — yangi qurilmadagi eski foydalanuvchi bir
// bosishda "Kirish" ga o'tadi, raqami band bo'lsa sahifa o'zi o'tkazadi.
//
// Chaqiruvchi aniq `mode` bersa — u ustun (masalan maxsus havolalar).
// ============================================================================

import { hasStoredSession } from "@/lib/hasStoredSession";

export type AuthMode = "login" | "signup";

/** Shu qurilmada hisobga kirilganini eslab qoluvchi kalit. */
const KNOWN_ACCOUNT_KEY = "avtosmart-known-account";

/** Hisobga kirildi — `AuthContext` sessiya kelganda chaqiradi. */
export function rememberKnownAccount(): void {
  try {
    localStorage.setItem(KNOWN_ACCOUNT_KEY, "1");
  } catch {
    /* private rejim — shunchaki eslab qolinmaydi */
  }
}

/** Shu qurilmada qachondir hisobga kirilganmi. */
export function hasKnownAccount(): boolean {
  try {
    if (localStorage.getItem(KNOWN_ACCOUNT_KEY) === "1") return true;
  } catch {
    return false;
  }
  return hasStoredSession();
}

/** Aniq rejim so'ralmagan bo'lsa — yangi qurilma uchun ro'yxatdan o'tish. */
export function defaultAuthMode(): AuthMode {
  return hasKnownAccount() ? "login" : "signup";
}

/**
 * `/auth` ga o'tishda beriladigan `location.state`.
 *
 * `returnTo` — hisob ochilgach/kirilgach QAYTILADIGAN sahifa. Berilmasa
 * foydalanuvchi bosh sahifaga tushib qolardi va nima uchun kirganini
 * qaytadan izlashi kerak edi.
 */
export function authState(returnTo?: string, mode?: AuthMode): { returnTo?: string; mode?: AuthMode } {
  const state: { returnTo?: string; mode?: AuthMode } = {};
  if (returnTo && returnTo.startsWith("/") && !returnTo.startsWith("//") && !returnTo.startsWith("/auth")) {
    state.returnTo = returnTo;
  }
  if (mode) state.mode = mode;
  return state;
}
