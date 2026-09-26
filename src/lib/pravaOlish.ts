// ============================================================================
// pravaOlish — /prava-olish sahifasining MAZMUNI (uch tilda)
// ----------------------------------------------------------------------------
// NEGA ALOHIDA FAYL: raqamlar (narxlar, muddatlar) bir nechta joyda
// ishlatiladi — sahifa, FAQ sxemasi (Google/AI javoblari shu yerdan o'qiydi)
// va bot uchun statik snapshot (`scripts/seo-templates/prava-olish.html`).
// Bitta joyda turmasa, ular vaqt o'tib bir-biridan ajralib ketadi va
// saytning o'zi o'ziga zid gapiradi.
//
// HAR RAQAMNING MANBASI (tekshirilgan: MAZMUN_SANASI):
//   * Nazariy darslar 2026-02-01 dan ixtiyoriy ("A", "B"), amaliy mashg'ulot
//     avtomaktabda (o'quv tashkilotida) to'liq o'tilishi SHART —
//     kun.uz, gazeta.uz (2025-10-27).
//   * Imtihon: birinchi urinish nazariy 1,5 mln + amaliy 1,5 mln so'm,
//     qayta topshirish har bosqich 1,6 mln so'm (2026-01-06 dan) —
//     spot.uz (2026-01-07), uznews.uz (2026-04-01).
//   * 20 savol, 25 daqiqa, kamida 18 to'g'ri; qayta topshirish 7 ish kunidan
//     keyin — yim.uz (imtihon markazi, "Savollar va javoblar").
//   * B toifa 18 yoshdan, guvohnoma 10 yil, berish boji 0,7 BHM, 083/u
//     tibbiy ma'lumotnoma — uznews.uz (2026-04-01).
//   * Avtomaktab narxi (B o'rtacha 5,5 mln, BC 7 mln dan ortiq, amaliy
//     o'qish ~2,5 oy) — loyiha egasi ma'lumoti; uznews.uz: Toshkentda to'liq
//     kurs 7–10 mln, ~2,5 oy.
//
// ATAYLAB YOZILMAGAN: nazariy natija amal qilish muddati (manbalarda 2 oy
// va 1 yil — bir-biriga zid) va amaliy soatlar soni (rasmiy tasdiq
// topilmadi). Tasdiqlanmagan raqam bu yerga QO'SHILMAYDI.
// ============================================================================

import type { Localized } from "@/lib/eAvtomaktab";

/** Mazmun oxirgi marta tekshirilgan sana. */
export const PRAVA_MAZMUN_SANASI = "2026-09-26";

// ── Asosiy raqamlar ─────────────────────────────────────────────────────────

export interface AsosiyRaqam {
  qiymat: Localized;
  label: Localized;
}

export const ASOSIY_RAQAMLAR: readonly AsosiyRaqam[] = [
  {
    qiymat: { oz: "1,5 mln", uz: "1,5 млн", ru: "1,5 млн" },
    label: { oz: "nazariy imtihon, so'm", uz: "назарий имтиҳон, сўм", ru: "теоретический экзамен, сум" },
  },
  {
    qiymat: { oz: "1,5 mln", uz: "1,5 млн", ru: "1,5 млн" },
    label: { oz: "amaliy imtihon, so'm", uz: "амалий имтиҳон, сўм", ru: "практический экзамен, сум" },
  },
  {
    qiymat: { oz: "1,6 mln", uz: "1,6 млн", ru: "1,6 млн" },
    label: { oz: "qayta topshirish, so'm", uz: "қайта топшириш, сўм", ru: "пересдача, сум" },
  },
  {
    qiymat: { oz: "~2,5 oy", uz: "~2,5 ой", ru: "~2,5 мес." },
    label: { oz: "avtomaktabda amaliy", uz: "автомактабда амалий", ru: "практика в автошколе" },
  },
];

// ── Xarajatlar jadvali ──────────────────────────────────────────────────────

export interface Xarajat {
  nomi: Localized;
  narx: Localized;
  izoh: Localized;
}

export const XARAJATLAR: readonly Xarajat[] = [
  {
    nomi: { oz: "Avtomaktab — B toifa", uz: "Автомактаб — B тоифа", ru: "Автошкола — категория B" },
    narx: { oz: "o'rtacha 5,5 mln so'm", uz: "ўртача 5,5 млн сўм", ru: "в среднем 5,5 млн сум" },
    izoh: {
      oz: "Hudud va avtomaktabga qarab farq qiladi; Toshkentda 7–10 mln so'mgacha",
      uz: "Ҳудуд ва автомактабга қараб фарқ қилади; Тошкентда 7–10 млн сўмгача",
      ru: "Зависит от региона и автошколы; в Ташкенте — до 7–10 млн сум",
    },
  },
  {
    nomi: { oz: "Avtomaktab — BC toifa", uz: "Автомактаб — BC тоифа", ru: "Автошкола — категория BC" },
    narx: { oz: "7 mln so'mdan ortiq", uz: "7 млн сўмдан ортиқ", ru: "от 7 млн сум" },
    izoh: { oz: "B va C toifalar birga", uz: "B ва C тоифалар бирга", ru: "Категории B и C вместе" },
  },
  {
    nomi: { oz: "Nazariy imtihon", uz: "Назарий имтиҳон", ru: "Теоретический экзамен" },
    narx: { oz: "1,5 mln so'm", uz: "1,5 млн сўм", ru: "1,5 млн сум" },
    izoh: { oz: "Birinchi urinish, 2026-yil 6-yanvardan", uz: "Биринчи уриниш, 2026 йил 6 январдан", ru: "Первая попытка, с 6 января 2026 года" },
  },
  {
    nomi: { oz: "Amaliy imtihon", uz: "Амалий имтиҳон", ru: "Практический экзамен" },
    narx: { oz: "1,5 mln so'm", uz: "1,5 млн сўм", ru: "1,5 млн сум" },
    izoh: { oz: "Birinchi urinish", uz: "Биринчи уриниш", ru: "Первая попытка" },
  },
  {
    nomi: { oz: "Qayta topshirish", uz: "Қайта топшириш", ru: "Пересдача" },
    narx: { oz: "1,6 mln so'm", uz: "1,6 млн сўм", ru: "1,6 млн сум" },
    izoh: {
      oz: "Har bir bosqich uchun alohida; oldingi urinishdan 7 ish kuni o'tgach",
      uz: "Ҳар бир босқич учун алоҳида; олдинги уринишдан 7 иш куни ўтгач",
      ru: "За каждый этап отдельно; не ранее чем через 7 рабочих дней",
    },
  },
  {
    nomi: { oz: "Guvohnoma berish", uz: "Гувоҳнома бериш", ru: "Выдача удостоверения" },
    narx: { oz: "0,7 BHM", uz: "0,7 БҲМ", ru: "0,7 БРВ" },
    izoh: { oz: "Davlat boji — bazaviy hisoblash miqdorining 70%", uz: "Давлат божи — базавий ҳисоблаш миқдорининг 70%", ru: "Госпошлина — 70% базовой расчётной величины" },
  },
];

/** B toifa uchun taxminiy jami — jadvaldagi raqamlardan (5,5 + 1,5 + 1,5). */
export const JAMI_B: Localized = {
  oz: "B toifa uchun birinchi urinishda jami taxminan 8,5 mln so'm: avtomaktab ~5,5 mln + ikki imtihon 3 mln. Tibbiy ma'lumotnoma va guvohnoma boji bunga kirmaydi.",
  uz: "B тоифа учун биринчи уринишда жами тахминан 8,5 млн сўм: автомактаб ~5,5 млн + икки имтиҳон 3 млн. Тиббий маълумотнома ва гувоҳнома божи бунга кирмайди.",
  ru: "Для категории B с первой попытки — примерно 8,5 млн сум: автошкола ~5,5 млн + два экзамена 3 млн. Медицинская справка и пошлина за удостоверение сюда не входят.",
};

// ── Muhim eslatma ───────────────────────────────────────────────────────────

export const MUHIM = {
  sarlavha: {
    oz: "Avtomaktabsiz prava olib bo'lmaydi",
    uz: "Автомактабсиз права олиб бўлмайди",
    ru: "Без автошколы права не получить",
  } as Localized,
  matn: {
    oz: "2026-yil 1-fevraldan «A» va «B» toifalar uchun faqat NAZARIY darslarga qatnashish ixtiyoriy bo'ldi — nazariyani mustaqil o'rganish mumkin. Amaliy mashg'ulotlar esa avtomaktabda to'liq o'tilishi shart: B toifa uchun odatda taxminan 2,5 oy. Ko'pchilik «endi avtomaktab shart emas» deb xato tushunadi.",
    uz: "2026 йил 1 февралдан «A» ва «B» тоифалар учун фақат НАЗАРИЙ дарсларга қатнашиш ихтиёрий бўлди — назарияни мустақил ўрганиш мумкин. Амалий машғулотлар эса автомактабда тўлиқ ўтилиши шарт: B тоифа учун одатда тахминан 2,5 ой. Кўпчилик «энди автомактаб шарт эмас» деб хато тушунади.",
    ru: "С 1 февраля 2026 года для категорий «A» и «B» необязательным стало только посещение ТЕОРЕТИЧЕСКИХ занятий — теорию можно изучить самостоятельно. Практические занятия нужно полностью пройти в автошколе: для категории B обычно около 2,5 месяцев. Многие ошибочно считают, что автошкола теперь не нужна.",
  } as Localized,
};

// ── Bosqichlar ──────────────────────────────────────────────────────────────

export interface PravaBosqich {
  nomi: Localized;
  matn: Localized;
  /** Sayt ichidagi bog'liq sahifa (ixtiyoriy). */
  havola?: { to: string; label: Localized };
}

export const PRAVA_BOSQICHLAR: readonly PravaBosqich[] = [
  {
    nomi: { oz: "Tibbiy ma'lumotnoma", uz: "Тиббий маълумотнома", ru: "Медицинская справка" },
    matn: {
      oz: "083/u shaklidagi tibbiy ma'lumotnoma — sog'lig'ingiz toifaga mosligini tasdiqlaydi. Imtihonga boshqa hujjatlar bilan birga topshiriladi.",
      uz: "083/у шаклидаги тиббий маълумотнома — соғлиғингиз тоифага мослигини тасдиқлайди. Имтиҳонга бошқа ҳужжатлар билан бирга топширилади.",
      ru: "Медицинская справка формы 083/у подтверждает, что здоровье соответствует категории. Подаётся вместе с остальными документами на экзамен.",
    },
  },
  {
    nomi: { oz: "Avtomaktab: amaliy mashg'ulotlar", uz: "Автомактаб: амалий машғулотлар", ru: "Автошкола: практические занятия" },
    matn: {
      oz: "Amaliy mashg'ulotlar avtomaktabda majburiy — B toifa uchun odatda taxminan 2,5 oy. Nazariyani avtomaktabda yoki mustaqil o'rganishingiz mumkin.",
      uz: "Амалий машғулотлар автомактабда мажбурий — B тоифа учун одатда тахминан 2,5 ой. Назарияни автомактабда ёки мустақил ўрганишингиз мумкин.",
      ru: "Практические занятия в автошколе обязательны — для категории B обычно около 2,5 месяцев. Теорию можно изучать в автошколе или самостоятельно.",
    },
    havola: { to: "/e-avtomaktab", label: { oz: "E-avtomaktab qo'llanmasi", uz: "Е-автомактаб қўлланмаси", ru: "Гид по электронной автошколе" } },
  },
  {
    nomi: { oz: "Nazariy imtihon", uz: "Назарий имтиҳон", ru: "Теоретический экзамен" },
    matn: {
      oz: "Imtihon markazida kompyuterda: 20 ta savol, 25 daqiqa, o'tish uchun kamida 18 ta to'g'ri javob. Narxi — 1,5 mln so'm. Nazariydan o'tmagan nomzod amaliy imtihonga qo'yilmaydi.",
      uz: "Имтиҳон марказида компьютерда: 20 та савол, 25 дақиқа, ўтиш учун камида 18 та тўғри жавоб. Нархи — 1,5 млн сўм. Назарийдан ўтмаган номзод амалий имтиҳонга қўйилмайди.",
      ru: "На компьютере в экзаменационном центре: 20 вопросов, 25 минут, для сдачи нужно не менее 18 правильных ответов. Стоимость — 1,5 млн сум. Не сдавших теорию к практическому экзамену не допускают.",
    },
    havola: { to: "/test-ishlash", label: { oz: "Imtihon formatida test ishlash", uz: "Имтиҳон форматида тест ишлаш", ru: "Решить тест в формате экзамена" } },
  },
  {
    nomi: { oz: "Amaliy imtihon", uz: "Амалий имтиҳон", ru: "Практический экзамен" },
    matn: {
      oz: "Haydash mahorati tekshiriladi. Narxi — 1,5 mln so'm. Topshira olmasangiz, 7 ish kunidan keyin qayta topshirish mumkin (1,6 mln so'm).",
      uz: "Ҳайдаш маҳорати текширилади. Нархи — 1,5 млн сўм. Топшира олмасангиз, 7 иш кунидан кейин қайта топшириш мумкин (1,6 млн сўм).",
      ru: "Проверяется навык вождения. Стоимость — 1,5 млн сум. Если не сдали — пересдача не ранее чем через 7 рабочих дней (1,6 млн сум).",
    },
    havola: { to: "/avtodrom", label: { oz: "Avtodrom jarima ballari", uz: "Автодром жарима баллари", ru: "Штрафные баллы автодрома" } },
  },
  {
    nomi: { oz: "Guvohnoma olish", uz: "Гувоҳнома олиш", ru: "Получение удостоверения" },
    matn: {
      oz: "Ikkala imtihondan o'tgach guvohnoma rasmiylashtiriladi (davlat boji — 0,7 BHM). Guvohnoma 10 yil amal qiladi.",
      uz: "Иккала имтиҳондан ўтгач гувоҳнома расмийлаштирилади (давлат божи — 0,7 БҲМ). Гувоҳнома 10 йил амал қилади.",
      ru: "После сдачи обоих экзаменов оформляется удостоверение (госпошлина — 0,7 БРВ). Оно действует 10 лет.",
    },
  },
];

// ── Ko'p so'raladigan savollar (FAQPage sxemasi ham shu yerdan) ────────────

export interface PravaSavol {
  savol: Localized;
  javob: Localized;
}

export const PRAVA_FAQ: readonly PravaSavol[] = [
  {
    savol: { oz: "2026-yilda prava olish qancha turadi?", uz: "2026 йилда права олиш қанча туради?", ru: "Сколько стоит получить права в 2026 году?" },
    javob: {
      oz: "B toifa uchun taxminan 8,5 mln so'm: avtomaktab o'rtacha 5,5 mln (hudud va avtomaktabga qarab farq qiladi) va ikki imtihon — nazariy 1,5 mln + amaliy 1,5 mln so'm. BC toifa uchun avtomaktab 7 mln so'mdan ortiq.",
      uz: "B тоифа учун тахминан 8,5 млн сўм: автомактаб ўртача 5,5 млн (ҳудуд ва автомактабга қараб фарқ қилади) ва икки имтиҳон — назарий 1,5 млн + амалий 1,5 млн сўм. BC тоифа учун автомактаб 7 млн сўмдан ортиқ.",
      ru: "Для категории B — примерно 8,5 млн сум: автошкола в среднем 5,5 млн (зависит от региона и школы) и два экзамена — теория 1,5 млн + практика 1,5 млн сум. Для категории BC автошкола — от 7 млн сум.",
    },
  },
  {
    savol: { oz: "Avtomaktabsiz prava olsa bo'ladimi?", uz: "Автомактабсиз права олса бўладими?", ru: "Можно ли получить права без автошколы?" },
    javob: {
      oz: "Yo'q. 2026-yil 1-fevraldan «A» va «B» toifalar uchun faqat nazariy darslar ixtiyoriy bo'ldi. Amaliy mashg'ulotlar avtomaktabda to'liq o'tilishi shart — B toifa uchun odatda taxminan 2,5 oy.",
      uz: "Йўқ. 2026 йил 1 февралдан «A» ва «B» тоифалар учун фақат назарий дарслар ихтиёрий бўлди. Амалий машғулотлар автомактабда тўлиқ ўтилиши шарт — B тоифа учун одатда тахминан 2,5 ой.",
      ru: "Нет. С 1 февраля 2026 года для категорий «A» и «B» необязательными стали только теоретические занятия. Практику нужно полностью пройти в автошколе — для категории B обычно около 2,5 месяцев.",
    },
  },
  {
    savol: { oz: "Prava imtihoni narxi qancha?", uz: "Права имтиҳони нархи қанча?", ru: "Сколько стоит экзамен на права?" },
    javob: {
      oz: "2026-yil 6-yanvardan birinchi urinishda nazariy imtihon 1,5 mln, amaliy imtihon 1,5 mln so'm — jami 3 mln so'm. Qayta topshirish har bir bosqich uchun 1,6 mln so'm.",
      uz: "2026 йил 6 январдан биринчи уринишда назарий имтиҳон 1,5 млн, амалий имтиҳон 1,5 млн сўм — жами 3 млн сўм. Қайта топшириш ҳар бир босқич учун 1,6 млн сўм.",
      ru: "С 6 января 2026 года с первой попытки теоретический экзамен стоит 1,5 млн, практический — 1,5 млн сум, всего 3 млн сум. Пересдача — 1,6 млн сум за каждый этап.",
    },
  },
  {
    savol: { oz: "Imtihondan o'ta olmasam nima bo'ladi?", uz: "Имтиҳондан ўта олмасам нима бўлади?", ru: "Что будет, если не сдам экзамен?" },
    javob: {
      oz: "Oldingi urinishdan 7 ish kuni o'tgach qayta topshirasiz, har bir bosqich uchun 1,6 mln so'm. Nazariydan o'tmagan nomzod amaliy imtihonga qo'yilmaydi.",
      uz: "Олдинги уринишдан 7 иш куни ўтгач қайта топширасиз, ҳар бир босқич учун 1,6 млн сўм. Назарийдан ўтмаган номзод амалий имтиҳонга қўйилмайди.",
      ru: "Пересдать можно не ранее чем через 7 рабочих дней, 1,6 млн сум за каждый этап. Не сдавших теорию к практическому экзамену не допускают.",
    },
  },
  {
    savol: { oz: "Avtomaktabda qancha o'qiladi?", uz: "Автомактабда қанча ўқилади?", ru: "Сколько длится обучение в автошколе?" },
    javob: {
      oz: "B toifa uchun amaliy o'qish odatda taxminan 2,5 oy davom etadi. Nazariyani esa mustaqil — masalan, onlayn testlar bilan — o'rganish mumkin.",
      uz: "B тоифа учун амалий ўқиш одатда тахминан 2,5 ой давом этади. Назарияни эса мустақил — масалан, онлайн тестлар билан — ўрганиш мумкин.",
      ru: "Для категории B практическое обучение обычно длится около 2,5 месяцев. Теорию можно изучить самостоятельно — например, с помощью онлайн-тестов.",
    },
  },
  {
    savol: { oz: "Necha yoshdan prava olish mumkin?", uz: "Неча ёшдан права олиш мумкин?", ru: "С какого возраста можно получить права?" },
    javob: {
      oz: "B toifa uchun — 18 yoshdan.",
      uz: "B тоифа учун — 18 ёшдан.",
      ru: "Для категории B — с 18 лет.",
    },
  },
  {
    savol: { oz: "Nazariy imtihonda nechta savol bo'ladi?", uz: "Назарий имтиҳонда нечта савол бўлади?", ru: "Сколько вопросов на теоретическом экзамене?" },
    javob: {
      oz: "20 ta savol, 25 daqiqa vaqt. O'tish uchun kamida 18 ta to'g'ri javob kerak — ya'ni ikkitagacha xatoga ruxsat.",
      uz: "20 та савол, 25 дақиқа вақт. Ўтиш учун камида 18 та тўғри жавоб керак — яъни иккитагача хатога рухсат.",
      ru: "20 вопросов, 25 минут. Для сдачи нужно не менее 18 правильных ответов — то есть допускается до двух ошибок.",
    },
  },
  {
    savol: { oz: "Haydovchilik guvohnomasi necha yil amal qiladi?", uz: "Ҳайдовчилик гувоҳномаси неча йил амал қилади?", ru: "Сколько лет действует водительское удостоверение?" },
    javob: {
      oz: "10 yil.",
      uz: "10 йил.",
      ru: "10 лет.",
    },
  },
];

// ── Manbalar ────────────────────────────────────────────────────────────────

export interface Manba {
  nomi: string;
  sana: string;
  url: string;
}

export const PRAVA_MANBALAR: readonly Manba[] = [
  { nomi: "kun.uz", sana: "2025-10-27", url: "https://kun.uz/news/2025/10/27/haydovchilik-guvohnomasini-olish-uchun-nazariy-darslarda-qatnashish-ixtiyoriy-boladi" },
  { nomi: "gazeta.uz", sana: "2025-10-27", url: "https://www.gazeta.uz/oz/2025/10/27/moped-skuter/" },
  { nomi: "spot.uz", sana: "2026-01-07", url: "https://www.spot.uz/oz/2026/01/07/drivers-license/" },
  { nomi: "uznews.uz", sana: "2026-04-01", url: "https://uznews.uz/ru/articles/108610" },
  { nomi: "yim.uz", sana: "2026", url: "https://yim.uz/savollar-va-javoblar" },
];
