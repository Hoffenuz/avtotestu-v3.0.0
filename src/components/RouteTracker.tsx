import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { trackPageView } from "@/lib/track";

/**
 * Lazy sahifa va Helmet sarlavhani render'dan KEYIN qo'yadi — darhol
 * o'qilgan `document.title` oldingi sahifaniki bo'lib qolardi.
 */
const TITLE_SETTLE_MS = 400;

/**
 * Har client-side navigatsiyada GA'ga sahifa ko'rishni yuboradi.
 *
 * `BrowserRouter` ichida, `Routes` dan tashqarida joylashadi — shuning
 * uchun har qanday sahifa almashinuvida (til prefiksi, marshrut) ishlaydi
 * va o'zi hech narsa chizmaydi.
 *
 * BIRINCHI sahifa bu yerda YUBORILMAYDI: uni `index.html` dagi
 * `gtag('config', ...)` o'zi sanaydi (GA kechiktirib yuklanadi, u paytda
 * sarlavha ham to'g'ri). Ilgari ikkalasi ham yuborardi — har tashrifning
 * birinchi sahifasi GA'da ikki marta sanalardi (audit ENG-07).
 */
export function RouteTracker() {
  const location = useLocation();
  const isFirst = useRef(true);

  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }
    const path = location.pathname + location.search;
    const timer = window.setTimeout(() => trackPageView(path, document.title), TITLE_SETTLE_MS);
    return () => window.clearTimeout(timer);
  }, [location.pathname, location.search]);

  return null;
}
