// ============================================================================
// fix-v37.cjs — v37 tekshiruvida topilgan xatolar. SAVOL DOIRASIDA ishlaydi.
//
// t_37_q_9 alohida qayd etiladi: uning izohi (uz VA ru, ikkalasi ham) butunlay
// boshqa belgi (4.7 "Eng kam tezlik") haqida edi, holbuki savol va rasm
// (yashil o'ngga strelka) 5.42 "Qizil chiroqda o'ngga harakatlanish"
// belgisiga oid. To'g'ri matn xuddi shu savolning boshqa nusxasidan
// (t_62_q_9, bir xil savol va rasm) olindi.
//
//   node scripts/question-tools/fix-v37.cjs         # quruq yurish
//   node scripts/question-tools/fix-v37.cjs apply   # yozadi
// ============================================================================

const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.resolve(__dirname, '..', '..', 'public');
const APPLY = process.argv.includes('apply');

const FIXES = {
  t_37_q_4: [{ lang: 'ru', bad: 'Пиеда', good: 'Пешеход', why: '"Пиеда" — haqiqiy ruscha so\'z emas (uzbekcha "пиёда" bilan aralashib ketgan), "Пешеход" bo\'lishi kerak.' }],
  t_37_q_5: [{ lang: 'ru', bad: 'рулевые колеса начнут вращаться не на своем месте.', good: 'ведущие колёса начнут пробуксовывать.', why: 'uz: "boshqaruvchi/yetakchi g\'ildiraklar o\'rnidan jimlay aylanadi" (g\'ildirak sirpanishi) — to\'g\'ri javob matni ("Ведущие колеса будут пробуксовывать") bilan mos holga keltirildi.' }],
  t_37_q_6: [
    { lang: 'ru', bad: 'атакже', good: 'а также', why: 'Qo\'shilib ketgan so\'zlar.' },
    { lang: 'ru', bad: 'ПДД 13 - Глава 91 - Пункт: Парковка запрещена: в пределах 30 метров от мест возврата транспортных средств.', good: 'Согласно статье 91 главы 13 ПДД: остановка запрещена в пределах 30 метров от мест разворота транспортных средств.', why: 'uz: "qayrilib olish joylarida" = "мест разворота" ("возврата" emas); jumla tuzilishi ham boshqa izohlar bilan bir xil shaklga keltirildi.' },
  ],
  t_37_q_9: [
    { lang: 'ru', bad: 'чтобы разрешить транспортным средствам без реле поворот направо?', good: 'чтобы разрешить безрельсовым транспортным средствам поворот направо?', why: '"без реле" ("relesiz"?!) — "релссиз" (rельссиз/безрельсовый, tramvaydan farqli) so\'zining noto\'g\'ri tarjimasi.' },
    { lang: 'uz_lat', bad: 'YHQ 1-ilovasining 4-bo\'limidagi 4.7 belgiga asosan, "Eng kam tezlik" belgisi faqat unda ko\'rsatilgan yoki undan yuqori tezlikda (km/soat) harakatlanishga ruxsat etiladi.', good: 'YHQga 1-ILOVA 5.42 bandiga asosan: 5.42. «Qizil chiroqda o\'ngga harakatlanish». Transport svetofori qizil chirog\'ining o\'ng yoniga 5.42 yo\'l belgisi o\'rnatilgan bo\'lsa, transport vositalarining haydovchilari svetoforning taqiqlovchi ishorasi yonib turganda, barcha xavfsizlik choralarini ko\'rgan holda o\'ngga burilishlari mumkin. Bunda ular harakat yo\'nalishi bo\'yicha va burilayotgan ko\'chani kesib o\'tayotgan piyodalarga hamda boshqa transport vositalariga yo\'l berishlari shart.', why: 'Izoh savol mavzusiga (5.42 belgisi) emas, butunlay boshqa belgiga (4.7 "Eng kam tezlik") tegishli edi — nusxa ko\'chirish xatosi. To\'g\'ri matn shu savolning boshqa nusxasi t_62_q_9 dan olindi.' },
    { lang: 'uz_cyr', bad: 'YHQ 1-иловасининг 4-бўлимидаги 4.7 белгига асосан, "Энг кам тезлик" белгиси фақат унда кўрсатилган ёки ундан юқори тезликда (км/соат) ҳаракатланишга рухсат этилади.', good: 'YHQга 1-ИЛОВА 5.42 бандига асосан: 5.42. «Қизил чироқда ўнгга ҳаракатланиш». Транспорт светофори қизил чироғининг ўнг ёнига 5.42 йўл белгиси ўрнатилган бўлса, транспорт воситаларининг ҳайдовчилари светофорнинг тақиқловчи ишораси ёниб турганда, барча хавфсизлик чораларини кўрган ҳолда ўнгга бурилишлари мумкин. Бунда улар ҳаракат йўналиши бўйича ва бурилаётган кўчани кесиб ўтаётган пиёдаларга ҳамда бошқа транспорт воситаларига йўл беришлари шарт.', why: 'Xuddi shu nusxa ko\'chirish xatosi kirillcha nusxada.' },
    { lang: 'ru', bad: 'Согласно знаку 4.7 Приложения 1, раздел 4 знака «Минимальная скорость» разрешается двигаться только со скоростью (км/ч), указанной на нем.', good: 'Согласно пункту 5.42 ПРИЛОЖЕНИЯ 1 к ПДД: 5.42. «Двигаемся направо на красный свет». Если дорожный знак 5.42 установлен справа от красного света светофора, водители транспортных средств могут повернуть направо при горящем запрещающем знаке светофора, соблюдая все меры безопасности. При этом они должны уступать дорогу пешеходам и другим транспортным средствам, пересекающим поворачивающую улицу по направлению движения транспорта.', why: 'Xuddi shu nusxa ko\'chirish xatosi ruscha izohda.' },
  ],
  t_37_q_20: [{ lang: 'ru', bad: 'приложения 2 Общего административного кодекса:', good: 'приложения 2 ПДД:', why: '"Общий административный кодекс" — mavjud bo\'lmagan/mos kelmaydigan kodeks, ПДД bo\'lishi kerak.' }],
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
if (!APPLY) console.log('\nYozish uchun: node scripts/question-tools/fix-v37.cjs apply');
