// ============================================================================
// ProUpsell — test sahifalaridagi PRO taklifi
// ----------------------------------------------------------------------------
// Bosh sahifadagi PRO kartasining ixcham nusxasi: siyoh fon, oltin toj, oq
// tugma. Ilgari /test-ishlash da to'q sariq ramkali, /variant da sariq
// gradientli banner edi — sayt uslubidan ajralib turardi.
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
        "group flex items-center gap-3 rounded-2xl bg-brand px-3.5 py-3 text-brand-foreground sm:gap-4 sm:px-5 sm:py-4",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        pending && "invisible",
        className,
      )}
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/10 sm:h-11 sm:w-11" aria-hidden="true">
        <Crown className="h-4 w-4 text-amber-300 sm:h-5 sm:w-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-bold leading-tight sm:text-base">{t("pro.testBannerTitle")}</span>
        <span className="mt-0.5 block text-[11px] leading-snug text-white/75 sm:text-sm">{description}</span>
      </span>
      <span className="inline-flex shrink-0 items-center gap-1 whitespace-nowrap rounded-lg bg-white px-3 py-1.5 text-[11px] font-semibold text-[#131A45] transition-colors group-hover:bg-white/90 sm:text-xs">
        {t("nav.getPro")}
        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
      </span>
    </Link>
  );
}
