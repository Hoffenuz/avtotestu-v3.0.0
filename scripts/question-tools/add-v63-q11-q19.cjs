#!/usr/bin/env node
/**
 * v63 uchun 11–19 savollarni barcha manzillarga qo'shadi.
 *
 * MANZILLAR (savol bazasi bir necha joyda takrorlanadi):
 *   1. public/data/variants/v63.json      — variant (uch til bitta faylda)
 *   2. public/barcha-{uz-lat,uz-cyr,ru}.json — 1250 lik to'liq baza (har til alohida)
 *   3. public/mavzuli2/35a.json           — "Yangi savollar" mavzusi
 *   4. public/mavzuli2/<mavzu>.json       — savolning o'z mavzusi
 *   5. scripts/question-tools/free-tier-question-ids.json — bepul 1000 lik manifest
 *      (undan keyin `npm run questions:sync:free-tier` free-*.json ni qayta yasaydi)
 *
 * IDEMPOTENT: qayta ishga tushirilsa takror qo'shmaydi — mavjud global_id lar
 * o'tkazib yuboriladi. Shu sababli xatoni tuzatib qayta yugurtirish xavfsiz.
 *
 * Ishga tushirish:  node scripts/question-tools/add-v63-q11-q19.cjs [--apply]
 * `--apply` bo'lmasa faqat nima o'zgarishini ko'rsatadi (quruq yurish).
 */

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..', '..');
const APPLY = process.argv.includes('--apply');

const SOURCE = path.join(__dirname, 'v63-q11-q19-source.json');
const LANGS = [
  ['uz_lat', 'uz-lat'],
  ['uz_cyr', 'uz-cyr'],
  ['ru', 'ru'],
];

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8'));
}

function writeJson(p, data) {
  if (!APPLY) return;
  fs.writeFileSync(p, JSON.stringify(data, null, 2) + '\n', 'utf8');
}

function gidOf(q) {
  return (q && q.task_info && q.task_info.global_id) || null;
}

/** Ro'yxatda bo'lmagan savollarni oxiriga qo'shadi. */
function appendMissing(list, items, label) {
  const have = new Set(list.map(gidOf));
  const added = [];
  for (const it of items) {
    const gid = gidOf(it);
    if (have.has(gid)) continue;
    list.push(it);
    added.push(gid);
  }
  console.log(`  ${label.padEnd(38)} ${added.length ? '+' + added.length : 'o\'zgarishsiz'}${added.length ? '  (' + added.join(', ') + ')' : ''}`);
  return added.length;
}

/**
 * Ko'p tilli savoldan bitta til uchun yozuv yasaydi (barcha-*.json formati).
 *
 * DIQQAT: `izoh` bu fayllarda ham OBYEKT — `{ uz_lat: "..." }` ko'rinishida,
 * oddiy satr emas. Satr yozilsa `pickIzohText()` uni to'g'ri o'qiy olmaydi.
 */
function toSingleLang(q, langKey) {
  const c = q.content[langKey];
  if (!c) throw new Error(`${gidOf(q)}: ${langKey} tili yo'q`);
  return {
    task_info: { ...q.task_info },
    media_url: q.media_url,
    content: { [langKey]: c },
    izoh: { [langKey]: q.izoh[langKey] },
  };
}

// ---------------------------------------------------------------- yuklash
const raw = readJson(SOURCE);

// `topic` faqat shu skript uchun — fayllarga yozilmaydi
const questions = raw.map((q) => {
  const { topic, ...rest } = q;
  return { topic, q: rest };
});

console.log(`Manba: ${questions.length} ta savol (${questions.map((x) => gidOf(x.q)).join(', ')})`);
console.log(APPLY ? 'REJIM: YOZISH\n' : 'REJIM: quruq yurish (--apply berilmagan)\n');

let total = 0;

// -------------------------------------------------- 1) variant fayli
{
  const p = path.join(ROOT, 'public/data/variants/v63.json');
  const list = readJson(p);
  total += appendMissing(list, questions.map((x) => x.q), 'v63.json');
  list.sort((a, b) => (a.task_info.order || 0) - (b.task_info.order || 0));
  writeJson(p, list);
}

// -------------------------------------------------- 2a) barcha.json (ko'p tilli)
// Deploy'ga chiqmaydi (vite uni dist'dan chiqarib tashlaydi), lekin QA
// vositalari va `generate-free-tier.cjs` shundan o'qiydi — sinxron turishi shart.
{
  const p = path.join(ROOT, 'public/barcha.json');
  const list = readJson(p);
  total += appendMissing(list, questions.map((x) => x.q), 'barcha.json (QA, ko\'p tilli)');
  writeJson(p, list);
}

// -------------------------------------------------- 2b) barcha-*.json
for (const [langKey, fileLang] of LANGS) {
  const p = path.join(ROOT, `public/barcha-${fileLang}.json`);
  const list = readJson(p);
  total += appendMissing(list, questions.map((x) => toSingleLang(x.q, langKey)), `barcha-${fileLang}.json`);
  writeJson(p, list);
}

// -------------------------------------------------- 3) "Yangi savollar" (35a)
{
  const p = path.join(ROOT, 'public/mavzuli2/35a.json');
  const list = readJson(p);
  total += appendMissing(list, questions.map((x) => x.q), 'mavzuli2/35a.json (Yangi savollar)');
  writeJson(p, list);
}

// -------------------------------------------------- 4) mavzu fayllari
{
  const byTopic = {};
  for (const { topic, q } of questions) (byTopic[topic] ||= []).push(q);

  for (const [topic, items] of Object.entries(byTopic)) {
    const p = path.join(ROOT, `public/mavzuli2/${topic}.json`);
    if (!fs.existsSync(p)) {
      console.log(`  ${('mavzuli2/' + topic + '.json').padEnd(38)} FAYL YO'Q — o'tkazildi`);
      continue;
    }
    const list = readJson(p);
    total += appendMissing(list, items, `mavzuli2/${topic}.json`);
    writeJson(p, list);
  }
}

// -------------------------------------------------- 5) bepul manifest
{
  const p = path.join(__dirname, 'free-tier-question-ids.json');
  const ids = readJson(p);
  const have = new Set(ids);
  const added = [];
  for (const { q } of questions) {
    const gid = gidOf(q);
    if (have.has(gid)) continue;
    ids.push(gid);
    added.push(gid);
  }
  console.log(`  ${'free-tier-question-ids.json'.padEnd(38)} ${added.length ? '+' + added.length : "o'zgarishsiz"}  (jami ${ids.length})`);
  total += added.length;
  writeJson(p, ids);
}

console.log(`\nJami yozuv qo'shildi: ${total}`);
if (!APPLY) console.log('Hech narsa yozilmadi. Yozish uchun: --apply');
else console.log('Keyingi qadam: npm run questions:sync:free-tier');
