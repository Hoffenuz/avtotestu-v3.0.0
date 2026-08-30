// ============================================================================
// RealExamInterface — "Real imtihon" ekrani
// ----------------------------------------------------------------------------
// MAQSAD: rasmiy imtihon dasturining ko'rinishini takrorlash, shunda
// foydalanuvchi haqiqiy imtihonda birinchi marta ko'radigan narsani
// mashq paytida allaqachon ko'rgan bo'ladi.
//
// SAYTNING QOLGAN QISMIDAN FARQLARI (ataylab):
//   * IZOH YO'Q — imtihonda tushuntirish berilmaydi.
//   * TIL TANLASH YO'Q — til saytda oldindan tanlanadi, imtihon ichida
//     almashtirib bo'lmaydi (rasmiy dasturda ham shunday emas, lekin
//     bu yerda u chalg'ituvchi tugma bo'lardi).
//   * Saqlash / avto-o'tish / mavzu tugmalari yo'q.
//
// RANGLAR NEGA QATTIQ YOZILGAN:
//   Bu ekran sayt mavzusiga (light/dark) ERGASHMAYDI. U aniq bir dasturning
//   ko'rinishini takrorlaydi, shuning uchun ikkala temada ham bir xil
//   bo'lishi SHART. Semantik tokenlar (`bg-card` va h.k.) bu yerda
//   ishlatilmaydi — bu qoidadan ongli chekinish.
// ============================================================================

import { useState, useEffect, useRef, useCallback, useMemo } from "react";
import {
  fetchQuestionJson,
  getFetchErrorMessage,
  normalizeQuestionArray,
  selectQuestionsFromPool,
} from "@/lib/fetchQuestionJson";
import { transformRawToQuestions, type AppQuestion } from "@/lib/questionTransform";
import { recordQuestionAnswers } from "@/lib/questionState";
import { useTestActive } from "@/hooks/useTestActive";
import { useQuestionKeyboardNav } from "@/hooks/useQuestionKeyboardNav";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useTestResults } from "@/hooks/useTestResults";
import { useFullscreen } from "@/hooks/useFullscreen";
import {
  getElapsedTestSeconds,
  getInitialTimeRemaining,
  getInitialStartedAt,
  getSavedTestState,
  clearTestState,
} from "@/lib/testPersistence";
import { TestResults } from "./TestResults";
import { ImageLightbox } from "./ImageLightbox";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { X, Maximize, Minimize } from "lucide-react";
import { toast } from "sonner";

interface RealExamInterfaceProps {
  onExit: () => void;
  dataSource: string;
  questionCount: number;
  timeLimit: number;
  variant: number;
  sessionId?: string | null;
  isPremiumSession?: boolean;
  imagePrefix?: string;
}

/** Javob tugmalari yorlig'i — rasmiy dasturdagidek F1..F4. */
const FKEYS = ["F1", "F2", "F3", "F4", "F5", "F6"] as const;

/**
 * Vaqt `S:MM:SS` ko'rinishida — rasmiy dasturdagidek.
 *
 * Umumiy `formatTestTime()` faqat `MM:SS` beradi. Imtihon 25 daqiqa bo'lgani
 * uchun soat doim `0`, lekin u rasmiy ekranda ko'rinadi va shu sababli bu
 * yerda ham saqlanadi.
 */
function formatExamClock(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const sec = s % 60;
  return `${h}:${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
}

export function RealExamInterface({
  onExit,
  dataSource,
  questionCount,
  timeLimit,
  variant,
  sessionId = null,
  isPremiumSession = false,
  imagePrefix = "/images/",
}: RealExamInterfaceProps) {
  const { t, questionLang } = useLanguage();
  const { user, profile } = useAuth();
  const { saveTestResult } = useTestResults();
  const { isFullscreen, toggleFullscreen, exitFullscreen } = useFullscreen();

  const [questions, setQuestions] = useState<AppQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [current, setCurrent] = useState(1);
  const [selected, setSelected] = useState<Record<number, number>>({});
  const [correct, setCorrect] = useState<Record<number, boolean>>({});
  const [showConfirmExit, setShowConfirmExit] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [zoomImage, setZoomImage] = useState<string | null>(null);

  const storageKey = `testState_exam_${dataSource}_${questionCount}_${user?.id ?? "guest"}`;

  const [timeRemaining, setTimeRemaining] = useState(() =>
    getInitialTimeRemaining(storageKey, timeLimit),
  );
  const [startedAt, setStartedAt] = useState(() => getInitialStartedAt(storageKey));

  const endsAtRef = useRef<number>(
    getSavedTestState(storageKey)?.endsAt ??
      Date.now() + getInitialTimeRemaining(storageKey, timeLimit) * 1000,
  );
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const rawRef = useRef<unknown[] | null>(null);
  const saveAttemptedRef = useRef(false);
  const finishTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const advanceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  /** Raqamlar lentasi — mobilda joriy savolni ko'rinishga surish uchun. */
  const stripRef = useRef<HTMLOListElement | null>(null);
  /**
   * `finish` ga havola: `handleAnswer` uni bog'liqlikka olsa, har javobda
   * qayta yaratilardi. Ref orqali chaqirish shu zanjirni uzadi.
   */
  const finishRef = useRef<() => void>(() => {});

  // Pastki panel test davomida yashiriladi
  useTestActive(!showResults);

  // ---------------------------------------------------------------- yuklash
  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        setLoading(true);
        setError(null);

        const saved = getSavedTestState(storageKey);
        if (
          saved?.rawSelected &&
          Array.isArray(saved.rawSelected) &&
          saved.rawSelected.length === questionCount
        ) {
          rawRef.current = saved.rawSelected;
          if (cancelled) return;
          setQuestions(transformRawToQuestions(saved.rawSelected, questionLang, imagePrefix));
          setCurrent(saved.currentQuestion ?? 1);
          setSelected((saved.selectedAnswers as Record<number, number>) ?? {});
          setCorrect((saved.correctAnswers as Record<number, boolean>) ?? {});
          return;
        }

        const pool = normalizeQuestionArray(await fetchQuestionJson(dataSource));
        if (pool.length === 0) throw new Error(t("test.noQuestionsFound"));

        // Imtihon HAR SAFAR tasodifiy — shuning uchun `randomize: true`
        const picked = selectQuestionsFromPool(pool, questionCount, true);
        rawRef.current = picked;
        if (cancelled) return;
        setQuestions(transformRawToQuestions(picked, questionLang, imagePrefix));
      } catch (err) {
        if (!cancelled) {
          if (!import.meta.env.PROD) console.error("Imtihon yuklanmadi:", err);
          setError(getFetchErrorMessage(err, t));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- questionLang ataylab yo'q: imtihon ichida til almashmaydi
  }, [dataSource, questionCount, imagePrefix, storageKey, t]);

  // ------------------------------------------------------------------ taymer
  useEffect(() => {
    if (showResults || loading || questions.length === 0) return;
    timerRef.current = setInterval(() => {
      setTimeRemaining(Math.max(0, Math.floor((endsAtRef.current - Date.now()) / 1000)));
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [showResults, loading, questions.length]);

  const finish = useCallback(() => {
    if (timerRef.current) clearInterval(timerRef.current);
    clearTestState(storageKey);
    exitFullscreen();
    setShowResults(true);
  }, [storageKey, exitFullscreen]);

  useEffect(() => {
    finishRef.current = finish;
  }, [finish]);

  // Vaqt tugaganda avtomatik yakunlanadi
  useEffect(() => {
    if (timeRemaining === 0 && !showResults && !loading && questions.length > 0) finish();
  }, [timeRemaining, showResults, loading, questions.length, finish]);

  // Kutilayotgan taymerlarni tozalaymiz
  useEffect(() => {
    return () => {
      if (finishTimeoutRef.current) clearTimeout(finishTimeoutRef.current);
      if (advanceTimeoutRef.current) clearTimeout(advanceTimeoutRef.current);
    };
  }, []);

  /**
   * Joriy savol raqamini ko'rinishga suradi (mobildagi bir qatorli lenta).
   * Desktopda lenta o'ralgan va surilmaydi — u yerda bu ta'sirsiz.
   */
  useEffect(() => {
    const el = stripRef.current?.querySelector<HTMLElement>('[data-current="true"]');
    // `?.()` SHART: jsdom (testlar) va ba'zi eski brauzerlarda
    // `scrollIntoView` umuman mavjud emas — chaqiruv effektni yiqitardi.
    el?.scrollIntoView?.({ block: "nearest", inline: "center", behavior: "smooth" });
  }, [current]);

  // --------------------------------------------------------------- saqlanish
  useEffect(() => {
    if (questions.length === 0 || showResults) return;
    try {
      localStorage.setItem(
        storageKey,
        JSON.stringify({
          rawSelected: rawRef.current ?? undefined,
          questionLang,
          currentQuestion: current,
          selectedAnswers: selected,
          correctAnswers: correct,
          endsAt: endsAtRef.current,
          startedAt,
        }),
      );
    } catch {
      /* kvota to'lgan — imtihon baribir davom etadi */
    }
  }, [questions.length, current, selected, correct, showResults, storageKey, startedAt, questionLang]);

  // ------------------------------------------------------------------ amallar
  const total = questions.length;
  const question = questions[current - 1];
  const answered = selected[current] !== undefined;

  /** Qo'lda navigatsiya avtomatik o'tishni BEKOR QILADI — aks holda
   *  foydalanuvchi tanlagan savol ostidan sakrab ketardi. */
  const cancelAutoAdvance = useCallback(() => {
    if (advanceTimeoutRef.current) {
      clearTimeout(advanceTimeoutRef.current);
      advanceTimeoutRef.current = null;
    }
  }, []);

  const goPrev = useCallback(() => {
    cancelAutoAdvance();
    setCurrent((p) => Math.max(1, p - 1));
  }, [cancelAutoAdvance]);

  const goNext = useCallback(() => {
    cancelAutoAdvance();
    setCurrent((p) => Math.min(total, p + 1));
  }, [total, cancelAutoAdvance]);
  useQuestionKeyboardNav(!showResults && !loading, goPrev, goNext);

  const answerCount = question?.answers.length ?? 0;

  const handleAnswer = useCallback(
    (answerId: number) => {
      if (!question || selected[current] !== undefined) return;
      const isCorrect = answerId === question.correctAnswer;
      setSelected((p) => ({ ...p, [current]: answerId }));
      setCorrect((p) => ({ ...p, [current]: isCorrect }));

      /**
       * Oxirgi savol javoblangach imtihon O'ZI yakunlanadi — rasmiy
       * dasturdagidek. Kechikish natijani ko'rish uchun: foydalanuvchi
       * oxirgi javobi to'g'ri chiqqanini ko'rib ulgursin.
       */
      if (Object.keys(selected).length + 1 >= total) {
        if (finishTimeoutRef.current) clearTimeout(finishTimeoutRef.current);
        finishTimeoutRef.current = setTimeout(() => finishRef.current(), 1200);
        return;
      }

      /**
       * KEYINGI SAVOLGA AVTOMATIK O'TISH.
       *
       * `current + 1` EMAS, keyingi JAVOB BERILMAGAN savolga o'tadi:
       * foydalanuvchi orqaga qaytib o'tkazib yuborilgan savolga javob bersa,
       * allaqachon yechilgan savolga tushib qolmaydi.
       *
       * Kechikish — javob yashil/qizil bo'lganini ko'rish uchun.
       */
      if (advanceTimeoutRef.current) clearTimeout(advanceTimeoutRef.current);
      advanceTimeoutRef.current = setTimeout(() => {
        setCurrent((cur) => {
          for (let step = 1; step <= total; step++) {
            const candidate = ((cur - 1 + step) % total) + 1;
            if (candidate !== current && selected[candidate] === undefined) return candidate;
          }
          return cur;
        });
      }, 900);
    },
    [question, selected, current, total],
  );

  /**
   * F1..F4 va 1..4 raqamlari bilan javob tanlash — rasmiy dasturdagidek.
   *
   * F-tugmalarida `preventDefault` SHART: aks holda brauzer F1 da yordam
   * oynasini ochib yuboradi.
   */
  useEffect(() => {
    if (showResults || loading || answerCount === 0) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const target = e.target as HTMLElement | null;
      if (target && /^(INPUT|TEXTAREA)$/.test(target.tagName)) return;

      const fMatch = /^F([1-6])$/.exec(e.key);
      const dMatch = /^[1-6]$/.test(e.key) ? e.key : null;
      const index = fMatch ? Number(fMatch[1]) : dMatch ? Number(dMatch) : 0;
      if (index < 1 || index > answerCount) return;

      e.preventDefault();
      const answer = question?.answers[index - 1];
      if (answer) handleAnswer(answer.id);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showResults, loading, answerCount, question, handleAnswer]);

  const stats = useMemo(() => {
    let ok = 0;
    let bad = 0;
    for (const v of Object.values(correct)) {
      if (v) ok++;
      else bad++;
    }
    return { correct: ok, incorrect: bad };
  }, [correct]);

  // Natijani saqlash — faqat bir marta
  useEffect(() => {
    if (!showResults || !user || saveAttemptedRef.current || variant <= 0) return;
    saveAttemptedRef.current = true;

    void recordQuestionAnswers(
      questions
        .map((q) => ({ globalId: q.globalId, isCorrect: correct[q.id] }))
        .filter(
          (a): a is { globalId: string; isCorrect: boolean } =>
            typeof a.globalId === "string" && typeof a.isCorrect === "boolean",
        ),
    );

    void saveTestResult(
      variant,
      stats.correct,
      total,
      getElapsedTestSeconds(startedAt, timeLimit),
      sessionId,
      isPremiumSession,
    ).then((res) => {
      if (!res.success) {
        toast.error("Natijani saqlab bo'lmadi. Qayta urinib ko'ring.");
        if (!import.meta.env.PROD) console.error("Imtihon natijasi saqlanmadi:", res.error);
      }
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps -- faqat showResults true bo'lganda bir marta
  }, [showResults, user, variant]);

  // ------------------------------------------------------------------- ekran
  if (showResults) {
    return (
      <TestResults
        totalQuestions={total}
        correctAnswers={stats.correct}
        incorrectAnswers={stats.incorrect}
        timeTaken={getElapsedTestSeconds(startedAt, timeLimit)}
        variant={variant}
        onBackToHome={onExit}
        /**
         * "Qayta urinish" boshlash ekraniga qaytaradi — yangi imtihon uchun
         * serverdan YANGI sessiya olinishi shart (eskisi yakunlangan), uni
         * esa boshlash tugmasi qiladi.
         */
        onTryAgain={() => {
          clearTestState(storageKey);
          onExit();
        }}
      />
    );
  }

  if (loading || error || !question) {
    return (
      <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-[#0a1020] px-6 text-center text-white">
        {error ? (
          <>
            <p className="text-lg text-red-300">{error}</p>
            <button
              type="button"
              onClick={onExit}
              className="rounded-lg bg-white/10 px-6 py-2.5 font-semibold hover:bg-white/20"
            >
              {t("test.goBack")}
            </button>
          </>
        ) : (
          <>
            <div className="h-10 w-10 animate-spin rounded-full border-4 border-white/25 border-t-white" />
            <p className="text-white/70">{t("test.loadingData")}</p>
          </>
        )}
      </div>
    );
  }

  const displayName = profile?.full_name || profile?.username || t("nav.user");

  const answeredCount = Object.keys(selected).length;

  return (
    /**
     * Tashqi qatlam — ko'k "fon devori" (rasmiy dasturda ham kontent
     * markazda, chetlarda ko'k naqsh turadi). Ichkarida to'q panel.
     */
    <div className="fixed inset-0 z-50 flex justify-center overflow-hidden bg-[#081a33] bg-[radial-gradient(120%_90%_at_50%_-10%,#143a6b_0%,#081a33_55%,#04101f_100%)] text-white">
      <div className="flex h-full w-full max-w-[1400px] flex-col border-white/10 bg-[#0a1020] shadow-[0_0_60px_rgba(0,0,0,.55)] lg:border-x">
        {/* -------------------------------------------------------- yuqori panel */}
        <header className="flex shrink-0 items-center gap-2.5 border-b border-white/10 bg-[#060b16] px-2.5 py-2 sm:gap-3 sm:px-4">
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border-2 border-white/25 bg-white/5 sm:h-11 sm:w-11"
            aria-hidden="true"
          >
            <img
              src="/rasm1.webp"
              alt=""
              width="32"
              height="32"
              className="h-6 w-6 rounded-full object-contain sm:h-8 sm:w-8"
            />
          </span>

          <span className="min-w-0 flex-1">
            <span className="block truncate text-[13px] font-bold leading-tight sm:text-base">
              {displayName}
            </span>
            <span className="block text-[10px] uppercase tracking-[0.18em] text-white/45 sm:text-[11px]">
              {t("sections.realImtihon")}
            </span>
          </span>

          {/* Javob berilgan / jami — rasmiy dasturdagi hisob o'rnida */}
          <span className="hidden shrink-0 rounded-sm border border-white/15 px-2.5 py-1 text-xs font-semibold tabular-nums text-white/75 sm:block">
            {answeredCount}/{total}
          </span>

          <button
            type="button"
            onClick={toggleFullscreen}
            aria-label={isFullscreen ? t("exam.exitFullscreen") : t("exam.fullscreen")}
            title={isFullscreen ? t("exam.exitFullscreen") : t("exam.fullscreen")}
            className="shrink-0 rounded p-1.5 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
          >
            {isFullscreen ? <Minimize className="h-5 w-5" /> : <Maximize className="h-5 w-5" />}
          </button>

          <button
            type="button"
            onClick={() => setShowConfirmExit(true)}
            aria-label={t("test.exit")}
            className="shrink-0 rounded p-1 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
          >
            <X className="h-6 w-6 sm:h-8 sm:w-8" strokeWidth={1.5} />
          </button>
        </header>

        {/* ---------------------------------------------------------- savol matni */}
        <div className="shrink-0 px-2 pt-2 sm:px-4 sm:pt-3">
          <h1 className="rounded-[3px] border border-[#a8323d] bg-[#8f1a24] px-3 py-3 text-center text-base font-semibold leading-snug shadow-inner sm:px-6 sm:py-3 sm:text-[17px] lg:text-lg">
            {question.text}
          </h1>
        </div>

        {/* ------------------------------------------------- javoblar + rasm */}
        <div className="flex min-h-0 flex-1 flex-col gap-2.5 overflow-y-auto p-2 sm:gap-4 sm:p-4 lg:flex-row lg:gap-5 lg:overflow-hidden">
          {/*
            MOBILDA rasm javoblardan OLDIN ko'rinadi (`order`): savol o'qilgach
            ko'z darhol rasmga tushishi kerak, javoblar esa undan keyin.
            Desktopda esa rasmiy dasturdagidek javoblar CHAPDA.
          */}
          {/*
            RASM RAMKASI — o'lchami O'ZGARMAS.

            Ilgari ramka rasm o'lchamiga moslashardi: kichik rasm kelganda
            maydon torayib, katta rasmda kengayib, savoldan savolga o'tganda
            butun maket sakrardi. Endi ramka doim bir xil (4:3), rasm esa
            uning ichiga `object-contain` bilan joylashadi — qaysi o'lchamda
            bo'lishidan qat'i nazar joylashuv o'zgarmaydi.

            Chegara ataylab ZAIF (`white/10`): ramka sezilsin, lekin rasmdan
            diqqatni tortmasin.
          */}
          <div className="order-1 flex shrink-0 items-start justify-center lg:order-2 lg:min-h-0 lg:flex-1 lg:items-center">
            {question.image ? (
              <div className="flex aspect-[4/3] max-h-[30vh] w-full items-center justify-center overflow-hidden rounded-md border border-white/10 bg-black/25 sm:max-h-[34vh] lg:max-h-full lg:w-auto lg:min-w-0">
                <img
                  src={question.image}
                  alt=""
                  onClick={() => setZoomImage(question.image ?? null)}
                  className="max-h-full max-w-full cursor-zoom-in object-contain"
                />
              </div>
            ) : null}
          </div>

          <ol className="order-2 flex shrink-0 flex-col gap-1.5 sm:gap-2 lg:order-1 lg:w-[330px] xl:w-[380px]">
            {question.answers.map((answer, idx) => {
              const isPicked = selected[current] === answer.id;
              const isRight = answer.id === question.correctAnswer;

              /**
               * Javob berilgunga qadar: ko'k F-quti + to'q slate panel.
               * Javob berilgach: to'g'risi YASHIL, tanlangan xatosi QIZIL.
               *
               * RANG TANLOVI — O'QILISHI BO'YICHA:
               * Ilgari panel `#6f7c8a` (och kulrang) edi va oq matn bilan
               * kontrast atigi ~2.9:1 chiqardi — WCAG AA talabi 4.5:1.
               * Matn "yuvilib" ko'rinardi. Quyidagi qiymatlar 6:1 dan
               * yuqori, ya'ni yorug' xonada ham bemalol o'qiladi.
               */
              let keyTone = "bg-[#2c6ba0]";
              let textTone = "bg-[#3f4d61]";
              if (answered) {
                if (isRight) {
                  keyTone = "bg-[#125c25]";
                  textTone = "bg-[#177a34]";
                } else if (isPicked) {
                  keyTone = "bg-[#7f1a1a]";
                  textTone = "bg-[#a52626]";
                } else {
                  keyTone = "bg-[#2c6ba0]/40";
                  textTone = "bg-[#3f4d61]/40";
                }
              }

              return (
                <li key={answer.id}>
                  <button
                    type="button"
                    onClick={() => handleAnswer(answer.id)}
                    disabled={answered}
                    aria-pressed={isPicked}
                    className={`flex w-full items-stretch overflow-hidden rounded-[3px] text-left transition-colors disabled:cursor-default ${
                      answered ? "" : "hover:brightness-110"
                    }`}
                  >
                    <span
                      className={`flex w-11 shrink-0 items-center justify-center text-[15px] font-bold sm:w-12 ${keyTone}`}
                      aria-hidden="true"
                    >
                      {FKEYS[idx] ?? idx + 1}
                    </span>
                    <span
                      className={`flex-1 px-3 py-3 text-base font-medium leading-snug sm:px-3.5 sm:py-3 ${textTone}`}
                    >
                      {answer.text}
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>
        </div>

        {/* ----------------------------------------- savol raqamlari + vaqt */}
        <footer className="flex shrink-0 items-center justify-between gap-2 border-t border-white/10 bg-[#060b16] px-2 py-2 sm:gap-4 sm:px-4 sm:py-2.5">
          {/*
            MOBILDA — bitta gorizontal qator (`overflow-x-auto`), sm dan
            boshlab esa o'ralib ketadi.

            NEGA: 20 ta raqam mobilda uch qatorga tushib, footer ekranning
            ~17% ini egallardi va savol bilan javoblarga joy qolmasdi. Bitta
            qatorda ular 28px bo'la oladi (barmoq uchun qulayroq) va joriy
            savol avtomatik ko'rinishga suriladi.
          */}
          <ol
            ref={stripRef}
            className="flex min-w-0 flex-1 gap-1.5 overflow-x-auto scrollbar-hide sm:flex-wrap sm:justify-center sm:gap-1 sm:overflow-visible"
          >
            {questions.map((_, i) => {
              const n = i + 1;
              const res = correct[n];
              let tone = "bg-[#3a4454] text-white/75";
              if (res === true) tone = "bg-[#1f9d4d] text-white";
              else if (res === false) tone = "bg-[#cc2b2b] text-white";

              return (
                <li key={n} className="shrink-0">
                  <button
                    type="button"
                    data-current={n === current ? "true" : undefined}
                    onClick={() => {
                      cancelAutoAdvance();
                      setCurrent(n);
                    }}
                    aria-label={`${t("test.question")} ${n}`}
                    aria-current={n === current ? "true" : undefined}
                    className={`h-7 w-7 rounded-[3px] text-xs font-bold tabular-nums transition-colors sm:h-7 sm:w-7 ${tone} ${
                      n === current ? "ring-2 ring-white" : ""
                    }`}
                  >
                    {n}
                  </button>
                </li>
              );
            })}
          </ol>

          <output className="shrink-0 rounded-[3px] border border-black/20 bg-white px-2.5 py-0.5 font-mono text-base font-bold tabular-nums text-black sm:px-5 sm:py-1.5 sm:text-2xl">
            {formatExamClock(timeRemaining)}
          </output>
        </footer>
      </div>

      <ImageLightbox
        imageUrl={zoomImage}
        onClose={() => setZoomImage(null)}
      />

      <AlertDialog open={showConfirmExit} onOpenChange={setShowConfirmExit}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("test.finishConfirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("test.finishConfirmDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("test.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={finish}>{t("test.confirm")}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
