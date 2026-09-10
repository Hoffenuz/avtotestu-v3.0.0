// ============================================================================
// AuthSectionGate — bo'limni FAQAT ro'yxatdan o'tishga bog'lash
// ----------------------------------------------------------------------------
// NEGA BU KOMPONENT PAYDO BO'LDI:
//   "Xato savollarim" va "Xatolar ustida ishlash" ilgari PRO talab qilardi.
//   Lekin bu bo'limlar foydalanuvchining O'Z ma'lumotini ko'rsatadi va
//   serverda ham faqat egalik bo'yicha himoyalangan (`user_question_state`
//   RLS da PRO tekshiruvi yo'q) — ya'ni cheklov faqat interfeysda edi.
//
//   Ularni ro'yxatdan o'tganlarga ochish o'lchangan qaror: saytga kuniga
//   ~2 163 kishi keladi, atigi 34 tasi ro'yxatdan o'tadi (1,6%). Xatolarni
//   saqlash — ro'yxatdan o'tishga eng tabiiy sabab, chunki uni faqat hisob
//   bilan berish mumkin. PRO esa boshqa narsani sotadi: to'liq savol bazasi
//   (1250 vs 1009), izohlar, qidiruv, qiyin savollar.
//
// NEGA ProSectionGate DAN AJRATILGAN:
//   O'sha komponent PRO holatini tekshiradi va "PRO obunachilar uchun"
//   deydi. Bu yerda xabar butunlay boshqa: bu to'siq emas, TAKLIF —
//   "ro'yxatdan o'ting, bepul". Bitta komponentga bayroq qo'shish ikkala
//   xabarni ham chalkashtirardi.
//
// Ko'rinishi `ProAccessGate` bilan bir xil (`GateShell`) — foydalanuvchi
// uchun bu bir xil turdagi ekran, faqat mazmuni boshqa.
// ============================================================================

import { useEffect, type ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { UserPlus, LogIn, Home } from "lucide-react";
import { Button } from "@/components/ui/button";
import { GateShell } from "@/components/ProAccessGate";
import { SECTION_LABEL, type GateSection } from "@/lib/gateSections";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { trackEvent } from "@/lib/track";

interface AuthSectionGateProps {
  section: GateSection;
  /** Kirgandan keyin qaytariladigan manzil. */
  returnPath: string;
  children: ReactNode;
}

export function AuthSectionGate({ section, returnPath, children }: AuthSectionGateProps) {
  const { user, isLoading } = useAuth();
  const { language } = useLanguage();
  const navigate = useNavigate();

  /*
    Yuklanish paytida spinner ekranni to'ldiradi — `ProSectionGate` dagi
    bilan bir xil balandlik. Aks holda holat aniqlangach sahifa sakrardi.
  */
  if (isLoading) {
    return (
      <div className="flex min-h-[70vh] items-center justify-center" role="status">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  if (user) return <>{children}</>;

  return <SignupGateView section={section} returnPath={returnPath} navigate={navigate} language={language} />;
}

/*
  Alohida komponentga ajratilgan — chunki `useEffect` shart bo'yicha
  chaqirilmasligi kerak (Rules of Hooks). Yuqoridagi ikki erta `return`
  (`isLoading`, `user`) tugagach, bu komponent FAQAT haqiqatan taklif
  ko'rsatilganda chiziladi va shu payt voronka voqeasi yuboriladi.
*/
function SignupGateView({
  section,
  returnPath,
  navigate,
  language,
}: {
  section: GateSection;
  returnPath: string;
  navigate: ReturnType<typeof useNavigate>;
  language: ReturnType<typeof useLanguage>["language"];
}) {
  useEffect(() => {
    trackEvent("signup_gate_view", { section });
  }, [section]);

  const labels = SECTION_LABEL[section] ?? SECTION_LABEL.mavzuli;
  const nom =
    language === "ru" ? labels.ru : language === "uz" ? labels.uz_cyr : labels.uz_lat;

  const title =
    language === "ru"
      ? "Зарегистрируйтесь — бесплатно"
      : language === "uz"
        ? "Рўйхатдан ўтинг — бепул"
        : "Ro'yxatdan o'ting — bepul";

  const description =
    language === "ru"
      ? `«${nom}» запоминает вопросы, в которых вы ошиблись, чтобы вы могли к ним вернуться. Для этого нужен аккаунт — регистрация бесплатная и занимает минуту.`
      : language === "uz"
        ? `«${nom}» сиз хато қилган саволларни эслаб қолади — кейин уларга қайтасиз. Бунинг учун ҳисоб керак, рўйхатдан ўтиш бепул ва бир дақиқа олади.`
        : `«${nom}» siz xato qilgan savollarni eslab qoladi — keyin ularga qaytasiz. Buning uchun hisob kerak, ro'yxatdan o'tish bepul va bir daqiqa oladi.`;

  return (
    <GateShell
      icon={<UserPlus className="h-10 w-10 text-primary" />}
      title={title}
      description={description}
    >
      <div className="flex flex-col justify-center gap-3 sm:flex-row">
        <Button
          className="gap-2"
          onClick={() => {
            trackEvent("signup_gate_cta_click", { section });
            navigate("/auth", { state: { returnTo: returnPath, mode: "signup" } });
          }}
        >
          <UserPlus className="h-4 w-4" aria-hidden="true" />
          {language === "ru" ? "Регистрация" : language === "uz" ? "Рўйхатдан ўтиш" : "Ro'yxatdan o'tish"}
        </Button>
        <Button
          variant="outline"
          className="gap-2"
          onClick={() => navigate("/auth", { state: { returnTo: returnPath } })}
        >
          <LogIn className="h-4 w-4" aria-hidden="true" />
          {language === "ru" ? "Войти" : language === "uz" ? "Кириш" : "Kirish"}
        </Button>
        <Button variant="outline" className="gap-2" onClick={() => navigate("/")}>
          <Home className="h-4 w-4" aria-hidden="true" />
          {language === "ru" ? "На главную" : language === "uz" ? "Бош саҳифа" : "Bosh sahifa"}
        </Button>
      </div>
    </GateShell>
  );
}
