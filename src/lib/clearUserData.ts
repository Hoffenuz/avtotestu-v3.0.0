/**
 * Chiqishdan keyin qoladigan auth/test ma'lumotlarini tozalaydi.
 *
 * NEGA ALOHIDA FAYL: ilgari bu funksiya `hooks/useUserValidation.ts` ichida
 * edi va AYLANMA IMPORT hosil qilardi:
 *
 *     AuthContext  →  useUserValidation  →  AuthContext
 *     (clearAllUserData uchun)              (useAuth uchun)
 *
 * Aylanma import ES modullarida ba'zi modullar hali initsializatsiya
 * bo'lmagan holatda o'qilishiga olib keladi. Vite dev serverida esa bu
 * "Failed to fetch dynamically imported module" ko'rinishida chiqadi —
 * ayniqsa lazy yuklanadigan sahifalarda (/profile) va HMR yangilanganda.
 *
 * Endi bu funksiya hech narsani import qilmaydi, ya'ni halqa uzildi.
 */

/**
 * Call only AFTER supabase.auth.signOut — never before (refresh-token races).
 *
 * `userId`: test-state kalitlari foydalanuvchiga bog'langan
 * (`testState_..._<userId>`). Umumiy qurilmada boshqa hisobning tugallanmagan
 * testi ham saqlanayotgan bo'lishi mumkin — shuning uchun faqat SHU
 * foydalanuvchining kalitlarini o'chiramiz. `undefined` faqat chiqayotgan
 * foydalanuvchi ID si noma'lum bo'lgandagina uzatiladi.
 */
export const clearAllUserData = (userId?: string) => {
  const suffix = userId ? `_${userId}` : undefined;

  Object.keys(localStorage).forEach((key) => {
    if (key.startsWith('sb-') || key.includes('supabase')) {
      localStorage.removeItem(key);
      return;
    }
    const isTestKey =
      key.startsWith('testState_') ||
      key.startsWith('variant_activeTest') ||
      key.startsWith('mavzuli_activeTest') ||
      key.startsWith('testIshlash_activeTest');
    if (isTestKey && (!suffix || key.endsWith(suffix))) {
      localStorage.removeItem(key);
    }
  });

  Object.keys(sessionStorage).forEach((key) => {
    if (key.startsWith('sb-') || key.includes('supabase')) {
      sessionStorage.removeItem(key);
    }
  });
};
