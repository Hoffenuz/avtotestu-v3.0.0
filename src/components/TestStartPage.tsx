import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTestResults } from "@/hooks/useTestResults";
import { Button } from "@/components/ui/button";
import { Play, AlertTriangle, Lock } from "lucide-react";
import { ProUpsell } from "@/components/ProUpsell";
import { FREE_VARIANT_UI, isFreeVariantUi, isVariantLocked as checkVariantLocked } from "@/lib/variantAccess";

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

const TOTAL_VARIANTS = 64;
const variants = Array.from({ length: TOTAL_VARIANTS }, (_, i) => i + 1);

export const TestStartPage = ({ onStartTest, startError, hasProAccess = true }: TestStartPageProps) => {
  const [selectedVariant, setSelectedVariant] = useState<number | null>(
    hasProAccess ? null : FREE_VARIANT_UI
  );
  const [proNotice, setProNotice] = useState<string | null>(null);
  const { language, setLanguage, t } = useLanguage();
  const { getVariantStatus, loading: resultsLoading } = useTestResults();

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
    const isFree = isFreeVariantUi(v, hasProAccess);

    if (locked) {
      return "bg-muted/30 text-muted-foreground/60 border-border/60 opacity-50 cursor-pointer hover:opacity-70";
    }
    if (isFree && !isSelected) {
      return 'bg-blue-50 text-blue-700 border-blue-300 hover:bg-blue-100 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800';
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
    <div className="bg-gradient-to-br from-background via-background to-primary/5">
      {/* Mobile Layout */}
      <div className="lg:hidden bg-background pb-4">
        {/*
          "Bosh sahifa / Profil / Kirish" tugmalari BU YERDAN OLIB TASHLANDI —
          uchalasi ham sayt headerida bor va ikkinchi qatorda takrorlanishi
          ekranning yuqori qismini bekorga egallardi.

          Til tanlash QOLDIRILDI: bu yerda u "test qaysi tilda bo'ladi" degan
          ma'noni bildiradi va desktop yon panelida ham shu turadi.
        */}
        <div className="flex gap-2 border-b border-border bg-card px-4 py-3">
          {languages.map((lang) => (
            <Button
              key={lang.id}
              variant="outline"
              size="sm"
              className={`flex-1 text-xs ${
                language === lang.id ? "bg-primary text-primary-foreground border-primary" : ""
              }`}
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
              <div className="text-xs text-muted-foreground">{t("test.variant")}</div>
            </div>
          ) : (
            <div className="mb-0 p-4 bg-muted/30 rounded-lg border border-border text-center">
              <div className="text-sm text-muted-foreground">
                {language === 'ru' ? 'Выберите вариант ниже' : language === 'uz' ? 'Қуйидан вариант танланг' : 'Quyidan variant tanlang'}
              </div>
            </div>
          )}

          {startError && (
            <div className="mt-2 flex items-center gap-2 bg-red-500/10 border border-red-500/25 rounded-lg px-3 py-2">
              <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <p className="text-xs text-red-700 dark:text-red-300">{startError}</p>
            </div>
          )}
          {proNotice && (
            <div className="mt-2 flex items-center gap-2 bg-orange-500/10 border border-orange-500/25 rounded-lg px-3 py-2">
              <Lock className="w-4 h-4 text-orange-600 dark:text-orange-400 flex-shrink-0" />
              <p className="text-xs text-orange-900 dark:text-orange-200">{proNotice}</p>
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
                {isFreeVariantUi(v, hasProAccess) && (
                  <span className="absolute -top-1 -right-1 text-[8px] font-bold bg-blue-500 text-white px-1 rounded">✓</span>
                )}
                {v}
              </Button>
            ))}
          </div>

          {!hasProAccess && <ProUpsell description={t("pro.testBannerSubtitle")} className="my-4" />}

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

      {/*
        Desktop: ikki panelli "ilova" ko'rinishi.

        Balandlik `100vh - header` — ilgari to'liq `h-screen` edi va sayt
        headeri yo'q deb hisoblanardi. Header qaytarilgach, o'sha balandlik
        ekrandan oshib ketardi.

        "Bosh sahifa / Profil" tugmalari olib tashlandi — header da bor.
      */}
      <div className="hidden h-[calc(100vh-60px)] overflow-hidden bg-background text-foreground lg:flex">
        {/* Left Side - Test Start Section (30%) */}
        {/* `overflow-y-auto`: past ekranda (yoki brauzer zoom 125%+) panel pastki qismi kesilmasin */}
        <div className="w-[30%] bg-card border-r border-border p-6 flex flex-col overflow-y-auto">
          <div className="flex-1 flex flex-col">
            {/*
              SODDALASHTIRILDI (2026-09): "Bosh sahifa" tugmasi (sayt headerida
              bor), "Bepul: faqat 1-variant" xabari (qulf belgilari va pastdagi
              PRO kartasi aytib turibdi) va "Ko'rsatmalar" bloki (uchinchi
              bandi statistikadagi 90% ni takrorlardi) olib tashlandi.
            */}
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
                  <div className="text-[11px] font-medium text-muted-foreground">{t("test.variant")}</div>
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
              <div className="text-center p-2.5 bg-muted/50 rounded-lg border border-border">
                <div className="text-xl font-bold text-foreground">20</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">{t("test.questions")}</div>
              </div>
              <div className="text-center p-2.5 bg-muted/50 rounded-lg border border-border">
                <div className="text-xl font-bold text-foreground">25</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">{t("test.minutes")}</div>
              </div>
              <div className="text-center p-2.5 bg-muted/50 rounded-lg border border-border">
                <div className="text-xl font-bold text-emerald-600 dark:text-emerald-400">90%</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">{t("test.passingScore")}</div>
              </div>
            </div>

            {/* Start Button */}
            {startError && (
              <div className="mb-2 flex items-center gap-2 bg-red-500/10 border border-red-500/25 rounded-lg px-3 py-2">
                <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                <p className="text-xs text-red-700 dark:text-red-300">{startError}</p>
              </div>
            )}
            {proNotice && (
              <div className="mb-2 flex items-center gap-2 bg-orange-500/10 border border-orange-500/25 rounded-lg px-3 py-2">
                <Lock className="w-4 h-4 text-orange-600 dark:text-orange-400 flex-shrink-0" />
                <p className="text-xs text-orange-900 dark:text-orange-200">{proNotice}</p>
              </div>
            )}
            <Button
              size="lg"
              className="w-full gap-2 h-12 text-sm font-semibold shadow-lg hover:shadow-xl transition-all"
              onClick={handleStartTest}
              disabled={selectedVariant === null}
            >
              <Play className="w-4 h-4" />
              {selectedVariant ? t("test.startTest") : t("test.selectVariantFirst")}
            </Button>
          </div>
        </div>

        {/* Right Side - Variant Selection (70%) */}
        <div className="w-[70%] bg-background p-8 overflow-y-auto">
          <div className="max-w-5xl">
            <div className="mb-6">
              <h1 className="text-2xl font-bold text-foreground mb-1">{t("test.selectVariant")}</h1>
              <p className="text-sm text-muted-foreground">
                {t("testStart.variantsSubtitle").replace("{n}", String(TOTAL_VARIANTS))}
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
                  {isFreeVariantUi(v, hasProAccess) && (
                    <span className="absolute -top-1 -right-1 text-[8px] font-bold bg-blue-500 text-white px-1 rounded">✓</span>
                  )}
                  {v}
                </Button>
              ))}
            </div>

            {!hasProAccess && <ProUpsell description={t("pro.testBannerSubtitle")} className="my-4" />}

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