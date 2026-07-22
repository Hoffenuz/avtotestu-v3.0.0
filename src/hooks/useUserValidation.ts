import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

/** True when Supabase reports the session/JWT is invalid — not a transient network blip. */
const isDefinitiveAuthFailure = (error: { status?: number; message?: string; code?: string }): boolean => {
  const status = error.status;
  const code = (error.code ?? '').toLowerCase();
  const msg = (error.message ?? '').toLowerCase();
  // Avoid broad substrings like "session" / "invalid" / "expired" — they false-positive
  // on network and rate-limit messages and caused spurious force-logouts.
  return (
    status === 401 ||
    status === 403 ||
    code === 'bad_jwt' ||
    code === 'session_not_found' ||
    code === 'refresh_token_not_found' ||
    code === 'user_not_found' ||
    msg.includes('jwt expired') ||
    msg.includes('invalid jwt') ||
    msg.includes('invalid claim') ||
    msg.includes('user from sub claim in jwt does not exist') ||
    msg.includes('auth session missing') ||
    msg.includes('not authenticated')
  );
};

/**
 * Clears all user-related storage and cache
 */
export const clearAllUserData = () => {
  // Clear all Supabase-related items from localStorage
  Object.keys(localStorage).forEach(key => {
    if (
      key.startsWith('sb-') ||
      key.includes('supabase') ||
      key.startsWith('testState_') ||
      key.startsWith('variant_activeTest') ||
      key.startsWith('mavzuli_activeTest') ||
      key.startsWith('testIshlash_activeTest')
    ) {
      localStorage.removeItem(key);
    }
  });

  Object.keys(sessionStorage).forEach(key => {
    if (key.startsWith('sb-') || key.includes('supabase')) {
      sessionStorage.removeItem(key);
    }
  });
};

/**
 * Force logout and clear all data
 */
/**
 * Force logout and clear all data - returns a Promise that resolves when complete
 */
export const forceLogoutAndClear = async (showNotification = true): Promise<void> => {
  try {
    // scope: 'local' — only this device. Clear storage AFTER signOut so we don't
    // race autoRefreshToken into "Invalid Refresh Token".
    await supabase.auth.signOut({ scope: 'local' });
  } catch (err) {
    if (!import.meta.env.PROD) console.error('Error during sign out:', err);
  }

  clearAllUserData();

  if (showNotification) {
    toast({
      title: "Sessiya tugatildi",
      description: "Hisobingiz o'chirilgan yoki faol emas. Iltimos, qayta kiring.",
      variant: "destructive",
    });
  }
};

/**
 * Check if user profile exists in database.
 * Returns true = exists, false = definitively not found, null = transient error (caller should not logout).
 */
export const checkUserExists = async (userId: string): Promise<boolean | null> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      // A real DB/RLS error — cannot determine existence, treat as transient.
      if (!import.meta.env.PROD) console.error('Error checking user existence:', error);
      return null;
    }
    // data === null + no error → .maybeSingle() confirmed the row does not exist.
    return !!data;
  } catch (err) {
    // Network-level failure — do not log the user out for connectivity issues.
    if (!import.meta.env.PROD) console.error('Error checking user existence:', err);
    return null;
  }
};

/**
 * Hook to validate user exists on protected pages
 * Runs once on mount to avoid infinite loops
 */
/**
 * Hook to validate user exists on protected pages
 * Runs once on mount to avoid infinite loops
 * Ensures FULL sign-out before redirect when user is deleted
 */
export const useUserValidation = (redirectPath = '/auth') => {
  const navigate = useNavigate();
  const { isLoading: authLoading, user: sessionUser } = useAuth();
  const hasValidated = useRef(false);

  useEffect(() => {
    if (authLoading) return;

    // Only validate once per mount
    if (hasValidated.current) return;
    hasValidated.current = true;

    const validateUser = async () => {
      try {
        // Skip server round-trip when context already has no session
        if (!sessionUser) {
          navigate(redirectPath, { replace: true });
          return;
        }

        // getUser() hits the network — never treat timeout/network as logout.
        // Only definitive JWT/session errors force sign-out.
        let user: Awaited<ReturnType<typeof supabase.auth.getUser>>['data']['user'] = null;
        try {
          const result = await supabase.auth.getUser();
          if (result.error) {
            if (isDefinitiveAuthFailure(result.error)) {
              if (!import.meta.env.PROD) console.log('User validation failed - forcing logout:', result.error.message);
              await forceLogoutAndClear(true);
              navigate(redirectPath, { replace: true });
            } else if (!import.meta.env.PROD) {
              console.log('User validation skipped (transient auth error):', result.error.message);
            }
            return;
          }
          user = result.data.user;
        } catch (err) {
          if (!import.meta.env.PROD) console.log('User validation skipped (getUser threw):', err);
          return;
        }

        if (!user) {
          // Context still has sessionUser but Auth API returned no user —
          // could be a race during token rotation. Do not wipe storage.
          if (!import.meta.env.PROD) console.log('User validation: getUser empty — skip force logout');
          return;
        }

        // Check if user profile exists in database.
        // null = transient/network error — do NOT logout; the user likely exists.
        // false = row definitively absent — logout.
        const exists = await checkUserExists(user.id);
        
        if (exists === null) {
          // Could not determine existence (network/DB error). Skip logout to avoid
          // falsely evicting the user due to a connectivity blip or a concurrent
          // DB write (e.g. the subscription trigger updating the profile row).
          if (!import.meta.env.PROD) console.log('User existence check inconclusive — skipping logout');
          return;
        }

        if (!exists) {
          if (!import.meta.env.PROD) console.log('User profile not found in database - forcing logout');
          // CRITICAL: Await the full sign-out BEFORE redirecting
          await forceLogoutAndClear(true);
          // Only redirect after sign-out is complete
          navigate(redirectPath, { replace: true });
        }
      } catch (err) {
        // Unexpected error — do NOT logout. A crash in the validation hook should
        // never silently evict the user; log and bail out gracefully instead.
        if (!import.meta.env.PROD) console.error('User validation error:', err);
      }
    };

    validateUser();
  }, [navigate, redirectPath, authLoading, sessionUser]);
};
