import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { trackPageView } from "@/lib/track";

/**
 * Har client-side navigatsiyada GA'ga sahifa ko'rishni yuboradi.
 *
 * `BrowserRouter` ichida, `Routes` dan tashqarida joylashadi — shuning
 * uchun har qanday sahifa almashinuvida (til prefiksi, marshrut) ishlaydi
 * va o'zi hech narsa chizmaydi.
 */
export function RouteTracker() {
  const location = useLocation();

  useEffect(() => {
    trackPageView(location.pathname + location.search, document.title);
  }, [location.pathname, location.search]);

  return null;
}
