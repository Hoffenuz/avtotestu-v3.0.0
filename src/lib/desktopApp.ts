/** Mobil telefon yoki planshet ekanligini aniqlaydi (Windows .exe yuklab olish uchun mos emas) */
export function isMobileDevice(): boolean {
  if (typeof navigator === "undefined") return false;
  return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini|Mobile/i.test(
    navigator.userAgent,
  );
}

/** Desktop ilova o'rnatuvchi fayli (Cloudflare R2) */
export const DESKTOP_APP_DOWNLOAD_URL =
  "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/ilova/Avtotestlar.uz-Setup.exe";
export const DESKTOP_APP_FILENAME = "Avtotestlar.uz-Setup.exe";
export const DESKTOP_APP_SIZE_MB = 131;

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
