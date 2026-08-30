// ============================================================================
// fix-general-zakon.cjs — v50 tekshiruvi paytida t_50_q_17 da topilgan tizimli
// "ПДД o'rniga boshqa nom" xatosining ("Общего закона") BUTUN KORPUS bo'yicha
// qolgan namunalarini tuzatadi. scan_general_zakon.cjs orqali topilgan 3 ta
// global_id: t_29_q_2, t_57_q_7, t_61_q_10 — bularning barchasi hali
// navbatdagi variant-bo'yicha tekshiruvga yetib borilmagan (v29 "tugagan" deb
// belgilangan bo'lsa ham, bu aniq gid o'sha safar sinchiklab o'qilmagan).
// SAVOL DOIRASIDA ishlaydi.
//
//   node scripts/question-tools/fix-general-zakon.cjs         # quruq yurish
//   node scripts/question-tools/fix-general-zakon.cjs apply   # yozadi
// ============================================================================

const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.resolve(__dirname, '..', '..', 'public');
const APPLY = process.argv.includes('apply');

const FIXES = {
  t_29_q_2: [
    { lang: 'ru', bad: 'ПРИЛОЖЕНИЕ 1 к Общим правилам, согласно п.3.19,', good: 'ПРИЛОЖЕНИЕ 1 к ПДД, согласно п.3.19,', why: 'Tizimli xato: "ПДД" o\'rniga mavjud bo\'lmagan "Общим правилам" ishlatilgan edi.' },
  ],
  t_57_q_7: [
    { lang: 'uz_lat', bad: '\\"YHQning 9-bob', good: 'YHQning 9-bob', why: 'Izoh boshida ortiqcha (juft bo\'lmagan) qo\'shtirnoq bor edi.' },
    { lang: 'uz_lat', bad: 'egallashi shart.\\"', good: 'egallashi shart.', why: 'Izoh oxirida ortiqcha (juft bo\'lmagan) qo\'shtirnoq bor edi.' },
    { lang: 'uz_cyr', bad: '\\"YHQнинг 9-боб', good: 'YHQнинг 9-боб', why: 'Изоҳ бошида ортиқча (жуфт бўлмаган) қўштирноқ бор эди.' },
    { lang: 'uz_cyr', bad: 'эгаллаши шарт.\\"', good: 'эгаллаши шарт.', why: 'Изоҳ охирида ортиқча (жуфт бўлмаган) қўштирноқ бор эди.' },
    { lang: 'ru', bad: 'Согласно «Главе 9. Статья 56, пункт 1 Общего закона и Приложения 1 к Общему закону, пункт 5.6:', good: 'Согласно Главе 9, статье 56, пункту 1 ПДД и приложению 1 к ПДД, пункту 5.6:', why: 'Tizimli xato: "ПДД" o\'rniga ikki marta "Общего закона"/"Общему закону" ishlatilgan edi, bundan tashqari boshida juft bo\'lmagan ochuvchi qo\'shtirnoq (« ) bor edi.' },
    { lang: 'ru', bad: 'предназначенного для движения в этом направлении".', good: 'предназначенного для движения в этом направлении.', why: 'Matn oxirida ortiqcha qo\'shtirnoq bor edi (juft emas).' },
  ],
  t_61_q_10: [
    { lang: 'ru', bad: 'раздела 5 приложения 1 Общего закона:', good: 'раздела 5 приложения 1 ПДД:', why: 'Tizimli xato: "ПДД" o\'rniga mavjud bo\'lmagan "Общего закона" ishlatilgan edi.' },
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
if (!APPLY) console.log('\nYozish uchun: node scripts/question-tools/fix-general-zakon.cjs apply');
