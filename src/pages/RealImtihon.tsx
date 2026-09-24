// ============================================================================
// RealImtihon — "Real imtihon" bo'limi
// ----------------------------------------------------------------------------
// Sahifa ochilishi bilan imtihon O'ZI boshlanadi: oraliq "qoidalar" ekrani
// YO'Q. Foydalanuvchi tugmani allaqachon bir marta bosgan — ikkinchi marta
// tasdiqlashga majburlash ortiqcha qadam bo'lardi.
//
// TO'LIQ EKRAN HAQIDA: brauzer `requestFullscreen()` ni faqat foydalanuvchi
// harakati doirasida qabul qiladi. Bu yerda sahifa navigatsiyadan keyin
// ochiladi, ya'ni o'sha doira tugagan — so'rov rad etiladi. Shuning uchun
// imtihon sarlavhasida to'liq ekran tugmasi turadi (bir bosishda yoqiladi),
// ekranning o'zi esa `fixed inset-0` bilan baribir butun oynani egallaydi.
// ============================================================================

import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, RotateCcw } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { SEO } from "@/components/SEO";
import { PageHeader } from "@/components/PageHeader";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { RealExamInterface } from "@/components/RealExamInterface";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAccessState } from "@/hooks/useAccessState";
import { useTestSession } from "@/hooks/useTestSession";

/** DB dagi `variant` ustuni: 97 — real imtihon uchun ajratilgan qiymat. */
const EXAM_VARIANT = 97;
const QUESTION_COUNT = 20;
const TIME_LIMIT_SEC = 25 * 60;

/** Til bo'yicha savol bazasi. PRO — 1250 ta, bepul — 1000 ta. */
const DATA_FILES = {
  "uz-lat": { free: "free-uz-lat.json", pro: "barcha-uz-lat.json" },
  uz: { free: "free-uz-cyr.json", pro: "barcha-uz-cyr.json" },
  ru: { free: "free-ru.json", pro: "barcha-ru.json" },
} as const;

export default function RealImtihon() {
  const { user, isLoading: authLoading } = useAuth();
  const { t, language } = useLanguage();
  const { isPremium, loading: accessLoading } = useAccessState();
  const { startSession } = useTestSession();

  const [started, setStarted] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);

  /** Sessiya faqat BIR MARTA so'ralsin (React 18 qat'iy rejimda ikki marta chaqiradi). */
  const requestedRef = useRef(false);

  const files = DATA_FILES[language] ?? DATA_FILES["uz-lat"];
  const dataFile = isPremium ? files.pro : files.free;

  const begin = useCallback(async () => {
    setFailed(false);
    const result = await startSession({
      variant: EXAM_VARIANT,
      questionSource: dataFile,
      isPremium,
    });
    if (!result.ok) {
      setFailed(true);
      return;
    }
    setSessionId(result.session?.sessionId ?? null);
    setStarted(true);
  }, [startSession, dataFile, isPremium]);

  // Kirish holati aniqlangach — darhol boshlaymiz
  useEffect(() => {
    if (authLoading || accessLoading || !user || requestedRef.current) return;
    requestedRef.current = true;
    void begin();
  }, [authLoading, accessLoading, user, begin]);

  if (started) {
    return (
      <RealExamInterface
        onExit={() => {
          setStarted(false);
          setSessionId(null);
          requestedRef.current = false;
        }}
        dataSource={`/${dataFile}`}
        questionCount={QUESTION_COUNT}
        timeLimit={TIME_LIMIT_SEC}
        variant={EXAM_VARIANT}
        sessionId={sessionId}
        isPremiumSession={isPremium}
      />
    );
  }

  return (
    <MainLayout>
      <SEO
        title={t("seo.realImtihon.title")}
        description={t("seo.realImtihon.description")}
        path="/real-imtihon"
        keywords={t("seo.realImtihon.keywords")}
      />

      <div className="mx-auto w-full max-w-md px-4 py-10 md:py-16">
        <PageHeader title={t("sections.realImtihon")} description={t("exam.intro")} />

        <Card>
          <CardContent className="py-10 text-center">
            {!user && !authLoading ? (
              <>
                <p className="text-sm text-muted-foreground">{t("pages.signInRequired")}</p>
                <Button asChild className="mt-4">
                  <Link to="/auth">{t("pages.signIn")}</Link>
                </Button>
              </>
            ) : failed ? (
              <>
                <p className="text-sm text-muted-foreground">{t("exam.startFailed")}</p>
                <Button
                  className="mt-4"
                  onClick={() => {
                    void begin();
                  }}
                >
                  <RotateCcw className="mr-2 h-4 w-4" aria-hidden="true" />
                  {t("results.tryAgain")}
                </Button>
              </>
            ) : (
              <div role="status">
                <Loader2
                  className="mx-auto h-7 w-7 animate-spin text-muted-foreground"
                  aria-hidden="true"
                />
                <p className="mt-3 text-sm text-muted-foreground">{t("exam.preparing")}</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
