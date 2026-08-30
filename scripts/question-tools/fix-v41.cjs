// ============================================================================
// fix-v41.cjs — v41 tekshiruvida topilgan xatolar, jumladan yana ikkita
// muhim topilma: t_41_q_20 da to'g'ri javob matnida ortiqcha "не" tushib
// qolib, ma'no teskarisiga aylangan; bir nechta izohda "ПДД" o'rniga
// "Российской Федерации" (Rossiya Federatsiyasi) yozilgan — bu O'zbekiston
// YHQ testida mutlaqo mos kelmaydi va allaqachon "tugagan" deb belgilangan
// v20 variantida ham topildi. SAVOL DOIRASIDA ishlaydi.
//
//   node scripts/question-tools/fix-v41.cjs         # quruq yurish
//   node scripts/question-tools/fix-v41.cjs apply   # yozadi
// ============================================================================

const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.resolve(__dirname, '..', '..', 'public');
const APPLY = process.argv.includes('apply');

const FIXES = {
  t_41_q_3: [{ lang: 'ru', bad: 'раздела 2 Приложения 3 Общего собрания:', good: 'раздела 2 Приложения 3 ПДД:', why: '"Общее собрание" — mavjud bo\'lmagan kod, ПДД bo\'lishi kerak.' }],
  t_41_q_7: [{ lang: 'ru', bad: '7.17. \\"Неполноценный\\".', good: '7.17. «Инвалиды».', why: 'uz: "Nogironlar" — "Неполноценный" (kamchilikli) haqoratli va noto\'g\'ri tarjima, to\'g\'risi "Инвалиды".' }],
  t_41_q_8: [{ lang: 'ru', bad: 'ПРИЛОЖЕНИЕ 4 к HC по пункту 5.2:', good: 'ПРИЛОЖЕНИЕ 4 к ПДД по пункту 5.2:', why: '"HC" — mavjud bo\'lmagan lotincha qisqartma, ПДД bo\'lishi kerak.' }],
  t_41_q_9: [{ lang: 'ru', bad: 'Т-Саймон указывает направление движения на перекрестке', good: 'указывает направление движения на Т-образном перекрёстке', why: '"Т-Саймон" — "T-simon" (T-shakldagi) so\'zining ma\'nosiz transliteratsiyasi, standart ruscha atama "Т-образный" bo\'lishi kerak (savol matnining o\'zida ham shu atama ishlatilgan).' }],
  t_41_q_12: [{ lang: 'ru', bad: 'Приложения 3 Российской Федерации:', good: 'Приложения 3 ПДД:', why: 'Bu O\'zbekiston YHQ testi, "Российской Федерации" (Rossiya Federatsiyasi) mos kelmaydi — ПДД bo\'lishi kerak.' }],
  t_20_q_17: [{ lang: 'ru', bad: 'ПРИЛОЖЕНИЯ 1 для Российской Федерации:', good: 'приложения 1 к ПДД:', why: '"Российской Федерации" mos kelmaydi — ПДД bo\'lishi kerak.' }],
  t_37_q_15: [{ lang: 'ru', bad: 'Приложения 3 Российской Федерации «Условия,', good: 'Приложения 3 ПДД «Условия,', why: '"Российской Федерации" mos kelmaydi — ПДД bo\'lishi kerak.' }],
  t_41_q_20: [{
    lang: 'ru',
    bad: 'Если это невозможно сделать со стороны тротуара или обочины и при условии, что это будет безопасно и создает помех другим участникам движения',
    good: 'Если это невозможно сделать со стороны тротуара или обочины и при условии, что это будет безопасно и не создает помех другим участникам движения',
    why: 'To\'g\'ri javob matnida ortiqcha "не" tushib qolgan edi: uz "хавф-хатарсиз бўлса ва бошқа ҳаракат қатнашчиларига халақит бермаса" (халақит БЕРМАСА = "не создает помех"), lekin ruscha matn "создает помех" (халақит БЕРАДИ) deb teskari ma\'noda yozilgan edi.',
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
if (!APPLY) console.log('\nYozish uchun: node scripts/question-tools/fix-v41.cjs apply');
