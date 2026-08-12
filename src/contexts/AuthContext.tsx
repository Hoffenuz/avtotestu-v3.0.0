import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef, ReactNode } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, Session } from '@supabase/supabase-js';
import { clearAllUserData } from '@/hooks/useUserValidation';
import { AUTH_RPC_TIMEOUT_MS, PROFILE_TIMEOUT_MS, SIGN_IN_TIMEOUT_MS, withTimeout } from '@/lib/withTimeout';

// ── Types ─────────────────────────────────────────────────────────────────────

export type AccessState =
  | 'guest'
  | 'free_logged_in'
  | 'active_trial'
  | 'expired_trial'
  | 'active_pro'
  | 'expired_pro';

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
  accessStateLoading: boolean;
  accessState: AccessState;
  /** true only for paid active_pro — trial disabled product-wide */
  isPremium: boolean;
  expiresAt: Date | null;
  backendConfirmed: boolean;
  signUp: (email: string, password: string, username?: string, fullName?: string) => Promise<{ error: Error | null }>;
  signIn: (email: string, password: string) => Promise<{ error: Error | null }>;
  signInWithGoogle: () => Promise<{ error: Error | null }>;
  signOut: () => Promise<void>;
  /**
   * Foydalanuvchida parol bilan kirish allaqachon bormi.
   * false = faqat Google orqali kirgan (parol hali qo'yilmagan).
   */
  hasPasswordLogin: boolean;
  /** Faqat o'z parolini o'rnatadi/yangilaydi (joriy sessiya egasi uchun). */
  updatePassword: (newPassword: string, currentPassword?: string) => Promise<{ error: Error | null }>;
  refreshProfile: () => Promise<void>;
  refreshAccessState: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const VALID_ACCESS_STATES: AccessState[] = [
  'guest', 'free_logged_in', 'active_trial', 'expired_trial', 'active_pro', 'expired_pro',
];

/** getSession is local — long waits = auth lock / hung refresh on mobile */
const SESSION_INIT_TIMEOUT_MS = 3_500;
const SESSION_RECOVER_TIMEOUT_MS = 5_000;

/** Trial yo'q — faqat haqiqiy PRO */
function premiumFromState(state: AccessState, rpcPremium: boolean): boolean {
  return state === 'active_pro' && rpcPremium;
}

/**
 * onAuthStateChange callback supabase-js ning auth lock i ichida chaqiriladi.
 * Lock ushlab turilganda .rpc() / .from() / getSession() chaqirilsa, ular
 * o'sha lock ni kutadi — natijada login dan keyin profil/PRO holati timeout
 * gacha (8 s) osilib qolardi. Macrotask ga surib, lock bo'shashini ta'minlaymiz.
 */
function deferFromAuthCallback(fn: () => void): void {
  setTimeout(fn, 0);
}

async function readSessionSafe(): Promise<Session | null | 'unknown'> {
  for (let i = 0; i < 2; i++) {
    try {
      const { data: { session } } = await withTimeout(
        supabase.auth.getSession(),
        SESSION_RECOVER_TIMEOUT_MS,
      );
      if (session?.user) return session;
      if (i < 1) await new Promise((r) => setTimeout(r, 300));
    } catch {
      return 'unknown';
    }
  }
  return null;
}

function canonicalWwwOrigin(): string {
  const { protocol, hostname, port } = window.location;
  if (hostname === 'avtotestu.uz') {
    return `${protocol}//www.avtotestu.uz${port ? `:${port}` : ''}`;
  }
  return window.location.origin;
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
  const signingOutRef = useRef(false);
  const signInInFlightRef = useRef(false);
  const userIdRef = useRef<string | null>(null);
  /** Boshlang'ich sessiya uchun loadUserState bir marta ishlashini kafolatlaydi */
  const bootstrappedRef = useRef(false);

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
    userIdRef.current = next?.user?.id ?? null;
  }, []);

  const fetchProfileData = useCallback(async (userId: string): Promise<Profile | null> => {
    try {
      // Timeout SHART: bu chaqiruv timeout siz qolganda (boshqa hammasida bor edi)
      // sekin tarmoqda osilib qolib, loadUserState dagi Promise.all ni abadiy
      // ushlab turardi → profileLoading hech qachon false bo'lmasdi.
      const { data, error } = await withTimeout(
        supabase
          .from('profiles')
          .select('id, username, full_name, avatar_url, created_at')
          .eq('id', userId)
          .single(),
        PROFILE_TIMEOUT_MS,
      );

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
    /** Eskirgan MA'LUMOTNI qo'llamaslik uchun (user almashgan bo'lishi mumkin) */
    const isStale = () => seq !== accessFetchSeqRef.current || userIdRef.current !== userId;
    /**
     * Spinner ni o'chirish uchun ALOHIDA shart. Ilgari ikkalasi bitta `isStale()`
     * edi: agar userIdRef o'zgargan bo'lsa (sessiya almashdi/null bo'ldi), eng
     * oxirgi chaqiruv ham "stale" hisoblanib, `setAccessStateLoading(false)`
     * BAJARILMAY qolardi. Keyin uni tozalaydigan hech kim yo'q →
     * accessStateLoading abadiy true → useAccessState().loading abadiy true →
     * /variant, /mavzuli, /darslik cheksiz "Yuklanmoqda" spinner da qotib
     * qolardi. Spinner ni faqat YANGIROQ chaqiruv bor bo'lsa qoldiramiz —
     * u holda uni o'sha chaqiruv o'chiradi.
     */
    const supersededByNewer = () => seq !== accessFetchSeqRef.current;

    const blockUi = !accessConfirmedRef.current;
    if (blockUi) setAccessStateLoading(true);

    const maxAttempts = 2;
    try {
      for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        if (isStale()) return;
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
            setIsPremium(premiumFromState(state, !!row.is_premium));
            setExpiresAt(row.expires_at ? new Date(row.expires_at) : null);
            setBackendConfirmed(true);
            return;
          }
        } catch (err) {
          if (!import.meta.env.PROD) console.error('Auth Error - Access state attempt:', attempt, err);
        }
        if (attempt < maxAttempts) {
          await new Promise((r) => setTimeout(r, 400));
        }
      }

      if (isStale()) return;
      // Keep last confirmed PRO if we already had it this session
      if (!accessConfirmedRef.current) {
        setAccessState('free_logged_in');
        setIsPremium(false);
        setExpiresAt(null);
        setBackendConfirmed(false);
      }
    } finally {
      if (!supersededByNewer() && blockUi) setAccessStateLoading(false);
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

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      try {
        // Mobile: never block UI >~3.5s waiting on auth lock
        const { data: { session: currentSession } } = await withTimeout(
          supabase.auth.getSession(),
          SESSION_INIT_TIMEOUT_MS,
        );
        if (!isMounted || signingOutRef.current) return;

        if (currentSession?.user && !bootstrappedRef.current) {
          bootstrappedRef.current = true;
          applySession(currentSession);
          void loadUserState(currentSession.user.id);
        }
      } catch (err) {
        if (!import.meta.env.PROD) console.error('Auth Error - Initialization:', err);
        // Timeout: UI ni darhol ochamiz. Sessiyani INITIAL_SESSION hodisasi
        // tiklaydi (pastda) — ilgari u e'tiborsiz qoldirilardi va shu sababli
        // tizimga kirgan foydalanuvchi "mehmon" bo'lib qolardi.
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, currentSession) => {
        if (!isMounted) return;

        // Keep callback sync — never await inside (Supabase deadlock risk).
        // Defer async recovery to microtasks.

        /**
         * ILGARIGI BUG: bu hodisa butunlay e'tiborsiz qoldirilardi.
         *
         * initializeAuth() dagi getSession() mobil tarmoqda yoki supabase-js
         * auth lock i band bo'lganda 3.5 s da timeout bo'ladi. O'sha holatda
         * sessiyani qo'llaydigan YAGONA yo'l — shu INITIAL_SESSION hodisasi.
         * U tashlab yuborilgani uchun user null qolib, isLoading esa false
         * bo'lardi — ya'ni HAQIQATDA TIZIMGA KIRGAN (va hatto PRO to'lagan)
         * foydalanuvchi ilova nazarida "mehmon" bo'lib qolardi:
         *   /mavzuli, /darslik → "Kirish talab qilinadi" gate
         *   /pro              → obuna yo'qdek ko'rinardi
         * Tiklanish faqat TOKEN_REFRESHED / SIGNED_IN ga bog'liq edi, ular esa
         * yangi sessiyada bir soatlab umuman kelmasligi mumkin.
         */
        if (event === 'INITIAL_SESSION') {
          if (
            currentSession?.user &&
            !bootstrappedRef.current &&
            !signingOutRef.current
          ) {
            bootstrappedRef.current = true;
            applySession(currentSession);
            const initialUserId = currentSession.user.id;
            deferFromAuthCallback(() => {
              if (!isMounted || signingOutRef.current) return;
              void loadUserState(initialUserId);
            });
            setIsLoading(false);
          }
          return;
        }

        if (event === 'SIGNED_OUT') {
          if (signingOutRef.current) {
            applySession(null);
            setProfile(null);
            clearAccessState();
            setIsLoading(false);
            return;
          }

          deferFromAuthCallback(() => {
            void (async () => {
              const stillThere = await readSessionSafe();
              if (!isMounted || signingOutRef.current) return;

              if (stillThere === 'unknown') return;
              if (stillThere?.user) {
                applySession(stillThere);
                void fetchAccessState(stillThere.user.id);
                return;
              }
              applySession(null);
              setProfile(null);
              clearAccessState();
              setIsLoading(false);
            })();
          });
          return;
        }

        if (event === 'TOKEN_REFRESHED') {
          if (!currentSession) {
            deferFromAuthCallback(() => {
              void (async () => {
                // Give multi-tab rotation time before declaring logout
                await new Promise((r) => setTimeout(r, 500));
                const recovered = await readSessionSafe();
                if (!isMounted || signingOutRef.current) return;
                if (recovered === 'unknown') return;
                if (recovered?.user) {
                  applySession(recovered);
                  void fetchAccessState(recovered.user.id);
                  return;
                }
                // Soft: only clear React state — do not wipe localStorage again
                applySession(null);
                setProfile(null);
                clearAccessState();
                setIsLoading(false);
              })();
            });
            return;
          }
          applySession(currentSession);
          const refreshedUserId = currentSession.user.id;
          deferFromAuthCallback(() => { void fetchAccessState(refreshedUserId); });
          return;
        }

        if (signingOutRef.current && event !== 'SIGNED_IN') return;

        applySession(currentSession);

        if (currentSession?.user && event === 'SIGNED_IN') {
          if (signingOutRef.current) return;
          // OAuth oqimida INITIAL_SESSION shundan KEYIN kelishi mumkin —
          // belgilab qo'yamiz, aks holda loadUserState ikki marta ishlaydi.
          bootstrappedRef.current = true;
          const signedInUserId = currentSession.user.id;
          deferFromAuthCallback(() => {
            if (!isMounted || signingOutRef.current) return;
            void loadUserState(signedInUserId);
          });
        } else if (!currentSession?.user) {
          setProfile(null);
          clearAccessState();
        }
      },
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
        void fetchAccessState(user.id);
      }, 800);
    };

    document.addEventListener('visibilitychange', onVisible);
    return () => {
      if (timer) clearTimeout(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [user?.id, fetchAccessState]);

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
          emailRedirectTo: `${canonicalWwwOrigin()}/`,
          data: { username: username || null, full_name: fullName || null },
        },
      });
      if (error) return { error };
      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  }, []);

  /**
   * Foydalanuvchi qaysi usul(lar) bilan kira oladi. Google orqali kelgan
   * foydalanuvchida parol yo'q — unga "parol o'rnatish" taklif qilinadi,
   * paroli borlardan esa eskisi so'raladi.
   */
  const hasPasswordLogin = useMemo(() => {
    const meta = user?.app_metadata as { providers?: unknown; provider?: unknown } | undefined;
    const list = Array.isArray(meta?.providers) ? (meta.providers as unknown[]) : [];
    if (list.some((p) => p === 'email')) return true;
    return meta?.provider === 'email';
  }, [user]);

  /**
   * Parolni o'rnatish yoki yangilash.
   *
   * Xavfsizlik: `updateUser` HAR DOIM joriy sessiya egasiga tegishli — boshqa
   * foydalanuvchini ko'rsatish imkoniyati yo'q, shuning uchun foydalanuvchi
   * faqat o'z parolini o'zgartira oladi. Paroli bor foydalanuvchidan qo'shimcha
   * ravishda eski parol so'raladi (ochiq qolgan sessiyani himoyalash uchun).
   */
  const updatePassword = useCallback(async (
    newPassword: string,
    currentPassword?: string,
  ): Promise<{ error: Error | null }> => {
    const email = user?.email?.trim();
    if (!email) return { error: new Error('not_authenticated') };

    try {
      if (hasPasswordLogin) {
        if (!currentPassword) return { error: new Error('current_password_required') };
        // Parolni tekshirishning yagona yo'li — u bilan kirib ko'rish.
        // Xato parol joriy sessiyani buzmaydi.
        const { error: verifyError } = await withTimeout(
          supabase.auth.signInWithPassword({ email, password: currentPassword }),
          SIGN_IN_TIMEOUT_MS,
        );
        if (verifyError) return { error: new Error('wrong_current_password') };
      }

      const { error } = await withTimeout(
        supabase.auth.updateUser({ password: newPassword }),
        SIGN_IN_TIMEOUT_MS,
      );
      if (error) return { error };

      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  }, [user, hasPasswordLogin]);

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
      // Password auth only — profile/PRO RPC runs in background so mobile
      // "Kirish" is not stuck 10–20s waiting on get_user_access_state.
      // Timeout shart: usul o'zi hech qachon rad etmaydi, sekin/uzilgan
      // tarmoqda tugma cheksiz "Tekshirilmoqda..." holatida qolardi.
      const { data, error } = await withTimeout(
        supabase.auth.signInWithPassword({ email, password }),
        SIGN_IN_TIMEOUT_MS,
      );

      if (error) return { error };

      if (data.session?.user) {
        applySession(data.session);
        void loadUserState(data.session.user.id);
      }
      return { error: null };
    } catch (err) {
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
        options: { redirectTo: `${canonicalWwwOrigin()}/auth/callback` },
      });
      if (error) return { error };
      return { error: null };
    } catch (err) {
      return { error: err as Error };
    }
  }, []);

  const signOut = useCallback(async () => {
    // Capture BEFORE applySession(null) wipes it — userIdRef (not the `user`
    // state) because this callback's deps never change, so its closure over
    // `user` would otherwise be permanently stale from the initial render.
    const outgoingUserId = userIdRef.current ?? undefined;
    signingOutRef.current = true;
    applySession(null);
    setProfile(null);
    clearAccessState();
    setIsLoading(false);

    try {
      await Promise.race([
        supabase.auth.signOut({ scope: 'local' }),
        new Promise<void>((resolve) => setTimeout(resolve, 2000)),
      ]);
    } catch (err) {
      if (!import.meta.env.PROD) console.error('Sign out error:', err);
    } finally {
      clearAllUserData(outgoingUserId);
      window.setTimeout(() => {
        signingOutRef.current = false;
      }, 1500);
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
    hasPasswordLogin,
    updatePassword,
    refreshProfile,
    refreshAccessState,
  }), [
    user, session, profile, isLoading, profileLoading,
    accessStateLoading, accessState, isPremium, expiresAt, backendConfirmed,
    signUp, signIn, signInWithGoogle, signOut, hasPasswordLogin, updatePassword,
    refreshProfile, refreshAccessState,
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
