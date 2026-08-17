// ============================================================================
// fix-v36.cjs — v36 tekshiruvida topilgan xatolar. SAVOL DOIRASIDA ishlaydi.
// Bu yerda ayniqsa jiddiy ikkita xato bor:
//  - t_36_q_4 va t_18_q_7 (v18, "tugagan" deb belgilangan!) izohlarida ruscha
//    matnga ortiqcha "не" qo'shilib, ma'no TESKARISIGA aylangan (uz manba va
//    to'g'ri javob "yo'l berish kerak" desa, ru "не должны уступать" —
//    "yo'l berish shart EMAS" deydi).
//  - t_36_q_1 dagi ruscha variant matni jumla yarmida kesilgan.
//
//   node scripts/question-tools/fix-v36.cjs         # quruq yurish
//   node scripts/question-tools/fix-v36.cjs apply   # yozadi
// ============================================================================

const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.resolve(__dirname, '..', '..', 'public');
const APPLY = process.argv.includes('apply');

const FIXES = {
  t_36_q_1: [
    { lang: 'ru', bad: '"При буксировке механического транспортного"', good: '"При буксировке механического транспортного средства"', why: 'Ruscha variant matni jumla yarmida kesilgan edi ("средства" so\'zi yo\'q edi).' },
    { lang: 'ru', bad: 'Согласно статье 137 23 ПДД,', good: 'Согласно статье 137 главы 23 ПДД,', why: '"главы" so\'zi tushib қолган.' },
    { lang: 'ru', bad: '(в транспортном средстве, ведущем в пробку).', good: '(в буксирующем транспортном средстве).', why: 'uz: "shatakka olib ketayotgan transport vositasida" (shatakka oluvchi TV) — "ведущем в пробку" (probkaga olib boruvchi) ma\'nosiz mashina-tarjima.' },
  ],
  t_36_q_4: [
    { lang: 'uz_lat', bad: 'yo‘l berishlari ker",', good: 'yo‘l berishlari kerak.",', why: 'Matn so\'z yarmida kesilgan ("kerak" emas, "ker" bilan tugagan).' },
    { lang: 'uz_cyr', bad: 'йўл беришлари кер",', good: 'йўл беришлари керак.",', why: 'Xuddi shu kesilish kirillchada.' },
    { lang: 'ru', bad: 'водители не должны уступать дорогу другим участникам дорожного движения при выезде из жилых помещений.', good: 'водители должны уступать дорогу другим участникам дорожного движения при выезде из жилых помещений.', why: 'uz: "боshqa harakat qatnashchilariga yo\'l berishlari kerak" (yo\'l berishi SHART) — ruschada ortiqcha "не" qo\'shilib, to\'g\'ri javobga (id2: "Должен уступить дорогу") zid teskari ma\'no chiqqan edi.' },
  ],
  t_36_q_9: [{ lang: 'ru', bad: '1.3 Пересечение линии сна запрещено.', good: 'Пересечение линии 1.3 запрещено.', why: '"линии сна" (uyqu chizig\'i?!) ma\'nosiz — chiziq raqami takrorlanib buzilgan.' }],
  t_36_q_18: [{ lang: 'ru', bad: 'не поворачивая колеса с улыбкой', good: 'не допуская пробуксовки колёс', why: 'uz: "g\'ildiraklarni jimlay aylantirmagan holda" (g\'ildirak sirpanishisiz) — "с улыбкой" (jilmayib turib?!) ma\'nosiz mashina-tarjima.' }],
  t_52_q_12: [{ lang: 'ru', bad: 'не поворачивая колеса с улыбкой', good: 'не допуская пробуксовки колёс', why: 'Xuddi shu umumiy izoh matnidagi xato (t_36_q_18 bilan bir xil).' }],
  t_18_q_7: [{ lang: 'ru', bad: 'водители не должны уступать дорогу приближающимся транспортным средствам', good: 'водители должны уступать дорогу приближающимся транспортным средствам', why: 'uz: "yo\'l berish(to\'sqinlik qilmaslik)lari shart" (yo\'l berishi SHART) — to\'g\'ri javob (id1: "Продолжить движение, не создавая помех...") bilan ham mos. Ruschada ortiqcha "не" qo\'shilib, teskari ma\'no chiqqan.' }],
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
if (!APPLY) console.log('\nYozish uchun: node scripts/question-tools/fix-v36.cjs apply');
