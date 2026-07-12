-- ============================================================
-- Fix: anonymous review rate-limit was grouping all null
-- user_ids into one shared bucket (NULL IS NOT DISTINCT FROM NULL).
-- Solution: track submitter_ip for anonymous submissions and
-- rate-limit by IP instead of user_id when user is not logged in.
-- ============================================================

-- Add IP column for anonymous rate-limiting.
-- Populated automatically by the trigger using inet_client_addr()
-- so the client never needs to send it explicitly.
ALTER TABLE public.reviews
  ADD COLUMN IF NOT EXISTS submitter_ip TEXT;

-- Replace the trigger function with IP-aware logic.
-- For anonymous submissions, inet_client_addr() is used to get the
-- client IP directly in the DB — no client input required.
CREATE OR REPLACE FUNCTION public.enforce_review_rate_limit()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_count INTEGER;
  v_client_ip TEXT;
BEGIN
  -- Always capture client IP server-side (ignore any client-supplied value)
  v_client_ip := inet_client_addr()::TEXT;
  NEW.submitter_ip := v_client_ip;

  IF NEW.user_id IS NOT NULL THEN
    -- Authenticated user: rate-limit by user_id
    SELECT COUNT(*)
      INTO v_count
    FROM public.reviews r
    WHERE r.user_id = NEW.user_id
      AND r.created_at >= now() - interval '24 hours';
  ELSIF v_client_ip IS NOT NULL THEN
    -- Anonymous with IP: rate-limit by IP
    SELECT COUNT(*)
      INTO v_count
    FROM public.reviews r
    WHERE r.user_id IS NULL
      AND r.submitter_ip = v_client_ip
      AND r.created_at >= now() - interval '24 hours';
  ELSE
    -- No identifier available: allow
    RETURN NEW;
  END IF;

  IF v_count >= 3 THEN
    RAISE EXCEPTION 'review_rate_limit_exceeded';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_review_rate_limit ON public.reviews;
CREATE TRIGGER trg_enforce_review_rate_limit
BEFORE INSERT ON public.reviews
FOR EACH ROW
EXECUTE FUNCTION public.enforce_review_rate_limit();

CREATE INDEX IF NOT EXISTS idx_reviews_user_created_at
  ON public.reviews (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_reviews_submitter_ip_created_at
  ON public.reviews (submitter_ip, created_at DESC)
  WHERE user_id IS NULL;
