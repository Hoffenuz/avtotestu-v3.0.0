// ============================================================================
// fix-round6-sync-gaps.cjs — repairs 3 fixes from fix-latcyr-round6.cjs that
// silently failed in COMPACT json files (free-uz-lat.json, free-uz-cyr.json)
// because their "bad" strings relied on JSON whitespace formatting
// (`"text": "..."` with a space after the colon) instead of pure content —
// exactly the documented pitfall. Rewritten as content-only / regex matches.
//
//   node scripts/question-tools/fix-round6-sync-gaps.cjs         # dry-run
//   node scripts/question-tools/fix-round6-sync-gaps.cjs apply   # writes
// ============================================================================

const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.resolve(__dirname, '..', '..', 'public');
const APPLY = process.argv.includes('apply');

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

const TEXT_FIXES = {
  t_12_q_20: [
    { bad: "Bu yo'l chizig'i:", good: "Bu yo'l chizig'i quyidagi maqsadni:" },
  ],
  t_29_q_14: [
    { bad: 'yuk xonasi bordlari balanligi :', good: 'yuk xonasi bordlari balandligi:' },
  ],
};

const counts = new Map();
const touched = [];

for (const file of collectJson(PUBLIC_DIR)) {
  const before = fs.readFileSync(file, 'utf8');
  let text = before;

  const spans = questionSpans(text).filter((s) => TEXT_FIXES[s.gid] || s.gid === 't_62_q_5').reverse();
  for (const s of spans) {
    let chunk = text.slice(s.start, s.end);
    let n = 0;

    if (TEXT_FIXES[s.gid]) {
      for (const f of TEXT_FIXES[s.gid]) {
        if (!chunk.includes(f.bad)) continue;
        n += chunk.split(f.bad).length - 1;
        chunk = chunk.split(f.bad).join(f.good);
      }
    }

    if (s.gid === 't_62_q_5') {
      const re = /("text"\s*:\s*")Оқ(")/;
      if (re.test(chunk)) {
        chunk = chunk.replace(re, '$1Оқ автомобил$2');
        n += 1;
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
for (const gid of ['t_12_q_20', 't_29_q_14', 't_62_q_5']) {
  const n = counts.get(gid) || 0;
  console.log(`${n ? ' ' : '-'} ${String(n).padStart(3)}  ${gid}${n ? '' : '   (TOPILMADI)'}`);
}
if (touched.length) {
  console.log('\nFayllar:');
  for (const f of touched) console.log('  ' + f);
}
if (!APPLY) console.log('\nYozish uchun: node scripts/question-tools/fix-round6-sync-gaps.cjs apply');
