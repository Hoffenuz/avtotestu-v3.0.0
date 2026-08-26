// ============================================================================
// audit-number-mismatch.cjs — har bir savol uchun uz_lat va ru matnlarida
// (savol matni + barcha variantlar + izoh) uchraydigan RAQAMLAR to'plamini
// solishtiradi. Variantlar tartibi tillar orasida farq qilishi mumkinligi
// uchun (bu allaqachon boshqa xato toifasi sifatida topilgan) taqqoslash
// BUTUN savol darajasida, tartibga bog'liq bo'lmagan holda (multiset)
// qilinadi — shu bilan bir vaqtda ham noto'g'ri raqam (masalan tezlik
// chegarasi, masofa, modda/band raqami) tarjima xatolarini ochib beradi.
//
// Faqat NOMZODLARNI ro'yxatlaydi — hech narsani o'zgartirmaydi.
//
//   node scripts/question-tools/audit-number-mismatch.cjs
// ============================================================================

const fs = require('fs');
const path = require('path');

const VARIANTS_DIR = path.resolve(__dirname, '..', '..', 'public', 'data', 'variants');

function numbers(s) {
  if (!s) return [];
  const m = s.match(/\d+(?:[.,]\d+)?/g) || [];
  return m.map((n) => n.replace(',', '.').replace(/^0+(?=\d)/, ''));
}

function multisetDiff(a, b) {
  const ca = new Map();
  for (const x of a) ca.set(x, (ca.get(x) || 0) + 1);
  const cb = new Map();
  for (const x of b) cb.set(x, (cb.get(x) || 0) + 1);
  const onlyA = [];
  const onlyB = [];
  const keys = new Set([...ca.keys(), ...cb.keys()]);
  for (const k of keys) {
    const da = (ca.get(k) || 0) - (cb.get(k) || 0);
    if (da > 0) for (let i = 0; i < da; i++) onlyA.push(k);
    if (da < 0) for (let i = 0; i < -da; i++) onlyB.push(k);
  }
  return { onlyA, onlyB };
}

function collectText(content, lang, izoh) {
  const c = content[lang];
  if (!c) return '';
  const parts = [c.text, ...(c.options || []).map((o) => o.text)];
  if (izoh && izoh[lang]) parts.push(izoh[lang]);
  return parts.join(' \n ');
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
    if (!q.content.uz_lat || !q.content.ru) return;
    const uzText = collectText(q.content, 'uz_lat', q.izoh);
    const ruText = collectText(q.content, 'ru', q.izoh);
    const uzNums = numbers(uzText);
    const ruNums = numbers(ruText);
    const { onlyA, onlyB } = multisetDiff(uzNums, ruNums);
    if (onlyA.length || onlyB.length) {
      results.push({ gid, file: f, onlyUz: onlyA, onlyRu: onlyB });
    }
  });
}

console.log(`Fayllar skanerlandi: ${files.length}`);
console.log(`Raqamlar mos kelmagan savollar: ${results.length}\n`);
for (const r of results) {
  console.log(`${r.gid} (${r.file}) — faqat UZda: [${r.onlyUz.join(', ')}]  faqat RUda: [${r.onlyRu.join(', ')}]`);
}
