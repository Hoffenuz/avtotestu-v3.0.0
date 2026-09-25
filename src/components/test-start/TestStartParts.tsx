// ============================================================================
// Test boshlash sahifalarining umumiy qismlari
// ----------------------------------------------------------------------------
// /test-ishlash, /variant va /mavzuli — uchalasi BIR XIL qismlardan yig'iladi:
// savollar tili tanlovi, "vaqt / o'tish" ma'lumoti, boshlash tugmasi va PRO
// kartasi. Ilgari har sahifa o'zinikini chizardi: til tugmalari uch xil
// nomlangan ("Lotin" / "O'zbekcha"), PRO banneri bir joyda to'q sariq, boshqa
// joyda sariq gradient edi.
//
// QOIDA — HAR MA'LUMOT BIR MARTA: savol soni tanlovda, vaqt va o'tish bali
// `StartFacts` da. Ilgari "20 · 25 daqiqa" sarlavhada, tanlov tugmasida va
// statistika kartochkalarida — uch marta yozilardi.
// ============================================================================

import { useId, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, ArrowRight, Crown, Loader2, Play } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLanguage, type Language } from "@/contexts/LanguageContext";
import { cn } from "@/lib/utils";

/** Savollar tili — nomlar uchala sahifada bir xil. */
const TEST_LANGUAGES: readonly { id: Language; label: string }[] = [
  { id: "uz-lat", label: "Lotin" },
  { id: "uz", label: "Кирилл" },
  { id: "ru", label: "Русский" },
];

/**
 * Tanlov tugmasining umumiy holatlari (savol soni, variant, mavzu).
 * Tanlangan — to'la siyoh: qaysi biri tanlangani uzoqdan ko'rinsin.
 */
export const OPTION_BASE =
  "relative rounded-lg border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";
export const OPTION_SELECTED = "border-primary bg-primary text-primary-foreground shadow-md shadow-primary/25";
export const OPTION_IDLE = "border-border bg-card text-foreground hover:border-primary";

/** Kichik bo'lim sarlavhasi ("Savollar soni", "Savollar tili"). */
export function FieldLabel({ id, children }: { id?: string; children: ReactNode }) {
  return (
    <p id={id} className="mb-2.5 text-sm font-semibold text-foreground">
      {children}
    </p>
  );
}

export function TestLangPicker({ className }: { className?: string }) {
  const { language, setLanguage, t } = useLanguage();
  const labelId = useId();

  return (
    <div className={className}>
      <FieldLabel id={labelId}>{t("testStart.langLabel")}</FieldLabel>
      <div
        role="radiogroup"
        aria-labelledby={labelId}
        className="grid grid-cols-3 gap-1 rounded-lg border border-border bg-muted/60 p-1"
      >
        {TEST_LANGUAGES.map((lang) => {
          const active = language === lang.id;
          return (
            <button
              key={lang.id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setLanguage(lang.id)}
              className={cn(
                "h-10 min-w-0 truncate rounded-md px-1 text-sm font-semibold transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                active
                  ? "bg-primary text-primary-foreground shadow-sm"
                  : "text-muted-foreground hover:bg-background hover:text-foreground",
              )}
            >
              {lang.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/** "Vaqt: 25 daqiqa", "O'tish uchun: 18 ta to'g'ri javob" — kalit/qiymat ro'yxati. */
export function StartFacts({ items, className }: { items: readonly { label: string; value: string }[]; className?: string }) {
  return (
    <dl className={cn("divide-y divide-border rounded-lg border border-border bg-card text-sm", className)}>
      {items.map((item) => (
        <div key={item.label} className="flex items-center justify-between gap-3 px-3.5 py-2.5">
          <dt className="text-muted-foreground">{item.label}</dt>
          <dd className="text-right font-semibold tabular-nums text-foreground">{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}

/** Asosiy "Testni boshlash" tugmasi — bosh sahifadagi "Test ishlash" bilan bir uslub. */
export function StartButton({
  onClick,
  disabled,
  loading,
  children,
  className,
}: {
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <Button
      type="button"
      size="lg"
      onClick={onClick}
      disabled={disabled || loading}
      className={cn(
        "h-14 w-full gap-2.5 rounded-lg text-base font-semibold shadow-lg shadow-primary/30 hover:bg-primary/90 [&_svg]:size-5",
        "disabled:shadow-none",
        className,
      )}
    >
      {loading ? <Loader2 className="animate-spin" aria-hidden="true" /> : <Play className="fill-current" aria-hidden="true" />}
      <span className="truncate">{children}</span>
    </Button>
  );
}

/** Xato yoki ogohlantirish qatori. */
export function StartNotice({ tone = "error", children }: { tone?: "error" | "warning"; children: ReactNode }) {
  return (
    <div
      role={tone === "error" ? "alert" : "status"}
      className={cn(
        "flex items-start gap-2.5 rounded-lg border px-3.5 py-2.5 text-sm",
        tone === "error"
          ? "border-red-500/25 bg-red-500/10 text-red-700 dark:text-red-300"
          : "border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200",
      )}
    >
      <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
      <p>{children}</p>
    </div>
  );
}

/**
 * PRO taklifi — bosh sahifadagi PRO kartasining ixcham nusxasi: siyoh fon,
 * oltin toj, oq tugma. Sahifadagi YAGONA PRO xabari.
 *
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
        "group flex flex-wrap items-center gap-x-4 gap-y-3 rounded-xl bg-brand p-4 text-brand-foreground sm:flex-nowrap sm:p-5",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        pending && "invisible",
        className,
      )}
    >
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/10" aria-hidden="true">
        <Crown className="h-5 w-5 text-amber-300" />
      </span>
      <span className="min-w-0 flex-1 basis-40">
        <span className="block font-bold">{t("pro.testBannerTitle")}</span>
        <span className="mt-0.5 block text-sm leading-snug text-white/75">{description}</span>
      </span>
      <span className="inline-flex h-10 w-full shrink-0 items-center justify-center gap-1.5 rounded-lg bg-white px-4 text-sm font-semibold text-[#131A45] transition-colors group-hover:bg-white/90 sm:w-auto">
        {t("nav.getPro")}
        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
      </span>
    </Link>
  );
}
