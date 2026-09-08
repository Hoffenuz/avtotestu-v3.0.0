// ============================================================================
// QiyinSavollar — eng ko'p xato qilinadigan savollar, 50 tadan bo'limlarda
// ----------------------------------------------------------------------------
// QIYINLIK QAYERDAN: haqiqiy foydalanuvchi xatolaridan
// (`user_question_state`), matn belgilaridan emas. Sabab generatorda
// o'lchov bilan yozilgan: matn belgilari bilan haqiqiy xatolar o'rtasidagi
// bog'liqlik deyarli yo'q (eng kuchlisi r = 0.148).
//
// Bo'lim bosilsa test DARHOL boshlanadi — oraliq tasdiqlash ekrani yo'q.
// `TestInterfaceBase` ga `poolProvider` uzatiladi (XatolarTesti naqshi).
// ============================================================================

import { useCallback, useEffect, useRef, useState } from "react";
import { AlertTriangle, ChevronRight, Loader2 } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { ProSectionGate } from "@/components/ProSectionGate";
import { SEO } from "@/components/SEO";
import { PageHeader } from "@/components/PageHeader";
import { Card } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { TestInterfaceBase } from "@/components/TestInterfaceBase";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAccessState } from "@/hooks/useAccessState";
import { useTestSession } from "@/hooks/useTestSession";
import { loadCorpusIndex } from "@/lib/questionCorpus";

/** DB `variant` ustuni uchun ajratilgan qiymat (97=imtihon, 98=xatolar, 99=erkin). */
const QIYIN_VARIANT = 96;

interface Guruh {
  n: number;
  dan: number;
  gacha: number;
  ort: number;
  max: number;
  min: number;
  jami: number;
  ids: string[];
}

interface Malumot {
  sana: string;
  jamiUser: number;
  guruhSoni: number;
  guruhHajmi: number;
  guruhlar: Guruh[];
}

export default function QiyinSavollar() {
  const { t, questionLang } = useLanguage();
  const { isPremium } = useAccessState();
  const { starting, startSession } = useTestSession();

  const [malumot, setMalumot] = useState<Malumot | null>(null);
  const [xato, setXato] = useState(false);
  const [joriy, setJoriy] = useState<Guruh | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);

  /** Qaysi bo'lim boshlanmoqda — faqat o'sha kartada spinner chiqsin. */
  const [boshlanmoqda, setBoshlanmoqda] = useState<number | null>(null);

  useEffect(() => {
    let bekor = false;
    fetch("/data/qiyin-savollar.json")
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(String(r.status)))))
      .then((d: Malumot) => { if (!bekor) setMalumot(d); })
      .catch(() => { if (!bekor) setXato(true); });
    return () => { bekor = true; };
  }, []);

  /*
    `poolProvider` ni `TestInterfaceBase` chaqiradi. Tanlangan bo'lim
    `ref` da saqlanadi: `useCallback` ning bog'liqliklariga `joriy` ni
    qo'shsak, test ochilgan zahoti funksiya qayta yaratilib, savollar
    ikki marta yuklanardi.
  */
  const joriyRef = useRef<Guruh | null>(null);

  const poolProvider = useCallback(async (): Promise<unknown[]> => {
    const g = joriyRef.current;
    if (!g) return [];
    const corpusLang = questionLang === "oz" ? "uz-lat" : questionLang;
    const index = await loadCorpusIndex(corpusLang, isPremium);
    const pool: unknown[] = [];
    for (const id of g.ids) {
      const task = index.get(id);
      if (task) pool.push(task);
    }
    return pool;
  }, [questionLang, isPremium]);

  /** Bo'lim bosilishi — tasdiqlashsiz, darhol test. */
  const boshla = async (g: Guruh) => {
    if (starting) return;
    setBoshlanmoqda(g.n);
    const result = await startSession({
      variant: QIYIN_VARIANT,
      questionSource: "difficult",
      isPremium,
    });
    setBoshlanmoqda(null);
    if (!result.ok) return;
    joriyRef.current = g;
    setSessionId(result.session?.sessionId ?? null);
    setJoriy(g);
  };

  // ── Test ekrani ────────────────────────────────────────────────────────
  /*
    Test ham gate ICHIDA: `joriy` faqat gate ortidagi tugmadan yoqiladi,
    lekin obuna test davomida tugab qolsa ekran ochiq qolmasligi kerak.
  */
  if (joriy) {
    return (
      <ProSectionGate section="qiyinSavollar" returnPath="/qiyin-savollar">
        <TestInterfaceBase
          onExit={() => {
            joriyRef.current = null;
            setJoriy(null);
            setSessionId(null);
          }}
          // `dataSource` ishlatilmaydi (poolProvider bor), lekin storageKey
          // shunga bog'langan — har bo'lim uchun noyob bo'lishi kerak.
          dataSource={`/qiyin/${joriy.n}`}
          poolProvider={poolProvider}
          testName={`${t("sections.qiyinSavollar")} ${joriy.dan}–${joriy.gacha}`}
          questionCount={joriy.ids.length}
          timeLimit={joriy.ids.length * 60}
          randomize={false}
          variant={QIYIN_VARIANT}
          sessionId={sessionId}
          isPremiumSession={isPremium}
        />
      </ProSectionGate>
    );
  }

  const jamiXato = malumot
    ? malumot.guruhlar.reduce((s, g) => s + g.jami, 0)
    : 0;

  // MainLayout gate'dan TASHQARIDA — holat almashganda layout qayta
  // qurilmasin (aks holda footer sakrab, CLS ko'tarilardi).
  return (
    <MainLayout>
      <SEO
        title={t("seo.qiyinSavollar.title")}
        description={t("seo.qiyinSavollar.description")}
        path="/qiyin-savollar"
        keywords={t("seo.qiyinSavollar.keywords")}
      />

      <ProSectionGate section="qiyinSavollar" returnPath="/qiyin-savollar">
        <div className="mx-auto w-full max-w-2xl px-4 py-6 md:py-10">
          <PageHeader
            title={t("sections.qiyinSavollar")}
            description={t("pages.qiyinSavollarDesc")}
          />

          <Card className="mb-5 border-l-4 border-l-amber-500 bg-muted/40 p-4">
            <p className="text-sm leading-relaxed text-foreground">
              {t("pages.qiyinSavollarQanday")
                .replace("{x}", malumot ? String(jamiXato) : "…")
                .replace("{s}", malumot ? String(malumot.guruhSoni * malumot.guruhHajmi) : "…")}
            </p>
          </Card>

          {/* Skelet soni bo'lim soniga teng — sahifa sakramasin */}
          {!malumot && !xato && (
            <div className="space-y-3" role="status" aria-live="polite">
              <span className="sr-only">{t("pages.loading")}</span>
              {Array.from({ length: 5 }, (_, i) => (
                <Skeleton key={i} className="h-[74px] w-full" aria-hidden="true" />
              ))}
            </div>
          )}

          {xato && (
            <Card className="p-6 text-center text-muted-foreground">
              {t("pages.qiyinSavollarXato")}
            </Card>
          )}

          {malumot && (
            <div className="space-y-3">
              {malumot.guruhlar.map((g) => {
                const yuklanmoqda = boshlanmoqda === g.n;
                return (
                  <Card key={g.n} className="overflow-hidden">
                    <button
                      type="button"
                      onClick={() => boshla(g)}
                      disabled={starting}
                      className="flex w-full items-center gap-4 p-4 text-left transition-colors hover:bg-muted/50 disabled:opacity-60"
                    >
                      <span
                        className="flex h-11 w-11 flex-none items-center justify-center rounded-full bg-amber-500/10 font-bold text-amber-600 dark:text-amber-400"
                        aria-hidden="true"
                      >
                        {yuklanmoqda ? <Loader2 className="h-5 w-5 animate-spin" /> : g.n}
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block font-semibold text-foreground">
                          {g.dan}–{g.gacha}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {t("pages.qiyinSavollarQator")
                            .replace("{n}", String(g.ids.length))
                            .replace("{x}", String(g.jami))}
                        </span>
                      </span>
                      {!yuklanmoqda && (
                        <ChevronRight
                          className="h-5 w-5 flex-none text-muted-foreground"
                          aria-hidden="true"
                        />
                      )}
                    </button>
                  </Card>
                );
              })}

              <p className="flex items-start gap-2 pt-1 text-xs text-muted-foreground">
                <AlertTriangle className="mt-0.5 h-3.5 w-3.5 flex-none" aria-hidden="true" />
                <span>{t("pages.qiyinSavollarIzoh")}</span>
              </p>
            </div>
          )}
        </div>
      </ProSectionGate>
    </MainLayout>
  );
}
