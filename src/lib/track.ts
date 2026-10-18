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

const SENT_PURCHASES_KEY = "ga-purchase-sent";

/**
 * GA4 `purchase` — tranzaksiya ID, summa va valyuta bilan (audit ENG-08).
 * Bir ID faqat BIR MARTA yuboriladi: sahifa yangilansa yoki ikkinchi
 * qurilmada ochilsa ham tushum ikki marta sanalmaydi (shu brauzer doirasida).
 * Haqiqiy hisob baribir bazadan (admin panel, `admin_panel_weekly`).
 * @returns yuborildimi (avval yuborilgan bo'lsa false)
 */
export function trackPurchase(p: {
  transactionId: string;
  valueSom: number;
  plan: string;
  provider: string;
}): boolean {
  let sent: string[] = [];
  try {
    sent = JSON.parse(localStorage.getItem(SENT_PURCHASES_KEY) ?? "[]");
    if (!Array.isArray(sent)) sent = [];
  } catch {
    sent = [];
  }
  if (sent.includes(p.transactionId)) return false;

  safeGtag("event", "purchase", {
    transaction_id: p.transactionId,
    value: p.valueSom,
    currency: "UZS",
    items: [{ item_id: p.plan, item_name: `PRO ${p.plan}`, price: p.valueSom, quantity: 1 }],
    payment_type: p.provider,
  });
  try {
    localStorage.setItem(SENT_PURCHASES_KEY, JSON.stringify([...sent, p.transactionId].slice(-20)));
  } catch {
    // ignore — eng yomoni, shu brauzerda qayta ochilsa yana yuboriladi
  }
  return true;
}
