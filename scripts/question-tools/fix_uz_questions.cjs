#!/usr/bin/env node
/**
 * Professional Uzbek copy-editing for question JSON (uz_lat / uz_cyr).
 * Usage:
 *   node scripts/fix_uz_questions.cjs barcha.json
 *   node scripts/fix_uz_questions.cjs mavzuli2/30.json
 *   node scripts/fix_uz_questions.cjs all-mavzuli2
 */
const fs = require('fs');
const path = require('path');
const { projectRoot, publicRoot } = require('./paths.cjs');

const arg = (process.argv[2] || 'barcha.json').replace(/\\/g, '/');

/** [wrong, correct] — applied to uz_lat and uz_cyr */
const exactUz = [
  ['Yumshoq tushamada', 'Yumshoq taglikda'],
  ['Юмшоқ тушамада', 'Юмшоқ тагликда'],
  ['kiygiziladi', 'kiydiriladi'],
  ['кийгизилади', 'кийдирилади'],
  ["so'ngra sog'iga kiydiriladi", "so'ngra sog' qo'lga kiydiriladi"],
  ['сўнгра соғига кийдирилади', 'сўнгра соғ қўлга кийдирилади'],
  ['ikkala qo\'lga baravar', 'ikkala qo\'lga barobar'],
  ['иккала қўлга баравар', 'иккала қўлга баробар'],
  ['to\'piqdan chovgacha', "to'piqdan songacha"],
  ['тўпиқдан човгача', 'тўпиқдан сонгача'],
  ['Haydovchiniig', 'Haydovchining'],
  ['Ҳайдовчинииг', 'Ҳайдовчининг'],
  ['chanqoqlik naqas olishning', 'chanqoqlik, nafas olishning'],
  ['чанқоқлик нақас олишнинг', 'чанқоқлик, нафас олишнинг'],
  ['hotiraning', 'xotiraning'],
  ['ҳотиранинг', 'хотиранинг'],
  ["yo'qolishi,sodir", "yo'qolishi, sodir"],
  ['йўқолиши,содир', 'йўқолиши, содир'],
  ['qon sizib oqib qichadi', 'qon sizib chiqadi'],
  ['қон сизиб оқиб қичади', 'қон сизиб чиқади'],
  ['Jaroxatlangan', 'Jarohatlangan'],
  ['Жарохатланган', 'Жароҳатланган'],
  ['Qo\'l oyoq uchlari( ', "Qo'l-oyoq uchlari ("],
  ['Қўл оёқ учлари( ', 'Қўл-оёқ учлари ('],
  ['ochik qismiga', 'ochiq qismiga'],
  ['очik қисмига', 'очиқ қисмига'],
  ['sirpanishva yonga', 'sirpanish va yonga'],
  ['сирпанишва йонга', 'сирпаниш ва йонга'],
  ['сирпанишва ёнга', 'сирпаниш ва ёнга'],
  ['joyida to\'tib turishning', "joyida to'xtab turishning"],
  ['жойида тўтиб туришнинг', 'жойида тўхтаб туришнинг'],
  ['3. . Yurgizgich', '3. Yurgizgich'],
  ['3. . Юргизгич', '3. Юргизгич'],
  ['. Yurgizgich', 'Yurgizgich'],
  ['. Юргизгич', 'Юргизгич'],
  ['ag\'anab ketishiga', "ag'darilib ketishiga"],
  ['ағанаб кетишига', 'ағдарилиб кетишига'],
  ['oxista ravon burish', 'ohista ravon burish'],
  ['охиста равон буриш', 'оҳиста равон буриш'],
  ['Rulni burib sirpanchiqdan chiqib ketish ', 'Rulni burib sirpanchiqdan chiqib ketish'],
  ['Рулни буриб сирпанчиқдан чиқиб кетиш ', 'Рулни буриб сирпанчиқдан чиқиб кетиш'],
  ['terini ishlash uchun', 'terini ishlov berish uchun'],
  ['терини ишлаш учун', 'терини ишлов бериш учун'],
  ['asfalt ΓÇôbeton', 'asfalt-beton'],
  ['asfalt –beton', 'asfalt-beton'],
  ['асфалт –бетон', 'асфалт-бетон'],
  ['асфалт ΓÇôбетон', 'асфалт-бетон'],
  ['bazi voqealar', "ba'zi voqealar"],
  ['баци воқеалар', 'баъзи воқеалар'],
  ['taminlaydi', "ta'minlaydi"],
  ['таминлайди', 'таъминлайди'],
  ['qisman katta bo\'lmagan sirpanchiq', "qisman kichik sirpanchiq"],
  ['қисман катта бўлмаган сирпанчиқ', 'қисман кичик сирпанчиқ'],
  [
    "Yo'l harakati qatnashchilariga nisbatan imtiyozi bo'lgan boshqa yo'l harakati qatnashchisining harakat yo'nalishi yoki tezligini o'zgartirishga majbur etishimumkin bo'lgan hollarda harakatni davom mumkin bo'lgan hollarda harakatni davom ettirmasligini yoki boshlamasligini, biror-bir manevr bajarishi mumkin emasligini bildiruvchi talab",
    "Yo'l harakati qatnashchilariga nisbatan imtiyozi bo'lgan boshqa yo'l harakati qatnashchisining harakat yo'nalishi yoki tezligini o'zgartirishga majbur etishi mumkin bo'lgan hollarda harakatni davom ettirmasligini yoki boshlamasligini, biror-bir manevr bajarishi mumkin emasligini bildiruvchi talab",
  ],
  [
    'Йўл ҳаракати қатнашчиларига нисбатан имтиёзи бўлган бошқа йўл ҳаракати қатнашчисининг ҳаракат йўналиши ёки тезлигини ўзгартиришга мажбур етишимумкин бўлган ҳолларда ҳаракатни давом мумкин бўлган ҳолларда ҳаракатни давом еттирмаслигини ёки бошламаслигини, бирор-бир манёвр бажариши мумкин емаслигини билдирувчи талаб',
    'Йўл ҳаракати қатнашчиларига нисбатан имтиёзи бўлган бошқа йўл ҳаракати қатнашчисининг ҳаракат йўналиши ёки тезлигини ўзгартиришга мажбур этиши мумкин бўлган ҳолларда ҳаракатни давом еттирмаслигини ёки бошламаслигини, бирор-бир манёвр бажариши мумкин емаслигини билдирувчи талаб',
  ],
  [
    'Maktab va maktabgacha talim tashkilotlari atrofidagi yullarda 300 metrgacha bo\'lgan masofada kanday eng yukori tezlikda harakatlanishga ruhsat etiladi',
    "Maktab va maktabgacha ta'lim tashkilotlari atrofidagi yo'llarda 300 metrgacha bo'lgan masofada qanday eng yuqori tezlikda harakatlanishga ruxsat etiladi",
  ],
  ['maktabgacha talim tashkilotlari', "maktabgacha ta'lim tashkilotlari"],
  ['мактабгача талим ташкилотлари', 'мактабгача таълим ташкилотлари'],
  [
    "Ushbu yo'l belgisi chorahalarda o'nga burilayotgan relezsiz transport voisitalariga svetaforning qaysi ishorasida harakatlanishga ruhsat etiladi?",
    "Ushbu yo'l belgisi chorahalarda o'nga burilayotgan relezsiz transport vositalariga svetaforning qaysi ishorasida harakatlanishga ruxsat etiladi?",
  ],
];

/** Latin: engil → yengil; qaerda → qayerda; ruhsat → ruxsat; … */
function fixEngilLatin(text) {
  if (!text || typeof text !== 'string') return text;
  return text
    .replace(/\bEngil avtomobil/g, 'Yengil avtomobil')
    .replace(/\bengil avtomobil/g, 'yengil avtomobil')
    .replace(/\bEngil yo'nalishsiz/g, "Yengil yo'nalishsiz")
    .replace(/\bengil yo'nalishsiz/g, "yengil yo'nalishsiz")
    .replace(/\bEngil taksilarga/g, 'Yengil taksilarga')
    .replace(/\bengil taksilarga/g, 'yengil taksilarga')
    .replace(/\bEngil va yuk/g, 'Yengil va yuk')
    .replace(/\bengil va yuk/g, 'yengil va yuk')
    .replace(/\bQaerda\b/g, 'Qayerda')
    .replace(/\bqaerda\b/g, 'qayerda')
    .replace(/\bQaerdan\b/g, 'Qayerdan')
    .replace(/\bqaerdan\b/g, 'qayerdan')
    .replace(/\bkanday\b/g, 'qanday')
    .replace(/\bruhsat\b/g, 'ruxsat')
    .replace(/qaraama-qarshi/g, 'qarama-qarshi')
    .replace(/transport voisitalariga/g, 'transport vositalariga')
    .replace(/eng yukori tezlik/g, 'eng yuqori tezlik');
}

function fixCyrCommon(text) {
  if (!text || typeof text !== 'string') return text;
  return text
    .replace(/\bҚаерда\b/g, 'Қайерда')
    .replace(/\bқаерда\b/g, 'қайерда')
    .replace(/\bҚаердан\b/g, 'Қайердан')
    .replace(/\bқаердан\b/g, 'қайердан')
    .replace(/қараама-қарши/g, 'қарама-қарши');
}

function polishUz(text, { lang = 'any' } = {}) {
  if (!text || typeof text !== 'string') return text;
  let v = text;
  for (const [from, to] of exactUz) {
    if (v.includes(from)) v = v.split(from).join(to);
  }
  if (lang === 'uz_lat') v = fixEngilLatin(v);
  if (lang === 'uz_cyr') v = fixCyrCommon(v);
  v = v.replace(/  +/g, ' ');
  v = v.replace(/\s+$/g, '');
  return v;
}

function polishBlock(block, stats, lang) {
  if (!block) return;
  if (typeof block.text === 'string') {
    const n = polishUz(block.text, { lang });
    if (n !== block.text) {
      stats.text += 1;
      block.text = n;
    }
  }
  if (Array.isArray(block.options)) {
    for (const opt of block.options) {
      if (typeof opt.text === 'string') {
        const n = polishUz(opt.text, { lang });
        if (n !== opt.text) {
          stats.options += 1;
          opt.text = n;
        }
      }
    }
  }
}

function fixIodDuplicates(data, stats) {
  const dup =
    "Yara o'ta darajada ifloslanganda yaraning butun yuzasiga surtish uchun";
  const dupCyr = 'Яра ўта даражада ифлосланганда яранинг бутун юзасига суртиш учун';
  for (const q of data) {
    const textLat = q.content?.uz_lat?.text || '';
    if (!textLat.includes('yod eritmasi') && !textLat.includes('йод эритмаси')) continue;
    const o3lat = q.content?.uz_lat?.options?.find((o) => o.id === 3);
    const o3cyr = q.content?.uz_cyr?.options?.find((o) => o.id === 3);
    const o2lat = q.content?.uz_lat?.options?.find((o) => o.id === 2);
    if (o3lat?.text === dup && o2lat?.text !== dup) {
      o3lat.text = 'Birinchi darajadagi kimyoviy kuyishda teriga surtish uchun';
      stats.options += 1;
    }
    if (o3cyr?.text === dupCyr) {
      o3cyr.text = 'Биринчи даражали кимёвий куйишда терига суртиш учун';
      stats.options += 1;
    }
    const o1lat = q.content?.uz_lat?.options?.find((o) => o.id === 1);
    if (o1lat?.text?.includes('terini ishlash')) {
      o1lat.text = o1lat.text.replace('terini ishlash', 'terini ishlov berish');
      stats.options += 1;
    }
    const o1cyr = q.content?.uz_cyr?.options?.find((o) => o.id === 1);
    if (o1cyr?.text?.includes('терини ишлаш')) {
      o1cyr.text = o1cyr.text.replace('терини ишлаш', 'терини ишлов бериш');
      stats.options += 1;
    }
  }
}

function fixSideSlipOption3(data, stats) {
  const wrong = 'Faqat birdaniga keskin tormozlash sababli';
  const right = 'Birdaniga keskin tezlanish va keskin tormozlash sababli';
  const wrongCyr = 'Фақат бирданига кескин тормозлаш сабабли';
  const rightCyr = 'Бирданига кескин тезланиш ва кескин тормозлаш сабабли';
  for (const q of data) {
    const t = q.content?.uz_lat?.text || '';
    if (!t.includes('yon tomonga sirpanib')) continue;
    const opts = q.content?.uz_lat?.options || [];
    const o2 = opts.find((o) => o.id === 2);
    const o3 = opts.find((o) => o.id === 3);
    if (o2?.text === wrong && o3?.text === wrong) {
      o3.text = right;
      stats.options += 1;
    }
    const optsC = q.content?.uz_cyr?.options || [];
    const o2c = optsC.find((o) => o.id === 2);
    const o3c = optsC.find((o) => o.id === 3);
    if (o2c?.text === wrongCyr && o3c?.text === wrongCyr) {
      o3c.text = rightCyr;
      stats.options += 1;
    }
  }
}

function collectMavzuli2(dir, list = []) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    if (fs.statSync(full).isDirectory()) collectMavzuli2(full, list);
    else if (name.endsWith('.json') && !name.includes('.bak')) list.push(full);
  }
  return list;
}

function collectAllQuestionJson(dir, list = []) {
  for (const name of fs.readdirSync(dir)) {
    const full = path.join(dir, name);
    const st = fs.statSync(full);
    if (st.isDirectory()) {
      if (name === 'node_modules') continue;
      collectAllQuestionJson(full, list);
    } else if (name.endsWith('.json') && !name.includes('.bak')) list.push(full);
  }
  return list;
}

function resolveFiles(target) {
  if (target === 'all-mavzuli2') {
    return collectMavzuli2(path.join(publicRoot, 'mavzuli2'));
  }
  if (target === 'all') {
    return collectAllQuestionJson(publicRoot);
  }
  const full = path.resolve(publicRoot, target);
  if (!fs.existsSync(full)) return [];
  if (fs.statSync(full).isDirectory()) return collectMavzuli2(full);
  return [full];
}

function processFile(filePath) {
  const rel = path.relative(publicRoot, filePath).replace(/\\/g, '/');
  const source = fs.readFileSync(filePath, 'utf8');
  let data;
  try {
    data = JSON.parse(source);
  } catch (e) {
    console.log(`SKIP (invalid JSON): ${rel}`);
    return { text: 0, options: 0 };
  }
  if (!Array.isArray(data)) {
    console.log(`SKIP (not array): ${rel}`);
    return { text: 0, options: 0 };
  }

  const stats = { text: 0, options: 0 };
  for (const q of data) {
    polishBlock(q.content?.uz_lat, stats, 'uz_lat');
    polishBlock(q.content?.uz_cyr, stats, 'uz_cyr');
  }
  fixIodDuplicates(data, stats);
  fixSideSlipOption3(data, stats);

  const out = `${JSON.stringify(data, null, 4)}\n`;
  if (out === source) {
    console.log(`${rel}: no changes`);
    return stats;
  }
  fs.writeFileSync(filePath, out, 'utf8');
  console.log(`${rel}: texts ${stats.text}, options ${stats.options}`);
  return stats;
}

const files = resolveFiles(arg);
let total = { text: 0, options: 0 };
console.log(`Uzbek professional fix: ${arg} (${files.length} file(s))\n`);
for (const fp of files) {
  const s = processFile(fp);
  total.text += s.text;
  total.options += s.options;
}
console.log(`\nTotal: ${total.text} texts, ${total.options} options`);
