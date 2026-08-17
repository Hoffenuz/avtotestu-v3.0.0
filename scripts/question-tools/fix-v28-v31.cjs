// ============================================================================
// fix-v28-v31.cjs — v28-v31 tekshiruvida topilgan, DALILGA asoslangan,
// shubhasiz xatolar. SAVOL DOIRASIDA ishlaydi (global emas!).
//
//   node scripts/question-tools/fix-v28-v31.cjs         # quruq yurish
//   node scripts/question-tools/fix-v28-v31.cjs apply   # yozadi
// ============================================================================

const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.resolve(__dirname, '..', '..', 'public');
const APPLY = process.argv.includes('apply');

/** gid -> [{lang, bad, good, why}] */
const FIXES = {
  // t_28_q_11: "b" katta harf bilan yozilishi kerak — "A" va "B" bosh harf
  // bilan berilgan, faqat shu bitta variantda kichik harf ishlatilgan.
  t_28_q_11: [
    { lang: 'uz_lat', bad: '"A va b"', good: '"A va B"', why: 'Rasmda "А" va "Б" bosh harf bilan berilgan, variant matnida "b" kichik harfda edi.' },
    { lang: 'uz_cyr', bad: '"А ва б"', good: '"А ва Б"', why: 'Xuddi shu xato kirillcha nusxada.' },
  ],
  // t_31_q_2: uz_cyr variantida "белгилар" so'zining охиридаги "р" tushib qolgan.
  t_31_q_2: [
    { lang: 'uz_cyr', bad: '"2 ва 3 белгила"', good: '"2 ва 3 белгилар"', why: 'uz_lat: "2 va 3 belgilar", ru: "Знаки 2 и 3" — kirillchada "р" harfi tushib qolgan.' },
  ],
  // Bir nechta savolda umumiy izoh matni ("T" harfi ko'rinishidagi tramvay
  // svetofori) ishlatiladi: "chapdagisi chapga, o'ngdagisi o'ngga,
  // o'rtadagisi to'g'riga". Ruscha tarjimada "посередине" uchun ham
  // "направо" takrorlangan — "прямо" bo'lishi kerak edi.
  t_29_q_9: [{ lang: 'ru', bad: 'а тот, что посередине, направо.', good: 'а тот, что посередине, прямо.', why: 'uz: "o\'rtadagisi to\'g\'riga" (to\'g\'riga = prямо), lekin ruschada "направо" ikki marta takrorlangan.' }],
  t_27_q_12: [{ lang: 'ru', bad: 'а тот, что посередине, направо.', good: 'а тот, что посередине, прямо.', why: 'Xuddi shu umumiy izoh matnidagi xato.' }],
  t_34_q_16: [{ lang: 'ru', bad: 'а тот, что посередине, направо.', good: 'а тот, что посередине, прямо.', why: 'Xuddi shu umumiy izoh matnidagi xato.' }],
  t_36_q_3: [{ lang: 'ru', bad: 'а тот, что посередине, направо.', good: 'а тот, что посередине, прямо.', why: 'Xuddi shu umumiy izoh matnidagi xato.' }],
  t_54_q_10: [{ lang: 'ru', bad: 'а тот, что посередине, направо.', good: 'а тот, что посередине, прямо.', why: 'Xuddi shu umumiy izoh matnidagi xato.' }],
  t_57_q_3: [{ lang: 'ru', bad: 'а тот, что посередине, направо.', good: 'а тот, что посередине, прямо.', why: 'Xuddi shu umumiy izoh matnidagi xato.' }],
  t_7_q_11: [{ lang: 'ru', bad: 'а тот, что посередине, направо.', good: 'а тот, что посередине, прямо.', why: 'Xuddi shu umumiy izoh matnidagi xato.' }],
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
if (!APPLY) console.log('\nYozish uchun: node scripts/question-tools/fix-v28-v31.cjs apply');
