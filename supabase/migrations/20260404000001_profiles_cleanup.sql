-- ====================================================================
-- MIGRATION: profiles cleanup — move trial/tariff source to subscriptions
-- ====================================================================
-- What this migration does:
--   1. Create subscriptions table (canonical source for all paid/trial access)
--   2. Add user_id FK to chek table (if not already present)
--   3. Migrate existing profiles trial/tariff data into subscriptions rows
--   4. Update get_user_access_state() to read from subscriptions
--   5. Update handle_new_user() to write trial into subscriptions
--   6. Update activate_trial_for_user() to write into subscriptions
--   7. Replace sync_profile_subscription trigger (profiles columns changed)
--   8. Replace archive_pro_user_on_delete trigger (no more deleted columns)
--   9. Replace detect_intrusion trigger (no more deleted columns)
--  10. Drop removed columns from profiles
-- ====================================================================

-- ====================================================================
-- SECTION 1: subscriptions table
-- ====================================================================
CREATE TABLE IF NOT EXISTS public.subscriptions (
  id                  UUID        PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id             UUID        NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  plan_name           TEXT,
  tariff_days         INTEGER     NOT NULL,
  amount              NUMERIC,
  currency            TEXT        NOT NULL DEFAULT 'UZS',
  started_at          TIMESTAMPTZ NOT NULL DEFAULT now(),
  ends_at             TIMESTAMPTZ NOT NULL,
  is_trial            BOOLEAN     NOT NULL DEFAULT false,
  payment_receipt_id  UUID        REFERENCES public.payment_receipts(id) ON DELETE SET NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own subscriptions"   ON public.subscriptions;
DROP POLICY IF EXISTS "Admins can manage all subscriptions" ON public.subscriptions;

CREATE POLICY "Users can view own subscriptions"
  ON public.subscriptions FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage all subscriptions"
  ON public.subscriptions FOR ALL
  USING (public.has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX IF NOT EXISTS idx_subscriptions_user_id  ON public.subscriptions (user_id);
CREATE INDEX IF NOT EXISTS idx_subscriptions_ends_at  ON public.subscriptions (ends_at DESC);

-- ====================================================================
-- SECTION 2: chek — add user_id FK (idempotent)
-- ====================================================================
ALTER TABLE public.chek
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- ====================================================================
-- SECTION 3: Migrate existing profiles data → subscriptions
-- Insert one trial row per user who had is_trial_used=true
-- Insert one paid row per user who had tariff_days > 0
-- ====================================================================
INSERT INTO public.subscriptions (user_id, tariff_days, started_at, ends_at, is_trial, plan_name)
SELECT
  id,
  0,  -- trial has no tariff_days concept; use 0
  COALESCE(trial_start_date, created_at),
  COALESCE(trial_end_date, created_at + INTERVAL '1 hour'),
  true,
  'trial'
FROM public.profiles
WHERE is_trial_used = true
ON CONFLICT DO NOTHING;

INSERT INTO public.subscriptions (user_id, tariff_days, started_at, ends_at, is_trial, plan_name)
SELECT
  id,
  tariff_days,
  COALESCE(tariff_start_date, created_at),
  COALESCE(tariff_end_date, created_at + (tariff_days || ' days')::INTERVAL),
  false,
  NULL
FROM public.profiles
WHERE tariff_days > 0
ON CONFLICT DO NOTHING;

-- ====================================================================
-- SECTION 4: get_user_access_state — read from subscriptions
-- ====================================================================
CREATE OR REPLACE FUNCTION public.get_user_access_state(user_id UUID)
RETURNS TABLE(state TEXT, is_premium BOOLEAN, expires_at TIMESTAMPTZ)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id       UUID := user_id;
  v_paid          RECORD;
  v_trial         RECORD;
  v_profile_found BOOLEAN;
BEGIN
  -- Verify user exists in profiles
  SELECT TRUE INTO v_profile_found FROM public.profiles WHERE id = v_user_id;

  IF v_user_id IS NULL THEN
    RETURN QUERY SELECT 'guest'::TEXT, false, NULL::TIMESTAMPTZ;
    RETURN;
  END IF;

  IF NOT v_profile_found THEN
    RETURN QUERY SELECT 'free_logged_in'::TEXT, false, NULL::TIMESTAMPTZ;
    RETURN;
  END IF;

  -- Check active paid subscription (most recent active non-trial)
  SELECT s.ends_at
  INTO v_paid
  FROM public.subscriptions s
  WHERE s.user_id = v_user_id
    AND s.is_trial = false
    AND s.ends_at > now()
  ORDER BY s.ends_at DESC
  LIMIT 1;

  IF FOUND THEN
    RETURN QUERY SELECT 'active_pro'::TEXT, true, v_paid.ends_at;
    RETURN;
  END IF;

  -- Check expired paid subscription
  PERFORM 1
  FROM public.subscriptions
  WHERE user_id = v_user_id AND is_trial = false AND ends_at <= now()
  LIMIT 1;

  IF FOUND THEN
    RETURN QUERY SELECT 'expired_pro'::TEXT, false, NULL::TIMESTAMPTZ;
    RETURN;
  END IF;

  -- Check active trial
  SELECT s.ends_at
  INTO v_trial
  FROM public.subscriptions s
  WHERE s.user_id = v_user_id
    AND s.is_trial = true
    AND s.ends_at > now()
  ORDER BY s.ends_at DESC
  LIMIT 1;

  IF FOUND THEN
    RETURN QUERY SELECT 'active_trial'::TEXT, true, v_trial.ends_at;
    RETURN;
  END IF;

  -- Check expired trial
  PERFORM 1
  FROM public.subscriptions
  WHERE user_id = v_user_id AND is_trial = true AND ends_at <= now()
  LIMIT 1;

  IF FOUND THEN
    RETURN QUERY SELECT 'expired_trial'::TEXT, false, NULL::TIMESTAMPTZ;
    RETURN;
  END IF;

  RETURN QUERY SELECT 'free_logged_in'::TEXT, false, NULL::TIMESTAMPTZ;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_user_access_state(UUID) TO authenticated, anon;

-- ====================================================================
-- SECTION 5: handle_new_user — write trial into subscriptions
-- ====================================================================
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
  v_username := regexp_replace(
    substring(trim(coalesce(NEW.raw_user_meta_data->>'username', '')), 1, 50),
    '[^a-zA-Z0-9_\-]', '', 'g'
  );
  v_fullname := substring(trim(coalesce(NEW.raw_user_meta_data->>'full_name', '')), 1, 100);

  IF v_username = '' THEN v_username := NULL; END IF;
  IF v_fullname = '' THEN v_fullname := NULL; END IF;

  -- 1. Create profile (no trial/tariff columns — those live in subscriptions)
  INSERT INTO public.profiles (id, email, username, full_name, tariff_days, tariff_end_date)
  VALUES (NEW.id, NEW.email, v_username, v_fullname, 0, NULL)
  ON CONFLICT (id) DO NOTHING;

  -- 2. Create trial subscription (1 hour)
  INSERT INTO public.subscriptions (user_id, tariff_days, started_at, ends_at, is_trial, plan_name)
  VALUES (NEW.id, 0, now(), now() + INTERVAL '1 hour', true, 'trial')
  ON CONFLICT DO NOTHING;

  -- 3. Assign default role
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id, role) DO NOTHING;

  -- 4. Create chek record
  INSERT INTO public.chek (user_id, email)
  VALUES (NEW.id, NEW.email)
  ON CONFLICT DO NOTHING;

  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  RAISE WARNING 'handle_new_user failed for %: %', NEW.id, SQLERRM;
  RETURN NEW;
END;
$$;

-- ====================================================================
-- SECTION 6: activate_trial_for_user — write into subscriptions
-- ====================================================================
CREATE OR REPLACE FUNCTION public.activate_trial_for_user(p_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_trial_exists BOOLEAN;
BEGIN
  -- Check if user already has any trial subscription
  SELECT EXISTS(
    SELECT 1 FROM public.subscriptions
    WHERE user_id = p_user_id AND is_trial = true
  ) INTO v_trial_exists;

  IF v_trial_exists THEN
    RETURN jsonb_build_object('ok', false, 'error', 'trial_already_used');
  END IF;

  INSERT INTO public.subscriptions (user_id, tariff_days, started_at, ends_at, is_trial, plan_name)
  VALUES (p_user_id, 0, now(), now() + INTERVAL '1 hour', true, 'trial');

  RETURN jsonb_build_object('ok', true);
END;
$$;

-- ====================================================================
-- SECTION 7: sync_profile_subscription trigger — only tariff_days + tariff_end_date remain
-- ====================================================================
CREATE OR REPLACE FUNCTION public.sync_profile_subscription()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Prevent users from modifying their own remaining subscription display columns
  IF (NEW.tariff_days    IS DISTINCT FROM OLD.tariff_days OR
      NEW.tariff_end_date IS DISTINCT FROM OLD.tariff_end_date)
  AND auth.uid() = NEW.id
  AND NOT public.has_role(auth.uid(), 'admin'::app_role)
  THEN
    NEW.tariff_days     := OLD.tariff_days;
    NEW.tariff_end_date := OLD.tariff_end_date;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_profile_subscription ON public.profiles;
CREATE TRIGGER trg_sync_profile_subscription
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.sync_profile_subscription();

-- ====================================================================
-- SECTION 8: archive_pro_user_on_delete — no removed columns
-- ====================================================================
CREATE OR REPLACE FUNCTION public.archive_pro_user_on_delete()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF OLD.tariff_days > 0 OR OLD.tariff_end_date IS NOT NULL THEN
    INSERT INTO public.user_archive (
      id, email, full_name, tariff_days,
      tariff_start_date, tariff_end_date, is_trial_used, deleted_reason
    ) VALUES (
      OLD.id, OLD.email, OLD.full_name, OLD.tariff_days,
      NULL, OLD.tariff_end_date, false, 'user_deleted'
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
-- SECTION 9: detect_intrusion — only remaining columns
-- ====================================================================
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
     AND (NEW.tariff_days    IS DISTINCT FROM OLD.tariff_days
          OR NEW.tariff_end_date IS DISTINCT FROM OLD.tariff_end_date)
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
-- SECTION 10: Drop removed columns from profiles
-- (done LAST — after all functions/triggers referencing them are replaced)
-- ====================================================================
ALTER TABLE public.profiles
  DROP COLUMN IF EXISTS is_trial_used,
  DROP COLUMN IF EXISTS trial_start_date,
  DROP COLUMN IF EXISTS trial_end_date,
  DROP COLUMN IF EXISTS tariff_start_date;
