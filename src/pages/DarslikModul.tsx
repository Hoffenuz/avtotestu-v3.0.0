// ============================================================================
// DarslikModul — bitta modul: pleyer + darslar ro'yxati
// ----------------------------------------------------------------------------
// DIZAYN QARORI — NEGA MODAL EMAS:
//   Ilgari har bir video alohida modal oynada ochilardi: ko'rib bo'lgach
//   oynani yopish, ro'yxatni topish va keyingisini bosish kerak edi. 25 ta
//   ketma-ket dars uchun bu 25 marta takrorlanadigan ortiqcha ish.
//   Endi pleyer sahifaning O'ZIDA, yonida esa ro'yxat — YouTube pleylisti
//   kabi: dars tugashi bilan keyingisi o'zi boshlanadi.
//
// MAKET:
//   Desktop — pleyer chapda, ro'yxat o'ngda va yopishib turadi (sticky),
//   ya'ni uzun ro'yxatda ham video ko'rinishdan chiqmaydi.
//   Mobil — pleyer tepada, ro'yxat pastida. Yonma-yon joylashtirish
//   telefonda ikkalasini ham o'qib bo'lmas holga keltirardi.
// ============================================================================

import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, Navigate, useNavigate, useParams, useSearchParams } from "react-router-dom";
import { ArrowLeft, Check, ChevronRight, Play } from "lucide-react";
import { SEO } from "@/components/SEO";
import { DarslikGate } from "@/components/darslik/DarslikGate";
import { LessonPlayer } from "@/components/darslik/LessonPlayer";
import { useLanguage } from "@/contexts/LanguageContext";
import { DARSLIK_MODULES, findModule, localized, moduleLessonIds } from "@/lib/darslik";
import { statsFor, useDarslikProgress } from "@/lib/darslikProgress";
import { cn } from "@/lib/utils";

function ModuleContent({ moduleId }: { moduleId: string }) {
  const { t, questionLang } = useLanguage();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { progress, markWatched, savePosition } = useDarslikProgress();

  const module = findModule(moduleId);

  /**
   * Joriy dars indeksi.
   *
   * Manba — URL (`?dars=<id>`), React holati EMAS. Shu sabab dars havolasi
   * ulashsa bo'ladigan bo'ladi va brauzerning "orqaga" tugmasi darslar
   * bo'ylab to'g'ri yuradi.
   */
  const lessonParam = searchParams.get("dars");
  const activeIndex = useMemo(() => {
    if (!module) return 0;
    const byParam = module.lessons.findIndex((l) => l.id === lessonParam);
    if (byParam >= 0) return byParam;
    // Parametr yo'q bo'lsa — birinchi ko'rilmagan darsdan boshlaymiz.
    const firstUnwatched = module.lessons.findIndex((l) => !progress[l.id]?.watched);
    return firstUnwatched >= 0 ? firstUnwatched : 0;
    // `progress` ataylab bog'liqlikda YO'Q: dars ko'rilgan deb belgilangan
    // zahoti tanlov keyingisiga sakrab ketmasligi kerak.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [module, lessonParam]);

  const [autoPlay, setAutoPlay] = useState(false);

  const selectLesson = useCallback(
    (lessonId: string, auto: boolean) => {
      setAutoPlay(auto);
      setSearchParams({ dars: lessonId }, { replace: false });
      // Mobilda ro'yxatdan tanlangach pleyer ko'rinib tursin.
      if (typeof window !== "undefined" && window.innerWidth < 1024) {
        window.scrollTo({ top: 0, behavior: "smooth" });
      }
    },
    [setSearchParams],
  );

  // Sahifa boshqa modulga almashsa, avtomatik ijro bayrog'i qolib ketmasin.
  useEffect(() => setAutoPlay(false), [moduleId]);

  // Modul mavjudligini tashqi komponent allaqachon tekshirgan; bu qator
  // faqat TypeScript uchun (ichkarida `module` aniq bo'lsin).
  if (!module) return null;

  const lesson = module.lessons[activeIndex];
  const stats = statsFor(progress, moduleLessonIds(module));
  const moduleTitle = localized(module.title, questionLang);
  const moduleIndex = DARSLIK_MODULES.findIndex((m) => m.id === module.id);
  const nextModule = DARSLIK_MODULES[moduleIndex + 1];
  const nextLesson = module.lessons[activeIndex + 1];

  if (!lesson) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 text-center">
        <p className="text-muted-foreground">{t("darslik.emptyModule")}</p>
      </div>
    );
  }

  const lessonTitle = localized(lesson.title, questionLang);

  return (
    <>
      <SEO
        title={`${moduleTitle} — ${t("darslik.pageTitle")}`}
        description={t("seo.darslik.description")}
        path={`/darslik/${module.id}`}
        keywords={t("seo.darslik.keywords")}
      />

      {/* Yo'l ko'rsatkichi */}
      <div className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl items-center gap-2 px-4 py-3">
          <Link
            to="/darslik"
            className="flex items-center gap-1.5 rounded-lg px-2 py-1 text-sm font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            {t("darslik.backToModules")}
          </Link>
          <ChevronRight className="h-3.5 w-3.5 shrink-0 text-muted-foreground/50" aria-hidden="true" />
          <span className="truncate text-sm font-semibold text-foreground">
            {moduleIndex + 1}. {moduleTitle}
          </span>
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 py-4 md:py-6">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_380px] lg:gap-6">
          {/* Pleyer */}
          <div className="min-w-0">
            {/*
              `key` — dars almashganda pleyer TO'LIQ qayta yaratilsin.
              Busiz brauzer eski videoning holatini (vaqti, tezligi,
              buferi) yangi manbaga olib o'tardi.
            */}
            <LessonPlayer
              key={lesson.id}
              src={lesson.url}
              title={lessonTitle}
              startAt={progress[lesson.id]?.position ?? 0}
              autoPlay={autoPlay}
              onProgress={(position, duration) => savePosition(lesson.id, position, duration)}
              onEnded={() => {
                markWatched(lesson.id);
                if (nextLesson) selectLesson(nextLesson.id, true);
              }}
              onNext={nextLesson ? () => selectLesson(nextLesson.id, true) : undefined}
              nextLabel={t("darslik.nextLesson")}
            />

            <div className="mt-3.5 flex items-start gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  {lesson.code ? (
                    <span className="rounded-md bg-primary/10 px-2 py-0.5 font-mono text-xs font-bold text-primary">
                      {lesson.code}
                    </span>
                  ) : null}
                  {progress[lesson.id]?.watched ? (
                    <span className="flex items-center gap-1 rounded-md bg-cta-green/10 px-2 py-0.5 text-xs font-semibold text-cta-green">
                      <Check className="h-3 w-3" aria-hidden="true" />
                      {t("darslik.watched")}
                    </span>
                  ) : null}
                </div>
                <h1 className="mt-1.5 text-lg font-bold leading-snug text-foreground md:text-xl">
                  {lessonTitle}
                </h1>
                <p className="mt-1 text-xs text-muted-foreground">
                  {t("darslik.lessonOf")
                    .replace("{n}", String(activeIndex + 1))
                    .replace("{total}", String(module.lessons.length))}
                </p>
              </div>
            </div>

            {/* Modul tugagach — keyingi modulga o'tish */}
            {stats.done && nextModule ? (
              <button
                type="button"
                onClick={() => navigate(`/darslik/${nextModule.id}`)}
                className="mt-4 flex w-full items-center gap-3 rounded-xl border border-cta-green/40 bg-cta-green/5 px-4 py-3.5 text-left transition-colors hover:bg-cta-green/10"
              >
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-cta-green text-white" aria-hidden="true">
                  <Check className="h-5 w-5" />
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-bold text-foreground">{t("darslik.moduleDone")}</span>
                  <span className="mt-0.5 block truncate text-xs text-muted-foreground">
                    {t("darslik.nextModule")}: {localized(nextModule.title, questionLang)}
                  </span>
                </span>
                <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              </button>
            ) : null}
          </div>

          {/* Darslar ro'yxati */}
          <aside className="min-w-0">
            <div className="rounded-xl border border-border bg-card lg:sticky lg:top-20">
              <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3">
                <p className="text-sm font-bold text-foreground">{t("darslik.lessonListTitle")}</p>
                <span className="font-mono text-xs tabular-nums text-muted-foreground">
                  {stats.watched}/{stats.total}
                </span>
              </div>

              {module.kind === "markings" ? (
                <p className="border-b border-border bg-muted/40 px-4 py-2 text-[11px] leading-snug text-muted-foreground">
                  {t("darslik.markingNote")}
                </p>
              ) : null}

              <ol className="max-h-[32rem] overflow-y-auto p-2 lg:max-h-[calc(100vh-13rem)]">
                {module.lessons.map((item, index) => {
                  const isActive = index === activeIndex;
                  const isWatched = Boolean(progress[item.id]?.watched);

                  return (
                    <li key={item.id}>
                      <button
                        type="button"
                        onClick={() => selectLesson(item.id, true)}
                        aria-current={isActive ? "true" : undefined}
                        className={cn(
                          "flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left transition-colors",
                          isActive ? "bg-primary/10" : "hover:bg-muted",
                        )}
                      >
                        <span
                          className={cn(
                            "grid h-7 w-7 shrink-0 place-items-center rounded-md text-[11px] font-bold",
                            isActive
                              ? "bg-primary text-primary-foreground"
                              : isWatched
                                ? "bg-cta-green/15 text-cta-green"
                                : "bg-muted text-muted-foreground",
                          )}
                          aria-hidden="true"
                        >
                          {isActive ? (
                            <Play className="h-3 w-3 fill-current" />
                          ) : isWatched ? (
                            <Check className="h-3.5 w-3.5" />
                          ) : (
                            index + 1
                          )}
                        </span>

                        <span className="min-w-0 flex-1">
                          <span
                            className={cn(
                              "block text-[13px] font-medium leading-snug",
                              isActive ? "text-primary" : "text-foreground",
                            )}
                          >
                            {localized(item.title, questionLang)}
                          </span>
                          {item.code ? (
                            <span className="mt-0.5 block font-mono text-[10px] text-muted-foreground">
                              {item.code}
                            </span>
                          ) : null}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ol>
            </div>
          </aside>
        </div>
      </div>
    </>
  );
}

export default function DarslikModul() {
  const { moduleId } = useParams<{ moduleId: string }>();

  /*
    Noma'lum modul — 404 sahifasi EMAS, modullar ro'yxatiga qaytaramiz.

    Ikki sabab: (1) `NotFound` o'z ichida `MainLayout` chizadi va gate
    ichida ishlatilsa header bilan footer ikki martadan chiqib qolardi;
    (2) foydalanuvchi uchun "modul topilmadi" degan boshi berk sahifadan
    ko'ra ro'yxatga qaytish foydaliroq.
  */
  if (!findModule(moduleId)) return <Navigate to="/darslik" replace />;

  return (
    <DarslikGate>
      <ModuleContent moduleId={moduleId ?? ""} />
    </DarslikGate>
  );
}
