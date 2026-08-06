import { Link } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { SEO } from "@/components/SEO";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BookOpen, ChevronRight, Download, FileText, Lightbulb, ListChecks, Monitor, Newspaper, Play, Target, WifiOff } from "lucide-react";

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
  return (
    <MainLayout>
      <SEO
        title="Test Tayyorgarlik Yo'riqnomasi — Maslahat va Strategiyalar"
        description="YHQ imtihoniga tez va samarali tayyorlanish sirlari: o'rganish strategiyalari, amaliy mashqlar va tajribali maslahatlar — bir joyda."
        path="/qoshimcha"
        keywords="test tayyorgarlik, o'rganish strategiyasi, imtihon maslahatlari, YHQ yo'riqnoma"
      />

      {/* Hero Section */}
      <section className="relative py-16 md:py-24 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary-hover to-primary-light" />
        <div className="absolute inset-0 hero-pattern" />
        <div className="relative max-w-7xl mx-auto px-4 text-center">
          <h1 className="text-4xl md:text-5xl font-bold text-primary-foreground mb-6" style={{ fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif" }}>
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
            <Link to="/yangiliklar">
              <Button variant="outline" className="bg-primary-foreground/10 border-primary-foreground/20 text-primary-foreground hover:bg-primary-foreground/20 gap-2 px-6 py-5 rounded-full font-semibold">
                <Newspaper className="w-5 h-5" />
                Yangiliklar
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

      {/* Desktop ilova konteyneri */}
      <section className="py-8 md:py-10 bg-background">
        <div className="max-w-4xl mx-auto px-4">
          <Card className="border border-emerald-200/70 shadow-lg overflow-hidden">
            <CardContent className="p-0">
              <div className="flex flex-col md:flex-row md:items-stretch">
                <div className="md:w-2/5 bg-gradient-to-br from-emerald-600 to-emerald-700 p-6 md:p-8 flex flex-col justify-center text-white">
                  <div className="w-12 h-12 rounded-xl bg-white/15 border border-white/20 flex items-center justify-center mb-4">
                    <Monitor className="w-6 h-6" />
                  </div>
                  <h2
                    className="text-xl md:text-2xl font-bold leading-tight mb-2"
                    style={{ fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif" }}
                  >
                    Desktop ilova
                  </h2>
                  <p className="text-sm text-white/85 leading-relaxed">
                    Kompyuteringizga o&apos;rnating va internetsiz ham test ishlashingiz mumkin.
                  </p>
                  <div className="flex items-center gap-1.5 mt-4 text-xs text-white/75">
                    <WifiOff className="w-3.5 h-3.5" />
                    Windows 10/11 · Offline rejim
                  </div>
                </div>

                <div className="flex-1 p-6 md:p-8 flex flex-col justify-center gap-5">
                  <div>
                    <p className="font-semibold text-foreground mb-1">Nima uchun kerak?</p>
                    <ul className="text-sm text-muted-foreground space-y-1.5 leading-relaxed">
                      <li>— Internet bo&apos;lmasa ham test ishlang</li>
                      <li>— Katta ekranda qulay o&apos;rganing</li>
                      <li>— PRO bo&apos;limlar uchun kalit bilan faollashtiring</li>
                    </ul>
                  </div>
                  <Link to="/desktop" className="w-full md:w-auto self-start">
                    <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl px-6 py-5 font-semibold shadow-md shadow-emerald-600/20">
                      <Download className="w-4 h-4" />
                      Yuklab olish sahifasi
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </Link>
                </div>
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
                    <h3 className="font-bold text-lg text-foreground mb-2" style={{ fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif" }}>
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
              <h2 className="text-2xl font-bold text-foreground mb-6 text-center" style={{ fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif" }}>
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
