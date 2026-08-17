// ============================================================================
// fix-uz-spelling-v6-v17.cjs — v6..v17 variantlarini qo'lda o'qishda topilgan
// imlo, grammatika va tinish belgisi xatolarini BUTUN korpusga qo'llaydi.
//
// Manba: scripts/question-tools/topilgan-xatolar-v6-v13.json
//
// Ishlatish:
//   node scripts/question-tools/fix-uz-spelling-v6-v17.cjs         # quruq yurish
//   node scripts/question-tools/fix-uz-spelling-v6-v17.cjs apply   # yozadi
//
// MUHIM QAROR — nima TUZATILMADI va nega:
//   `«Chapga`  (36x) — bu 3.18.2 yo'l belgisining NOMI («Chapga burilish
//                      taqiqlangan»). Belgi nomida bosh harf TO'G'RI.
//   `«Yengil`  (1x)  — 4.4 belgisining nomi, xuddi shu sabab.
//   Shuning uchun bosh harf qoidasi butun so'zga emas, faqat tekshirilgan
//   ibora ko'rinishlariga qo'llanadi.
//
//   `o'nga xalaqit berish` — bu yerda to'g'ri so'z `o'ngga` EMAS, `unga`.
//   Shuning uchun u ibora sifatida va so'z qoidasidan OLDIN tuzatiladi.
// ============================================================================

const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.resolve(__dirname, '..', '..', 'public');
const APPLY = process.argv.includes('apply');

/** Fayllarda apostrof turlicha yozilgan — hammasini qamrab olamiz. */
const APO = "['ʻʼ‘’`]";
/** So'z ichi belgilari. Kirill harflari SHART (aks holda chegara ishlamaydi). */
const WORD_CHAR = "A-Za-zА-Яа-яЁёЎўҚқҒғҲҳʻʼ‘’'`";

const esc = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
/** Iborada apostrof bo'lsa — har qanday ko'rinishiga moslashadi. */
const apoAware = (s) => s.split(/['ʻʼ‘’`]/).map(esc).join(APO);

// ---------------------------------------------------------------------------
// 1-BOSQICH: iboralar. So'z qoidalaridan OLDIN ishlaydi.
// ---------------------------------------------------------------------------
const PHRASE_FIXES = [
  // --- o'nga: bu yagona o'rinda `unga` (unga xalaqit berish) ---
  { bad: "o'nga xalaqit berish", good: 'unga xalaqit berish', why: "kontekst: haydovchiga xalaqit — `unga`, `o'ngga` emas" },

  // --- takror so'z ---
  { bad: 'piyodalarning va piyodalarning', good: 'piyodalarning', why: "so'z ikki marta yozilgan" },

  // --- kelishik / bog'lovchi ---
  { bad: 'korxona tomondan', good: 'korxona tomonidan', why: "to'g'ri shakl: tomonidan" },
  { bad: 'zarar etishiga', good: 'zarar yetishiga', why: "`yetmoq` o'zagi" },

  // --- tinish belgilari ---
  { bad: 'maysazor ariq maxsus', good: 'maysazor, ariq, maxsus', why: 'sanashda vergul yo‘q' },
  { bad: '«Xavf»atamasining', good: '«Xavf» atamasining', why: "qo'shtirnoqdan keyin probel yo'q" },
  { bad: 'tashkiliy - texnikaviy', good: 'tashkiliy-texnikaviy', why: "qo'shma so'zda ortiqcha probel" },
  { bad: "bo'lsa; haydovchi", good: "bo'lsa, haydovchi", why: 'nuqtali vergul o‘rniga vergul' },

  // --- ortiqcha so'z ---
  { bad: "Bu yo'l chizig'i quyidagi maqsadni:", good: "Bu yo'l chizig'i:", why: 'gap tuzilishi buzuq edi' },

  // --- gap o'rtasidagi bosh harf (FAQAT tekshirilgan iboralarda) ---
  { bad: 'Faqat Yengil', good: 'Faqat yengil', why: "gap o'rtasi" },
  { bad: ', Yengil', good: ', yengil', why: "gap o'rtasi" },
  { bad: 'va Yengil', good: 'va yengil', why: "gap o'rtasi" },
  { bad: "yo'nalishsiz Yengil", good: "yo'nalishsiz yengil", why: "gap o'rtasi" },
  { bad: 'olingan Yengil', good: 'olingan yengil', why: "gap o'rtasi" },
  { bad: 'Faqat Chapga', good: 'Faqat chapga', why: "gap o'rtasi" },
  { bad: 'Qaysi Javobda', good: 'Qaysi javobda', why: "gap o'rtasi" },

  // --- KIRILL: iboralar ---
  { bad: '(ўнга халақит бериш)', good: '(унга халақит бериш)', why: 'kontekst: unga' },
  { bad: 'пиёдаларнинг ва пиёдаларнинг', good: 'пиёдаларнинг', why: "so'z ikki marta" },
  { bad: 'корхона томондан', good: 'корхона томонидан', why: "to'g'ri shakl" },
  { bad: 'майсазор ариқ махсус', good: 'майсазор, ариқ, махсус', why: 'vergul yo‘q' },
  { bad: '«Хавф»атамасининг', good: '«Хавф» атамасининг', why: 'probel yo‘q' },
  { bad: 'ташкилий - техникавий', good: 'ташкилий-техникавий', why: 'ortiqcha probel' },
  { bad: 'бўлса; ҳайдовчи', good: 'бўлса, ҳайдовчи', why: 'nuqtali vergul' },

  // --- RUS TILI ---
  { bad: 'Каким транспортным средством разрешено', good: 'Каким транспортным средствам разрешено', why: "ko'plik kelishigi" },
  { bad: 'автомобилю на право', good: 'автомобилю направо', why: 'ravish qo‘shib yoziladi' },
  { bad: 'на все направления', good: 'во всех направлениях', why: 'kelishik xato' },
  // `возраста в кабине` QO'LLANMADI: bu ibora korpusda umuman uchramaydi
  // (`в кабине` bor, lekin boshqa gaplarda). Taxmin bilan vergul qo'yilmaydi.
].filter((f) => !f.skip);

// ---------------------------------------------------------------------------
// 2-BOSQICH: yakka so'zlar (chegara tekshiruvi bilan)
// ---------------------------------------------------------------------------
const WORD_FIXES = [
  // --- LOTIN ---
  { bad: "o'nga", good: "o'ngga", apo: true, why: "yo'nalish: o'ngga (o'ng + ga)" },
  { bad: 'tarifni', good: "ta'rifni", why: "atama TA'RIFI (tarif-narx emas)" },
  { bad: 'tarifi', good: "ta'rifi", why: "atama TA'RIFI" },
  { bad: 'etmagan', good: 'yetmagan', why: "12 yoshga YETMAGAN" },
  { bad: 'xafvsizligi', good: 'xavfsizligi', why: 'harflar almashgan' },
  { bad: 'harakterlanadi', good: 'xarakterlanadi', why: 'h -> x' },
  { bad: 'tratuar', good: 'trotuar', stem: true, why: 'a -> o (korpusda faqat `tratuarda`)' },
  { bad: 'taniqlilik', good: 'taniqlik', why: "ortiqcha 'li'" },
  { bad: 'Velosipedchilarda', good: 'Velosipedchilarga', why: "jo'nalish kelishigi kerak" },
  { bad: 'atrof-muxit', good: 'atrof-muhit', stem: true, why: 'x -> h (korpusda `atrof-muxitni`)' },
  { bad: 'uxshaydi', good: "o'xshaydi", why: "u -> o'" },
  { bad: 'diaganal', good: 'diagonal', why: 'a -> o' },
  { bad: 'tamirlangan', good: "ta'mirlangan", why: 'apostrof tushib qolgan' },
  { bad: 'etiborga', good: "e'tiborga", why: 'apostrof tushib qolgan' },
  { bad: 'taaduqlidir', good: 'taalluqlidir', why: "'ll' tushib qolgan" },

  // --- KIRILL ---
  { bad: 'ўнга', good: 'ўнгга', why: "yo'nalish: ўнгга" },
  { bad: 'тарифни', good: 'таърифни', why: 'таъриф (atama)' },
  { bad: 'хафвсизлиги', good: 'хавфсизлиги', why: 'harflar almashgan' },
  { bad: 'ҳарактерланади', good: 'характерланади', why: 'ҳ -> х' },
  { bad: 'тратуар', good: 'тротуар', stem: true, why: 'а -> о (korpusda `тратуарда`)' },
  { bad: 'таниқлилик', good: 'таниқлик', why: 'ortiqcha ли' },
  { bad: 'Велосипедчиларда', good: 'Велосипедчиларга', why: "jo'nalish kelishigi" },
  { bad: 'атроф-мухит', good: 'атроф-муҳит', stem: true, why: 'х -> ҳ (korpusda `атроф-мухитни`)' },
  { bad: 'ухшайди', good: 'ўхшайди', why: 'у -> ў' },
  { bad: 'диаганал', good: 'диагонал', why: 'а -> о' },
  { bad: 'таадуқлидир', good: 'тааллуқлидир', why: 'лл tushib qolgan' },
];

// ---------------------------------------------------------------------------
// 3-BOSQICH: shablonlar
// ---------------------------------------------------------------------------
const REGEX_FIXES = [
  {
    id: 't-nuqta',
    // `\b` ishlatilmaydi: korpusda `3,5 t. dan` bilan birga probelsiz
    // `3,5t. dan` ham bor — u yerda `5` va `t` orasida chegara YO'Q va
    // `\bt` hech qachon mos kelmasdi (14 tadan 4 tasi tushib qolardi).
    re: /([\d\s])t\.\s+dan/g,
    to: '$1t dan',
    why: "qisqartmadan keyin nuqta shart emas (korpusda 134x nuqtasiz)",
  },
  {
    id: 't-nuqta-kirill',
    // JS dagi `\b` KIRILLDA ISHLAMAYDI — kirill harflari `\w` ga kirmaydi,
    // shuning uchun chegara har doim noto'g'ri hisoblanadi va 14 ta uchrash
    // topilmay qolardi. Chegara o'rniga nuqta+probelning o'zi ushlanadi
    // (korpusda `3,5 т. дан` ham, probelsiz `3,5т. дан` ham bor).
    re: /т\.\s+дан/g,
    to: 'т дан',
    why: 'qisqartmadan keyin nuqta shart emas (14x)',
  },
  {
    // FAQAT o'lchov birligi oldidan. `3.18.2` kabi BELGI RAQAMLARI tegilmaydi.
    id: 'onlik-vergul',
    re: /(\d)\.(\d)(?=\s*(?:metr|метр|km|км|m\b|м\b|t\b|т\b))/g,
    to: '$1,$2',
    why: "o'zbek va rus tilida o'nlik ajratgich — VERGUL (korpusda 376x)",
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

/** Bir xil apostrof ko'rinishini saqlab almashtirish uchun. */
function buildWordPattern(fix) {
  const body = fix.apo ? apoAware(fix.bad) : esc(fix.bad);
  /**
   * `stem: true` — so'z BOSHIDAN mos keladi, oxiri ochiq.
   * Kerak, chunki bu so'zlar korpusda faqat qo'shimcha bilan uchraydi:
   * `tratuarda`, `atrof-muxitni`, `тратуарда`, `атроф-мухитни`.
   * O'ng chegara qo'yilsa ular UMUMAN topilmaydi.
   */
  if (fix.stem) {
    return new RegExp(`(^|\\\\[nrt]|[^${WORD_CHAR}])(${body})`, 'g');
  }
  return new RegExp(`(^|\\\\[nrt]|[^${WORD_CHAR}])(${body})(?![${WORD_CHAR}])`, 'g');
}

const files = collectJson(PUBLIC_DIR);
const counts = new Map();
const touchedFiles = [];

for (const file of files) {
  const before = fs.readFileSync(file, 'utf8');
  let text = before;

  for (const fix of PHRASE_FIXES) {
    const re = new RegExp(apoAware(fix.bad), 'g');
    const n = (text.match(re) || []).length;
    if (n) {
      counts.set(fix.bad, (counts.get(fix.bad) || 0) + n);
      text = text.replace(re, fix.good);
    }
  }

  for (const fix of WORD_FIXES) {
    const re = buildWordPattern(fix);
    let n = 0;
    text = text.replace(re, (m, lead, word) => {
      n += 1;
      // Bosh harfni saqlaymiz: `O'nga` -> `O'ngga`
      const isUpper = word[0] === word[0].toUpperCase() && word[0] !== word[0].toLowerCase();
      const good = isUpper ? fix.good[0].toUpperCase() + fix.good.slice(1) : fix.good;
      return lead + good;
    });
    if (n) counts.set(fix.bad, (counts.get(fix.bad) || 0) + n);
  }

  for (const fix of REGEX_FIXES) {
    const n = (text.match(fix.re) || []).length;
    if (n) {
      counts.set(fix.id, (counts.get(fix.id) || 0) + n);
      text = text.replace(fix.re, fix.to);
    }
  }

  if (text !== before) {
    touchedFiles.push(path.relative(PUBLIC_DIR, file));
    if (APPLY) fs.writeFileSync(file, text);
  }
}

const total = [...counts.values()].reduce((a, b) => a + b, 0);
console.log(APPLY ? '=== QO‘LLANDI ===' : '=== QURUQ YURISH (yozilmadi) ===');
console.log(`Tekshirilgan fayl: ${files.length}`);
console.log(`O'zgargan fayl:    ${touchedFiles.length}`);
console.log(`Jami almashtirish: ${total}\n`);

const all = [...PHRASE_FIXES.map((f) => [f.bad, f.good, f.why]),
             ...WORD_FIXES.map((f) => [f.bad, f.good, f.why]),
             ...REGEX_FIXES.map((f) => [f.id, f.to, f.why])];
for (const [key, good, why] of all) {
  const n = counts.get(key) || 0;
  const mark = n ? ' ' : '-';
  console.log(`${mark} ${String(n).padStart(4)}  ${key}  ->  ${good}${n ? '' : '   (topilmadi)'}`);
  if (!n) continue;
  void why;
}

if (!APPLY) console.log("\nYozish uchun: node scripts/question-tools/fix-uz-spelling-v6-v17.cjs apply");
