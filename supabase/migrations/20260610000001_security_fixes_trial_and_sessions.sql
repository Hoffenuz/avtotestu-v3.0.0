-- ============================================================================
-- Security fixes + trial restore + server-side test sessions
--
-- 1) get_user_access_state  — IDOR fix: callers can only query THEMSELVES.
--    service_role (edge functions / backend) may still query any user.
--    anon EXECUTE revoked.
-- 2) activate_trial_for_user — locked down to service_role only (trial
--    griefing fix) and ends_at bug fixed (was left at DEFAULT now(), so
--    trials were created already-expired).
-- 3) handle_new_user — every brand-new user (incl. Google sign-in) now
--    automatically receives a 1-hour trial. Trial insert can never block
--    signup.
-- 4) Data repair: trial rows broken by the ends_at bug.
-- 5) test_sessions table + start_test_session / verify_and_save_test_result
--    RPCs (drift fix: these existed only in repo migrations, never applied).
-- ============================================================================

-- ────────────────────────────────────────────────────────────────────────────
-- 1) get_user_access_state — enforce caller identity
-- ────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.get_user_access_state(user_id uuid)
RETURNS TABLE(state text, is_premium boolean, expires_at timestamp with time zone)
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id     UUID;
  v_paid        RECORD;
  v_trial       RECORD;
  v_tariff_days INTEGER;
  v_tariff_end  TIMESTAMPTZ;
  v_exists      BOOLEAN;
BEGIN
  -- Identity enforcement (IDOR fix):
  --   logged-in caller  → always resolves to their own uid, param ignored
  --   service_role      → may query any user (edge functions / backend)
  --   anything else     → guest
  IF auth.uid() IS NOT NULL THEN
    v_user_id := auth.uid();
  ELSIF COALESCE(auth.role(), '') = 'service_role' THEN
    v_user_id := user_id;
  ELSE
    RETURN QUERY SELECT 'guest'::TEXT, false, NULL::TIMESTAMPTZ;
    RETURN;
  END IF;

  IF v_user_id IS NULL THEN
    RETURN QUERY SELECT 'guest'::TEXT, false, NULL::TIMESTAMPTZ;
    RETURN;
  END IF;

  SELECT true, p.tariff_days, p.tariff_end_date
  INTO v_exists, v_tariff_days, v_tariff_end
  FROM public.profiles p WHERE p.id = v_user_id;

  IF NOT v_exists THEN
    RETURN QUERY SELECT 'free_logged_in'::TEXT, false, NULL::TIMESTAMPTZ;
    RETURN;
  END IF;

  SELECT s.ends_at INTO v_paid
  FROM public.subscriptions s
  WHERE s.user_id = v_user_id AND s.is_trial = false AND s.ends_at > now()
  ORDER BY s.ends_at DESC LIMIT 1;

  IF FOUND THEN
    RETURN QUERY SELECT 'active_pro'::TEXT, true, v_paid.ends_at;
    RETURN;
  END IF;

  IF COALESCE(v_tariff_days, 0) > 0 AND v_tariff_end IS NOT NULL AND v_tariff_end > now() THEN
    RETURN QUERY SELECT 'active_pro'::TEXT, true, v_tariff_end;
    RETURN;
  END IF;

  PERFORM 1 FROM public.subscriptions s
  WHERE s.user_id = v_user_id AND s.is_trial = false AND s.ends_at <= now() LIMIT 1;

  IF FOUND THEN
    RETURN QUERY SELECT 'expired_pro'::TEXT, false, NULL::TIMESTAMPTZ;
    RETURN;
  END IF;

  IF COALESCE(v_tariff_days, 0) > 0 AND v_tariff_end IS NOT NULL AND v_tariff_end <= now() THEN
    RETURN QUERY SELECT 'expired_pro'::TEXT, false, NULL::TIMESTAMPTZ;
    RETURN;
  END IF;

  SELECT s.ends_at INTO v_trial
  FROM public.subscriptions s
  WHERE s.user_id = v_user_id AND s.is_trial = true AND s.ends_at > now()
  ORDER BY s.ends_at DESC LIMIT 1;

  IF FOUND THEN
    RETURN QUERY SELECT 'active_trial'::TEXT, true, v_trial.ends_at;
    RETURN;
  END IF;

  PERFORM 1 FROM public.subscriptions s
  WHERE s.user_id = v_user_id AND s.is_trial = true AND s.ends_at <= now() LIMIT 1;

  IF FOUND THEN
    RETURN QUERY SELECT 'expired_trial'::TEXT, false, NULL::TIMESTAMPTZ;
    RETURN;
  END IF;

  RETURN QUERY SELECT 'free_logged_in'::TEXT, false, NULL::TIMESTAMPTZ;
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.get_user_access_state(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.get_user_access_state(uuid) TO authenticated, service_role;

-- ────────────────────────────────────────────────────────────────────────────
-- 2) activate_trial_for_user — fix ends_at bug + lock down to service_role
-- ────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.activate_trial_for_user(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  trial_start TIMESTAMPTZ := NOW();
  trial_end   TIMESTAMPTZ := NOW() + INTERVAL '1 hour';
BEGIN
  IF EXISTS (
    SELECT 1 FROM subscriptions
    WHERE user_id = p_user_id AND is_trial = TRUE
  ) THEN
    RAISE EXCEPTION 'Trial already used';
  END IF;

  INSERT INTO subscriptions (
    user_id, plan_name, status,
    started_at, expires_at, ends_at,
    is_trial, note, created_at, updated_at
  )
  VALUES (
    p_user_id, 'trial', 'active',
    trial_start, trial_end, trial_end,
    TRUE, 'System trial', NOW(), NOW()
  );
END;
$function$;

REVOKE EXECUTE ON FUNCTION public.activate_trial_for_user(uuid) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.activate_trial_for_user(uuid) TO service_role;

-- ────────────────────────────────────────────────────────────────────────────
-- 3) handle_new_user — profile + automatic 1-hour trial on signup
-- ────────────────────────────────────────────────────────────────────────────
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
BEGIN
  INSERT INTO public.profiles (
    id, email, full_name, created_at, updated_at, tariff_days
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(
      NEW.raw_user_meta_data->>'full_name',
      NEW.raw_user_meta_data->>'name',
      split_part(NEW.email, '@', 1)
    ),
    NEW.created_at,
    NOW(),
    0
  )
  ON CONFLICT (id) DO NOTHING;

  -- Automatic 1-hour trial for brand-new users. Wrapped so a trial failure
  -- can never block account creation (Google sign-in must always succeed).
  BEGIN
    IF NOT EXISTS (
      SELECT 1 FROM public.subscriptions s
      WHERE s.user_id = NEW.id AND s.is_trial = TRUE
    ) THEN
      INSERT INTO public.subscriptions (
        user_id, plan_name, status,
        started_at, expires_at, ends_at,
        is_trial, note
      )
      VALUES (
        NEW.id, 'trial', 'active',
        NOW(), NOW() + INTERVAL '1 hour', NOW() + INTERVAL '1 hour',
        TRUE, 'Auto trial on signup'
      );
    END IF;
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;

  RETURN NEW;
END;
$function$;

-- ────────────────────────────────────────────────────────────────────────────
-- 4) Data repair: trials created with ends_at stuck at DEFAULT now()
-- ────────────────────────────────────────────────────────────────────────────
UPDATE public.subscriptions
SET ends_at = expires_at
WHERE is_trial = TRUE
  AND expires_at IS NOT NULL
  AND ends_at < expires_at;

-- ────────────────────────────────────────────────────────────────────────────
-- 5) Server-side test sessions (drift fix)
-- ────────────────────────────────────────────────────────────────────────────
ALTER TABLE public.test_results
  ADD COLUMN IF NOT EXISTS access_type     TEXT,
  ADD COLUMN IF NOT EXISTS is_premium      BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS question_source TEXT;

CREATE TABLE IF NOT EXISTS public.test_sessions (
  id              UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID        REFERENCES auth.users(id) ON DELETE CASCADE,
  access_type     TEXT        NOT NULL CHECK (access_type IN ('guest','free','trial','pro')),
  is_premium      BOOLEAN     NOT NULL DEFAULT false,
  question_source TEXT        NOT NULL,
  variant         INTEGER     NOT NULL DEFAULT 0,
  started_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at      TIMESTAMPTZ NOT NULL,
  completed       BOOLEAN     NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.test_sessions ENABLE ROW LEVEL SECURITY;

-- Only SELECT for owners; all writes go through SECURITY DEFINER RPCs.
DROP POLICY IF EXISTS "Users can view their own sessions" ON public.test_sessions;
CREATE POLICY "Users can view their own sessions"
  ON public.test_sessions FOR SELECT
  USING ((SELECT auth.uid()) = user_id);

CREATE INDEX IF NOT EXISTS idx_test_sessions_user_id    ON public.test_sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_test_sessions_expires_at ON public.test_sessions (expires_at);

CREATE OR REPLACE FUNCTION public.start_test_session(
  p_variant         INTEGER,
  p_question_source TEXT,
  p_is_premium      BOOLEAN
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id         UUID;
  v_state           TEXT;
  v_is_premium      BOOLEAN;
  v_expires_at      TIMESTAMPTZ;
  v_access_type     TEXT;
  v_session_id      UUID;
  v_session_expires TIMESTAMPTZ;
BEGIN
  v_user_id := auth.uid();

  IF p_variant < 0 OR p_variant > 100 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_variant');
  END IF;
  IF p_question_source IS NULL OR length(trim(p_question_source)) = 0 OR length(p_question_source) > 100 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_source');
  END IF;

  SELECT state, is_premium, expires_at
    INTO v_state, v_is_premium, v_expires_at
  FROM public.get_user_access_state(v_user_id);

  v_access_type := CASE v_state
    WHEN 'active_pro'   THEN 'pro'
    WHEN 'active_trial' THEN 'trial'
    WHEN 'guest'        THEN 'guest'
    ELSE                     'free'
  END;

  IF p_is_premium AND v_state NOT IN ('active_pro', 'active_trial') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'no_premium_access', 'state', v_state);
  END IF;

  IF p_is_premium AND v_expires_at IS NOT NULL THEN
    v_session_expires := LEAST(v_expires_at, now() + INTERVAL '90 minutes');
  ELSE
    v_session_expires := now() + INTERVAL '90 minutes';
  END IF;

  IF v_user_id IS NULL THEN
    IF p_is_premium THEN
      RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated');
    END IF;
    RETURN jsonb_build_object(
      'ok', true, 'session_id', NULL,
      'access_type', 'guest', 'is_premium', false, 'expires_at', v_session_expires
    );
  END IF;

  INSERT INTO public.test_sessions (
    user_id, access_type, is_premium, question_source, variant, expires_at
  ) VALUES (
    v_user_id, v_access_type, p_is_premium, p_question_source, p_variant, v_session_expires
  ) RETURNING id INTO v_session_id;

  RETURN jsonb_build_object(
    'ok', true, 'session_id', v_session_id,
    'access_type', v_access_type, 'is_premium', p_is_premium, 'expires_at', v_session_expires
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.start_test_session(INTEGER, TEXT, BOOLEAN) TO authenticated, anon;

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
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated');
  END IF;

  -- Input validation mirrors test_results CHECK constraints
  IF p_variant IS NULL OR p_variant < 1 OR p_variant > 100 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_variant');
  END IF;
  IF p_correct_answers IS NULL OR p_correct_answers < 0 OR p_correct_answers > 20 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_score');
  END IF;

  v_time := LEAST(7200, GREATEST(0, COALESCE(p_time_taken_seconds, 0)));

  -- No session = free test, simple insert (total_questions fixed at 20 by constraint)
  IF p_session_id IS NULL THEN
    INSERT INTO public.test_results (
      user_id, variant, correct_answers, total_questions,
      time_taken_seconds, access_type, is_premium, question_source
    ) VALUES (
      v_user_id, p_variant, p_correct_answers, 20,
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
    v_user_id, p_variant, p_correct_answers, 20,
    v_time, v_session.access_type, v_session.is_premium, v_session.question_source
  ) RETURNING id INTO v_result_id;

  UPDATE public.test_sessions SET completed = true WHERE id = p_session_id;

  RETURN jsonb_build_object('ok', true, 'result_id', v_result_id);
END;
$$;

REVOKE EXECUTE ON FUNCTION public.verify_and_save_test_result(UUID, INTEGER, INTEGER, INTEGER, INTEGER) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.verify_and_save_test_result(UUID, INTEGER, INTEGER, INTEGER, INTEGER) TO authenticated;
REVOKE EXECUTE ON FUNCTION public.start_test_session(INTEGER, TEXT, BOOLEAN) FROM PUBLIC;

-- NOTE: the direct INSERT policy on test_results ("Users can insert own test
-- results") is intentionally KEPT for now — the currently deployed frontend
-- build still inserts directly. Drop it in a follow-up migration after the
-- new build (which saves via verify_and_save_test_result) is deployed.
