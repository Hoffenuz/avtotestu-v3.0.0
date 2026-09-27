/**
 * Bosh sahifa hero'sidagi HAQIQIY namunaviy savol — javob berish mumkin.
 *
 * NEGA: tashrifchi "Test ishlash" ni bosishdan oldin sayt nima berishini
 * o'zi sinab ko'radi: savol → javob → darhol natija (docs: AVTOSMART-
 * OSISH-REJASI, 1.1).
 *
 * IKKINCHI DARAJALI ELEMENT — asosiy urg'u chapdagi tugmalarda:
 *   * oq karta, lekin juda yengil soya, kichikroq shrift, desktopda tor.
 *     Yarim shaffof (bg-card/40, xira matn) variant sinab ko'rilgan —
 *     katak fon ustida o'qish qiyin bo'lib qoldi (egasi, 2026-09-27);
 *   * o'z tugmalari kichik va chegarali — hero'dagi 60px siyoh tugmalar
 *     bilan e'tibor talashmaydi;
 *   * soxta element yo'q (taymer, "7/20" hisoblagich).
 *
 * "TESTNI DAVOM ETTIRISH" — savol yechib turgan odamni to'g'ridan-to'g'ri
 * to'liq testga olib o'tadi: /test-ishlash boshlash sahifasini ko'rsatmay,
 * imtihon formatidagi 20 talik testni DARHOL boshlaydi (`testAutoStart`).
 *
 * KIMGA, QAYSI SAVOLLAR — `sampleVisibility.ts`:
 *   * mehmon — doimiy 5 ta savol (`homeSampleQuestions.ts`, bosh bundle
 *     ichida — birinchi tashrifda qo'shimcha so'rov yo'q); yechib bo'lgach
 *     karta unga qaytib chiqmaydi;
 *   * kirgan — har kuni hovuzdan boshqa 5 ta (`homeSamplePool.ts`). Hovuz
 *     ALOHIDA chunk: faqat kirgan foydalanuvchiga va faqat karta chiqadigan
 *     bo'lsa yuklanadi. Yuklanguncha karta chizilmaydi (savollar ko'z oldida
 *     almashmasin); yuklanmasa — doimiy 5 ta savol.
 * Har javob darhol saqlanadi: o'rtada chiqib ketgan odam keyingi safar
 * KEYINGI savoldan davom etadi. Kirish holati aniqlanguncha karta
 * chizilmaydi. Hero tepaga tekislangan (`items-start`), shuning uchun karta
 * yo'qolganda chapdagi tugmalar joyidan qimirlamaydi.
 *
 * Savollar sayt tilida (`questionLang` — testlardagi kabi). Noto'g'ri
 * javobda to'g'risi matn bilan ham aytiladi (faqat rangga tayanmaslik uchun).
 */
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Check, Play, X } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { contentKeyFromQuestionLang } from "@/lib/pickLangContent";
import { HOME_SAMPLE_QUESTIONS, type HomeSampleQuestion } from "@/data/homeSampleQuestions";
import { trackEvent } from "@/lib/track";
import { AUTO_START_STATE } from "@/lib/testAutoStart";
import { dailySet, isSampleDone, localDay, readProgress, saveProgress } from "@/lib/sampleVisibility";
import { cn } from "@/lib/utils";

type OptionState = "idle" | "correct" | "wrong" | "muted";

/**
 * Kunlik hovuz — faqat `enabled` bo'lganda yuklanadi.
 * `undefined` — yuklanmoqda, `null` — yuklanmadi (tarmoq).
 */
function useSamplePool(enabled: boolean): readonly HomeSampleQuestion[] | null | undefined {
  const [pool, setPool] = useState<readonly HomeSampleQuestion[] | null | undefined>(undefined);
  useEffect(() => {
    if (!enabled || pool !== undefined) return;
    let alive = true;
    import("@/data/homeSamplePool")
      .then((m) => alive && setPool(m.HOME_SAMPLE_POOL))
      .catch(() => alive && setPool(null));
    return () => {
      alive = false;
    };
  }, [enabled, pool]);
  return pool;
}

export function SampleQuestionCard() {
  const { user, isLoading } = useAuth();
  const userId = user?.id ?? null;
  // Sana sahifa ochilganda bir marta olinadi — yarim tunda karta ko'z
  // oldida boshqa to'plamga almashib ketmasin.
  const [today] = useState(localDay);

  /*
    "Tugaganmi" — akkaunt aniqlanganda BIR MARTA o'qiladi, har renderda
    emas: oxirgi savolga javob berilgan zahoti yutuq saqlanadi, va keyingi
    qayta chizishda karta natijani ko'rsatmay yo'qolib qolmasin.
  */
  const doneAtStart = useMemo(
    () => (isLoading ? true : isSampleDone(userId, today)),
    [isLoading, userId, today],
  );
  const pool = useSamplePool(!isLoading && !!userId && !doneAtStart);

  if (isLoading || doneAtStart) return null;

  let questions: readonly HomeSampleQuestion[];
  if (!userId) {
    questions = HOME_SAMPLE_QUESTIONS;
  } else if (pool === undefined) {
    return null;
  } else {
    questions = dailySet(pool ?? HOME_SAMPLE_QUESTIONS, today);
  }

  // `key` — akkaunt yoki to'plam almashsa holat boshidan o'qiladi.
  return <SampleQuiz key={`${userId ?? "guest"}:${questions[0]?.id}`} questions={questions} userId={userId} today={today} />;
}

interface SampleQuizProps {
  questions: readonly HomeSampleQuestion[];
  userId: string | null;
  today: string;
}

function SampleQuiz({ questions, userId, today }: SampleQuizProps) {
  const { t, questionLang } = useLanguage();
  const navigate = useNavigate();
  const lang = contentKeyFromQuestionLang(questionLang);
  const total = questions.length;

  // Avvalgi yutuqdan davom etiladi (yechilgan savol qayta ko'rsatilmaydi).
  const [start] = useState(() => readProgress(userId, today));
  const [index, setIndex] = useState(() => Math.min(start.next, total - 1));
  const [score, setScore] = useState(start.score);
  const [picked, setPicked] = useState<number | null>(null);
  const [closed, setClosed] = useState(false);

  if (closed || total === 0) return null;

  const question = questions[index];
  const answered = picked !== null;
  const isCorrect = answered && picked === question.correct;
  const isLast = index === total - 1;

  const choose = (optionIndex: number) => {
    if (answered) return;
    const correct = optionIndex === question.correct;
    const nextScore = score + (correct ? 1 : 0);
    setPicked(optionIndex);
    setScore(nextScore);
    // Darhol saqlanadi — sahifa yopilsa ham bu savol qayta chiqmaydi.
    saveProgress(userId, { next: index + 1, score: nextScore }, today);
    trackEvent("home_sample_answer", { question: question.id, correct });
  };

  const next = () => {
    if (isLast) {
      trackEvent("home_sample_done", { score, total });
      setClosed(true);
      return;
    }
    setPicked(null);
    setIndex((current) => current + 1);
  };

  /** To'liq testga o'tish. Yutuq javob paytida saqlangan — bu yerda qo'shimcha ish yo'q. */
  const continueTest = () => {
    trackEvent("home_sample_continue", { question: index + 1, answered });
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
      className="rounded-xl border border-border bg-card p-4 shadow-sm sm:p-5 lg:max-w-[380px]"
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{t("home.sampleLabel")}</p>
        <span className="text-xs tabular-nums text-muted-foreground">
          {index + 1} / {total}
        </span>
      </div>

      <p id="sample-question-text" className="mt-2.5 text-[15px] font-semibold leading-snug text-foreground">
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
        className="mt-3 flex h-9 w-full items-center justify-center gap-1.5 rounded-lg border border-border bg-background text-[13px] font-semibold text-foreground transition-colors hover:border-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <Play className="h-3.5 w-3.5 fill-current" aria-hidden="true" />
        {t("home.sampleContinue")}
      </button>
    </section>
  );
}
