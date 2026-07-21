-- Allow practice/mavzuli/50Q scores: correct <= total, store actual total_questions.
-- Previously: correct_answers capped at 20 and total_questions hardcoded to 20.

CREATE OR REPLACE FUNCTION public.verify_and_save_test_result(
  p_session_id         UUID,
  p_variant            INTEGER,
  p_correct_answers    INTEGER,
  p_total_questions    INTEGER,
  p_time_taken_seconds INTEGER
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id   UUID;
  v_session   RECORD;
  v_state     TEXT;
  v_result_id UUID;
  v_time      INTEGER;
  v_total     INTEGER;
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated');
  END IF;

  IF p_variant IS NULL OR p_variant < 1 OR p_variant > 100 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_variant');
  END IF;

  v_total := COALESCE(p_total_questions, 0);
  IF v_total < 1 OR v_total > 2000 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_total');
  END IF;

  IF p_correct_answers IS NULL
     OR p_correct_answers < 0
     OR p_correct_answers > v_total THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_score');
  END IF;

  v_time := LEAST(7200, GREATEST(0, COALESCE(p_time_taken_seconds, 0)));

  -- No session = free test, simple insert with client-reported totals
  IF p_session_id IS NULL THEN
    INSERT INTO public.test_results (
      user_id, variant, correct_answers, total_questions,
      time_taken_seconds, access_type, is_premium, question_source
    ) VALUES (
      v_user_id, p_variant, p_correct_answers, v_total,
      v_time, 'free', false, 'free'
    ) RETURNING id INTO v_result_id;
    RETURN jsonb_build_object('ok', true, 'result_id', v_result_id);
  END IF;

  SELECT * INTO v_session
  FROM public.test_sessions
  WHERE id = p_session_id AND user_id = v_user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'session_not_found');
  END IF;

  IF v_session.completed THEN
    RETURN jsonb_build_object('ok', false, 'error', 'session_already_completed');
  END IF;

  -- For premium sessions: re-verify access is still valid right now
  IF v_session.is_premium THEN
    SELECT state INTO v_state FROM public.get_user_access_state(v_user_id);

    IF v_state NOT IN ('active_pro', 'active_trial') THEN
      UPDATE public.test_sessions SET completed = true WHERE id = p_session_id;
      RETURN jsonb_build_object('ok', false, 'error', 'premium_access_expired', 'state', v_state);
    END IF;

    IF v_session.expires_at < now() THEN
      UPDATE public.test_sessions SET completed = true WHERE id = p_session_id;
      RETURN jsonb_build_object('ok', false, 'error', 'session_expired');
    END IF;
  END IF;

  INSERT INTO public.test_results (
    user_id, variant, correct_answers, total_questions,
    time_taken_seconds, access_type, is_premium, question_source
  ) VALUES (
    v_user_id, p_variant, p_correct_answers, v_total,
    v_time, v_session.access_type, v_session.is_premium, v_session.question_source
  ) RETURNING id INTO v_result_id;

  UPDATE public.test_sessions SET completed = true WHERE id = p_session_id;

  RETURN jsonb_build_object('ok', true, 'result_id', v_result_id);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.verify_and_save_test_result(UUID, INTEGER, INTEGER, INTEGER, INTEGER) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.verify_and_save_test_result(UUID, INTEGER, INTEGER, INTEGER, INTEGER) TO authenticated;
