import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { withTimeout } from '@/lib/withTimeout';

/** Sessiya bor-yo'qligini tekshirish — lokal o'qish, uzoq kutmaymiz. */
const SESSION_PROBE_TIMEOUT_MS = 3_000;

/**
 * Clears test + auth storage leftovers.
 * Call only AFTER supabase.auth.signOut — never before (refresh-token races).
 */
export const clearAllUserData = () => {
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

export const forceLogoutAndClear = async (showNotification = true): Promise<void> => {
  try {
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
 * Returns true = exists, false = definitively not found, null = transient error.
 */
export const checkUserExists = async (userId: string): Promise<boolean | null> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle();

    if (error) {
      if (!import.meta.env.PROD) console.error('Error checking user existence:', error);
      return null;
    }
    return !!data;
  } catch (err) {
    if (!import.meta.env.PROD) console.error('Error checking user existence:', err);
    return null;
  }
};

/**
 * A momentary access-token refresh gap can make PostgREST see the request
 * as `anon` — RLS's `auth.uid() = id` then filters the row out with NO
 * error, indistinguishable from "row genuinely deleted". getSession() is
 * local/safe (no network round-trip in the common case, unlike getUser()
 * which was already ruled out below for the same class of false-positive).
 */
/**
 * Sessiya UMUMAN bormi (foydalanuvchi ID siga bog'liq emas).
 *
 * ILGARIGI XATTI-HARAKAT: `isLoading` false bo'lishi "sessiya yo'q" degani
 * EMAS. AuthContext dagi getSession() sekin tarmoqda 3.5 s da timeout bo'ladi
 * va UI ni bloklamaslik uchun `isLoading` ni baribir false qiladi; sessiyani
 * esa keyinroq kelgan INITIAL_SESSION tiklaydi. O'sha oraliqda `user` hali
 * null bo'ladi — agar shu payt darhol /auth ga yuborilsa, HAQIQATDA tizimga
 * kirgan (va hatto PRO to'lagan) foydalanuvchi hisobidan chiqarib yuborilardi.
 *
 * Noaniqlik (timeout yoki xato) = `true`: shubha bo'lganda foydalanuvchini
 * chiqarib yubormaymiz. Ma'lumotni baribir RLS himoya qiladi.
 */
async function sessionMightExist(): Promise<boolean> {
  try {
    const { data: { session } } = await withTimeout(
      supabase.auth.getSession(),
      SESSION_PROBE_TIMEOUT_MS,
    );
    return !!session?.user;
  } catch {
    return true;
  }
}

async function hasFreshSessionFor(userId: string): Promise<boolean> {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return !!session?.user && session.user.id === userId;
  } catch {
    return false;
  }
}

/**
 * Protected-page guard.
 * IMPORTANT: do NOT call auth.getUser() here — network/refresh blips were
 * force-logging users out while the local session was still valid.
 * Profile row check is enough to catch deleted accounts.
 */
export const useUserValidation = (redirectPath = '/auth') => {
  const navigate = useNavigate();
  const { isLoading: authLoading, user: sessionUser } = useAuth();
  const hasValidated = useRef(false);

  useEffect(() => {
    if (authLoading) return;
    if (hasValidated.current) return;
    hasValidated.current = true;

    const validateUser = async () => {
      try {
        if (!sessionUser) {
          // Sessiya bor, lekin kontekst uni hali qo'llamagan bo'lishi mumkin
          // (yuqoridagi izohga qarang) — bunday holatda chiqarib yubormaymiz.
          if (await sessionMightExist()) {
            // `sessionUser` kelganda effekt qayta ishga tushib tekshirsin
            hasValidated.current = false;
            return;
          }
          navigate(redirectPath, { replace: true });
          return;
        }

        let exists = await checkUserExists(sessionUser.id);

        // Guard against false positives: a brief network blip, or a profile
        // row not yet written by the on_auth_user_created trigger right
        // after signup, must NOT force-logout a valid user. Re-check with
        // backoff before concluding the account is gone.
        if (!exists) {
          for (const delayMs of [1200, 2500]) {
            await new Promise((r) => setTimeout(r, delayMs));
            exists = await checkUserExists(sessionUser.id);
            if (exists) break;
          }
        }

        if (exists === null) {
          if (!import.meta.env.PROD) console.log('User existence check inconclusive — skipping logout');
          return;
        }

        if (!exists) {
          // Last line of defense: a stale/refreshing token can make the
          // profile row look "gone" (see hasFreshSessionFor above) without
          // the account actually being deleted. Only force-logout when we
          // can currently confirm a valid session for this same user —
          // otherwise skip; the next protected-page visit re-checks fresh.
          const sessionFresh = await hasFreshSessionFor(sessionUser.id);
          if (!sessionFresh) {
            if (!import.meta.env.PROD) console.log('Profile not found but session stale/unconfirmed — skipping logout');
            return;
          }

          if (!import.meta.env.PROD) console.log('User profile not found — forcing logout');
          await forceLogoutAndClear(true);
          navigate(redirectPath, { replace: true });
        }
      } catch (err) {
        if (!import.meta.env.PROD) console.error('User validation error:', err);
      }
    };

    void validateUser();
  }, [navigate, redirectPath, authLoading, sessionUser]);
};
