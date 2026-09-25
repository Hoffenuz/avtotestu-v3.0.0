/**
 * Bosh sahifa hero'sidagi asosiy test tugmalari: "Test ishlash",
 * "Variantlar", "Mavzular".
 *
 * /bolimlar da BU TUGMALAR YO'Q (2026-09): u sahifa faqat bo'limlar
 * katalogi, test rejimlari bosh sahifadan boshlanadi.
 *
 * RANG VA SHAKL QOIDASI (sayt bo'ylab):
 *   * asosiy     — to'la siyoh (`bg-primary`), siyoh soya;
 *   * ikkilamchi — oq fon + 2px siyoh chegara + siyoh matn. Och/kulrang
 *     "tonal" tugma sinab ko'rilib rad etilgan: kulrang sahifada u
 *     o'chirilgan (disabled) tugmaga o'xshab qolardi;
 *   * burchak 8px (`rounded-lg`) — "tabletka" emas.
 *
 * PRO egasida "Variantlar" va "Mavzular" ham ASOSIY (to'la siyoh), ikonka
 * o'rnida oltin toj — aynan shu imkoniyatlar uchun to'lagan. Bepulda
 * "Mavzular" (to'liq PRO) burchagida "PRO" belgisi.
 *
 * CLS: obuna holati kelgach faqat RANG va bir xil o'lchamdagi ikonka
 * almashadi; "PRO" belgisi `absolute`. "Mavzular" tugmasi saqlangan sessiya
 * bo'lsa birinchi renderdayoq joy egallaydi.
 */
import { useState } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Crown, Grid3x3, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAccessState } from "@/hooks/useAccessState";
import { hasStoredSession } from "@/lib/hasStoredSession";
import { cn } from "@/lib/utils";

/** 60px — sahifaning asosiy urg'usi. `[&_svg]:size-*` Button'ning `size-4` ini bosadi. */
const SIZE = "h-[60px] w-full gap-2.5 px-8 text-lg sm:w-auto sm:min-w-[210px] [&_svg]:size-[22px]";

const PRIMARY = "shadow-lg shadow-primary/30 hover:bg-primary/90";
const OUTLINE =
  "border-2 border-primary bg-card text-primary shadow-sm hover:bg-primary/[0.05] hover:text-primary dark:bg-transparent dark:text-foreground dark:hover:bg-primary/15 dark:hover:text-foreground";

/** Tugma burchagidagi "PRO" — bo'lim PRO talab qilishini bildiradi. */
function ProTag() {
  return (
    <span className="pointer-events-none absolute -right-2 -top-2 rounded-md border border-amber-300/80 bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold uppercase leading-none tracking-wide text-amber-800 shadow-sm dark:border-amber-400/30 dark:bg-amber-950 dark:text-amber-200">
      PRO
    </span>
  );
}

export function MainTestButtons({ className }: { className?: string }) {
  const { user, isLoading: authLoading } = useAuth();
  const { t } = useLanguage();
  const { isPremium, loading: accessLoading, backendConfirmed } = useAccessState();
  const [expectsSession] = useState(hasStoredSession);

  const showMavzular = !!user || (authLoading && expectsSession);
  const base = cn("relative rounded-lg font-semibold", SIZE);
  const secondary = cn(base, isPremium ? PRIMARY : OUTLINE);

  return (
    <div className={cn("flex flex-col gap-3 sm:flex-row sm:flex-wrap", className)}>
      <Button asChild size="lg" className={cn(base, PRIMARY)}>
        <Link to="/test-ishlash">
          <Play className="shrink-0 fill-current" aria-hidden="true" />
          <span>{t("home.btnTest")}</span>
        </Link>
      </Button>

      <Button asChild size="lg" variant={isPremium ? "default" : "outline"} className={secondary}>
        <Link to="/variant">
          {isPremium ? (
            <Crown className="shrink-0 text-amber-300" aria-hidden="true" />
          ) : (
            <Grid3x3 className="shrink-0" aria-hidden="true" />
          )}
          <span>{t("home.btnVariantlar")}</span>
        </Link>
      </Button>

      {showMavzular && (
        <Button asChild size="lg" variant={isPremium ? "default" : "outline"} className={secondary}>
          <Link to="/mavzuli">
            {isPremium ? (
              <Crown className="shrink-0 text-amber-300" aria-hidden="true" />
            ) : (
              <BookOpen className="shrink-0" aria-hidden="true" />
            )}
            <span>{t("home.btnMavzuli")}</span>
            {!isPremium && !accessLoading && backendConfirmed && <ProTag />}
          </Link>
        </Button>
      )}
    </div>
  );
}
