/**
 * Faol PRO'ni uzaytirish — serverdagi qoidaning (payme_perform_transaction,
 * click_grant_pro, pro_purchase_limit_exceeded) klientdagi nusxasi.
 * Faqat ko'rsatish va oldindan ogohlantirish uchun: haqiqiy qaror serverda.
 */

const DAY_MS = 24 * 60 * 60 * 1000;
/** Asia/Tashkent — doimiy UTC+5 (yozgi vaqt yo'q). */
const TASHKENT_OFFSET_MS = 5 * 60 * 60 * 1000;

/** Jami PRO muddati bugundan shuncha kundan oshmaydi (server bilan bir xil). */
export const PRO_MAX_DAYS_AHEAD = 400;

/** Yangi kunlar shu nuqtadan qo'shiladi: faol PRO tugashi yoki hozir. */
function renewalBase(expiresAt: Date | null, now: number): number {
  return expiresAt && expiresAt.getTime() > now ? expiresAt.getTime() : now;
}

/** Xariddan keyingi tugash sanasi: (asos + N kun) kunining Toshkent bo'yicha 23:59:59 i. */
export function projectedProEnd(expiresAt: Date | null, days: number, now = Date.now()): Date {
  const local = renewalBase(expiresAt, now) + days * DAY_MS + TASHKENT_OFFSET_MS;
  const endOfDay = Math.floor(local / DAY_MS) * DAY_MS + DAY_MS - 1000;
  return new Date(endOfDay - TASHKENT_OFFSET_MS);
}

/** Xarid 400 kunlik chegaradan oshadimi (server `pro_limit` qaytaradi). */
export function exceedsProLimit(expiresAt: Date | null, days: number, now = Date.now()): boolean {
  return renewalBase(expiresAt, now) + days * DAY_MS > now + PRO_MAX_DAYS_AHEAD * DAY_MS;
}

/** 25.11.2026 — Toshkent sanasi, til va brauzer sozlamasidan qat'i nazar bir xil. */
export function formatProDate(date: Date): string {
  const d = new Date(date.getTime() + TASHKENT_OFFSET_MS);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(d.getUTCDate())}.${pad(d.getUTCMonth() + 1)}.${d.getUTCFullYear()}`;
}

/*
  To'lovdan qaytgach tasdiqni aniqlash.

  Ilgari /profile "PRO faolmi?" deb qarardi. Faol PRO'ni uzaytirgan odam
  allaqachon PRO — sahifa to'lov tasdiqlanmasdan "faollashtirildi" deb
  qo'yardi. Endi to'lovga ketishdan oldingi tugash sanasi saqlanadi va
  tasdiq = muddat shundan KEYINGA surilgani.
*/
const BASELINE_KEY = "pro-checkout-prev-end";

/** To'lovga ketishdan oldin: joriy tugash sanasi (PRO yo'q bo'lsa — bo'sh). */
export function saveCheckoutBaseline(expiresAt: Date | null): void {
  try {
    sessionStorage.setItem(BASELINE_KEY, expiresAt ? String(expiresAt.getTime()) : "");
  } catch {
    // ignore — tasdiq oddiy "PRO faolmi" tekshiruviga qaytadi
  }
}

/** Saqlangan tugash vaqti (ms) yoki null — PRO yo'q edi yoki saqlanmagan. */
export function readCheckoutBaseline(): number | null {
  try {
    const raw = sessionStorage.getItem(BASELINE_KEY);
    const ms = raw ? Number(raw) : NaN;
    return Number.isFinite(ms) && ms > 0 ? ms : null;
  } catch {
    return null;
  }
}

export function clearCheckoutBaseline(): void {
  try {
    sessionStorage.removeItem(BASELINE_KEY);
  } catch {
    // ignore
  }
}

/** To'lov tasdiqlandimi: PRO faol va (uzaytirishda) muddat avvalgidan keyinga surilgan. */
export function isPaymentConfirmed(
  isPremium: boolean,
  expiresAt: Date | null,
  baselineMs: number | null,
): boolean {
  if (!isPremium) return false;
  if (baselineMs == null) return true;
  return !!expiresAt && expiresAt.getTime() > baselineMs;
}
