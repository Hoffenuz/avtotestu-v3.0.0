// ============================================================================
// fix-v52.cjs — v52 tekshiruvida topilgan xatolar. SAVOL DOIRASIDA ishlaydi.
//
//   node scripts/question-tools/fix-v52.cjs         # quruq yurish
//   node scripts/question-tools/fix-v52.cjs apply   # yozadi
// ============================================================================

const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.resolve(__dirname, '..', '..', 'public');
const APPLY = process.argv.includes('apply');

const FIXES = {
  t_52_q_1: [
    { lang: 'ru', bad: 'полосамидвижения в одном направлении грузовымавтомобилям разрешается занимать крайнююлевую полосу:', good: 'полосами движения в одном направлении грузовым автомобилям разрешается занимать крайнюю левую полосу:', why: 'Bo\'shliqlar tushib qolgan (so\'zlar qo\'shilib ketgan).' },
    { lang: 'ru', bad: 'При обгоне, повороте налево иразвороте', good: 'При обгоне, повороте налево и развороте', why: 'Bo\'shliq tushib qolgan.' },
    { lang: 'ru', bad: 'F3При повороте налево и развороте', good: 'При повороте налево и развороте', why: 'uz_lat/uz_cyr variantlarida bunday "F3" prefiksi yo\'q — ortiqcha, tasodifiy qolib ketgan belgi.' },
    { lang: 'ru', bad: 'крайняя левая полоса допускается в случаях, когда другие полосы заняты', good: 'крайнюю левую полосу разрешается занимать в случаях, когда другие полосы заняты', why: 'Jumlada fe\'l ("занимать" — egallash) tushib qolgan edi, natijada grammatik jihatdan noto\'g\'ri gap hosil bo\'lgan edi.' },
  ],
  t_52_q_6: [
    { lang: 'ru', bad: 'согласно знаку 2.4 2 раздела 1 приложения ПДД.', good: 'согласно знаку 2.4 раздела 2 приложения 1 к ПДД.', why: 'Manba havolasidagi raqamlar tartibsiz yozilgan edi (uz: "1-ilovasining 2-bo\'limi 2.4 belgisiga" — 1-ilova, 2-bo\'lim).' },
  ],
  t_52_q_9: [
    { lang: 'ru', bad: 'приложения 1 статьи 1 ПДД предупреждает', good: 'раздела 1 приложения 1 к ПДД предупреждает', why: 'uz: "1-ilovasining 1-bo\'limidagi" (1-ilova, 1-bo\'lim) — ruschada "статьи 1" (1-modda) noto\'g\'ri, "раздела 1" (1-bo\'lim) bo\'lishi kerak.' },
  ],
  t_52_q_11: [
    { lang: 'ru', bad: 'Согласно пункту 4.1.1 ПРИЛОЖЕНИЯ 1 и 4. Пункт 10 директивы: 4.1.1. «К действию».', good: 'Согласно пункту 4.1.1 ПРИЛОЖЕНИЯ 1 и абзацу 10 пункта 4 предписывающих знаков: 4.1.1. «Движение прямо».', why: 'Ikkita jiddiy xato: (1) belgi nomi noto\'g\'ri tarjima qilingan — uz "Harakatlanish to\'g\'riga" (Движение прямо) o\'rniga ma\'nosiz "К действию" (harakatga) yozilgan edi; (2) "Buyuruvchi belgilar" (predписывающие знаки) o\'rniga mavjud bo\'lmagan "директивы" (direktiva) hujjat nomi ishlatilgan edi.' },
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
if (!APPLY) console.log('\nYozish uchun: node scripts/question-tools/fix-v52.cjs apply');
