// ============================================================================
// Bolimlar — barcha bo'limlarga yagona kirish nuqtasi
// ----------------------------------------------------------------------------
// DIZAYN QARORLARI:
//   * Guruh sarlavhalari (SHAXSIY / O'RGANISH / MA'LUMOT) YO'Q — ular to'rni
//     uchga bo'lib yuborardi va har bo'lakda 2-3 tadan plitka qolardi.
//     Uzluksiz to'r ancha tez skanerlanadi.
//   * Kenglik `max-w-4xl` bilan cheklangan va markazlashgan. Ilgari plitkalar
//     butun ekran bo'ylab cho'zilib, keng monitorda chetlarga tarqalib
//     ketardi — ko'z bir plitkadan ikkinchisiga uzoq yo'l bosardi.
//   * Sarlavha kichik: bu ro'yxat sahifasi, reklama sahifasi emas.
// ============================================================================

import { useEffect, useState } from "react";
import { MainLayout } from "@/components/layout/MainLayout";
import { useLanguage } from "@/contexts/LanguageContext";
import { SEO } from "@/components/SEO";
import { SectionGrid } from "@/components/SectionGrid";
import { useAuth } from "@/contexts/AuthContext";
import { SECTION_ITEMS } from "@/lib/siteSections";
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
        title="Bo'limlar — Mavzuli testlar, Yo'l belgilari va Darslik"
        description="Avtotestu.uz barcha bo'limlari bir joyda: mavzuli testlar, 63 variant, yo'l belgilari, darslik va qo'shimcha materiallar."
        path="/bolimlar"
        keywords="bo'limlar, mavzuli testlar, yo'l belgilari, darslik, variantlar"
      />

      {/*
        Balandlik: kontent kalta bo'lganda footer ekran o'rtasida osilib
        qolardi. `min-h` uni kamida ekran pastiga suradi (60px — header).
      */}
      <div className="mx-auto w-full max-w-5xl px-4 py-6 md:min-h-[calc(100vh-60px)] md:px-6 md:py-10">
        <h1 className="mb-5 text-lg font-semibold text-foreground md:mb-7 md:text-2xl">
          {t("pages.bolimlarTitle")}
        </h1>

        <SectionGrid items={SECTION_ITEMS} badges={badges} signedIn={signedIn} showDescription />
      </div>
    </MainLayout>
  );
}
