// ============================================================================
// fix-v40.cjs — v40 tekshiruvida topilgan xatolar. SAVOL DOIRASIDA ishlaydi.
//
//   node scripts/question-tools/fix-v40.cjs         # quruq yurish
//   node scripts/question-tools/fix-v40.cjs apply   # yozadi
// ============================================================================

const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.resolve(__dirname, '..', '..', 'public');
const APPLY = process.argv.includes('apply');

const FIXES = {
  t_40_q_9: [{ lang: 'ru', bad: '"Опытный водител"', good: '"Опытный водитель"', why: '"ь" tushib қолган.' }],
  t_27_q_3: [{
    lang: 'ru',
    bad: 'Согласно п. 3.18.1 ПРИЛОЖЕНИЯ 1 к Общим правилам и п. 47 п. 3. Запрещающие знаки: 3.18.1. «Никаких поворотов направо».',
    good: 'Согласно п. 3.18.1 приложения 1 к ПДД и п. 47 п. 3. Запрещающие знаки: 3.18.1. «Поворот направо запрещён».',
    why: '"Общим правилам" — ПДД bo\'lishi kerak; "Никаких поворотов направо" — uz: "O\'ngga burilish taqiqlangan" mazmuniga mos "Поворот направо запрещён" bo\'lishi kerak.',
  }],
  t_40_q_14: [{ lang: 'ru', bad: 'ПРИЛОЖЕНИЯ 1 к Общим правилам и', good: 'приложения 1 к ПДД и', why: '"Общим правилам" — ПДД bo\'lishi kerak.' }],
  t_40_q_17: [{ lang: 'ru', bad: 'Расстояние между буксируемыми и буксируемыми транспортными средствами', good: 'Расстояние между буксирующим и буксируемым транспортными средствами', why: '"буксируемыми" so\'zi ikki marta takrorlangan — biri "буксирующим" (shatakka oluvchi) bo\'lishi kerak.' }],
  t_19_q_12: [{ lang: 'ru', bad: 'расстояние между буксируемыми и буксируемыми транспортными средствами', good: 'расстояние между буксирующим и буксируемым транспортными средствами', why: 'Xuddi shu takrorlanish xatosi.' }],
};

function collectJson(dir, out = []) {
  for (const n of fs.readdirSync(dir)) {
    const p = path.join(dir, n);
    if (fs.statSync(p).isDirectory()) collectJson(p, out);
    else if (n.endsWith('.json')) out.push(p);
  }
  return out;
}

const counts = new Map();
const touched = [];

function questionSpans(text) {
  const spans = [];
  const re = /"global_id"\s*:\s*"([^"]+)"/g;
  let m;
  const marks = [];
  while ((m = re.exec(text))) marks.push({ gid: m[1], at: m.index });
  for (let i = 0; i < marks.length; i++) {
    spans.push({ gid: marks[i].gid, start: marks[i].at, end: i + 1 < marks.length ? marks[i + 1].at : text.length });
  }
  return spans;
}

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
console.log(APPLY ? '=== QO\'LLANDI ===' : '=== QURUQ YURISH ===');
console.log(`O'zgargan fayl: ${touched.length} | Almashtirish: ${total}\n`);
for (const gid of Object.keys(FIXES)) {
  const n = counts.get(gid) || 0;
  console.log(`${n ? ' ' : '-'} ${String(n).padStart(3)}  ${gid}${n ? '' : '   (TOPILMADI)'}`);
}
if (!APPLY) console.log('\nYozish uchun: node scripts/question-tools/fix-v40.cjs apply');
