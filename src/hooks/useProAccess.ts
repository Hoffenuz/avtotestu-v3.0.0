import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTrialStatus } from './useTrialStatus';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export const useProAccess = (redirectPath: string = '/pro') => {
  const { user, isLoading } = useAuth();
  const { isTrialActive, isPro, loading: trialLoading } = useTrialStatus();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoading || trialLoading) return;

    if (!user) {
      navigate('/auth', { state: { returnTo: window.location.pathname } });
      return;
    }

    if (!isPro && !isTrialActive) {
      toast.error('Sinov muddati tugadi. PRO obuna sotib oling.');
      navigate(redirectPath);
    }
  }, [user, isPro, isTrialActive, isLoading, trialLoading, navigate, redirectPath]);

  return {
    hasAccess: (isPro || isTrialActive) && user,
    loading: isLoading || trialLoading,
  };
};
