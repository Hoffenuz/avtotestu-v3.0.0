/**
 * Finish all remaining Latin-A/B/C-on-image letter mismatches.
 * Do NOT touch Cyrillic-on-image questions.
 */
const fs = require("fs");
const path = require("path");

function O(id, text, ok) {
  return { id, text, is_correct: !!ok };
}

const FIX = {
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
    // u515uz a b c; correct A va C
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
};

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
    console.log("fixed", id, q.media_url);
  }
  if (ch) fs.writeFileSync(p, JSON.stringify(arr, null, 4) + "\n");
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

function syncFile(rel, mode) {
  const fp = path.join("public", rel);
  if (!fs.existsSync(fp)) return 0;
  const arr = JSON.parse(fs.readFileSync(fp, "utf8"));
  let n = 0;
  for (const q of arr) {
    const id = q.task_info?.global_id;
    if (!changed.has(id)) continue;
    const src = byId.get(id);
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
    const src = byId.get(q.task_info.global_id);
    if (!src) continue;
    q.content = structuredClone(src.content);
    ch = true;
    mav++;
  }
  if (ch) fs.writeFileSync(fp, JSON.stringify(arr, null, 4) + "\n");
}
console.log("mavzuli", mav);
console.log("changed", [...changed].join(", "));
