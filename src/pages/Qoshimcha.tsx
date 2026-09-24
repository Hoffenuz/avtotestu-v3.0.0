// ============================================================================
// Qoshimcha (/qoshimcha) — "Qo'llanma"
// ----------------------------------------------------------------------------
// NIMA O'ZGARDI VA NEGA:
//   * Sahifa header'dagi "Qo'shimcha" menyusida turardi; menyu olib
//     tashlandi va u endi `/bolimlar` katalogidagi "O'rganish" guruhida
//     hamda footer'da "Qo'llanma" nomi bilan turadi. Eski nom ("Qo'shimcha
//     ma'lumotlar") ichida nima borligini aytmasdi.
//   * Kompyuter ilova reklamasi OLIB TASHLANDI: u `/desktop` sahifasini
//     to'liq takrorlardi va o'sha ilova `/bolimlar` pastida alohida
//     kartochkada hamda footer'da allaqachon ko'rinadi. Uchinchi nusxa
//     shu sahifaning asosiy mavzusini (tayyorgarlik maslahatlari) pastga
//     surib yuborardi.
//   * Butun matn TARJIMA KALITLARIGA ko'chirildi. Ilgari qattiq o'zbekcha
//     lotin yozilgandi: rus tilini tanlagan foydalanuvchi tarjima qilingan
//     menyuni, lekin tarjimasiz sahifani ko'rardi.
// ============================================================================

import { Link } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { SEO } from "@/components/SEO";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpen, Check, FileText, Lightbulb, ListChecks, Minus, Play, Target } from "lucide-react";
import { PRO_COMPARISON } from "@/lib/proComparison";

/**
 * Kartochkalar — matn emas, TARJIMA KALITLARI bilan.
 * Ikonka shu yerda qoladi: u tildan qat'i nazar bir xil.
 */
const CARDS = [
  { icon: FileText, titleKey: "qollanma.cardStructureTitle", descKey: "qollanma.cardStructureDesc" },
  { icon: Target, titleKey: "qollanma.cardStrategyTitle", descKey: "qollanma.cardStrategyDesc" },
  { icon: ListChecks, titleKey: "qollanma.cardPracticeTitle", descKey: "qollanma.cardPracticeDesc" },
  { icon: Lightbulb, titleKey: "qollanma.cardResourcesTitle", descKey: "qollanma.cardResourcesDesc" },
] as const;

const TIP_KEYS = [
  "qollanma.tip1",
  "qollanma.tip2",
  "qollanma.tip3",
  "qollanma.tip4",
  "qollanma.tip5",
] as const;

export default function Qoshimcha() {
  const { t } = useLanguage();

  return (
    <MainLayout>
      <SEO
        title={t("seo.qoshimcha.title")}
        description={t("seo.qoshimcha.description")}
        path="/qoshimcha"
        keywords={t("seo.qoshimcha.keywords")}
      />

      {/* Hero */}
      <section className="relative overflow-hidden py-14 md:py-20">
        <div className="absolute inset-0 bg-gradient-to-br from-brand via-brand to-brand/90" />
        <div className="absolute inset-0 hero-pattern" />
        <div className="relative mx-auto max-w-4xl px-4 text-center">
          <h1
            className="mb-4 text-3xl font-bold text-brand-foreground md:text-4xl"
            style={{ fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif" }}
          >
            {t("qollanma.h1")}
          </h1>
          <p className="mx-auto mb-7 max-w-2xl text-base text-brand-foreground/90 md:text-lg">
            {t("qollanma.lead")}
          </p>

          {/*
            Ikkita tugma: biri AMALGA (test yechish), biri chuqurroq
            materialga. Ilgari uchta edi va uchinchisi (Yangiliklar) shu
            sahifaning mavzusiga umuman aloqador emasdi.
          */}
          <div className="flex flex-wrap justify-center gap-3">
            {/*
              Siyoh fonda asosiy tugma — OQ, matn siyoh (header'dagi "Kirish"
              bilan bir xil); ikkilamchisi — shaffof oq chegarali.
              `asChild`: havolaning o'zi tugma (ilgari <a> ichida <button>).
            */}
            <Button asChild className="h-12 gap-2 rounded-lg bg-white px-6 font-semibold text-[#131A45] hover:bg-white/90">
              <Link to="/variant">
                <Play className="h-5 w-5" />
                {t("qollanma.ctaTests")}
              </Link>
            </Button>
            <Button
              asChild
              variant="outline"
              className="h-12 gap-2 rounded-lg border-white/25 bg-white/10 px-6 font-semibold text-brand-foreground hover:bg-white/15 hover:text-brand-foreground"
            >
              <Link to="/darslik">
                <BookOpen className="h-5 w-5" />
                {t("qollanma.ctaDarslik")}
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/*
        BEPUL VA PRO TAQQOSLASH.

        MAZMUN `/pro` BILAN BIR XIL — ikkalasi ham `PRO_COMPARISON` dan
        chiziladi. Ilgari bu yerda boshqacha, o'nta qatorli jadval bor edi
        va foydalanuvchi ikki sahifada ikki xil ro'yxatni ko'rardi.

        FARQ — FAQAT KO'RINISHDA: u yerda oltin gradient, toj va qizil
        chizilgan qatorlar, chunki maqsad sotish. Bu yerda maqsad
        tushuntirish, shuning uchun faqat tema ranglari. Yashil-qizil
        juftlik ham yo'q: u bepul versiyani "yaroqsiz" qilib ko'rsatardi,
        holbuki u to'liq ishlaydigan mahsulot.
      */}
      <section className="border-t border-border bg-muted/20 py-12 md:py-16">
        <div className="mx-auto max-w-4xl px-4">
          <h2
            className="text-2xl font-bold text-foreground md:text-3xl"
            style={{ fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif" }}
          >
            {t("qollanma.compareTitle")}
          </h2>
          <p className="mt-1.5 text-sm text-muted-foreground md:text-base">{t("qollanma.compareLead")}</p>

          <div className="mt-6 grid gap-3 sm:grid-cols-2 sm:gap-4">
            {/* Bepul */}
            <div className="rounded-xl border border-border bg-card">
              <h3 className="border-b border-border px-4 py-3 text-center text-sm font-semibold text-muted-foreground">
                {t("qollanma.compareFree")}
              </h3>
              <ul className="space-y-3 p-4">
                {PRO_COMPARISON.map((row) => (
                  <li key={row.freeKey} className="flex items-start gap-2.5">
                    {row.inFree ? (
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-foreground" aria-hidden="true" />
                    ) : (
                      <Minus className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground/50" aria-hidden="true" />
                    )}
                    <span
                      className={
                        row.inFree
                          ? "text-sm text-foreground"
                          : "text-sm text-muted-foreground/70 line-through"
                      }
                    >
                      {t(row.freeKey)}
                    </span>
                    <span className="sr-only">{row.inFree ? t("qollanma.yes") : t("qollanma.no")}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* PRO */}
            <div className="rounded-xl border border-border bg-card">
              <h3 className="border-b border-border px-4 py-3 text-center text-sm font-semibold text-foreground">
                {t("qollanma.comparePro")}
              </h3>
              <ul className="space-y-3 p-4">
                {PRO_COMPARISON.map((row) => (
                  <li key={row.proKey} className="flex items-start gap-2.5">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-foreground" aria-hidden="true" />
                    <span className="text-sm font-medium text-foreground">{t(row.proKey)}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs text-muted-foreground">{t("qollanma.compareNote")}</p>
            <Link
              to="/pro"
              className="inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
            >
              {t("qollanma.compareCta")}
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </Link>
          </div>
        </div>
      </section>

      {/* Kartochkalar */}
      <section className="bg-background py-12 md:py-16">
        <div className="mx-auto max-w-6xl px-4">
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-4">
            {CARDS.map((card) => {
              const Icon = card.icon;
              return (
                <Card key={card.titleKey} className="border-none shadow-lg transition-shadow hover:shadow-xl">
                  <CardContent className="pt-6">
                    <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-xl bg-primary/10">
                      <Icon className="h-7 w-7 text-primary" />
                    </div>
                    <h2
                      className="mb-2 text-lg font-bold text-foreground"
                      style={{ fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif" }}
                    >
                      {t(card.titleKey)}
                    </h2>
                    <p className="text-sm leading-relaxed text-muted-foreground">{t(card.descKey)}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Maslahatlar */}
      <section className="bg-secondary/30 py-12 md:py-16">
        <div className="mx-auto max-w-4xl px-4">
          <Card className="border-none shadow-xl">
            <CardContent className="p-6 md:p-8">
              <h2
                className="mb-6 text-center text-2xl font-bold text-foreground"
                style={{ fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif" }}
              >
                {t("qollanma.tipsTitle")}
              </h2>
              <ul className="space-y-4">
                {TIP_KEYS.map((key, index) => (
                  <li key={key} className="flex items-start gap-4">
                    <span
                      className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground"
                      aria-hidden="true"
                    >
                      {index + 1}
                    </span>
                    <p className="pt-1 text-foreground">{t(key)}</p>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>
    </MainLayout>
  );
}
