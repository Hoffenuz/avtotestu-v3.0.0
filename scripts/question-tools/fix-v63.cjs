// ============================================================================
// fix-v63.cjs — v63 tekshiruvida topilgan xatolar (SESSIYADAGI OXIRGI
// VARIANT — v1-v63 to'liq tekshiruv shu bilan yakunlanadi). SAVOL DOIRASIDA
// ishlaydi.
//
//   node scripts/question-tools/fix-v63.cjs         # quruq yurish
//   node scripts/question-tools/fix-v63.cjs apply   # yozadi
// ============================================================================

const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.resolve(__dirname, '..', '..', 'public');
const APPLY = process.argv.includes('apply');

const FIXES = {
  t_63_q_1: [
    { lang: 'ru', bad: '5.22. «Начало поселения».', good: '5.22. «Начало населённого пункта».', why: 'Korpusda "aholi punkti" doim "населённый пункт" deb tarjima qilinadi (bu yerda yagona istisno "поселение" edi) — atama nomuvofiqligi.' },
  ],
  t_63_q_4: [
    { lang: 'ru', bad: 'отделена от других полос проезжей части кольцевой линией, транспортные средства, пытающиеся повернуть, должны снова выстроиться на этой полосе движения.', good: 'отделена от других полос проезжей части прерывистой линией, транспортные средства, пытающиеся повернуть, должны снова выстроиться на этой полосе движения.', why: 'uz: "uzuq-uzuq chiziq bilan ajratilgan" (прерывистая, uzuq-uzuq) — "кольцевой" (halqasimon) noto\'g\'ri tarjima, xuddi t_47_q_16, t_55_q_13, t_58_q_18 da topilgan xato bilan bir xil.' },
  ],
  t_63_q_6: [
    { lang: 'ru', bad: 'ПРИЛОЖЕНИЯ 1 к Стандарту и 5. Пунктом 11', good: 'ПРИЛОЖЕНИЯ 1 к ПДД и пунктом 5, абзацем 11', why: 'Tizimli xato: "ПДД" o\'rniga mavjud bo\'lmagan "Стандарту" (standart) ishlatilgan edi.' },
  ],
  t_63_q_7: [
    { lang: 'ru', bad: 'через пешеходные переходы, а также подземные и эстакады, а при их отсутствии', good: 'через пешеходные переходы, а также подземные и надземные переходы, а при их отсутствии', why: 'uz: "yer osti va yer usti o\'tish joylaridan" (ikkalasi ham PIYODALAR uchun o\'tish joyi) — "эстакады" (transport uchun yo\'l o\'tkazgich) mavzuga mos emas, "надземные переходы" (yer usti piyodalar o\'tish joyi) bo\'lishi kerak.' },
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
if (!APPLY) console.log('\nYozish uchun: node scripts/question-tools/fix-v63.cjs apply');
