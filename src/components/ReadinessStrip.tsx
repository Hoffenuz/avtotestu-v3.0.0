/**
 * ReadinessStrip — bosh sahifa yuqorisidagi tayyorgarlik tasmasi.
 *
 * Bu yerda ilgari "Kompyuter ilovasini yuklab oling" banneri turardi. U olib
 * tashlandi: ilovani xohlagan foydalanuvchi uni menyudan va "Qo'shimcha"
 * bo'limidan topadi, bosh sahifadagi eng qimmatli joy esa foydalanuvchining
 * O'Z holatiga berildi.
 *
 * BALANDLIK HAMMA HOLATDA BIR XIL (`h-14`) — bu tasmaning asosiy qoidasi.
 *
 *   Ilgari tasma faqat ma'lumot KELGANDA chizilardi: sahifa avval tasmasiz
 *   ochilar, ~0.3–1 s dan keyin tasma paydo bo'lib hero'ni 55px pastga
 *   surardi (o'lchangan: h1 169px → 224px). Hali test ishlamagan
 *   foydalanuvchida esa tasma umuman chiqmas, hero boshqalarnikidan yuqorida
 *   turardi. Endi kirgan (yoki sessiyasi saqlangan) foydalanuvchida tasma
 *   BIRINCHI RENDERDAN joy egallaydi:
 *     * sessiya/ma'lumot kutilmoqda  → skelet;
 *     * hali test ishlanmagan        → "birinchi testni ishlang" taklifi;
 *     * so'rov xato bilan tugadi     → neytral havola (profilga);
 *     * ma'lumot bor                 → halqa, daraja, progress.
 *   Mehmonga tasma umuman chizilmaydi — uning maketi o'zgarmaydi.
 *
 * DIZAYN: chap chekka hero va header bilan bir chiziqda (`px-4 md:px-6
 * lg:px-8`). Chapda — holat (halqa + daraja + progress), o'ngda — harakatlar
 * (ketma-ket kunlar, xato savollar). Rang foizga qarab (qizil → sariq →
 * yashil), darajaga emas.
 */
import { Link } from "react-router-dom";
import { ArrowRight, ChevronRight, Flame, Target, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { useReadiness } from "@/hooks/useReadiness";
import { toneOf, READINESS_LEVELS } from "@/lib/readinessLevels";

const SHELL = "relative z-10 border-b border-border bg-card";
const ROW = "mx-auto flex h-14 w-full max-w-7xl items-center gap-3 px-4 md:px-6 lg:px-8";

function ProgressRing({ percent, color }: { percent: number; color: string }) {
  const size = 40;
  const stroke = 4;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - Math.min(100, Math.max(0, percent)) / 100);

  return (
    <div className="relative h-10 w-10 shrink-0">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-muted" />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none" strokeWidth={stroke} strokeLinecap="round"
          stroke={color}
          strokeDasharray={c} strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 700ms ease-out" }}
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[11px] font-extrabold tabular-nums text-foreground">
        {percent}
        <span className="text-[8px] font-bold text-muted-foreground">%</span>
      </span>
    </div>
  );
}

/** Ma'lumot kutilayotganda — haqiqiy tasma bilan bir xil o'lchamdagi skelet. */
function StripSkeleton() {
  return (
    <div className={SHELL} aria-hidden="true">
      <div className={ROW}>
        <span className="h-10 w-10 shrink-0 rounded-full border-4 border-muted" />
        <span className="min-w-0 flex-1 space-y-2">
          <span className="block h-3 w-32 rounded bg-muted motion-safe:animate-pulse" />
          <span className="block h-1.5 w-40 rounded-full bg-muted motion-safe:animate-pulse sm:w-56" />
        </span>
      </div>
    </div>
  );
}

/**
 * Foiz yo'q holat: hali test ishlanmagan (`cta`) yoki so'rov xato bilan
 * tugagan (profilga oddiy havola). "0%" yangi foydalanuvchini cho'chitadi.
 */
function StripNotice({ hint, to, cta }: { hint: string | null; to: string; cta: string | null }) {
  const { t } = useLanguage();
  return (
    <div className={SHELL}>
      <div className={ROW}>
        <Link
          to={to}
          className="group flex min-w-0 flex-1 items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary dark:bg-primary/20">
            <Target className="h-5 w-5" aria-hidden="true" />
          </span>
          <span className="min-w-0 flex-1">
            <span className="block truncate text-sm font-bold leading-[1.4] text-foreground">
              {t("readiness.title")}
            </span>
            {hint && (
              <span className="block truncate text-[12px] leading-[1.45] text-muted-foreground">{hint}</span>
            )}
          </span>
          {cta ? (
            <span className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-brand px-3 py-1.5 text-xs font-bold text-brand-foreground transition-colors group-hover:bg-brand/90 dark:bg-primary dark:text-primary-foreground">
              {cta}
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
            </span>
          ) : (
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
          )}
        </Link>
      </div>
    </div>
  );
}

export function ReadinessStrip({ pending = false }: {
  /** Sessiya saqlangan, lekin foydalanuvchi hali aniqlanmagan — joy zahiralanadi. */
  pending?: boolean;
}) {
  const { t } = useLanguage();
  const { data, loading } = useReadiness();

  if (pending || loading) return <StripSkeleton />;

  if (!data) return <StripNotice hint={null} to="/profile" cta={null} />;

  if (!data.hasData) {
    return <StripNotice hint={t("readiness.emptyHint")} to="/test-ishlash" cta={t("readiness.emptyCta")} />;
  }

  const tone = toneOf(data.readinessPercent);

  /* Joriy daraja ichida qancha yo'l bosib o'tilgani.
     Oxirgi darajada (Legenda) progress har doim to'liq. */
  const level = READINESS_LEVELS[Math.min(data.levelIndex, READINESS_LEVELS.length) - 1];
  const span = (data.levelNextPercent ?? 100) - level.minPercent;
  const withinLevel = span > 0
    ? Math.min(100, Math.max(0, ((data.readinessPercent - level.minPercent) / span) * 100))
    : 100;

  const nextHint = data.percentToNext !== null && data.percentToNext > 0
    ? t("readiness.toNextLevel")
        .replace("{n}", String(data.percentToNext))
        .replace("{name}", t(`readiness.level${Math.min(6, data.levelIndex + 1)}`))
    : t("readiness.title");

  const hasStreak = data.streakDays > 1;
  const hasMistakes = data.questionsToReview > 0;

  const streakChip = (
    <span className="inline-flex shrink-0 items-center gap-1 rounded-md bg-orange-500/10 px-1.5 py-0.5 text-[11px] font-bold leading-none text-orange-600 dark:text-orange-400">
      <Flame className="h-3 w-3" aria-hidden="true" />
      {t("readiness.streak").replace("{n}", String(data.streakDays))}
    </span>
  );

  return (
    <div className={SHELL}>
      <div className={ROW}>
        {/* Chap qism — holat. Bosilsa profildagi to'liq kartaga. */}
        <Link
          to="/profile"
          aria-label={`${t("readiness.title")}: ${data.readinessPercent}%`}
          className="group flex min-w-0 flex-1 items-center gap-3 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring md:flex-none"
        >
          <ProgressRing percent={data.readinessPercent} color={tone.ring} />

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="hidden text-[12px] font-medium text-muted-foreground sm:inline">
                {t("readiness.title")}
              </span>
              <span className={cn("inline-flex shrink-0 items-center rounded-md border px-1.5 py-px text-[12px] font-bold leading-[1.4]", tone.chip)}>
                {t(`readiness.level${data.levelIndex}`)}
              </span>
              {/* Telefonda o'ng tomondagi guruh yashirin — seriya shu yerda */}
              {hasStreak && <span className="md:hidden">{streakChip}</span>}
            </div>

            <div className="mt-1.5 flex items-center gap-2.5">
              <span className="relative h-1.5 w-20 shrink-0 overflow-hidden rounded-full bg-muted sm:w-40 lg:w-56">
                <span
                  className={cn("absolute inset-y-0 left-0 rounded-full transition-[width] duration-700 ease-out", tone.bar)}
                  style={{ width: `${withinLevel}%` }}
                />
              </span>
              {/*
                `leading-none` ATAYLAB ISHLATILMAYDI: `truncate`
                (overflow:hidden) bilan birga kelganda qator qutisi shrift
                balandligiga teng bo'lib qoladi va pastga chiqadigan harflar
                (g, q, y) kesiladi.
              */}
              <span className="truncate text-[12px] leading-[1.45] text-muted-foreground">{nextHint}</span>
            </div>
          </div>

          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground md:hidden" aria-hidden="true" />
        </Link>

        {/*
          O'ng qism — harakatlar. Telefonda YASHIRILGAN: u yerda tasma
          allaqachon to'la va yana bir tugma siqib qo'yardi.
        */}
        <div className="ml-auto hidden shrink-0 items-center gap-2 md:flex">
          {hasStreak && streakChip}
          {hasMistakes && (
            <Link
              to="/xatolarim"
              className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1.5 text-[12px] font-semibold text-foreground transition-colors hover:border-primary/40 hover:text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              <XCircle className="h-3.5 w-3.5 text-red-500" aria-hidden="true" />
              {t("sections.xatolarim")}
              <span className="rounded-full bg-muted px-1.5 py-0.5 text-[10px] font-bold tabular-nums text-muted-foreground">
                {data.questionsToReview}
              </span>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}

export default ReadinessStrip;
