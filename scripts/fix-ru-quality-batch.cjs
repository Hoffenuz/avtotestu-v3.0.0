/**
 * Hand + pattern fixes for clear RU quality issues.
 * Then sync izoh/content.ru into barcha* + mavzuli2 by global_id.
 */
const fs = require("fs");
const path = require("path");

const VAR = path.join("public/data/variants");
const ROOT = "public";

function loadV(n) {
  return JSON.parse(fs.readFileSync(path.join(VAR, `v${n}.json`), "utf8"));
}
function saveV(n, arr) {
  fs.writeFileSync(
    path.join(VAR, `v${n}.json`),
    JSON.stringify(arr, null, 4) + "\n"
  );
}
function findQ(arr, id) {
  return arr.find((q) => q.task_info.global_id === id);
}

const HAND = {
  t_1_q_10: {
    ru_izoh:
      "В соответствии с пунктом 1 статьи 89 Правил дорожного движения транспортные средства разрешается останавливать и ставить на стоянку на проезжей части в один ряд параллельно краю проезжей части при условии, что это не мешает другим участникам дорожного движения; двухколёсные транспортные средства без бокового прицепа (коляски) допускается ставить в два ряда.",
  },
  t_3_q_7: {
    ru_izoh:
      "Согласно пунктам 1 и 2 статьи 32 главы 7 ПДД: сигналы светофора красного, жёлтого и зелёного цвета в виде стрелки (указателя) имеют то же значение, что и круглые сигналы светофора. Они действуют только в указанном направлении. Стрелка, разрешающая поворот налево, также разрешает разворот, если соответствующий дорожный знак не запрещает разворот. Зелёная стрелка в дополнительной секции имеет то же значение.",
  },
  t_4_q_15: {
    ru_izoh:
      "Линия 1.18 раздела 1 приложения 2 к ПДД указывает разрешённые направления движения по полосам на перекрёстке. Может применяться самостоятельно или совместно со знаками 5.8.1, 5.8.2 «Направление движения по полосам». Изображение тупика означает, что поворот на примыкающую дорогу в этом направлении запрещён. Стрелка, разрешающая поворот налево из крайней левой полосы, также разрешает разворот из этой полосы.",
  },
  t_7_q_2: {
    ru_izoh:
      "В соответствии со знаком 5.23 «Конец населённого пункта» раздела 5 приложения 1 к ПДД обозначает место, с которого требования настоящих Правил о порядке движения в населённых пунктах утрачивают силу.",
  },
  t_19_q_20: {
    ru_izoh:
      "В соответствии с абзацем седьмым статьи 168 главы 28 ПДД велосипедистам и лицам, управляющим средствами индивидуальной мобильности, запрещается: буксировка велосипедов и средств индивидуальной мобильности, а также использование их для буксировки (за исключением буксировки велосипедных прицепов).",
  },
  t_46_q_11: {
    ru_izoh:
      "Согласно абзацу 1 раздела 2 приложения 1 к ПДД: знаки приоритета определяют очерёдность проезда на перекрёстках, пересечениях проезжих частей и на узких участках дороги.",
  },
  t_49_q_17: {
    ru_izoh:
      "Согласно статье 43 главы 7 ПДД водители обязаны руководствоваться сигналами светофора в случаях, когда сигналы светофора противоречат требованиям знаков приоритета.",
  },
  t_54_q_6: {
    ru_izoh:
      "Линия 1.18 раздела 1 приложения 2 к ПДД указывает разрешённые направления движения по полосам на перекрёстке. Может применяться самостоятельно или совместно со знаками 5.8.1, 5.8.2 «Направление движения по полосам». Изображение тупика означает, что поворот на примыкающую дорогу в этом направлении запрещён. Стрелка, разрешающая поворот налево из крайней левой полосы, также разрешает разворот из этой полосы.",
  },
  t_58_q_9: {
    ru_izoh:
      "Согласно абзацу 2 статьи 33 ПДД, в случаях когда сигналы светофора противоречат требованиям знаков приоритета, водители обязаны руководствоваться сигналами светофора.",
  },
  t_6_q_6: {
    ru_izoh:
      "Согласно статье 32 главы 7 ПДД: сигналы светофора красного, жёлтого и зелёного цвета в виде стрелки (указателя) имеют то же значение, что и круглые сигналы. Они действуют только в указанном направлении. Стрелка, разрешающая поворот налево, также разрешает разворот, если соответствующий дорожный знак не запрещает разворот. Зелёная стрелка в дополнительной секции имеет то же значение.",
  },
};

function polishRu(text) {
  if (!text) return text;
  let t = text;
  t = t.replace(/Закон[ае]?\s+о\s+дорожном\s+движении/gi, "ПДД");
  t = t.replace(/знаков\s+концессии/gi, "знаков приоритета");
  t = t.replace(/Знаки\s+концессии/gi, "Знаки приоритета");
  t = t.replace(/знакам\s+концессии/gi, "знакам приоритета");
  t = t.replace(/Зелен[аяыйё]+\s+маршрутизатор/gi, "Зелёная стрелка");
  t = t.replace(/Зелен[аяыйё]+\s+роутер/gi, "Зелёная стрелка");
  t = t.replace(/Маршрутизатор/g, "Указатель (стрелка)");
  t = t.replace(/маршрутизатор/g, "указатель (стрелка)");
  t = t.replace(/парковать\s+и\s+парковать/gi, "останавливать и ставить на стоянку");
  t = t.replace(/обгон[ае]?,?\s+обгон/gi, "обгон, опережение");
  t = t.replace(/высадк\w+\s+или\s+высадк\w+/gi, "посадке или высадке пассажиров");
  t = t.replace(/Приложения\s+1\s+РУ/gi, "приложения 1 к ПДД");
  t = t.replace(/\bРУ\b(?!\w)/g, "ПДД");
  t = t.replace(/Закона\s+на\s+основании/gi, "ПДД");
  t = t.replace(/поворот\s+на\s+проселочную\s+дорогу/gi, "поворот на примыкающую дорогу");
  t = t.replace(/двухколесных\s+транспортных\s+средств\s+без\s+кол[её]с/gi,
    "двухколёсных транспортных средств без бокового прицепа");
  t = t.replace(/запирани[еяю]/gi, "буксировк$&".replace(/буксировкзапирани/, "буксировка").replace(/буксировкзапирания/, "буксировки").replace(/буксировкзапиранию/, "буксировке"));
  // safer zapiranie replacements:
  return t;
}

function polishRuSafe(text) {
  if (!text) return text;
  let t = text;
  t = t.replace(/Закон[ае]?\s+о\s+дорожном\s+движении/gi, "ПДД");
  t = t.replace(/знаков\s+концессии/gi, "знаков приоритета");
  t = t.replace(/Знаки\s+концессии/gi, "Знаки приоритета");
  t = t.replace(/знакам\s+концессии/gi, "знакам приоритета");
  t = t.replace(/требованиям\s+знаков\s+концессии/gi, "требованиям знаков приоритета");
  t = t.replace(/Зелен[аяыйё]+\s+маршрутизатор/gi, "Зелёная стрелка");
  t = t.replace(/Зелен[аяыйё]+\s+роутер/gi, "Зелёная стрелка");
  t = t.replace(/\bМаршрутизатор\b/g, "Указатель (стрелка)");
  t = t.replace(/\bмаршрутизатор\b/g, "указатель (стрелка)");
  t = t.replace(/парковать\s+и\s+парковать/gi, "останавливать и ставить на стоянку");
  t = t.replace(/обгон,\s+обгон/gi, "обгон, опережение");
  t = t.replace(/Приложения\s+1\s+РУ/gi, "приложения 1 к ПДД");
  t = t.replace(/Закона\s+на\s+основании:?/gi, "ПДД:");
  t = t.replace(/поворот\s+на\s+проселочную\s+дорогу/gi, "поворот на примыкающую дорогу");
  t = t.replace(
    /двухколесных\s+транспортных\s+средств\s+без\s+кол[её]с/gi,
    "двухколёсных транспортных средств без бокового прицепа"
  );
  t = t.replace(/Запрещается\s+запирание/gi, "Запрещается буксировка");
  t = t.replace(/при\s+запирании/gi, "при буксировке");
  t = t.replace(/запирания\s+велоприцепов/gi, "буксировки велоприцепов");
  t = t.replace(/запирани[еяю]/gi, (m) => {
    if (m.startsWith("запирани")) return "буксировке".slice(0, m.length); // weak
    return m;
  });
  // final zapiranie sweep
  t = t.replace(/запирание/gi, "буксировка");
  t = t.replace(/запирания/gi, "буксировки");
  t = t.replace(/запирании/gi, "буксировке");
  return t;
}

let handN = 0;
let polishN = 0;
const changedIds = new Set();

for (let i = 1; i <= 63; i++) {
  const p = path.join(VAR, `v${i}.json`);
  if (!fs.existsSync(p)) continue;
  const arr = loadV(i);
  let changed = false;
  for (const q of arr) {
    const id = q.task_info.global_id;
    if (HAND[id]?.ru_izoh) {
      if (q.izoh.ru !== HAND[id].ru_izoh) {
        q.izoh.ru = HAND[id].ru_izoh;
        handN++;
        changed = true;
        changedIds.add(id);
      }
    }
    // polish remaining RU fields
    const before = JSON.stringify([q.izoh?.ru, q.content?.ru]);
    if (q.izoh?.ru) q.izoh.ru = polishRuSafe(q.izoh.ru);
    if (q.content?.ru?.text) q.content.ru.text = polishRuSafe(q.content.ru.text);
    if (q.content?.ru?.options) {
      for (const o of q.content.ru.options) {
        o.text = polishRuSafe(o.text);
      }
    }
    const after = JSON.stringify([q.izoh?.ru, q.content?.ru]);
    if (before !== after) {
      polishN++;
      changed = true;
      changedIds.add(id);
    }
  }
  if (changed) saveV(i, arr);
}

console.log("hand rewrites:", handN);
console.log("polish touches (questions):", polishN);
console.log("unique changed:", changedIds.size);

// Sync to barcha / splits / 600 / mavzuli by global_id
function syncCorpus(file, mode) {
  const fp = path.join(ROOT, file);
  if (!fs.existsSync(fp)) return 0;
  const data = JSON.parse(fs.readFileSync(fp, "utf8"));
  const arr = Array.isArray(data) ? data : null;
  if (!arr) return 0;
  const byId = new Map();
  for (let i = 1; i <= 63; i++) {
    const p = path.join(VAR, `v${i}.json`);
    if (!fs.existsSync(p)) continue;
    for (const q of JSON.parse(fs.readFileSync(p, "utf8"))) {
      byId.set(q.task_info.global_id, q);
    }
  }
  let n = 0;
  for (const q of arr) {
    const src = byId.get(q.task_info?.global_id);
    if (!src || !changedIds.has(src.task_info.global_id)) continue;
    if (mode === "full") {
      q.content = JSON.parse(JSON.stringify(src.content));
      q.izoh = JSON.parse(JSON.stringify(src.izoh));
    } else if (mode === "ru") {
      if (q.content?.ru) q.content.ru = JSON.parse(JSON.stringify(src.content.ru));
      if (q.izoh) q.izoh.ru = src.izoh.ru;
    } else if (mode === "lat") {
      // no ru
    }
    n++;
  }
  if (n) fs.writeFileSync(fp, JSON.stringify(arr, null, 4) + "\n");
  return n;
}

const nB = syncCorpus("barcha.json", "full");
const n600 = syncCorpus("600.json", "full");
const nRu = syncCorpus("barcha-ru.json", "ru");
console.log("synced barcha", nB, "600", n600, "barcha-ru", nRu);

// mavzuli
let mavN = 0;
const byId = new Map();
for (let i = 1; i <= 63; i++) {
  const p = path.join(VAR, `v${i}.json`);
  if (!fs.existsSync(p)) continue;
  for (const q of JSON.parse(fs.readFileSync(p, "utf8"))) {
    byId.set(q.task_info.global_id, q);
  }
}
for (const name of fs.readdirSync(path.join(ROOT, "mavzuli2")).filter((f) => f.endsWith(".json"))) {
  const fp = path.join(ROOT, "mavzuli2", name);
  const arr = JSON.parse(fs.readFileSync(fp, "utf8"));
  let ch = false;
  for (const q of arr) {
    const src = byId.get(q.task_info?.global_id);
    if (!src || !changedIds.has(src.task_info.global_id)) continue;
    q.content.ru = JSON.parse(JSON.stringify(src.content.ru));
    q.izoh.ru = src.izoh.ru;
    ch = true;
    mavN++;
  }
  if (ch) fs.writeFileSync(fp, JSON.stringify(arr, null, 4) + "\n");
}
console.log("synced mavzuli qs", mavN);
