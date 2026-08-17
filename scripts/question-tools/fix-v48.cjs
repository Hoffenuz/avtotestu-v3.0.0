// ============================================================================
// fix-v48.cjs — v48 tekshiruvida topilgan xatolar. SAVOL DOIRASIDA ishlaydi.
//
//   node scripts/question-tools/fix-v48.cjs         # quruq yurish
//   node scripts/question-tools/fix-v48.cjs apply   # yozadi
// ============================================================================

const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.resolve(__dirname, '..', '..', 'public');
const APPLY = process.argv.includes('apply');

const FIXES = {
  t_48_q_1: [
    { lang: 'ru', bad: 'Приложение к ПДД 2: 1.14.4', good: 'Приложение 2 к ПДД: 1.14.4', why: 'Korpusdagi barqaror format "Приложение N к ПДД" — bu yerda tartib teskari edi.' },
  ],
  t_48_q_2: [
    { lang: 'ru', bad: 'Согласно ПДД 10 - глава 73 - параграф: Водитель должен соблюдать расстояние между уровнем, гарантирующим предотвращение столкновения, когда транспортное средство перед ним резко тормозит, а также боковое расстояние, обеспечивающее безопасность дорожного движения.', good: 'Согласно статье 73 главы 10 ПДД: водитель должен соблюдать такую дистанцию до движущегося впереди транспортного средства, которая гарантирует избежание столкновения в случае его резкого торможения, а также боковую дистанцию, обеспечивающую безопасность дорожного движения.', why: 'Manba havolasi buzilgan formatda edi ("ПДД 10 - глава 73 - параграф"), va "расстояние между уровнем" (daraja orasidagi masofa) ma\'nosiz iborasi mavzuga mos "дистанцию до движущегося впереди транспортного средства" bilan almashtirildi.' },
  ],
  t_48_q_4: [
    { lang: 'ru', bad: 'водитель должен соблюдать дистанцию ​​между идущими перед ним транспортными средствами и боковую дистанцию, обеспечивающую безопасность дорожного движения.', good: 'водитель должен соблюдать такую дистанцию до движущегося впереди транспортного средства, которая гарантирует избежание столкновения в случае его резкого торможения, а также боковую дистанцию, обеспечивающую безопасность дорожного движения.', why: 'uz asl matnidagi eng muhim qism — "keskin tormoz berganida to\'qnashib ketmaslik kafolatini beradigan" (to\'qnashuvni oldini olish mezoni) — ruscha tarjimada butunlay tushib qolgan edi.' },
  ],
  t_48_q_8: [
    { lang: 'ru', bad: 'а также транспортному средству (транспортным средствам), за которыми они наблюдают с включенными фарами.', good: 'а также транспортному средству (транспортным средствам), находящемуся под их сопровождением, с включёнными фарами ближнего света.', why: 'uz: "ularning kuzatuvidagi" — bu "ular kuzatib turgan (watching)" emas, balki "ular hamrohlik qilayotgan/eskort qilayotgan (under escort)" degan ma\'noni bildiradi.' },
  ],
  t_48_q_11: [
    { lang: 'ru', bad: 'при вытягивании правой руки регулятора вперед', good: 'при вытягивании правой руки регулировщика вперед', why: '"регулятор" (qurilma) emas, "регулировщик" (tartibga soluvchi shaxs) bo\'lishi kerak — korpusda barqaror atama.' },
  ],
  t_48_q_12: [
    { lang: 'ru', bad: 'Во всех перечисленных случея', good: 'Во всех перечисленных случаях', why: 'Yozuv xatosi: oxirgi "х" harfi tushib qolgan.' },
  ],
  t_48_q_15: [
    { lang: 'ru', bad: 'прожекторы и прожекторы могут использоваться', good: 'фары-прожекторы и фары-искатели могут использоваться', why: 'uz: "projektor-fara" va "izlovchi-fara" — ikki xil chiroq turi, lekin ruschada ikkalasi ham bir xil "прожекторы" deb tarjima qilinib, farq yo\'qolgan edi.' },
  ],
  t_48_q_18: [
    { lang: 'ru', bad: 'В знаке 2.4 «Уступить дорогу» Приложения 1 Приложения 1 водитель', good: 'В знаке 2.4 «Уступить дорогу» раздела 2 приложения 1 к ПДД водитель', why: '"Приложения 1" ikki marta takrorlangan edi va "раздела 2" (uz: "2-bo\'limidagi") tushib qolgan edi.' },
  ],
  t_48_q_19: [
    { lang: 'ru', bad: 'В соответствии со статьей 143 главы 24 ПДД запрещается перевозить людей в багажнике автобуса, троллейбуса, грузового автомобиля, буксируемого с жесткой или гибкой сцепкой, а также размещать людей в салоне и багажнике буксируемого транспортного средства, а также в багажнике буксируемого транспортного средства в случае буксировки с частичной погрузкой.', good: 'В соответствии со статьей 143 главы 24 ПДД запрещается перевозить людей в буксируемых на жёсткой или гибкой сцепке автобусе, троллейбусе и кузове грузового автомобиля; при буксировке методом частичной погрузки запрещается нахождение людей в кабине и кузове буксируемого транспортного средства, а также в кузове буксирующего транспортного средства.', why: 'uz matnda ikki xil transport vositasi nazarda tutilgan — "shatakka olingan" (буксируемое, tirkalgan) va "shatakka olgan" (буксирующее, tirkovchi) — lekin ruschada ikkalasi ham bir xil "буксируемого" deb yozilib, farq yo\'qolgan edi (bu xato ilgari t_45_q_18 da ham topilgan edi).' },
  ],
  t_48_q_20: [
    { lang: 'ru', bad: 'Согласно главе 13 пункта 91 пункта 13 ПДД запрещается останавливаться и парковаться - на территории станции, в местах стоянки направленных транспортных средств, в том числе обозначенных линией 1.17, а также при отсутствии направленных знаков парковки транспортных средств и на расстоянии менее 15 метров по направлению движения станции (до подхода и проезда)', good: 'Согласно пункту 91, абзацу 13 главы 13 ПДД запрещается останавливаться и парковаться - на посадочных площадках, в местах остановки маршрутных транспортных средств, в том числе обозначенных линией 1.17, а при их отсутствии — у знаков остановки маршрутных транспортных средств и на расстоянии менее 15 метров от остановки по направлению движения (до подхода и после проезда)', why: '"пункта 91 пункта 13" — grammatik jihatdan noto\'g\'ri takrorlanish ("абзацу 13" bo\'lishi kerak); "по направлению движения станции" (bekatning o\'zi harakatlanayotgandek) mantiqsiz iborasi "от остановки по направлению движения" bilan almashtirildi.' },
  ],
  t_48_q_17: [
    { lang: 'ru', bad: 'при вытянутых или опущенных в стороны руках регулятора:', good: 'при вытянутых или опущенных в стороны руках регулировщика:', why: '"регулятор" (qurilma) emas, "регулировщик" (tartibga soluvchi shaxs) bo\'lishi kerak — korpusda barqaror atama.' },
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
if (!APPLY) console.log('\nYozish uchun: node scripts/question-tools/fix-v48.cjs apply');
