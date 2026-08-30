// ============================================================================
// fix-v58.cjs — v58 tekshiruvida topilgan xatolar. SAVOL DOIRASIDA ishlaydi.
//
//   node scripts/question-tools/fix-v58.cjs         # quruq yurish
//   node scripts/question-tools/fix-v58.cjs apply   # yozadi
// ============================================================================

const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.resolve(__dirname, '..', '..', 'public');
const APPLY = process.argv.includes('apply');

const FIXES = {
  t_58_q_5: [
    { lang: 'ru', bad: 'Пересечение кольцевых линий допускается только в переформировании.', good: 'Пересечение прерывистых линий допускается только при перестроении.', why: 'uz: "uzuq-uzuq chiziqlarni... qayta tizilishda" (uzuq-uzuq = прерывистые, qayta tizilish = перестроение) — "кольцевых" (halqasimon) va "в переформировании" (grammatik jihatdan noto\'g\'ri) tuzatildi.' },
  ],
  t_58_q_6: [
    { lang: 'ru', bad: 'F3. Прицепы (включая полуприцепы)', good: 'Прицепы (включая полуприцепы)', why: 'uz_lat/uz_cyr variantlarida bunday "F3." prefiksi yo\'q — ortiqcha, tasodifiy qolib ketgan belgi.' },
  ],
  t_58_q_7: [
    { lang: 'ru', bad: 'прицеп может перевернуться, что приведет к выходу из строя движущегося устройства, или поезд может обрушиться.', good: 'прицеп может сместиться, что приведёт к выходу из строя буксирующего устройства, либо автопоезд может сложиться.', why: 'uz: "shatakchi moslamaning ishdan chiqishiga olib keluvchi tirkamaning SURILIB KETISHI" (siljishi, ag\'darilishi emas) va "avtopoyezdning BUKLANISHI" (складывание/jackknife, обрушение/qulash emas) — bir nechta noto\'g\'ri so\'z tanlovi tuzatildi.' },
  ],
  t_58_q_15: [
    { lang: 'ru', bad: 'Собственный. Р. ССВ, Вл. Р. МВД, Вл. Р. Верховный суд, Оз. Согласно пункту 10 ПОЛОЖЕНИЯ «О порядке определения состояния опьянения водителей транспортных средств», утвержденного совместным решением Генеральной прокуратуры Р. № 52, 74, 11-192-18, 68-кк от 20 ноября 2018 года:', good: 'Согласно пункту 10 ПОЛОЖЕНИЯ «О порядке определения состояния опьянения водителей транспортных средств», утверждённого совместным решением Министерства здравоохранения Республики Узбекистан, Министерства внутренних дел Республики Узбекистан, Верховного суда Республики Узбекистан и Генеральной прокуратуры Республики Узбекистан № 52, 74, 11-192-18, 68-кк от 20 ноября 2018 года:', why: 'JIDDIY XATO: uz manbadagi "O\'z. R." (O\'zbekiston Respublikasi) qisqartmasi mashina-tarjimada so\'zma-so\'z "Собственный" (o\'ziniki/shaxsiy) deb tarjima qilingan va tashkilot nomlari butunlay yo\'qolib, ma\'nosiz "Вл. Р. МВД, Вл. Р. Верховный суд, Оз." kabi bo\'lakларга aylangan edi.' },
    { lang: 'ru', bad: '0,135 миллиграмма. и более Сотрудник DYHXX составляет', good: '0,135 миллиграмма и более, сотрудник ГСБДД составляет', why: 'Jumla o\'rtasida ortiqcha nuqta bor edi (gap noto\'g\'ri bo\'linib qolgan) va tarjima qilinmagan lotincha "DYHXX" qisqartmasi qolib ketgan edi (korpusda barqaror "ГСБДД" atamasi bo\'lishi kerak, xuddi ilgari t_47_q_17 da topilgan xato).' },
  ],
  t_58_q_16: [
    { lang: 'ru', bad: 'за исключением обгона, опережения, поворота налево или перестановки для догона, а также остановки', good: 'за исключением объезда, обгона, поворота налево или разворота, а также остановки', why: 'uz asl matnida 4 xil holat sanaladi: aylanib o\'tish (объезд), quvib o\'tish (обгон), chapga burilish (поворот налево), qayrilib olish (разворот). Ruscha tarjimada "обгон" ikki marta sinonim bilan takrorlangan ("обгона, опережения"), "aylanib o\'tish" tushib qolgan va "qayrilib olish" (разворот) ma\'nosiz "перестановки для догона" iborasiga aylangan edi.' },
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
if (!APPLY) console.log('\nYozish uchun: node scripts/question-tools/fix-v58.cjs apply');
