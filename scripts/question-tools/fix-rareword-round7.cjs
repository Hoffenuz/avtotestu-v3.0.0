// ============================================================================
// fix-rareword-round7.cjs — audit-rare-word-typos.cjs orqali topilgan 164
// nomzoddan birinchi, eng ishonchli guruh (o'zi mustaqil so'z bo'lmagan,
// aniq buzilgan tokenlar) qo'lda tekshirildi va tuzatildi. Ba'zilarida
// algoritm to'g'ri so'zni topolmagan (masalan "birom" -> "biroq" emas,
// balki kontekstga ko'ra "biror" bo'lishi kerak edi — "biror bir to'siq"
// iborasi) — shu sabab har biri asl matn ichida o'qib tasdiqlandi.
// Yo'l-yo'lakay o'qishda topilgan (ro'yxatda alohida chiqmagan, lekin
// aniq xato bo'lgan) yana bir nechta so'z ham qo'shildi.
//
//   node scripts/question-tools/fix-rareword-round7.cjs         # quruq yurish
//   node scripts/question-tools/fix-rareword-round7.cjs apply   # yozadi
// ============================================================================

const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.resolve(__dirname, '..', '..', 'public');
const APPLY = process.argv.includes('apply');

const FIXES = {
  t_10_q_18: [{ bad: 'harakatlaninshini', good: 'harakatlanishini' }],
  t_12_q_19: [{ bad: 'harakatlaninshini', good: 'harakatlanishini' }],
  t_25_q_10: [{ bad: 'bo‘liminig', good: 'bo‘limining' }],
  t_32_q_11: [{ bad: 'reelssiz', good: 'relssiz' }],
  t_37_q_10: [
    { bad: 'quidagilar', good: 'quyidagilar' },
    { bad: 'xavisizligiga', good: 'xavfsizligiga' },
  ],
  t_51_q_3: [{ bad: 'shattakka', good: 'shatakka' }],
  t_28_q_4: [{ bad: "qo'lllash", good: "qo'llash" }],
  t_20_q_16: [{ bad: 'birom', good: 'biror' }],
  t_35_q_19: [{ bad: 'birom', good: 'biror' }],
  t_35_q_8: [{ bad: 'bo‘magan', good: 'bo‘lmagan' }],
  t_35_q_17: [
    { bad: "Yo'ning qismi", good: "Yo'lning qismi" },
    { bad: 'belgilarada', good: 'belgilarda' },
    { bad: 'hovillarga', good: 'hovlilarga' },
  ],
  t_17_q_9: [{ bad: "ta'qiqlanmagan", good: 'taqiqlanmagan' }],
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
if (!APPLY) console.log('\nYozish uchun: node scripts/question-tools/fix-rareword-round7.cjs apply');
