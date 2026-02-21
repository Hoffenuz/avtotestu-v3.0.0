import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { Menu, X, User, LogIn, Crown, Globe, ChevronDown, Home, Phone, BookOpen, Info } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const { language, setLanguage, t } = useLanguage();

  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => { document.body.style.overflow = 'unset'; };
  }, [mobileMenuOpen]);

  const navLinks = [
    { path: "/", label: t("nav.home") },
    { path: "/contact", label: t("nav.contact") },
    { path: "/darslik", label: t("nav.darslik") },
    { path: "/qoshimcha", label: t("nav.qoshimcha") },
  ];

  const languages = [
    { code: "uz-lat" as const, display: "UZ", label: t("nav.langLatin") },
    { code: "uz" as const, display: "ЎЗ", label: t("nav.langCyrillic") },
    { code: "ru" as const, display: "RU", label: t("nav.langRussian") },
  ];

  const currentLangDisplay = languages.find((l) => l.code === language)?.display ?? "UZ";
  
  const isMavzuliSection =
    location.pathname === '/mavzuli' || location.pathname.startsWith('/mavzuli/');
  if (isMavzuliSection) {
    return <div className="min-h-screen bg-background">{children}</div>;
  }

  const getInitials = (name: string | null | undefined) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-primary shadow-lg">
        {/* max-w-7xl o'rniga w-full va chekkalardan minimal bo'shliq (px-2 sm:px-4) berildi */}
        <div className="w-full px-2 sm:px-4 md:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
           {/* CHAP TARAFI: Til tanlash va Logotip */}
           <div className="flex items-center gap-4 sm:gap-8 md:gap-12">
              
              {/* Til tanlash UI - Ekrandan salgina surilgan holda (eng chapda) */}
              <div className="relative flex-shrink-0">
                <button
                  onClick={() => setLangMenuOpen(!langMenuOpen)}
                  onBlur={() => setTimeout(() => setLangMenuOpen(false), 200)}
                  className="flex items-center gap-1 text-primary-foreground/90 hover:text-primary-foreground py-2 text-xs sm:text-sm font-bold transition-colors rounded-md hover:bg-primary-foreground/10 px-1.5 sm:px-2"
                >
                  <Globe className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="tracking-wide">{currentLangDisplay}</span>
                  <ChevronDown className={`w-3 h-3 transition-transform ${langMenuOpen ? "rotate-180" : ""}`} />
                </button>
                
                {langMenuOpen && (
                  <div className="absolute top-full left-0 mt-1.5 w-36 bg-card rounded-xl shadow-xl border border-border py-1.5 z-50 overflow-hidden">
                    {languages.map((l) => (
                      <button
                        key={l.code}
                        onClick={() => { setLanguage(l.code); setLangMenuOpen(false); }}
                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                          language === l.code 
                            ? "bg-primary/10 text-primary font-bold" 
                            : "text-foreground hover:bg-muted font-medium"
                        }`}
                      >
                        {l.label}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Logo - ml-2 sm:ml-4 orqali qo'shimcha ravishda chaproqqa surildi */}
              <Link to="/" className="flex items-center gap-2 sm:gap-3 ml-2 sm:ml-4">
                <img 
                  src="/logo.ico" 
                  alt="AvtoExclusive Logo" 
                  className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl shadow-md object-contain"
                />
                <span className="text-primary-foreground font-bold text-lg sm:text-xl hidden md:block tracking-tight" style={{ fontFamily: 'Montserrat, sans-serif' }}>
                  {t("common.siteName")}
                </span>
              </Link>
            </div>

            {/* O'NG TARAFI: Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-1">
              {navLinks.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`px-4 py-2 font-medium transition-all duration-200 ${
                      isActive
                        ? "text-[hsl(var(--cta-green))]"
                        : "text-primary-foreground/80 hover:text-primary-foreground"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}
              
              {/* Pro Button */}
              <Link to="/pro">
                <Button className="ml-2 bg-[hsl(var(--cta-green))] hover:bg-[hsl(var(--cta-green-hover))] text-white font-semibold px-5">
                  <Crown className="w-4 h-4 mr-1" />
                  {t("nav.getPro")}
                </Button>
              </Link>

              {/* User Profile / Login */}
              {user ? (
                <Button
                  variant="ghost"
                  onClick={() => navigate('/profile')}
                  className="ml-2 flex items-center gap-2 text-primary-foreground hover:bg-primary-foreground/10"
                >
                  <Avatar className="h-8 w-8 bg-[hsl(var(--cta-orange))]">
                    <AvatarFallback className="bg-[hsl(var(--cta-orange))] text-white text-sm font-semibold">
                      {getInitials(profile?.full_name || profile?.username)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden xl:block font-medium">
                    {profile?.full_name || profile?.username || t("nav.user")}
                  </span>
                </Button>
              ) : (
                <Button
                  onClick={() => navigate('/auth')}
                  className="ml-2 bg-[hsl(var(--cta-orange))] hover:bg-[hsl(var(--cta-orange-hover))] text-white font-semibold"
                >
                  <LogIn className="w-4 h-4 mr-1" />
                  {t("nav.login")}
                </Button>
              )}
            </div>

            {/* Mobile menu button */}
            <div className="lg:hidden flex items-center gap-1 sm:gap-2">
              <Link to="/pro">
                <Button 
                  size="sm"
                  className="bg-[hsl(var(--cta-green))] hover:bg-[hsl(var(--cta-green-hover))] text-white font-semibold px-2 sm:px-3 h-8 sm:h-9"
                >
                  <Crown className="w-4 h-4 sm:mr-1" />
                  <span className="hidden sm:inline">{t("common.pro")}</span>
                </Button>
              </Link>
              
              {user ? (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate('/profile')}
                  className="text-primary-foreground h-8 w-8 sm:h-9 sm:w-9 ml-1"
                >
                  <Avatar className="h-7 w-7 sm:h-8 sm:w-8 bg-[hsl(var(--cta-orange))]">
                    <AvatarFallback className="bg-[hsl(var(--cta-orange))] text-white text-xs sm:text-sm font-semibold">
                      {getInitials(profile?.full_name || profile?.username)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={() => navigate('/auth')}
                  className="bg-[hsl(var(--cta-orange))] hover:bg-[hsl(var(--cta-orange-hover))] text-white h-8 w-8 sm:h-9 sm:w-9 p-0 ml-1"
                >
                  <LogIn className="w-4 h-4" />
                </Button>
              )}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="p-1.5 sm:p-2 rounded-lg text-primary-foreground hover:bg-primary-foreground/10 transition-colors ml-0.5"
              >
                {mobileMenuOpen ? <X className="w-7 h-7 sm:w-9 sm:h-9" /> : <Menu className="w-7 h-7 sm:w-9 sm:h-9" />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Slide-in from Right */}
        {mobileMenuOpen && (
          <>
            {/* Backdrop */}
            <div 
              className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40 animate-in fade-in duration-300"
              onClick={() => setMobileMenuOpen(false)}
            />
            
            {/* Slide-in Menu */}
            <div className="lg:hidden fixed top-0 right-0 bottom-0 w-[280px] bg-card shadow-2xl z-50 animate-in slide-in-from-right duration-300">
              {/* Header */}
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h2 className="text-lg font-bold text-foreground">Menu</h2>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-lg hover:bg-muted transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* User Section */}
              {user && profile && (
                <div className="p-4 border-b border-border bg-muted/30">
                  <div className="flex items-center gap-3">
                    <Avatar className="h-12 w-12 bg-[hsl(var(--cta-orange))]">
                      <AvatarFallback className="bg-[hsl(var(--cta-orange))] text-white font-semibold">
                        {getInitials(profile?.full_name || profile?.username)}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-foreground truncate">
                        {profile?.full_name || profile?.username}
                      </p>
                      {profile?.username && profile?.full_name && (
                        <p className="text-xs text-muted-foreground truncate">@{profile.username}</p>
                      )}
                    </div>
                  </div>
                  <Button
                    onClick={() => navigate('/profile')}
                    variant="outline"
                    size="sm"
                    className="w-full mt-3 gap-2"
                  >
                    <User className="w-4 h-4" />
                    {t("nav.profile")}
                  </Button>
                </div>
              )}

              {/* Navigation Links */}
              <div className="p-4 space-y-1 overflow-y-auto max-h-[calc(100vh-200px)]">
                <Link
                  to="/"
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                    location.pathname === '/' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'text-foreground hover:bg-muted'
                  }`}
                >
                  <Home className="w-5 h-5" />
                  {t("nav.home")}
                </Link>
                
                <Link
                  to="/contact"
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                    location.pathname === '/contact' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'text-foreground hover:bg-muted'
                  }`}
                >
                  <Phone className="w-5 h-5" />
                  {t("nav.contact")}
                </Link>
                
                <Link
                  to="/darslik"
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                    location.pathname === '/darslik' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'text-foreground hover:bg-muted'
                  }`}
                >
                  <BookOpen className="w-5 h-5" />
                  {t("nav.darslik")}
                </Link>
                
                <Link
                  to="/qoshimcha"
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                    location.pathname === '/qoshimcha' 
                      ? 'bg-primary text-primary-foreground' 
                      : 'text-foreground hover:bg-muted'
                  }`}
                >
                  <Info className="w-5 h-5" />
                  {t("nav.qoshimcha")}
                </Link>

                <div className="pt-2 mt-2 border-t border-border">
                  <Link
                    to="/pro"
                    className="flex items-center gap-3 px-4 py-3 rounded-lg font-medium bg-gradient-to-r from-yellow-500/10 to-amber-500/10 border border-yellow-500/30 text-yellow-700 dark:text-yellow-500 hover:from-yellow-500/20 hover:to-amber-500/20 transition-colors"
                  >
                    <Crown className="w-5 h-5" />
                    {t("nav.getPro")}
                  </Link>
                </div>

                {!user && (
                  <div className="pt-2">
                    <Button
                      onClick={() => navigate('/auth')}
                      className="w-full gap-2 bg-[hsl(var(--cta-orange))] hover:bg-[hsl(var(--cta-orange-hover))]"
                    >
                      <LogIn className="w-4 h-4" />
                      {t("nav.login")}
                    </Button>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </nav>

      {/* Main Content */}
      <main className="flex-1">{children}</main>

      {/* Footer (max-w saqlab qolindi) */}
      <footer className="bg-primary text-primary-foreground py-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* About */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <img 
                  src="/logo.ico" 
                  alt="AvtoExclusive Logo" 
                  className="w-10 h-10 rounded-xl object-contain"
                />
                <span className="font-bold text-xl" style={{ fontFamily: 'Montserrat, sans-serif' }}>{t("common.siteName")}</span>
              </div>
              <p className="text-primary-foreground/70 text-sm leading-relaxed">
                {t("footer.aboutText")}
              </p>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="font-semibold text-lg mb-4">{t("footer.quickLinksTitle")}</h3>
              <div className="space-y-2">
                {navLinks.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className="block text-primary-foreground/70 hover:text-primary-foreground transition-colors text-sm"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>

            {/* Contact */}
            <div>
              <h3 className="font-semibold text-lg mb-4">{t("footer.contactTitle")}</h3>
              <div className="space-y-2 text-sm text-primary-foreground/70">
                <p>{t("footer.telegramLabel")}</p>
                <p>{t("footer.botLabel")}</p>
                <p>{t("footer.workingHoursLabel")}</p>
              </div>
            </div>
          </div>

          <div className="border-t border-primary-foreground/10 mt-8 pt-8 text-center text-primary-foreground/50 text-sm">
            {t("footer.copyright")}
          </div>
        </div>
      </footer>
    </div>
  );
}