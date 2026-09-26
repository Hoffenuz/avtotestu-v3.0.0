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
import { ProSectionGate } from "@/components/ProSectionGate";

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
        PRO (2026-09-26, egasining qarori): xatolarni ko'rish ham, ular ustida
        ishlash ham PRO. MainLayout gate'dan TASHQARIDA — holat almashganda
        layout qayta qurilmasin (footer sakramasin).
      */}
      <ProSectionGate section="xatolarim" returnPath="/xatolarim">
      <div className="container mx-auto max-w-4xl px-4 py-8 md:py-12">
        <PageHeader
          title={t("sections.xatolarim")}
          description={t("pages.xatolarimDesc")}
          /*
            Sarlavha qatorining o'ng tarafida — "xatolarni yechish".

            Bu sahifa ro'yxatni KO'RSATADI, yechish esa /xatolar-testi da
            bo'ladi (ikkalasi ham PRO). Tugma shu
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
      </ProSectionGate>
    </MainLayout>
  );
}
