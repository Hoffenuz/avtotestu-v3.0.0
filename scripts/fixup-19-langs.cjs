/**
 * For the 19 source-fixed questions: ensure local match has
 * - synced uz_lat izoh (already)
 * - uz_cyr via translit
 * - ru izoh filled (MyMemory or keep if present)
 * - is_correct same option id across uz_lat / uz_cyr / ru
 */
const fs = require("fs");
const path = require("path");
const { toCyrillic } = require("./uz-translit.cjs");

const SRC = "C:/Users/Vosster PC/Desktop/projects/izohlar/variants";
const DST = path.join(__dirname, "..", "public", "data", "variants");
const APPLY = process.argv.includes("--apply");
const SKIP_RU = process.env.SKIP_RU === "1";

const IDS = [
  "t_2_q_6","t_2_q_16","t_4_q_18","t_9_q_12","t_12_q_16","t_15_q_17","t_17_q_7",
  "t_20_q_3","t_21_q_9","t_23_q_10","t_28_q_5","t_29_q_15","t_30_q_8","t_31_q_20",
  "t_36_q_10","t_44_q_9","t_51_q_15","t_53_q_14","t_62_q_10",
];

function softNorm(s) {
  return (s || "").replace(/[\u2018\u2019\u02BB\u02BC']/g, "").replace(/\s+/g, " ").trim().toLowerCase();
}
function mediaKey(m) {
  return path.basename(String(m || "")).toLowerCase().replace(/\.(webp|png|jpg|jpeg)$/i, "");
}
function correct(q, lang = "uz_lat") {
  return (q.content?.[lang]?.options || []).find((o) => o.is_correct);
}

async function translateRu(text, cache) {
  if (cache[text]) return cache[text];
  if (SKIP_RU) return "";
  const url =
    "https://api.mymemory.translated.net/get?q=" +
    encodeURIComponent(text.slice(0, 450)) +
    "&langpair=uz|ru";
  const res = await fetch(url);
  if (!res.ok) throw new Error("HTTP " + res.status);
  const data = await res.json();
  const translated = (data?.responseData?.translatedText || "").trim();
  if (!translated || /MYMEMORY WARNING/i.test(translated)) {
    throw new Error(translated || "empty");
  }
  cache[text] = translated;
  return translated;
}

function loadSrcById() {
  const m = new Map();
  for (let i = 1; i <= 66; i++) {
    const p = path.join(SRC, `v${i}.json`);
    if (!fs.existsSync(p)) continue;
    for (const q of JSON.parse(fs.readFileSync(p, "utf8"))) {
      m.set(q.task_info?.global_id, { q, file: `v${i}` });
    }
  }
  return m;
}

function findLocalFiles() {
  const files = new Map(); // localId -> {arr, file, index}
  for (let i = 1; i <= 63; i++) {
    const file = `v${i}.json`;
    const p = path.join(DST, file);
    const arr = JSON.parse(fs.readFileSync(p, "utf8"));
    arr.forEach((q, index) => {
      files.set(q.task_info?.global_id, { arr, file, index, q, p });
    });
  }
  return files;
}

function findLocalForSrc(srcQ, localById, allLocals) {
  const mk = mediaKey(srcQ.media_url);
  const soft = softNorm(srcQ.content?.uz_lat?.text);
  if (mk) {
    const hits = allLocals.filter((x) => mediaKey(x.q.media_url) === mk);
    if (hits.length === 1) return hits[0];
    const same = hits.filter((x) => softNorm(x.q.content?.uz_lat?.text) === soft);
    if (same.length === 1) return same[0];
  }
  const byT = allLocals.filter((x) => softNorm(x.q.content?.uz_lat?.text) === soft);
  if (byT.length === 1) return byT[0];
  return null;
}

function alignCorrectIds(q) {
  const lat = correct(q, "uz_lat");
  if (!lat) return false;
  let changed = false;
  for (const lang of ["uz_cyr", "ru"]) {
    const opts = q.content?.[lang]?.options;
    if (!Array.isArray(opts)) continue;
    for (const o of opts) {
      const should = o.id === lat.id;
      if (!!o.is_correct !== should) {
        o.is_correct = should;
        changed = true;
      }
    }
  }
  return changed;
}

async function main() {
  const srcById = loadSrcById();
  const localIndex = findLocalFiles();
  const allLocals = [...localIndex.values()];
  const cachePath = path.join(__dirname, "izoh-ru-cache.json");
  const cache = fs.existsSync(cachePath) ? JSON.parse(fs.readFileSync(cachePath, "utf8")) : {};

  const report = [];
  const dirtyFiles = new Map();

  for (const id of IDS) {
    const src = srcById.get(id);
    if (!src) {
      report.push({ id, status: "SOURCE_MISSING" });
      continue;
    }
    const locRef = findLocalForSrc(src.q, localIndex, allLocals);
    if (!locRef) {
      report.push({ id, status: "LOCAL_MISSING" });
      continue;
    }
    const q = locRef.arr[locRef.index];
    const srcIz = (src.q.izoh?.uz_lat || "").trim();
    const issues = [];
    let changed = false;

    // Ensure lat izoh from source
    if (softNorm(q.izoh?.uz_lat) !== softNorm(srcIz)) {
      q.izoh = q.izoh || {};
      q.izoh.uz_lat = srcIz;
      changed = true;
      issues.push("izoh_lat_updated");
    }

    // Cyrillic
    const cyr = toCyrillic(srcIz);
    if (!q.izoh) q.izoh = {};
    if (softNorm(q.izoh.uz_cyr) !== softNorm(cyr)) {
      q.izoh.uz_cyr = cyr;
      changed = true;
      issues.push("izoh_cyr_updated");
    }

    // Russian
    if (!(q.izoh.ru || "").trim()) {
      try {
        const ru = await translateRu(srcIz, cache);
        if (ru) {
          q.izoh.ru = ru;
          changed = true;
          issues.push("izoh_ru_filled");
        } else {
          issues.push("izoh_ru_still_empty");
        }
      } catch (e) {
        issues.push("izoh_ru_translate_failed:" + e.message);
      }
      // rate limit courtesy
      await new Promise((r) => setTimeout(r, 350));
    }

    // Align correct ids across langs
    if (alignCorrectIds(q)) {
      changed = true;
      issues.push("correct_ids_aligned");
    }

    // Consistency checks
    const sameQ = softNorm(src.q.content?.uz_lat?.text) === softNorm(q.content?.uz_lat?.text);
    const sameIz = softNorm(srcIz) === softNorm(q.izoh?.uz_lat);
    const sameAns =
      softNorm(correct(src.q)?.text) === softNorm(correct(q)?.text);
    const latId = correct(q, "uz_lat")?.id;
    const cyrId = correct(q, "uz_cyr")?.id;
    const ruId = correct(q, "ru")?.id;

    if (!sameQ) issues.push("WARN_question_text_diff");
    if (!sameIz) issues.push("WARN_izoh_not_equal");
    if (!sameAns) issues.push("WARN_answer_diff");
    if (latId != null && cyrId != null && latId !== cyrId) issues.push("WARN_cyr_id");
    if (latId != null && ruId != null && latId !== ruId) issues.push("WARN_ru_id");
    if (!(q.izoh?.ru || "").trim()) issues.push("WARN_ru_empty");

    if (changed && APPLY) {
      dirtyFiles.set(locRef.p, locRef.arr);
    }

    report.push({
      id,
      localId: q.task_info?.global_id,
      localFile: locRef.file,
      sameQ,
      sameIz,
      sameAns,
      izohLens: {
        lat: (q.izoh?.uz_lat || "").length,
        cyr: (q.izoh?.uz_cyr || "").length,
        ru: (q.izoh?.ru || "").length,
      },
      correctIds: { lat: latId, cyr: cyrId, ru: ruId },
      issues,
      status:
        sameQ && sameIz && sameAns && (q.izoh?.ru || "").trim() && latId === cyrId && latId === ruId
          ? "OK"
          : "CHECK",
    });
  }

  if (APPLY) {
    for (const [p, arr] of dirtyFiles) {
      fs.writeFileSync(p, JSON.stringify(arr, null, 4) + "\n", "utf8");
      console.log("wrote", path.basename(p));
    }
    fs.writeFileSync(cachePath, JSON.stringify(cache), "utf8");
  }

  const ok = report.filter((r) => r.status === "OK").length;
  console.log(JSON.stringify({ mode: APPLY ? "apply" : "dry-run", ok, total: report.length, report }, null, 2));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
