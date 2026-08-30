// ============================================================================
// fix-ru-legal-code-refs-2.cjs — fix-ru-legal-code-refs.cjs bilan bir xil
// muammo turkumidan yana 7 ta yangi topilgan hol: "ПДД" o'rniga "ХК", "НПД",
// "ШК", "ХХ" kabi mavjud bo'lmagan qisqartmalar, shuningdek "ГСБДД"
// (Davlat yo'l harakati xavfsizligi xizmati) noto'g'ri "ДЮХХХ" deb
// yozilgan va bitta jumlada butunlay tushib qolgan "uzuq-uzuq tomoni"
// mazmuni ("КАД" degan ma'nosiz so'z bilan almashtirilgan).
//
// SAVOL DOIRASIDA ishlaydi (global emas!).
//
//   node scripts/question-tools/fix-ru-legal-code-refs-2.cjs         # quruq
//   node scripts/question-tools/fix-ru-legal-code-refs-2.cjs apply   # yozadi
// ============================================================================

const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.resolve(__dirname, '..', '..', 'public');
const APPLY = process.argv.includes('apply');

const FIXES = {
  t_18_q_6: [{ lang: 'ru', bad: 'приложения 3 ХК,', good: 'приложения 3 ПДД,', why: '"ХК" — mavjud bo\'lmagan kod, ПДД bo\'lishi kerak.' }],
  t_25_q_16: [{ lang: 'ru', bad: 'приложения 3 ХК,', good: 'приложения 3 ПДД,', why: '"ХК" — mavjud bo\'lmagan kod, ПДД bo\'lishi kerak.' }],
  t_26_q_9: [{ lang: 'ru', bad: 'приложения 3 ХК,', good: 'приложения 3 ПДД,', why: '"ХК" — mavjud bo\'lmagan kod, ПДД bo\'lishi kerak.' }],
  t_44_q_8: [{ lang: 'ru', bad: 'приложения 3 ХК,', good: 'приложения 3 ПДД,', why: '"ХК" — mavjud bo\'lmagan kod, ПДД bo\'lishi kerak.' }],
  t_9_q_13: [{ lang: 'ru', bad: 'в приложении 1 ХК, 3.28.', good: 'в приложении 1 ПДД, 3.28.', why: '"ХК" — mavjud bo\'lmagan kod, ПДД bo\'lishi kerak.' }],
  t_32_q_6: [{ lang: 'ru', bad: 'в приложении 1 ХК, 3.28.', good: 'в приложении 1 ПДД, 3.28.', why: '"ХК" — mavjud bo\'lmagan kod, ПДД bo\'lishi kerak.' }],
  t_43_q_11: [{ lang: 'ru', bad: 'приложения 2 НПД', good: 'приложения 2 ПДД', why: '"НПД" — mavjud bo\'lmagan kod, ПДД bo\'lishi kerak.' }],
  t_19_q_13: [{ lang: 'ru', bad: 'Приложения 1 ШК 3.7', good: 'Приложения 1 ПДД 3.7', why: '"ШК" — mavjud bo\'lmagan kod, ПДД bo\'lishi kerak.' }],
  t_53_q_17: [{ lang: 'ru', bad: 'Приложения 1 ХХ 5.12', good: 'Приложения 1 ПДД 5.12', why: '"ХХ" — mavjud bo\'lmagan kod, ПДД bo\'lishi kerak.' }],
  t_39_q_4: [{ lang: 'ru', bad: 'согласовано с ДЮХХХ в установленном порядке', good: 'согласовано с ГСБДД в установленном порядке', why: 'Xuddi shu gap boshqa savolda (t_32_q_4) "ГСБДД" deb to\'g\'ri yozilgan; bu yerda "ДЮХХХ" — buzilgan/mos kelmaydigan qisqartma.' }],
  t_38_q_20: [{ lang: 'ru', bad: 'линией дороги 1.11, которая расположена с левой стороны КАД.', good: 'линией дороги 1.11, прерывистая сторона которой расположена слева.', why: 'uz: "узуқ-узуқ томони чапда жойлашган 1.11 йўл чизиғи" — "уzuq-uzuq tomoni" (uzuq-uzuq/prерyvistaya storona) tarjimada tushib qolgan va o\'rniga ma\'nosiz "КАД" qo\'shilgan.' }],
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
if (!APPLY) console.log('\nYozish uchun: node scripts/question-tools/fix-ru-legal-code-refs-2.cjs apply');
