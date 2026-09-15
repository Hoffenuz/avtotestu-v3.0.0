/**
 * useReadiness — imtihonga tayyorgarlik ko'rsatkichi.
 *
 * Ma'lumot `get_user_readiness()` RPC dan keladi: u mavjud `test_results` va
 * `user_question_state` jadvallaridan hisoblanadi, ya'ni yangi jadval yoki
 * qo'shimcha yozuv KERAK EMAS.
 *
 * Koeffitsient to'rtta o'lchanadigan komponentdan yig'iladi (vazni bilan):
 *   aniqlik 40% · qamrov 25% · variantlar 20% · mustahkamlik 15%
 * O'lchab bo'lmaydigan komponent (masalan savol-holati umuman yo'q hisob)
 * tashlab ketiladi va uning vazni qolganlar orasida qayta taqsimlanadi.
 */
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { DB_READ_TIMEOUT_MS, withTimeout } from "@/lib/withTimeout";

export interface Readiness {
  readinessPercent: number;
  accuracyPercent: number;
  coveragePercent: number;
  variantsPercent: number;
  masteryPercent: number;

  testsTotal: number;
  testsToday: number;
  questionsSeen: number;
  questionsTotal: number;
  questionsMastered: number;
  questionsToReview: number;
  variantsPassed: number;
  variantsAttempted: number;
  variantsTotal: number;

  levelIndex: number;
  levelMinTests: number;
  levelNextTests: number | null;
  testsToNextLevel: number | null;

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
  tests_total: number;
  tests_today: number;
  questions_seen: number;
  questions_total: number;
  questions_mastered: number;
  questions_to_review: number;
  variants_passed: number;
  variants_attempted: number;
  variants_total: number;
  level_index: number;
  level_min_tests: number;
  level_next_tests: number | null;
  tests_to_next_level: number | null;
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
    testsTotal: row.tests_total,
    testsToday: row.tests_today,
    questionsSeen: row.questions_seen,
    questionsTotal: row.questions_total,
    questionsMastered: row.questions_mastered,
    questionsToReview: row.questions_to_review,
    variantsPassed: row.variants_passed,
    variantsAttempted: row.variants_attempted,
    variantsTotal: row.variants_total,
    levelIndex: row.level_index,
    levelMinTests: row.level_min_tests,
    levelNextTests: row.level_next_tests,
    testsToNextLevel: row.tests_to_next_level,
    examDate: row.exam_date,
    daysToExam: row.days_to_exam,
    streakDays: row.streak_days,
    hasData: row.has_data,
  };
}

export function useReadiness() {
  const { user } = useAuth();
  const [data, setData] = useState<Readiness | null>(null);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    if (!user) {
      setData(null);
      return;
    }
    setLoading(true);
    try {
      const { data: rows, error } = await withTimeout(
        // Generatsiya qilingan turlarda bu RPC hali yo'q — qo'lda turlangan.
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (supabase as any).rpc("get_user_readiness"),
        DB_READ_TIMEOUT_MS,
      );
      if (error) throw error;
      const row = Array.isArray(rows) ? rows[0] : rows;
      setData(row ? toReadiness(row as ReadinessRow) : null);
    } catch (err) {
      if (!import.meta.env.PROD) console.error("[useReadiness]", err);
      // Xatoda eski qiymat saqlanadi — karta birdan yo'qolib qolmaydi.
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    void load();
  }, [load]);

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
