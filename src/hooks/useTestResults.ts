import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export const useTestResults = () => {
  const { user } = useAuth();

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

      return { success: true };
    } catch (err) {
      console.error('Save test result error:', err);
      return { success: false, error: 'Failed to save result' };
    }
  };

  return { saveTestResult };
};