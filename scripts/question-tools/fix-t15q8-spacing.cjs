// ============================================================================
// fix-t15q8-spacing.cjs — audit-uzlat-uzcyr-wordcount.cjs orqali topilgan
// yagona nomzod: t_15_q_8 uz_lat savol matnida 4 ta so'z orasidagi bo'shliq
// tushib qolgan edi (uz_cyr bilan taqqoslab tasdiqlandi), va shu bilan birga
// "yukxonasida" so'zida "х" harfi noto'g'ri "h" bilan yozilgan edi
// (uz_cyr "юкхонасида" — "х", "ҳ" emas — demak lotinchada "x" bo'lishi kerak).
//
//   node scripts/question-tools/fix-t15q8-spacing.cjs         # quruq yurish
//   node scripts/question-tools/fix-t15q8-spacing.cjs apply   # yozadi
// ============================================================================

const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.resolve(__dirname, '..', '..', 'public');
const APPLY = process.argv.includes('apply');

const FIXES = {
  t_15_q_8: [
    {
      bad: "Yengil avtomobilning tom qismiga o'rnatilganyukhonasida yukning balandligi(maxsusmoslamalar bilan mustahkamlangan holdavelosipedlarni tashish bundan mustasno) nechametrdan oshmasligi kerak?",
      good: "Yengil avtomobilning tom qismiga o'rnatilgan yukxonasida yukning balandligi (maxsus moslamalar bilan mustahkamlangan holda velosipedlarni tashish bundan mustasno) necha metrdan oshmasligi kerak?",
    },
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
if (!APPLY) console.log('\nYozish uchun: node scripts/question-tools/fix-t15q8-spacing.cjs apply');
