# CLICK to'lov integratsiyasi — qanday qurilgan va qanday ishlaydi

> Protokol: **CLICK SHOP API** (Prepare / Complete) — https://docs.click.uz/en/shop-api/requests , https://docs.click.uz/en/shop-api/errors
> Edge Function: `supabase/functions/click/` → `https://lvdndseuobzbgzrarygu.supabase.co/functions/v1/click`
> Baza: `supabase/sql/click_shop_api.sql` (Supabase migratsiyasi `click_shop_api`, versiya `20260924101904`)
> Frontend: `src/lib/click.ts`, `src/pages/Pro.tsx`
> Asos bo'lgan shablon: `click-uz-integration-nodejs` (Express + MongoDB) — tuzilishi olingan, xatolari olinmagan (9-bo'lim)

---

## 0. AI / yangi dasturchi uchun — avval shuni o'qing

1. **`main` = production.** Yangi ish avval `test` branch da sinaladi (Cloudflare Pages preview). `main` ga faqat egasi aniq aytganda o'tkaziladi. Tartib: `main` dan feature branch → `test` ga `--no-ff` merge → lint/typecheck/test/build → faqat `git push origin test`.
2. **Baza bilan Supabase MCP orqali ishlanadi** (project ref `lvdndseuobzbgzrarygu`). Prod bazaga yozadigan sinovlar faqat `DO $$ … raise exception … $$` ichida — ya'ni oxirida hammasi rollback bo'ladi (8-bo'lim).
3. **SECRET_KEY hech qayerda yozilmaydi** — kodda, `.env` da, commitda, chatda. U faqat Supabase Vault da: `click_secret_key`. Uni so'ramang va o'qib chiqarmang.
4. **PRO berish qoidasi Payme bilan AYNAN bir xil** (`click_grant_pro` ↔ `payme_perform_transaction`, `click_has_active_pro` ↔ `payme_resolve_account`). Payme qoidasi o'zgarsa — Click ham birga o'zgartiriladi, aks holda ikki to'lov tizimi har xil muddat beradi.
5. **Imzo XOM satrlar ustida hisoblanadi.** `amount` ni "35000.00" → 35000 ga o'girish, `trim` qilish yoki raqamga aylantirish imzoni buzadi.
6. **Complete ga faol PRO tekshiruvi QO'SHILMAYDI.** Hujjat: pul yechilgandan keyin Complete faqat -4 yoki -9 qaytarishi mumkin. Faol PRO bo'lsa muddat ustiga qo'shiladi.
7. **Edge Function qayta deploy qilinsa `verify_jwt = false` bo'lishi shart** va 6 ta faylning hammasi yuboriladi (7-bo'lim). `true` bo'lsa CLICK so'rovlari 401 oladi va to'lovlar to'xtaydi.
8. **Lint/typecheck da `main` dan qolgan eski xatolar bor** (`AuthContext`, `useReadiness`, `Home`, `admin-manager`, `bot-user-manager`). Ular Click ga aloqasiz — o'zingiznikiga adashtirmang.

---

## 1. Kassa ma'lumotlari

| Nom | Qiymat | Maxfiymi | Qayerda |
|---|---|---|---|
| SERVICE_ID | `112576` | yo'q | `VITE_CLICK_SERVICE_ID`, `enum.ts` (`CLICK_SERVICE_ID`) |
| MERCHANT_ID | `57313` | yo'q | `VITE_CLICK_MERCHANT_ID` |
| MERCHANT_USER_ID | `91937` | yo'q | `VITE_CLICK_MERCHANT_USER_ID` |
| SECRET_KEY | — | **HA** | faqat Vault: `click_secret_key` |

Kalitni qo'yish / almashtirish (egasi o'zi bajaradi):

```sql
select vault.create_secret('<SECRET_KEY>', 'click_secret_key');          -- birinchi marta
select vault.update_secret(id, '<YANGI_KEY>') from vault.secrets
 where name = 'click_secret_key';                                         -- almashtirish
```

CLICK kabinetidagi manzillar:

| Maydon | Qiymat |
|---|---|
| Prepare URL | `https://lvdndseuobzbgzrarygu.supabase.co/functions/v1/click/prepare` |
| Complete URL | `https://lvdndseuobzbgzrarygu.supabase.co/functions/v1/click/complete` |

Bitta umumiy `…/functions/v1/click` ham ishlaydi — bosqich `action` dan olinadi.

---

## 2. Oqim

```
Foydalanuvchi (Pro sahifasi)
  │  tarif + "Click" tanlaydi, "… so'm to'lash" ni bosadi
  ▼
supabase.rpc('click_create_order', { p_plan_name })        ← authenticated
  │  summa va muddat payme_plans dan (klient summani bermaydi)
  │  faol PRO bo'lsa → already_paid ; soatiga 20 tadan ko'p → too_many_orders
  ▼  { ok, order_id (uuid), amount_tiyin }
https://my.click.uz/services/pay?service_id=112576&merchant_id=57313
      &amount=15000.00&transaction_param=<order_id>&return_url=…/profile?from=click
      &merchant_user_id=91937
  │
  ▼  foydalanuvchi CLICK da to'lovni tasdiqlaydi
CLICK → POST /functions/v1/click/prepare   (action=0)
  │  imzo → click_prepare: buyurtma state 0 → 1, merchant_prepare_id = id
  ▼
CLICK kartadan pul yechadi
  ▼
CLICK → POST /functions/v1/click/complete  (action=1)
  │  imzo → click_complete → click_grant_pro: subscriptions + profiles
  │  state 1 → 2, trigger → telegram-payment-notify ("✅ Yangi to'lov!")
  ▼
Brauzer return_url ga qaytadi → /profile?from=click
  Profile.tsx PRO tasdiqlanguncha ~20 s davomida holatni qayta so'raydi
```

**PRO frontendda hech qachon berilmaydi.** Uni faqat imzolangan Complete dan keyin baza beradi — havolani qo'lda ochib PRO olish imkonsiz.

---

## 3. Fayllar xaritasi

| Fayl | Vazifasi |
|---|---|
| `src/lib/click.ts` | `isClickConfigured()`, `buildClickPayUrl()`, `formatTiyinForClick()` (tiyin → "N.NN", float xatosisiz) |
| `src/lib/click.test.ts` | havola formati, summa formati, env yo'q holati |
| `src/lib/pendingPlan.ts` | mehmon tanlagan tarif **va to'lov tizimi** (`provider`) ro'yxatdan o'tguncha saqlanadi |
| `src/pages/Pro.tsx` | tarif kartalari, Payme/Click tanlagich (standart Payme), `goToClick` / `goToPayme` / `goToCheckout` |
| `src/pages/Pro.pendingPlan.test.tsx` | ro'yxatdan o'tib qaytgach Click ga o'tish, `already_paid` bo'lsa yubormaslik |
| `src/pages/Profile.tsx` | `?from=payme` va `?from=click` da PRO holatini qayta so'rash |
| `src/integrations/supabase/types.ts` | `click_create_order` tipi (qo'lda qo'shilgan) |
| `supabase/functions/click/index.ts` | HTTP kirish, routing (`/prepare`, `/complete`, yoki `action`), urlencoded/JSON o'qish |
| `supabase/functions/click/service.ts` | `prepare()` / `complete()` — tekshiruvlar tartibi va SQL chaqiruvi |
| `supabase/functions/click/click-check.ts` | imzo — `click_verify_sign` RPC (kalit bazadan chiqmaydi) |
| `supabase/functions/click/enum.ts` | `ClickError`, `ClickAction`, `TransactionState`, `CLICK_SERVICE_ID` |
| `supabase/functions/click/errors.ts` | `error_note` matnlari (hujjatdagidek), javob formati |
| `supabase/functions/click/client.ts` | service-role Supabase klienti |
| `supabase/sql/click_shop_api.sql` | bazadagi hamma narsaning manbasi (jonli baza bilan bir xil) |
| `.env.example`, `vitest.config.ts` | `VITE_CLICK_*` (testlarda namuna qiymatlar) |

---

## 4. Baza

### 4.1 `public.click_transactions`

| Ustun | Ma'nosi |
|---|---|
| `id` bigint identity | CLICK ga `merchant_prepare_id` va `merchant_confirm_id` sifatida qaytadi |
| `order_id` uuid unique | `merchant_trans_id` = havoladagi `transaction_param` |
| `user_id` | FK **yo'q** (ataylab) — hisob o'chirilsa ham moliyaviy yozuv qoladi |
| `account_email` | `profiles.email` (Telegram xabari uchun) |
| `plan_name`, `tariff_days`, `amount_tiyin` | buyurtma paytida `payme_plans` dan nusxa |
| `state` | `0` yaratildi · `1` Prepare o'tdi · `2` to'landi · `-1` kutishda bekor · `-2` to'langandan keyin bekor |
| `click_trans_id` unique, `click_paydoc_id` | CLICK identifikatorlari (Prepare da yoziladi) |
| `click_error`, `click_error_note` | CLICK manfiy `error` yuborganda |
| `reason` | `click_cancel_order` sababi |
| `create_time`, `prepare_time`, `perform_time`, `cancel_time` | millisekund (payme_transactions bilan bir xil format) |
| `subscription_id` | yaratilgan `subscriptions.id` |
| `prev_tariff_days`, `prev_tariff_end_date` | PRO berilishidan oldingi holat — bekor qilinganda qaytariladi |

RLS yoqilgan, siyosat **yo'q**, `anon`/`authenticated` dan hamma huquq olingan — jadvalga faqat funksiyalar va service_role kiradi. Supabase advisori buni "RLS enabled, no policy" deb ko'rsatadi — bu ataylab.

`id` da bo'shliqlar bo'ladi (rollback qilingan sinovlar ketma-ketlikni oldinga suradi) — bu normal.

### 4.2 Funksiyalar va ruxsatlar

| Funksiya | Kim chaqiradi | Vazifasi |
|---|---|---|
| `click_create_order(p_plan_name)` | **authenticated** | `auth.uid()` uchun buyurtma. Xatolar: `unauthorized`, `user_not_found`, `plan_not_found`, `already_paid`, `too_many_orders` |
| `click_verify_sign(…8 ta text)` | service_role | md5 imzo; `true` / `false` / `null` (kalit sozlanmagan) |
| `click_prepare(click_trans_id, click_paydoc_id, merchant_trans_id, amount, error)` | service_role | `{error}` yoki `{error:0, merchant_prepare_id}` |
| `click_complete(… + merchant_prepare_id, error_note)` | service_role | `{error}` yoki `{error:0, merchant_confirm_id}` |
| `click_has_active_pro(user_id)` | ichki | `payme_resolve_account` dagi "already_paid" sharti |
| `click_grant_pro(user_id, plan, days, amount, note)` | ichki | `payme_perform_transaction` dagi PRO berish |
| `click_cancel_order(order_id, reason)` | service_role | admin uchun (hali ulanmagan): to'langanni `-2`, kutilayotganni `-1`, PRO ni `prev_*` ga qaytaradi |

Hammasi `SECURITY DEFINER`, `search_path = public`. Supabase har yangi funksiyani avtomatik `anon`/`authenticated` ga ochadi — shuning uchun migratsiyada **har biri aniq `revoke`** qilingan. Yangi `click_*` funksiya qo'shsangiz, shuni takrorlang.

Trigger: `trg_notify_telegram_on_click_payment` — `state` 2 ga o'tganda mavjud `notify_telegram_on_payment()` ni chaqiradi (Payme bilan bitta funksiya; xabarda provayder yozilmaydi).

### 4.3 PRO berish qoidasi (Payme bilan bir xil)

```
base    = greatest(now(), profiles.tariff_end_date)
new_end = date_trunc('day', (base + N kun) AT TIME ZONE 'Asia/Tashkent') AT TIME ZONE 'Asia/Tashkent'
          + 1 kun - 1 soniya            -- Toshkent vaqti bilan kun oxiri
```

So'ng: `subscriptions` ga `status='active'`, `note='Click: <click_trans_id>'`, `amount = tiyin/100` yoziladi; `profiles.tariff_days` va `tariff_end_date` yangilanadi. `profiles` dagi `protect_sensitive_profile_columns` triggeri service_role / funksiya egasiga ruxsat beradi; `sync_subscription_on_tariff_update` oxirgi obunani o'sha qiymatlar bilan moslaydi (Payme dagidek).

**Faol PRO** = `profiles.tariff_end_date > now()` YOKI `subscriptions` da `is_trial=false`, `status='active'`, `coalesce(expires_at, ends_at) > now()`.

> `payme_plans` jadvali nomiga qaramay **ikkala tizimning** umumiy tarif jadvali. Narxni o'zgartirsangiz Click ham avtomatik yangi narxni oladi.

---

## 5. Imzo

```
Prepare:  md5(click_trans_id + service_id + SECRET_KEY + merchant_trans_id + amount + action + sign_time)
Complete: md5(click_trans_id + service_id + SECRET_KEY + merchant_trans_id + merchant_prepare_id + amount + action + sign_time)
```

- Qiymatlar CLICK yuborgan **xom satr** holida ulanadi (`amount` "15000.00" bo'lsa aynan shunday).
- Hisob Postgres ichida (`click_verify_sign`), kalit Vault dan o'qiladi — Edge Function ga kalit tushmaydi. Deno WebCrypto da MD5 yo'qligi ham bu yo'lni tanlashga sabab.
- `sign_string` katta/kichik harf farqisiz solishtiriladi.
- Kalit yo'q bo'lsa funksiya `null` qaytaradi → javob `-1`, logda `[click] click_secret_key Vault da sozlanmagan`.

---

## 6. So'rovlarni tekshirish tartibi va javoblar

`service.ts` → `precheck()`, so'ng SQL:

| # | Tekshiruv | Xato |
|---|---|---|
| 1 | majburiy maydonlar bor, `click_trans_id`/`service_id`/`click_paydoc_id`/(`merchant_prepare_id`) raqam, `error` butun son | -8 |
| 2 | `action` ma'lum va marshrutga mos (`/prepare` ga `action=1` kelsa) | -3 |
| 3 | imzo | -1 |
| 4 | `service_id == 112576` | -8 |
| 5 | SQL (pastda) | 0 / -2 / -4 / -5 / -6 / -9 |
| — | baza/tarmoq istisnosi | -7 (CLICK qayta urinadi) |

**Prepare (SQL):** uuid emas yoki buyurtma yo'q → -5 · `state=2` → -4 · `state<0` → -9 · CLICK `error<0` → buyurtma `-1`, javob -9 · `state=1` va o'sha `click_trans_id` → **idempotent 0** · `state=1` boshqa `click_trans_id` → -4 (buyurtma band) · summa `^\d{1,12}(\.\d{1,2})?$` emas yoki `amount*100 ≠ amount_tiyin` → -2 · profil yo'q → -5 · faol PRO bor → -4 · `click_trans_id` boshqa buyurtmada band → -8 · aks holda `state=1`, 0.

**Complete (SQL):** buyurtma yo'q → -5 · `id ≠ merchant_prepare_id` yoki `click_trans_id` mos emas (jumladan Prepare bo'lmagan) → -6 · `state=2` → **-4** (takroriy Complete) · `state<0` → -9 · CLICK `error<0` → `-1`, `click_error(_note)` saqlanadi, -9 · summa → -2 · PRO beriladi → `state=2`, 0.

Javob: har doim HTTP 200, `application/json`: `click_trans_id`, `merchant_trans_id`, `merchant_prepare_id` yoki `merchant_confirm_id` (muvaffaqiyatda), `error`, `error_note` (hujjatdagi matnlar: "Success", "SIGN CHECK FAILED!", "Incorrect parameter amount", …).

---

## 7. Deploy va sozlash

**Edge Function** (MCP `deploy_edge_function`): `name: click`, `verify_jwt: false`, `entrypoint_path: index.ts`, fayllar: `index.ts, service.ts, click-check.ts, errors.ts, enum.ts, client.ts`. CLI bilan: `supabase functions deploy click --no-verify-jwt`.

**Baza:** `supabase/sql/click_shop_api.sql` — idempotent (`create … if not exists`, `create or replace`). O'zgartirish kerak bo'lsa yangi migratsiya yozing va faylni ham yangilang — fayl va jonli baza bir xil turishi kerak.

**Frontend env (Cloudflare Pages, build vaqtida):** `VITE_CLICK_SERVICE_ID`, `VITE_CLICK_MERCHANT_ID`, `VITE_CLICK_MERCHANT_USER_ID`. `SERVICE_ID` yoki `MERCHANT_ID` bo'sh bo'lsa Click tanlovi **ko'rinmaydi** (faqat Payme) — bu o'chirish tugmasi vazifasini ham bajaradi. Env o'zgargach deploy qayta ishga tushiriladi (Vite env build vaqtida kiradi). Holat: Preview (`test`) da qo'yilgan; Production da `main` ga o'tkazilganda qo'yiladi.

---

## 8. Qanday tekshirilgan (2026-09-24) va qanday qayta tekshirish

**Bajarilgan va o'tgan:**
- To'liq oqim real profil ustida, rollback bilan: buyurtma → Prepare → takroriy Prepare (idempotent) → boshqa `click_trans_id` (-4) → noto'g'ri prepare_id (-6) → Complete (0) → takroriy Complete (-4) → PRO 30 kun, kun oxirigacha → `get_user_access_state` = `active_pro` → qayta buyurtma `already_paid` → bekor qilish PRO ni qaytaradi.
- Chekka holatlar: summa formatlari (`15000.0` ✓; `15 000`, `1.5e4`, manfiy, 3 kasr → -2), anonim → `unauthorized`, soatiga 21-buyurtma → `too_many_orders`, Prepare/Complete da CLICK `error<0` → `-1` + -9, Prepare dan keyin Payme orqali PRO olinsa Complete baribir o'tadi va **aynan 7 kun ustiga** qo'shadi, bekor qilinganda Payme dagi avvalgi muddat aniq tiklanadi.
- Imzo formulasi Node da mustaqil hisoblangan md5 bilan mos (vaqtinchalik test kalit rollback ichida).
- Jonli endpoint: GET → -8, maydon yetishmasa -8, marshrut/action mos emas -3, noto'g'ri imzo -1, haqiqiy kalit bilan imzolangan so'rov imzodan o'tadi.
- Ruxsatlar, advisorlar (yangi muammo yo'q), funksiya loglari (tizim xatosi yo'q).
- Frontend: 121/121 test, `npm run build` (prebuild SEO + postbuild assert) ✓. Test saytidan real buyurtmalar yaratilgan.

**Hali kuzatilmagan:** CLICK serverlaridan birinchi haqiqiy Prepare/Complete (2026-09-24 holatida hech kim to'lamagan). Birinchi haqiqiy to'lovdan keyin quyidagilarni tekshiring.

**Foydali so'rovlar (faqat o'qish):**

```sql
-- Oxirgi buyurtmalar
select id, left(order_id::text, 8) as ord, plan_name, amount_tiyin, state,
       click_trans_id, click_error, click_error_note, subscription_id is not null as pro_given,
       created_at at time zone 'Asia/Tashkent' as created
from public.click_transactions order by id desc limit 20;

-- Kalit bor-yo'qligi (qiymatni o'qimang)
select count(*) from vault.secrets where name = 'click_secret_key';
```

Loglar (MCP `query_logs`):

```sql
select timestamp, event_message from logs
where source = 'function_logs' and event_message like '%[click]%'
order by timestamp desc limit 50
```

Har so'rov `[click] -> {...}` va `[click] <- {...}` bo'lib yoziladi.

**Prod bazada o'zgartiruvchi sinov namunasi** — hech narsa saqlanmaydi:

```sql
do $$
declare r jsonb := '{}';
begin
  perform set_config('request.jwt.claims', '{"sub":"<user uuid>","role":"authenticated"}', true);
  r := r || jsonb_build_object('order', public.click_create_order('weekly'));
  perform set_config('request.jwt.claims', '{"role":"service_role"}', true);
  -- ... click_prepare / click_complete ...
  raise exception 'TEST_ROLLBACK %', r::text;   -- hammasi bekor bo'ladi
end $$;
```

> Tuzoq: bitta ifoda ichida funksiyani chaqirib, o'sha ifodadagi subselect bilan natijani o'qisangiz — **eski snapshot** ko'rinadi. Holatni alohida qatorda (`x := f(); r := r || (select …)`) o'qing.

---

## 9. Shablondan nima olindi, nima olinmadi

Olindi: tuzilish (`enum` → `enum.ts`, `utils/click-check.js` → `click-check.ts`, `services/click.service.js` → `service.ts`, `routes` + `controller` → `index.ts`), `ClickError` / `TransactionState` qiymatlari, `/prepare` va `/complete` marshrutlari.

Olinmadi (shablondagi xatolar):
- `TransactionState.Canceled` — enumda yo'q (`undefined`), tekshiruv hech qachon ishlamasdi;
- Complete da `order.premium` (mahsulot o'rniga) va buyurtma topilmasa `null` ustida yiqilish;
- Complete da CLICK `error<0` bo'lsa -6 qaytarish — hujjat bo'yicha **-9**;
- har Prepare da yangi tranzaksiya yozish (idempotent emas) va `prepare_id = Date.now()`;
- `res.set({ headers: … })` — sarlavha noto'g'ri qo'yilgan;
- imzoni tekshirishdan **oldin** bazadan buyurtma qidirish;
- kalit `.env` da — bizda Vault da.

---

## 10. Qilinmagan / ochiq qolgan

| Nima | Izoh |
|---|---|
| Admin panel | Click statistikasi, `click_transactions` ro'yxati, `click_cancel_order` tugmasi — keyinga qoldirilgan |
| `admin_payment_stats` va Telegram admin bot | faqat `payme_transactions` ni sanaydi |
| `payment_receipts` | Click uchun yozilmaydi: `receipt_url` majburiy, CLICK chek havolasi bermaydi — soxta havola yozilmadi |
| Telegram xabari | provayderni (Payme/Click) ko'rsatmaydi |
| Pulni qaytarish | CLICK Merchant API `payment/reversal` ulanmagan; hozircha CLICK kabinetidan qaytariladi, PRO esa `click_cancel_order` bilan |
| Tashlab ketilgan buyurtmalar | `state=0` (to'lanmagan) qatorlar yig'iladi — zararsiz, taymaut yo'q |
| Sinov qatori | `id=32` — 2026-09-24 dagi qo'lda sinov (SQL orqali `click_trans_id=888888`, `reason=99` bilan bekor qilingan). PRO bermagan; o'chirish faqat egasi aytsa |
