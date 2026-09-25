/**
 * Bosh sahifadagi namunaviy savollar (hero kartasi).
 *
 * MANBA: bepul bazaning O'ZI — public/free-{uz-lat,uz-cyr,ru}.json,
 * `task_info.global_id` bo'yicha, matn o'zgartirilmagan. Tanlov mezoni: rasmsiz, qisqa, 3 variantli,
 * uchala tilda bor va to'g'ri javob hamma tilda bir xil (skript tekshirgan).
 * Savol bazada tuzatilsa — shu fayl ham yangilanadi (global_id orqali).
 *
 * Nega alohida fayl: bepul bazaning o'zi ~500 KB — bosh sahifaga uni
 * yuklash sahifani sekinlashtirardi; bu yerda atigi 5 ta savol.
 */
import type { ContentLangKey } from "@/lib/pickLangContent";

export interface HomeSampleQuestion {
  /** Bepul bazadagi `task_info.global_id`. */
  id: string;
  text: Record<ContentLangKey, string>;
  options: readonly Record<ContentLangKey, string>[];
  /** To'g'ri variant indeksi (`options` ichida). */
  correct: number;
}

export const HOME_SAMPLE_QUESTIONS: readonly HomeSampleQuestion[] = [
  {
    "id": "t_5_q_11",
    "correct": 1,
    "text": {
      "uz_lat": "Piyodalar o'tish joyiga qancha masofa yetmasdan to'xtash va to'xtab turishga ruxsat beriladi?",
      "uz_cyr": "Пиёдалар ўтиш жойига қанча масофа етмасдан тўхташ ва тўхтаб туришга рухсат берилади?",
      "ru": "Не ближе какого расстояния разрешается остановка и стоянка перед пешеходным переходом?"
    },
    "options": [
      {
        "uz_lat": "3 metr",
        "uz_cyr": "3 метр",
        "ru": "3 метров"
      },
      {
        "uz_lat": "10 metr",
        "uz_cyr": "10 метр",
        "ru": "10 метров"
      },
      {
        "uz_lat": "5 metr",
        "uz_cyr": "5 метр",
        "ru": "5 метров"
      }
    ]
  },
  {
    "id": "t_6_q_7",
    "correct": 1,
    "text": {
      "uz_lat": "Tezlik ortishi bilan haydovchining ko'rish maydoni qanday o'zgaradi?",
      "uz_cyr": "Тезлик ортиши билан ҳайдовчининг кўриш майдони қандай ўзгаради?",
      "ru": "Как изменяется поле зрения водителя с увеличением скорости движения?"
    },
    "options": [
      {
        "uz_lat": "O'zgarmaydi",
        "uz_cyr": "Ўзгармайди",
        "ru": "Расширяется"
      },
      {
        "uz_lat": "Torayadi",
        "uz_cyr": "Тораяди",
        "ru": "Сужается"
      },
      {
        "uz_lat": "Kengayadi",
        "uz_cyr": "Кенгаяди",
        "ru": "Не изменяется"
      }
    ]
  },
  {
    "id": "t_8_q_16",
    "correct": 2,
    "text": {
      "uz_lat": "108 km/s tezlikda harakatlanayotgan transport vositasi 1 sekundda qancha masofani bosib o'tadi?",
      "uz_cyr": "108 км/с тезликда ҳаракатланаётган транспорт воситаси 1 секундда қанча масофани босиб ўтади?",
      "ru": "Какое расстояние проедет транспортное средство за одну секунду при скорости движения 108 км/ч?"
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
        "uz_lat": "30 m",
        "uz_cyr": "30 м",
        "ru": "30 м"
      }
    ]
  },
  {
    "id": "t_11_q_11",
    "correct": 2,
    "text": {
      "uz_lat": "Velosipedchilarga trotuarda harakatlanishga ruxsat etiladimi?",
      "uz_cyr": "Велосипедчиларга тротуарда ҳаракатланишга рухсат этиладими?",
      "ru": "Разрешается ли велосипедистам ездить по тротуарам?"
    },
    "options": [
      {
        "uz_lat": "Piyodalar bo'lmaganda ruxsat etiladi",
        "uz_cyr": "Пиёдалар бўлмаганда рухсат этилади",
        "ru": "Разрешается при отсутствии пешеходов"
      },
      {
        "uz_lat": "Ruxsat etiladi",
        "uz_cyr": "Рухсат этилади",
        "ru": "Разрешается"
      },
      {
        "uz_lat": "Taqiqlanadi",
        "uz_cyr": "Тақиқланади",
        "ru": "Запрещается"
      }
    ]
  },
  {
    "id": "t_12_q_17",
    "correct": 0,
    "text": {
      "uz_lat": "Yengil avtomobilda tumanga qarshi faralarning nechtasini o'rnatishga ruxsat etiladi?",
      "uz_cyr": "Енгил автомобилда туманга қарши фараларнинг нечтасини ўрнатишга рухсат этилади?",
      "ru": "Какое количество противотуманных фар разрешается устанавливать на легковом автомобиле?"
    },
    "options": [
      {
        "uz_lat": "Ikkita",
        "uz_cyr": "Иккита",
        "ru": "Две"
      },
      {
        "uz_lat": "Haydovchining xohishiga ko'ra",
        "uz_cyr": "Ҳайдовчининг хоҳишига кўра",
        "ru": "По усмотрению водителя"
      },
      {
        "uz_lat": "To'rtta",
        "uz_cyr": "Тўртта",
        "ru": "Четыре"
      }
    ]
  }
];
