-- ====================================================================
-- SECURITY HARDENING MIGRATION
-- Real DB state verified via Supabase MCP before writing this file.
-- ====================================================================
-- VERIFIED REAL STATE:
--   get_user_access_state(user_id uuid) — EXISTS, correct, NOT overridden here
--   start_test_session / verify_and_save_test_result — NOT in live DB (created here)
--   test_sessions table — NOT in live DB (created here)
--   3 triggers on auth.users — consolidated to 1 correct trigger here
--   71 users: is_trial_used=true but trial_end_date=NULL — fixed at end
-- ====================================================================

-- ====================================================================
-- SECTION 1: Email index (email column already in live DB)
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles (lower(email));

-- ====================================================================
-- SECTION 2: Harden has_role()
-- Risk: any authenticated user could call has_role(victim_uuid, 'admin')
--       to discover which other user IDs are admins.
-- Fix: revoke direct public access; keep function for internal policy use.
--      Add my_role() for safe client-facing role check.
-- ====================================================================
-- Re-define with same signature (no functional change, adds explicit search_path)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Revoke direct client access — only policies and SECURITY DEFINER functions call this
REVOKE EXECUTE ON FUNCTION public.has_role(UUID, app_role) FROM anon, authenticated;

-- Safe public RPC: users can only check their OWN role
CREATE OR REPLACE FUNCTION public.my_role()
RETURNS TEXT
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT role::TEXT FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1),
    'user'
  )
$$;
GRANT EXECUTE ON FUNCTION public.my_role() TO authenticated;

-- ====================================================================
-- SECTION 3: test_sessions table + start_test_session + verify_and_save_test_result
-- These functions did NOT exist in the live DB.
-- get_user_access_state(user_id uuid) returns TABLE — called correctly here.
-- ====================================================================
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

CREATE POLICY "Users can view their own sessions"
  ON public.test_sessions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sessions"
  ON public.test_sessions FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own sessions"
  ON public.test_sessions FOR UPDATE
  USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_test_sessions_user_id    ON public.test_sessions (user_id);
CREATE INDEX IF NOT EXISTS idx_test_sessions_expires_at ON public.test_sessions (expires_at);

-- Remove direct INSERT on test_results (results only via RPC)
DROP POLICY IF EXISTS "Users can insert their own test results" ON public.test_results;

-- start_test_session: calls get_user_access_state(user_id) correctly (TABLE return)
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

  -- Input validation
  IF p_variant < 0 OR p_variant > 100 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_variant');
  END IF;
  IF p_question_source IS NULL OR length(trim(p_question_source)) = 0 OR length(p_question_source) > 100 THEN
    RETURN jsonb_build_object('ok', false, 'error', 'invalid_source');
  END IF;

  -- get_user_access_state returns TABLE(state, is_premium, expires_at)
  -- auth.uid() inside that function still reflects the real caller
  SELECT state, is_premium, expires_at
    INTO v_state, v_is_premium, v_expires_at
  FROM public.get_user_access_state(v_user_id);

  -- Map full state names to CHECK constraint values ('guest','free','trial','pro')
  v_access_type := CASE v_state
    WHEN 'active_pro'   THEN 'pro'
    WHEN 'active_trial' THEN 'trial'
    WHEN 'guest'        THEN 'guest'
    ELSE                     'free'
  END;

  -- Premium request but no premium access → reject
  IF p_is_premium AND v_state NOT IN ('active_pro', 'active_trial') THEN
    RETURN jsonb_build_object('ok', false, 'error', 'no_premium_access', 'state', v_state);
  END IF;

  -- Session expiry: for premium, cannot outlive access window
  IF p_is_premium AND v_expires_at IS NOT NULL THEN
    v_session_expires := LEAST(v_expires_at, now() + INTERVAL '90 minutes');
  ELSE
    v_session_expires := now() + INTERVAL '90 minutes';
  END IF;

  -- Guest: no DB record needed
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

-- verify_and_save_test_result: calls get_user_access_state correctly
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
BEGIN
  v_user_id := auth.uid();

  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated');
  END IF;

  -- No session = free test, simple insert
  IF p_session_id IS NULL THEN
    INSERT INTO public.test_results (
      user_id, variant, correct_answers, total_questions,
      time_taken_seconds, access_type, is_premium, question_source
    ) VALUES (
      v_user_id, p_variant, p_correct_answers, p_total_questions,
      p_time_taken_seconds, 'free', false, 'free'
    ) RETURNING id INTO v_result_id;
    RETURN jsonb_build_object('ok', true, 'result_id', v_result_id);
  END IF;

  -- Load and verify session ownership
  SELECT * INTO v_session
  FROM public.test_sessions
  WHERE id = p_session_id AND user_id = v_user_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'session_not_found');
  END IF;

  IF v_session.completed THEN
    RETURN jsonb_build_object('ok', false, 'error', 'session_already_completed');
  END IF;

  -- For premium sessions: re-verify access is still valid RIGHT NOW
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

  -- Save result
  INSERT INTO public.test_results (
    user_id, variant, correct_answers, total_questions,
    time_taken_seconds, access_type, is_premium, question_source
  ) VALUES (
    v_user_id, p_variant, p_correct_answers, p_total_questions,
    p_time_taken_seconds, v_session.access_type, v_session.is_premium, v_session.question_source
  ) RETURNING id INTO v_result_id;

  UPDATE public.test_sessions SET completed = true WHERE id = p_session_id;

  RETURN jsonb_build_object('ok', true, 'result_id', v_result_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.verify_and_save_test_result(UUID, INTEGER, INTEGER, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_user_access_state(UUID) TO authenticated;

-- ====================================================================
-- SECTION 4: login_attempts — brute-force protection (backend-only)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.login_attempts (
  id           UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  email        TEXT        NOT NULL,
  ip_address   TEXT,
  success      BOOLEAN     NOT NULL DEFAULT false,
  attempted_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.login_attempts ENABLE ROW LEVEL SECURITY;
-- Intentionally NO policies — deny-by-default, only service_role (backend) can access

CREATE INDEX IF NOT EXISTS idx_login_attempts_email_time
  ON public.login_attempts (lower(email), attempted_at DESC);
CREATE INDEX IF NOT EXISTS idx_login_attempts_ip_time
  ON public.login_attempts (ip_address, attempted_at DESC);

CREATE OR REPLACE FUNCTION public.check_login_rate_limit(
  p_email     TEXT,
  p_ip        TEXT    DEFAULT NULL,
  p_window    INTERVAL DEFAULT INTERVAL '15 minutes',
  p_max_fails INTEGER  DEFAULT 5
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_fail_count  INTEGER;
  v_block_until TIMESTAMPTZ;
BEGIN
  SELECT COUNT(*) INTO v_fail_count
  FROM public.login_attempts
  WHERE (lower(email) = lower(p_email) OR (p_ip IS NOT NULL AND ip_address = p_ip))
    AND success = false
    AND attempted_at > now() - p_window;

  IF v_fail_count >= p_max_fails THEN
    SELECT attempted_at + p_window INTO v_block_until
    FROM public.login_attempts
    WHERE (lower(email) = lower(p_email) OR (p_ip IS NOT NULL AND ip_address = p_ip))
      AND success = false
    ORDER BY attempted_at DESC
    LIMIT 1;
    RETURN jsonb_build_object('allowed', false, 'fail_count', v_fail_count, 'block_until', v_block_until);
  END IF;

  RETURN jsonb_build_object('allowed', true, 'fail_count', v_fail_count);
END;
$$;

CREATE OR REPLACE FUNCTION public.record_login_attempt(p_email TEXT, p_ip TEXT, p_success BOOLEAN)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  INSERT INTO public.login_attempts (email, ip_address, success)
  VALUES (lower(p_email), p_ip, p_success);
$$;

CREATE OR REPLACE FUNCTION public.clear_login_attempts(p_email TEXT)
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  DELETE FROM public.login_attempts WHERE lower(email) = lower(p_email);
$$;

CREATE OR REPLACE FUNCTION public.cleanup_old_login_attempts()
RETURNS void LANGUAGE sql SECURITY DEFINER SET search_path = public AS $$
  DELETE FROM public.login_attempts WHERE attempted_at < now() - INTERVAL '24 hours';
$$;

-- Backend-only: revoke from all client roles
REVOKE ALL ON FUNCTION public.check_login_rate_limit(TEXT, TEXT, INTERVAL, INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.record_login_attempt(TEXT, TEXT, BOOLEAN)             FROM PUBLIC;
REVOKE ALL ON FUNCTION public.clear_login_attempts(TEXT)                             FROM PUBLIC;
REVOKE ALL ON FUNCTION public.cleanup_old_login_attempts()                           FROM PUBLIC;

-- ====================================================================
-- SECTION 5: Harden user_roles — add admin read policy
-- ====================================================================
DROP POLICY IF EXISTS "Admins can view all user roles" ON public.user_roles;
CREATE POLICY "Admins can view all user roles"
  ON public.user_roles FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- ====================================================================
-- SECTION 6: Harden contact_messages INSERT — length validation
-- ====================================================================
DROP POLICY IF EXISTS "Anyone can submit contact messages" ON public.contact_messages;
CREATE POLICY "Anyone can submit contact messages"
  ON public.contact_messages FOR INSERT
  WITH CHECK (
    length(trim(name))    BETWEEN 2 AND 100
    AND length(trim(subject)) BETWEEN 2 AND 200
    AND length(trim(message)) BETWEEN 5 AND 2000
    AND (phone IS NULL OR length(trim(phone)) <= 50)
  );

-- ====================================================================
-- SECTION 7: audit_logs table
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  action     TEXT        NOT NULL,
  table_name TEXT,
  old_data   JSONB,
  new_data   JSONB,
  ip_address TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view audit logs"
  ON public.audit_logs FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id    ON public.audit_logs (user_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON public.audit_logs (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_logs_action     ON public.audit_logs (action);

CREATE OR REPLACE FUNCTION public.audit_trigger()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.audit_logs (user_id, action, table_name, old_data, new_data)
  VALUES (
    auth.uid(), TG_OP, TG_TABLE_NAME,
    CASE WHEN TG_OP IN ('UPDATE','DELETE') THEN to_jsonb(OLD) ELSE NULL END,
    CASE WHEN TG_OP IN ('INSERT','UPDATE') THEN to_jsonb(NEW) ELSE NULL END
  );
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
EXCEPTION WHEN OTHERS THEN
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$;

DROP TRIGGER IF EXISTS audit_profiles     ON public.profiles;
DROP TRIGGER IF EXISTS audit_test_results ON public.test_results;

CREATE TRIGGER audit_profiles
  AFTER INSERT OR UPDATE OR DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();

CREATE TRIGGER audit_test_results
  AFTER INSERT OR UPDATE OR DELETE ON public.test_results
  FOR EACH ROW EXECUTE FUNCTION public.audit_trigger();

-- ====================================================================
-- SECTION 8: chek table (already in live DB — idempotent)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.chek (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email      TEXT,
  link       TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.chek ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own chek"    ON public.chek;
DROP POLICY IF EXISTS "Users can insert own chek"  ON public.chek;
DROP POLICY IF EXISTS "Users can update own chek"  ON public.chek;
DROP POLICY IF EXISTS "Admins can manage all chek" ON public.chek;

CREATE POLICY "Users can view own chek"
  ON public.chek FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own chek"
  ON public.chek FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own chek"
  ON public.chek FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can manage all chek"
  ON public.chek FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- ====================================================================
-- SECTION 9: user_archive table (already in live DB — idempotent)
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.user_archive (
  id                UUID        PRIMARY KEY,
  email             TEXT,
  full_name         TEXT,
  tariff_days       INTEGER,
  tariff_start_date TIMESTAMPTZ,
  tariff_end_date   TIMESTAMPTZ,
  is_trial_used     BOOLEAN,
  deleted_reason    TEXT,
  archived_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_archive ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Only service_role can access archive" ON public.user_archive;
DROP POLICY IF EXISTS "Admins can view user archive"         ON public.user_archive;
CREATE POLICY "Admins can view user archive"
  ON public.user_archive FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role));

-- ====================================================================
-- SECTION 10: Archive trigger on profile delete
-- ====================================================================
CREATE OR REPLACE FUNCTION public.archive_pro_user_on_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.tariff_days > 0 OR OLD.is_trial_used THEN
    INSERT INTO public.user_archive (
      id, email, full_name, tariff_days,
      tariff_start_date, tariff_end_date, is_trial_used, deleted_reason
    ) VALUES (
      OLD.id, OLD.email, OLD.full_name, OLD.tariff_days,
      OLD.tariff_start_date, OLD.tariff_end_date, OLD.is_trial_used, 'user_deleted'
    ) ON CONFLICT (id) DO NOTHING;
  END IF;
  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_archive_pro_user_on_delete ON public.profiles;
CREATE TRIGGER trg_archive_pro_user_on_delete
  BEFORE DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.archive_pro_user_on_delete();

-- ====================================================================
-- SECTION 11: Consolidate auth.users signup triggers → ONE correct trigger
--
-- PROBLEM (verified with real DB data):
--   on_auth_user_created    → handle_new_user: inserts profile with is_trial_used=true
--                             but NO trial_start_date / trial_end_date
--   on_auth_user_created_secure → ON CONFLICT DO NOTHING → does nothing
--   Result: 71 users have is_trial_used=true, trial_end_date=NULL → expired_trial immediately
--
-- FIX: drop all 3 triggers, replace with one that sets trial dates correctly
-- ====================================================================
DROP TRIGGER IF EXISTS on_auth_user_created        ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_chek   ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_created_secure ON auth.users;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_username TEXT;
  v_fullname TEXT;
BEGIN
  -- Sanitize metadata inputs
  v_username := regexp_replace(
    substring(trim(coalesce(NEW.raw_user_meta_data->>'username', '')), 1, 50),
    '[^a-zA-Z0-9_\-]', '', 'g'
  );
  v_fullname := substring(trim(coalesce(NEW.raw_user_meta_data->>'full_name', '')), 1, 100);

  IF v_username = '' THEN v_username := NULL; END IF;
  IF v_fullname = '' THEN v_fullname := NULL; END IF;

  -- 1. Create profile with correct trial dates
  INSERT INTO public.profiles (
    id, email, username, full_name,
    tariff_days, is_trial_used, trial_start_date, trial_end_date
  ) VALUES (
    NEW.id,
    NEW.email,
    v_username,
    v_fullname,
    0,           -- no paid tariff yet
    true,        -- trial starts immediately on signup
    now(),
    now() + INTERVAL '1 hour'
  ) ON CONFLICT (id) DO NOTHING;

  -- 2. Assign default 'user' role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;

  -- 3. Create chek record
  INSERT INTO public.chek (user_id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT DO NOTHING;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Never block signup due to trigger failure
  RAISE WARNING 'handle_new_user failed for %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ====================================================================
-- SECTION 12: Contact rate-limit trigger
-- ====================================================================
CREATE OR REPLACE FUNCTION public.check_contact_rate_limit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
BEGIN
  IF NEW.user_id IS NOT NULL THEN
    SELECT COUNT(*) INTO v_count
    FROM public.contact_messages
    WHERE user_id = NEW.user_id AND created_at > now() - INTERVAL '1 hour';
    IF v_count >= 3 THEN RAISE EXCEPTION 'rate_limit_exceeded'; END IF;
  ELSE
    SELECT COUNT(*) INTO v_count
    FROM public.contact_messages
    WHERE lower(name) = lower(NEW.name) AND created_at > now() - INTERVAL '1 hour';
    IF v_count >= 2 THEN RAISE EXCEPTION 'rate_limit_exceeded'; END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS contact_rate_limit ON public.contact_messages;
CREATE TRIGGER contact_rate_limit
  BEFORE INSERT ON public.contact_messages
  FOR EACH ROW EXECUTE FUNCTION public.check_contact_rate_limit();

-- ====================================================================
-- SECTION 13: Subscription sync — prevent users from self-modifying tariff
-- ====================================================================
CREATE OR REPLACE FUNCTION public.sync_profile_subscription()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- If subscription fields changed AND caller is the owner (not admin, not service_role)
  IF (NEW.tariff_days       IS DISTINCT FROM OLD.tariff_days       OR
      NEW.tariff_start_date IS DISTINCT FROM OLD.tariff_start_date OR
      NEW.tariff_end_date   IS DISTINCT FROM OLD.tariff_end_date   OR
      NEW.is_trial_used     IS DISTINCT FROM OLD.is_trial_used     OR
      NEW.trial_start_date  IS DISTINCT FROM OLD.trial_start_date  OR
      NEW.trial_end_date    IS DISTINCT FROM OLD.trial_end_date)
  AND auth.uid() = NEW.id
  AND NOT public.has_role(auth.uid(), 'admin'::app_role)
  THEN
    -- Silently revert — user cannot change their own subscription
    NEW.tariff_days       := OLD.tariff_days;
    NEW.tariff_start_date := OLD.tariff_start_date;
    NEW.tariff_end_date   := OLD.tariff_end_date;
    NEW.is_trial_used     := OLD.is_trial_used;
    NEW.trial_start_date  := OLD.trial_start_date;
    NEW.trial_end_date    := OLD.trial_end_date;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_profile_subscription ON public.profiles;
CREATE TRIGGER trg_sync_profile_subscription
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.sync_profile_subscription();

-- ====================================================================
-- SECTION 14: Intrusion detection
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.intrusion_events (
  id         UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID        REFERENCES auth.users(id) ON DELETE SET NULL,
  event_type TEXT        NOT NULL,
  table_name TEXT,
  details    JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.intrusion_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins can view intrusion events"
  ON public.intrusion_events FOR SELECT
  USING (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX IF NOT EXISTS idx_intrusion_events_created_at ON public.intrusion_events (created_at DESC);

CREATE OR REPLACE FUNCTION public.detect_intrusion()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF TG_TABLE_NAME = 'profiles' AND TG_OP = 'UPDATE'
     AND auth.uid() = NEW.id
     AND NOT public.has_role(auth.uid(), 'admin'::app_role)
     AND (NEW.tariff_days IS DISTINCT FROM OLD.tariff_days
          OR NEW.tariff_end_date IS DISTINCT FROM OLD.tariff_end_date
          OR NEW.is_trial_used IS DISTINCT FROM OLD.is_trial_used)
  THEN
    INSERT INTO public.intrusion_events (user_id, event_type, table_name, details)
    VALUES (auth.uid(), 'user_attempting_subscription_modification', TG_TABLE_NAME,
            jsonb_build_object('timestamp', now()));
  END IF;
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
EXCEPTION WHEN OTHERS THEN
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END;
$$;

DROP TRIGGER IF EXISTS detect_intrusion_profiles ON public.profiles;
CREATE TRIGGER detect_intrusion_profiles
  AFTER INSERT OR UPDATE OR DELETE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.detect_intrusion();

-- ====================================================================
-- SECTION 15: activate_trial_for_user — backend-only RPC
-- ====================================================================
CREATE OR REPLACE FUNCTION public.activate_trial_for_user(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.profiles
  SET is_trial_used = true, trial_start_date = now(), trial_end_date = now() + INTERVAL '1 hour'
  WHERE id = p_user_id AND NOT is_trial_used;

  IF NOT FOUND THEN
    IF EXISTS (SELECT 1 FROM public.profiles WHERE id = p_user_id) THEN
      RETURN jsonb_build_object('ok', false, 'error', 'trial_already_used');
    END IF;
    RETURN jsonb_build_object('ok', false, 'error', 'user_not_found');
  END IF;

  RETURN jsonb_build_object('ok', true, 'trial_end_date', now() + INTERVAL '1 hour');
END;
$$;

REVOKE ALL ON FUNCTION public.activate_trial_for_user(UUID) FROM PUBLIC;

-- ====================================================================
-- SECTION 16: Admin RLS policies (idempotent)
-- ====================================================================
DROP POLICY IF EXISTS "Admins can view all profiles"   ON public.profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can delete profiles"     ON public.profiles;
CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can update all profiles"
  ON public.profiles FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete profiles"
  ON public.profiles FOR DELETE USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can view all test results" ON public.test_results;
DROP POLICY IF EXISTS "Admins can delete test results"   ON public.test_results;
CREATE POLICY "Admins can view all test results"
  ON public.test_results FOR SELECT USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete test results"
  ON public.test_results FOR DELETE USING (public.has_role(auth.uid(), 'admin'::app_role));

DROP POLICY IF EXISTS "Admins can update contact messages" ON public.contact_messages;
DROP POLICY IF EXISTS "Admins can delete contact messages" ON public.contact_messages;
CREATE POLICY "Admins can update contact messages"
  ON public.contact_messages FOR UPDATE USING (public.has_role(auth.uid(), 'admin'::app_role));
CREATE POLICY "Admins can delete contact messages"
  ON public.contact_messages FOR DELETE USING (public.has_role(auth.uid(), 'admin'::app_role));

-- ====================================================================
-- SECTION 17: Additional performance indexes
-- ====================================================================
CREATE INDEX IF NOT EXISTS idx_user_roles_user_id        ON public.user_roles (user_id);
CREATE INDEX IF NOT EXISTS idx_test_results_completed_at ON public.test_results (completed_at DESC);

-- ====================================================================
-- SECTION 18: DATA FIX — 71 broken users
-- is_trial_used=true but trial_end_date=NULL → they see 'expired_trial' immediately.
-- Fix: set trial_end_date = created_at + 1 hour (retroactively give them their trial).
-- This only runs once during migration, does not affect users with existing trial_end_date.
-- ====================================================================
UPDATE public.profiles
SET
  trial_start_date = created_at,
  trial_end_date   = created_at + INTERVAL '1 hour'
WHERE is_trial_used = true
  AND trial_end_date IS NULL;
-- This updates exactly the 71 affected users.
-- Note: most of them will already be "expired" (created_at + 1h is in the past),
-- but at least the data is consistent. Contact them separately if needed.
