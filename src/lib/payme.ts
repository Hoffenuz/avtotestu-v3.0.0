// ============================================================================
// payme.ts — Payme to'lov sahifasiga (checkout) o'tish
// ----------------------------------------------------------------------------
// Backend allaqachon to'liq: `payme` Edge Function Merchant API ning barcha
// metodlarini (CheckPerformTransaction, CreateTransaction, PerformTransaction,
// CancelTransaction, CheckTransaction, GetStatement, SetFiscalData) bajaradi va
// PRO huquqini `payme_perform_transaction` SQL funksiyasi beradi.
//
// Shuning uchun bu modul HECH NARSANI faollashtirmaydi — u faqat foydalanuvchini
// to'g'ri summa va hisob bilan Payme sahifasiga olib boradi. Obuna Payme
// serveri PerformTransaction chaqirgandan keyingina yoziladi (frontendni
// aldab PRO olish imkonsiz).
//
// Havola formati (GET usuli):
//   https://checkout.paycom.uz/<base64("m=...;ac.email=...;a=...;c=...;l=...")>
// https://developer.help.paycom.uz/initsializatsiya-platezhey/otpravka-cheka-po-metodu-get
// ============================================================================

/** Payme checkout sahifasi (production). */
const PAYME_CHECKOUT_URL = "https://checkout.paycom.uz";

/**
 * Kassa (merchant) ID — Payme kabinetidagi 24 belgili identifikator.
 * Bu MAXFIY EMAS: u to'lov havolasi ichida ochiq ko'rinadi. Maxfiy bo'lgan
 * kassa KALITI faqat Supabase Vault da (`payme_merchant_key`) saqlanadi va
 * hech qachon frontendga tushmaydi.
 */
const MERCHANT_ID = import.meta.env.VITE_PAYME_MERCHANT_ID as string | undefined;

/** Kassa ID sozlanganmi (sozlanmagan bo'lsa tugmalarni ko'rsatmaymiz). */
export function isPaymeConfigured(): boolean {
  return typeof MERCHANT_ID === "string" && MERCHANT_ID.trim().length > 0;
}

export interface PaymePlan {
  /** DB dagi `payme_plans.plan_name` — weekly | monthly | quarterly */
  plan_name: string;
  /** Tiyinda (1 so'm = 100 tiyin). Payme aynan shu summani kutadi. */
  amount_tiyin: number;
  tariff_days: number;
}

/** UTF-8 xavfsiz base64 (btoa o'zi faqat Latin-1 ni qabul qiladi). */
function toBase64(input: string): string {
  const bytes = new TextEncoder().encode(input);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

/** Ilova tili → Payme qo'llab-quvvatlaydigan til kodi. */
function paymeLang(language: string): "uz" | "ru" | "en" {
  if (language === "ru") return "ru";
  if (language === "en") return "en";
  return "uz"; // uz-lat va uz-cyr — ikkalasi ham "uz"
}

/**
 * Checkout havolasini yasaydi.
 *
 * Parametrlar `;` bilan ajratiladi, shuning uchun qiymatlar ichida `;` bo'lishi
 * mumkin emas — email va callback URL da u uchramaydi, lekin buzilgan havola
 * yaratmaslik uchun baribir tekshiramiz.
 */
export function buildPaymeCheckoutUrl(options: {
  /** Hisob egasining emaili — backend `account.email` bo'yicha topadi. */
  email: string;
  /** To'lov summasi tiyinda (DB dagi payme_plans.amount_tiyin bilan bir xil). */
  amountTiyin: number;
  /** To'lovdan keyin qaytariladigan sahifa. */
  callbackUrl: string;
  /** Ilova tili. */
  language: string;
}): string | null {
  const merchantId = MERCHANT_ID?.trim();
  if (!merchantId) return null;

  const email = options.email.trim();
  if (!email || email.includes(";")) return null;

  if (!Number.isInteger(options.amountTiyin) || options.amountTiyin <= 0) return null;

  const callback = options.callbackUrl.includes(";") ? "" : options.callbackUrl;

  const parts = [
    `m=${merchantId}`,
    `ac.email=${email}`,
    `a=${options.amountTiyin}`,
    `l=${paymeLang(options.language)}`,
  ];
  if (callback) parts.push(`c=${callback}`);

  return `${PAYME_CHECKOUT_URL}/${toBase64(parts.join(";"))}`;
}

/** Tiyinni ko'rsatish uchun formatlaydi: 3500000 → "35 000" */
export function formatTiyinAsSum(amountTiyin: number): string {
  return Math.round(amountTiyin / 100)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}
