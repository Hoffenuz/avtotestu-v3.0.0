/**
 * 1) Izohlarni (izohlar/variants) sayt variants/mavzuli/barcha ga birlashtiradi
 * 2) uz_cyr = lotin→kirill translit; ru = avtomatik tarjima (cache bilan)
 * 3) barcha.json ni 3 til fayliga bo'ladi
 *
 * Ishga tushirish: node scripts/merge-izoh-and-split-barcha.cjs
 * Faqat merge (tarjimasiz, ru=lat vaqtinchalik): SKIP_RU=1 node scripts/merge-izoh-and-split-barcha.cjs
 */

const fs = require("fs");
const path = require("path");
const { toCyrillic } = require("./uz-translit.cjs");

const ROOT = path.join(__dirname, "..");
const IZOH_DIR = path.join(
  "C:",
  "Users",
  "Vosster PC",
  "Desktop",
  "projects",
  "izohlar",
  "variants"
);
const VARIANTS_DIR = path.join(ROOT, "public", "data", "variants");
const MAVZULI_DIR = path.join(ROOT, "public", "mavzuli2");
const BARCHA_PATH = path.join(ROOT, "public", "barcha.json");
const RU_CACHE_PATH = path.join(__dirname, "izoh-ru-cache.json");

const SKIP_RU = process.env.SKIP_RU === "1";
const APOS = /[\u2018\u2019\u02BB\u02BC'\u00AB\u00BB\u201C\u201D]/g;

function norm(s) {
  return (s || "")
    .replace(APOS, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function sim(a, b) {
  const A = new Set(a.split(" ").filter(Boolean));
  const B = new Set(b.split(" ").filter(Boolean));
  let i = 0;
  for (const w of A) if (B.has(w)) i++;
  return i / Math.max(A.size, B.size, 1);
}

function loadIzohIndex() {
  const byText = new Map();
  const byMatchedFrom = new Map();
  const all = [];

  for (let i = 1; i <= 66; i++) {
    const p = path.join(IZOH_DIR, `v${i}.json`);
    if (!fs.existsSync(p)) continue;
    const d = JSON.parse(fs.readFileSync(p, "utf8"));
    for (const q of d) {
      const lat = q.content?.uz_lat?.text || "";
      const izLat = (q.izoh?.uz_lat || "").trim();
      if (!izLat) continue;
      const entry = {
        uz_lat: izLat,
        id: q.task_info?.global_id,
        mf: q.task_info?.matched_from,
        text: lat,
      };
      all.push(entry);
      if (lat) byText.set(norm(lat), entry);
      if (entry.mf) byMatchedFrom.set(entry.mf, entry);
    }
  }
  return { byText, byMatchedFrom, all };
}

function findIzoh(q, index) {
  const id = q.task_info?.global_id;
  const nt = norm(q.content?.uz_lat?.text || "");
  if (nt && index.byText.has(nt)) return index.byText.get(nt);
  if (id && index.byMatchedFrom.has(id)) return index.byMatchedFrom.get(id);
  let best = { s: 0, e: null };
  for (const e of index.all) {
    const s = sim(nt, norm(e.text));
    if (s > best.s) best = { s, e };
  }
  if (best.s >= 0.78) return best.e;
  return null;
}

function loadRuCache() {
  if (!fs.existsSync(RU_CACHE_PATH)) return {};
  try {
    return JSON.parse(fs.readFileSync(RU_CACHE_PATH, "utf8"));
  } catch {
    return {};
  }
}

function saveRuCache(cache) {
  fs.writeFileSync(RU_CACHE_PATH, JSON.stringify(cache, null, 0), "utf8");
}

async function translateToRu(text, cache) {
  const key = text;
  if (cache[key]) return cache[key];

  // MyMemory free API (kuniga cheklov bor; cache bilan qayta ishlash mumkin)
  const url =
    "https://api.mymemory.translated.net/get?q=" +
    encodeURIComponent(text.slice(0, 450)) +
    "&langpair=uz|ru";

  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const data = await res.json();
  const translated = (data?.responseData?.translatedText || "").trim();
  if (!translated || /MYMEMORY WARNING/i.test(translated)) {
    throw new Error(translated || "empty translation");
  }
  // agar matn kesilgan bo'lsa — to'liq matnni qo'lda yaxshiroq saqlash uchun
  // qisqa bo'lsa ham cache qilamiz
  cache[key] = text.length > 450 ? translated + "…" : translated;
  return cache[key];
}

async function buildIzohMap(index) {
  const cache = loadRuCache();
  const map = new Map(); // global_id -> {uz_lat, uz_cyr, ru}
  let matched = 0;
  let missing = 0;
  let ruOk = 0;
  let ruFail = 0;

  const uniqueLat = new Map(); // uz_lat -> ids[]

  for (let i = 1; i <= 63; i++) {
    const p = path.join(VARIANTS_DIR, `v${i}.json`);
    const d = JSON.parse(fs.readFileSync(p, "utf8"));
    for (const q of d) {
      const id = q.task_info.global_id;
      const found = findIzoh(q, index);
      if (!found) {
        missing++;
        console.warn("IZOH YO'Q:", id);
        continue;
      }
      matched++;
      if (!uniqueLat.has(found.uz_lat)) uniqueLat.set(found.uz_lat, []);
      uniqueLat.get(found.uz_lat).push(id);
    }
  }

  console.log(`Moslash: ${matched}, yo'q: ${missing}, unique izoh: ${uniqueLat.size}`);

  const latList = [...uniqueLat.keys()];
  for (let i = 0; i < latList.length; i++) {
    const lat = latList[i];
    const cyr = toCyrillic(lat);
    let ru = cache[lat] || "";

    if (!SKIP_RU && !ru) {
      try {
        ru = await translateToRu(lat, cache);
        ruOk++;
        if (ruOk % 25 === 0) {
          saveRuCache(cache);
          console.log(`  ru tarjima: ${ruOk}/${latList.length}`);
        }
        await new Promise((r) => setTimeout(r, 350));
      } catch (e) {
        ruFail++;
        ru = ""; // keyinroq to'ldiriladi
        if (ruFail <= 5) console.warn("  ru xato:", e.message);
        await new Promise((r) => setTimeout(r, 800));
      }
    }

    if (!ru) ru = lat; // fallback: lotin (UI bo'sh qolmasin)

    for (const id of uniqueLat.get(lat)) {
      map.set(id, { uz_lat: lat, uz_cyr: cyr, ru });
    }
  }

  saveRuCache(cache);
  console.log(`RU: ok=${ruOk}, fail/fallback=${ruFail}, cache=${Object.keys(cache).length}`);
  return map;
}

function attachIzohToArray(arr, izohMap) {
  let n = 0;
  for (const q of arr) {
    const id = q.task_info?.global_id;
    const iz = id && izohMap.get(id);
    if (iz) {
      q.izoh = { uz_lat: iz.uz_lat, uz_cyr: iz.uz_cyr, ru: iz.ru };
      n++;
    }
  }
  return n;
}

function writeJson(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 4) + "\n", "utf8");
}

function splitBarcha(barcha) {
  const make = (langKey) =>
    barcha.map((q) => {
      const lang = q.content?.[langKey] || q.content?.uz_lat;
      const izohText = q.izoh?.[langKey] || q.izoh?.uz_lat || "";
      return {
        task_info: q.task_info,
        media_url: q.media_url || "",
        content: {
          [langKey]: {
            text: lang?.text || "",
            options: lang?.options || [],
          },
        },
        izoh: {
          [langKey]: izohText,
        },
      };
    });

  const outLat = path.join(ROOT, "public", "barcha-uz-lat.json");
  const outCyr = path.join(ROOT, "public", "barcha-uz-cyr.json");
  const outRu = path.join(ROOT, "public", "barcha-ru.json");

  writeJson(outLat, make("uz_lat"));
  writeJson(outCyr, make("uz_cyr"));
  writeJson(outRu, make("ru"));

  console.log("Yozildi:", outLat, outCyr, outRu);
}

async function main() {
  if (!fs.existsSync(IZOH_DIR)) {
    console.error("Izohlar papkasi topilmadi:", IZOH_DIR);
    process.exit(1);
  }

  console.log("Izoh indeks yuklanmoqda...");
  const index = loadIzohIndex();
  console.log("Izohlar:", index.all.length);

  console.log("Izoh xaritasini yasash (tarjima bilan)...");
  const izohMap = await buildIzohMap(index);

  // Variants
  let vAttached = 0;
  for (let i = 1; i <= 63; i++) {
    const p = path.join(VARIANTS_DIR, `v${i}.json`);
    const d = JSON.parse(fs.readFileSync(p, "utf8"));
    vAttached += attachIzohToArray(d, izohMap);
    writeJson(p, d);
  }
  console.log(`Variants: ${vAttached} ta izoh qo'shildi`);

  // barcha.json
  const barcha = JSON.parse(fs.readFileSync(BARCHA_PATH, "utf8"));
  const bAttached = attachIzohToArray(barcha, izohMap);
  writeJson(BARCHA_PATH, barcha);
  console.log(`barcha.json: ${bAttached} ta izoh`);

  // mavzuli2
  let mAttached = 0;
  for (const f of fs.readdirSync(MAVZULI_DIR).filter((x) => x.endsWith(".json"))) {
    const p = path.join(MAVZULI_DIR, f);
    const d = JSON.parse(fs.readFileSync(p, "utf8"));
    if (!Array.isArray(d)) continue;
    mAttached += attachIzohToArray(d, izohMap);
    writeJson(p, d);
  }
  console.log(`mavzuli2: ${mAttached} ta izoh biriktirildi`);

  splitBarcha(barcha);
  console.log("Tayyor!");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
