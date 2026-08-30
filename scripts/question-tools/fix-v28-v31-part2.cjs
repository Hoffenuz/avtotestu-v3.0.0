// ============================================================================
// fix-v28-v31-part2.cjs — v28-v31 tekshiruvidagi "qarorga muhtoj" topilmalar,
// foydalanuvchi tasdig'idan so'ng qo'llanildi. SAVOL DOIRASIDA ishlaydi.
//
//   node scripts/question-tools/fix-v28-v31-part2.cjs         # quruq yurish
//   node scripts/question-tools/fix-v28-v31-part2.cjs apply   # yozadi
// ============================================================================

const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.resolve(__dirname, '..', '..', 'public');
const APPLY = process.argv.includes('apply');

const FIXES = {
  // ru "text" butunlay boshqa savoldan edi — uz_lat/uz_cyr va izoh (uz+ru)
  // barchasi turar joy dahasidan chiqishda yo'l berish haqida.
  t_29_q_12: [{
    lang: 'ru',
    bad: '"text": "О чем информирует водителя табличка, установленная под данным знаком?"',
    good: '"text": "Кому необходимо уступить дорогу при выезде из жилой зоны?"',
    why: 'ru matn uz_lat/uz_cyr va izohga mos emas edi (butunlay boshqa savoldan ko\'chirilgan).',
  }],
  // ru variantlarda "Инвалид avtomobili alohida" yo'q edi, uning o'rniga
  // "taksometrli taksi" tushunchasi ikki marta takrorlangan edi.
  t_30_q_19: [{
    lang: 'ru',
    bad: '"text": "Такси с включенным таксометром"',
    good: '"text": "Автомобилю со знаком «Инвалид»"',
    why: 'uz variant 3 — "«Nogiron» taniqlik belgisi o\'rnatilgan nogiron boshqarayotgan avtomobilga" (alohida) — ruschada bunga mos variant yo\'q edi, "taksometrli taksi" (id2 bilan bir xil ma\'no) takrorlangan edi.',
  }],
  // "Qayrilish taqiqlangan" (U-burilish) "Удар в спину" (orqadan zarba)
  // deb noto'g'ri tarjima qilingan.
  t_31_q_4: [{
    lang: 'ru',
    bad: 'знака 3.19 «Удар в спину запрещен» запрещает только удар в спину.',
    good: 'знак 3.19 «Разворот запрещён» запрещает только разворот.',
    why: 'uz: "3.19 \\"Qayrilish taqiqlangan\\" belgisida faqat qayrilish taqiqlanadi" — qayrilish = razvorot (U-burilish), "удар в спину" bilan aloqasi yo\'q.',
  }],
  t_31_q_13: [
    {
      lang: 'ru',
      bad: 'ПРИЛОЖЕНИЯ 2 к УПК',
      good: 'ПРИЛОЖЕНИЯ 2 к ПДД',
      why: 'УПК (Jinoyat-protsessual kodeksi) emas, ПДД bo\'lishi kerak.',
    },
    {
      lang: 'ru',
      bad: 'ПРИЛОЖЕНИЯ 1 к УПК',
      good: 'ПРИЛОЖЕНИЯ 1 к ПДД',
      why: 'УПК (Jinoyat-protsessual kodeksi) emas, ПДД bo\'lishi kerak.',
    },
    {
      lang: 'ru',
      bad: 'Линию 1.11 разрешается пересекать по кольцевой линии и по грудной линии только при обгоне или финише круга.',
      good: 'Линию 1.11 разрешается пересекать со стороны прерывистой линии, а со стороны сплошной линии — только при завершении обгона или объезда.',
      why: 'uz: "1.11 chizig\'ini uzuq-uzuq chiziq tomonidan, sidirg\'a chiziq tomonidan esa faqat quvib yoki aylanib o\'tishni tugatayotganda bosib o\'tishga ruxsat etiladi" — "грудной линии" (ko\'krak chizig\'i?!) ma\'nosiz mashina-tarjima.',
    },
    {
      lang: 'ru',
      bad: '«Место покаяния»',
      good: '«Место разворота»',
      why: 'uz: "Qayrilib olish joyi" (5.11.1 belgisi) — "покаяние" (tavba) bilan aloqasi yo\'q.',
    },
  ],
  t_31_q_14: [{
    lang: 'ru',
    bad: 'статьи 94 УК запрещается',
    good: 'статьи 94 ПДД запрещается',
    why: 'УК (Jinoyat kodeksi) emas, ПДД bo\'lishi kerak — mavzu eshik ochish qoidasi (YHQ).',
  }],
  t_31_q_17: [{
    lang: 'ru',
    bad: 'Знак 2.6 МВК «Приоритет встречного движения»',
    good: 'Знак 2.6 «Приоритет встречного движения»',
    why: '"МВК" matn oqimiga mos kelmaydigan keraksiz qoldiq edi.',
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
if (!APPLY) console.log('\nYozish uchun: node scripts/question-tools/fix-v28-v31-part2.cjs apply');
