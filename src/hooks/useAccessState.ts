/**
 * useAccessState — thin wrapper around AuthContext.
 *
 * Security contract:
 * - get_user_access_state() RPC is called ONCE in AuthContext on login/session restore.
 * - This hook reads from context — it makes NO direct RPC calls.
 * - All components calling this hook share the same cached result.
 * - backendConfirmed=false → isPremium is always false (fail-closed).
 * - Call refresh() after a purchase/upgrade to force a re-check.
 */
import { useAuth, AccessState } from '@/contexts/AuthContext';

export type { AccessState };

export interface AccessInfo {
  state: AccessState;
  isPremium: boolean;
  expiresAt: Date | null;
  loading: boolean;
  /** true only when RPC responded successfully */
  backendConfirmed: boolean;
}

export const useAccessState = (): AccessInfo & { refresh: () => Promise<void> } => {
  const {
    accessState,
    isPremium,
    expiresAt,
    isLoading,
    accessStateLoading,
    backendConfirmed,
    refreshAccessState,
  } = useAuth();

  return {
    state:            accessState,
    isPremium,
    expiresAt,
    loading:          isLoading || accessStateLoading,
    backendConfirmed,
    refresh:          refreshAccessState,
  };
};
