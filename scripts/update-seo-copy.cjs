const fs = require("fs");
const path = require("path");

const DIR = path.join(__dirname, "..", "src", "locales");

const updates = {
  "uz-lat.json": {
    home: {
      heroTitle: "Avtotestlar — YHQ onlayn testlari",
      badge: "2026 YHQ savollari",
      btnMavzuli: "Mavzular bo'yicha",
      seoTitle: "Avtotestlar.uz — prava / YHQ onlayn test",
      proSectionDesc:
        "To'liq savollar bazasi, qo'shimcha videodarslar va imtihonbop savollar bir joyda.",
    },
    pro: {
      seoTitle: "PRO obuna — barcha savollar",
      heroTitle: "PRO — To'liq savollar bazasi",
      testBannerTitle: "PRO obuna oling",
      seoDescription:
        "Avtotestlar PRO obuna: 1250+ savol, videodarsliklar, 63 ta variant va barcha mavzular.",
    },
  },
  "uz.json": {
    home: {
      heroTitle: "Avtotestlar — ЙҲҚ онлайн тестлари",
      badge: "2026 ЙҲҚ саволлари",
      btnMavzuli: "Мавзулар бўйича",
      seoTitle: "Avtotestlar.uz — права / ЙҲҚ онлайн тест",
      proSectionDesc:
        "Тўлиқ саволлар базаси, қўшимча видеодарслар ва имтиҳонбоп саволлар бир жойда.",
    },
    pro: {
      seoTitle: "PRO обуна — барча саволлар",
      heroTitle: "PRO — Тўлиқ саволлар базаси",
      testBannerTitle: "PRO обуна олинг",
      seoDescription:
        "Avtotestlar PRO обуна: 1250+ савол, видеодарсликлар, 63 та вариант ва барча мавзулар.",
    },
  },
  "ru.json": {
    home: {
      heroTitle: "Avtotestlar — ПДД онлайн тесты",
      badge: "Вопросы ПДД 2026",
      btnMavzuli: "По темам",
      seoTitle: "Avtotestlar.uz — права / ПДД онлайн тест",
      proSectionDesc:
        "Полная база вопросов, дополнительные видеоуроки и экзаменационные задания в одном месте.",
    },
    pro: {
      seoTitle: "PRO подписка — все вопросы",
      heroTitle: "PRO — Полная база вопросов",
      testBannerTitle: "Оформите PRO подписку",
      seoDescription:
        "Подписка Avtotestlar PRO: 1250+ вопросов, видеоуроки, 63 варианта и все темы.",
    },
  },
};

for (const [file, patch] of Object.entries(updates)) {
  const p = path.join(DIR, file);
  const j = JSON.parse(fs.readFileSync(p, "utf8"));
  for (const [section, vals] of Object.entries(patch)) {
    Object.assign(j[section], vals);
  }
  fs.writeFileSync(p, JSON.stringify(j, null, 2) + "\n", "utf8");
  console.log(file);
  console.log(" ", j.home.heroTitle);
  console.log(" ", j.home.badge, "|", j.home.btnMavzuli);
  console.log(" ", j.home.seoTitle);
  console.log(" ", j.pro.seoTitle, "|", j.pro.heroTitle);
}
