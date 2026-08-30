// ============================================================================
// fix-v47.cjs — v47 tekshiruvida topilgan xatolar. SAVOL DOIRASIDA ishlaydi.
//
//   node scripts/question-tools/fix-v47.cjs         # quruq yurish
//   node scripts/question-tools/fix-v47.cjs apply   # yozadi
// ============================================================================

const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.resolve(__dirname, '..', '..', 'public');
const APPLY = process.argv.includes('apply');

const FIXES = {
  t_47_q_1: [
    { lang: 'ru', bad: 'Согласно пункту 7 пункта 17:', good: 'Согласно пункту 7, абзацу 17:', why: '"пункта 17" o\'rniga "абзацу 17" bo\'lishi kerak (uz: "17-xatboshi" = abzats, band emas) — "пункту...пункта" grammatik jihatdan noto\'g\'ri takrorlanish.' },
  ],
  t_47_q_2: [
    { lang: 'uz_lat', bad: '\\"YHQning 16-bob', good: 'YHQning 16-bob', why: 'Izoh boshida ortiqcha (juft bo\'lmagan) qo\'shtirnoq bor edi.' },
    { lang: 'uz_lat', bad: 'oldin o‘tish huquqiga ega bo‘ladi.\\"', good: 'oldin o‘tish huquqiga ega bo‘ladi.', why: 'Izoh oxirida ortiqcha (juft bo\'lmagan) qo\'shtirnoq bor edi.' },
    { lang: 'uz_cyr', bad: '\\"YHQнинг 16-боб', good: 'YHQнинг 16-боб', why: 'Изоҳ бошида ортиқча (жуфт бўлмаган) қўштирноқ бор эди.' },
    { lang: 'uz_cyr', bad: 'олдин ўтиш ҳуқуқига эга бўлади.\\"', good: 'олдин ўтиш ҳуқуқига эга бўлади.', why: 'Изоҳ охирида ортиқча (жуфт бўлмаган) қўштирноқ бор эди.' },
    { lang: 'ru', bad: 'преимущество перед нерельсовым транспортом».', good: 'преимущество перед нерельсовым транспортом.', why: 'Matn oxirida ortiqcha yopuvchi qo\'shtirnoq (») bor edi, unga mos ochuvchi qo\'shtirnoq yo\'q edi.' },
  ],
  t_47_q_3: [
    { lang: 'uz_lat', bad: 'harakatlanmochisiz', good: 'harakatlanmoqchisiz', why: 'Yozuv xatosi: "harakatlanmoqchisiz" so\'zida "қ" (q) harfi tushib qolgan.' },
    { lang: 'uz_cyr', bad: 'ҳаракатланмочисиз', good: 'ҳаракатланмоқчисиз', why: 'Ёзув хатоси: "ҳаракатланмоқчисиз" сўзида "қ" ҳарфи тушиб қолган.' },
  ],
  t_47_q_9: [
    { lang: 'ru', bad: 'означает, что к указанному населенному пункту или объекту можно переехать к указанному населенному пункту или объекту после выезда из этого населенного пункта по автомобильной дороге или другой дороге,', good: 'означает, что к указанному населенному пункту или объекту можно доехать после выезда из этого населенного пункта по автомагистрали или другой дороге,', why: '"к указанному населенному пункту или объекту можно переехать к указанному..." iborasi ikki marta takrorlangan edi; shuningdek uz "avtomagistral" atamasiga mos "автомагистрали" ishlatildi ("автомобильной дороге" o\'rniga).' },
  ],
  t_47_q_12: [
    { lang: 'ru', bad: 'запрещается брать ограждение в следующих случаях: на гибкой соединителе при скользкой дороге.', good: 'буксировка запрещается в следующих случаях: на гибкой сцепке при гололедице, на скользкой дороге.', why: 'uz: "Shatakka olish... taqiqlangan... egiluvchan ulagichda" (shatakka olish = буксировка) — "брать ограждение" (to\'siqni olish) mavzuga aloqasi yo\'q noto\'g\'ri tarjima, xuddi ilgari t_43_q_20 da topilgan xato bilan bir xil toifadan.' },
  ],
  t_47_q_15: [
    { lang: 'ru', bad: 'в транспортных средствах, предусмотренных конструкцией ремней безопасности?', good: 'в транспортных средствах, конструкцией которых предусмотрены ремни безопасности:', why: 'Jumla teskari tuzilgan edi ("transport vositalari xavfsizlik kamari konstruksiyasi tomonidan ko\'zda tutilgan" — ma\'nosiz), to\'g\'risi "konstruksiyasida xavfsizlik kamari ko\'zda tutilgan transport vositalarida" (uz asl matniga mos).' },
  ],
  t_47_q_16: [
    { lang: 'ru', bad: 'отделена от других полос проезжей части кольцевой линией', good: 'отделена от других полос проезжей части прерывистой линией', why: 'uz: "uzuq-uzuq chiziq bilan ajratilgan" (uzuq-uzuq = прерывистая) — "кольцевой" (halqasimon) noto\'g\'ri tarjima.' },
  ],
  t_47_q_17: [
    { lang: 'ru', bad: 'согласованной с DYHXX.', good: 'согласованной с ГСБДД.', why: 'Shu savolning o\'zi javob variantida bir xil tashkilot "ГСБДД" deb to\'g\'ri nomlangan — izohda tarjima qilinmagan lotincha "DYHXX" qisqartmasi qolib ketgan edi.' },
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
if (!APPLY) console.log('\nYozish uchun: node scripts/question-tools/fix-v47.cjs apply');
