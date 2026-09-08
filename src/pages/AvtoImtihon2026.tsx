// ============================================================================
// AvtoImtihon2026 — "avto imtihon 2026" so'rovlari uchun sahifa
// ----------------------------------------------------------------------------
// NEGA BU SAHIFA BOR:
//   "avtoimtihon", "avto imtihon 2026", "авто имтихон 2026" va shunga
//   o'xshash so'rovlar 28 kunda 8 762 marta ko'rsatilgan — bu e-avtomaktab
//   test klasteridan ham KATTA. Lekin CTR atigi 1,7%.
//
//   Pozitsiya esa 2,3–3,8 — ya'ni Google saytni mos deb biladi. Muammo
//   reytingда emas: sahifa ularning savoliga ("2026 da nima o'zgardi,
//   qanday topshiriladi") javob bermaydi va snippet bo'sh ko'rinadi.
//
// NEGA E-AVTOMAKTAB SAHIFASIDAN AJRATILGAN:
//   Boshqa so'rov klasteri va boshqa savol. Bitta sahifaga qo'shsak,
//   sarlavha ikkala so'rovga ham noaniq mos kelardi va ikkalasini ham
//   yo'qotardik.
// ============================================================================

import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { ExternalLink, Info, ArrowRight, ListChecks, Car, Building2 } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { SEO } from "@/components/SEO";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  FAQ, IMTIHON_FAKTLARI, MAZMUN_SANASI, RASMIY, RASMIY_EMAS, YANGILANISH,
} from "@/lib/eAvtomaktab";

const BASE = "https://www.avtotestu.uz";

export default function AvtoImtihon2026() {
  const { t, questionLang: L } = useLanguage();

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map((f) => ({
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
      { "@type": "ListItem", position: 2, name: t("nav.sections"), item: `${BASE}/bolimlar` },
      { "@type": "ListItem", position: 3, name: t("eav.examH1"), item: `${BASE}/avtoimtihon-2026` },
    ],
  };

  /** Uch bosqich — imtihonning o'zi. */
  const bosqichlar = [
    { icon: ListChecks, kalit: "theory", rang: "text-sky-600 dark:text-sky-400" },
    { icon: Car, kalit: "avtodrom", rang: "text-amber-600 dark:text-amber-400" },
    { icon: Building2, kalit: "city", rang: "text-emerald-600 dark:text-emerald-400" },
  ] as const;

  return (
    <MainLayout>
      <SEO
        title="Avto imtihon 2026 — qoidalar va ballar"
        description="2026-yilda haydovchilik imtihoni qanday topshiriladi: 20 savol, 25 daqiqa, 18 ta to'g'ri javob. Avtodrom va shahar bosqichlari."
        path="/avtoimtihon-2026"
        keywords="avto imtihon 2026, avtoimtihon 2026, авто имтихон 2026, haydovchilik imtihoni 2026, nazariy imtihon qoidalari, o'tish bali"
      />
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(faqLd)}</script>
        <script type="application/ld+json">{JSON.stringify(breadcrumbLd)}</script>
      </Helmet>

      <div className="mx-auto w-full max-w-3xl px-4 py-6 md:py-10">

        <nav aria-label="breadcrumb" className="mb-3 text-xs text-muted-foreground">
          <Link to="/" className="hover:text-foreground">{t("nav.home")}</Link>
          <span className="mx-1.5">/</span>
          <Link to="/bolimlar" className="hover:text-foreground">{t("nav.sections")}</Link>
          <span className="mx-1.5">/</span>
          <span className="text-foreground">{t("eav.examCrumb")}</span>
        </nav>

        <h1 className="text-2xl font-bold leading-tight text-foreground md:text-3xl">
          {t("eav.examH1")}
        </h1>
        <p className="mt-3 text-[15px] leading-relaxed text-muted-foreground">
          {t("eav.examLead")}
        </p>

        {/* ── Nazariy imtihon raqamlari ────────────────────────────── */}
        <Card className="mt-5 p-5">
          <h2 className="text-base font-bold text-foreground">{t("eav.examNumbers")}</h2>
          <dl className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {IMTIHON_FAKTLARI.map((f) => (
              <div key={f.qiymat + f.label.oz} className="text-center">
                <dt className="text-2xl font-bold tabular-nums text-foreground">{f.qiymat}</dt>
                <dd className="mt-0.5 text-xs leading-snug text-muted-foreground">{f.label[L]}</dd>
              </div>
            ))}
          </dl>
        </Card>

        {/* ── Uch bosqich ──────────────────────────────────────────── */}
        <h2 className="mt-8 text-lg font-bold text-foreground">{t("eav.stagesTitle")}</h2>
        <ol className="mt-3 space-y-3">
          {bosqichlar.map((b, i) => {
            const Icon = b.icon;
            return (
              <li key={b.kalit}>
                <Card className="p-4">
                  <div className="flex gap-3">
                    <Icon className={`mt-0.5 h-5 w-5 flex-none ${b.rang}`} aria-hidden="true" />
                    <div className="min-w-0">
                      <h3 className="font-semibold text-foreground">
                        {i + 1}. {t(`eav.stage_${b.kalit}_t`)}
                      </h3>
                      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                        {t(`eav.stage_${b.kalit}_d`)}
                      </p>
                    </div>
                  </div>
                </Card>
              </li>
            );
          })}
        </ol>

        {/* ── Testga o'tish ────────────────────────────────────────── */}
        <Card className="mt-4 overflow-hidden border-2 border-[hsl(var(--cta-green))]/40">
          <Link
            to="/e-avtomaktab-test"
            className="flex items-center gap-4 p-4 transition-colors hover:bg-muted/50"
          >
            <span className="min-w-0 flex-1">
              <span className="block font-bold text-foreground">{t("eav.ctaTitle")}</span>
              <span className="mt-0.5 block text-sm text-muted-foreground">{t("eav.ctaDesc")}</span>
            </span>
            <ArrowRight className="h-5 w-5 flex-none text-[hsl(var(--cta-green))]" aria-hidden="true" />
          </Link>
        </Card>

        {/* ── Rasmiy emasligi ──────────────────────────────────────── */}
        <Card className="mt-4 border-l-4 border-l-sky-500 bg-sky-500/5 p-4">
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
            { to: "/e-avtomaktab-test", label: t("eav.linkTest") },
            { to: "/avtodrom", label: t("sections.avtodrom") },
            { to: "/real-imtihon", label: t("sections.realImtihon") },
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
