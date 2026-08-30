/**
 * phone.ts — telefon raqamni login sifatida ishlatish.
 *
 * Foydalanuvchi FAQAT telefon raqamini ko'radi va kiritadi. Supabase Auth esa
 * email talab qiladi, shuning uchun raqamdan sun'iy manzil yasaladi:
 *
 *   901234567  →  998901234567  →  998901234567@pro.com
 *
 * Bu manzil foydalanuvchiga hech qachon ko'rsatilmaydi. `@pro.com` haqiqiy
 * domen bo'lgani uchun unga HECH QACHON xat yuborilmaydi — hisob server
 * tomonda (admin API, `email_confirm: true`) yaratiladi.
 *
 * Payme ham hisobni shu manzil bo'yicha topadi (`ac.email`), shuning uchun
 * to'lov oqimi o'zgarishsiz ishlayveradi.
 */

/** Sun'iy manzil domeni — o'zgartirilsa eski hisoblar kira olmay qoladi. */
export const PHONE_EMAIL_DOMAIN = 'pro.com';

/** O'zbekiston kodi. */
const UZ_CODE = '998';

/** 998 dan keyingi raqamlar soni. */
const LOCAL_DIGITS = 9;

/**
 * Kiritilgan matndan faqat raqamlarni ajratib, `998XXXXXXXXX` ko'rinishiga
 * keltiradi. Qabul qilinadigan shakllar:
 *   901234567, 998901234567, +998901234567, +998 90 123 45 67
 *
 * @returns 12 xonali raqam yoki null (noto'g'ri bo'lsa)
 */
export function normalizeUzPhone(input: string): string | null {
  const digits = (input ?? '').replace(/\D/g, '');
  if (!digits) return null;

  let local: string;
  if (digits.length === LOCAL_DIGITS) {
    local = digits;
  } else if (digits.length === UZ_CODE.length + LOCAL_DIGITS && digits.startsWith(UZ_CODE)) {
    local = digits.slice(UZ_CODE.length);
  } else {
    return null;
  }

  // Operator kodi 0 yoki 1 bilan boshlanmaydi — xato terishni ushlaymiz
  if (/^[01]/.test(local)) return null;

  return UZ_CODE + local;
}

/** Kiritish maydoni uchun: "+998 90 123 45 67" ko'rinishida formatlaydi. */
export function formatUzPhoneInput(input: string): string {
  let digits = (input ?? '').replace(/\D/g, '');

  // Foydalanuvchi 998 siz tersa ham to'g'ri joyga tushsin
  if (digits.startsWith(UZ_CODE)) digits = digits.slice(UZ_CODE.length);
  digits = digits.slice(0, LOCAL_DIGITS);

  if (!digits) return '';

  const parts = [
    digits.slice(0, 2),
    digits.slice(2, 5),
    digits.slice(5, 7),
    digits.slice(7, 9),
  ].filter(Boolean);

  return `+${UZ_CODE} ${parts.join(' ')}`.trimEnd();
}

/**
 * Kiritish maydoni uchun, `+998` prefiksisiz: "90 123 45 67".
 * Maydon yonida prefiks alohida chiqadi, shuning uchun foydalanuvchi faqat
 * 9 ta raqam yozadi. Nusxa ko'chirib qo'yilgan to'liq raqamdan 998 kesiladi.
 */
export function formatUzLocalInput(input: string): string {
  let digits = (input ?? '').replace(/\D/g, '');
  if (digits.startsWith(UZ_CODE)) digits = digits.slice(UZ_CODE.length);
  digits = digits.slice(0, LOCAL_DIGITS);

  return [
    digits.slice(0, 2),
    digits.slice(2, 5),
    digits.slice(5, 7),
    digits.slice(7, 9),
  ].filter(Boolean).join(' ');
}

/** Ko'rsatish uchun: 998901234567 → "+998 90 123 45 67" */
export function formatUzPhoneDisplay(normalized: string): string {
  const n = normalizeUzPhone(normalized);
  if (!n) return normalized;
  const l = n.slice(UZ_CODE.length);
  return `+${UZ_CODE} ${l.slice(0, 2)} ${l.slice(2, 5)} ${l.slice(5, 7)} ${l.slice(7, 9)}`;
}

/** Telefon raqamdan Supabase uchun sun'iy manzil yasaydi. */
export function phoneToEmail(normalized: string): string {
  return `${normalized}@${PHONE_EMAIL_DOMAIN}`;
}

/** Manzil telefon orqali yaratilganmi (foydalanuvchiga ko'rsatilmasligi kerak). */
export function isPhoneEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return email.trim().toLowerCase().endsWith(`@${PHONE_EMAIL_DOMAIN}`);
}

/**
 * Hisob manzilidan telefon raqamni tiklaydi (profilda ko'rsatish uchun).
 * Telefon hisobi bo'lmasa null qaytaradi.
 */
export function emailToPhoneDisplay(email: string | null | undefined): string | null {
  if (!isPhoneEmail(email)) return null;
  const local = email!.split('@')[0];
  const normalized = normalizeUzPhone(local);
  return normalized ? formatUzPhoneDisplay(normalized) : null;
}

/**
 * Kirish maydoniga yozilgan qiymatni Supabase uchun manzilga aylantiradi.
 * Telefonga o'xshasa — sun'iy manzil, aks holda o'zi (eski email hisoblari).
 */
export function loginIdentifierToEmail(input: string): string | null {
  const raw = (input ?? '').trim();
  if (!raw) return null;

  if (raw.includes('@')) return raw.toLowerCase();

  const normalized = normalizeUzPhone(raw);
  return normalized ? phoneToEmail(normalized) : null;
}
