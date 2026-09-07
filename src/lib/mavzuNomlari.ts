// ============================================================================
// mavzuNomlari — mavzuli testlar ro'yxati (id + uch tildagi nom)
// ----------------------------------------------------------------------------
// YAGONA MANBA. Ilgari bu ro'yxat `MavzuliTestlar.tsx` ichida edi va
// "Kalit so'zlar" bo'limi qo'shilganda ikkinchi nusxa paydo bo'lardi —
// mavzu nomi o'zgarganda ikkinchisi eskirib qolardi.
//
// `id` — `public/mavzuli2/{id}.json` fayl nomi. Istisnolar:
//   31   → alohida fayl emas, butun korpus (`barcha-{til}.json`)
//   34   → fayl nomi `34tengaxamiyatli.json`
//   35a  → "Yangi savollar"
// ============================================================================

export type TopicName = { uz_lat: string; uz_cyr: string; ru: string };
export type Topic = { id: string; name: TopicName };

export type TopicCategory = {
  key: string;
  title: TopicName;
  topics: Topic[];
};

export const topicCategories: TopicCategory[] = [
  {
    key: "asosiy",
    title: { uz_lat: "Asosiy", uz_cyr: "Асосий", ru: "Основное" },
    topics: [
      { id: "31", name: { uz_lat: "Barcha savollar", uz_cyr: "Барча саволлар", ru: "Все вопросы" } },
      { id: "35a", name: { uz_lat: "Yangi savollar", uz_cyr: "Янги саволлар", ru: "Новые вопросы" } },
      { id: "1", name: { uz_lat: "Umumiy qoidalar", uz_cyr: "Умумий қоидалар", ru: "Общие правила" } },
      { id: "2", name: { uz_lat: "Haydovchining umumiy vazifalari", uz_cyr: "Ҳайдовчининг умумий вазифалари ва пиёдалар", ru: "Общие обязанности водителя и пешеходы" } },
    ],
  },
  {
    key: "belgilar",
    title: { uz_lat: "Yo'l belgilari", uz_cyr: "Йўл белгилари", ru: "Дорожные знаки" },
    topics: [
      { id: "3", name: { uz_lat: "Ogohlantiruvchi belgilar", uz_cyr: "Огоҳлантирувчи белгилар", ru: "Предупреждающие знаки" } },
      { id: "4", name: { uz_lat: "Imtiyoz belgilar", uz_cyr: "Имтиёз белгилар", ru: "Знаки приоритета" } },
      { id: "5", name: { uz_lat: "Taqiqlovchi belgilar", uz_cyr: "Тақиқловчи белгилар", ru: "Запрещающие знаки" } },
      { id: "6", name: { uz_lat: "Buyuruvchi belgilar", uz_cyr: "Буюрувчи белгилар", ru: "Предписывающие знаки" } },
      { id: "7", name: { uz_lat: "Axborot ishora belgilari", uz_cyr: "Ахборот ишора белгилари", ru: "Информационные знаки" } },
      { id: "8", name: { uz_lat: "Qo'shimcha axborot belgilari", uz_cyr: "Қўшимча ахборот белгилари", ru: "Дополнительные информационные знаки" } },
    ],
  },
  {
    key: "chorrahalar",
    title: { uz_lat: "Chorrahalar", uz_cyr: "Чорраҳалар", ru: "Перекрестки" },
    topics: [
      { id: "20", name: { uz_lat: "Chorrahalarda harakatlanish", uz_cyr: "Чорраҳаларда ҳаракатланиш", ru: "Движение на перекрестках" } },
      { id: "34", name: { uz_lat: "Teng ahamiyatli chorrahalar", uz_cyr: "Тенг аҳамиятли чорраҳалар", ru: "Равнозначные перекрестки" } },
      { id: "33", name: { uz_lat: "Tartibga solinmagan chorrahada asosiy yo'l", uz_cyr: "Тартибга солинмаган чорраҳада асосий йўл", ru: "Главная дорога на нерегулируемом перекрестке" } },
    ],
  },
  {
    key: "chiziqlar",
    title: { uz_lat: "Yo'l chiziqlari", uz_cyr: "Йўл чизиқлари", ru: "Дорожная разметка" },
    topics: [
      { id: "9", name: { uz_lat: "Yotiq chiziqlar 1", uz_cyr: "Ётиқ чизиқлар 1", ru: "Горизонтальная разметка 1" } },
      { id: "10", name: { uz_lat: "Yotiq va tik chiziqlar 2", uz_cyr: "Ётиқ ва тик чизиқлар 2", ru: "Горизонтальная и вертикальная разметка 2" } },
    ],
  },
  {
    key: "ishoralar",
    title: { uz_lat: "Svetafor va ishoralar", uz_cyr: "Светафор ва ишоралар", ru: "Светофор и сигналы" },
    topics: [
      { id: "11", name: { uz_lat: "Svetafor ishoralari", uz_cyr: "Светафор ишоралари", ru: "Сигналы светофора" } },
      { id: "12", name: { uz_lat: "Tartibga soluvchining ishoralari", uz_cyr: "Тартибга солувчининг ишоралари", ru: "Сигналы регулировщика" } },
      { id: "13", name: { uz_lat: "Ogohlantiruvchi va avariya ishoralari", uz_cyr: "Огоҳлантирувчи ва авария ишоралари", ru: "Предупредительные и аварийные сигналы" } },
    ],
  },
  {
    key: "harakat",
    title: { uz_lat: "Harakatlanish qoidalari", uz_cyr: "Ҳаракатланиш қоидалари", ru: "Правила движения" },
    topics: [
      { id: "14", name: { uz_lat: "Yo'llarda harakatlanish", uz_cyr: "Йўлларда ҳаракатланиш", ru: "Начало движения (Маневр)" } },
      { id: "15", name: { uz_lat: "Transport vositalarining joylashuvi", uz_cyr: "Tранспорт воситаларининг жойлашуви", ru: "Расположение транспортных средств на проезжей части" } },
      { id: "16", name: { uz_lat: "Harakatlanish tezligi", uz_cyr: "Ҳаракатланиш тезлиги", ru: "Скорость движения" } },
      { id: "17", name: { uz_lat: "Quvib o'tish", uz_cyr: "Қувиб ўтиш", ru: "Обгон" } },
      { id: "18", name: { uz_lat: "To'xtash va to'xtab turish qoidalari 1", uz_cyr: "Тўхташ ва тўхтаб туриш қоидалари 1", ru: "Правила остановки и стоянки 1" } },
      { id: "19", name: { uz_lat: "To'xtash va to'xtab turish qoidalari 2", uz_cyr: "Тўхташ ва тўхтаб туриш қоидалари 2", ru: "Правила остановки и стоянки 2" } },
    ],
  },
  {
    key: "maxsus",
    title: { uz_lat: "Maxsus holatlar", uz_cyr: "Махсус ҳолатлар", ru: "Особые условия" },
    topics: [
      { id: "21", name: { uz_lat: "Piyodalar o'tish joylari va turar joylar", uz_cyr: "Пиёдалар ўтиш жойлари ва турар жой", ru: "Пешеходные переходы и движение в жилых зонах" } },
      { id: "22", name: { uz_lat: "Temir yo'l kesishmalari va Avtomagistrallar", uz_cyr: "Темир йўл кесишмалари ва Автомагистраллар", ru: "Железнодорожные переезды и движение по автомагистралям" } },
      { id: "23", name: { uz_lat: "Yo'nalishli transport vositalarining imtiyozlari", uz_cyr: "Йўналишли транспорт воситаларининг имтиёзлари", ru: "Преимущества маршрутных транспортных средств" } },
      { id: "24", name: { uz_lat: "Shatakka olish", uz_cyr: "Транспорт воситаларини шатакка олиш", ru: "Буксировка транспортных средств" } },
      { id: "25", name: { uz_lat: "Yo'l harakati xavfsizligini ta'minlash", uz_cyr: "Йўл ҳаракати хавфсизлигини таъминлаш", ru: "Обучение вождению" } },
      { id: "26", name: { uz_lat: "Odam va yuk tashish", uz_cyr: "Одам ва юк ташиш", ru: "Перевозка людей и грузов" } },
      { id: "27", name: { uz_lat: "Harakatlanish taqiqlanadigan vaziyatlar", uz_cyr: "ҳаракатланиш тақиқланадиган вазиятлар", ru: "Ситуации, когда запрещено движение транспортных средств" } },
    ],
  },
  {
    key: "xavfsizlik",
    title: { uz_lat: "Xavfsizlik va yordam", uz_cyr: "Хавфсизлик ва ёрдам", ru: "Безопасность и помощь" },
    topics: [
      { id: "28", name: { uz_lat: "Harakat xavfsizligini ta'minlash 1", uz_cyr: "Ҳаракат хавфсизлигини таъминлаш 1", ru: "Обеспечение безопасности движения 1" } },
      { id: "29", name: { uz_lat: "Harakat xavfsizligini ta'minlash 2", uz_cyr: "Ҳаракат хавфсизлигини таъминлаш 2", ru: "Обеспечение безопасности движения 2" } },
      { id: "30", name: { uz_lat: "Birinchi tibbiy yordam", uz_cyr: "Биринчи тиббий ёрдам", ru: "Первая медицинская помощь" } },
    ],
  },
];

export const topics: Topic[] = topicCategories.flatMap((c) => c.topics);


/** `id` bo'yicha mavzu nomini topadi. */
export function mavzuNomi(id: string | null | undefined): TopicName | null {
  if (!id) return null;
  return topics.find((t) => t.id === id)?.name ?? null;
}
