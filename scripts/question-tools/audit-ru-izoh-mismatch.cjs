// ============================================================================
// audit-ru-izoh-mismatch.cjs — ruscha "is_correct" bayrog'i o'sha savolning
// o'z ruscha izohiga zid bo'lgan nomzodlarni topadi (t_46_q_6 / t_46_q_13 da
// topilgan naqsh: variantlar tartibi uz/ru o'rtasida farq qilib, is_correct
// noto'g'ri content'ga qolib ketgan holatlar).
//
// Faqat KANDIDATLARNI ro'yxatlaydi — hech narsani o'zgartirmaydi. Har bir
// natija QO'LDA tekshirilishi kerak (heuristika soxta-musbat berishi mumkin).
//
//   node scripts/question-tools/audit-ru-izoh-mismatch.cjs
// ============================================================================

const fs = require('fs');
const path = require('path');

const VARIANTS_DIR = path.resolve(__dirname, '..', '..', 'public', 'data', 'variants');

const STOP = new Set([
  'что', 'это', 'или', 'если', 'для', 'при', 'как', 'его', 'она', 'они', 'которые', 'который',
  'которых', 'также', 'быть', 'есть', 'может', 'может', 'должен', 'должны', 'более', 'менее',
  'только', 'между', 'после', 'перед', 'через', 'согласно', 'статье', 'статьи', 'главы', 'главе',
  'пункта', 'пункту', 'пункте', 'правил', 'правилам', 'правила', 'дорожного', 'движения',
  'транспортных', 'средств', 'средства', 'транспортного', 'средству',
]);

function tokens(s) {
  return (s.toLowerCase().match(/[а-яё]{4,}/g) || []).filter((w) => !STOP.has(w));
}

function score(izohTokens, optText) {
  const set = new Set(izohTokens);
  const opt = tokens(optText);
  let hit = 0;
  const seen = new Set();
  for (const t of opt) {
    if (set.has(t) && !seen.has(t)) { hit++; seen.add(t); }
  }
  return { hit, optLen: opt.length };
}

// "Hammasi to'g'ri" / "yuqoridagilarning barchasi" turidagi umumlashtiruvchi
// javoblar — bular izoh bilan tabiiy ravishda kam so'z mos kelishi mumkin,
// chunki izoh har bir alohida holatni sanab o'tadi. Bu haqiqiy xato emas.
const CATCH_ALL_RE = /(во\s+всех|все\s+(вышеперечисленн|перечисленн|выше\s*указанн|ответы)|всё\s+вышеперечислен|выполнить\s+все|запрещаются\s+оба|всем\s+вышеперечислен|оба\s+ответа|оба\s+сигнала|обоих\s+перечисленн|со\s+всеми\s+перечисленн|всеми\s+перечисленн|при\s+всех\s+перечисленн)/i;

function walkQuestions(data, cb) {
  if (Array.isArray(data)) { for (const it of data) walkQuestions(it, cb); return; }
  if (data && typeof data === 'object') {
    if (data.task_info && data.content && data.content.ru) cb(data);
  }
}

const candidates = [];
const files = fs.readdirSync(VARIANTS_DIR).filter((f) => f.endsWith('.json')).sort();

for (const f of files) {
  const full = path.join(VARIANTS_DIR, f);
  let data;
  try { data = JSON.parse(fs.readFileSync(full, 'utf8')); } catch { continue; }
  walkQuestions(data, (q) => {
    const gid = q.task_info.global_id;
    const ru = q.content.ru;
    const izohRu = q.izoh && q.izoh.ru;
    if (!ru || !ru.options || !izohRu) return;
    const izohTokens = tokens(izohRu);
    if (izohTokens.length < 3) return;

    const scored = ru.options.map((o) => ({ ...score(izohTokens, o.text), text: o.text, is_correct: !!o.is_correct }));
    const flagged = scored.find((s) => s.is_correct);
    if (!flagged) return;
    if (CATCH_ALL_RE.test(flagged.text)) return;
    const best = scored.reduce((a, b) => (b.hit > a.hit ? b : a), scored[0]);

    if (best.text !== flagged.text && best.hit >= flagged.hit + 2 && best.hit >= 3) {
      candidates.push({
        gid,
        file: f,
        flaggedText: flagged.text,
        flaggedHit: flagged.hit,
        bestText: best.text,
        bestHit: best.hit,
        izohRu,
      });
    }
  });
}

console.log(`Fayllar skanerlandi: ${files.length}`);
console.log(`Nomzodlar topildi: ${candidates.length}\n`);
for (const c of candidates) {
  console.log(`--- ${c.gid} (${c.file}) ---`);
  console.log(`  Hozir "to'g'ri" deb belgilangan (mos so'z: ${c.flaggedHit}): ${c.flaggedText}`);
  console.log(`  Izohga eng mos variant (mos so'z: ${c.bestHit}): ${c.bestText}`);
  console.log(`  Izoh: ${c.izohRu}`);
  console.log('');
}
