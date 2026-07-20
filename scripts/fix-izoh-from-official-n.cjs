/**
 * Fix izoh only (never touch is_correct / question/option texts).
 * Source of truth for LAT izoh when uniquely matched:
 *   C:/Users/Vosster PC/Desktop/projects/maktabavto-v3.0.0/public/data/n1..n63
 * RU: legal-name cleanup + known phrase fixes; translate from LAT when replacing wrong izoh.
 */
const fs = require("fs");
const path = require("path");
const { toCyrillic } = require("./uz-translit.cjs");

const NROOT =
  "C:/Users/Vosster PC/Desktop/projects/maktabavto-v3.0.0/public/data";
const VROOT = path.join(__dirname, "..", "public", "data", "variants");

function soft(s) {
  return String(s || "")
    .toLowerCase()
    .normalize("NFKC")
    .replace(/[\u2018\u2019\u02BB\u02BC'`]/g, "")
    .replace(/mototsikl/g, "motosikl")
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Build official index: unique soft → entry; multi soft discarded for auto-pull */
function buildOfficial() {
  const buckets = new Map();
  for (let i = 1; i <= 63; i++) {
    const n = JSON.parse(fs.readFileSync(path.join(NROOT, `n${i}.json`), "utf8"));
    for (const q of n.data.questions) {
      const text = (q.body.find((b) => b.type === 1) || {}).value || "";
      const s = soft(text);
      if (!s) continue;
      if (!buckets.has(s)) buckets.set(s, []);
      buckets.get(s).push({
        ticket: i,
        id: q.id,
        text,
        izoh: (q.answer_description || "").trim(),
      });
    }
  }
  const unique = new Map();
  let multi = 0;
  for (const [k, arr] of buckets) {
    // same id repeats OK if izoh identical
    const izohs = [...new Set(arr.map((a) => soft(a.izoh)))];
    if (arr.length === 1 || (izohs.length === 1 && arr[0].izoh)) {
      unique.set(k, arr[0]);
    } else multi++;
  }
  return { unique, multi, totalKeys: buckets.size };
}

/** Conservative RU from LAT for traffic rules explanations */
function latToRuRough(lat) {
  let s = String(lat || "");
  const reps = [
    [/YHQ/g, "ПДД"],
    [/YHQning/g, "ПДД"],
    [/YHQga/g, "к ПДД"],
    [/Yo‘l harakati qoidalarining/g, "Правил дорожного движения"],
    [/Yo'l harakati qoidalarining/g, "Правил дорожного движения"],
    [/Yo‘l harakati qoidalariga/g, "Правилам дорожного движения"],
    [/asosan/g, "согласно"],
    [/muvofiq/g, "в соответствии с"],
    [/bandiga/g, "пункту"],
    [/bandi/g, "пункт"],
    [/bobi/g, "главы"],
    [/bob\./g, "гл."],
    [/ilovasining/g, "приложения"],
    [/ilovasi/g, "приложение"],
    [/ilova/g, "приложение"],
    [/bo‘limining/g, "раздела"],
    [/bo'limining/g, "раздела"],
    [/bo‘limi/g, "раздел"],
    [/bo'limi/g, "раздел"],
    [/xatboshisiga/g, "абзацу"],
    [/xatboshiga/g, "абзацу"],
    [/xatboshi/g, "абзац"],
  ];
  for (const [re, to] of reps) s = s.replace(re, to);
  return s;
}

function fixRuLegalAndPhrases(ru) {
  let s = String(ru || "");
  const before = s;
  // Note: JS \b does NOT work with Cyrillic — use lookaround / plain replaces.
  const legal = [
    [/Общего закона Украины/g, "ПДД"],
    [/закону Украины/gi, "ПДД"],
    [/Закона Украины/g, "ПДД"],
    [/Закону Украины/g, "ПДД"],
    [/Законе Украины/g, "ПДД"],
    [/Закон Украины/g, "ПДД"],
    [/главы\s+(\d+)\s+УК РФ/g, "главы $1 ПДД"],
    [/главы\s+(\d+)\s+УК(?=[\s.,:;)]|$)/g, "главы $1 ПДД"],
    [/статьи\s+(\d+)\s+главы\s+(\d+)\s+УК(?=[\s.,:;)]|$)/g, "статьи $1 главы $2 ПДД"],
    [/пункт[уа]?\s+(\d+)\s+статьи\s+(\d+)\s+главы\s+(\d+)\s+УК(?=[\s.,:;)]|$)/g, "пункту $1 статьи $2 главы $3 ПДД"],
    [/ГКАП/g, "ПДД"],
    [/ВГК/g, "ПДД"],
    [/ОГКБ/g, "ПДД"],
    [/ЯГК/g, "ПДД"],
    [/МГК/g, "ПДД"],
    [/ГПК/g, "ПДД"],
    [/НПЦ/g, "ПДД"],
    [/КПР/g, "ПДД"],
    [/ИТК/g, "ПДД"],
    [/приложения\s+1\s+Общих правил/gi, "приложения 1 ПДД"],
    [/Приложения\s+1\s+Общих правил/g, "приложения 1 ПДД"],
    [/Общих правил/g, "ПДД"],
    [/Общего регламента/g, "ПДД"],
    [/Конституции/g, "ПДД"],
    [/Конституция/g, "ПДД"],
    [/Национальной администрации безопасности дорожного движения/g, "ПДД"],
    // ГК last (after ГПК/ГКАП/…)
    [/ГК(?=[\s.,:;)/]|$)/g, "ПДД"],
    // Isolated ХК / ТК / ЗП / РУ near appendix refs
    [/Приложени[юяе]\s+1\s+к?\s*ХК/gi, "приложению 1 к ПДД"],
    [/Приложени[юяе]\s+1\s+к?\s*ТК/gi, "приложению 1 к ПДД"],
    [/приложения\s+1\s+ХК/gi, "приложения 1 ПДД"],
    [/приложения\s+1\s+ТК/gi, "приложения 1 ПДД"],
    [/приложения\s+1\s+ЗП/gi, "приложения 1 ПДД"],
  ];
  for (const [re, to] of legal) s = s.replace(re, to);

  // Known bad phrases
  const phrases = [
    [/водяной пруд/gi, "аквапланирование"],
    [/между колесами и тротуаром/gi, "между колесами и покрытием дороги"],
    [/вправо и вправо/g, "прямо и направо"],
    [/Зеленый роутер/g, "Зелёная стрелка"],
    [/зеленый роутер/g, "зелёная стрелка"],
    [/Окончание расчетов/g, "Конец населённого пункта"],
    [/в расчетах настоящих Правил/g, "в населённых пунктах настоящих Правил"],
    [/Движение навстречу/g, "Движение прямо"],
    [/под арестом/g, "буксируемого"],
    [/км\/с/g, "км/ч"],
    [/жилых помещениях/g, "жилой зоне"],
    [/частичного увеличения/g, "частичной погрузки"],
    [/рулевым колесом/g, "рулевым управлением"],
    [/неработающим рулевым управлением/g, "неисправным рулевым управлением"],
    [/права на обгон/g, "права преимущественного проезда"],
    [/Выход на пляж/g, "Выезд на берег"],
    [/Приложение YHQ/g, "Приложение к ПДД"],
    [/\bYHQ\b/g, "ПДД"],
    [
      /крепко держать руль обеими руками, заблокировать колеса автомобиля, поскольку продольное скольжение колес не сокращает тормозной путь/g,
      "крепко держать руль обеими руками, не блокировать колёса автомобиля, поскольку продольное скольжение колёс не сокращает тормозной путь",
    ],
  ];
  for (const [re, to] of phrases) s = s.replace(re, to);

  // Collapse accidental "ПДД ПДД"
  s = s.replace(/ПДД(\s+ПДД)+/g, "ПДД");
  return { text: s, changed: s !== before };
}

/** Manual LAT/RU/CYR izoh overrides for text-proven wrong topics (official empty or unmatched). */
const MANUAL_IZOH = {
  t_5_q_14: {
    uz_lat:
      "Yo‘l harakati qoidalarida 29 bob va 186 band mavjud. Shu sababli to‘g‘ri javob — 29 bob 186 band.",
    ru: "Правила дорожного движения содержат 29 глав и 186 пунктов. Поэтому правильный ответ — 29 глав и 186 пунктов.",
  },
  t_2_q_10: {
    uz_lat:
      "YHQ 11-bobi 79-bandiga asosan, aholi punktlaridan tashqarida yengil avtomobil haydovchisiga soatiga 90 km dan yuqori tezlikda harakatlanish quyidagi hollarda taqiqlanadi: boshqa transport vositasini shatakka olganda; tirkamali yengil avtomobilda; yo‘lda tegishli tezlikni cheklovchi belgilar bo‘lganda. Shu bois to‘g‘ri javob — sanab o‘tilgan barcha hollarda.",
    ru: "Согласно пункту 79 главы 11 ПДД вне населённых пунктов водителю легкового автомобиля запрещается движение со скоростью свыше 90 км/ч в следующих случаях: при буксировке другого транспортного средства; при движении с прицепом; при наличии соответствующих знаков ограничения скорости. Поэтому правильный ответ — во всех перечисленных случаях.",
  },
  t_2_q_18: {
    uz_lat:
      "YHQ 10-bobiga asosan, qatnov qismi yo‘l chiziqlari bilan ajratilgan bo‘lsa, haydovchilar harakatlanishni faqat mos bo‘laklar bo‘yicha amalga oshiradilar (barcha ko‘rsatilgan hollarda bo‘lak tartibiga rioya qilinadi).",
    ru: "Согласно главе 10 ПДД, если проезжая часть разделена дорожной разметкой, водители должны двигаться по соответствующим полосам (во всех указанных случаях соблюдается порядок движения по полосам).",
  },
  t_21_q_4: {
    uz_lat:
      "YHQ 26-bobi (yuk tashish) va taniqlik belgilari talablariga asosan, transport vositasi gabaritlaridan chiqib turgan yuk kunning qorong‘i vaqtida va yetarli ko‘rinmaydigan sharoitda «Katta o‘lchamli yuk» taniqlik belgisi bilan, qo‘shimcha ravishda oldinga oq, orqasiga qizil chiroqlar yoki yorug‘lik qaytargichlar bilan belgilanadi.",
    ru: "Согласно требованиям ПДД к перевозке грузов и опознавательным знакам, груз, выступающий за габариты транспортного средства, в тёмное время суток и в условиях недостаточной видимости обозначается опознавательным знаком «Крупногабаритный груз», а также спереди белыми, сзади красными фонарями или световозвращателями.",
  },
  t_45_q_17: {
    uz_lat:
      "YHQ talablariga asosan, harakatni boshlashdan avval shaharlararo avtobus haydovchilari yo‘lovchilarga halokat (favqulodda) holatida chiqish joylaridan foydalanish tartibi haqida tushuntirish berishlari kerak.",
    ru: "Согласно требованиям ПДД, перед началом движения водители междугородных автобусов должны разъяснить пассажирам порядок пользования аварийными выходами в случае происшествия (чрезвычайной ситуации).",
  },
  t_16_q_20: {
    uz_lat:
      "YHQ 22-bobi 132-bandiga asosan, yo‘nalishli transport vositalari uchun 5.9, 5.10.1–5.10.3 belgilari bilan ajratilgan tasmada boshqa transport vositalarining harakatlanishi va to‘xtashi taqiqlanadi. Yo‘nalishli transport vositalari harakatlanish vaqti tugaganida (tegishli tartibda) boshqa transport vositalariga ruxsat etilishi mumkin.",
    ru: "Согласно статье 132 главы 22 ПДД на полосе, выделенной для маршрутных транспортных средств знаками 5.9, 5.10.1–5.10.3, движение и остановка других транспортных средств запрещены. Когда время движения маршрутных транспортных средств закончилось (в установленном порядке), движение иных транспортных средств может быть разрешено.",
  },
  t_11_q_1: {
    uz_lat:
      "YHQ 29-bobi 176-bandiga asosan, «Yangi haydovchi» (haydovchilik staji 2 yildan kam bo‘lgan haydovchilar boshqarayotgan mexanik transport vositalari) taniqlik belgisi o‘rnatiladi.",
    ru: "Согласно статье 176 главы 29 ПДД опознавательный знак «Начинающий водитель» устанавливается на механических транспортных средствах, которыми управляют водители со стажем менее 2 лет.",
  },
  t_14_q_9: {
    uz_lat:
      "YHQ 1-ilovasi 3-bo‘lim: 3.32 «Xavfli yuk tashiyotgan transport vositasining harakati taqiqlangan» — xavfli yuk tashiyotgan transport vositalarining harakatlanishi taqiqlanishini bildiradi.",
    ru: "Приложение 1 к ПДД, раздел 3: 3.32 «Движение транспортных средств с опасными грузами запрещено» — запрещает движение транспортных средств, перевозящих опасные грузы.",
  },
  t_1_q_9: {
    uz_lat:
      "YHQ 1-ilovasi 3-bo‘lim: 3.7 «Shatakka olish taqiqlangan» — barcha transport vositalarini shatakka olish taqiqlanishini bildiradi. Shu bois kajavali motosiklni shatakka olish taqiqlanadi.",
    ru: "Приложение 1 к ПДД, раздел 3: 3.7 «Буксировка запрещена» — запрещает буксировку всех транспортных средств. Поэтому буксировка мотоцикла с боковым прицепом запрещена.",
  },
  t_9_q_5: {
    uz_lat:
      "YHQ 1-ilovasi: 4.5.3 «Otda yurish yo‘li» — faqat otliqlar harakatlanishi uchun mo‘ljallangan yo‘lni bildiradi.",
    ru: "Приложение 1 к ПДД: 4.5.3 «Дорожка для всадников» — обозначает дорожку, предназначенную только для движения всадников.",
  },
  t_9_q_14: {
    uz_lat:
      "YHQ 7-bobi 38-bandi (tartibga soluvchi ishorasi) yoki savol rasmidagi ruxsat etuvchi belgi bo‘yicha rulda o‘rganuvchi bo‘lgan transport vositasiga o‘ngga, chapga va qayrilishga ruxsat etiladi. 124-band (turar joyda o‘qitish taqiqi) bu savolga tegishli emas.",
    ru: "Согласно пункту 38 главы 7 ПДД (сигнал регулировщика) или разрешающему знаку на рисунке транспортному средству с обучаемым за рулём разрешены поворот направо, налево и разворот. Пункт 124 (запрет обучения в жилой зоне) к этому вопросу не относится.",
  },
  t_7_q_18: {
    uz_lat:
      "YHQ 1-ilovasi 1-bo‘lim: «Temir yo‘l kesishmasiga yaqinlashuv» (1.4.1–1.4.6) temir yo‘l kesishmasiga yaqinlashayotganlik haqida ogohlantiradi. 3.32 «Xavfli yuk…» bu javob emas.",
    ru: "Приложение 1 к ПДД, раздел 1: знак «Приближение к железнодорожному переезду» (1.4.1–1.4.6) предупреждает о приближении к переезду. Знак 3.32 «Опасный груз…» не является ответом на данный вопрос.",
  },
  // Same media as t_3_q_1 (u19uz.webp) — use matching explanation for «barcha yo‘nalish»
  t_1_q_17: {
    uz_lat:
      "YHQ 1-ilovasining 4-bo'limidagi 4.4 belgi - \"Yengil avtomobillar harakatlanadi\" belgisi yengil avtomobillarni, avtobuslarni, motosikllarni va to'la vazni 3,5 tonnadan kam bo'lgan yuk avtomobillarining harakatlanishiga ruxsat etadi. 1-ilovaning 7-bo'limidagi 7.3.3 qo'shimcha axborot belgisi \"Ta'sir yo'nalishlari\" chorraha oldida o'rnatilgan buyuruvchi belgi bilan qo'llanilib, uning ta'sir yo'nalishini ko'rsatadi.",
    ru: "Согласно знаку 4.4 «Движение легковых автомобилей» раздела 4 приложения 1 ПДД, разрешается движение легковых автомобилей, автобусов, мотоциклов и грузовых автомобилей с разрешённой максимальной массой менее 3,5 т. Знак дополнительной информации 7.3.3 «Направления действия» применяется с предписывающим знаком перед перекрёстком и указывает направления его действия. Поэтому движение разрешено во всех направлениях.",
  },
};

function setIzoh(q, lat, ru) {
  q.izoh = {
    uz_lat: lat,
    uz_cyr: toCyrillic(lat),
    ru,
  };
}

function main() {
  const { unique, multi } = buildOfficial();
  console.log("Official unique soft keys:", unique.size, "multi skipped:", multi);

  let legalFixed = 0;
  let phraseFixed = 0;
  let pulledOfficial = 0;
  let manualFixed = 0;
  const pullLog = [];
  const manualLog = [];

  for (let i = 1; i <= 63; i++) {
    const fp = path.join(VROOT, `v${i}.json`);
    const arr = JSON.parse(fs.readFileSync(fp, "utf8"));
    let changed = false;

    for (const q of arr) {
      const id = q.task_info.global_id;

      // 1) Manual overrides for proven wrong LAT topics
      if (MANUAL_IZOH[id]) {
        const m = MANUAL_IZOH[id];
        setIzoh(q, m.uz_lat, m.ru);
        manualFixed++;
        manualLog.push(id);
        changed = true;
        continue;
      }

      // 2) Unique official soft match: pull LAT izoh only if local LAT empty
      //    (do NOT overwrite LAT on soft match alone — same text can pair with different media)
      const s = soft(q.content?.uz_lat?.text);
      const off = unique.get(s);
      const locLat = (q.izoh?.uz_lat || "").trim();
      const locRu = (q.izoh?.ru || "").trim();

      if (off && off.izoh && !locLat) {
        const newLat = off.izoh;
        let newRu = locRu || latToRuRough(newLat);
        newRu = fixRuLegalAndPhrases(newRu).text;
        setIzoh(q, newLat, newRu);
        pulledOfficial++;
        pullLog.push(id);
        changed = true;
        continue;
      }

      // 3) Clean RU legal names / known bad phrases only (LAT unchanged; answers untouched)
      if (q.izoh && q.izoh.ru) {
        const { text, changed: ch } = fixRuLegalAndPhrases(q.izoh.ru);
        if (ch) {
          q.izoh.ru = text;
          legalFixed++;
          changed = true;
        }
      }
    }

    if (changed) {
      fs.writeFileSync(fp, JSON.stringify(arr, null, 4) + "\n", "utf8");
    }
  }

  // Verify remaining bad legal (Cyrillic-safe)
  let leftLegal = 0;
  const leftSamples = [];
  const legalRe =
    /ГКАП|ВГК|ОГКБ|ЯГК|МГК|ГПК|НПЦ|Конституци|Общих правил|Украин|УК РФ|ГК(?=[\s.,:;)/]|$)|главы\s+\d+\s+УК(?=[\s.,:;)]|$)/;
  for (let i = 1; i <= 63; i++) {
    for (const q of JSON.parse(
      fs.readFileSync(path.join(VROOT, `v${i}.json`), "utf8")
    )) {
      const ru = q.izoh?.ru || "";
      if (legalRe.test(ru)) {
        leftLegal++;
        if (leftSamples.length < 20)
          leftSamples.push({ id: q.task_info.global_id, ru: ru.slice(0, 140) });
      }
    }
  }

  console.log({
    manualFixed,
    pulledOfficial,
    legalOrPhraseTouched: legalFixed,
    leftLegal,
    manualLog,
    pullLog: pullLog.slice(0, 40),
    pullLogTotal: pullLog.length,
    leftSamples,
  });
}

main();
