// ============================================================================
// fix-v46.cjs — v46 tekshiruvida topilgan xatolar. SAVOL DOIRASIDA ishlaydi.
//
//   node scripts/question-tools/fix-v46.cjs         # quruq yurish
//   node scripts/question-tools/fix-v46.cjs apply   # yozadi
// ============================================================================

const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.resolve(__dirname, '..', '..', 'public');
const APPLY = process.argv.includes('apply');

const FIXES = {
  t_46_q_2: [
    { lang: 'ru', bad: 'Разрешается ли объезжать стоящие перед переездом транспортные средства при закрытом шлагбауме?', good: 'Разрешается ли объезжать стоящие перед переездом транспортные средства по полосе встречного движения?', why: 'uz matnda "shlagbaum yopiq bo\'lganda" haqida umuman gap yo\'q — bu qo\'shimcha shart javob variantlariga (tezlik, mototsikl) mos kelmaydi, uz asl matniga moslashtirildi.' },
    { lang: 'ru', bad: 'запрещается объезжать стоящие перед перекрестком транспортные средства по встречной полосе движения.', good: 'запрещается объезжать стоящие перед переездом транспортные средства по встречной полосе движения.', why: 'Savol mavzusi temir yo\'l kesishmasi (переезд) haqida, lekin izohda "перекрестком" (oddiy chorraha) deyilgan edi — mavzu nomuvofiqligi.' },
  ],
  t_46_q_3: [
    { lang: 'ru', bad: 'если отсутствует предусмотренные конструкцией транспортного средства зеркала заднего вида?', good: 'если отсутствуют предусмотренные конструкцией транспортного средства зеркала заднего вида?', why: 'Grammatik xato: "зеркала" (ko\'plik) bilan "отсутствует" (birlik) mos kelmaydi.' },
    { lang: 'ru', bad: 'их использование запрещается, если транспортное средство не имеет окон, предусмотренных конструкцией транспортного средства.', good: 'их использование запрещается, если транспортное средство не имеет зеркал, предусмотренных конструкцией транспортного средства.', why: 'Butun savol ko\'zgular (зеркала) haqida, lekin bu joyda "окон" (derazalar) — mavzuga aloqasi yo\'q noto\'g\'ri so\'z ishlatilgan edi.' },
  ],
  t_46_q_6: [
    { lang: 'ru', bad: 'под мостами, эстакадами и эстакадами с числом полос', good: 'под мостами, эстакадами и путепроводами с числом полос', why: 'uz: "ko\'prik, yo\'l o\'tkazgich va estakadalar" (3 xil atama) — ruschada "эстакадами" so\'zi ikki marta takrorlangan, "путепроводами" bo\'lishi kerak edi.' },
  ],
  t_46_q_9: [
    { lang: 'uz_lat', bad: '\\"YHQga 1-ILOVA 3.24', good: 'YHQga 1-ILOVA 3.24', why: 'Izoh boshida ortiqcha (juft bo\'lmagan) qo\'shtirnoq bor edi.' },
    { lang: 'uz_lat', bad: 'belgisini o‘rnatish bilan.\\"', good: 'belgisini o‘rnatish bilan.', why: 'Izoh oxirida ortiqcha (juft bo\'lmagan) qo\'shtirnoq bor edi.' },
    { lang: 'uz_cyr', bad: '\\"YHQга 1-ИЛОВА 3.24', good: 'YHQга 1-ИЛОВА 3.24', why: 'Изоҳ бошида ортиқча (жуфт бўлмаган) қўштирноқ бор эди.' },
    { lang: 'uz_cyr', bad: 'белгисини ўрнатиш билан.\\"', good: 'белгисини ўрнатиш билан.', why: 'Изоҳ охирида ортиқча (жуфт бўлмаган) қўштирноқ бор эди.' },
    { lang: 'ru', bad: '\\"Большая скорость ограничена\\".', good: '«Ограничение максимальной скорости».', why: 'Shu savolning o\'zi matnida bir xil belgi "Ограничение максимальной скорости" deb to\'g\'ri nomlangan — izohdagi so\'zma-so\'z tarjima ("katta tezlik cheklangan") o\'ziga zid edi.' },
    { lang: 'ru', bad: '3.31. «Конец всем ограничениям». 3.16, 3.20, 3.22, 3.24, 3.26 — Конец регионов, где одновременно применяется более одного из 3.30.', good: '3.31. «Конец всех ограничений». Конец зон действия, где одновременно применяется несколько из знаков 3.16, 3.20, 3.22, 3.24, 3.26 — 3.30.', why: 'Ro\'yxat 3.26 dan keyin uzilib qolgan va "3.30" mantiqsiz alohida gapga aylantirilgan edi ("более одного из 3.30" — 3.30 dan ortiq, ma\'nosiz), uz asl matni ("3.26 — 3.30 belgilaridan bir nechtasiga") asosida tuzatildi.' },
    { lang: 'ru', bad: 'Действие отметки 3.24, установленной до достижения населенных пунктов, действует до отметки 5.22.', good: 'Действие знака 3.24, установленного до достижения населенных пунктов, действует до знака 5.22.', why: '"отметки" (belgi/nishon) o\'rniga korpusda barqaror "знака" atamasi ishlatilishi kerak.' },
    { lang: 'ru', bad: 'Объем знаков можно уточнить:', good: 'Зона действия знаков может быть уточнена:', why: 'uz: "Belgilarning ta\'sir doirasi aniqlashtirilishi mumkin" — "Объем" (hajm) noto\'g\'ri tarjima, "зона действия" (ta\'sir doirasi) bo\'lishi kerak.' },
    { lang: 'ru', bad: 'За диапазоном действия символа 3.24 следует установка символа 3.24 с указанием другой наивысшей скорости».', good: 'Диапазон действия знака 3.24 может быть уточнён установкой ещё одного знака 3.24 с указанием другой максимальной скорости.', why: '"символа" o\'rniga "знака" (korpus konvensiyasi), va oxiridagi yakkalanib qolgan yopuvchi qo\'shtirnoq (») olib tashlandi (unga mos ochuvchi qo\'shtirnoq yo\'q edi).' },
  ],
  t_46_q_11: [
    { lang: 'uz_lat', bad: 'Faqat yo Ining tor qismlarida', good: "Faqat yo'lning tor qismlarida", why: 'Buzilgan matn ("yo Ining") — to\'g\'ri so\'z "yo\'lning" (yo\'l so\'zining qaratqich kelishigi).' },
    { lang: 'uz_cyr', bad: 'Фақат ёки унинг тор қисмларида', good: 'Фақат йўлнинг тор қисмларида', why: 'Buzilgan matn ("ёки унинг" — "yoki uning") — to\'g\'ri so\'z "йўлнинг" (yo\'l so\'zining qaratqich kelishigi).' },
    { lang: 'ru', bad: 'Только между узкой частью ствола', good: 'Только на узких участках дороги', why: '"ствола" (tanaga/gilza) — mavzuga (yo\'l) aloqasi yo\'q, jiddiy noto\'g\'ri tarjima.' },
  ],
  t_46_q_14: [
    { lang: 'uz_lat', bad: 'avtobuslarga vα mikroavtobuslarga', good: 'avtobuslarga va mikroavtobuslarga', why: '"vα" — grek harfi α bilan aralashgan yozuv xatosi, "va" bo\'lishi kerak.' },
    { lang: 'uz_cyr', bad: 'автобусларга вα микроавтобусларга', good: 'автобусларга ва микроавтобусларга', why: '"вα" — грек ҳарфи α билан аралашган ёзув хатоси, "ва" бўлиши керак.' },
  ],
  t_46_q_16: [
    { lang: 'uz_cyr', bad: 'ҳаракат хавфсизлигини таъминлайди"', good: 'ҳаракат хавфсизлигини таъминлайди?"', why: 'uz_lat va ru variantlarida savol so\'roq belgisi (?) bilan tugaydi, uz_cyr da tushib qolgan edi.' },
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
if (!APPLY) console.log('\nYozish uchun: node scripts/question-tools/fix-v46.cjs apply');
