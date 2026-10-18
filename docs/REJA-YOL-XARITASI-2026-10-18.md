# Sayt yo'l xaritasi — 3 bosqich (2026-10-18)

Manba: `docs/AUDIT-2026-10-14-30MLN.md` (GPT auditi, biz tekshirgan holda), `docs/REJA-1-BOSQICH-2026-10-16.md`.
Har band — alohida commit/deploy. Bitta bandni tugatib, tekshirib, keyingisiga o'tamiz.

## Asosiy xulosa (nega shu tartib)

- Xaridor yo'qolmagan: signup 2 baravar oshgan, to'lovchilar ~45/hafta o'zgarmagan.
- Eng katta yo'qotish — **qayta xarid 9,5%** va faol PRO'ni uzaytirib bo'lmasligi.
- Shuning uchun tartib: avval pul oqishi va ishonch (1), keyin o'lchov va PRO'ga o'tish (2), keyin o'sish (3).

O'lchanadigan ko'rsatkichlar (har hafta): haftalik to'lovlar soni, tushum, qayta xarid ulushi, signup → 7 kunda to'lov.
Bazaviy (2026-10-16): 48–81 to'lov/hafta, 1,1–2,05 mln so'm/hafta, qayta xarid 9,5%.

---

## 1-bosqich — xavfsizlik va pul oqishi (~1 hafta)

| # | Ish | Holat |
|---|---|---|
| 1.1 | Noto'g'ri va'dalar, 3 tilda | ✅ 836db86 |
| 1.2 | Soxta QAPage, yetim savol sahifalari → 404 | ✅ 836db86 |
| 1.3 | Savol sahifasi xato holati | ✅ 836db86 |
| 1.4 | Lint 0 error | ✅ 836db86 |
| 1.5 | **SEC-01/02** — `reviews`: anon INSERT yopiladi, `submitter_ip` o'qilmaydi, `aggregateRating` va jonli so'rov olib tashlanadi | ✅ bazada 2026-10-18 (`sec01_reviews_lockdown`); frontend push kutilmoqda |
| 1.6 | **ENG-01** — faol PRO'ni uzaytirish: `docs/sql/2026-10-18-pro-renewal.sql` (4 joydagi to'siq, 400 kun chegara, bekor qilishda faqat shu xarid kunlari ayriladi), Payme `pro_limit` xatosi, bot ustidan yozmaydi, `/pro` "hozirgi → yangi muddat", `/profile` tasdiqni muddat surilishi bo'yicha aniqlaydi. 12 ssenariy rollback tranzaksiyada PASS (`...pro-renewal.test.sql`). Banner oynasi 1 kun qoldi (avval 3 kun e'tiborsiz qolgani uchun ataylab 1) | ⏳ migratsiya + edge deploy |
| 1.7 | **UX-01/ENG-03** — chiqib ketilgan testga qaytilganda darhol "0%, 25:00" natija: vaqti tugagan holat o'chiriladi, "Boshlash" har doim yangi test | ✅ kodda, push kutilmoqda |
| 1.8 | **SEC-03** — Payme/Click/phone-signup loglaridan telefon, IP, to'liq payload olib tashlanadi (faqat ID, status, vaqt) | ✅ kodda 2026-10-18; edge deploy kutilmoqda. Eski loglar Supabase saqlash muddati bilan o'zi o'chadi |
| — | Admin bot tugmalari qotgan: webhook o'chirilgan edi (url bo'sh) | ✅ 2026-10-18 tiklandi (`docs/diag/bot-diag-webhook.ts`); bot-diag 410 ga qaytarilishi kerak |
| 1.9 | Qolgan matnlar: "kunlik hisobda 46% arzon", "hisobingizga kirsangiz xatolaringiz saqlanadi", "Qorong'i/Tungi rejim" yagona | navbatda |

Bosqich tugash sharti: anon IP o'qiy olmaydi; faol PRO egasi uzaytira oladi va kunlari yo'qolmaydi;
yangi test har doim yangi taymer bilan boshlanadi; to'lov loglarida shaxsiy ma'lumot yo'q.

## 2-bosqich — o'lchov va PRO'ga o'tish (~2–3 hafta)

**2A. O'lchov (avval shu — busiz tajribalarni baholab bo'lmaydi)**

| # | Ish |
|---|---|
| 2.1 | **ENG-08** — xarid hodisasi serverdan (Payme/Click tasdiqlaganda), brauzerga qaytmagan xaridor ham hisobda; transaction ID bo'yicha dublikatsiz |
| 2.2 | **ENG-07** — GA'da page view bir marta (index.html + RouteTracker takrori) |
| 2.3 | Admin panelda haftalik ko'rsatkichlar: to'lov, tushum, qayta xarid, signup→to'lov (eski joylashuv saqlanadi) |

**2B. Qaytarib olish**

| # | Ish |
|---|---|
| 2.4 | Muddati tugaganlar (oxirgi 14 kun) uchun "PRO tugadi — davom ettiring" tasmasi |
| 2.5 | Telegram eslatma: bog'langan PRO egasiga tugashdan 2 kun oldin (faqat roziligi bilan, o'chirish imkoniyati) |
| 2.6 | **UX-05** — parolni tiklash: Telegram bog'langan hisob o'zi tiklaydi, admin orqali emas |

**2C. PRO sahifasi va bepul → PRO**

| # | Ish |
|---|---|
| 2.7 | **UX-03** — "Izoh · PRO" qulf belgisi oldindan; bitta sifatli izoh bepul namuna |
| 2.8 | **UX-02** — mobil `/pro`: narxdan oldin 2–3 satr foyda + namuna |
| 2.9 | **UX-04** — bepul/PRO taqqoslash: chizilgan matn o'rniga "3 ta / 64 ta variant" |
| 2.10 | **UX-08** — brend bir xil: "AvtoSmart — avtotestu.uz" |

**2D. Texnik SEO**

| # | Ish |
|---|---|
| 2.11 | **SEO-03** — sitemap `lastmod` kontent o'zgargan sanadan, har buildda emas |
| 2.12 | **SEO-02/05** — `/ru`, `/cyr` snapshotlari o'z tilidagi body bilan; hreflang faqat mavjud tarjimaga |
| 2.13 | **ENG-06** — darslik progressi hisobga bog'lanadi (`user_id` bilan) |

Bosqich tugash sharti: haftalik dashboard ishonchli raqam beradi; qayta xarid ulushi bazaviy 9,5% bilan solishtiriladi.

## 3-bosqich — o'sish (~1–2 oy)

| # | Ish |
|---|---|
| 3.1 | **O'quv yo'li**: test natijasi → 2–3 zaif mavzu → shu mavzuning izohi/videosi → 5 savollik mashq; keyingi kirishda "Bugungi 10 daqiqa" |
| 3.2 | **UX-06** — darslikda 1–2 ochiq demo dars |
| 3.3 | **SEO-08 + pilot** — 10–15 ta sifatli sahifa (sabab, noto'g'ri variantlar nega xato, qoida bandi); savol izohlari sifati |
| 3.4 | Telegram kanal: kuniga bitta savol, ertasi izoh, saytga havola |
| 3.5 | Narx tajribasi (masalan oylik 39 ming) — faqat 2A o'lchovi ishlagach |
| 3.6 | **Avtomaktab pilot** (egasi): 10 suhbat → 3 hamkor; hamkor kodi va aktivatsiya |
| 3.7 | **ENG-04** — pulli izoh/video fayllarini server tekshiruvi orqali berish (ochiq JSON o'rniga) |
| 3.8 | **SEC-04** — telefon bilan ro'yxatda OTP yoki Telegram tasdig'i |
| 3.9 | **SEC-05/06** — test natijasi va javob statistikasini server hisoblashi (reyting/sovrin bo'lsa) |
| 3.10 | **ENG-05** — 20 savollik test uchun butun bazani yuklamaslik |

## Qilinmaydi (hozircha)

- Domen yoki URL'larni almashtirish; ommaviy AI maqolalar; raqib brendi uchun sahifalar.
- Dalilsiz narx tushirish yoki bepul testni yopish.
- O'lchov ishlamasdan reklama budjeti.
- Mobil/desktop ilovaga yangi katta funksiya — avval sayt bilan bir xil auth/PRO/kontent.

## Egasi qarorlari (ochiq)

- [ ] 1.5: `aggregateRating` olib tashlansinmi? Migratsiyani kim qo'llaydi?
- [ ] 1.6: faol PRO ustiga xaridda kunlar qo'shilsinmi, chegara 400 kun?
- [ ] 2.5: Telegram eslatma 2-bosqichdami?
- [ ] 3.6: avtomaktab pilotiga vaqt bormi?
