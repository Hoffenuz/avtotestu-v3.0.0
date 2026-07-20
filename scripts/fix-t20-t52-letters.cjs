/**
 * Fix t_20_q_4 + t_52_q_3 (Latin A/B/C on image), sync everywhere,
 * then audit remaining Latin-ABC vs letter-text mismatches.
 */
const fs = require("fs");
const path = require("path");

function O(id, text, ok) {
  return { id, text, is_correct: !!ok };
}

const FIX = {
  t_20_q_4: {
    // u219uz.webp Latin A B C; correct Faqat B
    uz_lat: [
      O(1, "Faqat A", 0),
      O(2, "Faqat B", 1),
      O(3, "Xammasi", 0),
      O(4, "B va C", 0),
    ],
    uz_cyr: [
      O(1, "Фақат A", 0),
      O(2, "Фақат B", 1),
      O(3, "Хаммаси", 0),
      O(4, "B ва C", 0),
    ],
    ru: [
      O(1, "Только A", 0),
      O(2, "Только B", 1),
      O(3, "Все", 0),
      O(4, "B и C", 0),
    ],
  },
  t_52_q_3: {
    // u591uz.webp Latin A B C; correct A va C
    uz_lat: [O(1, "B va C", 0), O(2, "A va C", 1), O(3, "A va B", 0)],
    uz_cyr: [O(1, "B ва C", 0), O(2, "A ва C", 1), O(3, "A ва B", 0)],
    ru: [O(1, "B и C", 0), O(2, "A и C", 1), O(3, "A и B", 0)],
  },
};

const changed = new Set();
for (let i = 1; i <= 63; i++) {
  const p = path.join("public/data/variants", `v${i}.json`);
  if (!fs.existsSync(p)) continue;
  const arr = JSON.parse(fs.readFileSync(p, "utf8"));
  let ch = false;
  for (const q of arr) {
    const id = q.task_info.global_id;
    if (!FIX[id]) continue;
    const f = FIX[id];
    for (const L of ["uz_lat", "uz_cyr", "ru"]) {
      const cur = q.content[L].options;
      const next = structuredClone(f[L]);
      if (cur.length === next.length) {
        for (let j = 0; j < next.length; j++) next[j].id = cur[j].id;
      }
      q.content[L].options = next;
    }
    changed.add(id);
    ch = true;
    console.log("fixed", id, q.media_url);
  }
  if (ch) fs.writeFileSync(p, JSON.stringify(arr, null, 4) + "\n");
}

function loadAll() {
  const byId = new Map();
  for (let i = 1; i <= 63; i++) {
    const p = path.join("public/data/variants", `v${i}.json`);
    if (!fs.existsSync(p)) continue;
    for (const q of JSON.parse(fs.readFileSync(p, "utf8"))) {
      byId.set(q.task_info.global_id, q);
    }
  }
  return byId;
}
const byId = loadAll();

function syncFile(rel, mode) {
  const fp = path.join("public", rel);
  if (!fs.existsSync(fp)) return 0;
  const arr = JSON.parse(fs.readFileSync(fp, "utf8"));
  let n = 0;
  for (const q of arr) {
    const id = q.task_info?.global_id;
    if (!changed.has(id)) continue;
    const src = byId.get(id);
    if (!src) continue;
    if (mode === "full") q.content = structuredClone(src.content);
    else if (mode === "lat") q.content.uz_lat = structuredClone(src.content.uz_lat);
    else if (mode === "cyr") q.content.uz_cyr = structuredClone(src.content.uz_cyr);
    else if (mode === "ru") q.content.ru = structuredClone(src.content.ru);
    n++;
  }
  if (n) fs.writeFileSync(fp, JSON.stringify(arr, null, 4) + "\n");
  return n;
}

console.log("barcha", syncFile("barcha.json", "full"));
console.log("600", syncFile("600.json", "full"));
console.log("lat", syncFile("barcha-uz-lat.json", "lat"));
console.log("cyr", syncFile("barcha-uz-cyr.json", "cyr"));
console.log("ru", syncFile("barcha-ru.json", "ru"));

let mav = 0;
for (const name of fs.readdirSync("public/mavzuli2").filter((f) => f.endsWith(".json"))) {
  const fp = path.join("public/mavzuli2", name);
  const arr = JSON.parse(fs.readFileSync(fp, "utf8"));
  let ch = false;
  for (const q of arr) {
    if (!changed.has(q.task_info?.global_id)) continue;
    const src = byId.get(q.task_info.global_id);
    if (!src) continue;
    q.content = structuredClone(src.content);
    ch = true;
    mav++;
  }
  if (ch) fs.writeFileSync(fp, JSON.stringify(arr, null, 4) + "\n");
}
console.log("mavzuli", mav);

// --- Audit: letter options with S/V or cross-lang alphabet conflict ---
function isLetterOpt(t) {
  t = (t || "").trim();
  if (!t || t.length > 36) return false;
  return /^(?:Faqat|Фақат|Только|Xammasi|Ҳаммаси|Hammasi|Barchasi|Барчаси|Все)?\s*[«"„]?[ABCGVSDАБВГДС][»"“]?(?:\s*(?:va|и|,|\/)\s*[«"„]?[ABCGVSDАБВГДС][»"“]?)*$/iu.test(
    t
  );
}

function letters(t) {
  return [...t.matchAll(/[ABCGVSDАБВГДС]/gu)].map((m) => m[0]);
}

function alpha(L) {
  const c = L.codePointAt(0);
  if (c >= 0x0410 && c <= 0x042f) return "cyr";
  return "lat";
}

const FIXED_OK = new Set([
  "t_28_q_8",
  "t_28_q_14",
  "t_14_q_9",
  "t_46_q_8",
  "t_57_q_5",
  "t_54_q_9",
  "t_27_q_4",
  "t_20_q_4",
  "t_52_q_3",
]);

// Known Cyrillic-on-image (V/G in LAT = В/Г) — NOT Latin-ABC bugs
const KNOWN_CYR_IMAGE = new Set([
  "u7uz.webp",
  "u14uz.webp",
  "u68uz.webp",
  "u72uz.webp",
  "u76uz.webp",
  "u124uz.webp",
  "u169uz.webp",
  "u170uz.webp",
  "u187uz.webp",
  "u211uz.webp",
  "u267uz.webp",
  "u296uz.webp",
  "u314uz.webp",
  "u322uz.webp",
  "u506uz.webp",
  "u514uz.webp",
  "u525uz.webp",
  "u550uz.webp",
  "u605uz.webp",
  "u604uz.webp",
  "u176uz.webp",
  "u185uz.webp",
  "u35uz.webp",
  "u658uz.webp",
]);

// Known Latin-ABC images already fixed
const KNOWN_LAT_IMAGE = new Set([
  "u311uz.webp",
  "u317uz.webp",
  "u156uz.webp",
  "u529uz.webp",
  "u656uz.webp",
  "u623uz.webp",
  "u219uz.webp",
  "u591uz.webp",
]);

const suspects = [];
for (let i = 1; i <= 63; i++) {
  const p = path.join("public/data/variants", `v${i}.json`);
  if (!fs.existsSync(p)) continue;
  for (const q of JSON.parse(fs.readFileSync(p, "utf8"))) {
    const id = q.task_info.global_id;
    const media = q.media_url || "";
    const per = {};
    let any = false;
    for (const L of ["uz_lat", "uz_cyr", "ru"]) {
      const opts = (q.content[L]?.options || []).filter((o) => isLetterOpt(o.text));
      if (opts.length) any = true;
      const lets = opts.flatMap((o) => letters(o.text));
      const alphas = new Set(lets.map(alpha));
      per[L] = {
        opts: opts.map((o) => (o.is_correct ? "*" : "") + o.text),
        all: (q.content[L]?.options || []).map((o) => (o.is_correct ? "*" : "") + o.text),
        mixed: alphas.has("lat") && alphas.has("cyr"),
        hasLat: alphas.has("lat"),
        hasCyr: alphas.has("cyr"),
        hasS: lets.some((x) => x === "S" || x === "s"),
        hasV: lets.some((x) => x === "V" || x === "v"),
      };
    }
    if (!any) continue;

    const reasons = [];
    // S in letter options usually means Latin-C mis-encoded (except rare)
    if (per.uz_lat.hasS || per.uz_cyr.hasS || per.ru.hasS) {
      if (!KNOWN_CYR_IMAGE.has(media)) reasons.push("has_S");
    }
    // Cross-lang: LAT latin letters but CYR/RU cyrillic letter labels on same Q
    if (
      per.uz_lat.hasLat &&
      !per.uz_lat.hasCyr &&
      (per.uz_cyr.hasCyr || per.ru.hasCyr) &&
      !KNOWN_CYR_IMAGE.has(media)
    ) {
      // If LAT uses A/B/C and CYR uses А/Б — conflict unless image cyr
      reasons.push("cross_lang_alphabet");
    }
    // Mixed alphabet inside one language's letter opts
    for (const L of ["uz_lat", "uz_cyr", "ru"]) {
      if (per[L].mixed) reasons.push(`mixed_in_${L}`);
    }
    // LAT has V while also has C nearby? or V on known latin media
    if (KNOWN_LAT_IMAGE.has(media) && (per.uz_lat.hasV || per.uz_lat.hasS)) {
      reasons.push("V_or_S_on_known_latin_image");
    }
    if (KNOWN_LAT_IMAGE.has(media) && (per.uz_cyr.hasCyr || per.ru.hasCyr)) {
      // Cyrillic letter labels on latin image — bad unless only in words
      const cyrLetterOpt = [...per.uz_cyr.opts, ...per.ru.opts].some((t) =>
        /[АБВГДС]/.test(t.replace(/Фақат|Только|Хаммаси|Барчаси|Все|ва|и/g, ""))
      );
      if (cyrLetterOpt) reasons.push("cyr_letters_on_latin_image");
    }

    if (!reasons.length) continue;
    if (FIXED_OK.has(id) && !reasons.includes("V_or_S_on_known_latin_image") && !reasons.includes("cyr_letters_on_latin_image") && !reasons.includes("has_S")) {
      // still flag if residual
    }
    suspects.push({
      id,
      media,
      reasons: [...new Set(reasons)],
      lat: per.uz_lat.all.join(" | "),
      cyr: per.uz_cyr.all.join(" | "),
      ru: per.ru.all.join(" | "),
      knownCyr: KNOWN_CYR_IMAGE.has(media),
      knownLat: KNOWN_LAT_IMAGE.has(media),
      fixed: FIXED_OK.has(id),
    });
  }
}

const real = suspects.filter((s) => {
  if (s.fixed && !s.reasons.some((r) => r.includes("V_or_S") || r.includes("cyr_letters") || r === "has_S"))
    return false;
  if (s.knownCyr && s.reasons.every((r) => r === "cross_lang_alphabet" || r.startsWith("mixed"))) {
    // Cyrillic image + LAT phonetic V/G is expected pattern — not a Latin-ABC bug
    // But mixed_in_lang still worth noting
    return s.reasons.some((r) => r.startsWith("mixed"));
  }
  return true;
});

fs.writeFileSync(
  "scripts/_letter-final-audit.json",
  JSON.stringify({ fixed: [...changed], suspects, real }, null, 2)
);

console.log("\n=== FIXED NOW ===");
for (const id of changed) {
  const q = byId.get(id);
  console.log(id);
  for (const L of ["uz_lat", "uz_cyr", "ru"]) {
    console.log(
      " ",
      L,
      q.content[L].options.map((o) => (o.is_correct ? "*" : "") + o.text).join(" | ")
    );
  }
}

console.log("\n=== REMAINING REAL SUSPECTS (Latin-ABC type) ===");
console.log("count", real.length);
for (const s of real) {
  console.log(s.id, s.media, s.reasons.join(","));
  console.log("  L:", s.lat);
  console.log("  C:", s.cyr);
  console.log("  R:", s.ru);
}
