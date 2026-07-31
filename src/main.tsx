import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.tsx";
import "./index.css";

/**
 * index.html dagi deploy guard ga "bundle yuklandi va ishga tushdi" deb
 * xabar beradi. Bu chaqirilmasa guard oq ekran deb hisoblab, bir marta
 * cache-bust reload qiladi (eski keshlangan index.html holati).
 */
function markBooted() {
  (window as unknown as { __APP_BOOTED__?: () => void }).__APP_BOOTED__?.();
}

// Apex ↔ www localStorage ajraladi — sessiya "yo'qoladi". Brauzerda ham www ga majburan.
if (typeof window !== "undefined" && window.location.hostname === "avtotestu.uz") {
  // Sahifa baribir tark etilyapti — guard ni "oq ekran" deb yanglishmasin.
  markBooted();
  const { pathname, search, hash } = window.location;
  window.location.replace(`https://www.avtotestu.uz${pathname}${search}${hash}`);
} else {
  createRoot(document.getElementById("root")!).render(
    <HelmetProvider>
      <App />
    </HelmetProvider>
  );
  // Bu satrga yetdik ⇒ entry bundle yuklandi va bajarildi.
  markBooted();
}
