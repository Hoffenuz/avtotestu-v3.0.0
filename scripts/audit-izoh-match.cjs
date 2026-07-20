/**
 * Manba izohlar vs sayt — media + soft-norm matn bo'yicha.
 * node scripts/audit-izoh-match.cjs
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const IZOH_DIR = path.join("C:", "Users", "Vosster PC", "Desktop", "projects", "izohlar", "variants");
const APOS = /[\u2018\u2019\u02BB\u02BC'\u00AB\u00BB\u201C\u201D]/g;

function softNorm(s) {
  return (s || "")
    .replace(APOS, "")
    .replace(/[«»""„]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
    .replace(/yetarli/g, "etarli")
    .replace(/xavfsiz/g, "havfsiz")
    .replace(/nechinchi/g, "nechanchi")
    .replace(/yo['']nalish/g, "yunalish")
    .replace(/ruxsat/g, "rusat")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function mediaKey(m) {
  return path
    .basename(String(m || ""))
    .toLowerCase()
    .replace(/\.(webp|png|jpg|jpeg)$/i, "");
}

function loadSource() {
  const byMedia = new Map();
  const bySoft = new Map();
  let n = 0;
  for (let i = 1; i <= 66; i++) {
    const p = path.join(IZOH_DIR, `v${i}.json`);
    if (!fs.existsSync(p)) continue;
    for (const q of JSON.parse(fs.readFileSync(p, "utf8"))) {
      const text = q.content?.uz_lat?.text || "";
      const iz = (q.izoh?.uz_lat || "").trim();
      if (!iz) continue;
      n++;
      const entry = { izoh: iz, text, soft: softNorm(text), media: mediaKey(q.media_url), id: q.task_info?.global_id };
      if (entry.media) byMedia.set(entry.media, entry);
      if (entry.soft) {
        if (!bySoft.has(entry.soft)) bySoft.set(entry.soft, []);
        bySoft.get(entry.soft).push(entry);
      }
    }
  }
  return { byMedia, bySoft, n };
}

function expected(q, src) {
  const mk = mediaKey(q.media_url);
  if (mk && src.byMedia.has(mk)) return src.byMedia.get(mk);
  const soft = softNorm(q.content?.uz_lat?.text || "");
  const list = src.bySoft.get(soft) || [];
  if (list.length === 1) return list[0];
  if (list.length > 1) return { ambiguous: true, list };
  return null;
}

function checkArr(label, arr, src) {
  let ok = 0,
    wrong = 0,
    missing = 0,
    ambiguous = 0;
  const samples = [];
  for (const q of arr) {
    const hit = expected(q, src);
    const cur = (q.izoh?.uz_lat || "").trim();
    if (!hit) {
      missing++;
      if (samples.length < 6)
        samples.push({ type: "no-source", id: q.task_info?.global_id, text: (q.content?.uz_lat?.text || "").slice(0, 70) });
      continue;
    }
    if (hit.ambiguous) {
      // agar cur list ichidagi birortasiga mos — ok
      if (hit.list.some((e) => softNorm(e.izoh) === softNorm(cur))) ok++;
      else {
        ambiguous++;
        if (samples.length < 8)
          samples.push({ type: "ambiguous-wrong", id: q.task_info?.global_id, media: mediaKey(q.media_url), cur: cur.slice(0, 40) });
      }
      continue;
    }
    if (softNorm(cur) === softNorm(hit.izoh)) ok++;
    else {
      wrong++;
      if (samples.length < 8)
        samples.push({
          type: "wrong",
          id: q.task_info?.global_id,
          media: mediaKey(q.media_url),
          cur: cur.slice(0, 45),
          expect: hit.izoh.slice(0, 45),
        });
    }
  }
  console.log(`\n=== ${label} ===`);
  console.log({ total: arr.length, ok, wrong, ambiguousWrong: ambiguous, missingSource: missing });
  for (const s of samples) console.log(JSON.stringify(s));
}

const src = loadSource();
console.log("source izoh entries", src.n);

const variants = [];
for (let i = 1; i <= 63; i++) {
  variants.push(...JSON.parse(fs.readFileSync(path.join(ROOT, "public/data/variants", `v${i}.json`), "utf8")));
}
checkArr("variants", variants, src);
checkArr("barcha", JSON.parse(fs.readFileSync(path.join(ROOT, "public/barcha.json"), "utf8")), src);

let mavzuli = [];
for (const f of fs.readdirSync(path.join(ROOT, "public/mavzuli2")).filter((x) => x.endsWith(".json"))) {
  const d = JSON.parse(fs.readFileSync(path.join(ROOT, "public/mavzuli2", f), "utf8"));
  if (Array.isArray(d)) mavzuli = mavzuli.concat(d);
}
checkArr("mavzuli2", mavzuli, src);
