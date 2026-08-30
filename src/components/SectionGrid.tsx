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

import { Link } from "react-router-dom";
import { ChevronRight, Crown, Lock } from "lucide-react";
import { ACCENT_CLASS, type SectionItem } from "@/lib/siteSections";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAccessState } from "@/hooks/useAccessState";
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

/**
 * To'liq ekran so'rovi — bosish HODISASI ichida bajarilishi shart.
 *
 * Brauzer buni faqat foydalanuvchi harakati doirasida beradi. Maqsad
 * sahifasidan so'ralsa (navigatsiyadan keyin) rad etiladi, shuning uchun
 * aynan shu yerda chaqiriladi. SPA navigatsiyasi sahifani qayta
 * yuklamagani uchun to'liq ekran keyingi sahifada ham saqlanib qoladi.
 *
 * Rad etilsa (iOS Safari qo'llab-quvvatlamaydi) hech narsa buzilmaydi:
 * imtihon ekrani baribir butun oynani egallaydi.
 */
function requestFullscreen(): void {
  try {
    if (document.fullscreenElement) return;
    void document.documentElement.requestFullscreen?.().catch(() => {
      /* qo'llab-quvvatlanmaydi — muhim emas */
    });
  } catch {
    /* eski brauzer */
  }
}

export function SectionGrid({
  items,
  badges,
  signedIn = true,
  showDescription = false,
}: SectionGridProps) {
  const { t } = useLanguage();
  const { isPremium } = useAccessState();

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
              onClick={item.fullscreenOnOpen ? requestFullscreen : undefined}
              className={cn(
                "group flex h-full items-center gap-3 rounded-xl border border-border bg-card",
                "transition-colors",
                "hover:border-primary/40 hover:bg-accent",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                showDescription ? "gap-4 px-4 py-4 sm:px-5 sm:py-5" : "px-3.5 py-3",
              )}
            >
              <span
                className={cn(
                  "flex shrink-0 items-center justify-center rounded-lg",
                  ACCENT_CLASS[item.accent],
                  showDescription ? "h-11 w-11 rounded-xl sm:h-12 sm:w-12" : "h-9 w-9",
                )}
                aria-hidden="true"
              >
                <Icon className={showDescription ? "h-5 w-5 sm:h-6 sm:w-6" : "h-[18px] w-[18px]"} />
              </span>

              <span className="min-w-0 flex-1">
                <span
                  className={cn(
                    "block truncate font-semibold text-foreground",
                    showDescription ? "text-[15px] sm:text-base" : "text-sm",
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
              {item.requiresPro && !isPremium ? (
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
                className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </Link>
          </li>
        );
      })}
    </ul>
  );
}
