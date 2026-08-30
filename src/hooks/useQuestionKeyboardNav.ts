import { useEffect } from "react";

/**
 * Klaviatura bilan savollar orasida o'tish: ← va →.
 *
 * NEGA KERAK:
 *   Desktopda sichqoncha bilan har safar tugmaga borish sekin. Mobilda
 *   surish (swipe) bor, desktopda esa hech narsa yo'q edi.
 *
 * MUHIM CHEKLOVLAR:
 *   * Matn maydonida (input / textarea / contenteditable) ishlamaydi —
 *     u yerda strelkalar kursorni suradi.
 *   * Modifikator bosilgan bo'lsa (Ctrl/Alt/Meta) ishlamaydi — brauzerning
 *     "orqaga/oldinga" kabi qisqartmalarini bo'g'ib qo'ymaslik uchun.
 *   * Faqat `enabled` bo'lganda ulanadi (masalan natijalar ekranida emas).
 */
export function useQuestionKeyboardNav(
  enabled: boolean,
  onPrev: () => void,
  onNext: () => void,
): void {
  useEffect(() => {
    if (!enabled) return;

    const handler = (e: KeyboardEvent) => {
      if (e.key !== "ArrowLeft" && e.key !== "ArrowRight") return;
      if (e.ctrlKey || e.altKey || e.metaKey || e.shiftKey) return;

      const el = e.target as HTMLElement | null;
      if (el) {
        const tag = el.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el.isContentEditable) {
          return;
        }
      }

      e.preventDefault();
      if (e.key === "ArrowLeft") onPrev();
      else onNext();
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [enabled, onPrev, onNext]);
}
