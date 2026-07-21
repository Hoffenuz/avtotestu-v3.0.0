/**
 * Full language / excess-text / mix audit for quiz content.
 * Checks uz_lat / uz_cyr / ru do not mix scripts wrongly,
 * no leftover Russian translit in Latin, no duplicate excess paragraphs.
 *
 *   node scripts/audit-lang-quality.cjs
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const PUBLIC = path.join(ROOT, "public");

const CYR = /[\u0400-\u04FF]/;
const LAT = /[A-Za-z]/;
// Cyrillic letters allowed in Latin as diagram labels (and similar)
const LABEL_ONLY =
  /^[\s«»"'\-–—.,;:!?()0-9A-Za-zАБВГДЕЖЗИКЛМНОПРСТУФХЦЧШЩЭЮЯабвгдежзиклмнопрстуфхцчшщэюя]*$/;

const RU_TRANSLIT =
  /\b(Ob['’]?yasneniye|Soglasno|punktu|Pravil|dorojnogo|dvijeniya|voditel|doljen|soblyudat|prilojeniya|razdela|Vnimaniye|znaka?)\b/i;

const RU_WORDS_IN_LAT =
  /\b(i|и)\s+\d+\.\d+|\bсогласно\b|\bпункт\b|\bправил\b|\bводитель\b/i;

const EXCESS = [
  { id: "dup_sentence", test: (s) => hasDupSentence(s) },
  { id: "ob_yasneniye", re: /Ob['’]?yasneniye|Объяснение|Обяснение/i },
  { id: "double_dan", re: /\bdan\s+dan\b|\bдан\s+дан\b/i },
  { id: "double_word", re: /\b([A-Za-zА-Яа-яЎўҚқҒғҲҳ']{4,})\s+\1\b/i },
];

function hasDupSentence(s) {
  const parts = (s || "")
    .split(/[.!?]\s+/)
    .map((x) => x.trim().toLowerCase())
    .filter((x) => x.length > 40);
  const seen = new Set();
  for (const p of parts) {
    if (seen.has(p)) return true;
    seen.add(p);
  }
  return false;
}

function stripLabels(s) {
  // remove quoted diagram letters and lone А/Б/В/Г... tokens
  return (s || "")
    .replace(/[«»"']\s*[АБВГДЕЖЗИКЛМНОПРСТУФХЦЧШЩЭЮЯA-Za-z]\s*[«»"']/g, " ")
    .replace(/(^|[\s,;])[АБВГДЕ](?=[\s,;.]|$)/g, " ")
    .replace(/\b[ABCDE]\b/g, " ");
}

function cyrRatio(s) {
  const t = s || "";
  let c = 0,
    l = 0;
  for (const ch of t) {
    if (CYR.test(ch)) c++;
    else if (LAT.test(ch)) l++;
  }
  const n = c + l;
  return n ? c / n : 0;
}

function latRatio(s) {
  return 1 - cyrRatio(s);
}

function collectFiles() {
  const files = [];
  const add = (rel) => {
    const p = path.join(PUBLIC, rel);
    if (fs.existsSync(p)) files.push({ rel, p });
  };
  add("barcha.json");
  add("barcha-uz-lat.json");
  add("barcha-uz-cyr.json");
  add("barcha-ru.json");
  add("600.json");
  const vdir = path.join(PUBLIC, "data", "variants");
  for (const f of fs.readdirSync(vdir).filter((x) => /^v\d+\.json$/.test(x))) {
    files.push({ rel: `data/variants/${f}`, p: path.join(vdir, f) });
  }
  const mdir = path.join(PUBLIC, "mavzuli2");
  for (const f of fs.readdirSync(mdir).filter((x) => x.endsWith(".json"))) {
    files.push({ rel: `mavzuli2/${f}`, p: path.join(mdir, f) });
  }
  return files;
}

function auditQuestion(q, fileRel, issues) {
  const id = q.task_info?.global_id || "?";
  const push = (type, field, sample, severity = "med") => {
    issues.push({
      severity,
      type,
      id,
      file: fileRel,
      field,
      sample: String(sample || "").slice(0, 140),
    });
  };

  for (const lang of ["uz_lat", "uz_cyr", "ru"]) {
    const block = q.content?.[lang];
    if (!block) continue;
    const texts = [block.text, ...(block.options || []).map((o) => o.text)].filter(
      Boolean
    );
    for (const t of texts) {
      const field = `content.${lang}`;
      if (lang === "uz_lat") {
        const cleaned = stripLabels(t);
        const cr = cyrRatio(cleaned);
        // Allow small Cyrillic (YHQ stays Latin letters mostly). Flag if >8% Cyrillic after labels stripped
        if (cr > 0.08 && CYR.test(cleaned)) {
          // ignore if only a few Cyrillic chars in otherwise Latin (e.g. residual)
          const cyrChars = (cleaned.match(/[\u0400-\u04FF]/g) || []).length;
          if (cyrChars >= 4) {
            push("lat_has_cyrillic", field, t, cyrChars >= 12 ? "high" : "low");
          }
        }
        if (RU_TRANSLIT.test(t) || RU_WORDS_IN_LAT.test(t)) {
          push("lat_russian_leftover", field, t, "high");
        }
      }
      if (lang === "uz_cyr") {
        const lr = latRatio(t);
        // Cyrillic field with lots of Latin prose
        if (lr > 0.35 && LAT.test(t)) {
          const latChars = (t.match(/[A-Za-z]/g) || []).length;
          // allow YHQ, M1, webp-like codes, Latin option letters A/B
          if (latChars >= 20) push("cyr_has_latin_prose", field, t, "med");
        }
      }
      if (lang === "ru") {
        const lr = latRatio(t);
        if (lr > 0.4) {
          const latChars = (t.match(/[A-Za-z]/g) || []).length;
          if (latChars >= 25) push("ru_has_latin_prose", field, t, "med");
        }
      }
      for (const ex of EXCESS) {
        if (ex.re && ex.re.test(t)) push(ex.id, field, t, "med");
        if (ex.test && ex.test(t)) push(ex.id, field, t, "low");
      }
    }

    const opts = block.options || [];
    const corrects = opts.filter((o) => o.is_correct);
    if (opts.length && corrects.length === 0) {
      push("no_correct", `content.${lang}`, "", "high");
    }
    if (corrects.length > 1) push("multi_correct", `content.${lang}`, "", "high");
    for (const o of opts) {
      if (!(o.text || "").trim()) push("empty_option", `content.${lang}`, "", "high");
      const open = ((o.text || "").match(/«/g) || []).length;
      const close = ((o.text || "").match(/»/g) || []).length;
      if (open !== close) push("unbalanced_quotes", `content.${lang}`, o.text, "high");
    }
  }

  for (const lang of ["uz_lat", "uz_cyr", "ru"]) {
    const iz = q.izoh?.[lang];
    if (iz == null) continue;
    if (!String(iz).trim()) {
      push("empty_izoh", `izoh.${lang}`, "", "high");
      continue;
    }
    if (lang === "uz_lat") {
      if (RU_TRANSLIT.test(iz) || RU_WORDS_IN_LAT.test(iz)) {
        push("lat_russian_leftover", "izoh.uz_lat", iz, "high");
      }
      const cleaned = stripLabels(iz);
      const cr = cyrRatio(cleaned);
      const cyrChars = (cleaned.match(/[\u0400-\u04FF]/g) || []).length;
      if (cr > 0.08 && cyrChars >= 8) {
        push("lat_has_cyrillic", "izoh.uz_lat", iz, "high");
      }
      // Latin izoh that is mostly Russian Cyrillic
      if (cyrRatio(iz) > 0.5 && (iz.match(/[\u0400-\u04FF]/g) || []).length > 40) {
        push("lat_izoh_mostly_cyrillic", "izoh.uz_lat", iz, "high");
      }
    }
    if (lang === "uz_cyr") {
      const latChars = (iz.match(/[A-Za-z]/g) || []).length;
      // allow YHQ acronym
      const withoutYhq = iz.replace(/\bYHQ\b/g, "").replace(/\bM\d\b/g, "");
      if ((withoutYhq.match(/[A-Za-z]/g) || []).length >= 30) {
        push("cyr_izoh_latin_prose", "izoh.uz_cyr", iz, "med");
      }
    }
    for (const ex of EXCESS) {
      if (ex.re && ex.re.test(iz)) push(ex.id, `izoh.${lang}`, iz, "med");
      if (ex.test && ex.test(iz)) push(ex.id, `izoh.${lang}`, iz, "low");
    }
  }
}

function main() {
  const issues = [];
  let questions = 0;
  for (const { rel, p } of collectFiles()) {
    let data;
    try {
      data = JSON.parse(fs.readFileSync(p, "utf8"));
    } catch {
      continue;
    }
    if (!Array.isArray(data)) continue;
    for (const q of data) {
      if (!q?.content && !q?.izoh) continue;
      questions++;
      auditQuestion(q, rel, issues);
    }
  }

  // dedupe identical type+id+field
  const seen = new Set();
  const uniq = [];
  for (const i of issues) {
    const k = `${i.type}|${i.id}|${i.field}|${i.sample.slice(0, 40)}`;
    if (seen.has(k)) continue;
    seen.add(k);
    uniq.push(i);
  }

  const byType = {};
  const bySev = { high: 0, med: 0, low: 0 };
  for (const i of uniq) {
    byType[i.type] = (byType[i.type] || 0) + 1;
    bySev[i.severity] = (bySev[i.severity] || 0) + 1;
  }

  const high = uniq.filter((i) => i.severity === "high");
  const med = uniq.filter((i) => i.severity === "med");

  const report = {
    scannedQuestions: questions,
    issueCount: uniq.length,
    bySeverity: bySev,
    byType,
    high: high.slice(0, 80),
    medSample: med.slice(0, 40),
    verdict:
      high.length === 0
        ? "OK_FOR_RELEASE"
        : high.length <= 5
          ? "MINOR_FIXES"
          : "NEEDS_WORK",
  };

  const out = path.join(__dirname, "_lang-quality-report.json");
  fs.writeFileSync(out, JSON.stringify(report, null, 2));
  console.log(JSON.stringify({
    scannedQuestions: report.scannedQuestions,
    issueCount: report.issueCount,
    bySeverity: report.bySev || report.bySeverity,
    byType: report.byType,
    verdict: report.verdict,
    highCount: high.length,
    highPreview: high.slice(0, 25).map((i) => ({
      id: i.id,
      type: i.type,
      field: i.field,
      file: i.file,
      sample: i.sample.slice(0, 90),
    })),
    reportFile: out,
  }, null, 2));
}

main();
