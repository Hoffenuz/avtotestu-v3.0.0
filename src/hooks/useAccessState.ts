/**
 * useAccessState — thin wrapper around AuthContext.
 *
 * - get_user_access_state() RPC is called in AuthContext on login/session restore.
 * - isPremium is true only for active_pro (trial disabled).
 * - backendConfirmed=false → treat as non-premium until RPC succeeds (with retries).
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
