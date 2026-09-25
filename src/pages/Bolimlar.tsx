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
//   * Kenglik `max-w-6xl`, plitkalar 2 ustunda. 3 ustun sinab ko'rilgan:
//     plitka torayib, nom ikki qatorga bo'linar, PRO belgisi matnni siqardi.
//   * Redizayn (2026-09): ixcham `PageIntro` sarlavhasi (Test ishlash,
//     Variantlar, Mavzular bilan bir xil), kompyuter ilovasi — siyoh
//     karta. Asosiy test tugmalari bu yerda YO'Q: sahifa faqat bo'limlar
//     uchun. Katta (32px) sarlavha va keng bo'shliq plitkalarni pastga
//     surardi — endi ular birinchi ekranda.
// ============================================================================

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Download, LayoutGrid, Monitor, WifiOff } from "lucide-react";
import { MainLayout } from "@/components/layout/MainLayout";
import { PageIntro } from "@/components/PageIntro";
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
      <div className="md:min-h-[calc(100vh-60px)]">
        {/* Ikonka — pastki menyudagi "Bo'limlar" bilan bir xil */}
        <PageIntro icon={LayoutGrid} title={t("pages.bolimlarTitle")} subtitle={t("pages.bolimlarSubtitle")} />

        <div className="mx-auto w-full max-w-6xl px-4 py-5 md:px-6 md:py-6">
          <SectionGroupList groups={SECTION_GROUPS} badges={badges} signedIn={signedIn} />

          {/*
            Kompyuter ilovasi — katalogdan KEYIN, SIYOH karta (bosh
            sahifadagi PRO kartasi bilan bir uslub): u bo'lim emas,
            yuklab olinadigan mahsulot — plitkalar orasida yo'qolmasin.
            Siyoh fonda asosiy tugma oq (sayt qoidasi).
          */}
          <Link
            to="/desktop"
            className="group mt-10 flex flex-col gap-4 rounded-2xl bg-brand px-5 py-6 text-brand-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 sm:flex-row sm:items-center sm:gap-5 sm:px-8 sm:py-7 md:mt-12"
          >
            <span
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-white/10 text-white"
              aria-hidden="true"
            >
              <Monitor className="h-6 w-6" />
            </span>

            <span className="min-w-0 flex-1">
              <span className="block text-lg font-bold tracking-tight">{t("pages.desktopCardTitle")}</span>
              <span className="mt-1 block text-sm leading-snug text-white/75">{t("pages.desktopCardDesc")}</span>
              <span className="mt-2 flex items-center gap-1.5 text-xs text-white/60">
                <WifiOff className="h-3.5 w-3.5" aria-hidden="true" />
                Windows 10/11
              </span>
            </span>

            <span className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-lg bg-white px-5 text-sm font-semibold text-[#131A45] transition-colors group-hover:bg-white/90">
              <Download className="h-4 w-4" aria-hidden="true" />
              {t("pages.desktopCardCta")}
            </span>
          </Link>
        </div>
      </div>
    </MainLayout>
  );
}
