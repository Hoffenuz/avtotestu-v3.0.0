import { BottomNav } from "./BottomNav";
import { useDarkMode } from "@/hooks/useDarkMode";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { authState } from "@/lib/authEntry";
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { Menu, X, LogIn, Crown, Globe, ChevronDown, ChevronRight, Home, BookOpen, BookMarked, LayoutGrid, Moon, Sun, Check } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { TELEGRAM_GROUP_URL } from "@/lib/telegram";

/**
 * Guruh manzilining "@nom" ko'rinishi — footerda qolgan aloqa qatorlari
 * bilan bir xil uslubda ko'rsatish uchun. Havola manbasi bitta:
 * `TELEGRAM_GROUP_URL`.
 */
const telegramGroupHandle = `@${TELEGRAM_GROUP_URL.split("/").filter(Boolean).pop()}`;

/**
 * Header logotiplari — header SIYOH fonda, shuning uchun oq variantlar
 * (footer bilan bir xil fayl):
 *   * desktop (md+) — oq gorizontal logotip;
 *   * mobil — faqat oq belgi: joy tor, u yerda til/PRO/kirish/menyu bor.
 *
 * `<picture>` — faqat ekranga MOS fayl yuklanadi (display:none bo'lgan
 * `<img>` ni brauzer baribir yuklab oladi).
 */
const HEADER_LOGO = { src: "/avtosmart-logo-white-notag.webp", width: 600, height: 154 } as const;
const HEADER_MARK = { src: "/avtosmart-icon-white.webp", width: 128, height: 128 } as const;

/** Footer'dagi yil — modul yuklanganda bir marta hisoblanadi. */
const FOOTER_YEAR = new Date().getFullYear();

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
  /**
   * Footer chizilmasin. Qisqa "harakat" sahifalari uchun (/test-ishlash
   * boshlash ekrani): telefonda kontent kalta bo'lib, footer ekranning
   * o'rtasidan boshlanib qolardi — sahifa "tugab qolgan" ko'rinardi.
   * Navigatsiya header va pastki menyuda baribir bor.
   */
  hideFooter?: boolean;
}

export function MainLayout({ children, hideFooter = false }: MainLayoutProps) {
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
   * Til menyusi tashqarisiga bosilganda yopiladi.
   *
   * Ilgari u faqat `onMouseLeave` bilan yopilardi — telefonda sichqoncha
   * yo'q, ya'ni menyu tanlov qilinmaguncha ochiq qolib ketardi.
   */
  const langMenuRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!langMenuOpen) return;
    const onPointerDown = (e: PointerEvent) => {
      if (!langMenuRef.current?.contains(e.target as Node)) setLangMenuOpen(false);
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setLangMenuOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [langMenuOpen]);

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
   * Footer havolalari — FAQAT asosiy menyuga sig'magan, lekin YO'QOLMASLIGI
   * kerak bo'lgan sahifalar.
   *
   * Aloqa, Yangiliklar va Kompyuter ilova aynan shu sababdan bu ro'yxatda:
   * ular header'dan olib tashlandi, demak doimiy yo'l faqat shu yerda
   * qoladi. (Kompyuter ilovaga ikkinchi, ko'zga tashlanadigan yo'l
   * `/bolimlar` sahifasining pastida ham bor.)
   *
   * Bo'limlar, Darslik va Qo'llanma OLIB TASHLANDI (2026-09): ular header
   * menyusida (telefonda — menyu va pastki navigatsiyada) doim turadi.
   * Footerda takrorlanib ro'yxatni ikki barobar uzaytirardi, telefonda esa
   * footer uzun ustunga aylanardi.
   */
  const footerLinks = useMemo(() => [
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
      {/*
        HEADER — SIYOH (brend rangi, Ink #131A45) — saytning tanish belgisi.
        Footer va ichki sahifalarning siyoh bannerlari (Belgilar, Darslik,
        Profil) bilan bir butun bo'lib qoladi.

        Ilgari tugmalari yashil ("Pro olish") va to'q sariq ("Kirish") edi —
        ikki xil yorqin rang siyoh fonda bir-biri bilan raqobatlashardi,
        ustiga qalin soya. Endi:
          * "Kirish" — oq tugma, siyoh matn: fondagi eng aniq element;
          * PRO — yumshoq oltin: premiumligi bilinadi, lekin baqirmaydi;
          * faol menyu bandi — oq matn + ostida akvamarin chiziq (brend
            palitrasidagi urg'u rangi, logotipdagi "tezlik yoyi");
          * soya o'rniga pastda ingichka chiziq.
        Burchaklar `rounded-lg` (8px) — "tabletka" emas, aniq tugma.

        `max-w-7xl mx-auto` SHART — footer va sahifa kontenti ham aynan
        shu kenglikda (keng ekranda elementlar chetlarga qochib ketmasin).
      */}
      <nav className="sticky top-0 z-50 border-b border-white/10 bg-brand">
        <div className="mx-auto w-full max-w-7xl px-3 sm:px-4 md:px-6 lg:px-8">
          <div className="flex h-14 items-center justify-between gap-2 md:h-[60px]">

            {/* CHAP: logotip + asosiy menyu (desktop) */}
            <div className="flex min-w-0 items-center gap-6 xl:gap-10">
              <Link
                to="/"
                aria-label="AvtoSmart — Bosh sahifa"
                className="flex shrink-0 items-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
              >
                <picture>
                  <source
                    media="(min-width: 768px)"
                    srcSet={HEADER_LOGO.src}
                    width={HEADER_LOGO.width}
                    height={HEADER_LOGO.height}
                  />
                  <img
                    src={HEADER_MARK.src}
                    alt="AvtoSmart"
                    width={HEADER_MARK.width}
                    height={HEADER_MARK.height}
                    className="h-8 w-auto md:h-9"
                  />
                </picture>
              </Link>

              <div className="hidden items-center gap-0.5 lg:flex">
                {navLinks.map((item) => {
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      aria-current={isActive ? "page" : undefined}
                      className={`relative rounded-md px-3 py-2 text-[15px] transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 ${
                        isActive
                          ? "font-semibold text-white after:absolute after:inset-x-3 after:-bottom-[11px] after:h-0.5 after:rounded-full after:bg-[#22D3EE]"
                          : "font-medium text-white/70 hover:text-white"
                      }`}
                    >
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>

            {/* O'NG: til, tema (desktop), PRO, kirish/profil, menyu (mobil) */}
            <div className="flex shrink-0 items-center gap-1 sm:gap-1.5">

              <div ref={langMenuRef} className="relative">
                <button
                  type="button"
                  onClick={() => setLangMenuOpen((open) => !open)}
                  aria-haspopup="menu"
                  aria-expanded={langMenuOpen}
                  aria-label={t("nav.language")}
                  className="inline-flex h-9 items-center gap-1 rounded-lg px-2 text-sm font-semibold text-white/80 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60"
                >
                  <Globe className="hidden h-4 w-4 sm:block" aria-hidden="true" />
                  <span>{currentLangDisplay}</span>
                  <ChevronDown className={`h-3.5 w-3.5 transition-transform ${langMenuOpen ? "rotate-180" : ""}`} aria-hidden="true" />
                </button>

                {langMenuOpen && (
                  <div
                    role="menu"
                    className="absolute right-0 top-full z-50 mt-2 w-44 overflow-hidden rounded-lg border border-border bg-card py-1 shadow-lg"
                  >
                    {languages.map((l) => (
                      <button
                        key={l.code}
                        type="button"
                        role="menuitemradio"
                        aria-checked={language === l.code}
                        onClick={() => handleLanguageChange(l.code)}
                        className={`flex w-full items-center justify-between px-3.5 py-2.5 text-left text-sm transition-colors ${
                          language === l.code
                            ? "font-semibold text-foreground"
                            : "font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                        }`}
                      >
                        {l.label}
                        {language === l.code && <Check className="h-4 w-4 text-primary" aria-hidden="true" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Tema — desktopda shu yerda; mobilda menyu ichida (header tor) */}
              <button
                type="button"
                onClick={toggleDark}
                aria-label={isDark ? t("nav.lightMode") : t("nav.darkMode")}
                title={isDark ? t("nav.lightMode") : t("nav.darkMode")}
                className="hidden h-9 w-9 items-center justify-center rounded-lg text-white/80 transition-colors hover:bg-white/10 hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 lg:inline-flex"
              >
                {isDark ? <Sun className="h-[18px] w-[18px]" /> : <Moon className="h-[18px] w-[18px]" />}
              </button>

              <Link
                to="/pro"
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-amber-300/40 bg-amber-300/10 px-2.5 text-sm font-semibold text-amber-100 transition-colors hover:bg-amber-300/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 sm:px-3"
              >
                <Crown className="h-4 w-4 text-amber-300" aria-hidden="true" />
                <span className="lg:hidden">PRO</span>
                <span className="hidden lg:inline">{t("nav.getPro")}</span>
              </Link>

              {user ? (
                /*
                  Profil tugmasi MOBILDA YASHIRILGAN: profilga hamburger
                  menyu va pastki navigatsiya orqali kiriladi — takroriy
                  tugma tor headerda faqat joy egallardi.
                */
                <button
                  type="button"
                  onClick={() => navigate("/profile")}
                  aria-label={t("nav.profile")}
                  className="hidden h-9 items-center gap-2 rounded-lg pl-1 pr-1 transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 md:inline-flex xl:pr-2.5"
                >
                  <Avatar className="h-7 w-7 bg-white">
                    <AvatarFallback className="bg-white text-xs font-semibold text-[#131A45]">
                      {getInitials(profile?.full_name || profile?.username)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="hidden text-sm font-medium text-white xl:block">{t("nav.profile")}</span>
                </button>
              ) : (
                <Button
                  size="sm"
                  onClick={() => navigate("/auth", { state: authState(location.pathname + location.search) })}
                  className="h-9 gap-1.5 rounded-lg bg-white px-3 font-semibold text-[#131A45] hover:bg-white/90 focus-visible:ring-white/60 sm:px-4"
                >
                  <LogIn className="h-4 w-4 lg:hidden" aria-hidden="true" />
                  <span className="max-[359px]:sr-only">{t("nav.login")}</span>
                </Button>
              )}

              <button
                type="button"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label={mobileMenuOpen ? "Menyuni yopish" : "Menyuni ochish"}
                aria-expanded={mobileMenuOpen}
                className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-white transition-colors hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/60 lg:hidden"
              >
                {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
              </button>
            </div>
          </div>
        </div>

        {mobileMenuOpen && (
          <>
            <div
              className="fixed inset-0 z-40 bg-black/40 animate-in fade-in duration-200 lg:hidden"
              onClick={() => setMobileMenuOpen(false)}
            />

            <div className="fixed inset-y-0 right-0 z-50 flex w-[288px] max-w-[85vw] flex-col bg-card shadow-2xl animate-in slide-in-from-right duration-300 lg:hidden">
              <div className="flex h-14 shrink-0 items-center justify-between border-b border-border px-4">
                <span className="text-base font-semibold text-foreground">{t("nav.menu")}</span>
                <button
                  type="button"
                  onClick={() => setMobileMenuOpen(false)}
                  aria-label="Menyuni yopish"
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {user && (
                <button
                  type="button"
                  onClick={() => navigate("/profile")}
                  className="flex shrink-0 items-center gap-3 border-b border-border px-4 py-3.5 text-left transition-colors hover:bg-muted/60"
                >
                  <Avatar className="h-10 w-10 bg-primary">
                    <AvatarFallback className="bg-primary text-sm font-semibold text-primary-foreground">
                      {getInitials(profile?.full_name || profile?.username)}
                    </AvatarFallback>
                  </Avatar>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-foreground">
                      {profile?.full_name || profile?.username || t("nav.profile")}
                    </span>
                    <span className="block text-xs text-muted-foreground">{t("nav.profile")}</span>
                  </span>
                  <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                </button>
              )}

              <div className="flex-1 space-y-1 overflow-y-auto p-3">
                {navLinks.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      aria-current={isActive ? "page" : undefined}
                      className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-[15px] transition-colors ${
                        isActive
                          ? "bg-muted font-semibold text-foreground"
                          : "font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      <Icon className={`h-5 w-5 ${isActive ? "text-primary" : ""}`} aria-hidden="true" />
                      {item.label}
                    </Link>
                  );
                })}

                <div className="my-2 border-t border-border" />

                <button
                  type="button"
                  onClick={toggleDark}
                  className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[15px] font-medium text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                >
                  {isDark ? <Sun className="h-5 w-5" aria-hidden="true" /> : <Moon className="h-5 w-5" aria-hidden="true" />}
                  {isDark ? t("nav.lightMode") : t("nav.darkMode")}
                </button>

                <Link
                  to="/pro"
                  className="flex items-center gap-3 rounded-lg border border-amber-300/80 bg-amber-50 px-3 py-2.5 text-[15px] font-semibold text-amber-900 transition-colors hover:bg-amber-100 dark:border-amber-400/30 dark:bg-amber-400/10 dark:text-amber-200 dark:hover:bg-amber-400/15"
                >
                  <Crown className="h-5 w-5 text-amber-600 dark:text-amber-300" aria-hidden="true" />
                  {t("nav.getPro")}
                </Link>
              </div>

              {!user && (
                <div className="shrink-0 border-t border-border p-3">
                  <Button onClick={() => navigate("/auth", { state: authState(location.pathname + location.search) })} className="h-11 w-full gap-2 rounded-lg font-semibold">
                    <LogIn className="h-4 w-4" aria-hidden="true" />
                    {t("nav.login")}
                  </Button>
                </div>
              )}
            </div>
          </>
        )}
      </nav>

      <main className="flex-1">{children}</main>

      {/*
        Telegram guruh xabarnomasi BU YERDA EMAS (2026-09): layout ichida u
        HAR sahifada — test boshlash ekranida ham — chiqib turardi. Endi
        faqat bosh sahifaning oxirida (`Home.tsx`).
      */}

      {/*
        FOOTER — ixcham. Chekkalar header va sahifa kontenti bilan bir xil
        (`px-4 md:px-6 lg:px-8`), telefonda ikkala ro'yxat YONMA-YON (ilgari
        uch blok ustma-ust tushib, footer ekrandan uzun bo'lardi). Ustun
        sarlavhalari kichik va xira — ko'z havolalarning o'ziga tushadi.
      */}
      {!hideFooter && (
      <footer className="bg-brand text-brand-foreground">
        <div className="mx-auto max-w-7xl px-4 pb-6 pt-10 md:px-6 lg:px-8">
          <div className="grid grid-cols-2 gap-x-6 gap-y-8 md:grid-cols-[1.6fr_1fr_1fr]">
            <div className="col-span-2 md:col-span-1">
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

            <nav aria-label={t("footer.quickLinksTitle")}>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-primary-foreground/50">
                {t("footer.quickLinksTitle")}
              </h3>
              <div className="space-y-2">
                {footerLinks.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className="block text-[13px] text-primary-foreground/75 transition-colors hover:text-primary-foreground sm:text-sm"
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </nav>

            <div>
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-primary-foreground/50">
                {t("footer.contactTitle")}
              </h3>
              {/*
                Uchala aloqa qatori BIR XIL ko'rinishda: "nomi: @manzil".
                Ilgari guruh alohida katta kartochka edi va u qolgan ikki
                qatordan ajralib, ustunni nomutanosib qilardi.

                Manzil `TELEGRAM_GROUP_URL` dan olinadi — qo'lda yozilsa
                havola bilan matn ajralib ketishi mumkin edi.
              */}
              <div className="space-y-2 break-words text-[13px] text-primary-foreground/75 sm:text-sm">
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

          <p className="mt-8 border-t border-white/10 pt-5 text-xs text-primary-foreground/50">
            © {FOOTER_YEAR} AvtoSmart
          </p>
        </div>
      </footer>
      )}

      <BottomNav />
    </div>
  );
}
