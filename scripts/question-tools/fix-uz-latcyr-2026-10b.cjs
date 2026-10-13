// ============================================================================
// fix-uz-latcyr-2026-10b.cjs — lotin va kirill uzbekcha matnlarni so'zma-so'z solishtirib (transliteratsiya orqali)
// topilgan farqlar: qaysi tomonda imlo xatosi bo'lsa, o'sha tomon tuzatildi.
// Faqat to'liq so'z chegarasida almashtiriladi.
//
//   node scripts/question-tools/fix-uz-latcyr-2026-10b.cjs         # quruq yurish
//   node scripts/question-tools/fix-uz-latcyr-2026-10b.cjs apply   # yozadi
// ============================================================================

const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.resolve(__dirname, '..', '..', 'public');
const APPLY = process.argv.includes('apply');

const FIXES = {
 "t_19_q_15": [{"bad":"40 км/ч","good":"40 км/с"}],
 "t_19_q_5": [
  {
   "bad": "аслаҳаланган",
   "good": "юкланган"
  }
 ],
 "t_22_q_5": [
  {
   "bad": "ҳаракатлани давом",
   "good": "ҳаракатни давом"
  }
 ],
 "t_22_q_1": [
  {
   "bad": "ёрилаб",
   "good": "ёрилиб"
  }
 ],
 "t_40_q_6": [
  {
   "bad": "бериладими",
   "good": "этиладими"
  },
  {
   "bad": "берилади",
   "good": "этилади"
  },
  {
   "bad": "берилмайди",
   "good": "этилмайди"
  }
 ],
 "t_18_q_7": [
  {
   "bad": "автомобилига",
   "good": "автомобилга"
  }
 ],
 "t_18_q_20": [
  {
   "bad": "Қизил автомобил қайси",
   "good": "Қизил автомобилга қайси"
  }
 ],
 "t_27_q_1": [
  {
   "bad": "шатакка олинган транспорт воситаларини шатакка олган транспорт воситаларининг изидан",
   "good": "шатакка олинган транспорт воситаларининг шатакка олган транспорт воситалари изидан"
  }
 ],
 "t_33_q_3": [
  {
   "bad": "Йўлни қатнов",
   "good": "Йўлнинг қатнов"
  }
 ],
 "t_58_q_3": [
  {
   "bad": "шиналарни сийқаланиб",
   "good": "шиналарнинг сийқаланиб"
  }
 ],
 "t_25_q_11": [
  {
   "bad": "автомобилни вазни",
   "good": "автомобилнинг вазни"
  }
 ],
 "t_51_q_17": [
  {
   "bad": "қопламасини бор",
   "good": "қопламасининг бор"
  },
  {
   "bad": "қопламаси бор",
   "good": "қопламасининг бор"
  },
  {
   "bad": "qoplamasi bor",
   "good": "qoplamasining bor"
  }
 ],
 "t_58_q_10": [
  {
   "bad": "ҳолатларнинг",
   "good": "ҳолларнинг"
  }
 ],
 "t_33_q_12": [
  {
   "bad": "to‘g‘irlab",
   "good": "to‘g‘rilab"
  }
 ],
 "t_55_q_19": [
  {
   "bad": "avtobus haydovchi ushbu",
   "good": "avtobus haydovchisi ushbu"
  }
 ],
 "t_20_q_3": [
  {
   "bad": "оқ 5.22 ёки 5.24 ҳаворанг рангли белгидан",
   "good": "оқ рангли 5.22 ёки ҳаворанг 5.24 белгидан"
  }
 ],
 "t_30_q_19": [
  {
   "bad": "«Ногирон» таниқлик белгиси ўрнатилган ногирон бошқараётган автомобилга, Таксометри ишлаб турган таксиларга",
   "good": "Таксометри ишлаб турган таксиларга, «Ногирон» таниқлик белгиси ўрнатилган ногирон бошқараётган автомобилга"
  }
 ],
 "t_31_q_11": [
  {
   "bad": "бўлакни ўзига таъсир қилади",
   "good": "бўлакка ўз таъсирини қилади"
  }
 ]
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
      const esc = Array.from(f.bad).map((ch) => ('.*+?^$' + String.fromCharCode(123,125,40,41,124,91,93,92)).includes(ch) ? String.fromCharCode(92) + ch : ch).join('');
      const edge = String.raw`[\p{L}\p{M}‘’ʻʼ']`;
      const re = new RegExp('(?<!' + edge + ')' + esc + '(?!' + edge + ')', 'gu');
      const m = chunk.match(re);
      if (!m) continue;
      n += m.length;
      chunk = chunk.replace(re, () => f.good);
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
if (!APPLY) console.log('\nYozish uchun: node scripts/question-tools/fix-uz-sample-2026-10.cjs apply');
