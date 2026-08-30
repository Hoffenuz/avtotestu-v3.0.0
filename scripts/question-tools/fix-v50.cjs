// ============================================================================
// fix-v50.cjs — v50 tekshiruvida topilgan xatolar. SAVOL DOIRASIDA ishlaydi.
//
//   node scripts/question-tools/fix-v50.cjs         # quruq yurish
//   node scripts/question-tools/fix-v50.cjs apply   # yozadi
// ============================================================================

const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.resolve(__dirname, '..', '..', 'public');
const APPLY = process.argv.includes('apply');

const FIXES = {
  t_50_q_2: [
    { lang: 'ru', bad: 'менее 30 км/ч двухколесных мотоциклов', good: 'менее 40 км/ч двухколесных мотоциклов', why: 'uz: "40 km/soat dan kam" — ruscha variantda raqam 30 ga noto\'g\'ri o\'zgartirilgan edi.' },
  ],
  t_50_q_6: [
    { lang: 'ru', bad: 'Категория М3, Н2, Н3 - противоюзовые, по диаметру колеса (не менее двух) шпилек;', good: 'Категория М3, Н2, Н3 - противооткатные упоры, соответствующие диаметру колеса (не менее двух);', why: 'uz: "o\'zi yurub ketishidan saqlovchi... tirgak" (g\'ildirak ostiga qo\'yiladigan to\'siq/tirgak) — "шпилек" (mixchalar) mavzuga mos emas, korpusda barqaror "противооткатные упоры" atamasi ishlatilishi kerak.' },
    { lang: 'ru', bad: 'на мотоциклах с мотоциклом - медицинский бокс, знак, указывающий на обязательную остановку.', good: 'на мотоциклах с коляской - медицинская аптечка, знак аварийной остановки.', why: 'uz: "kajavali mototsikllarda" (yon kajavali, ya\'ni "с коляской") — "с мотоциклом" ("mototsikl bilan mototsikl" ma\'nosiz) va "медицинский бокс" (tibbiy qutichaning noto\'g\'ri nomi, "аптечка" bo\'lishi kerak) tuzatildi.' },
  ],
  t_50_q_12: [
    { lang: 'ru', bad: 'В багажнике тягачей и другой самоходной техники, грузовых прицепов, прицепов, грузовых мотоциклов', good: 'В багажнике тягачей и другой самоходной техники, грузовых прицепов, прицепов-домов, грузовых мотоциклов', why: 'uz: "tirkama-uycha" (uy-tirkama, karavan) — ruscha tarjimada oddiy "прицепов" (tirkamalar) deb takrorlanib, "tirkama-uycha" tushunchasi yo\'qolgan edi.' },
  ],
  t_50_q_15: [
    { lang: 'ru', bad: 'Согласно главе 7 пункта 32 пункта 3 ПДД,', good: 'Согласно главе 7, пункту 32, абзацу 3 ПДД,', why: 'uz: "32-bandi 3-xatboshiga" (3-xatboshi = abzats) — ruschada "пункта 32 пункта 3" grammatik jihatdan noto\'g\'ri takrorlangan edi.' },
  ],
  t_50_q_17: [
    { lang: 'ru', bad: 'раздела 1 Приложения 2 Общего закона о:', good: 'раздела 1 Приложения 2 ПДД:', why: 'Tizimli xato: "ПДД" o\'rniga mavjud bo\'lmagan "Общего закона о" (Umumiy qonun) ishlatilgan edi — bu seans davomida ko\'p marta topilgan xato toifasi.' },
  ],
  t_50_q_18: [
    { lang: 'ru', bad: 'В соответствии с тридцать восьмым абзацем Приложения 3 раздел 1:', good: 'В соответствии с тридцать восьмым абзацем раздела 3 Приложения 1 к ПДД:', why: 'uz: "1 – ilovasi 3 – bo\'limining o\'ttiz sakkizinchi xatboshisiga" (1-ilova, 3-bo\'lim) — ruscha tarjimada "Приложения 3 раздел 1" raqamlari almashtirilgan edi.' },
    { lang: 'ru', bad: 'высадка пассажиров допускается только на транспортных средствах указанного направления в месте, где совмещена желтая пунктирная линия', good: 'высадка пассажиров допускается только на транспортных средствах указанного направления в месте, где совмещена сплошная жёлтая линия', why: 'uz: "сариқ сидирға чизиқ" (сидирға = сплошная, uzluksiz) — ruscha tarjimada "пунктирная" (uzuq-uzuq) deb TESKARI ma\'noda yozilgan edi, bu esa savolning o\'zidagi "сплошная жёлтая линия" iborasiga ham zid edi.' },
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
if (!APPLY) console.log('\nYozish uchun: node scripts/question-tools/fix-v50.cjs apply');
