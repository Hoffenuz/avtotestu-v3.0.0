/**
 * useReadiness — imtihonga tayyorgarlik ko'rsatkichi.
 *
 * Ma'lumot `get_user_readiness()` RPC dan keladi: u mavjud `test_results` va
 * `user_question_state` jadvallaridan hisoblanadi, ya'ni yangi jadval yoki
 * qo'shimcha yozuv KERAK EMAS.
 *
 * Koeffitsient to'rtta o'lchanadigan komponentdan yig'iladi (vazni bilan):
 *   variantlar 35% · testlar soni 25% · aniqlik 20% · qamrov 10% ·
 *   mustahkamlik 10%  — urg'u VARIANT va MASHQ HAJMIGA berilgan.
 * Natijaga yengil egri chiziq qo'llanadi (monoton) — tartib saqlanadi,
 * pastki qism biroz ko'tariladi. Daraja shu foizdan kelib chiqadi.
 * O'lchab bo'lmaydigan komponent (masalan savol-holati umuman yo'q hisob)
 * tashlab ketiladi va uning vazni qolganlar orasida qayta taqsimlanadi.
 */
import { useCallback, useEffect, useReducer } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { DB_READ_TIMEOUT_MS, withTimeout } from "@/lib/withTimeout";

export interface Readiness {
  readinessPercent: number;
  accuracyPercent: number;
  coveragePercent: number;
  variantsPercent: number;
  masteryPercent: number;
  testsPercent: number;

  testsTotal: number;
  testsToday: number;
  testsTarget: number;
  questionsSeen: number;
  questionsTotal: number;
  questionsMastered: number;
  questionsToReview: number;
  variantsPassed: number;
  variantsAttempted: number;
  variantsTotal: number;

  levelIndex: number;
  levelMinPercent: number;
  levelNextPercent: number | null;
  percentToNext: number | null;

  examDate: string | null;
  daysToExam: number | null;
  streakDays: number;
  hasData: boolean;
}

/** RPC xom javobi (snake_case) — generatsiya qilingan turlarda hali yo'q. */
interface ReadinessRow {
  readiness_percent: number;
  accuracy_percent: number;
  coverage_percent: number;
  variants_percent: number;
  mastery_percent: number;
  tests_percent: number;
  tests_total: number;
  tests_today: number;
  tests_target: number;
  questions_seen: number;
  questions_total: number;
  questions_mastered: number;
  questions_to_review: number;
  variants_passed: number;
  variants_attempted: number;
  variants_total: number;
  level_index: number;
  level_min_percent: number;
  level_next_percent: number | null;
  percent_to_next: number | null;
  exam_date: string | null;
  days_to_exam: number | null;
  streak_days: number;
  has_data: boolean;
}

function toReadiness(row: ReadinessRow): Readiness {
  return {
    readinessPercent: row.readiness_percent,
    accuracyPercent: row.accuracy_percent,
    coveragePercent: row.coverage_percent,
    variantsPercent: row.variants_percent,
    masteryPercent: row.mastery_percent,
    testsPercent: row.tests_percent,
    testsTotal: row.tests_total,
    testsToday: row.tests_today,
    testsTarget: row.tests_target,
    questionsSeen: row.questions_seen,
    questionsTotal: row.questions_total,
    questionsMastered: row.questions_mastered,
    questionsToReview: row.questions_to_review,
    variantsPassed: row.variants_passed,
    variantsAttempted: row.variants_attempted,
    variantsTotal: row.variants_total,
    levelIndex: row.level_index,
    levelMinPercent: row.level_min_percent,
    levelNextPercent: row.level_next_percent,
    percentToNext: row.percent_to_next,
    examDate: row.exam_date,
    daysToExam: row.days_to_exam,
    streakDays: row.streak_days,
    hasData: row.has_data,
  };
}

/**
 * UMUMIY HOLAT — bir sahifadagi barcha `useReadiness()` chaqiruvlari uchun bitta.
 *
 * Bosh sahifada tasma (`ReadinessStrip`) va karta (`ReadinessCard`) bir vaqtda
 * chiziladi. Ilgari har biri o'z `get_user_readiness` so'rovini yuborardi —
 * har tashrifda ikkita bir xil RPC. Endi bir vaqtdagi so'rovlar birlashtiriladi
 * va natija hammaga tarqatiladi.
 *
 * Eski natija saqlanadi va sahifaga qaytilganda DARHOL ko'rsatiladi, yangisi
 * fonda so'raladi (test ishlab qaytgan foydalanuvchi baribir yangi foizni
 * ko'radi). `loaded` — shu foydalanuvchi uchun kamida bir marta javob keldimi:
 * tasma shunga qarab skelet yoki haqiqiy ma'lumot chizadi.
 */
interface Snapshot {
  userId: string | null;
  data: Readiness | null;
  loaded: boolean;
}

let snapshot: Snapshot = { userId: null, data: null, loaded: false };
let inflight: { userId: string; promise: Promise<void> } | null = null;
/** Hozir ekrandagi foydalanuvchi — eskirgan javob boshqa hisobga yozilmasin. */
let activeUserId: string | null = null;
const listeners = new Set<() => void>();

function publish(next: Snapshot) {
  snapshot = next;
  listeners.forEach((notify) => notify());
}

/**
 * `fresh` — o'zgarishdan KEYIN (masalan imtihon sanasi saqlangach) chaqiriladi:
 * undan oldin boshlangan so'rov eski holatni qaytaradi, shuning uchun u
 * tugashini kutib, yangisi yuboriladi.
 */
function fetchReadiness(userId: string, fresh = false): Promise<void> {
  if (inflight?.userId === userId) {
    return fresh ? inflight.promise.then(() => fetchReadiness(userId)) : inflight.promise;
  }

  const promise = (async () => {
    try {
      const { data: rows, error } = await withTimeout<{ data: unknown; error: unknown }>(
        // Generatsiya qilingan turlarda bu RPC hali yo'q — qo'lda turlangan.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase as any).rpc("get_user_readiness"),
        DB_READ_TIMEOUT_MS,
      );
      if (error) throw error;
      if (activeUserId !== userId) return;
      const row = Array.isArray(rows) ? rows[0] : rows;
      publish({ userId, data: row ? toReadiness(row as ReadinessRow) : null, loaded: true });
    } catch (err) {
      if (!import.meta.env.PROD) console.error("[useReadiness]", err);
      if (activeUserId !== userId) return;
      // Xatoda eski qiymat saqlanadi — karta birdan yo'qolib qolmaydi.
      const keep = snapshot.userId === userId ? snapshot.data : null;
      publish({ userId, data: keep, loaded: true });
    } finally {
      if (inflight?.promise === promise) inflight = null;
    }
  })();

  inflight = { userId, promise };
  return promise;
}

export function useReadiness() {
  const { user } = useAuth();
  const userId = user?.id ?? null;
  const [, rerender] = useReducer((n: number) => n + 1, 0);

  useEffect(() => {
    listeners.add(rerender);
    return () => {
      listeners.delete(rerender);
    };
  }, []);

  useEffect(() => {
    activeUserId = userId;
    if (!userId) {
      if (snapshot.userId !== null) publish({ userId: null, data: null, loaded: false });
      return;
    }
    if (snapshot.userId !== userId) publish({ userId, data: null, loaded: false });
    void fetchReadiness(userId);
  }, [userId]);

  const mine = snapshot.userId === userId ? snapshot : null;
  const data = mine?.data ?? null;
  /** Shu foydalanuvchi uchun hali birinchi javob kelmagan. */
  const loading = !!userId && !mine?.loaded;

  const load = useCallback(async () => {
    if (!userId) return;
    await fetchReadiness(userId, true);
  }, [userId]);

  /**
   * Imtihon sanasini saqlash. `null` — sanani olib tashlash.
   * Hech qayerda MAJBURIY emas: foydalanuvchi xohlasa kiritadi.
   */
  const saveExamDate = useCallback(
    async (value: string | null): Promise<boolean> => {
      if (!user) return false;
      const { error } = await supabase
        .from("profiles")
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- `exam_date` hali generatsiya qilingan turlarda yo'q
        .update({ exam_date: value } as any)
        .eq("id", user.id);
      if (error) {
        if (!import.meta.env.PROD) console.error("[useReadiness] saveExamDate", error);
        return false;
      }
      await load();
      return true;
    },
    [user, load],
  );

  return { data, loading, refresh: load, saveExamDate };
}
