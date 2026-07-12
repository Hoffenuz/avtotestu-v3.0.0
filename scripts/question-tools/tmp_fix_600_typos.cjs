const fs = require('fs');
const path = require('path');
const { projectRoot, publicRoot, isQuestionJsonFile } = require('./paths.cjs');
const { spawnSync } = require('child_process');

const validCommands = new Set(['apply', 'keep', 'undo']);
const rawArgs = process.argv.slice(2);
const parsedCommand = rawArgs[0] && validCommands.has(rawArgs[0].toLowerCase())
  ? rawArgs[0].toLowerCase()
  : 'apply';
const parsedTarget = rawArgs[0] && validCommands.has(rawArgs[0].toLowerCase())
  ? (rawArgs[1] || '600.json')
  : (rawArgs[0] || '600.json');
const targetFileName = path.basename(parsedTarget);
const targetRelPathEarly = parsedTarget.replace(/\\/g, '/');
const publicRootEarly = publicRoot;
const maybeDir = path.resolve(publicRootEarly, targetRelPathEarly);
const isBatchDir = fs.existsSync(maybeDir) && fs.statSync(maybeDir).isDirectory();

if (!isBatchDir && path.extname(targetFileName).toLowerCase() !== '.json') {
  console.error('Target must be a .json file or a directory inside public/.');
  process.exit(1);
}

const command = parsedCommand;
const targetRelPath = parsedTarget.replace(/\\/g, '/');
const filePath = path.resolve(publicRoot, targetRelPath);
const backupPath = `${filePath}.pending-fix.bak`;
const diffPath = `${filePath}.pending-fix.diff`;
const relativeTargetPath = `public/${targetRelPath}`;

const tokenReplacements = [
  ['Fakat', 'Faqat'],
  ['fakat', 'faqat'],
  ['Fagat', 'Faqat'],
  ['fagat', 'faqat'],
  ['Kaysi', 'Qaysi'],
  ['kaysi', 'qaysi'],
  ['Kuyidagi', 'Quyidagi'],
  ['kuyidagi', 'quyidagi'],
  ['Kuk', "Ko'k"],
  ['kuk', "ko'k"],
  ['Kizil', 'Qizil'],
  ['kizil', 'qizil'],
  ['Ok', 'Oq'],
  ['ok', 'oq'],
  ['Xollarda', 'Hollarda'],
  ['xollarda', 'hollarda'],
  ['Utilgan', "O'tilgan"],
  ['utilgan', "o'tilgan"],
  ['Tasir', "Ta'sir"],
  ['tasir', "ta'sir"],
  ['Jixoz', 'Jihoz'],
  ['jixoz', 'jihoz'],
  ['etarlicha', 'yetarlicha'],
  ['Etarlicha', 'Yetarlicha'],
  ['kanstruksiyasida', 'konstruksiyasida'],
  ['taqmaslikga', 'taqmaslikka'],
  ['foynadalanish', 'foydalanish'],
  ['trasnport', 'transport'],
  ['Xar ', 'Har '],
  [' xar ', ' har '],
  ['xaydovchi', 'haydovchi'],
  ['Xaydovchi', 'Haydovchi'],
  ['axoli', 'aholi'],
  ['tuxtash', "to'xtash"],
  ['Tuxtash', "To'xtash"],
  ['tuxtab', "to'xtab"],
  ['Tuxtab', "To'xtab"],
  ['Tuxtagan', "To'xtagan"],
  ['tuxtagan', "to'xtagan"],
  ['tuxtatish', "to'xtatish"],
  ['Tuxtatish', "To'xtatish"],
  ['tuxtamasdan', "to'xtamasdan"],
  ['koidasini', 'qoidasini'],
  ['koidani', 'qoidani'],
  ['koida', 'qoida'],
  ['Koidalarda', 'Qoidalarda'],
  ['Koidalar', 'Qoidalar'],
  ['buzmokda', 'buzmoqda'],
  ['xarakakatlan', 'harakatlan'],
  ['Xarakat', 'Harakat'],
  ['xarakat', 'harakat'],
  ['xolat', 'holat'],
  ['tarif', "ta'rif"],
  ['kilinishini', 'qilinishini'],
  ['Takiklanadi', 'Taqiqlanadi'],
  ['takiklanadi', 'taqiqlanadi'],
  ['Ogoxlantiruvchi', 'Ogohlantiruvchi'],
  ['qatiy', "qat'iy"],
  ['mumkun', 'mumkin'],
  ['ogoxlantiruvchi', 'ogohlantiruvchi'],
  ['etiborini', "e'tiborini"],
  ['yul', "yo'l"],
  ['Yul', "Yo'l"],
  ['yulovchilarni', "yo'lovchilarni"],
  ['tushurishga', 'tushirishga'],
  ['kanchadan', 'qanchadan'],
  ['kancha', 'qancha'],
  ['kolganda', 'qolganda'],
  ['kup', "ko'p"],
  ['bulsa', "bo'lsa"],
  ['bulishi', "bo'lishi"],
  ['bulgan', "bo'lgan"],
  ['dakikagacha', 'daqiqagacha'],
  ['mayokchalar', 'mayoqchalar'],
  ['boshkarayot', 'boshqarayotgan'],
  ['oshiryotgan', 'oshirayotgan'],
  ["o'pnatiladi", "o'rnatiladi"],
  ['kismi', 'qismi'],
  ['katnov', 'qatnov'],
  ['xarfi', 'harfi'],
  ['kuvib', 'quvib'],
  ['kursatilgan', "ko'rsatilgan"],
  ['utish', "o'tish"],
  ['yonalish', "yo'nalish"],
  ['buyicha', "bo'yicha"],
  ["yo'kligini", "yo'qligini"],
  ['aniklay', 'aniqlay'],
  ['qorongi', "qorong'i"],
  ['boshka', 'boshqa'],
  ['katnashchilariga', 'qatnashchilariga'],
  ['katnashchilari', 'qatnashchilari'],
  ['katnov qismida', 'qatnov qismida'],
  ['Mexanik transport vositalari va uning tirkamalarining egalari texnik holatidan qat\'iy nazar; harid qilgan', 'Mexanik transport vositalari va uning tirkamalarining egalari texnik holatidan qat\'iy nazar; xarid qilgan'],
  ['Факат', 'Фақат'],
  ['факат', 'фақат'],
  ['Фагат', 'Фақат'],
  ['фагат', 'фақат'],
  ['Кайси', 'Қайси'],
  ['кайси', 'қайси'],
  ['Куйидаги', 'Қуйидаги'],
  ['куйидаги', 'қуйидаги'],
  ['Кук', 'Кўк'],
  ['кук', 'кўк'],
  ['Кизил', 'Қизил'],
  ['кизил', 'қизил'],
  ['Ок', 'Оқ'],
  ['ок', 'оқ'],
  ['Холларда', 'Ҳолларда'],
  ['холларда', 'ҳолларда'],
  ['Утилган', 'Ўтилган'],
  ['утилган', 'ўтилган'],
  ['булмаган', 'бўлмаган'],
  ['Жихоз', 'Жиҳоз'],
  ['жихоз', 'жиҳоз'],
  ['канструкциясида', 'конструкциясида'],
  ['тақмасликга', 'тақмасликка'],
  ['фойнадаланиш', 'фойдаланиш'],
  ['Хар ', 'Ҳар '],
  [' хар ', ' ҳар '],
  ['хайдовчи', 'ҳайдовчи'],
  ['Хайдовчи', 'Ҳайдовчи'],
  ['ахоли', 'аҳоли'],
  ['тухташ', 'тўхташ'],
  ['Тухташ', 'Тўхташ'],
  ['тухтаб', 'тўхтаб'],
  ['Тухтаб', 'Тўхтаб'],
  ['тухтаган', 'тўхтаган'],
  ['Тухтаган', 'Тўхтаган'],
  ['тухтатиш', 'тўхтатиш'],
  ['коидасини', 'қоидасини'],
  ['коидани', 'қоидани'],
  ['Коидаларда', 'Қоидаларда'],
  ['Коидалар', 'Қоидалар'],
  ['бузмокда', 'бузмоқда'],
  ['Харакат', 'Ҳаракат'],
  ['харакакатлан', 'ҳаракатлан'],
  ['харакат', 'ҳаракат'],
  ['килинишини', 'қилинишини'],
  ['мумкун', 'мумкин'],
  ['йул', 'йўл'],
  ['Йул', 'Йўл'],
  ['канчадан', 'қанчадан'],
  ['канча', 'қанча'],
  ['колганда', 'қолганда'],
  ['куп', 'кўп'],
  ['булса', 'бўлса'],
  ['булиши', 'бўлиши'],
  ['булган', 'бўлган'],
  ['дакикагача', 'дақиқагача'],
  ['маёкчалар', 'маёқчалар'],
  ['кисми', 'қисми'],
  ['катнов', 'қатнов'],
  ['харфи', 'ҳарфи'],
  ['кувиб', 'қувиб'],
  ['курсатилган', 'кўрсатилган'],
  ['утиш', 'ўтиш'],
  ['йуналиш', 'йўналиш'],
  ['ёналиш', 'йўналиш'],
  ['буйича', 'бўйича'],
  ['йўклигини', 'йўқлигини'],
  ['аниклай', 'аниқлай'],
  ['қоронги', 'қоронғи'],
  ['бошка', 'бошқа'],
  ['катнашчиларига', 'қатнашчиларига'],
  ['катнашчилари', 'қатнашчилари'],
  ['ташкилий', 'ташкилий'],
  ['кулланилади', 'қўлланилади'],
  ['кушимча', 'қўшимча'],
  ['тасир', 'таъсир'],
  ['килади', 'қилади'],
  ['такикланади', 'тақиқланади'],
  ['Такикланади', 'Тақиқланади'],
  ['Хеч', 'Ҳеч'],
  ['хеч', 'ҳеч']
];

const substringReplacements = [
  ['бўлca', 'бўлса'],
  ['Manyovr', 'Manevr'],
  ['manyovr', 'manevr'],
  ['Qayral', 'Qayril'],
  ['qayral', 'qayril'],
  ['пользуеться', 'пользуется'],
  ['преимушеств', 'преимуществ'],
  ['припятств', 'препятств'],
  ['транспортвоси', 'транспорт воси'],
  ['тугрига', 'тўғрига'],
  ['Тугрига', 'Тўғрига'],
  ['унгга', 'ўнгга'],
  ['Унгга', 'Ўнгга'],
  ['қайралиб', 'қайрилиб'],
  ['Қайралиб', 'Қайрилиб'],
  ['gildir', "g'ildir"],
  ['Gildir', "G'ildir"],
  ['гилдира', 'ғилдира'],
  ['Гилдира', 'Ғилдира'],
  [' етилад', ' этилад'],
  ['Етилад', 'Этилад'],
  ['xaydovch', 'haydovch'],
  ['Xaydovch', 'Haydovch'],
  ['xarakat', 'harakat'],
  ['Xarakat', 'Harakat'],
  ['xolat', 'holat'],
  ['Xolat', 'Holat'],
  ['ogox', 'ogoh'],
  ['Ogox', 'Ogoh'],
  ["yorig'lik", "yorug'lik"],
  ["Yorig'lik", "Yorug'lik"],
  ['yonalish', "yo'nalish"],
  ['Yonalish', "Yo'nalish"],
  ['buyicha', "bo'yicha"],
  ['Buyicha', "Bo'yicha"],
  ['transpot', 'transport'],
  ['Transportvosit', 'Transport vosit'],
  ['transportvosit', 'transport vosit'],
  ['avtomabil', 'avtomobil'],
  ['Avtomabil', 'Avtomobil'],
  ["qorong'u", "qorong'i"],
  ["Qorong'u", "Qorong'i"],
  ['qaysii', 'qaysi'],
  ['хайдовч', 'ҳайдовч'],
  ['Хайдовч', 'Ҳайдовч'],
  ['харакат', 'ҳаракат'],
  ['Харакат', 'Ҳаракат'],
  ['бошкараёт', 'бошқараёт'],
  ['холат', 'ҳолат'],
  ['Холат', 'Ҳолат'],
  ['тухташ', 'тўхташ'],
  ['Тухташ', 'Тўхташ'],
  ['тухтаб', 'тўхтаб'],
  ['Тухтаб', 'Тўхтаб'],
  ['тухтаган', 'тўхтаган'],
  ['Тухтаган', 'Тўхтаган'],
  ['тухтат', 'тўхтат'],
  ['Тухтат', 'Тўхтат'],
  ['йуналиш', 'йўналиш'],
  ['Йуналиш', 'Йўналиш'],
  ['ёналиш', 'йўналиш'],
  ['Ёналиш', 'Йўналиш'],
  ['ёкил', 'ёқил'],
  ['Ёкил', 'Ёқил'],
  ['ёкиш', 'ёқиш'],
  ['Ёкиш', 'Ёқиш'],
  ['ёриғлик', 'ёруғлик'],
  ['Ёриғлик', 'Ёруғлик'],
  ['светафор', 'светофор'],
  ['Светафор', 'Светофор'],
  ['choraxa', 'chorraha'],
  ['Choraxa', 'Chorraha'],
  ['чорраха', 'чорраҳа'],
  ['Чорраха', 'Чорраҳа'],
  ['чораха', 'чорраҳа'],
  ['Чораха', 'Чорраҳа'],
  ['чораҳа', 'чорраҳа'],
  ['Чораҳа', 'Чорраҳа'],
  ['чоррахани', 'чорраҳани'],
  ['чоррахадан', 'чорраҳадан'],
  ['булиб', 'бўлиб'],
  ['утади', 'ўтади'],
  ['утадилар', 'ўтадилар'],
  ['таъқиқ', 'тақиқ'],
  ['Таъқиқ', 'Тақиқ'],
  ['хафли', 'хавфли'],
  ['Хафли', 'Хавфли'],
  ['траспорт', 'транспорт'],
  ['Траспорт', 'Транспорт'],
  ['реэлссиз', 'рельссиз'],
  ['Реэлссиз', 'Рельссиз'],
  ['қўлллаш', 'қўллаш'],
  ['қмсмида', 'қисмида'],
  ['воиситалари', 'воситалари'],
  ['руҳсат', 'рухсат'],
  ['такиклан', 'тақиқлан'],
  ['Такиклан', 'Тақиқлан'],
  ['o tishlan', "o'tishlari"],
  ['o tishlari', "o'tishlari"],
  ['chiziglari', 'chiziqlari'],
  ['tomoniama', 'tomonlama'],
  ['qismiari', 'qismlari'],
  ["o'shashlar", "o'xshashlar"],
  ["bo' magan", "bo'lmagan"],
  ["bo'lca", "bo'lsa"],
  ['tuxtash', "to'xtash"],
  ['Tuxtash', "To'xtash"],
  ["chiziq'i", "chizig'i"],
  ['chizik', 'chiziq'],
  ['Chizik', 'Chiziq'],
  ['sidirga chiziq', "sidirg'a chiziq"],
  ['xaqida', 'haqida'],
  ['Xaqida', 'Haqida'],
  ['xisoblan', 'hisoblan'],
  ['Xisoblan', 'Hisoblan'],
  ['Doimim', 'Doimiy'],
  ['shlagbaungacha', 'shlagbaumgacha'],
  ['shlagbaun', 'shlagbaum'],
  ["To'xash", "To'xtash"],
  ['sarik chiziq', 'sariq chiziq'],
  ['sarik chiroq', 'sariq chiroq'],
  ['Shlagbaunli', 'Shlagbaumli'],
  ['shlagbaunli', 'shlagbaumli'],
  ['jixozlangan', 'jihozlangan'],
  ['Jixozlangan', 'Jihozlangan'],
  ['jixozlan', 'jihozlan'],
  ['Jixozlan', 'Jihozlan'],
  [' harakatlanishga rusat ', ' harakatlanishga ruxsat '],
  ['etarli ko', 'yetarli ko'],
  ['сидирга чизик', 'сидирға чизиқ'],
  ['сидирга чизиқ', 'сидирға чизиқ'],
  ['чизик', 'чизиқ'],
  ['хақида', 'ҳақида'],
  ['хисоблан', 'ҳисоблан'],
  ['кursatgich', "ko'rsatgich"],
  ['TO\'XTASh', "TO'XTASH"],
  ['qandayjoylarda', 'qanday joylarda'],
  ['мэтр', 'метр'],
  // mavzuli2: Cyrillic OCR / keyboard confusions (э→е, г→қ, broken words)
  ['кэрак', 'керак'],
  ['Кэрак', 'Керак'],
  ['бэлгилари', 'белгилари'],
  ['бэлгиси', 'белгиси'],
  ['бэлгилайди', 'белгилайди'],
  ['бэлги', 'белги'],
  ['чизиглари', 'чизиқлари'],
  ['чизиги', 'чизиғи'],
  ['бошга ', 'бошқа '],
  ['бў маган', 'бўлмаган'],
  ['томониама', 'томонлама'],
  ['қисмиари', 'қисмлари'],
  ['қисмиарида', 'қисмларида'],
  ['ўшашлар', 'ўхшашлар'],
  ['шунингдэк', 'шунингдек'],
  ['киломэтрдан', 'километрдан'],
  ['киломэтр', 'километр'],
  ['мэтрдан', 'метрдан'],
  ['бэмалол', 'бемалол'],
  ['бэрадиган', 'берадиган'],
  ['харакакатланишни', 'ҳаракатланишни'],
  ['харакакат', 'ҳаракат'],
  ['релезсиз', 'рельссиз'],
  ['траснпорт', 'транспорт'],
  ['воситаcи', 'воситаси'],
  ['тўгррисидаги', 'тўғрисидаги'],
  ['pyxcат', 'рухсат'],
  ['pухсат', 'рухсат'],
  ['xаракат', 'ҳаракат'],
  ['ўpнатилади', 'ўрнатилади'],
  ['ўpнати', 'ўрнати'],
  ['aйни', 'айни'],
  ['Aвтомобил', 'Автомобил'],
  ['йблларида', 'йўлларида'],
  ['куринишидаги', 'кўринишидаги'],
  ['маьлум', 'маълум'],
  ['ҳафсизлигини', 'хавфсизлигини'],
  ['ҳафсиз', 'хавфсиз'],
  ['махсуз', 'махсус'],
  ['брнатилади', 'ўрнатилади'],
  ['Жарохатланган', 'Жароҳатланган'],
  ['жароҳатланган', 'жароҳатланган'],
  ['Вактинчалик', 'Вақтинча'],
  ['вактинчалик', 'вақтинча'],
  ['марно ', 'мано '],
  ['жихатидан', 'жиҳатида'],
  ['Юкори', 'Юқори'],
  ['Hаправлении', 'Направлении'],
  ['ётик йул', 'ётик йўл'],
  ['ётик йўл чизиги', 'ётик йўл чизиғи'],
  ['йул чизиги', 'йўл чизиғи'],
  ['йул белг', 'йўл белг'],
  ['йулнинг', 'йўлнинг'],
  [' йул ', ' йўл '],
  ['о тишлари', 'ўтишлари'],
  ['о тишлан', 'ўтишлари'],
  [' ё Ининг ', ' ёки унинг '],
  [')тақмасликка', ') тақмасликка'],
  [')тақмасликга', ') тақмасликка'],
  ['холaтларнинг', 'ҳолатларнинг'],
  ['билдираaди', 'билдиради'],
  ['пиёдалар утиш', 'пиёдалар ўтиш'],
  ['утаётган', 'ўтаётган'],
  ['утади', 'ўтади'],
  ['утган', 'ўтган'],
  ['кайта ', 'қайта '],
  ['куриниш', 'кўриниш'],
  ['хавфли йул', 'хавфли йўл'],
  ['йул кисми', 'йўл қисми'],
  ['бошланишидан канча', 'бошланишидан қанча'],
  ['Хеч кайси', 'Ҳеч қайси'],
  ['хеч кайси', 'ҳеч қайси'],
  ['тўгри', 'тўғри'],
  ['руҳсат', 'рухсат']
];

const exactReplacements = [
  ['Бу таниклик белгиси урнатилади:', 'Бу таниқлилик белгиси ўрнатилади:'],
  ['Bu taniklik belgisi urnatiladi:', "Bu taniqlilik belgisi o'rnatiladi:"],
  ["Bu taniqlik belgisi o'rnatiladi:", "Bu taniqlilik belgisi o'rnatiladi:"],
  ['Бу таниқлик белгиси ўрнатилади:', 'Бу таниқлилик белгиси ўрнатилади:'],
  ['Фақат турига ва унгга', 'Фақат тўғрига ва ўнгга'],
  ['Фақат турига ва ўнгга', 'Фақат тўғрига ва ўнгга'],
  ["Barcha sanab o'tilganlarda hollarda ruxsat etiladi", "Barcha sanab o'tilgan hollarda ruxsat etiladi"],
  ['Барча санаб ўтилганларда ҳолларда рухсат этилади', 'Барча санаб ўтилган ҳолларда рухсат этилади'],
  ['Автомобилда хавфнинг ҳайдовчига маьлум бўлган пайтидан бошлаб тўла тўхтагунга қадар босиб ўтилган масофан', 'Автомобилда хавфнинг ҳайдовчига маълум бўлган пайтидан бошлаб тўла тўхтагунга қадар босиб ўтилган масофа'],
  ['Ushbu transport vosita qaysi toifaga kiradi?', 'Ushbu transport vositasi qaysi toifaga kiradi?'],
  ['Ушбу транспорт восита қайси тоифага киради?', 'Ушбу транспорт воситаси қайси тоифага киради?'],
  ['Cиний', 'Синий'],
  ['«1»вa«4»', '«1» ва «4»'],
  ['Tорможение с выключенным сцеплением', 'Торможение с выключенным сцеплением'],
  ['Трамвай реэлссиз транспорт воситаларига\r\nнисбатан имтиёзга эга булмаган ҳолат:', 'Трамвай рельссиз транспорт воситаларига нисбатан имтиёзга эга бўлмаган ҳолат:'],
  ['Бир изли темир йўл кесишмасигa яқинлашаётганлиги ҳақида', 'Бир изли темир йўл кесишмасига яқинлашаётганлиги ҳақида'],
  ['Тартибга солувчининг мазкур ишораси қyйидагини билдиради:', 'Тартибга солувчининг мазкур ишораси қуйидагини билдиради:'],
  ['Xеч қайси бирига', 'Ҳеч қайси бирига'],
  ["Tibbiyot qutichasi va o't o'chirgich bo'lmagan qanday trasnport vositalaridan foynadalanish taqiqlanadi?", "Tibbiyot qutichasi va o't o'chirgich bo'lmagan qanday transport vositalaridan foydalanish taqiqlanadi?"],
  ['Тиббиёт қутичаси ва ўт ўчиргич бўлмаган қандай траснпорт воситаларидан фойнадаланиш тақиқланади?', 'Тиббиёт қутичаси ва ўт ўчиргич бўлмаган қандай транспорт воситаларидан фойдаланиш тақиқланади?'],
  ['Фақат « N2; N3 » тоифали траснпорт воситаcи', 'Фақат «N2; N3» тоифали транспорт воситаси'],
  ['Фақат « M2; M3; N1 » тоифали траснпорт воситаcи', 'Фақат «M2; M3; N1» тоифали транспорт воситаси'],
  ['Фақат « M1 » тоифали траснпорт воситаcи', 'Фақат «M1» тоифали транспорт воситаси'],
  ['Не более 20 человекss', 'Не более 20 человек'],
  ['В каком направлени разрешено движение?', 'В каком направлении разрешено движение?'],
  ['Толькo прямо и направо', 'Только прямо и направо'],
  ['Толькo прямо', 'Только прямо'],
  ['Қайси жавобда pyxcат берилган ҳаракат йўналиши тўғри кўрсатилган?', 'Қайси жавобда рухсат берилган ҳаракат йўналиши тўғри кўрсатилган?'],
  ["Quyidagi shaxslarga xavfsizlik kamarini (kanstruksiyasida xavfsizlik kamari nazarda tutilgan transport vositalarida)taqmaslikga ruxsat beriladi:", "Quyidagi shaxslarga xavfsizlik kamarini (konstruksiyasida xavfsizlik kamari nazarda tutilgan transport vositalarida) taqmaslikka ruxsat beriladi:"],
  ['Қуйидаги шахсларга хавфсизлик камарини (канструкциясида хавфсизлик камари назарда тутилган транспорт воситаларида)тақмасликга рухсат берилади:', 'Қуйидаги шахсларга хавфсизлик камарини (конструкциясида хавфсизлик камари назарда тутилган транспорт воситаларида) тақмасликка рухсат берилади:'],
  ['Санаб ўтилган ҳолaтларнинг қайси бирида қоидалар ҳайдовчи ўзининг транспорт воситасини ички ишлар ходими ихтиёрига бериши шарт?', 'Санаб ўтилган ҳолатларнинг қайси бирида қоидалар ҳайдовчи ўзининг транспорт воситасини ички ишлар ходими ихтиёрига бериши шарт?'],
  ['Белгилардан қайси бири қатнов қисми кесишмаси ҳудудини билдирaди?', 'Белгилардан қайси бири қатнов қисми кесишмаси ҳудудини билдиради?'],
  ['Как изменяется поле зрение водителя с увелечением скорости движения?', 'Как изменяется поле зрения водителя с увеличением скорости движения?'],
  ['Какой знак предупреждает водителя об оборудования огородительным устройством железнодорожного переезда?', 'Какой знак предупреждает водителя об оборудовании огородительным устройством железнодорожного переезда?'],
  ['Не более какой высоты может располагатьсягруз на багажнике, установленном накрыше легкового автомобиля (кромеперевозки велосипедов со специальнымиприспособлениями)?', 'Не более какой высоты может располагаться груз на багажнике, установленном на крыше легкового автомобиля (кроме перевозки велосипедов со специальными приспособлениями)?'],
  ['Какой из нижеперечисленных ответов даетправильное определение термина «пассажир»?', 'Какой из нижеперечисленных ответов дает правильное определение термина «пассажир»?'],
  ['Все лица находящиеся втранспортном средстве', 'Все лица, находящиеся в транспортном средстве'],
  ['Лицо, кроме водителя, находящеесяв транспортном средстве (кромеводителя), а также лицо, котороевходит в транспортное средство(садится на него) или выходит изтранспортного средства (сходит снего)', 'Лицо, кроме водителя, находящееся в транспортном средстве (кроме водителя), а также лицо, которое входит в транспортное средство (садится на него) или выходит из транспортного средства (сходит с него)'],
  ['Какие транспортного средства нарушает правило остановки в населённых пунктах?', 'Водитель какого транспортного средства нарушает правило остановки в населённых пунктах?'],
  ["Qaysi belgi Qoidalarning aholi punktlarida harakatlanish tartibini belgilaydigan talablarning bekor kilinishini ko'rsatadi?", "Qaysi belgi Qoidalarning aholi punktlarida harakatlanish tartibini belgilaydigan talablarning bekor qilinishini ko'rsatadi?"],
  ['Қайси белги Қоидаларнинг аҳоли пунктларида ҳаракатланиш тартибини белгилайдиган талабларнинг бекор килинишини кўрсатади?', 'Қайси белги Қоидаларнинг аҳоли пунктларида ҳаракатланиш тартибини белгилайдиган талабларнинг бекор қилинишини кўрсатади?'],
  ["Falokat yorig'lik ishoralari yoqishi,,agar u yo'q yoki nosoz bo'lsa, falokat sababli to'xtash belgisi aholi punktlarida transport vositasidan 15 metrdan, ulardan tashqarida esa 30 metrdan kam bo'lmasligi masofasida o'rnatishi kerak", "Falokat yorug'lik ishoralari yoqishi, agar u yo'q yoki nosoz bo'lsa, falokat sababli to'xtash belgisi aholi punktlarida transport vositasidan 15 metrdan, ulardan tashqarida esa 30 metrdan kam bo'lmasligi masofasida o'rnatishi kerak"],
  ["Falokat yorug'lik ishoralari yoqishi,,agar u yo'q yoki nosoz bo'lsa, falokat sababli to'xtash belgisi aholi punktlarida transport vositasidan 15 metrdan, ulardan tashqarida esa 30 metrdan kam bo'lmasligi masofasida o'rnatishi kerak", "Falokat yorug'lik ishoralari yoqishi, agar u yo'q yoki nosoz bo'lsa, falokat sababli to'xtash belgisi aholi punktlarida transport vositasidan 15 metrdan, ulardan tashqarida esa 30 metrdan kam bo'lmasligi masofasida o'rnatishi kerak"],
  ['Фалокат ёруғлик ишоралари ёқиши,агар у йўқ ёки носоз бўлса, фалокат сабабли тўхташ белгиси аҳоли пунктларида транспорт воситасидан 15 метрдан, улардан ташқарида эса 30 метрдан кам бўлмаслиги масофасида ўрнатиши керак', 'Фалокат ёруғлик ишоралари ёқиши, агар у йўқ ёки носоз бўлса, фалокат сабабли тўхташ белгиси аҳоли пунктларида транспорт воситасидан 15 метрдан, улардан ташқарида эса 30 метрдан кам бўлмаслиги масофасида ўрнатиши керак'],
  ["Yengil avtomobilning tom qismiga o'rnatilgan yukhonasida yukning balandligi(maxsusmoslamalar bilan mustahkamlangan holda velosipedlarni tashish bundan mustasno) necha metrdan oshmasligi kerak ?", "Yengil avtomobilning tom qismiga o'rnatilgan yukxonasida yukning balandligi (maxsus moslamalar bilan mustahkamlangan holda velosipedlarni tashish bundan mustasno) necha metrdan oshmasligi kerak?"],
  ['Енгил автомобилнинг том қисмига ўрнатилганюкҳонасида юкнинг баландлиги(махсусмосламалар билан мустаҳкамланган ҳолдавелосипедларни ташиш бундан мустасно) нечаметрдан ошмаслиги керак ?', 'Енгил автомобилнинг том қисмига ўрнатилган юкхонасида юкнинг баландлиги (махсус мосламалар билан мустаҳкамланган ҳолда велосипедларни ташиш бундан мустасно) неча метрдан ошмаслиги керак?'],
  ["Shatakka olingan  transport vositasini falokat yorug'lik  ishoralari  nosoz bo'lganda transport vositasi qanday  belgilanishi  kerak?", "Shatakka olingan transport vositasini falokat yorug'lik ishoralari nosoz bo'lganda transport vositasi qanday belgilanishi kerak?"],
  ["Yo'l patrul xizmati hodimlariga yo'l harakati qatnashchilari bilan o'zaro munosabatlari va maxsus moslamalardan foydalanishda nizom to'grisidagi qonunda qanday tartib qo'yilgan ?", "Yo'l patrul xizmati xodimlariga yo'l harakati qatnashchilari bilan o'zaro munosabatlari va maxsus moslamalardan foydalanishda nizom to'g'risidagi qonunda qanday tartib qo'yilgan?"],
  ['Йўл патруль ҳизмат ҳодимларига йў л ҳаракат қатнашчилари билан ўзаро муносабатлари ва махсуз мосламалардан фойдаланишда низом тўгррисидаги қонунда қандай тартиб қўйилган ?', 'Йўл патруль хизмати ходимларига йўл ҳаракати қатнашчилари билан ўзаро муносабатлари ва махсус мосламалардан фойдаланишда низом тўғрисидаги қонунда қандай тартиб қўйилган?'],
  ['агар улар йўқ бўlca шлагбаумгача', 'агар улар йўқ бўлса шлагбаумгача'],
  ['Aҳоли пунктларидан ташқарида қайси автомобиль тўхтаб туриш қоидасини бузмади?', 'Аҳоли пунктларидан ташқарида қайси автомобиль тўхтаб туриш қоидасини бузмади?'],
  ['Hаправлении A', 'Направлении A'],
  ['Hаправлении B', 'Направлении B'],
  ['Oлдида транспорт воситаси тўхтаб турган тартибга солинмайдиган пиёдалар ўтиш жойига яқинлашиб келмоқдасиз, Сиз нима қилишингиз керак?', 'Олдида транспорт воситаси тўхтаб турган тартибга солинмайдиган пиёдалар ўтиш жойига яқинлашиб келмоқдасиз, Сиз нима қилишингиз керак?'],
  ['Ушбу белгилардан қайси бири бир томонлама xаракат ташкил қилинган йўлнинг бошида ўpнатилади?', 'Ушбу белгилардан қайси бири бир томонлама ҳаракат ташкил қилинган йўлнинг бошида ўрнатилади?'],
  ['Ташилаётган юк ДЙҲХ хизматининг pухсатисиз транспорт воситаси ўлчамларининг орқа нуқтасидан энг катта миқдорда қандай чиқиб туриши мумкин?', 'Ташилаётган юк ДЙҲХ хизматининг рухсатисиз транспорт воситаси ўлчамларининг орқа нуқтасидан энг катта миқдорда қандай чиқиб туриши мумкин?'],
  ['Шy бўлакда олдинда кетаётган транспорт воситасининг ҳайдовчиси бурилишга (чапга қайта тизилишга) ишора бермаганлигига', 'Шу бўлакда олдинда кетаётган транспорт воситасининг ҳайдовчиси бурилишга (чапга қайта тизилишга) ишора бермаганлигига'],
  ['2-трамвай aйни вақтда 1-трамвай билан; кўк автомобил aйни вақтда қизил билан', '2-трамвай айни вақтда 1-трамвай билан; кўк автомобил айни вақтда қизил билан'],
  ['Aвтомобилни фақат ёнга силжиш еҳтимолининг олдини олади', 'Автомобилни фақат ёнга силжиш эҳтимолининг олдини олади'],
  ['Сиз баландликда светофорнинг рухсат берувчи ишорасини кyтиб тўхтадингиз. Бунда автомобильни жойида тyтиб туришнинг энг яхши усули:', 'Сиз баландликда светофорнинг рухсат берувчи ишорасини кутиб тўхтадингиз. Бунда автомобильни жойида тутиб туришнинг энг яхши усули:'],
  ['Биринчи yзатма уланган ҳолда уловчини жойдан жилмай айлантириш ҳисобига', 'Биринчи узатма уланган ҳолда уловчини жойдан жилмай айлантириш ҳисобига'],
  ['Юргизгич ўчирилиб, паст yзатма уланган ҳолда', 'Юргизгич ўчирилиб, паст узатма уланган ҳолда'],
  ['Йўл-транcпорт ҳодисаси рўй берганда', 'Йўл-транспорт ҳодисаси рўй берганда'],
  ['Kўприк ёки солда кечими бўлмаган сув тўсиқли йўл қисми борлигидан', 'Кўприк ёки солда кечими бўлмаган сув тўсиқли йўл қисми борлигидан'],
  ['Что обязан выполнить водитель транспортного средства приблизившись к перекрестку перед которым нанесена «cтоп-линия» и включен зеленый сигнал светофора?', 'Что обязан выполнить водитель транспортного средства, приблизившись к перекрестку, перед которым нанесена «стоп-линия» и включен зеленый сигнал светофора?'],
  ['Остановиться у «cтоп-линий», а затем возобновить движение', 'Остановиться у «стоп-линии», а затем возобновить движение'],
  ["Ko'rsatilgan yo'l belgilarining  qaysi birida eng kam tezlikda harakatlanish kerak ?", "Ko'rsatilgan yo'l belgilarining qaysi birida eng kam tezlikda harakatlanish kerak?"],
  ['Кўрсатилган йўл белгиларининг қайси бирида энг кам тезликда ҳаракатланиш керак ?', 'Кўрсатилган йўл белгиларининг қайси бирида энг кам тезликда ҳаракатланиш керак?'],
  ['Кому должен уступить дорогуъ водитель транспортного средства, движущийся на зеленый сигнал дополнительной секции одновременно с красным или желтым сигналом светофора?', 'Кому должен уступить дорогу водитель транспортного средства, движущийся на зеленый сигнал дополнительной секции одновременно с красным или желтым сигналом светофора?'],
  ['Транспортным средствам, движущиеся во встречном направлении на право или прямо.', 'Транспортным средствам, движущимся во встречном направлении направо или прямо.'],
  ['Включить задний противотуманные фонаре', 'Включить задние противотуманные фонари'],
  ['Махсуз тадбирлар ўтқазиш', 'Махсус тадбирлар ўтказиш'],
  ['Йўл транспорт ҳодисасини олдини олиш ва ҳаракат ҳафсизлигини таминлаш', 'Йўл-транспорт ҳодисасини олдини олиш ва ҳаракат хавфсизлигини таъминлаш'],
  [
    'Агар йўл бэлгилари ва чизиглари бошга йўналишни кўрсатмаган бўлса, ҳайдовчилар ажратувчи бўлаги бў маган икки\r\nтомониама ҳаракат ташкил этилган йўллардаги хавфсизлик оролчалари, устунчалар ва йўл иншооти қисмиари (кўприк, йўл ўтказгич\r\nустунлари ва шунга ўшашлар)ни қайси томондан айланиб ўтишлари кэрак?',
    'Агар йўл белгилари ва чизиқлари бошқа йўналишни кўрсатмаган бўлса, ҳайдовчилар ажратувчи бўлаги бўлмаган икки томонлама ҳаракат ташкил этилган йўллардаги хавфсизлик оролчалари, устунчалар ва йўл иншооти қисмлари (кўприк, йўл ўтказгич устунлари ва шунга ўхшашлар)ни қайси томондан айланиб ўтишлари керак?'
  ],
  ['Фақат чап томондан айланиб о тишлан кэрак', 'Фақат чап томондан айланиб ўтишлари керак'],
  ['Ҳар иккала томондан айланиб о тишлари кэрак', 'Ҳар иккала томондан айланиб ўтишлари керак'],
  ['Фақат ўнг томондан айланиб о тишлан кэрак', 'Фақат ўнг томондан айланиб ўтишлари керак'],
  [
    'Аҳоли яшаш жойларидан ташқаридаги икки томонлама ҳаракат ташкил этилган икки тасмали йўлларда тэзлигини соатига 50 киломэтрдан ошириши мумкин бўлмаган, шунингдэк, узунлиги 7 мэтрдан ортиқ бўлган транспорт воситаларининг (транспорт воситаларининг таркиби) ҳайдовчилари ўзи ва олдида ҳаракатланаётган транспорт воситаси орасида қанча масофани сақлашлари кэрак?',
    'Аҳоли яшаш жойларидан ташқаридаги икки томонлама ҳаракат ташкил этилган икки тасмали йўлларда тэзлигини соатига 50 километрдан ошириши мумкин бўлмаган, шунингдек, узунлиги 7 метрдан ортиқ бўлган транспорт воситаларининг (транспорт воситаларининг таркиби) ҳайдовчилари ўзи ва олдида ҳаракатланаётган транспорт воситаси орасида қанча масофани сақлашлари керак?'
  ],
  [
    'Уларни қувиб ўтаётган транспорт воситалари олдин эгаллаган қаторига бэмалол қайта тизилиши учун имкон бэрадиган масофани сақлашлари кэрак',
    'Уларни қувиб ўтаётган транспорт воситалари олдин эгаллаган қаторига бемалол қайта тизилиши учун имкон берадиган масофани сақлашлари керак'
  ],
  ['Имтиёз бэлгилари қайси жойларда ҳаракатланиш навбатини бэлгилайди?', 'Имтиёз белгилари қайси жойларда ҳаракатланиш навбатини белгилайди?'],
  ['Фақат ё Ининг тор қисмиарида', 'Фақат ёки унинг тор қисмларида'],
  ['Кайси ётик йул чизиги баланд пиёдалар утиш жойини билдиради?', 'Қайси ётик йўл чизиғи баланд пиёдалар ўтиш жойини билдиради?'],
  ['Ушбу ётик йул чизиги кайси гурух йул белгиларини такрорлайди?', 'Ушбу ётик йўл чизиғи қайси гуруҳ йўл белгиларини такрорлайди?'],
  ['Қайси ётик йўл чизиғи автомобил йблларида 3D куринишидаги баланд пиёдалар утиш жойини билдиради?', 'Қайси ётик йўл чизиғи автомобил йўлларида 3D кўринишидаги баланд пиёдалар ўтиш жойини билдиради?'],
  ['Кўрсатилган йўналишларида харакакатланишни тақиқланади', 'Кўрсатилган йўналишларида ҳаракатланиш тақиқланади'],
  ['Ушбу белги ахоли пунктларида хавфли йул кисми бошланишидан канча масофа олдин урнатилади?', 'Ушбу белги аҳоли пунктларида хавфли йўл қисми бошланишидан қанча масофа олдин ўрнатилади?'],
  ['Хавфли йул кисми олдига брнатилади', 'Хавфли йўл қисми олдига ўрнатилади'],
  ['Кайси белгиларда ойнинг жуфт кунларида тухташ мумкин', 'Қайси белгиларда ойнинг жуфт кунларида тўхташ мумкин'],
  ['Куйидаги таъриф "транспорт воситаси харакатини 10 дакикагача булган муддатга тухтатиш (харакатсиз холатга келтириш)" кайси атамага тегишли?', 'Қуйидаги таъриф "транспорт воситаси ҳаракатини 10 дақиқагача бўлган муддатга тўхтатиш (ҳаракатсиз ҳолатга келтириш)" қайси атамага тегишли?'],
  ['Ушбу транспорт воситасига чорраха оркали кайси иўналишлар буйича харакатланишга рухсат этилади?', 'Ушбу транспорт воситасига чорраҳа орқали қайси йўналишлар бўйича ҳаракатланишга рухсат этилади?'],
  ['Кайси расмдаги хайдовчилар тухташ коидасини буздилар?', 'Қайси расмдаги ҳайдовчилар тўхташ қоидасини буздилар?'],
  ['йўналтиргичлар билан курсатилган кайси йуналишларда харакат рухсат этилган?', 'йўналтиргичлар билан кўрсатилган қайси йўналишларда ҳаракат рухсат этилган?'],
  ['Кайси ёналишда ҳаракатланиш тақиқланади?', 'Қайси йўналишда ҳаракатланиш тақиқланади?'],
  ['Кайси расмда пиёдаларнинг ташкилий жамланмаси йулнинг катнов кисмида коидани бузмай харакатланмокда?', 'Қайси расмда пиёдаларнинг ташкилий жамланмаси йўлнинг қатнов қисмида қоидани бузмай ҳаракатланмоқда?'],
  ['Кайси расмларда кувиб утиш курсатилган?', 'Қайси расмларда қувиб ўтиш кўрсатилган?'],
  ['Ушбу вазиятда кайси транспорт воситасининг хайдовчиси йул бериши керак?', 'Ушбу вазиятда қайси транспорт воситасининг ҳайдовчиси йўл бериши керак?'],
  ['Ушбу вазиятда ким йул бериши керак?', 'Ушбу вазиятда ким йўл бериши керак?'],
  ['Кайси автомобил хайдовчиси йул бериши керак?', 'Қайси автомобил ҳайдовчиси йўл бериши керак?'],
  ['Кўрсатилган кайси белгилар фақат шу ўрнатилган бўлакни ўзига таъсир қилади?', 'Кўрсатилган қайси белгилар фақат шу ўрнатилган бўлакни ўзига таъсир қилади?'],
  ['Ушбу кушимча ахборот белгиси кайси йул белгиси билан кулланилади?', 'Ушбу қўшимча ахборот белгиси қайси йўл белгиси билан қўлланилади?'],
  ['Кайси транспорт воситасининг хайдовчиси ахоли пунктларида тухташ коидасини бузмокда?', 'Қайси транспорт воситасининг ҳайдовчиси аҳоли пунктларида тўхташ қоидасини бузмоқда?'],
  ['Вактинчалик тамирлаш ишлари олиб борилаётган йул кисмларига', 'Вақтинча таъмирлаш ишлари олиб борилаётган йўл қисмларига'],
  ['Доимий ва вактинчалик йул белгилари марно жихатидан бир бирини инкор этганда кайси бирига амал киласиз?', 'Доимий ва вақтинча йўл белгилари мано жиҳатида бир-бирига зид келганда қайси бирига амал қиласиз?'],
  ['Куйидаги 3.24. "Юкори тезлик чекланган" йул белгисининг тасирини кайси белгилар бекор килади?', 'Қуйидаги 3.24. "Юқори тезлик чекланган" йўл белгисининг таъсирини қайси белгилар бекор қилади?'],
  [
    "Agar yo'l belgilari va chiziglari boshga yo'nalishni ko'rsatmagan bo'lsa, haydovchilar ajratuvchi bo'lagi bo' magan ikki tomoniama harakat tashkil etilgan yo'llardagi xavfsizlik orolchalari, ustunchalar va yo'l inshooti qismiari (ko'prik, yo'l o'tkazgich ustunlari va shunga o'shashlar)ni qaysi tomondan aylanib o'tishlari kerak?",
    "Agar yo'l belgilari va chiziqlari boshqa yo'nalishni ko'rsatmagan bo'lsa, haydovchilar ajratuvchi bo'lagi bo'lmagan ikki tomonlama harakat tashkil etilgan yo'llardagi xavfsizlik orolchalari, ustunchalar va yo'l inshooti qismlari (ko'prik, yo'l o'tkazgich ustunlari va shunga o'xshashlar)ni qaysi tomondan aylanib o'tishlari kerak?"
  ],
  ['Faqat chap tomondan aylanib o tishlan kerak', "Faqat chap tomondan aylanib o'tishlari kerak"],
  ['Har ikkala tomondan aylanib o tishlari kerak', "Har ikkala tomondan aylanib o'tishlari kerak"],
  ['Faqat o\'ng tomondan aylanib o tishlan kerak', "Faqat o'ng tomondan aylanib o'tishlari kerak"],
  [
    'Если дорожные знаки и полосы не указывают направление на голову, водители могут использовать две полосы движения без разделительной полосы. по направлению движения организованы островки безопасности на дорогах, опоры и часть дорожного сооружения (мост, эстакада столбы и тому подобное)с какой стороны они должны обойти?',
    'Если дорожные знаки и разметка не указывают иное направление, с какой стороны водители должны объезжать островки безопасности, столбы и дорожные сооружения (мосты, эстакады и тому подобное) на дорогах с двусторонним движением без разделительной полосы?'
  ],
  ['Вам просто нужно обойти левую сторону и укусить', 'Объезжать только с левой стороны'],
  ['С обеих сторон должны быть закругленные зубы', 'Объезжать с обеих сторон'],
  ['Вам просто нужно обойти и укусить с правой стороны', 'Объезжать только с правой стороны']
];

const targetedFixes = [
  {
    globalId: 't_33_q_8',
    apply(question) {
      const option = question.content.ru.options.find((item) => item.id === 3);
      if (option && option.text === 'Водитель синего автомобиля') {
        option.text = 'Водитель красного автомобиля';
        return 1;
      }
      return 0;
    }
  },
  {
    globalId: 't_28_q_20',
    apply(question) {
      const option = question.content.ru.options.find((item) => item.id === 3);
      if (option && option.text === '«Б» и «Г»') {
        option.text = '«Б» или «В»';
        return 1;
      }
      return 0;
    }
  },
  {
    globalId: 't_48_q_14',
    apply(question) {
      const option = question.content.ru.options.find((item) => item.id === 1);
      if (option && option.text === 'Водитель грузового автомобиля водителю трактора') {
        option.text = 'Водитель трактора водителю грузового автомобиля';
        return 1;
      }
      return 0;
    }
  },
  {
    globalId: 't_50_q_16',
    apply(question) {
      const option3 = question.content.ru.options.find((item) => item.id === 3);
      const option4 = question.content.ru.options.find((item) => item.id === 4);
      let changes = 0;

      if (option3 && option3.text === 'Указывает расстояние до ближайшего') {
        option3.text = 'Указывает расстояние до ближайшего населенного пункта';
        changes += 1;
      }

      if (option4 && option4.text === 'Указывает расстояние до ближайшего') {
        option4.text = 'Указывает расстояние до ближайшего отделения ДАН';
        changes += 1;
      }

      return changes;
    }
  },
  {
    globalId: 't_57_q_1',
    apply(question) {
      const uzLat = question.content.uz_lat.options.find((item) => item.id === 2);
      const uzCyr = question.content.uz_cyr.options.find((item) => item.id === 2);
      let changes = 0;

      if (uzLat && uzLat.text === "Yara o'ta darajada ifloslanganda yaraning butun yuzasiga surtish uchun") {
        uzLat.text = "Birinchi darajadagi kimyoviy kuyishda teriga surtish uchun";
        changes += 1;
      }

      if (uzCyr && uzCyr.text === 'Яра ўта даражада ифлосланганда яранинг бутун юзасига суртиш учун') {
        uzCyr.text = 'Биринчи даражали кимёвий куйишда терига суртиш учун';
        changes += 1;
      }

      return changes;
    }
  }
];

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function isWordLike(value) {
  return /^[\p{L}\p{N}'‘’ʻʼ-]+$/u.test(value);
}

function replaceAllLiteral(source, from, to) {
  if (!from || from === to) {
    return { value: source, count: 0 };
  }

  const count = source.split(from).length - 1;
  if (count === 0) {
    return { value: source, count: 0 };
  }

  return { value: source.split(from).join(to), count };
}

function replaceToken(source, from, to) {
  if (!from || from === to) {
    return { value: source, count: 0 };
  }

  const pattern = new RegExp(`(^|[^\\p{L}\\p{N}'‘’ʻʼ-])(${escapeRegExp(from)})(?=$|[^\\p{L}\\p{N}'‘’ʻʼ-])`, 'gu');
  let count = 0;
  const value = source.replace(pattern, (match, prefix) => {
    count += 1;
    return `${prefix}${to}`;
  });

  return { value, count };
}

function normalizeText(source) {
  let value = source;
  let count = 0;

  const normalizers = [
    [/^ +/, ''],
    [/y+yetar/gi, 'yetar'],
    [/й+yетар/gi, 'йетар'],
    [/йў л/gu, 'йўл'],
    [/\r\n/gu, ' '],
    [/\r/gu, ' '],
    [/\u000b+(?=$)/gu, ''],
    [/\u000b+/gu, ' '],
    [/ +\?/g, '?'],
    [/ {2,}/g, ' ']
  ];

  for (const [pattern, replacement] of normalizers) {
    value = value.replace(pattern, (match) => {
      const nextValue = typeof replacement === 'function' ? replacement(match) : replacement;
      if (match !== nextValue) {
        count += 1;
      }
      return nextValue;
    });
  }

  return { value, count };
}

function applyStringReplacements(input, stats) {
  let value = input;

  for (const [from, to] of exactReplacements) {
    const result = replaceAllLiteral(value, from, to);
    value = result.value;
    stats.exact += result.count;
  }

  for (const [from, to] of tokenReplacements) {
    const result = isWordLike(from)
      ? replaceToken(value, from, to)
      : replaceAllLiteral(value, from, to);
    value = result.value;
    stats.token += result.count;
  }

  for (const [from, to] of substringReplacements) {
    const result = replaceAllLiteral(value, from, to);
    value = result.value;
    stats.substring += result.count;
  }

  const normalized = normalizeText(value);
  value = normalized.value;
  stats.normalized += normalized.count;

  return value;
}

function walk(node, stats) {
  if (typeof node === 'string') {
    return applyStringReplacements(node, stats);
  }

  if (Array.isArray(node)) {
    return node.map((item) => walk(item, stats));
  }

  if (node && typeof node === 'object') {
    for (const key of Object.keys(node)) {
      node[key] = walk(node[key], stats);
    }
  }

  return node;
}

function applyTargetedFixes(data, stats) {
  for (const fix of targetedFixes) {
    const question = data.find((item) => item.task_info && item.task_info.global_id === fix.globalId);
    if (!question) {
      continue;
    }

    stats.targeted += fix.apply(question);
  }
}

function removePendingArtifacts() {
  if (fs.existsSync(backupPath)) {
    fs.unlinkSync(backupPath);
  }

  if (fs.existsSync(diffPath)) {
    fs.unlinkSync(diffPath);
  }
}

function writeDiffFile() {
  const diffResult = spawnSync(
    'git',
    ['--no-pager', 'diff', '--no-index', '--', backupPath, filePath],
    { encoding: 'utf8' }
  );

  if (diffResult.error) {
    fs.writeFileSync(
      diffPath,
      [
        'Unable to generate git diff automatically.',
        `Original backup: ${backupPath}`,
        `Updated file: ${filePath}`
      ].join('\n') + '\n',
      'utf8'
    );
    return;
  }

  const diffText = diffResult.stdout || 'No textual diff generated.\n';
  fs.writeFileSync(diffPath, diffText, 'utf8');
}

function deepClone(value) {
  return JSON.parse(JSON.stringify(value));
}

function collectStringPatches(before, after, patches) {
  if (typeof before === 'string' && typeof after === 'string') {
    if (before !== after) patches.push({ from: before, to: after });
    return;
  }
  if (Array.isArray(before) && Array.isArray(after)) {
    for (let i = 0; i < before.length; i += 1) {
      collectStringPatches(before[i], after[i], patches);
    }
    return;
  }
  if (before && after && typeof before === 'object' && typeof after === 'object') {
    for (const key of Object.keys(before)) {
      collectStringPatches(before[key], after[key], patches);
    }
  }
}

function applyPatchesToSource(source, patches) {
  const sorted = [...patches].sort((a, b) => b.from.length - a.from.length);
  let text = source;
  for (const { from, to } of sorted) {
    if (from === to || !text.includes(from)) continue;
    text = text.split(from).join(to);
  }
  return text;
}

function applyToFile(targetPath, options = {}) {
  const { skipBackup = false } = options;
  const rel = path.relative(publicRoot, targetPath).replace(/\\/g, '/');
  const backup = `${targetPath}.pending-fix.bak`;
  const diff = `${targetPath}.pending-fix.diff`;

  if (!skipBackup && fs.existsSync(backup)) {
    console.error(`Pending fix exists for ${rel}. Run keep or undo first.`);
    return { skipped: true };
  }

  const source = fs.readFileSync(targetPath, 'utf8');
  const original = JSON.parse(source);
  const modified = deepClone(original);
  const stats = { exact: 0, token: 0, substring: 0, targeted: 0, normalized: 0 };

  walk(modified, stats);
  applyTargetedFixes(modified, stats);

  const patches = [];
  collectStringPatches(original, modified, patches);

  if (!patches.length) {
    console.log(`No changes: ${rel}`);
    return { changed: false, stats };
  }

  let nextText = applyPatchesToSource(source, patches);
  try {
    JSON.parse(nextText);
  } catch (err) {
    console.warn(`Patch broke JSON for ${rel}, falling back to stringify: ${err.message}`);
    nextText = `${JSON.stringify(modified, null, 4)}\n`;
  }

  if (nextText === source) {
    console.log(`No changes: ${rel}`);
    return { changed: false, stats };
  }

  if (!skipBackup) {
    fs.copyFileSync(targetPath, backup);
  }
  fs.writeFileSync(targetPath, nextText, 'utf8');

  if (!skipBackup) {
    const diffResult = spawnSync(
      'git',
      ['--no-pager', 'diff', '--no-index', '--', backup, targetPath],
      { encoding: 'utf8' }
    );
    fs.writeFileSync(diff, diffResult.stdout || 'No diff.\n', 'utf8');
  }

  const total = stats.exact + stats.token + stats.substring + stats.targeted + stats.normalized;
  console.log(`Updated ${rel}: ${total} changes (exact=${stats.exact}, token=${stats.token}, substring=${stats.substring}, normalized=${stats.normalized})`);
  return { changed: true, stats };
}

function main() {
  const batchDir = path.resolve(publicRoot, targetRelPath);
  if (fs.existsSync(batchDir) && fs.statSync(batchDir).isDirectory()) {
    if (command !== 'apply') {
      console.error('Batch keep/undo not supported; run per-file or apply batch only.');
      process.exitCode = 1;
      return;
    }
    const files = fs.readdirSync(batchDir)
      .filter((name) => isQuestionJsonFile(name))
      .map((name) => path.join(batchDir, name))
      .sort();
    let changed = 0;
    for (const fp of files) {
      const result = applyToFile(fp, { skipBackup: true });
      if (result && result.changed) changed += 1;
    }
    console.log(`\nBatch done: ${changed}/${files.length} files updated in ${relativeTargetPath}`);
    return;
  }

  if (!fs.existsSync(filePath)) {
    console.error(`Target file not found: ${relativeTargetPath}`);
    process.exitCode = 1;
    return;
  }

  if (command === 'keep') {
    if (fs.existsSync(backupPath)) {
      removePendingArtifacts();
      console.log(`Pending ${targetFileName} fix kept. Backup removed.`);
    } else {
      console.log(`No pending ${targetFileName} backup found. Nothing to keep.`);
    }
    return;
  }

  if (command === 'undo') {
    if (!fs.existsSync(backupPath)) {
      console.log(`No pending ${targetFileName} backup found. Nothing to undo.`);
      return;
    }

    fs.copyFileSync(backupPath, filePath);
    removePendingArtifacts();
    console.log(`Pending ${targetFileName} fix undone. Original file restored.`);
    return;
  }

  if (command !== 'apply') {
    console.error('Unknown command. Use: apply, keep, or undo');
    process.exitCode = 1;
    return;
  }

  if (command === 'apply') {
    applyToFile(filePath, { skipBackup: true });
    return;
  }
}

main();