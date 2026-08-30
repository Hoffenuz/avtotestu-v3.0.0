import { useCallback, useSyncExternalStore } from "react";

/**
 * Sayt bo'ylab yagona dark mode holati.
 *
 * ILGARI QANDAY EDI VA NEGA MUAMMO:
 *   Har bir komponent o'z `useState` iga ega edi va `useEffect` ning
 *   TOZALASH funksiyasi `document.documentElement` dan `dark` klassini
 *   OLIB TASHLARDI. Natijada:
 *     * testdan chiqqan zahoti dark mode yo'qolardi;
 *     * /bolimlar, bosh sahifa kabi sahifalarda dark mode umuman yo'q edi;
 *     * bir vaqtda ikkita komponent mount bo'lsa, holatlar ajralib ketardi.
 *
 * ENDI:
 *   Holat modul darajasida saqlanadi va `useSyncExternalStore` orqali
 *   barcha komponentlarga bir xil qiymat beriladi. Klass faqat holat
 *   o'zgarganda yoziladi, unmount da olib tashlanmaydi.
 *
 * BOSHLANG'ICH QO'LLASH:
 *   `index.html` dagi kichik skript sahifa chizilishidan OLDIN klassni
 *   qo'yadi — aks holda dark rejimda sayt bir lahza oq bo'lib "chaqnaydi".
 */

const STORAGE_KEY = "darkMode";

function readStored(): boolean {
  try {
    return localStorage.getItem(STORAGE_KEY) === "true";
  } catch {
    return false;
  }
}

let isDarkState = typeof document !== "undefined"
  ? document.documentElement.classList.contains("dark")
  : false;

const listeners = new Set<() => void>();

function applyClass(next: boolean): void {
  if (typeof document === "undefined") return;
  document.documentElement.classList.toggle("dark", next);
}

function setDark(next: boolean): void {
  if (next === isDarkState) return;
  isDarkState = next;
  try {
    localStorage.setItem(STORAGE_KEY, String(next));
  } catch {
    /* private rejim — muhim emas */
  }
  applyClass(next);
  for (const listener of listeners) listener();
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot(): boolean {
  return isDarkState;
}

/**
 * Ilova ishga tushganda bir marta chaqiriladi (main.tsx).
 * `index.html` skripti klassni allaqachon qo'ygan bo'lishi mumkin —
 * shu holatda hech narsa o'zgarmaydi.
 */
export function initDarkMode(): void {
  const stored = readStored();
  isDarkState = stored;
  applyClass(stored);
}

export function useDarkMode() {
  const isDark = useSyncExternalStore(subscribe, getSnapshot, () => false);
  const toggle = useCallback(() => setDark(!getSnapshot()), []);
  return { isDark, toggle, setDark };
}
