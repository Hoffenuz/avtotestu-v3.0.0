// ============================================================================
// questionCorpus — savolni `global_id` bo'yicha topish
// ----------------------------------------------------------------------------
// "Xatolarim" va "Saqlangan savollar" bazada faqat `global_id` ni saqlaydi
// (`t_19_q_3`). Savol matnini ko'rsatish uchun uni korpusdan topish kerak.
//
// NEGA ALOHIDA INDEKS FAYLI EMAS:
//   Ilova allaqachon `barcha-*.json` / `free-*.json` fayllarini yuklaydi va
//   ular Cloudflare da 24 soat keshlanadi (`public/_headers`). Yangi fayl
//   qo'shish o'rniga o'shani qayta ishlatamiz — foydalanuvchida u odatda
//   allaqachon keshda bo'ladi.
//
// PRO CHEGARASI:
//   Fayl tanlash TestIshlash sahifasidagi mantiq bilan BIR XIL: PRO ga
//   `barcha-*`, bepulga `free-*`. Bepul foydalanuvchining xato javoblari
//   ham bepul savollardan kelib chiqqan, shuning uchun `free-*` yetarli.
// ============================================================================

import { fetchQuestionJson, normalizeQuestionArray } from '@/lib/fetchQuestionJson';

/** Korpusdagi xom savol — `questionTransform` kutadigan shakl. */
export interface CorpusTask {
  task_info?: { global_id?: string };
  [key: string]: unknown;
}

interface LangFiles {
  free: string;
  pro: string;
}

/**
 * Til → fayl juftligi. TestIshlash.tsx dagi `languages` massivi bilan
 * bir xil bo'lishi SHART — ular ajralib ketsa, foydalanuvchi testda
 * ko'rgan savolni bu yerda topa olmay qoladi.
 */
const LANG_FILES: Record<string, LangFiles> = {
  'uz-lat': { free: 'free-uz-lat.json', pro: 'barcha-uz-lat.json' },
  uz: { free: 'free-uz-cyr.json', pro: 'barcha-uz-cyr.json' },
  ru: { free: 'free-ru.json', pro: 'barcha-ru.json' },
};

const FALLBACK: LangFiles = LANG_FILES['uz-lat'];

export function corpusFileFor(language: string, isPremium: boolean): string {
  const pair = LANG_FILES[language] ?? FALLBACK;
  return isPremium ? pair.pro : pair.free;
}

/**
 * Fayl nomi → indeks. Modul darajasida keshlanadi: bir sessiyada bir fayl
 * bir marta yuklanadi va qayta ishlanadi (1250 savol uchun ~2 MB parse).
 */
const indexCache = new Map<string, Promise<Map<string, CorpusTask>>>();

async function buildIndex(file: string): Promise<Map<string, CorpusTask>> {
  const raw = await fetchQuestionJson(`/${file}`);
  const list = normalizeQuestionArray(raw) as CorpusTask[];
  const map = new Map<string, CorpusTask>();
  for (const task of list) {
    const gid = task?.task_info?.global_id;
    if (typeof gid === 'string' && gid) map.set(gid, task);
  }
  return map;
}

/** Korpus indeksini qaytaradi (keshlangan). Xatoda bo'sh Map. */
export async function loadCorpusIndex(
  language: string,
  isPremium: boolean,
): Promise<Map<string, CorpusTask>> {
  const file = corpusFileFor(language, isPremium);
  let cached = indexCache.get(file);
  if (!cached) {
    cached = buildIndex(file).catch((err) => {
      // Muvaffaqiyatsiz urinish keshda qolib ketmasin — qayta urinib ko'rish mumkin
      indexCache.delete(file);
      if (!import.meta.env.PROD) console.error('loadCorpusIndex failed:', err);
      return new Map<string, CorpusTask>();
    });
    indexCache.set(file, cached);
  }
  return cached;
}

/**
 * `global_id` ro'yxatini korpusdagi savollarga aylantiradi.
 * Topilmagan id lar (masalan PRO savoli bepul faylda yo'q) TASHLAB KETILADI —
 * bo'sh joy ko'rsatgandan ko'ra ko'rsatmagan yaxshi.
 */
export async function resolveQuestions(
  globalIds: readonly string[],
  language: string,
  isPremium: boolean,
): Promise<CorpusTask[]> {
  if (globalIds.length === 0) return [];
  const index = await loadCorpusIndex(language, isPremium);
  const out: CorpusTask[] = [];
  for (const id of globalIds) {
    const task = index.get(id);
    if (task) out.push(task);
  }
  return out;
}
