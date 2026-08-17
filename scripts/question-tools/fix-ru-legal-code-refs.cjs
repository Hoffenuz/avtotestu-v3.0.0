// ============================================================================
// fix-ru-legal-code-refs.cjs — butun korpus bo'yicha tekshiruv: ruscha izohda
// "ПДД" (Yo'l harakati qoidalari) o'rniga boshqa, mavjud bo'lmagan yoki mos
// kelmaydigan qonun kodeksi qisqartmalari ishlatilgan (УК, УПК, МВК, НХК,
// ОУК, ТК, КПЕС, ЗК) — bularning barchasi mashina-tarjima xatosi, chunki
// uzbekcha manba har doim "YHQ" (= ПДД) ga ishora qiladi.
//
// Shu bilan birga, xuddi shu turdagi ikkita boshqa aniq xato ham qo'shildi:
//  - "грудной линии" ("ko'krak chizig'i" — ma'nosiz) o'rniga sidirg'a/uzuq-uzuq
//    chiziq haqidagi to'g'ri tavsif (5 ta savolda takrorlangan).
//  - "Апелляция запрещена" ("Апелляция" — appeal/shikoyat, YHQdagi 3.19
//    "Qayrilish taqiqlangan" belgisiga aloqasi yo'q) — "Разворот запрещён".
//
// SAVOL DOIRASIDA ishlaydi (global emas!).
//
//   node scripts/question-tools/fix-ru-legal-code-refs.cjs         # quruq
//   node scripts/question-tools/fix-ru-legal-code-refs.cjs apply   # yozadi
// ============================================================================

const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.resolve(__dirname, '..', '..', 'public');
const APPLY = process.argv.includes('apply');

const GRUDNOY_BAD_1 = 'Линию 1.11 разрешается пересекать по кольцевой линии и по грудной линии только при обгоне или финише круга.';
const GRUDNOY_GOOD = 'Линию 1.11 разрешается пересекать со стороны прерывистой линии, а со стороны сплошной линии — только при завершении обгона или объезда.';

const FIXES = {
  t_12_q_9: [
    { lang: 'ru', bad: 'Приложение 2 к ЗК,', good: 'Приложение 2 к ПДД,', why: '"ЗК" — mavjud bo\'lmagan kod, ПДД bo\'lishi kerak.' },
    { lang: 'ru', bad: GRUDNOY_BAD_1, good: GRUDNOY_GOOD, why: '"грудной линии" ma\'nosiz mashina-tarjima; uz: uzuq-uzuq/sidirg\'a chiziq haqida.' },
  ],
  t_13_q_10: [{ lang: 'ru', bad: 'Глава 24, статья 145 УК:', good: 'Глава 24, статья 145 ПДД:', why: '"УК" (Jinoyat kodeksi) emas, ПДД.' }],
  t_18_q_4: [{ lang: 'ru', bad: 'Согласно гл. 28. ст. 168, ст. 3 УК:', good: 'Согласно гл. 28. ст. 168, ст. 3 ПДД:', why: '"УК" emas, ПДД.' }],
  t_18_q_20: [{ lang: 'ru', bad: '3.19. «Апелляция запрещена».', good: '3.19. «Разворот запрещён».', why: 'uz: "Qayrilish taqiqlangan" = razvorot, "апелляция" (shikoyat) bilan aloqasi yo\'q.' }],
  t_22_q_2: [{ lang: 'ru', bad: 'главе 145 УК, запрещается', good: 'главе 145 ПДД, запрещается', why: '"УК" emas, ПДД.' }],
  t_25_q_1: [{ lang: 'ru', bad: 'статьи 81 УК водителям', good: 'статьи 81 ПДД водителям', why: '"УК" emas, ПДД.' }],
  t_26_q_19: [{ lang: 'ru', bad: 'ПРИЛОЖЕНИЯ 1 к ОУК:', good: 'ПРИЛОЖЕНИЯ 1 к ПДД:', why: '"ОУК" — mavjud bo\'lmagan kod, ПДД bo\'lishi kerak.' }],
  t_29_q_2: [{ lang: 'ru', bad: '3.19. «Апелляция запрещена».', good: '3.19. «Разворот запрещён».', why: 'uz: "Qayrilish taqiqlangan" = razvorot.' }],
  t_39_q_14: [{ lang: 'ru', bad: 'пунктом 3 УК, прежде', good: 'пунктом 3 ПДД, прежде', why: '"УК" emas, ПДД.' }],
  t_32_q_19: [{ lang: 'ru', bad: '«Место покаяния». Запрещено поворачивать налево.', good: '«Место разворота». Запрещено поворачивать налево.', why: 'uz: "Qayrilib olish joyi" — "покаяние" (tavba) bilan aloqasi yo\'q.' }],
  t_44_q_20: [{ lang: 'ru', bad: '«Место покаяния». Запрещено поворачивать налево.', good: '«Место разворота». Запрещено поворачивать налево.', why: 'uz: "Qayrilib olish joyi" — "покаяние" (tavba) bilan aloqasi yo\'q.' }],
  t_45_q_14: [
    { lang: 'ru', bad: 'ПРИЛОЖЕНИЯ 2 к ТК:', good: 'ПРИЛОЖЕНИЯ 2 к ПДД:', why: '"ТК" — mavjud bo\'lmagan kod, ПДД bo\'lishi kerak.' },
    { lang: 'ru', bad: 'Линию 1.11 разрешается пересекать по кольцевой линии, а по грудной линии только при обгоне или финише круга».', good: 'Линию 1.11 разрешается пересекать со стороны прерывистой линии, а со стороны сплошной линии — только при завершении обгона или объезда».', why: '"грудной линии" ma\'nosiz mashina-tarjima.' },
  ],
  t_45_q_9: [{ lang: 'ru', bad: 'статьи 81 УК водителям', good: 'статьи 81 ПДД водителям', why: '"УК" emas, ПДД.' }],
  t_46_q_9: [{ lang: 'ru', bad: 'Приложение 1 к НХК,', good: 'Приложение 1 к ПДД,', why: '"НХК" — mavjud bo\'lmagan kod, ПДД bo\'lishi kerak.' }],
  t_47_q_12: [{ lang: 'ru', bad: 'статьи 145 УК запрещается', good: 'статьи 145 ПДД запрещается', why: '"УК" emas, ПДД.' }],
  t_49_q_14: [{ lang: 'ru', bad: '«ПРИЛОЖЕНИЕ 1 к НХК 3.', good: '«ПРИЛОЖЕНИЕ 1 к ПДД 3.', why: '"НХК" — mavjud bo\'lmagan kod, ПДД bo\'lishi kerak.' }],
  t_50_q_12: [{ lang: 'ru', bad: 'пунктам 2 и 4 УК:', good: 'пунктам 2 и 4 ПДД:', why: '"УК" emas, ПДД.' }],
  t_50_q_9: [{ lang: 'ru', bad: 'приложению 1 ЗК:', good: 'приложению 1 ПДД:', why: '"ЗК" — mavjud bo\'lmagan kod, ПДД bo\'lishi kerak.' }],
  t_56_q_17: [{ lang: 'ru', bad: 'статьи 135 УК ослепший', good: 'статьи 135 ПДД ослепший', why: '"УК" emas, ПДД.' }],
  t_58_q_14: [{ lang: 'ru', bad: 'главе 62 УК, запрещается', good: 'главе 62 ПДД, запрещается', why: '"УК" emas, ПДД.' }],
  t_58_q_2: [{ lang: 'ru', bad: 'ПРИЛОЖЕНИЯ 1 к УПК:', good: 'ПРИЛОЖЕНИЯ 1 к ПДД:', why: '"УПК" (Jinoyat-protsessual kodeksi) emas, ПДД.' }],
  t_60_q_12: [{ lang: 'ru', bad: 'Приложения 1 ОУК:', good: 'Приложения 1 ПДД:', why: '"ОУК" — mavjud bo\'lmagan kod, ПДД bo\'lishi kerak.' }],
  t_61_q_17: [{ lang: 'ru', bad: 'пунктом 3 УК, прежде', good: 'пунктом 3 ПДД, прежде', why: '"УК" emas, ПДД.' }],
  t_62_q_13: [
    { lang: 'ru', bad: 'ПРИЛОЖЕНИЕ 2 к КПЕС, пункт 1.1 и пункт 44, пункт 1.11 и пункт 49, глава 12 КПЕС.', good: 'ПРИЛОЖЕНИЕ 2 к ПДД, пункт 1.1 и пункт 44, пункт 1.11 и пункт 49, глава 12 ПДД.', why: '"КПЕС" — mavjud bo\'lmagan kod, ПДД bo\'lishi kerak.' },
    { lang: 'ru', bad: GRUDNOY_BAD_1, good: GRUDNOY_GOOD, why: '"грудной линии" ma\'nosiz mashina-tarjima.' },
  ],
  t_62_q_17: [
    { lang: 'ru', bad: 'ПРИЛОЖЕНИЯ 2 к ЗК и главы 9 ЗК.', good: 'ПРИЛОЖЕНИЯ 2 к ПДД и главы 9 ПДД.', why: '"ЗК" — mavjud bo\'lmagan kod, ПДД bo\'lishi kerak.' },
    { lang: 'ru', bad: GRUDNOY_BAD_1, good: GRUDNOY_GOOD, why: '"грудной линии" ma\'nosiz mashina-tarjima.' },
  ],
  t_62_q_18: [{ lang: 'ru', bad: 'ПРИЛОЖЕНИЕ 1 к УПК, пункту 3.18.1 и пункту 49, а также главе 9 УПК.', good: 'ПРИЛОЖЕНИЕ 1 к ПДД, пункту 3.18.1 и пункту 49, а также главе 9 ПДД.', why: '"УПК" emas, ПДД.' }],
  t_62_q_9: [{ lang: 'ru', bad: 'ПРИЛОЖЕНИЯ 1 к НХК:', good: 'ПРИЛОЖЕНИЯ 1 к ПДД:', why: '"НХК" — mavjud bo\'lmagan kod, ПДД bo\'lishi kerak.' }],
  t_63_q_2: [
    { lang: 'ru', bad: 'ПРИЛОЖЕНИЯ 1 к НХК:', good: 'ПРИЛОЖЕНИЯ 1 к ПДД:', why: '"НХК" — mavjud bo\'lmagan kod, ПДД bo\'lishi kerak.' },
    { lang: 'ru', bad: '3.19. «Апелляция запрещена».', good: '3.19. «Разворот запрещён».', why: 'uz: "Qayrilish taqiqlangan" = razvorot.' },
  ],
  t_63_q_8: [{ lang: 'ru', bad: 'ПРИЛОЖЕНИЯ 2 к ТК:', good: 'ПРИЛОЖЕНИЯ 2 к ПДД:', why: '"ТК" — mavjud bo\'lmagan kod, ПДД bo\'lishi kerak.' }],
  t_7_q_12: [{ lang: 'ru', bad: 'пункту 1 УК, пассажирам', good: 'пункту 1 ПДД, пассажирам', why: '"УК" emas, ПДД.' }],
  t_9_q_2: [{ lang: 'ru', bad: 'ПРИЛОЖЕНИЯ 2 к ТК:', good: 'ПРИЛОЖЕНИЯ 2 к ПДД:', why: '"ТК" — mavjud bo\'lmagan kod, ПДД bo\'lishi kerak.' }],
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
if (!APPLY) console.log('\nYozish uchun: node scripts/question-tools/fix-ru-legal-code-refs.cjs apply');
