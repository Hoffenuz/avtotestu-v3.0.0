import { useEffect } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { SEO } from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Crown, 
  Check, 
  Star, 
  Zap, 
  Shield, 
  Clock, 
  BookOpen, 
  Award,
  Sparkles
} from "lucide-react";

const features = [
  { icon: Zap, text: "Barcha mavzularga kirish" },
  { icon: BookOpen, text: "55 variant testlar" },
  { icon: Clock, text: "Cheksiz vaqt" },
  { icon: Shield, text: "Darslik guruhi" },
  { icon: Award, text: "Premium guruhga qo'shilish" },
  { icon: Star, text: "Prioritet qo'llab-quvvatlash" },
];

const plans = [
  {
    name: "Haftalik obuna",
    price: "15,000",
    period: "so'm/hafta",
    description: "Qisqa muddatli tayyorlanish uchun",
    features: [
      "Barcha 55+ variant",
      "Barcha mavzular",
      "Darslik guruhi",
      "7 kun muddatga",
    ],
    highlighted: false,
    buttonText: "Haftalik obuna olish",
    buttonVariant: "outline" as const,
  },
  {
    name: "Oylik obuna",
    price: "33,000",
    period: "so'm/oy",
    description: "Eng mashhur variant",
    features: [
      "Barcha 55+ variant",
      "Barcha mavzular",
      "Reklama yo'q",
      "Cheksiz testlar",
      "Pro telegram guruh",
      "Statistika",
    ],
    highlighted: true,
    buttonText: "Oylik obuna olish",
    buttonVariant: "default" as const,
  },
  {
    name: "3 Oylik obuna ",
    price: "83,000",
    period: "so'm/3 oy",
    description: "21% chegirma bilan",
    features: [
      "Barcha Pro imkoniyatlar",
      "3 oy muddatga",
      "Prioritet qo'llab-quvvatlash",
      "Premium telegram guruh",
      "Yangilanishlar",
    ],
    highlighted: false,
    buttonText: "3 Oylik obuna olish",
    buttonVariant: "outline" as const,
  },
];

export default function Pro() {
  const navigate = useNavigate();
  const { user, isLoading } = useAuth();

  // Redirect logged-in users away from Pro page
  useEffect(() => {
    if (!isLoading && user) {
      navigate('/');
    }
  }, [user, isLoading, navigate]);

  const handleGetPro = () => {
    // Open Telegram directly for payment
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
        title="Pro obuna - Premium imkoniyatlar"
        description="Avtotestu Pro obuna bilan 55+ variant, barcha mavzular va cheksiz testlarga kirish. Haftalik, oylik va 3 oylik rejalar mavjud."
        path="/pro"
        keywords="pro obuna, premium, avtotestu pro, obuna narxlari, prava test premium"
      />
      {/* Pricing Section - Moved to TOP */}
      <section className="py-8 md:py-12 bg-background">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 bg-primary/10 px-4 py-2 rounded-full mb-4">
              <Crown className="w-5 h-5 text-[hsl(var(--cta-orange))]" />
              <span className="text-primary font-medium">Pro obuna</span>
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-foreground mb-3" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              O'zingizga mos rejani tanlang
            </h1>
            <p className="text-muted-foreground max-w-xl mx-auto">
              Haydovchilik guvohnomasiga tayyorlanish uchun eng yaxshi variant
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 lg:gap-6">
            {plans.map((plan, index) => (
              <Card 
                key={index}
                className={`relative overflow-hidden transition-all duration-300 hover:shadow-xl ${
                  plan.highlighted 
                    ? "border-2 border-[hsl(var(--cta-green))] shadow-lg md:scale-105" 
                    : "border-border"
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute top-0 left-0 right-0 bg-[hsl(var(--cta-green))] text-white text-center py-1 text-sm font-medium">
                    <Crown className="w-4 h-4 inline mr-1" />
                    Eng mashhur
                  </div>
                )}
                <CardHeader className={`pb-2 ${plan.highlighted ? "pt-10" : "pt-6"}`}>
                  <CardTitle className="text-xl font-bold" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    {plan.name}
                  </CardTitle>
                  <p className="text-muted-foreground text-sm">{plan.description}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                    <span className="text-muted-foreground text-sm">{plan.period}</span>
                  </div>

                  <ul className="space-y-2">
                    {plan.features.map((feature, fIndex) => (
                      <li key={fIndex} className="flex items-center gap-2">
                        <Check className={`w-4 h-4 ${plan.highlighted ? "text-[hsl(var(--cta-green))]" : "text-primary"}`} />
                        <span className="text-foreground text-sm">{feature}</span>
                      </li>
                    ))}
                  </ul>

                  <Button
                    className={`w-full ${
                      plan.highlighted 
                        ? "bg-[hsl(var(--cta-green))] hover:bg-[hsl(var(--cta-green-hover))]" 
                        : ""
                    }`}
                    variant={plan.buttonVariant}
                    onClick={handleGetPro}
                  >
                    {plan.buttonText}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-8 bg-primary/5">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-xl font-bold text-center text-foreground mb-6" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            Pro bilan nimalar kiradi?
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <div 
                  key={index}
                  className="flex items-center gap-3 bg-card rounded-xl p-3 border border-border"
                >
                  <Icon className="w-5 h-5 text-[hsl(var(--cta-green))]" />
                  <span className="text-foreground text-sm font-medium">{feature.text}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-8 bg-background">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <Card className="border-none shadow-lg bg-card p-6">
            <Crown className="w-12 h-12 text-[hsl(var(--cta-orange))] mx-auto mb-4" />
            <h2 className="text-xl font-bold text-foreground mb-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              Savol-javob
            </h2>
            <p className="text-muted-foreground mb-4 text-sm">
              Pro obuna haqida savollaringiz bormi? Telegram orqali bog'laning!
            </p>
            <Button 
              size="lg"
              className="bg-[hsl(var(--cta-blue))] hover:bg-[hsl(var(--cta-blue-hover))]"
              onClick={() => window.open('https://t.me/avtotestu_ad', '_blank')}
            >
              Telegram orqali bog'lanish
            </Button>
          </Card>
        </div>
      </section>
    </MainLayout>
  );
}
