// ============================================================================
// click.ts — CLICK to'lov sahifasiga (my.click.uz) o'tish
// ----------------------------------------------------------------------------
// Oqim Payme bilan bir xil tamoyilda: bu modul HECH NARSANI faollashtirmaydi.
//
//   1. Frontend `click_create_order` RPC orqali buyurtma yaratadi. Summa va
//      tarif serverda `payme_plans` dan olinadi — klient summani belgilamaydi.
//   2. Foydalanuvchi shu buyurtma ID si (`transaction_param`) bilan CLICK
//      sahifasiga yuboriladi.
//   3. CLICK serveri `click` Edge Function ga Prepare/Complete yuboradi, imzo
//      (md5 + maxfiy kalit) tekshiriladi va PRO faqat Complete da yoziladi.
//
// Havola formati (docs.click.uz → Payment Button, Option 1):
//   https://my.click.uz/services/pay?service_id=&merchant_id=&amount=N.NN
//     &transaction_param=&return_url=&merchant_user_id=
// ============================================================================

const CLICK_PAY_URL = "https://my.click.uz/services/pay";

/**
 * Kassa identifikatorlari — MAXFIY EMAS, to'lov havolasida ochiq turadi.
 * Maxfiy SECRET_KEY faqat Supabase Vault da (`click_secret_key`).
 */
const SERVICE_ID = import.meta.env.VITE_CLICK_SERVICE_ID as string | undefined;
const MERCHANT_ID = import.meta.env.VITE_CLICK_MERCHANT_ID as string | undefined;
const MERCHANT_USER_ID = import.meta.env.VITE_CLICK_MERCHANT_USER_ID as string | undefined;

const isDigits = (value: string | undefined): value is string =>
  typeof value === "string" && /^\d+$/.test(value.trim());

/**
 * Click sozlanganmi. Sozlanmagan bo'lsa Pro sahifasida Click tanlovi umuman
 * ko'rsatilmaydi — backend tayyor bo'lmaguncha frontendni xavfsiz chiqarish
 * mumkin.
 */
export function isClickConfigured(): boolean {
  return isDigits(SERVICE_ID) && isDigits(MERCHANT_ID);
}

/** Tiyin → CLICK kutadigan "N.NN" format (float yaxlitlash xatosisiz). */
export function formatTiyinForClick(amountTiyin: number): string {
  const som = Math.floor(amountTiyin / 100);
  const tiyin = String(amountTiyin % 100).padStart(2, "0");
  return `${som}.${tiyin}`;
}

/** Buyurtma ID si — `click_create_order` qaytaradigan UUID. */
const ORDER_ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function buildClickPayUrl(options: {
  /** `click_transactions.order_id` — CLICK uni `merchant_trans_id` qilib qaytaradi. */
  orderId: string;
  /** Serverda buyurtmaga yozilgan summa (tiyinda). */
  amountTiyin: number;
  /** To'lovdan keyin qaytariladigan sahifa. */
  returnUrl: string;
}): string | null {
  if (!isClickConfigured()) return null;
  if (!ORDER_ID_RE.test(options.orderId)) return null;
  if (!Number.isInteger(options.amountTiyin) || options.amountTiyin <= 0) return null;

  const params = new URLSearchParams({
    service_id: SERVICE_ID!.trim(),
    merchant_id: MERCHANT_ID!.trim(),
    amount: formatTiyinForClick(options.amountTiyin),
    transaction_param: options.orderId,
    return_url: options.returnUrl,
  });
  if (isDigits(MERCHANT_USER_ID)) {
    params.set("merchant_user_id", MERCHANT_USER_ID.trim());
  }

  return `${CLICK_PAY_URL}?${params.toString()}`;
}
