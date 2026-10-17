/** Mobil telefon yoki planshet ekanligini aniqlaydi (Windows .exe yuklab olish uchun mos emas) */
export function isMobileDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(
    navigator.userAgent,
  );
}

/**
 * Desktop ilova o'rnatuvchi fayli (Cloudflare R2).
 *
 * Yangi versiya chiqqanda R2 dagi faylni SHU NOM bilan almashtirish kifoya —
 * havola o'zgarmaydi. Hajm o'zgarsa `DESKTOP_APP_SIZE_MB` ni ham yangilang.
 * Bot snapshoti (`scripts/generate-main-pages.cjs`, /desktop) ham shu URL'ni
 * ishlatadi — ikkalasi bir xil bo'lishi shart.
 *
 * Fayl nomi brauzer saqlaydigan nom bilan bir xil bo'ladi: cross-origin da
 * `<a download>` ishlamaydi (pastga qarang).
 */
export const DESKTOP_APP_DOWNLOAD_URL =
  "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/ilova/AvtoSmart-Setup.exe";

/**
 * Ko'rsatiladigan fayl nomi — URL dan OLINADI, qo'lda yozilmaydi.
 * Shunda sahifadagi nom bilan yuklanadigan faylning nomi hech qachon
 * bir-biridan ajralib ketmaydi.
 */
export const DESKTOP_APP_FILENAME =
  DESKTOP_APP_DOWNLOAD_URL.split("/").pop() ?? "AvtoSmart-Setup.exe";
export const DESKTOP_APP_SIZE_MB = 139;

/**
 * Cross-origin R2 da `<a download>` ishlamaydi — brauzer atributni e'tiborsiz qoldiradi.
 * To'g'ridan-to'g'ri URL ochiladi / yuklab olinadi.
 */
export function triggerDesktopAppDownload() {
  if (typeof window === "undefined") return;
  const a = document.createElement("a");
  a.href = DESKTOP_APP_DOWNLOAD_URL;
  a.rel = "noopener noreferrer";
  a.target = "_blank";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}
