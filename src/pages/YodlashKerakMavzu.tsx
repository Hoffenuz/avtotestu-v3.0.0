// ============================================================================
// YodlashKerakMavzu — bitta mavzu ichidagi jadval(lar)
// ----------------------------------------------------------------------------
// FORMAT: har qatorda avval NIMA haqida ekani (label) chap tomonda, qiymat
// (value + unit) esa o'ng tomonda belgi (badge) sifatida — bare raqam yolg'iz
// oldinga chiqib, nimaga tegishli ekani noaniq bo'lib qolmasligi uchun.
//
// Guruh sarlavhasi KARTADAN TASHQARIDA, oddiy matn: karta ichidagi yopishqoq
// (sticky) shaffof tasma pastdagi rangli belgilarni xira dog' qilib
// ko'rsatardi va karta tepasida bo'sh joy qoldirardi.
// ============================================================================

import { useParams, Navigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { SEO } from "@/components/SEO";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { FACT_TOPICS } from "@/lib/yodlashRaqamlari";
import { ACCENT_CLASS } from "@/lib/siteSections";

export default function YodlashKerakMavzu() {
  const { mavzu } = useParams<{ mavzu: string }>();
  const { t, questionLang } = useLanguage();

  const topic = FACT_TOPICS.find((item) => item.id === mavzu);
  if (!topic) return <Navigate to="/yodlash-kerak" replace />;

  const Icon = topic.icon;

  return (
    <MainLayout>
      {/*
        `noIndex` YO'Q: bu sahifalar noyob va aniq mazmunga ega ("aholi
        punktida tezlik chegarasi", "to'xtash taqiqlangan masofa" kabi
        so'rovlar qidiruvda tez-tez uchraydi). Shaxsiy sahifalardan farqli
        o'laroq, ularni indeksdan yashirish foydali trafikni yo'qotardi.
      */}
      <SEO
        title={`${topic.title[questionLang]} — ${t("sections.yodlashKerak")}`}
        description={topic.subtitle.oz}
        path={`/yodlash-kerak/${topic.id}`}
      />

      <div className="mx-auto w-full max-w-3xl px-4 py-6 md:py-10">
        <PageHeader
          title={topic.title[questionLang]}
          description={topic.subtitle[questionLang]}
          fallback="/yodlash-kerak"
          action={
            <span
              className={`flex h-9 w-9 items-center justify-center rounded-xl ${ACCENT_CLASS[topic.accent]}`}
              aria-hidden="true"
            >
              <Icon className="h-4 w-4" />
            </span>
          }
        />

        <div className="space-y-6">
          {topic.groups.map((group) => (
            <section key={group.heading.oz}>
              <h2 className="mb-2 px-1 text-sm font-bold text-foreground">
                {group.heading[questionLang]}
              </h2>

              <Card className="overflow-hidden">
                <ol className="divide-y divide-border">
                  {group.rows.map((row) => (
                    <li key={row.label.oz} className="flex items-center gap-3 px-4 py-3">
                      <p className="min-w-0 flex-1 text-sm leading-relaxed text-foreground">
                        {row.label[questionLang]}
                      </p>
                      <span
                        className={`shrink-0 rounded-md px-2.5 py-1 text-right text-sm font-bold tabular-nums ${ACCENT_CLASS[topic.accent]}`}
                      >
                        {row.value} {row.unit[questionLang]}
                      </span>
                    </li>
                  ))}
                </ol>
              </Card>
            </section>
          ))}
        </div>

        <p className="mt-6 text-xs text-muted-foreground">
          {t("pages.yodlashKerakNote")}
        </p>
      </div>
    </MainLayout>
  );
}
