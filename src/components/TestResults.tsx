import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle, XCircle, Clock, Trophy, RotateCcw, Home } from "lucide-react";
import { formatTestTime } from "@/lib/testPersistence";

interface TestResultsProps {
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  timeTaken: number; // in seconds
  variant: number;
  onBackToHome: () => void;
  onTryAgain: () => void;
  isDark?: boolean;
}

export const TestResults = ({
  totalQuestions,
  correctAnswers,
  incorrectAnswers,
  timeTaken,
  variant,
  onBackToHome,
  onTryAgain,
  isDark = false,
}: TestResultsProps) => {
  const { t } = useLanguage();

  const score = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
  const passed = score >= 90;

  return (
    <div
      className={`h-dvh min-h-0 w-full bg-background text-foreground flex items-center justify-center p-3 sm:p-4 overflow-hidden${isDark ? " dark" : ""}`}
    >
      <Card className="w-full max-w-md md:max-w-lg flex flex-col max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-2rem)] bg-card border-border shadow-lg overflow-hidden">
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-4 sm:p-5 md:p-6">
          <div className="text-center mb-4 md:mb-5">
            <div
              className={`w-14 h-14 sm:w-16 sm:h-16 md:w-[4.5rem] md:h-[4.5rem] mx-auto rounded-full flex items-center justify-center mb-2 sm:mb-3 ${
                passed ? "bg-green-500/20" : "bg-red-500/20"
              }`}
            >
              <Trophy
                className={`w-7 h-7 sm:w-8 sm:h-8 md:w-9 md:h-9 ${passed ? "text-green-500" : "text-red-500"}`}
              />
            </div>
            <h1 className="text-xl sm:text-2xl font-bold text-foreground mb-0.5">{t("results.title")}</h1>
            {variant > 0 && (
              <p className="text-sm text-muted-foreground">
                {t("test.variant")} {variant}
              </p>
            )}
          </div>

          <div
            className={`text-center py-4 sm:py-5 rounded-xl mb-4 md:mb-5 ${
              passed ? "bg-green-500/10" : "bg-red-500/10"
            }`}
          >
            <p className={`text-4xl sm:text-5xl font-bold mb-1 ${passed ? "text-green-500" : "text-red-500"}`}>
              {score}%
            </p>
            <p
              className={`text-base sm:text-lg font-medium ${
                passed ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
              }`}
            >
              {passed ? t("results.passed") : t("results.failed")}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2 sm:gap-3">
            <div className="text-center p-2.5 sm:p-3 bg-muted/30 rounded-lg">
              <CheckCircle className="w-5 h-5 sm:w-6 sm:h-6 text-green-500 mx-auto mb-1" />
              <div className="text-lg sm:text-xl font-bold text-foreground">{correctAnswers}</div>
              <p className="text-[10px] sm:text-xs text-muted-foreground leading-tight">{t("results.correct")}</p>
            </div>
            <div className="text-center p-2.5 sm:p-3 bg-muted/30 rounded-lg">
              <XCircle className="w-5 h-5 sm:w-6 sm:h-6 text-red-500 mx-auto mb-1" />
              <div className="text-lg sm:text-xl font-bold text-foreground">{incorrectAnswers}</div>
              <p className="text-[10px] sm:text-xs text-muted-foreground leading-tight">{t("results.incorrect")}</p>
            </div>
            <div className="text-center p-2.5 sm:p-3 bg-muted/30 rounded-lg">
              <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-primary mx-auto mb-1" />
              <div className="text-lg sm:text-xl font-bold text-foreground">{formatTestTime(timeTaken)}</div>
              <p className="text-[10px] sm:text-xs text-muted-foreground leading-tight">{t("results.timeTaken")}</p>
            </div>
          </div>
        </div>

        <div className="flex-shrink-0 border-t border-border p-4 sm:p-5 md:p-6 pt-3 sm:pt-4 bg-card">
          <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
            <Button
              variant="outline"
              className="flex-1 h-11 sm:h-12 text-sm sm:text-base"
              onClick={onBackToHome}
            >
              <Home className="w-4 h-4 sm:w-5 sm:h-5 mr-2 shrink-0" />
              <span className="truncate">{t("results.backToHome")}</span>
            </Button>
            <Button className="flex-1 h-11 sm:h-12 text-sm sm:text-base" onClick={onTryAgain}>
              <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5 mr-2 shrink-0" />
              <span className="truncate">{t("results.tryAgain")}</span>
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
