// ============================================================================
// SectionGrid — bo'lim plitkalari
// ----------------------------------------------------------------------------
// DIZAYN QARORLARI:
//   * Ixcham plitka: rangli ikonka + qisqa nom. Uzun tavsifli katta
//     kartochkalarni ko'z ketma-ket o'qishga majbur bo'ladi, ixchamlarini
//     esa bir qarashda skanerlaydi.
//   * Har bir plitka o'z rangida — bir xil rangli to'r bir tekis "devor"
//     bo'lib ko'rinadi va elementlar ajralmaydi.
//   * Kirish talab qiladigan bo'limlar kirmagan foydalanuvchiga ham
//     ko'rsatiladi, lekin QULF belgisi bilan. Yashirish "sayt kambag'al"
//     degan taassurot qoldirardi.
//
// DARK MODE: faqat tema tokenlari (`bg-card`, `text-foreground`, `border-border`).
// ============================================================================

import { useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Crown, Lock } from "lucide-react";
import { ACCENT_CLASS, type SectionItem } from "@/lib/siteSections";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAccessState } from "@/hooks/useAccessState";
import { hasStoredSession } from "@/lib/hasStoredSession";
import { cn } from "@/lib/utils";

interface SectionGridProps {
  items: readonly SectionItem[];
  /** Bo'lim yonidagi son (masalan xato javoblar soni). */
  badges?: Record<string, number>;
  /** Kirish talab qiladigan bo'limlarda qulf ko'rsatiladimi. */
  signedIn?: boolean;
  /**
   * Nom ostida qisqa tavsif ko'rsatiladimi va plitka kattaroq bo'ladimi.
   *
   * `/bolimlar` uchun `true`: u ro'yxatning O'ZI bo'lgan sahifa, plitkalar
   * bo'sh joyni to'ldirishi va nima ish qilishini aytib turishi kerak.
   * Bosh sahifadagi tezkor plitkalar uchun `false` — u yerda ular sahifaning
   * kichik bir qismi, tavsif esa e'tiborni bo'lardi.
   */
  showDescription?: boolean;
}

export function SectionGrid({
  items,
  badges,
  signedIn = true,
  showDescription = false,
}: SectionGridProps) {
  const { t } = useLanguage();
  const { isPremium, backendConfirmed } = useAccessState();

  /**
   * PRO belgisi qachon chizilishi mumkin.
   *
   * Muammo: PRO foydalanuvchi sahifani ochganda `isPremium` bir lahza `false`
   * bo'lib turadi (RPC hali javob bermagan) va u O'ZI SOTIB OLGAN bo'limlarda
   * "PRO" qulfini ko'radi — keyin belgi g'oyib bo'ladi. Bu "yaltillash" pullik
   * mijozga "obunam ishlamayaptimi?" degan shubha beradi.
   *
   * Yechim `Home.tsx` dagi bilan bir xil: saqlangan sessiya BOR bo'lsa,
   * serverdan tasdiq kelguncha belgi chizilmaydi. Mehmonda (saqlangan sessiya
   * yo'q) kutish umuman yo'q — belgi darhol ko'rinadi, chunki mehmon hech
   * qachon PRO bo'lmaydi.
   */
  const [expectsSession] = useState(hasStoredSession);
  const proBadgeReady = backendConfirmed || !expectsSession;

  return (
    <ul
      className={cn(
        "grid grid-cols-1 gap-2.5",
        showDescription
          ? // Ikki ustun: yetti plitka to'rt qatorga tushadi va sahifa
            // balandligini to'ldiradi (uch ustunda pastda bo'shliq qolardi).
            "sm:grid-cols-2 sm:gap-3.5"
          : "sm:grid-cols-2 lg:grid-cols-3",
      )}
    >
      {items.map((item) => {
        const Icon = item.icon;
        const badge = badges?.[item.to];
        const locked = Boolean(item.requiresAuth) && !signedIn;

        return (
          <li key={item.to}>
            <Link
              to={item.to}
              className={cn(
                "group flex h-full items-center gap-3 rounded-xl border border-border bg-card",
                "transition-all",
                "hover:border-primary/40 hover:bg-accent hover:shadow-md hover:-translate-y-0.5",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                showDescription ? "gap-4 px-4 py-4 sm:px-5 sm:py-5" : "gap-3.5 px-4 py-4 sm:px-5 sm:py-5",
              )}
            >
              <span
                className={cn(
                  "flex shrink-0 items-center justify-center rounded-lg",
                  ACCENT_CLASS[item.accent],
                  showDescription ? "h-11 w-11 rounded-xl sm:h-12 sm:w-12" : "h-12 w-12 rounded-xl sm:h-14 sm:w-14",
                )}
                aria-hidden="true"
              >
                <Icon className={showDescription ? "h-5 w-5 sm:h-6 sm:w-6" : "h-6 w-6 sm:h-7 sm:w-7"} />
              </span>

              <span className="min-w-0 flex-1">
                <span
                  className={cn(
                    "block truncate font-semibold text-foreground",
                    showDescription ? "text-[15px] sm:text-base" : "text-base font-bold sm:text-lg",
                  )}
                >
                  {t(item.titleKey)}
                </span>
                {showDescription ? (
                  <span className="mt-0.5 block text-xs leading-snug text-muted-foreground sm:text-[13px]">
                    {t(item.descKey)}
                  </span>
                ) : null}
              </span>

              {/*
                PRO belgisi qulfdan OLDIN: kirmagan foydalanuvchi uchun ham
                muhimrog'i bo'lim pullik ekani, kirish esa ikkinchi shart.
              */}
              {item.requiresPro && !isPremium && proBadgeReady ? (
                <span
                  className="flex shrink-0 items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-bold text-amber-600 dark:text-amber-400"
                  title={t("sections.proOnly")}
                >
                  <Crown className="h-3 w-3" aria-hidden="true" />
                  PRO
                </span>
              ) : locked ? (
                <Lock
                  className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
                  aria-label={t("sections.locked")}
                />
              ) : badge ? (
                <span
                  className="shrink-0 rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground"
                  aria-label={`${badge} ta`}
                >
                  {badge > 99 ? "99+" : badge}
                </span>
              ) : null}

              <ChevronRight
                className={cn(
                  "shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5",
                  showDescription ? "h-4 w-4" : "h-5 w-5",
                )}
                aria-hidden="true"
              />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
