import { createRoot } from "react-dom/client";
import { HelmetProvider } from "react-helmet-async";
import App from "./App.tsx";
import "./index.css";

// Apex ↔ www localStorage ajraladi — sessiya "yo'qoladi". Brauzerda ham www ga majburan.
if (typeof window !== "undefined" && window.location.hostname === "avtotestu.uz") {
  const { pathname, search, hash } = window.location;
  window.location.replace(`https://www.avtotestu.uz${pathname}${search}${hash}`);
} else {
  createRoot(document.getElementById("root")!).render(
    <HelmetProvider>
      <App />
    </HelmetProvider>
  );
}
