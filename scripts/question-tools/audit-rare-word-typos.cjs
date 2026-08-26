// ============================================================================
// audit-rare-word-typos.cjs — savol matnining o'zida (izohga bog'liq bo'lmagan
// holda) imlo xatolarini qidiradi. Tashqi lug'at ISHLATILMAYDI (texnik
// atamalar ko'pligi sababli tashqi lug'at juda ko'p soxta-musbat berardi).
// Buning o'rniga KORPUSNING O'ZI lug'at vazifasini bajaradi:
//
//   1. Butun uz_lat korpusi (63 variant, so'z takrorlanishlari bilan)
//      bo'yicha har bir so'zning necha marta uchrashi hisoblanadi.
//   2. KAM uchraydigan so'z (masalan 1-2 marta) ANIQ BIR HARFga farq
//      qiladigan KO'P uchraydigan so'zga (masalan 15+ marta) juda yaqin
//      bo'lsa — bu deyarli har doim shu keng tarqalgan so'zning yozuv
//      xatosi bilan yozilgan varianti (masalan "haydvchi" o'rniga
//      "haydovchi", yoki "avtomibil" o'rniga "avtomobil").
//
// Bu usul texnik atamalarga chidamli, chunki takrorlanuvchi texnik so'zlar
// (mototsikl, svetofor va h.k.) korpusda ko'p marta uchraydi va o'zi
// "keng tarqalgan" toifasiga tushadi — faqat haqiqatan YAGONA/KAMDAN-KAM
// uchraydigan, taniqli so'zga bir harf farqi bilan o'xshash tokenlar
// nomzod bo'ladi.
//
//   node scripts/question-tools/audit-rare-word-typos.cjs
// ============================================================================

const fs = require('fs');
const path = require('path');

const VARIANTS_DIR = path.resolve(__dirname, '..', '..', 'public', 'data', 'variants');
const RARE_MAX = 2;      // bu chastotadan kam yoki teng bo'lsa — "kam uchraydigan"
const COMMON_MIN = 15;   // bu chastotadan katta yoki teng bo'lsa — "keng tarqalgan"
const MIN_WORD_LEN = 5;  // qisqa so'zlar juda ko'p soxta-musbat beradi

function normalizeApostrophe(s) {
  return s.replace(/[‘’ʻʼ`´]/g, "'");
}

function tokenize(text) {
  const norm = normalizeApostrophe(text.toLowerCase());
  return norm.match(/[a-z']+/g) || [];
}

function levenshtein(a, b) {
  if (Math.abs(a.length - b.length) > 1) return 99;
  const dp = Array.from({ length: a.length + 1 }, () => new Array(b.length + 1).fill(0));
  for (let i = 0; i <= a.length; i++) dp[i][0] = i;
  for (let j = 0; j <= b.length; j++) dp[0][j] = j;
  for (let i = 1; i <= a.length; i++) {
    for (let j = 1; j <= b.length; j++) {
      if (a[i - 1] === b[j - 1]) dp[i][j] = dp[i - 1][j - 1];
      else dp[i][j] = 1 + Math.min(dp[i - 1][j - 1], dp[i - 1][j], dp[i][j - 1]);
    }
  }
  return dp[a.length][b.length];
}

function walkQuestions(data, cb) {
  if (Array.isArray(data)) { for (const it of data) walkQuestions(it, cb); return; }
  if (data && typeof data === 'object') {
    if (data.task_info && data.content) cb(data);
  }
}

// 1) Chastotalarni hisoblash + har bir so'z qaysi gid(lar)da uchraganini saqlash
const freq = new Map();
const wordToGids = new Map();
const files = fs.readdirSync(VARIANTS_DIR).filter((f) => f.endsWith('.json')).sort();

function addWords(text, gid) {
  for (const w of tokenize(text)) {
    freq.set(w, (freq.get(w) || 0) + 1);
    if (!wordToGids.has(w)) wordToGids.set(w, new Set());
    wordToGids.get(w).add(gid);
  }
}

for (const f of files) {
  const data = JSON.parse(fs.readFileSync(path.join(VARIANTS_DIR, f), 'utf8'));
  walkQuestions(data, (q) => {
    const gid = q.task_info.global_id;
    const c = q.content.uz_lat;
    if (!c) return;
    addWords(c.text, gid);
    for (const o of c.options) addWords(o.text, gid);
    if (q.izoh && q.izoh.uz_lat) addWords(q.izoh.uz_lat, gid);
  });
}

// 2) Kam va keng tarqalgan so'zlarni ajratish
const rareWords = [...freq.entries()].filter(([w, n]) => n <= RARE_MAX && w.length >= MIN_WORD_LEN).map(([w]) => w);
const commonWords = [...freq.entries()].filter(([w, n]) => n >= COMMON_MIN && w.length >= MIN_WORD_LEN).map(([w]) => w);

console.log(`Jami noyob so'zlar: ${freq.size} | Kam uchraydigan (<=${RARE_MAX}): ${rareWords.length} | Keng tarqalgan (>=${COMMON_MIN}): ${commonWords.length}\n`);

// 3) Har bir kam so'zni eng yaqin keng tarqalgan so'zga solishtirish
const commonByFirstLetter = new Map();
for (const w of commonWords) {
  const k = w[0];
  if (!commonByFirstLetter.has(k)) commonByFirstLetter.set(k, []);
  commonByFirstLetter.get(k).push(w);
}

const candidates = [];
for (const rare of rareWords) {
  let best = null;
  for (const key of [rare[0]]) {
    const list = commonByFirstLetter.get(key) || [];
    for (const common of list) {
      if (Math.abs(common.length - rare.length) > 1) continue;
      const d = levenshtein(rare, common);
      if (d === 1) { best = common; break; }
    }
    if (best) break;
  }
  if (best) {
    candidates.push({ rare, common: best, gids: [...wordToGids.get(rare)] });
  }
}

console.log(`Nomzodlar: ${candidates.length}\n`);
for (const c of candidates) {
  console.log(`"${c.rare}" (${freq.get(c.rare)} marta) — ehtimol "${c.common}" (${freq.get(c.common)} marta) bo'lishi kerak — ${c.gids.join(', ')}`);
}
