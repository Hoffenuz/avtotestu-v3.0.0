// AVTOMATIK YARATILGAN FAYL — QO'LDA TAHRIRLAMANG.
//
// Manba:   src/data/darslik-videos.json, src/data/darslik-titles.json,
//          public/data/belgilar.json
// Yangilash: npm run darslik:build
//
// Dars nomlari belgilar bazasidan olinadi, ya'ni video fayl "5.10.2-5.10.3.mp4"
// deb nomlangan bo'lsa ham foydalanuvchi belgining haqiqiy nomini ko'radi.

export type DarslikLangText = { uz_lat: string; uz_cyr: string; ru: string };

/** Modul mazmuni — UI ikonkasi va kod belgisi shunga qarab tanlanadi. */
export type DarslikModuleKind = "terms" | "signs" | "markings" | "law";

export interface DarslikLesson {
  /** Barqaror id — "ko'rildi" belgisi shu bo'yicha saqlanadi. */
  id: string;
  /** Yo'l belgisi yoki chiziq kodi; atama darslarida `null`. */
  code: string | null;
  title: DarslikLangText;
  url: string;
}

export interface DarslikModule {
  id: string;
  kind: DarslikModuleKind;
  title: DarslikLangText;
  lessons: readonly DarslikLesson[];
}

export const DARSLIK_MODULES: readonly DarslikModule[] = [
  {
    "id": "umumiy-qoidalar",
    "kind": "terms",
    "title": {
      "uz_lat": "Umumiy qoidalar",
      "uz_cyr": "Умумий қоидалар",
      "ru": "Общие положения"
    },
    "lessons": [
      {
        "id": "umumiy-qoidalar/aholi-punkti",
        "code": null,
        "title": {
          "uz_lat": "Aholi punkti",
          "uz_cyr": "Аҳоли пункти",
          "ru": "Населённый пункт"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/umumiy%20qoydalar/Aholi%20punkti.mp4"
      },
      {
        "id": "umumiy-qoidalar/ajratuvchi-bolak",
        "code": null,
        "title": {
          "uz_lat": "Ajratuvchi bo'lak",
          "uz_cyr": "Ажратувчи бўлак",
          "ru": "Разделительная полоса"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/umumiy%20qoydalar/Ajratuvchi%20bo'lak.mp4"
      },
      {
        "id": "umumiy-qoidalar/arava",
        "code": null,
        "title": {
          "uz_lat": "Arava",
          "uz_cyr": "Арава",
          "ru": "Гужевая повозка"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/umumiy%20qoydalar/Arava.mp4"
      },
      {
        "id": "umumiy-qoidalar/asosiy-yol",
        "code": null,
        "title": {
          "uz_lat": "Asosiy yo'l",
          "uz_cyr": "Асосий йўл",
          "ru": "Главная дорога"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/umumiy%20qoydalar/Asosiy%20yo'l.mp4"
      },
      {
        "id": "umumiy-qoidalar/avtomagistral",
        "code": null,
        "title": {
          "uz_lat": "Avtomagistral",
          "uz_cyr": "Автомагистраль",
          "ru": "Автомагистраль"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/umumiy%20qoydalar/Avtomagistral.mp4"
      },
      {
        "id": "umumiy-qoidalar/avtopoezd",
        "code": null,
        "title": {
          "uz_lat": "Avtopoezd",
          "uz_cyr": "Автопоезд",
          "ru": "Автопоезд"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/umumiy%20qoydalar/Avtopoezd.mp4"
      },
      {
        "id": "umumiy-qoidalar/bolalar-guruhini-tashkiliy-tashish",
        "code": null,
        "title": {
          "uz_lat": "Bolalar guruhini tashkiliy tashish",
          "uz_cyr": "Болалар гуруҳини ташкилий ташиш",
          "ru": "Организованная перевозка группы детей"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/umumiy%20qoydalar/Bolalar%20guruhini%20tashkiliy%20tashish.mp4"
      },
      {
        "id": "umumiy-qoidalar/foto-va-video-qayd-etish",
        "code": null,
        "title": {
          "uz_lat": "Foto va video qayd etish",
          "uz_cyr": "Фото ва видео қайд этиш",
          "ru": "Фото- и видеофиксация"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/umumiy%20qoydalar/Foto%20va%20video%20qayd%20etish.mp4"
      },
      {
        "id": "umumiy-qoidalar/haqiqiy-vazn",
        "code": null,
        "title": {
          "uz_lat": "Haqiqiy vazn",
          "uz_cyr": "Ҳақиқий вазн",
          "ru": "Фактическая масса"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/umumiy%20qoydalar/Haqiqiy%20vazn.mp4"
      },
      {
        "id": "umumiy-qoidalar/harakatlanish-bolagi",
        "code": null,
        "title": {
          "uz_lat": "Harakatlanish bo'lagi",
          "uz_cyr": "Ҳаракатланиш бўлаги",
          "ru": "Полоса движения"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/umumiy%20qoydalar/Harakatlanish%20bo'lagi.mp4"
      },
      {
        "id": "umumiy-qoidalar/haydovchi",
        "code": null,
        "title": {
          "uz_lat": "Haydovchi",
          "uz_cyr": "Ҳайдовчи",
          "ru": "Водитель"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/umumiy%20qoydalar/Haydovchi.mp4"
      },
      {
        "id": "umumiy-qoidalar/imtiyoz",
        "code": null,
        "title": {
          "uz_lat": "Imtiyoz",
          "uz_cyr": "Имтиёз",
          "ru": "Преимущество"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/umumiy%20qoydalar/Imtiyoz.mp4"
      },
      {
        "id": "umumiy-qoidalar/majburiy-toxtash",
        "code": null,
        "title": {
          "uz_lat": "Majburiy to'xtash",
          "uz_cyr": "Мажбурий тўхташ",
          "ru": "Вынужденная остановка"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/umumiy%20qoydalar/Majburiy%20to'xtash.mp4"
      },
      {
        "id": "umumiy-qoidalar/mexanik-transport-vositasi",
        "code": null,
        "title": {
          "uz_lat": "Mexanik transport vositasi",
          "uz_cyr": "Механик транспорт воситаси",
          "ru": "Механическое транспортное средство"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/umumiy%20qoydalar/Mexanik%20transport%20vositasi.mp4"
      },
      {
        "id": "umumiy-qoidalar/moped",
        "code": null,
        "title": {
          "uz_lat": "Moped",
          "uz_cyr": "Мопед",
          "ru": "Мопед"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/umumiy%20qoydalar/Moped.mp4"
      },
      {
        "id": "umumiy-qoidalar/mototsikl",
        "code": null,
        "title": {
          "uz_lat": "Mototsikl",
          "uz_cyr": "Мотоцикл",
          "ru": "Мотоцикл"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/umumiy%20qoydalar/Mototsikl.mp4"
      },
      {
        "id": "umumiy-qoidalar/ogohlantiruvchi-ishoralar",
        "code": null,
        "title": {
          "uz_lat": "Ogohlantiruvchi ishoralar",
          "uz_cyr": "Огоҳлантирувчи ишоралар",
          "ru": "Предупредительные сигналы"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/umumiy%20qoydalar/Ogohlantiruvchi%20ishoralar.mp4"
      },
      {
        "id": "umumiy-qoidalar/piyoda",
        "code": null,
        "title": {
          "uz_lat": "Piyoda",
          "uz_cyr": "Пиёда",
          "ru": "Пешеход"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/umumiy%20qoydalar/Piyoda.mp4"
      },
      {
        "id": "umumiy-qoidalar/piyodalar-yolkasi",
        "code": null,
        "title": {
          "uz_lat": "Piyodalar yo'lkasi",
          "uz_cyr": "Пиёдалар йўлкаси",
          "ru": "Пешеходная дорожка"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/umumiy%20qoydalar/Piyodalar%20yo'lkasi.mp4"
      },
      {
        "id": "umumiy-qoidalar/piyodalar-otish-joyi",
        "code": null,
        "title": {
          "uz_lat": "Piyodalar o'tish joyi",
          "uz_cyr": "Пиёдалар ўтиш жойи",
          "ru": "Пешеходный переход"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/umumiy%20qoydalar/Piyodalar%20o'tish%20joyi.mp4"
      },
      {
        "id": "umumiy-qoidalar/piyodalarning-tashkiliy-jamlanmasi",
        "code": null,
        "title": {
          "uz_lat": "Piyodalarning tashkiliy jamlanmasi",
          "uz_cyr": "Пиёдаларнинг ташкилий жамланмаси",
          "ru": "Организованная пешая колонна"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/umumiy%20qoydalar/Piyodalarning%20tashkiliy%20jamlanmasi.mp4"
      },
      {
        "id": "umumiy-qoidalar/qatnov-qismi",
        "code": null,
        "title": {
          "uz_lat": "Qatnov qismi",
          "uz_cyr": "Қатнов қисми",
          "ru": "Проезжая часть"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/umumiy%20qoydalar/Qatnov%20qismi.mp4"
      },
      {
        "id": "umumiy-qoidalar/qorongi-vaqt",
        "code": null,
        "title": {
          "uz_lat": "Qorong'i vaqt",
          "uz_cyr": "Қоронғи вақт",
          "ru": "Тёмное время суток"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/umumiy%20qoydalar/Qorong'i%20vaqt.mp4"
      },
      {
        "id": "umumiy-qoidalar/quvib-otish",
        "code": null,
        "title": {
          "uz_lat": "Quvib o'tish",
          "uz_cyr": "Қувиб ўтиш",
          "ru": "Обгон"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/umumiy%20qoydalar/Quvib%20o'tish.mp4"
      },
      {
        "id": "umumiy-qoidalar/reversiv-harakat",
        "code": null,
        "title": {
          "uz_lat": "Reversiv harakat",
          "uz_cyr": "Реверсив ҳаракат",
          "ru": "Реверсивное движение"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/umumiy%20qoydalar/Reversiv%20harakat.mp4"
      },
      {
        "id": "umumiy-qoidalar/ruxsat-etilgan-tola-vazn",
        "code": null,
        "title": {
          "uz_lat": "Ruxsat etilgan to'la vazn",
          "uz_cyr": "Рухсат этилган тўла вазн",
          "ru": "Разрешённая максимальная масса"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/umumiy%20qoydalar/Ruxsat%20etilgan%20to'la%20vazn.mp4"
      },
      {
        "id": "umumiy-qoidalar/tartibga-soluvchi",
        "code": null,
        "title": {
          "uz_lat": "Tartibga soluvchi",
          "uz_cyr": "Тартибга солувчи",
          "ru": "Регулировщик"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/umumiy%20qoydalar/Tartibga%20soluvchi.mp4"
      },
      {
        "id": "umumiy-qoidalar/temir-yol-kesishmasi",
        "code": null,
        "title": {
          "uz_lat": "Temir yo'l kesishmasi",
          "uz_cyr": "Темир йўл кесишмаси",
          "ru": "Железнодорожный переезд"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/umumiy%20qoydalar/Temir%20yo'l%20kesishmasi.mp4"
      },
      {
        "id": "umumiy-qoidalar/tirkama",
        "code": null,
        "title": {
          "uz_lat": "Tirkama",
          "uz_cyr": "Тиркама",
          "ru": "Прицеп"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/umumiy%20qoydalar/Tirkama.mp4"
      },
      {
        "id": "umumiy-qoidalar/transport-vositalarining-tashkiliy-jamlanmasi",
        "code": null,
        "title": {
          "uz_lat": "Transport vositalarining tashkiliy jamlanmasi",
          "uz_cyr": "Транспорт воситаларининг ташкилий жамланмаси",
          "ru": "Организованная транспортная колонна"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/umumiy%20qoydalar/Transport%20vositalarining%20tashkiliy%20jamlanmasi.mp4"
      },
      {
        "id": "umumiy-qoidalar/transport-vositasi",
        "code": null,
        "title": {
          "uz_lat": "Transport vositasi",
          "uz_cyr": "Транспорт воситаси",
          "ru": "Транспортное средство"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/umumiy%20qoydalar/Transport%20vositasi.mp4"
      },
      {
        "id": "umumiy-qoidalar/transport-vositasining-egasi",
        "code": null,
        "title": {
          "uz_lat": "Transport vositasining egasi",
          "uz_cyr": "Транспорт воситасининг эгаси",
          "ru": "Владелец транспортного средства"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/umumiy%20qoydalar/Transport%20vositasining%20egasi.mp4"
      },
      {
        "id": "umumiy-qoidalar/trotuar",
        "code": null,
        "title": {
          "uz_lat": "Trotuar",
          "uz_cyr": "Тротуар",
          "ru": "Тротуар"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/umumiy%20qoydalar/Trotuar.mp4"
      },
      {
        "id": "umumiy-qoidalar/toxtab-turish",
        "code": null,
        "title": {
          "uz_lat": "To'xtab turish",
          "uz_cyr": "Тўхтаб туриш",
          "ru": "Стоянка"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/umumiy%20qoydalar/To'xtab%20turish.mp4"
      },
      {
        "id": "umumiy-qoidalar/toxtash",
        "code": null,
        "title": {
          "uz_lat": "To'xtash",
          "uz_cyr": "Тўхташ",
          "ru": "Остановка"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/umumiy%20qoydalar/To'xtash.mp4"
      },
      {
        "id": "umumiy-qoidalar/velosiped",
        "code": null,
        "title": {
          "uz_lat": "Velosiped",
          "uz_cyr": "Велосипед",
          "ru": "Велосипед"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/umumiy%20qoydalar/Velosiped.mp4"
      },
      {
        "id": "umumiy-qoidalar/yetarlicha-korinmaslik",
        "code": null,
        "title": {
          "uz_lat": "Yetarlicha ko'rinmaslik",
          "uz_cyr": "Етарлича кўринмаслик",
          "ru": "Недостаточная видимость"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/umumiy%20qoydalar/Yetarlicha%20ko'rinmaslik.mp4"
      },
      {
        "id": "umumiy-qoidalar/yol",
        "code": null,
        "title": {
          "uz_lat": "Yo'l",
          "uz_cyr": "Йўл",
          "ru": "Дорога"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/umumiy%20qoydalar/Yo'l.mp4"
      },
      {
        "id": "umumiy-qoidalar/yol-berish",
        "code": null,
        "title": {
          "uz_lat": "Yo'l berish",
          "uz_cyr": "Йўл бериш",
          "ru": "Уступить дорогу"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/umumiy%20qoydalar/Yo'l%20berish.mp4"
      },
      {
        "id": "umumiy-qoidalar/yol-harakati",
        "code": null,
        "title": {
          "uz_lat": "Yo'l harakati",
          "uz_cyr": "Йўл ҳаракати",
          "ru": "Дорожное движение"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/umumiy%20qoydalar/Yo'l%20harakati.mp4"
      },
      {
        "id": "umumiy-qoidalar/yol-harakati-qatnashchisi",
        "code": null,
        "title": {
          "uz_lat": "Yo'l harakati qatnashchisi",
          "uz_cyr": "Йўл ҳаракати қатнашчиси",
          "ru": "Участник дорожного движения"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/umumiy%20qoydalar/Yo'l%20harakati%20qatnashchisi.mp4"
      },
      {
        "id": "umumiy-qoidalar/yol-harakati-xavfsizligi",
        "code": null,
        "title": {
          "uz_lat": "Yo'l harakati xavfsizligi",
          "uz_cyr": "Йўл ҳаракати хавфсизлиги",
          "ru": "Безопасность дорожного движения"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/umumiy%20qoydalar/Yo'l%20harakati%20xavfsizligi.mp4"
      },
      {
        "id": "umumiy-qoidalar/yol-harakati-xavfsizligini-taminlash",
        "code": null,
        "title": {
          "uz_lat": "Yo'l harakati xavfsizligini ta'minlash",
          "uz_cyr": "Йўл ҳаракати хавфсизлигини таъминлаш",
          "ru": "Обеспечение безопасности дорожного движения"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/umumiy%20qoydalar/Yo'l%20harakati%20xavfsizligini%20ta'minlash.mp4"
      },
      {
        "id": "umumiy-qoidalar/yol-harakatini-tashkil-etish",
        "code": null,
        "title": {
          "uz_lat": "Yo'l harakatini tashkil etish",
          "uz_cyr": "Йўл ҳаракатини ташкил этиш",
          "ru": "Организация дорожного движения"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/umumiy%20qoydalar/Yo'l%20harakatini%20tashkil%20etish.mp4"
      },
      {
        "id": "umumiy-qoidalar/yol-yoqasi",
        "code": null,
        "title": {
          "uz_lat": "Yo'l yoqasi",
          "uz_cyr": "Йўл ёқаси",
          "ru": "Обочина"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/umumiy%20qoydalar/Yo'l%20yoqasi.mp4"
      },
      {
        "id": "umumiy-qoidalar/yol-transport-hodisasi",
        "code": null,
        "title": {
          "uz_lat": "Yo'l-transport hodisasi",
          "uz_cyr": "Йўл-транспорт ҳодисаси",
          "ru": "Дорожно-транспортное происшествие"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/umumiy%20qoydalar/Yo'l-transport%20hodisasi.mp4"
      },
      {
        "id": "umumiy-qoidalar/yolovchi",
        "code": null,
        "title": {
          "uz_lat": "Yo'lovchi",
          "uz_cyr": "Йўловчи",
          "ru": "Пассажир"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/umumiy%20qoydalar/Yo'lovchi.mp4"
      },
      {
        "id": "umumiy-qoidalar/chorraha",
        "code": null,
        "title": {
          "uz_lat": "Chorraha",
          "uz_cyr": "Чорраҳа",
          "ru": "Перекрёсток"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/umumiy%20qoydalar/CHorraha.mp4"
      }
    ]
  },
  {
    "id": "ogohlantiruvchi-belgilar",
    "kind": "signs",
    "title": {
      "uz_lat": "Ogohlantiruvchi belgilar",
      "uz_cyr": "Огоҳлантирувчи белгилар",
      "ru": "Предупреждающие знаки"
    },
    "lessons": [
      {
        "id": "ogohlantiruvchi-belgilar/1.1",
        "code": "1.1",
        "title": {
          "uz_lat": "Shlagbaumli temir yo'l kesishmasi",
          "uz_cyr": "Шлагбаумли темир йўл кесишмаси",
          "ru": "Железнодорожный переезд со шлагбаумом"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Ogohlantiruvchi%20belgilar/1.1.mp4"
      },
      {
        "id": "ogohlantiruvchi-belgilar/1.2",
        "code": "1.2",
        "title": {
          "uz_lat": "Shlagbaumsiz temir yo'l kesishmasi",
          "uz_cyr": "Шлагбаумсиз темир йўл кесишмаси",
          "ru": "Железнодорожный переезд без шлагбаума"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Ogohlantiruvchi%20belgilar/1.2.mp4"
      },
      {
        "id": "ogohlantiruvchi-belgilar/1.3",
        "code": "1.3",
        "title": {
          "uz_lat": "Diqqat \"UZP\"",
          "uz_cyr": "Диққат \"УЗП\"",
          "ru": "Внимание «УЗП»"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Ogohlantiruvchi%20belgilar/1.3.mp4"
      },
      {
        "id": "ogohlantiruvchi-belgilar/1.10",
        "code": "1.10",
        "title": {
          "uz_lat": "Sohilga chiqish",
          "uz_cyr": "Соҳилга чиқиш",
          "ru": "Выезд на набережную"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Ogohlantiruvchi%20belgilar/1.10.mp4"
      },
      {
        "id": "ogohlantiruvchi-belgilar/1.11.1-1.11.2",
        "code": "1.11.1, 1.11.2",
        "title": {
          "uz_lat": "Xavfli burilish",
          "uz_cyr": "Хавфли бурилиш",
          "ru": "Опасный поворот"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Ogohlantiruvchi%20belgilar/1.11.1%2C%201.11.2.mp4"
      },
      {
        "id": "ogohlantiruvchi-belgilar/1.12.1-1.12.2",
        "code": "1.12.1, 1.12.2",
        "title": {
          "uz_lat": "Xavfli burilishlar",
          "uz_cyr": "Хавфли бурилишлар",
          "ru": "Опасные повороты"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Ogohlantiruvchi%20belgilar/1.12.1%2C%201.12.2.mp4"
      },
      {
        "id": "ogohlantiruvchi-belgilar/1.13",
        "code": "1.13",
        "title": {
          "uz_lat": "Tik nishablik",
          "uz_cyr": "Тик нишаблик",
          "ru": "Крутой спуск"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Ogohlantiruvchi%20belgilar/1.13.mp4"
      },
      {
        "id": "ogohlantiruvchi-belgilar/1.14",
        "code": "1.14",
        "title": {
          "uz_lat": "Tik balandlik",
          "uz_cyr": "Тик баландлик",
          "ru": "Крутой подъем"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Ogohlantiruvchi%20belgilar/1.14.mp4"
      },
      {
        "id": "ogohlantiruvchi-belgilar/1.15",
        "code": "1.15",
        "title": {
          "uz_lat": "Sirpanchiq yo'l",
          "uz_cyr": "Сирпанчиқ йўл",
          "ru": "Скользкая дорога"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Ogohlantiruvchi%20belgilar/1.15.mp4"
      },
      {
        "id": "ogohlantiruvchi-belgilar/1.16",
        "code": "1.16",
        "title": {
          "uz_lat": "Notekis yo'l",
          "uz_cyr": "Нотекис йўл",
          "ru": "Неровная дорога"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Ogohlantiruvchi%20belgilar/1.16.mp4"
      },
      {
        "id": "ogohlantiruvchi-belgilar/1.17",
        "code": "1.17",
        "title": {
          "uz_lat": "Tosh otilish xavfi",
          "uz_cyr": "Тош отилиш хавфи",
          "ru": "Выброс гравия"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Ogohlantiruvchi%20belgilar/1.17.mp4"
      },
      {
        "id": "ogohlantiruvchi-belgilar/1.18.1-1.18.3",
        "code": "1.18.1-1.18.3",
        "title": {
          "uz_lat": "Yo'lning torayishi",
          "uz_cyr": "Йўлнинг торайиши",
          "ru": "Сужение дороги"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Ogohlantiruvchi%20belgilar/1.18.1-1.18.3.mp4"
      },
      {
        "id": "ogohlantiruvchi-belgilar/1.19",
        "code": "1.19",
        "title": {
          "uz_lat": "Ikki tomonlama harakatlanish",
          "uz_cyr": "Икки томонлама ҳаракатланиш",
          "ru": "Двустороннее движение"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Ogohlantiruvchi%20belgilar/1.19.mp4"
      },
      {
        "id": "ogohlantiruvchi-belgilar/1.20",
        "code": "1.20",
        "title": {
          "uz_lat": "Piyodalar o'tish joyi",
          "uz_cyr": "Пиёдалар ўтиш жойи",
          "ru": "Пешеходный переход"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Ogohlantiruvchi%20belgilar/1.20.mp4"
      },
      {
        "id": "ogohlantiruvchi-belgilar/1.21",
        "code": "1.21",
        "title": {
          "uz_lat": "Bolalar",
          "uz_cyr": "Болалар",
          "ru": "Дети"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Ogohlantiruvchi%20belgilar/1.21.mp4"
      },
      {
        "id": "ogohlantiruvchi-belgilar/1.22",
        "code": "1.22",
        "title": {
          "uz_lat": "Velosiped yo'lkasi bilan kesishuv",
          "uz_cyr": "Велосипед йўлкаси билан кесишув",
          "ru": "Пересечение с велосипедной дорожкой"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Ogohlantiruvchi%20belgilar/1.22.mp4"
      },
      {
        "id": "ogohlantiruvchi-belgilar/1.23",
        "code": "1.23",
        "title": {
          "uz_lat": "Ta'mirlash ishlari",
          "uz_cyr": "Тамирлаш ишлари",
          "ru": "Дорожные работы"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Ogohlantiruvchi%20belgilar/1.23.mp4"
      },
      {
        "id": "ogohlantiruvchi-belgilar/1.24",
        "code": "1.24",
        "title": {
          "uz_lat": "Mol haydab o'tish",
          "uz_cyr": "Мол ҳайдаб ўтиш",
          "ru": "Перегон скота"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Ogohlantiruvchi%20belgilar/1.24.mp4"
      },
      {
        "id": "ogohlantiruvchi-belgilar/1.25",
        "code": "1.25",
        "title": {
          "uz_lat": "Yovvoyi hayvonlar",
          "uz_cyr": "Ёввойи ҳайвонлар",
          "ru": "Дикие животные"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Ogohlantiruvchi%20belgilar/1.25.mp4"
      },
      {
        "id": "ogohlantiruvchi-belgilar/1.26",
        "code": "1.26",
        "title": {
          "uz_lat": "Toshlar tushishi",
          "uz_cyr": "Тошлар тушиши",
          "ru": "Падение камней"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Ogohlantiruvchi%20belgilar/1.26.mp4"
      },
      {
        "id": "ogohlantiruvchi-belgilar/1.27",
        "code": "1.27",
        "title": {
          "uz_lat": "Yonlama shamol",
          "uz_cyr": "Ёнлама шамол",
          "ru": "Боковой ветер"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Ogohlantiruvchi%20belgilar/1.27.mp4"
      },
      {
        "id": "ogohlantiruvchi-belgilar/1.28",
        "code": "1.28",
        "title": {
          "uz_lat": "Pastlab uchuvchi samolyotlar",
          "uz_cyr": "Пастлаб учувчи самолётлар",
          "ru": "Низколетящие самолеты"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Ogohlantiruvchi%20belgilar/1.28.mp4"
      },
      {
        "id": "ogohlantiruvchi-belgilar/1.29",
        "code": "1.29",
        "title": {
          "uz_lat": "Tonnel",
          "uz_cyr": "Тоннел",
          "ru": "Тоннель"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Ogohlantiruvchi%20belgilar/1.29.mp4"
      },
      {
        "id": "ogohlantiruvchi-belgilar/1.30",
        "code": "1.30",
        "title": {
          "uz_lat": "Boshqa xavf-xatar",
          "uz_cyr": "Бошқа хавф-хатар",
          "ru": "Прочие опасности"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Ogohlantiruvchi%20belgilar/1.30.mp4"
      },
      {
        "id": "ogohlantiruvchi-belgilar/1.31.1-1.31.2",
        "code": "1.31.1, 1.31.2",
        "title": {
          "uz_lat": "Burilishning yo'nalishi",
          "uz_cyr": "Бурилишнинг йўналиши",
          "ru": "Направление поворота"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Ogohlantiruvchi%20belgilar/1.31.1%2C%201.31.2.mp4"
      }
    ]
  },
  {
    "id": "imtiyoz-belgilari",
    "kind": "signs",
    "title": {
      "uz_lat": "Imtiyoz belgilari",
      "uz_cyr": "Имтиёз белгилари",
      "ru": "Знаки приоритета"
    },
    "lessons": [
      {
        "id": "imtiyoz-belgilari/2.1",
        "code": "2.1",
        "title": {
          "uz_lat": "Asosiy yo'l",
          "uz_cyr": "Асосий йўл",
          "ru": "Главная дорога"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Imtiyoz%20belgilari/2.1.mp4"
      },
      {
        "id": "imtiyoz-belgilari/2.2",
        "code": "2.2",
        "title": {
          "uz_lat": "Asosiy yo'lning oxiri",
          "uz_cyr": "Асосий йўлнинг охири",
          "ru": "Конец главной дороги"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Imtiyoz%20belgilari/2.2.mp4"
      },
      {
        "id": "imtiyoz-belgilari/2.3.1",
        "code": "2.3.1",
        "title": {
          "uz_lat": "Ikkinchi darajali yo'l bilan kesishuv",
          "uz_cyr": "Иккинчи даражали йўл билан кесишув",
          "ru": "Пересечение с второстепенной дорогой"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Imtiyoz%20belgilari/2.3.1.mp4"
      },
      {
        "id": "imtiyoz-belgilari/2.3.2-2.3.3",
        "code": "2.3.2, 2.3.3",
        "title": {
          "uz_lat": "Tutashuv o'ngdan · tutashuv chapdan",
          "uz_cyr": "Туташув ўнгдан · туташув чапдан",
          "ru": "Примыкание второстепенной дороги"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Imtiyoz%20belgilari/2.3.2%2C%202.3.3.mp4"
      },
      {
        "id": "imtiyoz-belgilari/2.4",
        "code": "2.4",
        "title": {
          "uz_lat": "Yo'l bering",
          "uz_cyr": "Йўл беринг",
          "ru": "Уступите дорогу"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Imtiyoz%20belgilari/2.4.mp4"
      },
      {
        "id": "imtiyoz-belgilari/2.5",
        "code": "2.5",
        "title": {
          "uz_lat": "To'xtamasdan harakatlanish taqiqlangan",
          "uz_cyr": "Тўхтамасдан ҳаракатланиш тақиқланган",
          "ru": "Движение без остановки запрещено"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Imtiyoz%20belgilari/2.5.mp4"
      },
      {
        "id": "imtiyoz-belgilari/2.6",
        "code": "2.6",
        "title": {
          "uz_lat": "Ro'para harakatlanishning ustunligi",
          "uz_cyr": "Рўпара ҳаракатланишнинг устунлиги",
          "ru": "Преимущество встречного движения"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Imtiyoz%20belgilari/2.6.mp4"
      },
      {
        "id": "imtiyoz-belgilari/2.7",
        "code": "2.7",
        "title": {
          "uz_lat": "Ro'paradagi harakatlanishga nisbatan imtiyoz",
          "uz_cyr": "Рўпарадаги ҳаракатланишга нисбатан имтиёз",
          "ru": "Преимущество перед встречным движением"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Imtiyoz%20belgilari/2.7.mp4"
      }
    ]
  },
  {
    "id": "taqiqlovchi-belgilar",
    "kind": "signs",
    "title": {
      "uz_lat": "Taqiqlovchi belgilar",
      "uz_cyr": "Тақиқловчи белгилар",
      "ru": "Запрещающие знаки"
    },
    "lessons": [
      {
        "id": "taqiqlovchi-belgilar/3.1",
        "code": "3.1",
        "title": {
          "uz_lat": "Kirish taqiqlangan",
          "uz_cyr": "Кириш тақиқланган",
          "ru": "Въезд запрещен"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Taqiqlovchi%20belgilar/3.1.mp4"
      },
      {
        "id": "taqiqlovchi-belgilar/3.2",
        "code": "3.2",
        "title": {
          "uz_lat": "Harakatlanish taqiqlangan",
          "uz_cyr": "Ҳаракатланиш тақиқланган",
          "ru": "Движение запрещено"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Taqiqlovchi%20belgilar/3.2.mp4"
      },
      {
        "id": "taqiqlovchi-belgilar/3.3",
        "code": "3.3",
        "title": {
          "uz_lat": "Mexanik transport vositalarining harakatlanishi taqiqlangan",
          "uz_cyr": "Механик транспорт воситаларининг ҳаракатланиши тақиқланган",
          "ru": "Движение механических транспортных средств запрещено"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Taqiqlovchi%20belgilar/3.3.mp4"
      },
      {
        "id": "taqiqlovchi-belgilar/3.10",
        "code": "3.10",
        "title": {
          "uz_lat": "Piyodalarning harakatlanishi taqiqlangan",
          "uz_cyr": "Пиёдаларнинг ҳаракатланиши тақиқланган",
          "ru": "Движение пешеходов запрещено"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Taqiqlovchi%20belgilar/3.10.mp4"
      },
      {
        "id": "taqiqlovchi-belgilar/3.11",
        "code": "3.11",
        "title": {
          "uz_lat": "Vazn cheklangan",
          "uz_cyr": "Вазн чекланган",
          "ru": "Ограничение массы"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Taqiqlovchi%20belgilar/3.11.mp4"
      },
      {
        "id": "taqiqlovchi-belgilar/3.12",
        "code": "3.12",
        "title": {
          "uz_lat": "O'qqa tushadigan og'irlik cheklangan",
          "uz_cyr": "Ўққа тушадиган оғирлик чекланган",
          "ru": "Ограничение нагрузки на ось"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Taqiqlovchi%20belgilar/3.12.mp4"
      },
      {
        "id": "taqiqlovchi-belgilar/3.13",
        "code": "3.13",
        "title": {
          "uz_lat": "Cheklangan balandlik",
          "uz_cyr": "Чекланган баландлик",
          "ru": "Ограничение высоты"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Taqiqlovchi%20belgilar/3.13.mp4"
      },
      {
        "id": "taqiqlovchi-belgilar/3.14",
        "code": "3.14",
        "title": {
          "uz_lat": "Cheklangan kenglik",
          "uz_cyr": "Чекланган кенглик",
          "ru": "Ограничение ширины"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Taqiqlovchi%20belgilar/3.14.mp4"
      },
      {
        "id": "taqiqlovchi-belgilar/3.15",
        "code": "3.15",
        "title": {
          "uz_lat": "Cheklangan uzunlik",
          "uz_cyr": "Чекланган узунлик",
          "ru": "Ограничение длины"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Taqiqlovchi%20belgilar/3.15.mp4"
      },
      {
        "id": "taqiqlovchi-belgilar/3.16",
        "code": "3.16",
        "title": {
          "uz_lat": "Eng kam oraliq",
          "uz_cyr": "Енг кам оралиқ",
          "ru": "Ограничение минимальной дистанции"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Taqiqlovchi%20belgilar/3.16.mp4"
      },
      {
        "id": "taqiqlovchi-belgilar/3.17.1",
        "code": "3.17.1",
        "title": {
          "uz_lat": "Bojxona",
          "uz_cyr": "Божхона",
          "ru": "Таможня"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Taqiqlovchi%20belgilar/3.17.1.mp4"
      },
      {
        "id": "taqiqlovchi-belgilar/3.17.2",
        "code": "3.17.2",
        "title": {
          "uz_lat": "Xavf-xatar",
          "uz_cyr": "Хавф-хатар",
          "ru": "Опасность"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Taqiqlovchi%20belgilar/3.17.2.mp4"
      },
      {
        "id": "taqiqlovchi-belgilar/3.18.1-3.18.2",
        "code": "3.18.1, 3.18.2",
        "title": {
          "uz_lat": "O'ngga burilish taqiqlanadi · Chapga burilish taqiqlanadi",
          "uz_cyr": "Ўнгга бурилиш тақиқланади · Чапга бурилиш тақиқланади",
          "ru": "Поворот направо запрещен · Поворот налево запрещен"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Taqiqlovchi%20belgilar/3.18.1%2C%203.18.2.mp4"
      },
      {
        "id": "taqiqlovchi-belgilar/3.19",
        "code": "3.19",
        "title": {
          "uz_lat": "Qayrilish taqiqlanadi",
          "uz_cyr": "Қайрилиш тақиқланади",
          "ru": "Разворот запрещен"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Taqiqlovchi%20belgilar/3.19.mp4"
      },
      {
        "id": "taqiqlovchi-belgilar/3.20",
        "code": "3.20",
        "title": {
          "uz_lat": "Quvib o'tish taqiqlanadi",
          "uz_cyr": "Қувиб ўтиш тақиқланади",
          "ru": "Обгон запрещен"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Taqiqlovchi%20belgilar/3.20.mp4"
      },
      {
        "id": "taqiqlovchi-belgilar/3.21",
        "code": "3.21",
        "title": {
          "uz_lat": "Quvib o'tish taqiqlangan hududning oxiri",
          "uz_cyr": "Қувиб ўтиш тақиқланган ҳудуднинг охири",
          "ru": "Конец зоны запрещения обгона"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Taqiqlovchi%20belgilar/3.21.mp4"
      },
      {
        "id": "taqiqlovchi-belgilar/3.22",
        "code": "3.22",
        "title": {
          "uz_lat": "Yuk avtomobillarida quvib o'tish taqiqlangan",
          "uz_cyr": "Юк автомобилларида қувиб ўтиш тақиқланган",
          "ru": "Обгон грузовым автомобилям запрещен"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Taqiqlovchi%20belgilar/3.22.mp4"
      },
      {
        "id": "taqiqlovchi-belgilar/3.23",
        "code": "3.23",
        "title": {
          "uz_lat": "Yuk avtomobillarida quvib o'tish taqiqlangan hududning oxiri",
          "uz_cyr": "Юк автоммобилларида қувиб ўтиш тақиқланган ҳудуднинг охири",
          "ru": "Конец зоны запрещения обгона грузовым автомобилям"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Taqiqlovchi%20belgilar/3.23.mp4"
      },
      {
        "id": "taqiqlovchi-belgilar/3.24",
        "code": "3.24",
        "title": {
          "uz_lat": "Yuqori tezlik cheklangan",
          "uz_cyr": "Юқори тезлик чекланган",
          "ru": "Ограничение максимальной скорости"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Taqiqlovchi%20belgilar/3.24.mp4"
      },
      {
        "id": "taqiqlovchi-belgilar/3.25",
        "code": "3.25",
        "title": {
          "uz_lat": "Yuqori tezlik cheklangan hududning oxiri",
          "uz_cyr": "Юқори тезлик чекланган ҳудуднинг охири",
          "ru": "Конец зоны ограничения максимальной скорости"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Taqiqlovchi%20belgilar/3.25.mp4"
      },
      {
        "id": "taqiqlovchi-belgilar/3.26",
        "code": "3.26",
        "title": {
          "uz_lat": "Tovush moslamalaridan foydalanish taqiqlangan",
          "uz_cyr": "Товуч мосламаларидан фойдаланиш тақиқланган",
          "ru": "Подача звукового сигнала запрещена"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Taqiqlovchi%20belgilar/3.26.mp4"
      },
      {
        "id": "taqiqlovchi-belgilar/3.27",
        "code": "3.27",
        "title": {
          "uz_lat": "To'xtash taqiqlangan",
          "uz_cyr": "Тўхташ тақиқланган",
          "ru": "Остановка запрещена"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Taqiqlovchi%20belgilar/3.27.mp4"
      }
    ]
  },
  {
    "id": "buyuruvchi-belgilar",
    "kind": "signs",
    "title": {
      "uz_lat": "Buyuruvchi belgilar",
      "uz_cyr": "Буюрувчи белгилар",
      "ru": "Предписывающие знаки"
    },
    "lessons": [
      {
        "id": "buyuruvchi-belgilar/4.1.1-4.1.6-davomi",
        "code": "4.1.1-4.1.6",
        "title": {
          "uz_lat": "Harakatlanish to'g'riga · Harakatlanish o'ngga yoki chapga (davomi)",
          "uz_cyr": "Ҳаракатланиш тўғрига · Ҳаракатланиш ўнгга ёки чапга (давоми)",
          "ru": "Движение прямо · Движение направо или налево (продолжение)"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Buyuruvchi%20belgilar/4.1.1-4.1.6%20davomi.mp4"
      },
      {
        "id": "buyuruvchi-belgilar/4.1.1-4.1.6",
        "code": "4.1.1-4.1.6",
        "title": {
          "uz_lat": "Harakatlanish to'g'riga · Harakatlanish o'ngga yoki chapga",
          "uz_cyr": "Ҳаракатланиш тўғрига · Ҳаракатланиш ўнгга ёки чапга",
          "ru": "Движение прямо · Движение направо или налево"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Buyuruvchi%20belgilar/4.1.1-4.1.6.mp4"
      },
      {
        "id": "buyuruvchi-belgilar/4.2.1-4.2.3",
        "code": "4.2.1-4.2.3",
        "title": {
          "uz_lat": "To'siqni o'ngdan chetlab o'tish · To'siqni o'ngdan yoki chapdan chetlab o'tish",
          "uz_cyr": "Тўсиқни ўнгдан четлаб ўтиш · Тўсиқни ўнгдан ёки чапдан четлаб ўтиш",
          "ru": "Объезд препятствия слева · Объезд препятствия справа или слева"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Buyuruvchi%20belgilar/4.2.1-4.2.3.mp4"
      },
      {
        "id": "buyuruvchi-belgilar/4.3",
        "code": "4.3",
        "title": {
          "uz_lat": "Aylanma harakatlanish",
          "uz_cyr": "Айланма ҳаракатланиш",
          "ru": "Круговое движение"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Buyuruvchi%20belgilar/4.3.mp4"
      },
      {
        "id": "buyuruvchi-belgilar/4.4",
        "code": "4.4",
        "title": {
          "uz_lat": "Yengil avtomobillar harakatlanadi",
          "uz_cyr": "Енгил автомобиллар ҳаракатланади",
          "ru": "Движение легковых автомобилей"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Buyuruvchi%20belgilar/4.4.mp4"
      },
      {
        "id": "buyuruvchi-belgilar/4.5",
        "code": "4.5",
        "title": {
          "uz_lat": "Velosiped yo'lkasi",
          "uz_cyr": "Велосипед йўлкаси",
          "ru": "Велосипедная дорожка"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Buyuruvchi%20belgilar/4.5.mp4"
      },
      {
        "id": "buyuruvchi-belgilar/4.6",
        "code": "4.6",
        "title": {
          "uz_lat": "Piyodalar yo'lkasi",
          "uz_cyr": "Пиёдалар йўлкаси",
          "ru": "Пешеходная дорожка"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Buyuruvchi%20belgilar/4.6.mp4"
      },
      {
        "id": "buyuruvchi-belgilar/4.6.1",
        "code": "4.6.1",
        "title": {
          "uz_lat": "Piyoda va velosipedlar birgalikda harakatlanish yo'li",
          "uz_cyr": "Пиёда ва велосипедлар биргаликда ҳаракатланиш йўли",
          "ru": "Дорожка для пешеходов, велосипедистов и средств индивидуальной мобильности с совмещенным движением"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Buyuruvchi%20belgilar/4.6.1.mp4"
      },
      {
        "id": "buyuruvchi-belgilar/4.6.2",
        "code": "4.6.2",
        "title": {
          "uz_lat": "Piyoda va velosipedlar birgalikda harakatlanish yo'li oxiri",
          "uz_cyr": "Пиёда ва велосипедлар биргаликда ҳаракатланиш йўли охири",
          "ru": "Конец дорожки для пешеходов, велосипедистов и средств индивидуальной мобильности с совмещенным движением"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Buyuruvchi%20belgilar/4.6.2.mp4"
      },
      {
        "id": "buyuruvchi-belgilar/4.6.3",
        "code": "4.6.3",
        "title": {
          "uz_lat": "Ajratilgan piyoda va velosiped harakatlanish yo'li",
          "uz_cyr": "Ажратилган пиёда ва велосипед ҳаракатланиш йўли",
          "ru": "Дорожка для пешеходов, велосипедистов и средств индивидуальной мобильности с разделением движения"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Buyuruvchi%20belgilar/4.6.3.mp4"
      },
      {
        "id": "buyuruvchi-belgilar/4.6.4",
        "code": "4.6.4",
        "title": {
          "uz_lat": "Ajratilgan piyoda va velosiped harakatlanish yo'li oxiri",
          "uz_cyr": "Ажратилган пиёда ва велосипед ҳаракатланиш йўли охири",
          "ru": "Конец дорожки для пешеходов, велосипедистов и средств индивидуальной мобильности с разделением движения"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Buyuruvchi%20belgilar/4.6.4.mp4"
      },
      {
        "id": "buyuruvchi-belgilar/4.6.5",
        "code": "4.6.5",
        "title": {
          "uz_lat": "Ajratilgan piyoda va velosiped harakatlanish yo'li",
          "uz_cyr": "Ажратилган пиёда ва велосипед ҳаракатланиш йўли",
          "ru": "Дорожка для пешеходов, велосипедистов и средств индивидуальной мобильности с разделением движения"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Buyuruvchi%20belgilar/4.6.5.mp4"
      },
      {
        "id": "buyuruvchi-belgilar/4.6.6",
        "code": "4.6.6",
        "title": {
          "uz_lat": "Ajratilgan piyoda va velosiped harakatlanish yo'li oxiri",
          "uz_cyr": "Ажратилган пиёда ва велосипед ҳаракатланиш йўли охири",
          "ru": "Конец дорожки для пешеходов, велосипедистов и средств индивидуальной мобильности с разделением движения"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Buyuruvchi%20belgilar/4.6.6.mp4"
      },
      {
        "id": "buyuruvchi-belgilar/4.7",
        "code": "4.7",
        "title": {
          "uz_lat": "Eng kam tezlik",
          "uz_cyr": "Енг кам тезлик",
          "ru": "Ограничение минимальной скорости"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Buyuruvchi%20belgilar/4.7.mp4"
      },
      {
        "id": "buyuruvchi-belgilar/4.8",
        "code": "4.8",
        "title": {
          "uz_lat": "Eng kam tezlik belgilangan yo'lning oxiri",
          "uz_cyr": "Енг кам тезлик белгиланган йўлнинг охири",
          "ru": "Конец зоны ограничения минимальной скорости"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Buyuruvchi%20belgilar/4.8.mp4"
      },
      {
        "id": "buyuruvchi-belgilar/4.9.1",
        "code": "4.9.1",
        "title": {
          "uz_lat": "Transport vositalarining xavfli yuklar bilan harakatlanish yo'nalishi",
          "uz_cyr": "Транспорт воситаларининг хавфли юклар билан ҳаракатланиш йўналиши",
          "ru": "Направление движения транспортных средств с опасными грузами"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Buyuruvchi%20belgilar/4.9.1.mp4"
      }
    ]
  },
  {
    "id": "axborot-korsatkich-belgilari",
    "kind": "signs",
    "title": {
      "uz_lat": "Axborot-ko'rsatkich belgilari",
      "uz_cyr": "Ахборот-кўрсаткич белгилари",
      "ru": "Информационно-указательные знаки"
    },
    "lessons": [
      {
        "id": "axborot-korsatkich-belgilari/5.1",
        "code": "5.1",
        "title": {
          "uz_lat": "Avtomagistral",
          "uz_cyr": "Автомагистрал",
          "ru": "Автомагистраль"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Axborot-ko'rsatkich%20belgilari/5.1.mp4"
      },
      {
        "id": "axborot-korsatkich-belgilari/5.2",
        "code": "5.2",
        "title": {
          "uz_lat": "Avtomagistralning oxiri",
          "uz_cyr": "Автомагистралнинг охири",
          "ru": "Конец автомагистрали"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Axborot-ko'rsatkich%20belgilari/5.2.mp4"
      },
      {
        "id": "axborot-korsatkich-belgilari/5.3",
        "code": "5.3",
        "title": {
          "uz_lat": "Avtomobillar uchun mo'ljallangan yo'l",
          "uz_cyr": "Автомобиллар учун мўлжалланган йўл",
          "ru": "Дорога для автомобилей"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Axborot-ko'rsatkich%20belgilari/5.3.mp4"
      },
      {
        "id": "axborot-korsatkich-belgilari/5.10.1",
        "code": "5.10.1",
        "title": {
          "uz_lat": "Belgilangan yo'nalishli transport vositalari uchun bo'lagi bor yo'l",
          "uz_cyr": "Белгиланган йўналишли транспорт воситалари учун бўлаги бор йўл",
          "ru": "Дорога с полосой для маршрутных транспортных средств"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Axborot-ko'rsatkich%20belgilari/5.10.1.mp4"
      },
      {
        "id": "axborot-korsatkich-belgilari/5.10.2-5.10.3",
        "code": "5.10.2-5.10.3",
        "title": {
          "uz_lat": "Belgilangan yo'nalishli transport vositalari uchun bo'lagi bor yo'l",
          "uz_cyr": "Белгиланган йўналишли транспорт воситалари учун бўлаги бор йўл",
          "ru": "Выезд на дорогу с полосой для маршрутных транспортных средств"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Axborot-ko'rsatkich%20belgilari/5.10.2-5.10.3.mp4"
      },
      {
        "id": "axborot-korsatkich-belgilari/5.10.4",
        "code": "5.10.4",
        "title": {
          "uz_lat": "Belgilangan yo'nalishli transport vositalari uchun bo'lagi bor yo'lning oxiri",
          "uz_cyr": "Белгиланган йўналишли транспорт воситалари учун бўлаги бор йўлнинг охири",
          "ru": "Конец дороги с полосой для маршрутных транспортных средств"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Axborot-ko'rsatkich%20belgilari/5.10.4.mp4"
      },
      {
        "id": "axborot-korsatkich-belgilari/5.11.1",
        "code": "5.11.1",
        "title": {
          "uz_lat": "Qayrilish joyi",
          "uz_cyr": "Қайирилиш жойи",
          "ru": "Место для разворота"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Axborot-ko'rsatkich%20belgilari/5.11.1.mp4"
      },
      {
        "id": "axborot-korsatkich-belgilari/5.11.2",
        "code": "5.11.2",
        "title": {
          "uz_lat": "Qayrilish oralig'i",
          "uz_cyr": "Қайирилиш оралиғи",
          "ru": "Зона для разворота"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Axborot-ko'rsatkich%20belgilari/5.11.2.mp4"
      },
      {
        "id": "axborot-korsatkich-belgilari/5.12-5.15",
        "code": "5.12-5.15",
        "title": {
          "uz_lat": "Avtobus va trolleybus to'xtash joyi · To'xtab turish joyi",
          "uz_cyr": "Автобус ва троллейбус тўхташ жойи · Тўхтаб туриш жойи",
          "ru": "Место остановки автобуса и (или) троллейбуса · Место стоянки"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Axborot-ko'rsatkich%20belgilari/5.12-5.15.mp4"
      },
      {
        "id": "axborot-korsatkich-belgilari/5.16.1-5.16.2",
        "code": "5.16.1, 5.16.2",
        "title": {
          "uz_lat": "Piyodalar o'tish joyi",
          "uz_cyr": "Пиёдалар ўтиш жойи",
          "ru": "Пешеходный переход"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Axborot-ko'rsatkich%20belgilari/5.16.1,%205.16.2.mp4"
      },
      {
        "id": "axborot-korsatkich-belgilari/5.17.1-5.17.4",
        "code": "5.17.1-5.17.4",
        "title": {
          "uz_lat": "Piyodalarning yer ostidan o'tish joyi · Piyodalarning yer ustidan o'tish joyi",
          "uz_cyr": "Пиёдаларнинг ер остидан ўтиш жойи · Пиёдаларнинг ер устидан ўтиш жойи",
          "ru": "Подземный пешеходный переход · Наземный пешеходный переход"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Axborot-ko'rsatkich%20belgilari/5.17.1-5.17.4.mp4"
      },
      {
        "id": "axborot-korsatkich-belgilari/5.18",
        "code": "5.18",
        "title": {
          "uz_lat": "Tavsiya etilgan tezlik",
          "uz_cyr": "Тавсия етилган тезлик",
          "ru": "Рекомендуемая скорость"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Axborot-ko'rsatkich%20belgilari/5.18.mp4"
      },
      {
        "id": "axborot-korsatkich-belgilari/5.19.1-5.19.3",
        "code": "5.19.1-5.19.3",
        "title": {
          "uz_lat": "Oxiri berk yo'l, ko'cha",
          "uz_cyr": "Охири берк йўл, кўча",
          "ru": "Тупик"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Axborot-ko'rsatkich%20belgilari/5.19.1-5.19.3.mp4"
      },
      {
        "id": "axborot-korsatkich-belgilari/5.20.1-5.20.2",
        "code": "5.20.1, 5.20.2",
        "title": {
          "uz_lat": "Yo'nalishlarning dastlabki ko'rsatkichi",
          "uz_cyr": "Йўналишларнинг дастлабки кўрсаткичи",
          "ru": "Предварительный указатель направлений"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Axborot-ko'rsatkich%20belgilari/5.20.1,%205.20.2.mp4"
      },
      {
        "id": "axborot-korsatkich-belgilari/5.20.3",
        "code": "5.20.3",
        "title": {
          "uz_lat": "Harakatlanish tasviri",
          "uz_cyr": "Ҳаракатланиш тасвири",
          "ru": "Схема движения"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Axborot-ko'rsatkich%20belgilari/5.20.3.mp4"
      },
      {
        "id": "axborot-korsatkich-belgilari/5.21.1-5.21.2",
        "code": "5.21.1, 5.21.2",
        "title": {
          "uz_lat": "Yo'nalish ko'rsatkichi · Yo'nalishlar ko'rsatkichi",
          "uz_cyr": "Йўналиш кўрсаткичи · Йўналишлар кўрсаткичи",
          "ru": "Указатель направления · Указатель направлений"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Axborot-ko'rsatkich%20belgilari/5.21.1,%205.21.2.mp4"
      },
      {
        "id": "axborot-korsatkich-belgilari/5.22",
        "code": "5.22",
        "title": {
          "uz_lat": "Aholi yashaydigan joyning boshlanishi",
          "uz_cyr": "Аҳоли яшайдиган жойнинг бошланиши",
          "ru": "Начало населенного пункта"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Axborot-ko'rsatkich%20belgilari/5.22.mp4"
      },
      {
        "id": "axborot-korsatkich-belgilari/5.23",
        "code": "5.23",
        "title": {
          "uz_lat": "Aholi yashaydigan joyning oxiri",
          "uz_cyr": "Аҳоли яшайдиган жойнинг охири",
          "ru": "Конец населенного пункта"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Axborot-ko'rsatkich%20belgilari/5.23.mp4"
      },
      {
        "id": "axborot-korsatkich-belgilari/5.24",
        "code": "5.24",
        "title": {
          "uz_lat": "Aholi yashaydigan joyning boshlanishi",
          "uz_cyr": "Аҳоли яшайдиган жойнинг бошланиши",
          "ru": "Начало населенного пункта"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Axborot-ko'rsatkich%20belgilari/5.24.mp4"
      },
      {
        "id": "axborot-korsatkich-belgilari/5.25",
        "code": "5.25",
        "title": {
          "uz_lat": "Aholi yashaydigan joyning oxiri",
          "uz_cyr": "Аҳоли яшайдиган жойнинг охири",
          "ru": "Конец населенного пункта"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Axborot-ko'rsatkich%20belgilari/5.25.mp4"
      },
      {
        "id": "axborot-korsatkich-belgilari/5.26",
        "code": "5.26",
        "title": {
          "uz_lat": "Manzil nomi",
          "uz_cyr": "Манзил номи",
          "ru": "Наименование объекта"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Axborot-ko'rsatkich%20belgilari/5.26.mp4"
      },
      {
        "id": "axborot-korsatkich-belgilari/5.27",
        "code": "5.27",
        "title": {
          "uz_lat": "Masofalar ko'rsatkichi",
          "uz_cyr": "Масофалар кўрсаткичи",
          "ru": "Указатель расстояний"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Axborot-ko'rsatkich%20belgilari/5.27.mp4"
      },
      {
        "id": "axborot-korsatkich-belgilari/5.28",
        "code": "5.28",
        "title": {
          "uz_lat": "Kilometr belgisi",
          "uz_cyr": "Километр белгиси",
          "ru": "Километровый знак"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Axborot-ko'rsatkich%20belgilari/5.28.mp4"
      },
      {
        "id": "axborot-korsatkich-belgilari/5.29.1-5.29.2",
        "code": "5.29.1, 5.29.2",
        "title": {
          "uz_lat": "Yo'l raqami",
          "uz_cyr": "Йўл рақами",
          "ru": "Номер дороги"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Axborot-ko'rsatkich%20belgilari/5.29.1,%205.29.2.mp4"
      },
      {
        "id": "axborot-korsatkich-belgilari/5.30.1-5.30.3",
        "code": "5.30.1-5.30.3",
        "title": {
          "uz_lat": "Yuk avtomobillari uchun harakatlanish yo'nalishi",
          "uz_cyr": "Юк автомобиллари учун ҳаракатланиш йўналиши",
          "ru": "Направление движения для грузовых автомобилей"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Axborot-ko'rsatkich%20belgilari/5.30.1-5.30.3.mp4"
      }
    ]
  },
  {
    "id": "servis-belgilari",
    "kind": "signs",
    "title": {
      "uz_lat": "Servis belgilari",
      "uz_cyr": "Сервис белгилари",
      "ru": "Знаки сервиса"
    },
    "lessons": [
      {
        "id": "servis-belgilari/6.1",
        "code": "6.1",
        "title": {
          "uz_lat": "Tibbiy yordam ko'rsatish joyi",
          "uz_cyr": "Тиббий ёрдам кўрсатиш жойи",
          "ru": "Пункт медицинской помощи"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Servis%20belgilari/6.1.mp4"
      },
      {
        "id": "servis-belgilari/6.2",
        "code": "6.2",
        "title": {
          "uz_lat": "Shifoxona",
          "uz_cyr": "Шифохона",
          "ru": "Больница"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Servis%20belgilari/6.2.mp4"
      },
      {
        "id": "servis-belgilari/6.3",
        "code": "6.3",
        "title": {
          "uz_lat": "Yonilg'i shoxobchasi",
          "uz_cyr": "Ёнилғи шохобчаси",
          "ru": "Автозаправочная станция"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Servis%20belgilari/6.3.mp4"
      },
      {
        "id": "servis-belgilari/6.4",
        "code": "6.4",
        "title": {
          "uz_lat": "Texnik xizmat ko'rsatish joyi",
          "uz_cyr": "Техник хизмат кўрсатиш жойи",
          "ru": "Техническое обслуживание автомобилей"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Servis%20belgilari/6.4.mp4"
      },
      {
        "id": "servis-belgilari/6.5",
        "code": "6.5",
        "title": {
          "uz_lat": "Transport vositalarini yuvish joyi",
          "uz_cyr": "Транспорт воситаларини ювиш жойи",
          "ru": "Мойка автомобилей"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Servis%20belgilari/6.5.mp4"
      },
      {
        "id": "servis-belgilari/6.6",
        "code": "6.6",
        "title": {
          "uz_lat": "Telefon",
          "uz_cyr": "Телефон",
          "ru": "Телефон"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Servis%20belgilari/6.6.mp4"
      },
      {
        "id": "servis-belgilari/6.7",
        "code": "6.7",
        "title": {
          "uz_lat": "Oshxona",
          "uz_cyr": "Ошхона",
          "ru": "Пункт питания"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Servis%20belgilari/6.7.mp4"
      },
      {
        "id": "servis-belgilari/6.8",
        "code": "6.8",
        "title": {
          "uz_lat": "Ichimlik suvi",
          "uz_cyr": "Ичимлик суви",
          "ru": "Питьевая вода"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Servis%20belgilari/6.8.mp4"
      },
      {
        "id": "servis-belgilari/6.9",
        "code": "6.9",
        "title": {
          "uz_lat": "Mehmonxona",
          "uz_cyr": "Меҳмонхона",
          "ru": "Гостиница или мотель"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Servis%20belgilari/6.9.mp4"
      },
      {
        "id": "servis-belgilari/6.10",
        "code": "6.10",
        "title": {
          "uz_lat": "Kemping",
          "uz_cyr": "Кемпинг",
          "ru": "Кемпинг"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Servis%20belgilari/6.10.mp4"
      },
      {
        "id": "servis-belgilari/6.11",
        "code": "6.11",
        "title": {
          "uz_lat": "Dam olish joyi",
          "uz_cyr": "Дам олиш жойи",
          "ru": "Место отдыха"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Servis%20belgilari/6.11.mp4"
      },
      {
        "id": "servis-belgilari/6.12",
        "code": "6.12",
        "title": {
          "uz_lat": "Yo'l patrul xizmati maskani",
          "uz_cyr": "Йўл патрул хизмати маскани",
          "ru": "Пост ДПС"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Servis%20belgilari/6.12.mp4"
      },
      {
        "id": "servis-belgilari/6.13",
        "code": "6.13",
        "title": {
          "uz_lat": "Xalqaro avtomobillarni tashish nazorat punkti",
          "uz_cyr": "Халқаро автомобилларни ташиш назорат пункти",
          "ru": "Контрольный пункт автоперевозчиков"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Servis%20belgilari/6.13.mp4"
      },
      {
        "id": "servis-belgilari/6.14",
        "code": "6.14",
        "title": {
          "uz_lat": "Xojatxona",
          "uz_cyr": "Хожатхона",
          "ru": "Туалет"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Servis%20belgilari/6.14.mp4"
      },
      {
        "id": "servis-belgilari/6.15",
        "code": "6.15",
        "title": {
          "uz_lat": "Axlat quti",
          "uz_cyr": "Ахлат қути",
          "ru": "Место сбора мусора"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Servis%20belgilari/6.15.mp4"
      }
    ]
  },
  {
    "id": "qoshimcha-axborot-belgilari",
    "kind": "signs",
    "title": {
      "uz_lat": "Qo'shimcha axborot belgilari",
      "uz_cyr": "Қўшимча ахборот белгилари",
      "ru": "Знаки дополнительной информации"
    },
    "lessons": [
      {
        "id": "qoshimcha-axborot-belgilari/7.1.1",
        "code": "7.1.1",
        "title": {
          "uz_lat": "Manzilgacha bo'lgan masofa",
          "uz_cyr": "Манзилгача бўлган масофа",
          "ru": "Расстояние до объекта"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Qo'shimcha%20axborot%20belgilari/7.1.1.mp4"
      },
      {
        "id": "qoshimcha-axborot-belgilari/7.1.2",
        "code": "7.1.2",
        "title": {
          "uz_lat": "Manzilgacha bo'lgan masofa",
          "uz_cyr": "Манзилгача бўлган масофа",
          "ru": "Расстояние до объекта"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Qo'shimcha%20axborot%20belgilari/7.1.2.mp4"
      },
      {
        "id": "qoshimcha-axborot-belgilari/7.1.3-7.1.4",
        "code": "7.1.3, 7.1.4",
        "title": {
          "uz_lat": "Manzilgacha bo'lgan masofa",
          "uz_cyr": "Манзилгача бўлган масофа",
          "ru": "Расстояние до объекта"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Qo'shimcha%20axborot%20belgilari/7.1.3%2C%207.1.4.mp4"
      },
      {
        "id": "qoshimcha-axborot-belgilari/7.2.1",
        "code": "7.2.1",
        "title": {
          "uz_lat": "Ta'sir oralig'i",
          "uz_cyr": "Тасир оралиғи",
          "ru": "Зона действия"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Qo'shimcha%20axborot%20belgilari/7.2.1.mp4"
      },
      {
        "id": "qoshimcha-axborot-belgilari/7.2.2-7.2.6",
        "code": "7.2.2 - 7.2.6",
        "title": {
          "uz_lat": "Ta'sir oralig'i",
          "uz_cyr": "Тасир оралиғи",
          "ru": "Зона действия"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Qo'shimcha%20axborot%20belgilari/7.2.2%20-%207.2.6.mp4"
      },
      {
        "id": "qoshimcha-axborot-belgilari/7.10",
        "code": "7.10",
        "title": {
          "uz_lat": "Avtomobillarni ko'rikdan o'tkazish joyi",
          "uz_cyr": "Автомобилларни кўрикдан ўтказиш жойи",
          "ru": "Место для осмотра автомобилей"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Qo'shimcha%20axborot%20belgilari/7.10.mp4"
      },
      {
        "id": "qoshimcha-axborot-belgilari/7.11",
        "code": "7.11",
        "title": {
          "uz_lat": "To'la vazni cheklangan",
          "uz_cyr": "Тўла вазни чекланган",
          "ru": "Ограничение разрешенной максимальной массы"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Qo'shimcha%20axborot%20belgilari/7.11.mp4"
      },
      {
        "id": "qoshimcha-axborot-belgilari/7.12",
        "code": "7.12",
        "title": {
          "uz_lat": "Xavfli yo'l yoqasi",
          "uz_cyr": "Хавфли йўл ёқаси",
          "ru": "Опасная обочина"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Qo'shimcha%20axborot%20belgilari/7.12.mp4"
      },
      {
        "id": "qoshimcha-axborot-belgilari/7.13",
        "code": "7.13",
        "title": {
          "uz_lat": "Asosiy yo'lning yo'nalishi",
          "uz_cyr": "Асосий йўлнинг йўналиши",
          "ru": "Направление главной дороги"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Qo'shimcha%20axborot%20belgilari/7.13.mp4"
      },
      {
        "id": "qoshimcha-axborot-belgilari/7.14",
        "code": "7.14",
        "title": {
          "uz_lat": "Harakatlanish bo'lagi",
          "uz_cyr": "Ҳаракатланиш бўлаги",
          "ru": "Полоса движения"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Qo'shimcha%20axborot%20belgilari/7.14.mp4"
      },
      {
        "id": "qoshimcha-axborot-belgilari/7.15",
        "code": "7.15",
        "title": {
          "uz_lat": "Ko'zi ojiz piyodalar",
          "uz_cyr": "Кўзи ожиз пиёдалар",
          "ru": "Слепые пешеходы"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Qo'shimcha%20axborot%20belgilari/7.15.mp4"
      },
      {
        "id": "qoshimcha-axborot-belgilari/7.16",
        "code": "7.16",
        "title": {
          "uz_lat": "Nam qoplama",
          "uz_cyr": "Нам қоплама",
          "ru": "Влажное покрытие"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Qo'shimcha%20axborot%20belgilari/7.16.mp4"
      },
      {
        "id": "qoshimcha-axborot-belgilari/7.17",
        "code": "7.17",
        "title": {
          "uz_lat": "Nogironlar",
          "uz_cyr": "Ногиронлар",
          "ru": "Инвалиды"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Qo'shimcha%20axborot%20belgilari/7.17.mp4"
      },
      {
        "id": "qoshimcha-axborot-belgilari/7.18",
        "code": "7.18",
        "title": {
          "uz_lat": "Nogironlar mustasno",
          "uz_cyr": "Ногиронлар мустасно",
          "ru": "Кроме инвалидов"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Qo'shimcha%20axborot%20belgilari/7.18.mp4"
      },
      {
        "id": "qoshimcha-axborot-belgilari/7.19",
        "code": "7.19",
        "title": {
          "uz_lat": "Chorrahadagi kamera",
          "uz_cyr": "Чорраҳадаги камера",
          "ru": "Камера на перекрестке"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Qo'shimcha%20axborot%20belgilari/7.19.mp4"
      }
    ]
  },
  {
    "id": "yol-chiziqlari",
    "kind": "markings",
    "title": {
      "uz_lat": "Yo'l chiziqlari",
      "uz_cyr": "Йўл чизиқлари",
      "ru": "Дорожная разметка"
    },
    "lessons": [
      {
        "id": "yol-chiziqlari/1.1",
        "code": "1.1",
        "title": {
          "uz_lat": "1.1-chiziq",
          "uz_cyr": "1.1-чизиқ",
          "ru": "Разметка 1.1"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Yo'l%20chiziqlari/Yoqtiq%20chiziqlar/1.1.mp4"
      },
      {
        "id": "yol-chiziqlari/1.2",
        "code": "1.2",
        "title": {
          "uz_lat": "1.2-chiziq",
          "uz_cyr": "1.2-чизиқ",
          "ru": "Разметка 1.2"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Yo'l%20chiziqlari/Yoqtiq%20chiziqlar/1.2.mp4"
      },
      {
        "id": "yol-chiziqlari/1.3",
        "code": "1.3",
        "title": {
          "uz_lat": "1.3-chiziq",
          "uz_cyr": "1.3-чизиқ",
          "ru": "Разметка 1.3"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Yo'l%20chiziqlari/Yoqtiq%20chiziqlar/1.3.mp4"
      },
      {
        "id": "yol-chiziqlari/1.4",
        "code": "1.4",
        "title": {
          "uz_lat": "1.4-chiziq",
          "uz_cyr": "1.4-чизиқ",
          "ru": "Разметка 1.4"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Yo'l%20chiziqlari/Yoqtiq%20chiziqlar/1.4.mp4"
      },
      {
        "id": "yol-chiziqlari/1.10",
        "code": "1.10",
        "title": {
          "uz_lat": "1.10-chiziq",
          "uz_cyr": "1.10-чизиқ",
          "ru": "Разметка 1.10"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Yo'l%20chiziqlari/Yoqtiq%20chiziqlar/1.10.mp4"
      },
      {
        "id": "yol-chiziqlari/1.11",
        "code": "1.11",
        "title": {
          "uz_lat": "1.11-chiziq",
          "uz_cyr": "1.11-чизиқ",
          "ru": "Разметка 1.11"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Yo'l%20chiziqlari/Yoqtiq%20chiziqlar/1.11.mp4"
      },
      {
        "id": "yol-chiziqlari/1.12",
        "code": "1.12",
        "title": {
          "uz_lat": "1.12-chiziq",
          "uz_cyr": "1.12-чизиқ",
          "ru": "Разметка 1.12"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Yo'l%20chiziqlari/Yoqtiq%20chiziqlar/1.12.mp4"
      },
      {
        "id": "yol-chiziqlari/1.13",
        "code": "1.13",
        "title": {
          "uz_lat": "1.13-chiziq",
          "uz_cyr": "1.13-чизиқ",
          "ru": "Разметка 1.13"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Yo'l%20chiziqlari/Yoqtiq%20chiziqlar/1.13.mp4"
      },
      {
        "id": "yol-chiziqlari/1.14.1",
        "code": "1.14.1",
        "title": {
          "uz_lat": "1.14.1-chiziq",
          "uz_cyr": "1.14.1-чизиқ",
          "ru": "Разметка 1.14.1"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Yo'l%20chiziqlari/Yoqtiq%20chiziqlar/1.14.1.mp4"
      },
      {
        "id": "yol-chiziqlari/1.14.2",
        "code": "1.14.2",
        "title": {
          "uz_lat": "1.14.2-chiziq",
          "uz_cyr": "1.14.2-чизиқ",
          "ru": "Разметка 1.14.2"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Yo'l%20chiziqlari/Yoqtiq%20chiziqlar/1.14.2.mp4"
      },
      {
        "id": "yol-chiziqlari/1.14.3",
        "code": "1.14.3",
        "title": {
          "uz_lat": "1.14.3-chiziq",
          "uz_cyr": "1.14.3-чизиқ",
          "ru": "Разметка 1.14.3"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Yo'l%20chiziqlari/Yoqtiq%20chiziqlar/1.14.3.mp4"
      },
      {
        "id": "yol-chiziqlari/1.15",
        "code": "1.15",
        "title": {
          "uz_lat": "1.15-chiziq",
          "uz_cyr": "1.15-чизиқ",
          "ru": "Разметка 1.15"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Yo'l%20chiziqlari/Yoqtiq%20chiziqlar/1.15.mp4"
      },
      {
        "id": "yol-chiziqlari/1.16.1-1.16.3",
        "code": "1.16.1-1.16.3",
        "title": {
          "uz_lat": "1.16.1-1.16.3-chiziq",
          "uz_cyr": "1.16.1-1.16.3-чизиқ",
          "ru": "Разметка 1.16.1-1.16.3"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Yo'l%20chiziqlari/Yoqtiq%20chiziqlar/1.16.1-1.16.3.mp4"
      },
      {
        "id": "yol-chiziqlari/1.17",
        "code": "1.17",
        "title": {
          "uz_lat": "1.17-chiziq",
          "uz_cyr": "1.17-чизиқ",
          "ru": "Разметка 1.17"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Yo'l%20chiziqlari/Yoqtiq%20chiziqlar/1.17.mp4"
      },
      {
        "id": "yol-chiziqlari/1.18",
        "code": "1.18",
        "title": {
          "uz_lat": "1.18-chiziq",
          "uz_cyr": "1.18-чизиқ",
          "ru": "Разметка 1.18"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Yo'l%20chiziqlari/Yoqtiq%20chiziqlar/1.18.mp4"
      },
      {
        "id": "yol-chiziqlari/1.19",
        "code": "1.19",
        "title": {
          "uz_lat": "1.19-chiziq",
          "uz_cyr": "1.19-чизиқ",
          "ru": "Разметка 1.19"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Yo'l%20chiziqlari/Yoqtiq%20chiziqlar/1.19.mp4"
      },
      {
        "id": "yol-chiziqlari/1.20",
        "code": "1.20",
        "title": {
          "uz_lat": "1.20-chiziq",
          "uz_cyr": "1.20-чизиқ",
          "ru": "Разметка 1.20"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Yo'l%20chiziqlari/Yoqtiq%20chiziqlar/1.20.mp4"
      },
      {
        "id": "yol-chiziqlari/1.21",
        "code": "1.21",
        "title": {
          "uz_lat": "1.21-chiziq",
          "uz_cyr": "1.21-чизиқ",
          "ru": "Разметка 1.21"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Yo'l%20chiziqlari/Yoqtiq%20chiziqlar/1.21.mp4"
      },
      {
        "id": "yol-chiziqlari/1.22",
        "code": "1.22",
        "title": {
          "uz_lat": "1.22-chiziq",
          "uz_cyr": "1.22-чизиқ",
          "ru": "Разметка 1.22"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Yo'l%20chiziqlari/Yoqtiq%20chiziqlar/1.22.mp4"
      },
      {
        "id": "yol-chiziqlari/1.23",
        "code": "1.23",
        "title": {
          "uz_lat": "1.23-chiziq",
          "uz_cyr": "1.23-чизиқ",
          "ru": "Разметка 1.23"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Yo'l%20chiziqlari/Yoqtiq%20chiziqlar/1.23.mp4"
      },
      {
        "id": "yol-chiziqlari/1.24",
        "code": "1.24",
        "title": {
          "uz_lat": "1.24-chiziq",
          "uz_cyr": "1.24-чизиқ",
          "ru": "Разметка 1.24"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Yo'l%20chiziqlari/Yoqtiq%20chiziqlar/1.24.mp4"
      },
      {
        "id": "yol-chiziqlari/1.25",
        "code": "1.25",
        "title": {
          "uz_lat": "1.25-chiziq",
          "uz_cyr": "1.25-чизиқ",
          "ru": "Разметка 1.25"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Yo'l%20chiziqlari/Yoqtiq%20chiziqlar/1.25.mp4"
      },
      {
        "id": "yol-chiziqlari/1.26",
        "code": "1.26",
        "title": {
          "uz_lat": "1.26-chiziq",
          "uz_cyr": "1.26-чизиқ",
          "ru": "Разметка 1.26"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Yo'l%20chiziqlari/Yoqtiq%20chiziqlar/1.26.mp4"
      },
      {
        "id": "yol-chiziqlari/1.27",
        "code": "1.27",
        "title": {
          "uz_lat": "1.27-chiziq",
          "uz_cyr": "1.27-чизиқ",
          "ru": "Разметка 1.27"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Yo'l%20chiziqlari/Yoqtiq%20chiziqlar/1.27.mp4"
      },
      {
        "id": "yol-chiziqlari/1.28",
        "code": "1.28",
        "title": {
          "uz_lat": "1.28-chiziq",
          "uz_cyr": "1.28-чизиқ",
          "ru": "Разметка 1.28"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Yo'l%20chiziqlari/Yoqtiq%20chiziqlar/1.28.mp4"
      },
      {
        "id": "yol-chiziqlari/2.1",
        "code": "2.1",
        "title": {
          "uz_lat": "2.1-chiziq",
          "uz_cyr": "2.1-чизиқ",
          "ru": "Разметка 2.1"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Yo'l%20chiziqlari/Tik%20chiziqlar/2.1.mp4"
      },
      {
        "id": "yol-chiziqlari/2.2",
        "code": "2.2",
        "title": {
          "uz_lat": "2.2-chiziq",
          "uz_cyr": "2.2-чизиқ",
          "ru": "Разметка 2.2"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Yo'l%20chiziqlari/Tik%20chiziqlar/2.2.mp4"
      },
      {
        "id": "yol-chiziqlari/2.3",
        "code": "2.3",
        "title": {
          "uz_lat": "2.3-chiziq",
          "uz_cyr": "2.3-чизиқ",
          "ru": "Разметка 2.3"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Yo'l%20chiziqlari/Tik%20chiziqlar/2.3.mp4"
      },
      {
        "id": "yol-chiziqlari/2.4",
        "code": "2.4",
        "title": {
          "uz_lat": "2.4-chiziq",
          "uz_cyr": "2.4-чизиқ",
          "ru": "Разметка 2.4"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Yo'l%20chiziqlari/Tik%20chiziqlar/2.4.mp4"
      },
      {
        "id": "yol-chiziqlari/2.6",
        "code": "2.6",
        "title": {
          "uz_lat": "2.6-chiziq",
          "uz_cyr": "2.6-чизиқ",
          "ru": "Разметка 2.6"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Yo'l%20chiziqlari/Tik%20chiziqlar/2.6.mp4"
      }
    ]
  },
  {
    "id": "haydovchining-huquqiy-javobgarligi",
    "kind": "law",
    "title": {
      "uz_lat": "Haydovchining huquqiy javobgarligi",
      "uz_cyr": "Ҳайдовчининг ҳуқуқий жавобгарлиги",
      "ru": "Правовая ответственность водителя"
    },
    "lessons": [
      {
        "id": "haydovchining-huquqiy-javobgarligi/1",
        "code": null,
        "title": {
          "uz_lat": "1-qism",
          "uz_cyr": "1-қисм",
          "ru": "Часть 1"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Haydovchining%20huquqiy%20javobgarligi/1.mp4"
      },
      {
        "id": "haydovchining-huquqiy-javobgarligi/5",
        "code": null,
        "title": {
          "uz_lat": "5-qism",
          "uz_cyr": "5-қисм",
          "ru": "Часть 5"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Haydovchining%20huquqiy%20javobgarligi/5.mp4"
      },
      {
        "id": "haydovchining-huquqiy-javobgarligi/7",
        "code": null,
        "title": {
          "uz_lat": "7-qism",
          "uz_cyr": "7-қисм",
          "ru": "Часть 7"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Haydovchining%20huquqiy%20javobgarligi/7.mp4"
      },
      {
        "id": "haydovchining-huquqiy-javobgarligi/8",
        "code": null,
        "title": {
          "uz_lat": "8-qism",
          "uz_cyr": "8-қисм",
          "ru": "Часть 8"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Haydovchining%20huquqiy%20javobgarligi/8.mp4"
      }
    ]
  },
  {
    "id": "yol-harakati-sohasidagi-qonunchilik-asoslari",
    "kind": "law",
    "title": {
      "uz_lat": "Yo'l harakati sohasidagi qonunchilik asoslari",
      "uz_cyr": "Йўл ҳаракати соҳасидаги қонунчилик асослари",
      "ru": "Основы законодательства в сфере дорожного движения"
    },
    "lessons": [
      {
        "id": "yol-harakati-sohasidagi-qonunchilik-asoslari/1",
        "code": null,
        "title": {
          "uz_lat": "1-qism",
          "uz_cyr": "1-қисм",
          "ru": "Часть 1"
        },
        "url": "https://pub-ad116decdc154b0f90a4b452c72fa433.r2.dev/Yo'l%20harakati%20sohasidagi%20qonunchilik%20asoslari/1.mp4"
      }
    ]
  }
];

/** Jami dars soni — progress hisoblashda ishlatiladi. */
export const DARSLIK_TOTAL_LESSONS = 209;
