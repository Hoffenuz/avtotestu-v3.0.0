-- device_licenses — offline desktop ilova uchun imzolangan litsenziya kalitlari
-- Faqat Edge Function (service_role) yozadi; foydalanuvchi faqat o'zinikini o'qiydi.

CREATE TABLE IF NOT EXISTS public.device_licenses (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  device_id    TEXT NOT NULL,
  license_key  TEXT NOT NULL,
  short_code   TEXT NOT NULL,
  issued_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at   TIMESTAMPTZ NOT NULL,
  revoked      BOOLEAN NOT NULL DEFAULT false,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

COMMENT ON TABLE public.device_licenses IS
  'Offline desktop ilova uchun imzolangan (Ed25519) litsenziya kalitlari. Faqat Edge Function (service_role) yozadi.';

CREATE UNIQUE INDEX IF NOT EXISTS device_licenses_user_device_uidx
  ON public.device_licenses (user_id, device_id);

CREATE INDEX IF NOT EXISTS device_licenses_user_idx
  ON public.device_licenses (user_id);

ALTER TABLE public.device_licenses ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "read own licenses" ON public.device_licenses;
CREATE POLICY "read own licenses"
  ON public.device_licenses FOR SELECT
  USING (auth.uid() = user_id);
