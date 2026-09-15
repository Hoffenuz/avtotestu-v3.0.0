// ============================================================================
// QuestionReviewCard — savolni O'QISH uchun ko'rsatish (javob berilmaydi)
// ----------------------------------------------------------------------------
// Uchta joyda ishlatiladi: Xatolarim, Saqlangan savollar, Savol qidirish.
// To'g'ri javob darhol ajratib ko'rsatiladi — bu takrorlash uchun mo'ljallangan
// ko'rinish, imtihon emas.
// ============================================================================

import { CheckCircle2, Crown } from "lucide-react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { QuestionImageBlock } from "@/components/QuestionImageBlock";
import { useAccessState } from "@/hooks/useAccessState";
import { useLanguage } from "@/contexts/LanguageContext";
import type { AppQuestion } from "@/lib/questionTransform";

interface QuestionReviewCardProps {
  question: AppQuestion;
  /** Ro'yxatdagi tartib raqami (1 dan). */
  index: number;
  onZoom: (src: string) => void;
  /** O'ng yuqori burchakdagi qo'shimcha element (masalan saqlash tugmasi). */
  action?: React.ReactNode;
  /**
   * Izoh blokini UMUMAN ko'rsatmaslik (hatto PRO ga ham).
   * Qidiruvda `false`: u yerda natijalar ro'yxati qisqa bo'lishi kerak.
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

  /**
   * IZOH — HAR QANDAY HOLATDA faqat PRO uchun.
   *
   * Tekshiruv ATAYLAB shu komponent ichida, chaqiruvchi tomonda emas:
   * kartochka uch joyda ishlatiladi (xatolarim, saqlangan, qidiruv) va
   * yangi joy qo'shilganda tekshiruvni unutib qo'yish oson bo'lardi.
   * Bu yerda esa uni chetlab o'tib bo'lmaydi.
   */
  const { isPremium } = useAccessState();
  const { t } = useLanguage();
  const izohVisible = showIzoh && Boolean(question.izoh);

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
        {/*
          Chegara `md:` (768px) — ATAYLAB test interfeysi bilan bir xil
          (`TestInterfaceBase` da rasm `md:hidden` bilan ustma-ustdan
          yonma-yonga o'tadi). Ilgari bu yerda `lg:` edi va 768-1023px
          ekranda bir xil savol testda o'ngda, "Xatolarim"da esa pastda
          ko'rinardi — o'sha izchillik buzilishi shundan edi.
        */}
        <div className={hasImage ? "flex flex-col gap-4 md:flex-row md:items-start" : undefined}>
          {hasImage ? (
            <div className="md:w-[46%] md:shrink-0">
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

        {izohVisible ? (
          isPremium ? (
            <details className="mt-3">
              <summary className="cursor-pointer text-sm font-medium text-primary">
                {t("test.explanation")}
              </summary>
              <p className="mt-2 whitespace-pre-line text-sm text-muted-foreground">
                {question.izoh}
              </p>
            </details>
          ) : (
            /* PRO emas — izoh matni CHIZILMAYDI, faqat taklif ko'rsatiladi */
            <Link
              to="/pro"
              className="mt-3 flex items-center gap-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs font-medium text-amber-700 transition-colors hover:bg-amber-500/20 dark:text-amber-400"
            >
              <Crown className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              {t("test.izohProTitle")}
            </Link>
          )
        ) : null}
      </CardContent>
    </Card>
  );
}
