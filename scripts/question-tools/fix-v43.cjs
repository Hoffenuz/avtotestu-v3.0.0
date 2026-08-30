// ============================================================================
// fix-v43.cjs — v43 tekshiruvida topilgan xatolar. Eng jiddiyi: t_43_q_20 da
// ruscha variantlar matni to'g'ri tarjima qilingan, lekin is_correct
// bayroqlari eskicha joyda qolib ketgan — natijada "faqat sirpanchiqda"
// (to'g'ri javob, uz bilan mos) FALSE, "barcha hollarda" (noto'g'ri) esa
// TRUE deb belgilangan edi. SAVOL DOIRASIDA ishlaydi.
//
// DIQQAT — IDEMPOTENT EMAS: t_43_q_20 dagi placeholder-almashtirish (3
// bosqichli matn svopi) qayta ishga tushirilsa NATIJANI ORQAGA QAYTARADI
// (svopni yana bir marta bajaradi). 2026-08-17 da BIR MARTA qo'llanildi va
// natija tekshirildi (v43/barcha/barcha-ru/mavzuli2-24 — barchasi to'g'ri).
// QAYTA `apply` BILAN ISHGA TUSHIRMANG — agar kerak bo'lsa avval joriy
// holatni public/data/variants/v43.json dan qo'lda tekshiring.
//
//   node scripts/question-tools/fix-v43.cjs         # quruq yurish
//   node scripts/question-tools/fix-v43.cjs apply   # yozadi (FAQAT BIR MARTA!)
// ============================================================================

const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.resolve(__dirname, '..', '..', 'public');
const APPLY = process.argv.includes('apply');

const BRAKE_FIX = { lang: 'ru', bad: 'с тормозной системой, неисправным рулевым управлением', good: 'с неисправной тормозной системой, неисправным рулевым управлением', why: 'uz: "tormoz tizimi... ishlamayotgan" — "неисправной" so\'zi tushib qolgan edi.' };
const REF_FIX = { lang: 'ru', bad: 'Согласно третьему пункту главы 12 ПДД 2:', good: 'Согласно третьему абзацу пункта 12 главы 2 ПДД:', why: 'uz: "YHQ 2-bobi 12-bandining uchinchi xatboshisiga asosan" — band/bob tartibi buzilgan edi.' };
const TOW_IZOH_FIX = { lang: 'ru', bad: 'запрещается выезжать за ограждение в следующих случаях: на гибкой соединителе, когда дорога скользкая.', good: 'запрещается буксировка на гибкой сцепке в следующих случаях: когда дорога скользкая.', why: 'uz: "shatakka olish... taqiqlanadi: ... egiluvchan ulagichda" (shatakka olish = buksirovka) — "выезжать за ограждение" (to\'siqdan chiqib ketish) mavzuga aloqasi yo\'q noto\'g\'ri tarjima.' };

const FIXES = {
  t_43_q_9: [{ lang: 'ru', bad: 'является знаком «Место поворота» и поворот налево запрещен.', good: 'является знаком «Место разворота», и поворот налево запрещён.', why: 'uz: "Qayrilish joyi" (5.11.1) = разворот (U-burilish joyi), "поворота" (burilish, umumiy) emas.' }],
  t_22_q_10: [REF_FIX, BRAKE_FIX],
  t_43_q_13: [
    REF_FIX,
    BRAKE_FIX,
    { lang: 'ru', bad: 'не горят или не горят передние фонари и задние габаритные огни', good: 'отсутствуют или не горят передние фонари и задние габаритные огни', why: 'uz: "old chiroqlar... bo\'lmagan yoki yonmayotgan" (yo\'q yoki yonmayotgan) — "не горят" ikki marta takrorlangan edi.' },
  ],
  t_43_q_20: [
    // Placeholder orqali xavfsiz almashtirish (JSON formatlashga bog'liq
    // bo'lmagan holda, faqat MAZMUN bo'yicha) — ikkala variantning matni
    // o'zaro almashtiriladi, is_correct bayroqlariga tegilmaydi.
    { lang: 'ru', bad: 'Во всех перечисленных случаях', good: '__SWAP_PLACEHOLDER__', why: '1-qadam: joy bo\'shatish.' },
    { lang: 'ru', bad: 'Только на скользкой дороге', good: 'Во всех перечисленных случаях', why: 'is_correct bayrog\'iga tegilmadi (qoida bo\'yicha), variant matnlari almashtirildi.' },
    { lang: 'ru', bad: '__SWAP_PLACEHOLDER__', good: 'Только на скользкой дороге', why: '2-qadam: placeholder\'ni yakuniy matn bilan almashtirish.' },
    TOW_IZOH_FIX,
  ],
  t_32_q_14: [TOW_IZOH_FIX],
};

function collectJson(dir, out = []) {
  for (const n of fs.readdirSync(dir)) {
    const p = path.join(dir, n);
    if (fs.statSync(p).isDirectory()) collectJson(p, out);
    else if (n.endsWith('.json')) out.push(p);
  }
  return out;
}

const counts = new Map();
const touched = [];

function questionSpans(text) {
  const spans = [];
  const re = /"global_id"\s*:\s*"([^"]+)"/g;
  let m;
  const marks = [];
  while ((m = re.exec(text))) marks.push({ gid: m[1], at: m.index });
  for (let i = 0; i < marks.length; i++) {
    spans.push({ gid: marks[i].gid, start: marks[i].at, end: i + 1 < marks.length ? marks[i + 1].at : text.length });
  }
  return spans;
}

for (const file of collectJson(PUBLIC_DIR)) {
  const before = fs.readFileSync(file, 'utf8');
  let text = before;

  const spans = questionSpans(text).filter((s) => FIXES[s.gid]).reverse();
  for (const s of spans) {
    let chunk = text.slice(s.start, s.end);
    let n = 0;
    for (const f of FIXES[s.gid]) {
      if (!chunk.includes(f.bad)) continue;
      n += chunk.split(f.bad).length - 1;
      chunk = chunk.split(f.bad).join(f.good);
    }
    if (n) {
      counts.set(s.gid, (counts.get(s.gid) || 0) + n);
      text = text.slice(0, s.start) + chunk + text.slice(s.end);
    }
  }

  if (text !== before) {
    touched.push(path.relative(PUBLIC_DIR, file));
    if (APPLY) fs.writeFileSync(file, text);
  }
}

const total = [...counts.values()].reduce((a, b) => a + b, 0);
console.log(APPLY ? '=== QO\'LLANDI ===' : '=== QURUQ YURISH ===');
console.log(`O'zgargan fayl: ${touched.length} | Almashtirish: ${total}\n`);
for (const gid of Object.keys(FIXES)) {
  const n = counts.get(gid) || 0;
  console.log(`${n ? ' ' : '-'} ${String(n).padStart(3)}  ${gid}${n ? '' : '   (TOPILMADI)'}`);
}
if (!APPLY) console.log('\nYozish uchun: node scripts/question-tools/fix-v43.cjs apply');
