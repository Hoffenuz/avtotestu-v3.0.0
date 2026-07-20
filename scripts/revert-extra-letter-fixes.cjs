/**
 * REVERT over-eager letter changes. Keep ONLY the verified whitelist fixes.
 * Whitelist (do not touch): t_28_q_8, t_14_q_9, t_46_q_8, t_57_q_5, t_54_q_9, t_28_q_14
 * (+ t_27_q_4 was earlier; leave as-is)
 */
const fs = require("fs");
const path = require("path");

function O(id, text, ok) {
  return { id, text, is_correct: !!ok };
}

/** Restore to pre-align state (captured dumps before fix-letter-alphabet-align*) */
const REVERT = {
  t_2_q_19: {
    uz_lat: [O(1, "B", 0), O(2, "B va C", 0), O(3, "A", 0), O(4, "C", 1)],
    uz_cyr: [O(1, "B", 0), O(2, "B ва C", 0), O(3, "A", 0), O(4, "C", 1)],
    ru: [O(1, "В", 0), O(2, "В и С", 0), O(3, "А", 0), O(4, "С", 1)],
  },
  t_4_q_1: {
    uz_lat: [
      O(1, "Faqat B", 0),
      O(2, "Barchasi", 0),
      O(3, "Faqat A va C", 0),
      O(4, "Faqat C", 1),
    ],
    uz_cyr: [
      O(1, "Фақат B", 0),
      O(2, "Барчаси", 0),
      O(3, "Фақат А ва C", 0),
      O(4, "Фақат C", 1),
    ],
    ru: [
      O(1, "Только B", 0),
      O(2, "Все направления", 0),
      O(3, "Только A и C", 0),
      O(4, "Только C", 1),
    ],
  },
  t_4_q_11: {
    uz_lat: [
      O(1, "Б va В", 0),
      O(2, "В", 0),
      O(3, "A va В", 0),
      O(4, "Б va Г", 1),
    ],
    uz_cyr: [
      O(1, "Б ва В", 0),
      O(2, "В", 0),
      O(3, "А ва В", 0),
      O(4, "Б ва Г", 1),
    ],
    ru: [
      O(1, "В", 0),
      O(2, "Б и В", 0),
      O(3, "А и В", 0),
      O(4, "Б и Г", 1),
    ],
  },
  t_9_q_19: {
    uz_lat: [O(1, "Xammasi", 0), O(2, "Faqat B", 0), O(3, "A va B", 1)],
    uz_cyr: [O(1, "Хаммаси", 0), O(2, "Фақат B", 0), O(3, "А ва B", 1)],
    ru: [O(1, "Все", 0), O(2, "Только B", 0), O(3, "А и В", 1)],
  },
  t_11_q_16: {
    uz_lat: [
      O(1, "B", 0),
      O(2, "A", 0),
      O(3, "A, B, V", 1),
      O(4, "A va B", 0),
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
  t_13_q_12: {
    uz_lat: [
      O(1, "Faqat B", 0),
      O(2, "A va B", 0),
      O(3, "Faqat D", 1),
      O(4, "Faqat C", 0),
    ],
    uz_cyr: [
      O(1, "Фақат Б", 0),
      O(2, "А ва Б", 0),
      O(3, "Фақат Д", 1),
      O(4, "Фақат C", 0),
    ],
    ru: [
      O(1, "Только B", 0),
      O(2, "А и B", 0),
      O(3, "Только Д", 1),
      O(4, "Только C", 0),
    ],
  },
  t_16_q_6: {
    uz_lat: [O(1, "B", 0), O(2, "A", 0), O(3, "A va B", 1)],
    uz_cyr: [O(1, "B", 0), O(2, "A", 0), O(3, "A ва В", 1)],
    ru: [O(1, "B", 0), O(2, "A", 0), O(3, "А и В", 1)],
  },
  t_20_q_4: {
    uz_lat: [
      O(1, "Faqat A", 0),
      O(2, "Faqat B", 1),
      O(3, "Xammasi", 0),
      O(4, "B va S", 0),
    ],
    uz_cyr: [
      O(1, "Фақат А", 0),
      O(2, "Фақат B", 1),
      O(3, "Хаммаси", 0),
      O(4, "B ва С", 0),
    ],
    ru: [
      O(1, "Только A", 0),
      O(2, "Только B", 1),
      O(3, "Все", 0),
      O(4, "B и C", 0),
    ],
  },
  t_24_q_16: {
    uz_lat: [O(1, "«A»", 1), O(2, "«Б»", 0), O(3, "«В»", 0)],
    uz_cyr: [O(1, "«A»", 1), O(2, "«Б»", 0), O(3, "«В»", 0)],
    ru: [O(1, "«A»", 1), O(2, "«Б»", 0), O(3, "«В»", 0)],
  },
  t_26_q_15: {
    uz_lat: [O(1, "A va B", 0), O(2, "Faqat A i C", 1), O(3, "Faqat C", 0)],
    uz_cyr: [O(1, "А ва Б", 0), O(2, "Фақат А и C", 1), O(3, "Фақат C", 0)],
    ru: [O(1, "a и b", 0), O(2, "Только a и c", 1), O(3, "Только c", 0)],
  },
  t_28_q_11: {
    uz_lat: [O(1, "A", 1), O(2, "A va b", 0), O(3, "B", 0)],
    uz_cyr: [O(1, "А", 1), O(2, "А ва б", 0), O(3, "Б", 0)],
    ru: [O(1, "А", 1), O(2, "Б", 0), O(3, "А и Б", 0)],
  },
  t_38_q_19: {
    uz_lat: [
      O(1, "Har ikki yo'nalishda taqiqlanadi", 0),
      O(2, 'Faqat "A"', 0),
      O(3, 'Faqat "B"', 1),
      O(4, "Har ikki yo'nalishda mumkin", 0),
    ],
    uz_cyr: [
      O(1, "Ҳар икки йўналишда тақиқланади", 0),
      O(2, "Фақат «А»", 0),
      O(3, "Фақат «B»", 1),
      O(4, "Ҳар икки йўналишда мумкин", 0),
    ],
    ru: [
      O(1, "Запрещено в обоих направлениях", 0),
      O(2, "Только «А»", 0),
      O(3, "Только «B»", 1),
      O(4, "Возможно в обоих направлениях", 0),
    ],
  },
  t_44_q_20: {
    uz_lat: [
      O(1, "A va B", 0),
      O(2, "Xammasi", 0),
      O(3, "A va C", 1),
      O(4, "Faqat A", 0),
    ],
    uz_cyr: [
      O(1, "А ва Б", 0),
      O(2, "Хаммаси", 0),
      O(3, "А ва C", 1),
      O(4, "Фақат А", 0),
    ],
    ru: [
      O(1, "А и Б", 0),
      O(2, "Все", 0),
      O(3, "А и С", 1),
      O(4, "Только А", 0),
    ],
  },
  t_46_q_4: {
    uz_lat: [O(1, "C", 0), O(2, "A va D", 0), O(3, "B", 1)],
    uz_cyr: [O(1, "С", 0), O(2, "А ва Д", 0), O(3, "В", 1)],
    ru: [O(1, "С", 0), O(2, "А и D", 0), O(3, "В", 1)],
  },
  t_52_q_3: {
    uz_lat: [O(1, "B va S", 0), O(2, "A va S", 1), O(3, "A va B", 0)],
    uz_cyr: [O(1, "Б ва С", 0), O(2, "А ва С", 1), O(3, "А ва Б", 0)],
    ru: [O(1, "Б и С", 0), O(2, "А и С", 1), O(3, "А ва Б", 0)],
  },
  t_52_q_20: {
    uz_lat: [
      O(1, "A", 0),
      O(2, "Hech qaysida", 1),
      O(3, "Б", 0),
      O(4, "A va Б", 0),
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
    uz_lat: [O(1, "Faqat A", 1), O(2, "A va B", 0), O(3, "Hammasi", 0)],
    uz_cyr: [O(1, "Фақат А", 1), O(2, "А ва Б", 0), O(3, "Ҳаммаси", 0)],
    ru: [O(1, "Только А", 1), O(2, "А и Б", 0), O(3, "Все", 0)],
  },
};

/** LAT-only reverse: Cyrillic diagram letters → Latin (pre auto-map state) */
const LAT_REVERSE_IDS = [
  "t_15_q_14",
  "t_15_q_16",
  "t_17_q_7",
  "t_17_q_10",
  "t_19_q_6",
  "t_44_q_9",
  "t_44_q_19",
  "t_45_q_16",
  "t_48_q_9",
  "t_53_q_1",
];

function mapCyrLettersToLat(text) {
  return text.replace(
    /(?<![A-Za-zА-Яа-яЁёӘәҒғҚқҢңӨөҰұҮүҺһІі])([АБВГДС])(?![A-Za-zА-Яа-яЁёӘәҒғҚқҢңӨөҰұҮүҺһІі])/g,
    (_, L) => {
      const map = { А: "A", Б: "B", В: "V", Г: "G", Д: "D", С: "S" };
      return map[L] || L;
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

// Build LAT reverse restores (CYR/RU already original for these)
for (const id of LAT_REVERSE_IDS) {
  const q = byId.get(id);
  if (!q) {
    console.log("missing", id);
    continue;
  }
  if (id === "t_17_q_7") {
    REVERT[id] = {
      uz_lat: q.content.uz_lat.options.map((o) => ({
        ...o,
        text: o.text.trim() === "А" ? "A" : o.text,
      })),
      uz_cyr: structuredClone(q.content.uz_cyr.options),
      ru: structuredClone(q.content.ru.options),
    };
    continue;
  }
  REVERT[id] = {
    uz_lat: q.content.uz_lat.options.map((o) => ({
      ...o,
      text: mapCyrLettersToLat(o.text),
    })),
    uz_cyr: structuredClone(q.content.uz_cyr.options),
    ru: structuredClone(q.content.ru.options),
  };
  console.log(
    "lat-rev",
    id,
    REVERT[id].uz_lat.map((o) => (o.is_correct ? "*" : "") + o.text).join(" | ")
  );
}

const KEEP = new Set([
  "t_28_q_8",
  "t_14_q_9",
  "t_46_q_8",
  "t_57_q_5",
  "t_54_q_9",
  "t_28_q_14",
  "t_27_q_4",
]);

const changed = new Set();
for (let i = 1; i <= 63; i++) {
  const p = path.join("public/data/variants", `v${i}.json`);
  if (!fs.existsSync(p)) continue;
  const arr = JSON.parse(fs.readFileSync(p, "utf8"));
  let ch = false;
  for (const q of arr) {
    const id = q.task_info.global_id;
    if (!REVERT[id]) continue;
    if (KEEP.has(id)) {
      console.log("SKIP keep", id);
      continue;
    }
    const f = REVERT[id];
    // Preserve option ids from current if lengths match
    for (const L of ["uz_lat", "uz_cyr", "ru"]) {
      const cur = q.content[L].options;
      const next = structuredClone(f[L]);
      if (cur.length === next.length) {
        for (let j = 0; j < next.length; j++) next[j].id = cur[j].id;
      }
      q.content[L].options = next;
    }
    changed.add(id);
    ch = true;
    console.log("reverted", id);
  }
  if (ch) fs.writeFileSync(p, JSON.stringify(arr, null, 4) + "\n");
}

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
console.log("reverted", changed.size, [...changed].sort().join(", "));

// Verify whitelist still correct
console.log("\n=== whitelist check ===");
for (const id of KEEP) {
  const q = byId2.get(id);
  if (!q) {
    console.log("MISSING", id);
    continue;
  }
  console.log(
    id,
    q.media_url || "",
    "|",
    q.content.uz_lat.options.map((o) => (o.is_correct ? "*" : "") + o.text).join(" / ")
  );
}
