import { Link } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { SEO } from "@/components/SEO";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { 
  BookOpen, 
  ListChecks, 
  Target, 
  Lightbulb, 
  Play,
  FileText,
  Crown
} from "lucide-react";

const cards = [
  {
    icon: FileText,
    title: "Test tuzilishi",
    description: "Test savollari mavzular bo'yicha guruhlangan: belgilar, qoidalar, harakatlanish holatlari va birinchi yordamga oid savollar. Har bir savol bitta to'g'ri javobga ega."
  },
  {
    icon: Target,
    title: "O'rganish strategiyalari",
    description: "Belgilarni vizual tarzda yodlash, testlarni mashaqqat bilan yechish va noto'g'ri javoblarni alohida qayta ko'rib chiqish muvaffaqiyatni oshiradi."
  },
  {
    icon: ListChecks,
    title: "Amaliy mashqlar",
    description: "20 va 50 savollik mashqlar mavjud — boshlanish uchun 20 savol rejimidan boshlash tavsiya etiladi. Har bir mashq sizga xatolaringizni ko'rsatadi."
  },
  {
    icon: Lightbulb,
    title: "Resurslar",
    description: "Grafik materiallar, rasmlar va video qo'llanmalar yordamida murakkab vaziyatlarni osonroq tushunishingiz mumkin."
  }
];

const tips = [
  "Kuzatuvchi belgilarni diqqat bilan o'qing.",
  "Har bir savolga 30-45 soniya ajrating.",
  "Amaliy savollarni qayta ko'rib, xatolarni tahlil qiling.",
  "Kuniga kamida 1-2 ta variant yechib boring.",
  "Yo'l belgilarini tasvirlar bilan birga yodlang."
];

export default function Qoshimcha() {
  const { user, profile } = useAuth();
  
  return (
    <MainLayout>
      <SEO 
        title="Qo'shimcha ma'lumotlar - Test tayyorgarlik yo'riqnomasi"
        description="Haydovchilik testiga tayyorlanish bo'yicha batafsil yo'riqnoma, amaliy maslahatlar va strategiyalar. Muvaffaqiyatli o'tish sirlari."
        path="/qoshimcha"
        keywords="test tayyorgarlik, o'rganish strategiyasi, imtihon maslahatlari, YHQ yo'riqnoma"
      />
      {/* Hero Section */}
      <section className="relative py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary-hover to-primary-light" />
        <div className="absolute inset-0 hero-pattern" />
        
        <div className="relative max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-primary-foreground mb-6" style={{ fontFamily: 'Montserrat, sans-serif' }}>
            Qo'shimcha ma'lumotlar
          </h1>
          <p className="text-lg md:text-xl text-primary-foreground/90 max-w-2xl mx-auto mb-8">
            Testga tayyorlanish bo'yicha batafsil yo'riqnoma, amaliy maslahatlar va qo'llanmalar.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/darslik">
              <Button className="bg-card text-foreground hover:bg-secondary gap-2 px-6 py-5 rounded-full font-semibold">
                <BookOpen className="w-5 h-5" />
                Darslik
              </Button>
            </Link>
            <Link to="/variant">
              <Button className="bg-[hsl(var(--cta-green))] hover:bg-[hsl(var(--cta-green-hover))] text-white gap-2 px-6 py-5 rounded-full">
                <Play className="w-5 h-5" />
                Testlarni boshlash
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* PRO Section */}
      <section className="py-12 bg-gradient-to-r from-pro-bg to-pro-bg-end border-y-2 border-pro">
        <div className="max-w-4xl mx-auto px-4">
          <Card className="border-2 border-pro shadow-xl bg-card relative overflow-hidden">
            <span className="absolute top-0 right-0 bg-pro text-pro-foreground text-sm font-bold px-4 py-1 rounded-bl-xl">
              PRO
            </span>
            <CardContent className="p-6 md:p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-pro rounded-full flex items-center justify-center">
                  <Crown className="w-6 h-6 text-pro-foreground" />
                </div>
                <h2 className="text-2xl font-bold text-foreground" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  PRO Bo'limi Haqida
                </h2>
              </div>
              <p className="text-foreground leading-relaxed text-base">
                PRO bo'limi oddiy testdan farq qiladi va savollar to'g'riligi to'g'ridan to'g'ri admin tomonidan tekshiriladi. Imtihonda ushbu testlarning tushish ehtimoli yuqori va bu testni ishlash orqali avtomaktabimizda ancha faol natijalarga erishganmiz. PRO funksiyasi yordamida maxsus videodarslarimiz orqali o'z bilimlaringizni yanada oshirib borishingiz mumkin va siz bilan admin tomonidan shug'ullaniladi.
              </p>
              <div className="mt-6">
                {user && profile?.is_pro ? (
                  <div className="flex items-center gap-3 bg-pro/10 border border-pro rounded-full px-6 py-3 w-fit">
                    <Crown className="w-5 h-5 text-pro" />
                    <span className="font-semibold text-foreground">
                      {profile.full_name || profile.username || 'PRO Foydalanuvchi'}
                    </span>
                    <span className="text-xs bg-pro text-pro-foreground px-2 py-0.5 rounded-full font-bold">
                      PRO
                    </span>
                  </div>
                ) : (
                  <Link to="/pro">
                    <Button className="bg-pro hover:bg-pro-hover text-pro-foreground gap-2 px-6 py-5 rounded-full font-semibold">
                      <Crown className="w-5 h-5" />
                      PRO obunaga o'tish
                    </Button>
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* Cards Section */}
      <section className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {cards.map((card, index) => {
              const Icon = card.icon;
              return (
                <Card key={index} className="border-none shadow-lg hover:shadow-xl transition-shadow">
                  <CardContent className="pt-6">
                    <div className="w-14 h-14 bg-primary/10 rounded-xl flex items-center justify-center mb-4">
                      <Icon className="w-7 h-7 text-primary" />
                    </div>
                    <h3 className="font-bold text-lg text-foreground mb-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                      {card.title}
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {card.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Tips Section */}
      <section className="py-16 bg-secondary/30">
        <div className="max-w-4xl mx-auto px-4">
          <Card className="border-none shadow-xl">
            <CardContent className="p-8">
              <h2 className="text-2xl font-bold text-foreground mb-6 text-center" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                Tez maslahatlar
              </h2>
              <ul className="space-y-4">
                {tips.map((tip, index) => (
                  <li key={index} className="flex items-start gap-4">
                    <div className="w-8 h-8 bg-[hsl(var(--cta-green))] rounded-full flex items-center justify-center flex-shrink-0 text-white font-bold text-sm">
                      {index + 1}
                    </div>
                    <p className="text-foreground pt-1">{tip}</p>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </section>
    </MainLayout>
  );
}
