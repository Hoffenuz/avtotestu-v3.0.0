// ============================================================================
// fix-v55.cjs — v55 tekshiruvida topilgan xatolar. SAVOL DOIRASIDA ishlaydi.
//
// DIQQAT — t_55_q_14 dagi tuzatish IDEMPOTENT EMAS: placeholder-almashtirish
// (3 bosqichli matn svopi) qayta ishga tushirilsa NATIJANI ORQAGA QAYTARADI.
// Faqat BIR MARTA qo'llang.
//
//   node scripts/question-tools/fix-v55.cjs         # quruq yurish
//   node scripts/question-tools/fix-v55.cjs apply   # yozadi (FAQAT BIR MARTA!)
// ============================================================================

const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.resolve(__dirname, '..', '..', 'public');
const APPLY = process.argv.includes('apply');

const FIXES = {
  t_55_q_2: [
    { lang: 'uz_lat', bad: 'X-Simon qizil ishorali', good: "X shaklidagi qizil ishorali", why: '"X-Simon" — buzilgan matn, xuddi ilgari topilgan "Т-Саймон"→"Т-образном" xatosi bilan bir xil toifadan ("shaklidagi" so\'zining buzilishi).' },
    { lang: 'uz_cyr', bad: 'Х-Симон қизил ишорали', good: 'Х шаклидаги қизил ишорали', why: '"Х-Симон" — бузилган матн, худди илгари топилган "Т-Саймон"→"Т-образном" хатоси билан бир хил тоифадан.' },
    { lang: 'ru', bad: 'красно- и зелено-сигнальный реверсивный светофор X-Simon в виде движения вниз применяется для регулирования движения транспортных средств по полосам, где направление движения может быть изменено в противоположном направлении.', good: 'для регулирования движения транспортных средств по полосам, на которых направление движения может быть изменено на противоположное, применяются реверсивные светофоры с красным сигналом в виде буквы «X» и зелёным сигналом в виде стрелки, направленной вниз.', why: '"X-Simon" buzilgan matnning so\'zma-so\'z (tarjima qilinmagan) nusxasi edi — to\'g\'ri ma\'nosi "X shaklidagi" (X-образный).' },
  ],
  t_55_q_8: [
    { lang: 'ru', bad: 'Согласно пункту 2 статьи 19 статьи 121 ПДД', good: 'Согласно абзацу 2 пункта 121 главы 19 ПДД', why: 'uz: "19-bo\'limi 121-bandi 2-xatboshiga" (19-bo\'lim, 121-band, 2-xatboshi) — ruscha tarjimada "статьи" so\'zi ikki marta noto\'g\'ri takrorlangan va raqamlar tartibi buzilgan edi.' },
  ],
  t_55_q_9: [
    { lang: 'ru', bad: 'а также транспортному средству (транспортным средствам), за которыми они наблюдают с включенными фарами.', good: 'а также транспортному средству (транспортным средствам), находящемуся под их сопровождением, с включёнными фарами ближнего света.', why: 'uz: "ularning kuzatuvidagi" — bu "ular kuzatib turgan (watching)" emas, balki "ular hamrohlik qilayotgan/eskort qilayotgan (under escort)" degan ma\'noni bildiradi (xuddi ilgari t_48_q_8 da topilgan xato).' },
  ],
  t_55_q_10: [
    { lang: 'ru', bad: '4. Командные знаки; 5.', good: '4. Предписывающие знаки; 5.', why: 'Shu savolning o\'z javob variantlarida barqaror "предписывающие" atamasi ishlatiladi, lekin izohda boshqa so\'z "Командные" (buyruq beruvchi) yozilgan edi — atama nomuvofiqligi.' },
  ],
  t_55_q_13: [
    { lang: 'ru', bad: 'линия подъезда – кольцевая линия, длина каждой линии в три раза превышает расстояние между ними', good: 'линия приближения – прерывистая линия, длина штриха которой в три раза превышает промежуток между штрихами', why: 'uz: "uzuq-uzuq chiziq" (prерывистая, uzuq-uzuq) — "кольцевая" (halqasimon) noto\'g\'ri tarjima, xuddi ilgari t_47_q_16 da topilgan xato bilan bir xil.' },
  ],
  t_55_q_14: [
    // Placeholder orqali xavfsiz almashtirish (JSON formatlashga bog'liq
    // bo'lmagan holda, faqat MAZMUN bo'yicha) — ru variantlarning matni
    // is_correct bayrog'iga mos kelmas edi: uz da "tormozlamasdan" (to'g'ri)
    // deb belgilangan variant ruscha "Затормозить" (tormozlab) matni bilan
    // TRUE deb ko'rsatilgan edi — bu izohning o'zi ("не нажимая на рычаг
    // тормоза") bilan ham ziddiyatli edi.
    { lang: 'ru', bad: 'Не прибегая к торможению, плавно направить автомобиль на проезжую часть', good: '__SWAP_PLACEHOLDER__', why: '1-qadam: joy bo\'shatish.' },
    { lang: 'ru', bad: 'Затормозить и плавно направить автомобиль на проезжую часть', good: 'Не прибегая к торможению, плавно направить автомобиль на проезжую часть', why: 'is_correct bayrog\'iga tegilmadi (qoida bo\'yicha), variant matnlari almashtirildi — to\'g\'ri javob endi uz bilan mos ("tormozlamasdan").' },
    { lang: 'ru', bad: '__SWAP_PLACEHOLDER__', good: 'Затормозить и плавно направить автомобиль на проезжую часть', why: '2-qadam: placeholder\'ni yakuniy matn bilan almashtirish.' },
  ],
  t_55_q_20: [
    { lang: 'ru', bad: 'пунктом 46 Кодекса подача сигнала', good: 'пунктом 46 ПДД подача сигнала', why: 'Tizimli xato: "ПДД" o\'rniga mavjud bo\'lmagan "Кодекса" (kodeks) ishlatilgan edi.' },
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
if (!APPLY) console.log('\nYozish uchun: node scripts/question-tools/fix-v55.cjs apply');
