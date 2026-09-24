/**
 * Bosh sahifa hero'sidagi namunaviy savol kartasi (faqat desktop).
 *
 * NEGA: tashrifchi tugmani bosishdan OLDIN test qanday ko'rinishini
 * ko'radi — "savol, 3 ta javob, darhol natija". Bu matnli va'dadan
 * ko'ra tushunarliroq va rasm emas (LCP ga yuk bo'lmaydi).
 *
 * Savol ATAYLAB haqiqiy: bepul bazadagi `t_5_q_11` (uchala tilda bor),
 * matni `home.preview*` kalitlarida. To'g'ri javob — 2-variant (10 metr).
 * Ichki qism dekorativ (`aria-hidden`), butun karta esa testga olib
 * boradigan havola — "Testni boshlash" ga ikkinchi yo'l.
 *
 * Variant belgilari F1–F3: haqiqiy imtihon interfeysidagi kabi
 * (`RealExamInterface` → FKEYS).
 */
import { Link } from "react-router-dom";
import { ArrowRight, Check, Clock } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const OPTION_KEYS = ["home.previewOptionA", "home.previewOptionB", "home.previewOptionC"] as const;
const CORRECT_INDEX = 1;

export function QuestionPreview() {
  const { t } = useLanguage();

  return (
    <Link
      to="/test-ishlash"
      aria-label={t("home.previewCta")}
      className="group block rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-4 focus-visible:ring-offset-background"
    >
      <div
        aria-hidden="true"
        className="rounded-xl border border-border bg-card p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_16px_40px_-16px_rgba(19,26,69,0.22)] transition-shadow duration-300 group-hover:shadow-[0_1px_2px_rgba(16,24,40,0.04),0_20px_48px_-16px_rgba(19,26,69,0.30)] xl:p-6"
      >
        <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
          <span>{t("home.previewCounter")}</span>
          <span className="inline-flex items-center gap-1 rounded-md bg-muted px-2 py-1 tabular-nums text-foreground">
            <Clock className="h-3.5 w-3.5 text-muted-foreground" />
            18:42
          </span>
        </div>

        <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-muted">
          <div className="h-full w-[35%] rounded-full bg-[#2563EB]" />
        </div>

        <p className="mt-4 text-[15px] font-semibold leading-snug text-foreground xl:text-base">
          {t("home.previewQuestion")}
        </p>

        <ul className="mt-4 space-y-2">
          {OPTION_KEYS.map((key, index) => {
            const correct = index === CORRECT_INDEX;
            return (
              <li
                key={key}
                className={`flex items-center gap-3 rounded-lg border px-3 py-2.5 text-sm ${
                  correct
                    ? "border-emerald-500/60 bg-emerald-50 font-semibold text-emerald-900 dark:bg-emerald-500/10 dark:text-emerald-200"
                    : "border-border text-foreground"
                }`}
              >
                <span
                  className={`flex h-6 min-w-[1.75rem] shrink-0 items-center justify-center rounded-md border px-1 text-[11px] font-bold ${
                    correct
                      ? "border-emerald-600 bg-emerald-600 text-white"
                      : "border-border bg-muted text-muted-foreground"
                  }`}
                >
                  {correct ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : `F${index + 1}`}
                </span>
                {t(key)}
              </li>
            );
          })}
        </ul>

        <div className="mt-5 flex items-center justify-between border-t border-border pt-4 text-sm">
          <span className="text-muted-foreground">{t("home.previewFormat")}</span>
          <span className="inline-flex items-center gap-1 font-semibold text-foreground transition-colors group-hover:text-[#2563EB] dark:group-hover:text-[#60A5FA]">
            {t("home.previewCta")}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
          </span>
        </div>
      </div>
    </Link>
  );
}
