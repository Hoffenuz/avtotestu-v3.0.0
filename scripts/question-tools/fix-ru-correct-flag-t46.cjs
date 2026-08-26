// ============================================================================
// fix-ru-correct-flag-t46.cjs — t_46_q_6 va t_46_q_13 uchun ruscha is_correct
// bayrog'i noto'g'ri variantga qo'yilgan edi (variantlar tartibi uz/ru o'rtasida
// farq qilgani uchun). Izoh va uz_lat/uz_cyr versiyalari asosida tuzatiladi.
// FORMATLASHGA (bo'shliq/vergul) emas, faqat MAZMUNGA tayanadi — pretty va
// siqilgan JSON fayllarning ikkalasida ham ishlaydi.
//
//   node scripts/question-tools/fix-ru-correct-flag-t46.cjs         # quruq yurish
//   node scripts/question-tools/fix-ru-correct-flag-t46.cjs apply   # yozadi
// ============================================================================

const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.resolve(__dirname, '..', '..', 'public');
const APPLY = process.argv.includes('apply');

function esc(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// { gid: [ { optionText, from, to } ] }
const FIXES = {
  t_46_q_6: [
    {
      optionText: 'В местах с интенсивным движением транспортных средств и пешеходов',
      from: 'true',
      to: 'false',
      why: 'Izoh (91-band) ko\'priklar/estakadalar haqida, bu variantga aloqasi yo\'q — noto\'g\'ri true edi.',
    },
    {
      optionText: 'На мостах, эстакадах и путепроводах, имеющих менее 3 полос движения',
      from: 'false',
      to: 'true',
      why: 'Izoh aynan shu variantni tasdiqlaydi, uz_lat/uz_cyr da ham mos variant to\'g\'ri deb belgilangan.',
    },
  ],
  t_46_q_13: [
    {
      optionText: 'Комплекс правовых, конструктивных и технических мероприятий и управленческих мероприятий по организации дорожного движения',
      from: 'true',
      to: 'false',
      why: 'Bu "yo\'l harakatini tashkil etish" ta\'rifi, "xavfsizlikni ta\'minlash" emas — izohga zid, noto\'g\'ri true edi.',
    },
    {
      optionText: 'Мероприятия, направленные на предупреждение причин дорожно-транспортных происшествий и уменьшение их тяжких последствий',
      from: 'false',
      to: 'true',
      why: 'Izoh (YHQ 6-band) aynan shu variantni so\'zma-so\'z tasdiqlaydi, uz_lat/uz_cyr da ham mos variant to\'g\'ri deb belgilangan.',
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

  const spans = questionSpans(text)
    .filter((s) => FIXES[s.gid])
    .reverse();

  for (const s of spans) {
    let chunk = text.slice(s.start, s.end);
    let n = 0;
    for (const f of FIXES[s.gid]) {
      const re = new RegExp(
        `("text"\\s*:\\s*"${esc(f.optionText)}"\\s*,\\s*"is_correct"\\s*:\\s*)${f.from}\\b`,
        'g'
      );
      const next = chunk.replace(re, (whole, pre) => {
        n++;
        return pre + f.to;
      });
      chunk = next;
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
if (!APPLY) console.log("\nYozish uchun: node scripts/question-tools/fix-ru-correct-flag-t46.cjs apply");
