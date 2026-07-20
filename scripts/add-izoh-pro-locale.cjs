const fs = require("fs");
const path = require("path");
const DIR = path.join(__dirname, "..", "src", "locales");

const patch = {
  "uz-lat.json": {
    izohProTitle: "Izohlar — faqat PRO da",
    izohProDescription:
      "Savol izohlarini o'qish va to'liq 1250 ta savol bazasini ochish uchun PRO obuna oling.",
    izohProCta: "PRO obuna olish",
    izohProBullet1: "Har bir savolga tushuntirish (izoh)",
    izohProBullet2: "To'liq 1250 ta savol bazasi",
    izohProBullet3: "63 variant va mavzuli testlar",
  },
  "uz.json": {
    izohProTitle: "Изоҳлар — фақат PRO да",
    izohProDescription:
      "Савол изоҳларини ўқиш ва тўлиқ 1250 та савол базасини очиш учун PRO обуна олинг.",
    izohProCta: "PRO обуна олиш",
    izohProBullet1: "Ҳар бир саволга тушунтириш (изоҳ)",
    izohProBullet2: "Тўлиқ 1250 та савол базаси",
    izohProBullet3: "63 вариант ва мавзули тестлар",
  },
  "ru.json": {
    izohProTitle: "Пояснения — только в PRO",
    izohProDescription:
      "Чтобы читать пояснения к вопросам и открыть полную базу из 1250 вопросов, оформите подписку PRO.",
    izohProCta: "Оформить PRO",
    izohProBullet1: "Пояснение к каждому вопросу",
    izohProBullet2: "Полная база из 1250 вопросов",
    izohProBullet3: "63 варианта и тематические тесты",
  },
};

for (const [file, vals] of Object.entries(patch)) {
  const p = path.join(DIR, file);
  const j = JSON.parse(fs.readFileSync(p, "utf8"));
  Object.assign(j.test, vals);
  fs.writeFileSync(p, JSON.stringify(j, null, 2) + "\n");
  console.log(file, j.test.izohProTitle);
}
