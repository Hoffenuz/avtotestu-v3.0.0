// ============================================================================
// fix-sync-gaps.cjs — to'liq sinxronlik auditida topilgan qoldiq nomuvofiqlar.
// Ikki turdagi sabab bor edi:
//  1) Bugungi tuzatishlarim ba'zi formatlar uchun ishlamadi: siqilgan
//     (600.json/free-*.json, bo'shliqsiz JSON) fayllarda "kalit": "qiymat"
//     shaklidagi bad-matn mos kelmadi (bo'shliq yo'q); yoki bitta tilli
//     fayllarda (masalan barcha-uz-lat.json) izoh obyektida vergul yo'q edi.
//  2) v18-27/53/54/59 kabi "tugagan" variantlarda ALLAQACHON tuzatilgan
//     izohlar hech qachon 600.json/barcha.json ga ko'chirilmagan edi —
//     bular eski, ushbu sessiyaga aloqasi yo'q qoldiq nomuvofiqliklar.
//
// Bad matnlar FAQAT MAZMUN bo'yicha (JSON kalit-qiymat formatlash bilan
// bog'liq belgilarsiz) tanlangan — pretty/siqilgan, bitta-tilli/ko'p-tilli
// farqidan qat'i nazar ishlaydi. SAVOL DOIRASIDA.
//
//   node scripts/question-tools/fix-sync-gaps.cjs         # quruq yurish
//   node scripts/question-tools/fix-sync-gaps.cjs apply   # yozadi
// ============================================================================

const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.resolve(__dirname, '..', '..', 'public');
const APPLY = process.argv.includes('apply');

const FIXES = {
  // --- Bugungi tuzatish siqilgan fayllarda ishlamagan (bo'shliqsiz JSON) ---
  t_29_q_12: [{ lang: 'ru', bad: 'О чем информирует водителя табличка, установленная под данным знаком?', good: 'Кому необходимо уступить дорогу при выезде из жилой зоны?', why: '600.json/free-ru.json siqilgan format tufayli "text": bilan boshlangan bad string mos kelmagan edi.' }],
  t_30_q_19: [{ lang: 'ru', bad: 'Такси с включенным таксометром', good: 'Автомобилю со знаком «Инвалид»', why: 'Xuddi shu sabab.' }],

  // --- Bugungi tuzatish bitta-tilli fayllarda ishlamagan (vergul yo'q) ---
  t_36_q_4: [
    { lang: 'uz_lat', bad: 'boshqa harakat qatnashchilariga yo‘l berishlari ker"', good: 'boshqa harakat qatnashchilariga yo‘l berishlari kerak."', why: 'barcha-uz-lat.json/free-uz-lat.json bitta tilli — izoh obyektida vergul yo\'q, bad string vergul kutgan edi.' },
    { lang: 'uz_cyr', bad: 'бошқа ҳаракат қатнашчиларига йўл беришлари кер"', good: 'бошқа ҳаракат қатнашчиларига йўл беришлари керак."', why: 'Xuddi shu sabab.' },
  ],

  // --- Eski (avvalgi sessiyalardagi) qoldiq: v25/v29/v53 fayllarida
  //     ALLAQACHON to'g'ri, lekin 600.json/barcha.json ga ko'chirilmagan ---
  t_25_q_18: [
    { lang: 'uz_lat', bad: 'YHQ 15-bobi 100-bandiga asosan, svetoforning taqiqlovchi qizil yoki sariq ishorasi bilan bir vaqtda yongan qo\'shimcha tarmoqning ko\'rsatkichli yashil ishorasi yo\'nalishida harakatlanayotgan haydovchi boshqa yo\'nalishlardan harakatlanayotgan transport vositalariga yo\'l berishi kerak.', good: 'YHQ 16-bobi 105-bandiga asosan, teng ahamiyatga ega bo\'lgan yo\'llar kesishgan chorrahada relssiz transport vositasining haydovchisi o\'ngdan yaqinlashayotgan transport vositalariga yo\'l berishi shart.', why: 'Savol "kim birinchi o\'tadi" haqida (o\'ngdan yo\'l berish qoidasi) — 105-band to\'g\'ri, 100-band (qo\'shimcha svetofor bo\'lagi) boshqa mavzu, 600.json/barcha.json da eskirib qolgan.' },
    { lang: 'uz_cyr', bad: 'YHQ 15-боби 100-бандига асосан, светофорнинг тақиқловчи қизил ёки сариқ ишораси билан бир вақтда ёнган қўшимча тармоқнинг кўрсаткичли яшил ишораси йўналишида ҳаракатланаётган ҳайдовчи бошқа йўналишлардан ҳаракатланаётган транспорт воситаларига йўл бериши керак.', good: 'YHQ 16-боби 105-бандига асосан, тенг аҳамиятга эга бўлган йўллар кесишган чорраҳада релссиз транспорт воситасининг ҳайдовчиси ўнгдан яқинлашаётган транспорт воситаларига йўл бериши шарт.', why: 'Xuddi shu sabab.' },
    { lang: 'ru', bad: 'Согласно главе 15, пункту 100 ПДД, водитель, движущийся в направлении зеленого сигнала дополнительной секции, горящего одновременно с запрещающим красным или желтым сигналом светофора, обязан уступить дорогу транспортным средствам, движущимся с других направлений.', good: 'Согласно пункту 105 главы 16 ПДД, на перекрёстке равнозначных дорог водитель безрельсового транспортного средства обязан уступить дорогу транспортным средствам, приближающимся справа.', why: 'Xuddi shu sabab.' },
  ],
  t_29_q_16: [
    { lang: 'uz_lat', bad: 'YHQ 15-bobi 100-bandiga asosan, svetoforning taqiqlovchi qizil yoki sariq ishorasi bilan bir vaqtda yongan qo\'shimcha tarmoqning ko\'rsatkichli yashil ishorasi yo\'nalishida harakatlanayotgan haydovchi boshqa yo\'nalishlardan harakatlanayotgan transport vositalariga yo\'l berishi kerak.', good: 'YHQ 16-bobi 105-bandiga asosan, teng ahamiyatga ega bo\'lgan yo\'llar kesishgan chorrahada relssiz transport vositasining haydovchisi o\'ngdan yaqinlashayotgan transport vositalariga yo\'l berishi shart.', why: 'Xuddi t_25_q_18 dagi sabab — savol topigiga mos emas edi.' },
    { lang: 'uz_cyr', bad: 'YHQ 15-боби 100-бандига асосан, светофорнинг тақиқловчи қизил ёки сариқ ишораси билан бир вақтда ёнган қўшимча тармоқнинг кўрсаткичли яшил ишораси йўналишида ҳаракатланаётган ҳайдовчи бошқа йўналишлардан ҳаракатланаётган транспорт воситаларига йўл бериши керак.', good: 'YHQ 16-боби 105-бандига асосан, тенг аҳамиятга эга бўлган йўллар кесишган чорраҳада релссиз транспорт воситасининг ҳайдовчиси ўнгдан яқинлашаётган транспорт воситаларига йўл бериши шарт.', why: 'Xuddi shu sabab.' },
    { lang: 'ru', bad: 'Согласно главе 15, пункту 100 ПДД, водитель, движущийся в направлении зеленого сигнала дополнительной секции, горящего одновременно с запрещающим красным или желтым сигналом светофора, обязан уступить дорогу транспортным средствам, движущимся с других направлений.', good: 'Согласно пункту 105 главы 16 ПДД, на перекрёстке равнозначных дорог водитель безрельсового транспортного средства обязан уступить дорогу транспортным средствам, приближающимся справа.', why: 'Xuddi shu sabab.' },
  ],
  t_53_q_13: [
    { lang: 'uz_lat', bad: 'YHQ 15-bobi 100-bandiga asosan, svetoforning taqiqlovchi qizil yoki sariq ishorasi bilan bir vaqtda yongan qo\'shimcha tarmoqning ko\'rsatkichli yashil ishorasi yo\'nalishida harakatlanayotgan haydovchi boshqa yo\'nalishlardan harakatlanayotgan transport vositalariga yo\'l berishi kerak.', good: 'YHQ 16-bobi 105-bandiga asosan, teng ahamiyatga ega bo\'lgan yo\'llar kesishgan chorrahada relssiz transport vositasining haydovchisi o\'ngdan yaqinlashayotgan transport vositalariga yo\'l berishi shart.', why: 'Xuddi shu sabab, faqat barcha.json da eskirib qolgan.' },
    { lang: 'uz_cyr', bad: 'YHQ 15-боби 100-бандига асосан, светофорнинг тақиқловчи қизил ёки сариқ ишораси билан бир вақтда ёнган қўшимча тармоқнинг кўрсаткичли яшил ишораси йўналишида ҳаракатланаётган ҳайдовчи бошқа йўналишлардан ҳаракатланаётган транспорт воситаларига йўл бериши керак.', good: 'YHQ 16-боби 105-бандига асосан, тенг аҳамиятга эга бўлган йўллар кесишган чорраҳада релссиз транспорт воситасининг ҳайдовчиси ўнгдан яқинлашаётган транспорт воситаларига йўл бериши шарт.', why: 'Xuddi shu sabab.' },
    { lang: 'ru', bad: 'Согласно главе 15, пункту 100 ПДД, водитель, движущийся в направлении зеленого сигнала дополнительной секции, горящего одновременно с запрещающим красным или желтым сигналом светофора, обязан уступить дорогу транспортным средствам, движущимся с других направлений.', good: 'Согласно пункту 105 главы 16 ПДД, на перекрёстке равнозначных дорог водитель безрельсового транспортного средства обязан уступить дорогу транспортным средствам, приближающимся справа.', why: 'Xuddi shu sabab.' },
  ],
  t_59_q_4: [
    { lang: 'uz_lat', bad: 'Shikastlangan qo\'l yoki oyoqni baland holatda saqlamoq va ichki qon quyilishini oldini olish uchun mumkin qadar tarang bog\'ich bog\'lash lozim. Shikastlangan joyga 15-20 daqiqa muz qo\'yiladi (sovutish uchun sovuq kompress, muzli xalta, sovuq suv va boshqalar ishlatilishi mumkin). Og\'riqni qoldirish uchun shikastlangan organga harakatsizlik sharoiti yaratiladi.', good: 'Bu holat travmatik shok hisoblanadi. Jabrlanganga mutlaqo tinchlik ta\'minlanadi: boshi pastga tushiriladi, oyoqlari ko\'tariladi, badani isitiladi va imkon bo\'lsa qaynoq ichimlik (choy va h.k.) beriladi. Qon ketishini to\'xtatish uchun bog\'langan jgutni shifokordan boshqa hech kim yechmasligi yoki bo\'shatmasligi kerak — bu ichki qon ketishi yoki holatning yomonlashishiga olib kelishi mumkin.', why: 'Savol "jarohatdan behushlanish" haqida (travmatik shok) — v59.json dagi to\'g\'ri izoh boshqa mavzudan (qo\'l/oyoq shikastlanishi qon to\'xtatish) 600.json/barcha.json da eskirib qolgan.' },
    { lang: 'uz_cyr', bad: 'Шикастланган қўл ёки оёқни баланд ҳолатда сақламоқ ва ички қон қуйилишини олдини олиш учун мумкин қадар таранг боғич боғлаш лозим. Шикастланган жойга 15-20 дақиқа муз қўйилади (совутиш учун совуқ компресс, музли халта, совуқ сув ва бошқалар ишлатилиши мумкин). Оғриқни қолдириш учун шикастланган органга ҳаракатсизлик шароити яратилади.', good: 'Бу ҳолат травматик шок ҳисобланади. Жабрланганга мутлақо тинчлик таъминланади: боши пастга туширилади, оёқлари кўтарилади, бадани иситилади ва имкон бўлса қайноқ ичимлик (чой ва ҳ.к.) берилади. Қон кетишини тўхтатиш учун боғланган жгутни шифокордан бошқа ҳеч ким ечмаслиги ёки бўшатмаслиги керак — бу ички қон кетиши ёки ҳолатнинг ёмонлашишига олиб келиши мумкин.', why: 'Xuddi shu sabab.' },
    { lang: 'ru', bad: 'Поврежденную руку или ногу следует держать приподнятой и как можно туже перевязать, чтобы предотвратить внутреннее кровотечение. На травмированное место прикладывают лед на 15–20 минут (для охлаждения можно использовать холодные компрессы, пакеты со льдом, холодную воду и т. д.). Чтобы уйти боль, травмированному органу создают состояние неподвижности.', good: 'Это состояние травматического шока. Пострадавшему обеспечивается полный покой: голову опускают, ноги приподнимают, тело согревают и, если возможно, дают горячее питьё (чай и т.п.). Наложенный жгут для остановки кровотечения нельзя снимать или ослаблять никому, кроме врача — это может привести к внутреннему кровотечению или ухудшению состояния.', why: 'Xuddi shu sabab.' },
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
if (touched.length) {
  console.log('\nO\'zgargan fayllar:');
  for (const t of touched) console.log('  ' + t);
}
if (!APPLY) console.log('\nYozish uchun: node scripts/question-tools/fix-sync-gaps.cjs apply');
