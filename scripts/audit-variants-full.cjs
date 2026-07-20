/**
 * Full audit of public/data/variants vs Desktop/projects/izohlar/variants.
 * Checks: structure, correct answers, izoh (media-first match).
 *
 *   node scripts/audit-variants-full.cjs
 *   node scripts/audit-variants-full.cjs --json
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const SRC_DIR = path.join("C:", "Users", "Vosster PC", "Desktop", "projects", "izohlar", "variants");
const DST_DIR = path.join(ROOT, "public", "data", "variants");
const AS_JSON = process.argv.includes("--json");
const APOS = /[\u2018\u2019\u02BB\u02BC'\u00AB\u00BB\u201C\u201D]/g;

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
    .replace(/yo['']nalish/g, "yunalish")
    .replace(/yunalish/g, "yonalish")
    .replace(/ruxsat/g, "rusat")
    .replace(/chorraxa/g, "chorraha")
    .replace(/hisoplanadimi/g, "hisoblanadimi")
    .replace(/boshiangich/g, "boshlangich")
    .replace(/balanligi/g, "balandligi")
    .replace(/ornatilganyuk/g, "ornatilgan yuk")
    .replace(/yukhonasida/g, "yukxonasida")
    .replace(/yukhonasi/g, "yukxonasi")
    .replace(/chiziqi/g, "chizigi")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

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

function optsSoft(q) {
  return (q.content?.uz_lat?.options || [])
    .map((o) => softNorm(o.text))
    .filter(Boolean)
    .sort();
}

function optionsArePermutation(a, b) {
  const A = optsSoft(a);
  const B = optsSoft(b);
  return A.length > 0 && A.length === B.length && A.every((t, i) => t === B[i]);
}

function correctText(q, lang = "uz_lat") {
  const opts = q.content?.[lang]?.options || [];
  const c = opts.find((o) => o.is_correct);
  return c ? softNorm(c.text) : null;
}

function correctIds(q, lang = "uz_lat") {
  return (q.content?.[lang]?.options || []).filter((o) => o.is_correct).map((o) => o.id);
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
      const izLat = (q.izoh?.uz_lat || "").trim();
      if (izLat) withIz++;
      const soft = softNorm(text);
      const compact = compactNorm(text);
      const mk = mediaKey(q.media_url);
      const id = q.task_info?.global_id;
      const entry = { q, soft, compact, media: mk, id, izLat };
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
  const soft = softNorm(dstQ.content?.uz_lat?.text || "");
  const compact = compactNorm(dstQ.content?.uz_lat?.text || "");
  const mk = mediaKey(dstQ.media_url);
  const id = dstQ.task_info?.global_id;

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

  if (!mk && soft && src.bySoft.has(soft)) {
    const list = src.bySoft.get(soft).filter((e) => !e.media);
    const pool = list.length ? list : src.bySoft.get(soft);
    if (pool.length === 1) return { entry: pool[0], how: "text" };
    const byI = pool.filter((e) => e.id === id);
    if (byI.length === 1) return { entry: byI[0], how: "text+id" };
    const noMedia = pool.filter((e) => !e.media);
    if (noMedia.length === 1) return { entry: noMedia[0], how: "text-nomedia" };
    if (
      pool.length > 0 &&
      pool.every((e) => e.izLat && softNorm(e.izLat) === softNorm(pool[0].izLat))
    ) {
      return { entry: pool[0], how: "text-same-izoh", ambiguous: pool.length };
    }
  }

  if (!mk && compact && src.byCompact.has(compact)) {
    const list = src.byCompact.get(compact).filter((e) => !e.media);
    if (list.length === 1) return { entry: list[0], how: "compact" };
    const byI = list.filter((e) => e.id === id);
    if (byI.length === 1) return { entry: byI[0], how: "compact+id" };
  }

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

function auditStructure(q, file) {
  const issues = [];
  const id = q.task_info?.global_id || "?";
  for (const lang of ["uz_lat", "uz_cyr", "ru"]) {
    const block = q.content?.[lang];
    if (!block) {
      issues.push({ type: "missing-lang", file, id, lang });
      continue;
    }
    if (!(block.text || "").trim()) issues.push({ type: "empty-text", file, id, lang });
    const opts = block.options || [];
    if (opts.length < 2) issues.push({ type: "few-options", file, id, lang, n: opts.length });
    const corrects = opts.filter((o) => o.is_correct);
    if (corrects.length === 0) issues.push({ type: "no-correct", file, id, lang });
    if (corrects.length > 1) issues.push({ type: "multi-correct", file, id, lang, n: corrects.length });
    for (const o of opts) {
      if (!(o.text || "").trim()) issues.push({ type: "empty-option", file, id, lang, optId: o.id });
    }
  }
  // cross-lang correct id alignment (same option id should be correct in all langs)
  const latIds = correctIds(q, "uz_lat");
  for (const lang of ["uz_cyr", "ru"]) {
    const ids = correctIds(q, lang);
    if (latIds.length === 1 && ids.length === 1 && latIds[0] !== ids[0]) {
      issues.push({
        type: "cross-lang-correct-id",
        file,
        id,
        lang,
        latId: latIds[0],
        otherId: ids[0],
      });
    }
  }
  if (!(q.izoh?.uz_lat || "").trim()) issues.push({ type: "empty-izoh-lat", file, id });
  return issues;
}

function main() {
  if (!fs.existsSync(SRC_DIR)) {
    console.error("Source missing:", SRC_DIR);
    process.exit(1);
  }

  const src = loadSource();
  const report = {
    source: { files: 0, questions: src.n, withIzoh: src.withIz },
    local: { files: 0, questions: 0 },
    match: { matched: 0, unmatched: 0, byHow: {} },
    izoh: { ok: 0, wrong: 0, missingInSrc: 0, samples: [] },
    answers: { ok: 0, wrong: 0, uncomparable: 0, samples: [] },
    structure: { ok: 0, issues: [] },
    unmatchedSamples: [],
  };

  for (let i = 1; i <= 63; i++) {
    const file = `v${i}.json`;
    const p = path.join(DST_DIR, file);
    if (!fs.existsSync(p)) continue;
    report.local.files++;
    const arr = JSON.parse(fs.readFileSync(p, "utf8"));
    for (const q of arr) {
      report.local.questions++;
      const id = q.task_info?.global_id;

      const structIssues = auditStructure(q, file);
      if (structIssues.length) report.structure.issues.push(...structIssues);
      else report.structure.ok++;

      const hit = findSource(q, src);
      report.match.byHow[hit.how] = (report.match.byHow[hit.how] || 0) + 1;
      if (!hit.entry) {
        report.match.unmatched++;
        if (report.unmatchedSamples.length < 30) {
          report.unmatchedSamples.push({
            file,
            id,
            media: mediaKey(q.media_url),
            text: (q.content?.uz_lat?.text || "").slice(0, 80),
          });
        }
        continue;
      }
      report.match.matched++;

      const srcIz = hit.entry.izLat;
      const locIz = (q.izoh?.uz_lat || "").trim();
      if (!srcIz) {
        report.izoh.missingInSrc++;
      } else if (izohEqual(locIz, srcIz)) {
        report.izoh.ok++;
      } else {
        report.izoh.wrong++;
        if (report.izoh.samples.length < 25) {
          report.izoh.samples.push({
            file,
            id,
            how: hit.how,
            srcId: hit.entry.id,
            local: locIz.slice(0, 90),
            source: srcIz.slice(0, 90),
          });
        }
      }

      // answers: compare correct option text (uz_lat)
      if (!optionsArePermutation(q, hit.entry.q)) {
        // still try soft compare of correct texts if countable
        const locC = correctText(q);
        const srcC = correctText(hit.entry.q);
        if (!locC || !srcC) {
          report.answers.uncomparable++;
        } else if (locC === srcC) {
          report.answers.ok++;
        } else {
          report.answers.wrong++;
          if (report.answers.samples.length < 25) {
            report.answers.samples.push({
              file,
              id,
              how: hit.how,
              srcId: hit.entry.id,
              note: "opts-not-permutation",
              localCorrect: locC.slice(0, 70),
              sourceCorrect: srcC.slice(0, 70),
            });
          }
        }
      } else {
        const locC = correctText(q);
        const srcC = correctText(hit.entry.q);
        if (!locC || !srcC) {
          report.answers.uncomparable++;
        } else if (locC === srcC) {
          report.answers.ok++;
        } else {
          report.answers.wrong++;
          if (report.answers.samples.length < 25) {
            report.answers.samples.push({
              file,
              id,
              how: hit.how,
              srcId: hit.entry.id,
              localCorrect: locC.slice(0, 70),
              sourceCorrect: srcC.slice(0, 70),
            });
          }
        }
      }
    }
  }

  // summarize structure by type
  const structByType = {};
  for (const iss of report.structure.issues) {
    structByType[iss.type] = (structByType[iss.type] || 0) + 1;
  }
  report.structure.byType = structByType;
  report.structure.issueCount = report.structure.issues.length;
  report.structure.issueSamples = report.structure.issues.slice(0, 40);

  report.verdict = {
    izohClean: report.izoh.wrong === 0,
    answersClean: report.answers.wrong === 0,
    structureClean: report.structure.issueCount === 0,
    allMatched: report.match.unmatched === 0,
    ok:
      report.izoh.wrong === 0 &&
      report.answers.wrong === 0 &&
      report.structure.issueCount === 0,
  };

  const outPath = path.join(__dirname, "_audit-variants-full-report.json");
  fs.writeFileSync(outPath, JSON.stringify(report, null, 2), "utf8");

  if (AS_JSON) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    console.log(
      JSON.stringify(
        {
          verdict: report.verdict,
          source: report.source,
          local: report.local,
          match: report.match,
          izoh: {
            ok: report.izoh.ok,
            wrong: report.izoh.wrong,
            missingInSrc: report.izoh.missingInSrc,
            samples: report.izoh.samples.slice(0, 10),
          },
          answers: {
            ok: report.answers.ok,
            wrong: report.answers.wrong,
            uncomparable: report.answers.uncomparable,
            samples: report.answers.samples.slice(0, 10),
          },
          structure: {
            okQuestions: report.structure.ok,
            issueCount: report.structure.issueCount,
            byType: report.structure.byType,
            samples: report.structure.issueSamples.slice(0, 15),
          },
          unmatchedSamples: report.unmatchedSamples.slice(0, 15),
          reportFile: outPath,
        },
        null,
        2
      )
    );
  }

  process.exit(report.verdict.ok ? 0 : 2);
}

main();
