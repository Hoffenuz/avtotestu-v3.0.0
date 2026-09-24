# Telegram admin boti — o'rnatish va foydalanish

> Bot: **@Avtotesturganchbot** (id `7785739423`)
> Funksiya: `supabase/functions/telegram-admin-bot/index.ts`
> Manzil: `https://lvdndseuobzbgzrarygu.supabase.co/functions/v1/telegram-admin-bot`

---

## ⚠️ Token haqida

Bot tokeni suhbatda ochiq yozilgan edi. Hozircha eski token ishlayapti.
Qulay payt **@BotFather → `/revoke`** qilib yangi token oling va
`ADMIN_BOT_TOKEN` sirini yangilang, so'ng webhook ni qayta o'rnating
(6-bo'limga qarang).

---

## 1. Holat — hammasi tayyor

| Qadam | Holat |
|---|---|
| Jadvallar va RPC lar | ✅ yaratilgan |
| Edge Function | ✅ deploy qilingan (v3) |
| Sirlar | ✅ o'rnatilgan |
| Webhook | ✅ o'rnatilgan, xatosiz |

**Sizga qo'shimcha sozlash kerak emas.** Botga yozsangiz bo'ldi.

Ishlatiladigan sirlar:

| Nom | Vazifasi |
|---|---|
| `ADMIN_BOT_TOKEN` | Bot tokeni |
| `ADMIN_BOT_HOOK_SECRET` | Webhook sarlavhasi — begona so'rovni to'xtatadi |
| `SUPABASE_ANON_KEY` | Parolni tekshirish uchun (Supabase o'zi beradi) |

> `ADMIN_BOT_LINK_CODE` **endi kerak emas** — uni o'chirib
> tashlashingiz mumkin.

---

## 2. Kirish — bir marta

Botga (**@Avtotesturganchbot**) saytdagi admin hisobingiz bilan:

```
/kirish avtomaktab1@gmail.com <saytdagi parolingiz>
```

Nima bo'ladi:

1. Xabaringiz **darhol o'chiriladi** (parol chatda qolmaydi)
2. Parol Supabase Auth orqali tekshiriladi
3. `user_roles` da `admin` yoki `super_admin` borligi tekshiriladi
4. Telegram hisobingiz **eslab qolinadi**

Shundan keyin **qayta kirish shart emas** — botga yozsangiz sizni
Telegram hisobingiz bo'yicha taniydi. `/boshlash` — menyu.

### Parol topishga qarshi

5 marta noto'g'ri urinishdan keyin o'sha Telegram hisobi **1 soatga
bloklanadi** (`telegram_login_attempts`).

---

## 3. Nima qila oladi

### 💳 To'lovlar — barcha adminlar

| Tugma | Nima ko'rsatadi |
|---|---|
| 📊 Umumiy | Bugun · Kecha · 7 kun · Shu oy · O'tgan oy · Jami |
| 📅 Kunlik | Oxirgi 7 kun, kun bo'yicha |
| 🧾 Oxirgi 10 ta | So'nggi to'lovlar: sana, kim, tarif, summa |

Sanalar **Toshkent vaqti** bo'yicha hisoblanadi.

### ⭐ PRO berish — barcha adminlar

1. Telefon raqam yoki email yuboriladi
2. Bot foydalanuvchini topadi va holatini ko'rsatadi
3. Muddat tanlanadi: **7 / 30 / 90 / boshqa** (1–366)
4. Amaldagi obunasi bo'lsa — bot **so'raydi**:
   - ➕ Ustiga qo'shish (qolgan + yangi)
   - 🔄 Almashtirish (bugundan yangi)
5. Qo'llanadi va tasdiq ko'rsatiladi

> Chek skanerlash **yo'q** — admin profili orqali ishlatilgani uchun
> kerak emas.

### 🔑 Parol o'zgartirish — FAQAT super_admin

1. Telefon raqam yoki email
2. **🎲 Avtomatik** (9 belgi, chalkashtiradigan harflarsiz) yoki
   **✍️ O'zim yozaman** (kamida 8 belgi)
3. Qo'lda yozilgan parol xabari **avtomatik o'chiriladi**
4. Yangi parol ko'rsatiladi — foydalanuvchiga yuboring

Oddiy `admin` rolida bu tugma **umuman ko'rinmaydi**.

---

## 4. Buyruqlar

| Buyruq | Vazifasi |
|---|---|
| `/boshlash`, `/start`, `/menu` | Asosiy menyu |
| `/bekor` | Joriy amalni to'xtatish |
| `/kirish <email> <parol>` | Hisobni ulash (bir marta) |

---

## 5. Xavfsizlik

**Uch qatlam:**

1. `X-Telegram-Bot-Api-Secret-Token` — begona so'rov 403 oladi
2. `telegram_admins` jadvali — faqat ulangan Telegram hisoblari
3. Rol tekshiruvi — parol uchun `super_admin` shart

**Audit:** har bir o'zgartirish `audit_logs` ga yoziladi:
`telegram_link`, `pro_grant`, `password_reset`.
`table_name = 'telegram_admin_bot'`.

**Parol matni** hech qayerga yozilmaydi — na logga, na `audit_logs` ga,
na `telegram_bot_state` ga.

Kim nima qilganini ko'rish:

```sql
select a.created_at, u.email as admin, a.action, a.new_values
from public.audit_logs a
left join auth.users u on u.id = a.user_id
where a.table_name = 'telegram_admin_bot'
order by a.created_at desc limit 50;
```

---

## 6. Webhook (faqat token o'zgarsa)

Token yangilangandan keyin:

```bash
curl -X POST "https://api.telegram.org/bot<YANGI_TOKEN>/setWebhook"   -H "Content-Type: application/json"   -d '{
    "url": "https://lvdndseuobzbgzrarygu.supabase.co/functions/v1/telegram-admin-bot",
    "secret_token": "WB3WSyWMFAo6fad1UYxNASOHpIh7W7L2Q_cvhUMeK_k",
    "allowed_updates": ["message", "callback_query"],
    "drop_pending_updates": true
  }'
```

Boshqa paytda tegish shart emas.

---

## 7. Baza obyektlari

| Obyekt | Vazifasi |
|---|---|
| `telegram_admins` | Telegram id ↔ admin hisobi |
| `telegram_bot_state` | Suhbat bosqichi (Edge Function holatsiz) |
| `telegram_login_attempts` | Kirish urinishlari, bloklash |
| `admin_payment_stats()` | Davrlar bo'yicha to'lov yig'indisi |
| `admin_payment_daily(int)` | Kunlik taqsimot |
| `admin_payment_recent(int)` | Oxirgi to'lovlar |
| `admin_find_by_email(text)` | Foydalanuvchini topish + roli |
| `admin_role_of(uuid)` | Hisobning roli |

Ikkala jadvalda ham **RLS yoqilgan, politika yo'q** — ya'ni ularga
faqat `service_role` (Edge Function) kiradi. RPC lar ham
`anon`/`authenticated` dan olib tashlangan.

---

## 8. Tarif sanasi — muhim

`tariffEnd()` mantiqi `bot-user-manager` va `admin-manager` bilan
**aynan bir xil**: UTC+5 → kun boshi → N kun → −1 soniya (23:59:59).

Bu bir xil bo'lishi **shart**. Aks holda bot bergan muddat sayt
hisoblagani bilan mos kelmaydi va foydalanuvchi bir kun yo'qotadi
yoki ortiq oladi.

---

## 9. Nosozlik

| Belgi | Sabab |
|---|---|
| Bot javob bermaydi | Webhook o'rnatilmagan yoki sir mos emas |
| Har doim 403 | `ADMIN_BOT_HOOK_SECRET` webhook dagi bilan farq qiladi |
| «Bunday hisob topilmadi» | Email bazada yo'q yoki noto'g'ri yozilgan |
| «Bu hisobda admin huquqi yo'q» | `user_roles` da yozuv yo'q |
| «Juda ko'p urinish» | 5 marta xato parol — 1 soat kutiladi |
| Parol tugmasi ko'rinmaydi | Rol `admin`, `super_admin` emas |

Loglar: Supabase panel → Edge Functions → `telegram-admin-bot` → Logs.

---

# Ikkinchi bot — @Avtotestubot (ommaviy)

> Funksiya: `supabase/functions/telegram-public-bot/index.ts`
> Manzil: `.../functions/v1/telegram-public-bot`
> Bot: **@Avtotestubot** ("AvtoTest 2026"), id `7981842217`

## Vazifasi

Bitta ish: **foydalanuvchini saytga yo'naltirish.** Hech qanday
ma'lumot o'zgartirmaydi, hech kimga huquq bermaydi.

| Element | Nima |
|---|---|
| Pastdagi tugma | `📝 Test ishlash` — Mini App ochadi |
| Yozish maydoni yonida | `Kirish` — Mini App ochadi |
| `/start` (1-marta) | To'liq tanishtiruv xabari |
| `/start` (keyingi) | Qisqa eslatma |
| Har qanday matn | Qisqa eslatma |

## Token

Token **kod ichida yozilgan** (`FALLBACK_TOKEN`) — siz shunday
so'radingiz va uni keyin almashtirasiz.

`PUBLIC_BOT_TOKEN` siri o'rnatilsa, u **ustun turadi**. Ya'ni tokenni
sirga ko'chirish uchun kodni o'zgartirish shart emas.

> ⚠️ Kod git da saqlanadi, ya'ni token tarixga tushadi. Sinovdan
> keyin @BotFather → `/revoke` qilib yangi token oling va uni
> `PUBLIC_BOT_TOKEN` siriga yozing — kod o'zgarmaydi.

## Webhook sirini keyin qo'shish

Hozir `PUBLIC_BOT_HOOK_SECRET` o'rnatilmagan va bot **sirsiz** ishlaydi.
Bu ataylab: bot hech narsani o'zgartirmaydi, eng yomoni — begona odam
salomlashuv xabarini oladi.

Qo'shmoqchi bo'lsangiz:

```bash
# 1) Sirni o'rnating (Supabase panel → Edge Functions → Secrets)
PUBLIC_BOT_HOOK_SECRET=<tasodifiy_qiymat>

# 2) Webhook ni sir bilan qayta o'rnating
curl -X POST "https://api.telegram.org/bot<TOKEN>/setWebhook" \
  -H "Content-Type: application/json" \
  -d '{"url":"https://lvdndseuobzbgzrarygu.supabase.co/functions/v1/telegram-public-bot",
       "secret_token":"<tasodifiy_qiymat>",
       "allowed_updates":["message"]}'
```

## O'lchov

`telegram_bot_users` jadvali bot orqali kelganlarni yozib boradi:
`telegram_id`, `username`, `first_name`, `language_code`,
`first_seen_at`, `start_count`.

```sql
select * from public.telegram_bot_stats();
```

Bugun / 7 kun / shu oy / jami — nechta **yangi** odam kelgani.

> Ilgari bot qancha odam olib kelayotgani umuman ko'rinmasdi.

## Ikkala bot farqi

| | @Avtotestubot | @Avtotesturganchbot |
|---|---|---|
| Kim uchun | Hamma | Faqat adminlar |
| Vazifa | Saytga yo'naltirish | To'lovlar, PRO, parol |
| Ma'lumot o'zgartiradimi | ❌ yo'q | ✅ ha |
| Kirish talab qiladimi | ❌ yo'q | ✅ `/kirish` |
| Funksiya | `telegram-public-bot` | `telegram-admin-bot` |
