// ============================================================================
// fix-v51.cjs — v51 tekshiruvida topilgan xatolar. SAVOL DOIRASIDA ishlaydi.
//
//   node scripts/question-tools/fix-v51.cjs         # quruq yurish
//   node scripts/question-tools/fix-v51.cjs apply   # yozadi
// ============================================================================

const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.resolve(__dirname, '..', '..', 'public');
const APPLY = process.argv.includes('apply');

const FIXES = {
  t_51_q_2: [
    { lang: 'ru', bad: 'сигналами регулирующего органа,', good: 'сигналами регулировщика,', why: '"регулирующий орган" (tartibga soluvchi organ) emas, "регулировщик" (tartibga soluvchi shaxs) bo\'lishi kerak — korpusda barqaror atama.' },
  ],
  t_51_q_3: [
    { lang: 'ru', bad: 'Согласно пункту второму статьи 8 - главе 50 ПДД, аварийная сигнализация должна быть включена в следующих случаях: при наложении ареста (на арестованном транспортном средстве). В соответствии с ПДД 8 - Глава 52 - Пункт: Если у конфискованного транспортного средства нет аварийных световых сигналов или они не работают, на задней стороне транспортного средства должен быть установлен знак аварийной остановки.', good: 'Согласно второму абзацу пункта 50 главы 8 ПДД, аварийная сигнализация должна быть включена в следующих случаях: при буксировке (на буксируемом транспортном средстве). Согласно пункту 52 главы 8 ПДД: если на буксируемом транспортном средстве нет аварийных световых сигналов или они не работают, на задней стороне транспортного средства должен быть установлен знак аварийной остановки.', why: 'JIDDIY XATO: uz "shatakka olish" (буксировка/tirkab olish) so\'zi butunlay boshqa huquqiy tushuncha — "наложение ареста" (mol-mulkka hibs solish) va "конфискованного" (musodara qilingan) — bilan almashtirilgan edi. Bundan tashqari manba havolalari ("статьи 8 - главе 50", "ПДД 8 - Глава 52 - Пункт") buzilgan formatda edi.' },
  ],
  t_51_q_5: [
    { lang: 'uz_cyr', bad: 'бошқаришга нэча ёшдан', good: 'бошқаришга неча ёшдан', why: '"нэча" — ёзув хатоси, тўғриси "неча" (лотин lat: "necha").' },
  ],
  t_51_q_6: [
    { lang: 'uz_lat', bad: '\\"YHQning 9-bob', good: 'YHQning 9-bob', why: 'Izoh boshida ortiqcha (juft bo\'lmagan) qo\'shtirnoq bor edi.' },
    { lang: 'uz_lat', bad: 'daraxt va boshqalar).\\"', good: 'daraxt va boshqalar).', why: 'Izoh oxirida ortiqcha (juft bo\'lmagan) qo\'shtirnoq bor edi.' },
    { lang: 'uz_cyr', bad: '\\"YHQнинг 9-боб', good: 'YHQнинг 9-боб', why: 'Изоҳ бошида ортиқча (жуфт бўлмаган) қўштирноқ бор эди.' },
    { lang: 'uz_cyr', bad: 'дарахт ва бошқалар).\\"', good: 'дарахт ва бошқалар).', why: 'Изоҳ охирида ортиқча (жуфт бўлмаган) қўштирноқ бор эди.' },
    { lang: 'ru', bad: 'упавшее дерево и т.п.)».', good: 'упавшее дерево и т.п.).', why: 'Matn oxirida ortiqcha yopuvchi qo\'shtirnoq (») bor edi, unga mos ochuvchi qo\'shtirnoq yo\'q edi.' },
  ],
  t_51_q_10: [
    { lang: 'ru', bad: 'при выезде из жилых помещений водители обязаны', good: 'при выезде из жилых зон водители обязаны', why: '"жилых помещений" (turar-joy XONALARI, ya\'ni kvartira/xona) yo\'l kontekstiga mos emas — uz: "turar-joy dahalaridan" (turar-joy HUDUDLARI/ZONALARI) — "жилых зон" bo\'lishi kerak.' },
  ],
  t_51_q_17: [
    { lang: 'uz_cyr', bad: 'бор- йўқлигини аниқлай олмаса ( қоронғи вақт, лой, қор) ва имтиёз белгилари бўлмаса )?', good: 'бор-йўқлигини аниқлай олмаса (қоронғи вақт, лой, қор) ва имтиёз белгилари бўлмаса?', why: 'Ортиқча бўшлиқлар ва жуфт бўлмаган қўшимча қавс (")") — uz_lat нусхасида бундай хато йўқ.' },
  ],
  t_51_q_19: [
    { lang: 'ru', bad: 'связанных с высадкой или высадкой пассажиров.', good: 'связанных с посадкой или высадкой пассажиров.', why: '"высадкой" so\'zi ikki marta takrorlangan edi — bittasi "посадкой" (o\'tirish/chiqish) bo\'lishi kerak.' },
  ],
  t_51_q_20: [
    { lang: 'ru', bad: 'если светофор или сигнал регулятора разрешают', good: 'если светофор или сигнал регулировщика разрешают', why: '"регулятор" (qurilma) emas, "регулировщик" (tartibga soluvchi shaxs) bo\'lishi kerak — korpusda barqaror atama.' },
    { lang: 'ru', bad: 'Трамвай, движущийся в направлении красного или желтого сигнала дополнительной секции с направляющим светом, должен уступить дорогу', good: 'Трамвай, движущийся в направлении зелёного сигнала дополнительной секции, загорающегося одновременно с красным или жёлтым сигналом светофора, должен уступить дорогу', why: 'uz: "svetoforning qizil yoki sariq ishorasi bilan bir vaqtda yongan qo\'shimcha tarmog\'ining YASHIL ishorasi" — ruscha tarjimada "зелёного" (yashil) so\'zi tushib qolgan va tramvay "qizil yoki sariq ishora yo\'nalishida" harakatlanayotgandek noto\'g\'ri ma\'no chiqqan edi (bu ushbu faylning o\'z ichidagi t_51_q_8 bilan ham nomuvofiq edi).' },
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
if (!APPLY) console.log('\nYozish uchun: node scripts/question-tools/fix-v51.cjs apply');
