import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { currentEntry, fetchLatestEntry, isSafeToReload, shouldReloadFor } from "@/lib/staleBuild";

/** Tab shuncha vaqt yashirin turgan bo'lsa, qaytganda yangi build tekshiriladi. */
const HIDDEN_CHECK_AFTER_MS = 5 * 60_000;
/** Ochiq turgan tabda davriy tekshiruv. */
const PERIODIC_CHECK_MS = 60 * 60_000;

/**
 * Ochiq qolgan eski tabni yangi deploy ga o'tkazadi (sabab — `lib/staleBuild.ts`).
 * Hech narsa chizmaydi.
 */
export function StaleBuildGuard() {
  const { pathname } = useLocation();
  const pathRef = useRef(pathname);
  const pendingRef = useRef<string | null>(null);

  const reloadIfSafe = (path: string) => {
    const target = pendingRef.current;
    if (!target || !isSafeToReload(path)) return;
    if (shouldReloadFor(target)) window.location.reload();
    else pendingRef.current = null;
  };

  // Test sahifasida topilgan yangilik — keyingi xavfsiz sahifaga o'tishda.
  useEffect(() => {
    pathRef.current = pathname;
    reloadIfSafe(pathname);
  }, [pathname]);

  useEffect(() => {
    const mine = currentEntry();
    if (!mine) return; // dev rejim

    let hiddenAt = document.visibilityState === "hidden" ? Date.now() : 0;
    let checking = false;

    const check = async () => {
      if (checking || pendingRef.current) return;
      checking = true;
      try {
        const latest = await fetchLatestEntry();
        if (latest && latest !== mine) {
          pendingRef.current = latest;
          reloadIfSafe(pathRef.current);
        }
      } finally {
        checking = false;
      }
    };

    const onVisibility = () => {
      if (document.visibilityState === "hidden") {
        hiddenAt = Date.now();
        return;
      }
      if (hiddenAt && Date.now() - hiddenAt >= HIDDEN_CHECK_AFTER_MS) void check();
      hiddenAt = 0;
    };

    document.addEventListener("visibilitychange", onVisibility);
    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void check();
    }, PERIODIC_CHECK_MS);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      window.clearInterval(timer);
    };
  }, []);

  return null;
}
