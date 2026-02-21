import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useTestResults } from "@/hooks/useTestResults";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Home, BookOpen, Car, FileText, Clock, CheckCircle, HelpCircle, ChevronDown, ChevronUp, User, LogIn, Globe, Play } from "lucide-react";

interface TestStartPageProps {
  onStartTest: (variant: number) => void;
}

const languages = [
  { id: "uz-lat" as const, label: "O'zbekcha", flag: "🇺🇿" },
  { id: "uz" as const, label: "Ўзбекча", flag: "🇺🇿" },
  { id: "ru" as const, label: "Русский", flag: "🇷🇺" },
];

// All 61 variants
const TOTAL_VARIANTS = 61;
const variants = Array.from({ length: TOTAL_VARIANTS }, (_, i) => i + 1);

export const TestStartPage = ({ onStartTest }: TestStartPageProps) => {
  const [selectedVariant, setSelectedVariant] = useState<number | null>(null);
  const [showAllVariants, setShowAllVariants] = useState(false);
  const { language, setLanguage, t } = useLanguage();
  const { user, profile } = useAuth();
  const { getVariantStatus, loading: resultsLoading } = useTestResults();
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

  const getVariantButtonClass = (v: number) => {
    const status = getVariantStatus(v);
    const isSelected = selectedVariant === v;
    
    if (status === 'success') {
      return isSelected
        ? 'bg-green-50 text-green-700 border-green-300 dark:bg-green-950 dark:text-green-300 dark:border-green-700'
        : 'bg-green-50/50 text-green-600 border-green-200 hover:bg-green-50 dark:bg-green-950/50 dark:text-green-400 dark:border-green-800';
    }
    if (status === 'failed') {
      return isSelected
        ? 'bg-red-50 text-red-700 border-red-300 dark:bg-red-950 dark:text-red-300 dark:border-red-700'
        : 'bg-red-50/50 text-red-600 border-red-200 hover:bg-red-50 dark:bg-red-950/50 dark:text-red-400 dark:border-red-800';
    }
    return isSelected
      ? 'bg-primary/10 text-primary border-primary'
      : 'bg-background text-foreground border-border hover:border-primary/50';
  };

  // Show first 20 variants by default, all when expanded
  const visibleVariants = showAllVariants ? variants : variants;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Mobile Layout */}
      <div className="lg:hidden flex flex-col min-h-screen bg-background">
        {/* Header */}
        <div className="bg-card border-b border-border p-4 sticky top-0 z-10">
          <div className="flex items-center justify-between mb-3">
            <Link to="/">
              <Button variant="outline" size="sm" className="gap-2">
                <Home className="w-4 h-4" />
                Bosh sahifa
              </Button>
            </Link>
            {user ? (
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/profile')}
                className="gap-2"
              >
                <User className="w-4 h-4" />
                <span className="text-xs">{profile?.full_name || profile?.username || 'Profil'}</span>
              </Button>
            ) : (
              <Button
                size="sm"
                onClick={() => navigate('/auth')}
                className="gap-2"
              >
                <LogIn className="w-4 h-4" />
                <span className="text-xs">Kirish</span>
              </Button>
            )}
          </div>

          {/* Language Selection */}
          <div className="flex gap-2">
            {languages.map((lang) => (
              <Button
                key={lang.id}
                variant="outline"
                size="sm"
                className={`flex-1 text-xs ${
                  language === lang.id 
                    ? "bg-primary text-primary-foreground border-primary" 
                    : ""
                }`}
                onClick={() => setLanguage(lang.id)}
              >
                {lang.flag} {lang.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Selected Variant & Start Button */}
        <div className="bg-card border-b border-border p-4">
          {selectedVariant ? (
            <div className="mb-3 p-4 bg-primary/5 rounded-lg border border-primary/20 text-center">
              <div className="text-5xl font-bold text-primary mb-1">{selectedVariant}</div>
              <div className="text-xs text-muted-foreground">{t("test.variant")} {selectedVariant}</div>
            </div>
          ) : (
            <div className="mb-3 p-4 bg-muted/30 rounded-lg border border-border text-center">
              <div className="text-sm text-muted-foreground">
                {language === 'ru' ? 'Выберите вариант ниже' : language === 'uz' ? 'Қуйидан вариант танланг' : 'Quyidan variant tanlang'}
              </div>
            </div>
          )}

          <Button
            size="lg"
            className="w-full gap-2"
            onClick={handleStartTest}
            disabled={selectedVariant === null}
          >
            <Play className="w-5 h-5" />
            {selectedVariant ? t("test.startTest") : t("test.selectVariantFirst")}
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 p-4 bg-muted/30">
          <div className="text-center p-2 bg-card rounded-lg border border-border">
            <div className="text-xl font-bold text-foreground">20</div>
            <div className="text-[10px] text-muted-foreground">{t("test.questions")}</div>
          </div>
          <div className="text-center p-2 bg-card rounded-lg border border-border">
            <div className="text-xl font-bold text-foreground">30</div>
            <div className="text-[10px] text-muted-foreground">{t("test.minutes")}</div>
          </div>
          <div className="text-center p-2 bg-card rounded-lg border border-border">
            <div className="text-xl font-bold text-foreground">90%</div>
            <div className="text-[10px] text-muted-foreground">{t("test.passingScore")}</div>
          </div>
        </div>

        {/* Variant Selection */}
        <div className="flex-1 p-4 overflow-y-auto">
          <h2 className="text-lg font-bold text-foreground mb-3">{t("test.selectVariant")}</h2>
          
          <div className="grid grid-cols-5 gap-2 mb-4">
            {visibleVariants.map((v) => (
              <Button
                key={v}
                variant="outline"
                className={`h-12 text-base font-semibold transition-all ${getVariantButtonClass(v)}`}
                onClick={() => setSelectedVariant(v)}
              >
                {v}
              </Button>
            ))}
          </div>

          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-green-100 border border-green-200 rounded dark:bg-green-950 dark:border-green-800" />
              <span>≥90%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-3 h-3 bg-red-100 border border-red-200 rounded dark:bg-red-950 dark:border-red-800" />
              <span>&lt;90%</span>
            </div>
          </div>
        </div>
      </div>

      {/* Desktop Layout */}
      <div className="hidden lg:flex h-screen overflow-hidden">
        {/* Left Side - Test Start Section (30%) */}
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

            {/* Profile Section */}
            <div className="mb-4">
              {user ? (
                <Button
                  variant="outline"
                  onClick={() => navigate('/profile')}
                  className="w-full flex items-center gap-2 h-auto py-2.5 px-3 justify-start"
                >
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
                <Button
                  onClick={() => navigate('/auth')}
                  className="w-full gap-2"
                  size="sm"
                >
                  <LogIn className="w-4 h-4" />
                  Kirish
                </Button>
              )}
            </div>

            {/* Language Selection */}
            <div className="mb-4">
              <h3 className="text-[10px] font-medium text-muted-foreground mb-1.5">{t("test.selectLanguage")}</h3>
              <div className="flex gap-1.5">
                {languages.map((lang) => (
                  <Button
                    key={lang.id}
                    variant="outline"
                    size="sm"
                    className={`flex-1 text-[11px] h-8 ${
                      language === lang.id 
                        ? "bg-primary text-primary-foreground border-primary" 
                        : ""
                    }`}
                    onClick={() => setLanguage(lang.id)}
                  >
                    {lang.label}
                  </Button>
                ))}
              </div>
            </div>

            {/* Selected Variant Display */}
            {selectedVariant ? (
              <div className="mb-4 p-6 bg-gradient-to-br from-primary/10 to-primary/5 rounded-xl border-2 border-primary/20 shadow-sm">
                <div className="text-center">
                  <div className="text-6xl font-bold text-primary mb-1">{selectedVariant}</div>
                  <div className="text-[11px] font-medium text-muted-foreground">{t("test.variant")} {selectedVariant}</div>
                </div>
              </div>
            ) : (
              <div className="mb-4 p-6 bg-muted/20 rounded-xl border-2 border-dashed border-border">
                <div className="text-center text-muted-foreground text-xs">
                  {language === 'ru' ? 'Выберите вариант справа' : language === 'uz' ? 'Ўнг томондан вариант танланг' : 'O\'ng tomondan variant tanlang'}
                </div>
              </div>
            )}

            {/* Stats */}
            <div className="grid grid-cols-3 gap-2 mb-4">
              <div className="text-center p-2.5 bg-gradient-to-br from-blue-50 to-blue-100/50 dark:from-blue-950 dark:to-blue-900/50 rounded-lg border border-blue-200 dark:border-blue-800">
                <div className="text-xl font-bold text-blue-600 dark:text-blue-400">20</div>
                <div className="text-[9px] text-blue-600/70 dark:text-blue-400/70 mt-0.5">{t("test.questions")}</div>
              </div>
              <div className="text-center p-2.5 bg-gradient-to-br from-purple-50 to-purple-100/50 dark:from-purple-950 dark:to-purple-900/50 rounded-lg border border-purple-200 dark:border-purple-800">
                <div className="text-xl font-bold text-purple-600 dark:text-purple-400">30</div>
                <div className="text-[9px] text-purple-600/70 dark:text-purple-400/70 mt-0.5">{t("test.minutes")}</div>
              </div>
              <div className="text-center p-2.5 bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950 dark:to-green-900/50 rounded-lg border border-green-200 dark:border-green-800">
                <div className="text-xl font-bold text-green-600 dark:text-green-400">90%</div>
                <div className="text-[9px] text-green-600/70 dark:text-green-400/70 mt-0.5">{t("test.passingScore")}</div>
              </div>
            </div>

            {/* Start Button */}
            <Button
              size="lg"
              className="w-full mb-3 gap-2 h-12 text-sm font-semibold shadow-lg hover:shadow-xl transition-all"
              onClick={handleStartTest}
              disabled={selectedVariant === null}
            >
              <Play className="w-4 h-4" />
              {selectedVariant ? t("test.startTest") : t("test.selectVariantFirst")}
            </Button>

            {/* Instructions */}
            <div className="p-3 bg-gradient-to-br from-muted/50 to-muted/30 rounded-lg border border-border">
              <h3 className="text-[10px] font-semibold text-foreground mb-1.5 flex items-center gap-1.5">
                <div className="w-1 h-1 rounded-full bg-primary" />
                {t("test.instructions")}
              </h3>
              <div className="text-[10px] text-muted-foreground space-y-1">
                <div className="flex items-start gap-1.5">
                  <span className="text-primary mt-0.5">•</span>
                  <span>{t("test.instruction1")}</span>
                </div>
                <div className="flex items-start gap-1.5">
                  <span className="text-primary mt-0.5">•</span>
                  <span>{t("test.instruction2")}</span>
                </div>
                <div className="flex items-start gap-1.5">
                  <span className="text-primary mt-0.5">•</span>
                  <span>{t("test.instruction3")}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side - Variant Selection (70%) */}
        <div className="w-[70%] bg-background p-8 overflow-y-auto">
          <div className="max-w-5xl">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-foreground mb-1">{t("test.selectVariant")}</h1>
              <p className="text-sm text-muted-foreground">
                {language === 'ru' ? 'Выберите вариант теста для начала' : language === 'uz' ? 'Тест вариантини танланг' : 'Test variantini tanlang'}
              </p>
            </div>

            <div className="grid grid-cols-10 gap-2 mb-4">
              {visibleVariants.map((v) => (
                <Button
                  key={v}
                  variant="outline"
                  className={`h-12 text-base font-semibold transition-all ${getVariantButtonClass(v)}`}
                  onClick={() => setSelectedVariant(v)}
                >
                  {v}
                </Button>
              ))}
            </div>

            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-green-100 border border-green-200 rounded dark:bg-green-950 dark:border-green-800" />
                <span>{language === 'ru' ? '≥90%' : language === 'uz' ? '≥90%' : '≥90%'}</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 bg-red-100 border border-red-200 rounded dark:bg-red-950 dark:border-red-800" />
                <span>{language === 'ru' ? '<90%' : language === 'uz' ? '<90%' : '<90%'}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};