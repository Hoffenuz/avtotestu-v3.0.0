// ============================================================================
// fix-v26.cjs — v26 variantini qo'lda o'qishda topilgan xatolar.
// QOIDA: o'zbekcha matn ETALON, ruscha unga moslashtiriladi.
//
//   node scripts/question-tools/fix-v26.cjs         # quruq yurish
//   node scripts/question-tools/fix-v26.cjs apply   # yozadi
// ============================================================================

const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.resolve(__dirname, '..', '..', 'public');
const APPLY = process.argv.includes('apply');

const FIXES = [
  // ===== uz_lat =====
  {
    id: 't_26_q_15',
    bad: 'Faqat A i C',
    good: 'Faqat A va C',
    why: "`i` — ruscha bog'lovchi. O'zbekchada `va`. Korpusda `Faqat A va C` 6x (50/50 bo'lingan).",
  },

  // ===== ru =====
  {
    id: 't_26_q_5',
    bad: 'одновременно е синим',
    good: 'одновременно с синим',
    why: '`е` -> `с` (klaviatura xatosi). Korpusda `одновременно с синим` 10x.',
  },
  {
    id: 't_26_q_11-a',
    bad: 'Сухость натощак, жажда',
    good: 'Сухость во рту, жажда',
    why: "uz: `Og'iz qurishi, chanqoqolik` = OG'IZ qurishi. `натощак` (och qoringa) mutlaqo boshqa ma'no. Korpusda `Сухость во рту` 18x.",
  },
  {
    id: 't_26_q_11-b',
    bad: 'Воспаление кожи и слизистых оболочек',
    good: 'Побледнение кожи и слизистых оболочек',
    why: 'uz: `Teri va shilliq qavatlarning OQARISHI` = oqarish, yallig\'lanish emas. Shok alomati aynan oqarish.',
  },
  {
    id: 't_26_q_11-c',
    bad: 'Потеря памяти, бессознательное состояние',
    good: 'Спутанность сознания, бессознательное состояние',
    why: "uz: `Es-hushning noaniqligi, behush holat` = ong chalkashligi, xotira yo'qolishi emas.",
  },
  {
    id: 't_26_q_16',
    bad: 'Допускается, если это не создает помех другим транспортным средствам. Для обеспечения безопасности движения водитель, в случае необходимости, должен прибегнуть к помощи других лиц',
    good: 'Допускается, если это не создает помех другим транспортным средствам и обеспечивается безопасность движения',
    why: "uz: `agar bu boshqa transport vositalariga xalaqit bermasa, harakat xavfsizligini ta'minlab...`. Ruschadagi ikkinchi gap (boshqa shaxslar yordami) BOSHQA qoidadan tushib qolgan.",
  },
  {
    id: 't_26_q_19-a',
    bad: 'На вывеске слева',
    good: 'На знаке слева',
    why: '`вывеска` = do\'kon peshtaxtasi. Yo\'l belgisi uchun `знак` ishlatiladi.',
  },
  {
    id: 't_26_q_19-b',
    bad: 'На вывеске справа',
    good: 'На знаке справа',
    why: 'xuddi shu sabab.',
  },
];

function collectJson(dir, out = []) {
  for (const n of fs.readdirSync(dir)) {
    const p = path.join(dir, n);
    if (fs.statSync(p).isDirectory()) collectJson(p, out);
    else if (n.endsWith('.json')) out.push(p);
  }
  return out;
}

const files = collectJson(PUBLIC_DIR);
const counts = new Map();
const touched = [];

for (const file of files) {
  const before = fs.readFileSync(file, 'utf8');
  let text = before;
  for (const f of FIXES) {
    if (!text.includes(f.bad)) continue;
    const n = text.split(f.bad).length - 1;
    counts.set(f.id, (counts.get(f.id) || 0) + n);
    text = text.split(f.bad).join(f.good);
  }
  if (text !== before) { touched.push(file); if (APPLY) fs.writeFileSync(file, text); }
}

const total = [...counts.values()].reduce((a, b) => a + b, 0);
console.log(APPLY ? '=== QO‘LLANDI ===' : '=== QURUQ YURISH ===');
console.log(`Fayl: ${files.length} | O'zgargan: ${touched.length} | Almashtirish: ${total}\n`);
for (const f of FIXES) {
  const n = counts.get(f.id) || 0;
  console.log(`${n ? ' ' : '-'} ${String(n).padStart(4)}  ${f.id}: ${f.bad.slice(0, 45)}${n ? '' : '   (TOPILMADI)'}`);
}
if (!APPLY) console.log('\nYozish uchun: node scripts/question-tools/fix-v26.cjs apply');
