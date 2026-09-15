// Xatolarim — foydalanuvchi xato javob bergan savollar.
// Ro'yxat eng ko'p xato qilingan savoldan boshlanadi (questionState.ts).
// Shaxsiy sahifa — qidiruv tizimlariga indekslanmaydi.

import { Link } from "react-router-dom";
import { Brain, ChevronRight } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { SEO } from "@/components/SEO";
import { PageHeader } from "@/components/PageHeader";
import { SavedWrongList } from "@/components/SavedWrongList";

export default function Xatolarim() {
  const { t } = useLanguage();

  return (
    <MainLayout>
      <SEO
        title={t("sections.xatolarim")}
        description="Test ishlashda xato javob bergan savollaringiz — takrorlash uchun bir joyda."
        path="/xatolarim"
        noIndex
      />

      {/*
        PRO TO'SIG'I YO'Q — ataylab.

        Foydalanuvchi O'Z xatosini ko'ra olishi kerak: buni yopish
        "to'lamasang, nimani bilmasliging ham aytmayman" degani bo'lardi.
        PRO esa ular USTIDA ISHLASHDA (`/xatolar-testi` — xatolar bo'yicha
        test yechish) talab qilinadi; qiymat o'sha yerda.

        Mehmon holatini `SavedWrongList` o'zi hal qiladi (kirish taklifi).
      */}
      <div className="container mx-auto max-w-4xl px-4 py-8 md:py-12">
        <PageHeader
          title={t("sections.xatolarim")}
          description={t("pages.xatolarimDesc")}
          /*
            Sarlavha qatorining o'ng tarafida — "xatolarni yechish".

            Bu sahifa ro'yxatni KO'RSATADI (bepul), yechish esa
            /xatolar-testi da bo'ladi va PRO talab qiladi. Tugma shu
            yerda turishi mantiqiy: odam xatolarini ko'rib turib, darhol
            ular ustida ishlay oladi.
          */
          action={
            <Link
              to="/xatolar-testi"
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-3.5 py-2.5 text-sm font-bold text-primary-foreground shadow-sm transition-opacity hover:opacity-90"
            >
              <Brain className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span className="hidden sm:inline">{t("sections.xatolarTesti")}</span>
              <span className="sm:hidden">{t("pages.solveMistakes")}</span>
              <ChevronRight className="h-4 w-4 shrink-0" aria-hidden="true" />
            </Link>
          }
        />

        <SavedWrongList mode="wrong" />
      </div>
    </MainLayout>
  );
}
