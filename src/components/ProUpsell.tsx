// ============================================================================
// ProUpsell — test sahifalaridagi PRO taklifi (/test-ishlash, /variant)
// ----------------------------------------------------------------------------
// OQ FON, TINCH KO'RINISH (2026-09): ilgari to'q sariq ramkali banner, keyin
// siyoh karta edi — ikkalasi ham sahifaning asosiy harakatidan ("Testni
// boshlash") ko'proq e'tibor tortardi. Endi oddiy oq karta: och oltin
// ikonka, siyoh matn va o'ngda "Pro olish →" havolasi. Taklif ko'rinadi,
// lekin testdan chalg'itmaydi.
// ============================================================================

import { Link } from "react-router-dom";
import { ArrowRight, Crown } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

/**
 * `pending` — obuna holati hali aniqlanmagan: karta JOYINI egallaydi, lekin
 * ko'rinmaydi. PRO obunachiga bir lahza "PRO oling" ko'rsatmaslik uchun, va
 * holat kelganda pastdagi narsalar surilmasligi uchun (CLS).
 */
export function ProUpsell({ description, pending, className }: { description: string; pending?: boolean; className?: string }) {
  const { t } = useLanguage();

  return (
    <Link
      to="/pro"
      aria-hidden={pending || undefined}
      tabIndex={pending ? -1 : undefined}
      className={cn(
        "group flex items-center gap-3 rounded-2xl border border-border bg-card px-3.5 py-3 transition-colors sm:gap-4 sm:px-5 sm:py-4",
        "hover:border-amber-300 dark:hover:border-amber-500/40",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        pending && "invisible",
        className,
      )}
    >
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-600 dark:bg-amber-500/10 dark:text-amber-300 sm:h-10 sm:w-10"
        aria-hidden="true"
      >
        <Crown className="h-4 w-4 sm:h-5 sm:w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold leading-tight text-foreground sm:text-[15px]">{t("pro.testBannerTitle")}</span>
        <span className="mt-0.5 block text-[11px] leading-snug text-muted-foreground sm:text-sm">{description}</span>
      </span>
      <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap text-[11px] font-semibold text-primary dark:text-foreground sm:text-xs">
        {t("nav.getPro")}
        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
      </span>
    </Link>
  );
}
