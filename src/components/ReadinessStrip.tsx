/**
 * ReadinessStrip — bosh sahifa yuqorisidagi ingichka tayyorgarlik tasmasi.
 *
 * Bu yerda ilgari "Kompyuter ilovasini yuklab oling" banneri turardi. U olib
 * tashlandi: ilovani xohlagan foydalanuvchi uni menyudan va "Qo'shimcha"
 * bo'limidan topadi, bosh sahifadagi eng qimmatli joy esa foydalanuvchining
 * O'Z holatiga berildi.
 *
 * DIZAYN: daraja rangi bilan yengil gradient fon, kichik halqa, foiz va
 * daraja nomi. Eng pastda — keyingi darajagacha bo'lgan ingichka progress
 * chizig'i. Balandligi ataylab kichik: bu e'tibor tortadigan banner emas,
 * holat ko'rsatkichi.
 */
import { Link } from "react-router-dom";
import { ChevronRight, Flame } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { useReadiness } from "@/hooks/useReadiness";
import { levelTone, READINESS_LEVELS } from "@/lib/readinessLevels";

export function ReadinessStrip({ className }: { className?: string }) {
  const { t } = useLanguage();
  const { data } = useReadiness();

  // Hali test ishlanmagan — tasma ko'rsatilmaydi (bo'sh "0%" foyda bermaydi).
  if (!data || !data.hasData) return null;

  const tone = levelTone(data.levelIndex);
  const size = 34;
  const stroke = 3.5;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - Math.min(100, Math.max(0, data.readinessPercent)) / 100);

  /* Keyingi darajagacha bo'lgan yo'lning qanchasi bosib o'tilgani.
     Oxirgi darajada (Legenda) progress har doim to'liq. */
  const level = READINESS_LEVELS[Math.min(data.levelIndex, READINESS_LEVELS.length) - 1];
  const span = (data.levelNextPercent ?? 100) - level.minPercent;
  const withinLevel = span > 0
    ? Math.min(100, Math.max(0, ((data.readinessPercent - level.minPercent) / span) * 100))
    : 100;

  return (
    <div
      className={cn(
        "relative z-10 border-b border-border bg-card/90 backdrop-blur-md",
        className,
      )}
    >
      {/* Daraja rangidagi juda yengil fon — tasma "tirik" ko'rinadi, lekin
          matnni bosib ketmaydi. */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{ background: `linear-gradient(90deg, ${tone.ring} 0%, transparent 60%)` }}
        aria-hidden="true"
      />

      <Link
        to="/profile"
        className="relative mx-auto flex max-w-7xl items-center gap-3 px-3 py-2 transition-colors hover:bg-muted/40 lg:px-4"
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
            <span className={cn("truncate text-sm font-extrabold leading-tight", tone.text)}>
              {t(`readiness.level${data.levelIndex}`)}
            </span>
            {data.streakDays > 1 && (
              <span className="inline-flex shrink-0 items-center gap-0.5 rounded-full bg-orange-500/10 px-1.5 py-0.5 text-[10px] font-bold text-orange-600 dark:text-orange-400">
                <Flame className="h-2.5 w-2.5" aria-hidden="true" />
                {data.streakDays}
              </span>
            )}
          </div>
          <p className="truncate text-[11px] leading-tight text-muted-foreground">
            {data.percentToNext !== null && data.percentToNext > 0
              ? t("readiness.toNextLevel")
                  .replace("{n}", String(data.percentToNext))
                  .replace("{name}", t(`readiness.level${Math.min(6, data.levelIndex + 1)}`))
              : t("readiness.title")}
          </p>
        </div>

        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      </Link>

      {/* Daraja ichidagi progress — eng pastki chekkada, 2px. */}
      <div className="absolute inset-x-0 bottom-0 h-[2px] bg-muted/60" aria-hidden="true">
        <div
          className="h-full transition-[width] duration-700 ease-out"
          style={{ width: `${withinLevel}%`, background: tone.ring }}
        />
      </div>
    </div>
  );
}

export default ReadinessStrip;
