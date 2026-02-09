import { useState, useEffect, useRef } from "react";
import { QuestionNavigation } from "./QuestionNavigation";
import { TestResults } from "./TestResults";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useTestResults } from "@/hooks/useTestResults";
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
import { Clock, ChevronLeft, ChevronRight, X, Check } from "lucide-react";

interface QuestionData {
  id: number;
  bilet_id: number;
  question_id: number;
  name: string | null;
  question: {
    oz: string;
    uz: string;
    ru: string;
  };
  photo: string | null;
  answers: {
    status: number;
    answer_id: number;
    answer: {
      oz: string[];
      uz: string[];
      ru: string[];
    };
  };
}

interface VariantData {
  lesson: string;
  data: QuestionData[];
}

interface Question {
  id: number;
  text: string;
  image?: string;
  correctAnswer: number;
  answers: { id: number; text: string }[];
}

interface TestInterfaceProps {
  onExit: () => void;
  variant: number;
}

export const TestInterface = ({ onExit, variant }: TestInterfaceProps) => {
  const { t, questionLang } = useLanguage();
  const { user } = useAuth();
  const { saveTestResult } = useTestResults();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<number, number>>({});
  const [correctAnswers, setCorrectAnswers] = useState<Record<number, boolean>>({});
  const [revealedQuestions, setRevealedQuestions] = useState<Record<number, boolean>>({});
  const [timeRemaining, setTimeRemaining] = useState(30 * 60);
  const [showFinishDialog, setShowFinishDialog] = useState(false);
  const [showResults, setShowResults] = useState(false);
  const [testStartTime] = useState(Date.now());
  const [resultSaved, setResultSaved] = useState(false);
  
  const autoAdvanceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const storageKey = `testState_variant_${variant}`;

  // Fetch test data from JSON file
  useEffect(() => {
    const fetchTestData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const response = await fetch(`/data/variants/v${variant}.json`);
        
        if (!response.ok) {
          throw new Error(t("test.errorLoadingData"));
        }
        
        const variantData: VariantData = await response.json();
        
        if (!variantData.data || variantData.data.length === 0) {
          throw new Error(t("test.noQuestionsFound"));
        }

        // Transform JSON data to our Question format (handle media/photo fields)
        const resolveImage = (obj: any) => {
          if (obj?.media && obj.media.exist && obj.media.name) {
            return `/images/${obj.media.name}.png`;
          }
          if (obj?.photo) return `/images/${obj.photo}`;
          if (obj?.image) return `/images/${obj.image}`;
          return undefined;
        };

        const transformedQuestions: Question[] = variantData.data.map((q, idx) => {
          const answerLang = questionLang as keyof typeof q.answers.answer;
          const answers = q.answers.answer[answerLang] || q.answers.answer.uz;
          return {
            id: idx + 1,
            text: (q.question as any)[questionLang] || q.question.uz,
            image: resolveImage(q),
            correctAnswer: q.answers.status,
            answers: answers.map((answerText, ansIdx) => ({
              id: ansIdx + 1,
              text: answerText,
            })),
          };
        });

        try {
          const savedRaw = localStorage.getItem(storageKey);
          if (savedRaw) {
            const parsed = JSON.parse(savedRaw);
            if (parsed && parsed.questions && Array.isArray(parsed.questions) && parsed.questions.length === transformedQuestions.length) {
              setQuestions(parsed.questions);
              setCurrentQuestion(parsed.currentQuestion || 1);
              setSelectedAnswers(parsed.selectedAnswers || {});
              setCorrectAnswers(parsed.correctAnswers || {});
              setRevealedQuestions(parsed.revealedQuestions || {});
              setTimeRemaining(parsed.timeRemaining ?? 30 * 60);
              setShowResults(parsed.showResults || false);
            } else {
              setQuestions(transformedQuestions);
            }
          } else {
            setQuestions(transformedQuestions);
          }
        } catch (e) {
          console.warn('Error restoring test state:', e);
          setQuestions(transformedQuestions);
        }
      } catch (err: any) {
        console.error('Error fetching test data:', err);
        setError(err.message || t("test.errorLoadingData"));
      } finally {
        setLoading(false);
      }
    };

    fetchTestData();
  }, [variant, questionLang, t]);

  // Timer - stored in ref so we can clear it when test ends
  useEffect(() => {
    timerRef.current = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 0) {
          if (timerRef.current) clearInterval(timerRef.current);
          setShowResults(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  // Cleanup auto-advance timeout on unmount
  useEffect(() => {
    return () => {
      if (autoAdvanceTimeoutRef.current) {
        clearTimeout(autoAdvanceTimeoutRef.current);
      }
    };
  }, []);

  // Persist test state to localStorage whenever relevant state changes
  useEffect(() => {
    try {
      const payload = {
        questions,
        currentQuestion,
        selectedAnswers,
        correctAnswers,
        revealedQuestions,
        timeRemaining,
        showResults
      };
      localStorage.setItem(storageKey, JSON.stringify(payload));
    } catch (e) {
      // ignore quota errors
    }
  }, [questions, currentQuestion, selectedAnswers, correctAnswers, revealedQuestions, timeRemaining, showResults, storageKey]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const totalQuestions = questions.length || 20;
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
        setShowResults(true);
      }, 1500);
      return;
    }

    // Auto-advance to next question after 2.5 seconds
    if (currentQuestion < totalQuestions) {
      if (autoAdvanceTimeoutRef.current) {
        clearTimeout(autoAdvanceTimeoutRef.current);
      }
      autoAdvanceTimeoutRef.current = setTimeout(() => {
        setCurrentQuestion(prev => Math.min(totalQuestions, prev + 1));
      }, 2500);
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
    // Stop timer before showing results
    if (timerRef.current) clearInterval(timerRef.current);
    setShowResults(true);
    try {
      localStorage.removeItem(storageKey);
    } catch (e) {
      /* ignore */
    }
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

  // Save result when showing results
  useEffect(() => {
    if (showResults && user && !resultSaved) {
      const stats = getTestStats();
      const timeTaken = Math.floor((Date.now() - testStartTime) / 1000);
      saveTestResult(variant, stats.correct, totalQuestions, timeTaken);
      setResultSaved(true);
    }
  }, [showResults, user, resultSaved]);

  // Show results screen
  if (showResults) {
    const stats = getTestStats();
    const timeTaken = Math.floor((Date.now() - testStartTime) / 1000);
    
    return (
      <TestResults
        totalQuestions={totalQuestions}
        correctAnswers={stats.correct}
        incorrectAnswers={stats.incorrect}
        timeTaken={timeTaken}
        variant={variant}
        onBackToHome={onExit}
        onTryAgain={() => {
          setSelectedAnswers({});
          setCorrectAnswers({});
          setRevealedQuestions({});
          setCurrentQuestion(1);
          setTimeRemaining(30 * 60);
          setShowResults(false);
          setResultSaved(false);
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
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-card border-b border-border px-3 py-2 md:px-4 md:py-2.5 shrink-0">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3 md:gap-4">
            <span className="text-xs md:text-sm font-medium text-muted-foreground">{t("test.variant")} {variant}</span>
            <div className="flex items-center gap-1.5 text-muted-foreground">
              <Clock className="w-3.5 h-3.5 md:w-4 md:h-4" />
              <span className="text-sm md:text-base font-medium">{formatTime(timeRemaining)}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              className="h-7 px-2 md:h-8 md:px-3 text-xs bg-green-500/10 text-green-600 border-green-500/30 hover:bg-green-500/20"
              onClick={handleFinishTest}
            >
              {t("test.finish")}
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              className="h-7 px-2 md:h-8 md:px-3 text-xs text-destructive border-destructive/30 hover:bg-destructive/10"
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
      <main className="flex-1 px-4 py-4 md:px-8 md:py-5 w-full overflow-y-auto">
        <div className="max-w-7xl mx-auto">
          {/* Question Number */}
          <div className="text-sm md:text-base text-muted-foreground mb-3 font-medium">
            {t("test.question")} {currentQuestion} / {totalQuestions}
          </div>

          {/* Desktop: 60/40 split layout */}
          <div className="md:flex md:gap-8 md:items-start">
            {/* Left Column: Question + Answers (60%) */}
            <div className="md:w-[60%] md:flex-shrink-0">
              {/* Question Text */}
              <Card className="p-4 md:p-5 bg-card border-border mb-4">
                <p className="text-base md:text-lg font-medium text-foreground leading-relaxed">
                  {question.text}
                </p>
              </Card>

              {/* Mobile Only: Question Image */}
              {question.image && (
                <Card className="md:hidden p-3 bg-card border-border mb-4 overflow-hidden">
                  {/\.(png|jpe?g|webp)$/i.test(question.image || "") ? (
                    <img
                      src={question.image}
                      alt="Question illustration"
                      className="w-full max-w-[300px] h-auto mx-auto object-contain rounded"
                    />
                  ) : (
                    <picture>
                      <source srcSet={`${question.image}.png`} type="image/png" />
                      <source srcSet={`${question.image}.jpg`} type="image/jpeg" />
                      <source srcSet={`${question.image}.jpeg`} type="image/jpeg" />
                      <img
                        src={`${question.image}.png`}
                        alt="Question illustration"
                        className="w-full max-w-[300px] h-auto mx-auto object-contain rounded"
                      />
                    </picture>
                  )}
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
                      <span className="text-base md:text-base font-medium">{answer.text}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Image (Desktop only - 40%) */}
            {question.image && (
              <div className="hidden md:block md:w-[40%] md:flex-shrink-0">
                <Card className="p-4 bg-card border-border overflow-hidden sticky top-4">
                  {/\.(png|jpe?g|webp)$/i.test(question.image || "") ? (
                    <img
                      src={question.image}
                      alt="Question illustration"
                      className="w-full h-auto object-contain rounded max-h-[60vh]"
                    />
                  ) : (
                    <picture>
                      <source srcSet={`${question.image}.png`} type="image/png" />
                      <source srcSet={`${question.image}.jpg`} type="image/jpeg" />
                      <source srcSet={`${question.image}.jpeg`} type="image/jpeg" />
                      <img
                        src={`${question.image}.png`}
                        alt="Question illustration"
                        className="w-full h-auto object-contain rounded max-h-[60vh]"
                      />
                    </picture>
                  )}
                </Card>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* Bottom Navigation */}
      <footer className="bg-card border-t border-border px-3 py-2.5 md:px-4 md:py-3 shrink-0">
        <div className="max-w-5xl mx-auto flex items-center justify-between gap-2">
          <Button
            variant="outline"
            size="default"
            className="h-9 px-3 md:h-10 md:px-4 text-sm"
            disabled={currentQuestion === 1}
            onClick={() => {
              if (autoAdvanceTimeoutRef.current) {
                clearTimeout(autoAdvanceTimeoutRef.current);
              }
              setCurrentQuestion(prev => Math.max(1, prev - 1));
            }}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            {t("test.previous")}
          </Button>
          
          <div className="text-xs md:text-sm text-muted-foreground text-center">
            <span className="font-medium text-primary">{Object.keys(selectedAnswers).length}</span>
            <span> / {totalQuestions}</span>
          </div>

          <Button
            size="default"
            className="h-9 px-3 md:h-10 md:px-4 text-sm"
            disabled={currentQuestion === totalQuestions}
            onClick={() => {
              if (autoAdvanceTimeoutRef.current) {
                clearTimeout(autoAdvanceTimeoutRef.current);
              }
              setCurrentQuestion(prev => Math.min(totalQuestions, prev + 1));
            }}
          >
            {t("test.next")}
            <ChevronRight className="w-4 h-4 ml-1" />
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
    </div>
  );
};
