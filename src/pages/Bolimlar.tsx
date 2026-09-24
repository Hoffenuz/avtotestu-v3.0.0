// ============================================================================
// Bolimlar — saytdagi barcha amallarning yagona katalogi
// ----------------------------------------------------------------------------
// DIZAYN QARORLARI:
//   * GURUH SARLAVHALARI BOR. Ilgari yo'q edi va bu to'g'ri qaror edi:
//     ro'yxatda 8 ta plitka bo'lib, uni uchga bo'lish har bo'lakda 2-3
//     tadan qoldirardi. Endi header to'rtta bandga qisqarib, test rejimlari
//     ham shu yerga ko'chdi — 13 ta plitka yassi holda "devor" bo'lib
//     ko'rinadi. Shu sababli guruhlash endi foyda beradi, zarar emas.
//   * Kompyuter ilovasi PLITKA EMAS, alohida kengroq kartochka. U bo'lim
//     emas — yuklab olinadigan mahsulot. 13 ta bir xil plitka orasida
//     turganda u ko'zdan butunlay yo'qolardi.
//   * Kenglik `max-w-5xl` bilan cheklangan: keng monitorda plitkalar
//     chetlarga tarqalib ketsa, ko'z bir plitkadan ikkinchisiga uzoq yo'l
//     bosadi.
// ============================================================================

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronRight, Download, Monitor, WifiOff } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { SEO } from "@/components/SEO";
import { SectionGroupList } from "@/components/SectionGrid";
import { useAuth } from "@/contexts/AuthContext";
import { SECTION_GROUPS } from "@/lib/siteSections";
import { fetchSectionCounts } from "@/lib/questionState";

export default function Bolimlar() {
  const { t } = useLanguage();
  const { user } = useAuth();
  const signedIn = !!user;
  const [badges, setBadges] = useState<Record<string, number>>({});

  useEffect(() => {
    if (!user) {
      setBadges({});
      return;
    }
    let cancelled = false;

    void (async () => {
      const { wrong, saved } = await fetchSectionCounts();
      if (cancelled) return;
      // Nol qiymatlar yozilmaydi — SectionGrid `0` ni ko'rsatmaydi,
      // lekin obyektni ham keraksiz to'ldirmaymiz.
      const next: Record<string, number> = {};
      if (wrong > 0) next["/xatolarim"] = wrong;
      if (saved > 0) next["/saqlangan"] = saved;
      setBadges(next);
    })();

    return () => {
      cancelled = true;
    };
  }, [user]);

  return (
    <MainLayout>
      <SEO
        title={t("seo.bolimlar.title")}
        description={t("seo.bolimlar.description")}
        path="/bolimlar"
        keywords={t("seo.bolimlar.keywords")}
      />

      {/*
        Balandlik: kontent kalta bo'lganda footer ekran o'rtasida osilib
        qolardi. `min-h` uni kamida ekran pastiga suradi (60px — header).
      */}
      <div className="mx-auto w-full max-w-5xl px-4 py-6 md:min-h-[calc(100vh-60px)] md:px-6 md:py-10">
        <header className="mb-6 md:mb-8">
          <h1 className="text-lg font-semibold text-foreground md:text-2xl">
            {t("pages.bolimlarTitle")}
          </h1>
          <p className="mt-1 text-sm text-muted-foreground md:text-[15px]">
            {t("pages.bolimlarSubtitle")}
          </p>
        </header>

        <SectionGroupList groups={SECTION_GROUPS} badges={badges} signedIn={signedIn} />

        {/*
          Kompyuter ilovasi — katalogdan KEYIN, alohida ko'rinishda.

          Header'dagi "Qo'shimcha" menyusi olib tashlangach, ilovaga yagona
          doimiy yo'l footer bo'lib qolardi va u amalda ko'rinmas edi. Bu
          yerda u boshqa plitkalarga o'xshamaydigan, kengroq kartochka —
          ya'ni ro'yxat ichida yo'qolmaydi.
        */}
        <Link
          to="/desktop"
          className="group mt-7 flex items-center gap-4 rounded-xl border border-border bg-card px-4 py-4 transition-[border-color,box-shadow] hover:border-foreground/20 hover:shadow-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:px-5 sm:py-5 md:mt-9"
        >
          <span
            className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary dark:bg-primary/20 sm:h-12 sm:w-12"
            aria-hidden="true"
          >
            <Monitor className="h-5 w-5 sm:h-6 sm:w-6" />
          </span>

          <span className="min-w-0 flex-1">
            <span className="block text-[15px] font-semibold text-foreground sm:text-base">
              {t("pages.desktopCardTitle")}
            </span>
            <span className="mt-0.5 block text-xs leading-snug text-muted-foreground sm:text-[13px]">
              {t("pages.desktopCardDesc")}
            </span>
            <span className="mt-1.5 flex items-center gap-1 text-[11px] text-muted-foreground/80">
              <WifiOff className="h-3 w-3" aria-hidden="true" />
              Windows 10/11
            </span>
          </span>

          <span className="hidden shrink-0 items-center gap-1.5 rounded-lg bg-primary px-3.5 py-2 text-sm font-semibold text-primary-foreground sm:flex">
            <Download className="h-4 w-4" aria-hidden="true" />
            {t("pages.desktopCardCta")}
          </span>

          <ChevronRight
            className="h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 sm:hidden"
            aria-hidden="true"
          />
        </Link>
      </div>
    </MainLayout>
  );
}
