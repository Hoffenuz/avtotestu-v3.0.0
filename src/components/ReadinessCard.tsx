// ============================================================================
// ReadinessCard — "Imtihonga tayyorgarlik" indikatori
// ----------------------------------------------------------------------------
// DIZAYN QARORLARI:
//   * Bitta KATTA raqam (foiz) va uning yonida daraja — ko'z birinchi shu
//     ikkisini ko'radi. Qolgan tafsilot pastda, ikkinchi darajali.
//   * To'rtta komponent OCHIQ ko'rsatiladi (aniqlik/qamrov/variant/mustahkamlik).
//     Sabab: "72%" o'z-o'zidan hech narsa tushuntirmaydi — foydalanuvchi NEGA
//     shunday ekanini va nimani yaxshilashi kerakligini ko'rishi kerak.
//   * O'lchab bo'lmaydigan komponent (savol-holati yo'q hisob) UMUMAN
//     ko'rsatilmaydi — "0%" deb ko'rsatish yolg'on bo'lardi.
//   * Imtihon sanasi ixtiyoriy va HECH QACHON so'ralmaydi: kiritilmagan bo'lsa
//     faqat kichkina, bosilishi shart bo'lmagan havola turadi.
//
// DARK MODE: faqat tema tokenlari (`bg-card`, `text-foreground`, `border-border`).
// ============================================================================

import { useState } from "react";
import { Link } from "react-router-dom";
import { Calendar, Check, Flame, Target, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { useReadiness, type Readiness } from "@/hooks/useReadiness";

interface ReadinessCardProps {
  /** `full` — bosh sahifa; `compact` — profil (sodda ko'rinish). */
  variant?: "full" | "compact";
  className?: string;
}

/** Foizga qarab rang: past — qizil, o'rta — sariq, yaxshi — yashil. */
function toneOf(percent: number) {
  if (percent >= 85) return { ring: "#10b981", text: "text-emerald-600 dark:text-emerald-400", bar: "bg-emerald-500" };
  if (percent >= 65) return { ring: "#22c55e", text: "text-green-600 dark:text-green-400", bar: "bg-green-500" };
  if (percent >= 40) return { ring: "#f59e0b", text: "text-amber-600 dark:text-amber-400", bar: "bg-amber-500" };
  return { ring: "#ef4444", text: "text-red-600 dark:text-red-400", bar: "bg-red-500" };
}

/** Holat matni kaliti — foiz oralig'iga qarab. */
function statusKey(percent: number): string {
  if (percent >= 85) return "readiness.statusReady";
  if (percent >= 65) return "readiness.statusAlmost";
  if (percent >= 40) return "readiness.statusMid";
  return "readiness.statusLow";
}

/** SVG halqa — foizni ko'rsatadi. */
function Ring({ percent, size, stroke }: { percent: number; size: number; stroke: number }) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - Math.min(100, Math.max(0, percent)) / 100);
  const tone = toneOf(percent);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className="shrink-0 -rotate-90"
      role="img"
      aria-label={`${percent}%`}
    >
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" strokeWidth={stroke}
        className="stroke-muted"
      />
      <circle
        cx={size / 2} cy={size / 2} r={r}
        fill="none" strokeWidth={stroke} strokeLinecap="round"
        stroke={tone.ring}
        strokeDasharray={c}
        strokeDashoffset={offset}
        style={{ transition: "stroke-dashoffset 700ms ease-out" }}
      />
    </svg>
  );
}

/** Bitta komponent qatori (aniqlik, qamrov, ...). */
function Metric({
  label, percent, detail,
}: { label: string; percent: number; detail?: string }) {
  const tone = toneOf(percent);
  return (
    <div>
      <div className="flex items-baseline justify-between gap-2">
        <span className="text-[13px] text-muted-foreground">{label}</span>
        <span className="text-[13px] font-semibold text-foreground tabular-nums">
          {percent}%
          {detail ? (
            <span className="ml-1.5 font-normal text-muted-foreground">{detail}</span>
          ) : null}
        </span>
      </div>
      <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-muted">
        <div
          className={cn("h-full rounded-full transition-[width] duration-700 ease-out", tone.bar)}
          style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
        />
      </div>
    </div>
  );
}

/** Imtihon sanasi — ixtiyoriy, hech qachon majburlanmaydi. */
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
    // Kiritilmagan — faqat kichik taklif. Majburlash yo'q.
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

  if (!data) return null;

  const compact = variant === "compact";
  const tone = toneOf(data.readinessPercent);
  const ringSize = compact ? 84 : 112;

  /*
    Ma'lumot yo'q (hali bitta ham test ishlanmagan) — foiz o'rniga taklif.
    "0%" ko'rsatish yangi foydalanuvchini bekorga cho'chitadi.
  */
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
    <div className={cn("rounded-2xl border border-border bg-card p-4 sm:p-5", className)}>
      {/* ── Yuqori qism: halqa + daraja ─────────────────────────────────── */}
      <div className="flex items-center gap-4 sm:gap-5">
        <div className="relative shrink-0">
          <Ring percent={data.readinessPercent} size={ringSize} stroke={compact ? 8 : 10} />
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className={cn("font-extrabold tabular-nums leading-none", compact ? "text-xl" : "text-2xl", tone.text)}>
              {data.readinessPercent}%
            </span>
            {!compact && (
              <span className="mt-0.5 text-[10px] font-medium uppercase tracking-wide text-muted-foreground">
                {t("readiness.ringLabel")}
              </span>
            )}
          </div>
        </div>

        <div className="min-w-0 flex-1">
          <p className={cn("font-bold text-foreground", compact ? "text-sm" : "text-base")}>
            {t("readiness.title")}
          </p>
          <p className={cn("mt-0.5 leading-snug text-muted-foreground", compact ? "text-xs" : "text-[13px]")}>
            {t(statusKey(data.readinessPercent))}
          </p>

          {/*
            DARAJA — ataylab halqaning YONIDA va alohida quti ichida.
            Lvl tizimi kengayganda (keyingi bosqich) shu joyga qo'shimcha
            ma'lumot (masalan progress bar, nishon) sig'adi.
          */}
          <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-500/25 bg-amber-500/10 px-2.5 py-1 text-[11px] font-bold text-amber-700 dark:text-amber-400">
              <span className="tabular-nums">{data.levelIndex}</span>
              <span className="opacity-60">·</span>
              {t(`readiness.level${data.levelIndex}`)}
            </span>

            {data.streakDays > 1 && (
              <span className="inline-flex items-center gap-1 rounded-full border border-orange-500/25 bg-orange-500/10 px-2.5 py-1 text-[11px] font-bold text-orange-700 dark:text-orange-400">
                <Flame className="h-3 w-3" aria-hidden="true" />
                {t("readiness.streak").replace("{n}", String(data.streakDays))}
              </span>
            )}

            <ExamDate data={data} onSave={saveExamDate} />
          </div>

          {data.testsToNextLevel !== null && data.testsToNextLevel > 0 && (
            <p className="mt-1.5 text-[11px] text-muted-foreground">
              {t("readiness.toNextLevel").replace("{n}", String(data.testsToNextLevel))}
            </p>
          )}
        </div>
      </div>

      {/* ── Tafsilot: nega aynan shu foiz ───────────────────────────────── */}
      {!compact && (
        <div className="mt-4 space-y-2.5 border-t border-border pt-4">
          <Metric
            label={t("readiness.accuracy")}
            percent={data.accuracyPercent}
            detail={t("readiness.accuracyDetail")}
          />
          {/* Qamrov va mustahkamlik faqat O'LCHANGAN bo'lsa ko'rsatiladi. */}
          {data.questionsSeen > 0 && (
            <>
              <Metric
                label={t("readiness.coverage")}
                percent={data.coveragePercent}
                detail={`${data.questionsSeen}/${data.questionsTotal}`}
              />
              <Metric
                label={t("readiness.mastery")}
                percent={data.masteryPercent}
                detail={`${data.questionsMastered}/${data.questionsSeen}`}
              />
            </>
          )}
          <Metric
            label={t("readiness.variants")}
            percent={data.variantsPercent}
            detail={`${data.variantsPassed}/${data.variantsTotal}`}
          />

          {data.questionsToReview > 0 && (
            <Link
              to="/xatolar-testi"
              className="mt-1 flex items-center justify-between gap-2 rounded-xl bg-muted/50 px-3 py-2.5 transition-colors hover:bg-muted"
            >
              <span className="text-[13px] text-foreground">
                {t("readiness.reviewHint").replace("{n}", String(data.questionsToReview))}
              </span>
              <span className="shrink-0 text-xs font-bold text-primary">
                {t("readiness.reviewCta")}
              </span>
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

export default ReadinessCard;
