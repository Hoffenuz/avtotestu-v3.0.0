/**
 * Bosh sahifa hero'sidagi HAQIQIY namunaviy savol — javob berish mumkin.
 *
 * NEGA: tashrifchi "Test ishlash" ni bosishdan oldin sayt nima berishini
 * o'zi sinab ko'radi: savol → javob → darhol natija (docs: AVTOSMART-
 * OSISH-REJASI, 1.1).
 *
 * IKKINCHI DARAJALI ELEMENT — asosiy urg'u chapdagi tugmalarda:
 *   * soyasiz, yarim shaffof karta, kichikroq shrift, desktopda tor;
 *   * o'z tugmalari kichik va chegarali — hero'dagi 60px siyoh tugmalar
 *     bilan e'tibor talashmaydi;
 *   * soxta element yo'q (taymer, "7/20" hisoblagich).
 *
 * "TESTNI DAVOM ETTIRISH" — savol yechib turgan odamni to'g'ridan-to'g'ri
 * to'liq testga olib o'tadi: /test-ishlash boshlash sahifasini ko'rsatmay,
 * imtihon formatidagi 20 talik testni DARHOL boshlaydi (`testAutoStart`).
 *
 * 5 ta savol tugagach natija ko'rsatiladi va "Yakunlash" bosilganda karta
 * YOPILADI. Kimga va qachon qayta chiqishi — `sampleVisibility.ts` (mehmonga
 * har safar, kirganga kuniga bir marta). Kirish holati aniqlanguncha karta
 * chizilmaydi — paydo bo'lib keyin yo'qolmasin. Hero tepaga tekislangan
 * (`items-start`), shuning uchun karta yopilganda chapdagi tugmalar joyidan
 * qimirlamaydi.
 *
 * Savollar bepul bazaning o'zidan (`homeSampleQuestions.ts`), sayt tilida
 * (`questionLang` — testlardagi kabi). Noto'g'ri javobda to'g'risi matn bilan
 * ham aytiladi (faqat rangga tayanmaslik uchun).
 */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Check, Play, X } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { contentKeyFromQuestionLang } from "@/lib/pickLangContent";
import { HOME_SAMPLE_QUESTIONS } from "@/data/homeSampleQuestions";
import { trackEvent } from "@/lib/track";
import { AUTO_START_STATE } from "@/lib/testAutoStart";
import { markSampleDone, shouldShowSample } from "@/lib/sampleVisibility";
import { cn } from "@/lib/utils";

type OptionState = "idle" | "correct" | "wrong" | "muted";

export function SampleQuestionCard() {
  const { t, questionLang } = useLanguage();
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const userId = user?.id ?? null;
  const lang = contentKeyFromQuestionLang(questionLang);

  const [done, setDone] = useState(false);
  const [index, setIndex] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [score, setScore] = useState(0);

  // Akkaunt almashsa (chiqish/kirish) — holat yangi foydalanuvchi bo'yicha.
  useEffect(() => {
    setDone(false);
    setIndex(0);
    setPicked(null);
    setScore(0);
  }, [userId]);

  if (isLoading || done || !shouldShowSample(userId)) return null;

  const total = HOME_SAMPLE_QUESTIONS.length;
  const question = HOME_SAMPLE_QUESTIONS[index];
  const answered = picked !== null;
  const isCorrect = answered && picked === question.correct;
  const isLast = index === total - 1;

  const choose = (optionIndex: number) => {
    if (answered) return;
    const correct = optionIndex === question.correct;
    setPicked(optionIndex);
    if (correct) setScore((s) => s + 1);
    trackEvent("home_sample_answer", { question: question.id, correct });
  };

  const rememberDone = () => markSampleDone(userId);

  const next = () => {
    if (isLast) {
      trackEvent("home_sample_done", { score, total });
      rememberDone();
      setDone(true);
      return;
    }
    setPicked(null);
    setIndex((current) => current + 1);
  };

  /**
   * To'liq testga o'tish. 5 ta savolning oxirgisiga javob berilgan bo'lsa,
   * karta ham "tugadi" deb eslanadi (kirgan foydalanuvchida — bugunga).
   */
  const continueTest = () => {
    trackEvent("home_sample_continue", { question: index + 1, answered });
    if (isLast && answered) rememberDone();
    navigate("/test-ishlash", { state: AUTO_START_STATE });
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
      className="rounded-xl border border-border/70 bg-card/40 p-4 sm:p-5 lg:ml-auto lg:max-w-[360px]"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("home.sampleLabel")}</p>
        <span className="text-xs tabular-nums text-muted-foreground">
          {index + 1} / {total}
        </span>
      </div>

      <p id="sample-question-text" className="mt-2.5 text-sm font-semibold leading-snug text-foreground/85">
        {question.text[lang]}
      </p>

      <div role="group" aria-labelledby="sample-question-text" className="mt-3 space-y-1.5">
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
                "flex w-full items-center gap-2.5 rounded-lg border px-3 py-2 text-left text-[13px] transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                state === "idle" &&
                  "border-border/80 bg-transparent text-foreground/85 hover:border-primary/40 hover:bg-primary/[0.04]",
                state === "correct" &&
                  "border-emerald-500/60 bg-emerald-50 font-semibold text-emerald-900 dark:bg-emerald-500/10 dark:text-emerald-200",
                state === "wrong" &&
                  "border-red-400/70 bg-red-50 text-red-900 dark:bg-red-500/10 dark:text-red-200",
                state === "muted" && "border-border/80 bg-transparent text-muted-foreground",
              )}
            >
              <span
                aria-hidden="true"
                className={cn(
                  "flex h-5 min-w-[1.5rem] shrink-0 items-center justify-center rounded border px-1 text-[10px] font-bold",
                  state === "correct" && "border-emerald-600 bg-emerald-600 text-white",
                  state === "wrong" && "border-red-500 bg-red-500 text-white",
                  (state === "idle" || state === "muted") && "border-border bg-muted text-muted-foreground",
                )}
              >
                {state === "correct" ? (
                  <Check className="h-3 w-3" strokeWidth={3} />
                ) : state === "wrong" ? (
                  <X className="h-3 w-3" strokeWidth={3} />
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
      <div aria-live="polite" className="mt-2.5 min-h-[24px] text-[13px]">
        {answered ? (
          <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
            <p
              className={cn(
                "font-semibold",
                isCorrect ? "text-emerald-700 dark:text-emerald-400" : "text-red-600 dark:text-red-400",
              )}
            >
              {isCorrect
                ? t("home.sampleCorrect")
                : t("home.sampleWrong").replace("{answer}", question.options[question.correct][lang])}
              {isLast && (
                <span className="ml-2 font-normal text-muted-foreground">
                  {t("home.sampleScore").replace("{n}", String(score)).replace("{total}", String(total))}
                </span>
              )}
            </p>
            <button
              type="button"
              onClick={next}
              className="inline-flex shrink-0 items-center gap-1 rounded-md font-semibold text-foreground hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            >
              {isLast ? t("home.sampleFinish") : t("home.sampleNext")}
              {!isLast && <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />}
            </button>
          </div>
        ) : (
          <p className="text-muted-foreground">{t("home.sampleHint")}</p>
        )}
      </div>

      {/*
        To'liq testga o'tish — KICHIK va CHEGARALI (to'la emas): asosiy
        harakat baribir hero'dagi "Test ishlash". Doim shu joyda turadi —
        javobdan keyin paydo bo'lib kartani cho'zmasin.
      */}
      <button
        type="button"
        onClick={continueTest}
        className="mt-3 flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-border/80 bg-transparent text-[13px] font-semibold text-foreground/85 transition-colors hover:border-primary hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Play className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
        {t("home.sampleContinue")}
      </button>
    </section>
  );
}
