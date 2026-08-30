// Bepul tarifdagi savol ID larini `public/` ga nusxalaydi.
// Manba `scripts/` da (QA vositasi), lekin brauzerga `public/` orqali beriladi.
// Ikkalasi ajralib qolmasligi uchun har build da qayta yoziladi.
const fs = require('fs');
const path = require('path');

const SRC = path.resolve(__dirname, 'question-tools', 'free-tier-question-ids.json');
const OUT = path.resolve(__dirname, '..', 'public', 'data', 'free-question-ids.json');

const raw = JSON.parse(fs.readFileSync(SRC, 'utf8'));
const ids = Array.isArray(raw) ? raw : raw.ids || Object.keys(raw);
if (!Array.isArray(ids) || ids.length === 0) {
  throw new Error('free-tier-question-ids.json bo\'sh yoki kutilmagan shaklda');
}
fs.mkdirSync(path.dirname(OUT), { recursive: true });
fs.writeFileSync(OUT, JSON.stringify(ids));
console.log(`[free-ids] ${ids.length} ta ID -> public/data/free-question-ids.json`);
