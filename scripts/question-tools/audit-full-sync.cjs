// ============================================================================
// audit-full-sync.cjs — har bir global_id UCHUN, uning `public/data/variants`
// (kanonik manba) dagi versiyasi bilan boshqa barcha fayllardagi (mavzuli2,
// barcha*, free*, 600.json) nusxalarini CHUQUR solishtiradi. Formatlashga
// (bo'shliq/tartib) emas, faqat MAZMUNGA (parse qilingan JSON qiymatlariga)
// tayanadi. Til bo'yicha — fayl faqat bitta tilni saqlasa (masalan
// free-ru.json), faqat o'sha til solishtiriladi.
//
//   node scripts/question-tools/audit-full-sync.cjs
// ============================================================================

const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.resolve(__dirname, '..', '..', 'public');
const VARIANTS_DIR = path.join(PUBLIC_DIR, 'data', 'variants');
const LANGS = ['uz_lat', 'uz_cyr', 'ru'];

function collectJson(dir, out = []) {
  for (const n of fs.readdirSync(dir)) {
    const p = path.join(dir, n);
    if (fs.statSync(p).isDirectory()) collectJson(p, out);
    else if (n.endsWith('.json')) out.push(p);
  }
  return out;
}

function walkQuestions(data, cb) {
  if (Array.isArray(data)) { for (const it of data) walkQuestions(it, cb); return; }
  if (data && typeof data === 'object') {
    if (data.task_info && data.task_info.global_id && data.content) cb(data);
  }
}

// 1) Kanonik (variants) manbani yig'ish
const canonical = new Map(); // gid -> question object
for (const f of fs.readdirSync(VARIANTS_DIR).filter((n) => n.endsWith('.json'))) {
  const data = JSON.parse(fs.readFileSync(path.join(VARIANTS_DIR, f), 'utf8'));
  walkQuestions(data, (q) => {
    canonical.set(q.task_info.global_id, { q, file: 'data/variants/' + f });
  });
}

function normalizeContentLang(c) {
  if (!c) return null;
  return {
    text: (c.text || '').trim(),
    options: (c.options || []).map((o) => ({ text: (o.text || '').trim(), is_correct: !!o.is_correct })),
  };
}

function deepEqual(a, b) {
  return JSON.stringify(a) === JSON.stringify(b);
}

// 2) Boshqa barcha fayllarni tekshirish
const allFiles = collectJson(PUBLIC_DIR).filter((f) => !f.includes(path.sep + 'variants' + path.sep));
const mismatches = [];
let comparedQuestions = 0;

for (const file of allFiles) {
  let data;
  try { data = JSON.parse(fs.readFileSync(file, 'utf8')); } catch { continue; }
  walkQuestions(data, (q) => {
    const gid = q.task_info.global_id;
    const ref = canonical.get(gid);
    if (!ref) return; // kanonikda yo'q (masalan eski/olib tashlangan) — alohida masala
    comparedQuestions++;
    const rel = path.relative(PUBLIC_DIR, file);

    for (const lang of LANGS) {
      // Bu fayl bu tilni umuman saqlamasa (masalan free-ru.json da uz_lat
      // yo'q) — bu kutilgan holat, xato emas, o'tkazib yuboriladi.
      if (q.content[lang] === undefined) continue;
      const a = normalizeContentLang(ref.q.content[lang]);
      const b = normalizeContentLang(q.content[lang]);
      if (!deepEqual(a, b)) {
        mismatches.push({ gid, file: rel, lang, field: 'content' });
      }
      if (q.izoh && q.izoh[lang] !== undefined) {
        const ia = ref.q.izoh ? (ref.q.izoh[lang] || '').trim() : '';
        const ib = (q.izoh[lang] || '').trim();
        if (ia !== ib) {
          mismatches.push({ gid, file: rel, lang, field: 'izoh' });
        }
      }
    }
  });
}

console.log(`Kanonik (variants) savollar: ${canonical.size}`);
console.log(`Boshqa fayllarda solishtirilgan nusxalar: ${comparedQuestions}`);
console.log(`Nomuvofiqliklar: ${mismatches.length}\n`);

const byGid = new Map();
for (const m of mismatches) {
  if (!byGid.has(m.gid)) byGid.set(m.gid, []);
  byGid.get(m.gid).push(m);
}
for (const [gid, ms] of byGid) {
  console.log(`${gid}:`);
  for (const m of ms) console.log(`   - ${m.file} [${m.lang}/${m.field}]`);
}
