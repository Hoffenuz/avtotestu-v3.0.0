-- Secure device license management: DB-enforced PRO check, refresh on renewal,
-- block direct table writes (only save_device_license RPC via service_role).

ALTER TABLE public.device_licenses
  ADD COLUMN IF NOT EXISTS refresh_count integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_refreshed_at timestamptz;

COMMENT ON COLUMN public.device_licenses.refresh_count IS
  'Kalit necha marta obuna yangilash bilan qayta yaratilgan.';
COMMENT ON COLUMN public.device_licenses.last_refreshed_at IS
  'Oxirgi marta kalit yangilangan vaqt.';

-- Mehmonlar litsenziya kalitlarini o''qiy olmasin (faqat authenticated + RLS).
REVOKE SELECT ON public.device_licenses FROM anon;

-- Jadvalga to''g''ridan-to''g''ri yozish taqiqlanadi — faqat RPC orqali.
REVOKE INSERT, UPDATE, DELETE ON public.device_licenses FROM authenticated, anon, service_role;

CREATE OR REPLACE FUNCTION public.save_device_license(
  p_user_id uuid,
  p_device_id text,
  p_license_key text,
  p_short_code text,
  p_issued_at timestamptz,
  p_expires_at timestamptz,
  p_mode text DEFAULT 'issue'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_existing public.device_licenses%ROWTYPE;
  v_access RECORD;
  v_sub_expires timestamptz;
  v_mode text;
BEGIN
  IF COALESCE(auth.role(), '') <> 'service_role' THEN
    RAISE EXCEPTION 'forbidden'
      USING ERRCODE = '42501', HINT = 'service_role only';
  END IF;

  IF p_user_id IS NULL THEN
    RAISE EXCEPTION 'invalid_user';
  END IF;

  IF p_device_id IS NULL
     OR length(trim(p_device_id)) < 4
     OR length(trim(p_device_id)) > 64
     OR p_device_id !~ '^[A-Za-z0-9_-]+$' THEN
    RAISE EXCEPTION 'invalid_device_id';
  END IF;

  IF p_license_key IS NULL OR length(trim(p_license_key)) < 20 THEN
    RAISE EXCEPTION 'invalid_license_key';
  END IF;

  IF p_short_code IS NULL OR length(trim(p_short_code)) < 4 THEN
    RAISE EXCEPTION 'invalid_short_code';
  END IF;

  v_mode := lower(trim(COALESCE(p_mode, 'issue')));
  IF v_mode NOT IN ('issue', 'refresh') THEN
    RAISE EXCEPTION 'invalid_mode';
  END IF;

  SELECT *
  INTO v_access
  FROM public.get_user_access_state(p_user_id)
  LIMIT 1;

  IF NOT COALESCE(v_access.is_premium, false)
     OR v_access.expires_at IS NULL
     OR v_access.expires_at <= now() THEN
    RAISE EXCEPTION 'no_active_subscription';
  END IF;

  v_sub_expires := v_access.expires_at;

  IF p_expires_at IS NULL
     OR p_expires_at <= now()
     OR p_expires_at > v_sub_expires + interval '5 minutes' THEN
    RAISE EXCEPTION 'invalid_license_expiry';
  END IF;

  SELECT *
  INTO v_existing
  FROM public.device_licenses
  WHERE user_id = p_user_id;

  IF v_mode = 'issue' THEN
    IF FOUND THEN
      IF v_existing.device_id <> p_device_id THEN
        RAISE EXCEPTION 'license_already_issued';
      END IF;

      IF v_existing.revoked THEN
        RAISE EXCEPTION 'license_revoked';
      END IF;

      IF v_existing.expires_at > now()
         AND v_sub_expires <= v_existing.expires_at + interval '1 minute' THEN
        RETURN jsonb_build_object(
          'action', 'return_existing',
          'device_id', v_existing.device_id,
          'license_key', v_existing.license_key,
          'short_code', v_existing.short_code,
          'issued_at', v_existing.issued_at,
          'expires_at', v_existing.expires_at,
          'can_refresh', (
            v_sub_expires > v_existing.expires_at + interval '1 minute'
            OR v_existing.expires_at <= now()
          )
        );
      END IF;

      RAISE EXCEPTION 'refresh_required';
    END IF;

    INSERT INTO public.device_licenses (
      user_id,
      device_id,
      license_key,
      short_code,
      issued_at,
      expires_at,
      revoked,
      refresh_count,
      last_refreshed_at,
      updated_at
    ) VALUES (
      p_user_id,
      p_device_id,
      p_license_key,
      p_short_code,
      p_issued_at,
      p_expires_at,
      false,
      0,
      NULL,
      now()
    );

    RETURN jsonb_build_object(
      'action', 'created',
      'device_id', p_device_id,
      'license_key', p_license_key,
      'short_code', p_short_code,
      'issued_at', p_issued_at,
      'expires_at', p_expires_at,
      'can_refresh', false
    );
  END IF;

  -- refresh mode
  IF NOT FOUND THEN
    RAISE EXCEPTION 'no_license_to_refresh';
  END IF;

  IF v_existing.device_id <> p_device_id THEN
    RAISE EXCEPTION 'device_mismatch';
  END IF;

  IF v_existing.revoked THEN
    RAISE EXCEPTION 'license_revoked';
  END IF;

  IF v_existing.expires_at > now()
     AND v_sub_expires <= v_existing.expires_at + interval '1 minute' THEN
    RAISE EXCEPTION 'refresh_not_needed';
  END IF;

  IF v_existing.last_refreshed_at IS NOT NULL
     AND v_existing.last_refreshed_at > now() - interval '1 minute' THEN
    RAISE EXCEPTION 'refresh_rate_limited';
  END IF;

  UPDATE public.device_licenses
  SET
    license_key = p_license_key,
    short_code = p_short_code,
    issued_at = p_issued_at,
    expires_at = p_expires_at,
    revoked = false,
    refresh_count = COALESCE(refresh_count, 0) + 1,
    last_refreshed_at = now(),
    updated_at = now()
  WHERE user_id = p_user_id;

  RETURN jsonb_build_object(
    'action', 'refreshed',
    'device_id', p_device_id,
    'license_key', p_license_key,
    'short_code', p_short_code,
    'issued_at', p_issued_at,
    'expires_at', p_expires_at,
    'can_refresh', false
  );
END;
$$;

REVOKE ALL ON FUNCTION public.save_device_license(uuid, text, text, text, timestamptz, timestamptz, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.save_device_license(uuid, text, text, text, timestamptz, timestamptz, text) TO service_role;

COMMENT ON FUNCTION public.save_device_license IS
  'Edge Function (service_role) orqali litsenziya yaratish/yangilash. PRO muddatini get_user_access_state orqali tekshiradi.';
