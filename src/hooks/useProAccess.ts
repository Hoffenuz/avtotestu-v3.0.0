import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTrialStatus } from './useTrialStatus';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export const useProAccess = (redirectPath: string = '/pro', allowTrial: boolean = true) => {
  const { user, profile, isLoading, profileLoading } = useAuth();
  const { isTrialActive, isPro, loading: trialLoading } = useTrialStatus();
  const navigate = useNavigate();

  // A user has PRO if either the trial-status hook confirms it, or profile.is_pro is true.
  const hasProAccess = isPro || (profile?.is_pro ?? false);

  useEffect(() => {
    // Wait for ALL async data — auth, profile, and trial — before making any access decision.
    // This prevents false redirects right after login when profile hasn't loaded yet.
    if (isLoading || profileLoading || trialLoading) return;

    if (!user) {
      navigate('/auth', { state: { returnTo: window.location.pathname } });
      return;
    }

    if (allowTrial) {
      if (!hasProAccess && !isTrialActive) {
        toast.error('Sinov muddati tugadi. PRO obuna sotib oling.');
        navigate(redirectPath);
      }
    } else {
      if (!hasProAccess) {
        toast.error('Bu bo\'limga kirish uchun PRO obuna talab qilinadi.');
        navigate(redirectPath);
      }
    }
  }, [user, hasProAccess, isTrialActive, isLoading, profileLoading, trialLoading, navigate, redirectPath, allowTrial]);

  return {
    hasAccess: user && (hasProAccess || (allowTrial && isTrialActive)),
    loading: isLoading || profileLoading || trialLoading,
  };
};
