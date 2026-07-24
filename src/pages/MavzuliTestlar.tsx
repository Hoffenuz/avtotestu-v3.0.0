import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useProAccess } from "@/hooks/useProAccess";
import { useAccessState } from "@/hooks/useAccessState";
import { useTestSession } from "@/hooks/useTestSession";
import { useDarkMode } from "@/hooks/useDarkMode";
import { MainLayout } from "@/components/layout/MainLayout";
import { SEO } from "@/components/SEO";
import { ProAccessGate } from "@/components/ProAccessGate";
import { MavzuliTestInterface } from "@/components/MavzuliTestInterface";
import { Button } from "@/components/ui/button";
import { User, Home, Play, AlertTriangle, LogIn } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

type TopicName = { uz_lat: string; uz_cyr: string; ru: string };
type Topic = { id: string; name: TopicName };

type TopicCategory = {
  key: string;
  title: TopicName;
  topics: Topic[];
};

const topicCategories: TopicCategory[] = [
  {
    key: "asosiy",
    title: { uz_lat: "Asosiy", uz_cyr: "Асосий", ru: "Основное" },
    topics: [
      { id: "31", name: { uz_lat: "Barcha savollar", uz_cyr: "Барча саволлар", ru: "Все вопросы" } },
      { id: "35a", name: { uz_lat: "Yangi savollar", uz_cyr: "Янги саволлар", ru: "Новые вопросы" } },
      { id: "1", name: { uz_lat: "Umumiy qoidalar", uz_cyr: "Умумий қоидалар", ru: "Общие правила" } },
      { id: "2", name: { uz_lat: "Haydovchining umumiy vazifalari", uz_cyr: "Ҳайдовчининг умумий вазифалари ва пиёдалар", ru: "Общие обязанности водителя и пешеходы" } },
    ],
  },
  {
    key: "belgilar",
    title: { uz_lat: "Yo'l belgilari", uz_cyr: "Йўл белгилари", ru: "Дорожные знаки" },
    topics: [
      { id: "3", name: { uz_lat: "Ogohlantiruvchi belgilar", uz_cyr: "Огоҳлантирувчи белгилар", ru: "Предупреждающие знаки" } },
      { id: "4", name: { uz_lat: "Imtiyoz belgilar", uz_cyr: "Имтиёз белгилар", ru: "Знаки приоритета" } },
      { id: "5", name: { uz_lat: "Taqiqlovchi belgilar", uz_cyr: "Тақиқловчи белгилар", ru: "Запрещающие знаки" } },
      { id: "6", name: { uz_lat: "Buyuruvchi belgilar", uz_cyr: "Буюрувчи белгилар", ru: "Предписывающие знаки" } },
      { id: "7", name: { uz_lat: "Axborot ishora belgilari", uz_cyr: "Ахборот ишора белгилари", ru: "Информационные знаки" } },
      { id: "8", name: { uz_lat: "Qo'shimcha axborot belgilari", uz_cyr: "Қўшимча ахборот белгилари", ru: "Дополнительные информационные знаки" } },
    ],
  },
  {
    key: "chorrahalar",
    title: { uz_lat: "Chorrahalar", uz_cyr: "Чорраҳалар", ru: "Перекрестки" },
    topics: [
      { id: "20", name: { uz_lat: "Chorrahalarda harakatlanish", uz_cyr: "Чорраҳаларда ҳаракатланиш", ru: "Движение на перекрестках" } },
      { id: "34", name: { uz_lat: "Teng ahamiyatli chorrahalar", uz_cyr: "Тенг аҳамиятли чорраҳалар", ru: "Равнозначные перекрестки" } },
      { id: "33", name: { uz_lat: "Tartibga solinmagan chorrahada asosiy yo'l", uz_cyr: "Тартибга солинмаган чорраҳада асосий йўл", ru: "Главная дорога на нерегулируемом перекрестке" } },
    ],
  },
  {
    key: "chiziqlar",
    title: { uz_lat: "Yo'l chiziqlari", uz_cyr: "Йўл чизиқлари", ru: "Дорожная разметка" },
    topics: [
      { id: "9", name: { uz_lat: "Yotiq chiziqlar 1", uz_cyr: "Ётиқ чизиқлар 1", ru: "Горизонтальная разметка 1" } },
      { id: "10", name: { uz_lat: "Yotiq va tik chiziqlar 2", uz_cyr: "Ётиқ ва тик чизиқлар 2", ru: "Горизонтальная и вертикальная разметка 2" } },
    ],
  },
  {
    key: "ishoralar",
    title: { uz_lat: "Svetafor va ishoralar", uz_cyr: "Светафор ва ишоралар", ru: "Светофор и сигналы" },
    topics: [
      { id: "11", name: { uz_lat: "Svetafor ishoralari", uz_cyr: "Светафор ишоралари", ru: "Сигналы светофора" } },
      { id: "12", name: { uz_lat: "Tartibga soluvchining ishoralari", uz_cyr: "Тартибга солувчининг ишоралари", ru: "Сигналы регулировщика" } },
      { id: "13", name: { uz_lat: "Ogohlantiruvchi va avariya ishoralari", uz_cyr: "Огоҳлантирувчи ва авария ишоралари", ru: "Предупредительные и аварийные сигналы" } },
    ],
  },
  {
    key: "harakat",
    title: { uz_lat: "Harakatlanish qoidalari", uz_cyr: "Ҳаракатланиш қоидалари", ru: "Правила движения" },
    topics: [
      { id: "14", name: { uz_lat: "Yo'llarda harakatlanish", uz_cyr: "Йўлларда ҳаракатланиш", ru: "Начало движения (Маневр)" } },
      { id: "15", name: { uz_lat: "Transport vositalarining joylashuvi", uz_cyr: "Tранспорт воситаларининг жойлашуви", ru: "Расположение транспортных средств на проезжей части" } },
      { id: "16", name: { uz_lat: "Harakatlanish tezligi", uz_cyr: "Ҳаракатланиш тезлиги", ru: "Скорость движения" } },
      { id: "17", name: { uz_lat: "Quvib o'tish", uz_cyr: "Қувиб ўтиш", ru: "Обгон" } },
      { id: "18", name: { uz_lat: "To'xtash va to'xtab turish qoidalari 1", uz_cyr: "Тўхташ ва тўхтаб туриш қоидалари 1", ru: "Правила остановки и стоянки 1" } },
      { id: "19", name: { uz_lat: "To'xtash va to'xtab turish qoidalari 2", uz_cyr: "Тўхташ ва тўхтаб туриш қоидалари 2", ru: "Правила остановки и стоянки 2" } },
    ],
  },
  {
    key: "maxsus",
    title: { uz_lat: "Maxsus holatlar", uz_cyr: "Махсус ҳолатлар", ru: "Особые условия" },
    topics: [
      { id: "21", name: { uz_lat: "Piyodalar o'tish joylari va turar joylar", uz_cyr: "Пиёдалар ўтиш жойлари ва турар жой", ru: "Пешеходные переходы и движение в жилых зонах" } },
      { id: "22", name: { uz_lat: "Temir yo'l kesishmalari va Avtomagistrallar", uz_cyr: "Темир йўл кесишмалари ва Автомагистраллар", ru: "Железнодорожные переезды и движение по автомагистралям" } },
      { id: "23", name: { uz_lat: "Yo'nalishli transport vositalarining imtiyozlari", uz_cyr: "Йўналишли транспорт воситаларининг имтиёзлари", ru: "Преимущества маршрутных транспортных средств" } },
      { id: "24", name: { uz_lat: "Shatakka olish", uz_cyr: "Транспорт воситаларини шатакка олиш", ru: "Буксировка транспортных средств" } },
      { id: "25", name: { uz_lat: "Yo'l harakati xavfsizligini ta'minlash", uz_cyr: "Йўл ҳаракати хавфсизлигини таъминлаш", ru: "Обучение вождению" } },
      { id: "26", name: { uz_lat: "Odam va yuk tashish", uz_cyr: "Одам ва юк ташиш", ru: "Перевозка людей и грузов" } },
      { id: "27", name: { uz_lat: "Harakatlanish taqiqlanadigan vaziyatlar", uz_cyr: "ҳаракатланиш тақиқланадиган вазиятлар", ru: "Ситуации, когда запрещено движение транспортных средств" } },
    ],
  },
  {
    key: "xavfsizlik",
    title: { uz_lat: "Xavfsizlik va yordam", uz_cyr: "Хавфсизлик ва ёрдам", ru: "Безопасность и помощь" },
    topics: [
      { id: "28", name: { uz_lat: "Harakat xavfsizligini ta'minlash 1", uz_cyr: "Ҳаракат хавфсизлигини таъминлаш 1", ru: "Обеспечение безопасности движения 1" } },
      { id: "29", name: { uz_lat: "Harakat xavfsizligini ta'minlash 2", uz_cyr: "Ҳаракат хавфсизлигини таъминлаш 2", ru: "Обеспечение безопасности движения 2" } },
      { id: "30", name: { uz_lat: "Birinchi tibbiy yordam", uz_cyr: "Биринчи тиббий ёрдам", ru: "Первая медицинская помощь" } },
    ],
  },
];

const topics: Topic[] = topicCategories.flatMap((c) => c.topics);

const languages = [
  { id: "uz-lat" as const, label: "O'zbekcha" },
  { id: "uz" as const, label: "Ўзбекча" },
  { id: "ru" as const, label: "Русский" },
];

export default function MavzuliTestlar() {
  const { user, profile, isLoading } = useAuth();
  const { language, setLanguage } = useLanguage();
  const navigate = useNavigate();

  // Storage keys are user-specific to prevent test state leaking across users on the same device.
  const mavzuliStorageKey = `mavzuli_activeTest_${user?.id ?? 'guest'}`;

  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [testStarted, setTestStarted] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [startError, setStartError] = useState<string | null>(null);

  useEffect(() => {
    try {
      const saved = localStorage.getItem(mavzuliStorageKey);
      if (!saved) {
        setTestStarted(false);
        setSelectedTopic(null);
        setSessionId(null);
        return;
      }
      const parsed = JSON.parse(saved);
      if (parsed.testStarted && parsed.selectedTopic) {
        const userId = user?.id ?? 'guest';
        const testKey = `testState_mavzuli_${parsed.selectedTopic}_${userId}`;
        if (!localStorage.getItem(testKey)) {
          localStorage.removeItem(mavzuliStorageKey);
          setTestStarted(false);
          setSelectedTopic(null);
          setSessionId(null);
          return;
        }
        setTestStarted(true);
        setSelectedTopic(parsed.selectedTopic as string);
        setSessionId((parsed.sessionId ?? null) as string | null);
        return;
      }
      setTestStarted(false);
      setSelectedTopic(null);
      setSessionId(null);
    } catch {
      setTestStarted(false);
      setSelectedTopic(null);
      setSessionId(null);
    }
  }, [mavzuliStorageKey, user?.id]);

  // PRO users can enter mavzuli; guests see PRO gate (no auth redirect)
  const { hasAccess, loading: accessLoading } = useProAccess({
    redirectPath: '/pro',
    redirectGuestsToAuth: false,
    redirectWithoutAccess: false,
  });
  const { backendConfirmed, refresh } = useAccessState();
  const { starting, startSession } = useTestSession();
  const { isDark } = useDarkMode();

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
      <div className="min-h-screen bg-background">
        {/* Mobile Layout */}
        <div className="lg:hidden bg-background pb-4">
          <div className="bg-card border-b border-border p-4">
            <div className="flex items-center justify-between mb-3">
              <Link to="/">
                <Button variant="outline" size="sm" className="gap-2">
                  <Home className="w-4 h-4" />
                  Bosh sahifa
                </Button>
              </Link>
              {user ? (
                <Button variant="outline" size="sm" onClick={() => navigate('/profile')} className="gap-2">
                  <User className="w-4 h-4" />
                  <span className="text-xs">{profile?.full_name || profile?.username || 'Profil'}</span>
                </Button>
              ) : (
                <Button size="sm" onClick={() => navigate('/auth')} className="gap-2">
                  <LogIn className="w-4 h-4" />
                  <span className="text-xs">Kirish</span>
                </Button>
              )}
            </div>
            <div className="flex gap-2">
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
          </div>

          {/* Sticky: faqat boshlash tugmasi */}
          <div className="sticky top-0 z-30 bg-card/95 backdrop-blur-sm border-b border-border px-4 py-2.5 shadow-sm">
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
              {selectedTopic ? "Testni boshlash" : "Mavzuni tanlang"}
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
              <div className="mt-2 flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <p className="text-xs text-red-700">{startError}</p>
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

        {/* Desktop Layout */}
        <div className={`hidden lg:flex h-screen overflow-hidden bg-background text-foreground${isDark ? ' dark' : ''}`}>
          <div className="w-[30%] bg-card border-r border-border p-6 flex flex-col">
            <div className="flex-1 flex flex-col">
              <div className="mb-4">
                <Link to="/">
                  <Button variant="outline" size="sm" className="gap-2">
                    <Home className="w-4 h-4" />
                    Bosh sahifa
                  </Button>
                </Link>
              </div>
              <div className="mb-4">
                {user ? (
                  <Button variant="outline" onClick={() => navigate('/profile')} className="w-full flex items-center gap-2 h-auto py-2.5 px-3 justify-start">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-primary" />
                    </div>
                    <div className="flex-1 text-left min-w-0">
                      <div className="font-semibold text-xs truncate">{profile?.full_name || profile?.username || 'Profil'}</div>
                      {profile?.username && profile?.full_name && (
                        <div className="text-[10px] text-muted-foreground truncate">@{profile.username}</div>
                      )}
                    </div>
                  </Button>
                ) : (
                  <Button onClick={() => navigate('/auth')} className="w-full gap-2" size="sm">
                    <LogIn className="w-4 h-4" />
                    Kirish
                  </Button>
                )}
              </div>
              <div className="mb-4">
                <h3 className="text-xs font-medium text-muted-foreground mb-2">Til tanlash</h3>
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
                <div className="mb-3 flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                  <p className="text-xs text-red-700">{startError}</p>
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
                {selectedTopic ? "Testni boshlash" : "Mavzuni tanlang"}
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
