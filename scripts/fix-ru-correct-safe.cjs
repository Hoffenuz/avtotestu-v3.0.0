/**
 * Safe RU is_correct realignment — no MT for decisions.
 * Fixes only high-confidence mismatches:
 *   1) Color / vehicle order keywords
 *   2) Letter options (A/B/C/D ↔ А/Б/В/Г/C)
 *   3) Shared number+unit answers (mm, m, soat, …)
 *   4) Explicit bilingual phrase map
 *
 *   node scripts/fix-ru-correct-safe.cjs
 *   node scripts/fix-ru-correct-safe.cjs --apply
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const DST_DIR = path.join(ROOT, "public", "data", "variants");
const APPLY = process.argv.includes("--apply");
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

/** Extract answer letter like "faqat a", "только «б»" → "a"|"b"|... */
function letterKey(text) {
  const s = soft(text);
  // single letter
  if (/^(faqat|только|только)\s*[aабвгдеcсdдgг]$/i.test(s.replace(/\s+/g, " "))) {
    /* fallthrough */
  }
  const m = s.match(/(?:faqat|только)\s*([aабвгдеcсdдgгb])\b/) || s.match(/^([aабвгдеcсdдgгb])$/);
  if (!m) {
    // "faqat a va b" style — keep full normalized letter set
    const letters = [...s.matchAll(/\b([aабвгдеcсdдgгb])\b/g)].map((x) => mapLetter(x[1]));
    if (letters.length >= 1 && /faqat|только/.test(s)) {
      return "set:" + [...new Set(letters)].sort().join("");
    }
    return null;
  }
  return mapLetter(m[1]);
}

function mapLetter(ch) {
  const c = soft(ch);
  if (c === "a" || c === "а") return "a";
  if (c === "b" || c === "б" || c === "в") return "b"; // В sometimes used for B
  if (c === "c" || c === "с" || c === "ц") return "c";
  if (c === "d" || c === "д") return "d";
  if (c === "g" || c === "г" || c === "e" || c === "е") return "g";
  return c;
}

function numberKey(text) {
  const s = soft(text);
  const nums = s.match(/\d+(?:[.,]\d+)?/g);
  if (!nums || !nums.length) return null;
  const unit =
    (s.match(/\b(mm|см|sm|m|м|km|км|soat|час|часа|ch|%|t|т)\b/) || [])[1] || "";
  return nums.map((n) => n.replace(",", ".")).join("|") + "::" + unit;
}

/** Keyword bags: LAT token → RU tokens that must appear in correct RU option */
const KW = [
  { lat: [/yashil/], ru: [/зелен/], ban: [/красн|син|желт|бел|oq|белый/], requireAllLatAbsent: [/va |,|kok|qizil|oq|sariq/] },
  { lat: [/^qizil avtomobil$/], ru: [/красн/], ban: [/зелен|син/] },
  { lat: [/^ko['’`ʻ]?k avtomobil$/, /^kok avtomobil$/], ru: [/син/], ban: [/зелен|красн/] },
  { lat: [/^sariq/], ru: [/желт|жёлт/] },
  {
    lat: [/^tramvay\s+qizil\s+yashil\s+kok/],
    ru: [/^трамва.*красн.*зелен.*син/],
    ban: [/^красн/],
  },
  { lat: [/o['’]?ng\s+bo['’]?lakdan$/, /ong bolakdan/], ru: [/с правой полос|правой полосы/], ban: [/средн/] },
  { lat: [/o['’]?rta\s+bo['’]?lak/], ru: [/средн.*полос/] },
  {
    lat: [/^o['’]?ngga\s+birinchi\s+yo/, /^ongga\s+birinchi\s+yo/],
    ru: [/направо в первый проезд$|направо в первое направлен/],
    ban: [/втор|прям|и первый/],
  },
  {
    lat: [/birinchi\s+yo/, /birinchi\s+pro/],
    ru: [/перв.*(проезд|направлен|полос)/],
    ban: [/втор/],
    requireAllLatAbsent: [/ikkinchi/, /togriga/, /to['’]?g['’]?riga/],
  },
  {
    lat: [/ikkinchi\s+yo/, /ikkinchi\s+pro/],
    ru: [/втор.*(проезд|направлен|полос)/],
    ban: [/перв/],
  },
  { lat: [/sun['’]?iy|notekis/], ru: [/искусственн|неровн/], ban: [/подъ|мост/] },
  { lat: [/balandlik|tik\s+baland/], ru: [/крутой подъ|подъём|подъем/] },
  { lat: [/ko['’]?tarma\s+ko['’]?prik|kotarma/], ru: [/разводн|подъемн.*мост|подъёмн.*мост/] },
  { lat: [/^taqiqlanadi$/], ru: [/^запрещается$|^запрещено$/] },
  { lat: [/^ruxsat etiladi$/], ru: [/^разрешается$|^разрешено$/] },
];

function keywordHints(latText) {
  const s = soft(latText);
  const rules = [];
  for (const row of KW) {
    if (!row.lat.some((re) => re.test(s))) continue;
    if (row.requireAllLatAbsent && row.requireAllLatAbsent.some((re) => re.test(s))) continue;
    rules.push(row);
  }
  return rules;
}

function optionMatchesRule(ruText, row) {
  const s = soft(ruText);
  if (!row.ru.some((re) => re.test(s))) return false;
  if (row.ban && row.ban.some((re) => re.test(s))) return false;
  return true;
}

function findByHints(ruOpts, rules) {
  if (!rules.length) return null;
  // Try each rule independently (most recently added / longer patterns first)
  const ranked = [...rules].reverse();
  for (const row of ranked) {
    const hits = ruOpts.filter((o) => optionMatchesRule(o.text, row));
    if (hits.length === 1) return hits[0];
  }
  // Fallback: AND all rules
  const hits = ruOpts.filter((o) => rules.every((row) => optionMatchesRule(o.text, row)));
  return hits.length === 1 ? hits[0] : null;
}

function findByLetter(ruOpts, key) {
  if (!key) return null;
  const hits = ruOpts.filter((o) => letterKey(o.text) === key);
  return hits.length === 1 ? hits[0] : null;
}

function findByNumber(ruOpts, key) {
  if (!key) return null;
  const hits = ruOpts.filter((o) => numberKey(o.text) === key);
  return hits.length === 1 ? hits[0] : null;
}

function setCorrect(opts, id) {
  let changed = false;
  for (const o of opts) {
    const should = o.id === id;
    if (!!o.is_correct !== should) {
      o.is_correct = should;
      changed = true;
    }
  }
  return changed;
}

function resolveTarget(latC, ruOpts) {
  // 1) letters
  const lk = letterKey(latC.text);
  const byL = findByLetter(ruOpts, lk);
  if (byL) return { opt: byL, how: "letter", key: lk };

  // 2) numbers/units
  const nk = numberKey(latC.text);
  const byN = findByNumber(ruOpts, nk);
  if (byN) return { opt: byN, how: "number", key: nk };

  // 3) keyword bags (must be unique match)
  const hints = keywordHints(latC.text);
  const byK = findByHints(ruOpts, hints);
  if (byK) return { opt: byK, how: "keyword", hints: hints.length };

  return null;
}

function main() {
  const stats = {
    total: 0,
    alreadyOk: 0,
    fixed: 0,
    skippedNoRule: 0,
    samples: [],
  };
  const filesWritten = [];

  for (let i = 1; i <= 63; i++) {
    const file = `v${i}.json`;
    const p = path.join(DST_DIR, file);
    const arr = JSON.parse(fs.readFileSync(p, "utf8"));
    let changed = false;

    for (const q of arr) {
      stats.total++;
      const latC = (q.content?.uz_lat?.options || []).find((o) => o.is_correct);
      const ruOpts = q.content?.ru?.options || [];
      const ruC = ruOpts.find((o) => o.is_correct);
      if (!latC || !ruOpts.length) {
        stats.skippedNoRule++;
        continue;
      }

      const hit = resolveTarget(latC, ruOpts);
      if (!hit) {
        stats.skippedNoRule++;
        continue;
      }

      if (ruC && ruC.id === hit.opt.id) {
        stats.alreadyOk++;
        continue;
      }

      stats.fixed++;
      if (stats.samples.length < 40) {
        stats.samples.push({
          id: q.task_info?.global_id,
          how: hit.how,
          lat: latC.text.slice(0, 55),
          from: ruC ? `${ruC.id}:${ruC.text.slice(0, 45)}` : "none",
          to: `${hit.opt.id}:${hit.opt.text.slice(0, 45)}`,
        });
      }

      if (APPLY && setCorrect(ruOpts, hit.opt.id)) changed = true;
    }

    if (APPLY && changed) {
      fs.writeFileSync(p, JSON.stringify(arr, null, 4) + "\n", "utf8");
      filesWritten.push(file);
    }
  }

  const report = { mode: APPLY ? "apply" : "dry-run", stats, filesWritten };
  fs.writeFileSync(path.join(__dirname, "_fix-ru-safe-report.json"), JSON.stringify(report, null, 2), "utf8");
  console.log(JSON.stringify(report, null, 2));
}

main();
