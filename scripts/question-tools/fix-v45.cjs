// ============================================================================
// fix-v45.cjs — v45 tekshiruvida topilgan xatolar. SAVOL DOIRASIDA ishlaydi.
//
//   node scripts/question-tools/fix-v45.cjs         # quruq yurish
//   node scripts/question-tools/fix-v45.cjs apply   # yozadi
// ============================================================================

const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.resolve(__dirname, '..', '..', 'public');
const APPLY = process.argv.includes('apply');

const FIXES = {
  t_45_q_1: [
    { lang: 'ru', bad: 'правой руки регулятора вперед', good: 'правой руки регулировщика вперед', why: '"регулятор" (qurilma) emas, "регулировщик" (tartibga soluvchi shaxs) bo\'lishi kerak — korpusda barqaror atama.' },
    { lang: 'ru', bad: 'следовать указаниям и указаниям регулирующего органа', good: 'следовать сигналам и указаниям регулировщика', why: 'uz: "ishorasi va ko\'rsatmalariga" (signal VA ko\'rsatma — ikki xil tushuncha) — ruschada "указаниям и указаниям" so\'zi ikki marta takrorlangan edi, "регулирующего органа" (tartibga soluvchi organ) emas "регулировщика" (shaxs) bo\'lishi kerak.' },
  ],
  t_45_q_2: [
    { lang: 'ru', bad: 'не междугородним автобусам', good: 'немеждугородным автобусам', why: 'uz: "shaharlararo bo\'lmagan avtobuslarning" — grammatik xato: "не междугородним" (ikki so\'z, mos kelmaydigan kelishik) o\'rniga "немеждугородным" (bitta so\'z, to\'g\'ri kelishik).' },
  ],
  t_45_q_4: [
    { lang: 'uz_lat', bad: "avtomobiliyukhonasiga o'rnatilgan o'rindiqlar, yukhonapastki qismidan qancha balandlikdamahkamlangan", good: "avtomobili yukxonasiga o'rnatilgan o'rindiqlar, yukxonasi pastki qismidan qancha balandlikda mahkamlangan", why: 'Bo\'shliqlar tushib qolgan (so\'zlar qo\'shilib ketgan) va "yukhona" imlosi izohdagi "yukxona" bilan mos emas edi.' },
    { lang: 'uz_cyr', bad: 'автомобилиюкҳонасига ўрнатилган ўриндиқлар, юкҳонапастки қисмидан қанча баландликдамаҳкамланган', good: 'автомобили юкхонасига ўрнатилган ўриндиқлар, юкхонаси пастки қисмидан қанча баландликда маҳкамланган', why: 'Бўшлиқлар тушиб қолган ва "юкҳона" имлоси изоҳдаги "юкхона" билан мос эмас эди.' },
    { lang: 'ru', bad: 'грузовогоавтомобиля должны быть установленысиденья, предназначенные для перевозкилюдей', good: 'грузового автомобиля должны быть установлены сиденья, предназначенные для перевозки людей', why: 'Bo\'shliqlar tushib qolgan (so\'zlar qo\'shilib ketgan).' },
  ],
  t_45_q_5: [
    { lang: 'ru', bad: 'На каком знаки можно остановиться', good: 'На каких знаках можно остановиться', why: 'uz: "belgilarda" (ko\'plik) — ruscha "каком знаки" grammatik xato, "каких знаках" bo\'lishi kerak.' },
    { lang: 'ru', bad: 'На обеих рисунке можно', good: 'На обоих рисунках можно', why: '"рисунок" — erkak jinsi, shuning uchun "обеих" emas "обоих", va "рисунке" emas ko\'plik "рисунках" bo\'lishi kerak.' },
    { lang: 'ru', bad: 'Приложение к ПДД 1: 3.29.', good: 'Приложение 1 к ПДД: 3.29.', why: 'Korpusdagi barqaror format "Приложение N к ПДД" — bu yerda tartib teskari edi.' },
    { lang: 'ru', bad: 'Заявка ПДД 1: 3.30.', good: 'Приложение 1 к ПДД: 3.30.', why: '"Заявка" (ariza/so\'rov) noto\'g\'ri so\'z — "Приложение" (ilova) bo\'lishi kerak edi.' },
  ],
  t_45_q_14: [
    { lang: 'uz_lat', bad: '\\"YHQga 2-ILOVA', good: 'YHQga 2-ILOVA', why: 'Izoh matni boshida ortiqcha qo\'shtirnoq bor edi (juft emas).' },
    { lang: 'uz_lat', bad: 'o‘tishga ruxsat etiladi.\\"', good: 'o‘tishga ruxsat etiladi.', why: 'Izoh matni oxirida ortiqcha qo\'shtirnoq bor edi (juft emas).' },
    { lang: 'uz_cyr', bad: '\\"YHQга 2-ИЛОВА', good: 'YHQга 2-ИЛОВА', why: 'Изоҳ матни бошида ортиқча қўштирноқ бор эди (жуфт эмас).' },
    { lang: 'uz_cyr', bad: 'ўтишга рухсат этилади.\\"', good: 'ўтишга рухсат этилади.', why: 'Изоҳ матни охирида ортиқча қўштирноқ бор эди (жуфт эмас).' },
    { lang: 'ru', bad: 'обгона или объезда».', good: 'обгона или объезда.', why: 'Matn oxirida ortiqcha yopuvchi qo\'shtirnoq (») bor edi, unga mos ochuvchi qo\'shtirnoq yo\'q edi.' },
  ],
  t_45_q_15: [
    { lang: 'ru', bad: 'отделена от других полос участка движения длинной линией', good: 'отделена от других полос участка движения прерывистой линией', why: 'uz: "uzuq-uzuq chiziq bilan ajratilgan" (uzuq-uzuq = prерывистая, uzuq) — "длинной" (uzun) noto\'g\'ri tarjima.' },
  ],
  t_45_q_16: [
    { lang: 'ru', bad: 'согласно отметке 1,30 в 1-м разделе Приложения 1 ПДД.', good: 'согласно знаку 1.30 в 1-м разделе приложения 1 к ПДД.', why: 'Belgi raqamlari korpusda nuqta bilan yoziladi (vergul emas), va "к ПДД" formatiga moslashtirildi.' },
  ],
  t_45_q_17: [
    { lang: 'ru', bad: 'об использовании аварийные выходы', good: 'об использовании аварийных выходов', why: 'Grammatik xato: "использование" so\'zidan keyin qaratqich kelishigi (родительный падеж) kerak.' },
  ],
  t_45_q_18: [
    { lang: 'ru', bad: 'запрещается находиться в салоне и багажнике транспортного средства, а также в багажнике транспортного средства.', good: 'запрещается перевозить людей в буксируемых на жёсткой или гибкой сцепке автобусе, троллейбусе и кузове грузового автомобиля; при буксировке методом частичной погрузки запрещается нахождение людей в кабине и кузове буксируемого транспортного средства, а также в кузове буксирующего транспортного средства.', why: 'uz matn ancha batafsil (avtobus/trolleybus shatakka olish, qisman ortish usuli va h.k.) — ruscha izoh bu mazmunning katta qismini tushirib qoldirgan va "багажнике транспортного средства" iborasini ikki marta bema\'ni takrorlagan edi.' },
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
if (!APPLY) console.log('\nYozish uchun: node scripts/question-tools/fix-v45.cjs apply');
