/**
 * AVTOMATIK YASALGAN — QO'LDA TAHRIRLAMANG.
 * Manba: src/pages/*.tsx (yo'l va kalit) + src/locales/*.json (matn).
 * Qayta yasash: node scripts/generate-seo-meta.cjs
 */

export interface SeoMeta {
  title: string;
  description: string;
  keywords: string;
}

/** Yo'l (til prefiksisiz) → til → meta. */
export const SEO_META: Record<string, Record<string, SeoMeta>> = {
  "/avtodrom": {
    "uz-lat": {
      "title": "Avtodrom — amaliy imtihon jarima ballari",
      "description": "Haydovchilik amaliy imtihonida (avtodrom) beriladigan jarima ballari: kichik, o'rta va qo'pol xatoliklar to'liq ro'yxati.",
      "keywords": "avtodrom, amaliy imtihon, jarima ballari, haydovchilik imtihoni"
    },
    "uz": {
      "title": "Автодром — амалий имтиҳон жарима баллари",
      "description": "Ҳайдовчилик амалий имтиҳонида (автодром) бериладиган жарима баллари: кичик, ўрта ва қўпол хатоликлар тўлиқ рўйхати.",
      "keywords": "автодром, амалий имтиҳон, жарима баллари, ҳайдовчилик имтиҳони"
    },
    "ru": {
      "title": "Автодром — штрафные баллы практического экзамена",
      "description": "Штрафные баллы на практическом экзамене по вождению (автодром): полный список мелких, средних и грубых ошибок.",
      "keywords": "автодром, практический экзамен, штрафные баллы, экзамен по вождению"
    }
  },
  "/avtoimtihon-2026": {
    "uz-lat": {
      "title": "Avto imtihon 2026 — qoidalar va ballar",
      "description": "2026-yilda haydovchilik imtihoni qanday topshiriladi: 20 savol, 25 daqiqa, 18 ta to'g'ri javob. Avtodrom va shahar bosqichlari.",
      "keywords": "avto imtihon 2026, avtoimtihon 2026, haydovchilik imtihoni 2026, nazariy imtihon qoidalari, o'tish bali"
    },
    "uz": {
      "title": "Авто имтиҳон 2026 — қоидалар ва баллар",
      "description": "2026-йилда ҳайдовчилик имтиҳони қандай топширилади: 20 савол, 25 дақиқа, 18 та тўғри жавоб. Автодром ва шаҳар босқичлари.",
      "keywords": "авто имтиҳон 2026, автоимтиҳон 2026, ҳайдовчилик имтиҳони 2026, назарий имтиҳон қоидалари, ўтиш бали"
    },
    "ru": {
      "title": "Экзамен на права 2026 — правила и баллы",
      "description": "Как проходит экзамен на водительские права в 2026 году: 20 вопросов, 25 минут, 18 правильных ответов. Этапы автодрома и города.",
      "keywords": "экзамен на права 2026, экзамен ПДД 2026, правила экзамена, проходной балл, теоретический экзамен"
    }
  },
  "/belgilar": {
    "uz-lat": {
      "title": "Yo'l belgilari 2026 — rasm va izoh",
      "description": "O'zbekiston YHQ yo'l belgilarining to'liq ro'yxati: ogohlantiruvchi, taqiqlovchi, buyuruvchi va axborot belgilari — rasm va izoh bilan.",
      "keywords": "yo'l belgilari 2026, ogohlantiruvchi belgilar, taqiqlovchi belgilar, buyuruvchi belgilar, yo'l chiziqlari"
    },
    "uz": {
      "title": "Йўл белгилари 2026 — расм ва изоҳ",
      "description": "Ўзбекистон ЙҲҚ йўл белгиларининг тўлиқ рўйхати: огоҳлантирувчи, тақиқловчи, буюрувчи ва ахборот белгилари — расм ва изоҳ билан.",
      "keywords": "йўл белгилари 2026, огоҳлантирувчи белгилар, тақиқловчи белгилар"
    },
    "ru": {
      "title": "Дорожные знаки 2026 — с картинками",
      "description": "Полный список дорожных знаков Узбекистана: предупреждающие, запрещающие, предписывающие и информационные — с картинками и пояснением.",
      "keywords": "дорожные знаки 2026, предупреждающие знаки, запрещающие знаки"
    }
  },
  "/bolimlar": {
    "uz-lat": {
      "title": "Bo'limlar — testlar, belgilar, darslik",
      "description": "Avtotestu.uz barcha bo'limlari bir joyda: mavzuli testlar, 63 variant, yo'l belgilari, darslik va qo'shimcha materiallar.",
      "keywords": "bo'limlar, mavzuli testlar, yo'l belgilari, darslik, variantlar"
    },
    "uz": {
      "title": "Бўлимлар — тестлар, белгилар, дарслик",
      "description": "Avtotestu.uz барча бўлимлари бир жойда: мавзули тестлар, 63 вариант, йўл белгилари, дарслик ва қўшимча материаллар.",
      "keywords": "бўлимлар, мавзули тестлар, йўл белгилари, дарслик, вариантлар"
    },
    "ru": {
      "title": "Разделы — тесты, знаки, видеоуроки",
      "description": "Все разделы Avtotestu.uz в одном месте: тематические тесты, 63 варианта, дорожные знаки, видеоуроки и дополнительные материалы.",
      "keywords": "разделы, тематические тесты, дорожные знаки, видеоуроки, варианты"
    }
  },
  "/contact": {
    "uz-lat": {
      "title": "Aloqa va yordam",
      "description": "Savolingiz bormi? Telegram, telefon yoki forma orqali bog'laning — tez orada javob beramiz.",
      "keywords": ""
    },
    "uz": {
      "title": "Алоқа ва ёрдам",
      "description": "Саволингиз борми? Telegram, телефон ёки форма орқали боғланинг — тез орада жавоб берамиз.",
      "keywords": ""
    },
    "ru": {
      "title": "Контакты и поддержка",
      "description": "Есть вопрос? Свяжитесь через Telegram, телефон или форму — мы ответим в ближайшее время.",
      "keywords": ""
    }
  },
  "/darslik": {
    "uz-lat": {
      "title": "Video Darslik — YHQ bo'yicha 211 ta video",
      "description": "YHQ bo'yicha 11 bob va 211 ta video darslik: belgilar, chiziqlar, chorrahalar va imtihon mavzulari.",
      "keywords": "YHQ darslik, video darslar, haydovchilik kursi, avto darslik, prava video"
    },
    "uz": {
      "title": "Видео дарслик — ЙҲҚ бўйича 211 та видео",
      "description": "ЙҲҚ бўйича 11 боб ва 211 та видео дарслик: белгилар, чизиқлар, чорраҳалар ва имтиҳон мавзулари.",
      "keywords": "ЙҲҚ дарслик, видео дарслар, ҳайдовчилик курси, авто дарслик, права видео"
    },
    "ru": {
      "title": "Видеоуроки ПДД — 211 видео",
      "description": "11 глав и 211 видеоуроков по ПДД: знаки, разметка, перекрёстки и экзаменационные темы.",
      "keywords": "уроки ПДД, видеоуроки, автошкола онлайн, обучение вождению, ПДД видео"
    }
  },
  "/desktop": {
    "uz-lat": {
      "title": "Desktop ilova — Offline YHQ test",
      "description": "Windows uchun offline YHQ test ilovasi: internetsiz test ishlang, katta ekranda qulay o'rganing. Bepul.",
      "keywords": "avtosmart desktop, offline test, windows ilova, prava test offline"
    },
    "uz": {
      "title": "Десктоп илова — Оффлайн ЙҲҚ тест",
      "description": "Windows учун оффлайн ЙҲҚ тест иловаси: интернетсиз тест ишланг, катта экранда қулай ўрганинг. Бепул.",
      "keywords": "авто тестлар десктоп, оффлайн тест, windows илова, права тест оффлайн"
    },
    "ru": {
      "title": "Десктоп-приложение — офлайн тесты ПДД",
      "description": "Приложение ПДД для Windows: проходите тесты без интернета, удобно учитесь на большом экране. Бесплатно.",
      "keywords": "ПДД приложение, офлайн тесты, приложение windows, тесты ПДД без интернета"
    }
  },
  "/e-avtomaktab": {
    "uz-lat": {
      "title": "E-avtomaktab 2026 — qo'llanma va test",
      "description": "E-avtomaktab nima, elektron guvohnoma qanday beriladi va nazariy imtihon qanday o'tadi: 20 savol, 25 daqiqa, 18 ta to'g'ri javob. Bepul mashq testi.",
      "keywords": "e avtomaktab, eavtomaktab, e-avtomaktab, e avtotalim, eavtotalim, avtomaktab test, elektron guvohnoma, nazariy imtihon"
    },
    "uz": {
      "title": "E-автомактаб 2026 — қўлланма ва тест",
      "description": "E-автомактаб нима, электрон гувоҳнома қандай берилади ва назарий имтиҳон қандай ўтади: 20 савол, 25 дақиқа, 18 та тўғри жавоб. Бепул машқ тести.",
      "keywords": "е автомактаб, еавтомактаб, е-автомактаб, е автоталим, автомактаб тест, электрон гувоҳнома, назарий имтиҳон"
    },
    "ru": {
      "title": "E-avtomaktab 2026 — руководство и тест",
      "description": "Что такое E-avtomaktab, как выдаётся электронное свидетельство и как проходит теоретический экзамен: 20 вопросов, 25 минут, 18 верных ответов.",
      "keywords": "e avtomaktab, автомактаб, электронное свидетельство, теоретический экзамен, автошкола Узбекистан"
    }
  },
  "/e-avtomaktab-test": {
    "uz-lat": {
      "title": "E-avtomaktab test savollari 2026",
      "description": "E-avtomaktab nazariy imtihoniga tayyorgarlik: 20 savol, 25 daqiqa, rasmiy format. Ro'yxatdan o'tmasdan bepul ishlang, javoblar izohi bilan.",
      "keywords": "e avtomaktab test savollari, e avtomaktab testni boshlash, e avtomaktab test online, eavtotalim test, avtomaktab test, nazariy imtihon test"
    },
    "uz": {
      "title": "E-автомактаб тест саволлари 2026",
      "description": "E-автомактаб назарий имтиҳонига тайёргарлик: 20 савол, 25 дақиқа, расмий формат. Рўйхатдан ўтмасдан бепул ишланг, жавоблар изоҳи билан.",
      "keywords": "е автомактаб тест саволлари, е автомактаб тестни бошлаш, е автомактаб тест онлайн, автомактаб тест, назарий имтиҳон тест"
    },
    "ru": {
      "title": "E-avtomaktab — тестовые вопросы 2026",
      "description": "Подготовка к теоретическому экзамену E-avtomaktab: 20 вопросов, 25 минут, официальный формат. Бесплатно и без регистрации, с пояснениями к ответам.",
      "keywords": "e avtomaktab тест, тест автомактаб онлайн, вопросы теоретического экзамена, пробный тест ПДД"
    }
  },
  "/": {
    "uz-lat": {
      "title": "Avto test — Prava test va YHQ testlar 2026",
      "description": "Avto test 2026: prava test va YHQ testlar, yo'l belgilari, 63 variant. Bepul onlayn — AvtoSmart.",
      "keywords": ""
    },
    "uz": {
      "title": "Авто тест — Права тест ва ЙҲҚ тестлар 2026",
      "description": "Авто тест 2026: права тест ва ЙҲҚ тестлар, йўл белгилари, 63 вариант. Бепул онлайн — AvtoSmart.",
      "keywords": ""
    },
    "ru": {
      "title": "Avto test — Права и ПДД тесты 2026",
      "description": "Avto test 2026: тест на права и ПДД, дорожные знаки, 63 варианта. Бесплатно онлайн — AvtoSmart.",
      "keywords": ""
    }
  },
  "/mavzuli": {
    "uz-lat": {
      "title": "Mavzuli testlar 2026",
      "description": "YHQ mavzulari bo'yicha testlar: yo'l belgilari, svetofor, ustunlik, to'xtash va to'xtab turish qoidalari. Har bir mavzuni alohida o'rganing.",
      "keywords": "mavzuli test, YHQ mavzular, prava test, yo'l belgilari testi"
    },
    "uz": {
      "title": "Мавзули тестлар 2026",
      "description": "ЙҲҚ мавзулари бўйича тестлар: йўл белгилари, светофор, устунлик, тўхташ ва тўхтаб туриш қоидалари. Ҳар бир мавзуни алоҳида ўрганинг.",
      "keywords": "мавзули тест, ЙҲҚ мавзулар, права тест, йўл белгилари тести"
    },
    "ru": {
      "title": "Тематические тесты ПДД 2026",
      "description": "Тесты по темам ПДД: дорожные знаки, светофор, приоритет проезда, остановка и стоянка. Изучайте каждую тему отдельно.",
      "keywords": "тематические тесты, темы ПДД, тесты на права, тест дорожные знаки"
    }
  },
  "/pro": {
    "uz-lat": {
      "title": "PRO obuna — cheksiz test va to'liq izohlar",
      "description": "PRO obuna bilan cheksiz test, 1250+ savol, 63 ta variant, to'liq va tushunarli izohlar hamda reklamasiz o'rganish — atigi 35 000 so'm/oy.",
      "keywords": "pro obuna, premium, avtosmart pro, savol izohlari, prava test premium, 1250 savol"
    },
    "uz": {
      "title": "PRO обуна — чексиз тест ва тўлиқ изоҳлар",
      "description": "PRO обуна билан чексиз тест, 1250+ савол, 63 та вариант, тўлиқ ва тушунарли изоҳлар ҳамда рекламасиз ўрганиш — атиги 35 000 сўм/ой.",
      "keywords": "pro обуна, premium, avtosmart pro, савол изоҳлари, права тест premium, 1250 савол"
    },
    "ru": {
      "title": "PRO подписка — безлимитные тесты и полные объяснения",
      "description": "С PRO подпиской: безлимитные тесты, 1250+ вопросов, 63 варианта, полные и понятные объяснения и обучение без рекламы — всего 35 000 сум/мес.",
      "keywords": "pro подписка, premium, avtosmart pro, объяснения вопросов, тест на права premium, 1250 вопросов"
    }
  },
  "/qidirish": {
    "uz-lat": {
      "title": "Savol qidirish — YHQ testlari",
      "description": "1250 ta YHQ savoli ichidan matn bo'yicha qidiring: savol matni yoki javob varianti bo'yicha.",
      "keywords": "savol qidirish, YHQ savollari, test qidiruv"
    },
    "uz": {
      "title": "Савол қидириш — ЙҲҚ тестлари",
      "description": "1250 та ЙҲҚ саволи ичидан матн бўйича қидиринг: савол матни ёки жавоб варианти бўйича.",
      "keywords": "савол қидириш, ЙҲҚ саволлари, тест қидирув"
    },
    "ru": {
      "title": "Поиск вопросов — тесты ПДД",
      "description": "Ищите среди 1250 вопросов ПДД по тексту: по формулировке вопроса или варианту ответа.",
      "keywords": "поиск вопросов, вопросы ПДД, поиск по тестам"
    }
  },
  "/qiyin-savollar": {
    "uz-lat": {
      "title": "Qiyin savollar — 250 ta eng ko'p xato",
      "description": "Foydalanuvchilar eng ko'p xato qilgan 250 ta savol, 50 tadan 5 bo'limda. Eng qiyinidan boshlab mashq qiling.",
      "keywords": "qiyin savollar, eng ko'p xato, YHQ qiyin testlar, prava qiyin savollar"
    },
    "uz": {
      "title": "Қийин саволлар — 250 та энг кўп хато",
      "description": "Фойдаланувчилар энг кўп хато қилган 250 та савол, 50 тадан 5 бўлимда. Энг қийинидан бошлаб машқ қилинг.",
      "keywords": "қийин саволлар, энг кўп хато, ЙҲҚ қийин тестлар, права қийин саволлар"
    },
    "ru": {
      "title": "Сложные вопросы — 250 частых ошибок",
      "description": "250 вопросов, в которых пользователи ошибаются чаще всего, по 50 в 5 разделах. Начните с самых трудных.",
      "keywords": "сложные вопросы ПДД, частые ошибки, трудные тесты, каверзные вопросы"
    }
  },
  "/qoshimcha": {
    "uz-lat": {
      "title": "Test tayyorgarligi — maslahat va usul",
      "description": "YHQ imtihoniga tez va samarali tayyorlanish sirlari: o'rganish strategiyalari, amaliy mashqlar va tajribali maslahatlar — bir joyda.",
      "keywords": "test tayyorgarlik, o'rganish strategiyasi, imtihon maslahatlari, YHQ yo'riqnoma"
    },
    "uz": {
      "title": "Тест тайёргарлиги — маслаҳат ва усул",
      "description": "ЙҲҚ имтиҳонига тез ва самарали тайёрланиш сирлари: ўрганиш стратегиялари, амалий машқлар ва тажрибали маслаҳатлар — бир жойда.",
      "keywords": "тест тайёргарлик, ўрганиш стратегияси, имтиҳон маслаҳатлари, ЙҲҚ йўриқнома"
    },
    "ru": {
      "title": "Подготовка к тесту — советы и методы",
      "description": "Как быстро и эффективно подготовиться к экзамену ПДД: стратегии обучения, практические упражнения и советы — в одном месте.",
      "keywords": "подготовка к экзамену, как сдать ПДД, советы по экзамену, методика обучения"
    }
  },
  "/real-imtihon": {
    "uz-lat": {
      "title": "Real imtihon — YHQ imtihon sinovi 2026",
      "description": "Haqiqiy imtihon shartlarida sinov: 20 ta tasodifiy savol, 25 daqiqa, izohsiz. Rasmiy imtihon dasturi ko'rinishida.",
      "keywords": "real imtihon, YHQ imtihon, prava imtihon sinovi, imtihon dasturi"
    },
    "uz": {
      "title": "Реал имтиҳон — ЙҲҚ имтиҳон синови 2026",
      "description": "Ҳақиқий имтиҳон шартларида синов: 20 та тасодифий савол, 25 дақиқа, изоҳсиз. Расмий имтиҳон дастури кўринишида.",
      "keywords": "реал имтиҳон, ЙҲҚ имтиҳон, права имтиҳон синови, имтиҳон дастури"
    },
    "ru": {
      "title": "Реальный экзамен — пробный экзамен ПДД 2026",
      "description": "Пробный экзамен в реальных условиях: 20 случайных вопросов, 25 минут, без пояснений. В формате официальной экзаменационной программы.",
      "keywords": "реальный экзамен ПДД, пробный экзамен, экзамен на права онлайн, экзаменационная программа"
    }
  },
  "/test-ishlash": {
    "uz-lat": {
      "title": "Avto test ishlash 2026 — 20/50 savol",
      "description": "Avto test online 2026: 1250+ YHQ savol. 20 yoki 50 ta tasodifiy savol, 25 daqiqa, 18/20 o'tish bali. Bepul, ro'yxatsiz — haqiqiy imtihon formatida.",
      "keywords": "test ishlash, onlayn test, prava test, YHQ savollari, avtotest, avtomaktab test, avto test ishlash 2026"
    },
    "uz": {
      "title": "Авто тест ишлаш 2026 — 20/50 савол",
      "description": "Авто тест онлайн 2026: 1250+ ЙҲҚ савол. 20 ёки 50 та тасодифий савол, 25 дақиқа, 18/20 ўтиш бали. Бепул, рўйхатсиз — ҳақиқий имтиҳон форматида.",
      "keywords": "тест ишлаш, онлайн тест, права тест, ЙҲҚ саволлари, авто тест, автомактаб тест, авто тест ишлаш 2026"
    },
    "ru": {
      "title": "Тесты ПДД онлайн 2026 — 20/50 вопросов",
      "description": "Тесты ПДД онлайн 2026: более 1250 вопросов. 20 или 50 вопросов, 25 минут, проходной балл 18/20. Бесплатно и без регистрации.",
      "keywords": "тесты ПДД, тесты онлайн, тесты на права, билеты ПДД, ПДД Узбекистан, экзамен ПДД 2026"
    }
  },
  "/variant": {
    "uz-lat": {
      "title": "63 ta test varianti 2026 — bepul",
      "description": "63 ta YHQ test varianti, har birida 20 ta savol — xuddi haqiqiy imtihondagidek. Bepul onlayn ishlang va prava olishga to'liq tayyorlaning.",
      "keywords": "test varianti, prava test, imtihon savollari, YHQ test, 63 variant"
    },
    "uz": {
      "title": "63 та тест варианти 2026 — бепул",
      "description": "63 та ЙҲҚ тест варианти, ҳар бирида 20 та савол — худди ҳақиқий имтиҳондагидек. Бепул онлайн ишланг ва права олишга тўлиқ тайёрланинг.",
      "keywords": "тест варианти, права тест, имтиҳон саволлари, ЙҲҚ тест, 63 вариант"
    },
    "ru": {
      "title": "63 варианта тестов 2026 — бесплатно",
      "description": "63 варианта тестов ПДД, в каждом по 20 вопросов — как на настоящем экзамене. Решайте онлайн бесплатно и полностью подготовьтесь к получению прав.",
      "keywords": "варианты тестов, билеты ПДД, экзаменационные вопросы, тесты ПДД, 63 варианта"
    }
  },
  "/yodlash-kerak": {
    "uz-lat": {
      "title": "Yodlash kerak raqamlar — tezlik, masofa",
      "description": "Imtihonda tez-tez uchraydigan raqamli ma'lumotlar: tezlik chegaralari, to'xtash masofalari, gabaritlar va boshqa me'yorlar bir joyda.",
      "keywords": "yodlash kerak raqamlar, tezlik chegarasi, to'xtash masofasi, gabarit, YHQ me'yorlari"
    },
    "uz": {
      "title": "Ёдлаш керак рақамлар — тезлик, масофа",
      "description": "Имтиҳонда тез-тез учрайдиган рақамли маълумотлар: тезлик чегаралари, тўхташ масофалари, габаритлар ва бошқа меъёрлар бир жойда.",
      "keywords": "ёдлаш керак рақамлар, тезлик чегараси, тўхташ масофаси, габарит, ЙҲҚ меъёрлари"
    },
    "ru": {
      "title": "Цифры для запоминания — скорость, дистанция",
      "description": "Числовые данные, которые часто встречаются на экзамене: ограничения скорости, тормозной путь, габариты и другие нормативы в одном месте.",
      "keywords": "цифры ПДД, ограничения скорости, тормозной путь, габариты, нормативы ПДД"
    }
  }
};
