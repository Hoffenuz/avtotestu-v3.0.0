/**
 * ReadinessStrip — bosh sahifa yuqorisidagi ingichka tayyorgarlik tasmasi.
 *
 * Bu yerda ilgari "Kompyuter ilovasini yuklab oling" banneri turardi. U olib
 * tashlandi: ilovani xohlagan foydalanuvchi uni menyudan va "Qo'shimcha"
 * bo'limidan topadi, bosh sahifadagi eng qimmatli joy esa foydalanuvchining
 * O'Z holatiga berildi.
 *
 * DIZAYN:
 *   * Progress chizig'i tasmaning ICHIDA, daraja nomi ostida — avval u eng
 *     pastki chekkada alohida chiziq bo'lib turardi va tasmadan ajralib,
 *     "qo'shimcha element" bo'lib ko'rinardi.
 *   * O'ng tarafda — "Xato savollarim" havolasi. Avval o'sha joy bo'sh edi.
 *     Telefonda havola YASHIRILADI: u yerda tasma allaqachon to'la.
 *   * Rang foizga qarab (qizil -> sariq -> yashil), darajaga emas.
 */
import { Link } from "react-router-dom";
import { ChevronRight, Flame, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { useReadiness } from "@/hooks/useReadiness";
import { toneOf, READINESS_LEVELS } from "@/lib/readinessLevels";

export function ReadinessStrip({ className }: { className?: string }) {
  const { t } = useLanguage();
  const { data } = useReadiness();

  // Hali test ishlanmagan — tasma ko'rsatilmaydi (bo'sh "0%" foyda bermaydi).
  if (!data || !data.hasData) return null;

  const tone = toneOf(data.readinessPercent);
  const size = 34;
  const stroke = 3.5;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - Math.min(100, Math.max(0, data.readinessPercent)) / 100);

  /* Joriy daraja ichida qancha yo'l bosib o'tilgani.
     Oxirgi darajada (Legenda) progress har doim to'liq. */
  const level = READINESS_LEVELS[Math.min(data.levelIndex, READINESS_LEVELS.length) - 1];
  const span = (data.levelNextPercent ?? 100) - level.minPercent;
  const withinLevel = span > 0
    ? Math.min(100, Math.max(0, ((data.readinessPercent - level.minPercent) / span) * 100))
    : 100;

  const hasMistakes = data.questionsToReview > 0;

  return (
    <div className={cn("relative z-10 border-b border-border bg-card/90 backdrop-blur-md", className)}>
      <div className="mx-auto flex max-w-7xl items-center gap-3 px-3 py-2 lg:px-4">
        {/* Chap qism — bosilsa profilga. */}
        <Link
          to="/profile"
          className="group flex min-w-0 flex-1 items-center gap-3 rounded-lg transition-colors hover:bg-muted/40"
        >
          <div className="relative shrink-0">
            <svg
              width={size} height={size} viewBox={`0 0 ${size} ${size}`}
              className="-rotate-90"
              role="img"
              aria-label={`${data.readinessPercent}%`}
            >
              <circle
                cx={size / 2} cy={size / 2} r={r}
                fill="none" strokeWidth={stroke} className="stroke-muted"
              />
              <circle
                cx={size / 2} cy={size / 2} r={r}
                fill="none" strokeWidth={stroke} strokeLinecap="round"
                stroke={tone.ring}
                strokeDasharray={c} strokeDashoffset={offset}
                style={{ transition: "stroke-dashoffset 700ms ease-out" }}
              />
            </svg>
            <span
              className={cn(
                "absolute inset-0 flex items-center justify-center text-[10px] font-extrabold tabular-nums",
                tone.text,
              )}
            >
              {data.readinessPercent}
            </span>
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="truncate text-sm font-extrabold leading-[1.4] text-foreground">
                {t(`readiness.level${data.levelIndex}`)}
              </span>
              {data.streakDays > 1 && (
                <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-orange-500/10 px-1.5 py-0.5 text-[10px] font-bold text-orange-600 dark:text-orange-400">
                  <Flame className="h-2.5 w-2.5" aria-hidden="true" />
                  {data.streakDays}
                </span>
              )}
            </div>

            {/* Progress — tasma ICHIDA, daraja nomi ostida. */}
            <div className="mt-1.5 flex items-center gap-2">
              <span className="h-1 w-16 shrink-0 overflow-hidden rounded-full bg-muted sm:w-24">
                <span
                  className="block h-full rounded-full transition-[width] duration-700 ease-out"
                  style={{ width: `${withinLevel}%`, background: tone.ring }}
                />
              </span>
              {/*
                `leading-none` ATAYLAB ISHLATILMAYDI: `truncate`
                (overflow:hidden) bilan birga kelganda qator qutisi shrift
                balandligiga teng bo'lib qoladi va pastga chiqadigan harflar
                (g, q, y) kesiladi — aynan shu nuqson kuzatilgan edi.
              */}
              <span className="truncate text-[11px] leading-[1.45] text-muted-foreground">
                {data.percentToNext !== null && data.percentToNext > 0
                  ? t("readiness.toNextLevel")
                      .replace("{n}", String(data.percentToNext))
                      .replace("{name}", t(`readiness.level${Math.min(6, data.levelIndex + 1)}`))
                  : t("readiness.title")}
              </span>
            </div>
          </div>

          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground md:hidden" aria-hidden="true" />
        </Link>

        {/*
          Xato savollarim — o'ng taraf. Telefonda YASHIRILGAN: u yerda
          tasma allaqachon to'la va yana bir tugma siqib qo'yardi.
        */}
        {hasMistakes && (
          <Link
            to="/xatolarim"
            className="hidden shrink-0 items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1.5 text-[12px] font-semibold text-foreground transition-colors hover:border-primary/40 hover:text-primary md:inline-flex"
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
  );
}

export default ReadinessStrip;
