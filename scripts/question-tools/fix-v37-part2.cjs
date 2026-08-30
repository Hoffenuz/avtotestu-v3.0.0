// ============================================================================
// fix-v37-part2.cjs — t_37_q_9 ning uz_lat va uz_cyr izohlari fix-v37.cjs da
// tirnoq belgisi ichidagi qochirilgan tirnoq (\") xom matnda mos kelmagani
// sababli almashtirilmay qolgan edi (faqat ru tuzatilgan edi). Endi to'g'ri
// qochirilgan holda tuzatiladi.
//
//   node scripts/question-tools/fix-v37-part2.cjs         # quruq yurish
//   node scripts/question-tools/fix-v37-part2.cjs apply   # yozadi
// ============================================================================

const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.resolve(__dirname, '..', '..', 'public');
const APPLY = process.argv.includes('apply');

const FIXES = {
  t_37_q_9: [
    {
      lang: 'uz_lat',
      bad: 'YHQ 1-ilovasining 4-bo\'limidagi 4.7 belgiga asosan, \\"Eng kam tezlik\\" belgisi faqat unda ko\'rsatilgan yoki undan yuqori tezlikda (km/soat) harakatlanishga ruxsat etiladi.',
      good: 'YHQga 1-ILOVA 5.42 bandiga asosan: 5.42. «Qizil chiroqda o\'ngga harakatlanish». Transport svetofori qizil chirog\'ining o\'ng yoniga 5.42 yo\'l belgisi o\'rnatilgan bo\'lsa, transport vositalarining haydovchilari svetoforning taqiqlovchi ishorasi yonib turganda, barcha xavfsizlik choralarini ko\'rgan holda o\'ngga burilishlari mumkin. Bunda ular harakat yo\'nalishi bo\'yicha va burilayotgan ko\'chani kesib o\'tayotgan piyodalarga hamda boshqa transport vositalariga yo\'l berishlari shart.',
      why: 'fix-v37.cjs dagi xato: bad matnda \\" o\'rniga oddiy " ishlatilgan edi, shu sababli xom matnda mos kelmagan.',
    },
    {
      lang: 'uz_cyr',
      bad: 'YHQ 1-иловасининг 4-бўлимидаги 4.7 белгига асосан, \\"Энг кам тезлик\\" белгиси фақат унда кўрсатилган ёки ундан юқори тезликда (км/соат) ҳаракатланишга рухсат этилади.',
      good: 'YHQга 1-ИЛОВА 5.42 бандига асосан: 5.42. «Қизил чироқда ўнгга ҳаракатланиш». Транспорт светофори қизил чироғининг ўнг ёнига 5.42 йўл белгиси ўрнатилган бўлса, транспорт воситаларининг ҳайдовчилари светофорнинг тақиқловчи ишораси ёниб турганда, барча хавфсизлик чораларини кўрган ҳолда ўнгга бурилишлари мумкин. Бунда улар ҳаракат йўналиши бўйича ва бурилаётган кўчани кесиб ўтаётган пиёдаларга ҳамда бошқа транспорт воситаларига йўл беришлари шарт.',
      why: 'Xuddi shu tuzatilmagan xato kirillcha nusxada.',
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
if (!APPLY) console.log('\nYozish uchun: node scripts/question-tools/fix-v37-part2.cjs apply');
