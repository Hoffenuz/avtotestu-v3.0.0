import type { ReactNode } from "react";
import { useNavigate } from "react-router-dom";
import { Crown, Home, LogIn, Lock, ServerCrash } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";

type GateReason = "guest" | "no_pro" | "backend";

interface ProAccessGateProps {
  section: "mavzuli" | "darslik";
  reason: GateReason;
  returnPath: string;
  onRetry?: () => void;
}

function GateShell({
  icon,
  title,
  description,
  children,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <div className="min-h-[70vh] flex items-center justify-center p-6">
      <Card className="max-w-md w-full border border-border shadow-sm">
        <CardContent className="pt-10 pb-8 px-6 text-center">
          <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-muted flex items-center justify-center">
            {icon}
          </div>
          <h1 className="text-xl font-bold text-foreground mb-2">{title}</h1>
          <p className="text-sm text-muted-foreground mb-6 leading-relaxed">{description}</p>
          {children}
        </CardContent>
      </Card>
    </div>
  );
}

export function ProAccessGate({ section, reason, returnPath, onRetry }: ProAccessGateProps) {
  const navigate = useNavigate();
  const { language } = useLanguage();

  const sectionLabel =
    section === "mavzuli"
      ? language === "ru"
        ? "Тематические тесты"
        : language === "uz"
          ? "Мавзули тестлар"
          : "Mavzuli testlar"
      : language === "ru"
        ? "Видеоуроки"
        : language === "uz"
          ? "Вideo darslik"
          : "Video darslik";

  if (reason === "backend") {
    return (
      <GateShell
        icon={<ServerCrash className="w-10 h-10 text-muted-foreground" />}
        title={language === "ru" ? "Сервер недоступен" : language === "uz" ? "Server ishlamayapti" : "Server bilan aloqa yo'q"}
        description={
          language === "ru"
            ? "Не удалось проверить статус подписки. Попробуйте ещё раз."
            : language === "uz"
              ? "Obuna holatini tekshirib bo'lmadi. Qayta urinib ko'ring."
              : "Obuna holatini tekshirib bo'lmadi. Qayta urinib ko'ring."
        }
      >
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button onClick={onRetry}>{language === "ru" ? "Повторить" : "Qayta urinish"}</Button>
          <Button variant="outline" className="gap-2" onClick={() => navigate("/")}>
            <Home className="w-4 h-4" />
            {language === "ru" ? "На главную" : language === "uz" ? "Бош саҳифа" : "Bosh sahifa"}
          </Button>
        </div>
      </GateShell>
    );
  }

  const title =
    language === "ru"
      ? "Раздел для PRO подписчиков"
      : language === "uz"
        ? "PRO obunachilar uchun bo'lim"
        : "PRO obunachilar uchun bo'lim";

  const description =
    reason === "guest"
      ? language === "ru"
        ? `${sectionLabel} доступны только подписчикам PRO. Войдите в аккаунт и оформите PRO подписку.`
        : language === "uz"
          ? `${sectionLabel} faqat PRO obunachilar uchun. Kirish va PRO obuna oling.`
          : `${sectionLabel} faqat PRO obunachilar uchun. Foydalanish uchun tizimga kiring va PRO obuna oling.`
      : language === "ru"
        ? `${sectionLabel} доступны только с активной PRO подпиской.`
        : language === "uz"
          ? `${sectionLabel} faqat faol PRO obuna bilan ishlaydi.`
          : `${sectionLabel} faqat faol PRO obuna bilan mavjud.`;

  const icon =
    reason === "guest" ? (
      <Lock className="w-10 h-10 text-primary" />
    ) : (
      <Crown className="w-10 h-10 text-amber-600" />
    );

  return (
    <GateShell icon={icon} title={title} description={description}>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button className="gap-2" onClick={() => navigate("/pro")}>
          <Crown className="w-4 h-4" />
          {language === "ru" ? "Получить PRO" : language === "uz" ? "PRO olish" : "Pro olish"}
        </Button>
        {reason === "guest" && (
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => navigate("/auth", { state: { returnTo: returnPath } })}
          >
            <LogIn className="w-4 h-4" />
            {language === "ru" ? "Войти" : language === "uz" ? "Кirish" : "Kirish"}
          </Button>
        )}
        <Button variant="outline" className="gap-2" onClick={() => navigate("/")}>
          <Home className="w-4 h-4" />
          {language === "ru" ? "На главную" : language === "uz" ? "Бош саҳифа" : "Bosh sahifa"}
        </Button>
      </div>
    </GateShell>
  );
}
