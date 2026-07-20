/**
 * Align diagram letter-labels with the alphabet printed on the image.
 * Sync to variants + barcha* + 600 + mavzuli2.
 */
const fs = require("fs");
const path = require("path");

function O(id, text, ok) {
  return { id, text, is_correct: !!ok };
}

/**
 * LATIN_ABC: image uses Latin A/B/C(/D) → all langs Latin letters
 * CYR_ABVG: image uses Cyrillic А/Б/В(/Г) → all langs Cyrillic letters
 */
const FIX = {
  // --- Latin on image ---
  t_2_q_19: {
    // u18uz A B C; correct C
    uz_lat: [O(1, "B", 0), O(2, "B va C", 0), O(3, "A", 0), O(4, "C", 1)],
    uz_cyr: [O(1, "B", 0), O(2, "B ва C", 0), O(3, "A", 0), O(4, "C", 1)],
    ru: [O(1, "B", 0), O(2, "B и C", 0), O(3, "A", 0), O(4, "C", 1)],
  },
  t_4_q_1: {
    // u29uz A B C; correct C
    uz_lat: [
      O(1, "Faqat B", 0),
      O(2, "Barchasi", 0),
      O(3, "Faqat A va C", 0),
      O(4, "Faqat C", 1),
    ],
    uz_cyr: [
      O(1, "Фақат B", 0),
      O(2, "Барчаси", 0),
      O(3, "Фақат A ва C", 0),
      O(4, "Фақат C", 1),
    ],
    ru: [
      O(1, "Только B", 0),
      O(2, "Все направления", 0),
      O(3, "Только A и C", 0),
      O(4, "Только C", 1),
    ],
  },
  t_9_q_19: {
    // u101uz A B C; correct A va B
    uz_lat: [O(1, "Xammasi", 0), O(2, "Faqat B", 0), O(3, "A va B", 1)],
    uz_cyr: [O(1, "Хаммаси", 0), O(2, "Фақат B", 0), O(3, "A ва B", 1)],
    ru: [O(1, "Все", 0), O(2, "Только B", 0), O(3, "A и B", 1)],
  },
  t_20_q_4: {
    // u219uz A B C; correct B; fix S→C
    uz_lat: [
      O(1, "Faqat A", 0),
      O(2, "Faqat B", 1),
      O(3, "Xammasi", 0),
      O(4, "B va C", 0),
    ],
    uz_cyr: [
      O(1, "Фақат A", 0),
      O(2, "Фақат B", 1),
      O(3, "Хаммаси", 0),
      O(4, "B ва C", 0),
    ],
    ru: [
      O(1, "Только A", 0),
      O(2, "Только B", 1),
      O(3, "Все", 0),
      O(4, "B и C", 0),
    ],
  },
  t_26_q_15: {
    // u290uz A B C; correct A i C
    uz_lat: [O(1, "A va B", 0), O(2, "Faqat A i C", 1), O(3, "Faqat C", 0)],
    uz_cyr: [O(1, "A ва B", 0), O(2, "Фақат A и C", 1), O(3, "Фақат C", 0)],
    ru: [O(1, "A и B", 0), O(2, "Только A и C", 1), O(3, "Только C", 0)],
  },
  t_38_q_19: {
    // u440uz Latin A B; correct B
    uz_lat: [
      O(1, "Har ikki yo'nalishda taqiqlanadi", 0),
      O(2, 'Faqat "A"', 0),
      O(3, 'Faqat "B"', 1),
      O(4, "Har ikki yo'nalishda mumkin", 0),
    ],
    uz_cyr: [
      O(1, "Ҳар икки йўналишда тақиқланади", 0),
      O(2, "Фақат «A»", 0),
      O(3, "Фақат «B»", 1),
      O(4, "Ҳар икки йўналишда мумкин", 0),
    ],
    ru: [
      O(1, "Запрещено в обоих направлениях", 0),
      O(2, "Только «A»", 0),
      O(3, "Только «B»", 1),
      O(4, "Возможно в обоих направлениях", 0),
    ],
  },
  t_44_q_20: {
    // u515uz latin a b c; correct A va C
    uz_lat: [
      O(1, "A va B", 0),
      O(2, "Xammasi", 0),
      O(3, "A va C", 1),
      O(4, "Faqat A", 0),
    ],
    uz_cyr: [
      O(1, "A ва B", 0),
      O(2, "Хаммаси", 0),
      O(3, "A ва C", 1),
      O(4, "Фақат A", 0),
    ],
    ru: [
      O(1, "A и B", 0),
      O(2, "Все", 0),
      O(3, "A и C", 1),
      O(4, "Только A", 0),
    ],
  },
  t_46_q_4: {
    // u527uz A B C D; correct B
    uz_lat: [O(1, "C", 0), O(2, "A va D", 0), O(3, "B", 1)],
    uz_cyr: [O(1, "C", 0), O(2, "A ва D", 0), O(3, "B", 1)],
    ru: [O(1, "C", 0), O(2, "A и D", 0), O(3, "B", 1)],
  },
  t_52_q_3: {
    // u591uz A B C; correct A va C; fix S→C
    uz_lat: [O(1, "B va C", 0), O(2, "A va C", 1), O(3, "A va B", 0)],
    uz_cyr: [O(1, "B ва C", 0), O(2, "A ва C", 1), O(3, "A ва B", 0)],
    ru: [O(1, "B и C", 0), O(2, "A и C", 1), O(3, "A и B", 0)],
  },

  // --- Cyrillic on image ---
  t_4_q_11: {
    // u35uz А Б В Г; correct Б va Г
    uz_lat: [
      O(1, "Б va В", 0),
      O(2, "В", 0),
      O(3, "А va В", 0),
      O(4, "Б va Г", 1),
    ],
    uz_cyr: [
      O(1, "Б ва В", 0),
      O(2, "В", 0),
      O(3, "А ва В", 0),
      O(4, "Б ва Г", 1),
    ],
    ru: [
      O(1, "Б и В", 0),
      O(2, "В", 0),
      O(3, "А и В", 0),
      O(4, "Б и Г", 1),
    ],
  },
  t_11_q_16: {
    // u124uz Cyrillic; correct А, Б, В
    uz_lat: [
      O(1, "Б", 0),
      O(2, "А", 0),
      O(3, "А, Б, В", 1),
      O(4, "А va Б", 0),
    ],
    uz_cyr: [
      O(1, "Б", 0),
      O(2, "А", 0),
      O(3, "А, Б, В", 1),
      O(4, "А ва Б", 0),
    ],
    ru: [
      O(1, "Б", 0),
      O(2, "А", 0),
      O(3, "А, Б, В", 1),
      O(4, "А и Б", 0),
    ],
  },
  t_16_q_6: {
    // u176uz А Б; correct А va Б
    uz_lat: [O(1, "Б", 0), O(2, "А", 0), O(3, "А va Б", 1)],
    uz_cyr: [O(1, "Б", 0), O(2, "А", 0), O(3, "А ва Б", 1)],
    ru: [O(1, "Б", 0), O(2, "А", 0), O(3, "А и Б", 1)],
  },
  t_24_q_16: {
    // u267uz А Б В (first was Latin A)
    uz_lat: [O(1, "«А»", 1), O(2, "«Б»", 0), O(3, "«В»", 0)],
    uz_cyr: [O(1, "«А»", 1), O(2, "«Б»", 0), O(3, "«В»", 0)],
    ru: [O(1, "«А»", 1), O(2, "«Б»", 0), O(3, "«В»", 0)],
  },
  t_28_q_11: {
    // u314uz А Б
    uz_lat: [O(1, "А", 1), O(2, "А va б", 0), O(3, "Б", 0)],
    uz_cyr: [O(1, "А", 1), O(2, "А ва б", 0), O(3, "Б", 0)],
    ru: [O(1, "А", 1), O(2, "Б", 0), O(3, "А и Б", 0)],
  },
  t_52_q_20: {
    // u604uz А Б
    uz_lat: [
      O(1, "А", 0),
      O(2, "Hech qaysida", 1),
      O(3, "Б", 0),
      O(4, "А va Б", 0),
    ],
    uz_cyr: [
      O(1, "А", 0),
      O(2, "Ҳеч қайсида", 1),
      O(3, "Б", 0),
      O(4, "А ва Б", 0),
    ],
    ru: [
      O(1, "А", 0),
      O(2, "Ни на одном рисунке", 1),
      O(3, "Б", 0),
      O(4, "А и Б", 0),
    ],
  },
  t_57_q_10: {
    // u658uz А Б В; correct Faqat А
    uz_lat: [O(1, "Faqat А", 1), O(2, "А va Б", 0), O(3, "Hammasi", 0)],
    uz_cyr: [O(1, "Фақат А", 1), O(2, "А ва Б", 0), O(3, "Ҳаммаси", 0)],
    ru: [O(1, "Только А", 1), O(2, "А и Б", 0), O(3, "Все", 0)],
  },
};

// Fill remaining Cyrillic-from-LAT by transforming existing options
const CYR_FROM_LAT_IDS = [
  "t_15_q_14",
  "t_15_q_16",
  "t_17_q_10",
  "t_19_q_6",
  "t_44_q_9",
  "t_44_q_19",
  "t_45_q_16",
  "t_48_q_9",
  "t_53_q_1",
];

function mapLatLettersToCyr(text) {
  // Replace Latin diagram letters with Cyrillic equivalents.
  // Order matters: do multi-char contexts via token replace.
  // V→В, G→Г, S→С, B→Б, A→А, C→С, D→Д
  // Only replace standalone letter tokens.
  return text.replace(
    /(^|[\s«"„'(\[],)([ABCGVSD])(?=[\s»"'“')\],.]|$|va\b|и\b|,|\/)/gu,
    (_, pre, L) => {
      const map = {
        A: "А",
        B: "Б",
        C: "С",
        G: "Г",
        V: "В",
        S: "С",
        D: "Д",
      };
      return pre + (map[L] || L);
    }
  );
}

function loadAll() {
  const byId = new Map();
  for (let i = 1; i <= 63; i++) {
    const p = path.join("public/data/variants", `v${i}.json`);
    if (!fs.existsSync(p)) continue;
    for (const q of JSON.parse(fs.readFileSync(p, "utf8"))) {
      byId.set(q.task_info.global_id, q);
    }
  }
  return byId;
}

const byId = loadAll();

// Auto-build FIX for CYR_FROM_LAT from existing CYR/RU (canonical) + remap LAT
for (const id of CYR_FROM_LAT_IDS) {
  const q = byId.get(id);
  if (!q || FIX[id]) continue;
  FIX[id] = {
    uz_lat: q.content.uz_lat.options.map((o) => ({
      ...o,
      text: mapLatLettersToCyr(o.text),
    })),
    uz_cyr: structuredClone(q.content.uz_cyr.options),
    ru: structuredClone(q.content.ru.options),
  };
}

// t_17_q_7: only change letter option; keep others from file
{
  const q = byId.get("t_17_q_7");
  if (q) {
    FIX.t_17_q_7 = {
      uz_lat: q.content.uz_lat.options.map((o) => ({
        ...o,
        text: o.text.trim() === "A" ? "А" : o.text,
      })),
      uz_cyr: structuredClone(q.content.uz_cyr.options),
      ru: structuredClone(q.content.ru.options),
    };
  }
}

// t_13_q_12 skipped: image labels ambiguous (А/Б/В/Г vs А/В/С/Д) — verify manually

// Ensure t_17_q_7 keeps correct flags from source
{
  const q = byId.get("t_17_q_7");
  if (q) {
    const lat = q.content.uz_lat.options.map((o) => ({
      id: o.id,
      text: o.text.trim() === "A" || o.text.trim() === "А" ? "А" : o.text,
      is_correct: o.is_correct,
    }));
    FIX.t_17_q_7 = {
      uz_lat: lat,
      uz_cyr: structuredClone(q.content.uz_cyr.options),
      ru: structuredClone(q.content.ru.options),
    };
  }
}

const changed = new Set();
for (let i = 1; i <= 63; i++) {
  const p = path.join("public/data/variants", `v${i}.json`);
  if (!fs.existsSync(p)) continue;
  const arr = JSON.parse(fs.readFileSync(p, "utf8"));
  let ch = false;
  for (const q of arr) {
    const id = q.task_info.global_id;
    if (!FIX[id]) continue;
    const f = FIX[id];
    q.content.uz_lat.options = structuredClone(f.uz_lat);
    q.content.uz_cyr.options = structuredClone(f.uz_cyr);
    q.content.ru.options = structuredClone(f.ru);
    changed.add(id);
    ch = true;
    console.log("fixed", id, q.media_url || "");
  }
  if (ch) fs.writeFileSync(p, JSON.stringify(arr, null, 4) + "\n");
}

// reload
const byId2 = loadAll();

function syncFile(rel, mode) {
  const fp = path.join("public", rel);
  if (!fs.existsSync(fp)) return 0;
  const arr = JSON.parse(fs.readFileSync(fp, "utf8"));
  let n = 0;
  for (const q of arr) {
    const id = q.task_info?.global_id;
    if (!changed.has(id)) continue;
    const src = byId2.get(id);
    if (!src) continue;
    if (mode === "full") q.content = structuredClone(src.content);
    else if (mode === "lat") q.content.uz_lat = structuredClone(src.content.uz_lat);
    else if (mode === "cyr") q.content.uz_cyr = structuredClone(src.content.uz_cyr);
    else if (mode === "ru") q.content.ru = structuredClone(src.content.ru);
    n++;
  }
  if (n) fs.writeFileSync(fp, JSON.stringify(arr, null, 4) + "\n");
  return n;
}

console.log("barcha", syncFile("barcha.json", "full"));
console.log("600", syncFile("600.json", "full"));
console.log("lat", syncFile("barcha-uz-lat.json", "lat"));
console.log("cyr", syncFile("barcha-uz-cyr.json", "cyr"));
console.log("ru", syncFile("barcha-ru.json", "ru"));

let mav = 0;
for (const name of fs.readdirSync("public/mavzuli2").filter((f) => f.endsWith(".json"))) {
  const fp = path.join("public/mavzuli2", name);
  const arr = JSON.parse(fs.readFileSync(fp, "utf8"));
  let ch = false;
  for (const q of arr) {
    if (!changed.has(q.task_info?.global_id)) continue;
    const src = byId2.get(q.task_info.global_id);
    if (!src) continue;
    q.content = structuredClone(src.content);
    ch = true;
    mav++;
  }
  if (ch) fs.writeFileSync(fp, JSON.stringify(arr, null, 4) + "\n");
}
console.log("mavzuli", mav);
console.log("changed count", changed.size);
console.log([...changed].sort().join(", "));
