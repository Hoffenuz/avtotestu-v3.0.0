import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAuth } from "@/contexts/AuthContext";
import { useTestResults } from "@/hooks/useTestResults";
import { useDarkMode } from "@/hooks/useDarkMode";
import { Button } from "@/components/ui/button";
import { Home, Play, AlertTriangle, User, LogIn, Lock, Crown } from "lucide-react";
import { FREE_VARIANT_UI, isVariantLocked as checkVariantLocked } from "@/lib/variantAccess";

interface TestStartPageProps {
  onStartTest: (variant: number) => void;
  startError?: string | null;
  hasProAccess?: boolean;
}

const languages = [
  { id: "uz-lat" as const, label: "O'zbekcha" },
  { id: "uz" as const, label: "Ўзбекча" },
  { id: "ru" as const, label: "Русский" },
];

const TOTAL_VARIANTS = 63;
const variants = Array.from({ length: TOTAL_VARIANTS }, (_, i) => i + 1);

function ProPromoCard({ language }: { language: string }) {
  const title =
    language === "ru"
      ? "Откройте все 63 варианта"
      : language === "uz"
        ? "Барча 63 вариантни очинг"
        : "Barcha 63 variantni oching";
  const subtitle =
    language === "ru"
      ? "Оформите PRO — все варианты и тематические тесты без ограничений"
      : language === "uz"
        ? "PRO обуна — барча вариантлар ва мавзули тестлар чексиз"
        : "PRO obuna — barcha variantlar va mavzuli testlar cheksiz";
  const cta = language === "ru" ? "Получить PRO" : language === "uz" ? "PRO olish" : "PRO olish";

  return (
    <Link
      to="/pro"
      className="block mt-4 p-4 rounded-xl border-2 border-amber-300/80 bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 dark:from-amber-950/40 dark:via-yellow-950/30 dark:to-orange-950/20 dark:border-amber-700/50 hover:shadow-md transition-all group"
    >
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-400 to-yellow-500 flex items-center justify-center flex-shrink-0 shadow-sm">
          <Crown className="w-5 h-5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-foreground text-sm mb-0.5 group-hover:text-amber-700 dark:group-hover:text-amber-400 transition-colors">
            {title}
          </h3>
          <p className="text-xs text-muted-foreground leading-relaxed">{subtitle}</p>
          <span className="inline-flex items-center gap-1 mt-2 text-xs font-semibold text-amber-700 dark:text-amber-400">
            {cta}
            <span aria-hidden>→</span>
          </span>
        </div>
      </div>
    </Link>
  );
}

export const TestStartPage = ({ onStartTest, startError, hasProAccess = true }: TestStartPageProps) => {
  const [selectedVariant, setSelectedVariant] = useState<number | null>(
    hasProAccess ? null : FREE_VARIANT_UI
  );
  const [proNotice, setProNotice] = useState<string | null>(null);
  const { language, setLanguage, t } = useLanguage();
  const { user, profile } = useAuth();
  const { getVariantStatus, loading: resultsLoading } = useTestResults();
  const { isDark } = useDarkMode();
  const navigate = useNavigate();

  const handleStartTest = () => {
    if (selectedVariant !== null) {
      onStartTest(selectedVariant);
    }
  };

  const isLocked = (v: number) => checkVariantLocked(v, hasProAccess);

  const proRequiredMessage =
    language === "ru"
      ? "Чтобы открыть все варианты, оформите PRO подписку."
      : language === "uz"
        ? "Барча вариантларни очиш учун PRO обунага обуна бўлинг."
        : "Barcha variantlarni ochish uchun PRO obunaga obuna bo'ling.";

  const freeHintMessage =
    language === "ru"
      ? "Бесплатно: только вариант 1. Остальные — по PRO."
      : language === "uz"
        ? "Бепул: фақат 1-вариант. Қолганлари PRO билан."
        : "Bepul: faqat 1-variant. Qolganlari PRO bilan.";

  const handleVariantSelect = (v: number) => {
    if (isLocked(v)) {
      setProNotice(proRequiredMessage);
      setSelectedVariant(null);
      return;
    }
    setProNotice(null);
    setSelectedVariant(v);
  };

  const handleMobileVariantTap = (v: number) => {
    if (isLocked(v)) {
      setProNotice(proRequiredMessage);
      setSelectedVariant(null);
      return;
    }
    setProNotice(null);
    if (selectedVariant === v) {
      onStartTest(v);
    } else {
      setSelectedVariant(v);
    }
  };

  const getVariantButtonClass = (v: number) => {
    const locked = isLocked(v);
    const status = getVariantStatus(v);
    const isSelected = selectedVariant === v;
    const isFree = !hasProAccess && v === FREE_VARIANT_UI;

    if (locked) {
      return "bg-muted/30 text-muted-foreground/60 border-border/60 opacity-50 cursor-pointer hover:opacity-70";
    }
    if (isFree && !isSelected) {
      return 'bg-emerald-50 text-emerald-700 border-emerald-300 hover:bg-emerald-100 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800';
    }
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

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      {/* Mobile Layout */}
      <div className="lg:hidden bg-background pb-4">
        {/* Header — scroll bilan ketadi */}
        <div className="bg-card border-b border-border p-4">
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
                {lang.label}
              </Button>
            ))}
          </div>
        </div>

        {/* Sticky: faqat boshlash tugmasi — scroll pastga tushganda ham tepada */}
        <div className="sticky top-0 z-30 bg-card/95 backdrop-blur-sm border-b border-border px-4 py-2.5 shadow-sm">
          <Button
            size="lg"
            className="w-full gap-2 h-12"
            onClick={handleStartTest}
            disabled={selectedVariant === null}
          >
            <Play className="w-5 h-5" />
            {selectedVariant
              ? `${t("test.startTest")} (${selectedVariant})`
              : t("test.selectVariantFirst")}
          </Button>
        </div>

        {/* Selected Variant & alerts */}
        <div className="bg-card border-b border-border p-4">
          {selectedVariant ? (
            <div className="mb-0 p-4 bg-primary/5 rounded-lg border border-primary/20 text-center">
              <div className="text-5xl font-bold text-primary mb-1">{selectedVariant}</div>
              <div className="text-xs text-muted-foreground">{t("test.variant")} {selectedVariant}</div>
            </div>
          ) : (
            <div className="mb-0 p-4 bg-muted/30 rounded-lg border border-border text-center">
              <div className="text-sm text-muted-foreground">
                {language === 'ru' ? 'Выберите вариант ниже' : language === 'uz' ? 'Қуйидан вариант танланг' : 'Quyidan variant tanlang'}
              </div>
            </div>
          )}

          {startError && (
            <div className="mt-2 flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
              <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <p className="text-xs text-red-700">{startError}</p>
            </div>
          )}
          {!hasProAccess && (
            <div className="mt-2 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
              <Crown className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-amber-900">{freeHintMessage}</p>
            </div>
          )}
          {proNotice && (
            <div className="mt-2 flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-lg px-3 py-2">
              <Lock className="w-4 h-4 text-orange-600 flex-shrink-0" />
              <p className="text-xs text-orange-900">{proNotice}</p>
            </div>
          )}
        </div>

        {/* Stats */}
        <div className="grid grid-cols-3 gap-2 p-4 bg-muted/30">
          <div className="text-center p-2 bg-card rounded-lg border border-border">
            <div className="text-xl font-bold text-foreground">20</div>
            <div className="text-[10px] text-muted-foreground">{t("test.questions")}</div>
          </div>
          <div className="text-center p-2 bg-card rounded-lg border border-border">
            <div className="text-xl font-bold text-foreground">25</div>
            <div className="text-[10px] text-muted-foreground">{t("test.minutes")}</div>
          </div>
          <div className="text-center p-2 bg-card rounded-lg border border-border">
            <div className="text-xl font-bold text-foreground">90%</div>
            <div className="text-[10px] text-muted-foreground">{t("test.passingScore")}</div>
          </div>
        </div>

        {/* Variant Selection — sahifa bilan birga scroll */}
        <div className="p-4">
          <h2 className="text-lg font-bold text-foreground mb-3">{t("test.selectVariant")}</h2>
          
          <div className="grid grid-cols-5 gap-2 mb-4">
            {variants.map((v) => (
              <Button
                key={v}
                variant="outline"
                className={`h-12 text-base font-semibold transition-all relative ${getVariantButtonClass(v)}`}
                onClick={() => handleMobileVariantTap(v)}
              >
                {isLocked(v) && <Lock className="w-3 h-3 absolute top-1 right-1 opacity-70" />}
                {!isLocked(v) && !hasProAccess && v === FREE_VARIANT_UI && (
                  <span className="absolute -top-1 -right-1 text-[8px] font-bold bg-emerald-500 text-white px-1 rounded">✓</span>
                )}
                {v}
              </Button>
            ))}
          </div>

          {!hasProAccess && <ProPromoCard language={language} />}

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
      <div className={`hidden lg:flex h-screen overflow-hidden bg-background text-foreground${isDark ? ' dark' : ''}`}>
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
                <div className="text-xl font-bold text-purple-600 dark:text-purple-400">25</div>
                <div className="text-[9px] text-purple-600/70 dark:text-purple-400/70 mt-0.5">{t("test.minutes")}</div>
              </div>
              <div className="text-center p-2.5 bg-gradient-to-br from-green-50 to-green-100/50 dark:from-green-950 dark:to-green-900/50 rounded-lg border border-green-200 dark:border-green-800">
                <div className="text-xl font-bold text-green-600 dark:text-green-400">90%</div>
                <div className="text-[9px] text-green-600/70 dark:text-green-400/70 mt-0.5">{t("test.passingScore")}</div>
              </div>
            </div>

            {/* Start Button */}
            {startError && (
              <div className="mb-2 flex items-center gap-2 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <p className="text-xs text-red-700">{startError}</p>
              </div>
            )}
            {!hasProAccess && (
              <div className="mb-2 flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                <Crown className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
                <p className="text-xs text-amber-900">{freeHintMessage}</p>
              </div>
            )}
            {proNotice && (
              <div className="mb-2 flex items-center gap-2 bg-orange-50 border border-orange-200 rounded-lg px-3 py-2">
                <Lock className="w-4 h-4 text-orange-600 flex-shrink-0" />
                <p className="text-xs text-orange-900">{proNotice}</p>
              </div>
            )}
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
              {variants.map((v) => (
                <Button
                  key={v}
                  variant="outline"
                  className={`h-12 text-base font-semibold transition-all relative ${getVariantButtonClass(v)}`}
                  onClick={() => handleVariantSelect(v)}
                >
                  {isLocked(v) && <Lock className="w-3 h-3 absolute top-1 right-1 opacity-70" />}
                  {!isLocked(v) && !hasProAccess && v === FREE_VARIANT_UI && (
                    <span className="absolute -top-1 -right-1 text-[8px] font-bold bg-emerald-500 text-white px-1 rounded">✓</span>
                  )}
                  {v}
                </Button>
              ))}
            </div>

            {!hasProAccess && <ProPromoCard language={language} />}

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