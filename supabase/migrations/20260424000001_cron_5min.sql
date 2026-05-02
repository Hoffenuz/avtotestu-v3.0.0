-- Change trial expiry cron job from every 1 minute to every 5 minutes.
-- This reduces server load with no practical difference for users
-- (trial accuracy is still within 5 minutes, enforced by expires_at on the DB side).

-- Remove old 1-minute schedule if it exists
SELECT cron.unschedule('expire-trials-every-minute');

-- Add 5-minute schedule
SELECT cron.schedule(
  'expire-trials-every-5min',
  '*/5 * * * *',
  $$SELECT expire_old_trials_and_subscriptions()$$
);
