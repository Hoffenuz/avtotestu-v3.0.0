// ============================================================================
// fix-ru-round5.cjs — "Ikkinchi Tur Tekshiruvi" hisobotining C-toifasi (RU da
// mazmun qisqargan, 5 ta) va D-toifasi (kichik uslub/iqtibos farqi, 7 ta).
//
// Har biri UZ asl matniga va korpusda ALLAQACHON tasdiqlangan izchil
// terminologiyaga (masalan v11.json dagi 91-band tarjimasi, v51/v50/v61
// dagi 5.15/7.6.2 belgi nomlari) tayanib qurilgan — yangi so'z o'ylab
// topilmadi, faqat mavjud, izchil tarjimalar qo'llanildi.
//
//   node scripts/question-tools/fix-ru-round5.cjs         # quruq yurish
//   node scripts/question-tools/fix-ru-round5.cjs apply   # yozadi
// ============================================================================

const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.resolve(__dirname, '..', '..', 'public');
const APPLY = process.argv.includes('apply');

const FIXES = {
  // --- C toifa: RU da mazmun qisqargan ---
  t_51_q_7: [
    {
      bad: 'Согласно п. 88 ПДД, остановка и стоянка транспортных средств разрешаются на правой стороне дороги на обочине, а при ее отсутствии — у края проезжей части и в случаях, указанных в п. 89 Правил, — на тротуаре. Стоянка на тротуаре легкового автомобиля нарушает правила, если не выполнены условия п. 89.',
      good: 'Согласно пункту 88 Правил дорожного движения, транспортным средствам разрешается останавливаться и стоять на правой стороне дороги на обочине, а при её отсутствии — у края проезжей части, а также на тротуаре в случаях, указанных в пункте 89 Правил.\r\nСогласно третьему абзацу пункта 89 Правил дорожного движения, стоянка на краю тротуара, граничащего с проезжей частью, разрешается только легковым автомобилям, мотоциклам, мопедам и велосипедам в местах, где вместе со знаком 5.15 «Парковочное место» установлен один из знаков дополнительной информации 7.6.2, 7.6.3, 7.6.6 — 7.6.9.\r\nСогласно статье 91 Правил дорожного движения запрещается останавливаться в местах, где расстояние между остановленным транспортным средством и продольной сплошной линией (кроме линии, обозначающей край проезжей части), разделительной зоной или противоположным краем проезжей части составляет менее 3 метров.',
    },
  ],
  t_55_q_15: [
    {
      bad: 'Разрешается по трамвайным путям попутного направления при интенсивном движении на других полосах, объезде, опережении. При этом не должно создаваться помех трамваю',
      good: 'Разрешается по трамвайным путям попутного направления при интенсивном движении на других полосах, объезде, опережении (если перед перекрёстком не установлены дорожные знаки 5.8.1 или 5.8.2). При этом не должно создаваться помех трамваю',
    },
  ],
  t_50_q_2: [
    {
      bad: 'Приближение к сужению проезжей части или к линии разметки, разделяющей транспортные потоки противоположных направлений',
      good: 'Приближение к сужению проезжей части или к линии разметки 1.1 или 1.11, разделяющей транспортные потоки противоположных направлений',
    },
  ],
  t_37_q_15: [
    {
      bad: 'Остаточная высота рисунка протектора шин грузовых автомобилей 1,6 мм',
      good: 'Остаточная высота рисунка протектора шин грузовых автомобилей категорий N2, N3 — 1,6 мм',
    },
  ],
  t_6_q_20: [
    {
      bad: '3.20. «Обгон запрещен».',
      good: '3.20. «Обгон запрещён». Обгон транспортных средств, кроме одиночных, движущихся со скоростью менее 40 км/ч, запрещён.',
    },
  ],

  // --- D toifa: kichik uslub/iqtibos farqi ---
  t_48_q_5: [
    { bad: 'Согласно понятию главы 1 статьи 12 ПДД главной дорогой', good: 'Согласно термину № 12 пункта 6 главы 1 ПДД главной дорогой' },
  ],
  t_61_q_1: [
    { bad: 'Согласно определению главы 1 статьи 12 ПДД главной дорогой', good: 'Согласно термину № 12 пункта 6 главы 1 ПДД главной дорогой' },
  ],
  t_5_q_15: [
    { bad: 'парковка запрещается в следующих местах и ​​ситуациях', good: 'остановка и стоянка запрещаются в следующих местах и ​ситуациях' },
  ],
  t_21_q_4: [
    { bad: 'Согласно требованиям ПДД к перевозке грузов и опознавательным знакам, груз', good: 'Согласно требованиям главы 26 ПДД к перевозке грузов и опознавательным знакам, груз' },
  ],
  t_28_q_20: [
    { bad: '5.5. «Улица с односторонним движением». Дорога или проезжая часть, по которой транспортные средства движутся в одном направлении по всей ширине.', good: 'Согласно разделу 5 приложения 1 ПДД: 5.5. «Улица с односторонним движением» — дорога или проезжая часть, по которой транспортные средства движутся в одном направлении по всей ширине.' },
  ],
  t_43_q_8: [
    { bad: 'к знаку 3.20 статьи 3 приложения 1 ПДД', good: 'к знаку 3.20 раздела 3 приложения 1 ПДД' },
  ],
  t_23_q_12: [
    { bad: 'обозначает «D»-приподнятый пешеходный переход?', good: 'обозначает «3D»-приподнятый пешеходный переход?' },
  ],
  t_2_q_10: [
    { bad: 'при езде вне населённых пунктов запрещается превышать установленную скорость?', good: 'при езде вне населённых пунктов запрещается превышать скорость 90 км/ч?' },
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

function questionSpans(text) {
  const marks = [];
  const re = /"global_id"\s*:\s*"([^"]+)"/g;
  let m;
  while ((m = re.exec(text))) marks.push({ gid: m[1], at: m.index });
  return marks.map((mk, i) => ({
    gid: mk.gid,
    start: mk.at,
    end: i + 1 < marks.length ? marks[i + 1].at : text.length,
  }));
}

const counts = new Map();
const touched = [];

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
console.log(APPLY ? "=== QO'LLANDI ===" : '=== QURUQ YURISH ===');
console.log(`O'zgargan fayl: ${touched.length} | Almashtirish: ${total}\n`);
for (const gid of Object.keys(FIXES)) {
  const n = counts.get(gid) || 0;
  console.log(`${n ? ' ' : '-'} ${String(n).padStart(3)}  ${gid}${n ? '' : '   (TOPILMADI)'}`);
}
if (touched.length) {
  console.log('\nFayllar:');
  for (const f of touched) console.log('  ' + f);
}
if (!APPLY) console.log('\nYozish uchun: node scripts/question-tools/fix-ru-round5.cjs apply');
