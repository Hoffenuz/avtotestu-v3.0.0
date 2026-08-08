import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Menu, X, User, LogIn, Crown, Globe, ChevronDown, Home, Phone, BookOpen, Info, Car, Monitor, Newspaper, MessageCircle, type LucideIcon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { TELEGRAM_GROUP_URL } from "@/lib/telegram";

interface MainLayoutProps {
  children: React.ReactNode;
}

interface QoshimchaLink {
  path: string;
  label: string;
  icon: LucideIcon;
  external?: boolean;
}

export function MainLayout({ children }: MainLayoutProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
  const [qoshimchaOpen, setQoshimchaOpen] = useState(false);
  const [mobileQoshimchaOpen, setMobileQoshimchaOpen] = useState(false);
  const qoshimchaMenuRef = useRef<HTMLDivElement>(null);
  const { language, setLanguage, t } = useLanguage();

  const location = useLocation();
  const navigate = useNavigate();
  const { user, profile } = useAuth();

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    const originalOverflow = document.body.style.overflow;
    if (mobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = originalOverflow;
    }
    return () => { document.body.style.overflow = originalOverflow; };
  }, [mobileMenuOpen]);

  const navLinks = useMemo(() => [
    { path: "/", label: t("nav.home") },
    { path: "/mavzuli", label: t("home.btnMavzuli") },
    { path: "/contact", label: t("nav.contact") },
    { path: "/darslik", label: t("nav.darslik") },
  ], [t]);

  const qoshimchaLinks = useMemo<QoshimchaLink[]>(() => [
    { path: "/belgilar", label: t("nav.roadSigns"), icon: Car },
    { path: "/yangiliklar", label: t("nav.news"), icon: Newspaper },
    { path: "/desktop", label: t("nav.desktopApp"), icon: Monitor },
    { path: "/qoshimcha", label: t("nav.info"), icon: Info },
  ], [t]);

  const isQoshimchaActive = useMemo(
    () => qoshimchaLinks.some((item) => {
      if (item.external) return false;
      return location.pathname === item.path || location.pathname.startsWith(`${item.path}/`);
    }),
    [qoshimchaLinks, location.pathname]
  );

  const toggleQoshimchaMenu = useCallback(() => {
    setQoshimchaOpen((v) => !v);
  }, []);

  useEffect(() => {
    if (!qoshimchaOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (qoshimchaMenuRef.current && !qoshimchaMenuRef.current.contains(e.target as Node)) {
        setQoshimchaOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [qoshimchaOpen]);

  const footerLinks = useMemo(() => [
    { path: "/", label: t("nav.home") },
    { path: "/mavzuli", label: t("home.btnMavzuli") },
    { path: "/contact", label: t("nav.contact") },
  ], [t]);

  const qoshimchaLinkClass = (isActive: boolean) =>
    `flex items-center gap-2.5 px-3.5 py-2 text-sm transition-colors ${
      isActive
        ? "bg-primary/10 text-primary font-semibold"
        : "text-foreground hover:bg-muted font-medium"
    }`;

  const languages = useMemo(() => [
    { code: "uz-lat" as const, display: "UZ", label: t("nav.langLatin") },
    { code: "uz" as const, display: "ЎЗ", label: t("nav.langCyrillic") },
    { code: "ru" as const, display: "RU", label: t("nav.langRussian") },
  ], [t]);

  const currentLangDisplay = useMemo(
    () => languages.find((l) => l.code === language)?.display ?? "UZ",
    [languages, language]
  );

  const handleLanguageChange = useCallback((code: typeof language) => {
    setLanguage(code);
    setLangMenuOpen(false);
  }, [setLanguage]);
  
  const isMavzuliSection = useMemo(
    () => location.pathname === '/mavzuli' || location.pathname.startsWith('/mavzuli/'),
    [location.pathname]
  );

  const getInitials = useCallback((name: string | null | undefined) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  }, []);

  if (isMavzuliSection) {
    return <div className="min-h-screen bg-background">{children}</div>;
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <nav className="sticky top-0 z-50 bg-primary shadow-lg">
        <div className="w-full px-2 sm:px-4 md:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 md:h-[60px]">
            
           <div className="flex items-center gap-3 sm:gap-6 md:gap-8">
              
              <div className="relative flex-shrink-0">
                <button
                  onClick={() => setLangMenuOpen(!langMenuOpen)}
                  className="flex items-center gap-1 text-primary-foreground/90 hover:text-primary-foreground py-2 text-xs sm:text-sm md:text-[15px] font-bold transition-colors rounded-md hover:bg-primary-foreground/10 px-1.5 sm:px-2"
                >
                  <Globe className="w-4 h-4 sm:w-5 sm:h-5" />
                  <span className="tracking-wide">{currentLangDisplay}</span>
                  <ChevronDown className={`w-3 h-3 transition-transform ${langMenuOpen ? "rotate-180" : ""}`} />
                </button>
                
                {langMenuOpen && (
                  <div 
                    className="absolute top-full left-0 mt-1.5 w-36 bg-card rounded-xl shadow-xl border border-border py-1.5 z-50 overflow-hidden"
                    onMouseLeave={() => setLangMenuOpen(false)}
                  >
                    {languages.map((l) => (
                      <button
                        key={l.code}
                        onClick={() => handleLanguageChange(l.code)}
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

              <Link to="/" aria-label="Avtotestlar.uz - Bosh sahifa" className="flex items-center gap-2 sm:gap-3 ml-2 sm:ml-4">
                <img
                  src="/rasm1.webp"
                  alt="Avtotestlar.uz logo"
                  className="hidden md:block w-10 h-10 md:w-[42px] md:h-[42px] rounded-xl shadow-md object-contain"
                  width="42"
                  height="42"
                />
                <span className="text-primary-foreground font-bold text-lg sm:text-xl md:text-[1.3125rem] hidden md:block tracking-tight font-montserrat">
                  {t("common.siteName")}
                </span>
              </Link>
            </div>

            <div className="hidden lg:flex items-center gap-0.5">
              {navLinks.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`px-2.5 py-1.5 text-sm md:text-[15px] font-medium transition-colors duration-200 rounded-md ${
                      isActive
                        ? "text-[hsl(var(--cta-green))]"
                        : "text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/5"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}

              {/* Qo'shimcha — bosish orqali ochiladi/yopiladi */}
              <div className="relative" ref={qoshimchaMenuRef}>
                <button
                  type="button"
                  onClick={toggleQoshimchaMenu}
                  aria-expanded={qoshimchaOpen}
                  className={`flex items-center gap-1 px-2.5 py-1.5 text-sm md:text-[15px] font-medium transition-colors duration-200 rounded-md ${
                    isQoshimchaActive || qoshimchaOpen
                      ? "text-[hsl(var(--cta-green))]"
                      : "text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/5"
                  }`}
                >
                  {t("nav.qoshimcha")}
                  <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-200 ${qoshimchaOpen ? "rotate-180" : ""}`} />
                </button>

                <div
                  className={`absolute top-full left-0 mt-1 w-52 bg-card rounded-xl shadow-xl border border-border py-1.5 z-50 overflow-hidden origin-top transition-all duration-200 ease-out ${
                    qoshimchaOpen
                      ? "opacity-100 scale-100 translate-y-0 pointer-events-auto"
                      : "opacity-0 scale-95 -translate-y-1 pointer-events-none"
                  }`}
                >
                  {qoshimchaLinks.map((item) => {
                    const Icon = item.icon;
                    const isActive = !item.external && location.pathname === item.path;
                    if (item.external) {
                      return (
                        <a
                          key={item.path}
                          href={item.path}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => setQoshimchaOpen(false)}
                          className={qoshimchaLinkClass(false)}
                        >
                          <Icon className="w-4 h-4 shrink-0 opacity-70" />
                          {item.label}
                        </a>
                      );
                    }
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setQoshimchaOpen(false)}
                        className={qoshimchaLinkClass(isActive)}
                      >
                        <Icon className="w-4 h-4 shrink-0 opacity-70" />
                        {item.label}
                      </Link>
                    );
                  })}
                </div>
              </div>
              
              <Link to="/pro">
                <Button size="sm" className="ml-1.5 bg-[hsl(var(--cta-green))] hover:bg-[hsl(var(--cta-green-hover))] text-white font-semibold px-3.5 h-8">
                  <Crown className="w-3.5 h-3.5 mr-1" />
                  {t("nav.getPro")}
                </Button>
              </Link>

              {user ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => navigate('/profile')}
                  className="ml-1 flex items-center gap-1.5 text-primary-foreground hover:bg-primary-foreground/10 h-8 px-2"
                >
                  <div className="h-7 w-7 rounded-full bg-[hsl(var(--cta-orange))] flex items-center justify-center flex-shrink-0">
                    <User className="w-3.5 h-3.5 text-white" />
                  </div>
                  <span className="hidden xl:block text-sm font-medium">
                    {t("nav.profile")}
                  </span>
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={() => navigate('/auth')}
                  className="ml-1 bg-[hsl(var(--cta-orange))] hover:bg-[hsl(var(--cta-orange-hover))] text-white font-semibold h-8 px-3"
                >
                  <LogIn className="w-3.5 h-3.5 mr-1" />
                  {t("nav.login")}
                </Button>
              )}
            </div>

            <div className="lg:hidden flex items-center gap-1 sm:gap-2">
              <Link to="/pro">
                <Button 
                  size="sm"
                  className="bg-[hsl(var(--cta-green))] hover:bg-[hsl(var(--cta-green-hover))] text-white font-semibold px-3 h-8 sm:h-9 flex items-center gap-1.5"
                >
                  <Crown className="w-4 h-4" />
                  <span className="text-xs sm:text-sm">PRO</span>
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
                  className="bg-[hsl(var(--cta-orange))] hover:bg-[hsl(var(--cta-orange-hover))] text-white font-semibold px-3 h-8 sm:h-9 flex items-center gap-1.5"
                >
                  <LogIn className="w-4 h-4" />
                  <span className="text-xs sm:text-sm">{t("nav.login")}</span>
                </Button>
              )}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label={mobileMenuOpen ? "Menyuni yopish" : "Menyuni ochish"}
                aria-expanded={mobileMenuOpen}
                className="p-1.5 sm:p-2 rounded-lg text-primary-foreground hover:bg-primary-foreground/10 transition-colors ml-0.5"
              >
                {mobileMenuOpen ? <X className="w-7 h-7 sm:w-9 sm:h-9" /> : <Menu className="w-7 h-7 sm:w-9 sm:h-9" />}
              </button>
            </div>
          </div>
        </div>

        {mobileMenuOpen && (
          <>
            <div 
              className="lg:hidden fixed inset-0 bg-black/50 backdrop-blur-sm z-40 animate-in fade-in duration-300"
              onClick={() => setMobileMenuOpen(false)}
            />
            
            <div className="lg:hidden fixed top-0 right-0 bottom-0 w-[280px] bg-card shadow-2xl z-50 animate-in slide-in-from-right duration-300">
              <div className="flex items-center justify-between p-4 border-b border-border">
                <h2 className="text-lg font-bold text-foreground">Menu</h2>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-2 rounded-lg hover:bg-muted transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

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
                        {t("nav.profile")}
                      </p>
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
                  to="/mavzuli"
                  className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                    location.pathname === '/mavzuli' || location.pathname.startsWith('/mavzuli/')
                      ? 'bg-primary text-primary-foreground'
                      : 'text-foreground hover:bg-muted'
                  }`}
                >
                  <BookOpen className="w-5 h-5" />
                  {t("home.btnMavzuli")}
                </Link>
                
                <div>
                  <button
                    type="button"
                    onClick={() => setMobileQoshimchaOpen((v) => !v)}
                    className={`w-full flex items-center justify-between gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                      isQoshimchaActive
                        ? 'bg-primary text-primary-foreground'
                        : 'text-foreground hover:bg-muted'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <Info className="w-5 h-5" />
                      {t("nav.qoshimcha")}
                    </span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${mobileQoshimchaOpen ? 'rotate-180' : ''}`} />
                  </button>
                  <div
                    className={`ml-4 overflow-hidden border-l-2 border-border pl-3 transition-all duration-200 ease-out ${
                      mobileQoshimchaOpen ? 'max-h-64 opacity-100 mt-1' : 'max-h-0 opacity-0 mt-0'
                    }`}
                  >
                    <div className="space-y-0.5 pb-1">
                      {qoshimchaLinks.map((item) => {
                        const Icon = item.icon;
                        const isActive = !item.external && location.pathname === item.path;
                        const className = `flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                          isActive ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-muted'
                        }`;
                        if (item.external) {
                          return (
                            <a
                              key={item.path}
                              href={item.path}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={className}
                            >
                              <Icon className="w-4 h-4 opacity-70" />
                              {item.label}
                            </a>
                          );
                        }
                        return (
                          <Link key={item.path} to={item.path} className={className}>
                            <Icon className="w-4 h-4 opacity-70" />
                            {item.label}
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                </div>

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

      <main className="flex-1">{children}</main>

      <footer className="bg-primary text-primary-foreground py-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <img
                  src="/rasm1.webp"
                  alt="Avtotestlar.uz logo"
                  className="w-10 h-10 rounded-xl object-contain"
                  width="40"
                  height="40"
                  loading="lazy"
                />
                <span className="font-bold text-xl font-montserrat">{t("common.siteName")}</span>
              </div>
              <p className="text-primary-foreground/70 text-sm pl-[52px]">
                {t("footer.tagline")}
              </p>
            </div>

            <div>
              <h3 className="font-semibold text-lg mb-4">{t("footer.quickLinksTitle")}</h3>
              <div className="space-y-2">
                {footerLinks.map((item) => (
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

            <div>
              <h3 className="font-semibold text-lg mb-4">{t("footer.contactTitle")}</h3>
              <div className="space-y-2 text-sm text-primary-foreground/70">
                <a
                  href={TELEGRAM_GROUP_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 hover:text-primary-foreground transition-colors"
                >
                  <MessageCircle className="w-4 h-4 flex-shrink-0" />
                  {t("tgGroup.join")}
                </a>
                <p>{t("footer.telegramLabel")}</p>
                <p>{t("footer.botLabel")}</p>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
