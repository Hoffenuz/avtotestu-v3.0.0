/**
 * useTrialStatus — trial system is disabled.
 * Kept for backward-compatible imports; always returns no-trial state.
 */
import { useAccessState } from './useAccessState';

interface TrialStatus {
  isTrialActive: boolean;
  isTrialUsed: boolean;
  timeRemaining: number;
  isPro: boolean;
  loading: boolean;
}

export const useTrialStatus = (): TrialStatus => {
  const { state, loading } = useAccessState();
  return {
    isTrialActive: false,
    isTrialUsed: false,
    timeRemaining: 0,
    isPro: state === 'active_pro',
    loading,
  };
};

export const formatTimeRemaining = (_seconds: number): string => '0:00';
