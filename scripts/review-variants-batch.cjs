/**
 * Human-like batch review for variants.
 * Checks structure + content heuristics; dumps flags for manual read.
 *
 *   node scripts/review-variants-batch.cjs 1 20
 *   node scripts/review-variants-batch.cjs 21 40
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const DST = path.join(ROOT, "public", "data", "variants");
const from = Number(process.argv[2] || 1);
const to = Number(process.argv[3] || 20);

const APOS = /[\u2018\u2019\u02BB\u02BC'\u00AB\u00BB\u201C\u201D]/g;
function soft(s) {
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
  return soft(s)
    .split(" ")
    .filter((w) => w.length > 3);
}

function overlap(a, b) {
  const A = new Set(tokens(a));
  const B = tokens(b);
  if (!A.size || !B.length) return 0;
  let n = 0;
  for (const w of B) if (A.has(w)) n++;
  return n / Math.min(A.size, 12);
}

function correctOpt(q, lang) {
  return (q.content?.[lang]?.options || []).find((o) => o.is_correct) || null;
}

function reviewOne(q, file) {
  const flags = [];
  const id = q.task_info?.global_id || "?";
  const lat = q.content?.uz_lat;
  const cyr = q.content?.uz_cyr;
  const ru = q.content?.ru;
  const iz = q.izoh || {};

  // structure
  for (const lang of ["uz_lat", "uz_cyr", "ru"]) {
    const block = q.content?.[lang];
    if (!block?.text?.trim()) flags.push({ type: "empty-text", lang });
    const opts = block?.options || [];
    const corrects = opts.filter((o) => o.is_correct);
    if (corrects.length !== 1) flags.push({ type: "correct-count", lang, n: corrects.length });
    const texts = opts.map((o) => soft(o.text));
    const dup = texts.filter((t, i) => t && texts.indexOf(t) !== i);
    if (dup.length) flags.push({ type: "dup-options", lang });
  }

  if (!(iz.uz_lat || "").trim()) flags.push({ type: "empty-izoh-lat" });
  if (!(iz.uz_cyr || "").trim()) flags.push({ type: "empty-izoh-cyr" });
  if (!(iz.ru || "").trim()) flags.push({ type: "empty-izoh-ru" });

  const ruIz = iz.ru || "";
  if (
    /Гражданский кодекс|ГК РФ|Генеральному соглаш|Генеральному договор|МПК|Уголовн|РКИК ООН|к ООН|Глава \d+ ООН|о гражданском процессе|по гражданскому процессу/i.test(
      ruIz
    )
  ) {
    flags.push({ type: "bad-legal-name-ru" });
  }
  if (/семейного кодекс/i.test(ruIz)) flags.push({ type: "suspicious-code-ru" });

  // izoh too short vs question complexity
  if ((iz.uz_lat || "").trim().length < 40) flags.push({ type: "short-izoh-lat", len: (iz.uz_lat || "").length });
  if ((iz.ru || "").trim().length > 0 && (iz.ru || "").trim().length < 40) {
    flags.push({ type: "short-izoh-ru", len: (iz.ru || "").length });
  }

  // answer vs izoh keyword overlap (lat)
  const latC = correctOpt(q, "uz_lat");
  if (latC && iz.uz_lat) {
    const ov = overlap(latC.text + " " + (lat?.text || ""), iz.uz_lat);
    // very low overlap can be OK for definition questions; only flag extreme
    if (ov === 0 && tokens(latC.text).length >= 2 && tokens(iz.uz_lat).length >= 8) {
      // check if izoh mentions numbers from answer
      const nums = (latC.text.match(/\d+(?:[.,]\d+)?/g) || []).map((x) => x.replace(",", "."));
      const izHasNum = nums.some((n) => (iz.uz_lat || "").includes(n));
      if (!izHasNum && nums.length) flags.push({ type: "izoh-misses-answer-number", ans: latC.text.slice(0, 50) });
    }
  }

  // RU correct semantic color mismatch (simple)
  const ruC = correctOpt(q, "ru");
  if (latC && ruC) {
    const pairs = [
      [/yashil/, /зелен/],
      [/^qizil\b|\bqizil avtomobil/, /красн/],
      [/ko['’]?k avtomobil|^kok /, /син/],
    ];
    for (const [latRe, ruRe] of pairs) {
      if (latRe.test(soft(latC.text)) && !ruRe.test(soft(ruC.text))) {
        // only if another RU option has the color
        const better = (ru?.options || []).find((o) => ruRe.test(soft(o.text)));
        if (better && better.id !== ruC.id) {
          flags.push({
            type: "ru-correct-color-mismatch",
            lat: latC.text.slice(0, 40),
            ru: ruC.text.slice(0, 40),
            better: better.text.slice(0, 40),
          });
        }
      }
    }
  }

  // known mismatch pattern: registration vs definition
  if (
    /ro['’]?yxatdan|royxatdan|xarid qilgan/i.test(lat?.text || "") &&
    /mexanik transport vositasi\s*[—–-]/i.test(iz.uz_lat || "") &&
    !/10\s*kun|ro['’]?yxat/i.test(iz.uz_lat || "")
  ) {
    flags.push({ type: "izoh-topic-mismatch-registration" });
  }

  // M3 question with only M2 in izoh
  if (/\bM3\b/.test(lat?.text || "") && /\bM2\b/.test(iz.uz_lat || "") && !/\bM3\b/.test(iz.uz_lat || "")) {
    if (/lyuft|lyuft|люфт/i.test(lat?.text || "") || /lyuft|люфт/i.test(iz.uz_lat || "")) {
      flags.push({ type: "izoh-m3-says-m2-only" });
    }
  }

  return {
    id,
    file,
    flags,
    preview: {
      q: (lat?.text || "").slice(0, 90),
      ans: (latC?.text || "").slice(0, 60),
      iz: (iz.uz_lat || "").slice(0, 100),
      ruIz: (iz.ru || "").slice(0, 80),
    },
  };
}

function main() {
  const results = [];
  let total = 0;
  const byType = {};

  for (let i = from; i <= to; i++) {
    const file = `v${i}.json`;
    const p = path.join(DST, file);
    if (!fs.existsSync(p)) continue;
    const arr = JSON.parse(fs.readFileSync(p, "utf8"));
    for (const q of arr) {
      total++;
      const r = reviewOne(q, file);
      if (r.flags.length) {
        results.push(r);
        for (const f of r.flags) byType[f.type] = (byType[f.type] || 0) + 1;
      }
    }
  }

  const report = {
    range: { from, to },
    total,
    flagged: results.length,
    byType,
    items: results,
  };
  const out = path.join(__dirname, `_review-batch-v${from}-v${to}.json`);
  fs.writeFileSync(out, JSON.stringify(report, null, 2), "utf8");
  console.log(
    JSON.stringify(
      {
        range: report.range,
        total,
        flagged: results.length,
        byType,
        out,
        top: results.slice(0, 25).map((r) => ({
          id: r.id,
          flags: r.flags.map((f) => f.type),
          q: r.preview.q,
        })),
      },
      null,
      2
    )
  );
}

main();
