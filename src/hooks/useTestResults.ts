import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';

interface VariantResult {
  variant: number;
  bestScore: number;
  totalQuestions: number;
}

export const useTestResults = () => {
  const { user } = useAuth();
  const [variantResults, setVariantResults] = useState<Record<number, VariantResult>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchVariantResults();
    } else {
      setLoading(false);
    }
  }, [user]);

  const fetchVariantResults = async () => {
    if (!user) return;
    
    try {
      const { data, error } = await supabase
        .from('test_results')
        .select('variant, correct_answers, total_questions')
        .eq('user_id', user.id)
        .order('correct_answers', { ascending: false });

      if (error) throw error;

      const results: Record<number, VariantResult> = {};
      data?.forEach((result) => {
        if (!results[result.variant] || results[result.variant].bestScore < result.correct_answers) {
          results[result.variant] = {
            variant: result.variant,
            bestScore: result.correct_answers,
            totalQuestions: result.total_questions,
          };
        }
      });

      setVariantResults(results);
    } catch (err) {
      console.error('Error fetching variant results:', err);
    } finally {
      setLoading(false);
    }
  };

  const saveTestResult = async (
    variant: number,
    correctAnswers: number,
    totalQuestions: number,
    timeTakenSeconds: number
  ): Promise<{ success: boolean; error?: string }> => {
    if (!user) {
      return { success: false, error: 'User not authenticated' };
    }

    try {
      const { error } = await supabase.from('test_results').insert({
        user_id: user.id,
        variant,
        correct_answers: correctAnswers,
        total_questions: totalQuestions,
        time_taken_seconds: timeTakenSeconds,
      });

      if (error) {
        console.error('Error saving test result:', error);
        return { success: false, error: error.message };
      }

      await fetchVariantResults();
      return { success: true };
    } catch (err) {
      console.error('Save test result error:', err);
      return { success: false, error: 'Failed to save result' };
    }
  };

  const getVariantStatus = (variant: number) => {
    const result = variantResults[variant];
    if (!result) return 'default';
    
    const percentage = (result.bestScore / result.totalQuestions) * 100;
    if (percentage >= 90) return 'success';
    return 'failed';
  };

  return { saveTestResult, variantResults, getVariantStatus, loading };
};