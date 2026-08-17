// ============================================================================
// fix-v61.cjs — v61 tekshiruvida topilgan xatolar (t_61_q_10 bundan mustasno —
// u ilgari fix-general-zakon.cjs orqali tuzatilgan). SAVOL DOIRASIDA ishlaydi.
//
//   node scripts/question-tools/fix-v61.cjs         # quruq yurish
//   node scripts/question-tools/fix-v61.cjs apply   # yozadi
// ============================================================================

const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.resolve(__dirname, '..', '..', 'public');
const APPLY = process.argv.includes('apply');

const FIXES = {
  t_61_q_9: [
    { lang: 'ru', bad: 'Согласно пятому пункту статьи 145 главы 24 ПДД, запрещается ездить в следующих случаях: на мотоциклах без бензопилы, а также на таких мотоциклах.', good: 'Согласно пятому абзацу статьи 145 главы 24 ПДД, буксировка запрещается в следующих случаях: мотоциклов без бокового прицепа, а также буксировка такими мотоциклами.', why: 'JIDDIY XATO va MA\'NOSIZ TARJIMA: uz "kajavasiz mototsikllar" (yon kajavasiz) — "без бензопилы" (BENZOPILASIZ!) deb butunlay aloqasi yo\'q so\'zga tarjima qilingan edi. Bundan tashqari mavzu "shatakka olish" (буксировка) haqida, "ездить" (yurish) emas.' },
  ],
  t_61_q_16: [
    { lang: 'ru', bad: 'должен следовать указаниям охранника переезда, светофора, дорожных знаков, дорожных знаков, положения шлагбаума и следить за отсутствием приближающегося поезда (локомотива).', good: 'должен следовать указаниям дежурного по переезду, сигналам светофора, дорожным знакам, дорожной разметке, положению шлагбаума и следить за отсутствием приближающегося поезда (локомотива, дрезины).', why: '"дорожных знаков" so\'zi ikki marta takrorlangan edi (bittasi "дорожной разметки" — yo\'l chizig\'i bo\'lishi kerak edi), va "дрезина" (drezina) uz manbadan tushib qolgan edi.' },
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
if (!APPLY) console.log('\nYozish uchun: node scripts/question-tools/fix-v61.cjs apply');
