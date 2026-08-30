// ============================================================================
// freeQuestions — bepul tarifga kiradigan savollarning `global_id` ro'yxati
// ----------------------------------------------------------------------------
// Qidiruvda barcha 1250 savol ko'rsatiladi, lekin bepul foydalanuvchi uchun
// PRO savollari qulflanadi. Qaysi savol bepul ekanini shu ro'yxat aytadi.
//
// Manba: `scripts/question-tools/free-tier-question-ids.json` — u
// `public/data/free-question-ids.json` ga nusxalanadi (prebuild).
// Fayl ~11 KB va CDN da uzoq keshlanadi.
// ============================================================================

import { fetchQuestionJson } from "@/lib/fetchQuestionJson";

let cached: Promise<Set<string>> | null = null;

/**
 * Ro'yxatni bir marta yuklaydi.
 *
 * Xatoda BO'SH to'plam emas, `null` bilan bir xil ma'noli natija qaytadi:
 * chaqiruvchi kod bo'sh to'plamni "hech narsa bepul emas" deb tushunmasligi
 * uchun, xato holatida cheklov UMUMAN qo'llanmaydi (`isLocked` false qaytaradi).
 */
export function loadFreeQuestionIds(): Promise<Set<string>> {
  if (!cached) {
    cached = fetchQuestionJson("/data/free-question-ids.json")
      .then((raw) => {
        const list = Array.isArray(raw) ? raw : [];
        return new Set(list.filter((x): x is string => typeof x === "string"));
      })
      .catch((err) => {
        // Keshni band qilib qo'ymaymiz — keyingi urinish qayta so'raydi
        cached = null;
        if (!import.meta.env.PROD) console.error("loadFreeQuestionIds failed:", err);
        return new Set<string>();
      });
  }
  return cached;
}
