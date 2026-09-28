-- To'lov hisobotlari (Telegram admin bot) va to'lov xabari — Payme + Click.
-- Supabase migratsiyasi: payment_reports_payme_click

-- ── Yagona manba: to'langan to'lovlar ikkala tizimdan ───────────────────────
-- Kun to'lov vaqti (perform_time) bo'yicha olinadi — yozuv yaratilgan vaqt
-- emas: buyurtma 23:59 da ochilib, 00:00 dan keyin to'lansa, keyingi kunga
-- tushishi kerak.
create or replace function public.admin_paid_payments()
returns table(
  tizim text, user_id uuid, account_email text, plan_name text,
  amount_tiyin bigint, paid_at timestamptz
)
language sql
stable
set search_path = public
as $function$
  select 'Payme'::text, p.user_id, p.account_email, p.plan_name, p.amount_tiyin,
         coalesce(to_timestamp(nullif(p.perform_time, 0) / 1000.0), p.created_at)
  from public.payme_transactions p
  where p.state = 2
  union all
  select 'Click'::text, c.user_id, c.account_email, c.plan_name, c.amount_tiyin,
         coalesce(to_timestamp(nullif(c.perform_time, 0) / 1000.0), c.created_at)
  from public.click_transactions c
  where c.state = 2;
$function$;

-- Qaytariladigan ustunlar o'zgargani uchun DROP shart (CREATE OR REPLACE
-- bunga yo'l qo'ymaydi). DROP ruxsatlarni ham o'chiradi — pastda qayta beriladi.
drop function if exists public.admin_payment_stats();
drop function if exists public.admin_payment_daily(integer);
drop function if exists public.admin_payment_recent(integer);

create function public.admin_payment_stats()
returns table(
  davr text, tartib integer, tolov bigint, som bigint, userlar bigint,
  payme_tolov bigint, payme_som bigint, click_tolov bigint, click_som bigint
)
language sql
stable
security definer
set search_path = public
as $function$
  with t as (
    select tizim, user_id, amount_tiyin,
           (paid_at at time zone 'Asia/Tashkent')::date as kun
    from public.admin_paid_payments()
  ),
  b as (select (now() at time zone 'Asia/Tashkent')::date as d),
  davrlar(davr, tartib) as (
    values ('Bugun', 1), ('Kecha', 2), ('Oxirgi 7 kun', 3),
           ('Shu oy', 4), ('O''tgan oy', 5), ('Jami', 6)
  )
  select dv.davr, dv.tartib,
         count(t.kun),
         (coalesce(sum(t.amount_tiyin), 0) / 100)::bigint,
         count(distinct t.user_id),
         count(t.kun) filter (where t.tizim = 'Payme'),
         (coalesce(sum(t.amount_tiyin) filter (where t.tizim = 'Payme'), 0) / 100)::bigint,
         count(t.kun) filter (where t.tizim = 'Click'),
         (coalesce(sum(t.amount_tiyin) filter (where t.tizim = 'Click'), 0) / 100)::bigint
  from davrlar dv
  cross join b
  left join t on case dv.tartib
    when 1 then t.kun = b.d
    when 2 then t.kun = b.d - 1
    when 3 then t.kun > b.d - 7
    when 4 then date_trunc('month', t.kun) = date_trunc('month', b.d)
    when 5 then date_trunc('month', t.kun) = date_trunc('month', b.d) - interval '1 month'
    else true
  end
  group by dv.davr, dv.tartib
  order by dv.tartib;
$function$;

create function public.admin_payment_daily(p_days integer default 7)
returns table(
  kun date, tolov bigint, som bigint,
  payme_tolov bigint, payme_som bigint, click_tolov bigint, click_som bigint
)
language sql
stable
security definer
set search_path = public
as $function$
  select (paid_at at time zone 'Asia/Tashkent')::date,
         count(*),
         (coalesce(sum(amount_tiyin), 0) / 100)::bigint,
         count(*) filter (where tizim = 'Payme'),
         (coalesce(sum(amount_tiyin) filter (where tizim = 'Payme'), 0) / 100)::bigint,
         count(*) filter (where tizim = 'Click'),
         (coalesce(sum(amount_tiyin) filter (where tizim = 'Click'), 0) / 100)::bigint
  from public.admin_paid_payments()
  where (paid_at at time zone 'Asia/Tashkent')::date
        > (now() at time zone 'Asia/Tashkent')::date - greatest(p_days, 1)
  group by 1
  order by 1 desc;
$function$;

create function public.admin_payment_recent(p_limit integer default 10)
returns table(sana timestamptz, email text, tarif text, som bigint, tizim text)
language sql
stable
security definer
set search_path = public
as $function$
  select paid_at, account_email, plan_name, amount_tiyin / 100, tizim
  from public.admin_paid_payments()
  order by paid_at desc
  limit least(greatest(p_limit, 1), 50);
$function$;

-- Supabase har yangi funksiyani anon/authenticated ga ochadi — yopamiz.
revoke all on function public.admin_paid_payments() from public, anon, authenticated;
revoke all on function public.admin_payment_stats() from public, anon, authenticated;
revoke all on function public.admin_payment_daily(integer) from public, anon, authenticated;
revoke all on function public.admin_payment_recent(integer) from public, anon, authenticated;
grant execute on function public.admin_payment_stats() to service_role;
grant execute on function public.admin_payment_daily(integer) to service_role;
grant execute on function public.admin_payment_recent(integer) to service_role;

-- ── To'lov xabari: qaysi tizimdan kelgani ───────────────────────────────────
-- Bitta trigger funksiyasi ikkala jadvalga ulangan
-- (trg_notify_telegram_on_payment_* va trg_notify_telegram_on_click_payment),
-- tizim jadval nomidan aniqlanadi.
create or replace function public.notify_telegram_on_payment()
returns trigger
language plpgsql
security definer
set search_path = public
as $function$
declare
  v_service_key text;
begin
  select decrypted_secret into v_service_key
  from vault.decrypted_secrets
  where name = 'db_webhook_service_key';

  perform net.http_post(
    url := 'https://lvdndseuobzbgzrarygu.supabase.co/functions/v1/telegram-payment-notify',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || v_service_key
    ),
    body := jsonb_build_object(
      'record', jsonb_build_object(
        'provider', case tg_table_name
                      when 'click_transactions' then 'Click'
                      when 'payme_transactions' then 'Payme'
                      else tg_table_name
                    end,
        'account_email', new.account_email,
        'amount_tiyin', new.amount_tiyin,
        'plan_name', new.plan_name,
        'perform_time', new.perform_time
      )
    )
  );
  return new;
end;
$function$;
