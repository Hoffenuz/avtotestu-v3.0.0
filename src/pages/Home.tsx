import { Link, useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { SEO } from "@/components/SEO";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useState } from "react";
import {
  Play,
  ChevronDown,
  MonitorSmartphone,
  ShieldCheck,
  Trophy,
  User,
  BarChart3,
  BookOpen,
  Settings,
  Crown,
  X,
  Sparkles,
  Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { SiteNotificationBanner } from "@/components/SiteNotificationBanner";
import MobileAppBanner from "@/components/MobileAppBanner";

export default function Home() {
  const [aboutOpen, setAboutOpen] = useState(false);
  const [showProPopup, setShowProPopup] = useState(false);
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

  const handleProRoute = (route: string) => {
    if (user && profile?.is_pro) {
      navigate(route);
    } else {
      setShowProPopup(true);
    }
  };

  const handlePopupConfirm = () => {
    setShowProPopup(false);
    navigate('/pro');
  };

  const handlePopupClose = () => {
    setShowProPopup(false);
  };

  return (
    <MainLayout>
      <SiteNotificationBanner />
      <MobileAppBanner />
      <SEO
        title={t("home.seoTitle")}
        description={t("home.seoDescription")}
        path="/"
        keywords="avtotest, avtotestu, onlayn test, prava test, prava olish, YHQ testlari, yo'l belgilari"
      />

      {/* PRO Popup */}
      {showProPopup && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={handlePopupClose}
          />
          <div className="relative bg-card rounded-2xl shadow-2xl border border-yellow-500/30 max-w-sm w-full p-6 animate-in zoom-in-95 duration-200">
            <button
              onClick={handlePopupClose}
              className="absolute top-3 right-3 p-1.5 rounded-lg hover:bg-muted transition-colors text-muted-foreground"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="flex flex-col items-center text-center gap-4">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/30">
                <Crown className="w-8 h-8 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-foreground mb-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  PRO Kerak
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">
                  {t("home.proSubscribePopup")}
                </p>
              </div>
              <div className="flex gap-3 w-full">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={handlePopupClose}
                >
                  Bekor qilish
                </Button>
                <Button
                  className="flex-1 bg-gradient-to-r from-yellow-500 to-amber-600 hover:from-yellow-600 hover:to-amber-700 text-white font-semibold border-0 shadow-md shadow-amber-500/25"
                  onClick={handlePopupConfirm}
                >
                  <Crown className="w-4 h-4 mr-1.5" />
                  Pro olish
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Hero Section */}
      <section className="relative min-h-[500px] md:min-h-[600px] flex items-center justify-center overflow-hidden">
        <img
          srcSet="/hero-bg-640.webp 640w, /hero-bg-1024.webp 1024w, /hero-bg-1920.webp 1920w"
          sizes="100vw"
          src="/hero-bg-1920.webp"
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          fetchPriority="high"
          decoding="async"
          aria-hidden="true"
          width="1920"
          height="1080"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/95 via-primary/90 to-primary/85 backdrop-blur-[2px]" />

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

            {/* CTA Buttons */}
            <div className="flex flex-col md:flex-row md:flex-wrap justify-center gap-3 md:gap-4 max-w-md md:max-w-none mx-auto">

             {/* Test ishlash - GREEN (To'liq moslashtirilgan o'lcham) */}
<div className="relative w-full md:w-auto">
  {user && (
    <span className="absolute -top-2 -right-2 bg-[#f38d31] text-white text-[10px] font-extrabold px-2.5 py-0.5 rounded-full z-10 shadow-sm border border-white/10 uppercase">
      {t("common.pro")}
    </span>
  )}
  <Link to="/test-ishlash" className="w-full md:w-auto group">
    <Button
      size="lg"
      className="w-full md:w-auto md:min-w-[150px] bg-[#10b981] hover:bg-[#059669] text-white gap-2 text-base md:text-lg px-6 py-5 md:py-6 rounded-2xl shadow-md shadow-[#10b981]/30 font-bold border-0 transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-[#10b981]/45"
    >
      <Play className="w-5 h-5 flex-shrink-0 fill-current" />
      <span>{t("home.btnTest")}</span>
    </Button>
  </Link>
</div>

              {/* Variantlar PRO - Soft golden */}
              <button
                onClick={() => handleProRoute('/variant')}
                className="relative w-full md:w-auto"
              >
                <span className="absolute -top-2 -right-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-white text-xs font-bold px-2.5 py-0.5 rounded-full z-10 shadow-sm">
                  {t("common.pro")}
                </span>
               <Button
  size="lg"
  className="w-full md:w-auto md:min-w-[150px] bg-[#FF4D00] hover:bg-[#E64500] text-white gap-2 text-base md:text-lg px-6 py-5 md:py-6 rounded-2xl shadow-md shadow-[#FF4D00]/30 font-bold border-0 transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-[#FF4D00]/45"
>
  <Play className="w-5 h-5 flex-shrink-0 fill-current" />
  <span>{t("home.btnVariantlar")}</span>
</Button>
              </button>

              {/* Mavzuli test PRO - Soft golden */}
              <button
                onClick={() => handleProRoute('/mavzuli')}
                className="relative w-full md:w-auto"
              >
                <span className="absolute -top-2 -right-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-white text-xs font-bold px-2.5 py-0.5 rounded-full z-10 shadow-sm">
                  {t("common.pro")}
                </span>
                <Button
  size="lg"
  className="w-full md:w-auto md:min-w-[150px] bg-[#FF4D00] hover:bg-[#E64500] text-white gap-2 text-base md:text-lg px-6 py-5 md:py-6 rounded-2xl shadow-md shadow-[#FF4D00]/30 font-bold border-0 transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-[#FF4D00]/45"
>
  <Play className="w-5 h-5 flex-shrink-0 fill-current" />
  <span>{t("home.btnMavzuli")}</span>
</Button>
              </button>
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
                    <div className="w-16 h-16 mx-auto mb-4 bg-primary/10 rounded-2xl flex items-center justify-center" style={{ aspectRatio: '1' }}>
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
                  <Avatar className="h-20 w-20 mx-auto mb-4 bg-gradient-to-br from-amber-500 to-orange-600 border-4 border-white/20 shadow-md" style={{ aspectRatio: '1' }}>
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

      {/* PRO Section - beautiful eye-catching design */}
      {!(user && profile?.is_pro) && (
        <section className="py-14 bg-gradient-to-br from-amber-50 via-yellow-50 to-orange-50 dark:from-amber-950/30 dark:via-yellow-950/20 dark:to-orange-950/30 border-y border-yellow-200/60 dark:border-yellow-800/30">
          <div className="max-w-4xl mx-auto px-4">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-yellow-400/20 via-amber-400/15 to-orange-400/20 dark:from-yellow-900/40 dark:via-amber-900/30 dark:to-orange-900/40 border-2 border-yellow-400/40 dark:border-yellow-600/30 shadow-xl shadow-amber-500/10">
              {/* Decorative glow blobs */}
              <div className="absolute -top-10 -right-10 w-40 h-40 bg-yellow-400/30 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute -bottom-10 -left-10 w-40 h-40 bg-amber-400/20 rounded-full blur-3xl pointer-events-none" />

              <div className="relative p-6 md:p-10">
                <div className="flex flex-col md:flex-row items-center md:items-start gap-6">
                  {/* Icon */}
                  <div className="flex-shrink-0">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center shadow-lg shadow-amber-500/40 ring-4 ring-yellow-300/30">
                      <Crown className="w-10 h-10 text-white drop-shadow-sm" />
                    </div>
                  </div>

                  {/* Text */}
                  <div className="flex-1 text-center md:text-left">
                    <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-yellow-500/20 border border-yellow-500/30 text-yellow-700 dark:text-yellow-400 text-xs font-bold uppercase tracking-wide mb-3">
                      <Sparkles className="w-3 h-3" />
                      Premium
                    </div>
                    <h2 className="text-2xl md:text-3xl font-bold text-foreground mb-2" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                      {t("home.proSectionTitle")}
                    </h2>
                    <p className="text-muted-foreground leading-relaxed text-sm md:text-base max-w-xl">
                      {t("home.proSectionDesc")}
                    </p>

                    {/* CTA Button - large, eye-catching, visible on desktop */}
                    <div className="mt-6">
                      <Link to="/pro">
                        <Button className="relative overflow-hidden group bg-gradient-to-r from-yellow-400 to-amber-500 hover:from-yellow-500 hover:to-amber-600 text-white font-bold px-8 py-6 text-lg rounded-2xl shadow-xl shadow-amber-400/40 hover:shadow-amber-400/60 hover:scale-[1.03] transition-all border-0 gap-3">
                          <span className="absolute inset-0 bg-gradient-to-r from-white/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                          <Zap className="w-6 h-6 drop-shadow-sm" />
                          <span>Sinab ko'rish</span>
                          <Sparkles className="w-5 h-5 opacity-80" />
                        </Button>
                      </Link>
                      <p className="text-xs text-muted-foreground mt-2.5 flex items-center gap-1 justify-center md:justify-start">
                        <span className="inline-block w-1.5 h-1.5 rounded-full bg-green-500"></span>
                        Bepul sinab ko'rish mavjud
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* PRO Active status for subscribers */}
      {user && profile?.is_pro && (
        <section className="py-8 bg-gradient-to-r from-secondary to-secondary/50 border-y border-muted">
          <div className="max-w-4xl mx-auto px-4 flex justify-center">
            <div className="flex items-center gap-3 bg-yellow-500/10 border border-yellow-500/30 rounded-xl px-6 py-4">
              <Crown className="w-6 h-6 text-amber-500" />
              <span className="font-semibold text-foreground text-lg">{t("home.proStatusActive")}</span>
            </div>
          </div>
        </section>
      )}

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
                <p>{t("home.aboutText1")}</p>
                <p>{t("home.aboutText2")}</p>
                <ul className="list-disc list-inside space-y-2 pt-2 text-foreground/80 font-medium">
                  <li>{t("home.aboutList1")}</li>
                  <li>{t("home.aboutList2")}</li>
                  <li>{t("home.aboutList3")}</li>
                </ul>
                <p className="pt-2">{t("home.aboutText3")}</p>
              </div>
            </div>
          </Card>
        </div>
      </section>
    </MainLayout>
  );
}
