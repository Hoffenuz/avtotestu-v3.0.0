import { lazy, type ComponentType } from "react";

/**
 * React.lazy muammosi: dynamic import() bir marta rad etilsa, React o'sha
 * rad etilgan promise ni keshlaydi. Sekin/uzilgan internetda chunk yuklanmasa
 * route abadiy "Xatolik yuz berdi" holatida qolardi — sahifani qo'lda
 * yangilamaguncha tuzalmasdi.
 *
 * Bundan tashqari yangi deploy dan keyin eski index.html eski chunk hash
 * larini so'raydi va ular 404 beradi. Bu holatda bir marta hard reload
 * qilish kerak (storage bayrog'i bilan cheksiz sikldan himoyalangan).
 *
 * ENG OG'IR HOLAT — Payme'dan qaytish (real foydalanuvchi shikoyati):
 *   Payme ilovasi/sahifasidan qaytish har doim TO'LIQ sahifa yuklanishi.
 *   Mobil qurilma tashqi ilovadan qaytganda radio (tarmoq) bir necha soniya
 *   "uyg'onadi". Aynan shu payt /profile chunki so'raladi va uzilib qoladi:
 *     "Failed to fetch dynamically imported module: .../assets/Profile-*.js"
 *   Ilgari bu yerda ikki kamchilik bor edi:
 *     1. Qayta urinish byudjeti atigi ~1.8 s edi — radio ulanib ulgurmasdi.
 *     2. sessionStorage bloklangan bo'lsa (Telegram/Payme ichki brauzeri,
 *        private rejim) `alreadyTried = true` bo'lib, avtomatik reload
 *        UMUMAN ishlamasdi — foydalanuvchi darhol xato ekranini ko'rardi.
 */

const RELOAD_FLAG = "chunk-reload-attempted";

/** Radio ulanishiga ulgurish uchun: 5 urinish, jami ~7 soniya. */
const MAX_ATTEMPTS = 5;

/** Bayroq shuncha vaqtdan keyin o'z-o'zidan eskiradi (localStorage yo'li). */
const RELOAD_FLAG_TTL_MS = 60_000;

/** Tarmoq qaytishini kutishning yuqori chegarasi. */
const OFFLINE_WAIT_MS = 6_000;

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function isChunkLoadError(err: unknown): boolean {
  const msg = err instanceof Error ? err.message : String(err);
  return (
    /Failed to fetch dynamically imported module/i.test(msg) ||
    /Importing a module script failed/i.test(msg) ||
    /error loading dynamically imported module/i.test(msg) ||
    /ChunkLoadError/i.test(msg)
  );
}

/**
 * Reload bayrog'i ikki joyda: sessionStorage (asosiy) va localStorage
 * (zaxira). Ichki brauzerlarda ko'pincha bittasi ishlaydi — ikkalasi ham
 * bloklangandagina reload dan voz kechamiz (cheksiz sikl xavfi).
 */
function readReloadFlag(): boolean {
  try {
    if (sessionStorage.getItem(RELOAD_FLAG) === "1") return true;
  } catch { /* ishlamasa keyingisiga o'tamiz */ }
  try {
    const at = Number(localStorage.getItem(RELOAD_FLAG));
    if (at && Date.now() - at < RELOAD_FLAG_TTL_MS) return true;
  } catch { /* ignore */ }
  return false;
}

/** Bayroqni yozadi. `false` = hech qaysi storage ishlamadi (reload xavfli). */
function writeReloadFlag(): boolean {
  let persisted = false;
  try {
    sessionStorage.setItem(RELOAD_FLAG, "1");
    persisted = true;
  } catch { /* ignore */ }
  try {
    localStorage.setItem(RELOAD_FLAG, String(Date.now()));
    persisted = true;
  } catch { /* ignore */ }
  return persisted;
}

function clearReloadFlag(): void {
  try { sessionStorage.removeItem(RELOAD_FLAG); } catch { /* ignore */ }
  try { localStorage.removeItem(RELOAD_FLAG); } catch { /* ignore */ }
}

/**
 * Brauzer o'zini oflayn deb bilsa — bekorga urinmaymiz, `online` hodisasini
 * kutamiz. Tashqi ilovadan (Payme) qaytgan mobil qurilmada aynan shu holat
 * bo'ladi va bu kutish qayta urinishlarni behuda sarflamaydi.
 */
async function waitForOnline(): Promise<void> {
  if (typeof navigator === "undefined" || navigator.onLine !== false) return;

  await new Promise<void>((resolve) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      clearTimeout(timer);
      window.removeEventListener("online", finish);
      resolve();
    };
    const timer = setTimeout(finish, OFFLINE_WAIT_MS);
    window.addEventListener("online", finish, { once: true });
  });
}

async function importWithRetry<T>(factory: () => Promise<T>): Promise<T> {
  let lastErr: unknown;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    try {
      const mod = await factory();
      // Muvaffaqiyat — keyingi deploy uchun bayroqni tozalaymiz
      clearReloadFlag();
      return mod;
    } catch (err) {
      lastErr = err;
      if (attempt < MAX_ATTEMPTS - 1) {
        // Oflayn bo'lsa avval tarmoqni kutamiz (kutish qayta urinishdan
        // ustun — aks holda 5 ta urinish ham bir zumda yonib ketardi).
        await waitForOnline();
        // 400 → 800 → 1600 → 3200 ms (+ jitter) ≈ jami 7 s
        await sleep(400 * 2 ** attempt + Math.random() * 250);
      }
    }
  }

  // Qayta urinishlar tugadi. Eski deploy chunk lari bo'lsa — bir marta reload.
  if (isChunkLoadError(lastErr)) {
    if (!readReloadFlag() && writeReloadFlag()) {
      window.location.reload();
      // Reload boshlanguncha ErrorBoundary chiqmasligi uchun osilib turamiz
      await new Promise(() => { /* never resolves */ });
    }
  }

  throw lastErr;
}

/** lazy() o'rniga — qayta urinish va deploy-mos reload bilan */
export function lazyWithRetry<T extends ComponentType<unknown>>(
  factory: () => Promise<{ default: T }>,
) {
  return lazy(() => importWithRetry(factory));
}
