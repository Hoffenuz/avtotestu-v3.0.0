// ============================================================================
// yodlashRaqamlari — imtihonda tez-tez uchraydigan, yodda saqlash qiyin
// raqamli ma'lumotlar (tezlik, masofa, o'lcham va h.k.)
// ----------------------------------------------------------------------------
// MANBA: turli ochiq manbalardagi jadvallar asosida, o'z so'zlarimiz bilan
// qayta yozilgan va qayta tartiblangan (mavzular soddaligi/muhimligi bo'yicha,
// har mavzu ichidagi qatorlar ham shunga ko'ra tartiblangan).
//
// FORMAT HAQIDA: har bir qator avval NIMA haqida ekanini (`label`), keyin
// qiymatni (`value` + `unit`) ko'rsatadi — faqat bir qiymat oldinga chiqib,
// nimaga tegishli ekani noaniq qolmasligi uchun (masalan "M1 yengil avto —
// 10 gradus", "10 gradus — M1 yengil avto" emas).
//
// DIQQAT: to'xtab turish tormozining ushlab turish ko'rsatkichlari (9-mavzu,
// 2-guruh) foiz sifatida berilgan — manba jadvalda o'lchov birligi aniq
// ko'rinmagan, shuning uchun bu taxminiy. Rasmiy normativ hujjat topilsa,
// tekshirib almashtirilsin.
// ============================================================================

import type { LucideIcon } from "lucide-react";
import { Gauge, Timer, Ban, AlertTriangle, Ruler, Box, Link2, CircleDot, Wrench } from "lucide-react";
import type { Localized } from "./avtodromPenalties";
import type { SectionAccent } from "./siteSections";

export interface FactRow {
  label: Localized;
  value: string;
  unit: Localized;
}

export interface FactGroup {
  heading: Localized;
  rows: readonly FactRow[];
}

export interface FactTopic {
  id: string;
  icon: LucideIcon;
  accent: SectionAccent;
  title: Localized;
  subtitle: Localized;
  groups: readonly FactGroup[];
}

const KMH: Localized = { oz: "km/soat", uz: "км/соат", ru: "км/ч" };
const M: Localized = { oz: "m", uz: "м", ru: "м" };
const MM: Localized = { oz: "mm", uz: "мм", ru: "мм" };
const GRADUS: Localized = { oz: "gradus", uz: "градус", ru: "градус" };
const PERCENT: Localized = { oz: "%", uz: "%", ru: "%" };
const SONIYA: Localized = { oz: "soniya", uz: "сония", ru: "секунда" };
const MPA: Localized = { oz: "MPa", uz: "МПа", ru: "МПа" };

export const FACT_TOPICS: readonly FactTopic[] = [
  {
    id: "tezlik",
    icon: Gauge,
    accent: "rose",
    title: { oz: "Tezlik chegaralari", uz: "Тезлик чегаралари", ru: "Ограничения скорости" },
    subtitle: {
      oz: "Transport turiga va joylashuvga qarab ruxsat etilgan eng yuqori tezlik",
      uz: "Транспорт турига ва жойлашувга қараб рухсат этилган энг юқори тезлик",
      ru: "Максимально разрешённая скорость в зависимости от типа транспорта и участка дороги",
    },
    groups: [
      {
        heading: { oz: "Aholi punktidan tashqarida", uz: "Аҳоли пунктидан ташқарида", ru: "Вне населённых пунктов" },
        rows: [
          { label: { oz: "Yengil avtomobillar", uz: "Енгил автомобиллар", ru: "Легковые автомобили" }, value: "100", unit: KMH },
          { label: { oz: "Ruxsati 3.5 tonnagacha yuk avtomobillari", uz: "Рухсати 3.5 тоннагача юк автомобиллари", ru: "Грузовые автомобили разрешённой массой до 3.5 т" }, value: "100", unit: KMH },
          { label: { oz: "Shaharlararo va turistik avtobuslar", uz: "Шаҳарлараро ва туристик автобуслар", ru: "Междугородные и туристические автобусы" }, value: "90", unit: KMH },
          { label: { oz: "Boshqa avtobuslar", uz: "Бошқа автобуслар", ru: "Остальные автобусы" }, value: "80", unit: KMH },
          { label: { oz: "Yuk avtomobillari", uz: "Юк автомобиллари", ru: "Грузовые автомобили" }, value: "80", unit: KMH },
          { label: { oz: "Mototsikllar", uz: "Мотоциклар", ru: "Мотоциклы" }, value: "80", unit: KMH },
          { label: { oz: "Tirkamali transport vositalari", uz: "Тиркамали транспорт воситалари", ru: "Транспортные средства с прицепом" }, value: "70", unit: KMH },
        ],
      },
      {
        heading: { oz: "Maxsus hududlardagi chegaralar", uz: "Махсус ҳудудлардаги чегаралар", ru: "Ограничения на особых участках" },
        rows: [
          { label: { oz: "Boshqa transport vositasini shatakka olganda", uz: "Бошқа транспорт воситасини шатакка олганда", ru: "При буксировке другого транспортного средства" }, value: "50", unit: KMH },
          { label: { oz: "Maktab va bolalar bog'chasi yaqinida", uz: "Мактаб ва болалар боғчаси яқинида", ru: "Вблизи школ и детских садов" }, value: "30", unit: KMH },
          { label: { oz: "Turar-joy hududlari va hovlilarda", uz: "Турар-жой ҳудудлари ва ҳовлиларда", ru: "В жилых зонах и дворах" }, value: "20", unit: KMH },
        ],
      },
    ],
  },
  {
    id: "reaktsiya",
    icon: Timer,
    accent: "sky",
    title: { oz: "Tormozlash va reaktsiya masofasi", uz: "Тормозлаш ва реакция масофаси", ru: "Тормозной путь и время реакции" },
    subtitle: {
      oz: "Haydovchi xavfni sezgandan tormozgacha bosib o'tadigan taxminiy masofa",
      uz: "Ҳайдовчи хавфни сезгандан тормозгача босиб ўтадиган тахминий масофа",
      ru: "Примерное расстояние, которое проезжает водитель от момента опасности до торможения",
    },
    groups: [
      {
        heading: { oz: "1 soniyada bosib o'tiladigan masofa", uz: "1 сонияда босиб ўтиладиган масофа", ru: "Расстояние, проезжаемое за 1 секунду" },
        rows: [
          { label: { oz: "108 km/soat tezlikda", uz: "108 км/соат тезликда", ru: "На скорости 108 км/ч" }, value: "30", unit: M },
          { label: { oz: "90 km/soat tezlikda", uz: "90 км/соат тезликда", ru: "На скорости 90 км/ч" }, value: "25", unit: M },
          { label: { oz: "72 km/soat tezlikda", uz: "72 км/соат тезликда", ru: "На скорости 72 км/ч" }, value: "20", unit: M },
          { label: { oz: "O'rtacha reaktsiya vaqti", uz: "Ўртача реакция вақти", ru: "Среднее время реакции" }, value: "1", unit: SONIYA },
        ],
      },
    ],
  },
  {
    id: "toxtash",
    icon: Ban,
    accent: "violet",
    title: { oz: "To'xtash cheklovlari", uz: "Тўхташ чекловлари", ru: "Ограничения на остановку" },
    subtitle: {
      oz: "Transport vositasini to'xtatish yoki to'xtab turish taqiqlangan masofalar",
      uz: "Транспорт воситасини тўхтатиш ёки тўхтаб туриш тақиқланган масофалар",
      ru: "Расстояния, на которых запрещена остановка или стоянка",
    },
    groups: [
      {
        heading: { oz: "To'xtash taqiqlanadi", uz: "Тўхташ тақиқланади", ru: "Остановка запрещена" },
        rows: [
          { label: { oz: "Chorrahagacha va undan keyin", uz: "Чорраҳагача ва ундан кейин", ru: "До и после перекрёстка" }, value: "30", unit: M },
          { label: { oz: "Piyodalar o'tish joyigacha", uz: "Пиёдалар ўтиш жойигача", ru: "До пешеходного перехода" }, value: "10", unit: M },
          { label: { oz: "Velosipedchilar o'tish joyigacha", uz: "Велосипедчилар ўтиш жойигача", ru: "До велосипедного перехода" }, value: "10", unit: M },
          { label: { oz: "Qayrilish joyigacha va undan keyin", uz: "Қайрилиш жойигача ва ундан кейин", ru: "До и после места разворота" }, value: "30", unit: M },
          { label: { oz: "Bekat maydonchasigacha va undan keyin", uz: "Бекат майдончасигача ва ундан кейин", ru: "До и после посадочной площадки остановки транспорта" }, value: "15", unit: M },
        ],
      },
      {
        heading: { oz: "To'xtab turish taqiqlanadi", uz: "Тўхтаб туриш тақиқланади", ru: "Стоянка запрещена" },
        rows: [
          { label: { oz: "Temir yo'l kesishmasigacha va undan keyin", uz: "Темир йўл кесишмасигача ва ундан кейин", ru: "До и после железнодорожного переезда" }, value: "50", unit: M },
          { label: { oz: "Ko'rish masofasi yetarli bo'lmagan yo'l qismlarida", uz: "Кўриш масофаси етарли бўлмаган йўл қисмларида", ru: "На участках с недостаточной видимостью" }, value: "100", unit: M },
        ],
      },
    ],
  },
  {
    id: "avariya-belgisi",
    icon: AlertTriangle,
    accent: "orange",
    title: { oz: "Avariya to'xtash belgisi", uz: "Авария тўхташ белгиси", ru: "Знак аварийной остановки" },
    subtitle: {
      oz: "Ogohlantiruvchi uchburchak belgisini qo'yish qoidalari",
      uz: "Огоҳлантирувчи учбурчак белгисини қўйиш қоидалари",
      ru: "Правила установки предупреждающего треугольного знака",
    },
    groups: [
      {
        heading: { oz: "Nosozlik yoki avariya tufayli to'xtaganda", uz: "Носозлик ёки авария туфайли тўхтаганда", ru: "При остановке из-за неисправности или ДТП" },
        rows: [
          { label: { oz: "Aholi punkti ichida", uz: "Аҳоли пункти ичида", ru: "В населённом пункте" }, value: "15", unit: M },
          { label: { oz: "Aholi punktidan tashqarida", uz: "Аҳоли пунктидан ташқарида", ru: "Вне населённого пункта" }, value: "30", unit: M },
        ],
      },
      {
        heading: { oz: "Belgi haydovchilarga qanchadan ko'rinishi kerak", uz: "Белги ҳайдовчиларга қанчадан кўриниши керак", ru: "На каком расстоянии знак должен быть виден водителям" },
        rows: [
          { label: { oz: "Aholi punkti ichida", uz: "Аҳоли пункти ичида", ru: "В населённом пункте" }, value: "50–100", unit: M },
          { label: { oz: "Aholi punktidan tashqarida", uz: "Аҳоли пунктидан ташқарида", ru: "Вне населённого пункта" }, value: "150–300", unit: M },
        ],
      },
    ],
  },
  {
    id: "gabarit",
    icon: Ruler,
    accent: "cyan",
    title: { oz: "Transport o'lchamlari", uz: "Транспорт ўлчамлари", ru: "Габариты транспортного средства" },
    subtitle: {
      oz: "Maxsus ruxsatnomasiz harakatlanish uchun yo'l qo'yiladigan eng katta o'lchamlar",
      uz: "Махсус рухсатномасиз ҳаракатланиш учун йўл қўйиладиган энг катта ўлчамлар",
      ru: "Наибольшие размеры, допустимые для движения без специального разрешения",
    },
    groups: [
      {
        heading: { oz: "Bitta transport vositasi uchun", uz: "Битта транспорт воситаси учун", ru: "Для одного транспортного средства" },
        rows: [
          { label: { oz: "Eng katta uzunlik", uz: "Энг катта узунлик", ru: "Наибольшая длина" }, value: "12", unit: M },
          { label: { oz: "Eng katta kenglik", uz: "Энг катта кенглик", ru: "Наибольшая ширина" }, value: "2.55", unit: M },
          { label: { oz: "Eng katta balandlik", uz: "Энг катта баландлик", ru: "Наибольшая высота" }, value: "4", unit: M },
        ],
      },
      {
        heading: { oz: "Boshqa transport vositasi ulangan holatda", uz: "Бошқа транспорт воситаси уланган ҳолатда", ru: "При сцепке с другим транспортным средством" },
        rows: [
          { label: { oz: "Tirkama ulangan holatdagi umumiy uzunlik", uz: "Тиркама уланган ҳолатдаги умумий узунлик", ru: "Общая длина с прицепом" }, value: "20", unit: M },
          { label: { oz: "Boshqa transport vositasini shatakka olgandagi umumiy uzunlik", uz: "Бошқа транспорт воситасини шатакка олгандаги умумий узунлик", ru: "Общая длина при буксировке другого транспортного средства" }, value: "20", unit: M },
        ],
      },
    ],
  },
  {
    id: "yuk",
    icon: Box,
    accent: "amber",
    title: { oz: "Yuk tashish qoidalari", uz: "Юк ташиш қоидалари", ru: "Правила перевозки груза" },
    subtitle: {
      oz: "Yukning transport vositasi chegarasidan chiqib turishiga qo'yilgan cheklovlar",
      uz: "Юкнинг транспорт воситаси чегарасидан чиқиб туришига қўйилган чекловлар",
      ru: "Ограничения на выступание груза за габариты транспортного средства",
    },
    groups: [
      {
        heading: { oz: "Yukning transport vositasidan chiqishi", uz: "Юкнинг транспорт воситасидан чиқиши", ru: "Выступание груза за транспортное средство" },
        rows: [
          { label: { oz: "Yengil avtomobilda (gabaritdan)", uz: "Енгил автомобилда (габаритдан)", ru: "У легкового автомобиля (по габариту)" }, value: "0.5", unit: M },
          { label: { oz: "Yengil avtomobilda yuk balandligi bo'yicha", uz: "Енгил автомобилда юк баландлиги бўйича", ru: "У легкового автомобиля по высоте груза" }, value: "1", unit: M },
          { label: { oz: "Yuk avtomobilida old yoki orqa tomondan", uz: "Юк автомобилида олд ёки орқа томондан", ru: "У грузового автомобиля спереди или сзади" }, value: "2", unit: M },
          { label: { oz: "Velosipedda", uz: "Велосипедда", ru: "У велосипеда" }, value: "0.5", unit: M },
        ],
      },
      {
        heading: { oz: "Maxsus belgi qo'yish shart bo'lgan holatlar", uz: "Махсус белги қўйиш шарт бўлган ҳолатлар", ru: "Случаи, когда обязателен опознавательный знак" },
        rows: [
          { label: { oz: "Yon tomonga chiqib turgan yuk shundan ortiq bo'lsa", uz: "Ён томонга чиқиб турган юк шундан ортиқ бўлса", ru: "Если груз выступает сбоку больше этого значения" }, value: "0.4", unit: M },
          { label: { oz: "Old yoki orqadan chiqib turgan yuk shundan ortiq bo'lsa", uz: "Олд ёки орқадан чиқиб турган юк шундан ортиқ бўлса", ru: "Если груз выступает спереди или сзади больше этого значения" }, value: "1", unit: M },
        ],
      },
      {
        heading: { oz: "Yuk avtomobilida odam tashiganda", uz: "Юк автомобилида одам ташиганда", ru: "При перевозке людей в кузове грузовика" },
        rows: [
          { label: { oz: "Bort balandligi", uz: "Борт баландлиги", ru: "Высота борта" }, value: "1.3", unit: M },
          { label: { oz: "O'tirish joyi balandligi", uz: "Ўтириш жойи баландлиги", ru: "Высота посадочных мест" }, value: "0.3–0.5", unit: M },
        ],
      },
    ],
  },
  {
    id: "shatak",
    icon: Link2,
    accent: "emerald",
    title: { oz: "Shatakka olish", uz: "Шатакка олиш", ru: "Буксировка" },
    subtitle: {
      oz: "Boshqa transport vositasini tirkab olib ketishda ulagichga qo'yiladigan talablar",
      uz: "Бошқа транспорт воситасини тиркаб олиб кетишда улагичга қўйиладиган талаблар",
      ru: "Требования к сцепке при буксировке другого транспортного средства",
    },
    groups: [
      {
        heading: { oz: "Ulagich uzunligi", uz: "Улагич узунлиги", ru: "Длина сцепки" },
        rows: [
          { label: { oz: "Moslashuvchan (egiluvchan) ulagichda", uz: "Мослашувчан (эгилувчан) улагичда", ru: "На гибкой сцепке" }, value: "4–6", unit: M },
          { label: { oz: "Qattiq ulagichda", uz: "Қаттиқ улагичда", ru: "На жёсткой сцепке" }, value: "4", unit: M },
          { label: { oz: "Ikki transport vositasi orasidagi umumiy masofa", uz: "Икки транспорт воситаси орасидаги умумий масофа", ru: "Общее расстояние между двумя транспортными средствами" }, value: "20", unit: M },
        ],
      },
    ],
  },
  {
    id: "shina",
    icon: CircleDot,
    accent: "indigo",
    title: { oz: "G'ildirak protektori", uz: "Ғилдирак протектори", ru: "Протектор шины" },
    subtitle: {
      oz: "Protektor chuqurligi shu ko'rsatkichdan kam bo'lsa, harakatlanish taqiqlanadi",
      uz: "Протектор чуқурлиги шу кўрсаткичдан кам бўлса, ҳаракатланиш тақиқланади",
      ru: "Если глубина протектора меньше этого значения, движение запрещено",
    },
    groups: [
      {
        heading: { oz: "Eng kam protektor chuqurligi", uz: "Энг кам протектор чуқурлиги", ru: "Минимальная глубина протектора" },
        rows: [
          { label: { oz: "Mototsikllar (L toifasi)", uz: "Мотоциклар (L тоифаси)", ru: "Мотоциклы (категория L)" }, value: "0.8", unit: MM },
          { label: { oz: "Yuk avtomobillari va tirkamalar (N2, N3, O3, O4)", uz: "Юк автомобиллари ва тиркамалар (N2, N3, O3, O4)", ru: "Грузовые автомобили и прицепы (N2, N3, O3, O4)" }, value: "1", unit: MM },
          { label: { oz: "Yengil avtomobillar va yengil tirkamalar (M1, N1, O1, O2)", uz: "Енгил автомобиллар ва енгил тиркамалар (M1, N1, O1, O2)", ru: "Легковые автомобили и лёгкие прицепы (M1, N1, O1, O2)" }, value: "1.6", unit: MM },
          { label: { oz: "Avtobuslar (M2, M3)", uz: "Автобуслар (M2, M3)", ru: "Автобусы (M2, M3)" }, value: "2", unit: MM },
        ],
      },
    ],
  },
  {
    id: "rul-tormoz",
    icon: Wrench,
    accent: "teal",
    title: { oz: "Rul erkinligi va tormoz", uz: "Рул эркинлиги ва тормоз", ru: "Свободный ход руля и тормоза" },
    subtitle: {
      oz: "Rul g'ildiragining ruxsat etilgan erkin yurishi va tormoz tizimiga qo'yiladigan talablar",
      uz: "Рул ғилдирагининг рухсат этилган эркин юриши ва тормоз тизимига қўйиладиган талаблар",
      ru: "Допустимый свободный ход рулевого колеса и требования к тормозной системе",
    },
    groups: [
      {
        heading: { oz: "Rulning ruxsat etilgan erkin yurishi (lyuft)", uz: "Рулнинг рухсат этилган эркин юриши (люфт)", ru: "Допустимый свободный ход руля (люфт)" },
        rows: [
          { label: { oz: "Yengil avtomobillar (M1)", uz: "Енгил автомобиллар (M1)", ru: "Легковые автомобили (M1)" }, value: "10", unit: GRADUS },
          { label: { oz: "Avtobus va yengil yuk avtomobillari (M2, M3, N1)", uz: "Автобус ва енгил юк автомобиллари (M2, M3, N1)", ru: "Автобусы и лёгкие грузовики (M2, M3, N1)" }, value: "20", unit: GRADUS },
          { label: { oz: "Og'ir yuk avtomobillari (N2, N3)", uz: "Оғир юк автомобиллари (N2, N3)", ru: "Тяжёлые грузовые автомобили (N2, N3)" }, value: "25", unit: GRADUS },
        ],
      },
      {
        heading: { oz: "To'xtab turish tormozining ushlab turish qobiliyati", uz: "Тўхтаб туриш тормозининг ушлаб туриш қобилияти", ru: "Удерживающая способность стояночного тормоза" },
        rows: [
          { label: { oz: "Yengil va yengil yuk avtomobillari (M toifasi)", uz: "Енгил ва енгил юк автомобиллари (M тоифаси)", ru: "Легковые и лёгкие грузовые автомобили (категория M)" }, value: "25", unit: PERCENT },
          { label: { oz: "Yuk avtomobillari (N toifasi)", uz: "Юк автомобиллари (N тоифаси)", ru: "Грузовые автомобили (категория N)" }, value: "31", unit: PERCENT },
          { label: { oz: "To'liq jihozlangan tirkamali transport vositasi", uz: "Тўлиқ жиҳозланган тиркамали транспорт воситаси", ru: "Полностью укомплектованное транспортное средство с прицепом" }, value: "16", unit: PERCENT },
          { label: { oz: "Pnevmatik tormoz tizimidagi ishchi bosim", uz: "Пневматик тормоз тизимидаги ишчи босим", ru: "Рабочее давление в пневматической тормозной системе" }, value: "0.05", unit: MPA },
        ],
      },
    ],
  },
];
