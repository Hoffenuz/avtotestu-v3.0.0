import { useState, useEffect, useRef, useCallback } from "react";
import {
  fetchQuestionJson,
  getFetchErrorMessage,
  normalizeQuestionArray,
  selectQuestionsFromPool,
} from "@/lib/fetchQuestionJson";
import { transformRawToQuestions, type AppQuestion } from "@/lib/questionTransform";
import { useAuth } from "@/contexts/AuthContext";
import { QuestionNavigation } from "./QuestionNavigation";
import { TestResults } from "./TestResults";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  getElapsedTestSeconds,
  getInitialTimeRemaining,
  getInitialStartedAt,
  getSavedTestState,
  clearTestState,
  formatTestTime,
} from "@/lib/testPersistence";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
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
import { Clock, ChevronRight, X, Check, SkipForward, Moon, Sun, Maximize, Minimize } from "lucide-react";
import { ImageLightbox } from "./ImageLightbox";
import { QuestionImageBlock } from "./QuestionImageBlock";
import { IzohNavButton } from "./IzohBox";
import { useDarkMode } from "@/hooks/useDarkMode";
import { useFullscreen } from "@/hooks/useFullscreen";

type Question = AppQuestion;

interface TestInterfaceCombinedProps {
  onExit: () => void;
  dataSource: string;
  testName: string;
  questionCount?: number;
  timeLimit?: number;
  randomize?: boolean;
  imagePrefix?: string;
  isPremiumSession?: boolean;
}

export const TestInterfaceCombined = ({
  onExit,
  dataSource,
  testName,
  questionCount = 50,
  timeLimit = 50 * 60,
  randomize = true,
  imagePrefix = "/images/",
  isPremiumSession = false,
}: TestInterfaceCombinedProps) => {
  const { t, questionLang } = useLanguage();
  const { user } = useAuth();
  const { isDark, toggle: toggleDark } = useDarkMode();
  const { isFullscreen, toggleFullscreen, exitFullscreen } = useFullscreen();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [correctAnswers, setCorrectAnswers] = useState<Record<number, boolean>>({});
  const [revealedQuestions, setRevealedQuestions] = useState<Record<number, boolean>>({});
  /**
   * `dataSource` SHART: u ham tilni, ham free/PRO bazani kodlaydi
   * (free-uz-lat.json / free-ru.json / barcha-*.json).
   *
   * ILGARIGI BUG: kalitda faqat questionCount bor edi. Lotin tilida 50 talik
   * testni boshlab, chiqib, tilni Rus tiliga o'zgartirib qayta boshlansa —
   * AYNI kalit o'qilardi va saqlangan lotincha savollar `ru` bilan qayta
   * transform qilinardi. Bitta til fayli faqat o'z blokini saqlaydi, ya'ni
   * pickLangContent `undefined` qaytarib, 50 ta savol ham BO'SH matn va
   * javobsiz chiqardi (holat darhol qayta saqlanib, yangilash ham yordam
   * bermasdi). Shu bilan birga PRO sotib olgan foydalanuvchi 50 talik testda
   * eski BEPUL savollar to'plamini ko'raverardi.
   */
  const storageKey = `testState_combined_${dataSource}_${questionCount}_${user?.id ?? 'guest'}`;
  // Init from endsAt so refresh doesn't reset the timer
  const [timeRemaining, setTimeRemaining] = useState(() =>
    getInitialTimeRemaining(storageKey, timeLimit)
  );
  const [showFinishDialog, setShowFinishDialog] = useState(false);
  const [showResults, setShowResults] = useState(false);
  // Restored from localStorage so timeTaken stays accurate after refresh
  const [testStartTime, setTestStartTime] = useState(() => getInitialStartedAt(storageKey));
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  // Increment to restart the timer interval (used by onTryAgain)
  const [timerKey, setTimerKey] = useState(0);

  const autoAdvanceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Mirror of timeRemaining for the persistence effect — keeps the heavy
  // localStorage write OFF the 1-second timer tick (perf fix)
  const timeRemainingRef = useRef(timeRemaining);
  const endsAtRef = useRef<number>(
    getSavedTestState(storageKey)?.endsAt ??
      Date.now() + getInitialTimeRemaining(storageKey, timeLimit) * 1000
  );
  // Persist autoAdvance like language setting – survives page refresh
  const [autoAdvance, setAutoAdvance] = useState(() => {
    try { return localStorage.getItem('autoAdvance') === 'true'; } catch { return false; }
  });
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);
  const isSwiping = useRef<boolean>(false);
  const selectedRawRef = useRef<unknown[] | null>(null);

  const buildQuestionsFromPool = useCallback(
    (pool: unknown[], lang: string) => {
      const selected = selectQuestionsFromPool(pool, questionCount, randomize);
      selectedRawRef.current = selected;
      return transformRawToQuestions(selected, lang, imagePrefix);
    },
    [questionCount, randomize, imagePrefix]
  );

  const fetchPool = useCallback(async () => {
    const jsonData = await fetchQuestionJson(dataSource);
    const pool = normalizeQuestionArray(jsonData);
    if (pool.length === 0) {
      throw new Error(t("test.noQuestionsFound"));
    }
    return pool;
  }, [dataSource, t]);

  const loadQuestionBank = useCallback(
    async (lang: string) => buildQuestionsFromPool(await fetchPool(), lang),
    [fetchPool, buildQuestionsFromPool]
  );

  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      try {
        setLoading(true);
        setError(null);

        const saved = getSavedTestState(storageKey);

        if (
          saved?.rawSelected &&
          Array.isArray(saved.rawSelected) &&
          saved.rawSelected.length === questionCount
        ) {
          selectedRawRef.current = saved.rawSelected;
          const transformed = transformRawToQuestions(
            saved.rawSelected,
            questionLang,
            imagePrefix,
          );
          if (!cancelled) {
            setQuestions(transformed);
            setCurrentQuestion(saved.currentQuestion ?? 1);
            setSelectedAnswers((saved.selectedAnswers as Record<number, number>) ?? {});
            setCorrectAnswers((saved.correctAnswers as Record<number, boolean>) ?? {});
            setRevealedQuestions((saved.revealedQuestions as Record<number, boolean>) ?? {});
          }
          return;
        }

        if (
          saved?.questions &&
          Array.isArray(saved.questions) &&
          saved.questions.length === questionCount &&
          saved.questionLang === questionLang
        ) {
          if (!cancelled) {
            setQuestions(saved.questions as Question[]);
            setCurrentQuestion(saved.currentQuestion ?? 1);
            setSelectedAnswers((saved.selectedAnswers as Record<number, number>) ?? {});
            setCorrectAnswers((saved.correctAnswers as Record<number, boolean>) ?? {});
            setRevealedQuestions((saved.revealedQuestions as Record<number, boolean>) ?? {});
          }
          return;
        }

        if (saved?.questions?.length && saved.questionLang !== questionLang) {
          clearTestState(storageKey);
        }

        const transformed = await loadQuestionBank(questionLang);
        if (!cancelled) {
          setQuestions(transformed);
        }
      } catch (err) {
        if (!cancelled) {
          if (!import.meta.env.PROD) console.error("Error fetching test data:", err);
          setError(getFetchErrorMessage(err, t));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- questionLang: separate effect
  }, [dataSource, questionCount, randomize, imagePrefix, storageKey, loadQuestionBank, t]);

  useEffect(() => {
    if (!selectedRawRef.current?.length) return;
    setQuestions(
      transformRawToQuestions(selectedRawRef.current, questionLang, imagePrefix)
    );
  }, [questionLang, imagePrefix]);

  // Timer – wall-clock from endsAt; paused while loading / no questions
  useEffect(() => {
    if (showResults || loading || questions.length === 0) return;
    timerRef.current = setInterval(() => {
      const remaining = Math.max(0, Math.floor((endsAtRef.current - Date.now()) / 1000));
      setTimeRemaining(remaining);
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timerKey, showResults, loading, questions.length]);

  // Keep the ref in sync without triggering the persistence effect each tick
  useEffect(() => {
    timeRemainingRef.current = timeRemaining;
  }, [timeRemaining]);

  // Auto-finish when timer reaches 0
  useEffect(() => {
    if (timeRemaining === 0 && !showResults && !loading && questions.length > 0) {
      if (timerRef.current) clearInterval(timerRef.current);
      clearTestState(storageKey);
      exitFullscreen();
      setShowResults(true);
    }
  }, [timeRemaining, showResults, loading, questions.length, storageKey, exitFullscreen]);

  useEffect(() => {
    return () => {
      if (autoAdvanceTimeoutRef.current) {
        clearTimeout(autoAdvanceTimeoutRef.current);
      }
    };
  }, []);

  // Persist test state – save full questions array so randomisation is preserved on refresh.
  // timeRemaining is read from a ref (not in deps) so the full questions array
  // is NOT re-serialized to localStorage every second; endsAt stays accurate.
  useEffect(() => {
    if (questions.length === 0 || showResults) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify({
        questions,
        rawSelected: selectedRawRef.current ?? undefined,
        questionLang,
        currentQuestion,
        selectedAnswers,
        correctAnswers,
        revealedQuestions,
        endsAt: endsAtRef.current,
        startedAt: testStartTime,
      }));
    } catch { /* ignore quota errors */ }
  }, [questions, currentQuestion, selectedAnswers, correctAnswers, revealedQuestions, showResults, storageKey, testStartTime, questionLang]);

  const formatTime = (seconds: number) => formatTestTime(seconds);

  const totalQuestions = questions.length;
  const question = questions[currentQuestion - 1];
  const isRevealed = revealedQuestions[currentQuestion];
  const selectedAnswer = selectedAnswers[currentQuestion];

  const handleAnswerSelect = (answerId: number) => {
    if (isRevealed) return;
    
    const isCorrect = answerId === question.correctAnswer;
    
    setSelectedAnswers(prev => ({
      ...prev,
      [currentQuestion]: answerId
    }));
    
    setCorrectAnswers(prev => ({
      ...prev,
      [currentQuestion]: isCorrect
    }));
    
    setRevealedQuestions(prev => ({
      ...prev,
      [currentQuestion]: true
    }));

    // Check if this was the last question - auto-submit after brief delay
    const answeredCount = Object.keys(selectedAnswers).length + 1; // +1 for current answer
    if (answeredCount >= totalQuestions) {
      // Clear timer and auto-submit after showing feedback
      if (autoAdvanceTimeoutRef.current) {
        clearTimeout(autoAdvanceTimeoutRef.current);
      }
      autoAdvanceTimeoutRef.current = setTimeout(() => {
        if (timerRef.current) clearInterval(timerRef.current);
        clearTestState(storageKey);
        exitFullscreen();
        setShowResults(true);
      }, 1500);
      return;
    }

    // Auto-advance (only if enabled)
    if (autoAdvance && currentQuestion < totalQuestions) {
      if (autoAdvanceTimeoutRef.current) {
        clearTimeout(autoAdvanceTimeoutRef.current);
      }
      const delay = 1100;
      autoAdvanceTimeoutRef.current = setTimeout(() => {
        setCurrentQuestion(prev => Math.min(totalQuestions, prev + 1));
      }, delay);
    }
  };

  const handleSwipe = () => {
    const swipeThreshold = 60;
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > swipeThreshold) {
      isSwiping.current = true;
      if (diff > 0 && currentQuestion < totalQuestions) {
        if (autoAdvanceTimeoutRef.current) clearTimeout(autoAdvanceTimeoutRef.current);
        setCurrentQuestion(prev => Math.min(totalQuestions, prev + 1));
      } else if (diff < 0 && currentQuestion > 1) {
        if (autoAdvanceTimeoutRef.current) clearTimeout(autoAdvanceTimeoutRef.current);
        setCurrentQuestion(prev => Math.max(1, prev - 1));
      }
      setTimeout(() => { isSwiping.current = false; }, 100);
    } else {
      isSwiping.current = false;
    }
  };

  const getAnswerState = (answerId: number) => {
    if (!isRevealed || !question) return "default";
    if (answerId === question.correctAnswer) return "correct";
    if (answerId === selectedAnswer && answerId !== question.correctAnswer) return "incorrect";
    return "default";
  };

  const handleFinishTest = () => {
    setShowFinishDialog(true);
  };

  const confirmFinishTest = () => {
    setShowFinishDialog(false);
    if (timerRef.current) clearInterval(timerRef.current);
    clearTestState(storageKey);
    exitFullscreen();
    setShowResults(true);
  };

  const handleExit = () => {
    exitFullscreen();
    onExit();
  };

  const getTestStats = () => {
    let correct = 0;
    let incorrect = 0;
    
    Object.entries(correctAnswers).forEach(([_, isCorrect]) => {
      if (isCorrect) correct++;
      else incorrect++;
    });
    
    return { correct, incorrect };
  };

  // Exit fullscreen when results appear (not during render)
  useEffect(() => {
    if (showResults) exitFullscreen();
  }, [showResults, exitFullscreen]);

  if (showResults) {
    const stats = getTestStats();
    const timeTaken = getElapsedTestSeconds(testStartTime, timeLimit);
    
    return (
      <TestResults
        totalQuestions={totalQuestions}
        correctAnswers={stats.correct}
        incorrectAnswers={stats.incorrect}
        timeTaken={timeTaken}
        variant={0}
        onBackToHome={handleExit}
        isDark={isDark}
        onTryAgain={async () => {
          clearTestState(storageKey);
          setSelectedAnswers({});
          setCorrectAnswers({});
          setRevealedQuestions({});
          setCurrentQuestion(1);
          setTestStartTime(Date.now());
          endsAtRef.current = Date.now() + timeLimit * 1000;
          setTimeRemaining(timeLimit);
          setShowResults(false);
          setTimerKey((k) => k + 1);
          setLoading(true);
          setError(null);
          try {
            setQuestions(await loadQuestionBank(questionLang));
          } catch {
            setError(t("test.errorLoadingData"));
          } finally {
            setLoading(false);
          }
        }}
      />
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 md:w-12 md:h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground text-lg font-medium">{t("test.loadingData")}</p>
          <p className="text-muted-foreground text-sm mt-2">{testName}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="p-8 max-w-md text-center">
          <p className="text-destructive mb-6 text-lg">{error}</p>
          <Button size="lg" onClick={onExit}>{t("test.goBack")}</Button>
        </Card>
      </div>
    );
  }

  if (!question) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="p-8 max-w-md text-center">
          <p className="text-muted-foreground mb-6 text-lg">{t("test.noQuestionsFound")}</p>
          <Button size="lg" onClick={onExit}>{t("test.goBack")}</Button>
        </Card>
      </div>
    );
  }

  return (
    <div className={`h-dvh max-h-dvh bg-background text-foreground flex flex-col overflow-hidden${isDark ? ' dark' : ''}`}>
      {/* Header */}
      <header className="bg-card border-b border-border px-2 py-2 md:px-4 md:py-2.5 shrink-0">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-1.5">
          <div className="flex items-center gap-2 md:gap-4 min-w-0">
            <span className="hidden md:inline text-sm font-medium text-muted-foreground line-clamp-1 min-w-0">{testName}</span>
            <div className="flex items-center gap-1 text-muted-foreground shrink-0">
              <Clock className="w-3.5 h-3.5 md:w-4 md:h-4" />
              <span className="text-sm md:text-base font-medium tabular-nums">{formatTime(timeRemaining)}</span>
            </div>
          </div>
          <div className="flex gap-1 md:gap-2 shrink-0">
            <Button 
              variant="outline" 
              size="sm" 
              className={`h-9 w-9 p-0 md:h-8 md:w-auto md:px-3 text-xs ${autoAdvance ? 'bg-primary/10 text-primary border-primary/30' : 'text-muted-foreground'}`}
              onClick={() => setAutoAdvance(prev => {
                const next = !prev;
                try { localStorage.setItem('autoAdvance', String(next)); } catch { /* storage error ignored */ }
                return next;
              })}
              title={autoAdvance ? "Avto-o'tish yoqilgan" : "Avto-o'tish o'chirilgan"}
            >
              <SkipForward className="w-5 h-5 md:w-4 md:h-4" />
            </Button>
            <Button
              variant="outline"
              size="sm"
              className={`h-9 w-9 p-0 md:h-8 md:w-auto md:px-3 text-xs ${isDark ? 'bg-yellow-400/10 text-yellow-400 border-yellow-400/30' : 'text-muted-foreground'}`}
              onClick={toggleDark}
              title={isDark ? "Yorug' rejim" : "Qorong'u rejim"}
            >
              {isDark ? <Sun className="w-5 h-5 md:w-4 md:h-4" /> : <Moon className="w-5 h-5 md:w-4 md:h-4" />}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="hidden md:inline-flex h-8 px-3 text-xs"
              onClick={toggleFullscreen}
              title={isFullscreen ? "To'liq ekrandan chiqish" : "To'liq ekran"}
            >
              {isFullscreen ? <Minimize className="w-4 h-4" /> : <Maximize className="w-4 h-4" />}
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-9 px-2.5 md:h-8 md:px-3 text-xs md:text-xs bg-green-500/10 text-green-600 border-green-500/30 hover:bg-green-500/20"
              onClick={handleFinishTest}
            >
              {t("test.finish")}
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-9 px-2.5 md:h-8 md:px-3 text-xs md:text-xs text-destructive border-destructive/30 hover:bg-destructive/10"
              onClick={handleExit}
            >
              {t("test.exit")}
            </Button>
          </div>
        </div>
      </header>

      {/* Question Navigation */}
      <QuestionNavigation
        currentQuestion={currentQuestion}
        totalQuestions={totalQuestions}
        answeredQuestions={selectedAnswers}
        correctAnswers={correctAnswers}
        onQuestionSelect={(num) => {
          if (autoAdvanceTimeoutRef.current) {
            clearTimeout(autoAdvanceTimeoutRef.current);
          }
          setCurrentQuestion(num);
        }}
      />

      {/* Main Content */}
      <main 
        className="flex-1 min-h-0 px-4 py-4 md:px-8 md:py-5 w-full overflow-y-auto overscroll-contain"
        onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; isSwiping.current = false; }}
        onTouchMove={(e) => { if (Math.abs(e.touches[0].clientX - touchStartX.current) > 30) isSwiping.current = true; }}
        onTouchEnd={(e) => { touchEndX.current = e.changedTouches[0].clientX; if (isSwiping.current) { e.preventDefault(); handleSwipe(); } }}
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-sm md:text-base text-muted-foreground mb-3 font-medium">
          </div>

          <div className="md:flex md:gap-5 md:items-start">
            <div className="md:w-[55%] md:flex-shrink-0">
              <Card className="p-4 md:p-5 bg-card border-border mb-4">
                <p className="text-base md:text-[15px] font-medium text-foreground leading-relaxed">
                  {question.text}
                </p>
              </Card>

              {question.image && (
                <Card className="md:hidden p-3 bg-card border-border mb-4 overflow-hidden">
                  <QuestionImageBlock
                    src={question.image}
                    onZoom={() => setZoomImage(question.image!)}
                    layout="mobile"
                  />
                </Card>
              )}

              {/* Answer Options — 20 talik TestInterfaceBase bilan bir xil */}
              <div className="space-y-3">
                {question.answers.map((answer) => {
                  const state = getAnswerState(answer.id);
                  const isSelected = selectedAnswer === answer.id;

                  return (
                    <button
                      key={answer.id}
                      onClick={() => { if (!isSwiping.current) handleAnswerSelect(answer.id); }}
                      disabled={isRevealed}
                      className={`
                        w-full p-4 md:p-4 rounded-lg border text-left transition-all duration-200
                        flex items-center gap-4
                        ${state === "correct"
                          ? "border-transparent bg-green-500 text-white"
                          : state === "incorrect"
                          ? "border-transparent bg-red-400 text-white"
                          : isSelected
                          ? "border-primary bg-primary/10 text-primary"
                          : "border-border bg-card hover:bg-muted/50 text-foreground"
                        }
                      `}
                    >
                      <div className={`
                        w-7 h-7 md:w-8 md:h-8 rounded-full flex items-center justify-center flex-shrink-0
                        ${state === "correct"
                          ? "bg-white/20"
                          : state === "incorrect"
                          ? "bg-white/20"
                          : "border-2 border-muted-foreground/50"
                        }
                      `}>
                        {state === "correct" ? (
                          <Check className="w-4 h-4 md:w-5 md:h-5 text-white" />
                        ) : state === "incorrect" ? (
                          <X className="w-4 h-4 md:w-5 md:h-5 text-white" />
                        ) : null}
                      </div>
                      <span className="text-base md:text-sm font-medium">{answer.text}</span>
                    </button>
                  );
                })}
              </div>

            </div>

            {question.image && (
              <div className="hidden md:block md:w-[45%] md:flex-shrink-0">
                <Card className="p-3 bg-card border-border overflow-hidden sticky top-4">
                  <QuestionImageBlock
                    src={question.image}
                    onZoom={() => setZoomImage(question.image!)}
                    layout="desktop"
                  />
                </Card>
              </div>
            )}
          </div>

        </div>
      </main>

      {/* Bottom Navigation */}
      <footer className="bg-card border-t border-border px-3 py-2.5 md:px-4 md:py-3 shrink-0 sticky bottom-0 z-30 pb-[max(0.625rem,env(safe-area-inset-bottom))]">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-1.5 sm:gap-2">
          <IzohNavButton
            key={`izoh-${currentQuestion}`}
            text={question?.izoh}
            title={t("test.explanation")}
            emptyText={t("test.noExplanation")}
            requirePro={!isPremiumSession}
            isDark={isDark}
            onOpen={() => {
              if (autoAdvanceTimeoutRef.current) {
                clearTimeout(autoAdvanceTimeoutRef.current);
              }
            }}
          />

          <Button
            size="default"
            className="h-9 px-2.5 sm:px-3 md:h-10 md:px-4 text-sm shrink-0"
            disabled={currentQuestion === totalQuestions}
            onClick={() => {
              if (autoAdvanceTimeoutRef.current) {
                clearTimeout(autoAdvanceTimeoutRef.current);
              }
              setCurrentQuestion(prev => Math.min(totalQuestions, prev + 1));
            }}
          >
            <span className="max-[340px]:hidden">{t("test.next")}</span>
            <ChevronRight className="w-4 h-4 ml-0.5 sm:ml-1" />
          </Button>
        </div>
      </footer>

      {/* Finish Dialog */}
      <AlertDialog open={showFinishDialog} onOpenChange={setShowFinishDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("test.finishConfirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription>
              {t("test.finishConfirmDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("test.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={confirmFinishTest}>
              {t("test.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <ImageLightbox imageUrl={zoomImage} onClose={() => setZoomImage(null)} />
    </div>
  );
};