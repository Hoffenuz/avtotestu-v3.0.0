import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useAccessState } from './useAccessState';
import { toast } from 'sonner';

export interface UseProAccessOptions {
  redirectPath?: string;
  /** @deprecated Trial system is disabled. This option is ignored. */
  allowTrial?: boolean;
  /** When false, guests stay on the page and show a local PRO gate UI. */
  redirectGuestsToAuth?: boolean;
  /** When false, users without PRO stay on the page (local gate UI). */
  redirectWithoutAccess?: boolean;
}

/**
 * Route guard backed by get_user_access_state() RPC.
 *
 * Redirect rules:
 * - loading=true  → wait, no redirect
 * - backendConfirmed=false → backend unavailable; show error, do NOT grant OR deny
 * - state=active_pro → allow
 * - logged-in without access → redirect to redirectPath (default /pro)
 * - guest → redirect to /auth only when redirectGuestsToAuth=true (default)
 */
export const useProAccess = (
  redirectPathOrOptions: string | UseProAccessOptions = '/pro',
  _allowTrialLegacy: boolean = false,
) => {
  const options: UseProAccessOptions =
    typeof redirectPathOrOptions === 'string'
      ? {
          redirectPath: redirectPathOrOptions,
          redirectGuestsToAuth: true,
        }
      : {
          redirectPath: '/pro',
          redirectGuestsToAuth: true,
          redirectWithoutAccess: true,
          ...redirectPathOrOptions,
        };

  const {
    redirectPath = '/pro',
    redirectGuestsToAuth = true,
    redirectWithoutAccess = true,
  } = options;

  const { user, isLoading: authLoading } = useAuth();
  const { state, loading: accessLoading, backendConfirmed } = useAccessState();
  const navigate = useNavigate();
  const loading = authLoading || accessLoading;

  useEffect(() => {
    if (loading) return;

    if (!user) {
      if (redirectGuestsToAuth) {
        navigate('/auth', { state: { returnTo: window.location.pathname } });
      }
      return;
    }

    if (!backendConfirmed) return;

    const allowed = state === 'active_pro';

    if (!allowed) {
      if (!redirectWithoutAccess) return;

      if (state === 'expired_pro') {
        toast.error('Muddati tugagan. PRO obunani yangilang.');
      } else {
        toast.error("Bu bo'limga kirish uchun PRO obuna talab qilinadi.");
      }
      navigate(redirectPath);
    }
  }, [user, state, loading, backendConfirmed, navigate, redirectPath, redirectGuestsToAuth, redirectWithoutAccess]);

  return {
    hasAccess: !loading && backendConfirmed && !!user && state === 'active_pro',
    loading: loading || (!!user && !backendConfirmed),
  };
};
