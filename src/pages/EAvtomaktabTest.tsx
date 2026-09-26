// ============================================================================
// EAvtomaktabTest — "e avtomaktab test savollari" so'rovlari uchun sahifa
// ----------------------------------------------------------------------------
// NEGA ALOHIDA SAHIFA:
//   Bu so'rovlar boshqa niyatga ega. "e avtomaktab" qidirgan odam PORTALNI
//   izlaydi, "e avtomaktab test savollari" qidirgan odam esa TESTNI izlaydi
//   va uni darhol ishlamoqchi. Bir sahifada ikkalasiga xizmat qilib
//   bo'lmaydi: qo'llanma testni pastga suradi, test esa qo'llanmani.
//
//   O'lchov buni tasdiqlaydi: "e avtomaktab test savollari" bo'yicha CTR
//   allaqachon 14,5% (pozitsiya 2,5) — maxsus sahifasiz, bosh sahifa bilan.
//   Ya'ni talab isbotlangan, faqat mos sahifa yo'q edi.
//
// DIZAYN QARORI — TEST TEPADA:
//   Boshlash tugmasi birinchi ekranda, matn esa PASTDA. Bu odam o'qish
//   uchun emas, ishlash uchun kelgan. Matn qidiruv tizimi va shubhasi
//   bo'lganlar uchun qoladi.
//
//   Ro'yxatdan o'tish talab qilinmaydi — saytning bepul oqimi bilan bir xil.
// ============================================================================

import { useCallback, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { Play, Loader2, Info, ExternalLink, ArrowRight } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { SEO } from "@/components/SEO";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { TestInterfaceBase } from "@/components/TestInterfaceBase";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAccessState } from "@/hooks/useAccessState";
import { useTestSession } from "@/hooks/useTestSession";
import {
  FAQ, IMTIHON_FAKTLARI, MAZMUN_SANASI, RASMIY, RASMIY_EMAS, YANGILANISH,
} from "@/lib/eAvtomaktab";

const BASE = "https://www.avtotestu.uz";

/** Rasmiy nazariy imtihon formati. */
const SAVOL_SONI = 20;
const VAQT_SEK = 25 * 60;

/** DB `variant` ustuni: 0 — umumiy mashq (imtihon/xatolar uchun ajratilgan emas). */
const MASHQ_VARIANT = 0;

/** Til bo'yicha bepul savol bazasi — ro'yxatdan o'tish talab qilinmaydi. */
const FAYLLAR = {
  "uz-lat": "free-uz-lat.json",
  uz: "free-uz-cyr.json",
  ru: "free-ru.json",
} as const;

export default function EAvtomaktabTest() {
  const { t, language, questionLang: L } = useLanguage();
  const { isPremium } = useAccessState();
  const { starting, startSession } = useTestSession();

  const [boshlandi, setBoshlandi] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  const dataFile = FAYLLAR[language] ?? FAYLLAR["uz-lat"];

  const boshla = useCallback(async () => {
    if (starting) return;
    const r = await startSession({
      variant: MASHQ_VARIANT,
      questionSource: dataFile,
      isPremium,
    });
    if (!r.ok) return;
    setSessionId(r.session?.sessionId ?? null);
    setBoshlandi(true);
  }, [starting, startSession, dataFile, isPremium]);

  if (boshlandi) {
    return (
      <TestInterfaceBase
        onExit={() => {
          setBoshlandi(false);
          setSessionId(null);
        }}
        dataSource={`/${dataFile}`}
        testName={t("eav.testName")}
        questionCount={SAVOL_SONI}
        timeLimit={VAQT_SEK}
        randomize
        variant={MASHQ_VARIANT}
        sessionId={sessionId}
        isPremiumSession={isPremium}
      />
    );
  }

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map((f) => ({
      "@type": "Question",
      name: f.savol[L],
      acceptedAnswer: { "@type": "Answer", text: f.javob[L] },
    })),
  };

  const quizLd = {
    "@context": "https://schema.org",
    "@type": "Quiz",
    name: t("eav.testH1"),
    educationalLevel: "beginner",
    about: { "@type": "Thing", name: t("eav.quizAbout") },
    numberOfQuestions: SAVOL_SONI,
    timeRequired: "PT25M",
    isAccessibleForFree: true,
    inLanguage: ["uz", "ru"],
    url: `${BASE}/e-avtomaktab-test`,
  };

  return (
    <MainLayout>
      <SEO
        title={t("seo.eAvtomaktabTest.title")}
        description={t("seo.eAvtomaktabTest.description")}
        path="/e-avtomaktab-test"
        keywords={t("seo.eAvtomaktabTest.keywords")}
      />
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(faqLd)}</script>
        <script type="application/ld+json">{JSON.stringify(quizLd)}</script>
      </Helmet>

      <div className="mx-auto w-full max-w-3xl px-4 py-6 md:py-10">

        <nav aria-label="breadcrumb" className="mb-3 text-xs text-muted-foreground">
          <Link to="/" className="hover:text-foreground">{t("nav.home")}</Link>
          <span className="mx-1.5">/</span>
          <Link to="/e-avtomaktab" className="hover:text-foreground">E-avtomaktab</Link>
          <span className="mx-1.5">/</span>
          <span className="text-foreground">{t("eav.testCrumb")}</span>
        </nav>

        <h1 className="text-2xl font-bold leading-tight text-foreground md:text-3xl">
          {t("eav.testH1")}
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
          {t("eav.testLead")}
        </p>

        {/* ── BOSHLASH — birinchi ekranda ──────────────────────────── */}
        <Card className="mt-5 overflow-hidden border-2 border-primary/25">
          <div className="p-5">
            <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4">
              {IMTIHON_FAKTLARI.map((f) => (
                <div key={f.qiymat + f.label.oz} className="text-center">
                  <dt className="text-2xl font-bold tabular-nums text-foreground">{f.qiymat}</dt>
                  <dd className="mt-0.5 text-xs leading-snug text-muted-foreground">{f.label[L]}</dd>
                </div>
              ))}
            </dl>

            <Button
              onClick={boshla}
              disabled={starting}
              size="lg"
              className="mt-5 h-12 w-full gap-2 rounded-lg text-base font-bold"
            >
              {starting
                ? <Loader2 className="h-5 w-5 animate-spin" aria-hidden="true" />
                : <Play className="h-5 w-5 fill-current" aria-hidden="true" />}
              {t("eav.startBtn")}
            </Button>

            <p className="mt-2.5 text-center text-xs text-muted-foreground">
              {t("eav.noSignup")}
            </p>
          </div>
        </Card>

        {/* ── Rasmiy emasligi ──────────────────────────────────────── */}
        <Card className="mt-4 border-l-4 border-l-sky-500 bg-sky-500/5 p-4">
          <div className="flex gap-3">
            <Info className="mt-0.5 h-5 w-5 flex-none text-sky-600 dark:text-sky-400" aria-hidden="true" />
            <div className="min-w-0">
              <p className="text-sm leading-relaxed text-foreground">{RASMIY_EMAS[L]}</p>
              <a
                href={RASMIY.avtotalim}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="mt-2.5 inline-flex items-center gap-1.5 text-sm font-semibold text-sky-700 hover:underline dark:text-sky-400"
              >
                e-avtotalim.uz
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
            </div>
          </div>
        </Card>

        {/* ── Tushuntirish (qidiruv uchun ham) ─────────────────────── */}
        <h2 className="mt-8 text-lg font-bold text-foreground">{t("eav.howTitle")}</h2>
        <div className="mt-3 space-y-3 text-[15px] leading-relaxed text-muted-foreground">
          <p>{t("eav.howP1")}</p>
          <p>{t("eav.howP2")}</p>
          <p>{t("eav.howP3")}</p>
        </div>

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
            { to: "/e-avtomaktab", label: t("eav.linkGuide") },
            { to: "/avtoimtihon-2026", label: t("eav.linkExam") },
            { to: "/prava-olish", label: t("home.info1Title") },
            { to: "/real-imtihon", label: t("sections.realImtihon") },
            { to: "/belgilar", label: t("sections.belgilar") },
          ].map((l) => (
            <Button key={l.to} asChild variant="outline" className="justify-start">
              <Link to={l.to}>
                {l.label}
                <ArrowRight className="ml-auto h-4 w-4 opacity-50" aria-hidden="true" />
              </Link>
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
