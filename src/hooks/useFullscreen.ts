import { useState, useEffect, useCallback } from "react";

export function useFullscreen() {
  const [isFullscreen, setIsFullscreen] = useState(false);

  const toggleFullscreen = useCallback(() => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  }, []);

  /**
   * To'liq ekranga kirish.
   *
   * Brauzer buni faqat foydalanuvchi harakati doirasida beradi. Bosishdan
   * keyin qisqa "o'tuvchi faollik" oynasi qoladi, shuning uchun test
   * yuklanib bo'lgach chaqirilsa ko'p holatda ishlaydi. Rad etilsa hech
   * narsa buzilmaydi: imtihon ekrani `fixed inset-0` bilan baribir butun
   * oynani egallaydi va sarlavhada qo'lda yoqish tugmasi turadi.
   */
  const enterFullscreen = useCallback(() => {
    if (document.fullscreenElement) return;
    try {
      void document.documentElement.requestFullscreen?.()
        .then(() => setIsFullscreen(true))
        .catch(() => { /* qo'llab-quvvatlanmaydi yoki rad etildi */ });
    } catch { /* eski brauzer */ }
  }, []);

  const exitFullscreen = useCallback(() => {
    if (document.fullscreenElement) {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  }, []);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () => document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  return { isFullscreen, toggleFullscreen, enterFullscreen, exitFullscreen };
}
