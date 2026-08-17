// ============================================================================
// fix-v38.cjs — v38 tekshiruvida topilgan xatolar, shu jumladan yana bir
// tarqalgan tizimli xato: "тартибга soluvchi ishoralari" (38-band) haqidagi
// umumiy izohda "ПДД" o'rniga "Закона" (Qonun) yozilgan — bu xato allaqachon
// "tugagan" deb belgilangan v6, v22, v27 variantlarida ham topildi.
// SAVOL DOIRASIDA ishlaydi.
//
//   node scripts/question-tools/fix-v38.cjs         # quruq yurish
//   node scripts/question-tools/fix-v38.cjs apply   # yozadi
// ============================================================================

const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.resolve(__dirname, '..', '..', 'public');
const APPLY = process.argv.includes('apply');

const ZAKONA_FIX = { lang: 'ru', bad: 'пункту 38 Закона,', good: 'пункту 38 ПДД,', why: '"Закона" (Qonun) — "ПДД" bo\'lishi kerak, xuddi shu umumiy izoh boshqa savollarda "ПДД" deb to\'g\'ri yozilgan.' };

const FIXES = {
  t_38_q_4: [{ lang: 'ru', bad: '(шестеренчатый, крытый)', good: '(шипованный)', why: 'uz: "(tishli, shipli)" — "шестеренчатый, крытый" (tishli g\'ildirakli, yopiq) ma\'nosiz mashina-tarjima, to\'g\'risi "шипованный" (shipli).' }],
  t_38_q_9: [{ lang: 'uz_cyr', bad: '"Йўл чизиқлари нэчта гуруҳдан иборат?"', good: '"Йўл чизиқлари нечта гуруҳдан иборат?"', why: '"нэчта" emas, "нечта" — uz_lat "nechta" bilan mos.' }],
  t_23_q_14: [{ lang: 'uz_cyr', bad: 'нэчта', good: 'нечта', why: '"нэчта" emas, "нечта" bo\'lishi kerak.' }],
  t_38_q_15: [ZAKONA_FIX],
  t_22_q_16: [ZAKONA_FIX],
  t_22_q_18: [ZAKONA_FIX],
  t_27_q_18: [ZAKONA_FIX],
  t_44_q_5: [ZAKONA_FIX],
  t_45_q_1: [ZAKONA_FIX],
  t_48_q_11: [ZAKONA_FIX],
  t_49_q_6: [ZAKONA_FIX],
  t_6_q_12: [ZAKONA_FIX],
  t_38_q_16: [
    { lang: 'ru', bad: '"A)Звуковые сигналы"', good: '"Звуковые сигналы"', why: 'Keraksiz "A)" prefiksi — uz variantda yo\'q.' },
    { lang: 'ru', bad: '"B) Фары дальнего света"', good: '"Фары дальнего света"', why: 'Keraksiz "B) " prefiksi — uz variantda yo\'q.' },
  ],
  t_38_q_18: [
    { lang: 'uz_lat', bad: 'hamda borshqa transport vositlariga', good: 'hamda boshqa transport vositalariga', why: 'Ikki harf tushib qolgan/xato edi: "borshqa" -> "boshqa", "vositlariga" -> "vositalariga".' },
    { lang: 'uz_cyr', bad: 'ҳамда боршқа транспорт воситларига', good: 'ҳамда бошқа транспорт воситаларига', why: 'Xuddi shu ikki xato kirillcha nusxada.' },
    { lang: 'ru', bad: 'Вы уступаете дорогу только транспортным средсвам', good: 'Вы уступаете дорогу только транспортным средствам', why: '"средсвам" — "т" tushib qolgan.' },
    { lang: 'ru', bad: '"F2. Вы уступите дорогу пешеходам на всей проезжей части"', good: '"Вы уступите дорогу пешеходам на всей проезжей части"', why: 'Keraksiz "F2. " prefiksi — uz variantda yo\'q.' },
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
if (!APPLY) console.log('\nYozish uchun: node scripts/question-tools/fix-v38.cjs apply');
