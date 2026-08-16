#!/usr/bin/env node
/**
 * O'zbek (lotin) imlo xatolarini tuzatadi — 2026-08 auditi.
 *
 * QANDAY TOPILGAN: "kam uchraydigan so'z + undan bitta harf bilan farq
 * qiluvchi ko'p uchraydigan so'z" tahlili (Levenshtein masofasi 1). Topilgan
 * 141 nomzodning HAR BIRI kontekstda qo'lda tekshirildi — o'zbek tili
 * agglutinativ bo'lgani uchun soxta signal ko'p edi (masalan `tomir urishi`,
 * `uzub-uzub bosish`, `solda kechimi`, `tovondan to tizzagacha` — bularning
 * hammasi TO'G'RI so'zlar va tegilmadi).
 *
 * Pastdagi ro'yxatga faqat o'zbek tilida MAVJUD BO'LMAGAN so'zlar
 * (yoki bir fayl ichidagi aniq nomuvofiqlik) kiritilgan.
 *
 * MUHIM: detektor taklifiga ko'r-ko'rona ishonilmadi. Masalan `xo'l` uchun u
 * `yo'l` ni taklif qildi, lekin kontekst ("quruq asfalt ... xo'l asfalt")
 * to'g'ri so'z `ho'l` ekanini ko'rsatdi.
 *
 * Ishlatish:
 *   node scripts/question-tools/fix-uz-spelling-2026-08.cjs        # ko'rish (dry-run)
 *   node scripts/question-tools/fix-uz-spelling-2026-08.cjs apply  # yozish
 */

const fs = require('fs');
const path = require('path');

const PUBLIC_DIR = path.resolve(__dirname, '..', '..', 'public');
const APPLY = process.argv.includes('apply');

/** Matnda uchraydigan barcha apostrof ko'rinishlari (manba turlicha yozilgan) */
const APO = "['ʻʼ‘’`]";
/**
 * So'z ichida hisoblanadigan belgilar — chegara shular BO'LMAGAN joyda.
 *
 * KIRILL HARFLARI ALBATTA BO'LISHI KERAK. Ular bo'lmaganda chegara tekshiruvi
 * kirillcha so'zlarda UMUMAN ishlamaydi va qisqa so'zlar boshqa so'z ICHIGA
 * tushib ketadi. Masalan `кор` -> `қор` qoidasi `скорость` so'zini
 * `сқорость` ga aylantirib, 2369 joyda matnni buzardi.
 */
const WORD_CHAR = "A-Za-zА-Яа-яЁёЎўҚқҒғҲҳʻʼ‘’'`";

/**
 * `apo: true` — so'zdagi apostrof o'rni ushlanadi va almashtirishda
 * ASL ko'rinishi saqlanadi (fayllar ' va ' ni aralash ishlatadi).
 */
const FIXES = [
  // --- Foydalanuvchi xabar bergan ---
  { bad: 'puxsatisiz',       good: 'ruxsatisiz',      why: "ruxsat (ruscha: без разрешения)" },

  // --- Mavjud bo'lmagan so'zlar ---
  { bad: 'uchunchi',         good: 'uchinchi',        why: "to'g'ri shakli 'uchinchi'" },
  { bad: 'qmsmida',          good: 'qismida',         why: 'harflar almashib ketgan' },
  { bad: 'punktlaridpn',     good: 'punktlaridan',    why: 'a -> p' },
  { bad: 'punklaridan',      good: 'punktlaridan',    why: "'t' tushib qolgan" },
  { bad: 'vaziyatdas',       good: 'vaziyatda',       why: "ortiqcha 's'" },
  { bad: 'chorahalarda',     good: 'chorrahalarda',   why: "ikkinchi 'r' tushib qolgan" },
  { bad: 'ogohlatiruvchi',   good: 'ogohlantiruvchi', why: "'n' tushib qolgan" },
  { bad: 'tezliqda',         good: 'tezlikda',        why: 'q -> k' },
  { bad: 'quidagi',          good: 'quyidagi',        why: "'y' tushib qolgan" },
  { bad: 'xolda',            good: 'holda',           why: 'x -> h' },
  { bad: 'asasan',           good: 'asosan',          why: 'a -> o' },
  { bad: 'veloseped',        good: 'velosiped',       why: 'e -> i' },
  { bad: 'qatiy',            good: "qat'iy",          why: 'apostrof tushib qolgan' },
  { bad: 'etarlicha',        good: 'yetarlicha',      why: "'y' tushib qolgan" },
  { bad: 'qayirilish',       good: 'qayrilish',       why: "ortiqcha 'i'" },
  { bad: 'avtommobillarida', good: 'avtomobillarida', why: "ikkilangan 'm'" },
  { bad: 'tovuch',           good: 'tovush',          why: 'ch -> sh' },
  { bad: 'polisiya',         good: 'politsiya',       why: "to'g'ri shakli 'politsiya'" },
  { bad: 'burulishga',       good: 'burilishga',      why: "to'g'ri o'zak 'buril-'" },

  // --- Apostrofli so'zlar (asl apostrof ko'rinishi saqlanadi) ---
  { bad: "ko'rsatigan", good: "ko'rsatilgan", apo: true, why: "'l' tushib qolgan" },
  { bad: "o'tilan",     good: "o'tilgan",     apo: true, why: "'g' tushib qolgan" },
  { bad: "yo'lnig",     good: "yo'lning",     apo: true, why: 'harflar almashgan' },
  // DIQQAT: detektor 'yo'l' ni taklif qilgan, lekin kontekst
  // ("quruq asfalt ... xo'l asfalt") to'g'ri so'z 'ho'l' ekanini ko'rsatdi.
  { bad: "xo'l",        good: "ho'l",         apo: true, why: "quruq/ho'l asfalt — x -> h" },

  // --- Bitta fayl ichidagi nomuvofiqlik (belgilar.json) ---
  // Shu faylning o'zida 'taqiqlangan' 1049 marta, 'ta'qiqlangan' 7 marta.
  { bad: "ta'qiqlangan", good: 'taqiqlangan', apo: true, why: 'apostrofsiz shakl standart' },
  { bad: "ta'qiqlanadi", good: 'taqiqlanadi', apo: true, why: 'apostrofsiz shakl standart' },
  { bad: "ta'qiqlovchi", good: 'taqiqlovchi', apo: true, why: 'apostrofsiz shakl standart' },

  // ==========================================================================
  // 2-BOSQICH: apostrof (o' -> u) va h -> x buzilishlari.
  //
  // Bu 11 ta savolda uchraydi va DEPLOY QILINADIGAN fayllarga ham tushgan
  // (600.json/barcha.json dist dan chiqarilgan, lekin free-*/barcha-*/
  // variants/mavzuli2 ga o'sha xato matn ko'chgan).
  //
  // `stem: true` — so'z BOSHIDAN mos keladi, ya'ni barcha qo'shimchali
  // shakllar bir yo'la tuzatiladi (Chorraxa, Chorraxadan, chorraxani ...).
  // ==========================================================================
  { bad: 'chorrax',  good: 'chorrah',  stem: true, why: "x -> h (chorraha)" },
  { bad: 'yukori',   good: 'yuqori',   stem: true, why: 'k -> q (Yukoridagi ham)' },
  { bad: 'mayokcha', good: 'mayoqcha', stem: true, why: 'k -> q' },
  { bad: 'ulangich', good: 'ulagich',  stem: true, why: "ortiqcha 'n'" },
  { bad: 'burulish', good: 'burilish', stem: true, why: "to'g'ri o'zak 'buril-'" },
  { bad: 'tushurish', good: 'tushirish', stem: true, why: 'u -> i' },

  { bad: 'yokilgan', good: 'yoqilgan', why: 'k -> q' },
  { bad: 'bulib',    good: "bo'lib",   why: "u -> o' (apostrof tushgan)" },
  { bad: 'utadi',    good: "o'tadi",   why: "u -> o' (apostrof tushgan)" },
  { bad: 'ungdagi',  good: "o'ngdagi", why: "u -> o' (apostrof tushgan)" },
  { bad: 'manoga',   good: "ma'noga",  why: 'apostrof tushib qolgan' },
  { bad: 'yilt',     good: 'yalt',     why: "'yalt-yalt' standart shakl" },

  // ==========================================================================
  // 3-BOSQICH: harf almashinuvi sinflari.
  //
  // QANDAY TOPILGAN: har bir so'zning BIR POZITSIYASIDA tipik o'zbek
  // chalkashligi (x/h, k/q, g/q, u/o', o/o', a/e, i/u) qo'llanib variant
  // yasaldi. Agar variant korpusda 10 barobar ko'p uchrasa — xato.
  //
  // Soxta signallar kontekstda tashlab yuborildi: `bosimi` (shina bosimi),
  // `tirish` (o'tirish ichida), `ining` (tarmog'ining ichida), `dab`
  // (rasm fayl nomi ichida).
  // ==========================================================================
  { bad: 'xam',             good: 'ham',             why: 'x -> h' },
  { bad: 'xuquqini',        good: 'huquqini',        why: 'x -> h' },
  { bad: 'ortik',           good: 'ortiq',           why: 'k -> q' },
  { bad: 'sarik',           good: 'sariq',           why: 'k -> q' },
  { bad: 'tashqil',         good: 'tashkil',         why: 'q -> k' },
  { bad: 'ganday',          good: 'qanday',          why: 'g -> q' },
  { bad: 'gayrilib',        good: 'qayrilib',        why: 'g -> q' },
  { bad: 'gatorni',         good: 'qatorni',         why: 'g -> q' },
  { bad: 'bavosita',        good: 'bevosita',        why: 'a -> e' },
  { bad: 'ogohlantirivchi', good: 'ogohlantiruvchi', why: 'i -> u' },
  { bad: 'bulmagan',        good: "bo'lmagan",       why: "u -> o'" },
  { bad: 'utishni',         good: "o'tishni",        why: "u -> o'" },
  { bad: 'yolda',           good: "yo'lda",          why: "o -> o'" },
  { bad: "ko'rsatgichi",    good: "ko'rsatkichi",    apo: true, why: 'g -> k' },
  { bad: "bo'imining",      good: "bo'limining",     apo: true, why: "'l' tushib qolgan" },
  // "o'rindiq" ning ko'plik shakli: undosh qo'shimchadan oldin q YUMSHAMAYDI.
  // (Egalik shakli `o'rindig'i` esa TO'G'RI va tegilmaydi.)
  { bad: "o'rindig'lar",    good: "o'rindiqlar",     apo: true, why: "q -> g' xato yumshatish" },

  // ==========================================================================
  // 4-BOSQICH: bosh 'y' tushib qolgan so'zlar (`etarlicha` sinfi).
  //
  // DIQQAT — BU SINF NOZIK. O'zbekda ikkita boshqa o'zak bor:
  //   `etmoq`  (qilmoq)   -> `ruxsat etilgan`, `ta'sir etadi`  — 'y' KERAK EMAS
  //   `yetmoq` (yetishmoq)-> `yetarli`, `yetib borish`         — 'y' KERAK
  // Shuning uchun `etilgan` (944x), `etadi` (142x), `eng` (485x) ATAYLAB
  // tegilmadi — ular to'g'ri. Faqat quyidagilar kontekstda bir-bir tekshirildi.
  // ==========================================================================
  { bad: 'etarli', good: 'yetarli', stem: true, why: "yetmoq o'zagi — 'y' tushgan" },
  { bad: 'erda',   good: 'yerda',   why: "'Bu yerda' — 'y' tushgan" },
  { bad: 'er',     good: 'yer',     why: "'Yer usti/osti' — 'y' tushgan" },

  // ==========================================================================
  // 5-BOSQICH: tasodifiy qo'lda o'qishda topilganlar.
  // ==========================================================================
  { bad: 'suniy',    good: "sun'iy",    why: "apostrof tushgan (sun'iy yoritish)" },
  { bad: 'yorigich', good: 'yoritgich', stem: true, why: "'t' tushib qolgan" },

  // Standart shakl `ko'rsatkich` (korpusda ~350x), `ko'rsatgich` esa 78x.
  // Rasmiy atama ham "Axborot-ko'rsatkich belgilar".
  { bad: "ko'rsatgich", good: "ko'rsatkich", stem: true, apo: true, why: 'g -> k (standart shakl)' },
];

/**
 * Kirill va rus matnidagi ANIQ xatolar.
 *
 * Bular umumiy detektor bilan emas, tillararo solishtirish orqali topilgan:
 * bir savolning uch tilidagi matni yonma-yon qo'yilganda kirillcha variant
 * lotinchasiga mos kelmasligi ko'rindi.
 *
 * `ц` MASALASI: kirill alifbosida `ц` harfi BOR, shuning uchun `мотоцикл`
 * ni `мототсикл` deb yozish xato — bu lotinchadagi `ts` ning o'girilmay
 * qolgani. `ҳаракатсиз` va `кўрсатса` esa TO'G'RI (u yerda `т`+`с` alohida
 * o'zak va qo'shimcha) va tegilmadi.
 */

/**
 * Ibora darajasidagi tuzatishlar: bitta so'zning o'zi ikki xil ma'noda
 * ishlatilgani uchun so'z bo'yicha almashtirib bo'lmaydi.
 */
const PHRASE_FIXES = [
  // `yetib borish` (yetmoq) TO'G'RILANADI, lekin `yalt-yalt etib turuvchi`
  // (etmoq) TEGILMAYDI — ikkalasi ham "etib" so'zini ishlatadi.
  { bad: 'etib borish', good: 'yetib borish', why: "yetmoq o'zagi" },

  // Izohda "YHQ" o'rniga "HQ" yozilgan. Ibora sifatida tuzatiladi, chunki
  // oddiy `HQ` -> `YHQ` almashtirish TO'G'RI yozilgan `YHQ` ichiga ham
  // tushib, `YYHQ` hosil qilardi. Chap chegara tekshiruvi buni to'xtatadi.
  { bad: 'HQ 1-ilovasining', good: 'YHQ 1-ilovasining', why: "'Y' tushib qolgan" },
];

/**
 * Matn ichidagi tuzilmaviy nuqsonlar (aniq JSON satri bo'yicha almashtiriladi,
 * chunki xom faylga tegish JSON chekinishlarini buzardi).
 */
const TEXT_NORMALIZERS = [
  {
    label: "apostrofdan keyin ortiqcha bo'shliq",
    // `o‘ tirish` -> `o‘tirish`. FAQAT so'z bo'linib qolgan holat:
    // `yorug' vaqtida` / `sog' qismiga` TO'G'RI va tegilmaydi (ular tugagan so'z).
    apply: (s) => s.replace(/o(['‘’ʻʼ]) (tirish|rindiq)/g, 'o$1$2'),
  },
  {
    label: "ikkilangan bo'shliq",
    apply: (s) => s.replace(/ {2,}/g, ' '),
  },
  {
    label: 'yopilmagan qo\'shtirnoq (izoh boshida)',
    /**
     * Ba'zi izohlar `"` bilan boshlanib, hech qachon yopilmaydi — manba
     * ma'lumotidan qolgan iz. Foydalanuvchi uni ekranda ortiqcha belgi
     * sifatida ko'radi.
     *
     * FAQAT qo'shtirnoqlar soni TOQ bo'lganda va matn `"` bilan
     * boshlanganda olib tashlanadi — ya'ni juft-juft ishlatilgan
     * (to'g'ri) qo'shtirnoqlarga tegilmaydi.
     */
    apply: (s) => {
      if (!s.startsWith('"')) return s;
      const total = (s.match(/["“”]/g) || []).length;
      return total % 2 === 1 ? s.slice(1) : s;
    },
  },
  // ATAYLAB QO'SHILMAGAN: `"soz'` -> `"soz"` qoidasi.
  // O'zbekchada apostrof HARF (`to'xtash`, `yo'l`), shuning uchun bunday
  // qoida `"To'xtash joyi"` ni `"To"xtash joyi"` ga aylantirib, 419 joyda
  // matnni BUZARDI. Bunday holatlar qo'lda tuzatilishi kerak.
];

/**
 * Kirill va rus matnidagi ANIQ xatolar.
 *
 * Bular umumiy detektor bilan emas, tillararo solishtirish orqali topilgan:
 * bir savolning uch tilidagi matni yonma-yon qo'yilganda kirillcha variant
 * lotinchasiga mos kelmasligi ko'rindi.
 */
const CYR_RU_FIXES = [
  // t_32_q_8 — lotinchasi "Maxsus tovushli ishora yoqilgan"
  { bad: 'максус говушли ишора екилган', good: 'Махсус товушли ишора ёқилган',
    why: 'уч хато: максус/говушли/екилган + бош ҳарф' },
  // t_22_q_17 — savol "Последний, кто..." -> javob bosh kelishikda bo'lishi kerak.
  // Faqat shu bitta savolda uchraydi (6 nusxa), shuning uchun xavfsiz.
  { bad: 'Зеленым', good: 'Зелёный', why: 'творительный -> именительный падеж' },

  // --- Kirillda `ц` o'rniga `тс` (lotincha `ts` o'girilmagan) ---
  // `электромототсикл` ham shu qoida bilan tuzatiladi (ichida `мототсикл` bor).
  { bad: 'мототсикл',   good: 'мотоцикл',   raw: true, why: 'тс -> ц' },
  { bad: 'Мототсикл',   good: 'Мотоцикл',   raw: true, why: 'тс -> ц' },
  { bad: 'Мототсилкчи', good: 'Мотоциклчи', why: 'тс -> ц va harflar almashgan' },
  { bad: 'стсепление',  good: 'сцепление',  why: 'тс -> ц' },

  // t_38_q_13 — variant matniga "тоциклга"/"tosiklga" bo'lagi yopishib qolgan.
  // Ruscha varianti hal qildi: "Зеленому, красному и белому автомобилям" —
  // ya'ni motosikl umuman yo'q.
  { bad: 'avtomobilgatosiklga', good: 'avtomobilga', why: 'birikib ketgan bo\'lak' },
  { bad: 'автомобилгатоциклга', good: 'автомобилга', why: 'birikib ketgan bo\'lak' },

  // ==========================================================================
  // 7-BOSQICH: t_19_q_8 — SAVOL MATNI buzilgan, IZOH esa to'g'ri.
  // Izohdagi rasmiy belgi nomi (1.25.3) etalon sifatida olindi.
  // ==========================================================================
  // ==========================================================================
  // 9-BOSQICH: chuqur skanerda topilgan (qo'shni harflar almashishi,
  // ko'plik qo'shimchasi, tinish belgisi).
  // ==========================================================================
  { bad: 'qisimda',    good: 'qismida',     why: 'qo\'shni harflar almashgan (6x vs 414x)' },
  { bad: 'қисимда',    good: 'қисмида',     why: 'qo\'shni harflar almashgan (6x vs 414x)' },
  { bad: 'мотоциклар', good: 'мотоцикллар', stem: true, why: "ko'plik qo'shimchasi (12x vs 238x)" },

  // ==========================================================================
  // 10-BOSQICH: v53 va v54 variantlarini to'liq qo'lda o'qishda topilgan.
  // Har biri korpus chastotasi bilan tasdiqlangan.
  // ==========================================================================
  { bad: 'taqaqlanadi',  good: 'taqiqlanadi',  why: 'i -> a (6x vs 2386x)' },
  { bad: 'тақақланади',  good: 'тақиқланади',  why: 'и -> а (6x vs 2386x)' },
  { bad: 'qayrib',       good: 'qayrilib',     stem: true, why: "'-il-' tushgan (4x vs 994x)" },
  { bad: 'қайриб',       good: 'қайрилиб',     stem: true, why: "'-ил-' тушган (4x vs 994x)" },
  { bad: 'Istagan tomonidan',   good: 'Istalgan tomonidan',   why: 'istalgan = har qanday (4x vs 12x)' },
  { bad: 'Истаган томонидан',   good: 'Исталган томонидан',   why: 'исталган = ҳар қандай (4x vs 12x)' },
  // Kirillda `хавф` standart (1168x), `ҳавф` esa 26x — barcha shakllari bilan
  { bad: 'ҳавф',         good: 'хавф',         stem: true, why: 'ҳ -> х (26x vs 1168x)' },
  // Korpusda `tovush ishorasi` 54x, `Tovushli signal` 4x (ruscha o'zlashma)
  { bad: 'Tovushli signal berish', good: "Tovush ishorasini berish", why: 'atama: signal -> ishora' },
  { bad: 'Товушли сигнал бериш',   good: 'Товуш ишорасини бериш',   why: 'atama: сигнал -> ишора' },

  // ==========================================================================
  // 11-BOSQICH: v1, v2, v33, v34 ni to'liq qo'lda o'qishda topilganlar.
  // Batafsil dalillar: scripts/question-tools/topilgan-xatolar.json
  // HAR BIR tuzatish lotin VA kirill juftligi bilan birga qo'llanadi.
  // ==========================================================================

  // --- Atamalar (korpus ko'pchiligi bo'yicha) ---
  // O'ZAK bo'yicha: 6 xil shakl bor edi — `qattiq tirkagich`,
  // `qattiq tirkagichda`, `Egiluvchan tirkagich` va ularning kirillchasi.
  // O'zak tuzatilsa hammasi bir yo'la to'g'rilanadi.
  // DIQQAT: `tirkama` (tirkama = pritsep) BOSHQA so'z va tegilmaydi.
  { bad: 'tirkagich', good: 'ulagich', stem: true, why: '18x vs 473x (barcha shakllari)' },
  { bad: 'тиркагич',  good: 'улагич',  stem: true, why: '18x vs 473x (барча шакллари)' },
  { bad: 'pnevmatik uzatma',     good: 'pnevmatik yuritma',  stem: true, why: 'привод = yuritma; izohda `tormoz yuritmasining`' },
  { bad: 'пневматик узатма',     good: 'пневматик юритма',   stem: true, why: 'привод = юритма' },
  { bad: 'Tovushli signal',      good: 'Tovush ishorasi',    why: 'atama' },

  // --- Imlo (lotin + kirill) ---
  { bad: 'harakatlinishi',  good: 'harakatlanishi',  why: '6x vs 1486x' },
  { bad: 'ҳаракатлиниши',   good: 'ҳаракатланиши',   why: '6x vs 1486x' },
  { bad: "Qo'yidagi",       good: 'Quyidagi',        apo: true, why: '6x vs 166x' },
  { bad: 'Қўйидаги',        good: 'Қуйидаги',        why: '6x vs 166x' },
  { bad: "ko'rsatilingan",  good: "ko'rsatilgan",    apo: true, why: "ortiqcha '-in-' (6x vs 579x)" },
  { bad: 'кўрсатилинган',   good: 'кўрсатилган',     why: "ortiqcha '-ин-' (6x vs 871x)" },
  { bad: 'Tahminan',        good: 'Taxminan',        why: "izohda `taxminan`; h -> x" },
  { bad: 'Таҳминан',        good: 'Тахминан',        why: 'ҳ -> х' },
  { bad: 'mashala',         good: "mash'ala",        why: "izohda `mash'ala`; apostrof tushgan" },
  { bad: 'машала',          good: 'машъала',         why: 'ъ тушган' },
  { bad: 'kadab',           good: 'qadab',           why: "`kadamoq` so'zi yo'q; qadamoq" },
  { bad: 'кадаб',           good: 'қадаб',           why: 'к -> қ' },
  { bad: 'tulgan',          good: "to'lgan",         why: "u -> o' (6x vs 10x)" },
  { bad: 'тулган',          good: 'тўлган',          why: 'у -> ў (6x vs 22x)' },
  { bad: "to'g'irlab",      good: "to'g'rilab",      apo: true, why: "o'zak `to'g'ri-`" },
  { bad: 'тўғирлаб',        good: 'тўғрилаб',        why: 'ўзак `тўғри-`' },
  { bad: 'кўрсатгич',       good: 'кўрсаткич',       stem: true, why: 'lotinchada allaqachon `ko\'rsatkich`' },

  // --- Belgi nomlari (public/data/belgilar.json etalon) ---
  { bad: 'Xavfli burilishi', good: 'Xavfli burilish', why: 'belgilar.json: 1.11.1 Xavfli burilish' },
  { bad: 'Хавфли бурилиши',  good: 'Хавфли бурилиш',  why: 'belgilar.json' },
  { bad: '3.7 «Shatakka olish taqiqlangan»', good: '3.7 «Tirkama bilan harakatlanish taqiqlangan»',
    why: 'belgilar.json: 3.7 = Tirkama bilan harakatlanish taqiqlangan' },
  { bad: '3.7 «Шатакка олиш тақиқланган»',  good: '3.7 «Тиркама билан ҳаракатланиш тақиқланган»',
    why: 'belgilar.json' },

  // --- Qisqartmalar ---
  { bad: 'YHXXga', good: 'DYHXXga', why: "boshqa hamma joyda `D` bor" },
  { bad: 'ЙҲХХга', good: 'ДЙҲХХга', why: 'бошқа ҳамма жойда `Д` бор' },

  // --- Tinish belgisi / bo'shliq ---
  { bad: 'richagi ni',        good: 'richagini',        why: "qo'shimcha ajralib qolgan" },
  { bad: 'ричаги ни',         good: 'ричагини',         why: 'қўшимча ажралиб қолган' },
  { bad: 'km/s, dan',         good: 'km/s dan',         why: "ortiqcha vergul (6x vs 30x)" },
  { bad: "Qarama - qarshi",   good: 'Qarama-qarshi',    why: 'defis atrofida bo\'shliq' },
  { bad: 'Қарама - қарши',    good: 'Қарама-қарши',     why: 'дефис атрофида бўшлиқ' },
  { bad: 'Qarama qarshi',     good: 'Qarama-qarshi',    why: 'defis yo\'q' },
  { bad: 'Қарама қарши',      good: 'Қарама-қарши',     why: 'дефис йўқ' },
  { bad: 'lekin, bir tekisda', good: 'lekin bir tekisda', why: 'ortiqcha vergul' },
  { bad: 'лекин, бир текисда', good: 'лекин бир текисда', why: 'ортиқча вергул' },
  { bad: '106-,105 - va 104 - bandlariga',  good: '106-, 105- va 104-bandlariga',  why: 'defis/bo\'shliq tartibsiz' },
  { bad: '106-,105 - ва 104 - бандларига',  good: '106-, 105- ва 104-бандларига',  why: 'дефис/бўшлиқ тартибсиз' },

  // --- Verguldan keyin bo'shliq yo'q ---
  { bad: "chiqib,so'ngra", good: "chiqib, so'ngra", apo: true, why: 'bo\'shliq yo\'q' },
  { bad: 'чиқиб,сўнгра',   good: 'чиқиб, сўнгра',  why: 'бўшлиқ йўқ' },
  { bad: 'bildiradi,chiziq', good: 'bildiradi, chiziq', why: 'bo\'shliq yo\'q' },
  { bad: 'билдиради,чизиқ',  good: 'билдиради, чизиқ',  why: 'бўшлиқ йўқ' },
  { bad: 'yoqishi,agar',     good: 'yoqishi, agar',     why: 'bo\'shliq yo\'q' },
  { bad: 'переход,так',      good: 'переход, так',      why: 'нет пробела' },
  { bad: 'налево,разворота', good: 'налево, разворота', why: 'нет пробела' },
  { bad: 'автомобилга,Таксометри', good: 'автомобилга, Таксометри', why: 'бўшлиқ йўқ' },
  { bad: 'автомобиля,предназначенного', good: 'автомобиля, предназначенного', why: 'нет пробела' },
  { bad: 'означает,что',     good: 'означает, что',     why: 'нет пробела' },

  // --- Rus tili ---
  { bad: 'невозможно. следовать', good: 'невозможно, следовать', why: 'точка вместо запятой' },
  { bad: 'М1, М2;М3',             good: 'М1, М2, М3',           why: 'точка с запятой' },
  { bad: 'допустимой нагрузки не соответствуют', good: 'допустимой нагрузке не соответствуют',
    why: 'дательный падеж после «по»' },
  { bad: 'в СБДД',                good: 'в ГСБДД',              why: '«Г» пропущена' },
  { bad: 'дороге на которой установлен', good: 'дороге, на которой установлен', why: 'нет запятой' },
  { bad: 'полосу, предназначенной', good: 'полосу, предназначенную', why: 'винительный падеж' },
  { bad: 'вокругшкол',            good: 'вокруг школ',          why: 'слова слиплись' },
  { bad: 'проезжейчасти',         good: 'проезжей части',       why: 'слова слиплись' },
  { bad: 'другихучастников',      good: 'других участников',    why: 'слова слиплись' },
  { bad: 'правильноуказан',       good: 'правильно указан',     why: 'слова слиплись' },

  // --- O'lchov birligi ---
  { bad: 'km.dan', good: 'km dan', why: 'ortiqcha nuqta (10x vs 52x)' },
  { bad: 'm. dan', good: 'm dan',  why: 'ortiqcha nuqta (28x vs 58x)' },
  { bad: 'км.дан', good: 'км дан', why: 'ортиқча нуқта' },
  { bad: 'м. дан', good: 'м дан',  why: 'ортиқча нуқта' },

  // --- Kirillda rus harflari (ў/қ/ғ/ҳ o'rniga у/к/г/х) ---
  // Rus klaviaturasida terilgani sababli. Har biri korpusda 8+ barobar kam.
  { bad: 'юкори',          good: 'юқори',          why: 'к -> қ (18x vs 347x)' },
  { bad: 'кандай',         good: 'қандай',         why: 'к -> қ (12x vs 1177x)' },
  { bad: 'сарик',          good: 'сариқ',          why: 'к -> қ (12x vs 840x)' },
  { bad: 'ётик',           good: 'ётиқ',           why: 'к -> қ (12x vs 278x)' },
  { bad: 'хам',            good: 'ҳам',            why: 'х -> ҳ (12x vs 924x)' },
  { bad: 'оркага',         good: 'орқага',         why: 'к -> қ (12x vs 216x)' },
  { bad: 'йулларда',       good: 'йўлларда',       why: 'у -> ў (6x vs 610x)' },
  { bad: 'курсатилган',    good: 'кўрсатилган',    why: 'у -> ў (6x vs 1042x)' },
  { bad: 'огохлантирувчи', good: 'огоҳлантирувчи', why: 'х -> ҳ (6x vs 190x)' },
  { bad: 'йулкаси',        good: 'йўлкаси',        why: 'у -> ў (6x vs 156x)' },
  { bad: 'вактда',         good: 'вақтда',         why: 'к -> қ (6x vs 746x)' },
  { bad: 'якинни',         good: 'яқинни',         why: 'к -> қ (6x vs 272x)' },
  { bad: 'ёкиб',           good: 'ёқиб',           why: 'к -> қ (6x vs 100x)' },
  { bad: 'килмайди',       good: 'қилмайди',       why: 'к -> қ (6x vs 101x)' },
  { bad: 'унгдаги',        good: 'ўнгдаги',        why: 'у -> ў (6x vs 90x)' },
  { bad: 'ортик',          good: 'ортиқ',          why: 'к -> қ (6x vs 608x)' },
  { bad: 'утишни',         good: 'ўтишни',         why: 'у -> ў (4x vs 186x)' },
  { bad: 'харакатига',     good: 'ҳаракатига',     why: 'х -> ҳ (4x vs 174x)' },
  { bad: 'холда',          good: 'ҳолда',          why: 'х -> ҳ (4x vs 855x)' },
  { bad: 'кор',            good: 'қор',            why: 'к -> қ (4x vs 67x)' },
  // IKKI xato birga: у->ў va г->к
  { bad: 'курсатгич',      good: 'кўрсаткич',      stem: true, why: 'у->ў va г->к' },

  // --- BOSH HARFLI variantlar ---
  // CYR_RU_FIXES sikli REGISTRNI SAQLAYDI (`Зеленым` kabi aniq yozuvlar
  // buzilmasligi uchun), shuning uchun bosh harfli shakllar ALOHIDA kerak.
  //
  // DIQQAT: `Хам` -> `Ҳам` deb yozish XATO bo'lardi — korpusda `Хам` alohida
  // so'z sifatida UMUMAN yo'q (0x), u faqat `Хаммаси` ichida uchraydi.
  { bad: 'Хаммаси',        good: 'Ҳаммаси',        why: 'х -> ҳ (22x vs 34x)' },
  { bad: 'Ҳавфли',         good: 'Хавфли',         why: 'ҳ -> х (6x vs 173x)' },
  { bad: 'Сарик',          good: 'Сариқ',          why: 'к -> қ (12x vs 185x)' },
  { bad: 'Курсатилган',    good: 'Кўрсатилган',    why: 'у -> ў (6x vs 299x)' },
  { bad: 'Огохлантирувчи', good: 'Огоҳлантирувчи', why: 'х -> ҳ (6x vs 81x)' },
  { bad: 'Показано направления', good: 'Показаны направления',
    why: 'число не согласовано (направления — мн.ч.)' },

  // ==========================================================================
  // 12-BOSQICH: v3, v4, v5 ni to'liq qo'lda o'qishda topilganlar.
  //
  // ESLATMA: kirillda `е` allaqachon "ye" tovushini beradi, shuning uchun
  // `етган`, `ечиш` kabi shakllar TO'G'RI va tegilmaydi — faqat lotinchasi
  // tuzatiladi.
  // ==========================================================================

  // `masofa` + tushum kelishigi. Lotinda `n` tushib qolgan.
  // DALIL: lotin 252+20=272, kirill `масофани` 272, `масофаи` 0 — sonlar mos.
  { bad: 'masofai', good: 'masofani', why: "tushum kelishigidagi 'n' tushgan (252x)" },

  { bad: 'qatnash qismi', good: 'qatnov qismi', stem: true, why: '6x vs 2061x' },
  { bad: 'қатнаш қисми',  good: 'қатнов қисми', stem: true, why: '6x vs 2061x' },

  // `yetmoq` (yetishmoq) o'zagi — ruschasi "Имеются ... повреждения"
  { bad: 'shikast etgan', good: "shikast yetgan", why: "yetmoq o'zagi (12x)" },

  { bad: 'hollardan taqiqlanadi', good: 'hollarda taqiqlanadi', why: 'kelishik (6x vs 88x)' },
  { bad: 'ҳоллардан тақиқланади', good: 'ҳолларда тақиқланади', why: 'келишик (6x vs 88x)' },

  // Kirillchasi `реанимация` (ц) -> lotinda `ts`. Lotin 12+6=18 = kirill 18.
  { bad: 'reanimasiya', good: 'reanimatsiya', stem: true, why: 'ц -> ts (12x)' },

  { bad: 'ishlayotmagan', good: 'ishlamayotgan', why: "bo'g'inlar almashgan (6x vs 115x)" },

  // Qo'shtirnoqdan keyin ortiqcha vergul
  { bad: "«TO'XTASH», yozuvi", good: "«TO'XTASH» yozuvi", why: 'ortiqcha vergul' },
  { bad: '«ТЎХТАШ», ёзуви',    good: '«ТЎХТАШ» ёзуви',    why: 'ортиқча вергул' },

  // Ro'yxat ajratgichi — korpusda vergul ustun (98x vs 60x)
  { bad: 'N2; N3', good: 'N2, N3', why: 'ajratgich (60x vs 98x)' },

  // `yechmoq` (yechib olmoq) o'zagi. Kirillchasi (`ечиш`) TO'G'RI.
  { bad: 'echishni', good: 'yechishni', why: "yechmoq o'zagi (12x)" },
  { bad: 'echilsa',  good: 'yechilsa',  why: "yechmoq o'zagi (6x)" },
  { bad: 'echish',   good: 'yechish',   why: "yechmoq o'zagi (6x)" },

  { bad: 'mopet', good: 'moped', why: 't -> d (6x vs 267x)' },
  { bad: 'мопет', good: 'мопед', why: 'т -> д (6x vs 552x)' },

  // t_5_q_14 — grammatika buzilgan. Ruschasi:
  // "Из скольких глав и пунктов СОСТОЯТ Правила дорожного движения?"
  { bad: "Yo'l harakat qoidalarida nechta bob va bandidan iborat?",
    good: "Yo'l harakati qoidalari nechta bob va banddan iborat?",
    why: 'kelishiklar buzilgan' },
  { bad: 'Йўл ҳаракат қоидаларида нечта боб ва бандидан иборат?',
    good: 'Йўл ҳаракати қоидалари нечта боб ва банддан иборат?',
    why: 'келишиклар бузилган' },

  // t_4_q_11 — variant yorlig'ida lotincha `A` kirillcha `В` bilan aralashgan.
  // Kirillcha faylda to'g'ri (`А ва В`), lotinchada `A` lotincha qolib ketgan.
  { bad: 'A va В', good: 'А va В', why: 'aralash alifbo (lotin A -> kirill А)' },

  // --- Fayllararo sinxronlik tekshiruvida topilgan (izoh matnlarida) ---
  // barcha-*.json da xato, data/variants/*.json da to'g'ri edi.
  { bad: 'trasnport', good: 'transport', stem: true, why: 'harflar almashgan (2x vs 10993x)' },
  { bad: 'траснпорт', good: 'транспорт', stem: true, why: 'harflar almashgan (2x vs 20443x)' },
  { bad: 'таъқиқ',    good: 'тақиқ',     stem: true, why: 'apostrofsiz shakl standart (2x vs 4397x)' },

  // --- Kirill: 3-bosqichdagi lotincha tuzatishlarning kirillcha jufti ---
  // (`mayokchalari` lotinda tuzatilgan edi, kirillchasi qolib ketgan)
  { bad: 'маёкча',        good: 'маёқча',        stem: true, why: 'к -> қ' },
  { bad: 'тусиқ',         good: 'тўсиқ',         stem: true, why: 'у -> ў' },
  { bad: 'бўлагини учун', good: 'бўлгани учун',  why: 'grammatik shakl buzilgan' },

  { bad: 'sudraluvchi yuruvchi', good: 'sudralib yuruvchi', why: 'izohdagi rasmiy nom' },
  { bad: 'судралим юрувчи',      good: 'судралиб юрувчи',   why: 'izohdagi rasmiy nom' },
  { bad: 'грызуны и рептилий',   good: 'грызуны и рептилии', why: 'родительный -> именительный' },

  // --- Rus tilidagi kelishik/moslik xatolari (o'zbekchasi bilan solishtirildi) ---
  { bad: 'показано разделительная зона', good: 'показана разделительная зона',
    why: 'род не согласован (зона — ж.р.)' },
  { bad: 'показано направления действия', good: 'показаны направления действия',
    why: 'число не согласовано (направления — мн.ч.)' },
  { bad: 'дорожных знаков, указывающей', good: 'дорожных знаков, указывающих',
    why: 'причастие не согласовано со «знаков»' },
  { bad: 'как двухполосная дорога, на котором', good: 'как двухполосную дорогу, на которой',
    why: 'падеж и род не согласованы' },

  // ==========================================================================
  // "YHQ" NING NOTO'G'RI TARJIMALARI (mashina tarjimasi izlari).
  //
  // O'zbekcha manbadagi "YHQ" (Yo'l Harakati Qoidalari = ПДД) ruschaga
  // yetti xil bema'ni ibora bo'lib o'girilgan: "milliy yo'l xaritasi",
  // "milliy xulq kodeksi", hatto "milliy geografik kodeks".
  //
  // DIQQAT: `Национальной гвардии` (Milliy gvardiya) TEGILMAYDI — u
  // o'zbekcha manbada ham bor va HAQIQIY tashkilot nomi.
  //
  // Uzunroq iboralar oldinroq turadi (qisqasi ichiga tushib qolmasin).
  // ==========================================================================
  { bad: 'Национального кодекса безопасности дорожного движения', good: 'ПДД', why: 'YHQ = ПДД' },
  { bad: 'Национальных правил безопасности дорожного движения', good: 'ПДД', why: 'YHQ = ПДД' },
  { bad: 'к Национальному управлению безопасности дорожного движения', good: 'к ПДД', why: 'YHQ = ПДД' },
  { bad: 'Национальных правил дорожного движения', good: 'ПДД', why: 'YHQ = ПДД' },
  { bad: 'Национального географического кодекса', good: 'ПДД', why: 'YHQ = ПДД' },
  { bad: 'Национального кодекса поведения', good: 'ПДД', why: 'YHQ = ПДД' },
  { bad: 'Национальной дорожной карты', good: 'ПДД', why: 'YHQ = ПДД' },
  { bad: 'к Общему регламенту', good: 'к ПДД', why: 'YHQ = ПДД' },
  // ПДК = "предельно допустимая концентрация" — butunlay boshqa atama.
  { bad: 'приложения 3 ПДК', good: 'приложения 3 ПДД', why: "noto'g'ri qisqartma" },

  // ==========================================================================
  // TINISH BELGISI: savol matni tugash belgisisiz qolgan.
  //
  // Har biri boshqa tildagi jufti bilan solishtirib tekshirilgan — o'sha
  // savol boshqa tilda `?` yoki `:` bilan tugaydi, ruschasida esa tushib
  // qolgan. To'liq matn bo'yicha almashtiriladi (matnlar noyob).
  // ==========================================================================
  { bad: 'Какой водитель автомобиля правильно остановился на запрещающий сигнал светофора"',
    good: 'Какой водитель автомобиля правильно остановился на запрещающий сигнал светофора?"',
    why: "savol belgisi tushgan" },
  { bad: 'Как должны двигаться пешеходы по проезжей части при отсутствии тротуара"',
    good: 'Как должны двигаться пешеходы по проезжей части при отсутствии тротуара?"',
    why: "savol belgisi tushgan" },
  { bad: 'допускается движение без разрешения ГСБДД"',
    good: 'допускается движение без разрешения ГСБДД?"',
    why: "savol belgisi tushgan" },
  { bad: 'Чорраҳадан биринчи бўлиб қайси автомобиль кесиб ўтади"',
    good: 'Чорраҳадан биринчи бўлиб қайси автомобиль кесиб ўтади?"',
    why: "savol belgisi tushgan" },
  { bad: 'повернув его передние колеса в положение"',
    good: 'повернув его передние колеса в положение:"',
    why: "ikki nuqta tushgan (o'zbekchasida bor)" },
  { bad: 'не имеет преимущества перед безрельсовыми транспортными средствами"',
    good: 'не имеет преимущества перед безрельсовыми транспортными средствами:"',
    why: "ikki nuqta tushgan (o'zbekchasida bor)" },
  { bad: 'Обеспечение безопасности дорожного движения -"',
    good: 'Обеспечение безопасности дорожного движения - ..."',
    why: "davomi tushgan (o'zbekchasida '- ...')" },
  { bad: 'Разделительная зона - …"',
    good: 'Разделительная зона - ..."',
    why: "o'zbekchasi bilan bir xil ko'p nuqta" },

  // Yana beshta KIRISH jumlasi (o'zbekchasida `:` bor, ruschasida yo'q)
  { bad: 'Буксировка запрещается"',            good: 'Буксировка запрещается:"',            why: 'ikki nuqta tushgan' },
  { bad: 'Признаки венозного кровотечения"',   good: 'Признаки венозного кровотечения:"',   why: 'ikki nuqta tushgan' },
  { bad: 'сотрясении мозга или травме шеи"',   good: 'сотрясении мозга или травме шеи:"',   why: 'ikki nuqta tushgan' },
  { bad: 'Главная дорога показана"',           good: 'Главная дорога показана:"',           why: 'ikki nuqta tushgan' },
  { bad: 'Эта табличка означает"',             good: 'Эта табличка означает:"',             why: 'ikki nuqta tushgan' },
  // Bu esa HAQIQIY savol ("О чем ...") — savol belgisi kerak
  { bad: 'предупреждают знак и табличка под ним"', good: 'предупреждают знак и табличка под ним?"',
    why: 'savol belgisi tushgan' },

  // ==========================================================================
  // SAVOLGA XOS TO'LIQ MATNLAR (v1, v2, v33, v34)
  // ==========================================================================

  // t_34_q_2 — ma'no teskari edi: "haydovchi ruxsat BERADI" -> "haydovchiGA
  // ruxsat ETILADI". Ruschasi: "водителю автомобиля разрешено движение?"
  { bad: 'Avtomobil haydovchisi qaysi yo\'nalishlarda harakatlanishga ruxsat beradi?',
    good: 'Avtomobil haydovchisiga qaysi yo\'nalishlarda harakatlanishga ruxsat etiladi?',
    why: "ma'no teskari edi" },
  { bad: 'Автомобил ҳайдовчиси қайси йўналишларда ҳаракатланишга рухсат беради?',
    good: 'Автомобил ҳайдовчисига қайси йўналишларда ҳаракатланишга рухсат этилади?',
    why: "маъно тескари эди" },

  // t_1_q_3 — so'roq so'zi tushib qolgan
  { bad: 'uzuq-uzuq chiziq bildiradi?', good: 'uzuq-uzuq chiziq nimani bildiradi?',
    why: "so'roq so'zi `nimani` tushgan" },
  { bad: 'узуқ-узуқ чизиқ билдиради?', good: 'узуқ-узуқ чизиқ нимани билдиради?',
    why: 'сўроқ сўзи `нимани` тушган' },

  // t_33_q_9 — "o'zib ketish" ta'rifi aylanma edi. Ruschasi: "скорости
  // ПОПУТНОГО транспортного средства" — `-dagi` qo'shimchasi ma'noni tiklaydi.
  { bad: 'bir yo\'nalishda transport vositasi tezligidan',
    good: 'bir yo\'nalishdagi transport vositasi tezligidan',
    why: "ta'rif aylanma edi (savolda ham, izohda ham)" },
  { bad: 'бир йўналишда транспорт воситаси тезлигидан',
    good: 'бир йўналишдаги транспорт воситаси тезлигидан',
    why: 'таъриф айланма эди' },

  // t_2_q_4 va t_34_q_11 — tugash belgisi tushgan (ruschasida bor)
  { bad: 'eng yuqori tezlikda harakatlanishga ruxsat etiladi"',
    good: 'eng yuqori tezlikda harakatlanishga ruxsat etiladi?"',
    why: 'savol belgisi tushgan' },
  { bad: 'энг юқори тезликда ҳаракатланишга рухсат этилади"',
    good: 'энг юқори тезликда ҳаракатланишга рухсат этилади?"',
    why: 'сўроқ белгиси тушган' },
  { bad: 'reaksiya vaqti deb qabul qilingan"', good: 'reaksiya vaqti deb qabul qilingan:"',
    why: 'ikki nuqta tushgan (ruschasida `составляет:`)' },
  { bad: 'реаксия вақти деб қабул қилинган"',  good: 'реаксия вақти деб қабул қилинган:"',
    why: 'икки нуқта тушган' },

  // Guillemet ichida ortiqcha bo'shliq: `« А »` -> `«А»` (552 ta holat)
  { bad: '« А »', good: '«А»', why: "ortiqcha bo'shliq (198x vs 996x)" },
  { bad: '« Б »', good: '«Б»', why: "ortiqcha bo'shliq (168x vs 1176x)" },
  { bad: '« В »', good: '«В»', why: "ortiqcha bo'shliq (132x vs 666x)" },
  { bad: '« Г »', good: '«Г»', why: "ortiqcha bo'shliq (54x vs 174x)" },

  // Savol emas, KIRISH jumlasi — javob variantlari uni davom ettiradi.
  // Korpusda `:` bilan tugaydiganlari 223 ta, `?` bilan — atigi 18 ta.
  { bad: 'Первым проедет перекрёсток?', good: 'Первым проедет перекрёсток:',
    why: 'kirish jumlasi — `:` bo\'lishi kerak' },
  { bad: 'Красный автомобиль проедет перекрёсток?', good: 'Красный автомобиль проедет перекрёсток:',
    why: 'kirish jumlasi — `:` bo\'lishi kerak' },
  { bad: 'Желтый автомобиль проедет перекрёсток?', good: 'Желтый автомобиль проедет перекрёсток:',
    why: 'kirish jumlasi — `:` bo\'lishi kerak' },

  // Savol matni O'RTASIDA qator uzilishi — bo'sh joyga aylantiriladi.
  { bad: 'Tramvay reelssiz transport vositalariga\\nnisbatan',
    good: 'Tramvay reelssiz transport vositalariga nisbatan',
    why: 'matn ichida qator uzilishi' },

  // Belgi nomi ikkita apostrof bilan o'ralgan — qo'shtirnoq bo'lishi kerak
  { bad: "''bo'laklar", good: '\\"bo\'laklar', why: "qo'shtirnoq o'rniga ikkita apostrof" },
  { bad: "yo'nalishi''", good: 'yo\'nalishi\\"', why: "qo'shtirnoq o'rniga ikkita apostrof" },
  { bad: "''бўлаклар", good: '\\"бўлаклар', why: "qo'shtirnoq o'rniga ikkita apostrof" },
  { bad: "йўналиши''", good: 'йўналиши\\"', why: "qo'shtirnoq o'rniga ikkita apostrof" },

  // t_31_q_1 — o'zbekchasi "Falokat yorug'lik ishoralari yoqishi" (avariya
  // signalizatsiyasi). Ruschasida "Знаки ... должны быть включены" deyilgan —
  // BELGINI yoqib bo'lmaydi, ma'no buzilgan.
  {
    bad: 'Знаки аварийной остановки должны быть включены, а при их отсутствии или неисправностях должен быть установлен знак аварийной остановки',
    good: 'Аварийная сигнализация должна быть включена, а при её отсутствии или неисправности должен быть установлен знак аварийной остановки',
    why: 'ma\'no buzilgan: belgi emas, avariya signalizatsiyasi yoqiladi',
  },

  // DIQQAT: `желтый` -> `Жёлтый` ATAYLAB QO'SHILMADI. U 135 joyda uchraydi va
  // aksariyati gap o'rtasidagi oddiy kichik harfli so'z ("желтый сигнал
  // светофора"). Hammasini bosh harf qilish XATO bo'lardi. Javob variantlari
  // bosh harfi alohida, variant darajasidagi ish sifatida ko'rilishi kerak.
];

/** `Chorahalarda` -> `Chorrahalarda`: bosh harf saqlanadi */
function matchCase(source, replacement) {
  if (source[0] === source[0].toUpperCase() && source[0] !== source[0].toLowerCase()) {
    return replacement[0].toUpperCase() + replacement.slice(1);
  }
  return replacement;
}

/** Xato so'z uchun regex: chegaralar so'z belgisi BO'LMASLIGI shart */
function buildPattern(fix) {
  let body;
  if (fix.apo) {
    // Apostrof o'rnini ushlab olamiz -> almashtirishda o'sha ko'rinish qaytadi
    body = fix.bad
      .split(/['ʻʼ‘’`]/)
      .map((part) => part.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))
      .join(`(${APO})`);
  } else {
    body = fix.bad.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * `stem` rejimi: so'z BOSHIDAN mos keladi, oxiri ochiq qoladi.
   * Ya'ni `chorrax` -> `chorraxa`, `chorraxani`, `Chorraxadan` — hammasi.
   * O'ng chegara tekshiruvi YO'Q, chunki qo'shimchalar kelishi kerak.
   */
  if (fix.stem) {
    return new RegExp(`(^|\\\\[nrt]|[^${WORD_CHAR}])(${body})`, 'gi');
  }
  /**
   * Chap chegara uchta holatdan biri bo'lishi mumkin:
   *   1. fayl boshi
   *   2. JSON escape ketma-ketligi (`\n`, `\r`, `\t`)
   *   3. oddiy so'z bo'lmagan belgi
   *
   * 2-holat MUHIM: xom JSON matnida `\n` bu ikki belgi — `\` va `n`. Ya'ni
   * "...kerak.\nEtarlicha..." da "Etarlicha" dan oldingi belgi HARF ('n')
   * bo'lib ko'rinadi va oddiy chegara tekshiruvi uni topa olmaydi.
   */
  return new RegExp(`(^|\\\\[nrt]|[^${WORD_CHAR}])(${body})(?![${WORD_CHAR}])`, 'gi');
}

function collectJson(dir, out = []) {
  for (const name of fs.readdirSync(dir)) {
    const p = path.join(dir, name);
    if (fs.statSync(p).isDirectory()) collectJson(p, out);
    else if (name.endsWith('.json')) out.push(p);
  }
  return out;
}

/**
 * Javob variantining bosh harfini tiklaydi.
 *
 * MUAMMO: bir savolning boshqa variantlari bosh harf bilan boshlanadi, lekin
 * bittasi kichik harf bilan. Ta'sirlangan 14 ta variantning deyarli hammasi
 * `yengil` yoki `yetarli` bilan boshlanadi — ya'ni sabab aniq: ilgarigi
 * `e` -> `ye` migratsiyasi bosh harfni yo'qotgan ("Engil" -> "yengil").
 *
 * Faqat QO'SHNILARI bosh harfli bo'lgan variantlar tuzatiladi. Agar savolning
 * BARCHA variantlari kichik harfli bo'lsa — bu ataylab qilingan uslub
 * (savol davomi) deb hisoblanadi va tegilmaydi.
 *
 * @returns {Map<string,string>} xom JSON matni -> yangi xom JSON matni
 */
function collectOptionCaseFixes(files) {
  const map = new Map();
  for (const file of files) {
    let data;
    try { data = JSON.parse(fs.readFileSync(file, 'utf8')); } catch { continue; }
    if (!Array.isArray(data)) continue;

    for (const q of data) {
      for (const content of Object.values(q?.content ?? {})) {
        const options = content?.options;
        if (!Array.isArray(options) || options.length < 2) continue;

        const texts = options.map((o) => (o?.text ?? '').trim()).filter(Boolean);
        if (texts.length < 2) continue;

        const isUpper = (s) => s[0] === s[0].toUpperCase() && s[0] !== s[0].toLowerCase();
        const isLower = (s) => s[0] === s[0].toLowerCase() && s[0] !== s[0].toUpperCase();
        if (!texts.some(isUpper)) continue;

        for (const t of texts.filter(isLower)) {
          map.set(JSON.stringify(t), JSON.stringify(t[0].toUpperCase() + t.slice(1)));
        }
      }
    }
  }
  return map;
}

/**
 * TEXT_NORMALIZERS ni qo'llab, o'zgargan satrlarni yig'adi.
 * Xom faylga emas, ANIQ JSON satriga almashtirish qilinadi — shunda
 * fayl chekinishlari va escape lar tegilmaydi.
 */
function collectTextNormalizations(files) {
  const map = new Map();
  const stats = new Map(TEXT_NORMALIZERS.map((n) => [n.label, 0]));

  const visit = (node) => {
    if (typeof node === 'string') {
      let next = node;
      for (const n of TEXT_NORMALIZERS) {
        const before = next;
        next = n.apply(next);
        if (next !== before) stats.set(n.label, stats.get(n.label) + 1);
      }
      if (next !== node) map.set(JSON.stringify(node), JSON.stringify(next));
      return;
    }
    if (Array.isArray(node)) { for (const x of node) visit(x); return; }
    if (node && typeof node === 'object') for (const v of Object.values(node)) visit(v);
  };

  for (const file of files) {
    try { visit(JSON.parse(fs.readFileSync(file, 'utf8'))); } catch { /* o'tkazamiz */ }
  }
  return { map, stats };
}

/**
 * Javob varianti matni tinish belgisi bilan boshlanmasin.
 *
 * 64 ta variant `.` / `,` / `;` bilan boshlanardi (masalan
 * ". Qatnov qismi yoki trotuar tomonidan") — manba ma'lumotida jumla
 * noto'g'ri bo'lingani uchun. Foydalanuvchi buni ekranda ortiqcha nuqta
 * sifatida ko'radi.
 */
function collectOptionLeadFixes(files) {
  const map = new Map();
  for (const file of files) {
    let data;
    try { data = JSON.parse(fs.readFileSync(file, 'utf8')); } catch { continue; }
    if (!Array.isArray(data)) continue;
    for (const q of data) {
      for (const content of Object.values(q?.content ?? {})) {
        for (const opt of content?.options ?? []) {
          const t = opt?.text;
          if (typeof t !== 'string') continue;
          const cleaned = t.replace(/^[\s.,;:]+/, '');
          if (cleaned && cleaned !== t) map.set(JSON.stringify(t), JSON.stringify(cleaned));
        }
      }
    }
  }
  return map;
}

const files = collectJson(PUBLIC_DIR);
const optionLeadFixes = collectOptionLeadFixes(files);
const optionCaseFixes = collectOptionCaseFixes(files);
const { map: textNormFixes, stats: textNormStats } = collectTextNormalizations(files);
let optionCaseCount = 0;
let optionLeadCount = 0;
let textNormCount = 0;
const perFix = new Map([...FIXES, ...CYR_RU_FIXES, ...PHRASE_FIXES].map((f) => [f.bad, 0]));
const touched = [];

for (const file of files) {
  const original = fs.readFileSync(file, 'utf8');
  let text = original;
  const local = [];

  /**
   * VARIANT DARAJASIDAGI TUZATISHLAR ENG BIRINCHI ISHLAYDI.
   *
   * Ular `JSON.stringify(asl matn)` kalitiga tayanadi va kalitlar fayllarning
   * BOSHLANG'ICH holatidan yig'ilgan. Agar oldin so'z tuzatishlari ishlasa
   * (masalan `тусиқ` -> `тўсиқ`), kalit eskirib qoladi va mos kelmaydi —
   * o'sha variant tuzatilmay o'tib ketardi.
   */

  // Javob varianti boshidagi ortiqcha tinish belgisi
  for (const [from, to] of optionLeadFixes) {
    if (!text.includes(from)) continue;
    const n = text.split(from).length - 1;
    text = text.split(from).join(to);
    optionLeadCount += n;
  }

  // Javob variantlari bosh harfi
  for (const [from, to] of optionCaseFixes) {
    if (!text.includes(from)) continue;
    const n = text.split(from).length - 1;
    text = text.split(from).join(to);
    optionCaseCount += n;
    local.push(`bosh harf: ${from.slice(0, 45)}... (${n})`);
  }

  /**
   * Kirill/rus tuzatishlari.
   *
   * SO'Z CHEGARASI SHART — ilgari bu yerda xom `split/join` ishlatilardi va
   * bu JIDDIY XATO edi: `кор` -> `қор` qoidasi `скорость` so'zini
   * `сқорость` ga aylantirib, 2369 joyda matnni buzardi.
   *
   * Endi FIXES bilan bir xil chegara mantiqi ishlaydi. Farqi — bu yerda
   * REGISTR SAQLANADI (`g`, `i` YO'Q), chunki yozuvlar aniq shaklda berilgan
   * (masalan `Зеленым` -> `Зелёный`, kichik harfli variantiga tegmasin).
   *
   * `raw: true` — chegarasiz xom almashtirish (so'z O'RTASIDA mos kelishi
   * kerak bo'lganda, masalan `мототсикл` -> `электромототсикл` ichida).
   * `stem: true` — faqat chapdan chegara, qo'shimchalar ochiq.
   */
  for (const fix of CYR_RU_FIXES) {
    let count = 0;

    if (fix.raw) {
      let idx = text.indexOf(fix.bad);
      while (idx !== -1) {
        count++;
        idx = text.indexOf(fix.bad, idx + fix.bad.length);
      }
      if (count) text = text.split(fix.bad).join(fix.good);
    } else {
      const esc = fix.bad.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const re = fix.stem
        ? new RegExp(`(^|\\\\[nrt]|[^${WORD_CHAR}])(${esc})`, 'g')
        : new RegExp(`(^|\\\\[nrt]|[^${WORD_CHAR}])(${esc})(?![${WORD_CHAR}])`, 'g');
      text = text.replace(re, (whole, before) => {
        count++;
        return before + fix.good;
      });
    }

    if (count) {
      perFix.set(fix.bad, perFix.get(fix.bad) + count);
      local.push(`${fix.bad} -> ${fix.good} (${count})`);
    }
  }

  // Ibora darajasidagi tuzatishlar (bosh harf saqlanadi)
  for (const fix of PHRASE_FIXES) {
    const re = new RegExp(`(^|[^${WORD_CHAR}])(${fix.bad})`, 'gi');
    let count = 0;
    text = text.replace(re, (whole, before, phrase) => {
      count++;
      return before + matchCase(phrase, fix.good);
    });
    if (count) {
      perFix.set(fix.bad, (perFix.get(fix.bad) ?? 0) + count);
      local.push(`${fix.bad} -> ${fix.good} (${count})`);
    }
  }

  // Matn normallashtirish (ortiqcha bo'shliq va h.k.)
  for (const [from, to] of textNormFixes) {
    if (!text.includes(from)) continue;
    const n = text.split(from).length - 1;
    text = text.split(from).join(to);
    textNormCount += n;
  }

  for (const fix of FIXES) {
    const re = buildPattern(fix);
    let count = 0;
    text = text.replace(re, (whole, before, word, apo1, apo2, apo3) => {
      count++;
      let good = fix.good;
      if (fix.apo) {
        // Almashtirishdagi apostroflarni asl ko'rinishlar bilan to'ldiramiz
        const captured = [apo1, apo2, apo3].filter((x) => typeof x === 'string');
        let i = 0;
        good = good.replace(/'/g, () => captured[i++] ?? "'");
      }
      return before + matchCase(word.replace(/^[^A-Za-z]*/, ''), good);
    });
    if (count) {
      perFix.set(fix.bad, perFix.get(fix.bad) + count);
      local.push(`${fix.bad} -> ${fix.good} (${count})`);
    }
  }

  if (text !== original) {
    // JSON buzilmaganini TASDIQLAYMIZ — yozishdan oldin
    try {
      JSON.parse(text);
    } catch (err) {
      console.error(`XATO: ${path.relative(PUBLIC_DIR, file)} JSON buzildi — o'tkazib yuborildi`);
      console.error(`  ${err.message}`);
      continue;
    }
    touched.push({ file: path.relative(PUBLIC_DIR, file).replace(/\\/g, '/'), local });
    if (APPLY) fs.writeFileSync(file, text);
  }
}

console.log(APPLY ? '=== QO\'LLANDI ===' : '=== KO\'RISH (dry-run) ===');
console.log(`Skanerlangan fayl: ${files.length}\n`);

for (const t of touched) {
  console.log(t.file);
  for (const l of t.local) console.log(`   ${l}`);
}

console.log(`\n=== JAMI ===`);
let grand = 0;
for (const fix of [...FIXES, ...CYR_RU_FIXES, ...PHRASE_FIXES]) {
  const n = perFix.get(fix.bad);
  grand += n;
  const mark = n ? ' ' : ' (topilmadi) ';
  console.log(`${String(n).padStart(4)}x${mark}${fix.bad} -> ${fix.good}   [${fix.why}]`);
}
for (const [label, n] of textNormStats) {
  console.log(`${String(n).padStart(4)}x ${label}   [tuzilmaviy]`);
}
console.log(`${String(optionLeadCount).padStart(4)}x javob varianti boshidagi tinish belgisi   [tuzilmaviy]`);
console.log(`${String(optionCaseCount).padStart(4)}x javob varianti bosh harfi   [tuzilmaviy]`);

console.log(
  `\nO'zgargan fayl: ${touched.length} | jami almashtirish: ${grand + optionCaseCount + optionLeadCount + textNormCount}`,
);
if (!APPLY) console.log("\nYozish uchun: node scripts/question-tools/fix-uz-spelling-2026-08.cjs apply");
