/**
 * Exact match topilmagan savollar uchun:
 * 1) soft-norm (imlo farqlari)
 * 2) variants dagi to'g'ri izohni global_id orqali (faqat variant matni manbaga mos bo'lsa)
 * 3) pastroq fuzzy
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
    .replace(/yo['']nalish/g, "yunalish")
    .replace(/ruxsat/g, "rusat")
    .replace(/ma['']no/g, "marno")
    .replace(/jihat/g, "jixat")
    .replace(/chiziq['']i/g, "chiziqi")
    .replace(/ko['']rsatilgan/g, "kursatilgan")
    .replace(/o['']rnatilgan\s*yuk/g, "ornatilganyuk")
    .replace(/nechinchi/g, "nechanchi")
    .replace(/hisoblanadi/g, "hisoplanadi")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function sim(a, b) {
  const A = new Set(a.split(" ").filter((w) => w.length > 1));
  const B = new Set(b.split(" ").filter((w) => w.length > 1));
  let i = 0;
  for (const w of A) if (B.has(w)) i++;
  return i / Math.max(A.size, B.size, 1);
}

function loadSource() {
  const bySoft = new Map();
  const all = [];
  for (let i = 1; i <= 66; i++) {
    const p = path.join(IZOH_DIR, `v${i}.json`);
    if (!fs.existsSync(p)) continue;
    for (const q of JSON.parse(fs.readFileSync(p, "utf8"))) {
      const text = q.content?.uz_lat?.text || "";
      const izLat = (q.izoh?.uz_lat || "").trim();
      if (!izLat) continue;
      const entry = { uz_lat: izLat, text, soft: softNorm(text), id: q.task_info?.global_id };
      all.push(entry);
      if (entry.soft) bySoft.set(entry.soft, entry);
    }
  }
  return { bySoft, all };
}

function loadRuByLat() {
  const map = new Map();
  const indexPath = path.join(BATCH_DIR, "index.json");
  if (fs.existsSync(indexPath)) {
    const index = JSON.parse(fs.readFileSync(indexPath, "utf8"));
    const byKey = {};
    for (const f of fs.readdirSync(BATCH_DIR).filter((x) => /^out-\d+\.json$/.test(x))) {
      Object.assign(byKey, JSON.parse(fs.readFileSync(path.join(BATCH_DIR, f), "utf8")));
    }
    for (const [k, lat] of Object.entries(index)) {
      const ru = (byKey[k] || "").trim();
      if (ru) map.set(softNorm(lat), ru);
    }
  }
  return map;
}

function loadVariantIzohById() {
  // Only trust variant izoh if that variant question soft-matches source
  const src = loadSource();
  const map = new Map();
  for (let i = 1; i <= 63; i++) {
    const d = JSON.parse(fs.readFileSync(path.join(VARIANTS_DIR, `v${i}.json`), "utf8"));
    for (const q of d) {
      const id = q.task_info?.global_id;
      const soft = softNorm(q.content?.uz_lat?.text || "");
      const hit = src.bySoft.get(soft);
      if (hit && q.izoh?.uz_lat) {
        map.set(id, {
          uz_lat: hit.uz_lat,
          uz_cyr: toCyrillic(hit.uz_lat),
          ru: q.izoh.ru || hit.uz_lat,
        });
      }
    }
  }
  return { map, src };
}

function find(q, src) {
  const soft = softNorm(q.content?.uz_lat?.text || "");
  if (soft && src.bySoft.has(soft)) return src.bySoft.get(soft);
  let best = { s: 0, e: null };
  for (const e of src.all) {
    const s = sim(soft, e.soft);
    if (s > best.s) best = { s, e };
  }
  if (best.s >= 0.72) return best.e;
  return null;
}

function apply(arr, src, ruByLat, byId, stats) {
  let fixed = 0;
  for (const q of arr) {
    const cur = (q.izoh?.uz_lat || "").trim();
    const soft = softNorm(q.content?.uz_lat?.text || "");
    const expected = src.bySoft.get(soft);
    if (expected && softNorm(cur) === softNorm(expected.uz_lat)) continue;

    let entry = find(q, src);
    if (!entry) {
      const id = q.task_info?.global_id;
      if (id && byId.has(id)) {
        q.izoh = byId.get(id);
        fixed++;
        stats.byId++;
        continue;
      }
      stats.stillMiss++;
      continue;
    }
    const ru = ruByLat.get(softNorm(entry.uz_lat)) || q.izoh?.ru || entry.uz_lat;
    q.izoh = { uz_lat: entry.uz_lat, uz_cyr: toCyrillic(entry.uz_lat), ru };
    fixed++;
    stats.soft++;
  }
  return fixed;
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
  const { map: byId, src } = loadVariantIzohById();
  const ruByLat = loadRuByLat();
  const stats = { soft: 0, byId: 0, stillMiss: 0 };

  for (let i = 1; i <= 63; i++) {
    const p = path.join(VARIANTS_DIR, `v${i}.json`);
    const d = JSON.parse(fs.readFileSync(p, "utf8"));
    apply(d, src, ruByLat, byId, stats);
    writeJson(p, d);
  }

  const barcha = JSON.parse(fs.readFileSync(BARCHA_PATH, "utf8"));
  apply(barcha, src, ruByLat, byId, stats);
  writeJson(BARCHA_PATH, barcha);

  for (const f of fs.readdirSync(MAVZULI_DIR).filter((x) => x.endsWith(".json"))) {
    const p = path.join(MAVZULI_DIR, f);
    const d = JSON.parse(fs.readFileSync(p, "utf8"));
    if (!Array.isArray(d)) continue;
    apply(d, src, ruByLat, byId, stats);
    writeJson(p, d);
  }

  splitBarcha(barcha);
  console.log(stats);
}

main();
