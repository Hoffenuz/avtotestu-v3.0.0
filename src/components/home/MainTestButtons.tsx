/**
 * Bosh sahifa hero'sidagi asosiy test tugmalari: "Test ishlash",
 * "Variantlar", "Mavzular".
 *
 * /bolimlar da BU TUGMALAR YO'Q (2026-09): u sahifa faqat bo'limlar
 * katalogi, test rejimlari bosh sahifadan boshlanadi.
 *
 * RANG VA SHAKL (egasining qarori, 2026-09-28):
 *   * "Test ishlash" — YORQIN YASHIL, saytning `cta-green` tokeni (avvalgi
 *     dizayndagi yashil, #22C55E) → `cta-green-hover` gradienti, oq qalin
 *     matn + yengil matn soyasi (och yashil ustida o'qilishi uchun).
 *     Ilgari uchala tugma to'la siyoh edi — ayniqsa PRO'da uchta og'ir qora
 *     blok "bosma" degandek salbiy ta'sir qilardi. To'q (emerald-700)
 *     variant ham sinab ko'rilib rad etilgan — xira ko'rinardi.
 *   * "Variantlar" / "Mavzular" — OQ karta-tugma, lekin 2px RANGLI chegara
 *     (ko'k / indigo) va shu rangdagi ikonka chipi. Ingichka kulrang
 *     chegara sinab ko'rilgan — tugmalar fon bilan qo'shilib, "ko'rinmay"
 *     qolardi.
 *   * PRO egasida ham RANG O'ZGARMAYDI (ko'k / indigo). Oltin (sariq)
 *     chegara sinab ko'rilgan — noqulay ko'rinardi (egasi, 2026-09-28);
 *     to'la siyoh esa "bosma" degandek salbiy edi. Bepulda "Mavzular"
 *     burchagida "PRO" belgisi, PRO egasida u yo'q.
 *
 * CLS: obuna holati kelgach faqat ikonka va chip rangi almashadi (o'lcham
 * bir xil); "PRO" belgisi `absolute`. "Mavzular" tugmasi saqlangan sessiya
 * bo'lsa birinchi renderdayoq joy egallaydi.
 */
import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Grid3x3, Play } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAccessState } from "@/hooks/useAccessState";
import { hasStoredSession } from "@/lib/hasStoredSession";
import { cn } from "@/lib/utils";

/** 60px — sahifaning asosiy urg'usi. */
const BASE =
  "group relative inline-flex h-[60px] w-full items-center justify-center gap-3 rounded-xl px-6 text-lg font-semibold " +
  "transition-[transform,box-shadow,border-color,filter] duration-200 ease-out motion-safe:hover:-translate-y-0.5 " +
  "active:translate-y-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 " +
  "sm:w-auto sm:min-w-[210px]";

const PRIMARY =
  "bg-gradient-to-b from-cta-green to-cta-green-hover text-white [text-shadow:0_1px_1px_rgba(0,0,0,0.22)] " +
  "shadow-[0_8px_20px_-6px_rgba(34,197,94,0.6),inset_0_1px_0_rgba(255,255,255,0.25)] " +
  "hover:brightness-105 hover:shadow-[0_12px_26px_-8px_rgba(34,197,94,0.65),inset_0_1px_0_rgba(255,255,255,0.25)]";

type Tone = "blue" | "indigo";

/** Har rang uchun: tugma chegarasi (+hover) va ikonka chipi. Bitta joyda — mos kelmay qolmasin. */
const TONES: Record<Tone, { border: string; chip: string }> = {
  blue: {
    border: "border-blue-500/55 hover:border-blue-500 dark:border-blue-400/45 dark:hover:border-blue-400",
    chip: "bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300",
  },
  indigo: {
    border: "border-indigo-500/55 hover:border-indigo-500 dark:border-indigo-400/45 dark:hover:border-indigo-400",
    chip: "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300",
  },
};

const SECONDARY = "border-2 bg-card text-foreground shadow-sm hover:shadow-md";

/** Ikonka chipi — tugma ichida chapda. */
function IconChip({ tone, children }: { tone: Tone; children: ReactNode }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg [&_svg]:h-[18px] [&_svg]:w-[18px]",
        TONES[tone].chip,
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

      <Link to="/variant" className={cn(BASE, SECONDARY, TONES.blue.border)}>
        <IconChip tone="blue">
          <Grid3x3 />
        </IconChip>
        <span>{t("home.btnVariantlar")}</span>
      </Link>

      {showMavzular && (
        <Link to="/mavzuli" className={cn(BASE, SECONDARY, TONES.indigo.border)}>
          <IconChip tone="indigo">
            <BookOpen />
          </IconChip>
          <span>{t("home.btnMavzuli")}</span>
          {!isPremium && !accessLoading && backendConfirmed && <ProTag />}
        </Link>
      )}
    </div>
  );
}
