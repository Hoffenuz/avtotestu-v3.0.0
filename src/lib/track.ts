/**
 * Voronka o'lchovi — GA4 custom event'lar.
 *
 * NEGA KERAK: sayt SPA (React Router), lekin `index.html` dagi
 * `gtag('config', ...)` FAQAT bir marta, sahifa birinchi ochilganda
 * ishlaydi. Foydalanuvchi `/pro` ga client-side o'tsa, GA buni umuman
 * ko'rmaydi — voronkaning "nechta odam PRO sahifasiga yetdi" degan
 * bosqichi hozirgacha o'lchanmagan.
 *
 * XAVFSIZ CHAQIRISH: `window.gtag` GA hali yuklanmagan bo'lsa ham mavjud
 * (index.html dagi inline skript uni darhol e'lon qiladi, chaqiruvlar
 * `dataLayer` ga navbatga qo'yiladi). AdBlock yoki xatolik holatida esa
 * `try/catch` hech narsani buzmaydi — analitika hech qachon foydalanuvchi
 * tajribasiga ta'sir qilmasligi kerak.
 */
declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
  }
}

function safeGtag(...args: unknown[]): void {
  try {
    window.gtag?.(...args);
  } catch {
    /* GA yuklanmagan yoki bloklangan — jimgina o'tamiz */
  }
}

/** Client-side navigatsiyada sahifa ko'rishni GA'ga yetkazadi. */
export function trackPageView(path: string, title: string): void {
  safeGtag("event", "page_view", {
    page_path: path,
    page_title: title,
    page_location: window.location.href,
  });
}

/** Voronka bosqichi — masalan "cheklovga urildi", "to'lov boshlandi". */
export function trackEvent(name: string, params?: Record<string, string | number | boolean>): void {
  safeGtag("event", name, params);
}
