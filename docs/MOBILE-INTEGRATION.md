# Mobil ilova uchun integratsiya topshirig'i — Avtotestu.uz

> Bu hujjat mobil ilova ishlab chiquvchisi (yoki AI agent) uchun **to'liq
> texnik topshiriq**. Maqsad: mobil ilovada ro'yxatdan o'tish, kirish va PRO
> to'lovi **saytdagi bilan aynan bir xil** ishlashi. Sayt va ilova **bitta
> Supabase bazasidan** foydalanadi — foydalanuvchi saytda ro'yxatdan o'tsa,
> ilovada ham o'sha hisob bilan kiradi va PRO obunasi ikkalasida ham amal qiladi.

---

## 0. Eng muhim qoidalar (buzilmasin)

1. **Backend allaqachon tayyor.** Yangi jadval, yangi Edge Function yoki yangi
   RPC yozish **kerak emas**. Mobil ilova mavjudlariga ulanadi.
2. **PRO huquqini mobil ilova HECH QACHON o'zi bermaydi.** Obunani faqat Payme
   serveri tasdiqlagandan keyin baza yozadi. Ilova faqat holatni **o'qiydi**.
3. **`service_role` kaliti ilovaga joylashtirilmaydi.** Faqat `anon` (publishable)
   kalit ishlatiladi. Boshqa har qanday kalit — xavfsizlik buzilishi.
4. **To'lov summasi ilovadan olinmaydi** — u bazadagi `payme_plans` dan
   o'qiladi. Hardcode qilingan narx server bilan mos kelmasa Payme to'lovni
   rad etadi (`-31001`).
5. Foydalanuvchi **telefon raqamini** ko'radi va kiritadi. Baza ichida u
   sun'iy email ko'rinishida saqlanadi — bu **hech qachon interfeysda
   ko'rsatilmaydi**.

---

## 1. Ulanish ma'lumotlari

```
Supabase URL      : https://lvdndseuobzbgzrarygu.supabase.co
Supabase anon key : eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imx2ZG5kc2V1b2J6Ymd6cmFyeWd1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjY0OTk4MTYsImV4cCI6MjA4MjA3NTgxNn0.V6Gh1WaWBtjcU_Ia0DiUjbGApigaC2j5mDJjWP7-FFg
Payme kassa (merchant) ID : 6a6b94141aa0d0bde1ab83cf
Turnstile site key        : 0x4AAAAAAEGTErygcaoAWce_
```

Bu uchtasi **maxfiy emas** — ular saytning JS to'plamida ham ochiq turadi.
Maxfiy kalitlar (service_role, Payme kassa kaliti, Turnstile secret) faqat
serverda, Supabase Vault ichida; ilovaga **umuman kerak emas**.

Sessiya saqlash: mobil xotirada (`AsyncStorage` / `flutter_secure_storage` /
`SharedPreferences`), `persistSession: true`, `autoRefreshToken: true`.

---

## 2. Ro'yxatdan o'tish — telefon raqam orqali

### 2.1 Foydalanuvchi ko'radigan forma

Faqat **uchta** maydon. Ism, familiya, email **so'ralmaydi**:

| Maydon | Izoh |
|---|---|
| Telefon raqam | `+998` doimiy prefiks, foydalanuvchi 9 ta raqam yozadi |
| Parol | kamida **8** belgi |
| Parolni takrorlang | mos kelishi tekshiriladi |

Pastda Cloudflare Turnstile widget'i, undan keyin **"Ro'yxatdan o'tish"** tugmasi.
Alohida **"Google bilan davom etish"** tugmasi ham bo'ladi (3-bo'lim).

### 2.2 Telefon raqamni normallashtirish (aynan shu mantiq)

```
Kirish:  "901234567" | "998901234567" | "+998901234567" | "+998 90 123 45 67"
Natija:  "998901234567"   (12 xona)

Qoidalar:
  - faqat raqamlar qoldiriladi
  - 9 xona bo'lsa → oldiga "998" qo'shiladi
  - 12 xona va "998" bilan boshlansa → o'zi
  - boshqa uzunlik → NOTO'G'RI
  - 998 dan keyingi birinchi raqam 0 yoki 1 bo'lsa → NOTO'G'RI
```

Ko'rsatish formati: `+998 90 123 45 67`

### 2.3 Hisob yaratish — Edge Function orqali

Klientdagi `supabase.auth.signUp()` **ISHLATILMAYDI**. Sabab: sun'iy manzil
domeni haqiqiy, unga tasdiqlash xatlari ketib qolardi. Hisob serverda
yaratiladi.

```http
POST https://lvdndseuobzbgzrarygu.supabase.co/functions/v1/phone-signup
Content-Type: application/json
apikey: <anon key>

{
  "phone": "998901234567",
  "password": "<foydalanuvchi paroli>",
  "turnstileToken": "<Turnstile widget bergan token>"
}
```

Javoblar:

| Holat | Javob | Foydalanuvchiga ko'rsatiladigan xabar |
|---|---|---|
| 200 | `{"ok":true,"email":"998901234567@pro.com"}` | — (darhol kirasiz) |
| 400 | `{"ok":false,"error":"invalid_phone",...}` | `message` maydonidagi matn |
| 400 | `{"ok":false,"error":"weak_password",...}` | `message` maydonidagi matn |
| 403 | `{"ok":false,"error":"turnstile_failed",...}` | `message` maydonidagi matn |
| 409 | `{"ok":false,"error":"phone_taken",...}` | `message` maydonidagi matn |

Har doim javobdagi **`message`** maydonini ko'rsating — u o'zbek tilida tayyor.

### 2.4 Yaratilgandan keyin darhol kirish

Foydalanuvchi parolni ikkinchi marta yozmasin:

```js
await supabase.auth.signInWithPassword({
  email: "998901234567@pro.com",   // phone + "@pro.com"
  password: <o'sha parol>
});
```

---

## 3. Kirish

Ikkita variant, **telefon birlamchi**:

- **Telefon raqam** (asosiy) — normallashtirilib `<998XXXXXXXXX>@pro.com` ga aylantiriladi
- **Email** (eski foydalanuvchilar uchun) — o'zi ishlatiladi, kichik harfga o'tkaziladi

```js
function loginIdentifierToEmail(input) {
  const raw = input.trim();
  if (!raw) return null;
  if (raw.includes('@')) return raw.toLowerCase();      // eski email hisobi
  const n = normalizeUzPhone(raw);
  return n ? `${n}@pro.com` : null;                     // telefon hisobi
}

await supabase.auth.signInWithPassword({ email: loginIdentifierToEmail(x), password });
```

Kirish sahifasida Turnstile **kerak emas** (faqat ro'yxatdan o'tishda).

Pastda: **"Parolni tiklash — @avtotestu_ad"** (Telegram havolasi). Hozircha SMS
yo'q, shuning uchun parolni faqat administrator tiklaydi.

---

## 4. Google orqali kirish

```js
await supabase.auth.signInWithOAuth({
  provider: 'google',
  options: { redirectTo: '<ilovaning deep link i>' }
});
```

Mobilda OAuth tizim brauzeri (Custom Tabs / ASWebAuthenticationSession) orqali
ochilishi va deep link bilan qaytishi kerak. Supabase Dashboard →
Authentication → URL Configuration ga ilovaning redirect sxemasini qo'shish
zarur (masalan `uz.avtotestu.app://auth-callback`).

---

## 5. PRO holatini o'qish

Bu **yagona ishonchli manba**. Profil jadvalidagi maydonlarga qarab qaror
qabul qilinmasin.

```js
const { data } = await supabase.rpc('get_user_access_state', { user_id: user.id });
const row = Array.isArray(data) ? data[0] : data;
// row = { state, is_premium, expires_at }
```

`state` qiymatlari: `guest`, `free_logged_in`, `active_pro`, `expired_pro`.

**PRO faol** deb faqat `state === 'active_pro' && is_premium === true` bo'lganda
hisoblang.

> Muhim: RPC xato bersa yoki timeout bo'lsa — **oxirgi ma'lum holatni saqlang**,
> `guest` ga tushirmang. Aks holda PRO to'lagan foydalanuvchida obuna
> "yo'qolgandek" ko'rinadi. Saytda aynan shu xato bo'lgan va tuzatilgan.

---

## 6. To'lov — Payme (webapp ko'rinishida)

### 6.1 Tariflarni bazadan o'qish

```js
const { data: plans } = await supabase
  .from('payme_plans')
  .select('plan_name, amount_tiyin, tariff_days')
  .eq('is_active', true);
```

Joriy holat (lekin **hardcode qilmang** — bazadan o'qing):

| plan_name | amount_tiyin | so'm | kun |
|---|---|---|---|
| weekly | 1 500 000 | 15 000 | 7 |
| monthly | 3 500 000 | 35 000 | 30 |
| quarterly | 8 300 000 | 83 000 | 90 |

### 6.2 To'lovdan oldingi tekshiruvlar (ilova tomonida)

1. Foydalanuvchi tizimga kirganmi? Yo'q bo'lsa → **ro'yxatdan o'tish** ekraniga
2. Allaqachon PRO'si bormi (`active_pro`)? Bo'lsa → to'lovga yuborilmaydi,
   "Muddati tugagach yangi obuna olishingiz mumkin" deb ko'rsatiladi
3. Hisob emaili bormi (`user.email`)

Bu shunchaki qulaylik uchun — server baribir qaytadan tekshiradi.

### 6.3 Checkout havolasini yasash

Payme GET usuli: parametrlar `;` bilan ajratiladi va **base64** qilinadi.

```
xom satr:
m=<merchant_id>;ac.email=<user.email>;a=<amount_tiyin>;l=<til>;c=<qaytish_url>

havola:
https://checkout.paycom.uz/<base64(xom satr)>
```

Aniq qiymatlar:

- `m` = `6a6b94141aa0d0bde1ab83cf`
- `ac.email` = **`user.email`** — telefon hisobida bu `998XXXXXXXXX@pro.com`
  bo'ladi. Kassa aynan `email` maydoni bilan sozlangan, **o'zgartirmang**.
- `a` = `payme_plans.amount_tiyin` (tiyinda, butun son)
- `l` = `uz` | `ru` | `en`
- `c` = to'lovdan keyin qaytish manzili (6.4 ga qarang)

Base64 **UTF-8 xavfsiz** bo'lishi kerak. Tekshirish uchun rasmiy misol:

```
m=587f72c72cac0d162c722ae2;ac.order_id=197;a=500
→ bT01ODdmNzJjNzJjYWMwZDE2MmM3MjJhZTI7YWMub3JkZXJfaWQ9MTk3O2E9NTAw
```

Sizning kodingiz shu misolda aynan shu natijani bermasa — kodlash noto'g'ri.

### 6.4 Payme'ni ochish va qaytishni ushlash

**Payme WebView ichida ochiladi** (yoki tizim brauzerida — quyidagi
cheklovga qarang).

- `c=` parametriga ilova ushlab oladigan manzil beriladi. Ikki variant:
  - **Deep link**: `c=uz.avtotestu.app://payment-return`
  - yoki universal link: `c=https://www.avtotestu.uz/payment-return`
- WebView'da `shouldOverrideUrlLoading` / `onNavigationStateChange` orqali shu
  manzilga o'tishni ushlab, WebView'ni yopasiz.

> **Diqqat:** Payme sahifasi karta ilovalariga o'tishi va 3-D Secure
> yo'naltirishlari bo'lishi mumkin. WebView'da JavaScript, cookie va
> yangi oyna (`setSupportMultipleWindows`) yoqilgan bo'lishi shart. Agar
> WebView'da muammo chiqsa — tizim brauzerida (Custom Tabs) oching, u
> ishonchliroq.

### 6.5 To'lovdan keyin — eng muhim qism

**Qaytish `c=` ga tushishi to'lov muvaffaqiyatli degani EMAS.** Foydalanuvchi
bekor qilgan bo'lishi ham mumkin. Shuning uchun:

1. WebView yopilgach `get_user_access_state` ni **qayta chaqiring**
2. `active_pro` kelmasa — **darhol "to'lov amalga oshmadi" demang**. Payme
   serveri bilan tasdiqlash bir necha soniya kechikishi mumkin.
   **2 soniyalik oraliq bilan ~5 marta** qayta so'rang.
3. Shundan keyin ham kelmasa: "To'lov tekshirilmoqda, biroz kuting yoki
   sahifani yangilang" deb ko'rsating. **Hech qanday holatda PRO ni ilova
   o'zi yoqmasin.**

---

## 7. Test natijalarini saqlash

Ilova `test_results` jadvaliga **to'g'ridan-to'g'ri yozmaydi**. Faqat RPC orqali:

```js
// Test boshlanganda (PRO testlar uchun majburiy)
const { data: s } = await supabase.rpc('start_test_session', {
  p_variant: <1..100>,
  p_question_source: '<fayl nomi>',
  p_is_premium: <bool>
});

// Test tugagach
const { data: r } = await supabase.rpc('verify_and_save_test_result', {
  p_session_id: s.session_id,        // bepul testda null bo'lishi mumkin
  p_variant: <1..100>,
  p_correct_answers: <0..total>,
  p_total_questions: <1..2000>,
  p_time_taken_seconds: <0..7200>
});
```

Ikkalasi ham `{ ok: true|false, error?: string }` qaytaradi.

---

## 8. Ilova o'qiy oladigan jadvallar (RLS bilan cheklangan)

| Jadval | Ruxsat |
|---|---|
| `payme_plans` | SELECT (faol tariflar, hamma uchun) |
| `profiles` | SELECT/UPDATE — **faqat o'ziniki**; `tariff_days`, `tariff_end_date`, `email` **o'zgartirib bo'lmaydi** (trigger bloklaydi) |
| `subscriptions` | SELECT — faqat o'ziniki |
| `payme_transactions` | SELECT — faqat o'ziniki |
| `test_results` | SELECT/INSERT/DELETE — faqat o'ziniki |
| `news_posts` | SELECT — e'lon qilinganlari |
| `device_licenses` | SELECT — faqat o'ziniki (desktop ilova uchun, mobilda kerak emas) |

---

## 9. Turnstile (mobil)

Ro'yxatdan o'tishda **majburiy** — serverda tekshiriladi, chetlab o'tib bo'lmaydi.

- React Native / Flutter: widget'ni kichik **WebView** ichida ko'rsatib,
  `callback` bergan tokenni JS bridge orqali oling
- Yoki Cloudflare'ning mobil SDK'sidan foydalaning
- Site key: `0x4AAAAAAEGTErygcaoAWce_`
- Cloudflare panelida widget'ning **hostname** ro'yxatiga ilova ishlatadigan
  domen qo'shilishi kerak

Token bir martalik va qisqa muddatli — olinganidan keyin darhol
`phone-signup` ga yuboriladi.

---

## 10. Profilda ko'rsatish

Telefon orqali ochilgan hisobda `user.email` = `998901234567@pro.com`.
Buni **hech qayerda ko'rsatmang**. O'rniga:

```js
function emailToPhoneDisplay(email) {
  if (!email?.toLowerCase().endsWith('@pro.com')) return null;
  const n = normalizeUzPhone(email.split('@')[0]);
  return n ? `+998 ${n.slice(3,5)} ${n.slice(5,8)} ${n.slice(8,10)} ${n.slice(10,12)}` : null;
}
```

`null` qaytsa — bu oddiy email hisobi, email'ning o'zini ko'rsating.

Ism bo'sh bo'lishi normal (telefon hisoblarida ism so'ralmaydi) — "Foydalanuvchi"
deb ko'rsating.

---

## 11. Parolni o'zgartirish

```js
// Ixtiyoriy, lekin tavsiya etiladi: avval eskisini tasdiqlash
await supabase.auth.signInWithPassword({ email: user.email, password: eskiParol });
// Keyin
await supabase.auth.updateUser({ password: yangiParol });
```

`updateUser` doim **joriy sessiya egasiga** amal qiladi — foydalanuvchi faqat
o'z parolini o'zgartira oladi.

---

## 12. Qabul qilish mezonlari (test ro'yxati)

- [ ] `901234567`, `998901234567`, `+998 90 123 45 67` — uchalasi bir xil hisobga kiradi
- [ ] Noto'g'ri raqam va 8 belgidan qisqa parol rad etiladi
- [ ] Turnstile'siz ro'yxatdan o'tish **imkonsiz**
- [ ] Bir xil raqam ikki marta ro'yxatdan o'tolmaydi (`phone_taken`)
- [ ] Ro'yxatdan o'tgach avtomatik tizimga kiradi
- [ ] **Saytda ochilgan hisob bilan ilovada kirish ishlaydi** (va aksincha)
- [ ] Eski email foydalanuvchilari email bilan kira oladi
- [ ] Google orqali kirish deep link bilan qaytadi
- [ ] Tariflar bazadan o'qiladi, hardcode emas
- [ ] Payme checkout to'g'ri summa va `ac.email` bilan ochiladi
- [ ] To'lovdan keyin PRO **qayta so'rov** bilan aniqlanadi, ilova o'zi yoqmaydi
- [ ] Faol PRO'si borga ikkinchi to'lov taklif qilinmaydi
- [ ] **Saytda to'lov qilinsa ilovada ham PRO ko'rinadi**
- [ ] RPC xato bersa PRO "yo'qolmaydi"
- [ ] Interfeysda hech qayerda `@pro.com` ko'rinmaydi
- [ ] Bundle ichida `service_role` yoki maxfiy kalit **yo'q**

---

## 13. Qilmaslik kerak bo'lgan narsalar

- ❌ `service_role` kalitini ilovaga joylashtirish
- ❌ `profiles.tariff_end_date` yoki `subscriptions` ga to'g'ridan-to'g'ri yozish
- ❌ Narxni ilovada hardcode qilish
- ❌ `@pro.com` manzilini foydalanuvchiga ko'rsatish
- ❌ To'lovdan qaytgach PRO ni ilova o'zi yoqishi
- ❌ `payme_*` RPC funksiyalarini klientdan chaqirishga urinish (ular yopiq)
- ❌ Turnstile tekshiruvini faqat ilova tomonida qilish

---

*Savol tug'ilsa — sayt kodidagi mos joylar: `src/lib/phone.ts`,
`src/lib/payme.ts`, `src/pages/Auth.tsx`, `src/contexts/AuthContext.tsx`.*
