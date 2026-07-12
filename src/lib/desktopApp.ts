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

export function triggerDesktopAppDownload() {
  const link = document.createElement("a");
  link.href = DESKTOP_APP_DOWNLOAD_URL;
  link.download = DESKTOP_APP_FILENAME;
  link.rel = "noopener noreferrer";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
