const fs = require("fs");
const path = require("path");

function O(id, text, ok) {
  return { id, text, is_correct: !!ok };
}

// u143uz: labels A B C + Д on image → unify to Latin A B C D in all langs
const FIX = {
  t_13_q_12: {
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

const byId = new Map();
for (let i = 1; i <= 63; i++) {
  const p = path.join("public/data/variants", `v${i}.json`);
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
    if (!changed.has(q.task_info?.global_id)) continue;
    const src = byId.get(q.task_info.global_id);
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
    q.content = structuredClone(byId.get(q.task_info.global_id).content);
    ch = true;
    mav++;
  }
  if (ch) fs.writeFileSync(fp, JSON.stringify(arr, null, 4) + "\n");
}
console.log("mavzuli", mav);
