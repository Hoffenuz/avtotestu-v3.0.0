#!/usr/bin/env node
/**
 * Bosh sahifadagi "Sinab ko'ring" kartasi uchun KUNLIK savollar hovuzi.
 *
 *   node scripts/generate-home-sample-pool.cjs
 *
 * Natija: src/data/homeSamplePool.ts (commit qilinadi; prebuild'da EMAS —
 * hovuz faqat savollar bazasi o'zgarganda qayta yaratiladi).
 *
 * MANBA: bepul baza — public/free-{uz-lat,uz-cyr,ru}.json, matn
 * o'zgartirilmaydi. Hovuz faqat KIRGAN foydalanuvchiga, alohida chunk
 * sifatida (dynamic import) yuklanadi — mehmon va birinchi tashrif uni
 * umuman yuklamaydi.
 *
 * TANLOV MEZONI (karta kichik, rasmsiz, xato ko'rsatmasligi SHART):
 *   * rasmsiz va matnda rasmga ishora yo'q ("rasmda", "ushbu belgi" ...);
 *   * uchala tilda bor, variantlar soni bir xil, to'g'ri javob BITTA va
 *     uchala tilda bir xil id/indeksda;
 *   * variantlardagi raqamlar uchala tilda bir xil (t_4_q_15 kabi ruscha
 *     variantlar almashib qolgan savollarni ushlash uchun);
 *   * qisqa: savol ≤ 120, variant ≤ 70 belgi (lotin; ru/kirill ≤ 90);
 *   * doimiy 5 ta mehmon savoli (homeSampleQuestions.ts) takrorlanmaydi;
 *   * biletlar bo'ylab tarqatilgan (har biletdan navbat bilan bittadan).
 */
const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const POOL_SIZE = 60; // 12 kun × 5 savol
const LANGS = [
  ["uz-lat", "uz_lat"],
  ["uz-cyr", "uz_cyr"],
  ["ru", "ru"],
];
const IMAGE_HINT = {
  uz_lat: /rasm|ushbu|chizma|sxema|quyidagi belgi|shu belgi/i,
  uz_cyr: /расм|ушбу|чизма|схема|қуйидаги белги|шу белги/i,
  ru: /рисун|изображ|данн(ый|ом|ого) знак|схем|этот знак/i,
};
const MAX_Q = { uz_lat: 120, uz_cyr: 140, ru: 140 };
const MAX_OPT = { uz_lat: 70, uz_cyr: 90, ru: 90 };

// Doimiy mehmon savollari — hovuzda takrorlanmasin.
const fixedSrc = fs.readFileSync(path.join(ROOT, "src/data/homeSampleQuestions.ts"), "utf8");
const FIXED_IDS = new Set([...fixedSrc.matchAll(/"id":\s*"([^"]+)"/g)].map((m) => m[1]));

const byId = new Map();
for (const [file, key] of LANGS) {
  const data = JSON.parse(fs.readFileSync(path.join(ROOT, `public/free-${file}.json`), "utf8"));
  for (const q of data) {
    const id = q.task_info.global_id;
    if (!byId.has(id)) byId.set(id, { id, ticket: q.task_info.ticket_num, order: q.task_info.order, media: q.media_url, c: {} });
    const entry = byId.get(id);
    if (q.media_url) entry.media = q.media_url;
    if (q.content && q.content[key]) entry.c[key] = q.content[key];
  }
}

const digits = (s) => (s.match(/\d+/g) || []).join(",");
const reject = {};
const bad = (why) => ((reject[why] = (reject[why] || 0) + 1), null);

function candidate(e) {
  if (FIXED_IDS.has(e.id)) return bad("mehmon savoli");
  if (e.media) return bad("rasmli");
  const keys = LANGS.map(([, k]) => k);
  if (!keys.every((k) => e.c[k] && e.c[k].text && Array.isArray(e.c[k].options))) return bad("til yetishmaydi");
  const n = e.c.uz_lat.options.length;
  if (n < 2 || n > 4 || !keys.every((k) => e.c[k].options.length === n)) return bad("variantlar soni");
  let correct = -1;
  for (const k of keys) {
    const idx = e.c[k].options.map((o, i) => (o.is_correct ? i : -1)).filter((i) => i >= 0);
    if (idx.length !== 1) return bad("to'g'ri javob bitta emas");
    if (correct === -1) correct = idx[0];
    else if (correct !== idx[0]) return bad("to'g'ri javob tillarda farq");
  }
  for (let i = 0; i < n; i++) {
    const ids = keys.map((k) => e.c[k].options[i].id);
    if (new Set(ids).size !== 1) return bad("variant id farq");
    const d = keys.map((k) => digits(e.c[k].options[i].text));
    if (new Set(d).size !== 1) return bad("raqamlar tillarda farq");
  }
  for (const k of keys) {
    const text = e.c[k].text.trim();
    if (IMAGE_HINT[k].test(text)) return bad("rasmga ishora");
    if (text.length > MAX_Q[k]) return bad("savol uzun");
    if (e.c[k].options.some((o) => !o.text.trim() || o.text.trim().length > MAX_OPT[k])) return bad("variant uzun/bo'sh");
  }
  return {
    id: e.id,
    ticket: e.ticket,
    order: e.order,
    correct,
    text: Object.fromEntries(keys.map((k) => [k, e.c[k].text.trim()])),
    options: e.c.uz_lat.options.map((_, i) => Object.fromEntries(keys.map((k) => [k, e.c[k].options[i].text.trim()]))),
  };
}

// Nomzodlar, matn bo'yicha takrorsiz, bilet → tartib bo'yicha saralangan
const seen = new Set();
const byTicket = new Map();
for (const e of [...byId.values()].sort((a, b) => a.ticket - b.ticket || a.order - b.order)) {
  const c = candidate(e);
  if (!c || seen.has(c.text.uz_lat)) continue;
  seen.add(c.text.uz_lat);
  if (!byTicket.has(c.ticket)) byTicket.set(c.ticket, []);
  byTicket.get(c.ticket).push(c);
}

// Biletlar bo'ylab navbat bilan: har 5 talik to'plamda turli biletlar
const pool = [];
const queues = [...byTicket.values()];
while (pool.length < POOL_SIZE && queues.some((q) => q.length)) {
  for (const q of queues) {
    if (pool.length >= POOL_SIZE) break;
    if (q.length) pool.push(q.shift());
  }
}
if (pool.length < POOL_SIZE) {
  console.error(`XATO: hovuz uchun ${POOL_SIZE} ta savol kerak, topildi ${pool.length}`);
  process.exit(1);
}

const body = pool.map(({ id, correct, text, options }) => ({ id, correct, text, options }));
const out = `/**
 * AVTOMATIK YARATILGAN — qo'lda tahrirlamang.
 *   node scripts/generate-home-sample-pool.cjs
 *
 * "Sinab ko'ring" kartasining KUNLIK savollar hovuzi (kirgan foydalanuvchi
 * uchun, har kuni 5 tadan). Bepul bazadan, matn o'zgartirilmagan; tanlov
 * mezoni — skript boshida. Alohida chunk: faqat kerak bo'lganda yuklanadi.
 */
import type { HomeSampleQuestion } from "@/data/homeSampleQuestions";

export const HOME_SAMPLE_POOL: readonly HomeSampleQuestion[] = ${JSON.stringify(body, null, 2)};
`;
fs.writeFileSync(path.join(ROOT, "src/data/homeSamplePool.ts"), out, "utf8");
console.log(`hovuz: ${pool.length} ta savol, ${new Set(pool.map((p) => p.ticket)).size} ta biletdan`);
console.log("rad etilgan:", reject);
