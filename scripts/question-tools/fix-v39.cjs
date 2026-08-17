// ============================================================================
// fix-v39.cjs — v39 tekshiruvida topilgan xatolar. SAVOL DOIRASIDA ishlaydi.
//
//   node scripts/question-tools/fix-v39.cjs         # quruq yurish
//   node scripts/question-tools/fix-v39.cjs apply   # yozadi
// ============================================================================

const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.resolve(__dirname, '..', '..', 'public');
const APPLY = process.argv.includes('apply');

const FIXES = {
  t_39_q_7: [{
    lang: 'ru',
    bad: 'в Приложении 2, раздел 1 Управления безопасности дорожного движения, он предупреждает',
    good: 'в приложении 2, раздел 1 ПДД, она предупреждает',
    why: '"Управления безопасности дорожного движения" — mavjud bo\'lmagan/mos kelmaydigan tashkilot nomi, ПДД bo\'lishi kerak.',
  }],
  t_39_q_13: [{
    lang: 'ru',
    bad: 'ПРИЛОЖЕНИЯ 1 к Общему закону:',
    good: 'ПРИЛОЖЕНИЯ 1 к ПДД:',
    why: '"Общий закон" — mavjud bo\'lmagan kod, ПДД bo\'lishi kerak.',
  }],
  t_39_q_16: [{
    lang: 'ru',
    bad: 'категории М3, Н2, Н3 - противоопрокидыватель, по диаметру колеса (не менее двух) использование которого запрещено, если оно не оборудовано столбом.',
    good: 'категории М3, Н2, Н3 — противооткатными упорами, соответствующими диаметру колеса (не менее двух). При отсутствии указанного оборудования эксплуатация запрещена.',
    why: 'uz: "o\'zi yurib ketishidan saqlovchi, g\'ildirak diametriga muvofiq (kamida ikkita) tirgak bilan jihozlanmagan bo\'lsa, foydalanish taqiqlanadi" — "противоопрокидыватель" va "столбом" noto\'g\'ri atamalar; to\'g\'ri atama ("противооткатное устройство") shu savolning o\'zidagi to\'g\'ri javob variantida ("Противооткатного устройства") ishlatilgan.',
  }],
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
if (!APPLY) console.log('\nYozish uchun: node scripts/question-tools/fix-v39.cjs apply');
