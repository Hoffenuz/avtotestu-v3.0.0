import { useRef, useEffect, useCallback, useMemo, memo } from "react";

interface QuestionNavigationProps {
  currentQuestion: number;
  totalQuestions: number;
  answeredQuestions: Record<number, number>;
  correctAnswers: Record<number, boolean>; // Maps question number to whether the answer was correct
  onQuestionSelect: (questionNumber: number) => void;
}

function buttonStyles(isActive: boolean, isAnswered: boolean, isCorrect: boolean | undefined) {
  if (isActive) return "bg-primary text-primary-foreground shadow-sm";
  if (isAnswered) {
    if (isCorrect === true) return "bg-green-500 text-white border-green-500";
    if (isCorrect === false) return "bg-red-500 text-white border-red-500";
  }
  return "bg-muted/50 text-muted-foreground hover:bg-muted border border-border";
}

/**
 * Alohida memo'langan tugma — faqat PRIMITIV proplar oladi.
 *
 * ILGARIGI BUG (qotib qolish): barcha tugmalar bitta komponent ichida
 * chizilardi, ya'ni har javob bosilganda HAMMASI qayta render bo'lardi.
 * "Barcha savollar" mavzusida bu 1250 ta tugma degani edi — arzon Android da
 * har bosishda seziladigan kechikish. Endi faqat holati o'zgargan tugmalar
 * (eski va yangi aktiv, javob berilgani) qayta render bo'ladi.
 */
const QuestionButton = memo(function QuestionButton({
  questionNum,
  isActive,
  isAnswered,
  isCorrect,
  onSelect,
}: {
  questionNum: number;
  isActive: boolean;
  isAnswered: boolean;
  isCorrect: boolean | undefined;
  onSelect: (questionNumber: number) => void;
}) {
  return (
    <button
      data-qnum={questionNum}
      onClick={() => onSelect(questionNum)}
      className={`
        min-w-[32px] h-8 md:min-w-[36px] md:h-8 text-xs md:text-sm font-medium rounded-md transition-all duration-200
        flex items-center justify-center
        ${buttonStyles(isActive, isAnswered, isCorrect)}
      `}
    >
      {questionNum}
    </button>
  );
});

export const QuestionNavigation = ({
  currentQuestion,
  totalQuestions,
  answeredQuestions,
  correctAnswers,
  onQuestionSelect
}: QuestionNavigationProps) => {
  const questions = useMemo(
    () => Array.from({ length: totalQuestions }, (_, i) => i + 1),
    [totalQuestions],
  );
  const scrollRef = useRef<HTMLDivElement>(null);

  /**
   * Barqaror callback: `onQuestionSelect` har renderda yangi funksiya bo'lsa
   * ham QuestionButton ning memo si buzilmasin.
   */
  const onSelectRef = useRef(onQuestionSelect);
  onSelectRef.current = onQuestionSelect;
  const handleSelect = useCallback((n: number) => onSelectRef.current(n), []);

  // Auto-scroll to active question. Aktiv tugma DOM dan topiladi — shu sababli
  // tugmaga `ref` uzatish shart emas (u memo ni buzardi).
  useEffect(() => {
    const container = scrollRef.current;
    if (!container) return;
    const activeButton = container.querySelector<HTMLButtonElement>(
      `[data-qnum="${currentQuestion}"]`,
    );
    if (!activeButton) return;

    const containerRect = container.getBoundingClientRect();
    const buttonRect = activeButton.getBoundingClientRect();

    const scrollLeft = buttonRect.left - containerRect.left - containerRect.width / 2 + buttonRect.width / 2 + container.scrollLeft;
    container.scrollTo({ left: scrollLeft, behavior: 'smooth' });
  }, [currentQuestion]);

  return (
    <div className="bg-card/80 backdrop-blur-sm border-b border-border py-2 md:py-2.5 shrink-0">
      <div
        ref={scrollRef}
        className="max-w-5xl mx-auto px-3 md:px-4 overflow-x-auto scrollbar-hide"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <div className="flex gap-1.5 md:gap-2 pb-0.5 min-w-max">
          {questions.map((questionNum) => (
            <QuestionButton
              key={questionNum}
              questionNum={questionNum}
              isActive={currentQuestion === questionNum}
              isAnswered={answeredQuestions[questionNum] !== undefined}
              isCorrect={correctAnswers[questionNum]}
              onSelect={handleSelect}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
