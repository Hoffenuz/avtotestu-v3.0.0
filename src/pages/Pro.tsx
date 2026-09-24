import { useCallback, useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { PRO_COMPARISON } from "@/lib/proComparison";
import { useAccessState } from "@/hooks/useAccessState";
import { supabase } from "@/integrations/supabase/client";
import {
  buildPaymeCheckoutUrl,
  formatTiyinAsSum,
  formatTiyinPerDayAsSum,
  type PaymePlan,
} from "@/lib/payme";
import { buildClickPayUrl, isClickConfigured } from "@/lib/click";
import {
  clearPendingPlan,
  peekPendingPlan,
  peekPendingProvider,
  setPendingPlan,
  type PaymentProvider,
} from "@/lib/pendingPlan";
import { DB_READ_TIMEOUT_MS, withTimeout } from "@/lib/withTimeout";
import { toast } from "sonner";
import { Crown, Check, X, Star, ShieldCheck } from "lucide-react";
import { trackEvent } from "@/lib/track";

/** `click_create_order` RPC javobi. */
interface ClickOrderResult {
  ok?: boolean;
  error?: string;
  order_id?: string;
  amount_tiyin?: number;
}

/** To'lov tizimi tugmasidagi belgi (rasm emas — tashqi resurs yuklanmaydi). */
function ProviderMark({ provider }: { provider: PaymentProvider }) {
  if (provider === "click") {
    return (
      <span className="inline-flex items-center gap-1.5 text-[15px] font-extrabold tracking-tight text-[#1c8ed7]">
        <span className="w-3.5 h-3.5 rounded-full bg-[#1c8ed7]" aria-hidden="true" />
        click
      </span>
    );
  }
  return (
    <span className="text-[15px] font-extrabold tracking-tight">
      <span className="text-foreground">pay</span>
      <span className="text-[#33cccc]">me</span>
    </span>
  );
}

/**
 * Faol tariflarni o'qiydi.
 * `null` = so'rov muvaffaqiyatsiz yoki bo'sh (qayta urinish mantiqiy).
 */
async function fetchActivePaymePlans(
  signal?: AbortSignal,
): Promise<Record<string, PaymePlan> | null> {
  try {
    // Bitta yo'l: signal berilmasa ham o'zimiznikini yaratamiz, shunda
    // so'rov qurilishi hamma chaqiruvda bir xil bo'ladi.
    const activeSignal = signal ?? new AbortController().signal;

    const { data, error } = await withTimeout(
      supabase
        .from("payme_plans")
        .select("plan_name, amount_tiyin, tariff_days")
        .eq("is_active", true)
        .abortSignal(activeSignal),
      DB_READ_TIMEOUT_MS,
    );

    if (error || !data || data.length === 0) return null;

    const byName: Record<string, PaymePlan> = {};
    for (const plan of data) byName[plan.plan_name] = plan;
    return byName;
  } catch {
    return null;
  }
}

/** Tarif kartalari. Narx va muddat DB dan olinadi, bu yerdagisi — zaxira. */
const PLANS = [
  {
    planName: "weekly",
    nameKey: "pro.planWeekly",
    fallbackPrice: "15 000",
    fallbackDays: 7,
    highlighted: false,
  },
  {
    planName: "monthly",
    nameKey: "pro.planMonthly",
    fallbackPrice: "35 000",
    fallbackDays: 30,
    highlighted: true,
  },
  {
    planName: "quarterly",
    nameKey: "pro.planQuarterly",
    fallbackPrice: "83 000",
    fallbackDays: 90,
    highlighted: false,
  },
];

type PlanCard = (typeof PLANS)[number];

export default function Pro() {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const { t, language } = useLanguage();
  const { isPremium, loading: accessLoading } = useAccessState();

  /**
   * Tariflar DB dan olinadi: Payme summani `payme_plans.amount_tiyin` bo'yicha
   * tekshiradi, shuning uchun sahifadagi narx bilan DB dagi summa bir xil
   * bo'lishi shart. Hardcode qilinganda narx o'zgartirilsa Payme -31001
   * (invalid_amount) qaytarib, to'lov ishlamay qolardi.
   */
  const [paymePlans, setPaymePlans] = useState<Record<string, PaymePlan>>({});

  /**
   * Tariflarni o'qish TUGADIMI (muvaffaqiyatli yoki urinishlar tugagan).
   * Avto-davom ettirish oqimi shuni kutadi: aks holda tariflar kelmasa
   * foydalanuvchi sahifada jimgina osilib qolardi.
   */
  const [plansSettled, setPlansSettled] = useState(false);

  /**
   * /profile chunkini oldindan (fon rejimida) yuklab qo'yamiz.
   *
   * Payme'dan qaytish har doim TO'LIQ sahifa qayta yuklanishi (hard
   * navigation) — brauzer /profile uchun JS chunkini yangidan so'raydi.
   * Agar aynan shu payt tarmoq hali "uyg'onmagan" bo'lsa (ayniqsa mobil
   * internetda, tashqi Payme sahifasidan qaytgach) — chunk yuklanmay
   * qoladi, `lazyWithRetry` bir necha marta urinib ko'radi va oxiri
   * sahifani majburan qayta yuklaydi (`window.location.reload()`),
   * shu payt foydalanuvchi bir necha soniya "oq ekran" ko'radi.
   *
   * Yechim: hali /pro sahifasida turganda (tarmoq yaxshi ishlayotganda)
   * /profile chunkini oldindan yuklab, brauzer keshiga (immutable,
   * 1 yillik) tushirib qo'yamiz. Payme'dan qaytilganda u tarmoqdan emas,
   * keshdan olinadi — tarmoq holatidan qat'i nazar darhol ochiladi.
   */
  useEffect(() => {
    import("@/pages/Profile").catch(() => { /* faqat qulaylik uchun — muhim emas */ });
  }, []);

  /**
   * ILGARIGI KAMCHILIK: tariflar bir marta, qayta urinishsiz so'ralardi.
   * Mobil tarmoqda o'sha yagona so'rov uzilsa, sahifa zaxira narxlar bilan
   * mutlaqo SOG'LOM ko'rinardi — lekin "Sotib olish" tugmasi ishlamay
   * qolardi ("Tarif ma'lumoti yuklanmadi"). Foydalanuvchi sababni bilmasdi
   * va PRO sotib ololmasdi. Endi 3 marta qayta uriniladi.
   */
  useEffect(() => {
    const controller = new AbortController();

    (async () => {
      for (let attempt = 0; attempt < 3; attempt++) {
        if (controller.signal.aborted) return;

        const byName = await fetchActivePaymePlans(controller.signal);
        if (controller.signal.aborted) return;

        if (byName) {
          setPaymePlans(byName);
          setPlansSettled(true);
          return;
        }
        if (attempt < 2) {
          await new Promise((r) => setTimeout(r, 600 * 2 ** attempt));
        }
      }

      // Uchala urinish ham uzildi. Kutib turmaymiz — `goToPayme` tarifni
      // tugma bosilgan payt qayta o'qishga uriniadi.
      if (!controller.signal.aborted) setPlansSettled(true);
    })();

    return () => controller.abort();
  }, []);

  /** Tanlangan tarif — standart holatda eng ommabopi (oylik). */
  const [selectedPlan, setSelectedPlan] = useState("monthly");

  /**
   * To'lov tizimi — standart holatda Payme. Click faqat sozlangan bo'lsa
   * (VITE_CLICK_*) tanlanadi, aks holda tanlagich umuman ko'rinmaydi.
   */
  const clickAvailable = isClickConfigured();
  const [providerChoice, setProviderChoice] = useState<PaymentProvider>("payme");
  const provider: PaymentProvider = clickAvailable ? providerChoice : "payme";

  /**
   * To'lov sahifasiga o'tish boshlandi — tugma qayta bosilmasin (Click da
   * har bosishda yangi buyurtma yaratiladi).
   */
  const [redirecting, setRedirecting] = useState(false);

  /**
   * To'lov sahifasidan "Orqaga" bilan qaytilganda brauzer sahifani bfcache
   * dan tiklaydi va `redirecting` true holida qolib, tugma qulflanib qolardi.
   */
  useEffect(() => {
    const onPageShow = (e: PageTransitionEvent) => {
      if (e.persisted) setRedirecting(false);
    };
    window.addEventListener("pageshow", onPageShow);
    return () => window.removeEventListener("pageshow", onPageShow);
  }, []);

  /** Ko'rsatiladigan narx — DB dagi haqiqiy summa (yuklanmasa zaxira qiymat). */
  const priceOf = (plan: { planName: string; fallbackPrice: string }): string => {
    const dbPlan = paymePlans[plan.planName];
    return dbPlan ? formatTiyinAsSum(dbPlan.amount_tiyin) : plan.fallbackPrice;
  };

  /** Summa va muddat — DB dagi haqiqiy qiymat, yuklanmasa zaxira. */
  const amountAndDays = (plan: PlanCard): { tiyin: number; days: number } => {
    const dbPlan = paymePlans[plan.planName];
    if (dbPlan?.tariff_days) {
      return { tiyin: dbPlan.amount_tiyin, days: dbPlan.tariff_days };
    }
    return {
      tiyin: Number(plan.fallbackPrice.replace(/\s/g, "")) * 100,
      days: plan.fallbackDays,
    };
  };

  /**
   * Kunlik narx va haftalikka nisbatan arzonlik.
   *
   * Nega kerak: to'lovlarning ~63%i haftalik tarif, chunki 15 000 raqami
   * 35 000 dan arzon ko'rinadi. Kunlik hisobda esa oylik ~46% arzon —
   * bu farq hech qayerda ko'rsatilmagani uchun odam doim arzonini tanlaydi.
   */
  const perDayOf = (plan: PlanCard): string => {
    const { tiyin, days } = amountAndDays(plan);
    return formatTiyinPerDayAsSum(tiyin, days);
  };

  /** Haftalikka nisbatan necha foiz arzon (0 — arzon emas yoki o'zi haftalik). */
  const cheaperThanWeeklyPercent = (plan: PlanCard): number => {
    if (plan.planName === "weekly") return 0;
    const weekly = PLANS.find((p) => p.planName === "weekly");
    if (!weekly) return 0;

    const weeklyInfo = amountAndDays(weekly);
    const planInfo = amountAndDays(plan);
    if (!weeklyInfo.days || !planInfo.days) return 0;

    const weeklyPerDay = weeklyInfo.tiyin / weeklyInfo.days;
    const planPerDay = planInfo.tiyin / planInfo.days;
    if (!(planPerDay < weeklyPerDay)) return 0;

    return Math.round((1 - planPerDay / weeklyPerDay) * 100);
  };

  // Allow both guests and logged-in users to view the Pro page.

  const handleGetPro = () => {
    window.open('https://t.me/avtosmart1', '_blank');
  };

  /**
   * Tarif tugmasi — foydalanuvchini Payme to'lov sahifasiga olib boradi.
   *
   * PRO huquqi bu yerda BERILMAYDI: Payme to'lovni tasdiqlagach o'z serveridan
   * `payme` Edge Function ni chaqiradi va obuna `payme_perform_transaction`
   * ichida yoziladi. Shuning uchun havolani qo'lda ochib PRO olish mumkin emas.
   */
  const goToPayme = useCallback(
    async (planName: string): Promise<boolean> => {
      const email = user?.email?.trim();
      if (!email) {
        // Payme hisobni aynan email bo'yicha topadi (`account.email`)
        toast.error("Hisobingizda email ko'rsatilmagan. Administrator bilan bog'laning.");
        return false;
      }

      /**
       * Tarif hali yuklanmagan bo'lsa (sahifa ochilganda tarmoq uzilgan edi)
       * foydalanuvchini "sahifani yangilang" deb qaytarib yubormaymiz —
       * aynan SHU YERDA o'qib olamiz. Tugma bosilgan payt tarmoq deyarli
       * har doim tirik bo'ladi, shuning uchun bu xaridni saqlab qoladi.
       */
      let dbPlan = paymePlans[planName];
      if (!dbPlan) {
        const fresh = await fetchActivePaymePlans();
        if (fresh) {
          setPaymePlans(fresh);
          dbPlan = fresh[planName];
        }
      }
      if (!dbPlan) {
        toast.error("Tarif ma'lumoti yuklanmadi. Internetni tekshirib, qayta urinib ko'ring.");
        return false;
      }

      const checkoutUrl = buildPaymeCheckoutUrl({
        email,
        amountTiyin: dbPlan.amount_tiyin,
        // "?from=payme" — /profile shu belgini ko'rib, PRO holatini bir necha
        // marta qayta so'raydi (Payme server callback bilan browser qaytishi
        // orasida race condition bo'lishi mumkin, pastga qarang: Profile.tsx).
        callbackUrl: `${window.location.origin}/profile?from=payme`,
        language,
      });

      if (!checkoutUrl) {
        toast.error("To'lov havolasini yaratib bo'lmadi. Administrator bilan bog'laning.");
        return false;
      }

      // Payme'ga aynan shu yerda ketyapmiz — qolgan har qanday eski
      // pending tanlov endi kerak emas. Buni shu yerda (chaqiruvchidan
      // qat'i nazar) tozalamasak, keyinroq (masalan to'lovdan qaytgach
      // sessiya uzilib qayta login qilinganda) /auth foydalanuvchini
      // allaqachon to'langan bo'lsa ham qayta /pro ga yuborib yuboradi.
      clearPendingPlan();

      // Voronka: to'lov muvaffaqiyatli boshlandi — shu yerdan keyin
      // foydalanuvchi saytdan chiqib Payme'ga ketadi, ya'ni bu SO'NGGI
      // moment uni kuzata olamiz. Bekor qilingan/tugatilmagan tranzaksiya
      // (avgustda 5.6%) shu bilan "boshlangan" hisoblarga solishtiriladi.
      trackEvent("checkout_start", { plan: planName, provider: "payme" });
      window.location.href = checkoutUrl;
      return true;
    },
    [user, paymePlans, language],
  );

  /**
   * Tarif tugmasi (Click) — avval serverda buyurtma yaratiladi, keyin
   * foydalanuvchi CLICK to'lov sahifasiga yuboriladi.
   *
   * Summa klientdan olinmaydi: `click_create_order` uni `payme_plans` dan
   * o'qib buyurtmaga yozadi, CLICK esa Prepare da aynan shu summani
   * tekshiradi. PRO faqat CLICK ning imzolangan Complete so'rovidan keyin
   * `click` Edge Function orqali beriladi.
   */
  const goToClick = useCallback(async (planName: string): Promise<boolean> => {
    let order: ClickOrderResult | null = null;
    try {
      const { data, error } = await withTimeout(
        supabase.rpc("click_create_order", { p_plan_name: planName }),
        DB_READ_TIMEOUT_MS,
      );
      if (error) throw error;
      order = data as ClickOrderResult | null;
    } catch {
      toast.error("To'lov havolasini yaratib bo'lmadi. Internetni tekshirib, qayta urinib ko'ring.");
      return false;
    }

    if (!order?.ok) {
      switch (order?.error) {
        case "already_paid":
          toast.info("Sizda faol PRO obuna mavjud. Muddati tugagach yangi obuna olishingiz mumkin.");
          break;
        case "plan_not_found":
          toast.error("Tarif ma'lumoti yuklanmadi. Internetni tekshirib, qayta urinib ko'ring.");
          break;
        case "too_many_orders":
          toast.error("Urinishlar soni ko'payib ketdi. Birozdan so'ng qayta urinib ko'ring.");
          break;
        default:
          toast.error("To'lov havolasini yaratib bo'lmadi. Administrator bilan bog'laning.");
      }
      return false;
    }

    const payUrl = buildClickPayUrl({
      orderId: order.order_id ?? "",
      amountTiyin: Number(order.amount_tiyin),
      // "?from=click" — /profile PRO holatini bir necha marta qayta so'raydi
      // (CLICK Complete va brauzer qaytishi orasidagi race, Payme dagidek).
      returnUrl: `${window.location.origin}/profile?from=click`,
    });
    if (!payUrl) {
      toast.error("To'lov havolasini yaratib bo'lmadi. Administrator bilan bog'laning.");
      return false;
    }

    clearPendingPlan();
    trackEvent("checkout_start", { plan: planName, provider: "click" });
    window.location.href = payUrl;
    return true;
  }, []);

  const goToCheckout = useCallback(
    async (planName: string, via: PaymentProvider): Promise<void> => {
      setRedirecting(true);
      const redirected = via === "click" ? await goToClick(planName) : await goToPayme(planName);
      if (!redirected) setRedirecting(false);
    },
    [goToClick, goToPayme],
  );

  const handleBuyPlan = (planName: string, via: PaymentProvider) => {
    if (redirecting) return;

    if (!user) {
      // Mehmonning aksariyati hali ro'yxatdan o'tmagan — uni "Kirish" emas,
      // to'g'ridan-to'g'ri "Ro'yxatdan o'tish" bo'limiga olib boramiz va
      // tugagach shu sahifaga qaytaramiz. Tanlagan tarifi va to'lov tizimi
      // ham saqlanadi — ro'yxatdan o'tgach ularni qaytadan tanlashi shart emas.
      trackEvent("guest_buy_click", { plan: planName, provider: via });
      setPendingPlan(planName, via);
      toast.info("To'lov uchun avval ro'yxatdan o'ting — bir daqiqa vaqt oladi.");
      navigate('/auth', { state: { mode: 'signup', returnTo: '/pro' } });
      return;
    }

    // Faol PRO ustiga yangi PRO olinmaydi — muddat tugagach xarid qilinadi.
    // Bu qoida serverda ham bor (payme_resolve_account → already_paid), bu yerda
    // faqat foydalanuvchini keraksiz to'lov sahifasiga yubormaslik uchun.
    if (isPremium) {
      toast.info("Sizda faol PRO obuna mavjud. Muddati tugagach yangi obuna olishingiz mumkin.");
      return;
    }

    void goToCheckout(planName, via);
  };

  /**
   * Ro'yxatdan o'tib qaytgan foydalanuvchini to'g'ridan-to'g'ri to'lovga
   * o'tkazamiz — u tanlovini qaytadan qilishi shart emas.
   *
   * `access.loading` kutiladi: PRO holati aniqlanmasdan turib yo'naltirsak,
   * obunasi bor odam ham to'lov sahifasiga tushib qolardi.
   */
  useEffect(() => {
    if (isLoading || accessLoading || !user) return;

    /**
     * ILGARI bu yerda `paymePlans` BO'SH bo'lsa `return` qilinardi — ya'ni
     * tariflar so'rovi uzilgan bo'lsa, ro'yxatdan endigina o'tgan
     * foydalanuvchi /pro sahifasida JIMGINA osilib qolardi: na xato, na
     * yo'naltirish, tanlovi ham iste'mol qilinmasdi.
     *
     * Endi bo'sh ro'yxat emas, "o'qish tugadimi" kutiladi: urinishlar
     * muvaffaqiyatsiz tugasa ham davom etamiz — `goToPayme` tarifni
     * o'sha payt qayta o'qishga uriniadi.
     */
    if (!plansSettled) return;

    const planName = peekPendingPlan();
    if (!planName) return;
    // Click keyinchalik o'chirib qo'yilgan bo'lsa — Payme orqali davom etamiz.
    const pendingProvider: PaymentProvider =
      peekPendingProvider() === "click" && clickAvailable ? "click" : "payme";

    // Bu nuqtadan keyin tanlov har qanday holatda ham iste'mol qilinadi:
    // aks holda foydalanuvchi sahifaga har kirganda qayta yo'naltirilaverardi.
    clearPendingPlan();

    if (isPremium) {
      toast.info("Sizda allaqachon faol PRO obuna mavjud.");
      return;
    }

    if (PLANS.some((p) => p.planName === planName)) setSelectedPlan(planName);
    setProviderChoice(pendingProvider);
    toast.info("To'lov sahifasiga o'tkazilmoqda...");
    void goToCheckout(planName, pendingProvider);
  }, [isLoading, accessLoading, user, isPremium, plansSettled, clickAvailable, goToCheckout]);


  if (isLoading) {
    return (
      <MainLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="w-10 h-10 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <SEO
        title={t("pro.seoTitle")}
        description={t("pro.seoDescription")}
        path="/pro"
        keywords={t("pro.seoKeywords")}
      />

      {/* PRO Active Banner */}
      {user && isPremium && (
        <div className="bg-gradient-to-r from-amber-500/15 via-yellow-500/10 to-amber-500/15 border-b border-amber-500/30">
          <div className="max-w-7xl mx-auto px-4 lg:px-8 py-4">
            <div className="flex items-center justify-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-500 flex items-center justify-center shadow-md flex-shrink-0">
                <Crown className="w-5 h-5 text-white" />
              </div>
              <div className="text-center">
                <p className="font-bold text-amber-700 dark:text-amber-400 text-sm md:text-base">
                  {t("home.proStatusActive")}
                </p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  {t("pro.activeSubtitle")}
                </p>
              </div>
              <button
                onClick={() => navigate('/')}
                className="ml-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-amber-950 text-xs font-bold shadow-md transition-all hover:scale-[1.03] flex-shrink-0"
              >
                {t("pro.activeHomeButton")} →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Asosiy Qism: Ma'lumotlar va Narxlar */}
      <section className="py-6 md:py-10 bg-background">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-start">

            {/* CHAP TARAF: Ma'lumotlar va farqlar (8/12) */}
            <div className="lg:col-span-8 space-y-6">

              {/* Sarlavha qismi */}
              <div>
                <div className="inline-flex items-center gap-1.5 bg-amber-500/10 px-3 py-1 rounded-md mb-3 border border-amber-500/20">
                  <Crown className="w-4 h-4 text-amber-500" />
                  <span className="text-amber-600 font-bold uppercase text-xs tracking-wider">{t("pro.statusBadge")}</span>
                </div>
                <h1 className="text-xl md:text-2xl font-extrabold text-foreground mb-3 leading-tight" style={{ fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif" }}>
                  {t("pro.heroTitle")}
                </h1>
                <p className="text-muted-foreground text-sm md:text-base leading-relaxed max-w-2xl">
                  {t("pro.heroSubtitle")}
                </p>
              </div>

              {/* Taqqoslash Bloki (Oddiy vs PRO) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-5 relative">

                {/* O'rtadagi VS belgisi */}
                <div className="hidden sm:flex absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-8 h-8 bg-background border border-border rounded-full items-center justify-center z-10 font-bold text-muted-foreground text-xs shadow-sm">
                  {t("pro.comparisonVs")}
                </div>

                {/*
                  Ikkala ustun ham YAGONA manbadan (`PRO_COMPARISON`)
                  chiziladi. Ilgari o'nta qator qo'lda yozilgandi va
                  `/qoshimcha` dagi taqqoslash bilan bir-biriga mos
                  kelmasdi — foydalanuvchi ikki sahifada ikki xil va'dani
                  o'qirdi.
                */}

                {/* Oddiy Versiya */}
                <Card className="border-border bg-muted/20 shadow-none hover:shadow-sm transition-shadow">
                  <CardHeader className="pb-3 pt-5 border-b border-border/50 text-center bg-muted/30">
                    <CardTitle className="text-base text-muted-foreground font-semibold">{t("pro.comparisonTitle")}</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-5 space-y-4">
                    {PRO_COMPARISON.map((row) =>
                      row.inFree ? (
                        <div key={row.freeKey} className="flex items-start gap-2.5">
                          <Check className="w-5 h-5 text-green-500 shrink-0" />
                          <span className="text-sm text-foreground font-medium mt-0.5">{t(row.freeKey)}</span>
                        </div>
                      ) : (
                        <div key={row.freeKey} className="flex items-start gap-2.5 text-muted-foreground opacity-60">
                          <X className="w-5 h-5 text-red-400 shrink-0" />
                          <span className="text-sm line-through mt-0.5">{t(row.freeKey)}</span>
                        </div>
                      ),
                    )}
                  </CardContent>
                </Card>

                {/* PRO Versiya */}
                <Card className="border-2 border-amber-500/50 shadow-md shadow-amber-500/10 bg-gradient-to-br from-card to-amber-500/5 relative overflow-hidden z-0">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-amber-500/10 blur-[25px] rounded-full pointer-events-none"></div>
                  <CardHeader className="pb-3 pt-5 border-b border-amber-500/20 text-center bg-amber-500/10">
                    <CardTitle className="text-base text-amber-600 font-bold flex items-center justify-center gap-2">
                      <Crown className="w-5 h-5" /> {t("pro.comparisonProTitle")}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-5 space-y-4 relative z-10">
                    {PRO_COMPARISON.map((row) => (
                      <div key={row.proKey} className="flex items-start gap-2.5">
                        <Check className="w-5 h-5 text-amber-500 shrink-0" />
                        <span className="text-sm font-semibold text-foreground mt-0.5">{t(row.proKey)}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </div>

            </div>

            {/*
              TARIFLAR VA TO'LOV (4/12) — bitta blok. Ilgari u mobil va desktop
              uchun ikki marta chizilardi; endi bitta blok mobilda birinchi
              (`order-first`), desktopda o'ng ustunda (sticky) turadi.
            */}
            <aside className="order-first lg:order-none lg:col-span-4 lg:sticky lg:top-24">
              <div className="bg-card border border-border rounded-2xl p-4 md:p-5 shadow-sm">
                <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                  <Star className="w-5 h-5 text-amber-500" /> {t("pro.plansTitle")}
                </h2>

                <div role="radiogroup" aria-label={t("pro.plansTitle")} className="space-y-3">
                  {PLANS.map((plan) => {
                    const active = plan.planName === selectedPlan;
                    const percent = cheaperThanWeeklyPercent(plan);
                    const { days } = amountAndDays(plan);
                    return (
                      <button
                        key={plan.planName}
                        type="button"
                        role="radio"
                        aria-checked={active}
                        onClick={() => setSelectedPlan(plan.planName)}
                        className={`relative w-full text-left p-3.5 rounded-xl border-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60 ${
                          active
                            ? "border-amber-500 bg-amber-500/5 shadow-sm shadow-amber-500/10"
                            : "border-border bg-background hover:border-amber-500/40"
                        }`}
                      >
                        {plan.highlighted && (
                          <span className="absolute -top-2.5 right-3 bg-gradient-to-r from-amber-600 to-orange-600 text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full shadow-sm">
                            {t("pro.planPopular")}
                          </span>
                        )}

                        <div className="flex items-start gap-3">
                          <span
                            aria-hidden="true"
                            className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                              active ? "border-amber-500 bg-amber-500" : "border-muted-foreground/40"
                            }`}
                          >
                            {active && <Check className="w-3 h-3 text-white" strokeWidth={3} />}
                          </span>

                          <div className="flex-1 min-w-0">
                            <div className="flex items-baseline justify-between gap-2">
                              <span className="font-bold text-sm text-foreground">{t(plan.nameKey)}</span>
                              <span className="text-lg font-extrabold text-foreground whitespace-nowrap">
                                {priceOf(plan)} {t("pro.currency")}
                              </span>
                            </div>

                            {/* Muddat va kunlik narx — tariflarni HAQIQATAN taqqoslash mumkin bo'lgan o'lchov */}
                            <div className="flex items-center gap-x-2 gap-y-1 flex-wrap mt-1">
                              <span className="text-[12px] text-muted-foreground">
                                {t("pro.planDays").replace("{n}", String(days))} · {perDayOf(plan)} {t("pro.currency")} {t("pro.perDay")}
                              </span>
                              {percent > 0 && (
                                <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 bg-emerald-500/10 border border-emerald-500/25 px-2 py-0.5 rounded-full">
                                  {t("pro.cheaperThanWeekly").replace("{p}", String(percent))}
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* To'lov tizimi — standart holatda Payme; Click sozlangan bo'lsagina ko'rinadi */}
                {clickAvailable && (
                  <div className="mt-5">
                    <p className="text-xs font-semibold text-muted-foreground mb-2">{t("pro.paymentMethod")}</p>
                    <div role="radiogroup" aria-label={t("pro.paymentMethod")} className="grid grid-cols-2 gap-2">
                      {(["payme", "click"] as const).map((id) => {
                        const active = provider === id;
                        return (
                          <button
                            key={id}
                            type="button"
                            role="radio"
                            aria-checked={active}
                            aria-label={id === "payme" ? "Payme" : "Click"}
                            onClick={() => setProviderChoice(id)}
                            className={`relative h-12 rounded-xl border-2 flex items-center justify-center transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500/60 ${
                              active
                                ? "border-amber-500 bg-amber-500/5 shadow-sm"
                                : "border-border bg-background hover:border-amber-500/40"
                            }`}
                          >
                            <ProviderMark provider={id} />
                            {active && (
                              <span className="absolute top-1 right-1 w-4 h-4 rounded-full bg-amber-500 flex items-center justify-center">
                                <Check className="w-2.5 h-2.5 text-white" strokeWidth={3} />
                              </span>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <Button
                  className="w-full h-12 mt-4 text-base font-bold rounded-xl bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-700 hover:to-orange-700 text-white border-0 shadow-sm"
                  disabled={redirecting}
                  onClick={() => handleBuyPlan(selectedPlan, provider)}
                >
                  {redirecting
                    ? t("pro.paying")
                    : t("pro.payButton").replace(
                        "{price}",
                        priceOf(PLANS.find((p) => p.planName === selectedPlan) ?? PLANS[1]),
                      )}
                </Button>

                <p className="flex items-center justify-center gap-1.5 text-center text-[12px] text-muted-foreground mt-2.5">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  {t("pro.autoActivation")}
                </p>

                <p className="text-center text-[11px] text-muted-foreground mt-3 px-2 leading-relaxed">
                  {t("pro.planContactText")} <button onClick={handleGetPro} className="text-blue-500 hover:underline font-medium">{t("pro.planContactLink")}</button>.
                </p>
              </div>
            </aside>

          </div>
        </div>
      </section>

    </MainLayout>
  );
}
