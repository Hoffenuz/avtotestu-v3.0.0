/**
 * Unique izohlarni uz→ru (batch) tarjima qiladi va barcha JSON larni yangilaydi.
 * node scripts/translate-izoh-ru.cjs
 */

const fs = require("fs");
const path = require("path");
const { translate } = require("google-translate-api-x");
const { toCyrillic } = require("./uz-translit.cjs");

const ROOT = path.join(__dirname, "..");
const CACHE = path.join(__dirname, "izoh-ru-cache.json");
const VARIANTS_DIR = path.join(ROOT, "public", "data", "variants");
const MAVZULI_DIR = path.join(ROOT, "public", "mavzuli2");
const BATCH = 8;
const CONCURRENCY = 3;

function loadCache() {
  if (!fs.existsSync(CACHE)) return {};
  try {
    return JSON.parse(fs.readFileSync(CACHE, "utf8"));
  } catch {
    return {};
  }
}

function saveCache(c) {
  fs.writeFileSync(CACHE, JSON.stringify(c), "utf8");
}

function writeJson(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 4) + "\n", "utf8");
}

async function translateBatch(texts) {
  const res = await translate(texts, {
    from: "uz",
    to: "ru",
    forceBatch: true,
  });
  if (Array.isArray(res)) {
    return res.map((r) => (r?.text || "").trim());
  }
  return [(res?.text || "").trim()];
}

async function mapPool(items, limit, worker) {
  let i = 0;
  const results = new Array(items.length);
  async function run() {
    while (i < items.length) {
      const idx = i++;
      results[idx] = await worker(items[idx], idx);
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, () => run()));
  return results;
}

async function main() {
  const cache = loadCache();
  const unique = new Set();

  for (let i = 1; i <= 63; i++) {
    const d = JSON.parse(fs.readFileSync(path.join(VARIANTS_DIR, `v${i}.json`), "utf8"));
    for (const q of d) {
      const lat = q.izoh?.uz_lat?.trim();
      if (lat) unique.add(lat);
    }
  }

  const pending = [...unique].filter((lat) => !cache[lat] || cache[lat] === lat);
  console.log("Unique:", unique.size, "| cached:", unique.size - pending.length, "| pending:", pending.length);

  const batches = [];
  for (let i = 0; i < pending.length; i += BATCH) {
    batches.push(pending.slice(i, i + BATCH));
  }

  let done = unique.size - pending.length;
  let fail = 0;

  await mapPool(batches, CONCURRENCY, async (batch) => {
    try {
      const translated = await translateBatch(batch);
      for (let j = 0; j < batch.length; j++) {
        if (translated[j]) {
          cache[batch[j]] = translated[j];
          done++;
        } else {
          fail++;
        }
      }
    } catch (e) {
      // fallback: one-by-one
      for (const text of batch) {
        try {
          const r = await translate(text, { from: "uz", to: "ru", forceBatch: false });
          const t = (r?.text || "").trim();
          if (t) {
            cache[text] = t;
            done++;
          } else fail++;
        } catch {
          fail++;
        }
        await new Promise((r) => setTimeout(r, 120));
      }
    }
    if (done % 40 < BATCH) {
      saveCache(cache);
      console.log(`progress ${done}/${unique.size} fail=${fail}`);
    }
  });

  saveCache(cache);
  console.log("Tarjima tugadi. cache=", Object.keys(cache).length, "fail=", fail);

  function applyArr(arr) {
    for (const q of arr) {
      const lat = q.izoh?.uz_lat?.trim();
      if (!lat) continue;
      q.izoh = {
        uz_lat: lat,
        uz_cyr: q.izoh.uz_cyr || toCyrillic(lat),
        ru: cache[lat] || q.izoh.ru || lat,
      };
    }
  }

  for (let i = 1; i <= 63; i++) {
    const p = path.join(VARIANTS_DIR, `v${i}.json`);
    const d = JSON.parse(fs.readFileSync(p, "utf8"));
    applyArr(d);
    writeJson(p, d);
  }

  const barchaPath = path.join(ROOT, "public", "barcha.json");
  const barcha = JSON.parse(fs.readFileSync(barchaPath, "utf8"));
  applyArr(barcha);
  writeJson(barchaPath, barcha);

  for (const f of fs.readdirSync(MAVZULI_DIR).filter((x) => x.endsWith(".json"))) {
    const p = path.join(MAVZULI_DIR, f);
    const d = JSON.parse(fs.readFileSync(p, "utf8"));
    if (!Array.isArray(d)) continue;
    applyArr(d);
    writeJson(p, d);
  }

  const make = (langKey) =>
    barcha.map((q) => {
      const lang = q.content?.[langKey] || q.content?.uz_lat;
      return {
        task_info: q.task_info,
        media_url: q.media_url || "",
        content: {
          [langKey]: {
            text: lang?.text || "",
            options: lang?.options || [],
          },
        },
        izoh: { [langKey]: q.izoh?.[langKey] || q.izoh?.uz_lat || "" },
      };
    });

  writeJson(path.join(ROOT, "public", "barcha-uz-lat.json"), make("uz_lat"));
  writeJson(path.join(ROOT, "public", "barcha-uz-cyr.json"), make("uz_cyr"));
  writeJson(path.join(ROOT, "public", "barcha-ru.json"), make("ru"));

  const sample = barcha.find((q) => q.izoh?.ru && q.izoh.ru !== q.izoh.uz_lat)?.izoh || barcha[0].izoh;
  console.log("SAMPLE lat:", sample.uz_lat?.slice(0, 90));
  console.log("SAMPLE cyr:", sample.uz_cyr?.slice(0, 90));
  console.log("SAMPLE ru :", sample.ru?.slice(0, 90));
  console.log("OK");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
