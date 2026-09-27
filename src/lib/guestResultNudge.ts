// ============================================================================
// guestResultNudge — mehmonga "natijangizni saqlang" taklifi QACHON chiqadi
// ----------------------------------------------------------------------------
// MUAMMO: taklif birinchi testdan keyinoq chiqardi. Saytga endi kelgan odam
// hali sayt nima berishini ko'rmay turib "ro'yxatdan o'ting" oynasiga
// duch kelardi — bu chalg'itardi (egasi, 2026-09-27).
//
// QOIDA: mehmon tugatgan testlar shu qurilmada sanaladi.
//   * 1-test  — taklif YO'Q, natija bemalol ko'riladi;
//   * 2-test  — birinchi taklif (odam endi saytga qaytib kelmoqda);
//   * keyin   — har 3-testda (5, 8, 11 ...): har safar chiqib, jonga tegmasin.
// Hisob `localStorage` da. U bloklangan bo'lsa (private rejim) taklif
// chiqmaydi — noma'lum holatda yangi odamni bezovta qilmaslik afzal.
// ============================================================================

const GUEST_TESTS_KEY = "avtosmart-guest-tests-done";

/** Birinchi taklif nechanchi testdan keyin chiqadi. */
export const FIRST_NUDGE_AT = 2;
/** Keyingi takliflar orasidagi testlar soni. */
export const NUDGE_EVERY = 3;

/** `count`-testdan keyin taklif ko'rsatiladimi. */
export function shouldNudgeAt(count: number): boolean {
  if (count < FIRST_NUDGE_AT) return false;
  return (count - FIRST_NUDGE_AT) % NUDGE_EVERY === 0;
}

/**
 * Mehmon testni tugatdi: hisobni bittaga oshiradi va shu safar taklif
 * ko'rsatish kerakmi — qaytaradi. Har tugatilgan test uchun BIR MARTA
 * chaqiriladi.
 */
export function recordGuestTestDone(): boolean {
  try {
    const prev = Number.parseInt(localStorage.getItem(GUEST_TESTS_KEY) ?? "0", 10);
    const count = (Number.isFinite(prev) && prev > 0 ? prev : 0) + 1;
    localStorage.setItem(GUEST_TESTS_KEY, String(count));
    return shouldNudgeAt(count);
  } catch {
    return false;
  }
}
