// ============================================================================
// YodlashKerak — imtihonda tez uchraydigan, yodda qolishi qiyin raqamlar
// ----------------------------------------------------------------------------
// Bu ro'yxat sahifasi — har bir qator o'z ichki sahifasiga (`/yodlash-kerak/:id`)
// olib boradi. Tuzilishi Avtodrom sahifasiga o'xshash, lekin bitta jadval
// o'rniga MAVZULAR RO'YXATI ko'rsatiladi.
// ============================================================================

import { Link } from "react-router-dom";
import { ChevronRight } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { SEO } from "@/components/SEO";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { useLanguage } from "@/contexts/LanguageContext";
import { FACT_TOPICS } from "@/lib/yodlashRaqamlari";
import { ACCENT_CLASS } from "@/lib/siteSections";

export default function YodlashKerak() {
  const { t, questionLang } = useLanguage();

  return (
    <MainLayout>
      <SEO
        title="Yodlash kerak raqamlar — tezlik, masofa va o'lcham me'yorlari"
        description="Imtihonda tez-tez uchraydigan raqamli ma'lumotlar: tezlik chegaralari, to'xtash masofalari, gabaritlar va boshqa me'yorlar bir joyda."
        path="/yodlash-kerak"
        keywords="yodlash kerak raqamlar, tezlik chegarasi, to'xtash masofasi, gabarit, YHQ me'yorlari"
      />

      <div className="mx-auto w-full max-w-3xl px-4 py-6 md:py-10">
        <PageHeader
          title={t("sections.yodlashKerak")}
          description={t("pages.yodlashKerakDesc")}
        />

        <Card className="divide-y divide-border overflow-hidden">
          {FACT_TOPICS.map((topic) => {
            const Icon = topic.icon;
            const rowCount = topic.groups.reduce((sum, g) => sum + g.rows.length, 0);
            return (
              <Link
                key={topic.id}
                to={`/yodlash-kerak/${topic.id}`}
                className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-muted/50"
              >
                <span
                  className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${ACCENT_CLASS[topic.accent]}`}
                  aria-hidden="true"
                >
                  <Icon className="h-5 w-5" />
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold text-foreground">
                    {topic.title[questionLang]}
                  </span>
                  <span className="block truncate text-xs text-muted-foreground">
                    {topic.subtitle[questionLang]}
                  </span>
                </span>

                <span className="shrink-0 text-xs font-medium text-muted-foreground">
                  {rowCount} {t("pages.items")}
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              </Link>
            );
          })}
        </Card>

        <p className="mt-6 text-xs text-muted-foreground">
          {t("pages.yodlashKerakNote")}
        </p>
      </div>
    </MainLayout>
  );
}
