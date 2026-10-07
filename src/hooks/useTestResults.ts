import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect, useCallback } from 'react';
import { clampTestTimeSeconds } from '@/lib/testPersistence';
import { SAVE_RESULT_TIMEOUT_MS, withTimeout } from '@/lib/withTimeout';

interface VariantResult {
  variant: number;
  bestScore: number;
  totalQuestions: number;
}

export const useTestResults = () => {
  const { user } = useAuth();
  const [variantResults, setVariantResults] = useState<Record<number, VariantResult>>({});
  const [loading, setLoading] = useState(true);

  const fetchVariantResults = useCallback(async (signal?: AbortSignal) => {
    if (!user) return;

    try {
      /*
        Barcha urinishlar sahifalab o'qiladi. Ilgari `.limit(100)` edi: 100 tadan
        ko'p urinishi bor foydalanuvchida eng yuqori ball bo'yicha faqat 100 qator
        olinib, qolgan variantlar "yechilmagan" bo'lib ko'rinardi (natija bazada
        bor, lekin ekranda yo'q).
      */
      const PAGE = 1000;
      const data: { variant: number; correct_answers: number; total_questions: number }[] = [];
      for (let from = 0; ; from += PAGE) {
        let query = supabase
          .from('test_results')
          .select('variant, correct_answers, total_questions')
          .eq('user_id', user.id)
          .order('completed_at', { ascending: false })
          .order('id', { ascending: false })
          .range(from, from + PAGE - 1);
        if (signal) query = query.abortSignal(signal);
        const { data: page, error } = await query;
        if (error) throw error;
        if (signal?.aborted) return;
        data.push(...(page ?? []));
        if (!page || page.length < PAGE) break;
      }

      const results: Record<number, VariantResult> = {};
      data.forEach((result) => {
        // Foiz bo'yicha: eski formatdagi (62 savollik) qatorlar shu variant raqamida bor,
        // xom ball bo'yicha solishtirilsa 19/62 qatori 19/20 ni almashtirib qo'yishi mumkin.
        const prev = results[result.variant];
        if (
          !prev ||
          prev.bestScore / prev.totalQuestions < result.correct_answers / result.total_questions
        ) {
          results[result.variant] = {
            variant:        result.variant,
            bestScore:      result.correct_answers,
            totalQuestions: result.total_questions,
          };
        }
      });
      setVariantResults(results);
    } catch (err) {
      if ((err as { name?: string })?.name === 'AbortError') return;
      if (!import.meta.env.PROD) console.error('Error fetching variant results:', err);
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!user) {
      setVariantResults({});
      setLoading(false);
      return;
    }
    // Abort on user switch so stale results never apply to the wrong account
    const controller = new AbortController();
    fetchVariantResults(controller.signal);
    return () => controller.abort();
  }, [user, fetchVariantResults]);

  /**
   * Save test result via the verify_and_save_test_result RPC.
   * The server validates the session (ownership, completion, premium expiry)
   * and inserts the row itself — auth.uid() is enforced server-side.
   */
  const saveTestResult = async (
    variant: number,
    correctAnswers: number,
    totalQuestions: number,
    timeTakenSeconds: number,
    sessionId: string | null = null,
    _isPremiumSession: boolean = false
  ): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'User not authenticated' };

    // ── Client-side validation (mirrors DB constraints) ────────────────────
    if (!Number.isInteger(variant) || variant < 1 || variant > 100) {
      if (!import.meta.env.PROD) console.error('Invalid variant:', variant);
      return { success: false, error: 'Invalid variant' };
    }
    if (
      !Number.isInteger(totalQuestions) ||
      totalQuestions < 1 ||
      totalQuestions > 2000
    ) {
      if (!import.meta.env.PROD) console.error('Invalid total_questions:', totalQuestions);
      return { success: false, error: 'Invalid total' };
    }
    if (
      !Number.isInteger(correctAnswers) ||
      correctAnswers < 0 ||
      correctAnswers > totalQuestions
    ) {
      if (!import.meta.env.PROD) console.error('Invalid correct_answers:', correctAnswers);
      return { success: false, error: 'Invalid score' };
    }
    // Never store more than 60:59 (stale startedAt / abandoned tabs)
    const clampedTime = clampTestTimeSeconds(timeTakenSeconds ?? 0);

    try {
      const { data, error } = await withTimeout(
        supabase.rpc('verify_and_save_test_result', {
          p_session_id:         sessionId,
          p_variant:            variant,
          p_correct_answers:    correctAnswers,
          p_total_questions:    totalQuestions,
          p_time_taken_seconds: clampedTime,
        }),
        SAVE_RESULT_TIMEOUT_MS,
      );

      if (error) {
        if (!import.meta.env.PROD) console.error('Save RPC error:', error);
        return { success: false, error: error.message };
      }

      const result = data as unknown as { ok: boolean; error?: string };
      if (!result?.ok) {
        if (!import.meta.env.PROD) console.error('Save rejected:', result?.error);
        return { success: false, error: result?.error ?? 'save_failed' };
      }

      await fetchVariantResults();
      return { success: true };
    } catch (err) {
      if (!import.meta.env.PROD) console.error('Save test result error:', err);
      return { success: false, error: 'Failed to save result' };
    }
  };

  const getVariantStatus = (variant: number) => {
    const result = variantResults[variant];
    if (!result) return 'default';
    return (result.bestScore / result.totalQuestions) * 100 >= 90 ? 'success' : 'failed';
  };

  return { saveTestResult, variantResults, getVariantStatus, loading };
};
