// ============================================================================
// audit-uzlat-uzcyr-wordcount.cjs — uz_lat va uz_cyr bir xil tilning ikki
// yozuvi bo'lgani uchun, MOS KELUVCHI maydonlar (savol matni, har bir
// variant xuddi shu index bo'yicha, izoh) so'zlar sonida deyarli bir xil
// bo'lishi kerak. Farq bo'lsa — biri tahrirlanib, ikkinchisi yangilanmagan
// degani (sinxronizatsiya xatosi).
//
//   node scripts/question-tools/audit-uzlat-uzcyr-wordcount.cjs
// ============================================================================

const fs = require('fs');
const path = require('path');

const VARIANTS_DIR = path.resolve(__dirname, '..', '..', 'public', 'data', 'variants');
const THRESHOLD = 0; // nechta so'zdan ko'p farq bo'lsa, nomzod deb hisoblanadi

function wc(s) {
  if (!s) return 0;
  return s.trim().split(/\s+/).filter(Boolean).length;
}

function walkQuestions(data, cb) {
  if (Array.isArray(data)) { for (const it of data) walkQuestions(it, cb); return; }
  if (data && typeof data === 'object') {
    if (data.task_info && data.content) cb(data);
  }
}

const results = [];
const files = fs.readdirSync(VARIANTS_DIR).filter((f) => f.endsWith('.json')).sort();

for (const f of files) {
  const full = path.join(VARIANTS_DIR, f);
  let data;
  try { data = JSON.parse(fs.readFileSync(full, 'utf8')); } catch { continue; }
  walkQuestions(data, (q) => {
    const gid = q.task_info.global_id;
    const lat = q.content.uz_lat;
    const cyr = q.content.uz_cyr;
    if (!lat || !cyr) return;

    const diffs = [];
    const qDiff = Math.abs(wc(lat.text) - wc(cyr.text));
    if (qDiff > THRESHOLD) diffs.push(`savol matni: lat=${wc(lat.text)} so'z, cyr=${wc(cyr.text)} so'z`);

    const n = Math.max(lat.options.length, cyr.options.length);
    for (let i = 0; i < n; i++) {
      const lo = lat.options[i];
      const co = cyr.options[i];
      if (!lo || !co) { diffs.push(`variant #${i + 1}: bittasida yo'q`); continue; }
      const d = Math.abs(wc(lo.text) - wc(co.text));
      if (d > THRESHOLD) diffs.push(`variant #${i + 1}: lat=${wc(lo.text)} so'z, cyr=${wc(co.text)} so'z`);
    }

    if (q.izoh) {
      const d = Math.abs(wc(q.izoh.uz_lat) - wc(q.izoh.uz_cyr));
      if (d > THRESHOLD) diffs.push(`izoh: lat=${wc(q.izoh.uz_lat)} so'z, cyr=${wc(q.izoh.uz_cyr)} so'z`);
    }

    if (diffs.length) results.push({ gid, file: f, diffs });
  });
}

console.log(`Fayllar skanerlandi: ${files.length}`);
console.log(`So'z soni mos kelmagan savollar: ${results.length}\n`);
for (const r of results) {
  console.log(`${r.gid} (${r.file}):`);
  for (const d of r.diffs) console.log(`   - ${d}`);
}
