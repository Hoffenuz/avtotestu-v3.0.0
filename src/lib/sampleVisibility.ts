/**
 * Bosh sahifadagi "Sinab ko'ring" kartasi KIMGA va QACHON chiqadi.
 *
 * Egasining qoidasi (2026-09-26):
 *   * Mehmon (ro'yxatdan o'tmagan) — har safar chiqadi. Karta uning uchun
 *     sayt nima berishini ko'rsatadigan birinchi tajriba.
 *   * Kirgan foydalanuvchi — kuniga bir marta: 5 ta savolni yechib
 *     tugatgach, o'sha kun boshqa chiqmaydi, ertasi kuni yana chiqadi.
 *
 * Belgi foydalanuvchi bo'yicha (`id`) — bitta qurilmada ikki akkaunt
 * bo'lsa, biri tugatgani ikkinchisidan kartani yashirmaydi. Sana — mahalliy
 * vaqt bo'yicha (Toshkent yarim tuni, UTC emas).
 */

const KEY_PREFIX = "home-sample-done-day:";

/** Mahalliy sana `YYYY-MM-DD` ko'rinishida. */
export function localDay(date: Date = new Date()): string {
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${date.getFullYear()}-${m}-${d}`;
}

export function sampleDoneKey(userId: string): string {
  return KEY_PREFIX + userId;
}

/** Karta ko'rsatiladimi? `userId` yo'q — mehmon. */
export function shouldShowSample(userId: string | null | undefined, today: string = localDay()): boolean {
  if (!userId) return true;
  try {
    return localStorage.getItem(sampleDoneKey(userId)) !== today;
  } catch {
    return true;
  }
}

/** Kirgan foydalanuvchi 5 ta savolni tugatdi — bugun boshqa chiqmaydi. Mehmonda hech narsa yozilmaydi. */
export function markSampleDone(userId: string | null | undefined, today: string = localDay()): void {
  if (!userId) return;
  try {
    localStorage.setItem(sampleDoneKey(userId), today);
  } catch {
    /* private rejim — faqat shu sahifada yopiladi */
  }
}
