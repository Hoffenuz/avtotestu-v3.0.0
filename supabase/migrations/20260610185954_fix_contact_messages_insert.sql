-- Fix contact form: anon INSERT failed because RLS WITH CHECK ran a
-- subquery on contact_messages without anon having SELECT privilege.
-- Rate limiting belongs in the SECURITY DEFINER trigger, not RLS subqueries.

DROP POLICY IF EXISTS "Anyone can submit contact messages" ON public.contact_messages;

CREATE POLICY "Anyone can submit contact messages"
  ON public.contact_messages FOR INSERT
  WITH CHECK (
    length(trim(name)) BETWEEN 2 AND 100
    AND length(trim(subject)) BETWEEN 2 AND 200
    AND length(trim(message)) BETWEEN 5 AND 2000
    AND (phone IS NULL OR length(trim(phone)) <= 50)
  );

CREATE OR REPLACE FUNCTION public.check_contact_rate_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  v_count integer;
BEGIN
  IF auth.uid() IS NOT NULL THEN
    SELECT COUNT(*) INTO v_count
    FROM public.contact_messages
    WHERE user_id = auth.uid()
      AND created_at > now() - INTERVAL '1 hour';

    IF v_count >= 3 THEN
      RAISE EXCEPTION 'rate_limit_exceeded'
        USING HINT = '1 soatda 3 tadan ko''p xabar yuborish mumkin emas';
    END IF;
  ELSE
    SELECT COUNT(*) INTO v_count
    FROM public.contact_messages
    WHERE lower(trim(name)) = lower(trim(NEW.name))
      AND created_at > now() - INTERVAL '1 hour';

    IF v_count >= 2 THEN
      RAISE EXCEPTION 'rate_limit_exceeded'
        USING HINT = 'Iltimos biroz kuting va qayta urinib ko''ring';
    END IF;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS contact_rate_limit ON public.contact_messages;
CREATE TRIGGER contact_rate_limit
  BEFORE INSERT ON public.contact_messages
  FOR EACH ROW EXECUTE FUNCTION public.check_contact_rate_limit();

-- Anon va authenticated foydalanuvchilar forma orqali xabar yubora oladi (RLS INSERT policy).
GRANT INSERT ON public.contact_messages TO anon;
GRANT INSERT ON public.contact_messages TO authenticated;
