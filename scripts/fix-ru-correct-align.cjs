/**
 * Realign RU is_correct to match LAT correct answer (uz→ru translate + fuzzy match).
 * Fast path: unique texts, batch translate, resume from cache.
 *
 *   node scripts/fix-ru-correct-align.cjs
 *   node scripts/fix-ru-correct-align.cjs --apply
 */
const fs = require("fs");
const path = require("path");
const { translate } = require("google-translate-api-x");

const ROOT = path.join(__dirname, "..");
const DST_DIR = path.join(ROOT, "public", "data", "variants");
const CACHE_PATH = path.join(__dirname, "ru-option-align-cache.json");
const APPLY = process.argv.includes("--apply");
const APOS = /[\u2018\u2019\u02BB\u02BC'\u00AB\u00BB\u201C\u201D]/g;

function softNorm(s) {
  return (s || "")
    .replace(APOS, "")
    .replace(/[«»""„]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
    .replace(/ё/g, "е")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokens(s) {
  return softNorm(s).split(" ").filter((w) => w.length > 1);
}

function jaccard(a, b) {
  const A = new Set(tokens(a));
  const B = new Set(tokens(b));
  if (!A.size || !B.size) return 0;
  let inter = 0;
  for (const w of A) if (B.has(w)) inter++;
  return inter / (A.size + B.size - inter);
}

function loadCache() {
  if (!fs.existsSync(CACHE_PATH)) return {};
  try {
    return JSON.parse(fs.readFileSync(CACHE_PATH, "utf8"));
  } catch {
    return {};
  }
}

function saveCache(c) {
  fs.writeFileSync(CACHE_PATH, JSON.stringify(c, null, 2), "utf8");
}

function bestRuMatch(translated, ruOpts) {
  let best = null;
  let bestScore = 0;
  for (const o of ruOpts) {
    const exact = softNorm(translated) === softNorm(o.text) ? 1 : 0;
    const score = Math.max(jaccard(translated, o.text), exact);
    if (score > bestScore) {
      bestScore = score;
      best = o;
    }
  }
  return { opt: best, score: bestScore };
}

function setCorrect(opts, correctId) {
  let changed = false;
  for (const o of opts) {
    const should = o.id === correctId;
    if (!!o.is_correct !== should) {
      o.is_correct = should;
      changed = true;
    }
  }
  return changed;
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function translateBatch(texts) {
  const res = await translate(texts, { from: "uz", to: "ru", forceBatch: true });
  if (Array.isArray(res)) return res.map((r) => (r?.text || "").trim());
  return [(res?.text || "").trim()];
}

async function fillCache(uniqueTexts, cache) {
  const missing = uniqueTexts.filter((t) => t && cache[t] === undefined);
  console.log(`cache: ${Object.keys(cache).length} have, ${missing.length} missing`);
  const BATCH = 10;
  for (let i = 0; i < missing.length; i += BATCH) {
    const chunk = missing.slice(i, i + BATCH);
    let ok = false;
    for (let attempt = 0; attempt < 4 && !ok; attempt++) {
      try {
        const outs = await translateBatch(chunk);
        chunk.forEach((t, idx) => {
          cache[t] = outs[idx] || "";
        });
        ok = true;
      } catch (e) {
        console.warn(`batch ${i}-${i + chunk.length} fail attempt ${attempt + 1}:`, e.message);
        await sleep(1500 * (attempt + 1));
      }
    }
    if (!ok) {
      // fallback one-by-one
      for (const t of chunk) {
        try {
          const r = await translate(t, { from: "uz", to: "ru" });
          cache[t] = (r?.text || "").trim();
          await sleep(200);
        } catch (e) {
          console.warn("single fail:", t.slice(0, 40), e.message);
          cache[t] = "";
        }
      }
    }
    saveCache(cache);
    console.log(`translated ${Math.min(i + BATCH, missing.length)}/${missing.length}`);
    await sleep(300);
  }
}

async function main() {
  const cache = loadCache();

  // 1) collect all questions + unique LAT correct texts
  const all = [];
  const unique = new Set();
  for (let i = 1; i <= 63; i++) {
    const file = `v${i}.json`;
    const p = path.join(DST_DIR, file);
    const arr = JSON.parse(fs.readFileSync(p, "utf8"));
    for (const q of arr) {
      const latC = (q.content?.uz_lat?.options || []).find((o) => o.is_correct);
      if (latC?.text) unique.add(latC.text.trim());
      all.push({ file, p, q, i });
    }
  }

  // 2) fill translation cache (batch)
  await fillCache([...unique], cache);
  saveCache(cache);

  // 3) align
  const stats = {
    total: 0,
    alreadyOk: 0,
    wouldFix: 0,
    lowConfidence: 0,
    noLatCorrect: 0,
    samples: [],
    lowSamples: [],
  };
  const filesWritten = [];
  const byFile = new Map();
  for (const item of all) {
    if (!byFile.has(item.file)) {
      byFile.set(item.file, {
        p: item.p,
        arr: JSON.parse(fs.readFileSync(item.p, "utf8")),
        changed: false,
      });
    }
  }

  for (const item of all) {
    stats.total++;
    const pack = byFile.get(item.file);
    const q = pack.arr.find((x) => x.task_info?.global_id === item.q.task_info?.global_id);
    if (!q) continue;

    const latOpts = q.content?.uz_lat?.options || [];
    const ruOpts = q.content?.ru?.options || [];
    const latC = latOpts.find((o) => o.is_correct);
    const ruC = ruOpts.find((o) => o.is_correct);
    if (!latC || !ruOpts.length) {
      stats.noLatCorrect++;
      continue;
    }

    const translated = cache[latC.text.trim()] || "";
    if (!translated) {
      stats.lowConfidence++;
      continue;
    }

    const { opt, score } = bestRuMatch(translated, ruOpts);
    if (!opt || score < 0.35) {
      stats.lowConfidence++;
      if (stats.lowSamples.length < 25) {
        stats.lowSamples.push({
          id: q.task_info?.global_id,
          lat: latC.text.slice(0, 60),
          translated: translated.slice(0, 60),
          score,
          currentRu: ruC?.text?.slice(0, 60),
        });
      }
      continue;
    }

    if (ruC && ruC.id === opt.id) {
      stats.alreadyOk++;
      continue;
    }

    stats.wouldFix++;
    if (stats.samples.length < 30) {
      stats.samples.push({
        id: q.task_info?.global_id,
        score: Number(score.toFixed(2)),
        lat: latC.text.slice(0, 55),
        translated: translated.slice(0, 55),
        from: ruC ? `${ruC.id}:${ruC.text.slice(0, 45)}` : "none",
        to: `${opt.id}:${opt.text.slice(0, 45)}`,
      });
    }

    if (APPLY) {
      if (setCorrect(ruOpts, opt.id)) pack.changed = true;
    }
  }

  if (APPLY) {
    for (const [file, pack] of byFile) {
      if (!pack.changed) continue;
      fs.writeFileSync(pack.p, JSON.stringify(pack.arr, null, 4) + "\n", "utf8");
      filesWritten.push(file);
    }
  }

  const report = { mode: APPLY ? "apply" : "dry-run", stats, filesWritten };
  fs.writeFileSync(path.join(__dirname, "_fix-ru-correct-report.json"), JSON.stringify(report, null, 2), "utf8");
  console.log(JSON.stringify(report, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
