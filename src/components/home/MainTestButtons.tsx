/**
 * Bosh sahifa hero'sidagi asosiy test tugmalari: "Test ishlash",
 * "Variantlar", "Mavzular".
 *
 * /bolimlar da BU TUGMALAR YO'Q (2026-09): u sahifa faqat bo'limlar
 * katalogi, test rejimlari bosh sahifadan boshlanadi.
 *
 * RANG VA SHAKL (egasining qarori, 2026-09-28):
 *   * "Test ishlash" — YASHIL (gradient, oq matn). Ilgari uchala tugma
 *     to'la siyoh edi — ayniqsa PRO'da uchta og'ir qora blok "bosma"
 *     degandek salbiy ta'sir qilardi. Yashil — "boshlash, oldinga" signali
 *     va sahifadagi yagona to'la rangli tugma, shuning uchun asosiy harakat
 *     aniq. Matn kontrasti uchun och yashil emas, emerald-600→700.
 *   * "Variantlar" / "Mavzular" — OQ karta-tugma: ingichka chegara, siyoh
 *     matn, chapda rangli ikonka "chipi". Bosilishi aniq (soya, hover'da
 *     ko'tariladi), lekin asosiy tugma bilan e'tibor talashmaydi.
 *   * PRO egasida ikonka chipi OLTIN (toj) — "siz uchun ochiq" degan
 *     ijobiy signal; tugmalar qoraymaydi. Bepulda "Mavzular" burchagida
 *     "PRO" belgisi.
 *
 * CLS: obuna holati kelgach faqat ikonka va chip rangi almashadi (o'lcham
 * bir xil); "PRO" belgisi `absolute`. "Mavzular" tugmasi saqlangan sessiya
 * bo'lsa birinchi renderdayoq joy egallaydi.
 */
import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Crown, Grid3x3, Play } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAccessState } from "@/hooks/useAccessState";
import { hasStoredSession } from "@/lib/hasStoredSession";
import { cn } from "@/lib/utils";

/** 60px — sahifaning asosiy urg'usi. */
const BASE =
  "group relative inline-flex h-[60px] w-full items-center justify-center gap-3 rounded-xl px-6 text-lg font-semibold " +
  "transition-[transform,box-shadow,background-color,border-color] duration-200 ease-out motion-safe:hover:-translate-y-0.5 " +
  "active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 " +
  "sm:w-auto sm:min-w-[210px]";

const PRIMARY =
  "bg-gradient-to-b from-emerald-600 to-emerald-700 text-white " +
  "shadow-[0_8px_20px_-6px_rgba(5,150,105,0.55),inset_0_1px_0_rgba(255,255,255,0.18)] " +
  "hover:from-emerald-500 hover:to-emerald-700 hover:shadow-[0_12px_26px_-8px_rgba(5,150,105,0.6),inset_0_1px_0_rgba(255,255,255,0.18)]";

const SECONDARY =
  "border border-border bg-card text-foreground shadow-sm " +
  "hover:border-primary/30 hover:shadow-md dark:hover:border-primary/60";

/** Ikonka chipi — tugma ichida chapda. */
function IconChip({ tone, children }: { tone: "blue" | "indigo" | "gold"; children: ReactNode }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors [&_svg]:h-[18px] [&_svg]:w-[18px]",
        tone === "blue" && "bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300",
        tone === "indigo" && "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300",
        tone === "gold" && "bg-amber-50 text-amber-500 ring-1 ring-amber-200 dark:bg-amber-400/10 dark:text-amber-300 dark:ring-amber-400/25",
      )}
    >
      {children}
    </span>
  );
}

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

  return (
    <div className={cn("flex flex-col gap-3 sm:flex-row sm:flex-wrap", className)}>
      <Link to="/test-ishlash" className={cn(BASE, PRIMARY, "font-bold")}>
        <Play className="h-[22px] w-[22px] shrink-0 fill-current" aria-hidden="true" />
        <span>{t("home.btnTest")}</span>
      </Link>

      <Link to="/variant" className={cn(BASE, SECONDARY)}>
        <IconChip tone={isPremium ? "gold" : "blue"}>{isPremium ? <Crown /> : <Grid3x3 />}</IconChip>
        <span>{t("home.btnVariantlar")}</span>
      </Link>

      {showMavzular && (
        <Link to="/mavzuli" className={cn(BASE, SECONDARY)}>
          <IconChip tone={isPremium ? "gold" : "indigo"}>{isPremium ? <Crown /> : <BookOpen />}</IconChip>
          <span>{t("home.btnMavzuli")}</span>
          {!isPremium && !accessLoading && backendConfirmed && <ProTag />}
        </Link>
      )}
    </div>
  );
}
