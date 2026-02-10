import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserValidation } from "@/hooks/useUserValidation";
import { MainLayout } from "@/components/layout/MainLayout";
import { SEO } from "@/components/SEO";
import { MavzuliTestInterface } from "@/components/MavzuliTestInterface";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { User, LogIn, ChevronDown, ChevronUp, BookOpen, Play, Clock, CheckCircle, HelpCircle, Home } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

const topics = [
  { id: '31', name: 'Barcha savollar' },
  { id: '1', name: "Umumiy qoidalar" },
  { id: '3', name: "Ogohlantiruvchi belgilar" },
  { id: '4', name: "Imtiyoz belgilar" },
  { id: '5', name: "Taqiqlovchi belgilar" },
  { id: '6', name: "Buyuruvchi belgilar" },
  { id: '7', name: "Axborot ishora belgilari" },
  { id: '8', name: "Qo'shimcha axborot belgilari" },
  { id: '20', name: "Chorrahalarda harakatlanish" },
  { id: '34', name: "Teng ahamiyatli chorrahalar" },
  { id: '9', name: "Yotiq chiziqlar 1" },
  { id: '10', name: "Yotiq va tik chiziqlar 2" },
  { id: '11', name: "Svetafor ishoralari" },
  { id: '12', name: "Tartibga soluvchining ishoralari" },
  { id: '13', name: "Ogohlantiruvchi va avariya ishoralari" },
  { id: '14', name: "Harakatlanishni (Manyovir) boshlash" },
  { id: '15', name: "Yo'lning qatnov qismida transport vositalarining joylashuvi" },
  { id: '16', name: "Harakatlanish tezligi" },
  { id: '17', name: "Quvib o'tish" },
  { id: '18', name: "To'xtash va to'xtab turish qoidalari 1" },
  { id: '19', name: "To'xtash va to'xtab turish qoidalari 2" },
  { id: '33', name: "Tartibga solinmagan chorrahada asosiy yo'l" },
  { id: '2', name: "Haydovchining umumiy vazifalari va piyodalar" },
  { id: '21', name: "Piyodalar o'tish joylari va turar joy dahalarida harakatlanish" },
  { id: '22', name: "Temir yo'l kesishmalari va Avtomagistrallarda harakat" },
  { id: '23', name: "Yo'nalishli transport vositalarining imtiyozlari va tashqi yoritish" },
  { id: '24', name: "Transport vositalarini shatakka olish" },
  { id: '25', name: "Transport boshqarishni o'rganish va Yo'l harakati xavfsizligini ta'minlash" },
  { id: '26', name: "Odam va yuk tashish" },
  { id: '27', name: "Transport vositalarida harakatlanish taqiqlanadigan vaziyatlar" },
  { id: '28', name: "Harakat xavfsizligini ta'minlash 1" },
  { id: '29', name: "Harakat xavfsizligini ta'minlash 2" },
  { id: '30', name: "Birinchi tibbiy yordam" },
];

const languages = [
  { id: "uz-lat" as const, label: "Lotin", flag: "🇺🇿" },
  { id: "uz" as const, label: "Кирилл", flag: "🇺🇿" },
  { id: "ru" as const, label: "Русский", flag: "🇷🇺" },
];

export default function MavzuliTestlar() {
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);
  const [testStarted, setTestStarted] = useState(false);
  const [showAllTopics, setShowAllTopics] = useState(false);
  const { user, profile, isLoading } = useAuth();
  const { language, setLanguage } = useLanguage();
  const navigate = useNavigate();

  // Validate user exists in database on page load
  useUserValidation('/auth');

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!isLoading && !user) {
      navigate('/auth', { state: { returnTo: '/mavzuli' } });
    }
  }, [user, isLoading, navigate]);

  if (isLoading) {
    return (
      <MainLayout>
        <SEO 
          title="Mavzuli testlar - YHQ bo'yicha mavzular"
          description="Yo'l harakati qoidalari bo'yicha mavzuli testlar. Belgilar, chorrahalar, tezlik va boshqa mavzular bo'yicha bilimlaringizni sinang."
          path="/mavzuli"
          keywords="mavzuli test, YHQ mavzulari, yo'l qoidalari, chorrahalar, tezlik qoidalari"
        />
        <div className="min-h-[60vh] flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      </MainLayout>
    );
  }

  if (!user) {
    return null;
  }

  // On mobile, start test immediately when topic is selected
  const handleTopicSelect = (topicId: string) => {
    setSelectedTopic(topicId);
    // Check if mobile (screen width < 1024px)
    if (window.innerWidth < 1024) {
      setTestStarted(true);
    }
  };

  const handleStartTest = () => {
    if (selectedTopic !== null) {
      setTestStarted(true);
    }
  };

  const visibleTopics = showAllTopics ? topics : topics.slice(0, 12);

  if (testStarted && selectedTopic) {
    const topicName = topics.find(t => t.id === selectedTopic)?.name || '';
    return (
      <MavzuliTestInterface
        onExit={() => {
          setTestStarted(false);
          setSelectedTopic(null);
        }}
        topicId={selectedTopic}
        topicName={topicName}
      />
    );
  }

  return (
    <MainLayout>
      <div className="h-[calc(100vh-64px)] bg-gradient-to-br from-background via-background to-primary/5 overflow-hidden">
        <div className="flex flex-col lg:flex-row h-full">
          {/* Left Sidebar - Compact */}
          <aside className="w-full lg:w-80 bg-card border-b lg:border-b-0 lg:border-r border-border p-3 lg:p-4 flex flex-col overflow-hidden">
            {/* Top Bar: Home + Language */}
            <div className="flex items-center justify-between mb-3">
              <Link to="/">
                <Button variant="outline" size="sm" className="gap-1.5">
                  <Home className="w-3.5 h-3.5" />
                  <span className="text-xs">Bosh sahifa</span>
                </Button>
              </Link>

              {/* Language Toggle */}
              <div className="flex items-center gap-0.5 bg-background border border-border rounded-md p-0.5">
                {languages.map((lang) => (
                  <Button
                    key={lang.id}
                    variant={language === lang.id ? "default" : "ghost"}
                    size="sm"
                    className={`px-2 py-1 h-7 text-xs ${
                      language === lang.id 
                        ? "bg-primary text-primary-foreground" 
                        : "hover:bg-primary/10"
                    }`}
                    onClick={() => setLanguage(lang.id)}
                  >
                    {lang.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Profile Section - Compact */}
            <div className="mb-3 pb-3 border-b border-border">
              {user ? (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => navigate('/profile')}
                  className="w-full flex items-center gap-2 bg-primary hover:bg-primary-hover text-primary-foreground"
                >
                  <User className="w-4 h-4" />
                  <span className="font-medium text-sm truncate">{profile?.full_name || profile?.username || 'Profil'}</span>
                </Button>
              ) : (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => navigate('/auth')}
                  className="w-full flex items-center gap-2 bg-primary hover:bg-primary-hover text-primary-foreground"
                >
                  <LogIn className="w-4 h-4" />
                  <span className="font-medium text-sm">Kirish</span>
                </Button>
              )}
            </div>

            {/* Topic Selection - Scrollable */}
            <div className="flex-1 overflow-y-auto min-h-0">
              <h2 className="text-xs font-medium text-muted-foreground mb-2 flex items-center gap-1.5 sticky top-0 bg-card py-1">
                <BookOpen className="w-3.5 h-3.5" />
                Mavzuni tanlang
              </h2>
              <div className="space-y-1">
                {visibleTopics.map((topic) => (
                  <Button
                    key={topic.id}
                    variant={selectedTopic === topic.id ? "default" : "outline"}
                    className={`w-full justify-start text-left h-auto py-2 px-3 ${
                      selectedTopic === topic.id 
                        ? "bg-primary text-primary-foreground" 
                        : "hover:bg-primary/10 hover:border-primary"
                    }`}
                    onClick={() => handleTopicSelect(topic.id)}
                  >
                    <span className="text-xs font-medium line-clamp-1">{topic.name}</span>
                  </Button>
                ))}
              </div>
              {topics.length > 12 && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="w-full mt-2 text-xs text-muted-foreground"
                  onClick={() => setShowAllTopics(!showAllTopics)}
                >
                  {showAllTopics ? (
                    <>
                      <ChevronUp className="w-3 h-3 mr-1" />
                      Yashirish
                    </>
                  ) : (
                    <>
                      <ChevronDown className="w-3 h-3 mr-1" />
                      Barchasini ko'rsatish ({topics.length})
                    </>
                  )}
                </Button>
              )}
            </div>
          </aside>

          {/* Main Content - Compact */}
          <main className="flex-1 flex flex-col items-center justify-center p-4 lg:p-6 bg-gradient-to-br from-background to-primary/5 overflow-hidden">
            <div className="w-full max-w-xl text-center">
              {/* Header - Compact */}
              <div className="flex items-center justify-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                  <BookOpen className="w-6 h-6 text-primary" />
                </div>
                <div className="text-left">
                  <h2 className="text-xl lg:text-2xl font-bold text-foreground" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    Mavzuli Testlar
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    Mavzu bo'yicha bilimingizni sinang
                  </p>
                </div>
              </div>

              {/* Stats - Compact */}
              <div className="grid grid-cols-3 gap-3 mb-4">
                <Card className="p-3 bg-card border-border text-center">
                  <HelpCircle className="w-5 h-5 text-primary mx-auto mb-1" />
                  <div className="text-xl font-bold text-foreground">{topics.length}</div>
                  <div className="text-xs text-muted-foreground">Mavzular</div>
                </Card>
                <Card className="p-3 bg-card border-border text-center">
                  <Clock className="w-5 h-5 text-primary mx-auto mb-1" />
                  <div className="text-xl font-bold text-foreground">60</div>
                  <div className="text-xs text-muted-foreground">daqiqa</div>
                </Card>
                <Card className="p-3 bg-card border-border text-center">
                  <CheckCircle className="w-5 h-5 text-primary mx-auto mb-1" />
                  <div className="text-xl font-bold text-foreground">80%</div>
                  <div className="text-xs text-muted-foreground">O'tish balli</div>
                </Card>
              </div>

              {selectedTopic && (
                <div className="mb-3 p-3 bg-primary/10 rounded-lg">
                  <span className="text-sm font-semibold text-primary">
                    Tanlangan: {topics.find(t => t.id === selectedTopic)?.name}
                  </span>
                </div>
              )}

              <Button
                size="lg"
                className="w-full h-12 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 bg-[hsl(var(--cta-green))] hover:bg-[hsl(var(--cta-green-hover))]"
                onClick={handleStartTest}
                disabled={selectedTopic === null}
              >
                <Play className="w-5 h-5 mr-2" />
                {selectedTopic ? "Testni boshlash" : "Mavzuni tanlang"}
              </Button>
            </div>
          </main>
        </div>
      </div>
    </MainLayout>
  );
}
