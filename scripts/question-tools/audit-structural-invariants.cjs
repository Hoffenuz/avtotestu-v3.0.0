// ============================================================================
// audit-structural-invariants.cjs — har bir savol uchun buzilishi MUMKIN
// BO'LMAGAN qat'iy tuzilma qoidalarini tekshiradi (63 ta variant fayli
// bo'yicha, kanonik manba):
//
//   1. Har bir tilda (uz_lat/uz_cyr/ru) variantlar soni bir xil bo'lishi kerak.
//   2. Har bir tilda ANIQ bitta variant is_correct:true bo'lishi kerak
//      (0 ta — hech qanday to'g'ri javob yo'q; 2+ ta — ikki xil "to'g'ri" bor).
//   3. Har bir tilda variant matni bo'sh bo'lmasligi kerak.
//   4. izoh uchala tilda ham mavjud va bo'sh bo'lmasligi kerak.
//
// Bular ehtimolga emas, MANTIQIY ZARURATga asoslangan — shuning uchun bu
// yerda har qanday topilma DEYARLI 100% haqiqiy xato (soxta-musbat kam).
//
//   node scripts/question-tools/audit-structural-invariants.cjs
// ============================================================================

const fs = require('fs');
const path = require('path');

const VARIANTS_DIR = path.resolve(__dirname, '..', '..', 'public', 'data', 'variants');
const LANGS = ['uz_lat', 'uz_cyr', 'ru'];

function walkQuestions(data, cb) {
  if (Array.isArray(data)) { for (const it of data) walkQuestions(it, cb); return; }
  if (data && typeof data === 'object') {
    if (data.task_info && data.content) cb(data);
  }
}

const issues = [];
const files = fs.readdirSync(VARIANTS_DIR).filter((f) => f.endsWith('.json')).sort();

for (const f of files) {
  const full = path.join(VARIANTS_DIR, f);
  let data;
  try { data = JSON.parse(fs.readFileSync(full, 'utf8')); } catch (e) { issues.push({ gid: '(parse error)', file: f, msg: e.message }); continue; }
  walkQuestions(data, (q) => {
    const gid = q.task_info.global_id;
    const counts = {};
    for (const lang of LANGS) {
      const c = q.content[lang];
      if (!c) { issues.push({ gid, file: f, msg: `${lang} content butunlay yo'q` }); continue; }
      counts[lang] = c.options ? c.options.length : -1;
      if (!c.options || c.options.length === 0) { issues.push({ gid, file: f, msg: `${lang}: variantlar ro'yxati bo'sh` }); continue; }
      const trues = c.options.filter((o) => o.is_correct);
      if (trues.length === 0) issues.push({ gid, file: f, msg: `${lang}: HECH QANDAY to'g'ri javob belgilanmagan (is_correct:true yo'q)` });
      if (trues.length >= 2) issues.push({ gid, file: f, msg: `${lang}: ${trues.length} ta to'g'ri javob belgilangan (faqat 1 ta bo'lishi kerak) — ${trues.map((t) => `"${t.text}"`).join(' / ')}` });
      for (const o of c.options) {
        if (!o.text || !o.text.trim()) issues.push({ gid, file: f, msg: `${lang}: bo'sh variant matni (id=${o.id})` });
      }
      if (!c.text || !c.text.trim()) issues.push({ gid, file: f, msg: `${lang}: savol matni bo'sh` });
    }
    if (counts.uz_lat !== undefined && counts.uz_cyr !== undefined && counts.ru !== undefined) {
      if (counts.uz_lat !== counts.uz_cyr || counts.uz_lat !== counts.ru) {
        issues.push({ gid, file: f, msg: `variantlar soni mos emas: uz_lat=${counts.uz_lat}, uz_cyr=${counts.uz_cyr}, ru=${counts.ru}` });
      }
    }
    if (!q.izoh) {
      issues.push({ gid, file: f, msg: 'izoh butunlay yo\'q' });
    } else {
      for (const lang of LANGS) {
        if (!q.izoh[lang] || !q.izoh[lang].trim()) issues.push({ gid, file: f, msg: `izoh.${lang} bo'sh` });
      }
    }
  });
}

console.log(`Fayllar skanerlandi: ${files.length}`);
console.log(`Topilgan muammolar: ${issues.length}\n`);
for (const i of issues) {
  console.log(`${i.gid} (${i.file}): ${i.msg}`);
}
