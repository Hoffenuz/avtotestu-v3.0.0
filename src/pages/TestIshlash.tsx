import { useState, useEffect, useId } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useAccessState } from "@/hooks/useAccessState";
import { useTestSession } from "@/hooks/useTestSession";
import { useLanguage } from "@/contexts/LanguageContext";
import { SEO } from "@/components/SEO";
import { TestPageSchema } from "@/components/TestPageSchema";
import { Play } from "lucide-react";
import { TestInterfaceBase } from "@/components/TestInterfaceBase";
import { TestInterfaceCombined } from "@/components/TestInterfaceCombined";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageIntro } from "@/components/PageIntro";
import {
  FieldLabel,
  OPTION_BASE,
  OPTION_IDLE,
  OPTION_SELECTED,
  ProUpsell,
  StartButton,
  StartFacts,
  StartNotice,
  TestLangPicker,
} from "@/components/test-start/TestStartParts";
import { cn } from "@/lib/utils";

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
  { id: "uz-lat" as const, file: "free-uz-lat.json", proFile: "barcha-uz-lat.json" },
  { id: "uz" as const, file: "free-uz-cyr.json", proFile: "barcha-uz-cyr.json" },
  { id: "ru" as const, file: "free-ru.json", proFile: "barcha-ru.json" },
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
 * Vaqt savol soniga teng daqiqa (20 dan tashqari: u imtihondagidek 25 daqiqa).
 */
const QUESTION_COUNTS = { 20: 25, 50: 50, 75: 75, 100: 100 } as const;
type QuestionCount = keyof typeof QUESTION_COUNTS;

/** Tanlovlar tartibi — to'rttasi bir qatorda, teng o'lchamda. */
const COUNT_OPTIONS = [20, 50, 75, 100] as const;

/** Haqiqiy imtihon formati — tanlovda "Imtihon" belgisi bilan ajratiladi. */
const EXAM_COUNT: QuestionCount = 20;
/**
 * O'tish chegarasi — `TestResults` dagi `score >= 90` bilan BIR XIL.
 * Foydalanuvchiga foiz emas, kerakli to'g'ri javoblar SONI ko'rsatiladi
 * (20 → 18, 50 → 45, 75 → 68, 100 → 90).
 */
const PASS_PERCENT = 90;
const passCount = (n: number) => Math.ceil((n * PASS_PERCENT) / 100);

function isQuestionCount(v: unknown): v is QuestionCount {
  return typeof v === 'number' && v in QUESTION_COUNTS;
}

export default function TestIshlash() {
  const { user } = useAuth();
  const { language, t } = useLanguage();
  const countLabelId = useId();

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

    setTestStarted(true);
  };

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

  // ── Render: start page ─────────────────────────────────────────────────────
  /*
    Sayt headeri (MainLayout) bilan — /variant va /mavzuli kabi. Ilgari bu
    sahifada o'z "Bosh sahifa + til" qatori bor edi va u saytning qolgan
    qismidan butunlay ajralib turardi.

    TUZILISH (har ma'lumot BIR MARTA):
      * chapda — sozlamalar: savollar soni (faqat raqam) va savollar tili;
      * o'ngda (mobilda pastda) — tanlovga mos vaqt va o'tish uchun kerakli
        to'g'ri javoblar soni, ostida "Testni boshlash".
    Ilgari "20 ta · 25 daqiqa" sarlavhada, tanlov tugmasi ichida va
    statistika kartochkalarida — uch marta yozilardi.

    PRO taklifi — kartadan KEYIN: avval asosiy harakat, keyin taklif.
  */
  const minutesText = t("testStart.minutes").replace("{n}", String(QUESTION_COUNTS[questionCount]));
  const passText = t("testStart.passValue").replace("{n}", String(passCount(questionCount)));

  return (
    <MainLayout>
      <SEO
        title={t("seo.testIshlash.title")}
        description={t("seo.testIshlash.description")}
        path="/test-ishlash"
        keywords={t("seo.testIshlash.keywords")}
      />
      <TestPageSchema />

      <PageIntro
        icon={Play}
        iconClassName="fill-current"
        title={t("home.btnTest")}
        subtitle={t("testStart.subtitle")}
        width="max-w-4xl"
      />

      <div className="mx-auto flex w-full max-w-4xl flex-col gap-4 px-4 py-5 md:px-6 md:py-6">
        {/* Server javob bermadi — bepul rejimda davom etish mumkin */}
        {!accessLoading && !backendConfirmed && isPremium === false && user && (
          <StartNotice tone="warning">{t("testStart.offlineFree")}</StartNotice>
        )}
        {sessionError && <StartNotice>{sessionError}</StartNotice>}

        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-sm md:grid md:grid-cols-[minmax(0,1fr)_300px]">
          {/* Sozlamalar */}
          <div className="space-y-5 p-4 sm:space-y-6 sm:p-6">
            <div>
              <FieldLabel id={countLabelId}>{t("testStart.countLabel")}</FieldLabel>
              <div role="radiogroup" aria-labelledby={countLabelId} className="grid grid-cols-4 gap-2 pt-2 sm:gap-3">
                {COUNT_OPTIONS.map((num) => {
                  const selected = questionCount === num;
                  return (
                    <button
                      key={num}
                      type="button"
                      role="radio"
                      aria-checked={selected}
                      onClick={() => setQuestionCount(num)}
                      className={cn(
                        OPTION_BASE,
                        "flex h-14 items-center justify-center text-2xl font-extrabold tabular-nums sm:h-[72px] sm:text-3xl",
                        selected ? OPTION_SELECTED : OPTION_IDLE,
                      )}
                    >
                      {/*
                        20 — haqiqiy imtihon formati: yangi foydalanuvchi
                        qaysini tanlashni bilsin. Belgi chegara USTIDA —
                        ichkarida raqamni to'sardi. Ko'k: yashil faqat
                        "to'g'ri/o'tdi" ma'nosida ishlatiladi.
                      */}
                      {num === EXAM_COUNT && (
                        <span className="absolute -top-2.5 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-md bg-[#2563EB] px-1.5 py-0.5 text-[10px] font-bold uppercase leading-none tracking-wide text-white shadow-sm">
                          {t("testStart.examBadge")}
                        </span>
                      )}
                      {num}
                    </button>
                  );
                })}
              </div>
              {/*
                Mobil: vaqt va o'tish bali BITTA qatorda, tanlovning darhol
                ostida — "Testni boshlash" kichik telefonda ham (320x568)
                birinchi ekranda qolsin. Desktopda ular o'ng ustunda.
              */}
              <p className="mt-2.5 text-sm text-muted-foreground md:hidden">
                {minutesText} · {t("testStart.pass").toLowerCase()} {passText}
              </p>
            </div>

            <TestLangPicker />
          </div>

          {/* Natija ma'lumoti va boshlash */}
          <div className="flex flex-col gap-4 border-t border-border bg-muted/40 p-4 sm:p-6 md:border-l md:border-t-0">
            <StartFacts
              className="hidden md:block"
              items={[
                { label: t("testStart.time"), value: minutesText },
                { label: t("testStart.pass"), value: passText },
              ]}
            />
            <StartButton onClick={handleStart} loading={starting || accessLoading} className="md:mt-auto">
              {starting ? t("testStart.loading") : t("test.startTest")}
            </StartButton>
            {!user && <p className="-mt-1 text-center text-xs text-muted-foreground">{t("testStart.noSignup")}</p>}
          </div>
        </div>

        {showProBanner && (
          <ProUpsell description={t("pro.testBannerSubtitle")} pending={accessLoading} className="mt-2" />
        )}
      </div>
    </MainLayout>
  );
}
