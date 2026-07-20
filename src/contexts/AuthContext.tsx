import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { clearAllUserData } from '@/hooks/useUserValidation';
import { toast } from '@/hooks/use-toast';
import { isNetworkError } from '@/lib/networkError';

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

// ── Provider ──────────────────────────────────────────────────────────────────

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser]           = useState<User | null>(null);
  const [session, setSession]     = useState<Session | null>(null);
  const [profile, setProfile]     = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [profileLoading, setProfileLoading] = useState(false);

  // Access state — single source of truth from backend RPC
  const [accessStateLoading, setAccessStateLoading] = useState(false);
  const [accessState, setAccessState]   = useState<AccessState>('guest');
  const [isPremium, setIsPremium]       = useState(false);
  const [expiresAt, setExpiresAt]       = useState<Date | null>(null);
  const [backendConfirmed, setBackendConfirmed] = useState(false);

  // ── Internal helpers ───────────────────────────────────────────────────────

  // Monotonic sequence for access-state fetches. Only the LATEST request may
  // apply its result — a slow stale RPC response can never overwrite a newer
  // state (e.g. premium re-granted after logout/expiry).
  const accessFetchSeqRef = useRef(0);
  /** Last successful RPC confirmation — used so flaky network doesn't strip PRO mid-session. */
  const accessConfirmedRef = useRef(false);

  const clearAccessState = useCallback(() => {
    accessFetchSeqRef.current++; // invalidate any in-flight fetch
    accessConfirmedRef.current = false;
    setAccessState('guest');
    setIsPremium(false);
    setExpiresAt(null);
    setBackendConfirmed(false);
    setAccessStateLoading(false);
  }, []);

  /** Fetch profile display data — only non-sensitive display columns */
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

  /** Fetch premium access state from backend RPC — called ONCE per session, never per component */
  const fetchAccessState = useCallback(async (userId: string): Promise<void> => {
    const seq = ++accessFetchSeqRef.current;
    const isStale = () => seq !== accessFetchSeqRef.current;

    setAccessStateLoading(true);
    try {
      const { data: rpcRows, error: rpcErr } = await supabase
        .rpc('get_user_access_state', { user_id: userId });

      if (isStale()) return; // a newer fetch (or logout) superseded this one

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
        // Never confirmed this session — fail-closed
        setAccessState('free_logged_in');
        setIsPremium(false);
        setExpiresAt(null);
        setBackendConfirmed(false);
      }
      // else: keep last confirmed PRO/state on transient RPC failure
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
      if (!isStale()) setAccessStateLoading(false);
    }
  }, []);

  /**
   * Load profile + access state in PARALLEL — called ONCE per login/session restore.
   * Components must NOT call get_user_access_state directly; use useAccessState() instead.
   */
  const loadUserState = useCallback(async (userId: string): Promise<void> => {
    setProfileLoading(true);
    try {
      const [profileData] = await Promise.all([
        fetchProfileData(userId),
        fetchAccessState(userId),   // sets its own accessStateLoading
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
        const { data: { session: currentSession } } = await supabase.auth.getSession();
        if (!isMounted) return;

        if (currentSession?.user) {
          setSession(currentSession);
          setUser(currentSession.user);
          // Fire without await so isLoading can be set immediately
          loadUserState(currentSession.user.id);
        }
        setIsLoading(false);
      } catch (err) {
        if (!import.meta.env.PROD) console.error('Auth Error - Initialization:', err);
        if (isMounted) setIsLoading(false);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, currentSession) => {
        if (!isMounted) return;

        try {
          // INITIAL_SESSION is handled exclusively by initializeAuth() below.
          // Handling it here too creates a race condition: on slow devices the
          // token may still be refreshing when INITIAL_SESSION fires, so
          // currentSession is null — causing a false logout while initializeAuth
          // is still awaiting getSession() which will eventually return the
          // refreshed (valid) session.
          if (event === 'INITIAL_SESSION') return;

          if (event === 'SIGNED_OUT') {
            // Another tab may have just rotated tokens and written a fresh
            // session to shared localStorage. Confirm before wiping — otherwise
            // a failed refresh in tab B deletes tab A's valid session.
            const { data: { session: stillThere } } = await supabase.auth.getSession();
            if (!isMounted) return;
            if (stillThere?.user) {
              setSession(stillThere);
              setUser(stillThere.user);
              fetchAccessState(stillThere.user.id);
              return;
            }
            setSession(null);
            setUser(null);
            setProfile(null);
            clearAccessState();
            clearAllUserData();
            setIsLoading(false);
            return;
          }

          if (event === 'TOKEN_REFRESHED') {
            if (!currentSession) {
              // Concurrent multi-tab refresh: the losing tab gets null here while
              // the winning tab already stored new tokens. Re-read storage first.
              const { data: { session: recovered } } = await supabase.auth.getSession();
              if (!isMounted) return;
              if (recovered?.user) {
                setSession(recovered);
                setUser(recovered.user);
                fetchAccessState(recovered.user.id);
                return;
              }
              if (!import.meta.env.PROD) console.log('Token refresh failed — no recoverable session');
              setSession(null);
              setUser(null);
              setProfile(null);
              clearAccessState();
              // Do not clearAllUserData() here: a sibling tab may still be writing
              // a valid rotation. Storage is already empty if refresh truly failed.
              setIsLoading(false);
              return;
            }
            // Session still valid — re-check PRO (e.g. after admin upgrade)
            setSession(currentSession);
            setUser(currentSession.user);
            fetchAccessState(currentSession.user.id);
            return;
          }

          setSession(currentSession);
          setUser(currentSession?.user ?? null);

          // Only reload full user state on explicit sign-in (not on token refresh)
          if (currentSession?.user && event === 'SIGNED_IN') {
            loadUserState(currentSession.user.id);
          } else if (!currentSession?.user) {
            setProfile(null);
            clearAccessState();
            // NOTE: do NOT call setIsLoading(false) here.
            // initializeAuth() is the sole authority for the initial loading flag.
            // Calling it here while initializeAuth is still in-flight would flip
            // loading=false while user=null, triggering a false redirect to /auth.
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
  }, [loadUserState, clearAccessState, fetchAccessState]);

  // Re-fetch PRO when user returns to the tab (e.g. after admin activates subscription).
  // Debounce: rapid tab switches + slow network used to flip isPremium=false mid-test.
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
    // Retry transient network failures ("Failed to fetch") — common on unstable
    // connections / ISPs with flaky access to supabase.co. Auth errors
    // (wrong password, etc.) are returned immediately without retrying.
    const MAX_ATTEMPTS = 3;
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (!error) return { error: null };
        lastError = error;
        if (!isNetworkError(error)) return { error };
      } catch (err) {
        lastError = err as Error;
        if (!isNetworkError(err)) return { error: lastError };
      }

      if (attempt < MAX_ATTEMPTS) {
        await new Promise((r) => setTimeout(r, 800 * attempt));
      }
    }

    return { error: lastError };
  }, []);

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
    try {
      // local: faqat shu qurilma. global boshqa telefon/kompyuterdagi sessiyani ham
      // bekor qilardi — foydalanuvchi "akkauntdan otib ketdi" deb hisoblagan.
      await supabase.auth.signOut({ scope: 'local' });
    } catch (err) {
      if (!import.meta.env.PROD) console.error('Sign out error:', err);
    }
    clearAllUserData();
    setUser(null);
    setSession(null);
    setProfile(null);
    clearAccessState();
  }, [clearAccessState]);

  // ── Context value ──────────────────────────────────────────────────────────

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
