import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Home, BookOpen, Car, FileText, Clock, CheckCircle, HelpCircle, ChevronDown, ChevronUp, User, LogIn, Globe } from "lucide-react";

interface TestStartPageProps {
  onStartTest: (variant: number) => void;
}

const languages = [
  { id: "uz-lat" as const, label: "O'zbekcha", flag: "🇺🇿" },
  { id: "uz" as const, label: "Ўзбекча", flag: "🇺🇿" },
  { id: "ru" as const, label: "Русский", flag: "🇷🇺" },
];

// All 55 variants
const TOTAL_VARIANTS = 55;
const variants = Array.from({ length: TOTAL_VARIANTS }, (_, i) => i + 1);

export const TestStartPage = ({ onStartTest }: TestStartPageProps) => {
  const [selectedVariant, setSelectedVariant] = useState<number | null>(null);
  const [showAllVariants, setShowAllVariants] = useState(false);
  const { language, setLanguage, t } = useLanguage();
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const categories = [
    { id: "theory", label: t("categories.theory"), icon: BookOpen, color: "bg-blue-500" },
    { id: "signs", label: t("categories.signs"), icon: FileText, color: "bg-green-500" },
    { id: "driving", label: t("categories.driving"), icon: Car, color: "bg-orange-500" },
    { id: "rules", label: t("categories.rules"), icon: Globe, color: "bg-purple-500" },
  ];

  const handleStartTest = () => {
    if (selectedVariant !== null) {
      onStartTest(selectedVariant);
    }
  };

  // Show first 20 variants by default, all when expanded
  const visibleVariants = showAllVariants ? variants : variants.slice(0, 20);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Mobile Layout */}
      <div className="lg:hidden flex flex-col h-screen overflow-hidden">
        {/* Mobile Header - Profile Section */}
        <header className="bg-card/80 backdrop-blur-sm border-b border-border px-4 py-3 shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Link to="/">
                <Button variant="outline" size="sm" className="gap-1">
                  <Home className="w-4 h-4" />
                </Button>
              </Link>
              {user ? (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => navigate('/profile')}
                  className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-md"
                >
                  <User className="w-4 h-4" />
                  <span className="text-sm font-medium">{profile?.full_name || profile?.username || 'Profil'}</span>
                </Button>
              ) : (
                <Button
                  variant="default"
                  size="sm"
                  onClick={() => navigate('/auth')}
                  className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground shadow-md"
                >
                  <LogIn className="w-4 h-4" />
                  <span className="text-sm font-medium">Kirish</span>
                </Button>
              )}
            </div>
            {/* Language quick switch */}
            <div className="flex gap-1">
              {languages.map((lang) => (
                <Button
                  key={lang.id}
                  variant={language === lang.id ? "secondary" : "ghost"}
                  size="sm"
                  className="px-2 h-8"
                  onClick={() => setLanguage(lang.id)}
                >
                  <span className="text-sm">{lang.flag}</span>
                </Button>
              ))}
            </div>
          </div>
        </header>

        <main className="flex-1 flex flex-col px-3 py-3 gap-2 overflow-y-auto">
          {/* Language Selection - Mobile */}
          <Card className="w-full p-2.5 bg-card/50 backdrop-blur-sm border-border shrink-0">
            <h2 className="text-[10px] font-medium text-muted-foreground mb-1.5 text-center">{t("test.selectLanguage")}</h2>
            <div className="grid grid-cols-3 gap-1.5">
              {languages.map((lang) => (
                <Button
                  key={lang.id}
                  variant={language === lang.id ? "default" : "outline"}
                  className={`flex flex-col items-center gap-0 h-auto py-1.5 text-xs ${
                    language === lang.id 
                      ? "bg-primary text-primary-foreground" 
                      : "hover:bg-primary/10 hover:border-primary"
                  }`}
                  onClick={() => setLanguage(lang.id)}
                >
                  <span className="text-base">{lang.flag}</span>
                  <span className="text-[9px] font-medium">{lang.label}</span>
                </Button>
              ))}
            </div>
          </Card>

          {/* Variant Selection - Mobile */}
          <Card className="w-full p-2.5 bg-card/50 backdrop-blur-sm border-border shrink-0">
            <h2 className="text-[10px] font-medium text-muted-foreground mb-1.5 text-center">{t("test.selectVariant")}</h2>
            <div className="grid grid-cols-5 gap-1.5">
              {visibleVariants.map((v) => (
                <Button
                  key={v}
                  variant={selectedVariant === v ? "default" : "outline"}
                  className={`h-8 text-xs font-medium ${
                    selectedVariant === v 
                      ? "bg-primary text-primary-foreground" 
                      : "hover:bg-primary/10 hover:border-primary"
                  }`}
                  onClick={() => setSelectedVariant(v)}
                >
                  {v}
                </Button>
              ))}
            </div>
            {TOTAL_VARIANTS > 20 && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full mt-1.5 text-[10px] text-muted-foreground h-6"
                onClick={() => setShowAllVariants(!showAllVariants)}
              >
                {showAllVariants ? (
                  <>
                    <ChevronUp className="w-3 h-3 mr-1" />
                    {language === 'ru' ? 'Скрыть' : language === 'uz' ? 'Яшириш' : 'Yashirish'}
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3 h-3 mr-1" />
                    {language === 'ru' ? `Показать все (${TOTAL_VARIANTS})` : language === 'uz' ? `Барчасини кўрсатиш (${TOTAL_VARIANTS})` : `Barchasini ko'rsatish (${TOTAL_VARIANTS})`}
                  </>
                )}
              </Button>
            )}
          </Card>

          {/* Start Button - Mobile */}
          <Button
            size="default"
            className="w-full h-10 text-sm font-semibold shadow-lg bg-primary hover:bg-primary/90 shrink-0"
            onClick={handleStartTest}
            disabled={selectedVariant === null}
          >
            {selectedVariant ? `${t("test.variant")} ${selectedVariant} - ${t("test.start")}` : t("test.selectVariantFirst")}
          </Button>

          {/* Quick Stats - Mobile */}
          <div className="w-full grid grid-cols-3 gap-1.5 shrink-0">
            <Card className="p-1.5 text-center bg-card/50 backdrop-blur-sm border-border">
              <div className="text-base font-bold text-primary">20</div>
              <div className="text-[9px] text-muted-foreground">{t("test.questions")}</div>
            </Card>
            <Card className="p-1.5 text-center bg-card/50 backdrop-blur-sm border-border">
              <div className="text-base font-bold text-primary">30</div>
              <div className="text-[9px] text-muted-foreground">{t("test.minutes")}</div>
            </Card>
            <Card className="p-1.5 text-center bg-card/50 backdrop-blur-sm border-border">
              <div className="text-base font-bold text-primary">80%</div>
              <div className="text-[9px] text-muted-foreground">{t("test.passingScore")}</div>
            </Card>
          </div>

          {/* Instructions - Mobile */}
          <Card className="w-full p-2 bg-card/50 backdrop-blur-sm border-border shrink-0">
            <h3 className="text-[10px] font-semibold text-foreground mb-0.5">{t("test.instructions")}:</h3>
            <ul className="text-[9px] text-muted-foreground space-y-0">
              <li>• {t("test.instruction1")}</li>
              <li>• {t("test.instruction2")}</li>
              <li>• {t("test.instruction3")}</li>
            </ul>
          </Card>
        </main>
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:flex h-screen overflow-hidden">
        {/* Left Sidebar - Desktop */}
        <aside className="w-80 xl:w-96 bg-card border-r border-border p-6 flex flex-col overflow-y-auto">
          {/* Back to Home */}
          <Link to="/" className="mb-4">
            <Button variant="outline" className="w-full gap-2">
              <Home className="w-4 h-4" />
              Bosh sahifa
            </Button>
          </Link>

          {/* Profile Section */}
          <div className="mb-6 pb-6 border-b border-border">
            {user ? (
              <Button
                variant="default"
                onClick={() => navigate('/profile')}
                className="w-full flex items-center gap-3 h-auto py-3 px-4 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
              >
                <div className="w-10 h-10 rounded-full bg-primary-foreground/20 flex items-center justify-center flex-shrink-0">
                  <User className="w-5 h-5" />
                </div>
                <div className="flex-1 text-left">
                  <div className="font-semibold text-base">{profile?.full_name || profile?.username || 'Profil'}</div>
                  {profile?.username && profile?.full_name && (
                    <div className="text-xs text-primary-foreground/70">@{profile.username}</div>
                  )}
                </div>
              </Button>
            ) : (
              <Button
                variant="default"
                onClick={() => navigate('/auth')}
                className="w-full flex items-center gap-3 h-auto py-3 px-4 bg-primary hover:bg-primary/90 text-primary-foreground shadow-lg"
              >
                <LogIn className="w-5 h-5" />
                <span className="font-semibold">Kirish</span>
              </Button>
            )}
          </div>

          {/* Language Selection - Desktop */}
          <div className="mb-6">
            <h2 className="text-sm font-medium text-muted-foreground mb-3">{t("test.selectLanguage")}</h2>
            <div className="flex gap-2">
              {languages.map((lang) => (
                <Button
                  key={lang.id}
                  variant={language === lang.id ? "default" : "outline"}
                  className={`flex-1 flex flex-col items-center gap-1 h-auto py-2.5 ${
                    language === lang.id 
                      ? "bg-primary text-primary-foreground" 
                      : "hover:bg-primary/10 hover:border-primary"
                  }`}
                  onClick={() => setLanguage(lang.id)}
                >
                  <span className="text-xl">{lang.flag}</span>
                  <span className="text-xs font-medium">{lang.label}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Variant Selection - Desktop */}
          <div className="mb-6">
            <h2 className="text-sm font-medium text-muted-foreground mb-3">{t("test.selectVariant")}</h2>
            <div className="grid grid-cols-5 gap-2">
              {visibleVariants.map((v) => (
                <Button
                  key={v}
                  variant={selectedVariant === v ? "default" : "outline"}
                  className={`h-9 text-sm font-medium ${
                    selectedVariant === v 
                      ? "bg-primary text-primary-foreground" 
                      : "hover:bg-primary/10 hover:border-primary"
                  }`}
                  onClick={() => setSelectedVariant(v)}
                >
                  {v}
                </Button>
              ))}
            </div>
            {TOTAL_VARIANTS > 20 && (
              <Button
                variant="ghost"
                size="sm"
                className="w-full mt-2 text-xs text-muted-foreground"
                onClick={() => setShowAllVariants(!showAllVariants)}
              >
                {showAllVariants ? (
                  <>
                    <ChevronUp className="w-3.5 h-3.5 mr-1" />
                    {language === 'ru' ? 'Скрыть' : language === 'uz' ? 'Яшириш' : 'Yashirish'}
                  </>
                ) : (
                  <>
                    <ChevronDown className="w-3.5 h-3.5 mr-1" />
                    {language === 'ru' ? `Показать все (${TOTAL_VARIANTS})` : language === 'uz' ? `Барчасини кўрсатиш (${TOTAL_VARIANTS})` : `Barchasini ko'rsatish (${TOTAL_VARIANTS})`}
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Category Options - Desktop */}
          <div className="mb-6">
            <h2 className="text-sm font-medium text-muted-foreground mb-3">{t("test.selectCategory")}</h2>
            <div className="grid grid-cols-2 gap-3">
              {categories.map((cat) => (
                <Button
                  key={cat.id}
                  variant="outline"
                  className="flex flex-col items-center gap-2 h-auto py-3 hover:bg-primary/10 hover:border-primary"
                >
                  <div className={`w-9 h-9 rounded-full ${cat.color} flex items-center justify-center`}>
                    <cat.icon className="w-4 h-4 text-white" />
                  </div>
                  <span className="text-xs font-medium">{cat.label}</span>
                </Button>
              ))}
            </div>
          </div>

          {/* Instructions - Desktop */}
          <Card className="p-4 bg-muted/30 border-border mt-auto">
            <h3 className="text-sm font-semibold text-foreground mb-2">{t("test.instructions")}:</h3>
            <ul className="text-xs text-muted-foreground space-y-1">
              <li>• {t("test.instruction1")}</li>
              <li>• {t("test.instruction2")}</li>
              <li>• {t("test.instruction3")}</li>
            </ul>
          </Card>
        </aside>

        {/* Main Content - Desktop */}
        <main className="flex-1 flex flex-col items-center justify-center p-8 bg-gradient-to-br from-background to-primary/5 overflow-y-auto">
          {/* Centered Test Start Section */}
          <div className="w-full max-w-2xl text-center">
            {/* Hero Section */}
            <div className="flex flex-col items-center gap-4 mb-8">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                <Car className="w-10 h-10 text-primary" />
              </div>
              <div>
                <h2 className="text-3xl font-bold text-foreground mb-2">{t("test.ready")}</h2>
                <p className="text-base text-muted-foreground leading-relaxed max-w-md mx-auto">{t("test.readyDescription")}</p>
              </div>
            </div>

            {/* Stats Cards - Desktop */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <Card className="p-4 bg-card border-border text-center">
                <HelpCircle className="w-6 h-6 text-primary mx-auto mb-2" />
                <div className="text-2xl font-bold text-foreground">20</div>
                <div className="text-xs text-muted-foreground mt-1">{t("test.questions")}</div>
              </Card>
              <Card className="p-4 bg-card border-border text-center">
                <Clock className="w-6 h-6 text-primary mx-auto mb-2" />
                <div className="text-2xl font-bold text-foreground">30</div>
                <div className="text-xs text-muted-foreground mt-1">{t("test.minutes")}</div>
              </Card>
              <Card className="p-4 bg-card border-border text-center">
                <CheckCircle className="w-6 h-6 text-primary mx-auto mb-2" />
                <div className="text-2xl font-bold text-foreground">80%</div>
                <div className="text-xs text-muted-foreground mt-1">{t("test.passingScore")}</div>
              </Card>
            </div>

            {/* Selected Variant Display */}
            {selectedVariant && (
              <div className="mb-4 text-base font-semibold text-primary">
                {t("test.selected")}: {t("test.variant")} {selectedVariant}
              </div>
            )}

            {/* Start Button - Desktop */}
            <Button
              size="lg"
              className="w-full h-12 text-base font-semibold shadow-lg hover:shadow-xl transition-all duration-300 bg-primary hover:bg-primary/90"
              onClick={handleStartTest}
              disabled={selectedVariant === null}
            >
              {selectedVariant ? `${t("test.variant")} ${selectedVariant} - ${t("test.startTest")}` : t("test.selectVariantFirst")}
            </Button>
          </div>
        </main>
      </div>
    </div>
  );
};