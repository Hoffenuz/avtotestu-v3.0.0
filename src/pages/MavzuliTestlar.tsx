import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useProAccess } from "@/hooks/useProAccess";
import { useAccessState } from "@/hooks/useAccessState";
import { useTestSession } from "@/hooks/useTestSession";
import { MainLayout } from "@/components/layout/MainLayout";
import { SEO } from "@/components/SEO";
import { ProAccessGate } from "@/components/ProAccessGate";
import { MavzuliTestInterface } from "@/components/MavzuliTestInterface";
import { Button } from "@/components/ui/button";
import { Play, AlertTriangle, Home } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import {
  topicCategories,
  topics,
  type Topic,
  type TopicName,
  type TopicCategory,
} from "@/lib/mavzuNomlari";

const languages = [
  { id: "uz-lat" as const, label: "O'zbekcha" },
  { id: "uz" as const, label: "Ўзбекча" },
  { id: "ru" as const, label: "Русский" },
];

export default function MavzuliTestlar() {
  const { user, isLoading } = useAuth();
  const { language, setLanguage, t } = useLanguage();

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
          ? 'Bu mavzuni boshlash uchun PRO obuna kerak.'
          : 'Serverga ulanishda xatolik. Qayta urinib ko\'ring.'
      );
      return;
    }
    setSessionId(result.session?.sessionId ?? null);
    setTestStarted(true);
  };

  // Double-tap to start on mobile: first tap selects topic, second tap starts test
  const handleMobileTopicTap = async (topicId: string) => {
    if (selectedTopic === topicId) {
      await handleStartTest();
    } else {
      setSelectedTopic(topicId);
    }
  };

  const getTopicButtonClass = (topicId: string) => {
    const isSelected = selectedTopic === topicId;
    return isSelected
      ? 'bg-primary/10 text-primary border-primary'
      : 'bg-background text-foreground border-border hover:border-primary/50';
  };

  // Auth / first access check only — never infinite spin when RPC fails.
  if (isLoading || accessLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm text-muted-foreground font-medium">Yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <MainLayout>
        <SEO
          title="Mavzuli testlar 2026"
          description="YHQ mavzulari bo'yicha testlar: yo'l belgilari, svetofor, ustunlik, to'xtash va to'xtab turish qoidalari. Har bir mavzuni alohida o'rganing."
          path="/mavzuli"
          keywords="mavzuli test, YHQ mavzular, prava test, yo'l belgilari testi"
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
          <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <div className="text-center space-y-4">
              <p className="text-muted-foreground">Mavzu topilmadi.</p>
              <Button
                onClick={() => {
                  setTestStarted(false);
                  setSelectedTopic(null);
                  setSessionId(null);
                }}
              >
                Orqaga
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

  return (
    <MainLayout>
      <SEO
        title="Mavzuli testlar 2026"
        description="YHQ mavzulari bo'yicha testlar: yo'l belgilari, svetofor, ustunlik, to'xtash va to'xtab turish qoidalari. Har bir mavzuni alohida o'rganing. Prava imtihoniga tayyorgarlik."
        path="/mavzuli"
        keywords="mavzuli test, YHQ mavzulari, yo'l qoidalari, chorrahalar, tezlik qoidalari"
      />
      <div className="bg-background">
        {/* Mobile Layout */}
        <div className="lg:hidden bg-background pb-4">
          {/* Mobilda ham chiqish yo'li ko'rinib tursin */}
          <div className="px-4 pt-3">
            <Link to="/">
              <Button variant="outline" size="sm" className="gap-2">
                <Home className="w-4 h-4" />
                {t("nav.home")}
              </Button>
            </Link>
          </div>

          {/*
            "Bosh sahifa / Profil / Kirish" tugmalari BU YERDAN OLIB TASHLANDI —
            uchalasi ham sayt headerida bor edi va ikkinchi qatorda
            takrorlanishi ekranning yuqori qismini bekorga egallardi.

            Til tanlash QOLDIRILDI: bu yerda u "test qaysi tilda bo'ladi"
            degan ma'noni bildiradi va desktop yon panelida ham shu turadi.
          */}
          <div className="flex gap-2 border-b border-border bg-card px-4 py-3">
            {languages.map((lang) => (
              <Button
                key={lang.id}
                variant="outline"
                size="sm"
                className={`flex-1 text-xs ${language === lang.id ? "bg-primary text-primary-foreground border-primary" : ""}`}
                onClick={() => setLanguage(lang.id)}
              >
                {lang.label}
              </Button>
            ))}
          </div>

          {/* Sticky: faqat boshlash tugmasi — sayt headeri ostiga yopishadi */}
          <div className="sticky top-14 z-30 bg-card/95 backdrop-blur-sm border-b border-border px-4 py-2.5 shadow-sm md:top-[60px]">
            <Button
              size="lg"
              className="w-full gap-2.5 h-14 text-[15px] font-semibold rounded-xl"
              onClick={handleStartTest}
              disabled={selectedTopic === null || starting}
            >
              {starting ? (
                <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
              ) : (
                <Play className="w-5 h-5" />
              )}
              {selectedTopic ? t("test.startTest") : t("test.selectTopicFirst")}
            </Button>
          </div>

          <div className="bg-card border-b border-border p-4">
            {selectedTopic ? (
              <div className="p-4 bg-primary/5 rounded-lg border border-primary/20 text-center">
                <div className="text-sm font-semibold text-primary">
                  {(() => {
                    const topic = topics.find(t => t.id === selectedTopic);
                    return topic ? getTopicName(topic) : selectedTopic;
                  })()}
                </div>
              </div>
            ) : (
              <div className="p-4 bg-muted/30 rounded-lg border border-border text-center">
                <div className="text-sm text-muted-foreground">
                  {language === 'ru' ? 'Выберите тему ниже' : language === 'uz' ? 'Қуйидан мавзу танланг' : 'Quyidan mavzu tanlang'}
                </div>
              </div>
            )}
            {startError && (
              <div className="mt-2 flex items-center gap-2 bg-red-500/10 border border-red-500/25 rounded-lg px-3 py-2">
                <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <p className="text-xs text-red-700 dark:text-red-300">{startError}</p>
              </div>
            )}
          </div>
          <div className="p-4">
            <h2 className="text-lg font-bold text-foreground mb-3">{language === 'ru' ? 'Темы' : language === 'uz' ? 'Мавзулар' : 'Mavzular'}</h2>
            <div className="space-y-5">
              {topicCategories.map((cat) => (
                <div key={cat.key}>
                  <h3 className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground mb-2 px-0.5">
                    {getCategoryTitle(cat)}
                  </h3>
                  <div className="space-y-2">
                    {cat.topics.map((topic) => (
                      <Button
                        key={topic.id}
                        variant="outline"
                        className={`w-full justify-start text-left h-auto py-3 px-4 ${getTopicButtonClass(topic.id)}`}
                        onClick={() => handleMobileTopicTap(topic.id)}
                      >
                        <span className="text-sm font-medium">{getTopicName(topic)}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/*
          Desktop: ikki panelli "ilova" ko'rinishi.

          Balandlik `100vh - header` — ilgari to'liq `h-screen` edi va sayt
          headeri yo'q deb hisoblanardi. Header qaytarilgach, o'sha balandlik
          ekrandan oshib ketardi.

          "Bosh sahifa / Profil" tugmalari olib tashlandi — header da bor.
        */}
        <div className="hidden h-[calc(100vh-60px)] overflow-hidden bg-background text-foreground lg:flex">
          <div className="w-[30%] bg-card border-r border-border p-6 flex flex-col">
            <div className="flex-1 flex flex-col">
              {/*
                Bosh sahifaga qaytish. Sayt headerida ham havola bor, lekin bu
                ekran to'liq balandlikdagi ikki panelli "ilova" ko'rinishida —
                chiqish yo'li ko'z oldida turishi kerak.
              */}
              <Link to="/" className="mb-4 self-start">
                <Button variant="outline" size="sm" className="gap-2">
                  <Home className="w-4 h-4" />
                  {t("nav.home")}
                </Button>
              </Link>

              <div className="mb-4">
                <h3 className="text-xs font-medium text-muted-foreground mb-2">{t("test.selectLanguage")}</h3>
                <div className="flex gap-2">
                  {languages.map((lang) => (
                    <Button
                      key={lang.id}
                      variant="outline"
                      size="sm"
                      className={`flex-1 text-sm h-11 rounded-lg font-medium ${language === lang.id ? "bg-primary text-primary-foreground border-primary shadow-sm" : "hover:border-primary/40"}`}
                      onClick={() => setLanguage(lang.id)}
                    >
                      {lang.label}
                    </Button>
                  ))}
                </div>
              </div>
              {selectedTopic ? (
                <div className="mb-5 p-4 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl border-2 border-primary/20 shadow-sm">
                  <div className="text-center">
                    <div className="text-sm font-bold text-primary leading-tight">
                      {(() => {
                        const topic = topics.find(t => t.id === selectedTopic);
                        return topic ? getTopicName(topic) : selectedTopic;
                      })()}
                    </div>
                    <div className="text-[10px] text-muted-foreground mt-1">{language === 'ru' ? 'Выбранная тема' : language === 'uz' ? 'Танланган мавзу' : 'Tanlangan mavzu'}</div>
                  </div>
                </div>
              ) : (
                <div className="mb-5 p-4 bg-muted/20 rounded-xl border-2 border-dashed border-border">
                  <div className="text-center text-muted-foreground text-xs">
                    {language === 'ru' ? 'Выберите тему справа' : language === 'uz' ? 'Ўнг томондан мавзу танланг' : 'O\'ng tomondan mavzu tanlang'}
                  </div>
                </div>
              )}
              {startError && (
                <div className="mb-3 flex items-center gap-2 bg-red-500/10 border border-red-500/25 rounded-lg px-3 py-2">
                  <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  <p className="text-xs text-red-700 dark:text-red-300">{startError}</p>
                </div>
              )}
              <Button
                size="lg"
                className="w-full mb-4 gap-2.5 h-14 text-base font-semibold rounded-xl shadow-md hover:shadow-lg transition-all"
                onClick={handleStartTest}
                disabled={selectedTopic === null || starting}
              >
                {starting ? (
                  <div className="w-5 h-5 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                ) : (
                  <Play className="w-5 h-5" />
                )}
                {selectedTopic ? t("test.startTest") : t("test.selectTopicFirst")}
              </Button>
              <div className="p-3.5 bg-gradient-to-br from-muted/50 to-muted/30 rounded-xl border border-border">
                <h3 className="text-xs font-semibold text-foreground mb-2 flex items-center gap-1.5">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                  Ko'rsatmalar
                </h3>
                <div className="text-xs text-muted-foreground space-y-1.5">
                  <div className="flex items-start gap-1.5">
                    <span className="text-primary mt-0.5">•</span>
                    <span>Mavzu bo'yicha barcha savollar beriladi</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <span className="text-primary mt-0.5">•</span>
                    <span>Har bir savol uchun javob tanlang</span>
                  </div>
                  <div className="flex items-start gap-1.5">
                    <span className="text-primary mt-0.5">•</span>
                    <span>Test tugagach natijani ko'ring</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="w-[70%] bg-background p-8 overflow-y-auto">
            <div className="max-w-5xl">
              <div className="mb-6">
                <h1 className="text-2xl font-bold text-foreground mb-1">{language === 'ru' ? 'Темы' : language === 'uz' ? 'Мавзулар' : 'Mavzular'}</h1>
                <p className="text-sm text-muted-foreground">
                  {language === 'ru' ? 'Проверьте свои знания по темам' : language === 'uz' ? 'Мавзу бўйича билимингизни синанг' : 'Mavzu bo\'yicha bilimingizni sinang'}
                </p>
              </div>
              <div className="space-y-6">
                {topicCategories.map((cat) => (
                  <div key={cat.key}>
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2.5">
                      {getCategoryTitle(cat)}
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                      {cat.topics.map((topic) => (
                        <Button
                          key={topic.id}
                          variant="outline"
                          className={`h-auto min-h-[3.25rem] py-4 px-5 text-left justify-start rounded-xl transition-all ${getTopicButtonClass(topic.id)}`}
                          onClick={() => setSelectedTopic(topic.id)}
                        >
                          <span className="text-[15px] font-medium leading-snug">{getTopicName(topic)}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
