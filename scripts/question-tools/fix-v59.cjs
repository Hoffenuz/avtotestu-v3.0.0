// ============================================================================
// fix-v59.cjs — v59 tekshiruvida topilgan xatolar. SAVOL DOIRASIDA ishlaydi.
//
//   node scripts/question-tools/fix-v59.cjs         # quruq yurish
//   node scripts/question-tools/fix-v59.cjs apply   # yozadi
// ============================================================================

const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.resolve(__dirname, '..', '..', 'public');
const APPLY = process.argv.includes('apply');

const FIXES = {
  t_59_q_3: [
    { lang: 'ru', bad: '4.1.1. «К действию». 4.1.1 Дорожный знак будет установлен перед любым перекрестком участка движения, он будет установлен на этом перекрестке.', good: '4.1.1. «Движение прямо». Дорожный знак 4.1.1, установленный перед любым перекрёстком участка движения, действует на этом перекрёстке.', why: 'Belgi nomi noto\'g\'ri tarjima qilingan edi — uz "Harakatlanish to\'g\'riga" (Движение прямо) o\'rniga ma\'nosiz "К действию" (harakatga) yozilgan edi (t_52_q_11 da ham xuddi shu xato topilgan edi); jumla tuzilishi ham grammatik jihatdan buzilgan edi.' },
  ],
  t_59_q_6: [
    { lang: 'ru', bad: 'а также транспортному средству (транспортным средствам), за которыми они наблюдают с включенными фарами.', good: 'а также транспортному средству (транспортным средствам), находящемуся под их сопровождением, с включёнными фарами ближнего света.', why: 'uz: "ularning kuzatuvidagi" — bu "ular kuzatib turgan (watching)" emas, balki "ular hamrohlik qilayotgan/eskort qilayotgan (under escort)" degan ma\'noni bildiradi (xuddi ilgari t_48_q_8, t_55_q_9 da topilgan xato).' },
  ],
  t_59_q_10: [
    { lang: 'ru', bad: 'Следовательно, в кузове буксируемого автомобиля перевозить людей нельзя; по условиям данного вопроса разрешается только в кузове буксирующего.', good: 'Следовательно, перевозить людей в кузове буксируемого автомобиля нельзя, разрешается только в кузове буксирующего автомобиля.', why: '"по условиям данного вопроса" — savolning o\'ziga ishora qiluvchi noo\'rin metaizoh, aslida bu umumiy qoida, aniq savol shartiga emas.' },
  ],
  t_59_q_14: [
    { lang: 'ru', bad: 'Согласно пункту 2 статьи 19 статьи 121 ПДД', good: 'Согласно абзацу 2 пункта 121 главы 19 ПДД', why: 'uz: "19-bo\'limi 121-bandi 2-xatboshiga" (19-bo\'lim, 121-band, 2-xatboshi) — ruscha tarjimada "статьи" so\'zi ikki marta noto\'g\'ri takrorlangan va raqamlar tartibi buzilgan edi (xuddi t_55_q_8 dagi xato).' },
  ],
  t_59_q_15: [
    { lang: 'ru', bad: 'Показания регулятора имеют следующее значение:', good: 'Сигналы регулировщика имеют следующее значение:', why: '"регулятор" (qurilma) emas, "регулировщик" (tartibga soluvchi shaxs) bo\'lishi kerak — korpusda barqaror atama.' },
    { lang: 'ru', bad: 'за исключением указаний регулирующего органа), глав 9-16,', good: 'за исключением указаний регулировщика), глав 9-16,', why: '"регулирующий орган" (tartibga soluvchi organ) emas, "регулировщик" (tartibga soluvchi shaxs) bo\'lishi kerak.' },
  ],
  t_59_q_17: [
    { lang: 'ru', bad: 'мостах, эстакадах и эстакадах с менее чем тремя полосами движения в одном направлении.', good: 'мостах, путепроводах и эстакадах с менее чем тремя полосами движения в одном направлении.', why: 'uz: "ko\'prik, yo\'l o\'tkazgich va estakadalar" (3 xil atama) — ruschada "эстакадами" so\'zi ikki marta takrorlangan, "путепроводами" bo\'lishi kerak edi.' },
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
if (!APPLY) console.log('\nYozish uchun: node scripts/question-tools/fix-v59.cjs apply');
