#!/usr/bin/env node
/**
 * Bir xil `global_id` li savolni BARCHA fayllarda bir xil qiladi.
 *
 * MUAMMO: har bir savol 6-9 ta faylda takrorlanadi (free-*, barcha-*,
 * data/variants/*, mavzuli2/*, 600.json, barcha.json). Vaqt o'tishi bilan
 * nusxalar bir-biridan uzoqlashgan — ba'zi joyda matn kesilgan, ba'zi joyda
 * boshqa til matni tushib qolgan.
 *
 * NEGA QAYTA SERIALIZATSIYA QILINMAYDI:
 * `JSON.parse` + `JSON.stringify` fayl formatini o'zgartiradi (chekinish,
 * unicode escape lar). Buning o'rniga XOM MATNDA, aniq savol va aniq TIL
 * blokiga chegaralangan holda almashtiramiz — fayl baytma-bayt saqlanadi.
 *
 * XAVFSIZLIK: almashtirish faqat kerakli savolning kerakli til bloki ichida
 * bajariladi. Bu muhim — masalan `Прекратить дальнейшее движение` satri
 * t_1_q_2 da TO'G'RI ishlatilgan, global almashtirish uni buzardi.
 *
 * Ishlatish:
 *   node scripts/question-tools/sync-questions-across-files.cjs        # ko'rish
 *   node scripts/question-tools/sync-questions-across-files.cjs apply  # yozish
 */

const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.resolve(__dirname, '..', '..', 'public');
const APPLY = process.argv.includes('apply');
const LANGS = ['uz_lat', 'uz_cyr', 'ru'];

/**
 * Sinxronlashda ETALON sifatida ishlatiladigan fayl.
 *
 * Har bir yozuv qo'lda tekshirilgan: uch tildagi matn yonma-yon qo'yilib,
 * qaysi nusxa to'g'ri ekani aniqlangan.
 */
const CANONICAL = [
  // Savol matni `barcha-ru.json` da KESILGAN ("...в указанной" — davomi yo'q)
  { gid: 't_58_q_11', lang: 'ru',     from: 'data/variants/v58.json', why: 'barcha da matn kesilgan' },
  // `Курсатилган` -> `Кўрсатилган`
  { gid: 't_58_q_11', lang: 'uz_cyr', from: 'data/variants/v58.json', why: "barcha da 'ў' tushgan" },
  // `Везде` ("hamma joyda") o'zbekchadagi "Barchasi to'g'ri" ga mos emas
  { gid: 't_51_q_17', lang: 'ru',     from: 'data/variants/v51.json', why: 'noto\'g\'ri tarjima' },

  /**
   * ESLATMA — RUSCHA RO'YXAT AJRATGICHI:
   * Dastlab `barcha-ru.json` dagi `;` variantini etalon qilib olgan edim
   * ("синий; зелёный; ..."), chunki element ichida ham vergul bor.
   *
   * LEKIN loyihaning O'Z tekshiruvchisida (`verify_all_fixes.cjs`)
   * `ru_semicolon: /; /` qoidasi bor — ya'ni ruscha matnda `; ` XATO
   * deb belgilangan. Bu o'rnatilgan konvensiya, shuning uchun teskarisi
   * to'g'ri: hamma joyda VERGUL bo'lishi kerak.
   *
   * Quyidagi RU_SEMICOLON passi buni ta'minlaydi — alohida gid ro'yxati
   * kerak emas.
   */
];

/** Ruscha bloklarda `; ` -> `, ` (loyiha konvensiyasi, yuqoridagi izohga qarang). */
const RU_SEMICOLON = { lang: 'ru', from: '; ', to: ', ' };

/**
 * "Manevr" atamasini HAR BIR TIL ichida bir xillashtirish.
 *
 * Har bir til maydonida o'z ko'pchiligi bor va ular bir-biriga zid edi:
 *   uz_lat : manevr 157  /  manyovr 41
 *   uz_cyr : маневр  22  /  манёвр  176
 *   ru     : маневр 248  /  манёвр  18
 *
 * Tanlangan yechim: har bir til O'Z ko'pchiligiga keltiriladi. Bu eng kam
 * o'zgarish (81 ta) va har bir til ichida 100% bir xillik beradi.
 * Foydalanuvchi bir vaqtda faqat bitta alifboni ko'radi, shuning uchun
 * lotin/kirill o'rtasidagi farq sezilmaydi.
 */
const TERM_NORMALIZE = [
  { lang: 'uz_lat', from: 'manyovr', to: 'manevr' },
  { lang: 'uz_cyr', from: 'маневр',  to: 'манёвр' },
  { lang: 'ru',     from: 'манёвр',  to: 'маневр' },
];

/**
 * Til aralashib ketgan joylar — hech bir faylda to'g'ri nusxa yo'q,
 * shuning uchun to'g'ri matn shu yerda beriladi.
 *
 * Tarjimalar o'zbekcha manbaga va korpusdagi mavjud uslubga asoslangan
 * (masalan "Barchasi" korpusda 5 marta "Все" deb berilgan).
 */
const MANUAL = [
  // t_25_q_10: ikki fayl bir-biriga matn ALMASHIB yuborgan
  { gid: 't_25_q_10', lang: 'uz_cyr',
    from: 'Прекратить дальнейшее движение', to: 'Белгиланган сафарни давом эттириш',
    why: 'ruscha matn kirill faylida' },
  { gid: 't_25_q_10', lang: 'ru',
    from: 'Белгиланган сафарни давом эттириш', to: 'Прекратить дальнейшее движение',
    why: 'kirillcha matn rus faylida' },

  // t_20_q_17: ruscha maydonda uchala variant ham kirillcha
  { gid: 't_20_q_17', lang: 'ru', from: 'Фақат 2 ва 3', to: 'Только 2 и 3', why: 'tarjima qilinmagan' },
  { gid: 't_20_q_17', lang: 'ru', from: 'Фақат 1 ва 2', to: 'Только 1 и 2', why: 'tarjima qilinmagan' },
  { gid: 't_20_q_17', lang: 'ru', from: 'Барчаси',      to: 'Все',          why: 'tarjima qilinmagan' },

  { gid: 't_55_q_5',  lang: 'ru', from: 'Тўғрига ва орқага бурилиш', to: 'Прямо и разворот',
    why: 'tarjima qilinmagan' },

  /**
   * t_6_q_9 — RUSCHA SAVOL BOSHQA NARSANI SO'RARDI.
   *
   *   uz : «...transport vositasining OLDINGI O'RINDIG'IDA tashishga
   *        ruxsat etiladimi?»  -> javob: maxsus qurilma bo'lsa ruxsat
   *   ru : «...в КАБИНЕ ГРУЗОВОГО АВТОМОБИЛЯ?»  -> javob: «Разрешается»
   *
   * Ya'ni rus tilidagi foydalanuvchi boshqa savol va boshqa javob olardi.
   *
   * O'ZBEKCHASI ASL ekani ikki dalil bilan tasdiqlandi:
   *   1. Egasi tasdiqladi.
   *   2. RUSCHA IZOHNING O'ZI savolga zid: «...а также на ПЕРЕДНЕМ СИДЕНЬЕ
   *      транспортного средства БЕЗ специального детского удерживающего
   *      устройства». Ya'ni izoh old o'rindiq va qurilma haqida.
   *
   * Yangi ruscha matn o'sha izohdagi RASMIY iboradan olindi — o'ylab
   * topilmadi.
   *
   * `Разрешается` butun korpusda juda ko'p uchraydi, shuning uchun bu
   * almashtirish SAVOL + TIL blokiga chegaralangan va to'liq JSON satri
   * bo'yicha mos keladi (0-variant «Разрешается только в сопровождении...»
   * tegilmaydi).
   */
  { gid: 't_6_q_9', lang: 'ru',
    from: 'Разрешается ли перевозить детей, не достигших 12-летнего возраста в кабине грузового автомобиля?',
    to: 'Разрешается ли перевозить детей, не достигших 12-летнего возраста, на переднем сиденье транспортного средства?',
    why: "savol o'zbekchasiga mos kelmasdi" },
  { gid: 't_6_q_9', lang: 'ru',
    from: 'Разрешается',
    to: 'Разрешается при наличии специального детского удерживающего устройства',
    why: "to'g'ri javob o'zbekchasiga mos kelmasdi" },

  // Savol MATNI tarjima qilinmagan. Korpusdagi o'xshash savol:
  // "Avtomobilning qaysi yo'nalishda harakatlanishiga ruxsat etiladi?"
  //   -> "В каком направлении разрешается движение автомобиля?"
  { gid: 't_57_q_7',  lang: 'ru',
    from: 'Автомобил ҳайдовчисига қайси йўналиш бўйича ҳаракатланишга рухсат этилади?',
    to: 'В каком направлении разрешается движение автомобиля?',
    why: 'savol matni tarjima qilinmagan' },
];

function collectJson(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    if (fs.statSync(p).isDirectory()) collectJson(p, out);
    else if (name.endsWith('.json')) out.push(p);
  }
  return out;
}

/**
 * Savolning xom matndagi chegarasi.
 * `"global_id": "<gid>"` dan KEYINGI `"global_id"` gacha (yoki fayl oxiri).
 * global_id — task_info ning birinchi maydoni, shuning uchun bu oraliq
 * butun savolni qamrab oladi.
 */
function questionSpan(text, gid) {
  /**
   * DIQQAT: fayllarning bir qismi chiroyli formatlangan (`"global_id": "x"`),
   * bir qismi esa SIQILGAN (`"global_id":"x"` — bo'shliqsiz).
   * `free-*.json`, `600.json` siqilgan — shuning uchun bo'shliq ixtiyoriy.
   */
  const re = new RegExp(`"global_id"\\s*:\\s*${JSON.stringify(gid)}`);
  const m = re.exec(text);
  if (!m) return null;
  const start = m.index;
  const next = text.indexOf('"global_id"', start + m[0].length);
  return { start, end: next === -1 ? text.length : next };
}

/** Savol ichidagi bitta til blokining chegarasi. */
function langSpan(text, span, lang) {
  // Siqilgan fayllarda ham ishlashi uchun bo'shliq ixtiyoriy
  const find = (key, from) => {
    const re = new RegExp(`"${key}"\\s*:`);
    const m = re.exec(text.slice(from, span.end));
    return m ? from + m.index : -1;
  };

  const start = find(lang, span.start);
  if (start === -1) return null;

  // Keyingi til kaliti yoki `izoh` — qaysi biri oldin kelsa
  let end = span.end;
  for (const other of [...LANGS.filter((l) => l !== lang), 'izoh']) {
    const i = find(other, start + lang.length + 3);
    if (i !== -1 && i < end) end = i;
  }
  return { start, end };
}

/**
 * Bir savolda til kaliti IKKI joyda uchraydi:
 *   "content": { "uz_lat": {...} }   — savol matni va variantlar
 *   "izoh":    { "uz_lat": "..." }   — izoh matni
 *
 * `langSpan` faqat BIRINCHISINI (content) qaytaradi. Bu funksiya ikkalasini
 * ham beradi — aks holda izohdagi matn tuzatilmay qolardi.
 */
function langSpansAll(text, span, lang) {
  const spans = [];
  const content = langSpan(text, span, lang);
  if (content) spans.push(content);

  const izohRe = /"izoh"\s*:/;
  const m = izohRe.exec(text.slice(span.start, span.end));
  if (m) {
    const izohStart = span.start + m.index;
    const inIzoh = langSpan(text, { start: izohStart, end: span.end }, lang);
    // `langSpan` content dagi kalitni qaytarmasligi uchun boshini tekshiramiz
    if (inIzoh && inIzoh.start > izohStart) spans.push(inIzoh);
  }
  return spans;
}

/** Faqat berilgan oraliqda almashtiradi. */
function replaceInSpan(text, span, from, to) {
  const slice = text.slice(span.start, span.end);
  if (!slice.includes(from)) return { text, count: 0 };
  const count = slice.split(from).length - 1;
  return {
    text: text.slice(0, span.start) + slice.split(from).join(to) + text.slice(span.end),
    count,
  };
}

const files = collectJson(PUBLIC_DIR);
const rel = (f) => path.relative(PUBLIC_DIR, f).split(path.sep).join('/');

/** Etalon fayldan savol matni va variantlarni o'qiydi. */
function readCanonical(gid, lang, fromFile) {
  const p = path.join(PUBLIC_DIR, fromFile);
  const data = JSON.parse(fs.readFileSync(p, 'utf8'));
  const q = data.find((x) => x?.task_info?.global_id === gid);
  const c = q?.content?.[lang];
  if (!c) return null;
  return { text: (c.text ?? '').trim(), options: c.options.map((o) => (o?.text ?? '').trim()) };
}

const report = [];
const perFile = new Map();

function record(file, msg) {
  const k = rel(file);
  if (!perFile.has(k)) perFile.set(k, []);
  perFile.get(k).push(msg);
}

for (const file of files) {
  const original = fs.readFileSync(file, 'utf8');
  let text = original;

  // --- 1) Etalon fayldan sinxronlash ---
  for (const rule of CANONICAL) {
    if (rel(file) === rule.from) continue; // etalonning o'ziga tegmaymiz
    const canon = readCanonical(rule.gid, rule.lang, rule.from);
    if (!canon) continue;

    const span = questionSpan(text, rule.gid);
    if (!span) continue;
    const ls = langSpan(text, span, rule.lang);
    if (!ls) continue;

    // Shu fayldagi joriy qiymatlarni o'qiymiz
    let data;
    try { data = JSON.parse(original); } catch { continue; }
    if (!Array.isArray(data)) continue;
    const cur = data.find((x) => x?.task_info?.global_id === rule.gid)?.content?.[rule.lang];
    if (!cur) continue;

    const pairs = [];
    if ((cur.text ?? '').trim() !== canon.text) pairs.push([(cur.text ?? '').trim(), canon.text]);
    cur.options.forEach((o, i) => {
      const a = (o?.text ?? '').trim();
      const b = canon.options[i];
      if (b !== undefined && a !== b) pairs.push([a, b]);
    });

    for (const [from, to] of pairs) {
      // JSON satri sifatida qidiramiz — qisman moslik bo'lmasin
      const r = replaceInSpan(text, questionSpan(text, rule.gid), JSON.stringify(from), JSON.stringify(to));
      if (r.count) {
        text = r.text;
        record(file, `${rule.gid}/${rule.lang}: ${from.slice(0, 45)}... -> ${to.slice(0, 45)}...`);
      }
    }
  }

  // --- 2) Qo'lda berilgan tuzatishlar (til blokiga chegaralangan) ---
  for (const fix of MANUAL) {
    const span = questionSpan(text, fix.gid);
    if (!span) continue;
    const ls = langSpan(text, span, fix.lang);
    if (!ls) continue;
    const r = replaceInSpan(text, ls, JSON.stringify(fix.from), JSON.stringify(fix.to));
    if (r.count) {
      text = r.text;
      record(file, `${fix.gid}/${fix.lang}: ${fix.from.slice(0, 40)}... -> ${fix.to.slice(0, 40)}...`);
    }
  }

  // --- 3) Ruscha bloklarda nuqtali vergulni vergulga aylantirish ---
  // Har bir savolning `ru` bloki alohida ko'riladi — o'zbekcha matnga tegmaydi.
  {
    let data;
    try { data = JSON.parse(original); } catch { data = null; }
    if (Array.isArray(data)) {
      for (const q of data) {
        const gid = q?.task_info?.global_id;
        if (!gid || !q?.content?.ru) continue;
        const span = questionSpan(text, gid);
        if (!span) continue;
        const ls = langSpan(text, span, RU_SEMICOLON.lang);
        if (!ls) continue;
        const r = replaceInSpan(text, ls, RU_SEMICOLON.from, RU_SEMICOLON.to);
        if (r.count) {
          text = r.text;
          record(file, `${gid}/ru: "; " -> ", " (${r.count})`);
        }
      }
    }
  }

  // --- 4) Atamani har bir til ichida bir xillashtirish ---
  {
    let data;
    try { data = JSON.parse(original); } catch { data = null; }
    if (Array.isArray(data)) {
      for (const q of data) {
        const gid = q?.task_info?.global_id;
        if (!gid) continue;
        for (const rule of TERM_NORMALIZE) {
          if (!q?.content?.[rule.lang] && !q?.izoh?.[rule.lang]) continue;
          // Oxiridan boshlab almashtiramiz — oldingi span indekslari siljimasin
          const span = questionSpan(text, gid);
          if (!span) continue;
          const spans = langSpansAll(text, span, rule.lang).reverse();
          for (const ls of spans) {
            const r = replaceInSpan(text, ls, rule.from, rule.to);
            if (r.count) {
              text = r.text;
              record(file, `${gid}/${rule.lang}: ${rule.from} -> ${rule.to} (${r.count})`);
            }
          }
        }
      }
    }
  }

  if (text !== original) {
    try {
      JSON.parse(text);
    } catch (err) {
      console.error(`XATO: ${rel(file)} JSON buzildi — o'tkazib yuborildi: ${err.message}`);
      continue;
    }
    report.push(rel(file));
    if (APPLY) fs.writeFileSync(file, text);
  }
}

console.log(APPLY ? "=== QO'LLANDI ===" : '=== KO\'RISH (dry-run) ===');
console.log(`Skanerlangan fayl: ${files.length}\n`);
for (const [f, msgs] of perFile) {
  console.log(f);
  for (const m of [...new Set(msgs)]) console.log(`   ${m}`);
}
console.log(`\nO'zgargan fayl: ${report.length}`);
if (!APPLY) console.log('\nYozish uchun: node scripts/question-tools/sync-questions-across-files.cjs apply');
