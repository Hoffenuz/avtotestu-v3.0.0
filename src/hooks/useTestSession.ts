/**
 * useTestSession — server-side test session management.
 *
 * startSession calls the start_test_session RPC which verifies premium
 * access ON THE SERVER (via get_user_access_state) and creates a
 * test_sessions row. The returned session_id is later passed to
 * verify_and_save_test_result so results can only be saved through a
 * valid, uncompleted session.
 */
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { isNetworkError } from '@/lib/networkError';
import { TEST_SESSION_TIMEOUT_MS, withTimeout } from '@/lib/withTimeout';

export interface TestSession {
  sessionId: string | null;
  accessType: string;
  isPremium: boolean;
  expiresAt: Date | null;
}

interface StartSessionParams {
  variant: number;
  questionSource: string;
  isPremium: boolean;
}

interface StartSessionRpcResult {
  ok: boolean;
  error?: string;
  session_id?: string | null;
  access_type?: string;
  is_premium?: boolean;
  expires_at?: string | null;
}

export const useTestSession = () => {
  const [session, setSession] = useState<TestSession | null>(null);
  const [starting, setStarting] = useState(false);

  const startSession = useCallback(async (
    params: StartSessionParams
  ): Promise<{ ok: boolean; error?: string; session?: TestSession }> => {
    setStarting(true);
    try {
      const { data, error } = await withTimeout(
        supabase.rpc('start_test_session', {
          p_variant: params.variant,
          p_question_source: params.questionSource,
          p_is_premium: params.isPremium,
        }),
        TEST_SESSION_TIMEOUT_MS,
      );

      if (error) {
        if (!params.isPremium) {
          // Free tests proceed without a server session (offline-tolerant)
          const sess: TestSession = {
            sessionId: null,
            accessType: 'free',
            isPremium: false,
            expiresAt: null,
          };
          setSession(sess);
          return { ok: true, session: sess };
        }
        return { ok: false, error: isNetworkError(error) ? 'network_error' : 'rpc_error' };
      }

      const result = data as unknown as StartSessionRpcResult;

      if (!result?.ok) {
        return { ok: false, error: result?.error ?? 'rpc_error' };
      }

      const sess: TestSession = {
        sessionId: result.session_id ?? null,
        accessType: result.access_type ?? (params.isPremium ? 'pro' : 'free'),
        isPremium: !!result.is_premium,
        expiresAt: result.expires_at ? new Date(result.expires_at) : null,
      };
      setSession(sess);
      return { ok: true, session: sess };
    } catch (err) {
      if (!params.isPremium) {
        const sess: TestSession = {
          sessionId: null,
          accessType: 'free',
          isPremium: false,
          expiresAt: null,
        };
        setSession(sess);
        return { ok: true, session: sess };
      }
      return { ok: false, error: isNetworkError(err) ? 'network_error' : 'rpc_error' };
    } finally {
      setStarting(false);
    }
  }, []);

  return { session, starting, startSession };
};
