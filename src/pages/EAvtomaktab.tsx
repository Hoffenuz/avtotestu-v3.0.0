// ============================================================================
// EAvtomaktab — "e-avtomaktab" qidiruvlari uchun qo'llanma sahifasi
// ----------------------------------------------------------------------------
// NEGA BU SAHIFA BOR:
//   Search Console ma'lumoti: "e avtomaktab", "eavtotalim" va shunga o'xshash
//   so'rovlar bo'yicha sayt 28 kunda 81 792 marta ko'rsatilgan, lekin CTR
//   atigi 0,4%. Sabab oddiy — bu odamlar RASMIY PORTALNI qidiryapti, sayt
//   esa test sayti sifatida chiqadi va ularning savoliga javob bermaydi.
//
//   Bu sahifa ularga aynan kerakli javobni beradi va rasmiy manzilga OCHIQ
//   havola qo'yadi. Chalg'itish emas: odam kerak joyiga borsa ham, sahifa
//   foydali bo'lgani uchun keyin qaytadi.
//
// DIZAYN QARORI — TAKLIF TEPADA, RASMIY HAVOLA DARHOL OSTIDA:
//   Birinchi ekranda bizning taklifimiz turadi ("borishdan oldin
//   tayyormisan?"), rasmiy manzil esa darhol ostida — kichikroq qatorda,
//   lekin YASHIRILMAGAN.
//
//   Nega yashirilmagan: bu sahifaga kelgan odam rasmiy portalni qidirgan.
//   Havolani berkitish chalg'itish bo'lardi, qidiruv tizimi buni jazolaydi
//   va foydalanuvchi ishonchini yo'qotadi. Ochiq qoldirilgani esa aksincha
//   ishonch beradi: kerak joyiga borgan odam sahifa foydali bo'lgani uchun
//   qaytadi.
// ============================================================================

import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import {
  ExternalLink, Info, CheckCircle2, CircleDashed, ArrowRight, CalendarClock, Target,
} from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { SEO } from "@/components/SEO";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  BOSQICHLAR, FAQ, IMTIHON_FAKTLARI, MAZMUN_SANASI, RASMIY, YANGILANISH,
} from "@/lib/eAvtomaktab";

const BASE = "https://www.avtotestu.uz";

export default function EAvtomaktab() {
  const { t, questionLang: L } = useLanguage();

  /*
    FAQPage sxemasi — qidiruv natijasida "akkordeon" ko'rinishida joy
    egallashi mumkin. Bu CTR ni ko'taradigan eng arzon vosita.
  */
  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map((f) => ({
      "@type": "Question",
      name: f.savol[L],
      acceptedAnswer: { "@type": "Answer", text: f.javob[L] },
    })),
  };

  const howToLd = {
    "@context": "https://schema.org",
    "@type": "HowTo",
    name: t("eav.howToName"),
    step: BOSQICHLAR.map((b) => ({
      "@type": "HowToStep",
      position: b.n,
      name: b.sarlavha[L],
      text: b.matn[L],
    })),
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: t("nav.home"), item: BASE },
      { "@type": "ListItem", position: 2, name: t("nav.sections"), item: `${BASE}/bolimlar` },
      { "@type": "ListItem", position: 3, name: "E-avtomaktab", item: `${BASE}/e-avtomaktab` },
    ],
  };

  return (
    <MainLayout>
      <SEO
        title={t("seo.eAvtomaktab.title")}
        description={t("seo.eAvtomaktab.description")}
        path="/e-avtomaktab"
        keywords={t("seo.eAvtomaktab.keywords")}
      />
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(faqLd)}</script>
        <script type="application/ld+json">{JSON.stringify(howToLd)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbLd)}</script>
      </Helmet>

      <div className="mx-auto w-full max-w-3xl px-4 py-6 md:py-10">

        {/* ── Sarlavha ─────────────────────────────────────────────── */}
        <nav aria-label="breadcrumb" className="mb-3 text-xs text-muted-foreground">
          <Link to="/" className="hover:text-foreground">{t("nav.home")}</Link>
          <span className="mx-1.5">/</span>
          <Link to="/bolimlar" className="hover:text-foreground">{t("nav.sections")}</Link>
          <span className="mx-1.5">/</span>
          <span className="text-foreground">E-avtomaktab</span>
        </nav>

        <h1 className="text-2xl font-bold leading-tight text-foreground md:text-3xl">
          {t("eav.h1")}
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
          {t("eav.lead")}
        </p>

        {/*
          ── ASOSIY TAKLIF — ENG TEPADA ─────────────────────────────
          Bu sahifaga kelgan odam rasmiy portalni qidirgan. Uni to'xtatib
          qolish emas, unga TO'G'RI savolni berish kerak: "borishdan
          oldin tayyormisan?".

          Shuning uchun birinchi ekranda bizning taklifimiz turadi,
          rasmiy havola esa darhol ostida — kichikroq, lekin YASHIRILMAGAN.
          Yashirish chalg'itish bo'lardi va qidiruv tizimi ham buni
          jazolaydi; ochiq qoldirish esa ishonch beradi.
        */}
        <Card className="mt-5 overflow-hidden border-2 border-[hsl(var(--cta-green))]/50">
          <div className="p-5">
            <div className="flex items-start gap-3">
              <Target
                className="mt-0.5 h-5 w-5 flex-none text-[hsl(var(--cta-green))]"
                aria-hidden="true"
              />
              <div className="min-w-0">
                <h2 className="text-base font-bold text-foreground">{t("eav.hookTitle")}</h2>
                <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                  {t("eav.hookText")}
                </p>
              </div>
            </div>

            {/*
              To'g'ridan-to'g'ri `/test-ishlash` ga — oraliq sahifa yo'q.
              Ilgari bu tugma `/e-avtomaktab-test` ga olib borardi, u yerda
              esa yana bitta "Boshlash" tugmasini bosish kerak edi. Ikki
              qadam — ikki marta chiqib ketish imkoni.

              `/e-avtomaktab-test` o'z o'rnida qoladi: u qidiruvdan
              to'g'ridan-to'g'ri keladigan sahifa va o'z testini o'zi
              boshlaydi.
            */}
            <Button
              asChild
              size="lg"
              className="mt-4 h-14 w-full gap-2 bg-[hsl(var(--cta-green))] text-base font-bold text-white hover:bg-[hsl(var(--cta-green-hover))]"
            >
              <Link to="/test-ishlash">
                <span className="min-w-0 truncate">{t("eav.mainBtn")}</span>
                <ArrowRight className="h-5 w-5 flex-none" aria-hidden="true" />
              </Link>
            </Button>

            <p className="mt-2.5 text-center text-xs text-muted-foreground">
              {t("eav.hookFree")}
            </p>
          </div>
        </Card>

        {/* ── Rasmiy manzil — kichik, lekin ochiq ──────────────────── */}
        <div className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1.5 rounded-lg border border-border bg-muted/40 px-3 py-2.5 text-xs text-muted-foreground">
          <Info className="h-3.5 w-3.5 flex-none" aria-hidden="true" />
          <span className="min-w-0">{t("eav.notOfficialShort")}</span>
          <a
            href={RASMIY.avtotalim}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="inline-flex items-center gap-1 font-semibold text-sky-700 hover:underline dark:text-sky-400"
          >
            e-avtotalim.uz
            <ExternalLink className="h-3 w-3" aria-hidden="true" />
          </a>
          <span aria-hidden="true">·</span>
          <a
            href={RASMIY.yhxx}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="inline-flex items-center gap-1 font-semibold text-sky-700 hover:underline dark:text-sky-400"
          >
            yhxx.uz
            <ExternalLink className="h-3 w-3" aria-hidden="true" />
          </a>
        </div>

        {/* ── 2026 o'zgarishi ──────────────────────────────────────── */}
        <Card className="mt-4 border-l-4 border-l-emerald-500 p-4">
          <div className="flex gap-3">
            <CalendarClock className="mt-0.5 h-5 w-5 flex-none text-emerald-600 dark:text-emerald-400" aria-hidden="true" />
            <div className="min-w-0">
              <h2 className="text-base font-bold text-foreground">{t("eav.changeTitle")}</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                {t("eav.changeText")}
              </p>
            </div>
          </div>
        </Card>

        {/* ── Imtihon raqamlari ────────────────────────────────────── */}
        <h2 className="mt-8 text-lg font-bold text-foreground">{t("eav.examTitle")}</h2>
        <dl className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {IMTIHON_FAKTLARI.map((f) => (
            <div key={f.qiymat + f.label.oz} className="rounded-xl border border-border bg-card p-3 text-center">
              <dt className="text-2xl font-bold tabular-nums text-foreground">{f.qiymat}</dt>
              <dd className="mt-0.5 text-xs leading-snug text-muted-foreground">{f.label[L]}</dd>
            </div>
          ))}
        </dl>

        {/* ── Nega oldindan mashq qilish kerak ─────────────────────── */}
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Card className="p-4">
            <h3 className="text-sm font-bold text-foreground">{t("eav.beforeTitle")}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              {t("eav.beforeText")}
            </p>
          </Card>
          <Card className="p-4">
            <h3 className="text-sm font-bold text-foreground">{t("eav.retakeTitle")}</h3>
            <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
              {t("eav.retakeText")}
            </p>
          </Card>
        </div>

        {/* ── Bosqichlar ───────────────────────────────────────────── */}
        <h2 className="mt-8 text-lg font-bold text-foreground">{t("eav.stepsTitle")}</h2>
        <ol className="mt-3 space-y-3">
          {BOSQICHLAR.map((b) => (
            <li key={b.n}>
              <Card className="p-4">
                <div className="flex gap-3">
                  <span
                    className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-muted text-sm font-bold text-foreground"
                    aria-hidden="true"
                  >
                    {b.n}
                  </span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-foreground">{b.sarlavha[L]}</h3>
                      <span
                        className={
                          b.majburiy
                            ? "inline-flex items-center gap-1 rounded-full bg-amber-500/15 px-2 py-0.5 text-[11px] font-semibold text-amber-700 dark:text-amber-400"
                            : "inline-flex items-center gap-1 rounded-full bg-muted px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
                        }
                      >
                        {b.majburiy
                          ? <CheckCircle2 className="h-3 w-3" aria-hidden="true" />
                          : <CircleDashed className="h-3 w-3" aria-hidden="true" />}
                        {b.majburiy ? t("eav.required") : t("eav.optional")}
                      </span>
                    </div>
                    <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                      {b.matn[L]}
                    </p>
                  </div>
                </div>
              </Card>
            </li>
          ))}
        </ol>

        {/* ── FAQ ──────────────────────────────────────────────────── */}
        <h2 className="mt-8 text-lg font-bold text-foreground">{t("eav.faqTitle")}</h2>
        <Accordion type="single" collapsible className="mt-2">
          {FAQ.map((f, i) => (
            <AccordionItem key={i} value={`q${i}`}>
              <AccordionTrigger className="text-left text-[15px] font-semibold">
                {f.savol[L]}
              </AccordionTrigger>
              <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                {f.javob[L]}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        {/* ── Bog'liq sahifalar ────────────────────────────────────── */}
        <h2 className="mt-8 text-lg font-bold text-foreground">{t("eav.moreTitle")}</h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {[
            { to: "/e-avtomaktab-test", label: t("eav.linkTest") },
            { to: "/avtoimtihon-2026", label: t("eav.linkExam") },
            { to: "/avtodrom", label: t("sections.avtodrom") },
            { to: "/belgilar", label: t("sections.belgilar") },
          ].map((l) => (
            <Button key={l.to} asChild variant="outline" className="justify-start">
              <Link to={l.to}>{l.label}</Link>
            </Button>
          ))}
        </div>

        <p className="mt-8 border-t border-border pt-4 text-xs leading-relaxed text-muted-foreground">
          {YANGILANISH[L]} · {t("eav.checked")} {MAZMUN_SANASI}
        </p>
      </div>
    </MainLayout>
  );
}
