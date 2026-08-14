/**
 * Telegram Mini App (Web App) integratsiyasi.
 *
 * MAQSAD: sayt Telegram ichida ochilganda imkon qadar to'liq ekranda
 * ko'rinsin. Oddiy brauzerda (Telegram'siz) esa HECH NARSA o'zgarmasin —
 * skript ham yuklanmaydi, kod ham ishlamaydi.
 *
 * PLATFORMA HAQIQATI (rasmiy hujjat):
 *   - Mobil: Mini App pastdan chiqadigan yarim ekranli panelda ochiladi.
 *     `expand()` uni to'liq balandlikka ochadi — bu yerda foyda ANIQ.
 *   - Desktop: Telegram ilovani O'ZI belgilagan o'lchamdagi oynada ochadi
 *     va `expand()` u yerda TA'SIR QILMAYDI. Oyna enini sayt tarafidan
 *     kengaytirib bo'lmaydi — bu Telegram cheklovi.
 *   - `requestFullscreen()` (Bot API 8.0) qo'llab-quvvatlangan joyda
 *     ilovani butun ekranga yoyadi. Qo'llab-quvvatlanmasa xato beradi —
 *     shuning uchun try/catch va `isVersionAtLeast` bilan himoyalangan.
 *
 * NEGA MOBILDA `requestFullscreen()` CHAQIRILMAYDI:
 * Mobilda u ilovani HAQIQIY to'liq ekranga o'tkazadi — kontent qurilmaning
 * status bari (soat, batareya, signal) va Telegram'ning o'z `X` / menyu
 * tugmalari OSTIGA kirib ketadi. Sayt sarlavhasi o'qib bo'lmas holga keladi.
 * Mobilda `expand()` ning o'zi allaqachon to'liq balandlik beradi va Telegram
 * interfeysi bilan to'qnashmaydi — ya'ni fullscreen u yerda foyda emas, zarar.
 *
 * Shuning uchun: fullscreen FAQAT desktopda. Mobilda — oddiy `expand()`.
 */

const SDK_SRC = 'https://telegram.org/js/telegram-web-app.js';

interface TelegramWebAppApi {
  ready?: () => void;
  expand?: () => void;
  requestFullscreen?: () => void;
  disableVerticalSwipes?: () => void;
  isVersionAtLeast?: (version: string) => boolean;
  version?: string;
  platform?: string;
}

declare global {
  interface Window {
    Telegram?: { WebApp?: TelegramWebAppApi };
    /** Telegram mobil webview'ida mavjud bo'ladi */
    TelegramWebviewProxy?: unknown;
  }
}

/**
 * Sahifa Telegram ichida ochilganmi.
 *
 * Telegram Mini App ni ishga tushirganda URL fragmentiga `tgWebApp*`
 * parametrlarini qo'shadi. Mobil webview'da bundan tashqari
 * `TelegramWebviewProxy` obyekti ham bo'ladi.
 *
 * MUHIM: fragment React Router yoki boshqa kod tomonidan o'zgartirilishidan
 * OLDIN o'qilishi kerak — shuning uchun bu funksiya main.tsx da, React
 * mount bo'lishidan avval chaqiriladi.
 */
export function isTelegramWebApp(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    if (window.Telegram?.WebApp) return true;
    if (window.TelegramWebviewProxy) return true;
    // `#tgWebAppData=...&tgWebAppPlatform=...`
    return /[?&#]tgWebApp(Data|Platform|Version)=/.test(window.location.href);
  } catch {
    return false;
  }
}

/**
 * Telegram'ning desktop mijozlari (`WebApp.platform` qiymatlari).
 *
 * Mobil qiymatlar: `android`, `android_x`, `ios`.
 * Noma'lum qiymat (`unknown` yoki kelajakdagi yangi platforma) desktop deb
 * HISOBLANMAYDI — ya'ni fullscreen chaqirilmaydi. Bu ataylab shunday:
 * foydalanuvchilarning aksariyati mobilda, shuning uchun shubha bo'lganda
 * xavfsiz (mobil) yo'lni tanlaymiz.
 */
const DESKTOP_PLATFORMS = new Set([
  'tdesktop', // Telegram Desktop (Windows / Linux)
  'macos',    // Telegram for macOS
  'web',      // web.telegram.org (eski)
  'weba',     // Web A
  'webk',     // Web K
  'unigram',  // Windows uchun uchinchi tomon mijozi
]);

function isDesktopTelegram(wa: TelegramWebAppApi): boolean {
  const platform = typeof wa.platform === 'string' ? wa.platform.toLowerCase() : '';
  return DESKTOP_PLATFORMS.has(platform);
}

/** SDK skriptini bir marta yuklaydi. */
function loadSdk(): Promise<void> {
  return new Promise((resolve, reject) => {
    if (window.Telegram?.WebApp) {
      resolve();
      return;
    }
    const existing = document.querySelector<HTMLScriptElement>(
      `script[src="${SDK_SRC}"]`,
    );
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true });
      existing.addEventListener('error', () => reject(new Error('tg_sdk')), { once: true });
      return;
    }
    const s = document.createElement('script');
    s.src = SDK_SRC;
    s.async = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('tg_sdk'));
    document.head.appendChild(s);
  });
}

/** Har bir chaqiruv alohida himoyalanadi: bittasi ishlamasa qolgani davom etsin. */
function safe(fn: (() => void) | undefined): void {
  if (typeof fn !== 'function') return;
  try {
    fn();
  } catch {
    /* qo'llab-quvvatlanmasa — jimgina o'tamiz */
  }
}

/**
 * Telegram ichida bo'lsa SDK ni yuklab, ilovani imkon qadar yoyadi.
 * Telegram'dan tashqarida chaqirilsa darhol qaytadi (hech narsa qilmaydi).
 */
export function initTelegramWebApp(): void {
  if (!isTelegramWebApp()) return;

  void loadSdk()
    .then(() => {
      const wa = window.Telegram?.WebApp;
      if (!wa) return;

      // Telegram'ga "ilova tayyor" deb bildiradi (yuklanish ekrani yopiladi).
      safe(wa.ready);

      // Mobilda yarim ekrandan to'liq balandlikka yoyadi. Desktopda ta'sirsiz.
      safe(wa.expand);

      /**
       * To'liq ekran — FAQAT DESKTOPDA (yuqoridagi izohga qarang: mobilda u
       * kontentni status bar va Telegram tugmalari ostiga kirgizib yuboradi).
       *
       * Uch qavat himoya: platforma → Bot API 8.0+ versiyasi → try/catch.
       */
      const supportsFullscreen =
        isDesktopTelegram(wa) &&
        typeof wa.isVersionAtLeast === 'function' &&
        wa.isVersionAtLeast('8.0');
      if (supportsFullscreen) safe(wa.requestFullscreen);

      /**
       * Test yechishda pastga surish Telegram oynasini yopib yubormasin.
       * Saytda savollar orasida surish (swipe) bor — ular to'qnashardi.
       * Bot API 7.7+; bo'lmasa jimgina o'tadi.
       */
      safe(wa.disableVerticalSwipes);
    })
    .catch(() => {
      /* SDK yuklanmadi — sayt oddiy holatda ishlayveradi */
    });
}
