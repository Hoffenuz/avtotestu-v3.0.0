// ============================================================================
// ReadinessCard — "Imtihonga tayyorgarlik" indikatori
// ----------------------------------------------------------------------------
// DIZAYN QARORLARI:
//   * Asosiy matn — DARAJA nomi ("Yuqori", "Malakali"). "Tayyorsiz"/"O'rtacha"
//     kabi baho matnlari ATAYLAB yo'q: ular foydalanuvchini cho'chitadi va
//     hech narsa o'rgatmaydi. Daraja esa aniq maqsad beradi.
//   * Daraja belgisiga bosilsa — BARCHA darajalar va ularga qanday chiqish
//     ko'rsatiladi (pastdan ochiladigan panel).
//   * To'rtta komponent ochiq ko'rsatiladi: foydalanuvchi foiz qayerdan
//     kelganini va nimani yaxshilashi kerakligini ko'rishi kerak.
//   * O'lchab bo'lmaydigan komponent UMUMAN ko'rsatilmaydi ("0%" yolg'on
//     bo'lardi).
//
// DARK MODE: faqat tema tokenlari (`bg-card`, `text-foreground`, `border-border`).
// ============================================================================

import { useState } from "react";
import { Link } from "react-router-dom";
import { Brain, Calendar, Check, ChevronRight, Flame, Target, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { useReadiness, type Readiness } from "@/hooks/useReadiness";
import { READINESS_LEVELS, toneOf } from "@/lib/readinessLevels";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";

interface ReadinessCardProps {
  /** `full` — bosh sahifa; `compact` — profil (sodda ko'rinish). */
  variant?: "full" | "compact";
  className?: string;
}

/** SVG halqa — foizni ko'rsatadi. */
function Ring({
  percent, size, stroke, color,
}: { percent: number; size: number; stroke: number; color: string }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - Math.min(100, Math.max(0, percent)) / 100);

  return (
    <svg
      width={size} height={size} viewBox={`0 0 ${size} ${size}`}
      className="shrink-0 -rotate-90"
      role="img"
      aria-label={`${percent}%`}
    >
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" strokeWidth={stroke} className="stroke-muted"
      />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" strokeWidth={stroke} strokeLinecap="round"
        stroke={color}
        strokeDasharray={c} strokeDashoffset={offset}
        style={{ transition: "stroke-dashoffset 700ms ease-out" }}
      />
    </svg>
  );
}

/** Bitta o'lchov qatori. */
function Metric({
  label, percent, detail, barClass,
}: { label: string; percent: number; detail?: string; barClass: string }) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[13px] text-muted-foreground">{label}</span>
        <span className="text-[13px] font-semibold tabular-nums text-foreground">
          {percent}%
          {detail ? <span className="ml-1.5 font-normal text-muted-foreground">{detail}</span> : null}
        </span>
      </div>
      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full transition-[width] duration-700 ease-out", barClass)}
          style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
        />
      </div>
    </div>
  );
}

/** Barcha darajalar va ularga qanday chiqish — pastdan ochiladigan panel. */
function LevelGuide({
  open, onOpenChange, currentIndex, currentPercent,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  currentIndex: number;
  currentPercent: number;
}) {
  const { t } = useLanguage();

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="max-h-[85vh] overflow-y-auto">
        <SheetHeader className="text-left">
          <SheetTitle>{t("readiness.levelsTitle")}</SheetTitle>
          <SheetDescription>{t("readiness.levelsSubtitle")}</SheetDescription>
        </SheetHeader>

        <ol className="mx-auto mt-4 max-w-md space-y-2">
          {READINESS_LEVELS.map((lvl) => {
            const tone = toneOf(lvl.minPercent);
            const isCurrent = lvl.index === currentIndex;
            const reached = currentPercent >= lvl.minPercent;
            return (
              <li
                key={lvl.index}
                className={cn(
                  "flex items-center gap-3 rounded-xl border p-3 transition-colors",
                  isCurrent ? "border-primary/40 bg-primary/5" : "border-border bg-card",
                )}
              >
                <span
                  className={cn(
                    "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border text-xs font-extrabold tabular-nums",
                    tone.chip,
                  )}
                >
                  {lvl.index}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold text-foreground">
                    {t(lvl.labelKey)}
                    {isCurrent && (
                      <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-[10px] font-bold text-primary-foreground">
                        {t("readiness.levelsCurrent")}
                      </span>
                    )}
                  </p>
                  <p className="mt-0.5 text-xs text-muted-foreground">
                    {lvl.index === READINESS_LEVELS.length
                      ? t("readiness.levelsFrom").replace("{n}", String(lvl.minPercent))
                      : t("readiness.levelsRange")
                          .replace("{a}", String(lvl.minPercent))
                          .replace("{b}", String(lvl.maxPercent))}
                  </p>
                </div>
                {reached && (
                  <Check className="h-4 w-4 shrink-0 text-emerald-500" aria-hidden="true" />
                )}
              </li>
            );
          })}
        </ol>

        <div className="mx-auto mt-4 max-w-md rounded-xl bg-muted/50 p-3">
          <p className="text-xs font-semibold text-foreground">{t("readiness.levelsHowTitle")}</p>
          <ul className="mt-1.5 space-y-1 text-xs leading-relaxed text-muted-foreground">
            <li>· {t("readiness.levelsHow3")}</li>
            <li>· {t("readiness.levelsHow5")}</li>
            <li>· {t("readiness.levelsHow1")}</li>
            <li>· {t("readiness.levelsHow2")}</li>
            <li>· {t("readiness.levelsHow4")}</li>
          </ul>
        </div>
      </SheetContent>
    </Sheet>
  );
}

/** Imtihon sanasi — ixtiyoriy, hech qachon so'ralmaydi. */
function ExamDate({
  data, onSave,
}: { data: Readiness; onSave: (v: string | null) => Promise<boolean> }) {
  const { t } = useLanguage();
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(data.examDate ?? "");
  const [saving, setSaving] = useState(false);

  const today = new Date().toISOString().slice(0, 10);

  const save = async (next: string | null) => {
    setSaving(true);
    await onSave(next);
    setSaving(false);
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex items-center gap-1.5">
        <input
          type="date"
          value={value}
          min={today}
          onChange={(e) => setValue(e.target.value)}
          className="h-8 rounded-lg border border-border bg-background px-2 text-xs text-foreground"
          aria-label={t("readiness.examDateLabel")}
        />
        <button
          type="button"
          disabled={saving || !value}
          onClick={() => void save(value)}
          className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground disabled:opacity-50"
          aria-label={t("common.save")}
        >
          <Check className="h-4 w-4" />
        </button>
        <button
          type="button"
          disabled={saving}
          onClick={() => { setEditing(false); setValue(data.examDate ?? ""); }}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-border text-muted-foreground"
          aria-label={t("common.cancel")}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    );
  }

  if (data.daysToExam === null) {
    return (
      <button
        type="button"
        onClick={() => setEditing(true)}
        className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-border px-2.5 py-1 text-[11px] font-medium text-muted-foreground transition-colors hover:border-primary/40 hover:text-foreground"
      >
        <Calendar className="h-3 w-3" aria-hidden="true" />
        {t("readiness.examDateAdd")}
      </button>
    );
  }

  const past = data.daysToExam < 0;
  return (
    <button
      type="button"
      onClick={() => setEditing(true)}
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold transition-colors",
        past
          ? "border-border bg-muted text-muted-foreground"
          : "border-primary/25 bg-primary/10 text-primary hover:bg-primary/15",
      )}
    >
      <Calendar className="h-3 w-3" aria-hidden="true" />
      {past
        ? t("readiness.examDatePast")
        : data.daysToExam === 0
          ? t("readiness.examToday")
          : t("readiness.examInDays").replace("{n}", String(data.daysToExam))}
    </button>
  );
}

export function ReadinessCard({ variant = "full", className }: ReadinessCardProps) {
  const { t } = useLanguage();
  const { data, saveExamDate } = useReadiness();
  const [guideOpen, setGuideOpen] = useState(false);

  if (!data) return null;

  const compact = variant === "compact";
  const tone = toneOf(data.readinessPercent);
  const ringSize = compact ? 84 : 112;

  /* Hali test ishlanmagan — foiz o'rniga taklif. "0%" yangi foydalanuvchini
     bekorga cho'chitadi. */
  if (!data.hasData) {
    return (
      <div className={cn("rounded-2xl border border-border bg-card p-4 sm:p-5", className)}>
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <Target className="h-5 w-5 text-primary" aria-hidden="true" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold text-foreground">{t("readiness.title")}</p>
            <p className="mt-0.5 text-[13px] leading-snug text-muted-foreground">
              {t("readiness.emptyHint")}
            </p>
          </div>
          <Link
            to="/test-ishlash"
            className="shrink-0 rounded-xl bg-primary px-3 py-2 text-xs font-bold text-primary-foreground transition-opacity hover:opacity-90"
          >
            {t("readiness.emptyCta")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={cn("rounded-2xl border border-border bg-card p-4 sm:p-5", className)}>
        {/* ── Halqa + daraja ─────────────────────────────────────────────── */}
        <div className="flex items-center gap-4 sm:gap-5">
          <div className="relative shrink-0">
            <Ring percent={data.readinessPercent} size={ringSize} stroke={compact ? 8 : 10} color={tone.ring} />
            <div className="absolute inset-0 flex items-center justify-center">
              <span className={cn("font-extrabold tabular-nums leading-none", compact ? "text-xl" : "text-2xl", tone.text)}>
                {data.readinessPercent}%
              </span>
            </div>
          </div>

          <div className="min-w-0 flex-1">
            {/* Daraja nomi — asosiy matn. */}
            <p className={cn("font-extrabold leading-tight text-foreground", compact ? "text-lg" : "text-xl")}>
              {t(`readiness.level${data.levelIndex}`)}
            </p>
            <p className="mt-0.5 text-[12px] text-muted-foreground">{t("readiness.title")}</p>

            <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
              {/* Daraja belgisi — bosilsa barcha darajalar ochiladi. */}
              <button
                type="button"
                onClick={() => setGuideOpen(true)}
                className={cn(
                  "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-bold transition-colors hover:brightness-95",
                  tone.chip,
                )}
              >
                <span className="tabular-nums">{data.levelIndex}/6</span>
                <span className="opacity-50">·</span>
                {t("readiness.levelsOpen")}
                <ChevronRight className="h-3 w-3" aria-hidden="true" />
              </button>

              {data.streakDays > 1 && (
                <span className="inline-flex items-center gap-1 rounded-full border border-orange-500/25 bg-orange-500/10 px-2.5 py-1 text-[11px] font-bold text-orange-700 dark:text-orange-400">
                  <Flame className="h-3 w-3" aria-hidden="true" />
                  {t("readiness.streak").replace("{n}", String(data.streakDays))}
                </span>
              )}

              <ExamDate data={data} onSave={saveExamDate} />
            </div>

            {data.percentToNext !== null && data.percentToNext > 0 && (
              <p className="mt-1.5 text-[11px] text-muted-foreground">
                {t("readiness.toNextLevel")
                  .replace("{n}", String(data.percentToNext))
                  .replace("{name}", t(`readiness.level${Math.min(6, data.levelIndex + 1)}`))}
              </p>
            )}
          </div>
        </div>

        {/* ── Tafsilot ───────────────────────────────────────────────────── */}
        {!compact && (
          <div className="mt-4 space-y-2.5 border-t border-border pt-4">
            {/* Tartib = VAZN tartibi: eng ko'p ta'sir qiladigan mezon yuqorida. */}
            <Metric
              label={t("readiness.variants")}
              percent={data.variantsPercent}
              detail={`${data.variantsPassed}/${data.variantsTotal}`}
              barClass={tone.bar}
            />
            <Metric
              label={t("readiness.tests")}
              percent={data.testsPercent}
              detail={`${data.testsTotal}/${data.testsTarget}`}
              barClass={tone.bar}
            />
            <Metric
              label={t("readiness.accuracy")}
              percent={data.accuracyPercent}
              detail={t("readiness.accuracyDetail")}
              barClass={tone.bar}
            />
            {data.questionsSeen > 0 && (
              <>
                <Metric
                  label={t("readiness.coverage")}
                  percent={data.coveragePercent}
                  detail={`${data.questionsSeen}/${data.questionsTotal}`}
                  barClass={tone.bar}
                />
                <Metric
                  label={t("readiness.mastery")}
                  percent={data.masteryPercent}
                  detail={`${data.questionsMastered}/${data.questionsSeen}`}
                  barClass={tone.bar}
                />
              </>
            )}

            {/* Xatolar ustida ishlash — ATAYLAB kattaroq: bu kartadagi eng
                foydali harakat, qolgan hamma narsa faqat ma'lumot. */}
            {data.questionsToReview > 0 && (
              <Link
                to="/xatolarim"
                className="mt-3 flex items-center gap-3 rounded-2xl border border-primary/25 bg-primary/5 p-3.5 transition-colors hover:bg-primary/10"
              >
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-primary/15">
                  <Brain className="h-5 w-5 text-primary" aria-hidden="true" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold text-foreground">
                    {t("sections.xatolarim")}
                  </span>
                  <span className="mt-0.5 block text-[12px] leading-snug text-muted-foreground">
                    {t("readiness.reviewHint").replace("{n}", String(data.questionsToReview))}
                  </span>
                </span>
                <ChevronRight className="h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
              </Link>
            )}
          </div>
        )}
      </div>

      <LevelGuide
        open={guideOpen}
        onOpenChange={setGuideOpen}
        currentIndex={data.levelIndex}
        currentPercent={data.readinessPercent}
      />
    </>
  );
}

export default ReadinessCard;
