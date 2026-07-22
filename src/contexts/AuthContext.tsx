import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { clearAllUserData } from '@/hooks/useUserValidation';
import { AUTH_RPC_TIMEOUT_MS, withTimeout } from '@/lib/withTimeout';

// ── Types ─────────────────────────────────────────────────────────────────────

export type AccessState =
  | 'guest'
  | 'free_logged_in'
  | 'active_trial'
  | 'expired_trial'
  | 'active_pro'
  | 'expired_pro';

/** Only display-relevant columns — tariff/trial status comes from get_user_access_state RPC */
interface Profile {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isLoading: boolean;
  profileLoading: boolean;
  /** true while get_user_access_state RPC is in-flight */
  accessStateLoading: boolean;
  /** Sourced exclusively from get_user_access_state RPC — never computed client-side */
  accessState: AccessState;
  isPremium: boolean;
  expiresAt: Date | null;
  /** true only when RPC responded successfully (fail-closed: false = no premium) */
  backendConfirmed: boolean;
  signUp: (email: string, password: string, username?: string, fullName?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  /** Manually re-fetch access state — call after purchase/upgrade */
  refreshAccessState: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const VALID_ACCESS_STATES: AccessState[] = [
  'guest', 'free_logged_in', 'active_trial', 'expired_trial', 'active_pro', 'expired_pro',
];

/** Local getSession can wait on auth lock during refresh — allow headroom, never wipe on timeout. */
const SESSION_READ_TIMEOUT_MS = 25_000;
/** Password login: no client abort — aborting while GoTrue finishes causes refresh-token races. */
const SIGN_IN_TIMEOUT_MS = 45_000;

/**
 * Re-read session a few times (multi-tab token rotation).
 * Returns null only when storage definitively has no session.
 * On timeout/error returns 'unknown' so callers MUST NOT wipe tokens.
 */
async function readSessionSafe(): Promise<Session | null | 'unknown'> {
  for (let i = 0; i < 3; i++) {
    try {
      const { data: { session } } = await withTimeout(
        supabase.auth.getSession(),
        SESSION_READ_TIMEOUT_MS,
      );
      if (session?.user) return session;
      // Empty — sibling tab may still be writing; brief pause then retry
      if (i < 2) await new Promise((r) => setTimeout(r, 350 * (i + 1)));
    } catch {
      return 'unknown';
    }
  }
  return null;
}

// ── Provider ──────────────────────────────────────────────────────────────────

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser]           = useState<User | null>(null);
  const [session, setSession]     = useState<Session | null>(null);
  const [profile, setProfile]     = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);

  const [accessStateLoading, setAccessStateLoading] = useState(false);
  const [accessState, setAccessState]   = useState<AccessState>('guest');
  const [isPremium, setIsPremium]       = useState(false);
  const [expiresAt, setExpiresAt]       = useState<Date | null>(null);
  const [backendConfirmed, setBackendConfirmed] = useState(false);

  const accessFetchSeqRef = useRef(0);
  const accessConfirmedRef = useRef(false);
  /** User clicked Chiqish — ignore SIGNED_OUT recovery / late SIGNED_IN. */
  const signingOutRef = useRef(false);
  /** Prevent overlapping password logins (retry storms revoke refresh tokens). */
  const signInInFlightRef = useRef(false);

  const clearAccessState = useCallback(() => {
    accessFetchSeqRef.current++;
    accessConfirmedRef.current = false;
    setAccessState('guest');
    setIsPremium(false);
    setExpiresAt(null);
    setBackendConfirmed(false);
    setAccessStateLoading(false);
  }, []);

  const applySession = useCallback((next: Session | null) => {
    setSession(next);
    setUser(next?.user ?? null);
  }, []);

  const fetchProfileData = useCallback(async (userId: string): Promise<Profile | null> => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, full_name, avatar_url, created_at')
        .eq('id', userId)
        .single();

      if (error) {
        if (!import.meta.env.PROD) console.error('Auth Error - Profile fetch:', error);
        return null;
      }
      return data as Profile;
    } catch (err) {
      if (!import.meta.env.PROD) console.error('Auth Error - Profile exception:', err);
      return null;
    }
  }, []);

  const fetchAccessState = useCallback(async (userId: string): Promise<void> => {
    const seq = ++accessFetchSeqRef.current;
    const isStale = () => seq !== accessFetchSeqRef.current;

    const blockUi = !accessConfirmedRef.current;
    if (blockUi) setAccessStateLoading(true);
    try {
      const { data: rpcRows, error: rpcErr } = await withTimeout(
        supabase.rpc('get_user_access_state', { user_id: userId }),
        AUTH_RPC_TIMEOUT_MS,
      );

      if (isStale()) return;

      if (!rpcErr && rpcRows && rpcRows.length > 0) {
        const row = rpcRows[0];
        const state = (VALID_ACCESS_STATES.includes(row.state as AccessState)
          ? row.state
          : 'free_logged_in') as AccessState;

        accessConfirmedRef.current = true;
        setAccessState(state);
        setIsPremium(!!row.is_premium);
        setExpiresAt(row.expires_at ? new Date(row.expires_at) : null);
        setBackendConfirmed(true);
      } else if (!accessConfirmedRef.current) {
        setAccessState('free_logged_in');
        setIsPremium(false);
        setExpiresAt(null);
        setBackendConfirmed(false);
      }
    } catch (err) {
      if (isStale()) return;
      if (!import.meta.env.PROD) console.error('Auth Error - Access state fetch:', err);
      if (!accessConfirmedRef.current) {
        setAccessState('free_logged_in');
        setIsPremium(false);
        setExpiresAt(null);
        setBackendConfirmed(false);
      }
    } finally {
      if (!isStale() && blockUi) setAccessStateLoading(false);
    }
  }, []);

  const loadUserState = useCallback(async (userId: string): Promise<void> => {
    setProfileLoading(true);
    try {
      const [profileData] = await Promise.all([
        fetchProfileData(userId),
        fetchAccessState(userId),
      ]);
      setProfile(profileData);
    } finally {
      setProfileLoading(false);
    }
  }, [fetchProfileData, fetchAccessState]);

  // ── Auth state listener ────────────────────────────────────────────────────

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        // Prefer longer wait over fail-closed logout — wiping on timeout caused
        // mass "kicked out" when auth lock was held by token refresh.
        const { data: { session: currentSession } } = await withTimeout(
          supabase.auth.getSession(),
          SESSION_READ_TIMEOUT_MS,
        );
        if (!isMounted || signingOutRef.current) return;

        if (currentSession?.user) {
          applySession(currentSession);
          loadUserState(currentSession.user.id);
        }
      } catch (err) {
        if (!import.meta.env.PROD) console.error('Auth Error - Initialization:', err);
        // Timeout/hang: do NOT clear user/session — storage may still be valid.
        // onAuthStateChange (TOKEN_REFRESHED / SIGNED_IN) will hydrate when ready.
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (!isMounted) return;

        try {
          if (event === 'INITIAL_SESSION') return;

          if (event === 'SIGNED_OUT') {
            if (signingOutRef.current) {
              applySession(null);
              setProfile(null);
              clearAccessState();
              setIsLoading(false);
              return;
            }

            // Multi-tab refresh often emits SIGNED_OUT in the losing tab while
            // the winning tab writes a new refresh token. Confirm before wipe.
            // NEVER clearAllUserData here — that deletes the sibling tab's tokens
            // and produces "Invalid Refresh Token: Refresh Token Not Found".
            const stillThere = await readSessionSafe();
            if (!isMounted || signingOutRef.current) return;

            if (stillThere === 'unknown') {
              // Uncertain (timeout) — keep current React session if any
              return;
            }
            if (stillThere?.user) {
              applySession(stillThere);
              fetchAccessState(stillThere.user.id);
              return;
            }

            applySession(null);
            setProfile(null);
            clearAccessState();
            setIsLoading(false);
            return;
          }

          if (event === 'TOKEN_REFRESHED') {
            if (!currentSession) {
              const recovered = await readSessionSafe();
              if (!isMounted || signingOutRef.current) return;

              if (recovered === 'unknown') return;
              if (recovered?.user) {
                applySession(recovered);
                fetchAccessState(recovered.user.id);
                return;
              }

              if (!import.meta.env.PROD) console.log('Token refresh failed — no recoverable session');
              applySession(null);
              setProfile(null);
              clearAccessState();
              setIsLoading(false);
              return;
            }
            applySession(currentSession);
            fetchAccessState(currentSession.user.id);
            return;
          }

          if (signingOutRef.current && event !== 'SIGNED_IN') {
            return;
          }

          applySession(currentSession);

          if (currentSession?.user && event === 'SIGNED_IN') {
            if (signingOutRef.current) return;
            loadUserState(currentSession.user.id);
          } else if (!currentSession?.user) {
            setProfile(null);
            clearAccessState();
          }
        } catch (err) {
          if (!import.meta.env.PROD) console.error('Auth Error - State change:', err);
        }
      }
    );

    initializeAuth();

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [loadUserState, clearAccessState, fetchAccessState, applySession]);

  useEffect(() => {
    if (!user?.id) return;

    let timer: ReturnType<typeof setTimeout> | null = null;
    const onVisible = () => {
      if (document.visibilityState !== 'visible') return;
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        fetchAccessState(user.id);
      }, 800);
    };

    document.addEventListener('visibilitychange', onVisible);
    return () => {
      if (timer) clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [user?.id, fetchAccessState]);

  // ── Public methods ─────────────────────────────────────────────────────────

  const refreshProfile = useCallback(async () => {
    if (!user?.id) return;
    const profileData = await fetchProfileData(user.id);
    if (profileData) setProfile(profileData);
  }, [user?.id, fetchProfileData]);

  const refreshAccessState = useCallback(async () => {
    if (!user?.id) return;
    await fetchAccessState(user.id);
  }, [user?.id, fetchAccessState]);

  const signUp = useCallback(async (
    email: string,
    password: string,
    username?: string,
    fullName?: string
  ): Promise<{ error: Error | null }> => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/`,
          data: { username: username || null, full_name: fullName || null },
        },
      });
      if (error) return { error };
      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  }, []);

  const signIn = useCallback(async (
    email: string,
    password: string
  ): Promise<{ error: Error | null }> => {
    if (signInInFlightRef.current) {
      return { error: new Error('Kirish jarayoni davom etmoqda. Biroz kuting.') };
    }
    signInInFlightRef.current = true;
    signingOutRef.current = false;

    try {
      // Single attempt — concurrent retries were rotating/revoking refresh tokens
      // (Supabase logs: "Invalid Refresh Token: Refresh Token Not Found").
      const { data, error } = await withTimeout(
        supabase.auth.signInWithPassword({ email, password }),
        SIGN_IN_TIMEOUT_MS,
      );

      if (error) return { error };

      // Hydrate immediately so /auth does not wait on a raced onAuthStateChange.
      if (data.session?.user) {
        applySession(data.session);
        void loadUserState(data.session.user.id);
      }
      return { error: null };
    } catch (err) {
      // If the request finished after our client timeout, session may already exist.
      const maybe = await readSessionSafe();
      if (maybe !== 'unknown' && maybe?.user) {
        applySession(maybe);
        void loadUserState(maybe.user.id);
        return { error: null };
      }
      return { error: err as Error };
    } finally {
      signInInFlightRef.current = false;
    }
  }, [applySession, loadUserState]);

  const signInWithGoogle = useCallback(async (): Promise<{ error: Error | null }> => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) return { error };
      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  }, []);

  const signOut = useCallback(async () => {
    signingOutRef.current = true;
    applySession(null);
    setProfile(null);
    clearAccessState();
    setIsLoading(false);

    try {
      // Sign out first (clears auth storage via supabase), then wipe leftovers.
      // Clearing sb-* BEFORE signOut raced with autoRefresh and revoked tokens.
      await Promise.race([
        supabase.auth.signOut({ scope: 'local' }),
        new Promise<void>((resolve) => setTimeout(resolve, 2000)),
      ]);
    } catch (err) {
      if (!import.meta.env.PROD) console.error('Sign out error:', err);
    } finally {
      clearAllUserData();
      window.setTimeout(() => {
        signingOutRef.current = false;
      }, 1200);
    }
  }, [clearAccessState, applySession]);

  const value = useMemo(() => ({
    user,
    session,
    profile,
    isLoading,
    profileLoading,
    accessStateLoading,
    accessState,
    isPremium,
    expiresAt,
    backendConfirmed,
    signUp,
    signIn,
    signInWithGoogle,
    signOut,
    refreshProfile,
    refreshAccessState,
  }), [
    user, session, profile, isLoading, profileLoading,
    accessStateLoading, accessState, isPremium, expiresAt, backendConfirmed,
    signUp, signIn, signInWithGoogle, signOut, refreshProfile, refreshAccessState,
  ]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
