/**
 * Fix t_28_q_14 + t_27_q_4, then audit remaining letter flags vs images.
 */
const fs = require("fs");
const path = require("path");
const https = require("https");
const { execSync } = require("child_process");

const VAR = path.join("public", "data", "variants");
const IMG = path.join("scripts", "_img-check");

function O(id, text, ok) {
  return { id, text, is_correct: !!ok };
}

const FIX = {
  t_28_q_14: {
    // image Latin A B C; correct = A (chap chet)
    uz_lat: [
      O(1, "B", false),
      O(2, "Hech qaysi biriga", false),
      O(3, "A", true),
      O(4, "C", false),
    ],
    uz_cyr: [
      O(1, "B", false),
      O(2, "Ҳеч қайси бирига", false),
      O(3, "A", true),
      O(4, "C", false),
    ],
    ru: [
      O(1, "B", false),
      O(2, "Ни одному", false),
      O(3, "A", true),
      O(4, "C", false),
    ],
  },
  t_27_q_4: {
    // image Cyrillic А Б В; correct А va Б (not Latin B)
    uz_lat: [
      O(1, "Barchasi", false),
      O(2, "Faqat «Б»", false),
      O(3, "Faqat «А» va «Б»", true),
      O(4, "Faqat «А»", false),
    ],
    uz_cyr: [
      O(1, "Барчаси", false),
      O(2, "Фақат «Б»", false),
      O(3, "Фақат «А» ва «Б»", true),
      O(4, "Фақат «А»", false),
    ],
    ru: [
      O(1, "Все", false),
      O(2, "Только «Б»", false),
      O(3, "Только «А» и «Б»", true),
      O(4, "Только «А»", false),
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
    console.log("fixed", id);
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
    const src = byId.get(q.task_info.global_id);
    if (!src) continue;
    q.content = structuredClone(src.content);
    ch = true;
    mav++;
  }
  if (ch) fs.writeFileSync(fp, JSON.stringify(arr, null, 4) + "\n");
}
console.log("mavzuli", mav);

// Download remaining medias for audit
const alreadyOkLatinFixed = new Set([
  "u311uz.webp",
  "u317uz.webp",
  "u156uz.webp",
  "u529uz.webp",
  "u656uz.webp",
  "u623uz.webp",
  "u296uz.webp",
]);
const alreadyCyrillicOk = new Set([
  "u7uz.webp",
  "u124uz.webp",
  "u169uz.webp",
  "u170uz.webp",
  "u187uz.webp",
  "u211uz.webp",
  "u506uz.webp",
  "u514uz.webp",
  "u525uz.webp",
  "u550uz.webp",
  "u605uz.webp",
  "u68uz.webp",
]);

const rep = JSON.parse(
  fs.readFileSync("scripts/_letter-mismatch-report.json", "utf8")
);
const need = [
  ...new Set(
    rep
      .map((e) => e.media)
      .filter((m) => m && !alreadyOkLatinFixed.has(m) && !alreadyCyrillicOk.has(m))
  ),
];

fs.mkdirSync(IMG, { recursive: true });
function download(media) {
  return new Promise((resolve) => {
    const out = path.join(IMG, media);
    if (fs.existsSync(out) && fs.statSync(out).size > 1000) return resolve(media);
    const url = `https://www.avtotestu.uz/images/${media}`;
    const file = fs.createWriteStream(out);
    https
      .get(url, (res) => {
        if (res.statusCode !== 200) {
          console.log("FAIL", media, res.statusCode);
          resolve(null);
          return;
        }
        res.pipe(file);
        file.on("finish", () => {
          file.close();
          resolve(media);
        });
      })
      .on("error", () => resolve(null));
  });
}

(async () => {
  console.log("download remaining", need.length);
  for (let i = 0; i < need.length; i += 8) {
    await Promise.all(need.slice(i, i + 8).map(download));
  }
  // convert new webps to png
  execSync(
    `python -c "from PIL import Image; from pathlib import Path; d=Path(r'${IMG.replace(/\\/g, "/")}');
[Image.open(p).convert('RGB').save(p.with_suffix('.png')) for p in d.glob('*.webp') if not p.with_suffix('.png').exists() or p.with_suffix('.png').stat().st_mtime < p.stat().st_mtime]"`,
    { stdio: "inherit" }
  );
  console.log("done downloads; pngs ready for visual check");
  console.log("NEED_CHECK", need.join(","));
})();
