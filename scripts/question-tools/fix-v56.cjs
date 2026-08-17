// ============================================================================
// fix-v56.cjs — v56 tekshiruvida topilgan xatolar. SAVOL DOIRASIDA ishlaydi.
//
//   node scripts/question-tools/fix-v56.cjs         # quruq yurish
//   node scripts/question-tools/fix-v56.cjs apply   # yozadi
// ============================================================================

const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.resolve(__dirname, '..', '..', 'public');
const APPLY = process.argv.includes('apply');

const FIXES = {
  t_56_q_2: [
    { lang: 'ru', bad: 'Направленные средства транспорта - средства общественного транспорта, предназначенные для перевозки пассажиров (троллейбус, трамвай, автобус, направленное такси) с фиксированным маршрутом и остановками.', good: 'Маршрутное транспортное средство - транспортное средство общего пользования, предназначенное для перевозки пассажиров (троллейбус, трамвай, автобус, маршрутное такси), имеющее установленный маршрут и остановки.', why: 'Shu savolning o\'z javob variantida barqaror "маршрутное" atamasi ishlatiladi, lekin izohda boshqa noto\'g\'ri so\'z "направленное/направленные" (yo\'naltirilgan) yozilgan edi — atama nomuvofiqligi.' },
  ],
  t_56_q_6: [
    { lang: 'ru', bad: 'Размещение в более', good: 'В жилых кварталах', why: 'Ma\'nosiz mashina-tarjima artefakti — uz: "Turar joy dahalarida" (turar-joy hududlarida).' },
    { lang: 'ru', bad: 'На шоссе', good: 'На автомагистрали', why: 'uz: "Avtomagistralda" — korpusda barqaror "автомагистраль" atamasi ishlatilishi kerak, umumiy "шоссе" emas.' },
    { lang: 'ru', bad: 'На крытых площадках или ипподроме', good: 'На крытых площадках или автодромах', why: 'JIDDIY XATO: uz "avtodromlarda" (mashina sinov maydoni) — "ипподром" (ОТ POYGA MAYDONI) butunlay boshqa, aloqasi yo\'q joy turi. Shu savolning o\'z izohida to\'g\'ri "автодромах" ishlatilgan — variant matnidagi xato izoh bilan ham ziddiyatli edi.' },
  ],
  t_56_q_8: [
    { lang: 'uz_lat', bad: 'YHQ 16-bobi 106, 106-bandlariga', good: 'YHQ 16-bobi 104, 106-bandlariga', why: '"106, 106" ikki marta takrorlangan yozuv xatosi — tavsiflangan qoida (ikkinchi darajali yo\'l asosiy yo\'lga yo\'l berishi) korpusda barqaror 104-bandga tegishli.' },
    { lang: 'uz_cyr', bad: 'YHQ 16-боби 106, 106-бандларига', good: 'YHQ 16-боби 104, 106-бандларига', why: '"106, 106" икки марта такрорланган ёзув хатоси.' },
    { lang: 'ru', bad: 'В соответствии со статьями 106 и 106 главы 16 ПДД', good: 'В соответствии со статьями 104 и 106 главы 16 ПДД', why: '"106 и 106" ikki marta takrorlangan yozuv xatosi.' },
    { lang: 'ru', bad: 'движущимся в противоположном от дороги равного значения направлении, вправо или вправо,', good: 'движущимся с противоположного направления по дороге равного значения прямо или направо,', why: 'uz: "to\'g\'riga yoki o\'ngga" (to\'g\'ri VA o\'ng, ikki xil yo\'nalish) — ruschada "вправо или вправо" (o\'ngga yoki o\'ngga) so\'zi ikki marta takrorlangan edi, "прямо" (to\'g\'riga) tushib qolgan.' },
  ],
  t_56_q_9: [
    { lang: 'ru', bad: 'на расстоянии менее 15 метров по направлению движения станции (не доезжая и не проходя мимо) (препятствуя движению направленных транспортных средств, за исключением остановки для посадки или высадки пассажиров).', good: 'на расстоянии менее 15 метров от остановки по направлению движения (до подхода и после проезда), за исключением случаев, когда это не препятствует движению маршрутных транспортных средств, при остановке для посадки или высадки пассажиров.', why: 'JIDDIY XATO: uz "xalaqit bermasa... bundan mustasno" (TO\'SQINLIK QILMASA istisno qilinadi) — ruscha tarjimada inkor yo\'qolib, "препятствуя" (TO\'SQINLIK QILGAN HOLDA) deb TESKARI ma\'noda yozilgan edi. Bundan tashqari mantiqsiz "по направлению движения станции" (bekat harakatlanayotgandek) ibora ham tuzatildi.' },
  ],
  t_56_q_16: [
    { lang: 'uz_lat', bad: "u o'ng tomonda bo'lagini uchun", good: "u o'ng tomonda bo'lgani uchun", why: 'Yozuv xatosi: "bo\'lagini" (uning bo\'lagi) o\'rniga "bo\'lgani" (bo\'lgani uchun, sabab qo\'shimchasi) bo\'lishi kerak — uz_cyr nusxada bu to\'g\'ri yozilgan.' },
  ],
  t_56_q_18: [
    { lang: 'ru', bad: 'Приложение к ПДД 1: 1.31.', good: 'Приложение 1 к ПДД: 1.31.', why: 'Korpusdagi barqaror format "Приложение N к ПДД" — bu yerda tartib teskari edi.' },
  ],
  t_56_q_20: [
    { lang: 'ru', bad: 'Этот допольнительная табличка означает:', good: 'Эта дополнительная табличка означает:', why: 'Yozuv xatosi ("допольнительная" o\'rniga "дополнительная") va jins mosligi xatosi ("Этот" o\'rniga "Эта", chunki "табличка" ayol jinsi).' },
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
if (!APPLY) console.log('\nYozish uchun: node scripts/question-tools/fix-v56.cjs apply');
