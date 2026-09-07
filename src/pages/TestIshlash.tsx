import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useAccessState } from "@/hooks/useAccessState";
import { useTestSession } from "@/hooks/useTestSession";
import { useLanguage } from "@/contexts/LanguageContext";
import { useDarkMode } from "@/hooks/useDarkMode";
import { SEO } from "@/components/SEO";
import { TestPageSchema } from "@/components/TestPageSchema";
import { Button } from "@/components/ui/button";
import {
  Home,
  Play,
  Clock,
  HelpCircle,
  CheckCircle,
  Crown,
  Loader2,
  AlertTriangle,
  ServerCrash,
  ArrowRight
} from "lucide-react";
import { TestInterfaceBase } from "@/components/TestInterfaceBase";
import { TestInterfaceCombined } from "@/components/TestInterfaceCombined";
import { BottomNav } from "@/components/layout/BottomNav";

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
  const { isDark } = useDarkMode();
  const { starting, startSession } = useTestSession();

  const brandColor = "#1E2350";
  const langConfig = languages.find(l => l.id === language);
  const dataFile = isPremium
    ? (langConfig?.proFile || "barcha-uz-lat.json")
    : (langConfig?.file || DEFAULT_DATA_FILE);

  const showProBanner = !isPremium && accessState !== 'active_pro';

  // ── Start handler ──────────────────────────────────────────────────────────
  const handleStart = async () => {
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
    const testStateKey = questionCount !== 20
      ? `testState_combined_/${dataFile}_${questionCount}_${userId}`
      : `testState_base_/${dataFile}_${questionCount}_${userId}`;

    if (isPremium) {
      // Premium test: backend session is REQUIRED
      if (!backendConfirmed) {
        setSessionError('Serverga ulanib bo\'lmadi. Iltimos, sahifani yangilang.');
        return;
      }

      const result = await startSession({
        variant:        user ? FREE_VARIANT : 0,
        questionSource: dataFile,
        isPremium:      true,
      });

      if (!result.ok) {
        if (result.error === 'no_premium_access') {
          setSessionError('Premium test uchun PRO obuna kerak.');
        } else if (result.error === 'not_authenticated') {
          setSessionError('Iltimos, avval tizimga kiring.');
        } else {
          setSessionError('Serverga ulanishda xatolik. Qayta urinib ko\'ring.');
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

    setTestStarted(true);
  };

  // ── Render: test in progress ───────────────────────────────────────────────
  const effectiveDataFile =
    testStarted && activeSession ? activeSession.dataFile ?? dataFile : dataFile;
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

  // ── Render: start page ─────────────────────────────────────────────────────
  return (
    <div className={isDark ? 'dark' : ''}>
      <SEO
        title="Avto test ishlash 2026 — 20/50 savol"
        description="Avto test online 2026: 1250+ YHQ savol. 20 yoki 50 ta tasodifiy savol, 25 daqiqa, 18/20 o'tish bali. Bepul, ro'yxatsiz — haqiqiy imtihon formatida."
        path="/test-ishlash"
        keywords="test ishlash, onlayn test, prava test, YHQ savollari, avtotest, avtomaktab test, avto test ishlash 2026"
      />
      <TestPageSchema />

      {/*
        `has-bottom-nav` — pastki panel uchun joy. Bu FAQAT boshlash ekrani:
        test boshlangach yuqoridagi `TestInterfaceBase` shohobchasi ishlaydi
        va u panelni `body.test-active` orqali yashiradi.
      */}
      <div className="min-h-screen bg-background flex flex-col font-sans text-[#1E2350] dark:text-foreground has-bottom-nav">

        {/*
          Yon bo'shliqlar va til tugmalari kichik ekranda TORAYTIRILGAN.
          Ilgari sarlavha `px-6`, tugmalar esa `px-4` edi va "Bosh sahifa"
          bilan uchta til tugmasi bitta qatorga sig'masdi: 320px da 54px,
          360px da 14px toshib, BUTUN sahifada gorizontal scroll paydo
          qilardi. `flex-wrap` — zaxira: matn uzunroq tilda ham qator
          ikkiga bo'linadi, lekin toshmaydi.
        */}
        <header className="w-full bg-background border-b border-border px-3 sm:px-6 py-3 sticky top-0 z-20">
          <div className="max-w-5xl mx-auto flex flex-wrap items-center justify-between gap-2">
            <Link to="/">
              <Button variant="ghost" size="sm" className="gap-2 font-bold text-[#1E2350] dark:text-foreground">
                <Home className="w-4 h-4" /> Bosh sahifa
              </Button>
            </Link>
            <div className="flex bg-muted rounded-lg p-1 border border-border">
              {languages.map((lang) => (
                <button
                  key={lang.id}
                  onClick={() => setLanguage(lang.id)}
                  className={`px-2.5 sm:px-4 py-1.5 rounded-md text-xs font-bold transition-all ${
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
        </header>

        <main className="flex-1 max-w-3xl mx-auto w-full px-4 py-8 flex flex-col gap-6">

          {/*
            Pro Banner

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
            <Link
              to="/pro"
              aria-hidden={accessLoading || undefined}
              tabIndex={accessLoading ? -1 : undefined}
              className={`group flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 bg-card border-2 border-orange-400 rounded-2xl px-4 py-3 sm:px-5 sm:py-4 hover:border-orange-500 hover:bg-orange-50/30 dark:hover:bg-orange-950/20 transition-all active:scale-[0.99] shadow-sm hover:shadow-md${accessLoading ? " invisible" : ""}`}
            >
              <div className="w-9 h-9 sm:w-11 sm:h-11 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center flex-shrink-0 shadow-sm">
               <Crown className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div className="flex-1 min-w-0">
               <p className="text-orange-600 font-bold text-sm sm:text-base leading-tight">{t("pro.testBannerTitle")} <span className="text-orange-400">✦</span></p>
               <p className="text-slate-500 text-[11px] sm:text-sm mt-0.5 leading-snug">{t("pro.testBannerSubtitle")}</p>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold text-orange-600 sm:ml-auto whitespace-nowrap self-start sm:self-center">
                <span>{t("nav.getPro")}</span>
                <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
              </div>
            </Link>
          )}

          {/* Backend unavailable warning (only for premium users) */}
          {!accessLoading && !backendConfirmed && isPremium === false && user && (
            <div className="flex items-center gap-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl px-4 py-3">
              <ServerCrash className="w-4 h-4 text-yellow-600 flex-shrink-0" />
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                Server bilan aloqa yo'q. Bepul rejimda test ishlash mumkin.
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

          {/* Main card */}
          <div className="bg-card rounded-3xl border border-border overflow-hidden">
            <div className="px-8 py-6 border-b border-border flex items-center gap-4 bg-slate-50 dark:bg-muted">
              <div className="w-11 h-11 rounded-2xl bg-[#1E2350] flex items-center justify-center">
                <Play className="w-5 h-5 text-white fill-current" />
              </div>
              <div>
                <h1 className="text-2xl font-black tracking-tight text-[#1E2350] dark:text-foreground">Test ishlash</h1>
                <p className="text-slate-500 dark:text-muted-foreground text-sm font-semibold">
                  {questionCount} ta tasodifiy savol • {QUESTION_COUNTS[questionCount]} daqiqa
                </p>
              </div>
            </div>

            <div className="p-6 flex flex-col md:flex-row gap-6">
              {/* Question count */}
              <div className="flex-1">
                <p className="text-xs font-bold text-slate-600 dark:text-muted-foreground uppercase tracking-widest mb-3 text-center">
                  Savollar sonini tanlang
                </p>
                <div className="grid grid-cols-2 gap-3">
                  {PRIMARY_COUNTS.map((num) => (
                    <button
                      key={num}
                      onClick={() => setQuestionCount(num)}
                      className={`relative py-6 rounded-2xl border-2 transition-all flex flex-col items-center justify-center gap-0.5 ${
                        questionCount === num
                          ? "border-[#1E2350] dark:border-primary bg-[#1E2350]/5 dark:bg-primary/10 shadow-sm"
                          : "border-slate-200 dark:border-border bg-slate-50 dark:bg-muted hover:border-slate-300 dark:hover:border-border/70 hover:bg-slate-100 dark:hover:bg-muted/70"
                      }`}
                    >
                      {questionCount === num && (
                        <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full bg-[#1E2350] flex items-center justify-center">
                          <CheckCircle className="w-3 h-3 text-white" />
                        </div>
                      )}
                      <span className={`text-4xl font-black leading-none ${questionCount === num ? "text-[#1E2350] dark:text-primary" : "text-slate-400 dark:text-muted-foreground"}`}>
                        {num}
                      </span>
                      <span className="text-sm font-semibold text-slate-500 dark:text-muted-foreground mt-1">savollar</span>
                      <span className="text-sm text-slate-400 dark:text-muted-foreground/70">{QUESTION_COUNTS[num]} daqiqa</span>
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
                      onClick={() => setQuestionCount(num)}
                      aria-pressed={questionCount === num}
                      className={`flex items-center justify-center gap-1.5 rounded-xl border py-2.5 text-sm transition-all ${
                        questionCount === num
                          ? "border-[#1E2350] dark:border-primary bg-[#1E2350]/5 dark:bg-primary/10 font-bold text-[#1E2350] dark:text-primary"
                          : "border-slate-200 dark:border-border bg-slate-50 dark:bg-muted text-slate-500 dark:text-muted-foreground hover:border-slate-300 dark:hover:border-border/70"
                      }`}
                    >
                      <span className="font-black">{num}</span>
                      <span className="font-medium">savol</span>
                      <span className="opacity-60">· {QUESTION_COUNTS[num]} daq</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Stats + button */}
              <div className="flex-1 flex flex-col gap-4">
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { icon: HelpCircle, value: questionCount, label: "Savollar" },
                    { icon: Clock, value: QUESTION_COUNTS[questionCount], label: "Daqiqa" },
                    { icon: CheckCircle, value: "90%", label: "O'tish", green: true },
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
                  onClick={handleStart}
                  disabled={starting || accessLoading}
                  style={{ backgroundColor: brandColor }}
                  className="w-full h-14 rounded-xl text-white text-base font-black hover:opacity-90 active:scale-[0.98] transition-all flex items-center justify-center gap-3 mt-auto disabled:opacity-60"
                >
                  {(starting || accessLoading)
                    ? <Loader2 className="w-5 h-5 animate-spin" />
                    : <Play className="w-4 h-4 fill-current" />
                  }
                  {starting ? "Yuklanmoqda..." : "Testni boshlash"}
                </Button>
              </div>
            </div>
          </div>

          <p className="text-center text-xs text-slate-400">
            Testni boshlash uchun ro'yxatdan o'tish shart emas
          </p>
        </main>

        {/*
          Pastki navigatsiya boshlash ekranida ham turadi: u yerdan
          "Profil" yoki "Bo'limlar" ga o'tib bo'lmasligi noqulay edi.
        */}
        <BottomNav />
      </div>
    </div>
  );
}
