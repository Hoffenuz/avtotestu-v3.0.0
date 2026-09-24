import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle, XCircle, Clock, Trophy, RotateCcw, Home, UserPlus, X, MinusCircle } from "lucide-react";
import { formatDurationSeconds } from "@/lib/testPersistence";

interface TestResultsProps {
  totalQuestions: number;
  correctAnswers: number;
  incorrectAnswers: number;
  timeTaken: number; // in seconds
  /** Real ticket 1–64. Practice / mavzuli (0 or 99) — label yashirinadi */
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
  const { user } = useAuth();
  const navigate = useNavigate();

  /** Javobsiz qolganlar — jamidan javob berilganlarni ayirib topiladi. */
  const unanswered = Math.max(0, totalQuestions - correctAnswers - incorrectAnswers);

  const score = totalQuestions > 0 ? Math.round((correctAnswers / totalQuestions) * 100) : 0;
  const passed = score >= 90;
  const showVariantLabel = Number.isInteger(variant) && variant >= 1 && variant <= 64;

  /*
    ── Mehmon uchun ro'yxatga chaqiruv — TOAST sifatida ──────────────────
    Ilgari bu natija kartasi ICHIDA, pastki qismda turardi. Karta
    balandligi cheklangan (`overflow-y-auto`) bo'lgani uchun bu blok
    KO'RINMASDAN QOLARDI: desktopda karta ekranga sig'ib ketgani uchun
    bloк "deyarli ko'rinmas" bo'lib qolardi, mobilda esa uni ko'rish
    uchun natija ekranining o'zi ICHIDA yana bir marta pastga scroll
    qilish kerak edi — foydalanuvchi buni sezmasdi.

    Endi bu alohida, ekranning tepasidan tushadigan TOAST (`sonner`).
    `duration: Infinity` — foydalanuvchi o'zi yopmaguncha yoki tugmani
    bosmaguncha ekranda turadi, chunki bu vaqtinchalik bildirishnoma
    emas: "natijangiz saqlanmadi" degan HAQIQIY YO'QOTISH haqida.
  */
  useEffect(() => {
    if (user) return;

    const id = toast.custom(
      (tid) => (
        /*
          `dark` klassi shu yerda QO'LDA qo'yiladi. Toast `<Toaster />`
          orqali App darajasida, ya'ni natija ekranining `dark` konteyneridan
          TASHQARIDA render bo'ladi — `isDark` propi unga o'z-o'zidan
          yetib bormaydi va toast oq, ekran qora bo'lib qolardi.
        */
        <div className={isDark ? "dark" : ""}>
          {/*
            Fon `bg-card/95` + blur, ramka esa `primary` tusida.

            SABABI: natija kartasi ham `bg-card` — bir xil rang bo'lsa toast
            uning ICHIDAGI blok kabi ko'rinadi, aynan shu narsa xunuk edi.
            (`--popover` bu yerda yordam bermaydi: u `--card` bilan bir xil
            qiymatga ega.) Rangli ramka, blur va chuqur soya toastni alohida,
            ustida suzib turgan qatlam sifatida ajratadi.
          */}
          <div className="flex w-full flex-col gap-3 rounded-2xl border border-primary/25 bg-card/95 p-4 shadow-2xl shadow-black/25 backdrop-blur-md">
            <div className="flex items-start gap-3">
              <span className="mt-px flex h-9 w-9 flex-none items-center justify-center rounded-full bg-primary/10">
                <UserPlus className="h-[18px] w-[18px] text-primary" aria-hidden="true" />
              </span>

              <div className="min-w-0 flex-1">
                <p className="text-[15px] font-semibold leading-snug text-foreground">
                  {incorrectAnswers > 0 ? t("results.guestTitle") : t("results.title")}
                </p>
                <p className="mt-1 text-[13px] leading-relaxed text-muted-foreground">
                  {incorrectAnswers > 0
                    ? t("results.guestText").replace("{n}", String(incorrectAnswers))
                    : t("results.guestTextPerfect")}
                </p>
              </div>

              <button
                type="button"
                onClick={() => toast.dismiss(tid)}
                aria-label={t("common.close")}
                className="-mr-1 -mt-1 flex h-7 w-7 flex-none items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                <X className="h-4 w-4" aria-hidden="true" />
              </button>
            </div>

            <Button
              className="h-11 w-full text-[15px] font-semibold"
              onClick={() => {
                toast.dismiss(tid);
                navigate("/auth", { state: { returnTo: "/xatolarim", mode: "signup" } });
              }}
            >
              {t("results.guestBtn")}
            </Button>
          </div>
        </div>
      ),
      {
        id: "guest-result-cta",
        duration: Infinity,
        position: "top-center",
        /*
          Kenglik sonner'ning o'z o'lchamidan (356px) kengroq — matn uchun
          joy kerak. Tor ekranda esa chetlarda 1rem qoldirib moslashadi,
          bu sonner'ning mobil chekinishi (16px) bilan aynan mos tushadi.

          `unstyled` YOZILMAGAN: `toast.custom` da sonner fon va ramkani
          o'zi qo'shmaydi (`data-styled=false`), lekin joylashuv va
          animatsiya stillari saqlanadi — aynan kerakli holat.
        */
        style: { width: "min(26rem, calc(100vw - 2rem))" },
      },
    );

    // Komponent yopilganda (masalan "Qayta urinish" bosilganda) toast ham
    // yopiladi — aks holda u keyingi ekranda ham osilib qolardi.
    return () => { toast.dismiss(id); };
    // eslint-disable-next-line react-hooks/exhaustive-deps -- faqat natija ekrani ochilganda bir marta
  }, [user]);

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

          {/*
            Javobsiz qolgan savollar ATAYLAB alohida ko'rsatkich.

            Ilgari faqat "to'g'ri" va "noto'g'ri" bor edi: testni yarim
            tashlab ketgan foydalanuvchi "0 to'g'ri, 1 noto'g'ri" ko'rib,
            qolgan 19 ta savol qayerga ketganini tushunmasdi. Foiz esa
            baribir umumiy savol soniga bo'linardi — ya'ni raqamlar
            bir-biriga mos kelmasdi.
          */}
          <div className={`grid gap-2.5 sm:gap-3 ${unanswered > 0 ? "grid-cols-2 sm:grid-cols-4" : "grid-cols-3"}`}>
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
            {unanswered > 0 ? (
              <div className="text-center p-3 sm:p-3.5 bg-muted/30 rounded-lg">
                <MinusCircle className="w-6 h-6 sm:w-7 sm:h-7 text-muted-foreground mx-auto mb-1.5" />
                <div className="text-xl sm:text-2xl font-bold text-foreground">{unanswered}</div>
                <p className="text-xs sm:text-sm text-muted-foreground leading-tight mt-0.5">{t("results.unanswered")}</p>
              </div>
            ) : null}
            <div className="text-center p-3 sm:p-3.5 bg-muted/30 rounded-lg">
              <Clock className="w-6 h-6 sm:w-7 sm:h-7 text-primary mx-auto mb-1.5" />
              <div className="text-xl sm:text-2xl font-bold text-foreground">{formatDurationSeconds(timeTaken)}</div>
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
