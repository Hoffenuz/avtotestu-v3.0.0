import { useState, useEffect, useRef, useCallback } from "react";
import { fetchQuestionJson, getFetchErrorMessage } from "@/lib/fetchQuestionJson";
import { QuestionNavigation } from "./QuestionNavigation";
import { TestResults } from "./TestResults";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useTestResults } from "@/hooks/useTestResults";
import {
  getElapsedTestSeconds,
  getInitialTimeRemaining,
  formatTestTime,
  getInitialStartedAt,
  getSavedTestState,
  clearTestState,
} from "@/lib/testPersistence";
import { pickIzohText, pickLangContent } from "@/lib/pickLangContent";
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
import { Clock, ChevronRight, X, Check, Maximize, Minimize, SkipForward, Moon, Sun } from "lucide-react";
import { useDarkMode } from "@/hooks/useDarkMode";
import { ImageLightbox } from "./ImageLightbox";
import { QuestionImageBlock } from "./QuestionImageBlock";
import { IzohNavButton } from "./IzohBox";

// Eski format (lesson + data)
interface QuestionData {
  id: number;
  bilet_id: number;
  question_id: number;
  name: string | null;
  question: { oz: string; uz: string; ru: string };
  photo: string | null;
  answers: {
    status: number;
    answer_id: number;
    answer: { oz: string[]; uz: string[]; ru: string[] };
  };
}

interface VariantData {
  lesson: string;
  data: QuestionData[];
}

// Yangi format: task_info, media_url, content.uz_lat / uz_cyr / ru
interface VariantTaskNew {
  task_info?: { global_id?: string; ticket_num?: number; order?: number };
  media_url?: string;
  izoh?: { uz_lat?: string; uz_cyr?: string; ru?: string } | string;
  content: {
    uz_lat?: { text: string; options: { id: number; text: string; is_correct: boolean }[] };
    uz_cyr?: { text: string; options: { id: number; text: string; is_correct: boolean }[] };
    ru?: { text: string; options: { id: number; text: string; is_correct: boolean }[] };
  };
}

function isNewVariantFormat(raw: unknown): raw is VariantTaskNew[] {
  return Array.isArray(raw) && raw.length > 0 && !!raw[0] && typeof (raw[0] as VariantTaskNew).content === 'object' && (
    'uz_lat' in (raw[0] as VariantTaskNew).content ||
    'uz_cyr' in (raw[0] as VariantTaskNew).content ||
    'ru' in (raw[0] as VariantTaskNew).content
  );
}

function transformVariantRaw(raw: unknown, questionLang: string): Question[] {
  if (isNewVariantFormat(raw)) {
    const tasks = raw as VariantTaskNew[];
    if (tasks.length === 0) return [];
    const imageBase = "/images/";
    return tasks.map((task, idx) => {
      // Never fall back ru/cyr → Latin (stale CDN caches used to hide missing langs)
      const langContent = pickLangContent(task.content, questionLang);
      if (!langContent || !langContent.options?.length) {
        return {
          id: idx + 1,
          text: "",
          answers: [],
          correctAnswer: 1,
        };
      }
      const options = langContent.options;
      const correctOption = options.find((o) => o.is_correct);
      const correctAnswer = correctOption ? correctOption.id : options[0].id;
      let image: string | undefined;
      if (task.media_url?.trim()) {
        if (task.media_url.startsWith("http")) {
          image = task.media_url;
        } else {
          const path = task.media_url.replace(/^\//, "");
          image = imageBase + (path.endsWith(".webp") ? path : path.replace(/\.[^.]+$/, "") + ".webp");
        }
      }
      return {
        id: idx + 1,
        text: langContent.text || "",
        image,
        correctAnswer,
        answers: options.map((o) => ({ id: o.id, text: o.text })),
        izoh: pickIzohText(task.izoh, questionLang),
      };
    });
  }

  const variantData = raw as VariantData;
  if (!variantData.data || variantData.data.length === 0) return [];

  const resolveImage = (obj: { media?: { exist?: boolean; name?: string }; photo?: string; image?: string }) => {
    if (obj?.media?.exist && obj.media.name) return `/images/${obj.media.name}.png`;
    if (obj?.photo) return `/images/${obj.photo}`;
    if (obj?.image) return `/images/${obj.image}`;
    return undefined;
  };
  const answerLang = questionLang as 'oz' | 'uz' | 'ru';
  return variantData.data.map((q, idx) => {
    const answers = q.answers?.answer?.[answerLang] || q.answers?.answer?.uz || [];
    return {
      id: idx + 1,
      text: (q.question as Record<string, string>)?.[questionLang] || q.question?.uz || "",
      image: resolveImage(q),
      correctAnswer: q.answers?.status ?? 1,
      answers: answers.map((answerText: string, ansIdx: number) => ({
        id: ansIdx + 1,
        text: answerText,
      })),
    };
  });
}

interface Question {
  id: number;
  text: string;
  image?: string;
  correctAnswer: number;
  answers: { id: number; text: string }[];
  izoh?: string;
}

interface TestInterfaceProps {
  onExit: () => void;
  variant: number;
  /** JSON fayl raqami (bepul: UI=1, data=59) */
  dataVariant?: number;
  sessionId?: string | null;
  isPremiumSession?: boolean;
}

export const TestInterface = ({
  onExit,
  variant,
  dataVariant,
  sessionId = null,
  isPremiumSession = true,
}: TestInterfaceProps) => {
  const { t, questionLang } = useLanguage();
  const { user } = useAuth();
  const { saveTestResult } = useTestResults();
  const { isDark, toggle: toggleDark } = useDarkMode();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // storageKey is user-specific to prevent test state leaking across users on the same device
  const storageKey = `testState_variant_${variant}_${user?.id ?? 'anon'}`;

  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [correctAnswers, setCorrectAnswers] = useState<Record<number, boolean>>({});
  const [revealedQuestions, setRevealedQuestions] = useState<Record<number, boolean>>({});
  // Init from endsAt so refresh doesn't reset the timer
  const [timeRemaining, setTimeRemaining] = useState(() =>
    getInitialTimeRemaining(storageKey, 30 * 60)
  );
  const [showFinishDialog, setShowFinishDialog] = useState(false);
  const [showResults, setShowResults] = useState(false);
  // Restored from localStorage so timeTaken stays accurate after refresh
  const [testStartTime] = useState(() => getInitialStartedAt(storageKey));
  const [resultSaved, setResultSaved] = useState(false);
  // Increment to restart the timer interval (used by onTryAgain)
  const [timerKey, setTimerKey] = useState(0);
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);
  // Persist autoAdvance like language setting – survives page refresh
  const [autoAdvance, setAutoAdvance] = useState(() => {
    try { return localStorage.getItem('autoAdvance') === 'true'; } catch { return false; }
  });

  const autoAdvanceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  // Mirror of timeRemaining for the persistence effect — keeps the heavy
  // localStorage write OFF the 1-second timer tick (perf fix)
  const timeRemainingRef = useRef(timeRemaining);
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);
  const isSwiping = useRef<boolean>(false);
  const rawDataRef = useRef<unknown>(null);
  const loadGenerationRef = useRef(0);

  const fileVariant = dataVariant ?? variant;

  const loadVariantFile = useCallback(async () => {
    return fetchQuestionJson(`/data/variants/v${fileVariant}.json`);
  }, [fileVariant]);

  // Fullscreen handlers
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const exitFullscreen = () => {
    if (document.fullscreenElement) {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  // Fetch variant JSON once per variant (retries + cancel stale requests)
  useEffect(() => {
    let cancelled = false;
    const generation = ++loadGenerationRef.current;

    const run = async () => {
      try {
        setLoading(true);
        setError(null);

        // Always load JSON + transform with CURRENT language.
        // Never restore saved.questions text — they freeze the old language (e.g. uz-lat).
        const raw = await loadVariantFile();
        if (cancelled || generation !== loadGenerationRef.current) return;

        rawDataRef.current = raw;
        const transformedQuestions = transformVariantRaw(raw, questionLang);
        if (transformedQuestions.length === 0) {
          throw new Error(t("test.noQuestionsFound"));
        }

        const saved = getSavedTestState(storageKey);
        const savedMatchesFile =
          saved?.questions &&
          Array.isArray(saved.questions) &&
          saved.questions.length === transformedQuestions.length;

        if (!cancelled) {
          setQuestions(transformedQuestions);
        }

        if (savedMatchesFile) {
          if (!cancelled) {
            setCurrentQuestion(saved!.currentQuestion ?? 1);
            setSelectedAnswers((saved!.selectedAnswers as Record<number, number>) ?? {});
            setCorrectAnswers((saved!.correctAnswers as Record<number, boolean>) ?? {});
            setRevealedQuestions((saved!.revealedQuestions as Record<number, boolean>) ?? {});
          }
        } else if (saved?.questions?.length) {
          // File size changed — drop stale progress
          clearTestState(storageKey);
        }
      } catch (err) {
        if (!cancelled && generation === loadGenerationRef.current) {
          if (!import.meta.env.PROD) console.error('Error fetching variant data:', err);
          setError(getFetchErrorMessage(err, t));
        }
      } finally {
        if (!cancelled && generation === loadGenerationRef.current) {
          setLoading(false);
        }
      }
    };

    rawDataRef.current = null;
    run();
    return () => {
      cancelled = true;
    };
  }, [variant, storageKey, loadVariantFile, t, reloadKey, questionLang]);

  // Timer – restarted whenever timerKey changes (e.g. after onTryAgain),
  // stops when showResults becomes true (in deps so cleanup fires)
  useEffect(() => {
    if (showResults) return; // Don't tick on results screen
    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => (prev <= 1 ? 0 : prev - 1));
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timerKey, showResults]);

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
  }, [timeRemaining, showResults, loading, questions.length, storageKey]);

  // Cleanup auto-advance timeout on unmount
  useEffect(() => {
    return () => {
      if (autoAdvanceTimeoutRef.current) {
        clearTimeout(autoAdvanceTimeoutRef.current);
      }
    };
  }, []);

  // Persist test state – skip when finished so cleared state isn't restored on refresh.
  // NOTE: timeRemaining is intentionally read from a ref (not in deps) so the
  // full questions array is NOT re-serialized to localStorage every second.
  // endsAt is an absolute timestamp, so it stays accurate between writes.
  useEffect(() => {
    if (questions.length === 0 || showResults) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify({
        questions,
        questionLang,
        currentQuestion,
        selectedAnswers,
        correctAnswers,
        revealedQuestions,
        endsAt: Date.now() + timeRemainingRef.current * 1000,
        startedAt: testStartTime,
      }));
    } catch {
      // ignore quota errors
    }
  }, [questions, currentQuestion, selectedAnswers, correctAnswers, revealedQuestions, showResults, storageKey, testStartTime, questionLang]);

  const formatTime = (seconds: number) => formatTestTime(seconds);

  const totalQuestions = questions.length || 20;
  const question = questions[currentQuestion - 1];
  const isRevealed = revealedQuestions[currentQuestion];
  const selectedAnswer = selectedAnswers[currentQuestion];

  const handleAnswerSelect = (answerId: number) => {
    if (isRevealed || isSwiping.current) return;
    
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
    const answeredCount = Object.keys(selectedAnswers).length + 1;
    if (answeredCount >= totalQuestions) {
      if (autoAdvanceTimeoutRef.current) {
        clearTimeout(autoAdvanceTimeoutRef.current);
      }
      autoAdvanceTimeoutRef.current = setTimeout(() => {
        if (timerRef.current) clearInterval(timerRef.current);
        clearTestState(storageKey);
        setShowResults(true);
      }, 1500);
      return;
    }

    // Auto-advance to next question (only if enabled)
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

  const getTestStats = () => {
    let correct = 0;
    let incorrect = 0;
    
    Object.entries(correctAnswers).forEach(([_, isCorrect]) => {
      if (isCorrect) correct++;
      else incorrect++;
    });
    
    return { correct, incorrect };
  };

  const handleSwipe = () => {
    const swipeThreshold = 60;
    const diff = touchStartX.current - touchEndX.current;
    
    if (Math.abs(diff) > swipeThreshold) {
      isSwiping.current = true;
      if (diff > 0 && currentQuestion < totalQuestions) {
        if (autoAdvanceTimeoutRef.current) {
          clearTimeout(autoAdvanceTimeoutRef.current);
        }
        setCurrentQuestion(prev => Math.min(totalQuestions, prev + 1));
      } else if (diff < 0 && currentQuestion > 1) {
        if (autoAdvanceTimeoutRef.current) {
          clearTimeout(autoAdvanceTimeoutRef.current);
        }
        setCurrentQuestion(prev => Math.max(1, prev - 1));
      }
      // Reset swiping flag after a short delay to prevent answer selection
      setTimeout(() => { isSwiping.current = false; }, 100);
    } else {
      isSwiping.current = false;
    }
  };

  // Save result when showing results
  useEffect(() => {
    if (showResults && user && !resultSaved) {
      const stats = getTestStats();
      const timeTaken = getElapsedTestSeconds(testStartTime, 30 * 60);
      saveTestResult(variant, stats.correct, totalQuestions, timeTaken, sessionId, isPremiumSession);
      setResultSaved(true);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: only fire once when showResults becomes true; other deps are stable at that point
  }, [showResults, user, resultSaved]);

  // Show results screen
  if (showResults) {
    const stats = getTestStats();
    const timeTaken = getElapsedTestSeconds(testStartTime, 30 * 60);
    exitFullscreen();
    
    return (
      <TestResults
        totalQuestions={totalQuestions}
        correctAnswers={stats.correct}
        incorrectAnswers={stats.incorrect}
        timeTaken={timeTaken}
        variant={variant}
        onBackToHome={onExit}
        isDark={isDark}
        onTryAgain={() => {
          clearTestState(storageKey);
          setSelectedAnswers({});
          setCorrectAnswers({});
          setRevealedQuestions({});
          setCurrentQuestion(1);
          setTimeRemaining(30 * 60);
          setShowResults(false);
          setResultSaved(false);
          setTimerKey(k => k + 1); // restart timer interval
        }}
      />
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 md:w-12 md:h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground text-lg">{t("test.variant")} {variant} {t("test.loading")}</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="p-8 max-w-md text-center">
          <p className="text-destructive mb-6 text-lg">{error}</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button size="lg" variant="outline" onClick={() => setReloadKey((k) => k + 1)}>
              {t("results.tryAgain")}
            </Button>
            <Button size="lg" onClick={onExit}>{t("test.goBack")}</Button>
          </div>
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
            <span className="text-sm md:text-sm font-semibold text-muted-foreground tabular-nums shrink-0">
              <span className="md:hidden">{variant}</span>
              <span className="hidden md:inline">{t("test.variant")} {variant}</span>
            </span>
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
              title={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
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
              onClick={onExit}
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

      {/* Main Content - Full width usage */}
      <main 
        className="flex-1 min-h-0 px-4 py-4 md:px-8 md:py-5 w-full overflow-y-auto overscroll-contain"
        onTouchStart={(e) => {
          touchStartX.current = e.touches[0].clientX;
          isSwiping.current = false;
        }}
        onTouchMove={(e) => {
          const diff = Math.abs(e.touches[0].clientX - touchStartX.current);
          if (diff > 30) isSwiping.current = true;
        }}
        onTouchEnd={(e) => {
          touchEndX.current = e.changedTouches[0].clientX;
          if (isSwiping.current) {
            e.preventDefault();
            handleSwipe();
          }
        }}
      >
        <div className="max-w-7xl mx-auto">
          {/* Question Number */}
          <div className="text-sm md:text-base text-muted-foreground mb-3 font-medium">
            {t("test.question")} {currentQuestion} / {totalQuestions}
          </div>

          {/* Desktop: 60/40 split layout */}
          <div className="md:flex md:gap-5 md:items-start">
            {/* Left Column: Question + Answers (60%) */}
            <div className="md:w-[55%] md:flex-shrink-0">
              {/* Question Text */}
              <Card className="p-4 md:p-5 bg-card border-border mb-4">
                <p className="text-base md:text-[15px] font-medium text-foreground leading-relaxed">
                  {question.text}
                </p>
              </Card>

              {/* Mobile Only: Question Image - bosilsa kattalashadi */}
              {question.image && (
                <Card key={`mobile-img-${currentQuestion}`} className="md:hidden p-3 bg-card border-border mb-4 overflow-hidden">
                  <QuestionImageBlock
                    src={question.image}
                    onZoom={() => setZoomImage(question.image!)}
                    layout="mobile"
                  />
                </Card>
              )}

              {/* Answer Options */}
              <div className="space-y-3">
                {question.answers.map((answer) => {
                  const state = getAnswerState(answer.id);
                  const isSelected = selectedAnswer === answer.id;
                  
                  return (
                    <button
                      key={answer.id}
                      onClick={() => handleAnswerSelect(answer.id)}
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

            {/* Right Column: Image (Desktop only - 40%) - bosilsa kattalashadi */}
            {question.image && (
              <div key={`desktop-img-${currentQuestion}`} className="hidden md:block md:w-[45%] md:flex-shrink-0">
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

      {/* Bottom Navigation — always pinned (mobile safe area) */}
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

      {/* Finish Confirmation Dialog */}
      <AlertDialog open={showFinishDialog} onOpenChange={setShowFinishDialog}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-xl">{t("test.finishConfirmTitle")}</AlertDialogTitle>
            <AlertDialogDescription className="text-base">
              {t("test.finishConfirmDescription")}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="h-11">{t("test.cancel")}</AlertDialogCancel>
            <AlertDialogAction 
              className="h-11 bg-green-500 hover:bg-green-600"
              onClick={confirmFinishTest}
            >
              {t("test.confirm")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ImageLightbox imageUrl={zoomImage} onClose={() => setZoomImage(null)} />
    </div>
  );
};
