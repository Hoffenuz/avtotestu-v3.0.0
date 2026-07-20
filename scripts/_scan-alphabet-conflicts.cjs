/**
 * Strict scan: only short diagram-letter options; find alphabet conflicts.
 */
const fs = require("fs");
const path = require("path");

const LETTER = "[ABCGVSDАБВГДС]";
const LETTER_OPT = new RegExp(
  `^(?:Faqat|Фақат|Только|Xammasi|Ҳаммаси|Hammasi|Barchasi|Барчаси|Все)?\\s*[«"„]?${LETTER}[»"“]?(?:\\s*(?:va|и|,|\\/)\\s*[«"„]?${LETTER}[»"“]?)*$`,
  "iu"
);
const LETTER_OPT2 = new RegExp(
  `^[«"„]?${LETTER}[»"“]?(?:\\s*(?:va|и|,)\\s*[«"„]?${LETTER}[»"“]?)+$`,
  "iu"
);
const LETTER_ONLY = new RegExp(`^[«"„]?${LETTER}[»"“]?$`, "iu");
const LETTER_CSV = new RegExp(
  `^(?:Faqat|Фақат|Только)?\\s*[«"„]?${LETTER}[»"“]?(?:\\s*,\\s*[«"„]?${LETTER}[»"“]?)+$`,
  "iu"
);

function isLetterOption(text) {
  const t = (text || "").trim();
  if (!t || t.length > 40) return false;
  // skip long sentence options
  if (/\s{2,}|\.{2,}|trayektor|yo'nalishlarga|направлен/i.test(t) && t.length > 25)
    return false;
  return (
    LETTER_ONLY.test(t) ||
    LETTER_OPT.test(t) ||
    LETTER_OPT2.test(t) ||
    LETTER_CSV.test(t) ||
    /^(?:Faqat|Фақат|Только)\s+[ABCGVSDАБВГДС](\s*(?:va|и|,)\s*[ABCGVSDАБВГДС])*$/iu.test(
      t
    ) ||
    /^(?:A|B|C|G|V|S|А|Б|В|Г|Д)\s*(?:va|и)\s*(?:A|B|C|G|V|S|А|Б|В|Г|Д)/iu.test(t)
  );
}

function lettersIn(text) {
  return [...text.matchAll(new RegExp(LETTER, "gu"))].map((m) => m[0]);
}

function alpha(letter) {
  const c = letter.codePointAt(0);
  if (c >= 0x0410 && c <= 0x042f) return "cyr";
  if (/[ABCGVSD]/i.test(letter)) return "lat";
  return "?";
}

function optAlpha(letters) {
  const s = new Set(letters.map(alpha));
  if (s.has("lat") && s.has("cyr")) return "mixed";
  if (s.has("lat")) return "lat";
  if (s.has("cyr")) return "cyr";
  return "none";
}

const rows = [];
for (let i = 1; i <= 63; i++) {
  const p = path.join("public/data/variants", `v${i}.json`);
  if (!fs.existsSync(p)) continue;
  for (const q of JSON.parse(fs.readFileSync(p, "utf8"))) {
    const per = {};
    let anyLetter = false;
    for (const L of ["uz_lat", "uz_cyr", "ru"]) {
      const opts = (q.content?.[L]?.options || []).filter((o) =>
        isLetterOption(o.text)
      );
      if (opts.length) anyLetter = true;
      const lets = opts.flatMap((o) => lettersIn(o.text));
      per[L] = {
        alpha: optAlpha(lets),
        opts: opts.map((o) => (o.is_correct ? "*" : "") + o.text),
        all: (q.content?.[L]?.options || []).map(
          (o) => (o.is_correct ? "*" : "") + o.text
        ),
      };
    }
    if (!anyLetter) continue;
    const alphas = ["uz_lat", "uz_cyr", "ru"]
      .map((L) => per[L].alpha)
      .filter((a) => a !== "none");
    const uniq = new Set(alphas);
    const hasMixed = alphas.includes("mixed");
    if (uniq.size <= 1 && !hasMixed) continue;
    rows.push({
      id: q.task_info.global_id,
      media: q.media_url || "",
      lat: per.uz_lat.alpha,
      cyr: per.uz_cyr.alpha,
      ru: per.ru.alpha,
      letterOpts: {
        uz_lat: per.uz_lat.opts,
        uz_cyr: per.uz_cyr.opts,
        ru: per.ru.opts,
      },
      all: {
        uz_lat: per.uz_lat.all,
        uz_cyr: per.uz_cyr.all,
        ru: per.ru.all,
      },
    });
  }
}

fs.writeFileSync(
  "scripts/_letter-alphabet-conflicts.json",
  JSON.stringify(rows, null, 2)
);
console.log("strict conflicts", rows.length);
for (const r of rows) {
  console.log(`${r.id} ${r.media} lat=${r.lat} cyr=${r.cyr} ru=${r.ru}`);
  console.log("  L:", r.letterOpts.uz_lat.join(" | "));
  console.log("  C:", r.letterOpts.uz_cyr.join(" | "));
  console.log("  R:", r.letterOpts.ru.join(" | "));
}
