// ============================================================================
// questionState.ts — foydalanuvchining savol bo'yicha holati
// ----------------------------------------------------------------------------
// Ikkita funksiyani ta'minlaydi: "Saqlangan savollar" va "Xatolarim".
// Kalit — savolning barqaror `global_id` si (masalan `t_19_q_3`).
//
// Barcha yozish amallari SECURITY DEFINER RPC orqali ketadi: ular ichida
// `auth.uid()` tekshiriladi, ya'ni foydalanuvchi boshqa birovning qatorini
// o'zgartira olmaydi. O'qish esa RLS bilan himoyalangan.
//
// MUHIM: bu yerdagi hech bir xato foydalanuvchi oqimini TO'XTATMASLIGI kerak.
// Statistika yozilmasa ham test yakunlanishi va natija saqlanishi shart,
// shuning uchun xatolar yutiladi va faqat dev rejimda konsolga chiqadi.
// ============================================================================

import { supabase } from '@/integrations/supabase/client';

/** Bitta testdagi bitta javob. */
export interface AnswerRecord {
  globalId: string;
  isCorrect: boolean;
}

/** Bir testda 100 tadan ortiq savol bo'lmaydi (RPC ham shuni tekshiradi). */
const MAX_ANSWERS = 100;

function logDev(message: string, err: unknown): void {
  if (!import.meta.env.PROD) console.error(message, err);
}

/**
 * Test yakunida barcha javoblarni BIR chaqiruvda yozadi.
 *
 * `globalId` si yo'q savollar (eski formatdagi fayllar) tashlab ketiladi —
 * ularni identifikatsiya qilib bo'lmaydi.
 *
 * @returns yozilgan qatorlar soni, xato bo'lsa 0
 */
export async function recordQuestionAnswers(answers: readonly AnswerRecord[]): Promise<number> {
  const payload = answers
    .filter((a) => typeof a.globalId === 'string' && a.globalId.length > 0)
    .slice(0, MAX_ANSWERS)
    .map((a) => ({ global_id: a.globalId, is_correct: a.isCorrect }));

  if (payload.length === 0) return 0;

  try {
    const { data, error } = await supabase.rpc('record_question_answers', {
      p_answers: payload,
    });
    if (error) {
      logDev('recordQuestionAnswers RPC error:', error);
      return 0;
    }
    return typeof data === 'number' ? data : 0;
  } catch (err) {
    logDev('recordQuestionAnswers failed:', err);
    return 0;
  }
}

/**
 * Savolni saqlaydi yoki saqlanganini bekor qiladi.
 * @returns yangi holat (true = saqlangan), xato bo'lsa null
 */
export async function toggleSavedQuestion(globalId: string): Promise<boolean | null> {
  if (!globalId) return null;
  try {
    const { data, error } = await supabase.rpc('toggle_saved_question', {
      p_global_id: globalId,
    });
    if (error) {
      logDev('toggleSavedQuestion RPC error:', error);
      return null;
    }
    if (typeof data !== 'boolean') return null;
    // Mahalliy to'plamni darhol moslashtiramiz — boshqa tugmalar ham
    // to'g'ri holatni ko'rsin (masalan /saqlangan sahifasidagi ro'yxat).
    setSavedLocal(globalId, data);
    return data;
  } catch (err) {
    logDev('toggleSavedQuestion failed:', err);
    return null;
  }
}

/** Saqlangan savollarning `global_id` ro'yxati (eng yangisi birinchi). */
export async function fetchSavedQuestionIds(limit = 200): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('user_question_state')
      .select('global_id')
      .eq('saved', true)
      .order('last_seen_at', { ascending: false })
      .limit(limit);
    if (error) {
      logDev('fetchSavedQuestionIds error:', error);
      return [];
    }
    return (data ?? []).map((r) => r.global_id);
  } catch (err) {
    logDev('fetchSavedQuestionIds failed:', err);
    return [];
  }
}

/** Xato javob berilgan savollar — eng ko'p xato qilinganidan boshlab. */
export async function fetchWrongQuestionIds(limit = 200): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('user_question_state')
      .select('global_id, wrong_count')
      .gt('wrong_count', 0)
      .order('wrong_count', { ascending: false })
      .order('last_seen_at', { ascending: false })
      .limit(limit);
    if (error) {
      logDev('fetchWrongQuestionIds error:', error);
      return [];
    }
    return (data ?? []).map((r) => r.global_id);
  } catch (err) {
    logDev('fetchWrongQuestionIds failed:', err);
    return [];
  }
}


/**
 * Xato belgilarini tozalaydi — bitta savolniki yoki hammasini.
 *
 * `wrong_count` NOLGA tushiriladi, qator O'CHIRILMAYDI: o'sha qatorda
 * `saved` bayrog'i va `correct_count` ham turadi, qatorni o'chirish
 * saqlangan savolni ham yo'q qilib yuborardi.
 *
 * RLS faqat o'z qatorlariga ruxsat bergani uchun `user_id` bo'yicha
 * qo'shimcha filtr shart emas — server baribir boshqasini ko'rsatmaydi.
 * Ammo `.gt('wrong_count', 0)` qo'yilgan: tegishsiz qatorlarni bekorga
 * yangilamaslik uchun.
 *
 * @param globalId bitta savol, savollar RO'YXATI yoki berilmasa BARCHASI
 * @returns muvaffaqiyatli bo'ldimi
 */
export async function clearWrongQuestions(
  globalId?: string | string[],
): Promise<boolean> {
  try {
    let q = supabase
      .from('user_question_state')
      .update({ wrong_count: 0 })
      .gt('wrong_count', 0);

    /*
      Ro'yxat ham qabul qilinadi: "Xatolar ustida ishlash" testidan keyin
      to'g'ri yechilgan savollar BITTA so'rov bilan tozalanadi. Har biriga
      alohida so'rov yuborish 20 tagacha chaqiruv demak bo'lardi.
    */
    if (Array.isArray(globalId)) {
      if (globalId.length === 0) return true;
      q = q.in('global_id', globalId);
    } else if (globalId) {
      q = q.eq('global_id', globalId);
    }

    const { error } = await q;
    if (error) {
      logDev('clearWrongQuestions error:', error);
      return false;
    }
    return true;
  } catch (err) {
    logDev('clearWrongQuestions failed:', err);
    return false;
  }
}

/**
 * "Xatolarim" va "Saqlangan" bo'limlari uchun sonlar.
 *
 * `head: true` bilan qatorlarning O'ZI olinmaydi — faqat son qaytadi.
 * Bu /bolimlar sahifasida 200 ta qatorni behuda yuklamaslik uchun muhim.
 */
export async function fetchSectionCounts(): Promise<{ wrong: number; saved: number }> {
  const empty = { wrong: 0, saved: 0 };
  try {
    const [wrongRes, savedRes] = await Promise.all([
      supabase
        .from('user_question_state')
        .select('global_id', { count: 'exact', head: true })
        .gt('wrong_count', 0),
      supabase
        .from('user_question_state')
        .select('global_id', { count: 'exact', head: true })
        .eq('saved', true),
    ]);
    return {
      wrong: wrongRes.count ?? 0,
      saved: savedRes.count ?? 0,
    };
  } catch (err) {
    logDev('fetchSectionCounts failed:', err);
    return empty;
  }
}


// ---------------------------------------------------------------------------
// Saqlangan savollar to'plami — barcha "saqlash" tugmalari uchun umumiy holat
// ---------------------------------------------------------------------------
// NEGA KERAK:
//   Har bir tugma o'z `useState(false)` i bilan ishlaganda holat serverdan
//   HECH QACHON o'qilmasdi. Natijada foydalanuvchi saqlagan savoliga qaytsa,
//   tugma "saqlanmagan" ko'rinardi va yana bosilganda saqlangani O'CHIB
//   KETARDI (RPC toggle qiladi).
//
//   Endi ro'yxat sessiyada BIR MARTA yuklanadi va barcha tugmalar shundan
//   o'qiydi — ham to'g'ri, ham tarmoqqa ortiqcha so'rov yo'q.

let savedSet: Set<string> | null = null;
let savedLoading: Promise<Set<string>> | null = null;
const savedListeners = new Set<() => void>();

function notifySaved(): void {
  for (const listener of savedListeners) listener();
}

/** Foydalanuvchi almashganda (kirish/chiqish) keshni tozalash SHART. */
export function resetSavedCache(): void {
  savedSet = null;
  savedLoading = null;
  notifySaved();
}

/** Ro'yxatni bir marta yuklaydi. Takroriy chaqiruvlar bitta so'rovni kutadi. */
export function ensureSavedSet(): Promise<Set<string>> {
  if (savedSet) return Promise.resolve(savedSet);
  if (!savedLoading) {
    savedLoading = fetchSavedQuestionIds().then((ids) => {
      savedSet = new Set(ids);
      notifySaved();
      return savedSet;
    }).catch(() => {
      // Xatoda keshni band qilib qo'ymaymiz — keyingi urinish qayta so'raydi
      savedLoading = null;
      return new Set<string>();
    });
  }
  return savedLoading;
}

/** Sinxron tekshiruv — ro'yxat hali yuklanmagan bo'lsa `false`. */
export function isSavedLocal(globalId: string): boolean {
  return savedSet?.has(globalId) ?? false;
}

export function subscribeSaved(listener: () => void): () => void {
  savedListeners.add(listener);
  return () => savedListeners.delete(listener);
}

/** Mahalliy to'plamni yangilaydi (server javobidan keyin chaqiriladi). */
function setSavedLocal(globalId: string, value: boolean): void {
  if (!savedSet) savedSet = new Set<string>();
  if (value) savedSet.add(globalId);
  else savedSet.delete(globalId);
  notifySaved();
}
