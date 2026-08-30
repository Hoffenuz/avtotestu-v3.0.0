// ============================================================================
// fix-ru-round3.cjs — audit-number-mismatch.cjs orqali topilgan, qo'lda
// tekshirilgan xatolar (raqamlar uz_lat/ru orasida mos kelmagan nomzodlar
// ro'yxatidan sinchiklab tanlangan HAQIQIY xatolar):
//
//   t_4_q_7   — ru 2-variant "Ближе 15 м..." (yaqinroq) yozilgan, lekin bu
//               "taqiqlanMAYdigan" (ruxsat etilgan) joy sifatida keltirilgan —
//               yaqin masofa aslida TAQIQLANGAN zona (91-band), demak bu
//               noto'g'ri va yo'l bergan foydalanuvchiga zararli ma'lumot.
//               uz_lat/t_46_q_6 bilan bir xil qoidaga asosan "30 m dan KO'P"
//               (uzoqroq — demak ruxsat etilgan zona) bo'lishi kerak.
//   t_41_q_2  — xuddi shu toifadan, IKKITA variantda: ru 1-variant "Ближе 10
//               метров..." — bu aslida TO'G'RI qoidani (10m dan yaqin —
//               taqiqlangan) ifodalaydi, lekin FALSE deb belgilangan noto'g'ri
//               javob sifatida ko'rsatilgan — chalkashtiruvchi/xavfli. uz
//               "10 metrdan KO'P" (uzoqroq) bo'lishi kerak edi. ru 3-variant
//               "Ближе 10 метров..." ham raqami (30 emas 10) va yo'nalishi
//               (uz "30 metrdan KO'P") bo'yicha xato edi.
//   t_53_q_9  — ru izohda ikkita ibora ikki marta takrorlangan ("размером
//               200х200 миллиметров" va "со светоотражающей поверхностью" —
//               ikkalasi ham ikki marta), uz_lat asl matniga ko'ra bitta marta
//               bo'lishi kerak edi.
//   t_3_q_19  — ru izohda ilova raqami xato: "приложения 1" (1-ilova), lekin
//               uz_lat "2 – ilovasi" (2-ilova) deydi — yo'l chizig'i qoidalari
//               YHQ 2-ilovasida, 1-ilovada emas (1-ilova — yo'l belgilari).
//   t_27_q_14 — ru izohda katta qism (qaysi boblar/ilovalardan chetga chiqish
//               mumkinligi ro'yxati: 7-bob 38-banddan tashqari, 9-16, 19-20
//               boblari, 1 va 2-ilovalar) butunlay tushirib qoldirilgan edi.
//
//   node scripts/question-tools/fix-ru-round3.cjs         # quruq yurish
//   node scripts/question-tools/fix-ru-round3.cjs apply   # yozadi
// ============================================================================

const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.resolve(__dirname, '..', '..', 'public');
const APPLY = process.argv.includes('apply');

const FIXES = {
  t_4_q_7: [
    { bad: 'Ближе 15 м от края пересекаемой проезжей части', good: 'Более 30 м от края пересекающейся проезжей части' },
  ],
  t_41_q_2: [
    { bad: 'Ближе 10 метров перед пешеходным переходом', good: 'Более 10 метров перед пешеходным переходом' },
    { bad: 'Ближе 10 метров от края пересекаемых проезжих частей', good: 'Более 30 метров от края пересекаемых проезжих частей' },
  ],
  t_53_q_9: [
    {
      bad: 'должен быть установлен предупреждающий флажок со светоотражающей поверхностью или квадратный знак размером 200х200 миллиметров, с красными и белыми широкими полосами шириной 50 миллиметров, размером 200х200 миллиметров, расположенными в ряд по диагонали, со светоотражающей поверхностью.',
      good: 'должен быть установлен предупреждающий флажок или квадратный знак размером 200х200 миллиметров, со светоотражающей поверхностью, с расположенными в ряд по диагонали широкими красно-белыми полосами шириной 50 миллиметров.',
    },
  ],
  t_3_q_19: [
    { bad: 'абзацами шестнадцатым и семнадцатым раздела 1 приложения 1 ПДД', good: 'абзацами шестнадцатым и семнадцатым раздела 1 приложения 2 ПДД' },
  ],
  t_27_q_14: [
    {
      bad: 'несут дежурство и обязаны обеспечивать безопасность дорожного движения при исполнении своих служебных обязанностей. Возможно отклонение от требований приложения 2.',
      good: 'выполняя неотложные служебные задачи, при условии обеспечения безопасности дорожного движения, могут отступать от требований глав 7 (кроме пункта 38), 9-16, 19-20 и приложений 1 и 2 Правил.',
    },
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
if (!APPLY) console.log('\nYozish uchun: node scripts/question-tools/fix-ru-round3.cjs apply');
