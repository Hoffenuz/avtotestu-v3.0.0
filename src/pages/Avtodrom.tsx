// ============================================================================
// Avtodrom — amaliy imtihonda beriladigan jarima ballari
// ----------------------------------------------------------------------------
// DIZAYN QARORLARI:
//   * Uch guruh (kichik / o'rta / qo'pol) rangi bilan ajratilgan va jiddiylik
//     oshgani sari to'qlashadi — foydalanuvchi jadvalni o'qimasdan ham
//     og'irlikni ko'radi.
//   * Ball O'NG tomonda, o'zgarmas kenglikda — ko'z bir ustun bo'ylab
//     pastga yuguradi va solishtirish oson bo'ladi.
//   * Guruh sarlavhasi KARTADAN TASHQARIDA, oddiy matn ko'rinishida.
//     Ilgari u karta ichidagi yopishqoq (sticky), yarim shaffof va
//     `backdrop-blur` li tasma edi: pastdagi rangli ball belgilari uning
//     ostidan xira dog' bo'lib ko'rinar, kartaning tepasida esa sababi
//     tushunarsiz bo'sh joy qolardi.
// ============================================================================

import { AlertTriangle } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { SEO } from "@/components/SEO";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { PENALTY_GROUPS, LEVEL_STYLE } from "@/lib/avtodromPenalties";
import { cn } from "@/lib/utils";

export default function Avtodrom() {
  const { t, questionLang } = useLanguage();
  const total = PENALTY_GROUPS.reduce((sum, g) => sum + g.items.length, 0);

  return (
    <MainLayout>
      <SEO
        title={t("seo.avtodrom.title")}
        description={t("seo.avtodrom.description")}
        path="/avtodrom"
        keywords={t("seo.avtodrom.keywords")}
      />

      <div className="mx-auto w-full max-w-3xl px-4 py-6 md:py-10">
        <PageHeader
          title={t("pages.avtodromTitle")}
          description={`${t("pages.avtodromDesc")} ${total} ${t("pages.items")}`}
        />

        <div className="space-y-6">
          {PENALTY_GROUPS.map((group) => {
            const style = LEVEL_STYLE[group.level];
            return (
              <section key={group.level}>
                <div className="mb-2 flex items-center gap-2 px-1">
                  <span className={cn("h-2 w-2 shrink-0 rounded-full", style.dot)} aria-hidden="true" />
                  <h2 className={cn("text-sm font-bold", style.heading)}>
                    {group.title[questionLang]}
                  </h2>
                  <span className="ml-auto shrink-0 text-xs text-muted-foreground">
                    {group.items.length} {t("pages.items")}
                  </span>
                </div>

                <Card className="overflow-hidden">
                  <ol className="divide-y divide-border">
                    {group.items.map((item) => (
                      <li key={item.no} className="flex items-start gap-3 px-4 py-3">
                        <span
                          className={cn("w-6 shrink-0 pt-0.5 text-sm font-bold tabular-nums", style.number)}
                          aria-hidden="true"
                        >
                          {item.no}
                        </span>

                        <p className="min-w-0 flex-1 text-sm leading-relaxed text-foreground">
                          {item.text[questionLang]}
                        </p>

                        <span className="shrink-0 text-right">
                          <span
                            className={cn(
                              "inline-block rounded-md px-2 py-0.5 text-xs font-bold tabular-nums",
                              style.badge,
                            )}
                          >
                            {item.points} {t("pages.points")}
                          </span>
                          {item.note ? (
                            <span className="mt-1 block text-[11px] leading-tight text-muted-foreground">
                              {item.note[questionLang]}
                            </span>
                          ) : null}
                        </span>
                      </li>
                    ))}
                  </ol>
                </Card>
              </section>
            );
          })}
        </div>

        <p className="mt-6 flex items-start gap-2 rounded-lg border border-border bg-muted/40 px-4 py-3 text-xs text-muted-foreground">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>{t("pages.avtodromNote")}</span>
        </p>
      </div>
    </MainLayout>
  );
}
