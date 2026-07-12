-- Bir foydalanuvchi = bitta litsenziya (qurilma va kalit o'zgarmas)

-- Dublikatlarni tozalash: har user uchun eng eski yozuv qoladi
DELETE FROM public.device_licenses dl
WHERE dl.id NOT IN (
  SELECT DISTINCT ON (user_id) id
  FROM public.device_licenses
  ORDER BY user_id, issued_at ASC
);

DROP INDEX IF EXISTS public.device_licenses_user_device_uidx;

CREATE UNIQUE INDEX IF NOT EXISTS device_licenses_user_uidx
  ON public.device_licenses (user_id);

-- Kalit berilgandan keyin o'zgartirish/o'chirish taqiqlanadi
CREATE OR REPLACE FUNCTION public.prevent_device_license_mutation()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'UPDATE' THEN
    RAISE EXCEPTION 'device_licenses: yozuvlar o''zgartirilmaydi';
  END IF;
  IF TG_OP = 'DELETE' THEN
    RAISE EXCEPTION 'device_licenses: yozuvlar o''chirilmaydi';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS device_licenses_immutable ON public.device_licenses;
CREATE TRIGGER device_licenses_immutable
  BEFORE UPDATE OR DELETE ON public.device_licenses
  FOR EACH ROW
  EXECUTE FUNCTION public.prevent_device_license_mutation();

-- Foydalanuvchi faqat o'qiydi; yozish faqat service_role (Edge Function)
REVOKE INSERT, UPDATE, DELETE ON public.device_licenses FROM authenticated, anon;

COMMENT ON TABLE public.device_licenses IS
  'Bir foydalanuvchi = bitta litsenziya. Kalit bir marta beriladi va o''zgarmaydi.';
