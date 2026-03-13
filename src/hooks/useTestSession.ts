/**
 * useTestSession — manages a backend-approved test session.
 *
 * Before loading questions the frontend calls `startSession()`.
 * The backend checks access state and returns a signed session_id.
 * When saving results, `saveResult()` calls `verify_and_save_test_result`
 * which re-checks access server-side before writing.
 *
 * Fallback (RPC not yet deployed):
 *   If start_test_session RPC is unavailable, we fall back to useAccessState
 *   which already verified access via profile (tariff_end_date).
 *   Session proceeds with sessionId=null; result saving uses direct insert path.
 */
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAccessState } from './useAccessState';

export interface TestSession {
  sessionId: string | null;   // null for guest sessions
  accessType: string;
  isPremium: boolean;
  expiresAt: Date | null;
}

interface StartSessionParams {
  variant: number;
  questionSource: string;     // e.g. "barcha.json" or "700baza2.json"
  isPremium: boolean;
}

interface SaveResultParams {
  variant: number;
  correctAnswers: number;
  totalQuestions: number;
  timeTakenSeconds: number;
}

export const useTestSession = () => {
  const [session, setSession] = useState<TestSession | null>(null);
  const [starting, setStarting] = useState(false);
  const accessState = useAccessState();

  /**
   * Call before rendering the test.
   * Returns { ok, error? } — if ok is false the test must NOT start.
   */
  const startSession = useCallback(async (
    params: StartSessionParams
  ): Promise<{ ok: boolean; error?: string; session?: TestSession }> => {
    setStarting(true);
    try {
      const { data, error } = await supabase.rpc('start_test_session', {
        p_variant:          params.variant,
        p_question_source:  params.questionSource,
        p_is_premium:       params.isPremium,
      });

      if (!error && data?.ok) {
        const sess: TestSession = {
          sessionId:  data.session_id ?? null,
          accessType: data.access_type,
          isPremium:  data.is_premium,
          expiresAt:  data.expires_at ? new Date(data.expires_at) : null,
        };
        setSession(sess);
        return { ok: true, session: sess };
      }

      // Business-logic rejection from RPC (e.g. no_premium_access, trial_expired)
      if (!error && data && !data.ok) {
        return { ok: false, error: data.error ?? 'unknown_error' };
      }

      // ── RPC unavailable — fall back to accessState ──────────────────────────
      // accessState already confirmed access via profile (tariff_end_date / trial).
      // If premium confirmed there, allow test with sessionId=null.
      if (params.isPremium) {
        if (!accessState.backendConfirmed || !accessState.isPremium) {
          return { ok: false, error: 'no_premium_access' };
        }
      }

      const sess: TestSession = {
        sessionId:  null,
        accessType: params.isPremium ? 'pro' : 'free',
        isPremium:  params.isPremium,
        expiresAt:  accessState.expiresAt,
      };
      setSession(sess);
      return { ok: true, session: sess };
    } catch (err: any) {
      console.error('startSession error:', err);
      // Same fallback on network exception
      if (params.isPremium) {
        if (!accessState.backendConfirmed || !accessState.isPremium) {
          return { ok: false, error: 'no_premium_access' };
        }
      }
      const sess: TestSession = {
        sessionId:  null,
        accessType: params.isPremium ? 'pro' : 'free',
        isPremium:  params.isPremium,
        expiresAt:  accessState.expiresAt,
      };
      setSession(sess);
      return { ok: true, session: sess };
    } finally {
      setStarting(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accessState.backendConfirmed, accessState.isPremium, accessState.expiresAt]);

  /**
   * Save result through the backend validator.
   * The backend re-checks premium access before writing.
   */
  const saveResult = useCallback(async (
    params: SaveResultParams
  ): Promise<{ ok: boolean; error?: string }> => {
    if (!session) return { ok: false, error: 'no_session' };

    try {
      const { data, error } = await supabase.rpc('verify_and_save_test_result', {
        p_session_id:          session.sessionId,
        p_variant:             params.variant,
        p_correct_answers:     params.correctAnswers,
        p_total_questions:     params.totalQuestions,
        p_time_taken_seconds:  params.timeTakenSeconds,
      });

      if (error) throw error;

      if (!data?.ok) {
        return { ok: false, error: data?.error ?? 'save_failed' };
      }
      return { ok: true };
    } catch (err: any) {
      console.error('saveResult error:', err);
      return { ok: false, error: 'network_error' };
    }
  }, [session]);

  return { session, starting, startSession, saveResult };
};
