/**
 * Izohlarni manbadan SAVOL MATNI bo'yicha qayta bog'laydi
 * (global_id bo'yicha emas — mavzuli/variant ID lar farq qilishi mumkin).
 *
 * node scripts/rematch-izoh-by-text.cjs
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

function norm(s) {
  return (s || "")
    .replace(APOS, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function sim(a, b) {
  const A = new Set(a.split(" ").filter((w) => w.length > 1));
  const B = new Set(b.split(" ").filter((w) => w.length > 1));
  let i = 0;
  for (const w of A) if (B.has(w)) i++;
  return i / Math.max(A.size, B.size, 1);
}

function loadSource() {
  const byText = new Map();
  const byMedia = new Map(); // media -> entries[]
  const all = [];
  for (let i = 1; i <= 66; i++) {
    const p = path.join(IZOH_DIR, `v${i}.json`);
    if (!fs.existsSync(p)) continue;
    for (const q of JSON.parse(fs.readFileSync(p, "utf8"))) {
      const text = q.content?.uz_lat?.text || "";
      const izLat = (q.izoh?.uz_lat || "").trim();
      if (!izLat) continue;
      const media = path.basename(String(q.media_url || "")).toLowerCase().replace(/\.(webp|png|jpg|jpeg)$/i, "");
      const entry = {
        uz_lat: izLat,
        text,
        nt: norm(text),
        media,
        id: q.task_info?.global_id,
      };
      all.push(entry);
      if (entry.nt) byText.set(entry.nt, entry);
      if (media) {
        if (!byMedia.has(media)) byMedia.set(media, []);
        byMedia.get(media).push(entry);
      }
    }
  }
  return { byText, byMedia, all };
}

function loadRuByLat() {
  const map = new Map(); // norm(uz_lat) -> ru

  // from batches
  const indexPath = path.join(BATCH_DIR, "index.json");
  if (fs.existsSync(indexPath)) {
    const index = JSON.parse(fs.readFileSync(indexPath, "utf8"));
    const byKey = {};
    for (const f of fs.readdirSync(BATCH_DIR).filter((x) => /^out-\d+\.json$/.test(x))) {
      Object.assign(byKey, JSON.parse(fs.readFileSync(path.join(BATCH_DIR, f), "utf8")));
    }
    for (const [k, lat] of Object.entries(index)) {
      const ru = (byKey[k] || "").trim();
      if (ru) map.set(norm(lat), ru);
    }
  }

  // from existing site files (prefer existing ru for same lat)
  const harvest = (arr) => {
    for (const q of arr) {
      const lat = (q.izoh?.uz_lat || "").trim();
      const ru = (q.izoh?.ru || "").trim();
      if (lat && ru && norm(ru) !== norm(lat)) map.set(norm(lat), ru);
    }
  };
  for (let i = 1; i <= 63; i++) {
    harvest(JSON.parse(fs.readFileSync(path.join(VARIANTS_DIR, `v${i}.json`), "utf8")));
  }
  harvest(JSON.parse(fs.readFileSync(BARCHA_PATH, "utf8")));

  return map;
}

function findEntry(q, src) {
  const text = q.content?.uz_lat?.text || "";
  const nt = norm(text);
  if (nt && src.byText.has(nt)) return { entry: src.byText.get(nt), how: "exact" };

  const media = path
    .basename(String(q.media_url || ""))
    .toLowerCase()
    .replace(/\.(webp|png|jpg|jpeg)$/i, "");
  if (media && src.byMedia.has(media)) {
    const list = src.byMedia.get(media);
    if (list.length === 1) return { entry: list[0], how: "media-unique" };
    // pick best text among same media
    let best = { s: 0, e: null };
    for (const e of list) {
      const s = sim(nt, e.nt);
      if (s > best.s) best = { s, e };
    }
    if (best.s >= 0.55 && best.e) return { entry: best.e, how: `media-sim:${best.s.toFixed(2)}` };
  }

  // fuzzy text
  let best = { s: 0, e: null };
  for (const e of src.all) {
    const s = sim(nt, e.nt);
    if (s > best.s) best = { s, e };
  }
  if (best.s >= 0.82) return { entry: best.e, how: `fuzzy:${best.s.toFixed(2)}` };
  return { entry: null, how: "none" };
}

function makeIzoh(entry, ruByLat, prev) {
  const uz_lat = entry.uz_lat;
  const uz_cyr = toCyrillic(uz_lat);
  let ru = ruByLat.get(norm(uz_lat)) || "";
  if (!ru && prev?.uz_lat && norm(prev.uz_lat) === norm(uz_lat) && prev.ru) ru = prev.ru;
  if (!ru) ru = uz_lat; // fallback
  return { uz_lat, uz_cyr, ru };
}

function applyArr(arr, src, ruByLat, stats, label) {
  let changed = 0;
  for (const q of arr) {
    const { entry, how } = findEntry(q, src);
    stats.how[how] = (stats.how[how] || 0) + 1;
    if (!entry) {
      stats.miss.push({ label, id: q.task_info?.global_id, text: (q.content?.uz_lat?.text || "").slice(0, 70) });
      continue;
    }
    const next = makeIzoh(entry, ruByLat, q.izoh);
    const prevLat = (q.izoh?.uz_lat || "").trim();
    if (norm(prevLat) !== norm(next.uz_lat) || !q.izoh?.uz_cyr || !q.izoh?.ru) {
      changed++;
    }
    q.izoh = next;
    stats.ok++;
  }
  return changed;
}

function splitBarcha(barcha) {
  const make = (langKey) =>
    barcha.map((q) => {
      const lang = q.content?.[langKey] || q.content?.uz_lat;
      return {
        task_info: q.task_info,
        media_url: q.media_url || "",
        content: {
          [langKey]: { text: lang?.text || "", options: lang?.options || [] },
        },
        izoh: { [langKey]: q.izoh?.[langKey] || q.izoh?.uz_lat || "" },
      };
    });
  writeJson(path.join(ROOT, "public/barcha-uz-lat.json"), make("uz_lat"));
  writeJson(path.join(ROOT, "public/barcha-uz-cyr.json"), make("uz_cyr"));
  writeJson(path.join(ROOT, "public/barcha-ru.json"), make("ru"));
}

function main() {
  console.log("Manba yuklanmoqda...");
  const src = loadSource();
  console.log("source texts:", src.byText.size, "all:", src.all.length);

  console.log("RU xarita...");
  const ruByLat = loadRuByLat();
  console.log("ru keys:", ruByLat.size);

  const stats = { ok: 0, how: {}, miss: [] };

  let vCh = 0;
  for (let i = 1; i <= 63; i++) {
    const p = path.join(VARIANTS_DIR, `v${i}.json`);
    const d = JSON.parse(fs.readFileSync(p, "utf8"));
    vCh += applyArr(d, src, ruByLat, stats, `v${i}`);
    writeJson(p, d);
  }
  console.log("variants changed:", vCh);

  const barcha = JSON.parse(fs.readFileSync(BARCHA_PATH, "utf8"));
  const bCh = applyArr(barcha, src, ruByLat, stats, "barcha");
  writeJson(BARCHA_PATH, barcha);
  console.log("barcha changed:", bCh);

  let mCh = 0;
  for (const f of fs.readdirSync(MAVZULI_DIR).filter((x) => x.endsWith(".json"))) {
    const p = path.join(MAVZULI_DIR, f);
    const d = JSON.parse(fs.readFileSync(p, "utf8"));
    if (!Array.isArray(d)) continue;
    mCh += applyArr(d, src, ruByLat, stats, f);
    writeJson(p, d);
  }
  console.log("mavzuli changed:", mCh);

  splitBarcha(barcha);

  console.log("\nMatch how:", stats.how);
  console.log("Matched ok:", stats.ok, "miss:", stats.miss.length);
  if (stats.miss.length) {
    console.log("Miss samples:");
    for (const m of stats.miss.slice(0, 20)) console.log(JSON.stringify(m));
  }
  console.log("\n✅ Rematch tugadi");
}

main();
