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
  /** Real ticket 1–63. Practice / mavzuli (0 or 99) — label yashirinadi */
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
  const showVariantLabel = Number.isInteger(variant) && variant >= 1 && variant <= 63;

  return (
    <div
      className={`h-dvh min-h-0 w-full bg-background text-foreground flex items-center justify-center p-3 sm:p-4 overflow-hidden${isDark ? " dark" : ""}`}
    >
      <Card className="w-full max-w-md md:max-w-xl flex flex-col max-h-[calc(100dvh-1.5rem)] sm:max-h-[calc(100dvh-2rem)] bg-card border-border shadow-lg overflow-hidden">
        <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain p-5 sm:p-6 md:p-7">
          <div className="text-center mb-5 md:mb-6">
            <div
              className={`w-16 h-16 sm:w-[4.5rem] sm:h-[4.5rem] md:w-20 md:h-20 mx-auto rounded-full flex items-center justify-center mb-3 ${
                passed ? "bg-green-500/20" : "bg-red-500/20"
              }`}
            >
              <Trophy
                className={`w-8 h-8 sm:w-9 sm:h-9 md:w-10 md:h-10 ${passed ? "text-green-500" : "text-red-500"}`}
              />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1">{t("results.title")}</h1>
            {showVariantLabel && (
              <p className="text-base sm:text-lg text-muted-foreground">
                {t("test.variant")} {variant}
              </p>
            )}
          </div>

          <div
            className={`text-center py-5 sm:py-6 rounded-xl mb-5 md:mb-6 ${
              passed ? "bg-green-500/10" : "bg-red-500/10"
            }`}
          >
            <p className={`text-5xl sm:text-6xl font-bold mb-1.5 ${passed ? "text-green-500" : "text-red-500"}`}>
              {score}%
            </p>
            <p
              className={`text-lg sm:text-xl font-medium ${
                passed ? "text-green-600 dark:text-green-400" : "text-red-600 dark:text-red-400"
              }`}
            >
              {passed ? t("results.passed") : t("results.failed")}
            </p>
          </div>

          <div className="grid grid-cols-3 gap-2.5 sm:gap-3">
            <div className="text-center p-3 sm:p-3.5 bg-muted/30 rounded-lg">
              <CheckCircle className="w-6 h-6 sm:w-7 sm:h-7 text-green-500 mx-auto mb-1.5" />
              <div className="text-xl sm:text-2xl font-bold text-foreground">{correctAnswers}</div>
              <p className="text-xs sm:text-sm text-muted-foreground leading-tight mt-0.5">{t("results.correct")}</p>
            </div>
            <div className="text-center p-3 sm:p-3.5 bg-muted/30 rounded-lg">
              <XCircle className="w-6 h-6 sm:w-7 sm:h-7 text-red-500 mx-auto mb-1.5" />
              <div className="text-xl sm:text-2xl font-bold text-foreground">{incorrectAnswers}</div>
              <p className="text-xs sm:text-sm text-muted-foreground leading-tight mt-0.5">{t("results.incorrect")}</p>
            </div>
            <div className="text-center p-3 sm:p-3.5 bg-muted/30 rounded-lg">
              <Clock className="w-6 h-6 sm:w-7 sm:h-7 text-primary mx-auto mb-1.5" />
              <div className="text-xl sm:text-2xl font-bold text-foreground">{formatTestTime(timeTaken)}</div>
              <p className="text-xs sm:text-sm text-muted-foreground leading-tight mt-0.5">{t("results.timeTaken")}</p>
            </div>
          </div>
        </div>

        <div className="flex-shrink-0 border-t border-border p-4 sm:p-5 md:p-6 pt-3.5 sm:pt-4 bg-card">
          <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3">
            <Button
              variant="outline"
              className="flex-1 h-12 sm:h-14 text-base font-medium"
              onClick={onBackToHome}
            >
              <Home className="w-5 h-5 mr-2 shrink-0" />
              <span className="truncate">{t("results.backToHome")}</span>
            </Button>
            <Button className="flex-1 h-12 sm:h-14 text-base font-medium" onClick={onTryAgain}>
              <RotateCcw className="w-5 h-5 mr-2 shrink-0" />
              <span className="truncate">{t("results.tryAgain")}</span>
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};
