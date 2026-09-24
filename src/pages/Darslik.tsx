// ============================================================================
// Darslik — modullar ro'yxati (kursning bosh sahifasi)
// ----------------------------------------------------------------------------
// DIZAYN QARORI — NEGA BOSQICHLI CHIZIQ (stepper), TO'R EMAS:
//   Ilgari bu sahifa 11 ta akkordeon plitkasidan iborat edi: hammasi bir xil,
//   qaysi biridan boshlash kerakligi ko'rinmasdi va ochilgan bo'lim ichida
//   25 ta video "5.10.2-5.10.3" degan nomlar bilan chiqardi.
//
//   Kurs — ketma-ket o'tiladigan narsa, mustaqil bo'limlar to'plami emas.
//   Chap tomondagi uzluksiz chiziq va raqamlangan tugunlar aynan shuni
//   ko'rsatadi: qayerdasiz, nimani tugatdingiz, keyingisi qaysi. Bitta
//   ustun ataylab — bosqichlar ikki ustunga bo'linsa, ketma-ketlik
//   ma'nosi yo'qoladi.
// ============================================================================

import { Link } from "react-router-dom";
import { BookMarked, Check, ChevronRight, GraduationCap, Play, Scale, Signpost, Route } from "lucide-react";
import { SEO } from "@/components/SEO";
import { DarslikGate } from "@/components/darslik/DarslikGate";
import { useLanguage } from "@/contexts/LanguageContext";
import { ALL_LESSON_IDS, DARSLIK_MODULES, localized, moduleLessonIds } from "@/lib/darslik";
import { DARSLIK_TOTAL_LESSONS } from "@/data/darslikKatalog";
import type { DarslikModuleKind } from "@/data/darslikKatalog";
import { findNextLesson } from "@/lib/darslik";
import { statsFor, useDarslikProgress } from "@/lib/darslikProgress";
import { cn } from "@/lib/utils";

/** Modul turi bo'yicha ikonka — ro'yxatni bir qarashda ajratadi. */
const KIND_ICON: Record<DarslikModuleKind, typeof Signpost> = {
  terms: GraduationCap,
  signs: Signpost,
  markings: Route,
  law: Scale,
};

function ProgressRing({ ratio }: { ratio: number }) {
  const size = 72;
  const stroke = 6;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90" aria-hidden="true">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" strokeWidth={stroke} className="stroke-primary-foreground/20" />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        strokeWidth={stroke}
        strokeLinecap="round"
        className="stroke-cta-green transition-[stroke-dashoffset] duration-500"
        strokeDasharray={circumference}
        strokeDashoffset={circumference * (1 - ratio)}
      />
    </svg>
  );
}

function DarslikContent() {
  const { t, questionLang } = useLanguage();
  const { progress } = useDarslikProgress();

  const overall = statsFor(progress, ALL_LESSON_IDS);
  const next = findNextLesson(progress);
  const percent = Math.round(overall.ratio * 100);

  return (
    <>
      <SEO
        title={t("seo.darslik.title")}
        description={t("seo.darslik.description")}
        path="/darslik"
        keywords={t("seo.darslik.keywords")}
      />

      {/* Sarlavha + umumiy progress */}
      <section className="bg-gradient-to-br from-brand via-brand to-brand/90">
        <div className="mx-auto max-w-3xl px-4 py-7 md:py-10">
          <h1 className="text-2xl font-bold text-brand-foreground md:text-3xl">
            {t("darslik.pageTitle")}
          </h1>
          <p className="mt-1 text-sm text-brand-foreground/75 md:text-base">
            {t("darslik.pageLead")}
          </p>

          <div className="mt-5 flex items-center gap-4 rounded-2xl border border-brand-foreground/15 bg-brand-foreground/10 p-4 backdrop-blur-sm md:gap-5 md:p-5">
            <div className="relative shrink-0">
              <ProgressRing ratio={overall.ratio} />
              <span className="absolute inset-0 grid place-items-center text-sm font-bold text-brand-foreground">
                {percent}%
              </span>
            </div>

            <div className="min-w-0 flex-1">
              <p className="text-xs uppercase tracking-wide text-brand-foreground/60">
                {t("darslik.progressLabel")}
              </p>
              <p className="mt-0.5 text-lg font-bold text-brand-foreground md:text-xl">
                {overall.watched} / {DARSLIK_TOTAL_LESSONS}
              </p>
              <p className="mt-0.5 text-xs text-brand-foreground/70">
                {DARSLIK_MODULES.length} {t("darslik.modules")}
              </p>
            </div>

            {next ? (
              <Link
                to={`/darslik/${next.module.id}?dars=${encodeURIComponent(next.lesson.id)}`}
                className="flex shrink-0 items-center gap-1.5 rounded-xl bg-cta-green px-3.5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-cta-green-hover md:px-5"
              >
                <Play className="h-4 w-4 fill-current" aria-hidden="true" />
                <span className="hidden sm:inline">
                  {overall.started ? t("darslik.continueCta") : t("darslik.startCta")}
                </span>
              </Link>
            ) : (
              <span className="shrink-0 rounded-xl bg-cta-green/20 px-3.5 py-2.5 text-xs font-semibold text-brand-foreground">
                {t("darslik.allDone")}
              </span>
            )}
          </div>
        </div>
      </section>

      {/* Bosqichlar */}
      <section className="bg-background py-6 md:py-9">
        <ol className="mx-auto max-w-3xl px-4">
          {DARSLIK_MODULES.map((module, index) => {
            const stats = statsFor(progress, moduleLessonIds(module));
            const Icon = KIND_ICON[module.kind];
            const isLast = index === DARSLIK_MODULES.length - 1;
            const status = stats.done
              ? t("darslik.done")
              : stats.started
                ? t("darslik.inProgress")
                : t("darslik.notStarted");

            return (
              <li key={module.id} className="relative flex gap-3 sm:gap-4">
                {/* Tugun va uni keyingisiga ulovchi chiziq */}
                <div className="flex w-9 shrink-0 flex-col items-center sm:w-11">
                  <span
                    className={cn(
                      "z-10 grid h-9 w-9 shrink-0 place-items-center rounded-full border-2 text-sm font-bold transition-colors sm:h-11 sm:w-11",
                      stats.done
                        ? "border-cta-green bg-cta-green text-white"
                        : stats.started
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border bg-card text-muted-foreground",
                    )}
                  >
                    {stats.done ? <Check className="h-4 w-4 sm:h-5 sm:w-5" aria-hidden="true" /> : index + 1}
                  </span>
                  {!isLast ? (
                    <span
                      className={cn(
                        "w-0.5 flex-1 transition-colors",
                        stats.done ? "bg-cta-green/40" : "bg-border",
                      )}
                      aria-hidden="true"
                    />
                  ) : null}
                </div>

                <Link
                  to={`/darslik/${module.id}`}
                  className={cn(
                    "group mb-3 min-w-0 flex-1 rounded-xl border bg-card p-3.5 transition-all sm:p-4",
                    "hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                    stats.done ? "border-cta-green/40" : "border-border",
                    isLast ? "mb-0" : "",
                  )}
                >
                  <div className="flex items-start gap-3">
                    <span
                      className={cn(
                        "hidden h-10 w-10 shrink-0 place-items-center rounded-lg sm:grid",
                        stats.done ? "bg-cta-green/10 text-cta-green" : "bg-primary/10 text-primary",
                      )}
                      aria-hidden="true"
                    >
                      <Icon className="h-5 w-5" />
                    </span>

                    <div className="min-w-0 flex-1">
                      <p className="text-[15px] font-bold leading-snug text-foreground sm:text-base">
                        {localized(module.title, questionLang)}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {module.lessons.length} {t("darslik.lessons")} · {status}
                      </p>
                    </div>

                    <ChevronRight
                      className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
                      aria-hidden="true"
                    />
                  </div>

                  {/* Progress chizig'i — faqat boshlangan modullarda */}
                  {stats.started ? (
                    <div className="mt-3 flex items-center gap-2.5">
                      <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-muted">
                        <span
                          className={cn(
                            "block h-full rounded-full transition-[width] duration-500",
                            stats.done ? "bg-cta-green" : "bg-primary",
                          )}
                          style={{ width: `${Math.round(stats.ratio * 100)}%` }}
                        />
                      </span>
                      <span className="shrink-0 font-mono text-[11px] tabular-nums text-muted-foreground">
                        {stats.watched}/{stats.total}
                      </span>
                    </div>
                  ) : null}
                </Link>
              </li>
            );
          })}
        </ol>

        {!next ? (
          <p className="mx-auto mt-6 max-w-3xl px-4 text-center text-sm text-muted-foreground">
            {t("darslik.allDoneHint")}
          </p>
        ) : null}
      </section>

      {/* Qo'llanmaga ko'prik — kursdan keyin nima qilish kerakligi */}
      <section className="border-t border-border bg-muted/30 py-6">
        <div className="mx-auto max-w-3xl px-4">
          <Link
            to="/qoshimcha"
            className="group flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3.5 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
          >
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-teal-500/10 text-teal-500" aria-hidden="true">
              <BookMarked className="h-5 w-5" />
            </span>
            <span className="min-w-0 flex-1">
              <span className="block text-[15px] font-semibold text-foreground">{t("sections.qollanma")}</span>
              <span className="mt-0.5 block text-xs text-muted-foreground">{t("sections.qollanmaShort")}</span>
            </span>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
          </Link>
        </div>
      </section>
    </>
  );
}

export default function Darslik() {
  return (
    <DarslikGate>
      <DarslikContent />
    </DarslikGate>
  );
}
