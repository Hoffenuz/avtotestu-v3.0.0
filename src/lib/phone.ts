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

/** Raqamlarni "90 123 45 67" ko'rinishida guruhlaydi. */
function groupLocal(digits: string): string {
  return [
    digits.slice(0, 2),
    digits.slice(2, 5),
    digits.slice(5, 7),
    digits.slice(7, 9),
  ].filter(Boolean).join(' ');
}

/**
 * Kiritish maydoni uchun erkin format — foydalanuvchi raqamni QANDAY yozsa
 * ham qabul qiladi: `901234567`, `998901234567`, `+998901234567`.
 *
 * Mamlakat kodi FAQAT uzunlik bo'yicha ajratiladi, prefiks bo'yicha emas.
 * Sabab: `99` ham amaldagi operator kodi, shuning uchun to'liq 9 xonali
 * raqamning o'zi `998...` bilan boshlanishi mumkin (masalan 99 812 34 56).
 * Eski kod bunday raqamlardan "998" ni kesib tashlar edi va egasi
 * ro'yxatdan o'ta olmasdi.
 *
 * `+` bilan yozilayotganda kod aniq bo'lgunicha (10 xonagacha) matnga
 * tegilmaydi — aks holda "+998" yozilishi bilan "+99 8" ga aylanib ketardi.
 */
export function formatUzPhoneLoose(input: string): string {
  const raw = input ?? '';
  const hadPlus = raw.trimStart().startsWith('+');

  const digits = raw.replace(/\D/g, '').slice(0, UZ_CODE.length + LOCAL_DIGITS);
  if (!digits) return hadPlus ? '+' : '';

  if (digits.length > LOCAL_DIGITS && digits.startsWith(UZ_CODE)) {
    return `+${UZ_CODE} ${groupLocal(digits.slice(UZ_CODE.length))}`.trimEnd();
  }

  // Kod hali noaniq — foydalanuvchi yozayotganini buzmaymiz
  if (hadPlus) return `+${digits}`;
  return groupLocal(digits.slice(0, LOCAL_DIGITS));
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

/**
 * Yagona kirish maydoni telefon raqam ham, email ham qabul qiladi.
 * Faqat raqam/`+`/ajratgichlardan iborat matn telefon deb hisoblanadi.
 */
export function looksLikePhone(input: string): boolean {
  const raw = (input ?? '').trim();
  return raw.length > 0 && !/[^\d\s+()-]/.test(raw);
}

/**
 * Yagona kirish maydoni uchun format: telefonga o'xshasa guruhlaydi,
 * emailga tegmaydi (bo'sh joylar qo'shilib qolmasin).
 */
export function formatLoginInput(input: string): string {
  const raw = input ?? '';
  if (!raw) return '';
  return looksLikePhone(raw) ? formatUzPhoneLoose(raw) : raw.trimStart();
}
