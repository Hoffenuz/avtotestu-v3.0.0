// ============================================================================
// avtodromPenalties — amaliy imtihon (avtodrom) jarima ballari
// ----------------------------------------------------------------------------
// MANBA: rasmiy jadval (lotin alifbosidagi matn).
//
// TARJIMA HAQIDA — MUHIM:
//   Kirillcha va ruscha variantlar SHU LOYIHADA tarjima qilingan, rasmiy
//   hujjatdan olingan emas. Ma'no saqlangan, lekin rasmiy formulirovka
//   bilan so'zma-so'z mos kelmasligi mumkin. Sahifada foydalanuvchiga
//   shu haqda ogohlantirish ko'rsatiladi.
//
//   Rasmiy kirillcha/ruscha matn topilsa, shu yerdagi qiymatlar almashtirilsin.
// ============================================================================

export type PenaltyLevel = "kichik" | "orta" | "qopol";

/** Uch til uchun matn. Kalitlar `questionLang` qiymatlari bilan bir xil. */
export interface Localized {
  oz: string;
  uz: string;
  ru: string;
}

export interface PenaltyItem {
  /** Rasmiy jadvaldagi tartib raqami (1..32). */
  no: number;
  text: Localized;
  points: number;
  /** Qo'shimcha shart (masalan "har 5 soniya uchun"). */
  note?: Localized;
}

export interface PenaltyGroup {
  level: PenaltyLevel;
  title: Localized;
  items: readonly PenaltyItem[];
}

const PER_5_SEC: Localized = {
  oz: "har 5 soniya uchun",
  uz: "ҳар 5 сония учун",
  ru: "за каждые 5 секунд",
};

const PER_MISTAKE: Localized = {
  oz: "har bir xato uchun",
  uz: "ҳар бир хато учун",
  ru: "за каждую ошибку",
};

export const PENALTY_GROUPS: readonly PenaltyGroup[] = [
  {
    level: "kichik",
    title: { oz: "Kichik xatolik", uz: "Кичик хатолик", ru: "Мелкая ошибка" },
    items: [
      {
        no: 1,
        points: 5,
        text: {
          oz: "Xavfsizlik kamarini taqmadi",
          uz: "Хавфсизлик камарини тақмади",
          ru: "Не пристегнул ремень безопасности",
        },
      },
      {
        no: 2,
        points: 5,
        text: {
          oz: "Chapga burilish chirog'ini yoqmasdan “Start” chizig'ini kesib o'tdi",
          uz: "Чапга бурилиш чироғини ёқмасдан “Старт” чизиғини кесиб ўтди",
          ru: "Пересёк линию «Старт», не включив указатель левого поворота",
        },
      },
      {
        no: 3,
        points: 5,
        text: {
          oz: "“Start” chizig'idan keyin 10 metr masofada chapga burilish chirog'ini o'chirmadi",
          uz: "“Старт” чизиғидан кейин 10 метр масофада чапга бурилиш чироғини ўчирмади",
          ru: "Не выключил указатель левого поворота через 10 метров после линии «Старт»",
        },
      },
      {
        no: 4,
        points: 5,
        text: {
          oz: "“To'xtash chizig'i”dan oldin 1 metrdan ko'proq masofada to'xtatdi",
          uz: "“Тўхташ чизиғи”дан олдин 1 метрдан кўпроқ масофада тўхтатди",
          ru: "Остановился более чем за 1 метр до «Стоп-линии»",
        },
      },
      {
        no: 5,
        points: 5,
        text: {
          oz: "Tegishli yo'nalishdagi burilish chirog'ini yoqmadi",
          uz: "Тегишли йўналишдаги бурилиш чироғини ёқмади",
          ru: "Не включил указатель поворота в соответствующем направлении",
        },
      },
      {
        no: 6,
        points: 5,
        text: {
          oz: "4.7 va 3.24 yo'l belgilarining talablarini buzdi",
          uz: "4.7 ва 3.24 йўл белгиларининг талабларини бузди",
          ru: "Нарушил требования дорожных знаков 4.7 и 3.24",
        },
      },
      {
        no: 7,
        points: 5,
        text: {
          oz: "“Harakatlanishni yakunlash (Finish)” chizig'ini kesib o'tishdan oldin o'ngga burilish ishorasini yoqmadi",
          uz: "“Ҳаракатланишни якунлаш (Финиш)” чизиғини кесиб ўтишдан олдин ўнгга бурилиш ишорасини ёқмади",
          ru: "Не включил указатель правого поворота перед пересечением линии «Финиш»",
        },
      },
      {
        no: 8,
        points: 5,
        note: PER_5_SEC,
        text: {
          oz: "Harakatlanish tezligini 20 km/soatdan oshirib yubordi (“Yo'lning tezlashish qismida harakatlanish” mashqini bajarishdan tashqari)",
          uz: "Ҳаракатланиш тезлигини 20 км/соатдан ошириб юборди (“Йўлнинг тезлашиш қисмида ҳаракатланиш” машқини бажаришдан ташқари)",
          ru: "Превысил скорость движения более 20 км/ч (кроме выполнения упражнения «Движение на участке разгона»)",
        },
      },
      {
        no: 9,
        points: 10,
        text: {
          oz: "Svetoforning ruxsat beruvchi ishorasida chorrahadan o'tish uchun 30 soniyadan ko'p vaqt sarfladi",
          uz: "Светофорнинг рухсат берувчи ишорасида чорраҳадан ўтиш учун 30 сониядан кўп вақт сарфлади",
          ru: "Затратил более 30 секунд на проезд перекрёстка при разрешающем сигнале светофора",
        },
      },
    ],
  },
  {
    level: "orta",
    title: { oz: "O'rta xatolik", uz: "Ўрта хатолик", ru: "Средняя ошибка" },
    items: [
      {
        no: 10,
        points: 25,
        text: {
          oz: "“Start” ishorasidan keyin 30 soniya davomida harakatni boshlamadi",
          uz: "“Старт” ишорасидан кейин 30 сония давомида ҳаракатни бошламади",
          ru: "Не начал движение в течение 30 секунд после сигнала «Старт»",
        },
      },
      {
        no: 11,
        points: 20,
        text: {
          oz: "“To'xtash chizig'i”ning oldida to'xtamadi yoki uni bosib o'tdi",
          uz: "“Тўхташ чизиғи”нинг олдида тўхтамади ёки уни босиб ўтди",
          ru: "Не остановился перед «Стоп-линией» или наехал на неё",
        },
      },
      {
        no: 12,
        points: 20,
        text: {
          oz: "To'xtagandan so'ng 3 soniya o'tmasdan harakatni boshladi",
          uz: "Тўхтагандан сўнг 3 сония ўтмасдан ҳаракатни бошлади",
          ru: "Начал движение, не выждав 3 секунды после остановки",
        },
      },
      {
        no: 13,
        points: 25,
        text: {
          oz: "“Estakada” mashqida to'xtagandan so'ng 30 soniya davomida harakatni boshlamadi",
          uz: "“Эстакада” машқида тўхтагандан сўнг 30 сония давомида ҳаракатни бошламади",
          ru: "В упражнении «Эстакада» не начал движение в течение 30 секунд после остановки",
        },
      },
      {
        no: 14,
        points: 20,
        text: {
          oz: "“Estakada” mashqida to'xtagandan so'ng yoki harakatni boshlashdan oldin transport vositasi orqaga 0,3 metrdan ortiq siljidi",
          uz: "“Эстакада” машқида тўхтагандан сўнг ёки ҳаракатни бошлашдан олдин транспорт воситаси орқага 0,3 метрдан ортиқ силжиди",
          ru: "В упражнении «Эстакада» транспортное средство откатилось назад более чем на 0,3 метра",
        },
      },
      {
        no: 15,
        points: 20,
        text: {
          oz: "“90 gradus burilish” va “Ilon izi” mashqlarini bajarishda nazorat chizig'ini bosdi",
          uz: "“90 градус бурилиш” ва “Илон изи” машқларини бажаришда назорат чизиғини босди",
          ru: "При выполнении упражнений «Поворот на 90 градусов» и «Змейка» наехал на контрольную линию",
        },
      },
      {
        no: 16,
        points: 15,
        text: {
          oz: "“90 gradus burilish” va “Ilon izi” mashqlarini bajarishga 2 daqiqadan ko'p vaqt sarfladi",
          uz: "“90 градус бурилиш” ва “Илон изи” машқларини бажаришга 2 дақиқадан кўп вақт сарфлади",
          ru: "Затратил более 2 минут на выполнение упражнений «Поворот на 90 градусов» и «Змейка»",
        },
      },
      {
        no: 17,
        points: 20,
        text: {
          oz: "“Boksga kirish” va “Parallel to'xtash” mashqlarida g'ildiraklarni mashqni bajarishning qayd etish chizig'iga qo'ymadi",
          uz: "“Боксга кириш” ва “Параллел тўхташ” машқларида ғилдиракларни машқни бажаришнинг қайд этиш чизиғига қўймади",
          ru: "В упражнениях «Въезд в бокс» и «Параллельная парковка» не поставил колёса на линию фиксации выполнения упражнения",
        },
      },
      {
        no: 18,
        points: 25,
        text: {
          oz: "Yo'lning tezlashish qismida harakatlanishda ikkinchi uzatmani qo'shmadi",
          uz: "Йўлнинг тезлашиш қисмида ҳаракатланишда иккинчи узатмани қўшмади",
          ru: "При движении на участке разгона не включил вторую передачу",
        },
      },
      {
        no: 19,
        points: 20,
        text: {
          oz: "Transport vositasining salonida tovushli va/yoki yorug'lik ishorasi yonganidan so'ng 2 soniya ichida transport vositasini to'xtatmadi",
          uz: "Транспорт воситасининг салонида товушли ва/ёки ёруғлик ишораси ёнганидан сўнг 2 сония ичида транспорт воситасини тўхтатмади",
          ru: "Не остановил транспортное средство в течение 2 секунд после звукового и/или светового сигнала в салоне",
        },
      },
      {
        no: 20,
        points: 20,
        text: {
          oz: "“Avariya holatda to'xtash” mashqida to'xtagandan so'ng 3 soniya ichida avariya ishorasini yoqmadi",
          uz: "“Авария ҳолатда тўхташ” машқида тўхтагандан сўнг 3 сония ичида авария ишорасини ёқмади",
          ru: "В упражнении «Аварийная остановка» не включил аварийную сигнализацию в течение 3 секунд после остановки",
        },
      },
      {
        no: 21,
        points: 10,
        text: {
          oz: "“Avariya holatda to'xtash” mashqida harakatni boshlashdan oldin avariya ishorasini o'chirmadi",
          uz: "“Авария ҳолатда тўхташ” машқида ҳаракатни бошлашдан олдин авария ишорасини ўчирмади",
          ru: "В упражнении «Аварийная остановка» не выключил аварийную сигнализацию перед началом движения",
        },
      },
      {
        no: 22,
        points: 20,
        note: PER_MISTAKE,
        text: {
          oz: "Sinov mashqlarini bajarayotganda dvigatelni o'chirib qo'ydi",
          uz: "Синов машқларини бажараётганда двигателни ўчириб қўйди",
          ru: "Заглушил двигатель при выполнении контрольных упражнений",
        },
      },
    ],
  },
  {
    level: "qopol",
    title: { oz: "Qo'pol xatolik", uz: "Қўпол хатолик", ru: "Грубая ошибка" },
    items: [
      {
        no: 23,
        points: 100,
        text: {
          oz: "“Start” ishorasidan keyin 40 soniya davomida harakatni boshlamadi",
          uz: "“Старт” ишорасидан кейин 40 сония давомида ҳаракатни бошламади",
          ru: "Не начал движение в течение 40 секунд после сигнала «Старт»",
        },
      },
      {
        no: 24,
        points: 100,
        text: {
          oz: "Svetoforning taqiqlovchi ishorasida chorrahaga kirdi yoki transport vositasining eng oldingi nuqtasi “To'xtash chizig'i”dan o'tdi",
          uz: "Светофорнинг тақиқловчи ишорасида чорраҳага кирди ёки транспорт воситасининг энг олдинги нуқтаси “Тўхташ чизиғи”дан ўтди",
          ru: "Выехал на перекрёсток на запрещающий сигнал светофора или передняя точка транспортного средства пересекла «Стоп-линию»",
        },
      },
      {
        no: 25,
        points: 50,
        text: {
          oz: "Temir yo'l kesishmasidan to'xtamasdan o'tdi",
          uz: "Темир йўл кесишмасидан тўхтамасдан ўтди",
          ru: "Проехал железнодорожный переезд без остановки",
        },
      },
      {
        no: 26,
        points: 100,
        text: {
          oz: "Imtihonni o'zboshimchalik bilan tark etdi yoki sinov mashqlarini bajarishni rad etdi",
          uz: "Имтиҳонни ўзбошимчалик билан тарк этди ёки синов машқларини бажаришни рад этди",
          ru: "Самовольно покинул экзамен или отказался выполнять контрольные упражнения",
        },
      },
      {
        no: 27,
        points: 100,
        text: {
          oz: "Sinov mashqlaridan birini bajarmadi",
          uz: "Синов машқларидан бирини бажармади",
          ru: "Не выполнил одно из контрольных упражнений",
        },
      },
      {
        no: 28,
        points: 100,
        text: {
          oz: "Sinov mashqlarini bajarish uchun belgilangan yo'nalishdan chetga chiqib ketdi",
          uz: "Синов машқларини бажариш учун белгиланган йўналишдан четга чиқиб кетди",
          ru: "Выехал за пределы маршрута, установленного для выполнения контрольных упражнений",
        },
      },
      {
        no: 29,
        points: 100,
        text: {
          oz: "Sinov mashqlarida ko'zda tutilmagan joylarda orqaga harakatlandi",
          uz: "Синов машқларида кўзда тутилмаган жойларда орқага ҳаракатланди",
          ru: "Двигался задним ходом в местах, не предусмотренных контрольными упражнениями",
        },
      },
      {
        no: 30,
        points: 100,
        text: {
          oz: "Boshqa transport vositasi bilan to'qnashuv sodir qildi yoki to'siqqa borib urildi",
          uz: "Бошқа транспорт воситаси билан тўқнашув содир қилди ёки тўсиққа бориб урилди",
          ru: "Совершил столкновение с другим транспортным средством или наезд на препятствие",
        },
      },
      {
        no: 31,
        points: 100,
        text: {
          oz: "Harakatlanish tezligini 40 km/soatdan oshirib yubordi",
          uz: "Ҳаракатланиш тезлигини 40 км/соатдан ошириб юборди",
          ru: "Превысил скорость движения более 40 км/ч",
        },
      },
      {
        no: 32,
        points: 100,
        text: {
          oz: "Amaliy imtihon uchun belgilangan umumiy vaqtdan oshib ketdi",
          uz: "Амалий имтиҳон учун белгиланган умумий вақтдан ошиб кетди",
          ru: "Превысил общее время, отведённое на практический экзамен",
        },
      },
    ],
  },
];

/**
 * Guruh rangi — jiddiylik oshgani sari to'qlashadi.
 *
 * Sarlavha uchun FON YO'Q, faqat matn rangi va kichik nuqta: ilgari sarlavha
 * yopishqoq (sticky), yarim shaffof va `backdrop-blur` li tasma edi —
 * pastdagi rangli ball belgilari uning ostidan xira dog' bo'lib ko'rinar,
 * kartaning tepasida esa tushunarsiz bo'sh joy qolardi.
 */
export const LEVEL_STYLE: Record<
  PenaltyLevel,
  { heading: string; dot: string; badge: string; number: string }
> = {
  kichik: {
    heading: "text-amber-600 dark:text-amber-400",
    dot: "bg-amber-500",
    badge: "bg-amber-500/15 text-amber-600 dark:text-amber-400",
    number: "text-muted-foreground",
  },
  orta: {
    heading: "text-orange-600 dark:text-orange-400",
    dot: "bg-orange-500",
    badge: "bg-orange-500/15 text-orange-600 dark:text-orange-400",
    number: "text-muted-foreground",
  },
  qopol: {
    heading: "text-rose-600 dark:text-rose-400",
    dot: "bg-rose-500",
    badge: "bg-rose-500/15 text-rose-600 dark:text-rose-400",
    number: "text-muted-foreground",
  },
};
