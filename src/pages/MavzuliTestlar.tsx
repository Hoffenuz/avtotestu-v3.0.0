import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useProAccess } from "@/hooks/useProAccess";
import { useAccessState } from "@/hooks/useAccessState";
import { useTestSession } from "@/hooks/useTestSession";
import { MainLayout } from "@/components/layout/MainLayout";
import { SEO } from "@/components/SEO";
import { ProAccessGate } from "@/components/ProAccessGate";
import { MavzuliTestInterface } from "@/components/MavzuliTestInterface";
import { Button } from "@/components/ui/button";
import { BookOpen } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { PageIntro } from "@/components/PageIntro";
import {
  OPTION_BASE,
  OPTION_IDLE,
  OPTION_SELECTED,
  StartButton,
  StartNotice,
  TestLangPicker,
} from "@/components/test-start/TestStartParts";
import { cn } from "@/lib/utils";
import {
  topicCategories,
  topics,
  type Topic,
  type TopicName,
  type TopicCategory,
} from "@/lib/mavzuNomlari";

/** Mobil (lg dan kichik) — tanlangan mavzuni qayta bosish testni boshlaydi. */
const isCompactScreen = () =>
  typeof window !== "undefined" && window.matchMedia("(max-width: 1023.98px)").matches;

export default function MavzuliTestlar() {
  const { user, isLoading } = useAuth();
  const { language, t } = useLanguage();

  // Storage keys are user-specific to prevent test state leaking across users on the same device.
  const mavzuliStorageKey = `mavzuli_activeTest_${user?.id ?? 'guest'}`;

  const getInitialState = () => {
    try {
      const saved = localStorage.getItem(mavzuliStorageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.testStarted && parsed.selectedTopic) {
          // Only restore if the in-progress test state still exists
          const userId = user?.id ?? 'guest';
          const testKey = `testState_mavzuli_${parsed.selectedTopic}_${userId}`;
          if (!localStorage.getItem(testKey)) {
            localStorage.removeItem(mavzuliStorageKey);
            return { selectedTopic: null as string | null, testStarted: false, sessionId: null as string | null };
          }
          return {
            selectedTopic: parsed.selectedTopic as string,
            testStarted: true,
            sessionId: (parsed.sessionId ?? null) as string | null,
          };
        }
      }
    } catch (e) { /* ignore */ }
    return { selectedTopic: null as string | null, testStarted: false, sessionId: null as string | null };
  };

  const initial = getInitialState();
  const [selectedTopic, setSelectedTopic] = useState<string | null>(initial.selectedTopic);
  const [testStarted, setTestStarted] = useState(initial.testStarted);
  const [sessionId, setSessionId] = useState<string | null>(initial.sessionId);
  const [startError, setStartError] = useState<string | null>(null);

  // PRO users can enter mavzuli; guests see PRO gate (no auth redirect)
  const { hasAccess, loading: accessLoading } = useProAccess({
    redirectPath: '/pro',
    redirectGuestsToAuth: false,
    redirectWithoutAccess: false,
  });
  const { backendConfirmed, refresh } = useAccessState();
  const { starting, startSession } = useTestSession();

  // Persist active test state
  useEffect(() => {
    try {
      if (testStarted && selectedTopic) {
        localStorage.setItem(mavzuliStorageKey, JSON.stringify({ testStarted, selectedTopic, sessionId }));
      } else {
        localStorage.removeItem(mavzuliStorageKey);
      }
    } catch (e) { /* ignore */ }
  }, [mavzuliStorageKey, testStarted, selectedTopic, sessionId]);
  const getTopicName = (topic: Topic) => {
    const langKey = language === 'uz-lat' ? 'uz_lat' : language === 'uz' ? 'uz_cyr' : 'ru';
    return topic.name[langKey];
  };

  const getCategoryTitle = (cat: TopicCategory) => {
    const langKey = language === 'uz-lat' ? 'uz_lat' : language === 'uz' ? 'uz_cyr' : 'ru';
    return cat.title[langKey];
  };

  const handleStartTest = async () => {
    if (selectedTopic === null) return;
    setStartError(null);
    const result = await startSession({
      variant: parseInt(selectedTopic, 10) || 0,
      questionSource: `t${selectedTopic}.json`,
      isPremium: true,
    });
    if (!result.ok) {
      setStartError(
        result.error === 'no_premium_access'
          ? t("testStart.errProRequired")
          : t("testStart.errConnection")
      );
      return;
    }
    setSessionId(result.session?.sessionId ?? null);
    setTestStarted(true);
  };

  // Mobilda: birinchi bosish tanlaydi, ikkinchisi boshlaydi (tugma yuqorida,
  // barmoq esa pastda). Desktopda bosish faqat tanlaydi.
  const handleTopicTap = async (topicId: string) => {
    if (selectedTopic === topicId && isCompactScreen()) {
      await handleStartTest();
    } else {
      setSelectedTopic(topicId);
    }
  };

  // Auth / first access check only — never infinite spin when RPC fails.
  // Sayt headeri bilan: yuklanish paytida header yo'qolib, keyin birdan
  // paydo bo'lmasin.
  if (isLoading || accessLoading) {
    return (
      <MainLayout>
        <div className="flex min-h-[60vh] items-center justify-center" role="status">
          <div className="text-center">
            <div className="mx-auto mb-3 h-10 w-10 animate-spin rounded-full border-4 border-primary/30 border-t-primary" />
            <p className="text-sm font-medium text-muted-foreground">{t("testStart.loading")}</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (!user) {
    return (
      <MainLayout>
        <SEO
          title={t("seo.mavzuli.title")}
          description={t("seo.mavzuli.description")}
          path="/mavzuli"
          keywords={t("seo.mavzuli.keywords")}
        />
        <ProAccessGate section="mavzuli" reason="guest" returnPath="/mavzuli" />
      </MainLayout>
    );
  }

  // RPC finished but backend unavailable — show gate (was unreachable while loading stayed true forever)
  if (!backendConfirmed) {
    return (
      <MainLayout>
        <SEO
          title="Mavzuli testlar 2026"
          description="YHQ mavzulari bo'yicha testlar: yo'l belgilari, svetofor, ustunlik, to'xtash va to'xtab turish qoidalari. Har bir mavzuni alohida o'rganing."
          path="/mavzuli"
          keywords="mavzuli test, YHQ mavzular, prava test, yo'l belgilari testi"
        />
        <ProAccessGate section="mavzuli" reason="backend" returnPath="/mavzuli" onRetry={refresh} />
      </MainLayout>
    );
  }

  if (!hasAccess) {
    return (
      <MainLayout>
        <SEO
          title="Mavzuli testlar 2026"
          description="YHQ mavzulari bo'yicha testlar: yo'l belgilari, svetofor, ustunlik, to'xtash va to'xtab turish qoidalari. Har bir mavzuni alohida o'rganing."
          path="/mavzuli"
          keywords="mavzuli test, YHQ mavzular, prava test, yo'l belgilari testi"
        />
        <ProAccessGate section="mavzuli" reason="no_pro" returnPath="/mavzuli" />
      </MainLayout>
    );
  }

  if (testStarted && selectedTopic) {
    const topic = topics.find(t => t.id === selectedTopic);
    if (!topic) {
      return (
        <MainLayout>
          <div className="flex min-h-[60vh] items-center justify-center p-4">
            <div className="text-center space-y-4">
              <p className="text-muted-foreground">{t("testStart.topicNotFound")}</p>
              <Button
                onClick={() => {
                  setTestStarted(false);
                  setSelectedTopic(null);
                  setSessionId(null);
                }}
              >
                {t("pages.back")}
              </Button>
            </div>
          </div>
        </MainLayout>
      );
    }
    return (
      <MavzuliTestInterface
        onExit={() => {
          setTestStarted(false);
          setSelectedTopic(null);
          setSessionId(null);
          setStartError(null);
        }}
        topicId={selectedTopic}
        topicName={getTopicName(topic)}
        sessionId={sessionId}
        isPremiumSession={true}
      />
    );
  }

  const selectedTopicName = (() => {
    const topic = selectedTopic ? topics.find((item) => item.id === selectedTopic) : undefined;
    return topic ? getTopicName(topic) : null;
  })();

  /*
    TUZILISH — /variant bilan bir xil: `PageIntro` sarlavhasi, chapda savollar
    tili va mavzular, o'ngda (lg+) yopishqoq panel: tanlangan mavzu va
    "Testni boshlash". Mobilda tugma header ostida yopishib turadi.

    Olib tashlangan takrorlar: "Bosh sahifa" tugmasi (header va pastki
    menyuda bor), "O'ng tomondan mavzu tanlang" bilan "Mavzuni tanlang"
    tugmasi (bir gap ikki marta), "Ko'rsatmalar" bloki.

    Balandlik ekranga (vh) bog'lanmagan — ilgari `100vh` li qotirilgan ikki
    panel past ekranda chap panelni kesib qo'yardi.
  */
  return (
    <MainLayout>
      <SEO
        title="Mavzuli testlar 2026"
        description="YHQ mavzulari bo'yicha testlar: yo'l belgilari, svetofor, ustunlik, to'xtash va to'xtab turish qoidalari. Har bir mavzuni alohida o'rganing. Prava imtihoniga tayyorgarlik."
        path="/mavzuli"
        keywords="mavzuli test, YHQ mavzulari, yo'l qoidalari, chorrahalar, tezlik qoidalari"
      />

      <PageIntro
        icon={BookOpen}
        title={t("home.btnMavzuli")}
        subtitle={t("testStart.topicsSubtitle").replace("{n}", String(topics.length))}
      />

      {/* Mobil: boshlash tugmasi header ostida yopishib turadi */}
      <div className="sticky top-14 z-30 border-b border-border bg-card/95 px-4 py-2.5 backdrop-blur-sm md:top-[60px] lg:hidden">
        <StartButton onClick={handleStartTest} disabled={selectedTopic === null} loading={starting} className="h-12">
          {selectedTopic ? t("test.startTest") : t("test.selectTopicFirst")}
        </StartButton>
      </div>

      <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-5 md:px-6 md:py-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start lg:gap-8">
        <div className="min-w-0 space-y-7">
          <div className="space-y-4">
            <TestLangPicker className="lg:max-w-sm" />
            {startError && (
              <div className="lg:hidden">
                <StartNotice>{startError}</StartNotice>
              </div>
            )}
          </div>

          {topicCategories.map((cat) => (
            <section key={cat.key}>
              <h2 className="mb-3 border-b border-border pb-2 text-base font-bold tracking-tight text-foreground md:text-lg">
                {getCategoryTitle(cat)}
              </h2>
              <div className="grid gap-2.5 sm:grid-cols-2">
                {cat.topics.map((topic) => (
                  <button
                    key={topic.id}
                    type="button"
                    aria-pressed={selectedTopic === topic.id}
                    onClick={() => handleTopicTap(topic.id)}
                    className={cn(
                      OPTION_BASE,
                      "flex min-h-[52px] w-full items-center px-4 py-3 text-left text-[15px] font-medium leading-snug",
                      selectedTopic === topic.id ? OPTION_SELECTED : OPTION_IDLE,
                    )}
                  >
                    {getTopicName(topic)}
                  </button>
                ))}
              </div>
            </section>
          ))}
        </div>

        {/* Desktop: yopishqoq boshlash paneli */}
        <aside className="hidden lg:sticky lg:top-[84px] lg:block">
          <div className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-sm">
            <div>
              <p className="text-sm font-semibold text-foreground">{t("testStart.selected")}</p>
              <p className="mt-1 text-lg font-bold leading-snug text-brand dark:text-foreground">
                {selectedTopicName ?? "—"}
              </p>
            </div>
            {startError && <StartNotice>{startError}</StartNotice>}
            <StartButton onClick={handleStartTest} disabled={selectedTopic === null} loading={starting}>
              {selectedTopic ? t("test.startTest") : t("test.selectTopicFirst")}
            </StartButton>
          </div>
        </aside>
      </div>
    </MainLayout>
  );
}
