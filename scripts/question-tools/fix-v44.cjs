// ============================================================================
// fix-v44.cjs — v44 tekshiruvida topilgan xatolar. SAVOL DOIRASIDA ishlaydi.
//
//   node scripts/question-tools/fix-v44.cjs         # quruq yurish
//   node scripts/question-tools/fix-v44.cjs apply   # yozadi
// ============================================================================

const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.resolve(__dirname, '..', '..', 'public');
const APPLY = process.argv.includes('apply');

const PRIORITET_FIX = { lang: 'ru', bad: 'льгота – это право двигаться впереди', good: 'приоритет – это право двигаться впереди', why: 'Savol matni "«Приоритет»" atamasini so\'raydi, lekin izoh "льгота" (boshqa tushuncha) bilan boshlanadi — atama nomuvofiqligi.' };
const BOKOVAYA_FIX = { lang: 'ru', bad: 'ровную дистанцию, обеспечивающую', good: 'боковую дистанцию, обеспечивающую', why: 'uz: "yonlama oraliq masofani" (yon tomondagi masofa) — "ровную" (tekis) mavzuga mos emas, "боковую" (yon) bo\'lishi kerak.' };

const FIXES = {
  t_44_q_1: [{ lang: 'uz_cyr', bad: 'енг катта люфт', good: 'энг катта люфт', why: '"энг" (eng) — "е" emas "э" bilan yozilishi kerak.' }],
  t_44_q_3: [{ lang: 'ru', bad: 'указывают на то, что транспортные средства, остановившиеся в зоне поражения, подлежат эвакуации.', good: 'указывают на то, что транспортные средства, остановившиеся в зоне действия знака, подлежат эвакуации.', why: 'uz: "belgi ta\'sir oralig\'ida" (belgi ta\'sir doirasi) — "зоне поражения" (zararlanish zonasi) mavzuga aloqasi yo\'q noto\'g\'ri tarjima.' }],
  t_44_q_11: [PRIORITET_FIX],
  t_8_q_5: [PRIORITET_FIX],
  t_44_q_19: [BOKOVAYA_FIX],
  t_48_q_4: [BOKOVAYA_FIX],
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
if (!APPLY) console.log('\nYozish uchun: node scripts/question-tools/fix-v44.cjs apply');
