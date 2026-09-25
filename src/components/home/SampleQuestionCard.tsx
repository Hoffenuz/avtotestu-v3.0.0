/**
 * Bosh sahifa hero'sidagi HAQIQIY namunaviy savol — javob berish mumkin.
 *
 * NEGA: tashrifchi "Test ishlash" ni bosishdan oldin sayt nima berishini
 * o'zi sinab ko'radi: savol → javob → darhol natija. Strategiya: Google'dan
 * kelgan odam birinchi soniyada savolni ko'rsin (docs: AVTOSMART-OSISH-
 * REJASI, 1.1).
 *
 * TO'G'RI VA SODDA:
 *   * soxta element yo'q — taymer, "7/20" hisoblagich, progress chizig'i
 *     olib tashlandi (avvalgi statik kartada ular bor edi va karta
 *     bosiladigan testga o'xshardi-yu, bosib bo'lmasdi);
 *   * savollar bepul bazaning o'zidan (`homeSampleQuestions.ts`), tanlangan
 *     sayt tilida (`questionLang` — testlardagi kabi);
 *   * javobdan keyin: to'g'ri variant yashil, noto'g'ri tanlov qizil,
 *     to'g'ri javob matn bilan ham aytiladi (rangga tayanmaslik uchun).
 *
 * Karta bosh maqsadni ALMASHTIRMAYDI: pastda doim "To'liq testni
 * boshlash" havolasi turadi.
 */
import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Check, X } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { contentKeyFromQuestionLang } from "@/lib/pickLangContent";
import { HOME_SAMPLE_QUESTIONS } from "@/data/homeSampleQuestions";
import { trackEvent } from "@/lib/track";
import { cn } from "@/lib/utils";

type OptionState = "idle" | "correct" | "wrong" | "muted";

export function SampleQuestionCard() {
  const { t, questionLang } = useLanguage();
  const lang = contentKeyFromQuestionLang(questionLang);

  // Birinchi savol DOIM bir xil: server/bot snapshot bilan farq qilmaydi va
  // birinchi renderda hech narsa almashmaydi.
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);

  const question = HOME_SAMPLE_QUESTIONS[index];
  const answered = picked !== null;
  const isCorrect = answered && picked === question.correct;
  const total = HOME_SAMPLE_QUESTIONS.length;

  const choose = (optionIndex: number) => {
    if (answered) return;
    setPicked(optionIndex);
    trackEvent("home_sample_answer", {
      question: question.id,
      correct: optionIndex === question.correct,
    });
  };

  const next = () => {
    setPicked(null);
    setIndex((current) => (current + 1) % total);
  };

  const stateOf = (optionIndex: number): OptionState => {
    if (!answered) return "idle";
    if (optionIndex === question.correct) return "correct";
    if (optionIndex === picked) return "wrong";
    return "muted";
  };

  return (
    <section
      aria-labelledby="sample-question-text"
      className="rounded-xl border border-border bg-card p-5 shadow-[0_1px_2px_rgba(16,24,40,0.04),0_12px_32px_-16px_rgba(19,26,69,0.22)] sm:p-6"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-[13px] font-semibold text-muted-foreground">{t("home.sampleLabel")}</p>
        <span className="text-xs tabular-nums text-muted-foreground">
          {index + 1} / {total}
        </span>
      </div>

      <p id="sample-question-text" className="mt-3 text-base font-semibold leading-snug text-foreground">
        {question.text[lang]}
      </p>

      <div role="group" aria-labelledby="sample-question-text" className="mt-4 space-y-2">
        {question.options.map((option, optionIndex) => {
          const state = stateOf(optionIndex);
          return (
            <button
              key={`${question.id}-${optionIndex}`}
              type="button"
              onClick={() => choose(optionIndex)}
              disabled={answered}
              aria-pressed={picked === optionIndex}
              className={cn(
                "flex w-full items-center gap-3 rounded-lg border px-3 py-2.5 text-left text-sm transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                state === "idle" &&
                  "border-border bg-background text-foreground hover:border-primary/40 hover:bg-primary/[0.04]",
                state === "correct" &&
                  "border-emerald-500/60 bg-emerald-50 font-semibold text-emerald-900 dark:bg-emerald-500/10 dark:text-emerald-200",
                state === "wrong" &&
                  "border-red-400/70 bg-red-50 text-red-900 dark:bg-red-500/10 dark:text-red-200",
                state === "muted" && "border-border bg-background text-muted-foreground",
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "flex h-6 min-w-[1.75rem] shrink-0 items-center justify-center rounded-md border px-1 text-[11px] font-bold",
                  state === "correct" && "border-emerald-600 bg-emerald-600 text-white",
                  state === "wrong" && "border-red-500 bg-red-500 text-white",
                  (state === "idle" || state === "muted") && "border-border bg-muted text-muted-foreground",
                )}
              >
                {state === "correct" ? (
                  <Check className="h-3.5 w-3.5" strokeWidth={3} />
                ) : state === "wrong" ? (
                  <X className="h-3.5 w-3.5" strokeWidth={3} />
                ) : (
                  `F${optionIndex + 1}`
                )}
              </span>
              <span className="min-w-0">{option[lang]}</span>
            </button>
          );
        })}
      </div>

      {/* Natija — ekran o'quvchiga ham aytiladi */}
      <div
        aria-live="polite"
        className="mt-3 flex min-h-[28px] flex-wrap items-center justify-between gap-x-3 gap-y-1 text-sm"
      >
        {answered ? (
          <>
            <p
              className={cn(
                "font-semibold",
                isCorrect ? "text-emerald-700 dark:text-emerald-400" : "text-red-600 dark:text-red-400",
              )}
            >
              {isCorrect
                ? t("home.sampleCorrect")
                : t("home.sampleWrong").replace("{answer}", question.options[question.correct][lang])}
            </p>
            <button
              type="button"
              onClick={next}
              className="inline-flex shrink-0 items-center gap-1 rounded-md font-semibold text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {t("home.sampleNext")}
              <ArrowRight className="h-4 w-4" aria-hidden="true" />
            </button>
          </>
        ) : (
          <p className="text-muted-foreground">{t("home.sampleHint")}</p>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between gap-3 border-t border-border pt-4">
        <span className="text-[13px] text-muted-foreground">{t("home.sampleFormat")}</span>
        <Link
          to="/test-ishlash"
          onClick={() => trackEvent("home_sample_cta", { answered })}
          className="inline-flex shrink-0 items-center gap-1 rounded-md text-sm font-semibold text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring dark:text-foreground"
        >
          {t("home.sampleCta")}
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
