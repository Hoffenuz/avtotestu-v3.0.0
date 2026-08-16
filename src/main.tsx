import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.tsx";
import { initTelegramWebApp } from "./lib/telegramWebApp";
import "./index.css";

// Apex ↔ www localStorage ajraladi — sessiya "yo'qoladi". Brauzerda ham www ga majburan.
if (typeof window !== "undefined" && window.location.hostname === "avtotestu.uz") {
  const { pathname, search, hash } = window.location;
  window.location.replace(`https://www.avtotestu.uz${pathname}${search}${hash}`);
} else {
  /**
   * Telegram Mini App sozlamasi — React mount BO'LISHIDAN OLDIN.
   *
   * Telegram ishga tushirish parametrlarini URL fragmentiga qo'yadi
   * (`#tgWebAppData=...`). React Router yoki boshqa kod fragmentga
   * tegishidan avval o'qib olishimiz kerak.
   *
   * Telegram'dan tashqarida bu funksiya darhol qaytadi: skript ham
   * yuklanmaydi, ya'ni oddiy foydalanuvchiga hech qanday ta'siri yo'q.
   */
  initTelegramWebApp();

  createRoot(document.getElementById("root")!).render(
    <HelmetProvider>
      <App />
    </HelmetProvider>
  );

  /**
   * ISHGA TUSHISH TIKLANISHINI O'CHIRAMIZ.
   *
   * `index.html` dagi skript asset yuklanmasa sahifani bir marta
   * `?_cb=...` bilan qayta yuklaydi. Bu FAQAT ishga tushishdan oldin
   * kerak. Bu qator bajarilayotgan bo'lsa — asosiy bundle yuklandi,
   * demak uning vazifasi tugadi.
   *
   * Ikki sabab:
   *
   * 1) U `<link rel="modulepreload">` xatolarini ham ushlaydi. Ilova
   *    ishlaganda lazy chunk uzilib qolsa, u DARHOL reload qilib
   *    `lazyWithRetry` ning qayta urinishlarini kesib tashlardi.
   *
   * 2) `rl` bayrog'i hech qachon tozalanmasdi. Ya'ni bir marta tiklanish
   *    ishlagach, o'sha sessiyada boshqa hech qanday tiklanish
   *    ishlamasdi — foydalanuvchi bo'sh ekranda qolib ketardi.
   *    (Aynan shu holat: `?_cb=` li manzilda qotib qolish.)
   */
  window.__bootRecoveryArmed = false;
  try {
    sessionStorage.removeItem("rl");
  } catch {
    /* private rejim — muhim emas */
  }
}
