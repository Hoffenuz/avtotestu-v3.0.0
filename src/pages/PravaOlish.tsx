// ============================================================================
// PravaOlish — "prava olish narxi / tartibi 2026" so'rovlari uchun sahifa
// ----------------------------------------------------------------------------
// NEGA BU SAHIFA BOR:
//   Odamlar Google va AI yordamchilardan "prava olish qancha turadi",
//   "avtomaktabsiz prava olsa bo'ladimi", "imtihon narxi 2026" deb so'raydi.
//   Saytda narx va muddat haqida umuman ma'lumot yo'q edi — bu savollarga
//   boshqa saytlar javob berardi. Bu sahifa aniq raqamlar (manbasi va sanasi
//   bilan), bosqichlar va FAQ sxemasi orqali shu savollarga javob beradi.
//
// /avtoimtihon-2026 DAN FARQI: u imtihonning O'ZI (qoidalar, bosqichlar);
// bu esa butun yo'l — xarajat, muddat, avtomaktab. Ikkalasi bir-biriga
// havola qiladi, mazmunni takrorlamaydi.
//
// Mazmun: `src/lib/pravaOlish.ts` (bot snapshoti ham shu raqamlar bilan).
// ============================================================================

import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { AlertTriangle, ArrowRight, ExternalLink, Info } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { SEO } from "@/components/SEO";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { useLanguage } from "@/contexts/LanguageContext";
import { RASMIY, RASMIY_EMAS, YANGILANISH, type Localized } from "@/lib/eAvtomaktab";
import {
  ASOSIY_RAQAMLAR, JAMI_B, MUHIM, PRAVA_BOSQICHLAR, PRAVA_FAQ, PRAVA_MANBALAR,
  PRAVA_MAZMUN_SANASI, XARAJATLAR,
} from "@/lib/pravaOlish";

const BASE = "https://www.avtotestu.uz";

/** Sahifa sarlavhalari (mazmun `pravaOlish.ts` da). */
const MATN = {
  crumb: { oz: "Prava olish", uz: "Права олиш", ru: "Получение прав" },
  h1: {
    oz: "Prava olish 2026 — narxlar, muddatlar va tartib",
    uz: "Права олиш 2026 — нархлар, муддатлар ва тартиб",
    ru: "Как получить права в 2026 году — цены, сроки и порядок",
  },
  lead: {
    oz: "Avtomaktab va imtihon qancha turadi, qancha vaqt oladi va nimadan boshlash kerak — 2026-yilgi qoidalar asosida qisqa va aniq.",
    uz: "Автомактаб ва имтиҳон қанча туради, қанча вақт олади ва нимадан бошлаш керак — 2026 йилги қоидалар асосида қисқа ва аниқ.",
    ru: "Сколько стоят автошкола и экзамен, сколько времени это занимает и с чего начать — коротко и точно, по правилам 2026 года.",
  },
  numbers: { oz: "Asosiy raqamlar", uz: "Асосий рақамлар", ru: "Главные цифры" },
  costs: { oz: "Xarajatlar", uz: "Харажатлар", ru: "Расходы" },
  steps: { oz: "Prava olish bosqichlari", uz: "Права олиш босқичлари", ru: "Этапы получения прав" },
  ctaTitle: { oz: "Nazariyani bepul tayyorlang", uz: "Назарияни бепул тайёрланг", ru: "Подготовьтесь к теории бесплатно" },
  ctaDesc: {
    oz: "Imtihon formatidagi test: 20 savol, 25 daqiqa",
    uz: "Имтиҳон форматидаги тест: 20 савол, 25 дақиқа",
    ru: "Тест в формате экзамена: 20 вопросов, 25 минут",
  },
  faq: { oz: "Ko'p so'raladigan savollar", uz: "Кўп сўраладиган саволлар", ru: "Частые вопросы" },
  sources: { oz: "Manbalar", uz: "Манбалар", ru: "Источники" },
  more: { oz: "Foydali bo'limlar", uz: "Фойдали бўлимлар", ru: "Полезные разделы" },
  exam: { oz: "Imtihon qoidalari 2026", uz: "Имтиҳон қоидалари 2026", ru: "Правила экзамена 2026" },
  eav: { oz: "E-avtomaktab qo'llanmasi", uz: "Е-автомактаб қўлланмаси", ru: "Гид по электронной автошколе" },
  signs: { oz: "Yo'l belgilari", uz: "Йўл белгилари", ru: "Дорожные знаки" },
  test: { oz: "Test ishlash", uz: "Тест ишлаш", ru: "Решать тесты" },
} satisfies Record<string, Localized>;

export default function PravaOlish() {
  const { t, questionLang: L } = useLanguage();

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: PRAVA_FAQ.map((f) => ({
      "@type": "Question",
      name: f.savol[L],
      acceptedAnswer: { "@type": "Answer", text: f.javob[L] },
    })),
  };

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: t("nav.home"), item: BASE },
      { "@type": "ListItem", position: 2, name: MATN.crumb[L], item: `${BASE}/prava-olish` },
    ],
  };

  return (
    <MainLayout>
      <SEO
        title={t("seo.pravaOlish.title")}
        description={t("seo.pravaOlish.description")}
        path="/prava-olish"
        keywords={t("seo.pravaOlish.keywords")}
      />
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(faqLd)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbLd)}</script>
      </Helmet>

      <div className="mx-auto w-full max-w-3xl px-4 py-6 md:py-10">
        <nav aria-label="breadcrumb" className="mb-3 text-xs text-muted-foreground">
          <Link to="/" className="hover:text-foreground">{t("nav.home")}</Link>
          <span className="mx-1.5">/</span>
          <span className="text-foreground">{MATN.crumb[L]}</span>
        </nav>

        <h1 className="text-2xl font-bold leading-tight text-foreground md:text-3xl">{MATN.h1[L]}</h1>
        <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">{MATN.lead[L]}</p>

        {/* ── Asosiy raqamlar ──────────────────────────────────────── */}
        <Card className="mt-5 p-5">
          <h2 className="text-base font-bold text-foreground">{MATN.numbers[L]}</h2>
          <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {ASOSIY_RAQAMLAR.map((r) => (
              <div key={r.label.oz} className="rounded-lg bg-muted/50 px-2 py-3 text-center">
                <dt className="text-xl font-bold tabular-nums text-foreground sm:text-2xl">{r.qiymat[L]}</dt>
                <dd className="mt-0.5 text-xs leading-snug text-muted-foreground">{r.label[L]}</dd>
              </div>
            ))}
          </dl>
        </Card>

        {/* ── Muhim: avtomaktabsiz bo'lmaydi ───────────────────────── */}
        <Card className="mt-4 border-l-4 border-l-amber-500 bg-amber-500/5 p-4">
          <div className="flex gap-3">
            <AlertTriangle className="mt-0.5 h-5 w-5 flex-none text-amber-600 dark:text-amber-400" aria-hidden="true" />
            <div className="min-w-0">
              <h2 className="font-bold text-foreground">{MUHIM.sarlavha[L]}</h2>
              <p className="mt-1.5 text-sm leading-relaxed text-foreground/90">{MUHIM.matn[L]}</p>
            </div>
          </div>
        </Card>

        {/* ── Xarajatlar ───────────────────────────────────────────── */}
        <h2 className="mt-8 text-lg font-bold text-foreground">{MATN.costs[L]}</h2>
        <Card className="mt-3 divide-y divide-border overflow-hidden">
          {XARAJATLAR.map((x) => (
            <div key={x.nomi.oz} className="px-4 py-3">
              <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                <span className="font-semibold text-foreground">{x.nomi[L]}</span>
                <span className="font-bold tabular-nums text-foreground">{x.narx[L]}</span>
              </div>
              <p className="mt-0.5 text-xs leading-snug text-muted-foreground">{x.izoh[L]}</p>
            </div>
          ))}
          <p className="bg-muted/50 px-4 py-3 text-sm font-medium leading-relaxed text-foreground">{JAMI_B[L]}</p>
        </Card>

        {/* ── Bosqichlar ───────────────────────────────────────────── */}
        <h2 className="mt-8 text-lg font-bold text-foreground">{MATN.steps[L]}</h2>
        <ol className="mt-3 space-y-3">
          {PRAVA_BOSQICHLAR.map((b, i) => (
            <li key={b.nomi.oz}>
              <Card className="p-4">
                <div className="flex gap-3">
                  <span
                    className="flex h-7 w-7 flex-none items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground"
                    aria-hidden="true"
                  >
                    {i + 1}
                  </span>
                  <div className="min-w-0">
                    <h3 className="font-semibold text-foreground">{b.nomi[L]}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{b.matn[L]}</p>
                    {b.havola && (
                      <Link
                        to={b.havola.to}
                        className="mt-2 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline dark:text-foreground"
                      >
                        {b.havola.label[L]}
                        <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                      </Link>
                    )}
                  </div>
                </div>
              </Card>
            </li>
          ))}
        </ol>

        {/* ── Testga o'tish ────────────────────────────────────────── */}
        <Card className="mt-4 overflow-hidden border-2 border-primary/25">
          <Link to="/test-ishlash" className="flex items-center gap-4 p-4 transition-colors hover:bg-muted/50">
            <span className="min-w-0 flex-1">
              <span className="block font-bold text-foreground">{MATN.ctaTitle[L]}</span>
              <span className="mt-0.5 block text-sm text-muted-foreground">{MATN.ctaDesc[L]}</span>
            </span>
            <ArrowRight className="h-5 w-5 flex-none text-primary dark:text-foreground" aria-hidden="true" />
          </Link>
        </Card>

        {/* ── FAQ ──────────────────────────────────────────────────── */}
        <h2 className="mt-8 text-lg font-bold text-foreground">{MATN.faq[L]}</h2>
        <Accordion type="single" collapsible className="mt-2">
          {PRAVA_FAQ.map((f, i) => (
            <AccordionItem key={f.savol.oz} value={`q${i}`}>
              <AccordionTrigger className="text-left text-[15px] font-semibold">{f.savol[L]}</AccordionTrigger>
              <AccordionContent className="text-sm leading-relaxed text-muted-foreground">{f.javob[L]}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>

        {/* ── Rasmiy emasligi ──────────────────────────────────────── */}
        <Card className="mt-6 border-l-4 border-l-sky-500 bg-sky-500/5 p-4">
          <div className="flex gap-3">
            <Info className="mt-0.5 h-5 w-5 flex-none text-sky-600 dark:text-sky-400" aria-hidden="true" />
            <div className="min-w-0">
              <p className="text-sm leading-relaxed text-foreground">{RASMIY_EMAS[L]}</p>
              <a
                href={RASMIY.yhxx}
                target="_blank"
                rel="noopener noreferrer nofollow"
                className="mt-2.5 inline-flex items-center gap-1.5 text-sm font-semibold text-sky-700 hover:underline dark:text-sky-400"
              >
                yhxx.uz
                <ExternalLink className="h-3.5 w-3.5" aria-hidden="true" />
              </a>
            </div>
          </div>
        </Card>

        {/* ── Bog'liq sahifalar ────────────────────────────────────── */}
        <h2 className="mt-8 text-lg font-bold text-foreground">{MATN.more[L]}</h2>
        <div className="mt-3 grid gap-2 sm:grid-cols-2">
          {[
            { to: "/avtoimtihon-2026", label: MATN.exam[L] },
            { to: "/e-avtomaktab", label: MATN.eav[L] },
            { to: "/test-ishlash", label: MATN.test[L] },
            { to: "/belgilar", label: MATN.signs[L] },
          ].map((l) => (
            <Button key={l.to} asChild variant="outline" className="justify-start">
              <Link to={l.to}>
                {l.label}
                <ArrowRight className="ml-auto h-4 w-4 opacity-50" aria-hidden="true" />
              </Link>
            </Button>
          ))}
        </div>

        {/* ── Manbalar va sana ─────────────────────────────────────── */}
        <div className="mt-8 border-t border-border pt-4 text-xs leading-relaxed text-muted-foreground">
          <p className="font-semibold text-foreground/80">{MATN.sources[L]}:</p>
          <ul className="mt-1 flex flex-wrap gap-x-4 gap-y-1">
            {PRAVA_MANBALAR.map((m) => (
              <li key={m.url}>
                <a href={m.url} target="_blank" rel="noopener noreferrer nofollow" className="hover:text-foreground hover:underline">
                  {m.nomi} ({m.sana})
                </a>
              </li>
            ))}
          </ul>
          <p className="mt-3">
            {YANGILANISH[L]} · {t("eav.checked")} {PRAVA_MAZMUN_SANASI}
          </p>
        </div>
      </div>
    </MainLayout>
  );
}
