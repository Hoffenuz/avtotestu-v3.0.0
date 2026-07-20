/**
 * Sync corrected izoh (and correct-answer flags) from
 * Desktop/projects/izohlar/variants → public/data/variants.
 *
 * Match: soft-norm text (with typo folds) → media+text → media-unique → fuzzy soft
 * Izoh: source.uz_lat authoritative; uz_cyr = source or translit; ru kept if present in source else local
 * Answers: if option texts are a permutation, fix is_correct to match source correct text
 *
 *   node scripts/sync-izoh-from-source.cjs
 *   node scripts/sync-izoh-from-source.cjs --apply
 */
const fs = require("fs");
const path = require("path");
const { toCyrillic } = require("./uz-translit.cjs");

const ROOT = path.join(__dirname, "..");
const SRC_DIR = path.join(
  "C:",
  "Users",
  "Vosster PC",
  "Desktop",
  "projects",
  "izohlar",
  "variants"
);
const DST_DIR = path.join(ROOT, "public", "data", "variants");
const APPLY = process.argv.includes("--apply");
const APOS = /[\u2018\u2019\u02BB\u02BC'\u00AB\u00BB\u201C\u201D]/g;

function softNorm(s) {
  return (s || "")
    .replace(APOS, "")
    .replace(/[«»""„]/g, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase()
    // common OCR / typing folds between site ↔ izohlar source
    .replace(/yetarli/g, "etarli")
    .replace(/xavfsiz/g, "havfsiz")
    .replace(/nechinchi/g, "nechanchi")
    .replace(/yo['']nalish/g, "yunalish")
    .replace(/ruxsat/g, "rusat")
    .replace(/chorraxa/g, "chorraha")
    .replace(/hisoplanadimi/g, "hisoblanadimi")
    .replace(/boshiangich/g, "boshlangich")
    .replace(/boshlangich/g, "boshlangich")
    .replace(/balanligi/g, "balandligi")
    .replace(/bordlari/g, "bortlari")
    .replace(/mayo[kq]chalari/g, "mayoqchalari")
    .replace(/kursatilgan/g, "korsatilgan")
    .replace(/ko['']rsatilgan/g, "korsatilgan")
    // glued words in older site JSON
    .replace(/ornatilganyuk/g, "ornatilgan yuk")
    .replace(/avtomobiliyuk/g, "avtomobili yuk")
    .replace(/yukhonasida/g, "yukxonasida")
    .replace(/yukhonasi/g, "yukxonasi")
    .replace(/yukxonasida/g, "yukxonasi da")
    .replace(/yukxonasi/g, "yukxonasi")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Space-insensitive key for typo-glued unmatched questions */
function compactNorm(s) {
  return softNorm(s).replace(/\s+/g, "");
}

function mediaKey(m) {
  return path
    .basename(String(m || ""))
    .toLowerCase()
    .replace(/\.(webp|png|jpg|jpeg)$/i, "");
}

function izohEqual(a, b) {
  return softNorm(a || "") === softNorm(b || "");
}

function loadSource() {
  const bySoft = new Map();
  const byCompact = new Map();
  const byMedia = new Map();
  const byId = new Map();
  let n = 0;
  let withIz = 0;

  for (let i = 1; i <= 80; i++) {
    const p = path.join(SRC_DIR, `v${i}.json`);
    if (!fs.existsSync(p)) continue;
    for (const q of JSON.parse(fs.readFileSync(p, "utf8"))) {
      n++;
      const text = q.content?.uz_lat?.text || "";
      const iz = q.izoh || null;
      const izLat = (iz?.uz_lat || "").trim();
      if (izLat) withIz++;
      const soft = softNorm(text);
      const compact = compactNorm(text);
      const mk = mediaKey(q.media_url);
      const id = q.task_info?.global_id;
      const entry = { q, text, soft, compact, media: mk, id, iz, izLat, file: `v${i}` };
      if (id) byId.set(id, entry);
      if (soft) {
        if (!bySoft.has(soft)) bySoft.set(soft, []);
        bySoft.get(soft).push(entry);
      }
      if (compact) {
        if (!byCompact.has(compact)) byCompact.set(compact, []);
        byCompact.get(compact).push(entry);
      }
      if (mk) {
        if (!byMedia.has(mk)) byMedia.set(mk, []);
        byMedia.get(mk).push(entry);
      }
    }
  }
  return { bySoft, byCompact, byMedia, byId, n, withIz };
}

function findSource(dstQ, src) {
  const text = dstQ.content?.uz_lat?.text || "";
  const soft = softNorm(text);
  const compact = compactNorm(text);
  const mk = mediaKey(dstQ.media_url);
  const id = dstQ.task_info?.global_id;

  // 1) MEDIA FIRST — many questions share identical wording ("Ushbu belgi qanday nomlanadi?")
  //    but differ by image + answers. Never match those by text alone.
  if (mk && src.byMedia.has(mk)) {
    const list = src.byMedia.get(mk);
    if (list.length === 1) return { entry: list[0], how: "media-unique" };
    const sameText = list.filter((e) => e.soft === soft || e.compact === compact);
    if (sameText.length === 1) return { entry: sameText[0], how: "media+text" };
    if (sameText.length > 1) {
      const byI = sameText.filter((e) => e.id === id);
      if (byI.length === 1) return { entry: byI[0], how: "media+text+id" };
      return { entry: sameText[0], how: "media+text-first", ambiguous: sameText.length };
    }
  }

  // 2) Text / compact — only safe when destination has NO media (text-only questions)
  if (!mk && soft && src.bySoft.has(soft)) {
    const list = src.bySoft.get(soft).filter((e) => !e.media);
    const pool = list.length ? list : src.bySoft.get(soft);
    if (pool.length === 1) return { entry: pool[0], how: "text" };
    const byI = pool.filter((e) => e.id === id);
    if (byI.length === 1) return { entry: byI[0], how: "text+id" };
    // Prefer source also without media
    const noMedia = pool.filter((e) => !e.media);
    if (noMedia.length === 1) return { entry: noMedia[0], how: "text-nomedia" };
    if (pool.length > 0 && noMedia.length === 0 && pool.every((e) => e.izLat && softNorm(e.izLat) === softNorm(pool[0].izLat))) {
      // all candidates share same izoh — pick first
      return { entry: pool[0], how: "text-same-izoh", ambiguous: pool.length };
    }
    if (noMedia.length > 1) return { entry: noMedia[0], how: "text-first", ambiguous: noMedia.length };
  }

  if (!mk && compact && src.byCompact.has(compact)) {
    const list = src.byCompact.get(compact).filter((e) => !e.media);
    if (list.length === 1) return { entry: list[0], how: "compact" };
    const byI = list.filter((e) => e.id === id);
    if (byI.length === 1) return { entry: byI[0], how: "compact+id" };
  }

  // 3) Text fallback for items WITH media when source media filename differs —
  //    only accept if option texts are a permutation (same question, renamed image).
  if (mk && soft && src.bySoft.has(soft)) {
    const list = src.bySoft.get(soft);
    const permut = list.filter((e) => optionsArePermutation(dstQ, e.q));
    if (permut.length === 1) return { entry: permut[0], how: "text+opts" };
    if (permut.length > 1) {
      const byI = permut.filter((e) => e.id === id);
      if (byI.length === 1) return { entry: byI[0], how: "text+opts+id" };
    }
  }

  if (id && src.byId.has(id)) {
    const e = src.byId.get(id);
    if ((e.soft === soft || e.compact === compact) && (!mk || !e.media || e.media === mk)) {
      return { entry: e, how: "id" };
    }
  }

  return { entry: null, how: "none" };
}

function buildIzoh(srcIz, prevIz) {
  const uz_lat = (srcIz?.uz_lat || "").trim();
  if (!uz_lat) return null;
  const srcCyr = (srcIz?.uz_cyr || "").trim();
  const srcRu = (srcIz?.ru || "").trim();
  const prevLat = (prevIz?.uz_lat || "").trim();
  const prevCyr = (prevIz?.uz_cyr || "").trim();
  const prevRu = (prevIz?.ru || "").trim();

  const uz_cyr = srcCyr || toCyrillic(uz_lat) || prevCyr;
  // Source currently ships uz_lat only. Keep RU only when lat izoh is unchanged;
  // otherwise clear so stale (wrong) Russian text is not shown.
  let ru = srcRu;
  if (!ru) {
    ru = izohEqual(prevLat, uz_lat) ? prevRu : "";
  }
  return { uz_lat, uz_cyr, ru };
}

/** True if both questions share the same set of option texts (order may differ). */
function optionsArePermutation(dstQ, srcQ) {
  const a = (dstQ.content?.uz_lat?.options || []).map((o) => softNorm(o.text)).filter(Boolean).sort();
  const b = (srcQ.content?.uz_lat?.options || []).map((o) => softNorm(o.text)).filter(Boolean).sort();
  if (a.length === 0 || a.length !== b.length) return false;
  return a.every((t, i) => t === b[i]);
}

/** Fix is_correct across langs so the option whose text matches source correct text is marked. */
function syncCorrectAnswers(dstQ, srcQ) {
  const srcOpts = srcQ.content?.uz_lat?.options || [];
  const srcCorrect = srcOpts.find((o) => o.is_correct);
  if (!srcCorrect) return false;
  const correctSoft = softNorm(srcCorrect.text);
  let changed = false;

  for (const lang of ["uz_lat", "uz_cyr", "ru"]) {
    const opts = dstQ.content?.[lang]?.options;
    if (!Array.isArray(opts) || opts.length === 0) continue;

    // Prefer matching by soft-norm of same-lang source option if available
    const srcLangOpts = srcQ.content?.[lang]?.options || [];
    const srcLangCorrect = srcLangOpts.find((o) => o.is_correct);
    const targetSoft = srcLangCorrect ? softNorm(srcLangCorrect.text) : correctSoft;

    let matchedId = null;
    for (const o of opts) {
      if (softNorm(o.text) === targetSoft) {
        matchedId = o.id;
        break;
      }
    }
    // fallback: match uz_lat correct text against this lang's options (won't work for cyr/ru)
    if (matchedId == null && lang === "uz_lat") {
      for (const o of opts) {
        if (softNorm(o.text) === correctSoft) {
          matchedId = o.id;
          break;
        }
      }
    }
    if (matchedId == null) continue;

    for (const o of opts) {
      const should = o.id === matchedId;
      if (!!o.is_correct !== should) {
        o.is_correct = should;
        changed = true;
      }
    }
  }
  return changed;
}

function main() {
  if (!fs.existsSync(SRC_DIR)) {
    console.error("Source missing:", SRC_DIR);
    process.exit(1);
  }

  const src = loadSource();
  const stats = {
    dstQuestions: 0,
    matched: 0,
    unmatched: 0,
    izohUpdated: 0,
    izohSame: 0,
    izohMissingInSrc: 0,
    answerFixed: 0,
    byHow: {},
    samplesUpdate: [],
    samplesUnmatched: [],
    samplesAnswer: [],
    filesWritten: 0,
  };

  const files = fs
    .readdirSync(DST_DIR)
    .filter((f) => /^v\d+\.json$/.test(f))
    .sort((a, b) => parseInt(a.slice(1), 10) - parseInt(b.slice(1), 10));

  for (const file of files) {
    const p = path.join(DST_DIR, file);
    const arr = JSON.parse(fs.readFileSync(p, "utf8"));
    let changed = false;

    for (const q of arr) {
      stats.dstQuestions++;
      const hit = findSource(q, src);
      stats.byHow[hit.how] = (stats.byHow[hit.how] || 0) + 1;

      if (!hit.entry) {
        stats.unmatched++;
        if (stats.samplesUnmatched.length < 12) {
          stats.samplesUnmatched.push({
            file,
            id: q.task_info?.global_id,
            text: (q.content?.uz_lat?.text || "").slice(0, 80),
            media: mediaKey(q.media_url),
          });
        }
        continue;
      }

      stats.matched++;
      const srcQ = hit.entry.q;
      const nextIz = buildIzoh(srcQ.izoh, q.izoh);

      if (!nextIz) {
        stats.izohMissingInSrc++;
      } else {
        const same =
          izohEqual(nextIz.uz_lat, q.izoh?.uz_lat) &&
          izohEqual(nextIz.uz_cyr, q.izoh?.uz_cyr) &&
          izohEqual(nextIz.ru, q.izoh?.ru);

        if (same) {
          stats.izohSame++;
        } else {
          stats.izohUpdated++;
          if (stats.samplesUpdate.length < 12) {
            stats.samplesUpdate.push({
              file,
              id: q.task_info?.global_id,
              how: hit.how,
              before: (q.izoh?.uz_lat || "").slice(0, 70),
              after: nextIz.uz_lat.slice(0, 70),
            });
          }
          if (APPLY) {
            q.izoh = nextIz;
            changed = true;
          }
        }
      }

      // Fill empty media from source when same question
      if (APPLY && (!q.media_url || q.media_url === "") && srcQ.media_url) {
        q.media_url = srcQ.media_url;
        changed = true;
      }

      const ansProbe = JSON.parse(JSON.stringify(q));
      const canFixAnswer =
        optionsArePermutation(q, srcQ) &&
        (hit.how.startsWith("media") || hit.how.startsWith("text") || hit.how.startsWith("compact") || hit.how === "id");
      const ansWouldChange = canFixAnswer && syncCorrectAnswers(ansProbe, srcQ);
      if (ansWouldChange) {
        stats.answerFixed++;
        if (stats.samplesAnswer.length < 10) {
          stats.samplesAnswer.push({
            file,
            id: q.task_info?.global_id,
            how: hit.how,
            note: "is_correct will align to source correct option text",
          });
        }
        if (APPLY) {
          syncCorrectAnswers(q, srcQ);
          changed = true;
        }
      }
    }

    if (APPLY && changed) {
      fs.writeFileSync(p, JSON.stringify(arr, null, 4) + "\n", "utf8");
      stats.filesWritten++;
      console.log("wrote", file);
    }
  }

  console.log(
    JSON.stringify(
      {
        mode: APPLY ? "apply" : "dry-run",
        source: { questions: src.n, withIzoh: src.withIz },
        stats,
      },
      null,
      2
    )
  );
}

main();
