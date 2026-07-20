/**
 * Fix verified letter mismatches per user (2026-07-20):
 * - t_28_q_8: A va V → A va C
 * - t_14_q_9: S/A/V → A/B/C, correct = C
 * - t_46_q_8: V→B, S→C, A va S→A va C, correct = B
 * - t_57_q_5: S/V → B/C, correct = C
 * - t_54_q_9: unify Latin A/B in all langs
 * Sync variants → barcha* / 600 / mavzuli2
 */
const fs = require("fs");
const path = require("path");

const VAR = path.join("public", "data", "variants");
const IDS = new Set([
  "t_28_q_8",
  "t_14_q_9",
  "t_46_q_8",
  "t_57_q_5",
  "t_54_q_9",
]);

function O(id, text, is_correct) {
  return { id, text, is_correct: !!is_correct };
}

const FIX = {
  t_28_q_8: {
    // keep correct = Faqat A (id 3)
    uz_lat: [
      O(1, "Hammasi", false),
      O(2, "A va C", false),
      O(3, "Faqat A", true),
    ],
    uz_cyr: [
      O(1, "Хаммаси", false),
      O(2, "A ва C", false),
      O(3, "Фақат A", true),
    ],
    ru: [
      O(1, "Все", false),
      O(2, "A и C", false),
      O(3, "Только A", true),
    ],
  },
  t_14_q_9: {
    uz_lat: [O(1, "A", false), O(2, "B", false), O(3, "C", true)],
    uz_cyr: [O(1, "A", false), O(2, "B", false), O(3, "C", true)],
    ru: [O(1, "A", false), O(2, "B", false), O(3, "C", true)],
  },
  t_46_q_8: {
    uz_lat: [
      O(1, "A", false),
      O(2, "B", true),
      O(3, "A va C", false),
      O(4, "C", false),
    ],
    uz_cyr: [
      O(1, "A", false),
      O(2, "B", true),
      O(3, "A ва C", false),
      O(4, "C", false),
    ],
    ru: [
      O(1, "A", false),
      O(2, "B", true),
      O(3, "A и C", false),
      O(4, "C", false),
    ],
  },
  t_57_q_5: {
    uz_lat: [O(1, "A", false), O(2, "B", false), O(3, "C", true)],
    uz_cyr: [O(1, "A", false), O(2, "B", false), O(3, "C", true)],
    ru: [O(1, "A", false), O(2, "B", false), O(3, "C", true)],
  },
  t_54_q_9: {
    // image Latin A/B; correct = A va B
    uz_lat: [
      O(1, "B", false),
      O(2, "A", false),
      O(3, "A va B", true),
    ],
    uz_cyr: [
      O(1, "B", false),
      O(2, "A", false),
      O(3, "A ва B", true),
    ],
    ru: [
      O(1, "B", false),
      O(2, "A", false),
      O(3, "A и B", true),
    ],
  },
};

const changed = new Set();

for (let i = 1; i <= 63; i++) {
  const p = path.join(VAR, `v${i}.json`);
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
    console.log("fixed", id, "in v" + i);
  }
  if (ch) fs.writeFileSync(p, JSON.stringify(arr, null, 4) + "\n");
}

const byId = new Map();
for (let i = 1; i <= 63; i++) {
  const p = path.join(VAR, `v${i}.json`);
  if (!fs.existsSync(p)) continue;
  for (const q of JSON.parse(fs.readFileSync(p, "utf8"))) {
    byId.set(q.task_info.global_id, q);
  }
}

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
    if (mode === "full") {
      q.content = structuredClone(src.content);
    } else if (mode === "lat") {
      q.content.uz_lat = structuredClone(src.content.uz_lat);
    } else if (mode === "cyr") {
      q.content.uz_cyr = structuredClone(src.content.uz_cyr);
    } else if (mode === "ru") {
      q.content.ru = structuredClone(src.content.ru);
    }
    n++;
  }
  if (n) fs.writeFileSync(fp, JSON.stringify(arr, null, 4) + "\n");
  return n;
}

console.log("barcha", syncFile("barcha.json", "full"));
console.log("600", syncFile("600.json", "full"));
console.log("barcha-uz-lat", syncFile("barcha-uz-lat.json", "lat"));
console.log("barcha-uz-cyr", syncFile("barcha-uz-cyr.json", "cyr"));
console.log("barcha-ru", syncFile("barcha-ru.json", "ru"));

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

// verify
for (const id of IDS) {
  const q = byId.get(id);
  const L = q.content.uz_lat.options;
  const R = q.content.ru.options;
  console.log(
    id,
    "LAT",
    L.map((o) => (o.is_correct ? "*" : "") + o.text).join(" | "),
    "|| RU",
    R.map((o) => (o.is_correct ? "*" : "") + o.text).join(" | ")
  );
}
