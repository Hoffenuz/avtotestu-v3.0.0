import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

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
  // Clear all user data FIRST to prevent any race conditions
  clearAllUserData();
  
  try {
    // scope: 'global' revokes the server-side refresh token so the JWT
    // cannot be reused even if the caller was a deleted / banned user.
    await supabase.auth.signOut({ scope: 'global' });
  } catch (err) {
    if (!import.meta.env.PROD) console.error('Error during sign out:', err);
  }
  
  // Double-clear after sign out to catch any new tokens
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
 * Check if user profile exists in database
 */
export const checkUserExists = async (userId: string): Promise<boolean> => {
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('id')
      .eq('id', userId)
      .maybeSingle();
    
    return !error && !!data;
  } catch (err) {
    if (!import.meta.env.PROD) console.error('Error checking user existence:', err);
    return false; // Fail closed on network errors — do not grant access on uncertainty
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
  const hasValidated = useRef(false);

  useEffect(() => {
    // Only validate once per mount
    if (hasValidated.current) return;
    hasValidated.current = true;

    const validateUser = async () => {
      try {
        // Use getUser() for server-side validation (catches deleted users)
        const { data: { user }, error } = await supabase.auth.getUser();
        
        // If there's an auth error or no user, force full logout
        if (error || !user) {
          if (!import.meta.env.PROD) console.log('User validation failed - forcing logout:', error?.message || 'No user');
          await forceLogoutAndClear(!!error); // Show notification only if there was an error
          navigate(redirectPath, { replace: true });
          return;
        }

        // Check if user profile exists in database
        const exists = await checkUserExists(user.id);
        
        if (!exists) {
          if (!import.meta.env.PROD) console.log('User profile not found in database - forcing logout');
          // CRITICAL: Await the full sign-out BEFORE redirecting
          await forceLogoutAndClear(true);
          // Only redirect after sign-out is complete
          navigate(redirectPath, { replace: true });
        }
      } catch (err) {
        if (!import.meta.env.PROD) console.error('User validation error:', err);
        // On unexpected error, force logout to be safe
        await forceLogoutAndClear(false);
        navigate(redirectPath, { replace: true });
      }
    };

    validateUser();
  }, [navigate, redirectPath]);
};
