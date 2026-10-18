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
      "title": "Yo'l belgilari 2026 — 7 guruh, 269 ta belgi rasmi bilan",
      "description": "O'zbekiston yo'l belgilarining to'liq katalogi: 7 guruh, 269 ta belgi rasm, nomi va kodi bilan. Belgilarni tez eslab qolish usullari va savol-javoblar.",
      "keywords": "yo'l belgilari 2026, ogohlantiruvchi belgilar, taqiqlovchi belgilar, buyuruvchi belgilar, yo'l chiziqlari"
    },
    "uz": {
      "title": "Йўл белгилари 2026 — 7 гуруҳ, 269 та белги расми билан",
      "description": "Ўзбекистон йўл белгиларининг тўлиқ каталоги: 7 гуруҳ, 269 та белги расм, номи ва коди билан. Белгиларни тез эслаб қолиш усуллари ва савол-жавоблар.",
      "keywords": "йўл белгилари 2026, огоҳлантирувчи белгилар, тақиқловчи белгилар"
    },
    "ru": {
      "title": "Дорожные знаки 2026 — 7 групп, 269 знаков с картинками",
      "description": "Полный каталог дорожных знаков Узбекистана: 7 групп, 269 знаков с картинкой, названием и кодом. Как быстро запомнить знаки, вопросы и ответы.",
      "keywords": "дорожные знаки 2026, предупреждающие знаки, запрещающие знаки"
    }
  },
  "/bolimlar": {
    "uz-lat": {
      "title": "Bo'limlar — testlar, belgilar, darslik",
      "description": "AvtoSmart barcha bo'limlari bir joyda: mavzuli testlar, 64 variant, yo'l belgilari, darslik va qo'shimcha materiallar.",
      "keywords": "bo'limlar, mavzuli testlar, yo'l belgilari, darslik, variantlar"
    },
    "uz": {
      "title": "Бўлимлар — тестлар, белгилар, дарслик",
      "description": "AvtoSmart барча бўлимлари бир жойда: мавзули тестлар, 64 вариант, йўл белгилари, дарслик ва қўшимча материаллар.",
      "keywords": "бўлимлар, мавзули тестлар, йўл белгилари, дарслик, вариантлар"
    },
    "ru": {
      "title": "Разделы — тесты, знаки, видеоуроки",
      "description": "Все разделы AvtoSmart в одном месте: тематические тесты, 64 варианта, дорожные знаки, видеоуроки и дополнительные материалы.",
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
      "title": "Video Darslik — YHQ bo'yicha 209 ta video",
      "description": "YHQ bo'yicha 11 bob va 209 ta video darslik: belgilar, chiziqlar, chorrahalar va imtihon mavzulari.",
      "keywords": "YHQ darslik, video darslar, haydovchilik kursi, avto darslik, prava video"
    },
    "uz": {
      "title": "Видео дарслик — ЙҲҚ бўйича 209 та видео",
      "description": "ЙҲҚ бўйича 11 боб ва 209 та видео дарслик: белгилар, чизиқлар, чорраҳалар ва имтиҳон мавзулари.",
      "keywords": "ЙҲҚ дарслик, видео дарслар, ҳайдовчилик курси, авто дарслик, права видео"
    },
    "ru": {
      "title": "Видеоуроки ПДД — 209 видео",
      "description": "11 глав и 209 видеоуроков по ПДД: знаки, разметка, перекрёстки и экзаменационные темы.",
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
      "description": "E-avtomaktab nazariy imtihoniga tayyorgarlik: 20 savol, 25 daqiqa, rasmiy format. Ro'yxatdan o'tmasdan bepul mashq qiling, batafsil izohlar PRO'da.",
      "keywords": "e avtomaktab test savollari, e avtomaktab testni boshlash, e avtomaktab test online, eavtotalim test, avtomaktab test, nazariy imtihon test"
    },
    "uz": {
      "title": "E-автомактаб тест саволлари 2026",
      "description": "E-автомактаб назарий имтиҳонига тайёргарлик: 20 савол, 25 дақиқа, расмий формат. Рўйхатдан ўтмасдан бепул машқ қилинг, батафсил изоҳлар PRO'да.",
      "keywords": "е автомактаб тест саволлари, е автомактаб тестни бошлаш, е автомактаб тест онлайн, автомактаб тест, назарий имтиҳон тест"
    },
    "ru": {
      "title": "E-avtomaktab — тестовые вопросы 2026",
      "description": "Подготовка к теоретическому экзамену E-avtomaktab: 20 вопросов, 25 минут, официальный формат. Бесплатная практика без регистрации, подробные пояснения — в PRO.",
      "keywords": "e avtomaktab тест, тест автомактаб онлайн, вопросы теоретического экзамена, пробный тест ПДД"
    }
  },
  "/": {
    "uz-lat": {
      "title": "Avto test — Prava test va YHQ testlar 2026",
      "description": "Avto test 2026: prava test va YHQ testlar, yo'l belgilari, 64 variant. Bepul onlayn — AvtoSmart.",
      "keywords": ""
    },
    "uz": {
      "title": "Авто тест — Права тест ва ЙҲҚ тестлар 2026",
      "description": "Авто тест 2026: права тест ва ЙҲҚ тестлар, йўл белгилари, 64 вариант. Бепул онлайн — AvtoSmart.",
      "keywords": ""
    },
    "ru": {
      "title": "Avto test — Права и ПДД тесты 2026",
      "description": "Avto test 2026: тест на права и ПДД, дорожные знаки, 64 варианта. Бесплатно онлайн — AvtoSmart.",
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
  "/prava-olish": {
    "uz-lat": {
      "title": "Prava olish 2026 — narxi, imtihon to'lovi va muddatlar",
      "description": "2026-yilda prava olish narxi: avtomaktab (B) o'rtacha 5,5 mln, imtihon 1,5 + 1,5 mln so'm, qayta topshirish 1,6 mln. Avtomaktabsiz bo'ladimi? Bosqichlar va muddatlar.",
      "keywords": "prava olish narxi 2026, prava olish, avtomaktab narxi, prava imtihon narxi, haydovchilik guvohnomasi olish, avtomaktabsiz prava, prava olish tartibi"
    },
    "uz": {
      "title": "Права олиш 2026 — нархи, имтиҳон тўлови ва муддатлар",
      "description": "2026 йилда права олиш нархи: автомактаб (B) ўртача 5,5 млн, имтиҳон 1,5 + 1,5 млн сўм, қайта топшириш 1,6 млн. Автомактабсиз бўладими? Босқичлар ва муддатлар.",
      "keywords": "права олиш нархи 2026, права олиш, автомактаб нархи, права имтиҳон нархи, ҳайдовчилик гувоҳномаси олиш, автомактабсиз права"
    },
    "ru": {
      "title": "Права в Узбекистане 2026 — стоимость, экзамен и сроки",
      "description": "Сколько стоит получить права в 2026: автошкола (B) в среднем 5,5 млн, экзамены 1,5 + 1,5 млн сум, пересдача 1,6 млн. Можно ли без автошколы? Этапы и сроки.",
      "keywords": "получить права узбекистан 2026, стоимость прав, цена автошколы, стоимость экзамена на права, права без автошколы, порядок получения прав"
    }
  },
  "/pro": {
    "uz-lat": {
      "title": "PRO obuna — 1275 savol, 64 variant va izohlar",
      "description": "PRO obuna: 1275 ta savol, 64 ta variant, mavzuli testlar va har bir savolga izoh. Oyiga 35 000 so'm.",
      "keywords": "pro obuna, premium, avtosmart pro, savol izohlari, prava test premium, 1275 savol"
    },
    "uz": {
      "title": "PRO обуна — 1275 савол, 64 вариант ва изоҳлар",
      "description": "PRO обуна: 1275 та савол, 64 та вариант, мавзули тестлар ва ҳар бир саволга изоҳ. Ойига 35 000 сўм.",
      "keywords": "pro обуна, премиум, avtosmart pro, савол изоҳлари, права тест премиум, 1275 савол"
    },
    "ru": {
      "title": "PRO подписка — 1275 вопросов, 64 варианта и пояснения",
      "description": "Подписка PRO: 1275 вопросов, 64 варианта, тесты по темам и пояснение к каждому вопросу. 35 000 сумов в месяц.",
      "keywords": "pro подписка, премиум, avtosmart pro, пояснения к вопросам, права тест премиум, 1275 вопросов"
    }
  },
  "/qidirish": {
    "uz-lat": {
      "title": "Savol qidirish — YHQ testlari",
      "description": "1275 ta YHQ savoli ichidan matn bo'yicha qidiring: savol matni yoki javob varianti bo'yicha.",
      "keywords": "savol qidirish, YHQ savollari, test qidiruv"
    },
    "uz": {
      "title": "Савол қидириш — ЙҲҚ тестлари",
      "description": "1275 та ЙҲҚ саволи ичидан матн бўйича қидиринг: савол матни ёки жавоб варианти бўйича.",
      "keywords": "савол қидириш, ЙҲҚ саволлари, тест қидирув"
    },
    "ru": {
      "title": "Поиск вопросов — тесты ПДД",
      "description": "Ищите среди 1275 вопросов ПДД по тексту: по формулировке вопроса или варианту ответа.",
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
      "title": "Avto test ishlash 2026 — 20 savol, 25 daqiqa, 18/20",
      "description": "Avto test online 2026: 20 ta tasodifiy YHQ savoli, 25 daqiqa, o'tish uchun 18 ta to'g'ri javob. Ro'yxatsiz bepul boshlang, PRO'da 1275 ta savol va izohlar.",
      "keywords": "test ishlash, onlayn test, prava test, YHQ savollari, avtotest, avtomaktab test, avto test ishlash 2026"
    },
    "uz": {
      "title": "Авто тест ишлаш 2026 — 20 савол, 25 дақиқа, 18/20",
      "description": "Авто тест онлайн 2026: 20 та тасодифий ЙҲҚ саволи, 25 дақиқа, ўтиш учун 18 та тўғри жавоб. Рўйхатсиз бепул бошланг, PRO'да 1275 та савол ва изоҳлар.",
      "keywords": "тест ишлаш, онлайн тест, права тест, ЙҲҚ саволлари, авто тест, автомактаб тест, авто тест ишлаш 2026"
    },
    "ru": {
      "title": "Тесты ПДД онлайн 2026 — 20 вопросов, 25 минут, 18/20",
      "description": "Тесты ПДД онлайн 2026: 20 случайных вопросов, 25 минут, для сдачи нужно 18 правильных ответов. Начните бесплатно без регистрации, в PRO — 1275 вопросов и пояснения.",
      "keywords": "тесты ПДД, тесты онлайн, тесты на права, билеты ПДД, ПДД Узбекистан, экзамен ПДД 2026"
    }
  },
  "/variant": {
    "uz-lat": {
      "title": "64 ta test varianti 2026 — 3 tasi bepul",
      "description": "64 ta YHQ test varianti, har birida 20 ta savol — xuddi haqiqiy imtihondagidek. 3 tasini bepul ishlang, barchasi PRO'da — prava olishga to'liq tayyorlaning.",
      "keywords": "test varianti, prava test, imtihon savollari, YHQ test, 64 variant"
    },
    "uz": {
      "title": "64 та тест варианти 2026 — 3 таси бепул",
      "description": "64 та ЙҲҚ тест варианти, ҳар бирида 20 та савол — худди ҳақиқий имтиҳондагидек. 3 тасини бепул ишланг, барчаси PRO'да — права олишга тўлиқ тайёрланинг.",
      "keywords": "тест варианти, права тест, имтиҳон саволлари, ЙҲҚ тест, 64 вариант"
    },
    "ru": {
      "title": "64 варианта тестов 2026 — 3 бесплатно",
      "description": "64 варианта тестов ПДД, в каждом по 20 вопросов — как на настоящем экзамене. 3 варианта бесплатно, все — в PRO. Полностью подготовьтесь к получению прав.",
      "keywords": "варианты тестов, билеты ПДД, экзаменационные вопросы, тесты ПДД, 64 варианта"
    }
  },
  "/yangiliklar": {
    "uz-lat": {
      "title": "Yangiliklar",
      "description": "AvtoSmart rasmiy yangiliklari: YHQ testlari, PRO obuna, video darslik va foydali maslahatlar.",
      "keywords": "avtosmart yangiliklar, YHQ yangiliklari, prava test yangiliklari, haydovchilik guvohnomasi"
    },
    "uz": {
      "title": "Янгиликлар",
      "description": "AvtoSmart расмий янгиликлари: ЙҲҚ тестлари, PRO обуна, видео дарслик ва фойдали маслаҳатлар.",
      "keywords": "avtosmart янгиликлар, ЙҲҚ янгиликлари, права тест янгиликлари, ҳайдовчилик гувоҳномаси"
    },
    "ru": {
      "title": "Новости AvtoSmart",
      "description": "Официальные новости AvtoSmart: обновления тестов ПДД, PRO-подписка, видеоуроки и полезные советы.",
      "keywords": "новости avtosmart, новости ПДД, права тест, водительское удостоверение"
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
  },
  "/yodlash-kerak/tezlik": {
    "uz-lat": {
      "title": "Tezlik chegaralari — Yodlash kerak",
      "description": "Transport turiga va joylashuvga qarab ruxsat etilgan eng yuqori tezlik",
      "keywords": ""
    },
    "uz": {
      "title": "Тезлик чегаралари — Ёдлаш керак",
      "description": "Транспорт турига ва жойлашувга қараб рухсат этилган энг юқори тезлик",
      "keywords": ""
    },
    "ru": {
      "title": "Ограничения скорости — Нужно запомнить",
      "description": "Максимально разрешённая скорость в зависимости от типа транспорта и участка дороги",
      "keywords": ""
    }
  },
  "/yodlash-kerak/reaktsiya": {
    "uz-lat": {
      "title": "Tormozlash va reaktsiya masofasi — Yodlash kerak",
      "description": "Haydovchi xavfni sezgandan tormozgacha bosib o'tadigan taxminiy masofa",
      "keywords": ""
    },
    "uz": {
      "title": "Тормозлаш ва реакция масофаси — Ёдлаш керак",
      "description": "Ҳайдовчи хавфни сезгандан тормозгача босиб ўтадиган тахминий масофа",
      "keywords": ""
    },
    "ru": {
      "title": "Тормозной путь и время реакции — Нужно запомнить",
      "description": "Примерное расстояние, которое проезжает водитель от момента опасности до торможения",
      "keywords": ""
    }
  },
  "/yodlash-kerak/toxtash": {
    "uz-lat": {
      "title": "To'xtash cheklovlari — Yodlash kerak",
      "description": "Transport vositasini to'xtatish yoki to'xtab turish taqiqlangan masofalar",
      "keywords": ""
    },
    "uz": {
      "title": "Тўхташ чекловлари — Ёдлаш керак",
      "description": "Транспорт воситасини тўхтатиш ёки тўхтаб туриш тақиқланган масофалар",
      "keywords": ""
    },
    "ru": {
      "title": "Ограничения на остановку — Нужно запомнить",
      "description": "Расстояния, на которых запрещена остановка или стоянка",
      "keywords": ""
    }
  },
  "/yodlash-kerak/avariya-belgisi": {
    "uz-lat": {
      "title": "Avariya to'xtash belgisi — Yodlash kerak",
      "description": "Ogohlantiruvchi uchburchak belgisini qo'yish qoidalari",
      "keywords": ""
    },
    "uz": {
      "title": "Авария тўхташ белгиси — Ёдлаш керак",
      "description": "Огоҳлантирувчи учбурчак белгисини қўйиш қоидалари",
      "keywords": ""
    },
    "ru": {
      "title": "Знак аварийной остановки — Нужно запомнить",
      "description": "Правила установки предупреждающего треугольного знака",
      "keywords": ""
    }
  },
  "/yodlash-kerak/gabarit": {
    "uz-lat": {
      "title": "Transport o'lchamlari — Yodlash kerak",
      "description": "Maxsus ruxsatnomasiz harakatlanish uchun yo'l qo'yiladigan eng katta o'lchamlar",
      "keywords": ""
    },
    "uz": {
      "title": "Транспорт ўлчамлари — Ёдлаш керак",
      "description": "Махсус рухсатномасиз ҳаракатланиш учун йўл қўйиладиган энг катта ўлчамлар",
      "keywords": ""
    },
    "ru": {
      "title": "Габариты транспортного средства — Нужно запомнить",
      "description": "Наибольшие размеры, допустимые для движения без специального разрешения",
      "keywords": ""
    }
  },
  "/yodlash-kerak/yuk": {
    "uz-lat": {
      "title": "Yuk tashish qoidalari — Yodlash kerak",
      "description": "Yukning transport vositasi chegarasidan chiqib turishiga qo'yilgan cheklovlar",
      "keywords": ""
    },
    "uz": {
      "title": "Юк ташиш қоидалари — Ёдлаш керак",
      "description": "Юкнинг транспорт воситаси чегарасидан чиқиб туришига қўйилган чекловлар",
      "keywords": ""
    },
    "ru": {
      "title": "Правила перевозки груза — Нужно запомнить",
      "description": "Ограничения на выступание груза за габариты транспортного средства",
      "keywords": ""
    }
  },
  "/yodlash-kerak/shatak": {
    "uz-lat": {
      "title": "Shatakka olish — Yodlash kerak",
      "description": "Boshqa transport vositasini tirkab olib ketishda ulagichga qo'yiladigan talablar",
      "keywords": ""
    },
    "uz": {
      "title": "Шатакка олиш — Ёдлаш керак",
      "description": "Бошқа транспорт воситасини тиркаб олиб кетишда улагичга қўйиладиган талаблар",
      "keywords": ""
    },
    "ru": {
      "title": "Буксировка — Нужно запомнить",
      "description": "Требования к сцепке при буксировке другого транспортного средства",
      "keywords": ""
    }
  },
  "/yodlash-kerak/shina": {
    "uz-lat": {
      "title": "G'ildirak protektori — Yodlash kerak",
      "description": "Protektor chuqurligi shu ko'rsatkichdan kam bo'lsa, harakatlanish taqiqlanadi",
      "keywords": ""
    },
    "uz": {
      "title": "Ғилдирак протектори — Ёдлаш керак",
      "description": "Протектор чуқурлиги шу кўрсаткичдан кам бўлса, ҳаракатланиш тақиқланади",
      "keywords": ""
    },
    "ru": {
      "title": "Протектор шины — Нужно запомнить",
      "description": "Если глубина протектора меньше этого значения, движение запрещено",
      "keywords": ""
    }
  },
  "/yodlash-kerak/rul-tormoz": {
    "uz-lat": {
      "title": "Rul erkinligi va tormoz — Yodlash kerak",
      "description": "Rul g'ildiragining ruxsat etilgan erkin yurishi va tormoz tizimiga qo'yiladigan talablar",
      "keywords": ""
    },
    "uz": {
      "title": "Рул эркинлиги ва тормоз — Ёдлаш керак",
      "description": "Рул ғилдирагининг рухсат этилган эркин юриши ва тормоз тизимига қўйиладиган талаблар",
      "keywords": ""
    },
    "ru": {
      "title": "Свободный ход руля и тормоза — Нужно запомнить",
      "description": "Допустимый свободный ход рулевого колеса и требования к тормозной системе",
      "keywords": ""
    }
  }
};
