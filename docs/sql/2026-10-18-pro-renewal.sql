-- 1.6 (ENG-01): faol PRO'ni uzaytirish — docs/REJA-YOL-XARITASI-2026-10-18.md
--
-- Nima o'zgaradi:
--   1. Faol PRO ustiga xarid ruxsat etiladi (already_paid to'sig'i 4 joydan olinadi:
--      payme_resolve_account, click_create_order, click_prepare, payme_account_state yorlig'i).
--      Kunlar allaqachon to'g'ri qo'shiladi: GREATEST(now(), tariff_end_date) + N kun.
--   2. Himoya: jami muddat bugundan 400 kundan oshsa xarid pul olinmasdan rad etiladi ('pro_limit').
--   3. Har xarid o'zi qo'shgan oraliqni saqlaydi (grant_start, grant_end).
--   4. Bekor qilish (refund) endi xariddan oldingi sanaga QAYTARMAYDI — faqat shu xarid
--      qo'shgan kunlarni ayiradi. Aks holda A → B → A bekor bo'lsa B ning kunlari ham yo'qolardi.
--      grant_end yo'q eski (shu migratsiyadan oldingi) xaridlar uchun eski mantiq o'zgarishsiz.
--   5. Sandbox "blocked" holati endi 400 kunlik chegara orqali hosil qilinadi.
--
-- Bir tranzaksiyada qo'llanadi (apply_migration). Qayta ishga tushirish xavfsiz.

-- ── 1. Xarid oralig'i ustunlari ────────────────────────────────────────────
alter table public.payme_transactions add column if not exists grant_start timestamptz;
alter table public.payme_transactions add column if not exists grant_end   timestamptz;
alter table public.click_transactions add column if not exists grant_start timestamptz;
alter table public.click_transactions add column if not exists grant_end   timestamptz;

-- ── 2. Yordamchi: 400 kunlik chegara ───────────────────────────────────────
create or replace function public.pro_purchase_limit_exceeded(p_user_id uuid, p_days integer)
returns boolean
language sql
stable
security definer
set search_path to 'public'
as $$
  select greatest(now(), coalesce(p.tariff_end_date, now())) + (p_days * interval '1 day')
         > now() + interval '400 days'
  from public.profiles p
  where p.id = p_user_id;
$$;

revoke all on function public.pro_purchase_limit_exceeded(uuid, integer) from public, anon, authenticated;

-- ── 3. Yordamchi: xaridni bekor qilish (Payme va Click uchun umumiy) ─────────
create or replace function public.pro_revoke_purchase(
  p_user_id         uuid,
  p_subscription_id uuid,
  p_grant_start     timestamptz,
  p_grant_end       timestamptz,
  p_prev_days       integer,
  p_prev_end        timestamptz
)
returns void
language plpgsql
security definer
set search_path to 'public'
as $$
declare
  v_cur  timestamptz;
  v_new  timestamptz;
  v_end  timestamptz;
  v_days integer;
begin
  -- Eski xarid (oraliq saqlanmagan): avvalgi mantiq aynan saqlanadi.
  if p_grant_end is null or p_grant_start is null then
    update public.profiles
    set tariff_days     = coalesce(p_prev_days, 0),
        tariff_end_date = p_prev_end,
        updated_at      = now()
    where id = p_user_id;
  else
    select tariff_end_date into v_cur
    from public.profiles where id = p_user_id for update;

    if found and v_cur is not null then
      v_new := v_cur - (p_grant_end - p_grant_start);

      if v_new > now() then
        -- Keyingi xaridlar saqlanadi, faqat shu xarid oralig'i aniq ayriladi.
        -- Kun oxirigacha YAXLITLANMAYDI: aks holda bir kunda ikki xarid bekor
        -- qilinsa, shu kun oxirigacha to'lanmagan PRO qolib ketardi.
        v_end := v_new;

        update public.profiles
        set tariff_end_date = v_end,
            updated_at      = now()
        where id = p_user_id;
      else
        -- Bu xariddan tashqari to'langan muddat qolmagan: huquq olinadi.
        v_end  := case
                    when p_prev_end is null  then null
                    when p_prev_end <= now() then p_prev_end
                    else now()
                  end;
        v_days := case when v_end is null then 0 else coalesce(p_prev_days, 0) end;

        update public.profiles
        set tariff_days     = v_days,
            tariff_end_date = v_end,
            updated_at      = now()
        where id = p_user_id;
      end if;

      -- Boshqa obuna yozuvlari profil muddatidan uzun qolmasin
      -- (get_user_access_state eng uzun obunaga qaraydi).
      update public.subscriptions
      set expires_at = coalesce(v_end, now()),
          ends_at    = coalesce(v_end, now()),
          status     = case when coalesce(v_end, now()) > now() then status else 'expired' end,
          updated_at = now()
      where user_id = p_user_id
        and is_trial = false
        and status = 'active'
        and (p_subscription_id is null or id <> p_subscription_id)
        and coalesce(expires_at, ends_at) > coalesce(v_end, now());
    end if;
  end if;

  if p_subscription_id is not null then
    update public.subscriptions
    set status     = 'cancelled',
        ends_at    = now(),
        expires_at = now(),
        updated_at = now()
    where id = p_subscription_id;
  end if;
end;
$$;

revoke all on function public.pro_revoke_purchase(uuid, uuid, timestamptz, timestamptz, integer, timestamptz)
  from public, anon, authenticated;

-- ── 4. Payme: hisob tekshiruvi — already_paid olib tashlandi ────────────────
create or replace function public.payme_resolve_account(p_email text, p_exclude_payme_id text default null::text)
returns jsonb
language plpgsql
stable
security definer
set search_path to 'public'
as $function$
declare
  v_user_id    uuid;
  v_timeout_ms constant bigint := 43200000;   -- 12 soat
  v_now_ms     bigint := (extract(epoch from now()) * 1000)::bigint;
begin
  -- 1. Hisob mavjudmi?
  select id into v_user_id
  from public.profiles
  where lower(email) = lower(trim(coalesce(p_email, '')))
  limit 1;

  if v_user_id is null then
    return jsonb_build_object('ok', false, 'error', 'user_not_found');
  end if;

  -- 2. Hisob band emasmi? (boshqa tugallanmagan tranzaksiya)
  if exists (
    select 1
    from public.payme_transactions
    where user_id = v_user_id
      and state = 1
      and (v_now_ms - create_time) < v_timeout_ms
      and (p_exclude_payme_id is null or payme_id <> p_exclude_payme_id)
  ) then
    return jsonb_build_object('ok', false, 'error', 'account_busy', 'user_id', v_user_id);
  end if;

  -- Faol PRO endi to'siq emas: yangi kunlar joriy muddat oxiriga qo'shiladi.
  -- Muddat chegarasi summaga (tarif kunlariga) bog'liq — check/create da tekshiriladi.
  return jsonb_build_object('ok', true, 'user_id', v_user_id);
end;
$function$;

-- ── 5. Payme: CheckPerformTransaction — 400 kun chegarasi ──────────────────
create or replace function public.payme_check_perform_transaction(p_email text, p_amount bigint)
returns jsonb
language plpgsql
stable
security definer
set search_path to 'public'
as $function$
declare
  v_account jsonb;
  v_plan    record;
begin
  v_account := public.payme_resolve_account(p_email, null);
  if not (v_account->>'ok')::boolean then
    return v_account;
  end if;

  select tariff_days, plan_name into v_plan
  from public.payme_plans
  where amount_tiyin = p_amount and is_active = true;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'invalid_amount');
  end if;

  if public.pro_purchase_limit_exceeded((v_account->>'user_id')::uuid, v_plan.tariff_days) then
    return jsonb_build_object('ok', false, 'error', 'pro_limit', 'user_id', v_account->>'user_id');
  end if;

  return jsonb_build_object(
    'ok',          true,
    'user_id',     v_account->>'user_id',
    'tariff_days', v_plan.tariff_days,
    'plan_name',   v_plan.plan_name
  );
end;
$function$;

-- ── 6. Payme: CreateTransaction — 400 kun chegarasi ────────────────────────
create or replace function public.payme_create_transaction(p_payme_id text, p_email text, p_amount bigint, p_create_time bigint)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_account    jsonb;
  v_plan       record;
  v_row        record;
  v_timeout_ms constant bigint := 43200000;
  v_now_ms     bigint := (extract(epoch from now()) * 1000)::bigint;
begin
  perform pg_advisory_xact_lock(hashtext('payme:' || lower(trim(coalesce(p_email, '')))));

  -- Eskirgan kutilayotgan tranzaksiyalarni taymaut bo'yicha yopamiz.
  update public.payme_transactions
  set state = -1, reason = 4, cancel_time = v_now_ms
  where state = 1
    and (v_now_ms - create_time) >= v_timeout_ms;

  select * into v_row from public.payme_transactions where payme_id = p_payme_id;

  if found then
    if v_row.state <> 1 then
      return jsonb_build_object('ok', false, 'error', 'cant_do_operation');
    end if;

    if v_row.amount_tiyin <> p_amount then
      return jsonb_build_object('ok', false, 'error', 'invalid_amount');
    end if;

    return jsonb_build_object(
      'ok', true,
      'transaction_id', v_row.id,
      'create_time',    v_row.create_time,
      'state',          v_row.state
    );
  end if;

  v_account := public.payme_resolve_account(p_email, p_payme_id);
  if not (v_account->>'ok')::boolean then
    return v_account;
  end if;

  select tariff_days, plan_name into v_plan
  from public.payme_plans
  where amount_tiyin = p_amount and is_active = true;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'invalid_amount');
  end if;

  if public.pro_purchase_limit_exceeded((v_account->>'user_id')::uuid, v_plan.tariff_days) then
    return jsonb_build_object('ok', false, 'error', 'pro_limit', 'user_id', v_account->>'user_id');
  end if;

  insert into public.payme_transactions (
    payme_id, user_id, account_email, amount_tiyin, tariff_days, plan_name, create_time
  ) values (
    p_payme_id,
    (v_account->>'user_id')::uuid,
    lower(trim(p_email)),
    p_amount,
    v_plan.tariff_days,
    v_plan.plan_name,
    p_create_time
  )
  returning * into v_row;

  return jsonb_build_object(
    'ok', true,
    'transaction_id', v_row.id,
    'create_time',    v_row.create_time,
    'state',          v_row.state
  );
end;
$function$;

-- ── 7. Payme: PerformTransaction — xarid oralig'i saqlanadi ────────────────
create or replace function public.payme_perform_transaction(p_payme_id text, p_perform_time bigint)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_row         record;
  v_prof        record;
  v_sub_id      uuid;
  v_base        timestamptz;
  v_new_end     timestamptz;
  v_timeout_ms  constant bigint := 43200000;
  v_now_ms      bigint := (extract(epoch from now()) * 1000)::bigint;
begin
  select * into v_row from public.payme_transactions
  where payme_id = p_payme_id for update;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'transaction_not_found');
  end if;

  -- Idempotentlik: takroriy so'rovga o'sha javob qaytadi.
  if v_row.state = 2 then
    return jsonb_build_object(
      'ok', true,
      'transaction_id', v_row.id,
      'perform_time',   v_row.perform_time,
      'state',          v_row.state
    );
  end if;

  if v_row.state <> 1 then
    return jsonb_build_object('ok', false, 'error', 'cant_do_operation');
  end if;

  -- 12 soatlik taymaut
  if (v_now_ms - v_row.create_time) >= v_timeout_ms then
    update public.payme_transactions
    set state = -1, reason = 4, cancel_time = v_now_ms
    where id = v_row.id;
    return jsonb_build_object('ok', false, 'error', 'cant_do_operation');
  end if;

  select id, tariff_days, tariff_end_date into v_prof
  from public.profiles where id = v_row.user_id for update;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'user_not_found');
  end if;

  -- Yangi tugash sanasi: faol obuna ustiga qo'shiladi, aks holda hozirdan.
  v_base := greatest(now(), coalesce(v_prof.tariff_end_date, now()));

  -- AVVAL N kun qo'shamiz, SO'NG kun oxirigacha yaxlitlaymiz.
  v_new_end :=
      date_trunc(
        'day',
        (v_base + (v_row.tariff_days * interval '1 day')) at time zone 'Asia/Tashkent'
      ) at time zone 'Asia/Tashkent'
      + interval '1 day'
      - interval '1 second';

  insert into public.subscriptions (
    user_id, plan_name, status, tariff_days, amount, currency,
    started_at, ends_at, expires_at, is_trial, note
  ) values (
    v_row.user_id, v_row.plan_name, 'active', v_row.tariff_days,
    v_row.amount_tiyin / 100.0, 'UZS',
    now(), v_new_end, v_new_end, false,
    'Payme: ' || v_row.payme_id
  )
  returning id into v_sub_id;

  update public.profiles
  set tariff_days     = v_row.tariff_days,
      tariff_end_date = v_new_end,
      updated_at      = now()
  where id = v_row.user_id;

  begin
    insert into public.payment_receipts (
      user_id, email, receipt_url, amount, currency, payment_method, subscription_id
    ) values (
      v_row.user_id, v_row.account_email,
      'https://payme.uz/receipt/' || v_row.payme_id,
      v_row.amount_tiyin / 100.0, 'UZS', 'payme', v_sub_id
    );
  exception when others then
    null;
  end;

  update public.payme_transactions
  set state                = 2,
      perform_time         = p_perform_time,
      subscription_id      = v_sub_id,
      prev_tariff_days     = v_prof.tariff_days,
      prev_tariff_end_date = v_prof.tariff_end_date,
      grant_start          = v_base,
      grant_end            = v_new_end
  where id = v_row.id;

  return jsonb_build_object(
    'ok', true,
    'transaction_id', v_row.id,
    'perform_time',   p_perform_time,
    'state',          2
  );
end;
$function$;

-- ── 8. Payme: CancelTransaction — faqat shu xarid kunlari ayriladi ─────────
create or replace function public.payme_cancel_transaction(p_payme_id text, p_reason smallint, p_cancel_time bigint)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_row       record;
  v_new_state smallint;
begin
  select * into v_row from public.payme_transactions
  where payme_id = p_payme_id for update;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'transaction_not_found');
  end if;

  -- Idempotentlik: allaqachon bekor qilingan bo'lsa o'sha holat qaytadi.
  if v_row.state < 0 then
    return jsonb_build_object(
      'ok', true,
      'transaction_id', v_row.id,
      'cancel_time',    v_row.cancel_time,
      'state',          v_row.state
    );
  end if;

  v_new_state := -abs(v_row.state);

  -- Faqat YAKUNLANGAN to'lov bekor qilinsa huquq qaytariladi.
  if v_row.state = 2 then
    perform public.pro_revoke_purchase(
      v_row.user_id, v_row.subscription_id,
      v_row.grant_start, v_row.grant_end,
      v_row.prev_tariff_days, v_row.prev_tariff_end_date
    );
  end if;

  update public.payme_transactions
  set state       = v_new_state,
      reason      = p_reason,
      cancel_time = p_cancel_time
  where id = v_row.id;

  return jsonb_build_object(
    'ok', true,
    'transaction_id', v_row.id,
    'cancel_time',    p_cancel_time,
    'state',          v_new_state
  );
end;
$function$;

-- ── 9. Payme: sandbox holati yorlig'i ──────────────────────────────────────
create or replace function public.payme_account_state(p_email text)
returns jsonb
language plpgsql
stable
security definer
set search_path to 'public'
as $function$
declare
  v_res    jsonb;
  v_user   uuid;
  v_end    timestamptz;
  v_days   int;
  v_open   int;
  v_limit  boolean;
begin
  select id, tariff_end_date, tariff_days into v_user, v_end, v_days
  from public.profiles where lower(email) = lower(trim(coalesce(p_email,''))) limit 1;

  select count(*) into v_open
  from public.payme_transactions
  where user_id = v_user and state = 1;

  v_res := public.payme_resolve_account(p_email, null);

  -- Eng qisqa tarif ham sig'masa — hisob xarid uchun bloklangan.
  v_limit := v_user is not null and coalesce(public.pro_purchase_limit_exceeded(
    v_user, (select min(tariff_days) from public.payme_plans where is_active = true)
  ), false);

  return jsonb_build_object(
    'email',            p_email,
    'user_id',          v_user,
    'tariff_days',      v_days,
    'tariff_end_date',  v_end,
    'pro_active',       (v_end is not null and v_end > now()),
    'open_transactions', coalesce(v_open, 0),
    'resolve',          v_res,
    'sandbox_state',    case
                          when v_user is null                       then 'U mavjud emas'
                          when v_res->>'error' = 'account_busy'     then 'Qayta ishlanmoqda'
                          when v_limit                              then 'Bloklangan'
                          else 'To''lov kutilmoqda'
                        end
  );
end;
$function$;

-- ── 10. Payme sandbox: "blocked" = 400 kunlik chegara to'lgan hisob ────────
create or replace function public.payme_sandbox_prepare(p_email text, p_state text default 'pending'::text)
returns jsonb
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
  v_user   uuid;
  v_now_ms bigint := (extract(epoch from now()) * 1000)::bigint;
  v_state  text   := lower(trim(coalesce(p_state, 'pending')));
  v_amount bigint;
begin
  if v_state not in ('pending', 'processing', 'blocked') then
    return jsonb_build_object(
      'ok', false,
      'error', 'bad_state',
      'hint', 'pending | processing | blocked'
    );
  end if;

  select id into v_user from public.profiles
  where lower(email) = lower(trim(coalesce(p_email, ''))) limit 1;

  if v_user is null then
    return jsonb_build_object('ok', false, 'error', 'user_not_found');
  end if;

  -- ── 1. Hisobni har doim toza holatga qaytaramiz ─────────────────────
  update public.payme_transactions
  set state = -1, reason = 4, cancel_time = v_now_ms
  where user_id = v_user and state = 1;

  update public.profiles
  set tariff_days = 0, tariff_end_date = null, updated_at = now()
  where id = v_user;

  update public.subscriptions
  set status = 'cancelled', ends_at = now(), expires_at = now(), updated_at = now()
  where user_id = v_user and is_trial = false and status = 'active';

  -- ── 2. So'ralgan holatga keltiramiz ─────────────────────────────────
  if v_state = 'processing' then
    -- Sun'iy "kutilayotgan" tranzaksiya -> hisob band bo'ladi -> -31051
    select amount_tiyin into v_amount
    from public.payme_plans where is_active = true order by amount_tiyin limit 1;

    insert into public.payme_transactions (
      payme_id, user_id, account_email, amount_tiyin,
      tariff_days, plan_name, state, create_time
    )
    select 'SANDBOX_BUSY_' || replace(gen_random_uuid()::text, '-', ''),
           v_user, lower(trim(p_email)), pp.amount_tiyin,
           pp.tariff_days, pp.plan_name, 1, v_now_ms
    from public.payme_plans pp
    where pp.amount_tiyin = v_amount;

  elsif v_state = 'blocked' then
    -- PRO muddati 400 kunlik chegaraga yetgan -> har qanday tarif rad etiladi (pro_limit)
    update public.profiles
    set tariff_days     = 400,
        tariff_end_date = date_trunc('day', now() at time zone 'Asia/Tashkent')
                          at time zone 'Asia/Tashkent'
                          + interval '400 days' - interval '1 second',
        updated_at      = now()
    where id = v_user;
  end if;

  return public.payme_account_state(p_email);
end;
$function$;

-- ── 11. Click: buyurtma yaratish — already_paid o'rniga 400 kun chegarasi ──
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

  if public.pro_purchase_limit_exceeded(v_uid, v_plan.tariff_days) then
    return jsonb_build_object('ok', false, 'error', 'pro_limit');
  end if;

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

-- ── 12. Click: Prepare — faol PRO o'rniga 400 kun chegarasi ────────────────
create or replace function public.click_prepare(p_click_trans_id bigint, p_click_paydoc_id bigint, p_merchant_trans_id text, p_amount text, p_error integer)
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
    if v_order.click_trans_id = p_click_trans_id then
      return jsonb_build_object('error', 0, 'merchant_prepare_id', v_order.id);
    end if;
    return jsonb_build_object('error', -4);
  end if;

  if coalesce(p_amount, '') !~ '^\d{1,12}(\.\d{1,2})?$'
     or p_amount::numeric * 100 <> v_order.amount_tiyin then
    return jsonb_build_object('error', -2);
  end if;

  if not exists (select 1 from public.profiles where id = v_order.user_id) then
    return jsonb_build_object('error', -5);
  end if;

  -- Faol PRO to'siq emas; faqat jami muddat 400 kundan oshsa pul olinmaydi.
  if public.pro_purchase_limit_exceeded(v_order.user_id, v_order.tariff_days) then
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

-- ── 13. Click: PRO berish — oraliq qaytariladi ─────────────────────────────
create or replace function public.click_grant_pro(p_user_id uuid, p_plan_name text, p_tariff_days integer, p_amount_tiyin bigint, p_note text)
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
    'prev_tariff_end_date', v_prof.tariff_end_date,
    'grant_start',          v_base,
    'grant_end',            v_new_end
  );
end;
$function$;

-- ── 14. Click: Complete — oraliq saqlanadi ─────────────────────────────────
create or replace function public.click_complete(p_click_trans_id bigint, p_click_paydoc_id bigint, p_merchant_trans_id text, p_merchant_prepare_id bigint, p_amount text, p_error integer, p_error_note text)
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
      prev_tariff_end_date = (v_grant->>'prev_tariff_end_date')::timestamptz,
      grant_start          = (v_grant->>'grant_start')::timestamptz,
      grant_end            = (v_grant->>'grant_end')::timestamptz
  where id = v_order.id;

  return jsonb_build_object('error', 0, 'merchant_confirm_id', v_order.id);
end;
$function$;

-- ── 15. Click: bekor qilish — faqat shu xarid kunlari ayriladi ─────────────
create or replace function public.click_cancel_order(p_order_id uuid, p_reason smallint default null::smallint)
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
    perform public.pro_revoke_purchase(
      v_row.user_id, v_row.subscription_id,
      v_row.grant_start, v_row.grant_end,
      v_row.prev_tariff_days, v_row.prev_tariff_end_date
    );
  end if;

  update public.click_transactions
  set state       = v_new_state,
      reason      = p_reason,
      cancel_time = v_now_ms
  where id = v_row.id;

  return jsonb_build_object('ok', true, 'state', v_new_state, 'cancel_time', v_now_ms);
end;
$function$;
