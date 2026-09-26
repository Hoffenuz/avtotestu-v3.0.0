import { useState, useEffect, useRef } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAccessState } from "@/hooks/useAccessState";
import { useTestSession } from "@/hooks/useTestSession";
import { useLanguage } from "@/contexts/LanguageContext";
import { SEO } from "@/components/SEO";
import { TestPageSchema } from "@/components/TestPageSchema";
import { Button } from "@/components/ui/button";
import {
  Play,
  Clock,
  HelpCircle,
  CheckCircle,
  Loader2,
  AlertTriangle,
  ServerCrash,
} from "lucide-react";
import { TestInterfaceBase } from "@/components/TestInterfaceBase";
import { TestInterfaceCombined } from "@/components/TestInterfaceCombined";
import { MainLayout } from "@/components/layout/MainLayout";
import { ProUpsell } from "@/components/ProUpsell";
import { AUTO_START_COUNT, wantsAutoStart } from "@/lib/testAutoStart";

/**
 * Bitta til = bitta fayl, ham free ham PRO uchun (ilgari free 5.9 MB'lik
 * uchala tilni birga yuklovchi `600.json` ni olardi — sekin internetda
 * yuklanmay qolishning asosiy sababi shu edi).
 *
 * Free = 1000 ta kurashtirilgan savol (`free-*.json`, 2026-08-12 dan 600 dan
 * oshirildi — takrorlanish shikoyatlari sababli), PRO = 1250 ta to'liq baza
 * (`barcha-*.json`) + variantlar/mavzular/izohlar bo'limlariga kirish.
 * To'plam `scripts/generate-free-tier.cjs` orqali generatsiya qilinadi
 * (manba: `scripts/question-tools/free-tier-question-ids.json`).
 */
const languages = [
  { id: "uz-lat" as const, label: "Lotin", file: "free-uz-lat.json", proFile: "barcha-uz-lat.json" },
  { id: "uz" as const, label: "Кирилл", file: "free-uz-cyr.json", proFile: "barcha-uz-cyr.json" },
  { id: "ru" as const, label: "Русский", file: "free-ru.json", proFile: "barcha-ru.json" },
];

const DEFAULT_DATA_FILE = "free-uz-lat.json";

/** Endi mavjud bo'lmagan monolit fayllar — eski localStorage sessiyalari uchun */
const RETIRED_DATA_FILES = new Set(["600.json", "barcha.json"]);

/**
 * To'liq (PRO) korpus fayllari — 1275 ta savol, izohlari bilan.
 * FREE korpus (`free-*.json`) esa 1009 ta va izohsiz.
 *
 * NEGA RO'YXAT KERAK: tugallanmagan test `localStorage` da o'z `dataFile`i
 * bilan saqlanadi va qaytib kelganda o'sha fayl bilan tiklanadi. Agar
 * oraliqda PRO muddati tugagan bo'lsa, eski sessiya PRO korpusni ochiq
 * qoldirardi — obuna tugagan foydalanuvchi 1275 ta savolni izohlari bilan
 * ishlashda davom etaverardi. `localStorage` ni brauzerdan qo'lda
 * tahrirlab ham xuddi shu natijaga erishish mumkin edi.
 */
const PRO_DATA_FILES = new Set([
  "barcha-uz-lat.json",
  "barcha-uz-cyr.json",
  "barcha-ru.json",
]);

const FREE_VARIANT = 99; // sentinel for free/practice test in DB (0..100 constraint)

/**
 * Tanlanadigan savol sonlari va ularga mos vaqt (daqiqada).
 *
 * 20 va 50 — ASOSIY tanlovlar (imtihon formati va uzaytirilgani).
 * 75 va 100 — qo'shimcha, uzoq mashq uchun; interfeysda kichikroq ko'rsatiladi.
 *
 * Vaqt savol soniga teng daqiqa (20 dan tashqari: u imtihondagidek 25 daqiqa).
 */
const QUESTION_COUNTS = { 20: 25, 50: 50, 75: 75, 100: 100 } as const;
type QuestionCount = keyof typeof QUESTION_COUNTS;

/** Katta (asosiy) va kichik (qo'shimcha) tanlovlar. */
const PRIMARY_COUNTS = [20, 50] as const;
const EXTRA_COUNTS = [75, 100] as const;

/** Haqiqiy imtihon formati — tanlovda "Imtihon" belgisi bilan ajratiladi. */
const EXAM_COUNT: QuestionCount = 20;
/** O'tish chegarasi (imtihondagidek 90%) — sarlavhada ko'rsatiladi. */
const PASS_PERCENT = 90;

function isQuestionCount(v: unknown): v is QuestionCount {
  return typeof v === 'number' && v in QUESTION_COUNTS;
}

export default function TestIshlash() {
  const { user } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  // Storage key is user-specific to prevent test state leaking across users on the same device.
  const testIshlashStorageKey = `testIshlash_activeTest_${user?.id ?? 'guest'}`;

  // Restore active test from localStorage
  const getInitialState = () => {
    try {
      const saved = localStorage.getItem(testIshlashStorageKey);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.testStarted && parsed.activeSession) {
          // Only restore if the in-progress test state still exists
          const testStateKey: string | undefined = parsed.activeSession.testStateKey;
          if (testStateKey && !localStorage.getItem(testStateKey)) {
            localStorage.removeItem(testIshlashStorageKey);
            return { testStarted: false, activeSession: null, questionCount: 20 as QuestionCount };
          }
          // Eski sessiya olib tashlangan monolit faylga ishora qilsa (600.json /
          // barcha.json) — tiklamaymiz, aks holda 404 va bo'sh test bo'ladi.
          const savedFile: string | undefined = parsed.activeSession.dataFile;
          if (savedFile && RETIRED_DATA_FILES.has(savedFile)) {
            localStorage.removeItem(testIshlashStorageKey);
            if (testStateKey) localStorage.removeItem(testStateKey);
            return { testStarted: false, activeSession: null, questionCount: 20 as QuestionCount };
          }
          return {
            testStarted: true,
            activeSession: parsed.activeSession,
            questionCount: (isQuestionCount(parsed.questionCount) ? parsed.questionCount : 20) as QuestionCount,
          };
        }
      }
    } catch (e) { /* ignore */ }
    return { testStarted: false, activeSession: null, questionCount: 20 as QuestionCount };
  };

  const initial = getInitialState();
  const [testStarted, setTestStarted] = useState(initial.testStarted);
  const [sessionError, setSessionError] = useState<string | null>(null);
  const [activeSession, setActiveSession] = useState<{ sessionId: string | null; isPremium: boolean; testStateKey?: string; dataFile?: string } | null>(initial.activeSession);
  const [questionCount, setQuestionCount] = useState<QuestionCount>(initial.questionCount);

  // Persist active test state
  useEffect(() => {
    try {
      if (testStarted && activeSession) {
        localStorage.setItem(testIshlashStorageKey, JSON.stringify({ testStarted, activeSession, questionCount }));
      } else {
        localStorage.removeItem(testIshlashStorageKey);
      }
    } catch (e) { /* ignore */ }
  }, [testIshlashStorageKey, testStarted, activeSession, questionCount]);
  const { state: accessState, isPremium, loading: accessLoading, backendConfirmed } = useAccessState();

  /*
    Tiklangan sessiyani joriy obuna holatiga solishtirish.

    `getInitialState()` sessiyani `localStorage` dan tiklaydi, lekin u
    `useState` initializer'ida ishlaydi — u paytda obuna holati hali
    serverdan kelmagan. Shuning uchun tekshiruv shu yerda, javob kelgach.

    `backendConfirmed` SHART: RPC javob bermaguncha `isPremium` boshlang'ich
    `false` qiymatida turadi, va u holda haqiqiy PRO foydalanuvchining
    tugallanmagan testini xato bilan o'chirib yuborardik.
  */
  useEffect(() => {
    if (accessLoading || !backendConfirmed || isPremium) return;
    const savedFile = activeSession?.dataFile;
    if (!savedFile || !PRO_DATA_FILES.has(savedFile)) return;

    try {
      if (activeSession?.testStateKey) localStorage.removeItem(activeSession.testStateKey);
      localStorage.removeItem(testIshlashStorageKey);
    } catch (e) { /* ignore */ }
    setTestStarted(false);
    setActiveSession(null);
  }, [accessLoading, backendConfirmed, isPremium, activeSession, testIshlashStorageKey]);
  const { starting, startSession } = useTestSession();

  const brandColor = "#1E2350";
  const langConfig = languages.find(l => l.id === language);
  const dataFile = isPremium
    ? (langConfig?.proFile || "barcha-uz-lat.json")
    : (langConfig?.file || DEFAULT_DATA_FILE);

  const showProBanner = !isPremium && accessState !== 'active_pro';

  // ── Start handler ──────────────────────────────────────────────────────────
  /**
   * `count` — ARGUMENT, holatdan o'qilmaydi: "darhol boshlash" (bosh sahifadan)
   * 20 talikni so'raydi, holatda esa oldingi tanlov (masalan 50) turgan
   * bo'lishi mumkin — `setQuestionCount` shu renderda hali qo'llanmagan.
   */
  const handleStart = async (count: QuestionCount = questionCount) => {
    setSessionError(null);

    // Compute the localStorage key that the test component will use
    // so we can validate it on restore after a page refresh.
    // Must match the user-specific keys used in TestInterfaceCombined / TestInterfaceBase.
    const userId = user?.id ?? 'guest';
    // Ikkalasida ham `dataSource` (= `/${dataFile}`) kalitning bir qismi —
    // TestInterfaceCombined / TestInterfaceBase dagi storageKey bilan
    // AYNAN bir xil bo'lishi shart, aks holda yangilashdan keyin sessiya
    // tiklanmay, boshlangan test yo'qoladi.
    // Shart yuqoridagi render tarmog'i bilan AYNAN bir xil bo'lishi kerak
    // (20 -> Base, qolgani -> Combined), aks holda yangilashdan keyin
    // boshlangan test topilmay yo'qoladi.
    const testStateKey = count !== 20
      ? `testState_combined_/${dataFile}_${count}_${userId}`
      : `testState_base_/${dataFile}_${count}_${userId}`;

    if (isPremium) {
      // Premium test: backend session is REQUIRED
      if (!backendConfirmed) {
        setSessionError(t("testStart.errServer"));
        return;
      }

      const result = await startSession({
        variant:        user ? FREE_VARIANT : 0,
        questionSource: dataFile,
        isPremium:      true,
      });

      if (!result.ok) {
        if (result.error === 'no_premium_access') {
          setSessionError(t("testStart.errProRequired"));
        } else if (result.error === 'not_authenticated') {
          setSessionError(t("testStart.errLogin"));
        } else {
          setSessionError(t("testStart.errConnection"));
        }
        return;
      }

      setActiveSession({ sessionId: result.session?.sessionId ?? null, isPremium: true, testStateKey, dataFile });
    } else {
      // Free test: try to get a session, but proceed even if backend is unavailable
      if (user && backendConfirmed) {
        const result = await startSession({
          variant:        FREE_VARIANT,
          questionSource: dataFile,
          isPremium:      false,
        });
        // Free test proceeds regardless of session result
        setActiveSession({
          sessionId:  result.ok ? (result.session?.sessionId ?? null) : null,
          isPremium:  false,
          testStateKey,
          dataFile,
        });
      } else {
        // Guest or backend unavailable — free test starts without session
        setActiveSession({ sessionId: null, isPremium: false, testStateKey, dataFile });
      }
    }

    setQuestionCount(count);
    setTestStarted(true);
  };

  /*
    DARHOL BOSHLASH — bosh sahifadagi "Sinab ko'ring" kartasidan "Testni
    davom ettirish" (`testAutoStart`). Boshlash sahifasi ko'rsatilmaydi,
    20 talik test o'zi boshlanadi.

    * Obuna holati kelguncha KUTILADI: `handleStart` bepul yoki PRO bazani
      shunga qarab tanlaydi.
    * `location.state` darhol tozalanadi — sahifani yangilash yoki orqaga
      qaytish testni QAYTA boshlamasin.
    * Tugallanmagan test bo'lsa (yuqorida tiklangan) — o'sha ochiladi,
      yangisi boshlanmaydi.
    * Kutish paytida boshlash sahifasi emas, yuklanish belgisi chiqadi —
      sahifa bir lahza ko'rinib, keyin almashib qolmasin. Xato bo'lsa
      (masalan server) boshlash sahifasi xabar bilan ochiladi.
  */
  const location = useLocation();
  const navigate = useNavigate();
  const [autoStartPending, setAutoStartPending] = useState(
    () => wantsAutoStart(location.state) && !initial.testStarted,
  );
  const autoStartFiredRef = useRef(false);
  // Eng so'nggi `handleStart` (u har renderda qayta yaratiladi — effekt
  // bog'liqligiga qo'yilsa, har renderda qayta ishlardi).
  const handleStartRef = useRef(handleStart);
  useEffect(() => {
    handleStartRef.current = handleStart;
  });

  useEffect(() => {
    if (!autoStartPending || autoStartFiredRef.current || accessLoading) return;
    autoStartFiredRef.current = true;
    navigate(location.pathname, { replace: true, state: null });
    void handleStartRef.current(AUTO_START_COUNT).finally(() => setAutoStartPending(false));
  }, [autoStartPending, accessLoading, navigate, location.pathname]);

  // ── Render: test in progress ───────────────────────────────────────────────
  /*
    Yuqoridagi `useEffect` sessiyani tozalaydi, lekin u render'dan KEYIN
    ishlaydi — oradagi bitta render'da PRO fayl yuklanib ulgurishi mumkin.
    Shuning uchun bu yerda ham tekshiriladi.
  */
  const savedFile = activeSession?.dataFile;
  const savedFileHuquqli =
    !savedFile || !PRO_DATA_FILES.has(savedFile) || isPremium || !backendConfirmed;
  const effectiveDataFile =
    testStarted && activeSession && savedFileHuquqli ? savedFile ?? dataFile : dataFile;
  const dataSourcePath = `/${effectiveDataFile}`;

  if (testStarted && activeSession !== null) {
    /**
     * 20 ta — `TestInterfaceBase` (imtihon formati, natija serverga yoziladi).
     * 20 dan ko'pi — `TestInterfaceCombined`: u uzun ro'yxat uchun mo'ljallangan
     * va `questionCount` ni umumiy prop sifatida qabul qiladi, ya'ni 75 va 100
     * uchun ham o'zgarishsiz ishlaydi.
     */
    if (questionCount !== 20) {
      return (
        <TestInterfaceCombined
          onExit={() => { setTestStarted(false); setActiveSession(null); }}
          dataSource={dataSourcePath}
          testName={`Test (${questionCount} ta)`}
          questionCount={questionCount}
          timeLimit={QUESTION_COUNTS[questionCount] * 60}
          randomize={true}
          isPremiumSession={activeSession.isPremium}
        />
      );
    }
    return (
      <TestInterfaceBase
        onExit={() => { setTestStarted(false); setActiveSession(null); }}
        dataSource={`/${effectiveDataFile}`}
        testName="Test (20 ta)"
        questionCount={20}
        timeLimit={25 * 60}
        randomize={true}
        variant={user ? FREE_VARIANT : 0}
        sessionId={activeSession.sessionId}
        isPremiumSession={activeSession.isPremium}
      />
    );
  }

  if (autoStartPending) {
    return (
      <MainLayout hideFooter>
        <div className="flex min-h-[60vh] items-center justify-center" role="status" aria-label={t("testStart.loading")}>
          <Loader2 className="h-8 w-8 animate-spin text-primary" aria-hidden="true" />
        </div>
      </MainLayout>
    );
  }

  // ── Render: start page ─────────────────────────────────────────────────────
  /*
    Sayt headeri (MainLayout) bilan — /variant va /mavzuli kabi. Ilgari bu
    sahifada o'z oq "Bosh sahifa + til" qatori bor edi va u saytning qolgan
    qismidan ajralib turardi. Til tugmalari karta sarlavhasiga ko'chdi
    ("test qaysi tilda" — shu kartaning sozlamasi). Qolgan tuzilish o'zgarmadi.
  */
  return (
    <MainLayout hideFooter>
      <SEO
        title={t("seo.testIshlash.title")}
        description={t("seo.testIshlash.description")}
        path="/test-ishlash"
        keywords={t("seo.testIshlash.keywords")}
      />
      <TestPageSchema />

      <div className="font-sans text-[#1E2350] dark:text-foreground">
        <div className="max-w-3xl mx-auto w-full px-4 py-4 sm:py-8 flex flex-col gap-4 sm:gap-6">

          {/*
            Pro Banner

            JOYI: mobilda (< md) — asosiy kartadan KEYIN (`order-last`),
            desktopda — tepada. Ilgari mobilda u eng tepada 3 qatorli blok
            bo'lib turardi va "Testni boshlash" tugmasini ekrandan pastga
            itarardi: yangi foydalanuvchi testni boshlash uchun avval
            scroll qilishi kerak edi. Endi tugma birinchi ekranda, banner
            esa uning ostida — bitta ixcham qatorda.

            `accessLoading` paytida banner YASHIRILADI, lekin O'RNI
            saqlanadi (`invisible`). Ilgari u butunlay render qilinmasdi
            va obuna holati aniqlangach paydo bo'lib, pastdagi hamma
            narsani surardi — o'lchangan CLS 0.1463 edi.

            `invisible` tanlandi, chunki bannerni darhol ko'rsatish ham
            yaramaydi: PRO obunachiga bir lahza "PRO oling" deb turishi
            noto'g'ri bo'lardi. Bu yerda joy band qilinadi, mazmun esa
            holat aniqlangandan keyin ko'rinadi.
          */}
          {showProBanner && (
            <ProUpsell
              description={t("pro.testBannerSubtitle")}
              pending={accessLoading}
              className="order-last md:order-none"
            />
          )}

          {/* Backend unavailable warning (only for premium users) */}
          {!accessLoading && !backendConfirmed && isPremium === false && user && (
            <div className="flex items-center gap-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl px-4 py-3">
              <ServerCrash className="w-4 h-4 text-yellow-600 flex-shrink-0" />
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                {t("testStart.offlineFree")}
              </p>
            </div>
          )}

          {/* Session error */}
          {sessionError && (
            <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/25 rounded-xl px-4 py-3">
              <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
              <p className="text-sm text-red-700 dark:text-red-300">{sessionError}</p>
            </div>
          )}

          {/*
            Asosiy karta — ekran o'lchamiga qarab IKKI xil joylashuv:

            * Desktop (md+): ikki ustun — chapda savol soni, o'ngda
              statistika kartochkalari va "Testni boshlash". Bu kenglikda
              hammasi bir ekranga sig'adi va qulay (egasi tasdiqlagan).
            * Mobil: bitta ustun — tanlash, darhol ostida tugma.
              Statistika kartochkalari YASHIRILADI: ilgari ular ustunlar
              ustma-ust tushganda tugmani ekrandan pastga itarardi va
              yangi foydalanuvchi testni boshlash uchun scroll qilishi
              kerak edi. Ularning yagona yangi ma'lumoti (o'tish 90%)
              mobilda sarlavhada ko'rsatiladi.
          */}
          <div className="bg-card rounded-3xl border border-border overflow-hidden">
            {/*
              Sarlavha: savol soni va vaqt bu yerda YOZILMAYDI — desktopda
              ular statistika kartochkalarida, soni esa tanlovda bor. Mobilda
              kartochkalar yashirin, shuning uchun vaqt va o'tish bali shu
              qatorda (faqat mobilda).
            */}
            <div className="px-5 py-4 sm:px-8 sm:py-6 border-b border-border flex flex-wrap items-center gap-3 sm:gap-4 bg-slate-50 dark:bg-muted">
              <div className="w-10 h-10 sm:w-11 sm:h-11 rounded-2xl bg-[#1E2350] dark:bg-primary flex items-center justify-center shrink-0">
                <Play className="w-5 h-5 text-white fill-current" />
              </div>
              <div className="min-w-0 flex-1">
                <h1 className="text-xl sm:text-2xl font-black tracking-tight text-[#1E2350] dark:text-foreground">{t("home.btnTest")}</h1>
                <p className="text-slate-500 dark:text-muted-foreground text-xs sm:text-sm font-semibold">
                  {t("testStart.random")}
                  <span className="md:hidden">
                    {" • "}{t("testStart.minutes").replace("{n}", String(QUESTION_COUNTS[questionCount]))}
                    {" • "}{t("testStart.passShort").replace("{n}", String(PASS_PERCENT))}
                  </span>
                </p>
              </div>
              {/* Savollar tili — ilgari sahifaning alohida oq headerida edi */}
              <div className="flex w-full sm:w-auto bg-muted dark:bg-background rounded-lg p-1 border border-border" role="radiogroup" aria-label={t("test.selectLanguage")}>
                {languages.map((lang) => (
                  <button
                    key={lang.id}
                    type="button"
                    role="radio"
                    aria-checked={language === lang.id}
                    onClick={() => setLanguage(lang.id)}
                    className={`flex-1 sm:flex-none px-2.5 sm:px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
                      language === lang.id
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {lang.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 sm:p-6 flex flex-col md:flex-row gap-4 sm:gap-5 md:gap-6">
              {/* Savollar soni */}
              <div role="radiogroup" aria-label={t("testStart.chooseCount")} className="md:flex-1">
                <p className="text-xs font-bold text-slate-600 dark:text-muted-foreground uppercase tracking-widest mb-4 text-center">
                  {t("testStart.chooseCount")}
                </p>
                <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
                  {PRIMARY_COUNTS.map((num) => (
                    <button
                      key={num}
                      type="button"
                      role="radio"
                      aria-checked={questionCount === num}
                      onClick={() => setQuestionCount(num)}
                      className={`relative py-3.5 sm:py-5 md:py-6 rounded-2xl border-2 transition-all flex flex-col items-center justify-center ${
                        questionCount === num
                          ? "border-[#1E2350] dark:border-primary bg-[#1E2350]/5 dark:bg-primary/10 shadow-sm"
                          : "border-slate-200 dark:border-border bg-slate-50 dark:bg-muted hover:border-slate-300 dark:hover:border-border/70 hover:bg-slate-100 dark:hover:bg-muted/70"
                      }`}
                    >
                      {/*
                        20 — haqiqiy imtihon formati: yangi foydalanuvchi qaysini
                        tanlashni bilsin. Belgi chegara USTIDA (Pro sahifasidagi
                        "Eng mashhur" kabi) — ichkarida raqamni to'sib qo'yardi.
                      */}
                      {num === EXAM_COUNT && (
                        <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-[#2563EB] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white shadow-sm">
                          {t("testStart.examBadge")}
                        </span>
                      )}
                      {questionCount === num && (
                        <div className="absolute top-2 right-2 w-5 h-5 rounded-full bg-[#1E2350] flex items-center justify-center">
                          <CheckCircle className="w-3 h-3 text-white" />
                        </div>
                      )}
                      <span className={`text-3xl sm:text-4xl font-black leading-none ${questionCount === num ? "text-[#1E2350] dark:text-primary" : "text-slate-400 dark:text-muted-foreground"}`}>
                        {num}
                      </span>
                      <span className="text-xs sm:text-sm font-semibold text-slate-500 dark:text-muted-foreground mt-1.5">
                        {t("testStart.questionWord")}
                      </span>
                    </button>
                  ))}
                </div>

                {/*
                  Qo'shimcha (uzoq) tanlovlar — ATAYLAB kichikroq.
                  20 va 50 asosiy formatlar, 75 va 100 esa uzoq mashq uchun.
                  Bir xil o'lchamda ko'rsatilsa, tanlov to'rttaga bo'linib,
                  imtihon formati (20) ajralib turmay qolardi.
                */}
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {EXTRA_COUNTS.map((num) => (
                    <button
                      key={num}
                      type="button"
                      role="radio"
                      aria-checked={questionCount === num}
                      onClick={() => setQuestionCount(num)}
                      className={`flex items-center justify-center gap-1.5 rounded-xl border py-2.5 text-sm transition-all ${
                        questionCount === num
                          ? "border-[#1E2350] dark:border-primary bg-[#1E2350]/5 dark:bg-primary/10 font-bold text-[#1E2350] dark:text-primary"
                          : "border-slate-200 dark:border-border bg-slate-50 dark:bg-muted text-slate-500 dark:text-muted-foreground hover:border-slate-300 dark:hover:border-border/70"
                      }`}
                    >
                      <span className="font-black">{num}</span>
                      <span className="font-medium">{t("testStart.questionWord")}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Statistika + boshlash. Mobilda — tanlovning darhol ostida, desktopda — o'ng ustun */}
              <div className="md:flex-1 flex flex-col gap-2 md:gap-4">
                <div className="hidden md:grid grid-cols-3 gap-2">
                  {[
                    { icon: HelpCircle, value: questionCount, label: t("test.questions") },
                    { icon: Clock, value: QUESTION_COUNTS[questionCount], label: t("test.minutes") },
                    { icon: CheckCircle, value: `${PASS_PERCENT}%`, label: t("testStart.passLabel"), green: true },
                  ].map(({ icon: Icon, value, label, green }) => (
                    <div key={label} className="flex flex-col items-center gap-2 bg-slate-100/80 dark:bg-muted rounded-2xl py-4">
                      <div className="w-8 h-8 rounded-xl bg-white dark:bg-muted-foreground/20 shadow-sm flex items-center justify-center">
                        <Icon className="w-4 h-4 text-slate-500 dark:text-muted-foreground" />
                      </div>
                      <span className={`text-xl font-black leading-none ${green ? "text-emerald-600" : "text-[#1E2350] dark:text-foreground"}`}>
                        {value}
                      </span>
                      <span className="text-xs font-semibold text-slate-500 dark:text-muted-foreground">{label}</span>
                    </div>
                  ))}
                </div>

                <Button
                  onClick={() => void handleStart()}
                  disabled={starting || accessLoading}
                  style={{ backgroundColor: brandColor }}
                  className="w-full h-14 rounded-xl text-white text-base font-black hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-3 md:mt-auto disabled:opacity-60"
                >
                  {(starting || accessLoading)
                    ? <Loader2 className="w-5 h-5 animate-spin" />
                    : <Play className="w-4 h-4 fill-current" />
                  }
                  {starting ? t("testStart.loading") : t("test.startTest")}
                </Button>
                {/* Mobilda tugma ostida; desktopda kartadan tashqarida (pastda) — tugma chap ustun bilan tekis tursin */}
                <p className="md:hidden text-center text-xs text-slate-400">
                  {t("testStart.noSignup")}
                </p>
              </div>
            </div>
          </div>

          <p className="hidden md:block text-center text-xs text-slate-400">
            {t("testStart.noSignupLong")}
          </p>
        </div>
      </div>
    </MainLayout>
  );
}
