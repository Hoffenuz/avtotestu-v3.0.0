import { Link } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { SEO } from "@/components/SEO";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  ListChecks,
  Target,
  Lightbulb,
  Play,
  FileText,
  QrCode,
  RotateCcw,
  CreditCard,
  ShieldCheck,
  Clock
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

      {/* Payment Section */}
      <section className="py-10 md:py-14 bg-background">
        <div className="max-w-3xl mx-auto px-4">

          {/* Heading */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-3">
              <QrCode className="w-3.5 h-3.5" />
              To'lov ma'lumotlari
            </div>
            <h2 className="text-xl md:text-2xl font-bold text-foreground" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              PRO obunani olish uchun telegram orqali adminga bog'laning yoki quyidagi QR kod orqali Paynet tizimida to'lovni amalga oshiring
            </h2>
            <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
              Quyidagi QR kod orqali Paynet tizimida to'lovni amalga oshiring yoki admin bilan Telegram orqali bog'laning.
            </p>
          </div>

          {/* QR + Info: mobile stacked, desktop side-by-side */}
          <div className="flex flex-col md:grid md:grid-cols-[1fr_1fr] md:gap-6 md:items-start">

            {/* QR Code */}
            <Card className="border border-muted/60 shadow-md mb-5 md:mb-0">
              <CardContent className="p-5 flex flex-col items-center gap-4">
                <span className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  <QrCode className="w-3.5 h-3.5" />
                  Paynet QR Code
                </span>
                <div className="w-full max-w-[300px] md:max-w-none aspect-square rounded-xl border-2 border-primary/20 overflow-hidden bg-white mx-auto">
                  <img
                    src="/paynet.webp"
                    alt="Paynet to'lov QR kodi"
                    className="w-full h-full object-contain p-2"
                    loading="lazy"
                    width="300"
                    height="300"
                  />
                </div>
                <p className="text-xs text-muted-foreground text-center leading-relaxed">
                  Telefon kamerasi yoki Paynet ilovasi bilan skanerlang
                </p>
              </CardContent>
            </Card>

          {/* Info cards */}
          <div className="flex flex-col gap-3">

            {/* Refund */}
            <div className="rounded-xl border border-amber-200 dark:border-amber-800/40 bg-amber-50 dark:bg-amber-950/20 p-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-amber-500/15 flex items-center justify-center flex-shrink-0">
                  <RotateCcw className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-foreground mb-1" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    To'lovni qaytarish
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Agar saytimiz maqul kelmagan bo'lsa, to'lovni qaytarish imkoniyati mavjud.
                  </p>
                  <div className="mt-2 flex items-center gap-1.5 bg-amber-100 dark:bg-amber-900/30 border border-amber-300/40 dark:border-amber-700/30 rounded-lg px-2.5 py-1.5">
                    <Clock className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 flex-shrink-0" />
                    <p className="text-[11px] font-semibold text-amber-700 dark:text-amber-300">
                      48 soat ichida adminga murojaat qilishingizni iltimos qilamiz
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Cash note */}
            <div className="rounded-xl border border-blue-200 dark:border-blue-800/40 bg-blue-50 dark:bg-blue-950/20 p-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-blue-500/15 flex items-center justify-center flex-shrink-0">
                  <CreditCard className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-foreground mb-1" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    Karta to'lovlari haqida
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    Karta raqamiga to'langan to'lovlar{" "}
                    <span className="font-semibold text-foreground">naqt pul</span>{" "}
                    deb hisoblanadi va chekda shunday ko'rsatiladi.
                  </p>
                </div>
              </div>
            </div>

            {/* Activation note */}
            <div className="rounded-xl border border-green-200 dark:border-green-800/40 bg-green-50 dark:bg-green-950/20 p-4">
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg bg-green-500/15 flex items-center justify-center flex-shrink-0">
                  <ShieldCheck className="w-4 h-4 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-foreground mb-1" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    Xavfsiz to'lov
                  </p>
                  <p className="text-xs text-muted-foreground leading-relaxed">
                    To'lov amalga oshirilgandan so'ng admin bilan Telegram orqali bog'laning — PRO obuna darhol faollashtiriladi.
                  </p>
                </div>
              </div>
            </div>

          </div>{/* end info flex */}
          </div>{/* end grid */}
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
