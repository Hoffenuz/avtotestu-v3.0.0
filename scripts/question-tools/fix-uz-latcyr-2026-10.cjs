// ============================================================================
// fix-uz-latcyr-2026-10.cjs — lotin va kirill uzbekcha matnlarni so'zma-so'z solishtirib (transliteratsiya orqali)
// topilgan farqlar: qaysi tomonda imlo xatosi bo'lsa, o'sha tomon tuzatildi.
// Faqat to'liq so'z chegarasida almashtiriladi.
//
//   node scripts/question-tools/fix-uz-latcyr-2026-10.cjs         # quruq yurish
//   node scripts/question-tools/fix-uz-latcyr-2026-10.cjs apply   # yozadi
// ============================================================================

const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.resolve(__dirname, '..', '..', 'public');
const APPLY = process.argv.includes('apply');

const FIXES = {
 "t_13_q_7": [{"bad":"soxasida","good":"sohasida"},{"bad":"сохасида","good":"соҳасида"}],
 "t_1_q_5": [
  {
   "bad": "огоҳлатирувчи",
   "good": "огоҳлантирувчи"
  }
 ],
 "t_10_q_18": [
  {
   "bad": "ҳаракатланиншини",
   "good": "ҳаракатланишини"
  }
 ],
 "t_11_q_1": [
  {
   "bad": "бошқараёт",
   "good": "бошқараётган"
  }
 ],
 "t_12_q_19": [
  {
   "bad": "ҳаракатланиншини",
   "good": "ҳаракатланишини"
  }
 ],
 "t_13_q_2": [
  {
   "bad": "расмд",
   "good": "расмда"
  }
 ],
 "t_14_q_3": [
  {
   "bad": "поездини",
   "good": "поездни"
  }
 ],
 "t_15_q_4": [
  {
   "bad": "Доимим",
   "good": "Доимий"
  }
 ],
 "t_19_q_1": [
  {
   "bad": "Кўрсатиган",
   "good": "Кўрсатилган"
  }
 ],
 "t_19_q_2": [
  {
   "bad": "вазиятдас",
   "good": "вазиятда"
  }
 ],
 "t_19_q_10": [
  {
   "bad": "қуйдагилар",
   "good": "қуйидагилар"
  },
  {
   "bad": "велосепедлар",
   "good": "велосипедлар"
  }
 ],
 "t_19_q_11": [
  {
   "bad": "пунктларидпн",
   "good": "пунктларидан"
  }
 ],
 "t_19_q_19": [
  {
   "bad": "читига",
   "good": "четига"
  }
 ],
 "t_2_q_7": [
  {
   "bad": "бурулиш",
   "good": "бурилиш"
  },
  {
   "bad": "Бурулиш",
   "good": "Бурилиш"
  },
  {
   "bad": "бурулишга",
   "good": "бурилишга"
  }
 ],
 "t_2_q_12": [
  {
   "bad": "ўтилан",
   "good": "ўтилган"
  }
 ],
 "t_2_q_14": [
  {
   "bad": "Тонелларда",
   "good": "Туннелларда"
  }
 ],
 "t_20_q_16": [
  {
   "bad": "биром",
   "good": "бирор"
  }
 ],
 "t_21_q_8": [
  {
   "bad": "Бурулишни",
   "good": "Бурилишни"
  }
 ],
 "t_22_q_11": [
  {
   "bad": "улангич",
   "good": "улагич"
  },
  {
   "bad": "Улангич",
   "good": "Улагич"
  }
 ],
 "t_22_q_19": [
  {
   "bad": "иккила",
   "good": "иккала"
  }
 ],
 "t_23_q_4": [
  {
   "bad": "ёрдами",
   "good": "ёрдам"
  }
 ],
 "t_23_q_16": [
  {
   "bad": "ўтказилган",
   "good": "ўтирган"
  }
 ],
 "t_24_q_1": [
  {
   "bad": "бурулишдан",
   "good": "бурилишдан"
  },
  {
   "bad": "бурулиши",
   "good": "бурилиши"
  }
 ],
 "t_27_q_1": [
  {
   "bad": "улангичда",
   "good": "улагичда"
  }
 ],
 "t_29_q_14": [
  {
   "bad": "баланлиги",
   "good": "баландлиги"
  }
 ],
 "t_30_q_5": [
  {
   "bad": "бавосита",
   "good": "бевосита"
  }
 ],
 "t_31_q_6": [
  {
   "bad": "elektromototsiklar",
   "good": "elektromototsikllar"
  }
 ],
 "t_34_q_2": [
  {
   "bad": "Только",
   "good": "Фақат"
  }
 ],
 "t_34_q_16": [
  {
   "bad": "иккалага",
   "good": "иккисига"
  }
 ],
 "t_35_q_8": [
  {
   "bad": "бўмаган",
   "good": "бўлмаган"
  }
 ],
 "t_35_q_13": [
  {
   "bad": "тутиб",
   "good": "тўхтаб"
  }
 ],
 "t_35_q_17": [
  {
   "bad": "белгиларада",
   "good": "белгиларда"
  },
  {
   "bad": "ҳовилларга",
   "good": "ҳовлиларга"
  },
  {
   "bad": "Ўнга",
   "good": "Ўнгга"
  }
 ],
 "t_37_q_4": [
  {
   "bad": "йўнинг",
   "good": "йўлнинг"
  }
 ],
 "t_37_q_10": [
  {
   "bad": "қуидагилар",
   "good": "қуйидагилар"
  },
  {
   "bad": "хависизлигига",
   "good": "хавфсизлигига"
  }
 ],
 "t_37_q_14": [
  {
   "bad": "тушурилган",
   "good": "туширилган"
  }
 ],
 "t_39_q_1": [
  {
   "bad": "йилт",
   "good": "ялт"
  }
 ],
 "t_39_q_14": [
  {
   "bad": "Shy",
   "good": "Shu"
  }
 ],
 "t_4_q_13": [
  {
   "bad": "ишлаётмаган",
   "good": "ишламаётган"
  }
 ],
 "t_40_q_5": [
  {
   "bad": "бўимининг",
   "good": "бўлимининг"
  },
  {
   "bad": "Огоҳлантиривчи",
   "good": "Огоҳлантирувчи"
  }
 ],
 "t_41_q_18": [
  {
   "bad": "kushimcha",
   "good": "qo'shimcha"
  }
 ],
 "t_42_q_12": [
  {
   "bad": "куйиш",
   "good": "қўйиш"
  }
 ],
 "t_44_q_20": [
  {
   "bad": "Юналишли",
   "good": "Йўналишли"
  }
 ],
 "t_45_q_20": [
  {
   "bad": "транспор",
   "good": "транспорт"
  }
 ],
 "t_46_q_8": [
  {
   "bad": "нотекслик",
   "good": "нотекислик"
  }
 ],
 "t_47_q_15": [
  {
   "bad": "оширётган",
   "good": "ошираётган"
  }
 ],
 "t_49_q_10": [
  {
   "bad": "қуидаги",
   "good": "қуйидаги"
  }
 ],
 "t_49_q_14": [
  {
   "bad": "белгиллар",
   "good": "белгилар"
  },
  {
   "bad": "белгилларнинг",
   "good": "белгиларнинг"
  }
 ],
 "t_50_q_6": [
  {
   "bad": "қуйдагилар",
   "good": "қуйидагилар"
  }
 ],
 "t_51_q_3": [
  {
   "bad": "шаттакка",
   "good": "шатакка"
  }
 ],
 "t_51_q_4": [
  {
   "bad": "транспор",
   "good": "транспорт"
  }
 ],
 "t_53_q_7": [
  {
   "bad": "elektromototsiklar",
   "good": "elektromototsikllar"
  }
 ],
 "t_55_q_11": [
  {
   "bad": "Йўлниг",
   "good": "Йўлнинг"
  }
 ],
 "t_55_q_16": [
  {
   "bad": "асасан",
   "good": "асосан"
  }
 ],
 "t_58_q_12": [
  {
   "bad": "ёрдами",
   "good": "ёрдам"
  }
 ],
 "t_58_q_19": [
  {
   "bad": "велосепед",
   "good": "велосипед"
  }
 ],
 "t_63_q_11": [
  {
   "bad": "электромотоциклар",
   "good": "электромотоцикллар"
  }
 ],
 "t_64_q_11": [
  {
   "bad": "oraqaga",
   "good": "orqaga"
  }
 ],
 "t_9_q_3": [
  {
   "bad": "пункларидан",
   "good": "пунктларидан"
  }
 ],
 "t_9_q_10": [
  {
   "bad": "транспот",
   "good": "транспорт"
  }
 ],
 "t_26_q_15": [
  {
   "bad": "A и C",
   "good": "A ва C"
  }
 ],
 "t_25_q_11": [
  {
   "bad": "30 км. тезликда",
   "good": "30 км/соат тезликда"
  }
 ],
 "t_4_q_10": [
  {
   "bad": "хавфли бурилишлари",
   "good": "хавфли бурилишлар"
  }
 ],
 "t_21_q_1": [
  {
   "bad": "таниқли",
   "good": "таниқлик"
  }
 ],
 "t_37_q_18": [
  {
   "bad": "таниқли",
   "good": "таниқлик"
  }
 ],
 "t_41_q_7": [
  {
   "bad": "таниқли",
   "good": "таниқлик"
  }
 ],
 "t_45_q_9": [
  {
   "bad": "таниқли",
   "good": "таниқлик"
  }
 ],
 "t_47_q_13": [
  {
   "bad": "таниқли",
   "good": "таниқлик"
  }
 ],
 "t_53_q_9": [
  {
   "bad": "таниқли",
   "good": "таниқлик"
  }
 ],
 "t_55_q_12": [
  {
   "bad": "таниқли",
   "good": "таниқлик"
  }
 ],
 "t_56_q_5": [
  {
   "bad": "таниқли",
   "good": "таниқлик"
  }
 ],
 "t_8_q_3": [
  {
   "bad": "таниқли",
   "good": "таниқлик"
  }
 ],
 "t_22_q_10": [
  {
   "bad": "учунчи",
   "good": "учинчи"
  }
 ],
 "t_22_q_12": [
  {
   "bad": "учунчи",
   "good": "учинчи"
  }
 ],
 "t_26_q_14": [
  {
   "bad": "учунчи",
   "good": "учинчи"
  }
 ],
 "t_43_q_13": [
  {
   "bad": "учунчи",
   "good": "учинчи"
  }
 ],
 "t_56_q_1": [
  {
   "bad": "учунчи",
   "good": "учинчи"
  }
 ],
 "t_24_q_20": [
  {
   "bad": "Мототцикл",
   "good": "Мотоцикл"
  }
 ],
 "t_36_q_13": [
  {
   "bad": "Мототцикл",
   "good": "Мотоцикл"
  }
 ],
 "t_51_q_7": [
  {
   "bad": "Мототцикл",
   "good": "Мотоцикл"
  }
 ],
 "t_51_q_10": [
  {
   "bad": "мототцикл",
   "good": "мотоцикл"
  }
 ],
 "t_15_q_2": [
  {
   "bad": "B yo'nalishda",
   "good": "B yo'nalishga"
  }
 ],
 "t_13_q_16": [
  {
   "bad": "нотекслигини",
   "good": "нотекислигини"
  }
 ],
 "t_43_q_19": [
  {
   "bad": "нотекслигини",
   "good": "нотекислигини"
  }
 ],
 "t_19_q_9": [
  {
   "bad": "тушуриш",
   "good": "тушириш"
  }
 ],
 "t_22_q_20": [
  {
   "bad": "ёригичини",
   "good": "ёритгичини"
  }
 ],
 "t_23_q_18": [
  {
   "bad": "Mototsilkchi",
   "good": "Mototsiklchi"
  }
 ],
 "t_29_q_20": [
  {
   "bad": "қуйдагиларни",
   "good": "қуйидагиларни"
  }
 ],
 "t_48_q_11": [
  {
   "bad": "qo'yidagini",
   "good": "quyidagini"
  }
 ],
 "t_5_q_18": [
  {
   "bad": "восилалардан",
   "good": "воситалардан"
  }
 ],
 "t_64_q_8": [
  {
   "bad": "Quydagi",
   "good": "Quyidagi"
  }
 ]
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
      const esc = Array.from(f.bad).map((ch) => ('.*+?^$' + String.fromCharCode(123,125,40,41,124,91,93,92)).includes(ch) ? String.fromCharCode(92) + ch : ch).join('');
      const edge = String.raw`[\p{L}\p{M}‘’ʻʼ']`;
      const re = new RegExp('(?<!' + edge + ')' + esc + '(?!' + edge + ')', 'gu');
      const m = chunk.match(re);
      if (!m) continue;
      n += m.length;
      chunk = chunk.replace(re, () => f.good);
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
if (!APPLY) console.log('\nYozish uchun: node scripts/question-tools/fix-uz-sample-2026-10.cjs apply');
