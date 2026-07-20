/**
 * Fix RU duplicate options in a variant range by translating LAT options (same id order).
 * Also expand short RU izoh from LAT.
 *
 *   node scripts/fix-ru-dup-options-batch.cjs 1 20
 *   node scripts/fix-ru-dup-options-batch.cjs 1 20 --apply
 */
const fs = require("fs");
const path = require("path");
const { translate } = require("google-translate-api-x");

const ROOT = path.join(__dirname, "..");
const DST = path.join(ROOT, "public", "data", "variants");
const CACHE = path.join(__dirname, "ru-option-text-cache.json");
const from = Number(process.argv[2] || 1);
const to = Number(process.argv[3] || 20);
const APPLY = process.argv.includes("--apply");

function soft(s) {
  return (s || "").replace(/\s+/g, " ").trim().toLowerCase();
}

function loadCache() {
  if (!fs.existsSync(CACHE)) return {};
  try {
    return JSON.parse(fs.readFileSync(CACHE, "utf8"));
  } catch {
    return {};
  }
}
function saveCache(c) {
  fs.writeFileSync(CACHE, JSON.stringify(c, null, 2), "utf8");
}

function hasDupOptions(opts) {
  const texts = opts.map((o) => soft(o.text));
  return texts.some((t, i) => t && texts.indexOf(t) !== i);
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function translateBatch(texts) {
  const res = await translate(texts, { from: "uz", to: "ru", forceBatch: true });
  if (Array.isArray(res)) return res.map((r) => (r?.text || "").trim());
  return [(res?.text || "").trim()];
}

async function fillMissing(texts, cache) {
  const missing = [...new Set(texts.filter((t) => t && cache[t] === undefined))];
  console.log("unique to translate:", missing.length);
  const BATCH = 8;
  for (let i = 0; i < missing.length; i += BATCH) {
    const chunk = missing.slice(i, i + BATCH);
    let ok = false;
    for (let a = 0; a < 4 && !ok; a++) {
      try {
        const outs = await translateBatch(chunk);
        chunk.forEach((t, idx) => {
          cache[t] = outs[idx] || "";
        });
        ok = true;
      } catch (e) {
        console.warn("batch fail", a + 1, e.message);
        await sleep(1200 * (a + 1));
      }
    }
    if (!ok) {
      for (const t of chunk) {
        try {
          const r = await translate(t, { from: "uz", to: "ru" });
          cache[t] = (r?.text || "").trim();
          await sleep(250);
        } catch {
          cache[t] = "";
        }
      }
    }
    saveCache(cache);
    console.log(`translated ${Math.min(i + BATCH, missing.length)}/${missing.length}`);
    await sleep(250);
  }
}

async function main() {
  const cache = loadCache();
  const flagged = [];

  for (let i = from; i <= to; i++) {
    const arr = JSON.parse(fs.readFileSync(path.join(DST, `v${i}.json`), "utf8"));
    for (const q of arr) {
      const latOpts = q.content?.uz_lat?.options || [];
      const ruOpts = q.content?.ru?.options || [];
      if (!latOpts.length || ruOpts.length !== latOpts.length) continue;
      if (hasDupOptions(ruOpts) || (q.izoh?.ru || "").trim().length < 40) {
        flagged.push({ i, q });
        for (const o of latOpts) {
          if (o.text) cache[o.text] = cache[o.text]; // ensure key tracked
        }
        if ((q.izoh?.uz_lat || "").trim() && (q.izoh?.ru || "").trim().length < 40) {
          // will translate izoh too
        }
      }
    }
  }

  // collect all lat option texts + short izohs needing translation
  const need = [];
  for (const { q } of flagged) {
    for (const o of q.content.uz_lat.options) if (o.text) need.push(o.text);
    if ((q.izoh?.ru || "").trim().length < 40 && (q.izoh?.uz_lat || "").trim()) {
      need.push(q.izoh.uz_lat.trim());
    }
  }
  await fillMissing(need, cache);
  saveCache(cache);

  const stats = { fixedOpts: 0, fixedIzoh: 0, samples: [], files: [] };

  for (let i = from; i <= to; i++) {
    const file = `v${i}.json`;
    const p = path.join(DST, file);
    const arr = JSON.parse(fs.readFileSync(p, "utf8"));
    let changed = false;

    for (const q of arr) {
      const latOpts = q.content?.uz_lat?.options || [];
      const ruOpts = q.content?.ru?.options || [];
      if (!latOpts.length || ruOpts.length !== latOpts.length) continue;

      if (hasDupOptions(ruOpts)) {
        const latCorrect = latOpts.find((o) => o.is_correct);
        const newRu = latOpts.map((o) => ({
          id: o.id,
          text: cache[o.text] || o.text,
          is_correct: latCorrect ? o.id === latCorrect.id : !!o.is_correct,
        }));
        // verify no empty translations
        if (newRu.every((o) => (o.text || "").trim())) {
          stats.fixedOpts++;
          if (stats.samples.length < 12) {
            stats.samples.push({
              id: q.task_info.global_id,
              before: ruOpts.map((o) => o.text.slice(0, 40)),
              after: newRu.map((o) => o.text.slice(0, 40)),
            });
          }
          if (APPLY) {
            q.content.ru.options = newRu;
            changed = true;
          }
        }
      }

      if ((q.izoh?.ru || "").trim().length < 40 && (q.izoh?.uz_lat || "").trim()) {
        const tr = cache[q.izoh.uz_lat.trim()];
        if (tr && tr.length >= 20) {
          stats.fixedIzoh++;
          if (APPLY) {
            q.izoh.ru = tr;
            changed = true;
          }
        }
      }
    }

    if (APPLY && changed) {
      fs.writeFileSync(p, JSON.stringify(arr, null, 4) + "\n", "utf8");
      stats.files.push(file);
    }
  }

  // sync barcha for changed ids if apply
  if (APPLY && stats.files.length) {
    const byId = new Map();
    for (let i = from; i <= to; i++) {
      for (const q of JSON.parse(fs.readFileSync(path.join(DST, `v${i}.json`), "utf8"))) {
        byId.set(q.task_info.global_id, q);
      }
    }
    for (const name of ["barcha.json", "barcha-ru.json"]) {
      const bp = path.join(ROOT, "public", name);
      const arr = JSON.parse(fs.readFileSync(bp, "utf8"));
      let n = 0;
      for (const q of arr) {
        const src = byId.get(q.task_info?.global_id);
        if (!src) continue;
        if (name === "barcha.json") {
          if (src.content?.ru) {
            q.content.ru = JSON.parse(JSON.stringify(src.content.ru));
            q.izoh = { ...src.izoh };
            n++;
          }
        } else {
          if (src.content?.ru) {
            q.content.ru = { text: src.content.ru.text, options: JSON.parse(JSON.stringify(src.content.ru.options)) };
            q.izoh = { ru: src.izoh?.ru || "" };
            n++;
          }
        }
      }
      fs.writeFileSync(bp, JSON.stringify(arr, null, 4) + "\n", "utf8");
      stats["synced_" + name] = n;
    }
  }

  const out = { mode: APPLY ? "apply" : "dry-run", range: { from, to }, stats };
  fs.writeFileSync(path.join(__dirname, `_fix-ru-dups-v${from}-v${to}.json`), JSON.stringify(out, null, 2));
  console.log(JSON.stringify(out, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
