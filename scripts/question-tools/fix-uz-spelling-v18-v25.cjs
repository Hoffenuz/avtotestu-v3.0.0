// ============================================================================
// fix-uz-spelling-v18-v25.cjs — v18..v25 variantlarini qo'lda o'qishda topilgan
// imlo, grammatika va tinish belgisi xatolarini BUTUN korpusga qo'llaydi.
//
// Ishlatish:
//   node scripts/question-tools/fix-uz-spelling-v18-v25.cjs         # quruq yurish
//   node scripts/question-tools/fix-uz-spelling-v18-v25.cjs apply   # yozadi
//
// BU YERGA KIRITILMAGAN (alohida qaror kerak, topilmalar faylida yozilgan):
//   - t_24_q_7: to'g'ri javob belgisi (`is_correct`) tillarda QARAMA-QARSHI
//     variantda. Matn almashtirish bilan tuzatib bo'lmaydi.
//   - t_24_q_17: ruscha 2 ta javob varianti boshqa savoldan tushib qolgan.
//   - Mazmun nomuvofiqliklari (t_20_q_3, t_22_q_16, t_22_q_20, t_24_q_10,
//     t_24_q_20, t_25_q_2, t_25_q_9) — tarjima qarori kerak.
//   - uz_cyr `автомобиль` -> `автомобил` (321x) — hajmi katta, tasdiq kerak.
//   - Rasm yorliqlari (А/Б/В vs A/B/C) — har bir savol rasmi bilan tekshiriladi.
// ============================================================================

const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.resolve(__dirname, '..', '..', 'public');
const APPLY = process.argv.includes('apply');
const APO = "['ʻʼ‘’`]";
const WORD_CHAR = "A-Za-zА-Яа-яЁёЎўҚқҒғҲҳʻʼ‘’'`";

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const apoAware = (s) => s.split(/['ʻʼ‘’`]/).map(esc).join(APO);

// --- Iboralar (aniq matn almashtirish) -------------------------------------
const PHRASE_FIXES = [
  // ===== uz_lat =====
  { bad: 'hisoplanadimi', good: 'hisoblanadimi' },
  { bad: "Avtomobilda yoqilgan sarg'ish", good: "Avtomobilda sarg'ish" },
  { bad: 'mayoqchasi yoqilgan avtomobiliga', good: 'mayoqchasi yoqilgan avtomobilga' },
  { bad: "ko'kiga - chapga", good: "ko'k avtomobilga - chapga" },
  { bad: "Qizil avtomobil qaysi yo'nalishlarda", good: "Qizil avtomobilga qaysi yo'nalishlarda" },
  { bad: 'aslahalangan holatda', good: 'yuklangan holatda' }, // FAQAT shu shakl (t_19_q_5)
  { bad: '750kg', good: '750 kg' },
  { bad: '40km/s', good: '40 km/s' },
  { bad: '1981- yilgacha', good: '1981-yilgacha' },
  { bad: "70 km/s. dan", good: "70 km/s dan" },
  { bad: 'shatakka olinuvchi transport vaznidan', good: 'shatakka olinuvchi transport vositasi vaznidan' },
  { bad: '10 -15 sm', good: '10-15 sm' },
  { bad: "oq 5.22 yoki 5.24 havorang rangli belgidan", good: "oq rangli 5.22 yoki havorang 5.24 belgidan" },
  { bad: 'harakatlani davom ettirish', good: 'harakatni davom ettirish' },
  { bad: 'Har ikkila', good: 'Har ikkala' },
  { bad: 'mamuriyati', good: "ma'muriyati" },
  { bad: "Yarim o'tkazilgan holatda", good: "Yarim o'tirgan holatda" },
  { bad: "Hech qaysi buzmad\"", good: "Hech qaysi buzmadi\"" },
  { bad: "bo'lib Qaysi avtomobil", good: "bo'lib qaysi avtomobil" },
  { bad: 'avtomobilni vazni sizning', good: 'avtomobilning vazni sizning' },
  { bad: 'Faqat 30 km. tezlikda', good: 'Faqat 30 km/soat tezlikda' },

  // ===== uz_cyr =====
  { bad: 'йўналищда', good: 'йўналишда' },
  { bad: 'автомабил', good: 'автомобил' },
  { bad: 'бэрилади', good: 'берилади' },
  { bad: 'сирпанишни бошласа ҳайдовчи', good: 'сирпанишни бошласа, ҳайдовчи' },

  // ===== ru =====
  { bad: 'Перекресток это', good: 'Перекресток — это' },
  { bad: 'или разветвление дорог', good: 'или разветвления дорог' },
  { bad: 'малого радиуса крутых спусках', good: 'малого радиуса, крутых спусках' },
  { bad: 'Только направо и налево', good: 'Только направо' },
  { bad: '40км/с', good: '40 км/ч' },
  { bad: 'фар дневное время', good: 'фар в дневное время' },
  { bad: 'Перевязать неповреждённую ногу', good: 'Перевязать повреждённую ногу' },
  { bad: 'полу сидячее', good: 'полусидячее' },
  { bad: 'Только грузовых автомобилей', good: 'Только грузовым автомобилям' },
  { bad: 'Всех автомобилей', good: 'Всем автомобилям' },
  { bad: '3,25 градусов', good: '3,25 градуса' },
  { bad: 'в жилом районе', good: 'в населённых пунктах' },
  { bad: 'чередующими полосами', good: 'чередующимися полосами' },
  { bad: 'кроме того Светоотражающими', good: 'кроме того светоотражающими' },
  { bad: 'закрытую улицу в конце дороги', good: 'тупик' },
  { bad: 'транспортных средств-20 м', good: 'транспортных средств — 20 м' },
  { bad: 'на которою', good: 'на которую' },
  { bad: 'повернуть на право', good: 'повернуть направо' },
  { bad: 'Предприятие- изготовитель', good: 'Предприятие-изготовитель' },
  { bad: 'Стоп- лини', good: 'Стоп-лини' },
  { bad: 'имеющих три полосы', good: 'имеющей три полосы' },
  { bad: '« Движение без остановки', good: '«Движение без остановки' },
  { bad: 'бъёт', good: 'бьёт' },
  { bad: 'Водителю какого автомобиля нарушил', good: 'Водитель какого автомобиля нарушил' },
  { bad: 'в ближайших дома"', good: 'в ближайших домах"' },
  { bad: 'О чем обозначает Вас вертикальная разметка', good: 'Что обозначает вертикальная разметка' },
  { bad: 'Обозначает приближении', good: 'Обозначает приближение' },
  { bad: 'B каком ответе', good: 'В каком ответе' }, // lotin B -> kirill В
];

// --- Atama birlashtirish: qatnov qismi (uz_lat da 2500x standart) ----------
const TERM_FIXES = [
  { bad: 'Harakatlanish qismining', good: 'Qatnov qismining' },
  { bad: 'harakatlanish qismining', good: 'qatnov qismining' },
  { bad: 'Harakatlanish qismida', good: 'Qatnov qismida' },
  { bad: 'harakatlanish qismida', good: 'qatnov qismida' },
  { bad: "Yo'l harakat qismining", good: "Yo'l qatnov qismining" },
];

// --- So'z o'zagi (qo'shimchali shakllar uchun) ------------------------------
const STEM_FIXES = [
  { bad: 'lat egan', good: 'lat yegan' }, // lat egan / lat eganda
];

// --- Shablonlar ------------------------------------------------------------
const REGEX_FIXES = [
  {
    id: 'ru-lotin-m',
    // ru bo'limlarida o'lchov `19,5 m` lotin `m` bilan yozilgan (24x).
    // Faqat raqamdan keyin keladigan yakka `m` almashtiriladi.
    re: /(\d,\d) m\b/g,
    to: '$1 м',
    only: 'ru',
  },
];

// ---------------------------------------------------------------------------
function collectJson(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    if (fs.statSync(p).isDirectory()) collectJson(p, out);
    else if (name.endsWith('.json')) out.push(p);
  }
  return out;
}

const files = collectJson(PUBLIC_DIR);
const counts = new Map();
const touched = [];

/** `ru` bo'limlari ichidagi matnni topish uchun oraliqlar. */
function ruSpans(text) {
  const spans = [];
  const re = /"ru"\s*:\s*\{/g;
  let m;
  while ((m = re.exec(text))) {
    let i = m.index + m[0].length - 1, depth = 0;
    for (; i < text.length; i++) {
      if (text[i] === '{') depth++;
      else if (text[i] === '}') { depth--; if (depth === 0) { i++; break; } }
    }
    spans.push([m.index, i]);
  }
  return spans;
}

for (const file of files) {
  const before = fs.readFileSync(file, 'utf8');
  let text = before;

  for (const f of [...PHRASE_FIXES, ...TERM_FIXES]) {
    const re = new RegExp(apoAware(f.bad), 'g');
    const n = (text.match(re) || []).length;
    if (n) { counts.set(f.bad, (counts.get(f.bad) || 0) + n); text = text.replace(re, f.good); }
  }

  for (const f of STEM_FIXES) {
    const re = new RegExp(`(^|\\\\[nrt]|[^${WORD_CHAR}])(${apoAware(f.bad)})`, 'g');
    let n = 0;
    text = text.replace(re, (m0, lead) => { n++; return lead + f.good; });
    if (n) counts.set(f.bad, (counts.get(f.bad) || 0) + n);
  }

  for (const f of REGEX_FIXES) {
    if (f.only === 'ru') {
      const spans = ruSpans(text);
      let out = '', last = 0, n = 0;
      for (const [s, e] of spans) {
        out += text.slice(last, s);
        const chunk = text.slice(s, e);
        n += (chunk.match(f.re) || []).length;
        out += chunk.replace(f.re, f.to);
        last = e;
      }
      out += text.slice(last);
      if (n) counts.set(f.id, (counts.get(f.id) || 0) + n);
      text = out;
    }
  }

  if (text !== before) { touched.push(path.relative(PUBLIC_DIR, file)); if (APPLY) fs.writeFileSync(file, text); }
}

const total = [...counts.values()].reduce((a, b) => a + b, 0);
console.log(APPLY ? '=== QO‘LLANDI ===' : '=== QURUQ YURISH (yozilmadi) ===');
console.log(`Fayl: ${files.length} | O'zgargan: ${touched.length} | Almashtirish: ${total}\n`);
for (const f of [...PHRASE_FIXES, ...TERM_FIXES, ...STEM_FIXES, ...REGEX_FIXES]) {
  const key = f.bad || f.id;
  const n = counts.get(key) || 0;
  console.log(`${n ? ' ' : '-'} ${String(n).padStart(4)}  ${key}  ->  ${f.good || f.to}${n ? '' : '   (TOPILMADI)'}`);
}
if (!APPLY) console.log('\nYozish uchun: node scripts/question-tools/fix-uz-spelling-v18-v25.cjs apply');
