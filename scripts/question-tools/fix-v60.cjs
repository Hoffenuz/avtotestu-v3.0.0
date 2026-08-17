// ============================================================================
// fix-v60.cjs — v60 tekshiruvida topilgan xatolar. SAVOL DOIRASIDA ishlaydi.
//
//   node scripts/question-tools/fix-v60.cjs         # quruq yurish
//   node scripts/question-tools/fix-v60.cjs apply   # yozadi
// ============================================================================

const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.resolve(__dirname, '..', '..', 'public');
const APPLY = process.argv.includes('apply');

const FIXES = {
  t_60_q_3: [
    { lang: 'ru', bad: '1.2 (широкая пунктирная линия) в разделе 1 приложения 2 ПДД', good: '1.2 (широкая сплошная линия) в разделе 1 приложения 2 ПДД', why: 'JIDDIY XATO: uz "enli sidirg\'a chiziq" (сидирға = сплошная, uzluksiz) — ruscha tarjimada "пунктирная" (uzuq-uzuq) deb TESKARI ma\'noda yozilgan edi.' },
  ],
  t_60_q_9: [
    { lang: 'ru', bad: 'установлена ​​на одном и том же белом фоне (слева и справа)', good: 'установлена на одной и той же оси (слева и справа)', why: 'uz: "Bir oqda" ("bir o\'qda" — bitta o\'qda, ya\'ni oldindagi yoki orqadagi o\'sha bir o\'q) — ruscha tarjimada "белом фоне" (oq fon) deb mavzuga aloqasi yo\'q noto\'g\'ri so\'z yozilgan edi.' },
    { lang: 'ru', bad: 'находится впереди, а ось сзади. В этом случае', good: 'стремится вперёд, а противоположная сторона остаётся сзади. В этом случае', why: 'uz: "aks tomoni orqada qoladi" (qarama-qarshi tomon) — ruscha tarjimada "ось" (o\'q) noto\'g\'ri so\'z yozilgan edi.' },
  ],
  t_60_q_10: [
    { lang: 'ru', bad: 'Разрешаете если они обеспеченны удобными местами', good: 'Разрешается, если они обеспечены удобными местами', why: 'Grammatik xato: "Разрешаете" (siz ruxsat berasiz) o\'rniga "Разрешается" (ruxsat etiladi) bo\'lishi kerak, va "обеспеченны" so\'zida ortiqcha "н" harfi bor edi.' },
  ],
  t_60_q_16: [
    { lang: 'ru', bad: 'отделена от других полос проезжей части длинной линией, выезд на дорогу, высадка и высадка пассажиров', good: 'отделена от других полос проезжей части прерывистой линией, выезд на дорогу, посадка и высадка пассажиров', why: '"uzuq-uzuq chiziq" (прерывистая, uzuq-uzuq) — "длинной" (uzun) noto\'g\'ri tarjima; "высадка" so\'zi ikki marta takrorlangan edi, bittasi "посадка" (o\'tirish) bo\'lishi kerak.' },
  ],
  t_60_q_18: [
    { lang: 'ru', bad: 'Пересечение кольцевых линий разрешается только во время переформирования.', good: 'Пересечение прерывистых линий разрешается только при перестроении.', why: 'uz: "uzuq-uzuq chiziqlarni... qayta tizilishda" (uzuq-uzuq = прерывистые, qayta tizilish = перестроение) — "кольцевых" (halqasimon) va "во время переформирования" (grammatik jihatdan noto\'g\'ri) tuzatildi.' },
  ],
  t_60_q_20: [
    { lang: 'ru', bad: '3.2, 3.3. а по пунктам 3.4:', good: 'Согласно пунктам 3.2, 3.3 и 3.4 раздела 3 приложения 3 ПДД:', why: 'uz: "YHQ 3-ilovasi 3-bo\'limining 3.2, 3.3. va 3.4-bandlariga asosan:" — ruscha tarjimada bu manba havolasi butunlay tushib qolib, ma\'nosiz raqamlar ketma-ketligiga aylangan edi.' },
  ],
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
if (!APPLY) console.log('\nYozish uchun: node scripts/question-tools/fix-v60.cjs apply');
