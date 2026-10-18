-- 2-bosqich: o'lchov (2.1, 2.3) va log hajmini kamaytirish — docs/REJA-2-BOSQICH-2026-10-18.md
--
--   1. get_section_counts()   — "Xatolarim"/"Saqlangan" sonlari bitta so'rovda (frontend eski
--                               usulga qaytadi, agar funksiya bo'lmasa — tartib muhim emas).
--   2. admin_panel_weekly(n)  — oxirgi n hafta (Toshkent, dushanbadan): to'lovlar, tushum,
--                               yangi/qayta xaridor, faol PRO ustiga uzaytirish, refund,
--                               ro'yxatdan o'tganlar va ulardan 7 kunda to'laganlar.
--   3. admin_panel_overview() — o'zgarishsiz + 'weekly' kaliti (admin-panel edge function
--                               qayta deploy qilinmaydi).
--
-- Faqat o'qish funksiyalari; to'lov oqimiga tegilmaydi. Qayta ishga tushirish xavfsiz.

-- ── 1. Bo'limlar sonlari ───────────────────────────────────────────────────
create or replace function public.get_section_counts()
returns jsonb
language sql
stable
security invoker
set search_path to 'public'
as $$
  select jsonb_build_object(
    'wrong', count(*) filter (where wrong_count > 0),
    'saved', count(*) filter (where saved)
  )
  from public.user_question_state
  where user_id = (select auth.uid());
$$;

revoke all on function public.get_section_counts() from public, anon;
grant execute on function public.get_section_counts() to authenticated;

-- ── 2. Haftalik ko'rsatkichlar ─────────────────────────────────────────────
create or replace function public.admin_panel_weekly(p_weeks integer default 8)
returns jsonb
language sql
stable
security definer
set search_path to 'public'
as $$
  with b as (
    select date_trunc('week', (now() at time zone 'Asia/Tashkent'))::date as this_week,
           greatest(1, least(coalesce(p_weeks, 8), 52)) as n
  ),
  weeks as (
    select (b.this_week - (i * 7))::date as wk
    from b, generate_series(0, b.n - 1) as i
  ),
  -- Yakunlangan (bekor qilinmagan) to'lovlar; prev_tariff_end_date > to'lov vaqti = faol PRO ustiga.
  tx as (
    select user_id, amount_tiyin,
           coalesce(to_timestamp(nullif(perform_time, 0) / 1000.0), created_at) as paid_at,
           prev_tariff_end_date
    from public.payme_transactions where state = 2
    union all
    select user_id, amount_tiyin,
           coalesce(to_timestamp(nullif(perform_time, 0) / 1000.0), created_at),
           prev_tariff_end_date
    from public.click_transactions where state = 2
  ),
  ranked as (
    select tx.*,
           row_number() over (partition by user_id order by paid_at) as rn,
           date_trunc('week', paid_at at time zone 'Asia/Tashkent')::date as wk
    from tx
  ),
  refunds as (
    select date_trunc('week', to_timestamp(cancel_time / 1000.0) at time zone 'Asia/Tashkent')::date as wk
    from public.payme_transactions where state = -2 and cancel_time > 0
    union all
    select date_trunc('week', to_timestamp(cancel_time / 1000.0) at time zone 'Asia/Tashkent')::date
    from public.click_transactions where state = -2 and cancel_time > 0
  ),
  signups as (
    select p.id, p.created_at,
           date_trunc('week', p.created_at at time zone 'Asia/Tashkent')::date as wk
    from public.profiles p, b
    where p.created_at >= ((b.this_week - (b.n * 7))::timestamp at time zone 'Asia/Tashkent')
  )
  select coalesce(jsonb_agg(row_data order by wk desc), '[]'::jsonb)
  from (
    select w.wk,
      jsonb_build_object(
        'week_start',       w.wk,
        'payments',         (select count(*) from ranked r where r.wk = w.wk),
        'revenue_som',      (select (coalesce(sum(amount_tiyin), 0) / 100)::bigint from ranked r where r.wk = w.wk),
        'buyers',           (select count(distinct user_id) from ranked r where r.wk = w.wk),
        'new_buyers',       (select count(*) from ranked r where r.wk = w.wk and r.rn = 1),
        'repeat_payments',  (select count(*) from ranked r where r.wk = w.wk and r.rn > 1),
        'renewals_active',  (select count(*) from ranked r where r.wk = w.wk and r.prev_tariff_end_date > r.paid_at),
        'refunds',          (select count(*) from refunds f where f.wk = w.wk),
        'signups',          (select count(*) from signups s where s.wk = w.wk),
        'signup_paid_7d',   (select count(*) from signups s
                             where s.wk = w.wk
                               and exists (select 1 from tx where tx.user_id = s.id
                                             and tx.paid_at >= s.created_at
                                             and tx.paid_at <  s.created_at + interval '7 days'))
      ) as row_data
    from weeks w
  ) x;
$$;

revoke all on function public.admin_panel_weekly(integer) from public, anon, authenticated;

-- ── 3. Overview + weekly ───────────────────────────────────────────────────
create or replace function public.admin_panel_overview()
returns jsonb
language sql
stable
security definer
set search_path to 'public'
as $function$
  with b as (
    select (now() at time zone 'Asia/Tashkent')::date as d, now() as n
  ),
  pay as (
    select tizim, user_id, amount_tiyin, paid_at, plan_name,
           (paid_at at time zone 'Asia/Tashkent')::date as kun
    from public.admin_paid_payments()
  ),
  first_pay as (
    select user_id, min(paid_at) as fp, count(*) as cnt
    from pay where user_id is not null group by user_id
  ),
  prof as (
    select id, (created_at at time zone 'Asia/Tashkent')::date as kun,
           tariff_days, tariff_end_date, telegram_id
    from public.profiles
  )
  select jsonb_build_object(
    'generated_at', (select n from b),
    'today', (select d from b),
    'users', (
      select jsonb_build_object(
        'total',           count(*),
        'new_today',       count(*) filter (where prof.kun = b.d),
        'new_yesterday',   count(*) filter (where prof.kun = b.d - 1),
        'new_7d',          count(*) filter (where prof.kun > b.d - 7),
        'new_prev_7d',     count(*) filter (where prof.kun > b.d - 14 and prof.kun <= b.d - 7),
        'new_30d',         count(*) filter (where prof.kun > b.d - 30),
        'active_pro',      count(*) filter (where coalesce(tariff_days, 0) > 0 and tariff_end_date > b.n),
        'expiring_3d',     count(*) filter (where coalesce(tariff_days, 0) > 0 and tariff_end_date > b.n
                                              and tariff_end_date <= b.n + interval '3 days'),
        'expired_pro',     count(*) filter (where coalesce(tariff_days, 0) > 0 and tariff_end_date <= b.n),
        'telegram_linked', count(*) filter (where telegram_id is not null)
      )
      from prof cross join b
    ),
    'revenue', (
      select coalesce(jsonb_agg(to_jsonb(s) order by s.tartib), '[]'::jsonb)
      from public.admin_payment_stats() s
    ),
    'payers', (
      select jsonb_build_object(
        'total',     count(*),
        'repeat',    count(*) filter (where cnt > 1),
        'new_today', count(*) filter (where (fp at time zone 'Asia/Tashkent')::date = b.d),
        'new_month', count(*) filter (where date_trunc('month', fp at time zone 'Asia/Tashkent')
                                            = date_trunc('month', b.d::timestamp))
      )
      from first_pay cross join b
    ),
    'conversion_30d', (
      select jsonb_build_object('signups', count(*), 'paid', count(fp.user_id))
      from prof cross join b
      left join first_pay fp on fp.user_id = prof.id
      where prof.kun > b.d - 30
    ),
    'plans_30d', (
      select coalesce(jsonb_agg(to_jsonb(x) order by x.som desc), '[]'::jsonb)
      from (
        select plan_name, count(*) as count, (sum(amount_tiyin) / 100)::bigint as som
        from pay cross join b
        where pay.kun > b.d - 30
        group by plan_name
      ) x
    ),
    'activity', (
      select jsonb_build_object(
        'tests_today',        count(*) filter (where (completed_at at time zone 'Asia/Tashkent')::date = b.d),
        'active_users_today', count(distinct user_id) filter (where (completed_at at time zone 'Asia/Tashkent')::date = b.d),
        'active_users_7d',    count(distinct user_id)
      )
      from public.test_results cross join b
      where completed_at >= (b.d - 6)::timestamp at time zone 'Asia/Tashkent'
    ),
    'tests_total', (select count(*) from public.test_results),
    'pending', jsonb_build_object(
      'click_open_24h', (select count(*) from public.click_transactions
                         where state in (0, 1) and created_at > now() - interval '24 hours'),
      'payme_open_24h', (select count(*) from public.payme_transactions
                         where state = 1 and created_at > now() - interval '24 hours'),
      'cancelled_7d',   (select count(*) from public.payme_transactions
                         where state in (-1, -2) and created_at > now() - interval '7 days')
                      + (select count(*) from public.click_transactions
                         where state = -1 and created_at > now() - interval '7 days')
    ),
    'manual_30d', (
      select count(*)
      from public.subscriptions s cross join b
      where not coalesce(s.is_trial, false)
        and coalesce(s.tariff_days, 0) > 0
        and coalesce(s.note, '') not like 'Payme:%'
        and coalesce(s.note, '') not like 'Click:%'
        and (s.created_at at time zone 'Asia/Tashkent')::date > b.d - 30
    ),
    'messages', (
      select jsonb_build_object(
        'total',   count(*),
        'last_7d', count(*) filter (where created_at > now() - interval '7 days')
      )
      from public.contact_messages
    ),
    'weekly', public.admin_panel_weekly(8)
  );
$function$;
