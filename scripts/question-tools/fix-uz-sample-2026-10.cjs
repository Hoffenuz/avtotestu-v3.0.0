// ============================================================================
// fix-uz-sample-2026-10.cjs — uzbekcha matnda tanlab tekshirishda (kam uchraydigan
// so'zlar ro'yxati orqali) topilgan aniq imlo xatolari: lotin va kirill
// matnlar bir xil joyda tuzatiladi. Har biri kontekstda tasdiqlangan.
//
//   node scripts/question-tools/fix-uz-sample-2026-10.cjs         # quruq yurish
//   node scripts/question-tools/fix-uz-sample-2026-10.cjs apply   # yozadi
// ============================================================================

const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.resolve(__dirname, '..', '..', 'public');
const APPLY = process.argv.includes('apply');

const FIXES = {
  t_64_q_11: [{ bad: 'oraqaga', good: 'orqaga' }],
  t_64_q_1: [
    { bad: 'tranport', good: 'transport' },
    { bad: 'транпорт', good: 'транспорт' },
  ],
  t_47_q_4: [
    { bad: 'qisimlarida', good: 'qismlarida' },
    { bad: 'қисимларида', good: 'қисмларида' },
  ],
  t_54_q_13: [
    { bad: 'o‘ti ketish', good: 'o‘tib ketish' },
    { bad: 'ўти кетиш', good: 'ўтиб кетиш' },
  ],
  t_3_q_3: [
    { bad: 'qilman chunki', good: 'qilmang, chunki' },
    { bad: 'қилман чунки', good: 'қилманг, чунки' },
  ],
  t_10_q_6: [
    { bad: 'solda kechimi', good: 'parom kechuvi' },
    { bad: 'солда кечими', good: 'паром кечуви' },
  ],
  t_45_q_13: [
    { bad: 'uzub-uzub', good: 'uzib-uzib' },
    { bad: 'узуб-узуб', good: 'узиб-узиб' },
  ],
  t_20_q_10: [
    { bad: 'tashayotgan', good: 'tashiyotgan' },
    { bad: 'ташаётган', good: 'ташиётган' },
  ],
  t_11_q_20: [{ bad: "ho'l asfalt", good: "xo'l asfalt" }],
  t_43_q_10: [
    { bad: 'etiladiki, agar', good: 'etiladi, agar' },
    { bad: 'этиладики, агар', good: 'этилади, агар' },
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
if (!APPLY) console.log('\nYozish uchun: node scripts/question-tools/fix-uz-sample-2026-10.cjs apply');
