// ============================================================================
// SavedWrongList — "Xatolarim" va "Saqlangan savollar" uchun umumiy ro'yxat
// ----------------------------------------------------------------------------
// Ikkala sahifa bir xil ishlaydi, faqat manba boshqa:
//   wrong  → xato javob berilgan savollar (eng ko'p xato qilinganidan)
//   saved  → foydalanuvchi saqlab qo'ygan savollar
//
// Bazada faqat `global_id` saqlanadi — savol matni korpusdan topiladi
// (`questionCorpus.ts`). Shu sababli savol matni tuzatilsa ham ro'yxat
// buzilmaydi: kalit barqaror, matn esa doim joriy versiyadan olinadi.
// ============================================================================

import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bookmark, BookmarkX, CheckCircle2, Loader2, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { QuestionReviewCard } from "@/components/QuestionReviewCard";
import { SaveQuestionButton } from "@/components/SaveQuestionButton";
import { ImageLightbox } from "@/components/ImageLightbox";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAccessState } from "@/hooks/useAccessState";
import {
  clearWrongQuestions,
  fetchSavedQuestionIds,
  fetchWrongQuestionIds,
  toggleSavedQuestion,
} from "@/lib/questionState";
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
import { toast } from "sonner";
import { resolveQuestions } from "@/lib/questionCorpus";
import { transformRawToQuestions, type AppQuestion } from "@/lib/questionTransform";

export type ListMode = "wrong" | "saved";

interface SavedWrongListProps {
  mode: ListMode;
}

/** `questionLang` ("oz" | "uz" | "ru") → korpus fayl tili. */
function corpusLangOf(questionLang: string): string {
  return questionLang === "oz" ? "uz-lat" : questionLang;
}

export function SavedWrongList({ mode }: SavedWrongListProps) {
  const { user } = useAuth();
  const { t, questionLang } = useLanguage();
  const { isPremium } = useAccessState();

  const [questions, setQuestions] = useState<AppQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  const [zoomImage, setZoomImage] = useState<string | null>(null);
  const [removing, setRemoving] = useState<string | null>(null);
  const [clearingAll, setClearingAll] = useState(false);
  const [confirmClear, setConfirmClear] = useState(false);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    let cancelled = false;

    void (async () => {
      setLoading(true);
      const ids =
        mode === "wrong" ? await fetchWrongQuestionIds() : await fetchSavedQuestionIds();
      if (cancelled) return;

      const tasks = await resolveQuestions(ids, corpusLangOf(questionLang), isPremium);
      if (cancelled) return;

      setQuestions(transformRawToQuestions(tasks, questionLang, "/images/"));
      setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [user, mode, questionLang, isPremium]);

  /** Saqlanganlar ro'yxatidan olib tashlash — faqat `saved` rejimida. */
  const handleUnsave = useCallback(async (globalId: string) => {
    setRemoving(globalId);
    const next = await toggleSavedQuestion(globalId);
    if (next === false) {
      setQuestions((prev) => prev.filter((q) => q.globalId !== globalId));
    }
    setRemoving(null);
  }, []);

  /** Bitta savolni xatolar ro'yxatidan chiqarish — faqat `wrong` rejimida. */
  const handleClearOne = useCallback(async (globalId: string) => {
    setRemoving(globalId);
    const ok = await clearWrongQuestions(globalId);
    if (ok) {
      setQuestions((prev) => prev.filter((q) => q.globalId !== globalId));
    } else {
      toast.error(t("pages.clearFailed"));
    }
    setRemoving(null);
  }, [t]);

  /** Butun xatolar ro'yxatini tozalash. */
  const handleClearAll = useCallback(async () => {
    setClearingAll(true);
    const ok = await clearWrongQuestions();
    if (ok) {
      setQuestions([]);
      toast.success(t("pages.clearAllDone"));
    } else {
      toast.error(t("pages.clearFailed"));
    }
    setClearingAll(false);
    setConfirmClear(false);
  }, [t]);

  if (!user) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          <p className="text-muted-foreground">
            {t("pages.signInRequired")}
          </p>
          <Button asChild className="mt-4">
            <Link to="/auth">{t("pages.signIn")}</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <div className="flex justify-center py-16" role="status" aria-live="polite">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-hidden="true" />
        <span className="sr-only">{t("pages.loading")}</span>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <Card>
        <CardContent className="py-10 text-center">
          {mode === "wrong" ? (
            <>
              <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-primary" aria-hidden="true" />
              <p className="font-medium text-foreground">{t("pages.xatolarimEmpty")}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("pages.xatolarimEmptyHint")}
              </p>
            </>
          ) : (
            <>
              <Bookmark className="mx-auto mb-3 h-10 w-10 text-muted-foreground" aria-hidden="true" />
              <p className="font-medium text-foreground">{t("pages.saqlanganEmpty")}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("pages.saqlanganEmptyHint")}
              </p>
            </>
          )}
          <Button asChild className="mt-4">
            <Link to="/test-ishlash">{t("pages.startTest")}</Link>
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          {questions.length} {t("pages.questionsCount")}
        </p>

        {/* Butun ro'yxatni tozalash — faqat xatolar bo'limida */}
        {mode === "wrong" ? (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setConfirmClear(true)}
            disabled={clearingAll}
          >
            {clearingAll ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
            ) : (
              <Trash2 className="mr-2 h-4 w-4" aria-hidden="true" />
            )}
            {t("pages.clearAll")}
          </Button>
        ) : null}
      </div>

      {/*
        BITTA ustun. Ikki ustunda kartochkalar torayib, savol matni ham
        rasm ham o'qib bo'lmas darajada kichrayardi.

        Ekran kengligi kartochka ICHIDA ishlatiladi: `QuestionReviewCard`
        desktopda rasm bilan javoblarni yonma-yon qo'yadi.
      */}
      <ol className="space-y-4">
        {questions.map((q, idx) => (
          <li key={q.globalId ?? idx}>
            <QuestionReviewCard
              question={q}
              index={idx + 1}
              onZoom={setZoomImage}
              action={
                mode === "saved" && q.globalId ? (
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={removing === q.globalId}
                    onClick={() => void handleUnsave(q.globalId as string)}
                    aria-label={t("pages.unsaveQuestion")}
                  >
                    {removing === q.globalId ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                    ) : (
                      <BookmarkX className="h-4 w-4" aria-hidden="true" />
                    )}
                  </Button>
                ) : mode === "wrong" && q.globalId ? (
                  <div className="flex items-center gap-0.5">
                    <SaveQuestionButton globalId={q.globalId} />
                    <Button
                      variant="ghost"
                      size="sm"
                      className="shrink-0"
                      disabled={removing === q.globalId}
                      onClick={() => void handleClearOne(q.globalId as string)}
                      aria-label={t("pages.clearOne")}
                      title={t("pages.clearOne")}
                    >
                      {removing === q.globalId ? (
                        <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                      ) : (
                        <X className="h-4 w-4" aria-hidden="true" />
                      )}
                    </Button>
                  </div>
                ) : (
                  <SaveQuestionButton globalId={q.globalId} />
                )
              }
            />
          </li>
        ))}
      </ol>

      <AlertDialog open={confirmClear} onOpenChange={setConfirmClear}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t("pages.clearAllTitle")}</AlertDialogTitle>
            <AlertDialogDescription>{t("pages.clearAllDesc")}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t("test.cancel")}</AlertDialogCancel>
            <AlertDialogAction onClick={() => void handleClearAll()}>
              {t("pages.clearAll")}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* ImageLightbox `null` ni o'zi qabul qiladi — shartli render kerak emas */}
      <ImageLightbox imageUrl={zoomImage} onClose={() => setZoomImage(null)} />
    </>
  );
}
