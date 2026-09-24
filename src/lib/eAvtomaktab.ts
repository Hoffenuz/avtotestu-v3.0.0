// ============================================================================
// eAvtomaktab — e-avtomaktab / e-avtota'lim va nazariy imtihon haqida mazmun
// ----------------------------------------------------------------------------
// MANBALAR (2026-yil 7-sentyabr holatiga):
//   • Gazeta.uz, 2025-10-16 — avtomaktab bitiruvchilariga yagona namunadagi
//     elektron guvohnoma joriy etiladi.
//
//     DIQQAT: e-avtotalim ning ICHKI ISHLASH MEXANIZMI haqidagi da'vo
//     (qaysi tizim moduli, guvohnoma qanday shakllantiriladi) bu yerdan
//     ATAYLAB olib tashlangan — u tasdiqlanmagan edi. Faqat tekshirilgan
//     faktlar qoladi.
//   • Kun.uz, 2025-10-27 — 2026-yil 1-fevraldan "A" va "B" toifalar uchun
//     majburiy o'quv dasturining nazariy qismini MUSTAQIL o'zlashtirishga
//     ruxsat beriladi, ya'ni avtomaktabdagi nazariy darslar ixtiyoriy bo'ladi.
//     Amaliy 20 soat va DYHXX dagi nazariy imtihon majburiyligicha qoladi.
//     Nazariy imtihonning ijobiy natijasi 2 oy amal qiladi.
//   • Nazariy imtihon formati: 20 savol, 25 daqiqa, o'tish uchun kamida
//     18 ta to'g'ri javob (2 tagacha xatoga yo'l qo'yiladi).
//
// MUHIM — BU SAYT RASMIY EMAS:
//   Bu sahifalar tayyorgarlik uchun. Rasmiy ro'yxatdan o'tish, imtihonga
//   yozilish va guvohnoma berish faqat davlat portallari orqali amalga
//   oshiriladi. Har bir sahifada rasmiy manzilga ochiq havola turishi SHART —
//   bu ham halollik, ham qidiruv tizimi uchun to'g'ri signal.
//
// FAKT O'ZGARSA: qoidalar o'zgaruvchan. Sana `MAZMUN_SANASI` da turadi va
//   sahifada ko'rsatiladi, shunda foydalanuvchi ma'lumot qachonligini biladi.
// ============================================================================

/** Uch til uchun matn. Kalitlar `questionLang` qiymatlari bilan bir xil. */
export interface Localized {
  oz: string;
  uz: string;
  ru: string;
}

/** Mazmun oxirgi marta tekshirilgan sana — sahifada ko'rsatiladi. */
export const MAZMUN_SANASI = "2026-09-07";

/** Rasmiy manzillar. Bitta joyda — sahifalarda takrorlanmasin. */
export const RASMIY = {
  avtotalim: "https://e-avtotalim.uz",
  yhxx: "https://yhxx.uz",
} as const;

// ── Imtihon formati ─────────────────────────────────────────────────────────

export interface Fakt {
  qiymat: string;
  label: Localized;
}

/** Nazariy imtihonning asosiy raqamlari. */
export const IMTIHON_FAKTLARI: readonly Fakt[] = [
  {
    qiymat: "20",
    label: { oz: "savol", uz: "савол", ru: "вопросов" },
  },
  {
    qiymat: "25",
    label: { oz: "daqiqa", uz: "дақиқа", ru: "минут" },
  },
  {
    qiymat: "18",
    label: { oz: "to'g'ri javob kerak", uz: "тўғри жавоб керак", ru: "верных ответов нужно" },
  },
  {
    qiymat: "2",
    label: { oz: "xatoga ruxsat", uz: "хатога рухсат", ru: "ошибки допускаются" },
  },
];

// ── Guvohnoma olish bosqichlari ─────────────────────────────────────────────

export interface Bosqich {
  n: number;
  sarlavha: Localized;
  matn: Localized;
  /** Majburiymi yoki ixtiyoriy — plitkada belgi bilan ko'rsatiladi. */
  majburiy: boolean;
}

export const BOSQICHLAR: readonly Bosqich[] = [
  {
    n: 1,
    majburiy: false,
    sarlavha: {
      oz: "Nazariy tayyorgarlik",
      uz: "Назарий тайёргарлик",
      ru: "Теоретическая подготовка",
    },
    matn: {
      oz: "2026-yil 1-fevraldan «A» va «B» toifalar uchun nazariy qismni mustaqil o'zlashtirish mumkin — avtomaktabda nazariy darsda qatnashish endi ixtiyoriy. Testlarni onlayn ishlab tayyorlanishingiz mumkin.",
      uz: "2026 йил 1 февралдан «A» ва «B» тоифалар учун назарий қисмни мустақил ўзлаштириш мумкин — автомактабда назарий дарсда қатнашиш энди ихтиёрий. Тестларни онлайн ишлаб тайёрланишингиз мумкин.",
      ru: "С 1 февраля 2026 года для категорий «A» и «B» теоретическую часть можно освоить самостоятельно — посещение теоретических занятий в автошколе стало необязательным. Готовиться можно, решая тесты онлайн.",
    },
  },
  {
    n: 2,
    majburiy: true,
    sarlavha: {
      oz: "Amaliy haydash — 20 soat",
      uz: "Амалий ҳайдаш — 20 соат",
      ru: "Практическое вождение — 20 часов",
    },
    matn: {
      oz: "Amaliy tayyorgarlik majburiyligicha qoladi: avtomaktab yoki litsenziyaga ega instruktor orqali 20 soat haydash. Buni onlayn o'tab bo'lmaydi.",
      uz: "Амалий тайёргарлик мажбурийлигича қолади: автомактаб ёки лицензияга эга инструктор орқали 20 соат ҳайдаш. Буни онлайн ўтаб бўлмайди.",
      ru: "Практическая подготовка остаётся обязательной: 20 часов вождения через автошколу или лицензированного инструктора. Онлайн это пройти нельзя.",
    },
  },
  {
    n: 3,
    majburiy: true,
    sarlavha: {
      oz: "Elektron guvohnoma",
      uz: "Электрон гувоҳнома",
      ru: "Электронный сертификат",
    },
    matn: {
      oz: "O'qishni tugatgach yagona namunadagi elektron guvohnoma beriladi. Uni qanday olishni avtomaktabingiz aytadi.",
      uz: "Ўқишни тугатгач ягона намунадаги электрон гувоҳнома берилади. Уни қандай олишни автомактабингиз айтади.",
      ru: "После обучения выдаётся электронный сертификат единого образца. Как его получить — подскажет ваша автошкола.",
    },
  },
  {
    n: 4,
    majburiy: true,
    sarlavha: {
      oz: "Nazariy imtihon",
      uz: "Назарий имтиҳон",
      ru: "Теоретический экзамен",
    },
    matn: {
      oz: "Imtihon DYHXX da kompyuterda topshiriladi: 20 ta tasodifiy savol, 25 daqiqa, o'tish uchun kamida 18 ta to'g'ri javob. Ijobiy natija 2 oy amal qiladi — shu muddat ichida amaliy imtihonga o'tish kerak.",
      uz: "Имтиҳон ДЙҲХХ да компьютерда топширилади: 20 та тасодифий савол, 25 дақиқа, ўтиш учун камида 18 та тўғри жавоб. Ижобий натижа 2 ой амал қилади — шу муддат ичида амалий имтиҳонга ўтиш керак.",
      ru: "Экзамен сдаётся в УБДД на компьютере: 20 случайных вопросов, 25 минут, для сдачи нужно минимум 18 верных ответов. Положительный результат действует 2 месяца — за этот срок нужно перейти к практическому экзамену.",
    },
  },
  {
    n: 5,
    majburiy: true,
    sarlavha: {
      oz: "Amaliy imtihon",
      uz: "Амалий имтиҳон",
      ru: "Практический экзамен",
    },
    matn: {
      oz: "Avtodrom va shahar sharoitida haydash tekshiriladi. Har bir xatolik uchun jarima balli beriladi — to'liq jadval saytdagi «Avtodrom» bo'limida.",
      uz: "Автодром ва шаҳар шароитида ҳайдаш текширилади. Ҳар бир хатолик учун жарима балли берилади — тўлиқ жадвал сайтдаги «Автодром» бўлимида.",
      ru: "Проверяется вождение на автодроме и в городе. За каждую ошибку начисляются штрафные баллы — полная таблица в разделе «Автодром» на сайте.",
    },
  },
];

// ── Tez-tez so'raladigan savollar ───────────────────────────────────────────

export interface Savol {
  savol: Localized;
  javob: Localized;
}

export const FAQ: readonly Savol[] = [
  {
    savol: {
      oz: "Avtomaktabsiz prava olsa bo'ladimi?",
      uz: "Автомактабсиз права олса бўладими?",
      ru: "Можно ли получить права без автошколы?",
    },
    javob: {
      oz: "To'liq emas. 2026-yil 1-fevraldan nazariy qismni mustaqil o'rganish mumkin, lekin amaliy 20 soat haydash avtomaktab yoki litsenziyali instruktor orqali o'tilishi shart. Nazariy imtihon ham DYHXX da topshiriladi.",
      uz: "Тўлиқ эмас. 2026 йил 1 февралдан назарий қисмни мустақил ўрганиш мумкин, лекин амалий 20 соат ҳайдаш автомактаб ёки лицензияли инструктор орқали ўтилиши шарт. Назарий имтиҳон ҳам ДЙҲХХ да топширилади.",
      ru: "Не полностью. С 1 февраля 2026 года теорию можно изучить самостоятельно, но 20 часов практического вождения нужно пройти через автошколу или лицензированного инструктора. Теоретический экзамен также сдаётся в УБДД.",
    },
  },
  {
    savol: {
      oz: "Nazariy imtihonda nechta xatoga yo'l qo'yiladi?",
      uz: "Назарий имтиҳонда нечта хатога йўл қўйилади?",
      ru: "Сколько ошибок допускается на теоретическом экзамене?",
    },
    javob: {
      oz: "Ikkitagacha. 20 savoldan kamida 18 tasiga to'g'ri javob berish kerak. Uch va undan ko'p xato — imtihon topshirilmagan hisoblanadi.",
      uz: "Иккитагача. 20 саволдан камида 18 тасига тўғри жавоб бериш керак. Уч ва ундан кўп хато — имтиҳон топширилмаган ҳисобланади.",
      ru: "До двух. Из 20 вопросов нужно верно ответить минимум на 18. Три и более ошибок — экзамен не сдан.",
    },
  },
  {
    savol: {
      oz: "Nazariy imtihon natijasi qancha amal qiladi?",
      uz: "Назарий имтиҳон натижаси қанча амал қилади?",
      ru: "Сколько действует результат теоретического экзамена?",
    },
    javob: {
      oz: "Ikki oy. Shu muddat ichida amaliy imtihonga o'tish kerak, aks holda nazariyni qayta topshirishga to'g'ri keladi.",
      uz: "Икки ой. Шу муддат ичида амалий имтиҳонга ўтиш керак, акс ҳолда назарийни қайта топширишга тўғри келади.",
      ru: "Два месяца. За этот срок нужно перейти к практическому экзамену, иначе теорию придётся пересдавать.",
    },
  },
  {
    savol: {
      oz: "Nazariyni qayerdan o'rganaman?",
      uz: "Назарийни қаердан ўрганаман?",
      ru: "Где изучать теорию?",
    },
    javob: {
      oz: "Rasmiy o'quv qo'llanmalari yhxx.uz saytida, «Normativ hujjatlar» bo'limining «O'quv qo'llanmalari» qismida joylashtirilgan. Savollarni mashq qilish uchun shu saytdagi bepul testlardan foydalanishingiz mumkin.",
      uz: "Расмий ўқув қўлланмалари yhxx.uz сайтида, «Норматив ҳужжатлар» бўлимининг «Ўқув қўлланмалари» қисмида жойлаштирилган. Саволларни машқ қилиш учун шу сайтдаги бепул тестлардан фойдаланишингиз мумкин.",
      ru: "Официальные учебные пособия размещены на сайте yhxx.uz, в разделе «Нормативные документы», подраздел «Учебные пособия». Для отработки вопросов можно использовать бесплатные тесты на этом сайте.",
    },
  },
];

// ── Ogohlantirish matni ─────────────────────────────────────────────────────

/**
 * Har bir sahifada ko'rinadigan ogohlantirish. Bu sayt rasmiy emasligi
 * ochiq aytilishi kerak — foydalanuvchini chalg'itmaslik uchun ham,
 * qidiruv tizimi uchun ham.
 */
export const RASMIY_EMAS: Localized = {
  oz: "Bu sayt rasmiy davlat portali emas — u imtihonga tayyorgarlik uchun. Ro'yxatdan o'tish, imtihonga yozilish va guvohnoma olish rasmiy portallar orqali amalga oshiriladi.",
  uz: "Бу сайт расмий давлат портали эмас — у имтиҳонга тайёргарлик учун. Рўйхатдан ўтиш, имтиҳонга ёзилиш ва гувоҳнома олиш расмий порталлар орқали амалга оширилади.",
  ru: "Этот сайт не является официальным государственным порталом — он предназначен для подготовки к экзамену. Регистрация, запись на экзамен и получение удостоверения производятся через официальные порталы.",
};

/** Qoidalar o'zgarishi mumkinligi haqida eslatma. */
export const YANGILANISH: Localized = {
  oz: "Qoidalar o'zgarishi mumkin. Yakuniy ma'lumotni rasmiy manbadan tekshiring.",
  uz: "Қоидалар ўзгариши мумкин. Якуний маълумотни расмий манбадан текширинг.",
  ru: "Правила могут меняться. Окончательную информацию уточняйте в официальном источнике.",
};
