import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface TrialStatus {
  isTrialActive: boolean;
  isTrialUsed: boolean;
  timeRemaining: number; // in seconds
  isPro: boolean;
  loading: boolean;
}

export const useTrialStatus = (): TrialStatus => {
  const { user } = useAuth();
  const [status, setStatus] = useState<TrialStatus>({
    isTrialActive: false,
    isTrialUsed: false,
    timeRemaining: 0,
    isPro: false,
    loading: true,
  });

  useEffect(() => {
    if (!user) {
      setStatus({ isTrialActive: false, isTrialUsed: false, timeRemaining: 0, isPro: false, loading: false });
      return;
    }

    const fetchTrialStatus = async () => {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('created_at, is_trial_used, tariff_days')
          .eq('id', user.id)
          .single();

        if (error || !data) {
          setStatus({ isTrialActive: false, isTrialUsed: false, timeRemaining: 0, isPro: false, loading: false });
          return;
        }

        const isPro = (data.tariff_days || 0) > 0;
        const isTrialUsed = data.is_trial_used || false;
        const createdAt = new Date(data.created_at).getTime();
        const now = Date.now();
        const elapsed = (now - createdAt) / 1000; // seconds
        const trialDuration = 12 * 60 * 60; // 12 hours in seconds
        const remaining = Math.max(0, trialDuration - elapsed);

        setStatus({
          isTrialActive: isTrialUsed && remaining > 0,
          isTrialUsed,
          timeRemaining: remaining,
          isPro,
          loading: false,
        });
      } catch (err) {
        console.error('Error fetching trial status:', err);
        setStatus({ isTrialActive: false, isTrialUsed: false, timeRemaining: 0, isPro: false, loading: false });
      }
    };

    fetchTrialStatus();
    const interval = setInterval(fetchTrialStatus, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [user]);

  return status;
};

export const formatTimeRemaining = (seconds: number): string => {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}:${minutes.toString().padStart(2, '0')}`;
};
