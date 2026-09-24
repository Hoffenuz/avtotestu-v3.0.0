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
import { Skeleton } from "@/components/ui/skeleton";
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

/**
 * Ro'yxat uzunligini brauzerda eslab qolamiz — faqat skelet balandligi uchun.
 * Maxfiy ma'lumot emas (shunchaki son) va yo'qolsa hech narsa buzilmaydi.
 */
const COUNT_KEY = (mode: ListMode) => `list-count:${mode}`;
/** Skelet DOM ni shishirmasligi uchun yuqori chegara. */
const MAX_SKELETONS = 6;

/**
 * Birinchi tashrifda ro'yxat uzunligi hali noma'lum. Bazadagi haqiqiy
 * taqsimotga tayanamiz: xato savollar mediani 11 ta (ya'ni chegaraga
 * tiraladi), saqlanganlar mediani esa 2 ta.
 */
const DEFAULT_SKELETONS: Record<ListMode, number> = { wrong: MAX_SKELETONS, saved: 2 };

function readLastCount(mode: ListMode): number {
  const fallback = DEFAULT_SKELETONS[mode];
  try {
    const n = Number(localStorage.getItem(COUNT_KEY(mode)));
    return Number.isFinite(n) && n > 0 ? Math.min(n, MAX_SKELETONS) : fallback;
  } catch {
    return fallback;
  }
}

export function SavedWrongList({ mode }: SavedWrongListProps) {
  const { user } = useAuth();
  const { t, questionLang } = useLanguage();
  const { isPremium } = useAccessState();

  const [questions, setQuestions] = useState<AppQuestion[]>([]);
  const [loading, setLoading] = useState(true);
  /**
   * Nechta skelet chizish kerakligi. Ro'yxat uzunligi ikki bosqichda
   * ma'lum bo'ladi: avval `id` lar (tez), keyin savol matnlari (sekin).
   * Shu oraliqda aniq sonni bilamiz va joyni ANIQ zahiralaymiz.
   *
   * Boshlang'ich qiymat — o'tgan safargi son (brauzerda saqlangan).
   * Shu sababli takroriy tashrifda sahifa umuman sakramaydi.
   */
  const [expectedCount, setExpectedCount] = useState<number>(() => readLastCount(mode));
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

      // Aniq son ma'lum bo'ldi — skelet endi ro'yxatga TENG joy egallaydi
      setExpectedCount(Math.min(ids.length, MAX_SKELETONS));
      try { localStorage.setItem(COUNT_KEY(mode), String(ids.length)); } catch { /* kvota */ }

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

  /*
    Yuklanayotganda SKELET ko'rsatiladi, kichkina spinner emas.

    Sabab tashqi ko'rinish emas, o'lchov: ilgari bu joy atigi ~128px
    egallardi, keyin esa o'nlab savol kartasi paydo bo'lib footer'ni
    minglab piksel pastga surardi. Brauzer buni "sahifa sakradi" deb
    hisoblab, CLS ni 0.7 gacha ko'tarardi (me'yor 0.1).

    Skeletlar SONI ro'yxat uzunligiga tenglashtiriladi (`expectedCount`).
    Doim 3 ta chizilsa, atigi 1 ta saqlangan savoli bor foydalanuvchida
    teskari muammo chiqardi: skelet ko'p joy egallab, keyin qisqarardi va
    footer YUQORIGA sakrardi.
  */
  if (loading) {
    return (
      <div className="space-y-4" role="status" aria-live="polite">
        <span className="sr-only">{t("pages.loading")}</span>
        {Array.from({ length: expectedCount }, (_, i) => (
          <Card key={i} aria-hidden="true">
            <CardContent className="space-y-3 p-4">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-5 w-full" />
              <Skeleton className="h-5 w-3/4" />
              <Skeleton className="h-40 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        ))}
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
