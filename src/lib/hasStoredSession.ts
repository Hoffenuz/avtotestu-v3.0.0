/**
 * Brauzerda saqlangan Supabase sessiyasi BORLIGINI sinxron aniqlaydi.
 *
 * NEGA KERAK:
 * `useAuth().user` birinchi renderda doim `null` — sessiya localStorage dan
 * o'qilib, tekshirilguncha bir necha yuz millisekund ketadi. Shu sababli
 * faqat kirgan foydalanuvchilarga ko'rinadigan bo'limlar (masalan bosh
 * sahifadagi profil paneli) DASTLAB YO'Q bo'lib, keyin BIRDAN paydo bo'lardi
 * va pastdagi hamma narsani surib yuborardi.
 *
 * Cloudflare RUM da bu `footer.bg-primary` elementida CLS 0.187 bo'lib
 * ko'rinardi.
 *
 * YECHIM: localStorage ni sinxron o'qib, sessiya bor-yo'qligini DARHOL
 * bilamiz va joyni birinchi renderdayoq zahiralaymiz.
 *
 * MUHIM — BU XAVFSIZLIK TEKSHIRUVI EMAS:
 * Bu faqat "joy zahiralaymizmi yoki yo'qmi" degan MAKET qarori uchun.
 * Kalit mavjudligi tokenning haqiqiyligini bildirmaydi (u eskirgan yoki
 * qo'lda yozilgan bo'lishi mumkin). Haqiqiy foydalanuvchi ma'lumoti faqat
 * `useAuth()` dan olinadi va ma'lumotni baribir RLS himoya qiladi.
 *
 * Hech narsa import qilmaydi — aylanma import xavfi yo'q
 * (`lib/clearUserData.ts` dagi kabi).
 */

/** supabase-js standart kaliti: `sb-<project-ref>-auth-token` */
const SUPABASE_AUTH_KEY = /^sb-.+-auth-token$/;

export function hasStoredSession(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && SUPABASE_AUTH_KEY.test(key)) {
        // Bo'sh yoki "null" qiymat = sessiya yo'q (chiqishdan keyin qolgan iz)
        const raw = localStorage.getItem(key);
        if (raw && raw !== 'null' && raw.length > 2) return true;
      }
    }
    return false;
  } catch {
    // Shaxsiy rejim yoki bloklangan storage — zahiralamaymiz
    return false;
  }
}
