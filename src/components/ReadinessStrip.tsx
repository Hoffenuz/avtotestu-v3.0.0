/**
 * ReadinessStrip — bosh sahifa yuqorisidagi INGICHKA tayyorgarlik tasmasi.
 *
 * Bu yerda ilgari "Kompyuter ilovasini yuklab oling" banneri turardi. U olib
 * tashlandi: ilovani xohlagan foydalanuvchi uni "Qo'shimcha" bo'limidan va
 * menyudan topadi, bosh sahifadagi eng qimmatli joy esa foydalanuvchining
 * O'Z holatiga berildi.
 *
 * ATAYLAB juda sodda: bitta kichik halqa, foiz, daraja nomi va bosilsa
 * to'liq kartaga (bosh sahifadagi) emas — batafsil profilga olib boradi.
 * Bu yerda hech qanday tafsilot, tugma yoki chalg'ituvchi element yo'q.
 */
import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import { useReadiness } from "@/hooks/useReadiness";
import { levelTone } from "@/lib/readinessLevels";

export function ReadinessStrip({ className }: { className?: string }) {
  const { t } = useLanguage();
  const { data } = useReadiness();

  // Ma'lumot yo'q yoki hali bitta ham test ishlanmagan — tasma umuman
  // ko'rsatilmaydi (bo'sh "0%" hech kimga foyda bermaydi).
  if (!data || !data.hasData) return null;

  const tone = levelTone(data.levelIndex);
  const size = 30;
  const stroke = 3.5;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - Math.min(100, Math.max(0, data.readinessPercent)) / 100);

  return (
    <div className={cn("relative z-10 border-b border-border bg-card/80 backdrop-blur-md", className)}>
      <Link
        to="/profile"
        className="mx-auto flex max-w-7xl items-center gap-2.5 px-3 py-1.5 lg:px-4 transition-colors hover:bg-muted/50"
      >
        <svg
          width={size} height={size} viewBox={`0 0 ${size} ${size}`}
          className="shrink-0 -rotate-90"
          role="img"
          aria-label={`${data.readinessPercent}%`}
        >
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-muted" />
          <circle
            cx={size / 2} cy={size / 2} r={r}
            fill="none" strokeWidth={stroke} strokeLinecap="round"
            stroke={tone.ring}
            strokeDasharray={c} strokeDashoffset={offset}
          />
        </svg>

        <span className={cn("text-sm font-extrabold tabular-nums leading-none", tone.text)}>
          {data.readinessPercent}%
        </span>

        <span className="h-3.5 w-px shrink-0 bg-border" aria-hidden="true" />

        <span className="min-w-0 flex-1 truncate text-[13px] font-semibold text-foreground">
          {t(`readiness.level${data.levelIndex}`)}
        </span>

        <span className="hidden shrink-0 text-[11px] text-muted-foreground sm:inline">
          {t("readiness.title")}
        </span>

        <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
      </Link>
    </div>
  );
}

export default ReadinessStrip;
