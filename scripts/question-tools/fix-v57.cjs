// ============================================================================
// fix-v57.cjs — v57 tekshiruvida topilgan xatolar (t_57_q_7 bundan mustasno —
// u ilgari fix-general-zakon.cjs orqali tuzatilgan). SAVOL DOIRASIDA ishlaydi.
//
//   node scripts/question-tools/fix-v57.cjs         # quruq yurish
//   node scripts/question-tools/fix-v57.cjs apply   # yozadi
// ============================================================================

const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.resolve(__dirname, '..', '..', 'public');
const APPLY = process.argv.includes('apply');

const FIXES = {
  t_57_q_5: [
    { lang: 'ru', bad: 'Если тротуара и тротуара нет, пешеходы могут воспользоваться велодорожкой.', good: 'Если нет тротуара или пешеходной дорожки, пешеходы могут воспользоваться велодорожкой.', why: '"тротуара" so\'zi ikki marta takrorlangan edi — uz: "Trotuar YOKI piyodalar yo\'lkasi" (ikki xil tushuncha).' },
  ],
  t_57_q_8: [
    { lang: 'ru', bad: 'Направленным транспортным средствам запрещается осуществлять посадку и высадку пассажиров', good: 'Маршрутным транспортным средствам запрещается осуществлять посадку и высадку пассажиров', why: 'Shu savolning o\'z javob variantida barqaror "маршрутным" atamasi ishlatiladi, lekin izohda boshqa noto\'g\'ri so\'z "Направленным" (yo\'naltirilgan) yozilgan edi.' },
  ],
  t_57_q_9: [
    { lang: 'ru', bad: 'Согласно понятию пункта 58 главы 1 статьи 58, участником', good: 'Согласно определению 58 пункта 6 главы 1, участником', why: 'uz: "1-bobining 6-bandi 58-tushunchasiga" (1-bob, 6-band, 58-tushuncha) — ruscha tarjimada raqamlar buzilgan va "58" ikki marta noto\'g\'ri takrorlangan edi.' },
  ],
  t_57_q_12: [
    { lang: 'ru', bad: 'красным фонарем или светоотражателем. нуждаться', good: 'красным фонарем или светоотражателем.', why: 'Jumla oxirida ma\'nosiz qoldiq so\'z "нуждаться" (mashina-tarjima artefakti) bor edi.' },
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
if (!APPLY) console.log('\nYozish uchun: node scripts/question-tools/fix-v57.cjs apply');
