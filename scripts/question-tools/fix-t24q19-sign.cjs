// ============================================================================
// fix-t24q19-sign.cjs — t_24_q_19 izohida NOTO'G'RI belgi keltirilgan edi.
//
// Savol rasmi (u269uz.webp) ko'rib chiqildi: undagi taqiqlovchi belgi
// VELOSIPED siymosini tasvirlaydi, motosikl emas. Loyihaning o'z belgilar
// katalogi (public/data/belgilar.json) buni tasdiqlaydi:
//   3.5 = "Mototsikllar harakatlanishi taqiqlangan" (boshqa, alohida belgi)
//   3.9 = "Velosipedda harakatlanish taqiqlangan"   (rasmdagi aynan shu belgi)
//
// Izoh UCHALA tilda ham (uz_lat/uz_cyr/ru) BIR XIL xato bilan yozilgan edi —
// bu tarjima xatosi emas, balki manba/rasmga mos kelmagan kontent xatosi.
// Xulosa mantig'i ("faqat X taqiqlangan, shuning uchun avtomobil istalgan
// yo'nalishga yura oladi") to'g'ri qoladi — faqat belgi raqami va nomi
// tuzatiladi.
//
//   node scripts/question-tools/fix-t24q19-sign.cjs         # quruq yurish
//   node scripts/question-tools/fix-t24q19-sign.cjs apply   # yozadi
// ============================================================================

const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.resolve(__dirname, '..', '..', 'public');
const APPLY = process.argv.includes('apply');

const FIXES = {
  t_24_q_19: [
    { bad: '3-bo\'limi 3.5 \\"Motosikllar harakatlanishi taqiqlangan\\" belgisiga muvofiq, faqat motosikllarning harakatlanishi taqiqlanadi.', good: '3-bo\'limi 3.9 \\"Velosipedda harakatlanish taqiqlangan\\" belgisiga muvofiq, faqat velosipedlarning harakatlanishi taqiqlanadi.' },
    { bad: '3-бўлими 3.5 \\"Мотосикллар ҳаракатланиши тақиқланган\\" белгисига мувофиқ, фақат мотосиклларнинг ҳаракатланиши тақиқланади.', good: '3-бўлими 3.9 \\"Велосипедда ҳаракатланиш тақиқланган\\" белгисига мувофиқ, фақат велосипедларнинг ҳаракатланиши тақиқланади.' },
    { bad: 'Согласно статье 3.5 приложения 1 ПДД, движение запрещено только на мотоциклах.', good: 'Согласно статье 3.9 приложения 1 ПДД, движение запрещено только на велосипедах.' },
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
if (!APPLY) console.log('\nYozish uchun: node scripts/question-tools/fix-t24q19-sign.cjs apply');
