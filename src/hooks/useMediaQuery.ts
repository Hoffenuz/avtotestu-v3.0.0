import { useSyncExternalStore } from "react";

/**
 * CSS media query holati — birinchi renderdayoq to'g'ri qiymat (sinxron),
 * ekran o'lchami o'zgarsa yangilanadi.
 *
 * NEGA `hidden lg:block` YETMAYDI: CSS elementni faqat ko'rinmas qiladi —
 * komponent baribir ishlaydi (effektlar, tarmoq so'rovlari). Faqat desktopda
 * kerak bo'lgan og'irroq qismlarni telefonda umuman chizmaslik uchun.
 */
export function useMediaQuery(query: string): boolean {
  return useSyncExternalStore(
    (onChange) => {
      if (typeof window === "undefined" || typeof window.matchMedia !== "function") return () => {};
      const mql = window.matchMedia(query);
      mql.addEventListener("change", onChange);
      return () => mql.removeEventListener("change", onChange);
    },
    () => (typeof window !== "undefined" && typeof window.matchMedia === "function" ? window.matchMedia(query).matches : false),
    () => false,
  );
}
