-- Fix: get_user_access_state() — ambiguous user_id in PERFORM subqueries
-- Parameter name `user_id` conflicted with subscriptions.user_id column.

CREATE OR REPLACE FUNCTION public.get_user_access_state(user_id uuid)
RETURNS TABLE(state text, is_premium boolean, expires_at timestamp with time zone)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  v_user_id     UUID := user_id;
  v_paid        RECORD;
  v_trial       RECORD;
  v_tariff_days INTEGER;
  v_tariff_end  TIMESTAMPTZ;
  v_exists      BOOLEAN;
BEGIN
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

GRANT EXECUTE ON FUNCTION public.get_user_access_state(uuid) TO authenticated, anon;
