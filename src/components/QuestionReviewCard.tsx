// ============================================================================
// QuestionReviewCard — savolni O'QISH uchun ko'rsatish (javob berilmaydi)
// ----------------------------------------------------------------------------
// Uchta joyda ishlatiladi: Xatolarim, Saqlangan savollar, Savol qidirish.
// To'g'ri javob darhol ajratib ko'rsatiladi — bu takrorlash uchun mo'ljallangan
// ko'rinish, imtihon emas.
// ============================================================================

import { CheckCircle2 } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { QuestionImageBlock } from "@/components/QuestionImageBlock";
import type { AppQuestion } from "@/lib/questionTransform";

interface QuestionReviewCardProps {
  question: AppQuestion;
  /** Ro'yxatdagi tartib raqami (1 dan). */
  index: number;
  onZoom: (src: string) => void;
  /** O'ng yuqori burchakdagi qo'shimcha element (masalan saqlash tugmasi). */
  action?: React.ReactNode;
  /**
   * Izohni ko'rsatish. Qidiruvda O'CHIRILADI: izoh PRO funksiyasi
   * (testda ham `requirePro` bilan yopilgan), qidiruvda ochiq berilsa
   * PRO ning qiymati yo'qolardi.
   */
  showIzoh?: boolean;
}

export function QuestionReviewCard({
  question,
  index,
  onZoom,
  action,
  showIzoh = true,
}: QuestionReviewCardProps) {
  const hasImage = Boolean(question.image);

  return (
    <Card>
      <CardContent className="p-4 md:p-5">
        <div className="mb-3 flex items-start justify-between gap-3">
          <h2 className="text-[15px] font-semibold leading-relaxed text-foreground">
            <span className="mr-2 text-muted-foreground">{index}.</span>
            {question.text}
          </h2>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>

        {/*
          RASM VA JAVOBLAR — desktopda YONMA-YON.

          Ilgari rasm javoblar USTIDA turardi: ko'z rasmni ko'rib, pastga
          tushib javobni o'qib, keyin tekshirish uchun yana yuqoriga
          qaytishi kerak edi. Yonma-yon turganda ikkalasi bir vaqtda
          ko'rinadi — savol rasmga bog'liq bo'lgani uchun bu muhim.

          Mobilda esa ustma-ust (rasm avval) — tor ekranda yonma-yon
          ikkalasi ham o'qib bo'lmas darajada kichrayardi.
        */}
        <div className={hasImage ? "flex flex-col gap-4 lg:flex-row lg:items-start" : undefined}>
          {hasImage ? (
            <div className="lg:w-[46%] lg:shrink-0">
              <QuestionImageBlock
                src={question.image as string}
                alt={question.text}
                layout="mobile"
                onZoom={() => onZoom(question.image as string)}
              />
            </div>
          ) : null}

          <ul className="min-w-0 flex-1 space-y-2">
            {question.answers.map((answer) => {
              const correct = answer.id === question.correctAnswer;
              return (
                <li
                  key={answer.id}
                  className={
                    correct
                      ? "rounded-md border border-emerald-500/40 bg-emerald-500/10 px-3 py-2 text-sm font-medium text-foreground"
                      : "rounded-md border border-border px-3 py-2 text-sm text-muted-foreground"
                  }
                >
                  {correct ? (
                    <CheckCircle2
                      className="mr-1.5 inline h-4 w-4 text-emerald-500"
                      aria-label="To'g'ri javob"
                    />
                  ) : null}
                  {answer.text}
                </li>
              );
            })}
          </ul>
        </div>

        {showIzoh && question.izoh ? (
          <details className="mt-3">
            <summary className="cursor-pointer text-sm font-medium text-primary">Izoh</summary>
            <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">
              {question.izoh}
            </p>
          </details>
        ) : null}
      </CardContent>
    </Card>
  );
}
