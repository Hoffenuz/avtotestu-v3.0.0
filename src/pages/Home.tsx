import { Link, useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { SEO } from "@/components/SEO";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAccessState } from "@/hooks/useAccessState";
import {
  Play,
  MonitorSmartphone,
  ShieldCheck,
  Trophy,
  User,
  BarChart3,
  BookOpen,
  Settings,
  Crown,
  Zap
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { SiteNotificationBanner } from "@/components/SiteNotificationBanner";
import MobileAppBanner from "@/components/MobileAppBanner";
import DesktopAppBanner from "@/components/DesktopAppBanner";
import ProGroupInvite from "@/components/ProGroupInvite";


export default function Home() {
  const { user, profile } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { isPremium } = useAccessState();

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
      <MobileAppBanner />
      <DesktopAppBanner />
      <SEO
        title={t("home.seoTitle")}
        description={t("home.seoDescription")}
        path="/"
        keywords="avto test, avtotest 2026, prava test, YHQ testlar, haydovchilik guvohnomasi, yo'l belgilari, avtotestu.uz"
      />

      {/* Hero Section */}
      <section className="relative min-h-[500px] md:min-h-[600px] flex items-center justify-center overflow-hidden">
        <img
          srcSet="/hero-bg-640.webp 640w, /hero-bg-1024.webp 1024w, /hero-bg-1920.webp 1920w"
          sizes="100vw"
          src="/hero-bg-1920.webp"
          alt=""
          className="absolute inset-0 w-full h-full object-cover"
          fetchPriority="high"
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

            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-primary-foreground mb-4 leading-tight drop-shadow-sm" style={{ fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif" }}>
              {t("home.heroTitle")}
            </h1>
            <p className="text-lg md:text-xl text-primary-foreground/90 mb-8 max-w-2xl mx-auto leading-relaxed">
              {t("home.heroSubtitle")}
            </p>

            {/* CTA Buttons */}
            <div className="flex flex-col md:flex-row md:flex-wrap justify-center gap-3 md:gap-4 max-w-md md:max-w-none mx-auto">

             {/* Test ishlash */}
<div className="relative w-full md:w-auto">
  {user && isPremium && (
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

              {/* Variantlar */}
              <div className="relative w-full md:w-auto">
                {isPremium && (
                  <span className="absolute -top-2 -right-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-white text-xs font-bold px-2.5 py-0.5 rounded-full z-10 shadow-sm">
                    {t("common.pro")}
                  </span>
                )}
                <Link to="/variant" className="w-full md:w-auto group block">
                  <Button
                    size="lg"
                    className="w-full md:w-auto md:min-w-[150px] bg-[#FF4D00] hover:bg-[#E64500] text-white gap-2 text-base md:text-lg px-6 py-5 md:py-6 rounded-2xl shadow-md shadow-[#FF4D00]/30 font-bold border-0 transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-[#FF4D00]/45"
                  >
                    <Play className="w-5 h-5 flex-shrink-0 fill-current" />
                    <span>{t("home.btnVariantlar")}</span>
                  </Button>
                </Link>
              </div>

              {/* Mavzuli testlar — kirgan userlar (mobile + desktop) */}
              {user && (
                <div className="relative w-full md:w-auto">
                  <span className="absolute -top-2 -right-2 bg-gradient-to-r from-amber-500 to-yellow-500 text-white text-xs font-bold px-2.5 py-0.5 rounded-full z-10 shadow-sm">
                    {t("common.pro")}
                  </span>
                  <Link to="/mavzuli" className="w-full md:w-auto group block">
                    <Button
                      size="lg"
                      className="w-full md:w-auto md:min-w-[150px] bg-[#FF4D00] hover:bg-[#E64500] text-white gap-2 text-base md:text-lg px-6 py-5 md:py-6 rounded-2xl shadow-md shadow-[#FF4D00]/30 font-bold border-0 transition-all hover:scale-[1.02] hover:shadow-lg hover:shadow-[#FF4D00]/45"
                    >
                      <BookOpen className="w-5 h-5 flex-shrink-0" />
                      <span>{t("home.btnMavzuli")}</span>
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* PRO userlarga bir martalik guruh taklifi — hammaga ko'rinadigan guruh kartasi footerga ko'chirildi */}
      <section className="py-8 bg-background">
        <div className="max-w-4xl mx-auto px-4">
          <ProGroupInvite />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-background">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4" style={{ fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif" }}>
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
                    <h3 className="font-bold text-xl text-foreground mb-3" style={{ fontFamily: "'Segoe UI', system-ui, -apple-system, sans-serif" }}>
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
        <section className="py-10 md:py-12 bg-background border-t border-border">
          <div className="max-w-4xl mx-auto px-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 mb-6">
              <Avatar className="h-14 w-14 bg-primary/10 text-primary shrink-0" style={{ aspectRatio: "1" }}>
                <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
                  {getInitials(profile?.full_name || profile?.username)}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <h3 className="text-xl font-semibold text-foreground truncate">
                  {profile?.full_name || profile?.username || t("nav.user")}
                </h3>
                {profile?.username && (
                  <p className="text-sm text-muted-foreground truncate">@{profile.username}</p>
                )}
              </div>
              {isPremium && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground sm:ml-auto">
                  <Crown className="w-4 h-4" />
                  <span>{t("home.proStatusActive")}</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {[
                { icon: User, label: t("home.profileProfil"), nav: "/profile" },
                { icon: BarChart3, label: t("home.profileStatistika"), nav: "/profile" },
                { icon: BookOpen, label: t("home.profileDarslik"), nav: "/darslik" },
                { icon: Settings, label: t("home.profileSozlamalar"), nav: "/profile" },
              ].map((item, idx) => (
                <button
                  key={idx}
                  type="button"
                  className="flex items-center gap-2.5 px-3 py-3 rounded-lg border border-border bg-card text-left hover:bg-muted/40 transition-colors"
                  onClick={() => navigate(item.nav)}
                >
                  <item.icon className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="text-sm font-medium text-foreground">{item.label}</span>
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* PRO Section — sodda */}
      {!(user && isPremium) && (
        <section className="py-10 md:py-12 bg-muted/30 border-t border-border">
          <div className="max-w-4xl mx-auto px-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
              <div className="flex-1">
                <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground mb-1">PRO</p>
                <h2 className="text-xl md:text-2xl font-semibold text-foreground mb-1.5">
                  {t("home.proSectionTitle")}
                </h2>
                <p className="text-sm text-muted-foreground max-w-xl">
                  {t("home.proSectionDesc")}
                </p>
              </div>
              <Link to="/pro" className="shrink-0">
                <Button size="lg" className="font-semibold gap-2 w-full sm:w-auto">
                  <Zap className="w-4 h-4" />
                  <span>{t("home.proGetButton")}</span>
                </Button>
              </Link>
            </div>
          </div>
        </section>
      )}
    </MainLayout>
  );
}
