/**
 * Bir xil savol matni + turli izohlar: media_url bo'yicha aniq bog'lash.
 * node scripts/fix-izoh-by-media.cjs
 */
const fs = require("fs");
const path = require("path");
const { toCyrillic } = require("./uz-translit.cjs");

const ROOT = path.join(__dirname, "..");
const IZOH_DIR = path.join("C:", "Users", "Vosster PC", "Desktop", "projects", "izohlar", "variants");
const VARIANTS_DIR = path.join(ROOT, "public", "data", "variants");
const MAVZULI_DIR = path.join(ROOT, "public", "mavzuli2");
const BARCHA_PATH = path.join(ROOT, "public", "barcha.json");
const BATCH_DIR = path.join(__dirname, "ru-batches");
const APOS = /[\u2018\u2019\u02BB\u02BC'\u00AB\u00BB\u201C\u201D]/g;

function writeJson(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 4) + "\n", "utf8");
}

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
  const bySoft = new Map(); // soft -> entry[] (duplicates)
  for (let i = 1; i <= 66; i++) {
    const p = path.join(IZOH_DIR, `v${i}.json`);
    if (!fs.existsSync(p)) continue;
    for (const q of JSON.parse(fs.readFileSync(p, "utf8"))) {
      const text = q.content?.uz_lat?.text || "";
      const izLat = (q.izoh?.uz_lat || "").trim();
      if (!izLat) continue;
      const entry = {
        uz_lat: izLat,
        text,
        soft: softNorm(text),
        media: mediaKey(q.media_url),
        id: q.task_info?.global_id,
      };
      if (entry.media) byMedia.set(entry.media, entry);
      if (entry.soft) {
        if (!bySoft.has(entry.soft)) bySoft.set(entry.soft, []);
        bySoft.get(entry.soft).push(entry);
      }
    }
  }
  return { byMedia, bySoft };
}

function loadRu() {
  const map = new Map();
  const indexPath = path.join(BATCH_DIR, "index.json");
  if (!fs.existsSync(indexPath)) return map;
  const index = JSON.parse(fs.readFileSync(indexPath, "utf8"));
  const byKey = {};
  for (const f of fs.readdirSync(BATCH_DIR).filter((x) => /^out-\d+\.json$/.test(x))) {
    Object.assign(byKey, JSON.parse(fs.readFileSync(path.join(BATCH_DIR, f), "utf8")));
  }
  for (const [k, lat] of Object.entries(index)) {
    const ru = (byKey[k] || "").trim();
    if (ru) map.set(softNorm(lat), ru);
  }
  return map;
}

function pick(q, src) {
  const mk = mediaKey(q.media_url);
  if (mk && src.byMedia.has(mk)) return src.byMedia.get(mk);

  const soft = softNorm(q.content?.uz_lat?.text || "");
  const list = src.bySoft.get(soft) || [];
  if (list.length === 1) return list[0];
  if (list.length > 1 && mk) {
    const hit = list.find((e) => e.media === mk);
    if (hit) return hit;
  }
  // if duplicates and no media — don't guess
  if (list.length > 1) return null;
  return list[0] || null;
}

function apply(arr, src, ruMap) {
  let n = 0;
  for (const q of arr) {
    const entry = pick(q, src);
    if (!entry) continue;
    const prev = softNorm(q.izoh?.uz_lat || "");
    const next = softNorm(entry.uz_lat);
    if (prev === next) continue;
    const ru = ruMap.get(softNorm(entry.uz_lat)) || q.izoh?.ru || entry.uz_lat;
    q.izoh = { uz_lat: entry.uz_lat, uz_cyr: toCyrillic(entry.uz_lat), ru };
    n++;
  }
  return n;
}

function splitBarcha(barcha) {
  const make = (langKey) =>
    barcha.map((q) => {
      const lang = q.content?.[langKey] || q.content?.uz_lat;
      return {
        task_info: q.task_info,
        media_url: q.media_url || "",
        content: { [langKey]: { text: lang?.text || "", options: lang?.options || [] } },
        izoh: { [langKey]: q.izoh?.[langKey] || q.izoh?.uz_lat || "" },
      };
    });
  writeJson(path.join(ROOT, "public/barcha-uz-lat.json"), make("uz_lat"));
  writeJson(path.join(ROOT, "public/barcha-uz-cyr.json"), make("uz_cyr"));
  writeJson(path.join(ROOT, "public/barcha-ru.json"), make("ru"));
}

function main() {
  const src = loadSource();
  const ruMap = loadRu();
  let total = 0;
  for (let i = 1; i <= 63; i++) {
    const p = path.join(VARIANTS_DIR, `v${i}.json`);
    const d = JSON.parse(fs.readFileSync(p, "utf8"));
    total += apply(d, src, ruMap);
    writeJson(p, d);
  }
  const barcha = JSON.parse(fs.readFileSync(BARCHA_PATH, "utf8"));
  total += apply(barcha, src, ruMap);
  writeJson(BARCHA_PATH, barcha);
  for (const f of fs.readdirSync(MAVZULI_DIR).filter((x) => x.endsWith(".json"))) {
    const p = path.join(MAVZULI_DIR, f);
    const d = JSON.parse(fs.readFileSync(p, "utf8"));
    if (!Array.isArray(d)) continue;
    total += apply(d, src, ruMap);
    writeJson(p, d);
  }
  splitBarcha(barcha);
  console.log("media-fixed:", total);
}

main();
