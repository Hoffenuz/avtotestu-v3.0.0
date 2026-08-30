// ============================================================================
// BottomNav — mobil qurilmalar uchun pastki navigatsiya
// ----------------------------------------------------------------------------
// CLS HAQIDA MUHIM QAROR:
//   Ko'rinish `useIsMobile()` bilan EMAS, sof CSS (`md:hidden`) bilan
//   boshqariladi. Sabab: `useIsMobile()` birinchi renderda `false` qaytaradi
//   va effektdan keyin `true` ga o'tadi — panel kech paydo bo'lib, kontentni
//   surib yuborardi (CLS buziladi). CSS breakpoint esa birinchi bo'yashdayoq
//   to'g'ri ishlaydi.
//
//   Joy ham xuddi shunday CSS bilan ajratiladi — MainLayout dagi
//   `pb-[...] md:pb-0`. Ya'ni panel hech qachon kontent ustiga tushmaydi.
//
// TELEGRAM:
//   Telegram Mini App o'z pastki interfeysini chiqaradi va panel ustma-ust
//   tushadi. `isTelegramWebApp()` SINXRON ishlaydi (URL fragmentidan o'qiydi),
//   shuning uchun uni gate sifatida ishlatish CLS ga zarar qilmaydi.
//
// TEST PAYTIDA:
//   Test ekranida o'z savol navigatsiyasi bor — ikkitasi chalkashtiradi.
//   Test interfeysi `<body>` ga `test-active` klassini qo'yadi, panel esa
//   CSS orqali yashirinadi (index.css). React holati orqali emas — bu
//   ortiqcha qayta renderlarni oldini oladi.
// ============================================================================

import { memo } from "react";
import { NavLink } from "react-router-dom";
import { Home, LayoutGrid, PlayCircle, User } from "lucide-react";
import { isTelegramWebApp } from "@/lib/telegramWebApp";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

interface NavItem {
  to: string;
  labelKey: string;
  fallback: string;
  icon: typeof Home;
  /** Asosiy amal — vizual ajratiladi */
  primary?: boolean;
}

const ITEMS: readonly NavItem[] = [
  { to: "/", labelKey: "nav.home", fallback: "Bosh sahifa", icon: Home },
  { to: "/bolimlar", labelKey: "nav.sections", fallback: "Bo'limlar", icon: LayoutGrid },
  { to: "/test-ishlash", labelKey: "nav.test", fallback: "Test", icon: PlayCircle, primary: true },
  { to: "/profile", labelKey: "nav.profile", fallback: "Profil", icon: User },
];

function BottomNavImpl() {
  const { t } = useLanguage();

  /**
   * `t()` kalit topilmasa KALITNING O'ZINI qaytaradi (LanguageContext:50).
   * Shuning uchun `t(key) || fallback` ishlamaydi — kalit ham truthy satr.
   * Bu yerda aniq solishtiramiz: tarjima yo'q bo'lsa foydalanuvchi
   * `nav.sections` emas, o'qiladigan matn ko'radi.
   */
  const label = (key: string, fallback: string): string => {
    const value = t(key);
    return value === key ? fallback : value;
  };

  // Telegram ichida umuman chizilmaydi — sinxron tekshiruv, CLS ga xavfsiz.
  if (isTelegramWebApp()) return null;

  return (
    <nav
      aria-label={label("nav.bottomNavLabel", "Asosiy navigatsiya")}
      className={cn(
        "js-bottom-nav",
        "fixed inset-x-0 bottom-0 z-40 md:hidden",
        "border-t border-border bg-card/95 backdrop-blur",
        // iPhone "home indicator" ostida qolib ketmasin
        "pb-[env(safe-area-inset-bottom)]",
      )}
    >
      <ul className="mx-auto flex h-14 max-w-lg items-stretch">
        {ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.to} className="flex-1">
              <NavLink
                to={item.to}
                end={item.to === "/"}
                className={({ isActive }) =>
                  cn(
                    // Bosish maydoni kamida 44px — barmoq uchun qulay
                    "flex h-full min-h-[44px] flex-col items-center justify-center gap-0.5 px-1",
                    "text-[11px] leading-none transition-colors",
                    isActive
                      ? "text-primary font-semibold"
                      : "text-muted-foreground hover:text-foreground",
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <Icon
                      className={cn(
                        "h-5 w-5 shrink-0",
                        item.primary && !isActive && "text-primary",
                      )}
                      aria-hidden="true"
                    />
                    <span className="truncate max-w-full">
                      {label(item.labelKey, item.fallback)}
                    </span>
                  </>
                )}
              </NavLink>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export const BottomNav = memo(BottomNavImpl);
