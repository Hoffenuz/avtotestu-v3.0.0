import { Link, useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { SEO } from "@/components/SEO";
import { useAuth } from "@/contexts/AuthContext";
import { useState } from "react";
import { 
  Play, 
  Car, 
  FileText, 
  ListChecks,
  ChevronDown,
  GraduationCap,
  Shield,
  Clock,
  Award,
  User,
  BarChart3,
  BookOpen,
  Settings,
  Crown
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { SiteNotificationBanner } from "@/components/SiteNotificationBanner";

const features = [
  {
    icon: GraduationCap,
    title: "Professional Avtomaktab",
    description: "Tajribali ustozlar rahbarligida sifatli ta'lim oling."
  },
  {
    icon: Shield,
    title: "Zamonaviy Avto Texnika",
    description: "Eng so'nggi texnologiyalar bilan jihozlangan avtomobillar."
  },
  {
    icon: Clock,
    title: "Diqqat!",
    description: "Sayt test rejimida ishlamoqda. Savol va takliflaringizni telegram orqali yuboring."
  }
];

export default function Home() {
  const [aboutOpen, setAboutOpen] = useState(false);
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <MainLayout>
      <SiteNotificationBanner />
      <SEO 
        title="Avtotestlar 2026 - Avtotestu | Avtomaktab Online Imtihonlar"
        description="Haydovchilik guvohnomasini olish uchun YHQ testlari, yo'l belgilari va onlayn avtotestlar. 2026 yil yangilangan savollar bilan prava olishga tayyorlaning."
        path="/"
        keywords="avtotest, avtotestu, avtotest 2026, prava test, prava olish, YHQ testlari, avtomaktab, yo'l belgilari"
      />
      <section className="relative min-h-[500px] md:min-h-[600px] flex items-center overflow-hidden">
        {/* Background with overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=1920&q=80')`,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary/90 via-primary/85 to-primary/80" />
        </div>

        {/* Content */}
        <div className="relative w-full max-w-7xl mx-auto px-4 py-16">
          {/* Hero Card */}
          <div className="max-w-4xl mx-auto bg-primary/80 backdrop-blur-sm rounded-3xl p-8 md:p-12 text-center">
            <h1 className="text-3xl md:text-5xl font-bold text-primary-foreground mb-4 leading-tight" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              Avtotestu.uz o'quv markazi!
            </h1>
            <p className="text-lg md:text-xl text-primary-foreground/90 mb-8 max-w-2xl mx-auto">
              Professional haydovchilik guvohnomasini olish uchun zamonaviy platforma
            </p>

            {/* CTA Buttons */}
            <div className="grid grid-cols-2 md:flex md:flex-wrap justify-center gap-4 md:gap-4">
              <Link to="/test-ishlash" className="w-full md:w-auto">
                <Button 
                  size="lg" 
                  className="w-full md:w-auto min-w-[140px] bg-[hsl(var(--cta-orange))] hover:bg-[hsl(var(--cta-orange-hover))] text-white gap-2 text-base md:text-lg px-4 md:px-8 py-5 md:py-6 rounded-full shadow-xl font-semibold"
                >
                  <Play className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
                  <span className="truncate">Test ishlash</span>
                </Button>
              </Link>
              <Link to="/belgilar" className="w-full md:w-auto">
                <Button 
                  size="lg" 
                  className="w-full md:w-auto min-w-[140px] bg-[hsl(var(--cta-green))] hover:bg-[hsl(var(--cta-green-hover))] text-white gap-2 text-base md:text-lg px-4 md:px-8 py-5 md:py-6 rounded-full shadow-xl font-semibold"
                >
                  <Car className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
                  <span className="truncate">Yo'l belgilari</span>
                </Button>
              </Link>
              <Link to="/variant" className="relative w-full md:w-auto">
                <span className="absolute -top-2 -right-2 bg-pro text-pro-foreground text-xs font-bold px-2 py-0.5 rounded-full z-10 shadow-md">
                  PRO
                </span>
                <Button 
                  size="lg" 
                  className="w-full md:w-auto min-w-[140px] bg-[hsl(var(--cta-orange))] hover:bg-[hsl(var(--cta-orange-hover))] text-white gap-2 text-base md:text-lg px-4 md:px-8 py-5 md:py-6 rounded-full shadow-xl font-semibold border-2 border-pro"
                >
                  <Play className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
                  <span className="truncate">Variantlar</span>
                </Button>
              </Link>
              <Link to="/mavzuli" className="relative w-full md:w-auto">
                <span className="absolute -top-2 -right-2 bg-pro text-pro-foreground text-xs font-bold px-2 py-0.5 rounded-full z-10 shadow-md">
                  PRO
                </span>
                <Button 
                  size="lg" 
                  className="w-full md:w-auto min-w-[140px] bg-[hsl(var(--cta-red))] hover:bg-[hsl(var(--cta-red-hover))] text-white gap-2 text-base md:text-lg px-4 md:px-8 py-5 md:py-6 rounded-full shadow-xl font-semibold border-2 border-pro"
                >
                  <Play className="w-4 h-4 md:w-5 md:h-5 flex-shrink-0" />
                  <span className="truncate">Mavzuli test</span>
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              Bizning Afzalliklar
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="border-none shadow-lg bg-card hover:shadow-xl transition-shadow">
                  <CardContent className="pt-8 pb-6 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-2xl flex items-center justify-center">
                      <Icon className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="font-bold text-xl text-foreground mb-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                      {feature.title}
                    </h3>
                    <p className="text-muted-foreground">
                      {feature.description}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Profile Section - Only for logged in users */}
      {user && (
        <section className="py-16 bg-secondary/30">
          <div className="max-w-4xl mx-auto px-4">
            <Card className="border-none shadow-xl overflow-hidden">
              <CardContent className="p-0">
                <div className="bg-primary p-6 text-center">
                  <Avatar className="h-20 w-20 mx-auto mb-4 bg-[hsl(var(--cta-orange))]">
                    <AvatarFallback className="bg-[hsl(var(--cta-orange))] text-white text-2xl font-bold">
                      {getInitials(profile?.full_name || profile?.username)}
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="text-2xl font-bold text-primary-foreground" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    {profile?.full_name || profile?.username || 'Foydalanuvchi'}
                  </h3>
                  {profile?.username && profile?.full_name && (
                    <p className="text-primary-foreground/70">@{profile.username}</p>
                  )}
                </div>
                <div className="p-6 bg-card">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <Button 
                      variant="outline" 
                      className="flex flex-col items-center gap-2 h-auto py-4"
                      onClick={() => navigate('/profile')}
                    >
                      <User className="w-6 h-6 text-primary" />
                      <span className="text-sm">Profil</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex flex-col items-center gap-2 h-auto py-4"
                      onClick={() => navigate('/profile')}
                    >
                      <BarChart3 className="w-6 h-6 text-primary" />
                      <span className="text-sm">Statistika</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex flex-col items-center gap-2 h-auto py-4"
                      onClick={() => navigate('/darslik')}
                    >
                      <BookOpen className="w-6 h-6 text-primary" />
                      <span className="text-sm">Darslik</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      className="flex flex-col items-center gap-2 h-auto py-4"
                      onClick={() => navigate('/profile')}
                    >
                      <Settings className="w-6 h-6 text-primary" />
                      <span className="text-sm">Sozlamalar</span>
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      )}

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

      {/* About Section */}
      <section className="py-16 bg-background">
        <div className="max-w-4xl mx-auto px-4">
          <Card className="border-none shadow-lg overflow-hidden">
            <button
              onClick={() => setAboutOpen(!aboutOpen)}
              className="w-full p-6 flex items-center justify-between text-left bg-card hover:bg-secondary/50 transition-colors"
            >
              <span className="font-bold text-lg text-foreground" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                AvtoTest haqida qisqacha
              </span>
              <ChevronDown 
                className={`w-6 h-6 text-muted-foreground transition-transform duration-300 ${
                  aboutOpen ? "rotate-180" : ""
                }`} 
              />
            </button>
            
            <div 
              className={`overflow-hidden transition-all duration-500 ${
                aboutOpen ? "max-h-[2000px]" : "max-h-0"
              }`}
            >
              <div className="p-6 pt-0 space-y-4 text-muted-foreground leading-relaxed">
                <p>
                  AvtoTest — bu haydovchilik guvohnomasi olishni xohlovchilar uchun yaratilgan zamonaviy onlayn platforma bo'lib, foydalanuvchilarga Yo'l harakati qoidalari (YHQ) bo'yicha test savollarini interaktiv tarzda yechish imkonini beradi. Platforma o'quv jarayonini qulay, tushunarli va samarali qilish maqsadida ishlab chiqilgan.
                </p>
                <p>
                  Bugungi kunda ko'plab o'quv markazlari va avtomaktablar YHQ bo'yicha bilimni mustahkamlash uchun elektron test tizimlaridan foydalanadi. AvtoTest loyihasi aynan shu jarayonni yanada soddalashtirish, foydalanuvchilarga istalgan joyda va istalgan vaqtda o'qish imkonini berish uchun yaratilgan.
                </p>
                <p>
                  Platformadagi barcha testlar O'zbekiston Respublikasi Yo'l harakati qoidalariga asoslangan bo'lib, har bir savolga yagona to'g'ri javob keltirilgan. Savollar muntazam yangilanib boriladi va yangi qoidalar qabul qilinishi bilan tizimga avtomatik tarzda qo'shiladi.
                </p>
                <p>
                  AvtoTest nafaqat test topshirish imkonini beradi, balki foydalanuvchilar o'z xatolarini ko'rib chiqib, to'g'ri javobni o'rganishlari mumkin. Har bir test yakunida tizim sizga umumiy natijangizni, to'g'ri va noto'g'ri javoblar sonini ko'rsatadi.
                </p>
                <p>
                  Agar siz ham YHQ imtihoniga tayyorlanayotgan bo'lsangiz yoki o'zingizni sinab ko'rmoqchi bo'lsangiz, AvtoTest siz uchun eng to'g'ri tanlov. Biz bilan birgalikda xavfsiz va ongli haydovchilar avlodini yarating!
                </p>
              </div>
            </div>
          </Card>
        </div>
      </section>
    </MainLayout>
  );
}
