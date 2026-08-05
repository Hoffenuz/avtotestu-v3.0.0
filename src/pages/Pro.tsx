import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAccessState } from "@/hooks/useAccessState";
import { supabase } from "@/integrations/supabase/client";
import { buildPaymeCheckoutUrl, formatTiyinAsSum, type PaymePlan } from "@/lib/payme";
import { toast } from "sonner";
import { Crown, Check, X, Star, Send } from "lucide-react";

export default function Pro() {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const { t, language } = useLanguage();
  const { isPremium } = useAccessState();

  /**
   * Tariflar DB dan olinadi: Payme summani `payme_plans.amount_tiyin` bo'yicha
   * tekshiradi, shuning uchun sahifadagi narx bilan DB dagi summa bir xil
   * bo'lishi shart. Hardcode qilinganda narx o'zgartirilsa Payme -31001
   * (invalid_amount) qaytarib, to'lov ishlamay qolardi.
   */
  const [paymePlans, setPaymePlans] = useState<Record<string, PaymePlan>>({});

  useEffect(() => {
    const controller = new AbortController();

    (async () => {
      try {
        const { data, error } = await supabase
          .from("payme_plans")
          .select("plan_name, amount_tiyin, tariff_days")
          .eq("is_active", true)
          .abortSignal(controller.signal);

        if (error || !data || controller.signal.aborted) return;

        const byName: Record<string, PaymePlan> = {};
        for (const plan of data) byName[plan.plan_name] = plan;
        setPaymePlans(byName);
      } catch {
        // Tarmoq xatosi — narxlar sahifadagi zaxira qiymatda ko'rsatiladi
      }
    })();

    return () => controller.abort();
  }, []);

  const plans = [
    {
      planName: "weekly",
      nameKey: "pro.planWeekly",
      fallbackPrice: "15 000",
      periodKey: "pro.planWeeklyDesc",
      descriptionKey: "pro.planWeeklyDesc",
      highlighted: false,
      buttonTextKey: "pro.planWeeklyButton",
      buttonVariant: "outline" as const,
    },
    {
      planName: "monthly",
      nameKey: "pro.planMonthly",
      fallbackPrice: "35 000",
      periodKey: "pro.planMonthlyDesc",
      descriptionKey: "pro.planMonthlyDesc",
      highlighted: true,
      buttonTextKey: "pro.planMonthlyButton",
      buttonVariant: "default" as const,
    },
    {
      planName: "quarterly",
      nameKey: "pro.planQuarterly",
      fallbackPrice: "83 000",
      periodKey: "pro.planQuarterlyDesc",
      descriptionKey: "pro.planQuarterlyDesc",
      highlighted: false,
      buttonTextKey: "pro.planQuarterlyButton",
      buttonVariant: "outline" as const,
    },
  ];

  /** Ko'rsatiladigan narx — DB dagi haqiqiy summa (yuklanmasa zaxira qiymat). */
  const priceOf = (plan: { planName: string; fallbackPrice: string }): string => {
    const dbPlan = paymePlans[plan.planName];
    return dbPlan ? formatTiyinAsSum(dbPlan.amount_tiyin) : plan.fallbackPrice;
  };

  // Allow both guests and logged-in users to view the Pro page.

  const handleGetPro = () => {
    window.open('https://t.me/avtotestu_ad', '_blank');
  };

  /**
   * Tarif tugmasi — foydalanuvchini Payme to'lov sahifasiga olib boradi.
   *
   * PRO huquqi bu yerda BERILMAYDI: Payme to'lovni tasdiqlagach o'z serveridan
   * `payme` Edge Function ni chaqiradi va obuna `payme_perform_transaction`
   * ichida yoziladi. Shuning uchun havolani qo'lda ochib PRO olish mumkin emas.
   */
  const handleBuyPlan = (planName: string) => {
    if (!user) {
      // Mehmonning aksariyati hali ro'yxatdan o'tmagan — uni "Kirish" emas,
      // to'g'ridan-to'g'ri "Ro'yxatdan o'tish" bo'limiga olib boramiz va
      // tugagach shu sahifaga qaytaramiz.
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

    const email = user.email?.trim();
    if (!email) {
      // Payme hisobni aynan email bo'yicha topadi (`account.email`)
      toast.error("Hisobingizda email ko'rsatilmagan. Administrator bilan bog'laning.");
      return;
    }

    const dbPlan = paymePlans[planName];
    if (!dbPlan) {
      toast.error("Tarif ma'lumoti yuklanmadi. Sahifani yangilab, qayta urinib ko'ring.");
      return;
    }

    const checkoutUrl = buildPaymeCheckoutUrl({
      email,
      amountTiyin: dbPlan.amount_tiyin,
      callbackUrl: `${window.location.origin}/profile`,
      language,
    });

    if (!checkoutUrl) {
      toast.error("To'lov havolasini yaratib bo'lmadi. Administrator bilan bog'laning.");
      return;
    }

    window.location.href = checkoutUrl;
  };


  if (isLoading) {
    return (
      <MainLayout>
        <div className="min-h-[60vh] flex items-center justify-center">
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
                  Barcha PRO imkoniyatlar faol — testlarni boshlang!
                </p>
              </div>
              <button
                onClick={() => navigate('/')}
                className="ml-2 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white text-xs font-bold shadow-md transition-all hover:scale-[1.03] flex-shrink-0"
              >
                Bosh sahifa →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Asosiy Qism: Ma'lumotlar va Narxlar */}
      <section className="py-6 md:py-10 bg-background">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-start">
            
            {/* MOBILE: Narxlar birinchi (lg:hidden) */}
            <div className="lg:hidden space-y-4">
              <div className="bg-card border border-border rounded-2xl p-4 md:p-5 shadow-sm">
                <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                  <Star className="w-5 h-5 text-amber-500" /> {t("pro.plansTitle")}
                </h2>
                
                <div className="space-y-3">
                  {plans.map((plan, index) => (
                    <div 
                      key={index}
                      className={`relative p-4 rounded-xl border transition-all ${
                        plan.highlighted 
                          ? "border-amber-500 bg-amber-500/5 shadow-sm shadow-amber-500/10 border-2" 
                          : "border-border bg-background hover:border-amber-500/40"
                      }`}
                    >
                      {plan.highlighted && (
                        <div className="absolute -top-2.5 right-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full shadow-sm">
                          {t("pro.planPopular")}
                        </div>
                      )}
                      
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-bold text-sm">{t(plan.nameKey)}</h3>
                          <p className="text-[13px] text-muted-foreground mt-0.5">{t(plan.descriptionKey)}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-end gap-1.5 mb-3.5">
                        <span className="text-xl font-extrabold">{priceOf(plan)} so&apos;m</span>
                        <span className="text-[13px] font-medium text-muted-foreground mb-1">{t(plan.periodKey)}</span>
                      </div>

                      <Button
                        className={`w-full h-10 text-sm font-bold rounded-lg ${
                          plan.highlighted 
                            ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0 shadow-sm" 
                            : "bg-muted hover:bg-muted/80"
                        }`}
                        variant={plan.buttonVariant}
                        onClick={() => handleBuyPlan(plan.planName)}
                      >
                        {t(plan.buttonTextKey)}
                      </Button>
                    </div>
                  ))}
                </div>
                
                <p className="text-center text-[11px] text-muted-foreground mt-4 px-2 leading-relaxed">
                  {t("pro.planContactText")} <button onClick={handleGetPro} className="text-blue-500 hover:underline font-medium">{t("pro.planContactLink")}</button>.
                </p>
              </div>
            </div>
            
            {/* CHAP TARAF: Ma'lumotlar va Katta Farqlar (8/12) */}
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

                {/* Oddiy Versiya */}
                <Card className="border-border bg-muted/20 shadow-none hover:shadow-sm transition-shadow">
                  <CardHeader className="pb-3 pt-5 border-b border-border/50 text-center bg-muted/30">
                    <CardTitle className="text-base text-muted-foreground font-semibold">{t("pro.comparisonTitle")}</CardTitle>
                  </CardHeader>
                  <CardContent className="pt-5 space-y-4">
                    <div className="flex items-start gap-2.5">
                      <Check className="w-5 h-5 text-green-500 shrink-0" />
                      <span className="text-sm text-foreground font-medium mt-0.5">{t("pro.comparisonBasic1")}</span>
                    </div>
                    <div className="flex items-start gap-2.5 text-muted-foreground opacity-60">
                      <X className="w-5 h-5 text-red-400 shrink-0" />
                      <span className="text-sm line-through mt-0.5">{t("pro.comparisonBasic2")}</span>
                    </div>
                    <div className="flex items-start gap-2.5 text-muted-foreground opacity-60">
                      <X className="w-5 h-5 text-red-400 shrink-0" />
                      <span className="text-sm line-through mt-0.5">{t("pro.comparisonBasic3")}</span>
                    </div>
                    <div className="flex items-start gap-2.5 text-muted-foreground opacity-60">
                      <X className="w-5 h-5 text-red-400 shrink-0" />
                      <span className="text-sm line-through mt-0.5">{t("pro.comparisonBasic4")}</span>
                    </div>
                    <div className="flex items-start gap-2.5 text-muted-foreground opacity-60">
                      <X className="w-5 h-5 text-red-400 shrink-0" />
                      <span className="text-sm line-through mt-0.5">{t("pro.comparisonBasic5")}</span>
                    </div>
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
                    <div className="flex items-start gap-2.5">
                      <Check className="w-5 h-5 text-amber-500 shrink-0" />
                      <span className="text-sm font-semibold text-foreground mt-0.5">{t("pro.comparisonPro1")}</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <Check className="w-5 h-5 text-amber-500 shrink-0" />
                      <span className="text-sm font-semibold text-foreground mt-0.5">{t("pro.comparisonPro2")}</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <Check className="w-5 h-5 text-amber-500 shrink-0" />
                      <span className="text-sm font-semibold text-foreground mt-0.5">{t("pro.comparisonPro3")}</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <Check className="w-5 h-5 text-amber-500 shrink-0" />
                      <span className="text-sm font-semibold text-foreground mt-0.5">{t("pro.comparisonPro4")}</span>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <Check className="w-5 h-5 text-amber-500 shrink-0" />
                      <span className="text-sm font-semibold text-foreground mt-0.5">{t("pro.comparisonPro5")}</span>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Murojaat tugmasi (Farqlarning tagida) */}
              <div className="flex sm:justify-start">
                <Button
                  size="lg"
                  className="gap-2.5 px-6 h-11 font-semibold rounded-xl border-2 hover:bg-primary hover:text-primary-foreground transition-all duration-300"
                  variant="outline"
                  onClick={handleGetPro}
                >
                  <Send className="w-5 h-5" />
                  {t("pro.contactButton")}
                </Button>
              </div>

            </div>

            {/* O'NG TARAF: Ta'riflar / Narxlar (4/12) - Desktop only */}
            <div className="hidden lg:block lg:col-span-4 lg:sticky lg:top-24 space-y-4">
              <div className="bg-card border border-border rounded-2xl p-4 md:p-5 shadow-sm">
                <h2 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                  <Star className="w-5 h-5 text-amber-500" /> {t("pro.plansTitle")}
                </h2>
                
                <div className="space-y-3">
                  {plans.map((plan, index) => (
                    <div 
                      key={index}
                      className={`relative p-4 rounded-xl border transition-all ${
                        plan.highlighted 
                          ? "border-amber-500 bg-amber-500/5 shadow-sm shadow-amber-500/10 border-2" 
                          : "border-border bg-background hover:border-amber-500/40"
                      }`}
                    >
                      {plan.highlighted && (
                        <div className="absolute -top-2.5 right-3 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full shadow-sm">
                          {t("pro.planPopular")}
                        </div>
                      )}
                      
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="font-bold text-sm">{t(plan.nameKey)}</h3>
                          <p className="text-[13px] text-muted-foreground mt-0.5">{t(plan.descriptionKey)}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-end gap-1.5 mb-3.5">
                        <span className="text-xl font-extrabold">{priceOf(plan)} so&apos;m</span>
                        <span className="text-[13px] font-medium text-muted-foreground mb-1">{t(plan.periodKey)}</span>
                      </div>

                      <Button
                        className={`w-full h-10 text-sm font-bold rounded-lg ${
                          plan.highlighted 
                            ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0 shadow-sm" 
                            : "bg-muted hover:bg-muted/80"
                        }`}
                        variant={plan.buttonVariant}
                        onClick={() => handleBuyPlan(plan.planName)}
                      >
                        {t(plan.buttonTextKey)}
                      </Button>
                    </div>
                  ))}
                </div>
                
                <p className="text-center text-[11px] text-muted-foreground mt-4 px-2 leading-relaxed">
                  {t("pro.planContactText")} <button onClick={handleGetPro} className="text-blue-500 hover:underline font-medium">{t("pro.planContactLink")}</button>.
                </p>

              </div>
            </div>

          </div>
        </div>
      </section>

    </MainLayout>
  );
}