// ============================================================================
// fix-ru-round2.cjs — audit-ru-izoh-mismatch.cjs orqali topilgan, qo'lda
// tekshirilgan 3 ta qo'shimcha ruscha xato:
//
//   t_17_q_16 — izohda "парковка/Стоянка запрещена" o'rniga "остановка/
//               Остановка запрещена" bo'lishi kerak edi (uz_lat/uz_cyr
//               izohida "to'xtash" — остановка — deyilgan, savolning o'zi
//               ham "сплошная жёлтая линия" ya'ni 1.4 chizig'i haqida, bu
//               chiziq PDDda OSTANOVKA'ni taqiqlaydi, стоянка emas).
//   t_38_q_15 — ruscha to'g'ri javobda rang tushib qolgan: uz "qizil, ko'k
//               va yashil" (3 rang), lekin ru faqat "красному и зеленому"
//               (2 rang) — "синему" so'zi yo'qolgan.
//   t_41_q_14 — is_correct bayrog'i ruscha 1- va 3-variant o'rtasida almashib
//               qolgan (t_46_q_6/t_46_q_13 bilan bir xil toifadagi xato):
//               izoh "непдвижный объект" ta'rifini beradi (3-variant), lekin
//               ru buni FALSE, "затор туфайли to'xtagan avtomobil"ni (1-variant,
//               uz da ham FALSE) TRUE deb belgilagan edi. Yo'l-yo'lakay
//               1-variantdagi "остановившиеся напроезжей" grammatik/bo'shliq
//               xatosi ham tuzatildi.
//
//   node scripts/question-tools/fix-ru-round2.cjs         # quruq yurish
//   node scripts/question-tools/fix-ru-round2.cjs apply   # yozadi
// ============================================================================

const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.resolve(__dirname, '..', '..', 'public');
const APPLY = process.argv.includes('apply');

function esc(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// type 'text': to'g'ridan-to'g'ri bad->good almashtirish (mazmunga asoslangan, JSON formatlashga bog'liq emas)
// type 'flag': optionText matn yonidagi is_correct qiymatini from->to ga o'zgartiradi
const FIXES = {
  t_17_q_16: [
    { type: 'text', lang: 'ru', bad: 'означает место, где парковка запрещена', good: 'означает место, где остановка запрещена' },
    { type: 'text', lang: 'ru', bad: 'дорожным знаком 3.27 «Стоянка запрещена»', good: 'дорожным знаком 3.27 «Остановка запрещена»' },
  ],
  t_38_q_15: [
    { type: 'text', lang: 'ru', bad: 'Красному и зеленому автомобилям', good: 'Красному, синему и зеленому автомобилям' },
  ],
  t_41_q_14: [
    { type: 'text', lang: 'ru', bad: 'Автомобиль, остановившиеся напроезжей части из-за затора', good: 'Автомобиль, остановившийся на проезжей части из-за затора' },
    { type: 'flag', optionText: 'Автомобиль, остановившийся на проезжей части из-за затора', from: 'true', to: 'false' },
    { type: 'flag', optionText: 'Неподвижный объект на проезжей части', from: 'false', to: 'true' },
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
      if (f.type === 'text') {
        if (!chunk.includes(f.bad)) continue;
        n += chunk.split(f.bad).length - 1;
        chunk = chunk.split(f.bad).join(f.good);
      } else if (f.type === 'flag') {
        const re = new RegExp(`("text"\\s*:\\s*"${esc(f.optionText)}"\\s*,\\s*"is_correct"\\s*:\\s*)${f.from}\\b`, 'g');
        chunk = chunk.replace(re, (whole, pre) => { n++; return pre + f.to; });
      }
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
if (!APPLY) console.log('\nYozish uchun: node scripts/question-tools/fix-ru-round2.cjs apply');
