import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { QuestionNavigation } from "./QuestionNavigation";
import { TestResults } from "./TestResults";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useTestResults } from "@/hooks/useTestResults";
import {
  getElapsedTestSeconds,
  getWallElapsedSeconds,
  getInitialStartedAt,
  clearTestState,
  formatDurationSeconds,
  MAX_TEST_TIME_SECONDS,
} from "@/lib/testPersistence";
import { pickIzohText, pickLangContent } from "@/lib/pickLangContent";
import { fetchQuestionJson, normalizeQuestionArray } from "@/lib/fetchQuestionJson";
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
import { ImageLightbox } from "./ImageLightbox";
import { QuestionImageBlock } from "./QuestionImageBlock";
import { IzohNavButton } from "./IzohBox";
import { useDarkMode } from "@/hooks/useDarkMode";
import { toast } from "sonner";

interface QuestionData {
  id?: number;
  bilet_id?: number;
  question_id?: number;
  name?: string | null;
  question: {
    oz?: string;
    uz?: string;
    ru?: string;
  };
  photo?: string | null;
  image?: string | null;
  answers: {
    status: number;
    answer_id?: number;
    answer: {
      oz?: string[];
      uz?: string[];
      ru?: string[];
    };
  };
}

interface Question {
  id: number;
  text: string;
  image?: string;
  correctAnswer: number;
  answers: { id: number; text: string }[];
  izoh?: string;
}

/** Shape of a single answer option inside a task's language content */
interface TaskOption {
  id: number;
  text: string;
  is_correct?: boolean;
}

/** Shape of a single task's language-specific content block */
interface TaskLangContent {
  text?: string;
  options?: TaskOption[];
}

/** Shape of a raw task entry from topic JSON files */
interface RawTask {
  media_url?: string;
  content?: Record<string, TaskLangContent>;
  izoh?: { uz_lat?: string; uz_cyr?: string; ru?: string } | string;
}

interface MavzuliTestInterfaceProps {
  onExit: () => void;
  topicId: string;
  topicName: string;
  sessionId?: string | null;
  isPremiumSession?: boolean;
}

export const MavzuliTestInterface = ({
  onExit,
  topicId,
  topicName,
  sessionId = null,
  isPremiumSession = false,
}: MavzuliTestInterfaceProps) => {
  const { t, questionLang } = useLanguage();
  const { user } = useAuth();
  const { saveTestResult } = useTestResults();
  const navigate = useNavigate();
  const { isDark, toggle: toggleDark } = useDarkMode();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // storageKey must be defined first – used in lazy state initialisers below
  const storageKey = `testState_mavzuli_${topicId}_${user?.id ?? 'guest'}`;
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [correctAnswers, setCorrectAnswers] = useState<Record<number, boolean>>({});
  const [revealedQuestions, setRevealedQuestions] = useState<Record<number, boolean>>({});
  const [testStartTime, setTestStartTime] = useState(() =>
    getInitialStartedAt(storageKey, { maxElapsedSec: null }),
  );
  // Elapsed seconds (counts up) — no time limit
  const [elapsedSeconds, setElapsedSeconds] = useState(() =>
    getWallElapsedSeconds(getInitialStartedAt(storageKey, { maxElapsedSec: null })),
  );
  const [showFinishDialog, setShowFinishDialog] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [resultSaved, setResultSaved] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(sessionId);
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const autoAdvanceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const saveAttemptedRef = useRef(false);
  // Persist autoAdvance like language setting – survives page refresh
  const [autoAdvance, setAutoAdvance] = useState(() => {
    try { return localStorage.getItem('autoAdvance') === 'true'; } catch { return false; }
  });
  // Increment to restart the timer interval (used by onTryAgain)
  const [timerKey, setTimerKey] = useState(0);
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);
  const isSwiping = useRef<boolean>(false);

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

  // Fetch test data from JSON file
  useEffect(() => {
    // Cancellation flag: when the topic/language changes, a slow stale
    // response must not overwrite the freshly requested topic's state.
    let cancelled = false;

    const fetchTestData = async () => {
      let parsedQuestions: Question[] = [];
      try {
        setLoading(true);
        setError(null);
        
        // Map topic id to filename - handle special cases
        let filename = `${topicId}.json`;
        if (topicId === '34') {
          filename = '34tengaxamiyatli.json';
        }

        const barchaByLang =
          questionLang === 'oz'
            ? '/barcha-uz-lat.json'
            : questionLang === 'uz'
              ? '/barcha-uz-cyr.json'
              : '/barcha-ru.json';
        const dataPath = topicId === '31' ? barchaByLang : `/mavzuli2/${filename}`;
        const jsonData = await fetchQuestionJson(dataPath);
        if (cancelled) return;
        
        // New format: array of tasks with content.uz_lat/uz_cyr/ru structure
        if (Array.isArray(jsonData) && jsonData.length > 0 && (jsonData[0] as RawTask).content) {
          const tQuestions: Question[] = (jsonData as RawTask[]).map((task: RawTask, idx: number) => {
            const langContent = pickLangContent(task.content, questionLang);
            if (!langContent || !langContent.options?.length) {
              return {
                id: idx + 1,
                text: "",
                answers: [],
                correctAnswer: 1,
              };
            }
            const correctOption = langContent.options.find((o: TaskOption) => o.is_correct);
            const correctAnswer = correctOption ? correctOption.id : langContent.options[0].id;
            let image: string | undefined;
            if (task.media_url?.trim()) {
              const path = task.media_url.replace(/^\//, "");
              image = "/images/" + path;
            }
            return {
              id: idx + 1,
              text: langContent.text || "",
              image,
              correctAnswer,
              answers: langContent.options.map((o: TaskOption) => ({ id: o.id, text: o.text })),
              izoh: pickIzohText(task.izoh, questionLang),
            };
          });
          parsedQuestions = tQuestions;
        } else {
          // Old format fallback — normalizeQuestionArray aynan shu uchta
          // shaklni (array / .data / .questions) qo'llab-quvvatlaydi.
          const questionsArray = normalizeQuestionArray(jsonData) as QuestionData[];


          if (questionsArray.length === 0) {
            throw new Error(t("test.noQuestionsFound"));
          }

          const tQuestions: Question[] = questionsArray.map((q, idx) => {
            const answerLang = questionLang as 'oz' | 'uz' | 'ru';
            const answers = q.answers.answer[answerLang] || q.answers.answer.uz || q.answers.answer.oz || [];
            const questionText = q.question[answerLang] || q.question.uz || q.question.oz || '';
            const photoField = q.photo || q.image;
            
            return {
              id: idx + 1,
              text: questionText,
              image: photoField ? `/images/${photoField}` : undefined,
              correctAnswer: q.answers.status,
              answers: answers.map((answerText, ansIdx) => ({
                id: ansIdx + 1,
                text: answerText,
              })),
            };
          });
          parsedQuestions = tQuestions;
        }

        if (cancelled) return;
        setQuestions(parsedQuestions);

        // Restore in-progress test state from localStorage
        try {
          const savedRaw = localStorage.getItem(storageKey);
          if (savedRaw) {
            const parsed = JSON.parse(savedRaw);
            // `questionCount` — yangi (yengil) format; `questions.length` —
            // eski saqlanmalar bilan moslik uchun (bir marta o'tib ketadi).
            const savedCount =
              typeof parsed?.questionCount === 'number'
                ? parsed.questionCount
                : Array.isArray(parsed?.questions)
                  ? parsed.questions.length
                  : null;
            if (savedCount === parsedQuestions.length) {
              setCurrentQuestion(parsed.currentQuestion || 1);
              setSelectedAnswers(parsed.selectedAnswers || {});
              setCorrectAnswers(parsed.correctAnswers || {});
              setRevealedQuestions(parsed.revealedQuestions || {});
              // elapsedSeconds already initialised from startedAt via useState lazy init
              // Do NOT restore showResults here – finished tests are cleared from storage
            }
          }
        } catch (e) {
          if (!import.meta.env.PROD) console.warn('Error restoring test state:', e);
        }
      } catch (err) {
        if (cancelled) return;
        if (!import.meta.env.PROD) console.error('Error fetching test data:', err);
        setError(err instanceof Error ? err.message : t("test.errorLoadingData"));
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchTestData();
    return () => {
      cancelled = true;
    };
  }, [topicId, questionLang, t, storageKey]);

  // Elapsed timer — counts up; no auto-finish
  useEffect(() => {
    if (showResults || loading || questions.length === 0) return;
    timerRef.current = setInterval(() => {
      setElapsedSeconds(getWallElapsedSeconds(testStartTime));
    }, 1000);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [timerKey, showResults, loading, questions.length, testStartTime]);

  // Cleanup auto-advance timeout on unmount
  useEffect(() => {
    return () => {
      if (autoAdvanceTimeoutRef.current) {
        clearTimeout(autoAdvanceTimeoutRef.current);
      }
    };
  }, []);

  /**
   * Persist test state – skip when finished so cleared state isn't restored.
   *
   * `questions` SAQLANMAYDI, faqat ularning SONI.
   *
   * ILGARIGI BUG (qotib qolish): bu yerda butun `questions` massivi
   * JSON.stringify qilinardi. "Barcha savollar" mavzusi (31) 1250 ta savolni
   * yuklaydi — ya'ni HAR javob bosilganda 0.82 MB asosiy oqimni bloklab
   * localStorage ga yozilardi. Arzon Android da bu har bosishda sezilarli
   * qotish edi va 5 MB kvotani to'ldirib yuborish xavfi bor edi (yozish
   * bo'sh `catch` ichida — kvota tugasa progress jimgina saqlanmay qolardi).
   *
   * Saqlash shart emas: mavzuli savollar aralashtirilmaydi, ya'ni
   * (topicId + til) dan har safar bir xil tartibda qayta hosil bo'ladi.
   * Tiklashda ham ular faqat UZUNLIGI uchun tekshirilardi, mazmuni emas.
   */
  useEffect(() => {
    if (questions.length === 0 || showResults) return;
    try {
      localStorage.setItem(storageKey, JSON.stringify({
        questionCount: questions.length,
        currentQuestion,
        selectedAnswers,
        correctAnswers,
        revealedQuestions,
        startedAt: testStartTime,
      }));
    } catch {
      // ignore quota errors
    }
  }, [questions.length, currentQuestion, selectedAnswers, correctAnswers, revealedQuestions, showResults, storageKey, testStartTime]);

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

  const getTestStats = () => {
    let correct = 0;
    let incorrect = 0;
    
    Object.entries(correctAnswers).forEach(([_, isCorrect]) => {
      if (isCorrect) correct++;
      else incorrect++;
    });
    
    return { correct, incorrect };
  };

  const saveVariant = (() => {
    const n = parseInt(topicId, 10);
    return Number.isFinite(n) && n >= 1 && n <= 100 ? n : 0;
  })();

  // Save on finish
  useEffect(() => {
    if (showResults && user && !resultSaved && saveVariant > 0 && !saveAttemptedRef.current) {
      saveAttemptedRef.current = true;
      const stats = getTestStats();
      // DB still caps at 60:59; UI shows full wall elapsed
      const timeTaken = getElapsedTestSeconds(testStartTime, MAX_TEST_TIME_SECONDS);
      void saveTestResult(
        saveVariant,
        stats.correct,
        questions.length,
        timeTaken,
        activeSessionId,
        isPremiumSession,
      ).then((res) => {
        if (res.success) {
          setResultSaved(true);
        } else {
          toast.error("Natijani saqlab bo‘lmadi. Qayta urinib ko‘ring.");
          if (!import.meta.env.PROD) console.error('Mavzuli save failed:', res.error);
        }
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps -- intentional: only fire once when showResults becomes true
  }, [showResults, user, resultSaved, saveVariant]);

  useEffect(() => {
    if (showResults) exitFullscreen();
  }, [showResults]);

  // Show results screen
  if (showResults) {
    const stats = getTestStats();
    const timeTaken = getWallElapsedSeconds(testStartTime);
    
    return (
      <TestResults
        totalQuestions={totalQuestions}
        correctAnswers={stats.correct}
        incorrectAnswers={stats.incorrect}
        timeTaken={timeTaken}
        variant={0}
        onBackToHome={onExit}
        isDark={isDark}
        onTryAgain={() => {
          clearTestState(storageKey);
          setSelectedAnswers({});
          setCorrectAnswers({});
          setRevealedQuestions({});
          setCurrentQuestion(1);
          const now = Date.now();
          setTestStartTime(now);
          setElapsedSeconds(0);
          setShowResults(false);
          setResultSaved(false);
          saveAttemptedRef.current = false;
          setActiveSessionId(null);
          setTimerKey(k => k + 1);
        }}
      />
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 md:w-12 md:h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-4" />
          <p className="text-muted-foreground text-lg">{topicName} {t("test.loading")}</p>
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
            <span className="hidden md:inline text-sm font-medium text-muted-foreground line-clamp-1 min-w-0">{topicName}</span>
            <div className="flex items-center gap-1 text-muted-foreground shrink-0">
              <Clock className="w-3.5 h-3.5 md:w-4 md:h-4" />
              <span className="text-sm md:text-base font-medium tabular-nums">
                {formatDurationSeconds(elapsedSeconds)}
              </span>
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

      <main 
        className="flex-1 min-h-0 px-4 py-4 md:px-8 md:py-5 w-full overflow-y-auto overscroll-contain"
        onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; isSwiping.current = false; }}
        onTouchMove={(e) => { if (Math.abs(e.touches[0].clientX - touchStartX.current) > 30) isSwiping.current = true; }}
        onTouchEnd={(e) => { touchEndX.current = e.changedTouches[0].clientX; if (isSwiping.current) { e.preventDefault(); handleSwipe(); } }}
      >
        <div className="max-w-7xl mx-auto">
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
                <Card className="md:hidden p-3 bg-card border-border mb-4 overflow-hidden">
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

            {/* Right Column: Image (Desktop only - 40%) - bosilsa kattalashadi */}
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
