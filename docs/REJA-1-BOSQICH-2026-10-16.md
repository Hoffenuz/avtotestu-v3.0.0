# 1-bosqich rejasi — xavfsizlik va pul oqishi (2026-10-16)

Manba: `docs/AUDIT-2026-10-14-30MLN.md` (GPT auditi) + 2026-10-16 da bazada va kodda qayta tekshirilgan dalillar.
Muddat: ~1 hafta. Har band alohida commit/deploy, xavfi pastidan yuqorisiga qarab.

## Holat

| Band | Holat |
|---|---|
| 1.1 Matnlar | ✅ 2026-10-17 (3 tilda; "46% arzon" va "xatolaringiz saqlanadi" keyinga qoldi) |
| 1.2 QAPage | ✅ 2026-10-17 — WebPage'ga almashtirildi; 25 ta yetim snapshot o'chirildi, generator endi o'zi tozalaydi; o'chgan savol manzili botga 404. FAQPage tegilmadi (zararsiz) |
| 1.3 Savol xato holati | ✅ 2026-10-17 — `Savol.loading.test.tsx` |
| 1.4 Lint | ✅ 2026-10-17 — 0 error (edge function manbasi; xatti-harakat o'zgarmagan, qayta deploy shart emas) |
| Desktop havola | ✅ 2026-10-17 — R2 `ilova/AvtoSmart-Setup.exe` (0.1.3, 139 MB) |
| 1.5 SEC-01 | ⏳ egasi qarori (aggregateRating) + migratsiya |
| 1.6 Uzaytirish | ⏳ egasi qarori |

## Bazaviy raqamlar (o'lchov uchun, 2026-10-16)

- Haftalik to'lovlar: 48–81 ta, tushum 1,1–2,05 mln so'm (avg-okt).
- Qayta sotib olganlar: 597 xaridordan 57 tasi — **9,5%**.
- Xaridlarning 57% i 7 kunlik tarif.
- Signup → 7 kunda to'lov: avgust ~21–29%, 7-sentabrdan keyin 6–14%.
  Sabab: signup 2 baravar oshgan (221 → 438/hafta), to'lovchilar soni deyarli o'zgarmagan (~45). Xaridor yo'qolmagan, past niyatli signup qo'shilgan.

1-bosqichdan keyin qaraladigan ko'rsatkich: **qayta xarid ulushi** va **haftalik to'lovlar soni**.

---

## 1.1. Matn va va'dalar (xavfi past, birinchi)

Uchala tilda (uz-lat, uz-cyr, ru) bir xil tuzatiladi:

| Joy | Hozir | Bo'ladi |
|---|---|---|
| `uz-lat.json:566` | "64 ta test varianti 2026 — bepul" | "64 ta YHQ test varianti — 3 tasini bepul yeching" |
| `comparisonBasic1` | "1000 ta savol" | bepul bazaning aniq soni (builddan) |
| `desktopApp` | "Kompyuter ilova" | "Kompyuter ilovasi" |
| `passwordNoteStrong` | "Parolni yozib qo'ying" | "Parolni eslab qoling yoki parol menejerida saqlang" |
| `cardStrategyDesc` | "mashaqqat bilan yechish" | "muntazam yechish" |
| `/test-ishlash` SEO | "1275 savollik baza" (mehmonga) | "Ro'yxatsiz bepul test. PRO'da 1275 savol va izohlar" |
| E-avtomaktab SEO | "javoblar izohi bilan" (bepul) | "Bepul mashq; batafsil izohlar PRO'da" |
| `TestPageSchema.tsx` | "1250+", "bepul, ro'yxatsiz" | to'g'ri raqam va bepul/PRO chegarasi |
| "Eng mashhur" belgisi | dalilsiz | "Tavsiya etiladi" |

Qabul: 3 tilda kalitlar soni teng; `npm run build` o'tadi.

## 1.2. SEO-01 — soxta QAPage

`scripts/generate-savol-pages.cjs:322-347`: `QAPage`, `upvoteCount: 1`, `suggestedAnswer` olib tashlanadi
(foydalanuvchi javob yozadigan Q&A emas — Google qoidasiga zid). BreadcrumbList va oddiy meta qoladi.
`TestPageSchema.tsx` dagi FAQPage ham olib tashlanadi (bunday saytlar uchun FAQ rich result ko'rsatilmaydi).

Qabul: generator qayta ishlaydi, savol sahifalarida QAPage yo'q, sitemap va URL'lar o'zgarmaydi.

## 1.3. ENG-02 — savol sahifasi xato holati

`src/pages/Savol.tsx:61` — `if (!res.ok) return;` dan keyin cheksiz spinner.
Bo'ladi: `loading / error` holati, "Qayta urinish" tugmasi, 3 tilda matn.

Qabul: 404 / tarmoq xatosi / buzuq JSON'da spinner to'xtaydi va xato ko'rinadi (unit test).

## 1.4. Lint

3 ta xato: `admin-manager` 645:12, `bot-user-manager` 108:26 va 108:42. Qabul: `npm run lint` 0 error.

## 1.5. SEC-01 — sharhlar jadvali (`public.reviews`)

**Tekshiruv natijasi (audit da'vosidan farqli):** `submitter_ip` dagi 56 qiymatning hammasi BITTA va xususiy tarmoq
manzili — bu Supabase'ning ichki proksisi, foydalanuvchilarning haqiqiy IP'si emas. Ya'ni shaxsiy ma'lumot sizib chiqmagan.

Lekin bu jadvalda boshqa haqiqiy muammolar bor:
1. Sharh yozish formasi saytda yo'q (oxirgi sharh 2026-04-24, kodda hech qayer yozmaydi), ammo `anon` uchun INSERT ochiq.
   Har kim API orqali soxta baho yubora oladi va u `/test-ishlash` dagi Google `aggregateRating` ga tushadi.
2. IP bo'yicha cheklov ishlamaydi (hamma mehmonda bir xil IP) — kuniga butun dunyo uchun 3 ta mehmon sharhi.
3. `/test-ishlash` ga har kirishda butun `reviews` jadvali yuklanadi.

Qilinadi (migratsiya):
- `anon` / `authenticated` dan INSERT policy va `submitter_ip` ustuniga SELECT/INSERT/UPDATE ruxsati olinadi
  (jadval darajasidagi SELECT ham ustunlar ro'yxatiga almashtiriladi — aks holda ustun REVOKE ishlamaydi);
- `TestPageSchema.tsx` dagi jonli so'rov va `aggregateRating` olib tashlanadi (6 oy oldingi 57 ta mehmon bahosi).

Qabul: anon so'rov `submitter_ip` ni o'qiy olmaydi va INSERT qila olmaydi; admin panel sharhlarni ko'radi.
**Migratsiyani egasi qo'llaydi yoki ruxsat beradi** (avval `apply_migration` ruxsat tizimida rad etilgan).

## 1.6. ENG-01 — PRO'ni uzaytirish (eng katta ish, eng ehtiyotkor)

Hozirgi holat:
- `HomeTopBanner` tugashga 1 kun qolganda "uzaytiring" deydi → `/pro` → `Pro.tsx:432` "faol PRO bor" deb to'xtatadi.
- Serverda ham uch joyda bloklangan: `payme_resolve_account`, `payme_account_state`, `click_create_order` (`already_paid`).
- Muddat qo'shish allaqachon to'g'ri: `payme_perform_transaction` va `click_grant_pro` `GREATEST(now(), tugash)` dan qo'shadi.

O'zgarishlar:
1. Server: uch joydagi `already_paid` sharti olib tashlanadi (`account_busy` qoladi).
   Himoya: muddat bugundan 400 kundan oshib ketmasin (tasodifiy ko'p marta bosishga qarshi).
2. Server: **bekor qilish mantiqi** (`payme_cancel_transaction`, `click_cancel_order`).
   Hozir eski snapshot (`prev_tariff_end_date`) qaytariladi. Uzaytirish ochilsa bu XATO bo'ladi:
   A xarid → B xarid → A bekor → B ning kunlari ham o'chadi.
   Bo'ladi: bekor qilingan xaridning kunlari joriy tugash sanasidan ayriladi (keyingi obunalar siljitiladi),
   natija hech qachon `now()` dan oldin emas.
3. Frontend `Pro.tsx`: faol PRO'da ham tarif tanlanadi; "Hozirgi muddat: X gacha → yangi muddat: Y gacha" ko'rsatiladi.
4. `HomeTopBanner`: oyna 1 kundan 3 kunga.
5. Muddati tugaganlar (oxirgi 14 kun) uchun bosh sahifada "PRO tugadi — davom ettiring" tasmasi.

Test matritsasi (Payme sandbox funksiyalari bilan: `payme_sandbox_*`):

| Ssenariy | Kutiladi |
|---|---|
| Faol PRO + yangi xarid | Kunlar tugash sanasiga qo'shiladi |
| Bir tranzaksiya callback 2–10 marta | Bir marta muddat |
| A → B → A bekor | B ning kunlari saqlanadi |
| B bekor (oxirgisi) | A ning muddati qaytadi |
| Muddati tugagan + xarid | Bugundan boshlanadi |
| Click va Payme deyarli bir vaqtda | Ikkalasi ham qo'shiladi, dublikat yo'q |
| 400 kundan oshish | Aniq rad etiladi, pul olinmaydi |

Deploy: kam trafikli vaqtda, avval SQL, keyin frontend; birinchi 48 soat har bir to'lov qo'lda tekshiriladi
(admin panel: to'lov ↔ obuna mosligi).

## 1.7. (ixtiyoriy) Telegram eslatma

Telegram bog'langan PRO egalariga tugashdan 2 kun oldin bot xabari. Bot VPS'da — alohida ish,
1.6 ishga tushgach qaror qilinadi.

---

## Tartib

1. 1.1 + 1.2 + 1.3 + 1.4 — bitta kun, xavfi past, push.
2. 1.5 — migratsiya fayli tayyorlanadi → egasi qo'llaydi → frontend push.
3. 1.6 — SQL + testlar → sandbox matritsasi → deploy → 48 soat kuzatuv.
4. 1 haftadan keyin: qayta xarid ulushi va haftalik to'lovlar bazaviy raqamlar bilan solishtiriladi.

## Ochiq qarorlar

- [ ] Uzaytirishda kunlar qo'shilsinmi (tavsiya: ha) va yuqori chegara 400 kunmi?
- [ ] `aggregateRating` butunlay olib tashlansinmi (tavsiya: ha) yoki keyin haqiqiy sharh tizimi qilinsinmi?
- [ ] Muddati tugaganlar tasmasi 1-bosqichga kirsinmi?
- [ ] Telegram eslatma hozirmi yoki keyinmi?
