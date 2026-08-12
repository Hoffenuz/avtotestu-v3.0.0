#!/usr/bin/env node
/**
 * Free tier (bepul "Test ishlash") ma'lumotlarini generatsiya qiladi.
 *
 * TARIX: public/600.json originalda (birinchi commit) haqiqiy 600 ta savoldan
 * iborat kurashtirilgan to'plam edi (63 tadan 40 ta variantdan tanlangan).
 * 2026-07-20 dagi "izohlar togorilarnd" commit paytida izoh (explanation)
 * matnlarini to'g'irlash uchun yozilgan skript 600.json ni ham "to'liq sinxron"
 * qilib qo'ygan — natijada u tasodifan barcha.json bilan bir xil 1250 ta
 * savolga aylangan. Shu vaqtdan beri barcha free (bepul) foydalanuvchilar PRO
 * bilan bir xil to'liq savol bazasini ko'rib kelgan — paywall amalda ishlamagan.
 *
 * 2026-08-12: free savollar ko'p takrorlanayotgani sababli to'plam 600 dan
 * 1000 taga kengaytirildi (manifestga har bir biletdan bir xilda taqsimlangan
 * 400 ta qo'shimcha global_id qo'shildi). PRO hamon 1250 ta to'liq savol bazasi,
 * variantlar/mavzular/izohlar bo'limlari bilan farqlanadi.
 *
 * Bu skript joriy savol ro'yxatini (free-tier-question-ids.json — o'zgarmas
 * manba, hozir 1000 ta id) joriy (tuzatilgan) kontent bilan qayta generatsiya
 * qiladi:
 *   - public/free-uz-lat.json / free-uz-cyr.json / free-ru.json — brauzer
 *     uchun, bitta til (free foydalanuvchi shu fayllardan birini yuklaydi)
 *   - public/600.json — ko'p tilli, faqat QA tooling uchun (deploy'ga
 *     chiqmaydi, vite.config.ts orqali chiqarib tashlanadi)
 *
 * Ishlatish: node scripts/generate-free-tier.cjs
 * (barcha-*.json fayllarga typo/izoh tuzatish kiritilgach qayta ishga tushiring)
 *
 * SO'NGRA SHART: src/lib/fetchQuestionJson.ts dagi QUESTION_DATA_CACHE_BUST ni
 * yangilang. JSON lar CDN da 24 soat + 7 kun stale-while-revalidate bilan
 * keshlanadi — token yangilanmasa tuzatishlar foydalanuvchiga yetib bormaydi.
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const PUBLIC = path.join(ROOT, "public");
const MANIFEST = path.join(__dirname, "question-tools", "free-tier-question-ids.json");

function loadJson(p) {
  return JSON.parse(fs.readFileSync(p, "utf8"));
}
function writeJson(p, data) {
  fs.writeFileSync(p, JSON.stringify(data), "utf8");
}

const EXPECTED_COUNT = 1000;

const freeIds = new Set(loadJson(MANIFEST));
if (freeIds.size !== EXPECTED_COUNT) {
  throw new Error(`Manifest expected ${EXPECTED_COUNT} ids, got ${freeIds.size}`);
}

function extractSubset(sourceFile) {
  const full = loadJson(path.join(PUBLIC, sourceFile));
  const subset = full.filter((q) => freeIds.has(q.task_info?.global_id));
  return subset;
}

// ── Bitta til fayllari (brauzer, free foydalanuvchi) ──────────────────────
const langFiles = [
  ["barcha-uz-lat.json", "free-uz-lat.json"],
  ["barcha-uz-cyr.json", "free-uz-cyr.json"],
  ["barcha-ru.json", "free-ru.json"],
];

for (const [source, target] of langFiles) {
  const subset = extractSubset(source);
  if (subset.length !== EXPECTED_COUNT) {
    throw new Error(`${source}: expected ${EXPECTED_COUNT} matches, got ${subset.length} — manifest/data out of sync`);
  }
  writeJson(path.join(PUBLIC, target), subset);
  console.log(`${target}: ${subset.length} ta savol`);
}

// ── Ko'p tilli 600.json (QA tooling uchun, deploy'ga chiqmaydi) ───────────
const multiLangSubset = extractSubset("barcha.json");
if (multiLangSubset.length !== EXPECTED_COUNT) {
  throw new Error(`barcha.json: expected ${EXPECTED_COUNT} matches, got ${multiLangSubset.length}`);
}
writeJson(path.join(PUBLIC, "600.json"), multiLangSubset);
console.log(`600.json (QA, ko'p tilli): ${multiLangSubset.length} ta savol`);
