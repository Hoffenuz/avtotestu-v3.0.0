/**
 * Final guarantee audit for Latin-A/B/C-on-image letter bugs.
 */
const fs = require("fs");
const path = require("path");

const LATIN_FIXED = {
  t_28_q_8: "u311uz.webp",
  t_28_q_14: "u317uz.webp",
  t_14_q_9: "u156uz.webp",
  t_46_q_8: "u529uz.webp",
  t_57_q_5: "u656uz.webp",
  t_54_q_9: "u623uz.webp",
  t_20_q_4: "u219uz.webp",
  t_52_q_3: "u591uz.webp",
  t_2_q_19: "u18uz.webp",
  t_4_q_1: "u29uz.webp",
  t_9_q_19: "u101uz.webp",
  t_26_q_15: "u290uz.webp",
  t_38_q_19: "u440uz.webp",
  t_44_q_20: "u515uz.webp",
  t_46_q_4: "u527uz.webp",
  t_13_q_12: "u143uz.webp",
};

// Images verified Cyrillic А/Б/В(/Г) on media — V/G in LAT is OK
const CYR_IMAGE = new Set([
  "u7uz.webp", "u14uz.webp", "u35uz.webp", "u68uz.webp", "u72uz.webp", "u76uz.webp",
  "u124uz.webp", "u169uz.webp", "u170uz.webp", "u176uz.webp", "u185uz.webp", "u187uz.webp",
  "u211uz.webp", "u267uz.webp", "u296uz.webp", "u314uz.webp", "u322uz.webp", "u506uz.webp",
  "u514uz.webp", "u525uz.webp", "u550uz.webp", "u604uz.webp", "u605uz.webp", "u658uz.webp",
]);

function load(id) {
  const m = id.match(/^t_(\d+)/);
  return JSON.parse(fs.readFileSync(`public/data/variants/v${m[1]}.json`, "utf8")).find(
    (x) => x.task_info.global_id === id
  );
}

function line(q, L) {
  return q.content[L].options.map((o) => (o.is_correct ? "*" : "") + o.text).join(" | ");
}

function find(fp, id) {
  if (!fs.existsSync(fp)) return null;
  return JSON.parse(fs.readFileSync(fp, "utf8")).find((x) => x.task_info?.global_id === id);
}

function isLetterOpt(t) {
  t = (t || "").trim();
  if (!t || t.length > 40) return false;
  return /^(?:Faqat|Фақат|Только|Xammasi|Ҳаммаси|Hammasi|Barchasi|Барчаси|Все)?\s*[«"„"]?[ABCGVSDАБВГДС][»"“"]?(?:\s*(?:va|и|,|\/|i)\s*[«"„"]?[ABCGVSDАБВГДС][»"“"]?)*$/iu.test(
    t
  ) || /^[«"„"]?[ABCGVSDАБВГДС][»"“"]?(?:\s*(?:va|и|,)\s*[«"„"]?[ABCGVSDАБВГДС][»"“"]?)+$/iu.test(t);
}

function hasCyrLetterToken(t) {
  return /(?<![A-Za-zА-Яа-яЁё])[АБВГДС](?![A-Za-zА-Яа-яЁё])/.test(t);
}
function hasLatLetterToken(t) {
  return /(?<![A-Za-zА-Яа-яЁё])[ABCGVSD](?![A-Za-zА-Яа-яЁё])/.test(t);
}
function hasSToken(t) {
  return /(?<![A-Za-zА-Яа-яЁё])S(?![A-Za-zА-Яа-яЁё])/.test(t);
}

console.log("=== 1) LATIN-FIXED sync + no S/V/cyr-letter labels ===\n");
const syncFail = [];
const contentFail = [];
for (const [id, media] of Object.entries(LATIN_FIXED)) {
  const q = load(id);
  if (q.media_url !== media) contentFail.push(`${id} media ${q.media_url}!=${media}`);
  for (const L of ["uz_lat", "uz_cyr", "ru"]) {
    for (const o of q.content[L].options) {
      if (!isLetterOpt(o.text) && !/Faqat |Фақат |Только |A va|B va|A и|B и|A i /.test(o.text))
        continue;
      // check letter-bearing short options
      const looksLetter =
        isLetterOpt(o.text) ||
        /^(Faqat|Фақат|Только).*\b[ABCGVSDАБВГДС]\b/i.test(o.text) ||
        /\b[ABCGVSD]\b.*\b[ABCGVSD]\b/.test(o.text);
      if (!looksLetter) continue;
      if (hasSToken(o.text)) contentFail.push(`${id} ${L} has S: ${o.text}`);
      if (hasCyrLetterToken(o.text)) contentFail.push(`${id} ${L} has CYR letter: ${o.text}`);
      // V on latin ABC image is wrong (should be B or C)
      if (/(?<![A-Za-z])V(?![A-Za-z])/.test(o.text)) contentFail.push(`${id} ${L} has V: ${o.text}`);
    }
  }
  const places = [
    ["public/barcha.json", "full"],
    ["public/600.json", "full"],
    ["public/barcha-uz-lat.json", "uz_lat"],
    ["public/barcha-uz-cyr.json", "uz_cyr"],
    ["public/barcha-ru.json", "ru"],
  ];
  for (const [fp, mode] of places) {
    const oq = find(fp, id);
    if (!oq) {
      syncFail.push(`${id} missing ${fp}`);
      continue;
    }
    const langs = mode === "full" ? ["uz_lat", "uz_cyr", "ru"] : [mode];
    for (const L of langs) {
      if (line(q, L) !== line(oq, L)) syncFail.push(`${id} ${fp} ${L}`);
    }
  }
  console.log(id, "OK opts:", line(q, "uz_lat"));
}
console.log("contentFail", contentFail.length ? contentFail : "none");
console.log("syncFail", syncFail.length ? syncFail : "none");

console.log("\n=== 2) Any remaining S in letter-like options (excl known cyr) ===\n");
const sHits = [];
const crossHits = [];
for (let i = 1; i <= 63; i++) {
  const p = path.join("public/data/variants", `v${i}.json`);
  if (!fs.existsSync(p)) continue;
  for (const q of JSON.parse(fs.readFileSync(p, "utf8"))) {
    const id = q.task_info.global_id;
    const media = q.media_url || "";
    if (LATIN_FIXED[id]) continue;
    if (CYR_IMAGE.has(media)) continue;

    for (const L of ["uz_lat", "uz_cyr", "ru"]) {
      for (const o of q.content[L].options) {
        if (hasSToken(o.text) && (isLetterOpt(o.text) || /va S|и S|Faqat S|Фақат S|Только S|A va S|B va S/i.test(o.text))) {
          sHits.push({ id, media, L, t: o.text });
        }
      }
    }

    // LAT letter opts Latin-only, CYR/RU letter opts have Cyrillic letters
    const latLets = (q.content.uz_lat.options || []).filter(
      (o) => isLetterOpt(o.text) || /^(Faqat|Фақат).*\b[ABC]\b/.test(o.text)
    );
    const cyrLets = (q.content.uz_cyr.options || []).filter((o) => isLetterOpt(o.text));
    const ruLets = (q.content.ru.options || []).filter((o) => isLetterOpt(o.text));
    const latHasLat = latLets.some((o) => hasLatLetterToken(o.text));
    const latHasCyr = latLets.some((o) => hasCyrLetterToken(o.text));
    const cyrHasCyr = [...cyrLets, ...ruLets].some((o) => hasCyrLetterToken(o.text));
    if (latHasLat && !latHasCyr && cyrHasCyr && latLets.length) {
      crossHits.push({
        id,
        media,
        lat: line(q, "uz_lat"),
        cyr: line(q, "uz_cyr"),
        ru: line(q, "ru"),
      });
    }
  }
}

console.log("S hits:", sHits.length);
for (const h of sHits) console.log(h);
console.log("\ncross-lang (possible latin image unfixed):", crossHits.length);
for (const h of crossHits) {
  console.log(h.id, h.media);
  console.log("  L:", h.lat);
  console.log("  C:", h.cyr);
  console.log("  R:", h.ru);
}

// t_27_q_4 check (cyr image — should keep cyr)
const q27 = load("t_27_q_4");
console.log("\nt_27_q_4 (cyr image, should stay):", line(q27, "uz_lat"));

fs.writeFileSync(
  "scripts/_letter-guarantee-audit.json",
  JSON.stringify({ contentFail, syncFail, sHits, crossHits, latinFixed: Object.keys(LATIN_FIXED) }, null, 2)
);
