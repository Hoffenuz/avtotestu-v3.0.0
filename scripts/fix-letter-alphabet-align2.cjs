/**
 * Finish remaining letter-alphabet alignments after partial auto-map.
 */
const fs = require("fs");
const path = require("path");

function O(id, text, ok) {
  return { id, text, is_correct: !!ok };
}

function mapLatLettersToCyr(text) {
  // Standalone Latin diagram letters → Cyrillic
  return text.replace(/(?<![A-Za-zА-Яа-яЁёӘәҒғҚқҢңӨөҰұҮүҺһІі])([ABCGVSD])(?![A-Za-zА-Яа-яЁёӘәҒғҚқҢңӨөҰұҮүҺһІі])/g, (_, L) => {
    const map = { A: "А", B: "Б", C: "С", G: "Г", V: "В", S: "С", D: "Д" };
    return map[L] || L;
  });
}

const FIX = {
  t_15_q_14: null, // filled from file + remap
  t_17_q_10: null,
  t_19_q_6: null,
  t_44_q_19: null,
  t_48_q_9: null,
  t_53_q_1: null,
  // u143: labels А Б? — use А/Б/В/Г style if Д is really Д keep Д.
  // Vision: А В С Д lookalikes. Unify mixed C/D with Cyrillic А Б for 2nd was wrong.
  // Safer visual lookalike set matching LAT A B C D:
  t_13_q_12: {
    // Keep Latin A B C D everywhere (visual match to А≈A В≈B С≈C Д≈D on image)
    uz_lat: [
      O(1, "Faqat B", 0),
      O(2, "A va B", 0),
      O(3, "Faqat D", 1),
      O(4, "Faqat C", 0),
    ],
    uz_cyr: [
      O(1, "Фақат B", 0),
      O(2, "A ва B", 0),
      O(3, "Фақат D", 1),
      O(4, "Фақат C", 0),
    ],
    ru: [
      O(1, "Только B", 0),
      O(2, "A и B", 0),
      O(3, "Только D", 1),
      O(4, "Только C", 0),
    ],
  },
};

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

for (const id of [
  "t_15_q_14",
  "t_17_q_10",
  "t_19_q_6",
  "t_44_q_19",
  "t_48_q_9",
  "t_53_q_1",
]) {
  const q = byId.get(id);
  // Prefer CYR as canonical letter set; remap LAT from current LAT leftovers
  FIX[id] = {
    uz_lat: q.content.uz_lat.options.map((o) => ({
      ...o,
      text: mapLatLettersToCyr(o.text),
    })),
    uz_cyr: structuredClone(q.content.uz_cyr.options),
    ru: structuredClone(q.content.ru.options),
  };
  // Also ensure LAT matches RU letter tokens for pair options if CYR shorter
  console.log(
    id,
    "LAT→",
    FIX[id].uz_lat.map((o) => (o.is_correct ? "*" : "") + o.text).join(" | ")
  );
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
    console.log("fixed", id);
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
