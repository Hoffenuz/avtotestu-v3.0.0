import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';

interface VariantResult {
  variant: number;
  bestScore: number;
  totalQuestions: number;
}

export const useTestResults = () => {
  const { user } = useAuth();
  const [variantResults, setVariantResults] = useState<Record<number, VariantResult>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchVariantResults();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchVariantResults = async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('test_results')
        .select('variant, correct_answers, total_questions')
        .eq('user_id', user.id)
        .order('correct_answers', { ascending: false });

      if (error) throw error;

      const results: Record<number, VariantResult> = {};
      data?.forEach((result) => {
        if (!results[result.variant] || results[result.variant].bestScore < result.correct_answers) {
          results[result.variant] = {
            variant: result.variant,
            bestScore: result.correct_answers,
            totalQuestions: result.total_questions,
          };
        }
      });
      setVariantResults(results);
    } catch (err) {
      console.error('Error fetching variant results:', err);
    } finally {
      setLoading(false);
    }
  };

  /**
   * Save test result through backend RPC (verify_and_save_test_result).
   *
   * Security rules:
   * - Premium sessions (isPremiumSession=true or sessionId!=null) MUST use RPC.
   *   If RPC is unavailable the result is NOT saved (fail-closed).
   * - Free sessions attempt RPC first; fall back to direct insert only when
   *   RPC is unavailable AND session is confirmed free (sessionId=null, isPremiumSession=false).
   *   Direct insert is still protected by RLS (auth.uid() = user_id enforced by DB).
   */
  const saveTestResult = async (
    variant: number,
    correctAnswers: number,
    totalQuestions: number,
    timeTakenSeconds: number,
    sessionId: string | null = null,
    isPremiumSession: boolean = false
  ): Promise<{ success: boolean; error?: string }> => {
    if (!user) return { success: false, error: 'User not authenticated' };

    // ── Always try RPC first ─────────────────────────────────────────────────
    try {
      const { data, error } = await supabase.rpc('verify_and_save_test_result', {
        p_session_id:         sessionId,
        p_variant:            variant,
        p_correct_answers:    correctAnswers,
        p_total_questions:    totalQuestions,
        p_time_taken_seconds: timeTakenSeconds,
      });

      if (!error && data?.ok) {
        await fetchVariantResults();
        return { success: true };
      }

      if (!error && data && !data.ok) {
        // Business-logic rejection (premium_access_expired, session_expired, etc.)
        console.warn('saveTestResult RPC rejected:', data.error);
        return { success: false, error: data.error };
      }

      console.warn('saveTestResult RPC error:', (error as any)?.message);
    } catch (_) {
      // RPC not yet deployed
    }

    // ── Premium sessions: FAIL CLOSED ────────────────────────────────────────
    if (isPremiumSession || sessionId !== null) {
      console.warn('Premium result not saved: backend RPC unavailable (fail-closed).');
      return { success: false, error: 'rpc_unavailable_premium_blocked' };
    }

    // ── Free sessions only: direct insert fallback ───────────────────────────
    // Reachable only for free tests (variant 0 or 99, no session).
    // DB RLS still enforces auth.uid() = user_id on insert.
    try {
      const { error } = await supabase.from('test_results').insert({
        user_id:            user.id,
        variant,
        correct_answers:    correctAnswers,
        total_questions:    totalQuestions,
        time_taken_seconds: timeTakenSeconds,
      });

      if (error) {
        console.error('Free direct insert error:', error);
        return { success: false, error: error.message };
      }

      await fetchVariantResults();
      return { success: true };
    } catch (err: any) {
      console.error('Save test result error:', err);
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
