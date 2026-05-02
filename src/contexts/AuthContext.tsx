import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { clearAllUserData } from '@/hooks/useUserValidation';
import { toast } from '@/hooks/use-toast';

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

  const clearAccessState = useCallback(() => {
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
    setAccessStateLoading(true);
    try {
      const { data: rpcRows, error: rpcErr } = await supabase
        .rpc('get_user_access_state', { user_id: userId });

      if (!rpcErr && rpcRows && rpcRows.length > 0) {
        const row = rpcRows[0];
        const state = (VALID_ACCESS_STATES.includes(row.state as AccessState)
          ? row.state
          : 'free_logged_in') as AccessState;

        setAccessState(state);
        setIsPremium(!!row.is_premium);
        setExpiresAt(row.expires_at ? new Date(row.expires_at) : null);
        setBackendConfirmed(true);
      } else {
        // RPC unavailable — fail-closed: no premium granted
        setAccessState('free_logged_in');
        setIsPremium(false);
        setExpiresAt(null);
        setBackendConfirmed(false);
      }
    } catch (err) {
      if (!import.meta.env.PROD) console.error('Auth Error - Access state fetch:', err);
      setAccessState('free_logged_in');
      setIsPremium(false);
      setExpiresAt(null);
      setBackendConfirmed(false);
    } finally {
      setAccessStateLoading(false);
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
          if (event === 'SIGNED_OUT') {
            setSession(null);
            setUser(null);
            setProfile(null);
            clearAccessState();
            clearAllUserData();
            setIsLoading(false);
            return;
          }

          if (event === 'TOKEN_REFRESHED' && !currentSession) {
            if (!import.meta.env.PROD) console.log('Token refresh failed');
            setSession(null);
            setUser(null);
            setProfile(null);
            clearAccessState();
            clearAllUserData();
            setIsLoading(false);
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
            setIsLoading(false);
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
  }, [loadUserState, clearAccessState]);

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
    try {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) return { error };
      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
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
      await supabase.auth.signOut();
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
