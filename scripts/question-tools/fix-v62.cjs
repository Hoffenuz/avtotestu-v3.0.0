// ============================================================================
// fix-v62.cjs — v62 tekshiruvida topilgan xatolar. SAVOL DOIRASIDA ishlaydi.
//
//   node scripts/question-tools/fix-v62.cjs         # quruq yurish
//   node scripts/question-tools/fix-v62.cjs apply   # yozadi
// ============================================================================

const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.resolve(__dirname, '..', '..', 'public');
const APPLY = process.argv.includes('apply');

const FIXES = {
  t_62_q_4: [
    { lang: 'ru', bad: 'за исключением обгона, опережения, поворота налево или перестановки на обгон, а также остановки', good: 'за исключением объезда, обгона, поворота налево или разворота, а также остановки', why: 'uz asl matnida 4 xil holat sanaladi: aylanib o\'tish (объезд), quvib o\'tish (обгон), chapga burilish (поворот налево), qayrilib olish (разворот). Ruscha tarjimada "обгон" ikki marta sinonim bilan takrorlangan ("обгона, опережения"), "aylanib o\'tish" tushib qolgan va "qayrilib olish" ma\'nosiz "перестановки на обгон" iborasiga aylangan edi (xuddi t_58_q_16 dagi xato).' },
  ],
  t_62_q_10: [
    { lang: 'ru', bad: 'Согласно пункту 25 приложения 3 к 7.22: Категория Л — автомобили.', good: 'Согласно абзацу 25 пункта 7.22 приложения 3 к ПДД: Категория L — мототранспортные средства.', why: 'JIDDIY XATO: izoh shu savolning o\'z to\'g\'ri javobiga ("Мототранспортные средства") ZID edi — "Категория Л — автомобили" (mashinalar) deb noto\'g\'ri yozilgan, holbuki uz "L toifasi — mototransport vositalari" deydi.' },
  ],
  t_62_q_14: [
    { lang: 'ru', bad: 'Желти автомобиль', good: 'Жёлтый автомобиль', why: 'Yozuv xatosi: "Желти" o\'rniga "Жёлтый" bo\'lishi kerak.' },
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
if (!APPLY) console.log('\nYozish uchun: node scripts/question-tools/fix-v62.cjs apply');
