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
import { GuideMedia } from "@/components/GuideMedia";
import { QOLLANMA_COMPARE, QOLLANMA_STEPS } from "@/data/qollanmaQadamlar";

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

/**
 * Taqqoslash katakchasi: "bor"/"yo'q" yoki aniq qiymat.
 *
 * Belgilar rangsiz (`foreground` / `muted-foreground`): yashil-qizil juftlik
 * bepul versiyani "yomon" qilib ko'rsatardi, holbuki u to'liq ishlaydigan
 * mahsulot. Ekran o'quvchi uchun matn `sr-only` da beriladi.
 */
function CompareCell({ value }: { value: boolean | string }) {
  const { t } = useLanguage();

  if (typeof value === "string") {
    return (
      <td className="px-2 py-2.5 text-center font-medium text-foreground sm:px-3">{t(value)}</td>
    );
  }

  return (
    <td className="px-2 py-2.5 text-center sm:px-3">
      {value ? (
        <>
          <Check className="mx-auto h-4 w-4 text-foreground" aria-hidden="true" />
          <span className="sr-only">{t("qollanma.yes")}</span>
        </>
      ) : (
        <>
          <Minus className="mx-auto h-4 w-4 text-muted-foreground/60" aria-hidden="true" />
          <span className="sr-only">{t("qollanma.no")}</span>
        </>
      )}
    </td>
  );
}

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
            <Link to="/variant">
              <Button className="gap-2 rounded-full bg-cta-green px-6 py-5 font-semibold text-white hover:bg-cta-green-hover">
                <Play className="h-5 w-5" />
                {t("qollanma.ctaTests")}
              </Button>
            </Link>
            <Link to="/darslik">
              <Button
                variant="outline"
                className="gap-2 rounded-full border-primary-foreground/20 bg-brand-foreground/10 px-6 py-5 font-semibold text-brand-foreground hover:bg-brand-foreground/20"
              >
                <BookOpen className="h-5 w-5" />
                {t("qollanma.ctaDarslik")}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Saytdan foydalanish — qadamlar */}
      <section className="bg-background py-12 md:py-16">
        <div className="mx-auto max-w-4xl px-4">
          <h2
            className="text-2xl font-bold text-foreground md:text-3xl"
            style={{ fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif" }}
          >
            {t("qollanma.stepsTitle")}
          </h2>
          <p className="mt-1.5 text-sm text-muted-foreground md:text-base">{t("qollanma.stepsLead")}</p>

          <ol className="mt-7 space-y-5 md:space-y-7">
            {QOLLANMA_STEPS.map((step, index) => {
              const Icon = step.icon;
              const title = t(step.titleKey);
              return (
                <li
                  key={step.titleKey}
                  className="rounded-xl border border-border bg-card p-4 sm:p-5"
                >
                  <div className="flex items-start gap-3 sm:gap-4">
                    <span
                      className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary sm:h-10 sm:w-10"
                      aria-hidden="true"
                    >
                      <Icon className="h-[18px] w-[18px] sm:h-5 sm:w-5" />
                    </span>

                    <div className="min-w-0 flex-1">
                      <h3 className="text-[15px] font-bold text-foreground sm:text-base">
                        <span className="text-muted-foreground">{index + 1}. </span>
                        {title}
                      </h3>
                      <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                        {t(step.textKey)}
                      </p>

                      <Link
                        to={step.to}
                        className="mt-2.5 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline"
                      >
                        {t("darslik.startCta")}
                        <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                      </Link>
                    </div>
                  </div>

                  {/* Rasm/video — fayl qo'shilgandan keyin o'zi paydo bo'ladi */}
                  <div className="mt-4 empty:mt-0">
                    <GuideMedia media={step.media} alt={title} />
                  </div>
                </li>
              );
            })}
          </ol>
        </div>
      </section>

      {/*
        BEPUL VA PRO TAQQOSLASH.

        ATAYLAB BEZAKSIZ: PRO sahifasida bu jadval oltin gradient, toj va
        qizil chizilgan qatorlar bilan chiziladi — u yerda maqsad sotish.
        Bu yerda maqsad TUSHUNTIRISH, shuning uchun faqat tema ranglari:
        odam farqni ko'rish uchun keladi, reklama ko'rish uchun emas.
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

          <div className="mt-6 overflow-hidden rounded-xl border border-border bg-card">
            <table className="w-full border-collapse text-sm">
              <caption className="sr-only">{t("qollanma.compareTitle")}</caption>
              <thead>
                <tr className="border-b border-border bg-muted/40">
                  <th scope="col" className="px-3 py-2.5 text-left font-semibold text-foreground sm:px-4">
                    {t("qollanma.compareFeature")}
                  </th>
                  <th scope="col" className="w-[26%] px-2 py-2.5 text-center font-semibold text-muted-foreground sm:w-[22%] sm:px-3">
                    {t("qollanma.compareFree")}
                  </th>
                  <th scope="col" className="w-[26%] px-2 py-2.5 text-center font-semibold text-foreground sm:w-[22%] sm:px-3">
                    {t("qollanma.comparePro")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {QOLLANMA_COMPARE.map((row) => (
                  <tr key={row.labelKey} className="border-b border-border last:border-0">
                    <th scope="row" className="px-3 py-2.5 text-left font-normal text-foreground sm:px-4">
                      {t(row.labelKey)}
                    </th>
                    <CompareCell value={row.free} />
                    <CompareCell value={row.pro} />
                  </tr>
                ))}
              </tbody>
            </table>
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
                      className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-cta-green text-sm font-bold text-white"
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
