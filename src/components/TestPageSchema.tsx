import { Helmet } from "react-helmet-async";

const BASE_URL = "https://www.avtotestu.uz";

export function TestPageSchema() {
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    name: "AvtoSmart — YHQ onlayn test",
    url: `${BASE_URL}/test-ishlash`,
    applicationCategory: "EducationalApplication",
    operatingSystem: "Web browser",
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "UZS",
    },
    description:
      "20 yoki 50 ta tasodifiy YHQ savoli, haqiqiy imtihon formatida. Ro'yxatsiz bepul boshlang; PRO'da 1275 ta savol va izohlar.",
    inLanguage: ["uz", "ru"],
    provider: {
      "@type": "Organization",
      name: "AvtoSmart",
      url: BASE_URL,
    },
  };

  const faqLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: "Test ishlash bepulmi?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "Ha, 1009 ta bepul savol ichidan 20 ta tasodifiy savol bilan test ishlay olasiz, ro'yxatdan o'tish shart emas. To'liq baza (1275 ta savol) va izohlar PRO obunada.",
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
