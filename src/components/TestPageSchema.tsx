import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";

const BASE_URL = "https://www.avtotestu.uz";

interface ReviewStats {
  count: number;
  avg: number;
}

export function TestPageSchema() {
  const [stats, setStats] = useState<ReviewStats | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase.from("reviews").select("rating");
      if (cancelled || error || !data?.length) return;
      const sum = data.reduce((acc, r) => acc + r.rating, 0);
      setStats({ count: data.length, avg: Math.round((sum / data.length) * 10) / 10 });
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "Avtotestlar — YHQ onlayn test",
    url: `${BASE_URL}/test-ishlash`,
    applicationCategory: "EducationalApplication",
    operatingSystem: "Web browser",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "UZS",
    },
    description:
      "600+ YHQ savolidan 20 yoki 50 ta tasodifiy savol. Haqiqiy imtihon formatida onlayn test — bepul, ro'yxatsiz.",
    inLanguage: ["uz", "ru"],
    provider: {
      "@type": "Organization",
      name: "Avtotestlar.uz",
      url: BASE_URL,
    },
  };

  if (stats && stats.count >= 3) {
    jsonLd.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: stats.avg,
      reviewCount: stats.count,
      bestRating: 5,
      worstRating: 1,
    };
  }

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Test ishlash bepulmi?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Ha, 600+ savoldan 20 ta tasodifiy savol bilan bepul test ishlay olasiz. Ro'yxatdan o'tish shart emas.",
        },
      },
      {
        "@type": "Question",
        name: "Nechta savol va qancha vaqt beriladi?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Standart test 20 ta savol va 25 daqiqa. 50 ta savol rejimi ham mavjud (50 daqiqa).",
        },
      },
      {
        "@type": "Question",
        name: "Imtihondan o'tish uchun nechta to'g'ri javob kerak?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "20 ta savoldan kamida 18 tasi to'g'ri bo'lishi kerak (90%).",
        },
      },
    ],
  };

  return (
    <Helmet>
      <script type="application/ld+json">{JSON.stringify(jsonLd)}</script>
      <script type="application/ld+json">{JSON.stringify(faqLd)}</script>
    </Helmet>
  );
}
