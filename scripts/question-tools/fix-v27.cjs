// ============================================================================
// fix-v27.cjs — v27 xatolari. SAVOL DOIRASIDA ishlaydi (global emas!).
//
// NEGA SAVOL DOIRASIDA:
//   t_27_q_13 va t_27_q_18 dagi noto'g'ri ruscha matn t_60_q_13 / t_60_q_18
//   da ham uchraydi — LEKIN u yerda TO'G'RI (t_60 savollarining o'zbekchasi
//   boshqa va ruschasi unga mos). Global almashtirish t_60 ni BUZARDI.
//   Shuning uchun almashtirish faqat `global_id` mos kelgan savol ichida
//   bajariladi.
//
//   node scripts/question-tools/fix-v27.cjs         # quruq yurish
//   node scripts/question-tools/fix-v27.cjs apply   # yozadi
// ============================================================================

const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.resolve(__dirname, '..', '..', 'public');
const APPLY = process.argv.includes('apply');

/** gid -> [{lang, bad, good, why}] */
const FIXES = {
  t_27_q_1: [{
    lang: 'ru',
    bad: 'Масса снаряженного транспортного средства с грузом, водителем и пассажирами, установленная предприятием-изготовителем в качестве максимально допустимой',
    good: 'Если конструкция жесткой сцепки обеспечивает следование буксируемого транспортного средства по траектории буксирующего',
    why: "Ruscha TO'G'RI javob o'rnida butunlay boshqa savolning matni (`ruxsat etilgan to'la vazn` ta'rifi) turgan edi. uz: `Qattiq ulagichning tuzilishi ... izidan harakatlanishini ta'minlaganda`.",
  }],
  t_27_q_7: [{
    lang: 'ru',
    bad: 'Общеизвестные знаки',
    good: 'Опознавательный и номерной знаки',
    why: "uz: `Taniqlik va raqam belgilari`. `Общеизвестные` (mashhur) — noto'g'ri tarjima.",
  }],
  t_27_q_13: [{
    lang: 'ru',
    bad: 'Продолжать движение по основной полосе, если за ним нет других транспортных средств',
    good: 'Остановиться, не меняя полосы движения, и включить аварийную световую сигнализацию',
    why: "uz: `Harakat bo'lagini o'zgartirmasdan to'xtashi va majburiy to'xtash chiroqlarini yoqishi`. DIQQAT: eski matn t_60_q_13 da TO'G'RI — u yerga tegilmaydi.",
  }],
  t_27_q_14: [{
    lang: 'ru',
    bad: 'Автомобили проедут перекрёсток в следующем порядке:',
    good: 'Красный автомобиль проедет перекрёсток:',
    why: "uz: `Qizil avtomobil chorrahani kesib o'tadi:`. Javoblar (`Первым`/`Вторым`) bitta avtomobil haqida, tartib haqida emas.",
  }],
  t_27_q_18: [{
    lang: 'ru',
    bad: 'Как должно осуществляется движения транспортных средств на дорогах проезжая часть которых разделена на полосы линиями разметки?',
    good: 'Каким транспортным средствам разрешено движение?',
    why: "uz: `Qaysi transport vositalariga harakatlanish ruxsat etiladi?`. Eski matn t_60_q_18 ga tegishli va u yerda TO'G'RI — tegilmaydi.",
  }],
  t_27_q_19: [{
    lang: 'uz_lat',
    bad: "yetarli ko'rinmaslik sharoitida yo'lning yoritilmagan qismida to'xtagan yoki to'xtab turgan mexanik transport vositasining haydovchisi bajarishi kerak",
    good: "Yetarli ko'rinmaslik sharoitida yo'lning yoritilmagan qismida to'xtagan yoki to'xtab turgan mexanik transport vositasining haydovchisi bajarishi kerak:",
    why: 'Gap kichik harf bilan boshlangan va oxirida ikki nuqta yo\'q edi.',
  }],
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

/**
 * Savolning XOM MATNDAGI chegarasini topadi: `"global_id": "<gid>"` dan
 * boshlab keyingi `"global_id"` gacha (yoki fayl oxirigacha).
 *
 * NEGA XOM MATN: JSON.parse + stringify butun faylni qayta formatlab,
 * 106 ta faylda ulkan diff hosil qilardi. Bu yerda faqat kerakli
 * bo'lakning ichidagi satr almashtiriladi — formatlash, CRLF, bo'shliqlar
 * va kalitlar tartibi bayt darajasida saqlanadi.
 */
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

  // Oxiridan boshiga qarab yuramiz — indekslar siljib ketmasin.
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
console.log(APPLY ? '=== QO‘LLANDI ===' : '=== QURUQ YURISH ===');
console.log(`O'zgargan fayl: ${touched.length} | Almashtirish: ${total}\n`);
for (const gid of Object.keys(FIXES)) {
  const n = counts.get(gid) || 0;
  console.log(`${n ? ' ' : '-'} ${String(n).padStart(3)}  ${gid}${n ? '' : '   (TOPILMADI)'}`);
}
if (!APPLY) console.log('\nYozish uchun: node scripts/question-tools/fix-v27.cjs apply');
