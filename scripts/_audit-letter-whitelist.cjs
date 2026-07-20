/**
 * Audit letter-label questions: whitelist + Tip A V/S flags + sync across files.
 * Read-only report.
 */
const fs = require("fs");
const path = require("path");

function loadVariant(id) {
  const m = id.match(/^t_(\d+)/);
  const arr = JSON.parse(
    fs.readFileSync(`public/data/variants/v${m[1]}.json`, "utf8")
  );
  return arr.find((x) => x.task_info.global_id === id);
}

function optLine(q, L) {
  return (q.content[L]?.options || [])
    .map((o) => (o.is_correct ? "*" : "") + o.text)
    .join(" | ");
}

function findInArray(fp, id) {
  if (!fs.existsSync(fp)) return null;
  const arr = JSON.parse(fs.readFileSync(fp, "utf8"));
  return arr.find((x) => x.task_info?.global_id === id) || null;
}

const WHITELIST = [
  "t_28_q_8",
  "t_28_q_14",
  "t_14_q_9",
  "t_46_q_8",
  "t_57_q_5",
  "t_54_q_9",
  "t_27_q_4",
];

const EXPECT = {
  t_28_q_8: {
    media: "u311uz.webp",
    latHas: ["A va C", "Faqat A"],
    no: [/A va V/, /«В»/, /«Б»/],
    correct: /Faqat A|Фақат A|Только A/,
  },
  t_28_q_14: {
    media: "u317uz.webp",
    mustLatinABC: true,
    correct: /^A$/,
    no: [/«А»/, /«Б»/, /«В»/, /^В$/, /^Б$/],
  },
  t_14_q_9: {
    media: "u156uz.webp",
    mustLatinABC: true,
    correct: /^C$/,
    no: [/^S$/, /^V$/, /«/],
  },
  t_46_q_8: {
    media: "u529uz.webp",
    mustLatinABC: true,
    correct: /^B$/,
    no: [/^V$/, /^S$/, /A va S/],
  },
  t_57_q_5: {
    media: "u656uz.webp",
    mustLatinABC: true,
    correct: /^C$/,
    no: [/^S$/, /^V$/],
  },
  t_54_q_9: {
    media: "u623uz.webp",
    latHas: ["A", "B", "A va B"],
    no: [/«А»/, /«B»/, /«А» va/],
  },
  t_27_q_4: {
    media: "u296uz.webp",
    // Cyrillic on image
    hasCyr: true,
    no: [/«B»/, /Faqat «А» va «B»/],
  },
};

console.log("=== WHITELIST ===\n");
const syncIssues = [];
const contentIssues = [];

for (const id of WHITELIST) {
  const q = loadVariant(id);
  const exp = EXPECT[id];
  console.log("---", id, q.media_url, "---");
  for (const L of ["uz_lat", "uz_cyr", "ru"]) {
    console.log(L + ":", optLine(q, L));
  }

  if (exp.media && q.media_url !== exp.media) {
    contentIssues.push(`${id}: media ${q.media_url} != ${exp.media}`);
  }

  const allText = ["uz_lat", "uz_cyr", "ru"]
    .map((L) => optLine(q, L))
    .join("\n");

  if (exp.no) {
    for (const re of exp.no) {
      if (re.test(allText)) contentIssues.push(`${id}: forbidden pattern ${re}`);
    }
  }
  if (exp.mustLatinABC) {
    const latOpts = q.content.uz_lat.options.map((o) => o.text);
    const letterOpts = latOpts.filter((t) =>
      /^[ABC]$|^A va [BC]$|^A va C$|^B va C$/i.test(t.trim())
    );
    // check no Cyrillic letter labels in any lang for short options
    for (const L of ["uz_lat", "uz_cyr", "ru"]) {
      for (const o of q.content[L].options) {
        if (/[БВГ]/.test(o.text) && o.text.length <= 12) {
          contentIssues.push(`${id} ${L}: cyr letter in short opt "${o.text}"`);
        }
      }
    }
  }

  // sync check
  const places = [
    ["barcha.json", "full"],
    ["600.json", "full"],
    ["barcha-uz-lat.json", "uz_lat"],
    ["barcha-uz-cyr.json", "uz_cyr"],
    ["barcha-ru.json", "ru"],
  ];
  for (const [rel, mode] of places) {
    const oq = findInArray(path.join("public", rel), id);
    if (!oq) {
      syncIssues.push(`${id} missing in ${rel}`);
      continue;
    }
    const langs =
      mode === "full" ? ["uz_lat", "uz_cyr", "ru"] : [mode];
    for (const L of langs) {
      const a = optLine(q, L);
      const b = optLine(oq, L);
      if (a !== b) syncIssues.push(`${id} ${rel} ${L} DIFF\n  var: ${a}\n  file: ${b}`);
    }
  }
  // mavzuli
  let mavHit = 0;
  for (const name of fs.readdirSync("public/mavzuli2").filter((f) => f.endsWith(".json"))) {
    const oq = findInArray(path.join("public/mavzuli2", name), id);
    if (!oq) continue;
    mavHit++;
    for (const L of ["uz_lat", "uz_cyr", "ru"]) {
      const a = optLine(q, L);
      const b = optLine(oq, L);
      if (a !== b)
        syncIssues.push(`${id} mavzuli2/${name} ${L} DIFF`);
    }
  }
  console.log("mavzuli hits:", mavHit);
}

// Tip A: LAT still has standalone V or S as letter label (possible Latin-ABC image bugs)
console.log("\n=== TIP A scan (LAT has V/S letter labels) ===\n");
const tipA = [];
for (let i = 1; i <= 63; i++) {
  const p = `public/data/variants/v${i}.json`;
  if (!fs.existsSync(p)) continue;
  for (const q of JSON.parse(fs.readFileSync(p, "utf8"))) {
    const id = q.task_info.global_id;
    if (WHITELIST.includes(id)) continue;
    const lat = q.content?.uz_lat?.options || [];
    const joined = lat.map((o) => o.text).join(" || ");
    const hasVS =
      /(^|\s|va |и |,)(V|S)(\s|$|,|va |и )/i.test(joined) ||
      /\b(V|S)\b/.test(joined);
    const letterHeavy = lat.some((o) =>
      /^(Faqat |Фақат |Только )?([ABCGVSD]|[АБВГ])(\s*(va|и|,)\s*([ABCGVSD]|[АБВГ]))*$/i.test(
        o.text.trim()
      ) || /^[ABCGVSD]$/i.test(o.text.trim())
    );
    if (!hasVS || !letterHeavy) continue;
    // only if looks like diagram letters
    const shortLetter = lat.some(
      (o) =>
        /^[VSvs]$/.test(o.text.trim()) ||
        /^(A|B|C)?\s*va\s*[VS]$/i.test(o.text.trim()) ||
        /^(A|B)\s*va\s*[VS]$/i.test(o.text.trim()) ||
        /,\s*V\b/.test(o.text) ||
        /\bV\b/.test(o.text)
    );
    if (!shortLetter && !/\b[VS]\b/.test(joined)) continue;
    tipA.push({
      id,
      media: q.media_url || "",
      lat: optLine(q, "uz_lat"),
      cyr: optLine(q, "uz_cyr"),
      ru: optLine(q, "ru"),
    });
  }
}

for (const t of tipA) {
  console.log(t.id, t.media);
  console.log("  LAT:", t.lat);
  console.log("  CYR:", t.cyr);
  console.log("  RU :", t.ru);
}

console.log("\n=== ISSUES ===");
console.log("content:", contentIssues.length ? contentIssues : "none");
console.log("sync:", syncIssues.length ? syncIssues : "none");
console.log("tipA count (excl whitelist):", tipA.length);

fs.writeFileSync(
  "scripts/_letter-audit-now.json",
  JSON.stringify({ contentIssues, syncIssues, tipA, whitelist: WHITELIST }, null, 2)
);
