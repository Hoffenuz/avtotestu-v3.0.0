// ============================================================================
// fix-v42.cjs — v42 tekshiruvida topilgan xatolar. SAVOL DOIRASIDA ishlaydi.
//
//   node scripts/question-tools/fix-v42.cjs         # quruq yurish
//   node scripts/question-tools/fix-v42.cjs apply   # yozadi
// ============================================================================

const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.resolve(__dirname, '..', '..', 'public');
const APPLY = process.argv.includes('apply');

const DVIZHENIE_PRYAMO = {
  lang: 'ru',
  bad: '4.1.1. «Двигаемся навстречу». Разрешено только правильное направление.',
  good: '4.1.1. «Движение прямо». Разрешено движение только в указанном на знаке направлении.',
  why: 'uz: "Harakatlanish to\'g\'riga" (to\'g\'riga = прямо) — "Двигаемся навстречу" (oncoming/qarshi tomondan) belgi mazmuniga zid noto\'g\'ri tarjima.',
};

const FIXES = {
  t_42_q_1: [{ lang: 'ru', bad: 'мосты, эстакады и эстакады, столбы', good: 'мосты, путепроводы и эстакады, столбы', why: 'uz: "ko\'priklar, yo\'l o\'tkazgich va estakadalar" — uchta alohida atama, ruschada "эстакады" ikki marta takrorlangan edi.' }],
  t_42_q_9: [{ lang: 'ru', bad: 'Согласно абзацу второму главы 67 ПДД 10:', good: 'Согласно абзацу второму пункта 67 главы 10 ПДД:', why: 'Band/bob tartibi buzilgan edi ("главы 67 ПДД 10" ma\'nosiz).' }],
  t_42_q_10: [DVIZHENIE_PRYAMO],
  t_34_q_19: [DVIZHENIE_PRYAMO],
  t_43_q_17: [DVIZHENIE_PRYAMO],
  t_42_q_17: [{ lang: 'uz_cyr', bad: '"Олдинда тирбандлик хакида борлигидан"', good: '"Олдинда тирбандлик ҳақида"', why: 'uz_lat: "Oldinda tirbandlik haqida" — "хакида" xato harf ("ҳақида" bo\'lishi kerak), qo\'shimcha "борлигидан" so\'zi uz_lat da yo\'q.' }],
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
if (!APPLY) console.log('\nYozish uchun: node scripts/question-tools/fix-v42.cjs apply');
