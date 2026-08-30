// ============================================================================
// fix-v49.cjs — v49 tekshiruvida topilgan xatolar. SAVOL DOIRASIDA ishlaydi.
//
//   node scripts/question-tools/fix-v49.cjs         # quruq yurish
//   node scripts/question-tools/fix-v49.cjs apply   # yozadi
// ============================================================================

const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.resolve(__dirname, '..', '..', 'public');
const APPLY = process.argv.includes('apply');

const FIXES = {
  t_49_q_3: [
    { lang: 'uz_lat', bad: '\\"YHQning 9-bob', good: 'YHQning 9-bob', why: 'Izoh boshida ortiqcha (juft bo\'lmagan) qo\'shtirnoq bor edi.' },
    { lang: 'uz_lat', bad: 'bu tramvay harakatiga xalaqit bermasligi kerak.\\"', good: 'bu tramvay harakatiga xalaqit bermasligi kerak.', why: 'Izoh oxirida ortiqcha (juft bo\'lmagan) qo\'shtirnoq bor edi.' },
    { lang: 'uz_cyr', bad: '\\"YHQнинг 9-боб', good: 'YHQнинг 9-боб', why: 'Изоҳ бошида ортиқча (жуфт бўлмаган) қўштирноқ бор эди.' },
    { lang: 'uz_cyr', bad: 'бу трамвай ҳаракатига халақит бермаслиги керак.\\"', good: 'бу трамвай ҳаракатига халақит бермаслиги керак.', why: 'Изоҳ охирида ортиқча (жуфт бўлмаган) қўштирноқ бор эди.' },
    { lang: 'ru', bad: 'мешать трамвайному движению».', good: 'мешать трамвайному движению.', why: 'Matn oxirida ortiqcha yopuvchi qo\'shtirnoq (») bor edi, unga mos ochuvchi qo\'shtirnoq yo\'q edi.' },
  ],
  t_49_q_5: [
    { lang: 'ru', bad: 'В соответствии со статьей 11 - главой 78 ПДД: Разрешается движение транспортных средств со скоростью 70 километров в час в жилых районах, 30 километров в час до подъезда к школам и дошкольным образовательным учреждениям с соответствующими дорожными знаками и проездом на расстоянии менее 300 метров, а также 20 километров в час в жилых кварталах и прилегающих к ним территориях (на земельных участках между жилыми домами).', good: 'Согласно статье 78 главы 11 ПДД: в населённых пунктах разрешается движение транспортных средств со скоростью не более 70 километров в час, на расстоянии менее 300 метров до и после школ и дошкольных образовательных учреждений с соответствующими дорожными знаками — не более 30 километров в час, а в жилых кварталах и на прилегающих к ним территориях (на земельных участках между жилыми домами) — не более 20 километров в час.', why: 'JIDDIY XATO: manba havolasida bob/band raqamlari almashib qolgan edi ("статьей 11 - главой 78" — aslida band 78, bob 11). Bundan ham muhimi, matn 70 km/soatni "turar joy dahalarida" (aslida u yerda 20 km/soat!) deb noto\'g\'ri ko\'rsatgan edi — bu haydovchini xavfli darajada chalg\'itadigan xato, chunki 70 km/soat aslida umuman aholi punktlari uchun, turar joy dahalari uchun esa 20 km/soat.' },
  ],
  t_49_q_6: [
    { lang: 'ru', bad: 'при вытягивании правой руки регулятора вперед', good: 'при вытягивании правой руки регулировщика вперед', why: '"регулятор" (qurilma) emas, "регулировщик" (tartibga soluvchi shaxs) bo\'lishi kerak — korpusda barqaror atama.' },
    { lang: 'ru', bad: 'переходить проезжую часть позади регулятора.', good: 'переходить проезжую часть позади регулировщика.', why: '"регулятор" (qurilma) emas, "регулировщик" (tartibga soluvchi shaxs) bo\'lishi kerak — korpusda barqaror atama.' },
  ],
  t_49_q_14: [
    { lang: 'uz_lat', bad: '\\"YHQga 1-ILOVA 3.Taqiqlovchi', good: 'YHQga 1-ILOVA 3.Taqiqlovchi', why: 'Izoh boshida ortiqcha (juft bo\'lmagan) qo\'shtirnoq bor edi.' },
    { lang: 'uz_lat', bad: 'ta’siri yo‘qolmaydi.\\"', good: 'ta’siri yo‘qolmaydi.', why: 'Izoh oxirida ortiqcha (juft bo\'lmagan) qo\'shtirnoq bor edi.' },
    { lang: 'uz_cyr', bad: '\\"YHQга 1-ИЛОВА 3.Тақиқловчи', good: 'YHQга 1-ИЛОВА 3.Тақиқловчи', why: 'Изоҳ бошида ортиқча (жуфт бўлмаган) қўштирноқ бор эди.' },
    { lang: 'uz_cyr', bad: 'таъсири йўқолмайди.\\"', good: 'таъсири йўқолмайди.', why: 'Изоҳ охирида ортиқча (жуфт бўлмаган) қўштирноқ бор эди.' },
    { lang: 'ru', bad: '«ПРИЛОЖЕНИЕ 1 к ПДД 3.', good: 'ПРИЛОЖЕНИЕ 1 к ПДД 3.', why: 'Matn boshida ortiqcha ochuvchi qo\'shtirnoq («) bor edi, unga mos yopuvchi qo\'shtirnoq yo\'q edi.' },
  ],
  t_49_q_18: [
    { lang: 'ru', bad: 'действие (маневр),совершаемое водителями с цельюне препятствовать движению других участников дорожного движения вслучае опасности', good: 'действие (манёвр), совершаемое водителями с целью не препятствовать движению других участников дорожного движения в случае опасности', why: 'Bo\'shliqlar tushib qolgan (so\'zlar qo\'shilib ketgan): "цельюне", "вслучае".' },
    { lang: 'ru', bad: 'линией 1.9и оборудованным', good: 'линией 1.9 и оборудованным', why: 'Bo\'shliq tushib qolgan.' },
    { lang: 'ru', bad: 'с одной полосына другую', good: 'с одной полосы на другую', why: 'Bo\'shliq tushib qolgan.' },
    { lang: 'ru', bad: 'Перестановка заключается', good: 'Перестроение заключается', why: 'Savol matni va to\'g\'ri javob variantida barqaror "Перестроение" atamasi ishlatiladi, lekin izoh boshqa so\'z "Перестановка" bilan boshlangan edi — atama nomuvofiqligi.' },
  ],
  t_49_q_20: [
    { lang: 'ru', bad: 'A) Звуковые сигналы', good: 'Звуковые сигналы', why: 'uz_lat/uz_cyr variantlarida bunday "A)" prefiksi yo\'q — ortiqcha, tasodifiy qolib ketgan belgi.' },
    { lang: 'ru', bad: 'B) Фары дальнего света', good: 'Фары дальнего света', why: 'uz_lat/uz_cyr variantlarida bunday "B)" prefiksi yo\'q — ortiqcha, tasodifiy qolib ketgan belgi.' },
    { lang: 'uz_lat', bad: '\\"YHQning 8-bob', good: 'YHQning 8-bob', why: 'Izoh boshida ortiqcha (juft bo\'lmagan) qo\'shtirnoq bor edi.' },
    { lang: 'uz_lat', bad: 'ogohlantirish ishorasini ham berish mumkin.\\"', good: 'ogohlantirish ishorasini ham berish mumkin.', why: 'Izoh oxirida ortiqcha (juft bo\'lmagan) qo\'shtirnoq bor edi.' },
    { lang: 'uz_cyr', bad: '\\"YHQнинг 8-боб', good: 'YHQнинг 8-боб', why: 'Изоҳ бошида ортиқча (жуфт бўлмаган) қўштирноқ бор эди.' },
    { lang: 'uz_cyr', bad: 'огоҳлантириш ишорасини ҳам бериш мумкин.\\"', good: 'огоҳлантириш ишорасини ҳам бериш мумкин.', why: 'Изоҳ охирида ортиқча (жуфт бўлмаган) қўштирноқ бор эди.' },
    { lang: 'ru', bad: 'Согласно «Главе 8.', good: 'Согласно Главе 8.', why: 'Matn boshida ortiqcha ochuvchi qo\'shtirnoq («) bor edi, unga mos yopuvchi qo\'shtirnoq yo\'q edi.' },
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
if (!APPLY) console.log('\nYozish uchun: node scripts/question-tools/fix-v49.cjs apply');
