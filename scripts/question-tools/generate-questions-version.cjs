#!/usr/bin/env node
// ============================================================================
// generate-questions-version.cjs — public/data/questions-version.json
//
// Savollar bazasining "versiyasi": sana, savollar / bepul / variant soni va
// public/barcha.json ning SHA-256 hash'i. Mobil va kompyuter ilovalari o'z
// nusxasidagi shu faylni saytdagisi bilan solishtiradi — mos kelmasa ularning
// test/build'i "savollar eskirgan" deb yiqiladi.
//
// Hash o'zgarmasa fayl QAYTA YOZILMAYDI: har build'da sana yangilanib, git'da
// bekorga o'zgarish chiqmasin. Sana — hash o'zgargan kun (Toshkent vaqti).
//
//   node scripts/question-tools/generate-questions-version.cjs          # yozadi
//   node scripts/question-tools/generate-questions-version.cjs --check  # faqat tekshiradi, eskirgan bo'lsa exit 1
// ============================================================================

const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const PUBLIC = path.resolve(__dirname, '..', '..', 'public');
const OUT = path.join(PUBLIC, 'data', 'questions-version.json');

function readJson(p) {
  return JSON.parse(fs.readFileSync(p, 'utf8').replace(/^﻿/, ''));
}

/**
 * Hash qator oxiri (CRLF/LF) va BOM dan mustaqil: Windows'da git autocrlf
 * bilan olingan nusxa va Cloudflare (Linux) build'i bir xil hash bersin.
 * JSON satrlari ichida xom yangi qator bo'lmaydi — mazmun o'zgarmaydi.
 * Ilovalardagi tekshiruvlar AYNAN shu qoidani ishlatadi.
 */
function contentHash(bytes) {
  const text = bytes.toString('utf8').replace(/^﻿/, '').replace(/\r\n/g, '\n');
  return crypto.createHash('sha256').update(text, 'utf8').digest('hex');
}

function build() {
  const barchaPath = path.join(PUBLIC, 'barcha.json');
  const bytes = fs.readFileSync(barchaPath);
  const bank = JSON.parse(bytes.toString('utf8').replace(/^﻿/, ''));
  const variants = fs.readdirSync(path.join(PUBLIC, 'data', 'variants'))
    .filter((n) => /^v\d+\.json$/.test(n)).length;
  const free = readJson(path.join(PUBLIC, 'free-uz-lat.json')).length;
  return {
    questions: bank.length,
    free,
    variants,
    barchaSha256: contentHash(bytes),
  };
}

module.exports = { contentHash };
if (require.main !== module) return;

function sameContent(a, b) {
  return a && b && a.barchaSha256 === b.barchaSha256 && a.questions === b.questions
    && a.free === b.free && a.variants === b.variants;
}

const next = build();
const prev = fs.existsSync(OUT) ? readJson(OUT) : null;

if (process.argv.includes('--check')) {
  if (sameContent(prev, next)) {
    console.log(`questions-version.json dolzarb (${prev.updated}, ${prev.questions} savol).`);
    process.exit(0);
  }
  console.error('questions-version.json eskirgan — `node scripts/question-tools/generate-questions-version.cjs` ni ishga tushiring.');
  process.exit(1);
}

if (sameContent(prev, next)) {
  console.log(`questions-version.json o'zgarmadi (${prev.updated}, ${prev.questions} savol).`);
  process.exit(0);
}

const updated = new Date().toLocaleDateString('sv-SE', { timeZone: 'Asia/Tashkent' });
fs.writeFileSync(OUT, JSON.stringify({ updated, ...next }, null, 2) + '\n', 'utf8');
console.log(`questions-version.json yangilandi: ${updated}, ${next.questions} savol, ${next.variants} variant, bepul ${next.free}.`);
console.log('Eslatma: ilovalarni sinxronlang — mobil: python tools/gen_data.py; kompyuter: node scripts/sync-questions-from-site.mjs');
