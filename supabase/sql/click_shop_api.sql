-- ============================================================================
-- CLICK SHOP API — Prepare / Complete (baza qismi)
-- https://docs.click.uz/en/shop-api/requests
-- https://docs.click.uz/en/shop-api/errors
-- ----------------------------------------------------------------------------
-- Supabase migratsiyasi: `click_shop_api` (MCP apply_migration orqali).
--
-- Oqim:
--   1. Frontend `click_create_order(plan)` — buyurtma (state 0). Summa va
--      muddat `payme_plans` dan olinadi, klient summani belgilamaydi.
--   2. CLICK → `click` Edge Function → imzo `click_verify_sign` bilan
--      tekshiriladi → `click_prepare` (state 1).
--   3. CLICK → `click_complete` → PRO beriladi (state 2). PRO berish qoidasi
--      `payme_perform_transaction` bilan AYNAN bir xil (`click_grant_pro`).
--
-- Holatlar (shablondagi TransactionState bilan bir xil):
--    0 yaratildi | 1 Prepare o'tdi | 2 to'landi | -1 kutishda bekor | -2 to'langandan keyin bekor
--
-- Xavfsizlik:
--   * Faqat YANGI obyektlar. Mavjud jadval/funksiya/ma'lumot o'zgarmaydi.
--   * SECRET_KEY faqat Vault da:
--       select vault.create_secret('<SECRET_KEY>', 'click_secret_key');
--   * click_create_order — authenticated; qolganlari faqat service_role.
-- ============================================================================

-- ── Jadval ──────────────────────────────────────────────────────────────────

create table if not exists public.click_transactions (
  -- merchant_prepare_id va merchant_confirm_id (CLICK int kutadi)
  id                   bigint generated always as identity primary key,
  -- merchant_trans_id — to'lov havolasidagi transaction_param
  order_id             uuid        not null default gen_random_uuid() unique,
  -- FK yo'q (ataylab): hisob o'chirilsa ham moliyaviy yozuv saqlanadi
  user_id              uuid        not null,
  account_email        text        not null default '',
  plan_name            text        not null,
  tariff_days          integer     not null check (tariff_days > 0),
  amount_tiyin         bigint      not null check (amount_tiyin > 0),
  state                smallint    not null default 0 check (state in (0, 1, 2, -1, -2)),
  click_trans_id       bigint      unique,
  click_paydoc_id      bigint,
  -- CLICK yuborgan xato (Complete da error < 0 bo'lsa)
  click_error          integer,
  click_error_note     text,
  -- Bekor qilish sababi (click_cancel_order)
  reason               smallint,
  -- Vaqtlar millisekundda — payme_transactions bilan bir xil format
  create_time          bigint      not null,
  prepare_time         bigint      not null default 0,
  perform_time         bigint      not null default 0,
  cancel_time          bigint      not null default 0,
  subscription_id      uuid        references public.subscriptions(id) on delete set null,
  -- PRO berilishidan oldingi holat — bekor qilinganda qaytariladi
  prev_tariff_days     integer,
  prev_tariff_end_date timestamptz,
  created_at           timestamptz not null default now()
);

comment on table public.click_transactions is
  'CLICK SHOP API buyurtmalari. Faqat click_* SECURITY DEFINER funksiyalari va service_role orqali.';

create index if not exists click_transactions_user_created_idx
  on public.click_transactions (user_id, created_at desc);
create index if not exists click_transactions_subscription_idx
  on public.click_transactions (subscription_id);

alter table public.click_transactions enable row level security;
-- Siyosat YO'Q: anon/authenticated umuman kira olmaydi.
revoke all on public.click_transactions from anon, authenticated;

-- ── Imzo (shablondagi utils/click-check.js) ─────────────────────────────────
-- Prepare:  md5(click_trans_id + service_id + SECRET_KEY + merchant_trans_id + amount + action + sign_time)
-- Complete: md5(click_trans_id + service_id + SECRET_KEY + merchant_trans_id + merchant_prepare_id + amount + action + sign_time)
-- Prepare da p_merchant_prepare_id = ''. Kalit sozlanmagan bo'lsa NULL.

create or replace function public.click_verify_sign(
  p_click_trans_id      text,
  p_service_id          text,
  p_merchant_trans_id   text,
  p_merchant_prepare_id text,
  p_amount              text,
  p_action              text,
  p_sign_time           text,
  p_sign_string         text
)
returns boolean
language plpgsql
stable
security definer
set search_path to 'public'
as $function$
declare
  v_key text;
begin
  select decrypted_secret into v_key
  from vault.decrypted_secrets
  where name = 'click_secret_key'
  limit 1;

  if v_key is null or v_key = '' then
    return null;
  end if;

  return p_sign_string is not null
     and lower(p_sign_string) = md5(
           coalesce(p_click_trans_id, '') || coalesce(p_service_id, '') || v_key ||
           coalesce(p_merchant_trans_id, '') || coalesce(p_merchant_prepare_id, '') ||
           coalesce(p_amount, '') || coalesce(p_action, '') || coalesce(p_sign_time, '')
         );
end;
$function$;

-- ── Payme bilan umumiy PRO qoidalari ────────────────────────────────────────

-- Faol PRO — payme_resolve_account dagi "already_paid" sharti bilan bir xil.
create or replace function public.click_has_active_pro(p_user_id uuid)
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $function$
  select exists (
           select 1 from public.profiles
           where id = p_user_id
             and tariff_end_date is not null
             and tariff_end_date > now()
         )
      or exists (
           select 1 from public.subscriptions
           where user_id = p_user_id
             and is_trial = false
             and status = 'active'
             and coalesce(expires_at, ends_at) > now()
         );
$function$;

-- PRO berish — payme_perform_transaction dagi mantiq bilan bir xil:
-- faol obuna ustiga qo'shiladi, Toshkent vaqti bo'yicha kun oxirigacha.
create or replace function public.click_grant_pro(
  p_user_id      uuid,
  p_plan_name    text,
  p_tariff_days  integer,
  p_amount_tiyin bigint,
  p_note         text
)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_prof    record;
  v_sub_id  uuid;
  v_base    timestamptz;
  v_new_end timestamptz;
begin
  select id, tariff_days, tariff_end_date into v_prof
  from public.profiles where id = p_user_id for update;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'user_not_found');
  end if;

  v_base := greatest(now(), coalesce(v_prof.tariff_end_date, now()));

  -- AVVAL N kun qo'shiladi, SO'NG kun oxirigacha yaxlitlanadi.
  v_new_end :=
      date_trunc(
        'day',
        (v_base + (p_tariff_days * interval '1 day')) at time zone 'Asia/Tashkent'
      ) at time zone 'Asia/Tashkent'
      + interval '1 day'
      - interval '1 second';

  insert into public.subscriptions (
    user_id, plan_name, status, tariff_days, amount, currency,
    started_at, ends_at, expires_at, is_trial, note
  ) values (
    p_user_id, p_plan_name, 'active', p_tariff_days,
    p_amount_tiyin / 100.0, 'UZS',
    now(), v_new_end, v_new_end, false,
    p_note
  )
  returning id into v_sub_id;

  update public.profiles
  set tariff_days     = p_tariff_days,
      tariff_end_date = v_new_end,
      updated_at      = now()
  where id = p_user_id;

  return jsonb_build_object(
    'ok',                   true,
    'subscription_id',      v_sub_id,
    'tariff_end_date',      v_new_end,
    'prev_tariff_days',     v_prof.tariff_days,
    'prev_tariff_end_date', v_prof.tariff_end_date
  );
end;
$function$;

-- ── Buyurtma yaratish (frontend, authenticated) ─────────────────────────────

create or replace function public.click_create_order(p_plan_name text)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_uid    uuid := auth.uid();
  v_email  text;
  v_plan   record;
  v_recent integer;
  v_row    public.click_transactions%rowtype;
begin
  if v_uid is null then
    return jsonb_build_object('ok', false, 'error', 'unauthorized');
  end if;

  select email into v_email from public.profiles where id = v_uid;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'user_not_found');
  end if;

  select amount_tiyin, tariff_days, plan_name into v_plan
  from public.payme_plans
  where plan_name = p_plan_name and is_active = true;
  if not found then
    return jsonb_build_object('ok', false, 'error', 'plan_not_found');
  end if;

  if public.click_has_active_pro(v_uid) then
    return jsonb_build_object('ok', false, 'error', 'already_paid');
  end if;

  -- Suiiste'molga qarshi: bir soatda 20 tadan ortiq buyurtma yaratilmaydi.
  select count(*) into v_recent
  from public.click_transactions
  where user_id = v_uid and created_at > now() - interval '1 hour';
  if v_recent >= 20 then
    return jsonb_build_object('ok', false, 'error', 'too_many_orders');
  end if;

  insert into public.click_transactions (
    user_id, account_email, plan_name, tariff_days, amount_tiyin, create_time
  ) values (
    v_uid, lower(coalesce(v_email, '')), v_plan.plan_name, v_plan.tariff_days,
    v_plan.amount_tiyin, (extract(epoch from now()) * 1000)::bigint
  )
  returning * into v_row;

  return jsonb_build_object(
    'ok',           true,
    'order_id',     v_row.order_id,
    'amount_tiyin', v_row.amount_tiyin
  );
end;
$function$;

-- ── Prepare (action = 0) ────────────────────────────────────────────────────
-- Imzo, action va service_id Edge Function da tekshirilgan. Bu yerda — buyurtma
-- holati. Qaytaradi: {error} yoki {error: 0, merchant_prepare_id}.

create or replace function public.click_prepare(
  p_click_trans_id    bigint,
  p_click_paydoc_id   bigint,
  p_merchant_trans_id text,
  p_amount            text,
  p_error             integer
)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_order  public.click_transactions%rowtype;
  v_now_ms bigint := (extract(epoch from now()) * 1000)::bigint;
begin
  if coalesce(p_merchant_trans_id, '') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    return jsonb_build_object('error', -5);
  end if;

  select * into v_order
  from public.click_transactions
  where order_id = p_merchant_trans_id::uuid
  for update;

  if not found then
    return jsonb_build_object('error', -5);
  end if;

  if v_order.state = 2 then
    return jsonb_build_object('error', -4);
  end if;
  if v_order.state < 0 then
    return jsonb_build_object('error', -9);
  end if;

  -- Hujjat: CLICK manfiy xato yuborsa — to'lov bekor qilinadi va -9 qaytadi.
  if p_error < 0 then
    if v_order.click_trans_id is null or v_order.click_trans_id = p_click_trans_id then
      update public.click_transactions
      set state       = -1,
          cancel_time = v_now_ms,
          click_error = p_error
      where id = v_order.id;
    end if;
    return jsonb_build_object('error', -9);
  end if;

  if v_order.state = 1 then
    -- Xuddi shu Prepare qayta keldi — idempotent javob.
    if v_order.click_trans_id = p_click_trans_id then
      return jsonb_build_object('error', 0, 'merchant_prepare_id', v_order.id);
    end if;
    -- Buyurtma boshqa CLICK to'lovi bilan band — ikkinchi marta yechilmasin.
    return jsonb_build_object('error', -4);
  end if;

  if coalesce(p_amount, '') !~ '^\d{1,12}(\.\d{1,2})?$'
     or p_amount::numeric * 100 <> v_order.amount_tiyin then
    return jsonb_build_object('error', -2);
  end if;

  if not exists (select 1 from public.profiles where id = v_order.user_id) then
    return jsonb_build_object('error', -5);
  end if;

  -- Buyurtmadan keyin boshqa yo'l bilan (masalan Payme) PRO olingan bo'lsa.
  -- Prepare bosqichida pul hali yechilmagan — rad etish xavfsiz.
  if public.click_has_active_pro(v_order.user_id) then
    return jsonb_build_object('error', -4);
  end if;

  if exists (
    select 1 from public.click_transactions
    where click_trans_id = p_click_trans_id and id <> v_order.id
  ) then
    return jsonb_build_object('error', -8);
  end if;

  update public.click_transactions
  set state           = 1,
      click_trans_id  = p_click_trans_id,
      click_paydoc_id = p_click_paydoc_id,
      prepare_time    = v_now_ms
  where id = v_order.id;

  return jsonb_build_object('error', 0, 'merchant_prepare_id', v_order.id);
end;
$function$;

-- ── Complete (action = 1) ───────────────────────────────────────────────────
-- Hujjat: Prepare muvaffaqiyatli bo'lib pul yechilgach, Complete ga faqat
-- -4 (avval tasdiqlangan) yoki -9 (avval bekor qilingan) xatosi qaytishi
-- mumkin. Shuning uchun bu yerda faol PRO tekshirilmaydi — muddat qo'shiladi.

create or replace function public.click_complete(
  p_click_trans_id      bigint,
  p_click_paydoc_id     bigint,
  p_merchant_trans_id   text,
  p_merchant_prepare_id bigint,
  p_amount              text,
  p_error               integer,
  p_error_note          text
)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_order  public.click_transactions%rowtype;
  v_grant  jsonb;
  v_now_ms bigint := (extract(epoch from now()) * 1000)::bigint;
begin
  if coalesce(p_merchant_trans_id, '') !~* '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$' then
    return jsonb_build_object('error', -5);
  end if;

  select * into v_order
  from public.click_transactions
  where order_id = p_merchant_trans_id::uuid
  for update;

  if not found then
    return jsonb_build_object('error', -5);
  end if;

  -- Prepare da berilgan ID va shu CLICK tranzaksiyasi bo'lishi shart.
  if v_order.id <> p_merchant_prepare_id
     or v_order.click_trans_id is distinct from p_click_trans_id then
    return jsonb_build_object('error', -6);
  end if;

  if v_order.state = 2 then
    return jsonb_build_object('error', -4);
  end if;
  if v_order.state < 0 then
    return jsonb_build_object('error', -9);
  end if;

  -- CLICK pul yechilmaganini bildirdi — buyurtma bekor, -9.
  if p_error < 0 then
    update public.click_transactions
    set state            = -1,
        cancel_time      = v_now_ms,
        click_error      = p_error,
        click_error_note = left(p_error_note, 500)
    where id = v_order.id;
    return jsonb_build_object('error', -9);
  end if;

  if coalesce(p_amount, '') !~ '^\d{1,12}(\.\d{1,2})?$'
     or p_amount::numeric * 100 <> v_order.amount_tiyin then
    return jsonb_build_object('error', -2);
  end if;

  v_grant := public.click_grant_pro(
    v_order.user_id, v_order.plan_name, v_order.tariff_days, v_order.amount_tiyin,
    'Click: ' || p_click_trans_id
  );
  if not (v_grant->>'ok')::boolean then
    return jsonb_build_object('error', -5);
  end if;

  update public.click_transactions
  set state                = 2,
      perform_time         = v_now_ms,
      subscription_id      = (v_grant->>'subscription_id')::uuid,
      prev_tariff_days     = (v_grant->>'prev_tariff_days')::integer,
      prev_tariff_end_date = (v_grant->>'prev_tariff_end_date')::timestamptz
  where id = v_order.id;

  return jsonb_build_object('error', 0, 'merchant_confirm_id', v_order.id);
end;
$function$;

-- ── Bekor qilish (admin uchun, keyinroq ulanadi) ────────────────────────────
-- payme_cancel_transaction bilan bir xil: to'langan buyurtma bekor qilinsa
-- PRO avvalgi holatiga qaytariladi. CLICK dagi pulni qaytarish (reversal)
-- alohida — Merchant API orqali bajariladi.

create or replace function public.click_cancel_order(
  p_order_id uuid,
  p_reason   smallint default null
)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_row       public.click_transactions%rowtype;
  v_new_state smallint;
  v_now_ms    bigint := (extract(epoch from now()) * 1000)::bigint;
begin
  select * into v_row from public.click_transactions
  where order_id = p_order_id for update;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'order_not_found');
  end if;

  if v_row.state < 0 then
    return jsonb_build_object('ok', true, 'state', v_row.state, 'cancel_time', v_row.cancel_time);
  end if;

  v_new_state := case when v_row.state = 2 then -2 else -1 end;

  if v_row.state = 2 then
    update public.profiles
    set tariff_days     = coalesce(v_row.prev_tariff_days, 0),
        tariff_end_date = v_row.prev_tariff_end_date,
        updated_at      = now()
    where id = v_row.user_id;

    if v_row.subscription_id is not null then
      update public.subscriptions
      set status     = 'cancelled',
          ends_at    = now(),
          expires_at = now(),
          updated_at = now()
      where id = v_row.subscription_id;
    end if;
  end if;

  update public.click_transactions
  set state       = v_new_state,
      reason      = p_reason,
      cancel_time = v_now_ms
  where id = v_row.id;

  return jsonb_build_object('ok', true, 'state', v_new_state, 'cancel_time', v_now_ms);
end;
$function$;

-- ── Telegram xabari (mavjud notify_telegram_on_payment qayta ishlatiladi) ───

drop trigger if exists trg_notify_telegram_on_click_payment on public.click_transactions;
create trigger trg_notify_telegram_on_click_payment
  after update on public.click_transactions
  for each row
  when (new.state = 2 and old.state is distinct from 2)
  execute function public.notify_telegram_on_payment();

-- ── Ruxsatlar ───────────────────────────────────────────────────────────────
-- Supabase default privileges har bir yangi funksiyani anon/authenticated ga
-- ochadi — shuning uchun HAR BIRI aniq yopiladi.

revoke execute on function public.click_verify_sign(text, text, text, text, text, text, text, text) from public, anon, authenticated;
revoke execute on function public.click_has_active_pro(uuid)                                       from public, anon, authenticated;
revoke execute on function public.click_grant_pro(uuid, text, integer, bigint, text)               from public, anon, authenticated;
revoke execute on function public.click_prepare(bigint, bigint, text, text, integer)               from public, anon, authenticated;
revoke execute on function public.click_complete(bigint, bigint, text, bigint, text, integer, text) from public, anon, authenticated;
revoke execute on function public.click_cancel_order(uuid, smallint)                               from public, anon, authenticated;
revoke execute on function public.click_create_order(text)                                         from public, anon;

grant execute on function public.click_verify_sign(text, text, text, text, text, text, text, text) to service_role;
grant execute on function public.click_prepare(bigint, bigint, text, text, integer)               to service_role;
grant execute on function public.click_complete(bigint, bigint, text, bigint, text, integer, text) to service_role;
grant execute on function public.click_cancel_order(uuid, smallint)                               to service_role;
grant execute on function public.click_create_order(text)                                         to authenticated;
