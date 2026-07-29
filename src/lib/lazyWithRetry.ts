import { lazy, type ComponentType } from "react";

/**
 * React.lazy muammosi: dynamic import() bir marta rad etilsa, React o'sha
 * rad etilgan promise ni keshlaydi. Sekin/uzilgan internetda chunk yuklanmasa
 * route abadiy "Xatolik yuz berdi" holatida qolardi — sahifani qo'lda
 * yangilamaguncha tuzalmasdi.
 *
 * Bundan tashqari yangi deploy dan keyin eski index.html eski chunk hash
 * larini so'raydi va ular 404 beradi. Bu holatda bir marta hard reload
 * qilish kerak (sessionStorage bilan cheksiz sikldan himoyalangan).
 */

const RELOAD_FLAG = "chunk-reload-attempted";
const MAX_ATTEMPTS = 3;

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

async function importWithRetry<T>(factory: () => Promise<T>): Promise<T> {
  let lastErr: unknown;

  for (let attempt = 0; attempt < MAX_ATTEMPTS; attempt++) {
    try {
      const mod = await factory();
      // Muvaffaqiyat — keyingi deploy uchun bayroqni tozalaymiz
      try { sessionStorage.removeItem(RELOAD_FLAG); } catch { /* ignore */ }
      return mod;
    } catch (err) {
      lastErr = err;
      if (attempt < MAX_ATTEMPTS - 1) {
        await sleep(600 * 2 ** attempt + Math.random() * 250);
      }
    }
  }

  // Qayta urinishlar tugadi. Eski deploy chunk lari bo'lsa — bir marta reload.
  if (isChunkLoadError(lastErr)) {
    let alreadyTried = false;
    try {
      alreadyTried = sessionStorage.getItem(RELOAD_FLAG) === "1";
      if (!alreadyTried) sessionStorage.setItem(RELOAD_FLAG, "1");
    } catch {
      // sessionStorage yo'q (private mode) — reload qilmaymiz, sikl xavfi
      alreadyTried = true;
    }

    if (!alreadyTried) {
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
