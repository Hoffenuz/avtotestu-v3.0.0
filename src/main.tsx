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
}
