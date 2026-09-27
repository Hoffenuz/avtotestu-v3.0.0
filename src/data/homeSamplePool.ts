/**
 * AVTOMATIK YARATILGAN — qo'lda tahrirlamang.
 *   node scripts/generate-home-sample-pool.cjs
 *
 * "Sinab ko'ring" kartasining KUNLIK savollar hovuzi (kirgan foydalanuvchi
 * uchun, har kuni 5 tadan). Bepul bazadan, matn o'zgartirilmagan; tanlov
 * mezoni — skript boshida. Alohida chunk: faqat kerak bo'lganda yuklanadi.
 */
import type { HomeSampleQuestion } from "@/data/homeSampleQuestions";

export const HOME_SAMPLE_POOL: readonly HomeSampleQuestion[] = [
  {
    "id": "t_1_q_13",
    "correct": 2,
    "text": {
      "uz_lat": "Avtomobilni qanday boshqarish usuli yonilg'i sarfini tejaydi?",
      "uz_cyr": "Автомобилни қандай бошқариш усули ёнилғи сарфини тежайди?",
      "ru": "Какой способ управления автомобилем экономит расход топлива?"
    },
    "options": [
      {
        "uz_lat": "Shiddat bilan tezlanish va ohista sekinlashish bilan",
        "uz_cyr": "Шиддат билан тезланиш ва оҳиста секинлашиш билан",
        "ru": "С быстрым ускорением и плавным торможением"
      },
      {
        "uz_lat": "Ohista (ravon) tezlanish va shiddat bilan sekinlashish bilan",
        "uz_cyr": "Оҳиста (равон) тезланиш ва шиддат билан секинлашиш билан",
        "ru": "С плавным ускорением и быстрым торможением"
      },
      {
        "uz_lat": "Ohista (ravon) tezlanish va ohista sekinlashish bilan",
        "uz_cyr": "Оҳиста (равон) тезланиш ва оҳиста секинлашиш билан",
        "ru": "С плавным ускорением и плавным торможением"
      }
    ]
  },
  {
    "id": "t_2_q_2",
    "correct": 0,
    "text": {
      "uz_lat": "Yuk tirkamasida odam tashishga ruxsat etiladimi?",
      "uz_cyr": "Юк тиркамасида одам ташишга рухсат этиладими?",
      "ru": "Разрешается ли перевозка людей на грузовом прицепе?"
    },
    "options": [
      {
        "uz_lat": "Taqiqlanadi",
        "uz_cyr": "Тақиқланади",
        "ru": "Запрещается"
      },
      {
        "uz_lat": "Faqat yukni kuzatib boruvchi shaxsga ruxsat etiladi",
        "uz_cyr": "Фақат юкни кузатиб борувчи шахсга рухсат этилади",
        "ru": "Разрешается только лицам, сопровождающим груз"
      },
      {
        "uz_lat": "Ruxsat beriladi",
        "uz_cyr": "Рухсат берилади",
        "ru": "Разрешается"
      }
    ]
  },
  {
    "id": "t_3_q_8",
    "correct": 1,
    "text": {
      "uz_lat": "Qo'l jarohatlanganda kiyim qanday tartibda kiydiriladi?",
      "uz_cyr": "Қўл жароҳатланганда кийим қандай тартибда кийдирилади?",
      "ru": "Как правильно надевается одежда при ранении руки?"
    },
    "options": [
      {
        "uz_lat": "Kiyim ikkala qo'lga barobar kiydiriladi",
        "uz_cyr": "Кийим иккала қўлга баробар кийдирилади",
        "ru": "Одежда надевается одновременно на обе руки"
      },
      {
        "uz_lat": "Kiyim avval jarohatlangan qo'lga, so'ngra sog' qo'lga kiydiriladi",
        "uz_cyr": "Кийим аввал жароҳатланган қўлга, сўнгра соғ қўлга кийдирилади",
        "ru": "Одежду сначала надевают на повреждённую руку, затем на здоровую"
      },
      {
        "uz_lat": "Kiyim avval sog' qo'lga, so'ngra jarohatlangan qo'lga kiydiriladi",
        "uz_cyr": "Кийим аввал соғ қўлга, сўнгра жароҳатланган қўлга кийдирилади",
        "ru": "Одежду сначала надевают на здоровую руку, затем на повреждённую"
      }
    ]
  },
  {
    "id": "t_4_q_5",
    "correct": 0,
    "text": {
      "uz_lat": "Piyodalar to'xtab turgan avtobus va trolleybusning qaysi tomonidan yo'lni kesib o'tishlari kerak?",
      "uz_cyr": "Пиёдалар тўхтаб турган автобус ва троллейбуснинг қайси томонидан йўлни кесиб ўтишлари керак?",
      "ru": "Пешеходы при пересечении дороги с какой стороны обязаны обходить стоящий автобус и троллейбус?"
    },
    "options": [
      {
        "uz_lat": "Orqa tomonidan",
        "uz_cyr": "Орқа томонидан",
        "ru": "Сзади"
      },
      {
        "uz_lat": "Oldi tomonidan",
        "uz_cyr": "Олди томонидан",
        "ru": "Спереди"
      },
      {
        "uz_lat": "Istalgan tomonidan",
        "uz_cyr": "Исталган томонидан",
        "ru": "С любой стороны"
      }
    ]
  },
  {
    "id": "t_5_q_5",
    "correct": 3,
    "text": {
      "uz_lat": "Ruxsat etilgan to'la vazni 3,5 t dan kam bo'lgan yuk avtomobilining haydovchisiga avtomagistrallarda nima taqiqlangan?",
      "uz_cyr": "Рухсат этилган тўла вазни 3,5 т дан кам бўлган юк автомобилининг ҳайдовчисига автомагистралларда нима тақиқланган?",
      "ru": "Что запрещено на автомагистрали водителям грузовых автомобилей, разрешенная максимальная масса которых менее 3,5 т?"
    },
    "options": [
      {
        "uz_lat": "Barcha sanab o'tilgan harakatlar",
        "uz_cyr": "Барча санаб ўтилган ҳаракатлар",
        "ru": "Буксировка механических транспортных средств"
      },
      {
        "uz_lat": "Uch bo'lakli yo'lning ikkinchi bo'lagida harakatlanish",
        "uz_cyr": "Уч бўлакли йўлнинг иккинчи бўлагида ҳаракатланиш",
        "ru": "Движение во второй полосе трехполосной дороги"
      },
      {
        "uz_lat": "Mexanik transport vositalarini shatakka olish",
        "uz_cyr": "Механик транспорт воситаларини шатакка олиш",
        "ru": "Все перечисленные действия"
      },
      {
        "uz_lat": "Orqa bilan harakatlanish",
        "uz_cyr": "Орқа билан ҳаракатланиш",
        "ru": "Движение задним ходом"
      }
    ]
  },
  {
    "id": "t_7_q_4",
    "correct": 2,
    "text": {
      "uz_lat": "G'ildiraklarni yo'l bilan ilashishi yo'qolganda (kuchli yomg'ir, sel yoki suv toshgan yo'l qismlari) haydovchi:",
      "uz_cyr": "Ғилдиракларни йўл билан илашиши йўқолганда (кучли ёмғир, сел ёки сув тошган йўл қисмлари) ҳайдовчи:",
      "ru": "При потере сцепления колёс с дорогой (сильный дождь или затопление участка дороги) водитель:"
    },
    "options": [
      {
        "uz_lat": "Tezlikni oshirish lozim",
        "uz_cyr": "Тезликни ошириш лозим",
        "ru": "Должен увеличить скорость."
      },
      {
        "uz_lat": "Tormoz tepkisini keskin bosish bilan tezlikni kamaytirish lozim",
        "uz_cyr": "Тормоз тепкисини кескин босиш билан тезликни камайтириш лозим",
        "ru": "Он должен снизить скорость, резко нажав на педаль тормоза."
      },
      {
        "uz_lat": "Dvigatel bilan tormozlash orqali tezlikni kamaytirishi lozim",
        "uz_cyr": "Двигател билан тормозлаш орқали тезликни камайтириши лозим",
        "ru": "Необходимо снизить скорость и применить торможение двигателем."
      }
    ]
  },
  {
    "id": "t_8_q_2",
    "correct": 1,
    "text": {
      "uz_lat": "Yengil avtomobil tirkamasi burilishda qanday trayektoriya bo'yicha harakatlanadi?",
      "uz_cyr": "Енгил автомобил тиркамаси бурилишда қандай траектория бўйича ҳаракатланади?",
      "ru": "По какой траектории движется прицеп легкового автомобиля при повороте?"
    },
    "options": [
      {
        "uz_lat": "Burilish markaziga nisbatan avtomobil trayektoriyasidan tashqarida",
        "uz_cyr": "Бурилиш марказига нисбатан автомобил траекториясидан ташқарида",
        "ru": "Вне траектории автомобиля относительно центра поворота"
      },
      {
        "uz_lat": "Burilish markaziga nisbatan avtomobil trayektoriyasidan ichkarida",
        "uz_cyr": "Бурилиш марказига нисбатан автомобил траекториясидан ичкарида",
        "ru": "Внутри траектории автомобиля относительно центра поворота"
      },
      {
        "uz_lat": "Avtomobil burilish trayektoriyasi bo'yicha",
        "uz_cyr": "Автомобил бурилиш траекторияси бўйича",
        "ru": "По траектории поворота автомобиля"
      }
    ]
  },
  {
    "id": "t_9_q_4",
    "correct": 2,
    "text": {
      "uz_lat": "Qaysi hollarda velosipedchilarga qatnov qismining o'ng chekkasidan chiqishga yo'l qo'yiladi?",
      "uz_cyr": "Қайси ҳолларда велосипедчиларга қатнов қисмининг ўнг чеккасидан чиқишга йўл қўйилади?",
      "ru": "В каких случаях допускается выезд велосипедистов от правого края проезжей части?"
    },
    "options": [
      {
        "uz_lat": "Yuk ortib ketayotganda",
        "uz_cyr": "Юк ортиб кетаётганда",
        "ru": "При перевозке груза"
      },
      {
        "uz_lat": "Ikkala sanab o'tilgan hollarda",
        "uz_cyr": "Иккала санаб ўтилган ҳолларда",
        "ru": "В обоих перечисленных случаях"
      },
      {
        "uz_lat": "Ruxsat etilgan hollarda chapga burilish yoki orqaga qaytish uchun",
        "uz_cyr": "Рухсат этилган ҳолларда чапга бурилиш ёки орқага қайтиш учун",
        "ru": "В разрешенных случаях для поворота налево или разворота"
      }
    ]
  },
  {
    "id": "t_10_q_4",
    "correct": 1,
    "text": {
      "uz_lat": "Kunning qorong'i vaqtida va bulutli ob-havoda ro'paradan kelayotgan avtomobil tezligi qanday tuyuladi?",
      "uz_cyr": "Куннинг қоронғу вақтида ва булутли об-ҳавода рўпарадан келаётган автомобил тезлиги қандай туюлади?",
      "ru": "В тёмное время суток и в пасмурную погоду скорость встречного автомобиля воспринимается?"
    },
    "options": [
      {
        "uz_lat": "Tezlikni qabul qilish o'zgarmaydi",
        "uz_cyr": "Тезликни қабул қилиш ўзгармайди",
        "ru": "Восприятие скорости не меняется"
      },
      {
        "uz_lat": "Aslidagidan kam tezlikda tuyuladi",
        "uz_cyr": "Аслидагидан кам тезликда туюлади",
        "ru": "Ниже, чем в действительности"
      },
      {
        "uz_lat": "Aslidagidan katta tezlikda tuyuladi",
        "uz_cyr": "Аслидагидан катта тезликда туюлади",
        "ru": "Выше, чем в действительности"
      }
    ]
  },
  {
    "id": "t_11_q_20",
    "correct": 2,
    "text": {
      "uz_lat": "Harakat tezligi ikki marta oshganda, tormozlanish yo'li necha marta ortadi?",
      "uz_cyr": "Ҳаракат тезлиги икки марта ошганда, тормозланиш йўли неча марта ортади?",
      "ru": "Во сколько раз увеличивается длина тормозного пути, если скорость движения увеличивается в два раза?"
    },
    "options": [
      {
        "uz_lat": "Uch marta",
        "uz_cyr": "Уч марта",
        "ru": "В три раза"
      },
      {
        "uz_lat": "Tormoz yo'li harakat tezligiga bog'liq emas",
        "uz_cyr": "Тормоз йўли ҳаракат тезлигига боғлиқ эмас",
        "ru": "Длина тормозного пути не зависит от скорости движения"
      },
      {
        "uz_lat": "To'rt marta",
        "uz_cyr": "Тўрт марта",
        "ru": "В четыре раза"
      },
      {
        "uz_lat": "Ikki marta",
        "uz_cyr": "Икки марта",
        "ru": "В два раза"
      }
    ]
  },
  {
    "id": "t_12_q_1",
    "correct": 0,
    "text": {
      "uz_lat": "Qisman ortish usuli bilan avtomobilni shatakka olishda yo'lovchilar qayerda bo'lishlari mumkin?",
      "uz_cyr": "Қисман ортиш усули билан автомобилни шатакка олишда йўловчилар қаерда бўлишлари мумкин?",
      "ru": "Где могут находиться пассажиры при буксировке путем частичной погрузки?"
    },
    "options": [
      {
        "uz_lat": "Shatakka oluvchi avtomobilning kabinasida",
        "uz_cyr": "Шатакка олувчи автомобилнинг кабинасида",
        "ru": "В кабине буксирующего автомобиля"
      },
      {
        "uz_lat": "Shatakka oluvchi avtomobilning kuzovida",
        "uz_cyr": "Шатакка олувчи автомобилнинг кузовида",
        "ru": "В кузове буксирующего автомобиля"
      },
      {
        "uz_lat": "Har ikki avtomobilning kabinasida",
        "uz_cyr": "Ҳар икки автомобилнинг кабинасида",
        "ru": "В кабине обоих автомобилей"
      },
      {
        "uz_lat": "Shatakka olingan avtomobilning kabinasida",
        "uz_cyr": "Шатакка олинган автомобилнинг кабинасида",
        "ru": "В кабине буксируемого автомобиля"
      }
    ]
  },
  {
    "id": "t_14_q_14",
    "correct": 2,
    "text": {
      "uz_lat": "Velosipedlarda yuk tashilganda gabaritidan bo'yiga va eniga qanchadan ortiq chiqib tursa, yuk tashish taqiqlanadi?",
      "uz_cyr": "Велосипедларда юк ташилганда габаритидан бўйига ва энига қанчадан ортиқ чиқиб турса, юк ташиш тақиқланади?",
      "ru": "При перевозке грузов на велосипедах запрещено провозить груз, если он превышает габариты по высоте и ширине?"
    },
    "options": [
      {
        "uz_lat": "1 m",
        "uz_cyr": "1 м",
        "ru": "1 м"
      },
      {
        "uz_lat": "0,3 m",
        "uz_cyr": "0.3 м",
        "ru": "0.3 м"
      },
      {
        "uz_lat": "0,5 m",
        "uz_cyr": "0.5 м",
        "ru": "0.5 м"
      },
      {
        "uz_lat": "0,4 m",
        "uz_cyr": "0.4 м",
        "ru": "0.4 м"
      }
    ]
  },
  {
    "id": "t_16_q_1",
    "correct": 1,
    "text": {
      "uz_lat": "Qattiq yoki egiluvchan ulagichda shatakka olgan yuk avtomobilining kuzovida odam tashishga ruxsat etiladimi?",
      "uz_cyr": "Қаттиқ ёки егилувчан улагичда шатакка олган юк автомобилининг кузовида одам ташишга рухсат этиладими?",
      "ru": "При буксировке на жесткий или гибкий сцепки разрешается ли перевозить людей в кузове буксирующего грузового автомобиля?"
    },
    "options": [
      {
        "uz_lat": "Taqiqlanadi",
        "uz_cyr": "Тақиқланади",
        "ru": "Запрещено"
      },
      {
        "uz_lat": "Ruxsat etiladi",
        "uz_cyr": "Рухсат этилади",
        "ru": "Разрешено"
      }
    ]
  },
  {
    "id": "t_17_q_2",
    "correct": 1,
    "text": {
      "uz_lat": "Yo'l belgilari va chiziqlarining ma'nolari bir-birini inkor etganda haydovchi qaysi biriga rioya qilishi kerak?",
      "uz_cyr": "Йўл белгилари ва чизиқларининг маънолари бир-бирини инкор этганда ҳайдовчи қайси бирига риоя қилиши керак?",
      "ru": "Чем должен руководствоваться водитель, когда значение дорожных знаков и линий разметки противоречат друг другу?"
    },
    "options": [
      {
        "uz_lat": "Yo'l chiziqlariga",
        "uz_cyr": "Йўл чизиқларига",
        "ru": "Линиями разметки"
      },
      {
        "uz_lat": "Yo'l belgilariga",
        "uz_cyr": "Йўл белгиларига",
        "ru": "Дорожными знаками"
      }
    ]
  },
  {
    "id": "t_18_q_2",
    "correct": 0,
    "text": {
      "uz_lat": "Transport vositasini boshqarishni o'rgatayotgan shaxs haydovchi hisoblanadimi?",
      "uz_cyr": "Транспорт воситасини бошқаришни ўргатаётган шахс ҳайдовчи ҳисобланадими?",
      "ru": "Считается ли человек, обучающий вождению транспортного средства, водителем?"
    },
    "options": [
      {
        "uz_lat": "Ha",
        "uz_cyr": "Ҳа",
        "ru": "Да"
      },
      {
        "uz_lat": "Yo'q",
        "uz_cyr": "Йўқ",
        "ru": "Нет"
      }
    ]
  },
  {
    "id": "t_20_q_12",
    "correct": 2,
    "text": {
      "uz_lat": "M2 toifali avtotransport vositalarining boshqaruv qurilmasidagi qanday eng katta lyuft yig'indisiga yo'l qo'yiladi",
      "uz_cyr": "М2 тоифали автотранспорт воситаларининг бошқарув қурилмасидаги қандай энг катта люфт йиғиндисига йўл қўйилади",
      "ru": "Какая максимально допустимая величина люфта в рулевом управлении транспортных средств категории М2:"
    },
    "options": [
      {
        "uz_lat": "3,25 gradus",
        "uz_cyr": "3,25 градус",
        "ru": "3,25 градуса"
      },
      {
        "uz_lat": "10 gradus",
        "uz_cyr": "10 градус",
        "ru": "10 градусов"
      },
      {
        "uz_lat": "20 gradus",
        "uz_cyr": "20 градус",
        "ru": "20 градусов"
      }
    ]
  },
  {
    "id": "t_21_q_8",
    "correct": 0,
    "text": {
      "uz_lat": "Shatakka olingan mexanik transport vositasida qanday tashqi yoritish chiroqlari yoqilgan bo'lishi kerak?",
      "uz_cyr": "Шатакка олинган механик транспорт воситасида қандай ташқи ёритиш чироқлари ёқилган бўлиши керак?",
      "ru": "Какое внешнее освещение должно быть включено на буксируемом транспортном средстве?"
    },
    "options": [
      {
        "uz_lat": "Falokat yorug'lik ishoralari",
        "uz_cyr": "Фалокат ёруғлик ишоралари",
        "ru": "Аварийная сигнализация"
      },
      {
        "uz_lat": "Kunning qorong'i vaqtida, gabarit chiroqlari",
        "uz_cyr": "Куннинг қоронғи вақтида, габарит чироқлари",
        "ru": "В темное время суток, только габаритные огни"
      },
      {
        "uz_lat": "Yaqinni yorituvchi fara chiroqlari",
        "uz_cyr": "Яқинни ёритувчи фара чироқлари",
        "ru": "Ближний свет фар"
      }
    ]
  },
  {
    "id": "t_23_q_7",
    "correct": 1,
    "text": {
      "uz_lat": "Tashiladigan yuk vaznini va o'qlar bo'yicha tushadigan og'irlikni taqsimlashni kim tartibga solib turadi?",
      "uz_cyr": "Ташиладиган юк вазнини ва ўқлар бўйича тушадиган оғирликни тақсимлашни ким тартибга солиб туради?",
      "ru": "Кто регламентирует массу перевозимого груза и распределения нагрузки по осям?"
    },
    "options": [
      {
        "uz_lat": "Davlat YHXX",
        "uz_cyr": "Давлат ЙҲХХ",
        "ru": "ГСБДД"
      },
      {
        "uz_lat": "Mazkur transport vositasini tayyorlovchi-korxona",
        "uz_cyr": "Мазкур транспорт воситасини тайёрловчи-корхона",
        "ru": "Предприятие-изготовитель данного транспортного средства"
      },
      {
        "uz_lat": "Avtoxo'jalik ma'muriyati",
        "uz_cyr": "Автохўжалик маъмурияти",
        "ru": "Администрация автохозяйства"
      }
    ]
  },
  {
    "id": "t_24_q_3",
    "correct": 1,
    "text": {
      "uz_lat": "Qorin bo'shlig'i jarohatlangan odamga ovqat, suv, dori-darmon berishi mumkinmi?",
      "uz_cyr": "Қорин бўшлиғи жароҳатланган одамга овқат, сув, дори-дармон бериши мумкинми?",
      "ru": "Можно ли давать еду, воду, лекарства человеку с травмой живота?"
    },
    "options": [
      {
        "uz_lat": "Ha",
        "uz_cyr": "Ҳа",
        "ru": "Да"
      },
      {
        "uz_lat": "Yo'q",
        "uz_cyr": "Йўқ",
        "ru": "Нет"
      }
    ]
  },
  {
    "id": "t_25_q_12",
    "correct": 2,
    "text": {
      "uz_lat": "Umurtqasining ko'krak qismi shikastlangan kishi transportda qanday tashiladi?",
      "uz_cyr": "Умуртқасининг кўкрак қисми шикастланган киши транспортда қандай ташилади?",
      "ru": "Как транспортировать пострадавшего с повреждением грудного отдела позвоночника?"
    },
    "options": [
      {
        "uz_lat": "Qattiq taxtada yoni bilan yotgan holda",
        "uz_cyr": "Қаттиқ тахтада ёни билан ётган ҳолда",
        "ru": "Лежа на спине на мягкой подстилке"
      },
      {
        "uz_lat": "Yumshoq taglikda orqasi bilan yotgan holda",
        "uz_cyr": "Юмшоқ тагликда орқаси билан ётган ҳолда",
        "ru": "Лежа на боку на жестком щите"
      },
      {
        "uz_lat": "Qattiq taxtada orqasi bilan yotgan holda",
        "uz_cyr": "Қаттиқ тахтада орқаси билан ётган ҳолда",
        "ru": "Лежа на спине на жестком щите"
      }
    ]
  },
  {
    "id": "t_27_q_5",
    "correct": 2,
    "text": {
      "uz_lat": "Kesishayotgan qatnov qismi chetiga qanchadan kam masofa qolganda to'xtash taqiqlanadi?",
      "uz_cyr": "Кесишаётган қатнов қисми четига қанчадан кам масофа қолганда тўхташ тақиқланади?",
      "ru": "Ближе какого расстояния запрещено останавливаться от края пересекаемой проезжей части?"
    },
    "options": [
      {
        "uz_lat": "45 metr",
        "uz_cyr": "45 метр",
        "ru": "45 метров"
      },
      {
        "uz_lat": "40 metr",
        "uz_cyr": "40 метр",
        "ru": "40 метров"
      },
      {
        "uz_lat": "30 metr",
        "uz_cyr": "30 метр",
        "ru": "30 метров"
      }
    ]
  },
  {
    "id": "t_29_q_13",
    "correct": 0,
    "text": {
      "uz_lat": "Qaysi hollarda transport vositasidan foydalanish taqiqlanadi?",
      "uz_cyr": "Қайси ҳолларда транспорт воситасидан фойдаланиш тақиқланади?",
      "ru": "В каком случае запрещается эксплуатация транспортного средства?"
    },
    "options": [
      {
        "uz_lat": "Tovush signallari ishlamaydi",
        "uz_cyr": "Товуш сигналлари ишламайди",
        "ru": "Не работают звуковые сигналы"
      },
      {
        "uz_lat": "Dvigatel qiyinchilik bilan ishga tushadi",
        "uz_cyr": "Двигатель қийинчилик билан ишга тушади",
        "ru": "Двигатель запускается с трудом"
      },
      {
        "uz_lat": "O't oldirish tizimi nosoz",
        "uz_cyr": "Ўт олдириш тизими носоз",
        "ru": "Неисправна система зажигания"
      },
      {
        "uz_lat": "Yonilg'i darajasini ko'rsatish qurilmasi ishlamaydi",
        "uz_cyr": "Ёнилғи даражасини кўрсатиш қурилмаси ишламайди",
        "ru": "Не работает указатель уровня топлива"
      }
    ]
  },
  {
    "id": "t_31_q_8",
    "correct": 1,
    "text": {
      "uz_lat": "Turar joy dahalarida eng katta tezlikda harakatlanishga ruxsat etiladi:",
      "uz_cyr": "Турар жой даҳаларида энг катта тезликда ҳаракатланишга рухсат этилади:",
      "ru": "Какая максимальная скорость разрешена в жилых зонах:"
    },
    "options": [
      {
        "uz_lat": "30 km/soat",
        "uz_cyr": "30 км/соат",
        "ru": "30 км/ч"
      },
      {
        "uz_lat": "20 km/soat",
        "uz_cyr": "20 км/соат",
        "ru": "20 км/ч"
      },
      {
        "uz_lat": "5 km/soat",
        "uz_cyr": "5 км/соат",
        "ru": "5км/ч"
      },
      {
        "uz_lat": "40 km/soat",
        "uz_cyr": "40 км/соат",
        "ru": "40 км/ч"
      }
    ]
  },
  {
    "id": "t_32_q_1",
    "correct": 0,
    "text": {
      "uz_lat": "Qoidalarda nechta asosiy tushuncha va atamalardan foydalaniladi?",
      "uz_cyr": "Қоидаларда нечта асосий тушунча ва атамалардан фойдаланилади?",
      "ru": "Сколько основных понятий и терминов используется в Правилах?"
    },
    "options": [
      {
        "uz_lat": "78",
        "uz_cyr": "78",
        "ru": "78"
      },
      {
        "uz_lat": "65",
        "uz_cyr": "65",
        "ru": "65"
      },
      {
        "uz_lat": "77",
        "uz_cyr": "77",
        "ru": "77"
      },
      {
        "uz_lat": "56",
        "uz_cyr": "56",
        "ru": "56"
      }
    ]
  },
  {
    "id": "t_33_q_17",
    "correct": 2,
    "text": {
      "uz_lat": "Velosiped yo'lkasi bilan kesishuvga qanchadan kam masofa qolganda to'xtash taqiqlanadi?",
      "uz_cyr": "Велосипед йўлкаси билан кесишувга қанчадан кам масофа қолганда тўхташ тақиқланади?",
      "ru": "На каком расстоянии от пересечения с велосипедной дорожкой запрещается остановка?"
    },
    "options": [
      {
        "uz_lat": "30 metr",
        "uz_cyr": "30 метр",
        "ru": "30 метров"
      },
      {
        "uz_lat": "15 metr",
        "uz_cyr": "15 метр",
        "ru": "15 метров"
      },
      {
        "uz_lat": "10 metr",
        "uz_cyr": "10 метр",
        "ru": "10 метров"
      }
    ]
  },
  {
    "id": "t_34_q_11",
    "correct": 0,
    "text": {
      "uz_lat": "Haydovchining o'rtacha reaksiya vaqti deb qabul qilingan:",
      "uz_cyr": "Ҳайдовчининг ўртача реаксия вақти деб қабул қилинган:",
      "ru": "Среднее время реакции водителя составляет:"
    },
    "options": [
      {
        "uz_lat": "Taxminan 1 soniya",
        "uz_cyr": "Тахминан 1 сония",
        "ru": "Около 1 секунды"
      },
      {
        "uz_lat": "Taxminan 5 soniya",
        "uz_cyr": "Тахминан 5 сония",
        "ru": "Около 5 секунд"
      },
      {
        "uz_lat": "Taxminan 0,2 soniya",
        "uz_cyr": "Тахминан 0,2 сония",
        "ru": "Около 0,2 секунды."
      }
    ]
  },
  {
    "id": "t_36_q_4",
    "correct": 1,
    "text": {
      "uz_lat": "Turar joy dahalaridan chiqishda haydovchilar:",
      "uz_cyr": "Турар жой даҳаларидан чиқишда ҳайдовчилар:",
      "ru": "При выезде из жилой зоны водитель:"
    },
    "options": [
      {
        "uz_lat": "Boshqa harakat qatnashchilariga nisbatan imtiyozga ega",
        "uz_cyr": "Бошқа ҳаракат қатнашчиларига нисбатан имтиёзга ега",
        "ru": "Он имеет приоритет перед другими участниками движения"
      },
      {
        "uz_lat": "Boshqa harakat qatnashchilariga yo'l berishi kerak",
        "uz_cyr": "Бошқа ҳаракат қатнашчиларига йўл бериши керак",
        "ru": "Должен уступить дорогу другим участникам движения"
      }
    ]
  },
  {
    "id": "t_38_q_8",
    "correct": 1,
    "text": {
      "uz_lat": "Ko'krak qafasi shikastlangan yaradorni kerakli joyga qanday eltish kerak?",
      "uz_cyr": "Кўкрак қафаси шикастланган ярадорни керакли жойга қандай элтиш керак?",
      "ru": "Как нужно транспортировать раненного с повреждением грудной клетки?"
    },
    "options": [
      {
        "uz_lat": "Sog' yoni bilan yotgan yoki o'tirgan holda",
        "uz_cyr": "Соғ ёни билан ётган ёки ўтирган ҳолда",
        "ru": "В положении лежа на здоровом боку или сидя"
      },
      {
        "uz_lat": "Yaralangan yoni bilan yotgan yoki yarim o'tirgan holda",
        "uz_cyr": "Яраланган ёни билан ётган ёки ярим ўтирган ҳолда",
        "ru": "Лежа на поврежденном боку или полусидя"
      },
      {
        "uz_lat": "Orqasi bilan yoki qorni bilan yotgan holda",
        "uz_cyr": "Орқаси билан ёки қорни билан ётган ҳолда",
        "ru": "В положении лежа на спине или на животе"
      }
    ]
  },
  {
    "id": "t_39_q_15",
    "correct": 0,
    "text": {
      "uz_lat": "Mexanik transport vositalaridan foydalanish qanday sharoitlarda taqiqlanadi?",
      "uz_cyr": "Механик транспорт воситаларидан фойдаланиш қандай шароитларда тақиқланади?",
      "ru": "При каких условиях запрещается эксплуатация механических транспортных средств?"
    },
    "options": [
      {
        "uz_lat": "Davlat davriy texnik ko'rigidan belgilangan tartibda o'tmaganda",
        "uz_cyr": "Давлат даврий техник кўригидан белгиланган тартибда ўтмаганда",
        "ru": "Не прошедших государственный периодический технический осмотр в установленном порядке"
      },
      {
        "uz_lat": "Uzatish qutisida shovqin bo'lganda",
        "uz_cyr": "Узатиш қутисида шовқин бўлганда",
        "ru": "Перебои в работе двигателя"
      },
      {
        "uz_lat": "Yurgizgich ishida nuqson bo'lganda",
        "uz_cyr": "Юргизгич ишида нуқсон бўлганда",
        "ru": "Шум в коробке передач"
      }
    ]
  },
  {
    "id": "t_40_q_7",
    "correct": 0,
    "text": {
      "uz_lat": "Kunduzgi vaqtda yaqinni yorituvchi fara chirog'ini yoqish ogohlantirish ishorasi bo'ladimi?",
      "uz_cyr": "Кундузги вақтда яқинни ёритувчи фара чироғини ёқиш огоҳлантириш ишораси бўладими?",
      "ru": "Является ли включение ближнего света фар в дневное время предупредительным сигналом?"
    },
    "options": [
      {
        "uz_lat": "Bo'ladi",
        "uz_cyr": "Бўлади",
        "ru": "Является"
      },
      {
        "uz_lat": "Bo'lmaydi",
        "uz_cyr": "Бўлмайди",
        "ru": "Не является"
      }
    ]
  },
  {
    "id": "t_42_q_4",
    "correct": 1,
    "text": {
      "uz_lat": "Shlagbaumni o'zboshimchalik bilan ochish yoki aylanib o'tishga ruxsat beriladimi?",
      "uz_cyr": "Шлагбаумни ўзбошимчалик билан очиш ёки айланиб ўтишга рухсат бериладими?",
      "ru": "Разрешается ли открывать шлагбаум или объезжать его?"
    },
    "options": [
      {
        "uz_lat": "Ruxsat beriladi, faqat svetofor o'chgan bo'lsa",
        "uz_cyr": "Рухсат берилади, фақат светофор ўчган бўлса",
        "ru": "Разрешается если светофор выключен"
      },
      {
        "uz_lat": "Taqiqlanadi",
        "uz_cyr": "Тақиқланади",
        "ru": "Запрещается"
      }
    ]
  },
  {
    "id": "t_44_q_1",
    "correct": 1,
    "text": {
      "uz_lat": "M3 toifadagi avtotransport vositalarining boshqaruv qurilmasidagi qanday eng katta lyuft yig'indisiga yo'l qo'yiladi?",
      "uz_cyr": "М3 тоифадаги автотранспорт воситаларининг бошқарув қурилмасидаги қандай энг катта люфт йиғиндисига йўл қўйилади?",
      "ru": "Какой максимально допустимый люфт в рулевом управлении автомобилей категории М3:"
    },
    "options": [
      {
        "uz_lat": "25 gradus",
        "uz_cyr": "25 градус",
        "ru": "25 градусов"
      },
      {
        "uz_lat": "20 gradus",
        "uz_cyr": "20 градус",
        "ru": "20 градусов"
      },
      {
        "uz_lat": "10 gradus",
        "uz_cyr": "10 градус",
        "ru": "10 градусов"
      }
    ]
  },
  {
    "id": "t_45_q_6",
    "correct": 0,
    "text": {
      "uz_lat": "Chapga burilayotgan haydovchi kesishayotgan yo'lning qatnov qismidan o'tayotgan piyodalarga yo'l berishi kerakmi?",
      "uz_cyr": "Чапга бурилаётган ҳайдовчи кесишаётган йўлнинг қатнов қисмидан ўтаётган пиёдаларга йўл бериши керакми?",
      "ru": "Нужно ли уступать дорогу пешеходам, переходящим дорогу там. где водитель поворачивает налево?"
    },
    "options": [
      {
        "uz_lat": "Ha, barcha hollarda o'tkazilishi kerak",
        "uz_cyr": "Ҳа, барча ҳолларда ўтказилиши керак",
        "ru": "Да, во всех случаях"
      },
      {
        "uz_lat": "Ha, agarda piyodalar o'tish joyi bo'lsa",
        "uz_cyr": "Ҳа, агарда пиёдалар ўтиш жойи бўлса",
        "ru": "Да, если есть пешеходный переход"
      }
    ]
  },
  {
    "id": "t_46_q_7",
    "correct": 3,
    "text": {
      "uz_lat": "Qaysi joylarda orqa bilan harakatlanish taqiqlanadi?",
      "uz_cyr": "Қайси жойларда орқа билан ҳаракатланиш тақиқланади?",
      "ru": "В каких местах запрещено движение задним ходом?"
    },
    "options": [
      {
        "uz_lat": "Chorrahalarda, piyodalar o'tish joylarida",
        "uz_cyr": "Чорраҳаларда, пиёдалар ўтиш жойларида",
        "ru": "На мостах, путепроводах, эстакадах и под ними"
      },
      {
        "uz_lat": "Ko'priklarda, osma yo'llarda, estakadalarda va ularning ostida",
        "uz_cyr": "Кўприкларда, осма йўлларда, эстакадаларда ва уларнинг остида",
        "ru": "На перекрёстках, пешеходных переходах"
      },
      {
        "uz_lat": "Avtomagistrallarda",
        "uz_cyr": "Автомагистралларда",
        "ru": "На автомагистралях"
      },
      {
        "uz_lat": "Sanab o'tilgan barcha joylarda",
        "uz_cyr": "Санаб ўтилган барча жойларда",
        "ru": "Во всех перечисленных местах"
      }
    ]
  },
  {
    "id": "t_49_q_5",
    "correct": 3,
    "text": {
      "uz_lat": "Turar joy dahalarida qanday eng katta tezlikda harakatlanishga ruxsat etiladi:",
      "uz_cyr": "Турар жой даҳаларида қандай энг катта тезликда ҳаракатланишга рухсат этилади:",
      "ru": "С какой максимальной скоростью разрешается движение в жилых зонах:"
    },
    "options": [
      {
        "uz_lat": "30 km/soat",
        "uz_cyr": "30 км/соат",
        "ru": "30 км/ч"
      },
      {
        "uz_lat": "40 km/soat",
        "uz_cyr": "40 км/соат",
        "ru": "40 км/ч"
      },
      {
        "uz_lat": "5 km/soat",
        "uz_cyr": "5 км/соат",
        "ru": "5 км/ч"
      },
      {
        "uz_lat": "20 km/soat",
        "uz_cyr": "20 км/соат",
        "ru": "20 км/ч"
      }
    ]
  },
  {
    "id": "t_50_q_5",
    "correct": 2,
    "text": {
      "uz_lat": "Serqatnov harakatda transport vositasini keskin tormozlash:",
      "uz_cyr": "Серқатнов ҳаракатда транспорт воситасини кескин тормозлаш:",
      "ru": "Резкое торможение транспортного средства при интенсивном движении:"
    },
    "options": [
      {
        "uz_lat": "Serqatnov harakatda boshqarishning odatdagi usuli hisoblanadi",
        "uz_cyr": "Серқатнов ҳаракатда бошқаришнинг одатдаги усули ҳисобланади",
        "ru": "Является обычным приемом управления при интенсивном движении"
      },
      {
        "uz_lat": "Avtomobilning faqat texnik holatida ko'rinadi",
        "uz_cyr": "Автомобилнинг фақат техник ҳолатида кўринади",
        "ru": "Отражается только на техническом состоянии автомобиля"
      },
      {
        "uz_lat": "Orqadan kelayotganlarning urib ketishini keltirib chiqarishi mumkin",
        "uz_cyr": "Орқадан келаётганларнинг уриб кетишини келтириб чиқариши мумкин",
        "ru": "Может способствовать наезду сзади"
      }
    ]
  },
  {
    "id": "t_51_q_1",
    "correct": 2,
    "text": {
      "uz_lat": "Toliqish haydovchining diqqatiga va e'tiboriga qanday ta'sir qiladi?",
      "uz_cyr": "Толиқиш ҳайдовчининг диққатига ва эътиборига қандай таъсир қилади?",
      "ru": "Как влияет утомление на внимание и реакцию водителя?"
    },
    "options": [
      {
        "uz_lat": "Haydovchining diqqati va e'tibori oshadi",
        "uz_cyr": "Ҳайдовчининг диққати ва эътибори ошади",
        "ru": "Внимание и реакция водителя повышаются"
      },
      {
        "uz_lat": "Haydovchining diqqatiga va e'tiboriga ta'sir qilmaydi",
        "uz_cyr": "Ҳайдовчининг диққатига ва эътиборига таъсир қилмайди",
        "ru": "Не влияет на внимание и реакцию водителя"
      },
      {
        "uz_lat": "Haydovchining diqqati va e'tibori pasayadi",
        "uz_cyr": "Ҳайдовчининг диққати ва эътибори пасаяди",
        "ru": "Внимание и реакция водителя снижаются"
      }
    ]
  },
  {
    "id": "t_52_q_5",
    "correct": 2,
    "text": {
      "uz_lat": "Qoida bo'yicha necha yoshdan boshlab yengil avtomobilni boshqarishga ruxsat etiladi?",
      "uz_cyr": "Қоида бўйича неча ёшдан бошлаб енгил автомобилни бошқаришга рухсат этилади?",
      "ru": "С какого возраста правила разрешают управлять легковыми автомобилями?"
    },
    "options": [
      {
        "uz_lat": "16 yoshdan",
        "uz_cyr": "16 ёшдан",
        "ru": "С 16 лет"
      },
      {
        "uz_lat": "14 yoshdan",
        "uz_cyr": "14 ёшдан",
        "ru": "С 14 лет"
      },
      {
        "uz_lat": "18 yoshdan",
        "uz_cyr": "18 ёшдан",
        "ru": "С 18 лет"
      }
    ]
  },
  {
    "id": "t_53_q_9",
    "correct": 1,
    "text": {
      "uz_lat": "Mexanik transport vositalarini shatakka olishda egiluvchan ulagichga kamida nechta ogohlantiruvchi qurilma o'rnatiladi?",
      "uz_cyr": "Механик транспорт воситаларини шатакка олишда эгилувчан улагичга камида нечта огоҳлантирувчи қурилма ўрнатилади?",
      "ru": "Не менее скольких предупредительных устройств должно устанавливаться при буксировке на гибкой сцепке?"
    },
    "options": [
      {
        "uz_lat": "Kamida bitta",
        "uz_cyr": "Камида битта",
        "ru": "Не менее одной"
      },
      {
        "uz_lat": "Kamida ikkita",
        "uz_cyr": "Камида иккита",
        "ru": "Не менее двух"
      },
      {
        "uz_lat": "Kamida uchta",
        "uz_cyr": "Камида учта",
        "ru": "Не менее трёх"
      }
    ]
  },
  {
    "id": "t_55_q_1",
    "correct": 0,
    "text": {
      "uz_lat": "Svetoforning miltillovchi sariq ishorasi nima haqida ogohlantiradi?",
      "uz_cyr": "Светофорнинг милтилловчи сариқ ишораси нима ҳақида огоҳлантиради?",
      "ru": "О чем предупреждает мигающий желтый сигнал светофора?"
    },
    "options": [
      {
        "uz_lat": "Barcha javoblar to'g'ri",
        "uz_cyr": "Барча жавоблар тўғри",
        "ru": "Все ответы правильные"
      },
      {
        "uz_lat": "Chorraha tartibga solinmaganligi to'g'risida",
        "uz_cyr": "Чорраҳа тартибга солинмаганлиги тўғрисида",
        "ru": "О том, что перекрёсток не регулируемый"
      },
      {
        "uz_lat": "Harakatlanishga ruxsat beradi",
        "uz_cyr": "Ҳаракатланишга рухсат беради",
        "ru": "Разрешает движение"
      }
    ]
  },
  {
    "id": "t_56_q_6",
    "correct": 3,
    "text": {
      "uz_lat": "Transport vositalarini boshqarishni dastlabki o'rgatish (boshlang'ich mashg'ulot) qayerda amalga oshiriladi?",
      "uz_cyr": "Транспорт воситаларини бошқаришни дастлабки ўргатиш (бошланғич машғулот) қаерда амалга оширилади?",
      "ru": "Где проводится начальное обучение вождению транспортных средств (начальное обучение)?"
    },
    "options": [
      {
        "uz_lat": "Turar joy dahalarida",
        "uz_cyr": "Турар жой даҳаларида",
        "ru": "В жилых кварталах"
      },
      {
        "uz_lat": "Aholi punktlarida",
        "uz_cyr": "Аҳоли пунктларида",
        "ru": "В населённых пунктах"
      },
      {
        "uz_lat": "Avtomagistralda",
        "uz_cyr": "Автомагистралда",
        "ru": "На автомагистрали"
      },
      {
        "uz_lat": "Yopiq maydonchalarda yoki avtodromlarda",
        "uz_cyr": "Ёпиқ майдончаларда ёки автодромларда",
        "ru": "На крытых площадках или автодромах"
      }
    ]
  },
  {
    "id": "t_57_q_1",
    "correct": 2,
    "text": {
      "uz_lat": "5% li yod eritmasi (yod nastoykasi) nima uchun qo'llaniladi?",
      "uz_cyr": "5% ли йод эритмаси (йод настойкаси) нима учун қўлланилади?",
      "ru": "Для чего применяется 5% раствор йода (настойка йода), входящий в комплект аптечки, которой оснащены автотранспортные средства?"
    },
    "options": [
      {
        "uz_lat": "Yara o'ta darajada ifloslanganda yaraning butun yuzasiga surtish uchun",
        "uz_cyr": "Яра ўта даражада ифлосланганда яранинг бутун юзасига суртиш учун",
        "ru": "Для смазывания всей поверхности раны при сильном загрязнении раны"
      },
      {
        "uz_lat": "Birinchi darajadagi kimyoviy kuyishda teriga surtish uchun",
        "uz_cyr": "Биринчи даражали кимёвий куйишда терига суртиш учун",
        "ru": "Для смазывания кожи при химических ожогах первой степени, вызванных крепкой щелочью"
      },
      {
        "uz_lat": "Yara atrofidagi terini ishlov berish uchun",
        "uz_cyr": "Яра атрофидаги терини ишлов бериш учун",
        "ru": "Для обработки кожи вокруг раны"
      }
    ]
  },
  {
    "id": "t_58_q_5",
    "correct": 1,
    "text": {
      "uz_lat": "Qaysi hollarda yo'lning harakatlanish bo'lagini ajratuvchi uzuq-uzuq chiziqni bosib o'tish mumkin?",
      "uz_cyr": "Қайси ҳолларда йўлнинг ҳаракатланиш бўлагини ажратувчи узуқ-узуқ чизиқни босиб ўтиш мумкин?",
      "ru": "В каких случаях Вы можете наезжать на прерывистые линии разметки, разделяющие проезжую часть на полосы движения?"
    },
    "options": [
      {
        "uz_lat": "Yo'lda boshqa transport vositalari bo'lmasa",
        "uz_cyr": "Йўлда бошқа транспорт воситалари бўлмаса",
        "ru": "Только если на дороге нет других транспортных средств"
      },
      {
        "uz_lat": "Faqat qayta tizilishda",
        "uz_cyr": "Фақат қайта тизилишда",
        "ru": "Только при перестроении"
      },
      {
        "uz_lat": "Barcha sanab o'tilgan hollarda",
        "uz_cyr": "Барча санаб ўтилган ҳолларда",
        "ru": "Во всех перечисленных случаях"
      }
    ]
  },
  {
    "id": "t_63_q_17",
    "correct": 0,
    "text": {
      "uz_lat": "Svetoforlarda qanday rangli ishoralar qo'llaniladi?",
      "uz_cyr": "Светофорларда қандай рангли ишоралар қўлланилади?",
      "ru": "Какие цветовые сигналы применяются в светофорах?"
    },
    "options": [
      {
        "uz_lat": "Yashil, sariq, qizil va oq",
        "uz_cyr": "Яшил, сариқ, қизил ва оқ",
        "ru": "Зелёный, жёлтый, красный и белый"
      },
      {
        "uz_lat": "Yashil, sariq, qizil va qora",
        "uz_cyr": "Яшил, сариқ, қизил ва қора",
        "ru": "Зелёный, жёлтый, красный и чёрный"
      },
      {
        "uz_lat": "Yashil, sariq, qizil",
        "uz_cyr": "Яшил, сариқ, қизил",
        "ru": "Зелёный, жёлтый, красный"
      }
    ]
  },
  {
    "id": "t_1_q_16",
    "correct": 0,
    "text": {
      "uz_lat": "Doimiy va vaqtinchalik yo'l belgilari ma'nosi jihatidan bir-birini inkor etganda qaysi biriga amal qilasiz?",
      "uz_cyr": "Доимий ва вақтинчалик йўл белгилари маъно жиҳатидан бир-бирини инкор этганда қайси бирига амал қиласиз?",
      "ru": "Если постоянные и временные дорожные знаки противоречат друг другу по смыслу, какому из них вы должны следовать?"
    },
    "options": [
      {
        "uz_lat": "Vaqtinchalik yo'l belgisiga",
        "uz_cyr": "Вақтинчалик йўл белгисига",
        "ru": "Временному дорожному знаку"
      },
      {
        "uz_lat": "Doimiy yo'l belgisiga",
        "uz_cyr": "Доимий йўл белгисига",
        "ru": "Постоянному дорожному знаку"
      }
    ]
  },
  {
    "id": "t_2_q_7",
    "correct": 0,
    "text": {
      "uz_lat": "Qaysi holatda egri yo'lda harakatlanayotgan avtomobil turg'unligi ta'minlangan?",
      "uz_cyr": "Қайси ҳолатда эгри йўлда ҳаракатланаётган автомобил турғунлиги таъминланган?",
      "ru": "При движении по кривой дороге автомобиль более устойчив, если движение осуществляется:"
    },
    "options": [
      {
        "uz_lat": "Uzatma ulangan holatda",
        "uz_cyr": "Узатма уланган ҳолатда",
        "ru": "С включенной передачей"
      },
      {
        "uz_lat": "Tezlik oshirilganda",
        "uz_cyr": "Тезлик оширилганда",
        "ru": "С увеличением скорости"
      },
      {
        "uz_lat": "Uzatma ajratilgan holatda",
        "uz_cyr": "Узатма ажратилган ҳолатда",
        "ru": "С выключенной передачей"
      }
    ]
  },
  {
    "id": "t_4_q_9",
    "correct": 0,
    "text": {
      "uz_lat": "Qaysi javobda yo'lovchilar uchun chiqish va tushish maydonchasi bo'lmagan sharoitdagi joylar to'liq ko'rsatilgan?",
      "uz_cyr": "Қайси жавобда йўловчилар учун чиқиш ва тушиш майдончаси бўлмаган шароитдаги жойлар тўлиқ кўрсатилган?",
      "ru": "В каком ответе наиболее полно указаны места, посадки и высадки пассажиров при отсутствии посадочной площадки?"
    },
    "options": [
      {
        "uz_lat": "Trotuarda yoki yo'l yoqasi tomonidan",
        "uz_cyr": "Тротуарда ёки йўл ёқаси томонидан",
        "ru": "Со стороны тротуара или обочины"
      },
      {
        "uz_lat": "Yo'l yoqasida yoki qatnov qismi tomonidan",
        "uz_cyr": "Йўл ёқасида ёки қатнов қисми томонидан",
        "ru": "На обочине или на проезжей части"
      },
      {
        "uz_lat": "Qatnov qismi yoki trotuar tomonidan",
        "uz_cyr": "Қатнов қисми ёки тротуар томонидан",
        "ru": "На проезжей части или тротуаре"
      },
      {
        "uz_lat": "Trotuar tomonidan",
        "uz_cyr": "Тротуар томонидан",
        "ru": "На тротуаре"
      }
    ]
  },
  {
    "id": "t_5_q_14",
    "correct": 1,
    "text": {
      "uz_lat": "Yo'l harakati qoidalari nechta bob va banddan iborat?",
      "uz_cyr": "Йўл ҳаракати қоидалари нечта боб ва банддан иборат?",
      "ru": "Из скольких глав и пунктов состоят Правила дорожного движения?"
    },
    "options": [
      {
        "uz_lat": "37 bob 286 band",
        "uz_cyr": "37 боб 286 банд",
        "ru": "Глава 37 - параграф 286"
      },
      {
        "uz_lat": "29 bob 186 band",
        "uz_cyr": "29 боб 186 банд",
        "ru": "Глава 29 - параграф 186"
      },
      {
        "uz_lat": "50 bob 300 band",
        "uz_cyr": "50 боб 300 банд",
        "ru": "Глава 50 - параграф 300"
      }
    ]
  },
  {
    "id": "t_7_q_5",
    "correct": 2,
    "text": {
      "uz_lat": "Ogohlantirish ishorasini berish haydovchiga birinchi harakatlanish huquqini beradimi?",
      "uz_cyr": "Огоҳлантириш ишорасини бериш ҳайдовчига биринчи ҳаракатланиш хуқуқини берадими?",
      "ru": "Дает ли водителю преимущественное право проезда подача предупредительного сигнала?"
    },
    "options": [
      {
        "uz_lat": "Hamma hollarda beradi",
        "uz_cyr": "Ҳамма ҳолларда беради",
        "ru": "Дает при начале маневра"
      },
      {
        "uz_lat": "Manevrni tugatish vaqtida beradi",
        "uz_cyr": "Манёврни тугатиш вақтида беради",
        "ru": "Дает при завершении маневра"
      },
      {
        "uz_lat": "Bermaydi",
        "uz_cyr": "Бермайди",
        "ru": "Не дает"
      },
      {
        "uz_lat": "Manevrni boshlash vaqtida beradi",
        "uz_cyr": "Манёврни бошлаш вақтида беради",
        "ru": "Дает во всех случаях"
      }
    ]
  },
  {
    "id": "t_8_q_18",
    "correct": 0,
    "text": {
      "uz_lat": "Yo'l harakati qoidalariga ko'ra yo'l belgilari nechta guruhga bo'linadi",
      "uz_cyr": "Йўл ҳаракати қоидаларига кўра йўл белгилари нечта гуруҳга бўлинади",
      "ru": "По правилам дорожного движения дорожные знаки делятся на сколько групп?"
    },
    "options": [
      {
        "uz_lat": "7",
        "uz_cyr": "7",
        "ru": "7"
      },
      {
        "uz_lat": "5",
        "uz_cyr": "5",
        "ru": "5"
      },
      {
        "uz_lat": "6",
        "uz_cyr": "6",
        "ru": "6"
      }
    ]
  },
  {
    "id": "t_9_q_10",
    "correct": 0,
    "text": {
      "uz_lat": "Nosoz transport vositasini shatakka olgan yengil avtomobil salonida odam tashishga ruxsat etiladimi?",
      "uz_cyr": "Носоз транспот воситасини шатакка олган енгил автомобил салонида одам ташишга рухсат этиладими?",
      "ru": "Разрешена ли Вам перевозка людей в салоне легкового автомобиля, буксирующего неисправное транспортное средство?"
    },
    "options": [
      {
        "uz_lat": "Ruxsat etiladi",
        "uz_cyr": "Рухсат этилади",
        "ru": "Разрешена"
      },
      {
        "uz_lat": "Taqiqlanadi",
        "uz_cyr": "Тақиқланади",
        "ru": "Запрещена"
      }
    ]
  },
  {
    "id": "t_10_q_7",
    "correct": 2,
    "text": {
      "uz_lat": "Piyodalar turar joy dahasida qayerda harakatlanishlari mumkin?",
      "uz_cyr": "Пиёдалар турар жой даҳасида қаерда ҳаракатланишлари мумкин?",
      "ru": "Где могут двигаться пешеходы в жилой зоне?"
    },
    "options": [
      {
        "uz_lat": "Faqat qatnov qismidan",
        "uz_cyr": "Фақат қатнов қисмидан",
        "ru": "По тротуарам и в один ряд по краю проезжей части"
      },
      {
        "uz_lat": "Faqat trotuarda",
        "uz_cyr": "Фақат тротуарда",
        "ru": "Только по тротуарам"
      },
      {
        "uz_lat": "Tratuarda, hamda qatnov qismida",
        "uz_cyr": "Тратуарда, ҳамда қатнов қисмида",
        "ru": "По тротуарам и по проезжей части"
      }
    ]
  },
  {
    "id": "t_12_q_3",
    "correct": 0,
    "text": {
      "uz_lat": "Qattiq ulagichda shatakka olingan avtobusda yoki trolleybusda odam tashishga ruxsat etiladimi?",
      "uz_cyr": "Қаттиқ улагичда шатакка олинган автобусда ёки троллейбусда одам ташишга рухсат этиладими?",
      "ru": "Разрешается ли перевозить людей в автобусе или троллейбусе, при буксировке на жёсткой сцепке?"
    },
    "options": [
      {
        "uz_lat": "Taqiqlanadi",
        "uz_cyr": "Тақиқланади",
        "ru": "Запрещено"
      },
      {
        "uz_lat": "Ruxsat etiladi",
        "uz_cyr": "Рухсат этилади",
        "ru": "Разрешено"
      }
    ]
  },
  {
    "id": "t_14_q_18",
    "correct": 2,
    "text": {
      "uz_lat": "Qishda boldirga qon to'xtatadigan jgutni qancha muddatga qo'yish mumkin?",
      "uz_cyr": "Қишда болдирга қон тўхтатадиган жгутни қанча муддатга қўйиш мумкин?",
      "ru": "На какой срок может быть наложен кровоостанавливающий жгут на голень зимой?"
    },
    "options": [
      {
        "uz_lat": "2 soatdan ko'p bo'lmagan",
        "uz_cyr": "2 соатдан кўп бўлмаган",
        "ru": "Не более чем на 2 часа"
      },
      {
        "uz_lat": "3 soatdan ko'p bo'lmagan",
        "uz_cyr": "3 соатдан кўп бўлмаган",
        "ru": "Не более чем на 3 часа"
      },
      {
        "uz_lat": "1 soatdan ko'p bo'lmagan",
        "uz_cyr": "1 соатдан кўп бўлмаган",
        "ru": "Не более чем на 1 час"
      }
    ]
  },
  {
    "id": "t_16_q_2",
    "correct": 2,
    "text": {
      "uz_lat": "72 km/soat tezlikda harakatlanayotgan transport vositasi 1 sekundda qancha masofani bosib o'tadi?",
      "uz_cyr": "72 км/соат тезликда ҳаракатланаётган транспорт воситаси 1 секундда қанча масофани босиб ўтади?",
      "ru": "Какое расстояние проедет транспортное средство за одну секунду при скорости движения 72 км/ч?"
    },
    "options": [
      {
        "uz_lat": "15 m",
        "uz_cyr": "15 м",
        "ru": "15 м"
      },
      {
        "uz_lat": "25 m",
        "uz_cyr": "25 м",
        "ru": "25 м"
      },
      {
        "uz_lat": "20 m",
        "uz_cyr": "20 м",
        "ru": "20 м"
      }
    ]
  },
  {
    "id": "t_18_q_4",
    "correct": 0,
    "text": {
      "uz_lat": "Velosipeddan foydalanishda yo'lovchi tashish qaysi hollarda ruxsat etiladi?",
      "uz_cyr": "Велосипеддан фойдаланишда йўловчи ташиш қайси ҳолларда рухсат этилади?",
      "ru": "В каких случаях разрешается перевозка пассажира на велосипеде?"
    },
    "options": [
      {
        "uz_lat": "Faqat 7 yoshgacha bo'lgan bolalarni maxsus o'rindiqda tashish mumkin",
        "uz_cyr": "Фақат 7 ёшгача бўлган болаларни махсус ўриндиқда ташиш мумкин",
        "ru": "Только детей до 7 лет можно перевозить в специальном сиденье"
      },
      {
        "uz_lat": "Har qanday yo'lovchini tashish mumkin",
        "uz_cyr": "Ҳар қандай йўловчини ташиш мумкин",
        "ru": "Разрешается только для взрослых"
      },
      {
        "uz_lat": "Faqat kattalar uchun ruxsat etiladi",
        "uz_cyr": "Фақат катталар учун рухсат этилади",
        "ru": "Никогда не разрешается"
      },
      {
        "uz_lat": "Hech qachon ruxsat etilmaydi",
        "uz_cyr": "Ҳеч қачон рухсат этилмайди",
        "ru": "Можно перевозить любого пассажира"
      }
    ]
  },
  {
    "id": "t_21_q_11",
    "correct": 2,
    "text": {
      "uz_lat": "Qon oqishini to'xtatuvchi jgut qo'l-oyoqlarga qanday bog'lanadi?",
      "uz_cyr": "Қон оқишини тўхтатувчи жгут қўл-оёқларга қандай боғланади?",
      "ru": "Как правильно выбрать место наложения кровоостанавливающего жгута на конечности?"
    },
    "options": [
      {
        "uz_lat": "Yaradan 10-15 sm pastga",
        "uz_cyr": "Ярадан 10-15 см пастга",
        "ru": "Ниже раны на 10 - 15 см"
      },
      {
        "uz_lat": "Bevosita yaraning o'ziga",
        "uz_cyr": "Бевосита яранинг ўзига",
        "ru": "Непосредственно на рану"
      },
      {
        "uz_lat": "Yaradan 10-15 sm yuqoriga",
        "uz_cyr": "Ярадан 10-15 см юқорига",
        "ru": "Выше раны на 10 - 15 см"
      }
    ]
  },
  {
    "id": "t_23_q_11",
    "correct": 0,
    "text": {
      "uz_lat": "Avtomobilning qaysi g'ildiragi «sirpanib» tormozlanishga ko'proq moyil?",
      "uz_cyr": "Автомобилнинг қайси ғилдираги «сирпаниб» тормозланишга кўпроқ мойил?",
      "ru": "Какие колеса автомобиля более подвержены торможению «со скольжением»?"
    },
    "options": [
      {
        "uz_lat": "Orqa g'ildiraklar",
        "uz_cyr": "Орқа ғилдираклар",
        "ru": "Задние колеса"
      },
      {
        "uz_lat": "Oldingi g'ildiraklar",
        "uz_cyr": "Олдинги ғилдираклар",
        "ru": "Передние колеса"
      }
    ]
  },
  {
    "id": "t_24_q_5",
    "correct": 2,
    "text": {
      "uz_lat": "Bir yo'nalishda harakatlanayotgan (burilishga kirishmagan) relssiz transport vositasidan o'zib ketishga ruxsat beriladi:",
      "uz_cyr": "Бир йўналишда ҳаракатланаётган (бурилишга киришмаган) релссиз транспорт воситасидан ўзиб кетишга рухсат берилади:",
      "ru": "Разрешается опережение безрельсового транспортного средства, движущегося в одном направлении (не начавшего поворот):"
    },
    "options": [
      {
        "uz_lat": "Faqat chap tomondan",
        "uz_cyr": "Фақат чап томондан",
        "ru": "Только слева"
      },
      {
        "uz_lat": "Faqat o'ng tomondan",
        "uz_cyr": "Фақат ўнг томондан",
        "ru": "Только справа"
      },
      {
        "uz_lat": "Har ikki tomondan",
        "uz_cyr": "Ҳар икки томондан",
        "ru": "С обеих сторон"
      }
    ]
  },
  {
    "id": "t_27_q_7",
    "correct": 0,
    "text": {
      "uz_lat": "N2, N3; O3; O4; M2; M3 toifadagi avtotransport vositalarining orqa devoriga yozilishi kerak?",
      "uz_cyr": "N2, N3; О3; О4; М2; М3 тоифадаги автотранспорт воситаларининг орқа деворига ёзилиши керак?",
      "ru": "На задней стенке кузова автотранспортных средств категорий N2, N3, O3, O4, M2, M3 (кроме особо малых) должен быть нанесен:"
    },
    "options": [
      {
        "uz_lat": "Yaxshi ko'rinadigan raqam belgisi",
        "uz_cyr": "Яхши кўринадиган рақам белгиси",
        "ru": "Хорошо видимый номерной знак"
      },
      {
        "uz_lat": "Transport vositasining tegishligi haqida taniqlik belgisi",
        "uz_cyr": "Транспорт воситасининг тегишлиги ҳақида таниқлик белгиси",
        "ru": "Опознавательный знак о принадлежности транспортного средства"
      },
      {
        "uz_lat": "Taniqlik va raqam belgilari",
        "uz_cyr": "Таниқлик ва рақам белгилари",
        "ru": "Опознавательный и номерной знаки"
      }
    ]
  }
];
