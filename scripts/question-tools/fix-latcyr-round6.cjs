// ============================================================================
// fix-latcyr-round6.cjs — audit-uzlat-uzcyr-wordcount.cjs orqali topilgan,
// qo'lda tekshirilgan uz_lat/uz_cyr nomuvofiqliklari. uz_lat va uz_cyr BIR
// XIL tilning ikki yozuvi bo'lgani uchun bu yerdagi har bir farq (tushib
// qolgan so'z, qo'shilib qolgan so'z, imlo xatosi) yuqori ishonch bilan
// haqiqiy xato hisoblanadi.
//
//   node scripts/question-tools/fix-latcyr-round6.cjs         # quruq yurish
//   node scripts/question-tools/fix-latcyr-round6.cjs apply   # yozadi
// ============================================================================

const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.resolve(__dirname, '..', '..', 'public');
const APPLY = process.argv.includes('apply');

const FIXES = {
  t_12_q_20: [
    { bad: '"text": "Bu yo\'l chizig\'i:"', good: '"text": "Bu yo\'l chizig\'i quyidagi maqsadni:"' },
  ],
  t_18_q_5: [
    { bad: 'Автомобилда ёқилган сарғиш рангли милтилловчи чироқ ёқилган ҳолатда', good: 'Автомобилда сарғиш рангли милтилловчи чироқ ёқилган ҳолатда' },
  ],
  t_18_q_15: [
    { bad: 'Қизил автомобилга - тўғрига, кўкига - чапга', good: 'Қизил автомобилга - тўғрига, кўк автомобилга - чапга' },
  ],
  t_19_q_13: [
    { bad: '750кг дан ошмаса', good: '750 кг дан ошмаса' },
    { bad: 'ҲҚ 1-иловасининг 3-бўлими', good: 'YHQ 1-иловасининг 3-бўлими' },
    { bad: 'Тиркамали энгил автомобилларга', good: 'Тиркамали енгил автомобилларга' },
  ],
  t_19_q_15: [
    { bad: '01.01.1981- йилгача', good: '01.01.1981-йилгача' },
  ],
  t_21_q_10: [
    { bad: 'шатакка олинувчи транспорт вазнидан', good: 'шатакка олинувчи транспорт воситаси вазнидан' },
  ],
  t_21_q_11: [
    { bad: '10 -15 см', good: '10-15 см' },
  ],
  t_21_q_19: [
    { bad: 'сони ў тириш учун жиҳозланган ўриндиғлар сонидан', good: 'сони ўтириш учун жиҳозланган ўриндиқлар сонидан' },
  ],
  t_29_q_14: [
    { bad: '"text": "Odam tashish uchun mo\'ljallangan yuk avtomobili yuk xonasi bordlari balanligi :"', good: '"text": "Odam tashish uchun mo\'ljallangan yuk avtomobili yuk xonasi bordlari balandligi:"' },
  ],
  t_30_q_19: [
    { bad: 'taksilarga,«Nogiron»', good: 'taksilarga, «Nogiron»' },
  ],
  t_40_q_6: [
    { bad: 'Ushbu vaziyatda qayriliashga ruxsat etiladimi?', good: 'Ushbu vaziyatda qayrilib olishga ruxsat etiladimi?' },
  ],
  t_40_q_13: [
    { bad: "40 km/soat dan kam bo'lsa, ruxsat beriladi", good: "40 km/soatdan kam bo'lsa, ruxsat beriladi" },
  ],
  t_44_q_1: [
    { bad: 'М2 ва М3 — 20 даража.', good: 'М2 ва М3 тоифалар учун — 20 даража.' },
  ],
  t_46_q_14: [
    { bad: '80 km/soat dan oshirishga ruxsat etiladimi?', good: '80 km/soatdan oshirishga ruxsat etiladimi?' },
  ],
  t_62_q_5: [
    { bad: '"text": "Оқ",', good: '"text": "Оқ автомобил",' },
  ],
  t_8_q_17: [
    { bad: 'шу жумладан-тиркамали транспорт', good: 'шу жумладан тиркамали транспорт' },
    { bad: 'вазнини қушган ҳолда', good: 'вазнини қўшган ҳолда' },
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
if (!APPLY) console.log('\nYozish uchun: node scripts/question-tools/fix-latcyr-round6.cjs apply');
