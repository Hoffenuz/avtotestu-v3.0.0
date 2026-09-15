// ============================================================================
// MistakesReview — test tugagandan keyin XATOLARNI ko'rib chiqish
// ----------------------------------------------------------------------------
// Nega faqat xatolar: to'g'ri yechilgan savolni qayta o'qish vaqt sarfi, xato
// qilingan va JAVOBSIZ qolgan savol esa aynan o'rganish kerak bo'lgan joy.
//
// Kartochka `QuestionReviewCard` — "Xatolarim", "Saqlangan" va "Qidirish"
// bo'limlaridagi bilan bir xil. Shu sababli to'g'ri javob va izoh (PRO uchun)
// mantiqini bu yerda qaytadan yozish shart emas.
// ============================================================================

import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { QuestionReviewCard } from "@/components/QuestionReviewCard";
import { ImageLightbox } from "@/components/ImageLightbox";
import { useLanguage } from "@/contexts/LanguageContext";
import type { AppQuestion } from "@/lib/questionTransform";

export interface MistakeItem {
  question: AppQuestion;
  /** `false` — savol javobsiz qolgan (xato emas, umuman tegilmagan). */
  answered: boolean;
}

interface MistakesReviewProps {
  items: MistakeItem[];
  onBack: () => void;
}

export function MistakesReview({ items, onBack }: MistakesReviewProps) {
  const { t } = useLanguage();
  const [zoomImage, setZoomImage] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-background">
      {/*
        Sarlavha yopishqoq: ro'yxat uzun bo'lishi mumkin va "Orqaga" tugmasi
        har doim qo'l ostida turishi kerak — aks holda foydalanuvchi natija
        ekraniga qaytish uchun butun ro'yxatni yuqoriga surishi kerak bo'ladi.
      */}
      <div className="sticky top-0 z-10 border-b border-border bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-4xl items-center gap-3 px-4 py-3">
          <Button variant="ghost" size="sm" onClick={onBack} className="shrink-0">
            <ArrowLeft className="mr-1.5 h-4 w-4" aria-hidden="true" />
            {t("results.backToResults")}
          </Button>
          <span className="truncate text-sm font-semibold text-foreground">
            {t("results.reviewTitle").replace("{n}", String(items.length))}
          </span>
        </div>
      </div>

      <div className="mx-auto max-w-4xl px-4 py-4">
        <ol className="space-y-4">
          {items.map((item, idx) => (
            <li key={item.question.globalId ?? idx}>
              <QuestionReviewCard
                question={item.question}
                index={idx + 1}
                onZoom={setZoomImage}
                action={
                  item.answered ? null : (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">
                      {t("results.unanswered")}
                    </span>
                  )
                }
              />
            </li>
          ))}
        </ol>
      </div>

      <ImageLightbox imageUrl={zoomImage} onClose={() => setZoomImage(null)} />
    </div>
  );
}

export default MistakesReview;
