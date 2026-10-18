-- 1.6 sinov ssenariylari. Migratsiyadan KEYIN, xohlagan payt SQL Editor'da ishga tushirish mumkin:
-- hammasi bitta DO blokida, oxirida RAISE EXCEPTION bilan majburiy ROLLBACK —
-- bazada hech narsa qolmaydi, pg_net (Telegram xabari) navbati ham bekor bo'ladi.
-- Natija xato matnida: "REPORT: ..." — har qatorda PASS/FAIL.
do $outer$
declare
  r    text := '';
  uid  uuid := gen_random_uuid();
  em   text := 'pro-renewal-test-' || substr(md5(random()::text), 1, 8) || '@example.invalid';
  t0   timestamptz := now();
  ms   bigint := (extract(epoch from now()) * 1000)::bigint;
  j    jsonb;
  e1   timestamptz;
  e2   timestamptz;
  e    timestamptz;
  acc  record;
  ord  jsonb;
  oid_ uuid;
  o2   uuid;
  pid  bigint;
  i    int;
  st   text;
begin
  insert into auth.users (id, email, aud, role, instance_id, created_at, updated_at)
  values (uid, em, 'authenticated', 'authenticated', '00000000-0000-0000-0000-000000000000', now(), now());
  insert into public.profiles (id, email) values (uid, em) on conflict (id) do nothing;
  update public.profiles set tariff_days = 0, tariff_end_date = null where id = uid;

  -- S1 — PRO'siz foydalanuvchi: check ok
  j := public.payme_check_perform_transaction(em, 3500000);
  r := r || format(E'\n%s S1 yangi xarid check: %s', case when (j->>'ok')::boolean then 'PASS' else 'FAIL' end, j);

  -- S2 — A (oylik) bajariladi: tugash = bugun+30 kun oxiri
  j := public.payme_create_transaction('TEST_A_' || uid, em, 3500000, ms);
  j := public.payme_perform_transaction('TEST_A_' || uid, ms);
  select tariff_end_date into e1 from public.profiles where id = uid;
  e := date_trunc('day', (t0 + interval '30 days') at time zone 'Asia/Tashkent') at time zone 'Asia/Tashkent' + interval '1 day' - interval '1 second';
  r := r || format(E'\n%s S2 A oylik: tugash %s (kutilgan %s)', case when e1 = e then 'PASS' else 'FAIL' end, e1, e);

  -- S3 — faol PRO ustiga B (haftalik): ilgari already_paid edi, endi +7 kun
  j := public.payme_check_perform_transaction(em, 1500000);
  st := coalesce(j->>'error', 'ok');
  j := public.payme_create_transaction('TEST_B_' || uid, em, 1500000, ms);
  j := public.payme_perform_transaction('TEST_B_' || uid, ms);
  select tariff_end_date into e2 from public.profiles where id = uid;
  r := r || format(E'\n%s S3 faol PRO + B haftalik: check=%s, tugash %s (kutilgan %s)',
                   case when st = 'ok' and e2 = e1 + interval '7 days' then 'PASS' else 'FAIL' end, st, e2, e1 + interval '7 days');

  -- S4 — B callback qayta keladi: muddat ikki marta qo'shilmaydi
  j := public.payme_perform_transaction('TEST_B_' || uid, ms);
  select tariff_end_date into e from public.profiles where id = uid;
  r := r || format(E'\n%s S4 takroriy perform: tugash o''zgarmadi %s', case when e = e2 and (j->>'state')::int = 2 then 'PASS' else 'FAIL' end, e);

  -- S5 — A bekor qilinadi: B ning 7 kuni saqlanadi (bugun + 7 kun)
  j := public.payme_cancel_transaction('TEST_A_' || uid, 5::smallint, ms);
  select tariff_end_date into e from public.profiles where id = uid;
  perform set_config('request.jwt.claims', '{"role":"service_role"}', true);
  select * into acc from public.get_user_access_state(uid);
  r := r || format(E'\n%s S5 A bekor: tugash %s (kutilgan %s), kirish=%s gacha %s',
                   case when e = t0 + interval '7 days' and acc.is_premium and acc.expires_at = e then 'PASS' else 'FAIL' end,
                   e, t0 + interval '7 days', acc.state, acc.expires_at);

  -- S6 — A bekor qilish qayta keladi: o'zgarmaydi
  j := public.payme_cancel_transaction('TEST_A_' || uid, 5::smallint, ms);
  select tariff_end_date into e2 from public.profiles where id = uid;
  r := r || format(E'\n%s S6 takroriy cancel: %s', case when e2 = e then 'PASS' else 'FAIL' end, e2);

  -- S7 — B ham bekor: to'langan muddat qolmadi, PRO yo'q
  j := public.payme_cancel_transaction('TEST_B_' || uid, 5::smallint, ms);
  select * into acc from public.get_user_access_state(uid);
  r := r || format(E'\n%s S7 B ham bekor: kirish=%s premium=%s', case when not acc.is_premium then 'PASS' else 'FAIL' end, acc.state, acc.is_premium);

  -- S8 — Click: 4 x choraklik (360 kun) o'tadi, 5-chisi 400 kun chegarasi bilan rad etiladi
  perform set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
  for i in 1..4 loop
    ord  := public.click_create_order('quarterly');
    oid_ := (ord->>'order_id')::uuid;
    select id into pid from public.click_transactions where order_id = oid_;
    j := public.click_prepare(990000000 + i, 1, oid_::text, '83000', 0);
    if (j->>'error')::int <> 0 then r := r || format(E'\nFAIL S8 prepare %s: %s', i, j); end if;
    j := public.click_complete(990000000 + i, 1, oid_::text, pid, '83000', 0, null);
    if (j->>'error')::int <> 0 then r := r || format(E'\nFAIL S8 complete %s: %s', i, j); end if;
    if i = 2 then o2 := oid_; end if;
  end loop;
  select tariff_end_date into e from public.profiles where id = uid;
  e1 := date_trunc('day', (t0 + interval '360 days') at time zone 'Asia/Tashkent') at time zone 'Asia/Tashkent' + interval '1 day' - interval '1 second';
  ord := public.click_create_order('quarterly');
  j   := public.click_create_order('weekly');
  r := r || format(E'\n%s S8 Click 4x90: tugash %s (kutilgan %s); 5-choraklik=%s; haftalik=%s',
                   case when e = e1 and ord->>'error' = 'pro_limit' and (j->>'ok')::boolean then 'PASS' else 'FAIL' end,
                   e, e1, coalesce(ord->>'error', 'ok'), coalesce(j->>'error', 'ok'));

  -- S9 — Click: o'rtadagi (2-) xarid bekor: aynan 90 kun ayriladi, qolganlar saqlanadi
  j := public.click_cancel_order(o2, null);
  select tariff_end_date into e2 from public.profiles where id = uid;
  perform set_config('request.jwt.claims', '{"role":"service_role"}', true);
  select * into acc from public.get_user_access_state(uid);
  r := r || format(E'\n%s S9 Click 2-xarid bekor: tugash %s (kutilgan %s), kirish %s',
                   case when e2 = e1 - interval '90 days' and acc.expires_at = e2 then 'PASS' else 'FAIL' end,
                   e2, e1 - interval '90 days', acc.expires_at);

  -- S10 — Payme: ochiq tranzaksiya bo'lsa hisob band (account_busy) — o'zgarmagan
  j := public.payme_create_transaction('TEST_C_' || uid, em, 1500000, ms);
  j := public.payme_check_perform_transaction(em, 1500000);
  r := r || format(E'\n%s S10 ochiq tranzaksiya: %s', case when j->>'error' = 'account_busy' then 'PASS' else 'FAIL' end, j->>'error');

  -- S11 — Sandbox "blocked": 400 kun chegarasi orqali
  j := public.payme_sandbox_prepare(em, 'blocked');
  st := j->>'sandbox_state';
  j := public.payme_check_perform_transaction(em, 1500000);
  r := r || format(E'\n%s S11 sandbox blocked: holat=%s, check=%s', case when st = 'Bloklangan' and j->>'error' = 'pro_limit' then 'PASS' else 'FAIL' end, st, j->>'error');

  -- S12 — eski (grant oralig'i yo'q) xarid bekor: avvalgi mantiq (snapshot qaytadi).
  -- Alohida foydalanuvchi: bitta tranzaksiyada hamma obunaning created_at i bir xil,
  -- "oxirgi obuna" tanlovi noaniq bo'lib qoladi (haqiqiy hayotda bunday emas).
  uid := gen_random_uuid();
  em  := 'pro-renewal-legacy-' || substr(md5(random()::text), 1, 8) || '@example.invalid';
  insert into auth.users (id, email, aud, role, instance_id, created_at, updated_at)
  values (uid, em, 'authenticated', 'authenticated', '00000000-0000-0000-0000-000000000000', now(), now());
  insert into public.profiles (id, email) values (uid, em) on conflict (id) do nothing;
  update public.profiles
  set tariff_days = 30,
      tariff_end_date = date_trunc('day', (t0 + interval '30 days') at time zone 'Asia/Tashkent') at time zone 'Asia/Tashkent' + interval '1 day' - interval '1 second'
  where id = uid;
  insert into public.payme_transactions (payme_id, user_id, account_email, amount_tiyin, tariff_days, plan_name,
                                         state, create_time, perform_time, prev_tariff_days, prev_tariff_end_date)
  values ('TEST_L_' || uid, uid, em, 3500000, 30, 'monthly', 2, ms, ms, 0, null);
  j := public.payme_cancel_transaction('TEST_L_' || uid, 5::smallint, ms);
  select * into acc from public.get_user_access_state(uid);
  select tariff_end_date into e from public.profiles where id = uid;
  r := r || format(E'\n%s S12 eski xarid bekor: tugash=%s premium=%s', case when e is null and not acc.is_premium then 'PASS' else 'FAIL' end, e, acc.is_premium);

  raise exception 'REPORT:%', r;
end
$outer$;
