import { Link, useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { SEO } from "@/components/SEO";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useState } from "react";
import { 
  Play, 
  Car, 
  ChevronDown,
  MonitorSmartphone,
  ShieldCheck,
  Trophy,
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

export default function Home() {
  const [aboutOpen, setAboutOpen] = useState(false);
  const { user, profile } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const features = [
    { icon: MonitorSmartphone, titleKey: "home.feature1Title", descKey: "home.feature1Desc" },
    { icon: ShieldCheck, titleKey: "home.feature2Title", descKey: "home.feature2Desc" },
    { icon: Trophy, titleKey: "home.feature3Title", descKey: "home.feature3Desc" },
  ];

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <MainLayout>
      <SiteNotificationBanner />
      <SEO 
        title={t("home.seoTitle")}
        description={t("home.seoDescription")}
        path="/"
        keywords="avtotest, avtotestu, onlayn test, prava test, prava olish, YHQ testlari, yo'l belgilari"
      />
      
      {/* Hero Section */}
      <section className="relative min-h-[500px] md:min-h-[600px] flex items-center justify-center overflow-hidden">
        {/* Background with overlay */}
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?w=1920&q=80')`,
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-primary/95 via-primary/90 to-primary/85" />
        </div>

        {/* Content */}
        <div className="relative w-full max-w-7xl mx-auto px-4 py-16">
          <div className="max-w-4xl mx-auto bg-primary/80 backdrop-blur-md rounded-[2rem] p-8 md:p-12 text-center shadow-2xl">
            
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/20 text-white/95 text-sm font-medium mb-6 border border-white/10">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
              </span>
              {t("home.badge")}
            </div>

            <h1 className="text-3xl md:text-5xl font-bold text-primary-foreground mb-4 leading-tight drop-shadow-sm" style={{ fontFamily: 'Montserrat, sans-serif' }}>
              {t("home.heroTitle")}
            </h1>
            <p className="text-lg md:text-xl text-primary-foreground/90 mb-8 max-w-2xl mx-auto leading-relaxed">
              {t("home.heroSubtitle")}
            </p>

            {/* CTA Buttons - Single column on mobile */}
            <div className="flex flex-col md:flex-row md:flex-wrap justify-center gap-3 md:gap-4 max-w-md md:max-w-none mx-auto">
              {/* Test ishlash */}
              <Link to="/test-ishlash" className="w-full md:w-auto">
                <Button 
                  size="lg" 
                  className={`w-full md:w-auto md:min-w-[150px] gap-2 text-base md:text-lg px-6 py-5 md:py-6 rounded-2xl font-semibold transition-all hover:scale-[1.02] border-0 ${
                    user
                      ? "bg-gradient-to-r from-emerald-400 to-green-500 hover:from-emerald-500 hover:to-green-600 text-white shadow-md shadow-green-500/20 hover:shadow-lg hover:shadow-green-500/30"
                      : "bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white shadow-md shadow-orange-500/20 hover:shadow-lg hover:shadow-orange-500/30"
                  }`}
                >
                  <Play className="w-5 h-5 flex-shrink-0" />
                  <span>{t("home.btnTest")}</span>
                </Button>
              </Link>
              
              {/* Yo'l belgilari */}
              <Link to="/belgilar" className="w-full md:w-auto">
                <Button 
                  size="lg" 
                  className="w-full md:w-auto md:min-w-[150px] bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white gap-2 text-base md:text-lg px-6 py-5 md:py-6 rounded-2xl shadow-md shadow-teal-500/20 font-semibold transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-teal-500/30 border-0"
                >
                  <Car className="w-5 h-5 flex-shrink-0" />
                  <span>{t("home.btnBelgilar")}</span>
                </Button>
              </Link>
              
              {/* Variantlar PRO */}
              <Link to="/variant" className="relative w-full md:w-auto">
                <span className="absolute -top-2 -right-2 bg-gradient-to-r from-yellow-500 to-amber-500 text-white text-xs font-bold px-2.5 py-0.5 rounded-full z-10 shadow-sm">
                  {t("common.pro")}
                </span>
                <Button 
                  size="lg" 
                  className="w-full md:w-auto md:min-w-[150px] bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 text-white gap-2 text-base md:text-lg px-6 py-5 md:py-6 rounded-2xl shadow-md shadow-amber-500/20 font-semibold border-2 border-yellow-400/30 transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-amber-500/30"
                >
                  <Play className="w-5 h-5 flex-shrink-0" />
                  <span>{t("home.btnVariantlar")}</span>
                </Button>
              </Link>
              
              {/* Mavzuli test PRO */}
              <Link to="/mavzuli" className="relative w-full md:w-auto">
                <span className="absolute -top-2 -right-2 bg-gradient-to-r from-red-500 to-rose-500 text-white text-xs font-bold px-2.5 py-0.5 rounded-full z-10 shadow-sm">
                  {t("common.pro")}
                </span>
                <Button 
                  size="lg" 
                  className="w-full md:w-auto md:min-w-[150px] bg-gradient-to-r from-red-500 to-rose-600 hover:from-red-600 hover:to-rose-700 text-white gap-2 text-base md:text-lg px-6 py-5 md:py-6 rounded-2xl shadow-md shadow-red-500/20 font-semibold border-2 border-red-400/30 transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-red-500/30"
                >
                  <Play className="w-5 h-5 flex-shrink-0" />
                  <span>{t("home.btnMavzuli")}</span>
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
              {t("home.featuresTitle")}
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="border border-muted/60 shadow-sm bg-card hover:shadow-md transition-all hover:-translate-y-1">
                  <CardContent className="pt-8 pb-6 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-2xl flex items-center justify-center">
                      <Icon className="w-8 h-8 text-primary" />
                    </div>
                    <h3 className="font-bold text-xl text-foreground mb-3" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                      {t(feature.titleKey)}
                    </h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {t(feature.descKey)}
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
        <section className="py-12 bg-secondary/30">
          <div className="max-w-4xl mx-auto px-4">
            <Card className="border border-muted shadow-sm overflow-hidden rounded-2xl">
              <CardContent className="p-0">
                <div className="bg-primary p-6 text-center">
                  {/* Avatar Background Gradient */}
                  <Avatar className="h-20 w-20 mx-auto mb-4 bg-gradient-to-br from-amber-500 to-orange-600 border-4 border-white/20 shadow-md">
                    <AvatarFallback className="bg-transparent text-white text-2xl font-bold">
                      {getInitials(profile?.full_name || profile?.username)}
                    </AvatarFallback>
                  </Avatar>
                  <h3 className="text-2xl font-bold text-primary-foreground" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                    {profile?.full_name || profile?.username || t("nav.user")}
                  </h3>
                  {profile?.username && (
                    <p className="text-primary-foreground/80 mt-1">@{profile.username}</p>
                  )}
                </div>
                <div className="p-4 bg-card">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { icon: User, label: t("home.profileProfil"), nav: "/profile" },
                      { icon: BarChart3, label: t("home.profileStatistika"), nav: "/profile" },
                      { icon: BookOpen, label: t("home.profileDarslik"), nav: "/darslik" },
                      { icon: Settings, label: t("home.profileSozlamalar"), nav: "/profile" }
                    ].map((item, idx) => (
                      <Button 
                        key={idx}
                        variant="outline" 
                        className="flex flex-col items-center gap-2 h-auto py-4 rounded-xl hover:bg-muted/50 transition-all border-muted/80 hover:border-primary/30 group"
                        onClick={() => navigate(item.nav)}
                      >
                        <item.icon className="w-6 h-6 text-primary group-hover:scale-110 transition-transform" />
                        <span className="text-sm font-medium">{item.label}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>
      )}

      {/* PRO Section */}
      <section className="py-12 bg-gradient-to-r from-secondary to-secondary/50 border-y border-muted">
        <div className="max-w-4xl mx-auto px-4">
          <Card className="border-2 border-yellow-500/30 shadow-md bg-card relative overflow-hidden rounded-2xl">
            <span className="absolute top-0 right-0 bg-gradient-to-r from-yellow-500 to-amber-600 text-white text-sm font-bold px-5 py-1.5 rounded-bl-2xl shadow-sm">
              {t("common.pro")}
            </span>
            <CardContent className="p-6 md:p-8">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-amber-600 rounded-xl flex items-center justify-center shadow-md">
                  <Crown className="w-6 h-6 text-white" />
                </div>
                <h2 className="text-2xl font-bold text-foreground" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  {t("home.proSectionTitle")}
                </h2>
              </div>
              <p className="text-foreground leading-relaxed text-base">
                {t("home.proSectionDesc")}
              </p>
              <div className="mt-6">
                {user && profile?.is_pro ? (
                  <div className="flex items-center gap-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl px-5 py-3 w-fit">
                    <Crown className="w-5 h-5 text-amber-600" />
                    <span className="font-semibold text-foreground">
                      {t("home.proStatusActive")}
                    </span>
                  </div>
                ) : (
                  <Link to="/pro">
                    <Button className="bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 text-white gap-2 px-6 py-5 rounded-xl font-semibold shadow-md shadow-amber-500/20 transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-amber-500/30 border-0">
                      <Crown className="w-5 h-5" />
                      {t("home.proGetButton")}
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
          <Card className="border border-muted/60 shadow-sm overflow-hidden rounded-2xl">
            <button
              onClick={() => setAboutOpen(!aboutOpen)}
              className="w-full p-6 flex items-center justify-between text-left bg-card hover:bg-muted/30 transition-colors outline-none"
            >
              <span className="font-bold text-lg text-foreground" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                {t("home.aboutTitle")}
              </span>
              <ChevronDown 
                className={`w-6 h-6 text-muted-foreground transition-transform duration-300 ${
                  aboutOpen ? "rotate-180" : ""
                }`} 
              />
            </button>
            
            <div 
              className={`overflow-hidden transition-all duration-300 ${
                aboutOpen ? "max-h-[1000px] opacity-100" : "max-h-0 opacity-0"
              }`}
            >
              <div className="p-6 pt-0 space-y-4 text-muted-foreground leading-relaxed border-t border-muted/50 mt-2">
                <p>
                  {t("home.aboutText1")}
                </p>
                <p>
                  {t("home.aboutText2")}
                </p>
                <ul className="list-disc list-inside space-y-2 pt-2 text-foreground/80 font-medium">
                  <li>{t("home.aboutList1")}</li>
                  <li>{t("home.aboutList2")}</li>
                  <li>{t("home.aboutList3")}</li>
                </ul>
                <p className="pt-2">
                  {t("home.aboutText3")}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </section>
    </MainLayout>
  );
}