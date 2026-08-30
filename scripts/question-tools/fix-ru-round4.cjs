// ============================================================================
// fix-ru-round4.cjs — "Ikkinchi Tur Tekshiruvi" hisobotining A-toifasi:
// ma'no talqinini talab qilmaydigan, xavfsiz mexanik xatolar.
//
//   t_54_q_17 — "з метров" (kirill З) o'rniga "3 метров" (raqam) bo'lishi kerak.
//   t_7_q_8   — 1-variant boshida formatdan qolgan ortiqcha "3." prefiksi.
//   t_9_q_12  — 2,3-variantlar boshida "F1 "/"F2 " prefikslari; izohda "ПДД"
//               o'rniga mavjud bo'lmagan "Закон о безопасности дорожного
//               движения" nomi (tanilgan tizimli naqsh).
//   t_28_q_18 — izohda "ПДД" o'rniga mavjud bo'lmagan "Кодекс безопасности
//               дорожного движения" nomi (xuddi shu tizimli naqsh).
//
//   node scripts/question-tools/fix-ru-round4.cjs         # quruq yurish
//   node scripts/question-tools/fix-ru-round4.cjs apply   # yozadi
// ============================================================================

const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.resolve(__dirname, '..', '..', 'public');
const APPLY = process.argv.includes('apply');

const FIXES = {
  t_54_q_17: [
    { bad: '"з метров"', good: '"3 метров"' },
  ],
  t_7_q_8: [
    { bad: '"3.Только налево"', good: '"Только налево"' },
  ],
  t_9_q_12: [
    { bad: '"F1 Любой фактор, угрожающий безопасности дорожного движения"', good: '"Любой фактор, угрожающий безопасности дорожного движения"' },
    { bad: '"F2 Любое препятствие, вынуждающее участников дорожного движения менять направление движения"', good: '"Любое препятствие, вынуждающее участников дорожного движения менять направление движения"' },
    { bad: 'Общие правила Закона о безопасности дорожного движения: Опасность', good: 'Общие правила Правил дорожного движения: Опасность' },
  ],
  t_28_q_18: [
    { bad: 'приложения 1 Кодекса безопасности дорожного движения указано', good: 'приложения 1 Правил дорожного движения указано' },
  ],
};

function collectJson(dir, out = []) {
  for (const n of fs.readdirSync(dir)) {
    const p = path.join(dir, n);
    if (fs.statSync(p).isDirectory()) collectJson(p, out);
    else if (n.endsWith('.json')) out.push(p);
  }
  return out;
}

function questionSpans(text) {
  const marks = [];
  const re = /"global_id"\s*:\s*"([^"]+)"/g;
  let m;
  while ((m = re.exec(text))) marks.push({ gid: m[1], at: m.index });
  return marks.map((mk, i) => ({
    gid: mk.gid,
    start: mk.at,
    end: i + 1 < marks.length ? marks[i + 1].at : text.length,
  }));
}

const counts = new Map();
const touched = [];

for (const file of collectJson(PUBLIC_DIR)) {
  const before = fs.readFileSync(file, 'utf8');
  let text = before;

  const spans = questionSpans(text).filter((s) => FIXES[s.gid]).reverse();
  for (const s of spans) {
    let chunk = text.slice(s.start, s.end);
    let n = 0;
    for (const f of FIXES[s.gid]) {
      if (!chunk.includes(f.bad)) continue;
      n += chunk.split(f.bad).length - 1;
      chunk = chunk.split(f.bad).join(f.good);
    }
    if (n) {
      counts.set(s.gid, (counts.get(s.gid) || 0) + n);
      text = text.slice(0, s.start) + chunk + text.slice(s.end);
    }
  }

  if (text !== before) {
    touched.push(path.relative(PUBLIC_DIR, file));
    if (APPLY) fs.writeFileSync(file, text);
  }
}

const total = [...counts.values()].reduce((a, b) => a + b, 0);
console.log(APPLY ? "=== QO'LLANDI ===" : '=== QURUQ YURISH ===');
console.log(`O'zgargan fayl: ${touched.length} | Almashtirish: ${total}\n`);
for (const gid of Object.keys(FIXES)) {
  const n = counts.get(gid) || 0;
  console.log(`${n ? ' ' : '-'} ${String(n).padStart(3)}  ${gid}${n ? '' : '   (TOPILMADI)'}`);
}
if (touched.length) {
  console.log('\nFayllar:');
  for (const f of touched) console.log('  ' + f);
}
if (!APPLY) console.log('\nYozish uchun: node scripts/question-tools/fix-ru-round4.cjs apply');
