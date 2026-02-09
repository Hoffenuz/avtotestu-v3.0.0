import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { 
  Home, 
  Play, 
  Clock, 
  HelpCircle,
  CheckCircle
} from "lucide-react";
import { TestInterfaceBase } from "@/components/TestInterfaceBase";
import { TestInterfaceCombined } from "@/components/TestInterfaceCombined";

const languages = [
  { id: "uz-lat" as const, label: "Lotin", flag: "🇺🇿", file: "700baza2.json" },
  { id: "uz" as const, label: "Кирилл", flag: "🇺🇿", file: "700baza.json" },
  { id: "ru" as const, label: "Русский", flag: "🇷🇺", file: "700baza.json" },
];

export default function TestIshlash() {
  const [testStarted, setTestStarted] = useState(false);
  const [selectedLang, setSelectedLang] = useState<'uz-lat' | 'uz' | 'ru'>('uz-lat'); // Default to Latin
  const [questionCount, setQuestionCount] = useState<20 | 50>(20); // Default to 20 questions
  const { language, setLanguage } = useLanguage();
  const navigate = useNavigate();

  useEffect(() => {
    // Only sync if user has explicitly changed language elsewhere
    // Keep Latin as default for first-time users
  }, [language]);

  const dataFile = languages.find(l => l.id === selectedLang)?.file || "700baza2.json";

  if (testStarted) {
    // For 50 questions, use the same file as 20 questions (based on language selection)
    // Latin (uz-lat) uses 700baza2.json, Cyrillic (uz/ru) uses 700baza.json
    if (questionCount === 50) {
      return (
        <TestInterfaceCombined 
          onExit={() => setTestStarted(false)} 
          dataSources={[`/${dataFile}`]}
          testName="Test ishlash (50 ta)"
          questionCount={50}
          timeLimit={50 * 60}
          randomize={true}
        />
      );
    }
    
    return (
      <TestInterfaceBase 
        onExit={() => setTestStarted(false)} 
        dataSource={`/${dataFile}`}
        testName="Test ishlash"
        questionCount={20}
        timeLimit={25 * 60}
        randomize={true}
      />
    );
  }

  const handleLanguageChange = (langId: 'uz-lat' | 'uz' | 'ru') => {
    setSelectedLang(langId);
    setLanguage(langId);
  };

  const timeLimit = questionCount === 20 ? 25 : 50;
  const passingPercent = 90;

  return (
    <>
      <SEO 
        title="Test ishlash - 700+ savoldan onlayn test"
        description="700+ savoldan 20 yoki 50 ta tasodifiy savol bilan o'zingizni sinab ko'ring. Haqiqiy imtihon formatida test ishlang. Ro'yxatdan o'tish shart emas."
        path="/test-ishlash"
        keywords="test ishlash, onlayn test, prava test, YHQ savollari, bepul test"
      />
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex flex-col">
      {/* Top Navigation Bar */}
      <header className="w-full bg-card/80 backdrop-blur-sm border-b border-border px-4 py-3">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link to="/">
            <Button variant="ghost" size="sm" className="gap-2 hover:bg-primary/10">
              <Home className="w-4 h-4" />
              <span className="hidden sm:inline">Bosh sahifa</span>
            </Button>
          </Link>

          {/* Language Toggle */}
          <div className="flex items-center gap-1 bg-background border border-border rounded-lg p-1">
            {languages.map((lang) => (
              <Button
                key={lang.id}
                variant={selectedLang === lang.id ? "default" : "ghost"}
                size="sm"
                className={`px-2 sm:px-3 py-1 h-8 text-xs ${
                  selectedLang === lang.id 
                    ? "bg-primary text-primary-foreground" 
                    : "hover:bg-primary/10"
                }`}
                onClick={() => handleLanguageChange(lang.id)}
              >
                {/* Show flags only on desktop */}
                <span className="hidden sm:inline mr-1">{lang.flag}</span>
                <span>{lang.label}</span>
              </Button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content - Centered */}
      <main className="flex-1 flex items-center justify-center px-4 py-6">
        <div className="w-full max-w-md text-center space-y-6">
          {/* Icon & Title */}
          <div className="flex flex-col items-center gap-3">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-primary/80 flex items-center justify-center shadow-lg">
              <Play className="w-8 h-8 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-foreground" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                Test ishlash
              </h1>
              <p className="text-muted-foreground mt-1">
                700+ savoldan {questionCount} ta tasodifiy
              </p>
            </div>
          </div>

          {/* Question Count Toggle - Redesigned for visibility */}
          <div className="w-full bg-card border-2 border-primary/30 rounded-2xl p-4 shadow-lg">
            <p className="text-sm font-medium text-muted-foreground mb-3 text-center">
              Savollar sonini tanlang
            </p>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setQuestionCount(20)}
                className={`relative flex flex-col items-center justify-center py-4 px-4 rounded-xl border-2 transition-all duration-200 ${
                  questionCount === 20 
                    ? "border-primary bg-primary/10 shadow-md" 
                    : "border-border bg-background hover:border-primary/50 hover:bg-primary/5"
                }`}
              >
                {questionCount === 20 && (
                  <span className="absolute -top-2 -right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                    <CheckCircle className="w-3.5 h-3.5 text-primary-foreground" />
                  </span>
                )}
                <span className={`text-2xl font-bold ${questionCount === 20 ? "text-primary" : "text-foreground"}`}>
                  20
                </span>
                <span className="text-xs text-muted-foreground mt-1">savollar</span>
                <span className="text-xs text-muted-foreground">25 daqiqa</span>
              </button>
              <button
                onClick={() => setQuestionCount(50)}
                className={`relative flex flex-col items-center justify-center py-4 px-4 rounded-xl border-2 transition-all duration-200 ${
                  questionCount === 50 
                    ? "border-primary bg-primary/10 shadow-md" 
                    : "border-border bg-background hover:border-primary/50 hover:bg-primary/5"
                }`}
              >
                {questionCount === 50 && (
                  <span className="absolute -top-2 -right-2 w-5 h-5 bg-primary rounded-full flex items-center justify-center">
                    <CheckCircle className="w-3.5 h-3.5 text-primary-foreground" />
                  </span>
                )}
                <span className={`text-2xl font-bold ${questionCount === 50 ? "text-primary" : "text-foreground"}`}>
                  50
                </span>
                <span className="text-xs text-muted-foreground mt-1">savollar</span>
                <span className="text-xs text-muted-foreground">50 daqiqa</span>
              </button>
            </div>
          </div>

          {/* Stats Row */}
          <div className="flex justify-center gap-6 sm:gap-10">
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-2">
                <HelpCircle className="w-6 h-6 text-primary" />
              </div>
              <span className="text-xl font-bold text-foreground">{questionCount}</span>
              <span className="text-xs text-muted-foreground">Savollar</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-2">
                <Clock className="w-6 h-6 text-primary" />
              </div>
              <span className="text-xl font-bold text-foreground">{timeLimit}</span>
              <span className="text-xs text-muted-foreground">Daqiqa</span>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-2">
                <CheckCircle className="w-6 h-6 text-primary" />
              </div>
              <span className="text-xl font-bold text-foreground">{passingPercent}%</span>
              <span className="text-xs text-muted-foreground">O'tish</span>
            </div>
          </div>

          {/* Start Button */}
          <Button
            size="lg"
            className="w-full h-14 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 bg-[hsl(var(--cta-green))] hover:bg-[hsl(var(--cta-green-hover))] rounded-xl"
            onClick={() => setTestStarted(true)}
          >
            <Play className="w-5 h-5 mr-2" />
            Testni boshlash
          </Button>

          {/* Info text */}
          <p className="text-xs text-muted-foreground">
            Testni boshlash uchun ro'yxatdan o'tish shart emas
          </p>
        </div>
      </main>
    </div>
    </>
  );
}