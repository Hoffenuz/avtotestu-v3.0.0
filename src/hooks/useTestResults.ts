import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect, useCallback } from 'react';

interface VariantResult {
  variant: number;
  bestScore: number;
  totalQuestions: number;
}

export const useTestResults = () => {
  const { user } = useAuth();
  const [variantResults, setVariantResults] = useState<Record<number, VariantResult>>({});
  const [loading, setLoading] = useState(true);

  const fetchVariantResults = useCallback(async () => {
    if (!user) return;

    const controller = new AbortController();

    try {
      const { data, error } = await supabase
        .from('test_results')
        .select('variant, correct_answers, total_questions')
        .eq('user_id', user.id)
        .order('correct_answers', { ascending: false })
        .limit(100)
        .abortSignal(controller.signal);

      if (error) throw error;

      const results: Record<number, VariantResult> = {};
      data?.forEach((result) => {
        if (!results[result.variant] || results[result.variant].bestScore < result.correct_answers) {
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
      setLoading(false);
    }

    return () => controller.abort();
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchVariantResults();
    } else {
      setLoading(false);
    }
  }, [user, fetchVariantResults]);

  /**
   * Save test result.
   * Validates data client-side before sending to catch obvious errors early.
   * DB constraints and RLS enforce auth.uid() = user_id on insert.
   */
  const saveTestResult = async (
    variant: number,
    correctAnswers: number,
    totalQuestions: number,
    timeTakenSeconds: number,
    _sessionId: string | null = null,
    _isPremiumSession: boolean = false
  ): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'User not authenticated' };

    // ── Client-side validation (mirrors DB constraints) ────────────────────
    if (!Number.isInteger(variant) || variant < 1 || variant > 100) {
      if (!import.meta.env.PROD) console.error('Invalid variant:', variant);
      return { success: false, error: 'Invalid variant' };
    }
    if (!Number.isInteger(correctAnswers) || correctAnswers < 0 || correctAnswers > 20) {
      if (!import.meta.env.PROD) console.error('Invalid correct_answers:', correctAnswers);
      return { success: false, error: 'Invalid score' };
    }
    // Clamp time rather than reject — network delays can cause slight overrun
    const clampedTime = timeTakenSeconds !== null
      ? Math.min(7200, Math.max(0, Math.round(timeTakenSeconds)))
      : null;

    try {
      const { error } = await supabase.from('test_results').insert({
        user_id:            user.id,   // ALWAYS from session, never from caller
        variant,
        correct_answers:    correctAnswers,
        total_questions:    20,        // ALWAYS exactly 20 per DB constraint
        time_taken_seconds: clampedTime,
      });

      if (error) {
        if (!import.meta.env.PROD) console.error('Insert error:', error);
        return { success: false, error: error.message };
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
