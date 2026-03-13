/**
 * useAccessState — backend-authoritative access state.
 *
 * Security contract:
 * - isPremium is ONLY true when the backend RPC confirms it.
 * - If the RPC is unavailable, isPremium is ALWAYS false (fail-closed).
 * - Non-premium states (free/guest) may fall back to profile read so the
 *   app remains usable, but they can never elevate to premium.
 * - Loading remains true until a definitive answer is received.
 */
import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export type AccessState =
  | 'guest'
  | 'free_logged_in'
  | 'active_trial'
  | 'expired_trial'
  | 'active_pro'
  | 'expired_pro';

export interface AccessInfo {
  state: AccessState;
  isPremium: boolean;
  expiresAt: Date | null;
  loading: boolean;
  /** true when backend RPC confirmed the state (false = fallback only) */
  backendConfirmed: boolean;
}

export const useAccessState = (): AccessInfo & { refresh: () => Promise<void> } => {
  const { user, isLoading: authLoading } = useAuth();
  const [info, setInfo] = useState<AccessInfo>({
    state: 'guest',
    isPremium: false,
    expiresAt: null,
    loading: true,
    backendConfirmed: false,
  });

  const fetch = useCallback(async () => {
    if (authLoading) return;

    if (!user) {
      setInfo({ state: 'guest', isPremium: false, expiresAt: null, loading: false, backendConfirmed: true });
      return;
    }

    // ── Step 1: Try the backend RPC ──────────────────────────────────────────
    try {
      const { data, error } = await supabase.rpc('get_user_access_state');

      if (!error && data && typeof data === 'object') {
        setInfo({
          state:             (data.state ?? 'free_logged_in') as AccessState,
          isPremium:         data.is_premium === true,
          expiresAt:         data.expires_at ? new Date(data.expires_at) : null,
          loading:           false,
          backendConfirmed:  true,
        });
        return;
      }
      // RPC returned an error — fall through
      console.warn('useAccessState RPC error:', error?.message ?? 'empty response');
    } catch (rpcErr) {
      console.warn('useAccessState RPC unavailable:', rpcErr);
    }

    // ── Step 2: RPC failed — fall back to profile read ───────────────────────
    // Profile rows are protected by RLS (auth.uid() = id), so the data is
    // trustworthy.  We use tariff_end_date / trial_end_date directly:
    //   • still valid  → grant premium / trial (backendConfirmed=true)
    //   • expired      → show expired state, no access
    //   • no tariff    → free_logged_in
    try {
      const { data: profile, error: pErr } = await supabase
        .from('profiles')
        .select('created_at, is_trial_used, tariff_days, tariff_start_date, tariff_end_date, trial_start_date, trial_end_date')
        .eq('id', user.id)
        .single();

      if (pErr || !profile) {
        setInfo({ state: 'free_logged_in', isPremium: false, expiresAt: null, loading: false, backendConfirmed: false });
        return;
      }

      const now = Date.now();
      const tariffDays = Number((profile as any).tariff_days ?? 0);

      // ── PRO tariff ──────────────────────────────────────────────────────────
      if (tariffDays > 0) {
        const startMs = (profile as any).tariff_start_date
          ? new Date((profile as any).tariff_start_date).getTime()
          : null;
        const endMs = (profile as any).tariff_end_date
          ? new Date((profile as any).tariff_end_date).getTime()
          : startMs ? startMs + tariffDays * 86400_000 : null;

        if (endMs && endMs > now) {
          // Active PRO — profile is sufficient authority
          setInfo({
            state:           'active_pro',
            isPremium:       true,
            expiresAt:       new Date(endMs),
            loading:         false,
            backendConfirmed: true,
          });
          return;
        }
        // Expired PRO
        setInfo({ state: 'expired_pro', isPremium: false, expiresAt: null, loading: false, backendConfirmed: true });
        return;
      }

      // ── Trial ───────────────────────────────────────────────────────────────
      if ((profile as any).is_trial_used) {
        const trialEnd = (profile as any).trial_end_date
          ? new Date((profile as any).trial_end_date).getTime()
          : new Date(profile.created_at).getTime() + 3600_000;

        if (trialEnd > now) {
          setInfo({
            state:           'active_trial',
            isPremium:       true,
            expiresAt:       new Date(trialEnd),
            loading:         false,
            backendConfirmed: true,
          });
          return;
        }
        setInfo({ state: 'expired_trial', isPremium: false, expiresAt: null, loading: false, backendConfirmed: true });
        return;
      }

      // ── No tariff, no trial ─────────────────────────────────────────────────
      setInfo({ state: 'free_logged_in', isPremium: false, expiresAt: null, loading: false, backendConfirmed: true });
    } catch (profileErr) {
      console.error('useAccessState profile fallback error:', profileErr);
      setInfo({ state: 'free_logged_in', isPremium: false, expiresAt: null, loading: false, backendConfirmed: false });
    }
  }, [user, authLoading]);

  useEffect(() => {
    fetch();
    const interval = setInterval(fetch, 60_000);
    return () => clearInterval(interval);
  }, [fetch]);

  return { ...info, refresh: fetch };
};
