import { useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { 
  Crown, 
  Check, 
  X,
  Star, 
  Zap, 
  ShieldCheck, 
  Clock, 
  BookOpen, 
  PlayCircle,
  Database,
  Send
} from "lucide-react";

export default function Pro() {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();
  const { t } = useLanguage();

  const features = [
    { icon: Database, textKey: "pro.feature1" },
    { icon: PlayCircle, textKey: "pro.feature2" },
    { icon: BookOpen, textKey: "pro.feature3" },
    { icon: Zap, textKey: "pro.feature4" },
    { icon: Clock, textKey: "pro.feature5" },
    { icon: ShieldCheck, textKey: "pro.feature6" },
    { icon: Star, textKey: "pro.feature7" },
  ];

  const plans = [
    {
      nameKey: "pro.planWeekly",
      price: "15,000",
      periodKey: "pro.planWeeklyDesc",
      descriptionKey: "pro.planWeeklyDesc",
      highlighted: false,
      buttonTextKey: "pro.planWeeklyButton",
      buttonVariant: "outline" as const,
    },
    {
      nameKey: "pro.planMonthly",
      price: "33,000",
      periodKey: "pro.planMonthlyDesc",
      descriptionKey: "pro.planMonthlyDesc",
      highlighted: true,
      buttonTextKey: "pro.planMonthlyButton",
      buttonVariant: "default" as const,
    },
    {
      nameKey: "pro.planQuarterly",
      price: "83,000",
      periodKey: "pro.planQuarterlyDesc",
      descriptionKey: "pro.planQuarterlyDesc",
      highlighted: false,
      buttonTextKey: "pro.planQuarterlyButton",
      buttonVariant: "outline" as const,
    },
  ];

  useEffect(() => {
    if (!isLoading && user) {
      navigate('/');
    }
  }, [user, isLoading, navigate]);

  const handleGetPro = () => {
    window.open('https://t.me/avtotestu_ad', '_blank');
  };

  if (isLoading || user) {
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
      
      {/* Asosiy Qism: Ma'lumotlar va Narxlar */}
      <section className="py-6 md:py-10 bg-background">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-start">
            
            {/* CHAP TARAF: Ma'lumotlar va Katta Farqlar (8/12) */}
            <div className="lg:col-span-8 space-y-6">
              
              {/* Sarlavha qismi */}
              <div>
                <div className="inline-flex items-center gap-1.5 bg-amber-500/10 px-3 py-1 rounded-md mb-3 border border-amber-500/20">
                  <Crown className="w-4 h-4 text-amber-500" />
                  <span className="text-amber-600 font-bold uppercase text-xs tracking-wider">{t("pro.statusBadge")}</span>
                </div>
                <h1 className="text-2xl md:text-3xl font-extrabold text-foreground mb-3" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  {t("pro.title")} <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-600">{t("pro.titleHighlight")}</span> {t("pro.titleSuffix")}
                </h1>
                <p className="text-muted-foreground text-sm md:text-base leading-relaxed max-w-2xl">
                  {t("pro.subtitle")}
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
                  variant="secondary" 
                  size="sm" 
                  className="gap-2 text-xs md:text-sm font-medium hover:bg-muted/80 shadow-sm"
                  onClick={handleGetPro}
                >
                  <Send className="w-4 h-4 text-blue-500" />
                  {t("pro.contactButton")}
                </Button>
              </div>

            </div>

            {/* O'NG TARAF: Ta'riflar / Narxlar (4/12) */}
            <div className="lg:col-span-4 lg:sticky lg:top-24 space-y-4">
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
                        <span className="text-xl font-extrabold">{plan.price}</span>
                        <span className="text-[13px] font-medium text-muted-foreground mb-1">{t(plan.periodKey)}</span>
                      </div>

                      <Button
                        className={`w-full h-10 text-sm font-bold rounded-lg ${
                          plan.highlighted 
                            ? "bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white border-0 shadow-sm" 
                            : "bg-muted hover:bg-muted/80"
                        }`}
                        variant={plan.buttonVariant}
                        onClick={handleGetPro}
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

      {/* Qo'shimcha Afzalliklar Ro'yxati */}
      <section className="py-10 bg-primary/5 border-t border-border">
        <div className="max-w-7xl mx-auto px-4 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-xl font-bold text-foreground mb-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              {t("pro.benefitsTitle")}
            </h2>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div 
                  key={index}
                  className="flex items-center gap-3 bg-card rounded-xl p-3 border border-border shadow-sm hover:border-amber-500/30 transition-colors"
                >
                  <div className="w-8 h-8 rounded-full bg-amber-500/10 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-amber-600" />
                  </div>
                  <span className="text-[13px] font-medium leading-snug text-foreground">{t(feature.textKey)}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    </MainLayout>
  );
}