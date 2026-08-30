// ============================================================================
// XatolarTesti — "Xatolar ustida ishlash"
// ----------------------------------------------------------------------------
// Foydalanuvchining XATO javob bergan savollaridan test tuzadi.
//
// NEGA BU ALOHIDA REJIM:
//   `/xatolarim` faqat KO'RSATADI — o'qib chiqiladi va unutiladi. Imtihonga
//   tayyorgarlikda esa eng samarali usul qayta YECHISH. To'g'ri javob berilgan
//   savol `wrong_count` o'zgarmasa ham, keyingi safar ro'yxatning oxiriga
//   tushadi (tartib `wrong_count` bo'yicha).
//
// SAVOLLAR QAYERDAN:
//   URL dan emas — foydalanuvchining o'z tarixidan. Shuning uchun
//   `TestInterfaceBase` ga `poolProvider` uzatiladi.
// ============================================================================

import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, CheckCircle2, Play, Loader2 } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { ProSectionGate } from "@/components/ProSectionGate";
import { SEO } from "@/components/SEO";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { TestInterfaceBase } from "@/components/TestInterfaceBase";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAccessState } from "@/hooks/useAccessState";
import { useTestSession } from "@/hooks/useTestSession";
import { fetchWrongQuestionIds } from "@/lib/questionState";
import { loadCorpusIndex } from "@/lib/questionCorpus";

/** DB dagi `variant` ustuni 0..100 oralig'ida — xatolar rejimi uchun ajratilgan qiymat. */
const MISTAKES_VARIANT = 98;
/** Bir seansda nechta savol. Ko'proq bo'lsa charchatadi. */
const MAX_QUESTIONS = 20;

export default function XatolarTesti() {
  const { user } = useAuth();
  const { t, questionLang } = useLanguage();
  const { isPremium } = useAccessState();
  const { starting, startSession } = useTestSession();

  const [wrongIds, setWrongIds] = useState<string[] | null>(null);
  const [started, setStarted] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) {
      setWrongIds([]);
      return;
    }
    let cancelled = false;
    void (async () => {
      const ids = await fetchWrongQuestionIds(MAX_QUESTIONS);
      if (!cancelled) setWrongIds(ids);
    })();
    return () => {
      cancelled = true;
    };
  }, [user]);

  /**
   * Savollarni korpusdan XOM ko'rinishda qaytaradi — `TestInterfaceBase`
   * ularni o'zi tilga qarab o'giradi, shu sababli til almashtirilganda
   * test buzilmaydi.
   */
  const poolProvider = useCallback(async (): Promise<unknown[]> => {
    const ids = await fetchWrongQuestionIds(MAX_QUESTIONS);
    if (ids.length === 0) return [];
    const corpusLang = questionLang === "oz" ? "uz-lat" : questionLang;
    const index = await loadCorpusIndex(corpusLang, isPremium);
    const pool: unknown[] = [];
    for (const id of ids) {
      const task = index.get(id);
      if (task) pool.push(task);
    }
    return pool;
  }, [questionLang, isPremium]);

  const handleStart = async () => {
    const result = await startSession({
      variant: MISTAKES_VARIANT,
      questionSource: "mistakes",
      isPremium,
    });
    if (!result.ok) return;
    setSessionId(result.session?.sessionId ?? null);
    setStarted(true);
  };

  /*
    Test ekrani ham gate ICHIDA: `started` faqat gate ortidagi tugmadan
    yoqiladi, lekin obuna test davomida tugab qolsa (yoki holat boshqa
    yo'l bilan qayta tiklansa) ekran ochiq qolib ketmasligi kerak.
  */
  if (started) {
    return (
      <ProSectionGate section="xatolarTesti" returnPath="/xatolar-testi">
      <TestInterfaceBase
        onExit={() => {
          setStarted(false);
          setSessionId(null);
        }}
        // `dataSource` ishlatilmaydi (poolProvider bor), lekin storageKey
        // shunga bog'langan — noyob qiymat berilishi kerak.
        dataSource="/mistakes"
        poolProvider={poolProvider}
        testName={t("sections.xatolarTesti")}
        questionCount={MAX_QUESTIONS}
        timeLimit={MAX_QUESTIONS * 60}
        randomize={false}
        variant={MISTAKES_VARIANT}
        sessionId={sessionId}
        isPremiumSession={isPremium}
      />
      </ProSectionGate>
    );
  }

  const count = wrongIds?.length ?? 0;

  return (
    <ProSectionGate section="xatolarTesti" returnPath="/xatolar-testi">
      <MainLayout>
      <SEO
        title={t("sections.xatolarTesti")}
        description="Xato javob bergan savollaringizdan test tuzing va ularni mustahkamlang."
        path="/xatolar-testi"
        noIndex
      />

      <div className="mx-auto w-full max-w-2xl px-4 py-6 md:py-10">
        <PageHeader
          title={t("sections.xatolarTesti")}
          description={t("pages.mistakesDesc")}
        />

        {!user ? (
          <Card>
            <CardContent className="py-10 text-center">
              <p className="text-muted-foreground">
                {t("pages.signInRequired")}
              </p>
              <Button asChild className="mt-4">
                <Link to="/auth">{t("pages.signIn")}</Link>
              </Button>
            </CardContent>
          </Card>
        ) : wrongIds === null ? (
          <div className="flex justify-center py-16" role="status">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" aria-hidden="true" />
            <span className="sr-only">{t("pages.loading")}</span>
          </div>
        ) : count === 0 ? (
          <Card>
            <CardContent className="py-10 text-center">
              <CheckCircle2 className="mx-auto mb-3 h-10 w-10 text-emerald-500" aria-hidden="true" />
              <p className="font-medium text-foreground">{t("pages.mistakesEmpty")}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("pages.mistakesEmptyHint")}
              </p>
              <Button asChild className="mt-4">
                <Link to="/test-ishlash">{t("pages.startTest")}</Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="py-8 text-center">
              <span
                className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-rose-500/10"
                aria-hidden="true"
              >
                <AlertCircle className="h-7 w-7 text-rose-500" />
              </span>

              <p className="text-2xl font-bold text-foreground">{count} {t("pages.questionsCount")}</p>
              <p className="mt-1 text-sm text-muted-foreground">
                {t("pages.mistakesFrom")}
              </p>

              <Button
                size="lg"
                className="mt-6 w-full sm:w-auto"
                onClick={() => void handleStart()}
                disabled={starting}
              >
                {starting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Play className="mr-2 h-4 w-4" aria-hidden="true" />
                )}
                {t("pages.mistakesStart")}
              </Button>

              <p className="mt-4 text-xs text-muted-foreground">
                {t("pages.mistakesNote")}
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </MainLayout>
    </ProSectionGate>
  );
}
