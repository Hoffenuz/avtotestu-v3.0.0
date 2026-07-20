/**
 * scripts/ru-batches/out-*.json larni birlashtirib
 * variants / barcha / mavzuli / split fayllardagi izoh.ru ni yangilaydi.
 *
 * node scripts/merge-ru-batches.cjs
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const DIR = path.join(__dirname, "ru-batches");
const VARIANTS_DIR = path.join(ROOT, "public", "data", "variants");
const MAVZULI_DIR = path.join(ROOT, "public", "mavzuli2");

function writeJson(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 4) + "\n", "utf8");
}

function main() {
  const index = JSON.parse(fs.readFileSync(path.join(DIR, "index.json"), "utf8"));
  const byKey = {};
  const outs = fs
    .readdirSync(DIR)
    .filter((f) => /^out-\d+\.json$/.test(f))
    .sort((a, b) => parseInt(a.match(/\d+/)[0], 10) - parseInt(b.match(/\d+/)[0], 10));

  for (const f of outs) {
    const d = JSON.parse(fs.readFileSync(path.join(DIR, f), "utf8"));
    Object.assign(byKey, d);
    console.log(f, Object.keys(d).length);
  }

  // lat text -> ru
  const byLat = new Map();
  let mapped = 0;
  let missingKeys = 0;
  for (const [key, lat] of Object.entries(index)) {
    const ru = byKey[key];
    if (ru && String(ru).trim()) {
      byLat.set(lat, String(ru).trim());
      mapped++;
    } else {
      missingKeys++;
    }
  }
  console.log(`index: ${Object.keys(index).length}, mapped: ${mapped}, missing keys: ${missingKeys}`);
  console.log(`unique lat texts with RU: ${byLat.size}`);

  function applyArr(arr) {
    let n = 0;
    for (const q of arr) {
      const lat = q.izoh?.uz_lat;
      if (!lat) continue;
      const ru = byLat.get(lat);
      if (ru) {
        q.izoh.ru = ru;
        n++;
      }
    }
    return n;
  }

  let v = 0;
  for (let i = 1; i <= 63; i++) {
    const p = path.join(VARIANTS_DIR, `v${i}.json`);
    const d = JSON.parse(fs.readFileSync(p, "utf8"));
    v += applyArr(d);
    writeJson(p, d);
  }
  console.log("variants updated:", v);

  const barchaPath = path.join(ROOT, "public", "barcha.json");
  const barcha = JSON.parse(fs.readFileSync(barchaPath, "utf8"));
  console.log("barcha updated:", applyArr(barcha));
  writeJson(barchaPath, barcha);

  let m = 0;
  for (const f of fs.readdirSync(MAVZULI_DIR).filter((x) => x.endsWith(".json"))) {
    const p = path.join(MAVZULI_DIR, f);
    const d = JSON.parse(fs.readFileSync(p, "utf8"));
    if (!Array.isArray(d)) continue;
    m += applyArr(d);
    writeJson(p, d);
  }
  console.log("mavzuli updated:", m);

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

  writeJson(path.join(ROOT, "public", "barcha-uz-lat.json"), make("uz_lat"));
  writeJson(path.join(ROOT, "public", "barcha-uz-cyr.json"), make("uz_cyr"));
  writeJson(path.join(ROOT, "public", "barcha-ru.json"), make("ru"));
  console.log("split files rewritten");

  if (missingKeys > 0) {
    console.log(`\n⚠️  Hali ${missingKeys} ta kalit tarjima qilinmagan (out-*.json yetishmayapti).`);
    process.exitCode = 2;
  } else {
    console.log("\n✅ Barcha batch lar birlashtirildi.");
  }
}

main();
