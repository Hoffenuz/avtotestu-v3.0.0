import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { Helmet } from "react-helmet-async";
import { SEO } from "@/components/SEO";
import { useAuth } from "@/contexts/AuthContext";
import { hasStoredSession } from "@/lib/hasStoredSession";
import { useLanguage } from "@/contexts/LanguageContext";
import { useAccessState } from "@/hooks/useAccessState";
import {
  Play,
  User,
  BarChart3,
  BookOpen,
  Settings,
  Crown,
  MonitorSmartphone,
  ShieldCheck,
  Trophy,
  Check,
  LayoutGrid,
  ArrowRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { SectionGrid } from "@/components/SectionGrid";
import { QuestionPreview } from "@/components/home/QuestionPreview";
import { QUICK_ITEMS } from "@/lib/siteSections";
import { fetchSectionCounts } from "@/lib/questionState";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { SiteNotificationBanner } from "@/components/SiteNotificationBanner";
import HomeTopBanner from "@/components/HomeTopBanner";
import ReadinessCard from "@/components/ReadinessCard";



/** Bosh sahifa uchun FAQPage sxemasi (ilgari index.html da edi). */
const HOME_FAQ_LD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "Haydovchilik guvohnomasi olish uchun qanday tayyorlanish kerak?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "AvtoSmart platformasida YHQ testlarini yechish, yo'l belgilarini o'rganish va variant testlarini topshirish orqali tayyorlanishingiz mumkin."
      }
    },
    {
      "@type": "Question",
      "name": "YHQ testlarida nechta savol bo'ladi?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Har bir test variantida 20 ta savol mavjud. Imtihondan o'tish uchun kamida 18 ta to'g'ri javob berish kerak."
      }
    },
    {
      "@type": "Question",
      "name": "AvtoSmart bepulmi?",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "Ha, asosiy testlar va yo'l belgilari bepul. Pro obuna qo'shimcha imkoniyatlar beradi."
      }
    }
  ]
} as const;

/**
 * Hero ostidagi ishonch qatori. Faqat TEKSHIRILGAN faktlar:
 *   * bepul bazada 1009 ta savol (`free-*.json`) → "1000+";
 *   * testni boshlash uchun ro'yxatdan o'tish shart emas (TestIshlash);
 *   * sayt telefon va kompyuterda ishlaydi (+ desktop ilova).
 */
const HERO_TRUST_KEYS = ["home.trustFree", "home.trustNoSignup", "home.trustDevices"] as const;

/**
 * Tugma burchagidagi kichik "PRO" belgisi — kimga ochiqligini bildiradi,
 * baqirmaydi. Bosh sahifadagi plitkalar (SectionGrid) belgisi bilan bir xil.
 *
 * `absolute` — ATAYLAB: belgi obuna holati yuklangandan keyin paydo
 * bo'ladi. Tugma ichida tursa, tugma kengayib yonidagini surardi (CLS).
 * Tugmaning o'zida `relative` bo'lishi shart.
 */
function ProTag() {
  return (
    <span className="pointer-events-none absolute -right-2 -top-2 rounded-md border border-amber-300/80 bg-amber-50 px-1.5 py-0.5 text-[10px] font-bold uppercase leading-none tracking-wide text-amber-800 shadow-sm dark:border-amber-400/30 dark:bg-amber-950 dark:text-amber-200">
      PRO
    </span>
  );
}

export default function Home() {
  const { user, profile, isLoading: authLoading } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { isPremium } = useAccessState();

  /**
   * Birinchi renderda saqlangan sessiya bormi — faqat BIR MARTA hisoblanadi
   * (`useState` initsializatori). Keyingi renderlarda localStorage qayta
   * o'qilmaydi, ya'ni qiymat barqaror va maket sakramaydi.
   */
  const [expectsSession] = useState(hasStoredSession);
  const [quickBadges, setQuickBadges] = useState<Record<string, number>>({});

  /**
   * Xato javoblar soni — faqat kirgan foydalanuvchi uchun.
   *
   * Son "Xatolar ustida ishlash" plitkasida ko'rsatiladi: u aynan nechta
   * savolni qayta yechish mumkinligini bildiradi. Saqlangan savollar soni
   * bu yerda kerak emas — u plitka bosh sahifada yo'q.
   */
  useEffect(() => {
    if (!user) {
      setQuickBadges({});
      return;
    }
    let cancelled = false;
    void (async () => {
      const { wrong } = await fetchSectionCounts();
      if (cancelled) return;
      setQuickBadges(wrong > 0 ? { "/xatolar-testi": wrong } : {});
    })();
    return () => { cancelled = true; };
  }, [user]);


  /**
   * Profil panelini ko'rsatamizmi.
   *
   * `user` kelguncha ham (auth hali yuklanayotgan va saqlangan sessiya bor)
   * panel chiziladi — shunda joy oldindan band bo'ladi va ma'lumot kelganda
   * hech narsa surilmaydi.
   *
   * Auth yakunlangach (`authLoading === false`) faqat haqiqiy `user` ga
   * ishonamiz. Ya'ni sessiya eskirgan bo'lsa panel olib tashlanadi — bu kamdan
   * kam holat va baribir hozirgi xatti-harakatdan yomon emas.
   */
  const showProfilePanel = !!user || (authLoading && expectsSession);

  /** Haqiqiy ma'lumot tayyormi (yo'q bo'lsa — o'sha o'lchamdagi kulrang chiziq). */
  const profileReady = !!user;

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
      <HomeTopBanner />
      <SEO
        title={t("home.seoTitle")}
        description={t("home.seoDescription")}
        path="/"
        keywords="avtosmart, avto smart, avtosmart uz, avto test, avtotest 2026, prava test, YHQ testlar, haydovchilik guvohnomasi, yo'l belgilari, avtotestu.uz"
      />

      {/*
        FAQPage sxemasi — ilgari `index.html` da turgan va shu sababli HAR
        BIR sahifaga tarqagan edi. Savollar bosh sahifaga tegishli, shuning
        uchun o'rni shu yer. Boshqa sahifalar o'z FAQ ini o'zi qo'yadi.
      */}
      <Helmet>
        <script type="application/ld+json">{JSON.stringify(HOME_FAQ_LD)}</script>
      </Helmet>

      {/*
        HERO — toza, yorug' fon + siyoh rang (brend: Ink 900 #131A45).

        Ilgari: to'liq ekranli foto, ustida quyuq shaffof "shisha" karta,
        blur va yashil/to'q sariq tugmalar. Chiroyli ko'rinardi, lekin
        o'qilishi og'ir, sahifa sekin (har sahifada 12–21 KB rasm preload)
        va "shablon" taassuroti berardi. Endi:
          * fon — rasm emas, CSS: ingichka katak, tepada ko'rinib pastga
            qarab so'nadi (dark rejimda `--border` tokeni orqali o'zi
            moslashadi);
          * matn chapda, desktopda o'ngda namunaviy savol kartasi;
          * tugmalar — siyoh (asosiy) va oq-chegarali (ikkilamchi),
            `rounded-lg`: aniq tugma, "tabletka" emas.

        h1 matni O'ZGARMADI — "avto test" so'rovi bo'yicha 1-o'rin shu
        sarlavhaga bog'liq (docs: O-SISH-REJASI).
      */}
      <section className="relative overflow-hidden border-b border-border bg-background">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,hsl(var(--border))_1px,transparent_1px),linear-gradient(to_bottom,hsl(var(--border))_1px,transparent_1px)] bg-[size:44px_44px] opacity-60 [mask-image:radial-gradient(ellipse_80%_75%_at_50%_0%,#000_35%,transparent_100%)]"
        />

        <div className="relative mx-auto grid w-full max-w-7xl items-center gap-10 px-4 pb-10 pt-8 sm:pt-12 md:px-6 md:pb-16 md:pt-14 lg:grid-cols-12 lg:gap-12 lg:px-8 lg:pb-20 lg:pt-20">
          <div className="lg:col-span-7">
            <p className="inline-flex items-center gap-2 rounded-md border border-border bg-card px-2.5 py-1 text-xs font-semibold text-muted-foreground shadow-sm sm:text-[13px]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#2563EB]" aria-hidden="true" />
              {t("home.badge")}
            </p>

            <h1 className="mt-4 text-[28px] font-extrabold leading-[1.15] tracking-tight text-brand dark:text-foreground sm:text-4xl lg:text-[44px] lg:leading-[1.1] xl:text-5xl">
              {t("home.heroTitle")}
            </h1>

            <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              {t("home.heroSubtitle")}
            </p>

            {/*
              Tugmalar: asosiy — "Test ishlash" (siyoh), qolganlari oq.
              `asChild` — ilgari `<a>` ichida `<button>` turardi (noto'g'ri
              HTML, klaviaturada ikki marta fokus). Endi havolaning o'zi
              tugma ko'rinishida.

              PRO belgisi — tugma ICHIDA kichik yozuv (ilgari burchakda
              oltin gradient "tabletka" edi): kimga ochiqligini aytadi,
              lekin e'tiborni tortib olmaydi. Qachon ko'rinishi avvalgidek.
            */}
            <div className="mt-7 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
              <Button asChild size="lg" className="relative h-12 gap-2 rounded-lg px-6 text-base font-semibold shadow-sm">
                <Link to="/test-ishlash">
                  <Play className="h-4 w-4 shrink-0 fill-current" aria-hidden="true" />
                  <span>{t("home.btnTest")}</span>
                  {user && isPremium && <ProTag />}
                </Link>
              </Button>

              <Button
                asChild
                size="lg"
                variant="outline"
                className="relative h-12 gap-2 rounded-lg border-foreground/15 bg-card px-6 text-base font-semibold text-foreground hover:bg-muted hover:text-foreground"
              >
                <Link to="/variant">
                  <LayoutGrid className="h-4 w-4 shrink-0" aria-hidden="true" />
                  <span>{t("home.btnVariantlar")}</span>
                  {isPremium && <ProTag />}
                </Link>
              </Button>

              {/* Mavzuli testlar — kirgan userlar (mobile + desktop) */}
              {user && (
                <Button
                  asChild
                  size="lg"
                  variant="outline"
                  className="relative h-12 gap-2 rounded-lg border-foreground/15 bg-card px-6 text-base font-semibold text-foreground hover:bg-muted hover:text-foreground"
                >
                  <Link to="/mavzuli">
                    <BookOpen className="h-4 w-4 shrink-0" aria-hidden="true" />
                    <span>{t("home.btnMavzuli")}</span>
                    <ProTag />
                  </Link>
                </Button>
              )}
            </div>

            {/* Ishonch qatori — faqat tekshirilgan faktlar (1009 ta bepul savol, ro'yxatsiz test) */}
            <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
              {HERO_TRUST_KEYS.map((key) => (
                <li key={key} className="flex items-center gap-1.5">
                  <Check className="h-4 w-4 shrink-0 text-[#2563EB] dark:text-[#60A5FA]" strokeWidth={2.5} aria-hidden="true" />
                  {t(key)}
                </li>
              ))}
            </ul>
          </div>

          <div className="hidden lg:col-span-5 lg:block">
            <QuestionPreview />
          </div>
        </div>
      </section>

      {/*
        Tezkor amallar — afzalliklardan YUQORIDA.

        Foydalanuvchi pastga surganda avval o'ziga kerakli amalni ko'radi
        (imtihon, xatolar ustida ishlash, qidiruv), keyin reklama matnini
        o'qiydi. Teskari tartibda foydali havolalar pastga surilib ketardi.
      */}
      <section className="bg-background py-8 md:py-12">
        {/* Hero bilan bir xil kenglik va chekka — chap chiziq sahifa bo'ylab bitta */}
        <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
          <SectionGrid items={QUICK_ITEMS} badges={quickBadges} signedIn={!!user} />
        </div>
      </section>

      {/*
        Tayyorgarlik indikatori — tezkor amallardan (real imtihon va yonidagi
        tugmalar) KEYIN.

        Nega pastda: yuqoridagi uch tugma — foydalanuvchi shu yerga nima uchun
        kelganini bildiradigan HARAKAT. Indikator esa natija/holat, ya'ni
        harakatdan keyin o'qiladi. Mehmonga umuman ko'rsatilmaydi — bosh
        sahifaning SEO maketi o'zgarmaydi.
      */}
      {user && (
        <section className="border-t border-border bg-muted/30 py-8 md:py-10">
          <div className="max-w-4xl mx-auto px-4">
            <ReadinessCard />
          </div>
        </section>
      )}

      {/*
        Platformaning afzalliklari.

        ATAYLAB BO'LIMLARDAN KEYIN: foydalanuvchi avval nima qila olishini
        (bo'limlar) ko'rsin, keyin nega aynan shu saytni tanlashi kerakligini
        o'qisin. Teskari tartibda reklama matni foydali havolalarni pastga
        surib yuborardi.
      */}
      <section className="border-t border-border bg-card py-14 md:py-20 defer-paint">
        <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
          <h2 className="max-w-2xl text-2xl font-bold tracking-tight text-foreground md:text-3xl">
            {t("home.featuresTitle")}
          </h2>

          <div className="mt-8 grid grid-cols-1 gap-4 md:mt-10 md:grid-cols-3 md:gap-6">
            {features.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.titleKey} className="rounded-xl border border-border bg-background p-6">
                  <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-primary/10 text-primary dark:bg-primary/20">
                    <Icon className="h-5 w-5" aria-hidden="true" />
                  </div>
                  <h3 className="mt-4 text-lg font-semibold text-foreground">
                    {t(feature.titleKey)}
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    {t(feature.descKey)}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/*
        Profile Section — kirgan foydalanuvchilar uchun.

        `showProfilePanel` NEGA shunchaki `user` EMAS:
        `user` birinchi renderda doim `null` (sessiya localStorage dan
        o'qilguncha). Ilgari shu sababli butun bo'lim dastlab yo'q bo'lib,
        ~1 soniyadan keyin BIRDAN paydo bo'lardi va pastdagi PRO bo'limi bilan
        footer ni surib yuborardi (CLS 0.187).

        Endi saqlangan sessiya bo'lsa joy BIRINCHI RENDERDAYOQ zahiralanadi va
        ma'lumot kelganda o'sha joyga tushadi — siljish yo'q. Sessiyasi yo'q
        mehmonlar uchun esa hech narsa o'zgarmadi: bo'lim umuman chizilmaydi.
      */}
      {showProfilePanel && (
        <section className="py-10 md:py-12 bg-background border-t border-border defer-paint">
          <div className="max-w-4xl mx-auto px-4">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6 mb-6">
              <Avatar className="h-14 w-14 bg-primary/10 text-primary shrink-0" style={{ aspectRatio: "1" }}>
                <AvatarFallback className="bg-primary/10 text-primary text-lg font-semibold">
                  {profileReady ? getInitials(profile?.full_name || profile?.username) : ""}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                {/*
                  Balandlik ikkala holatda bir xil bo'lishi uchun ism va
                  username qatorlari DOIM chiziladi — yuklanayotganda o'rniga
                  shu o'lchamdagi kulrang chiziq turadi.
                */}
                <h3 className="text-xl font-semibold text-foreground truncate leading-7 min-h-7">
                  {profileReady ? (
                    profile?.full_name || profile?.username || t("nav.user")
                  ) : (
                    <span className="block h-5 w-40 max-w-full rounded bg-muted animate-pulse" aria-hidden="true" />
                  )}
                </h3>
                <p className="text-sm text-muted-foreground truncate leading-5 min-h-5">
                  {profileReady ? (
                    profile?.username ? `@${profile.username}` : ""
                  ) : (
                    <span className="block h-3.5 w-24 max-w-full rounded bg-muted animate-pulse" aria-hidden="true" />
                  )}
                </p>
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

      {/*
        PRO — sahifaning yakuniy chaqirig'i: siyoh (brend) kartasi, oq tugma.
        Ilgari kulrang tasma edi va footer ustida yo'qolib qolardi.
      */}
      {!(user && isPremium) && (
        <section className="border-t border-border bg-background py-12 md:py-16 defer-paint">
          <div className="mx-auto max-w-7xl px-4 md:px-6 lg:px-8">
            <div className="flex flex-col gap-6 rounded-2xl bg-brand px-6 py-8 text-brand-foreground sm:flex-row sm:items-center sm:justify-between md:px-10 md:py-10">
              <div className="max-w-xl">
                <p className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-amber-300">
                  <Crown className="h-4 w-4" aria-hidden="true" />
                  PRO
                </p>
                <h2 className="mt-2 text-2xl font-bold tracking-tight md:text-3xl">
                  {t("home.proSectionTitle")}
                </h2>
                <p className="mt-2 text-sm leading-relaxed text-white/75 md:text-base">
                  {t("home.proSectionDesc")}
                </p>
              </div>
              <Button
                asChild
                size="lg"
                className="h-12 w-full shrink-0 gap-2 rounded-lg bg-white px-6 text-base font-semibold text-[#131A45] hover:bg-white/90 sm:w-auto"
              >
                <Link to="/pro">
                  {t("home.proGetButton")}
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      )}
    </MainLayout>
  );
}
