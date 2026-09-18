import { BottomNav } from "./BottomNav";
import { useDarkMode } from "@/hooks/useDarkMode";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useState, useEffect, useMemo, useCallback } from "react";
import { Menu, X, User, LogIn, Crown, Globe, ChevronDown, Home, BookOpen, BookMarked, LayoutGrid, Moon, Sun } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { TELEGRAM_GROUP_URL } from "@/lib/telegram";
import { TelegramGroupNotice } from "@/components/TelegramGroupNotice";

/**
 * Guruh manzilining "@nom" ko'rinishi — footerda qolgan aloqa qatorlari
 * bilan bir xil uslubda ko'rsatish uchun. Havola manbasi bitta:
 * `TELEGRAM_GROUP_URL`.
 */
const telegramGroupHandle = `@${TELEGRAM_GROUP_URL.split("/").filter(Boolean).pop()}`;

/**
 * "Telegram: @nom" ko'rinishidagi matndan bosiladigan qator yasaydi.
 *
 * NEGA MATNDAN OLINADI: manzil tarjima faylida, havola esa kodda edi va
 * ular bir vaqtlar AJRALIB KETGAN — footerda bir nom, koddagi
 * `TELEGRAM_ADMIN_URL` da boshqa nom turardi va qaysi biri to'g'ri
 * ekanini kod bilib bo'lmasdi. Endi havola KO'RSATILGAN nomdan yasaladi:
 * foydalanuvchi nimani ko'rsa, o'shanga o'tadi — nom o'zgarganda ham
 * (masalan rebrandingda) ikkisi hech qachon ajralib qolmaydi.
 *
 * Matnda "@nom" bo'lmasa — oddiy matn qaytariladi, hech narsa buzilmaydi.
 */
function TelegramQatori({ label }: { label: string }) {
  const mos = label.match(/@([A-Za-z0-9_]{4,32})/);
  if (!mos) return <p>{label}</p>;

  const [, nom] = mos;
  const oldi = label.slice(0, mos.index);
  const keyin = label.slice((mos.index ?? 0) + mos[0].length);

  return (
    <p>
      {oldi}
      <a
        href={`https://t.me/${nom}`}
        target="_blank"
        rel="noopener noreferrer"
        className="transition-colors hover:text-primary-foreground hover:underline"
      >
        @{nom}
      </a>
      {keyin}
    </p>
  );
}

interface MainLayoutProps {
  children: React.ReactNode;
}

export function MainLayout({ children }: MainLayoutProps) {
  const { isDark, toggle: toggleDark } = useDarkMode();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [langMenuOpen, setLangMenuOpen] = useState(false);
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

  /**
   * Asosiy navigatsiya — DESKTOP va MOBIL uchun YAGONA manba.
   *
   * TO'RTTA BAND, har biri boshqa vazifada: kirish nuqtasi → mahsulot →
   * o'rganish → yangi kontent.
   *
   * Nima olib tashlandi va nega:
   *   * "Aloqa" — qo'llab-quvvatlash havolasi, mahsulot bo'limi emas.
   *     Footer'da allaqachon bor edi, ya'ni menyuda takrorlanardi va
   *     to'rtta eng qimmat joydan bittasini egallardi.
   *   * "Qo'shimcha" ochiluvchi menyusi — nomi ichida nima borligini
   *     aytmasdi va uchta bog'lanmagan narsani (Yangiliklar, Kompyuter
   *     ilova, Ma'lumotlar) bir qopga solgandi. "Ma'lumotlar" "Qo'llanma"
   *     nomi bilan shu yerda o'z bandiga chiqdi; Kompyuter ilova
   *     `/bolimlar` pastidagi alohida kartochkaga va footer'ga.
   *   * "Yangiliklar" — bo'lim doimiy yangilanib turishini talab qiladi,
   *     amalda esa unga material qo'yishga vaqt yo'q. Eskirgan bo'lim
   *     menyuda turgani saytga ishonchni tushiradi. Sahifa o'zi qoldi
   *     (indekslangan) — unga endi footer'dan boriladi.
   *
   * Ilgari mobil menyu qo'lda, alohida yozilgan edi va tartibi desktopnikidan
   * farq qilardi — bir foydalanuvchi ikki qurilmada ikki xil tartibni
   * ko'rardi. Endi ikkalasi ham shu ro'yxatdan chiziladi.
   */
  const navLinks = useMemo(() => [
    { path: "/", label: t("nav.home"), icon: Home },
    { path: "/bolimlar", label: t("nav.sections"), icon: LayoutGrid },
    { path: "/darslik", label: t("nav.darslik"), icon: BookOpen },
    { path: "/qoshimcha", label: t("sections.qollanma"), icon: BookMarked },
  ], [t]);

  /**
   * Footer havolalari — asosiy menyuga sig'magan, lekin YO'QOLMASLIGI
   * kerak bo'lgan sahifalar shu yerda turadi.
   *
   * Aloqa, Yangiliklar va Kompyuter ilova aynan shu sababdan bu ro'yxatda:
   * ular header'dan olib tashlandi, demak doimiy yo'l faqat shu yerda
   * qoladi. (Kompyuter ilovaga ikkinchi, ko'zga tashlanadigan yo'l
   * `/bolimlar` sahifasining pastida ham bor.)
   */
  const footerLinks = useMemo(() => [
    { path: "/bolimlar", label: t("nav.sections") },
    { path: "/darslik", label: t("nav.darslik") },
    { path: "/qoshimcha", label: t("sections.qollanma") },
    { path: "/yangiliklar", label: t("nav.news") },
    { path: "/desktop", label: t("nav.desktopApp") },
    { path: "/contact", label: t("nav.contact") },
  ], [t]);

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
  
  const getInitials = useCallback((name: string | null | undefined) => {
    if (!name) return "U";
    return name.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);
  }, []);

  // DIQQAT: bu yerda ilgari `/mavzuli` uchun ERTA QAYTISH bor edi va u sayt
  // navigatsiyasini butunlay olib tashlardi. Natijada `/bolimlar` dan
  // "Mavzuli testlar" ga o'tilganda header yo'qolib, sahifaning o'z ichki
  // paneliga almashardi — foydalanuvchi uchun "boshqa saytga tushdim" degan
  // taassurot. Endi barcha sahifalarda BITTA header.
  return (
    <div className="min-h-screen flex flex-col bg-background has-bottom-nav">
      <nav className="sticky top-0 z-50 bg-brand shadow-lg">
        {/*
          `max-w-7xl mx-auto` SHART — footer va sahifa kontenti ham aynan
          shu kenglikda. Ilgari header `w-full` edi va keng ekranda (yoki
          brauzer masshtabi kichraytirilganda) `justify-between` elementlarni
          ekranning eng chekkalariga surib yuborardi: yuqorida logotip
          chap burchakda, tugmalar o'ng burchakda, o'rtada esa bo'sh joy —
          pastdagi markazlashgan kontentdan uzilib qolardi.
        */}
        <div className="mx-auto w-full max-w-7xl px-2 sm:px-4 md:px-6 lg:px-8">
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

              {/*
                LOGOTIP IKKI VARIANTDA — `<picture>` orqali.

                MOBILDA LOGOTIP UMUMAN KO'RSATILMAYDI: telefonda header
                tor va unda til, tema, PRO va menyu tugmalari bor edi —
                logotip qo'shilganda hammasi siqilib, to'lib ketardi.
                Bosh sahifaga o'tish uchun hamburger menyu va pastki
                navigatsiya bor, ya'ni hech qanday yo'l yo'qolmaydi.

                Desktopda gorizontal logotip qoladi — u "AvtoSmart"
                yozuvini o'z ichiga oladi, shuning uchun yonida alohida
                matn YOZILMAYDI (aks holda nom ikki marta chiqardi).

                NEGA IKKI `<img>` EMAS, `<picture>`: `display:none` qilingan
                rasmni ham brauzer YUKLAB OLADI — ya'ni har bir tashrifchi
                o'ziga kerak bo'lmagan variantni ham tortardi. `<picture>`
                da esa `media` shartiga mos MANBAGINA so'raladi.

                `width`/`height` — CLS uchun: rasm kelmaguncha joyi band
                bo'lsin. `<source>` dagilari desktop nisbatini beradi.
              */}
              <Link
                to="/"
                aria-label="AvtoSmart — Bosh sahifa"
                className="hidden items-center ml-2 sm:ml-4 md:flex"
              >
                <img
                  src="/avtosmart-logo-white-notag.webp"
                  alt="AvtoSmart"
                  className="h-9 w-auto object-contain"
                  width="600"
                  height="154"
                />
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
                        ? "text-cta-green"
                        : "text-primary-foreground/80 hover:text-primary-foreground hover:bg-primary-foreground/5"
                    }`}
                  >
                    {item.label}
                  </Link>
                );
              })}

              {/* Dark mode — istalgan sahifada almashtiriladi */}
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleDark}
                aria-label={isDark ? "Yorug' rejim" : "Qorong'i rejim"}
                title={isDark ? "Yorug' rejim" : "Qorong'i rejim"}
                className="h-8 w-8 p-0 text-primary-foreground hover:bg-primary-foreground/10"
              >
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </Button>

              <Link to="/pro">
                <Button size="sm" className="ml-1.5 bg-cta-green hover:bg-cta-green-hover text-white font-semibold px-3.5 h-8">
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
                  <div className="h-7 w-7 rounded-full bg-cta-orange flex items-center justify-center flex-shrink-0">
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
                  className="ml-1 bg-cta-orange hover:bg-cta-orange-hover text-white font-semibold h-8 px-3"
                >
                  <LogIn className="w-3.5 h-3.5 mr-1" />
                  {t("nav.login")}
                </Button>
              )}
            </div>

            <div className="lg:hidden flex items-center gap-1 sm:gap-2">
              {/* Dark mode — istalgan sahifada almashtiriladi */}
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleDark}
                aria-label={isDark ? "Yorug' rejim" : "Qorong'i rejim"}
                title={isDark ? "Yorug' rejim" : "Qorong'i rejim"}
                className="h-8 w-8 p-0 text-primary-foreground hover:bg-primary-foreground/10"
              >
                {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </Button>

              <Link to="/pro">
                <Button 
                  size="sm"
                  className="bg-cta-green hover:bg-cta-green-hover text-white font-semibold px-3 h-8 sm:h-9 flex items-center gap-1.5"
                >
                  <Crown className="w-4 h-4" />
                  <span className="text-xs sm:text-sm">PRO</span>
                </Button>
              </Link>
              
              {user ? (
                /*
                  Profil ikonkasi MOBILDA YASHIRILGAN: header tor va profilga
                  hamburger menyu hamda pastki navigatsiya orqali kirish
                  mumkin — ya'ni takroriy tugma faqat joy egallardi.
                */
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => navigate('/profile')}
                  className="hidden text-primary-foreground h-8 w-8 sm:h-9 sm:w-9 ml-1 md:inline-flex"
                >
                  <Avatar className="h-7 w-7 sm:h-8 sm:w-8 bg-cta-orange">
                    <AvatarFallback className="bg-cta-orange text-white text-xs sm:text-sm font-semibold">
                      {getInitials(profile?.full_name || profile?.username)}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              ) : (
                <Button
                  size="sm"
                  onClick={() => navigate('/auth')}
                  className="bg-cta-orange hover:bg-cta-orange-hover text-white font-semibold px-3 h-8 sm:h-9 flex items-center gap-1.5"
                >
                  <LogIn className="w-4 h-4" />
                  <span className="text-xs sm:text-sm">{t("nav.login")}</span>
                </Button>
              )}
              {/*
                `max-[359px]:` — 320px li eski telefonlarda bu qator 4px ga
                toshib, BUTUN sahifada gorizontal scroll paydo qilardi
                (pastki menyu ham 324px ga cho'zilardi). 360px va undan
                kattalarda hech narsa o'zgarmaydi.
              */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label={mobileMenuOpen ? "Menyuni yopish" : "Menyuni ochish"}
                aria-expanded={mobileMenuOpen}
                className="p-1.5 max-[359px]:p-1 sm:p-2 rounded-lg text-primary-foreground hover:bg-primary-foreground/10 transition-colors ml-0.5"
              >
                {mobileMenuOpen
                  ? <X className="w-7 h-7 max-[359px]:w-6 max-[359px]:h-6 sm:w-9 sm:h-9" />
                  : <Menu className="w-7 h-7 max-[359px]:w-6 max-[359px]:h-6 sm:w-9 sm:h-9" />}
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
                    <Avatar className="h-12 w-12 bg-cta-orange">
                      <AvatarFallback className="bg-cta-orange text-white font-semibold">
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
                {navLinks.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg font-medium transition-colors ${
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'text-foreground hover:bg-muted'
                      }`}
                    >
                      <Icon className="w-5 h-5" />
                      {item.label}
                    </Link>
                  );
                })}

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
                      className="w-full gap-2 bg-cta-orange hover:bg-cta-orange-hover"
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

      {/* Guruh xabarnomasi — har foydalanuvchiga bir marta, footer ustida */}
      <TelegramGroupNotice />

      <footer className="bg-brand text-brand-foreground py-10">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div>
              {/* Logotip wordmark'ni o'z ichiga oladi — yonida matn takrorlanmaydi. */}
              <img
                src="/avtosmart-logo-white-notag.webp"
                alt="AvtoSmart"
                className="mb-3 h-10 w-auto object-contain"
                width="600"
                height="154"
                loading="lazy"
              />
              <p className="text-primary-foreground/70 text-sm">
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
              {/*
                Uchala aloqa qatori BIR XIL ko'rinishda: "nomi: @manzil".
                Ilgari guruh alohida katta kartochka edi va u qolgan ikki
                qatordan ajralib, ustunni nomutanosib qilardi.

                Manzil `TELEGRAM_GROUP_URL` dan olinadi — qo'lda yozilsa
                havola bilan matn ajralib ketishi mumkin edi.
              */}
              <div className="space-y-1.5 text-sm text-primary-foreground/70">
                <p>
                  <a
                    href={TELEGRAM_GROUP_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="transition-colors hover:text-primary-foreground"
                  >
                    {t("footer.groupLabel")}: {telegramGroupHandle}
                  </a>
                </p>
                <TelegramQatori label={t("footer.telegramLabel")} />
                <TelegramQatori label={t("footer.botLabel")} />
              </div>
            </div>
          </div>
        </div>
      </footer>

      <BottomNav />
    </div>
  );
}
