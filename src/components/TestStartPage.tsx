// ============================================================================
// TestStartPage — /variant: variant tanlash va boshlash
// ----------------------------------------------------------------------------
// TUZILISH (/test-ishlash va /mavzuli bilan bir xil):
//   * tepada — `PageIntro` (sarlavha bir marta: "Variantlar");
//   * chapda — savollar tili, 64 ta variant to'ri, belgilar izohi va PRO
//     taklifi;
//   * o'ngda (lg+) — yopishqoq panel: tanlangan variant, DARHOL ostida
//     "Testni boshlash", keyin vaqt / o'tish bali. Tugma yuqorida — past
//     ekranda (yoki zoom 125%+) ham birinchi ekranda ko'rinadi;
//   * mobilda — "Testni boshlash" header ostida yopishib turadi, tanlangan
//     variant tugma matnida ko'rinadi.
//
// OLIB TASHLANGAN TAKRORLAR: "Bosh sahifa" tugmasi (header va pastki menyuda
// bor), katta "1" + "Variant 1", "Variantni tanlang" + "Test variantini
// tanlang", uch rangli statistika qutilari, PRO haqida uch xil xabar.
//
// Balandlik ekranga (vh) bog'lanmagan — ilgari desktop `100vh` li qotirilgan
// ikki panel edi va past ekranda (yoki brauzer zoom qilinganda) chap panel
// pastki qismi, ba'zan "Testni boshlash" ham kesilib qolardi.
// ============================================================================

import { useState } from "react";
import { Grid3x3, Lock } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTestResults } from "@/hooks/useTestResults";
import { PageIntro } from "@/components/PageIntro";
import {
  OPTION_BASE,
  OPTION_IDLE,
  OPTION_SELECTED,
  ProUpsell,
  StartButton,
  StartFacts,
  StartNotice,
  TestLangPicker,
} from "@/components/test-start/TestStartParts";
import { FREE_VARIANT_UI, isVariantLocked as checkVariantLocked } from "@/lib/variantAccess";
import { cn } from "@/lib/utils";

interface TestStartPageProps {
  onStartTest: (variant: number) => void;
  startError?: string | null;
  hasProAccess?: boolean;
}

const TOTAL_VARIANTS = 64;
const variants = Array.from({ length: TOTAL_VARIANTS }, (_, i) => i + 1);

/** Variant formati — har birida imtihondagidek 20 ta savol, 25 daqiqa, 18 ta to'g'ri. */
const VARIANT_QUESTIONS = 20;
const VARIANT_MINUTES = 25;
const VARIANT_PASS = 18;

/** Mobil (lg dan kichik) — tanlangan variantni qayta bosish testni boshlaydi. */
const isCompactScreen = () =>
  typeof window !== "undefined" && window.matchMedia("(max-width: 1023.98px)").matches;

export const TestStartPage = ({ onStartTest, startError, hasProAccess = true }: TestStartPageProps) => {
  const [selectedVariant, setSelectedVariant] = useState<number | null>(
    hasProAccess ? null : FREE_VARIANT_UI
  );
  const [proNotice, setProNotice] = useState(false);
  const { t } = useLanguage();
  const { getVariantStatus } = useTestResults();

  const isLocked = (v: number) => checkVariantLocked(v, hasProAccess);
  const variantLabel = (v: number) => t("testStart.variantN").replace("{n}", String(v));

  const handleStartTest = () => {
    if (selectedVariant !== null) onStartTest(selectedVariant);
  };

  const handleVariantTap = (v: number) => {
    if (isLocked(v)) {
      setProNotice(true);
      setSelectedVariant(null);
      return;
    }
    setProNotice(false);
    // Mobilda: birinchi bosish tanlaydi, ikkinchisi boshlaydi (tugma yuqorida,
    // barmoq esa pastda — qayta cho'zilmaslik uchun).
    if (selectedVariant === v && isCompactScreen()) {
      onStartTest(v);
      return;
    }
    setSelectedVariant(v);
  };

  const variantClass = (v: number) => {
    if (selectedVariant === v) return OPTION_SELECTED;
    if (isLocked(v)) return "border-border bg-muted/50 text-muted-foreground/70 hover:bg-muted";
    const status = getVariantStatus(v);
    if (status === "success") {
      return "border-emerald-300 bg-emerald-50 text-emerald-700 hover:border-emerald-500 dark:border-emerald-800 dark:bg-emerald-950/50 dark:text-emerald-300";
    }
    if (status === "failed") {
      return "border-red-300 bg-red-50 text-red-700 hover:border-red-500 dark:border-red-800 dark:bg-red-950/50 dark:text-red-300";
    }
    return OPTION_IDLE;
  };

  const startLabel = selectedVariant !== null
    ? `${t("test.startTest")} · ${variantLabel(selectedVariant)}`
    : t("test.selectVariantFirst");

  const facts = [
    { label: t("testStart.questions"), value: t("testStart.questionsValue").replace("{n}", String(VARIANT_QUESTIONS)) },
    { label: t("testStart.time"), value: t("testStart.minutes").replace("{n}", String(VARIANT_MINUTES)) },
    { label: t("testStart.pass"), value: t("testStart.passValue").replace("{n}", String(VARIANT_PASS)) },
  ];

  const notices = (
    <>
      {startError && <StartNotice>{startError}</StartNotice>}
      {proNotice && <StartNotice tone="warning">{t("testStart.lockedVariant")}</StartNotice>}
    </>
  );

  return (
    <>
      <PageIntro
        icon={Grid3x3}
        title={t("home.btnVariantlar")}
        subtitle={t("testStart.variantsSubtitle").replace("{n}", String(TOTAL_VARIANTS))}
      />

      {/* Mobil: boshlash tugmasi header ostida yopishib turadi */}
      <div className="sticky top-14 z-30 border-b border-border bg-card/95 px-4 py-2.5 backdrop-blur-sm md:top-[60px] lg:hidden">
        <StartButton onClick={handleStartTest} disabled={selectedVariant === null} className="h-12">
          {startLabel}
        </StartButton>
      </div>

      <div className="mx-auto grid w-full max-w-6xl gap-6 px-4 py-5 md:px-6 md:py-6 lg:grid-cols-[minmax(0,1fr)_320px] lg:items-start lg:gap-8">
        <div className="min-w-0 space-y-5">
          <TestLangPicker className="lg:max-w-sm" />

          {/* Mobil: ma'lumot va xabarlar to'rdan oldin (desktopda o'ng panelda) */}
          <div className="space-y-4 lg:hidden">
            <StartFacts items={facts} />
            {notices}
          </div>

          <div className="grid grid-cols-5 gap-2 sm:grid-cols-8 xl:grid-cols-10">
            {variants.map((v) => {
              const locked = isLocked(v);
              return (
                <button
                  key={v}
                  type="button"
                  aria-pressed={selectedVariant === v}
                  aria-label={locked ? `${variantLabel(v)} — PRO` : variantLabel(v)}
                  onClick={() => handleVariantTap(v)}
                  className={cn(OPTION_BASE, "flex h-12 items-center justify-center text-base font-semibold tabular-nums", variantClass(v))}
                >
                  {locked && <Lock className="absolute right-1 top-1 h-3 w-3 opacity-70" aria-hidden="true" />}
                  {v}
                </button>
              );
            })}
          </div>

          {/* Izoh: variant rangi nimani bildiradi */}
          <div className="flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded border border-emerald-300 bg-emerald-50 dark:border-emerald-800 dark:bg-emerald-950" aria-hidden="true" />
              {t("testStart.legendPassed")}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="h-3 w-3 rounded border border-red-300 bg-red-50 dark:border-red-800 dark:bg-red-950" aria-hidden="true" />
              {t("testStart.legendFailed")}
            </span>
          </div>

          {!hasProAccess && <ProUpsell description={t("testStart.variantsPro")} />}
        </div>

        {/* Desktop: yopishqoq boshlash paneli */}
        <aside className="hidden lg:sticky lg:top-[84px] lg:block">
          <div className="space-y-4 rounded-xl border border-border bg-card p-5 shadow-sm">
            <div>
              <p className="text-sm font-semibold text-foreground">{t("testStart.selected")}</p>
              <p className="mt-1 text-2xl font-extrabold tracking-tight text-brand dark:text-foreground">
                {selectedVariant !== null ? variantLabel(selectedVariant) : "—"}
              </p>
            </div>
            <StartButton onClick={handleStartTest} disabled={selectedVariant === null}>
              {selectedVariant !== null ? t("test.startTest") : t("test.selectVariantFirst")}
            </StartButton>
            {notices}
            <StartFacts items={facts} />
          </div>
        </aside>
      </div>
    </>
  );
};
