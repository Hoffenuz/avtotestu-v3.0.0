// ============================================================================
// fix-v35.cjs — v35 tekshiruvida topilgan xatolar. SAVOL DOIRASIDA ishlaydi.
//
//   node scripts/question-tools/fix-v35.cjs         # quruq yurish
//   node scripts/question-tools/fix-v35.cjs apply   # yozadi
// ============================================================================

const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.resolve(__dirname, '..', '..', 'public');
const APPLY = process.argv.includes('apply');

const FIXES = {
  t_35_q_2: [{
    lang: 'ru',
    bad: 'Участок дороги, предназначенный для пешеходов и движения транспортных средств, запрещен.',
    good: 'Часть дороги, предназначенная для движения пешеходов, на которой движение транспортных средств запрещено.',
    why: 'uz (to\'g\'ri javob): "Йўлнинг пиёдалар ҳаракатланиши учун мўлжалланган ва транспорт воситалари ҳаракати тақиқланган қисми". Eski ruscha matn chalkash edi ("для пешеходов И движения ТС" piyoda VA transport harakati uchun mo\'ljallangandek o\'qiladi).',
  }],
  t_35_q_3: [{ lang: 'ru', bad: '«Никаких апелляций».', good: '«Разворот запрещён».', why: 'uz: "Qayrilish taqiqlangan" = razvorot (3.19 belgisi), "апелляция" bilan aloqasi yo\'q.' }],
  t_35_q_12: [{ lang: 'ru', bad: 'пунктом 46 UCC,', good: 'пунктом 46 ПДД,', why: '"UCC" — mos kelmaydigan lotincha qisqartma, ПДД bo\'lishi kerak.' }],
  t_35_q_17: [
    { lang: 'uz_lat', bad: '"Faqat to\'riga"', good: '"Faqat to\'g\'riga"', why: 'ru: "Только прямо" — "to\'riga" emas, "to\'g\'riga" bo\'lishi kerak (harf tushib qolgan).' },
    { lang: 'uz_cyr', bad: '"Фақат тўрига"', good: '"Фақат тўғрига"', why: 'Xuddi shu xato kirillcha nusxada ("ғ" tushib қолган).' },
  ],
  t_35_q_18: [{ lang: 'ru', bad: 'Легковому и и грузовому автомобилям', good: 'Легковому и грузовому автомобилям', why: 'Takrorlangan "и" so\'zi.' }],
  t_35_q_19: [{ lang: 'ru', bad: '21 - глава 128 - согласно п.:', good: 'Согласно статье 128 главы 21 ПДД:', why: 'Boshqa barcha shunga o\'xshash izohlarda ishlatiladigan standart shakl bilan mos emas edi ("21 - chapter 128 - according to point" tartib buzilgan).' }],
  t_20_q_16: [{ lang: 'ru', bad: '21 - глава 128 - согласно п.:', good: 'Согласно статье 128 главы 21 ПДД:', why: 'Xuddi shu umumiy izoh matnidagi xato (t_35_q_19 bilan bir xil).' }],
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
if (!APPLY) console.log('\nYozish uchun: node scripts/question-tools/fix-v35.cjs apply');
