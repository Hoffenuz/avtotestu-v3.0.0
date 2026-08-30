/**
 * Full sequential audit of public/data/variants (v1..v63).
 * Detect only — does NOT fix. Writes one report file.
 *
 *   node scripts/audit-variants-full-read.cjs
 *   node scripts/audit-variants-full-read.cjs 1 63
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const DST = path.join(ROOT, "public", "data", "variants");
const from = Number(process.argv[2] || 1);
const to = Number(process.argv[3] || 63);
const OUT = path.join(ROOT, "scripts", "VARIANTS-FULL-AUDIT-REPORT.md");
const OUT_JSON = path.join(ROOT, "scripts", "VARIANTS-FULL-AUDIT-REPORT.json");

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
    .filter((w) => w.length > 2);
}

function jaccard(a, b) {
  const A = new Set(tokens(a));
  const B = new Set(tokens(b));
  if (!A.size || !B.size) return 0;
  let inter = 0;
  for (const w of A) if (B.has(w)) inter++;
  return inter / (A.size + B.size - inter);
}

function nums(s) {
  return (s || "").match(/\d+(?:[.,]\d+)?/g) || [];
}

function correctOpt(block) {
  return (block?.options || []).find((o) => o.is_correct) || null;
}

/** Known bad MT / wrong-word patterns in RU (relative to LAT when possible) */
const RU_GARBAGE = [
  { re: /бронемаш/i, note: "aslahalangan → бронемашина (noto‘g‘ri)" },
  { re: /запертого|запертых/i, note: "shatak → запертый (noto‘g‘ri)" },
  { re: /угнанн/i, note: "shatakka olingan → угнанный" },
  { re: /приемник находится/i, note: "shatakka oluvchi → приемник" },
  { re: /прямо и правильно/i, note: "to‘g‘riga va o‘ngga → прямо и правильно" },
  { re: /в самый раз/i, note: "faqat to‘g‘riga → в самый раз" },
  { re: /знаки привилегий/i, note: "imtiyoz → привилегий" },
  { re: /оба не сломались|оба сломались/i, note: "buzdi → сломались" },
  { re: /оба драйвера/i, note: "haydovchi → драйвера" },
  { re: /правый руль/i, note: "o‘ng tomondagi → правый руль" },
  { re: /гласных$/i, note: "tovushli ishora → гласных" },
  { re: /судебный запрет/i, note: "buyuruvchi → судебный запрет" },
  { re: /освобождение,/i, note: "imtiyoz → освобождение (belgi guruhida)" },
  { re: /нет движения/i, note: "harakatlanish taqiqlangan → нет движения" },
  { re: /дистанции парковки/i, note: "to‘xtash yo‘li → дистанции парковки" },
];

const BAD_LEGAL =
  /Гражданский кодекс|ГК РФ|Генеральному соглаш|Генеральному договор|\bМПК\b|Уголовн|РКИК ООН|приложени[яе] 1 к ООН|Глава \d+ ООН|о гражданском процессе|по гражданскому процессу|семейного кодекс/i;

function auditOne(q, file) {
  const issues = [];
  const id = q.task_info?.global_id || "?";
  const ticket = q.task_info?.ticket_num;
  const order = q.task_info?.order;
  const lat = q.content?.uz_lat;
  const cyr = q.content?.uz_cyr;
  const ru = q.content?.ru;
  const iz = q.izoh || {};

  // Chaqiruv tartibi: push(type, severity, detail) — masalan
  // push("missing-lang-block", "critical", "..."). Ilgari ikkala parametr
  // ham `severity` deb nomlangan (sintaksis xatosi) va tanada aniqlanmagan
  // `type` ishlatilgan — skript umuman ishga tushmasdi.
  const push = (type, severity, detail, extra = {}) => {
    issues.push({ severity, type, detail, ...extra });
  };

  // ── structure ──────────────────────────────────────────────
  for (const lang of ["uz_lat", "uz_cyr", "ru"]) {
    const block = q.content?.[lang];
    if (!block) {
      push("missing-lang-block", "critical", `${lang} bloki yo‘q`);
      continue;
    }
    if (!(block.text || "").trim()) push("empty-text", "critical", `${lang} savol matni bo‘sh`, { lang });

    const opts = block.options || [];
    if (!opts.length) push("no-options", "critical", `${lang} variantlar yo‘q`, { lang });

    const corrects = opts.filter((o) => o.is_correct);
    if (corrects.length !== 1) {
      push("correct-count", "critical", `${lang}: is_correct=${corrects.length} (1 bo‘lishi kerak)`, {
        lang,
        n: corrects.length,
      });
    }

    for (const o of opts) {
      if (!(o.text || "").trim()) push("empty-option", "critical", `${lang} option id=${o.id} bo‘sh`, { lang });
    }

    const texts = opts.map((o) => soft(o.text));
    const seen = new Map();
    texts.forEach((t, i) => {
      if (!t) return;
      if (seen.has(t)) {
        push("dup-options", "critical", `${lang}: bir xil javob matni (id ${seen.get(t)} va ${opts[i].id})`, {
          lang,
          text: opts[i].text.slice(0, 80),
        });
      } else seen.set(t, opts[i].id);
    });

    // near-duplicates (very similar options)
    for (let i = 0; i < opts.length; i++) {
      for (let j = i + 1; j < opts.length; j++) {
        const sim = jaccard(opts[i].text, opts[j].text);
        if (sim >= 0.85 && soft(opts[i].text) !== soft(opts[j].text)) {
          push("near-dup-options", "high", `${lang}: juda o‘xshash variantlar (sim=${sim.toFixed(2)})`, {
            lang,
            a: opts[i].text.slice(0, 70),
            b: opts[j].text.slice(0, 70),
          });
        }
      }
    }
  }

  // option count mismatch across langs
  const nLat = lat?.options?.length || 0;
  const nCyr = cyr?.options?.length || 0;
  const nRu = ru?.options?.length || 0;
  if (nLat && nCyr && nLat !== nCyr) {
    push("opt-count-mismatch", "critical", `LAT=${nLat} CYR=${nCyr}`);
  }
  if (nLat && nRu && nLat !== nRu) {
    push("opt-count-mismatch", "critical", `LAT=${nLat} RU=${nRu}`);
  }

  // ── izoh ───────────────────────────────────────────────────
  if (!(iz.uz_lat || "").trim()) push("empty-izoh-lat", "critical", "uz_lat izoh bo‘sh");
  if (!(iz.uz_cyr || "").trim()) push("empty-izoh-cyr", "critical", "uz_cyr izoh bo‘sh");
  if (!(iz.ru || "").trim()) push("empty-izoh-ru", "critical", "ru izoh bo‘sh");

  if ((iz.uz_lat || "").trim().length > 0 && (iz.uz_lat || "").trim().length < 40) {
    push("short-izoh-lat", "medium", `LAT izoh qisqa (${(iz.uz_lat || "").length} belgi)`, {
      text: (iz.uz_lat || "").slice(0, 120),
    });
  }
  if ((iz.ru || "").trim().length > 0 && (iz.ru || "").trim().length < 40) {
    push("short-izoh-ru", "medium", `RU izoh qisqa (${(iz.ru || "").length} belgi)`, {
      text: (iz.ru || "").slice(0, 120),
    });
  }

  if (BAD_LEGAL.test(iz.ru || "")) {
    push("bad-legal-name-ru", "critical", "RU izohda noto‘g‘ri huquqiy nom", {
      snippet: (iz.ru || "").slice(0, 160),
    });
  }
  if (/Гражданский кодекс|МПК|Уголовн/i.test(iz.uz_lat || "")) {
    push("bad-legal-name-lat", "high", "LAT izohda shubhali huquqiy nom", {
      snippet: (iz.uz_lat || "").slice(0, 120),
    });
  }

  // ── correct answer alignment (same id order assumed after our fixes) ──
  const latC = correctOpt(lat);
  const cyrC = correctOpt(cyr);
  const ruC = correctOpt(ru);

  if (latC && cyrC && latC.id !== cyrC.id) {
    // if soft texts match pairwise by id, then id mismatch is a real bug
    const latById = Object.fromEntries((lat?.options || []).map((o) => [o.id, soft(o.text)]));
    const cyrById = Object.fromEntries((cyr?.options || []).map((o) => [o.id, soft(o.text)]));
    const sameOrder =
      nLat === nCyr &&
      (lat?.options || []).every((o) => soft(o.text) && cyrById[o.id] && jaccard(o.text, (cyr?.options || []).find((x) => x.id === o.id)?.text || "") > 0.3);
    push("correct-id-lat-cyr", sameOrder ? "high" : "medium", `LAT correct id=${latC.id}, CYR id=${cyrC.id}`, {
      lat: latC.text.slice(0, 60),
      cyr: cyrC.text.slice(0, 60),
    });
  }

  if (latC && ruC && latC.id !== ruC.id) {
    // Check if RU options are in same semantic order as LAT (id-aligned translations)
    // Flag as high if each id has similar role (number match) or if we can pair by soft translation keywords
    const latNums = nums(latC.text);
    const ruNums = nums(ruC.text);
    const numConflict =
      latNums.length &&
      ruNums.length &&
      !latNums.some((n) => ruNums.includes(n)) &&
      (ru?.options || []).some((o) => latNums.some((n) => (o.text || "").includes(n)) && o.id !== ruC.id);

    // Color keyword conflict
    const colorPairs = [
      [/yashil/, /зелен/],
      [/\bqizil\b/, /красн/],
      [/ko['']?k\b|ko‘k|ko`k/, /син(ий|яя|ее|ие)/],
      [/sariq/, /ж[её]лт/],
      [/oq\b|oqq/, /бел(ый|ая|ое|ые)/],
      [/tramvay/, /трамвай/],
      [/velosiped/, /велосипед/],
      [/motosikl/, /мотоцикл/],
      [/avtobus/, /автобус/],
    ];
    let colorBug = false;
    for (const [latRe, ruRe] of colorPairs) {
      if (latRe.test(soft(latC.text)) && !ruRe.test(soft(ruC.text))) {
        const better = (ru?.options || []).find((o) => ruRe.test(soft(o.text)));
        if (better && better.id !== ruC.id) {
          colorBug = true;
          push("ru-correct-keyword-mismatch", "critical", `LAT to‘g‘ri javob kaliti RU da boshqa optionda`, {
            lat: latC.text.slice(0, 70),
            ruCorrect: ruC.text.slice(0, 70),
            betterRu: better.text.slice(0, 70),
          });
          break;
        }
      }
    }

    if (numConflict) {
      push("ru-correct-number-mismatch", "critical", "LAT to‘g‘ri javobdagi raqam RU correct da yo‘q", {
        lat: latC.text.slice(0, 70),
        ru: ruC.text.slice(0, 70),
        latNums,
      });
    } else if (!colorBug) {
      // soft note: different correct ids (may be reorder — needs human)
      push("correct-id-lat-ru-diff", "low", `LAT correct id=${latC.id}, RU id=${ruC.id} (tartib farqi bo‘lishi mumkin)`, {
        lat: latC.text.slice(0, 60),
        ru: ruC.text.slice(0, 60),
      });
    }
  }

  // ── izoh vs correct answer numbers ─────────────────────────
  if (latC && iz.uz_lat) {
    const ns = nums(latC.text).map((x) => x.replace(",", "."));
    if (ns.length >= 1 && tokens(latC.text).length <= 8) {
      // short numeric answers like "80 km/c", "0,135"
      const izHas = ns.some((n) => (iz.uz_lat || "").includes(n) || (iz.uz_lat || "").includes(n.replace(".", ",")));
      if (!izHas && ns.some((n) => parseFloat(n) > 0)) {
        push("izoh-misses-answer-number", "high", `To‘g‘ri javobdagi raqam LAT izohda yo‘q: ${ns.join(", ")}`, {
          ans: latC.text.slice(0, 60),
          izoh: (iz.uz_lat || "").slice(0, 100),
        });
      }
    }
  }

  // ── RU garbage / MT fails ──────────────────────────────────
  const ruBlob = [(ru?.text || ""), ...(ru?.options || []).map((o) => o.text || ""), iz.ru || ""].join("\n");
  for (const g of RU_GARBAGE) {
    if (g.re.test(ruBlob)) {
      push("ru-garbage-mt", "high", g.note, { match: (ruBlob.match(g.re) || [""])[0] });
    }
  }

  // clothing vs bandage confusion
  if (/kiyim|ko['']ylag|echish|kiydir/i.test((lat?.text || "") + (latC?.text || "")) && /повязк/i.test(ruBlob)) {
    push("ru-garbage-mt", "critical", "LAT kiyim haqida, RU da «повязка»", {});
  }

  // to'g'ri → направо false friend in options when LAT says to'g'riga
  (lat?.options || []).forEach((o, i) => {
    const r = ru?.options?.[i];
    if (!r) return;
    if (/\bto['']?g['']?riga\b|to‘g‘riga|to`griga/i.test(o.text) && /направо/i.test(r.text) && !/прямо/i.test(r.text)) {
      push("ru-false-friend", "critical", `to‘g‘riga ≠ направо (option id=${o.id})`, {
        lat: o.text.slice(0, 70),
        ru: r.text.slice(0, 70),
      });
    }
  });

  // ── media / id consistency ─────────────────────────────────
  if (q.task_info?.global_id) {
    const m = String(q.task_info.global_id).match(/^t_(\d+)_q_(\d+)$/);
    if (m) {
      if (Number(m[1]) !== Number(ticket)) {
        push("id-ticket-mismatch", "critical", `global_id ticket ${m[1]} ≠ task_info.ticket_num ${ticket}`);
      }
      if (Number(m[2]) !== Number(order)) {
        push("id-order-mismatch", "medium", `global_id order ${m[2]} ≠ task_info.order ${order}`);
      }
    }
  }

  // expected 20 questions per ticket — checked at file level

  return {
    id,
    file,
    ticket,
    order,
    q_lat: (lat?.text || "").slice(0, 140),
    media: q.media_url || "",
    issues,
  };
}

function main() {
  const all = [];
  const byType = {};
  const bySeverity = { critical: 0, high: 0, medium: 0, low: 0 };
  const fileStats = [];

  for (let i = from; i <= to; i++) {
    const file = `v${i}.json`;
    const p = path.join(DST, file);
    if (!fs.existsSync(p)) {
      fileStats.push({ file, error: "MISSING FILE" });
      continue;
    }
    let arr;
    try {
      arr = JSON.parse(fs.readFileSync(p, "utf8"));
    } catch (e) {
      fileStats.push({ file, error: "JSON PARSE: " + e.message });
      continue;
    }
    if (!Array.isArray(arr)) {
      fileStats.push({ file, error: "Not an array" });
      continue;
    }
    const fStat = { file, questions: arr.length, withIssues: 0, issueCount: 0 };
    if (arr.length !== 20) {
      // note at file level
      fStat.warn = `Savollar soni ${arr.length} (odatda 20)`;
    }

    for (const q of arr) {
      const row = auditOne(q, file);
      if (row.issues.length) {
        fStat.withIssues++;
        fStat.issueCount += row.issues.length;
        all.push(row);
        for (const iss of row.issues) {
          byType[iss.type] = (byType[iss.type] || 0) + 1;
          bySeverity[iss.severity] = (bySeverity[iss.severity] || 0) + 1;
        }
      }
    }
    fileStats.push(fStat);
    process.stdout.write(`\rAudited ${file} (${i - from + 1}/${to - from + 1}) — findings so far: ${all.length}   `);
  }
  console.log("");

  // Filter: for report readability, split critical/high vs low noise
  const criticalHigh = all
    .map((r) => ({
      ...r,
      issues: r.issues.filter((i) => i.severity === "critical" || i.severity === "high"),
    }))
    .filter((r) => r.issues.length);

  const medium = all
    .map((r) => ({
      ...r,
      issues: r.issues.filter((i) => i.severity === "medium"),
    }))
    .filter((r) => r.issues.length);

  const lowOnly = all
    .map((r) => ({
      ...r,
      issues: r.issues.filter((i) => i.severity === "low"),
    }))
    .filter((r) => r.issues.length);

  const report = {
    generatedAt: new Date().toISOString(),
    range: { from, to },
    totals: {
      questions: (to - from + 1) * 20, // approximate
      questionsAudited: fileStats.reduce((s, f) => s + (f.questions || 0), 0),
      questionsWithAnyIssue: all.length,
      questionsWithCriticalOrHigh: criticalHigh.length,
      issuesBySeverity: bySeverity,
      issuesByType: byType,
    },
    fileStats,
    criticalAndHigh: criticalHigh,
    medium,
    low: lowOnly,
  };

  fs.writeFileSync(OUT_JSON, JSON.stringify(report, null, 2), "utf8");

  // Markdown (human)
  const lines = [];
  lines.push(`# Variants to‘liq audit hisoboti`);
  lines.push(``);
  lines.push(`- Vaqt: ${report.generatedAt}`);
  lines.push(`- Diapazon: v${from}–v${to}`);
  lines.push(`- Tekshirilgan savollar: **${report.totals.questionsAudited}**`);
  lines.push(`- Kamida 1 ta issue: **${report.totals.questionsWithAnyIssue}**`);
  lines.push(`- Critical/High bor savollar: **${report.totals.questionsWithCriticalOrHigh}**`);
  lines.push(``);
  lines.push(`## Severity bo‘yicha`);
  lines.push(``);
  for (const [k, v] of Object.entries(bySeverity)) lines.push(`- **${k}**: ${v}`);
  lines.push(``);
  lines.push(`## Tip bo‘yicha`);
  lines.push(``);
  const sortedTypes = Object.entries(byType).sort((a, b) => b[1] - a[1]);
  for (const [k, v] of sortedTypes) lines.push(`- \`${k}\`: ${v}`);
  lines.push(``);

  lines.push(`## Fayl holati`);
  lines.push(``);
  for (const f of fileStats) {
    if (f.error) lines.push(`- **${f.file}**: ❌ ${f.error}`);
    else
      lines.push(
        `- ${f.file}: ${f.questions} savol, ${f.withIssues} ta issue’li` +
          (f.warn ? ` ⚠️ ${f.warn}` : "")
      );
  }
  lines.push(``);

  lines.push(`## CRITICAL + HIGH (tuzatish uchun asosiy ro‘yxat)`);
  lines.push(``);
  if (!criticalHigh.length) {
    lines.push(`_Critical/High topilmadi._`);
  } else {
    for (const r of criticalHigh) {
      lines.push(`### ${r.id} (${r.file})`);
      lines.push(`- Savol: ${r.q_lat}`);
      if (r.media) lines.push(`- Media: \`${r.media}\``);
      for (const iss of r.issues) {
        lines.push(`- **[${iss.severity}]** \`${iss.type}\`: ${iss.detail}`);
        if (iss.lat) lines.push(`  - LAT: ${iss.lat}`);
        if (iss.ru || iss.ruCorrect) lines.push(`  - RU: ${iss.ru || iss.ruCorrect}`);
        if (iss.betterRu) lines.push(`  - Yaxshiroq RU option: ${iss.betterRu}`);
        if (iss.a && iss.b) lines.push(`  - A: ${iss.a} | B: ${iss.b}`);
        if (iss.snippet || iss.text) lines.push(`  - Matn: ${(iss.snippet || iss.text || "").slice(0, 160)}`);
        if (iss.note) lines.push(`  - ${iss.note}`);
      }
      lines.push(``);
    }
  }

  lines.push(`## MEDIUM`);
  lines.push(``);
  if (!medium.length) lines.push(`_Yo‘q._`);
  else {
    for (const r of medium) {
      lines.push(`### ${r.id} (${r.file})`);
      for (const iss of r.issues) {
        lines.push(`- **[${iss.severity}]** \`${iss.type}\`: ${iss.detail}`);
        if (iss.text || iss.snippet) lines.push(`  - ${(iss.text || iss.snippet || "").slice(0, 140)}`);
      }
      lines.push(``);
    }
  }

  lines.push(`## LOW (ko‘pincha LAT/RU option tartibi farqi — qo‘lda tekshirish)`);
  lines.push(``);
  lines.push(`Jami low-only savollar: **${lowOnly.length}** (batafsil JSON da: \`low\`)`);
  lines.push(``);
  lines.push(`---`);
  lines.push(`JSON nusxa: \`scripts/VARIANTS-FULL-AUDIT-REPORT.json\``);

  fs.writeFileSync(OUT, lines.join("\n"), "utf8");

  console.log(
    JSON.stringify(
      {
        outMd: OUT,
        outJson: OUT_JSON,
        questionsAudited: report.totals.questionsAudited,
        withAnyIssue: report.totals.questionsWithAnyIssue,
        criticalOrHighQuestions: report.totals.questionsWithCriticalOrHigh,
        bySeverity,
        topTypes: sortedTypes.slice(0, 15),
      },
      null,
      2
    )
  );
}

main();
