# 2-bosqich rejasi — o'lchov va qaytarib olish (2026-10-18)

Manba: `docs/REJA-YOL-XARITASI-2026-10-18.md`, audit (`docs/AUDIT-2026-10-14-30MLN.md`), 2026-10-18 dagi baza o'lchovlari.
Muddat: ~2–3 hafta. Har band alohida commit/deploy, avval o'lchov, keyin o'zgarish.

## Nega shu tartib

1-bosqichda pul oqishi to'xtatildi (uzaytirish ishlaydi). Endi savol: **o'zgarishlar foyda beryaptimi?**
Buni bilish uchun avval ishonchli raqam kerak (2A), keyin eng ko'p odamga yetadigan qaytarish yo'li (2B).

Bugungi raqamlar (2026-10-18):

| Ko'rsatkich | Qiymat |
|---|---|
| Faol PRO | 188 |
| — shundan Telegram bog'langan | 18 (≈10%) |
| Oxirgi 14 kunda muddati tugagan | 104 (Telegram: 3) |
| 3 kun ichida tugaydigan | 33 |
| Jami foydalanuvchi / Telegram bog'langan | 7 960 / 398 |
| Qayta xarid ulushi (bazaviy, 10-16) | 9,5% |

Xulosa: Telegram eslatma hozir PRO egalarining atigi 10% iga yetadi. **Saytdagi tasma hammasiga yetadi** — shuning uchun u oldinda.

---

## Holat (2026-10-18)

| Band | Holat |
|---|---|
| 2.1 Xarid o'lchovi | ✅ kod (57ed2e7): GA4 `purchase` (ID/summa, dublikatsiz); `admin_panel_weekly` SQL — ⏳ migratsiya `docs/sql/2026-10-18-stage2-metrics.sql` |
| 2.2 GA page_view bir marta | ✅ 57ed2e7 |
| 2.3 Admin haftalik jadval | ✅ admin fd0e4fe — migratsiyadan keyin ko'rinadi |
| Log kamaytirish | ✅ test oynalari natija yuklamaydi; bo'lim sonlari bitta so'rov (migratsiyadan keyin) |
| 2.4 "PRO tugadi" tasmasi | ✅ a65e53a |
| 2.5 Uzaytirish matni | ✅ a65e53a |
| 2.6 Telegram eslatma | ⏸ egasi qarori (qaysi bot) |
| 2.7 Parol tiklash Telegram orqali | ⏸ egasi qarori (auth o'zgarishi) |
| 2.8 Izoh qulfi + namuna | ✅ fdec09d |
| 2.9 Mobil /pro foydalar | ✅ fdec09d |
| 2.10 Taqqoslash aniqligi | ✅ fdec09d |
| 2.11 Brend | ✅ fdec09d |
| 2.12 Sitemap lastmod | ✅ 85de5bf |
| 2.13 Til sahifalari | ✅ 924aae0 — /ru, /cyr botga o'z tili bilan (tekshirildi); asosiy snapshotlarga hreflang |
| 2.14 Darslik progressi hisob bo'yicha | ✅ |

## 2A. O'lchov (1-hafta, birinchi)

### 2.1 Xarid serverda hisoblanadi (ENG-08) — eng muhim

Hozir: `payment_complete` faqat foydalanuvchi to'lovdan keyin `/profile` ga **qaytsa** yuboriladi. Qaytmagan xaridor statistikaga tushmaydi, GA'da tushum yo'q.

Qilinadi:
- Haftalik ko'rsatkichlar **bazadan** hisoblanadi (to'lov jadvallari — yagona haqiqat manbai): yangi SQL ko'rinish/funksiya
  `admin_weekly_metrics`: to'lovlar soni, tushum, yangi xaridor vs qayta xaridor, uzaytirish (faol PRO ustiga), refund, signup → 7 kunda to'lov.
- GA uchun: `purchase` hodisasi `transaction_id`, `value`, `currency`, `provider` bilan; brauzerda bir marta (transaction ID bo'yicha dublikatsiz).
  Serverdan GA'ga (Measurement Protocol) yuborish — ixtiyoriy, GA'da `api_secret` yaratish kerak (egasi).

Qabul: bazadagi to'lovlar soni = metrikadagi soni; bir to'lov ikki marta sanalmaydi; refund ayriladi.
Xavf: past (faqat o'qish, to'lov oqimiga tegilmaydi).

### 2.2 GA sahifa ko'rishi bir marta (ENG-07)

Tasdiqlangan: `index.html` dagi `gtag('config', ...)` avtomatik page_view yuboradi, `track.ts` ham yuboradi — birinchi sahifa ikki marta sanaladi.
Qilinadi: `config` da `send_page_view: false`, yagona egasi `RouteTracker`. Qabul: GA DebugView'da har sahifaga bitta hodisa.

### 2.3 Admin panelda haftalik ko'rsatkichlar

2.1 dagi SQL'dan bitta jadval: oxirgi 8 hafta. **Eski joylashuv saqlanadi** (admin uslubi qoidasi), faqat yangi blok qo'shiladi.

## 2B. Qaytarib olish (2-hafta)

### 2.4 "PRO tugadi — davom ettiring" tasmasi (eng katta ta'sir)

Kim ko'radi: muddati oxirgi 14 kunda tugagan (hozir 104 kishi) — kirganda bosh sahifa va `/profile` da.
Matn: "PRO 12.10 da tugadi. Davom ettirsangiz, xatolaringiz va natijalaringiz joyida." + tarif tugmasi.
Yopilsa — o'sha tugash sanasi uchun boshqa chiqmaydi (HomeTopBanner'dagi kabi).
O'lchov: `expired_banner_view` / `_click` + 2.1 dan qaytgan xaridorlar.
Xavf: past (faqat UI, `get_user_access_state` allaqachon `expired_pro` qaytaradi).

### 2.5 Uzaytirish tasmasi matni

Endi uzaytirish ishlaydi — tasma "kunlaringiz yo'qolmaydi, yangi muddat shu sanadan keyin qo'shiladi" deb aytsin.
Oyna 1 kun qoladi (avvalgi qaror); 2.1 o'lchovidan keyin 3 kun bilan solishtirish mumkin.

### 2.6 Telegram eslatma — kichik hajmda

Faqat Telegram bog'langan PRO egalariga (≈10%), tugashdan 1 kun oldin, bitta xabar, o'chirish tugmasi bilan.
Kim yuboradi: public bot (`@Avtotestubot`, VPS) yoki admin bot — **egasi qarori**.
Telegram ulanishini ko'paytirish (398 / 7 960) alohida masala — profil va natija sahifasida "Telegram'ni ulang" taklifi.

### 2.7 Parolni o'zi tiklash (UX-05)

Hozir: "Parolni tiklash" faqat adminga yozishga olib boradi.
Qilinadi: Telegram bog'langan hisob — mavjud `telegram-login` oqimi orqali kirib, yangi parol o'rnatadi.
Telegram bog'lanmagan hisob — avvalgidek admin orqali (identifikatsiyasiz parol almashtirilmaydi).
Xavf: o'rta (auth) — alohida sinov matritsasi bilan.

## 2C. PRO'ga o'tish (3-hafta)

| # | Ish | Nega |
|---|---|---|
| 2.8 | **UX-03** "Izoh · PRO" qulf belgisi oldindan + bitta bepul sifatli izoh namunasi | Bosgandan keyin kutilmagan modal o'rniga oldindan aniq |
| 2.9 | **UX-02** mobil `/pro`: narxdan oldin 2–3 qator foyda | Mobilda tarif kartasi sarlavhadan oldin turadi |
| 2.10 | **UX-04** bepul/PRO taqqoslash: chizilgan matn o'rniga "3 ta / 64 ta variant" | Ekran o'quvchi va aniqlik |
| 2.11 | **UX-08** brend bir xil: "AvtoSmart — avtotestu.uz" | Auth kartasida boshqa nom |

Har biri 2.1 o'lchovi bilan oldin/keyin solishtiriladi.

## 2D. Texnik SEO (parallel, kichik)

| # | Ish |
|---|---|
| 2.12 | **SEO-03** sitemap `lastmod` — kontent o'zgargan sanadan, har buildda emas (hozir har deploy 400+ URL sanasini yangilaydi) |
| 2.13 | **SEO-02/05** `/ru`, `/cyr` snapshotlari o'z tilidagi matn bilan; hreflang faqat haqiqiy tarjimaga |
| 2.14 | **ENG-06** darslik progressi hisobga bog'lanadi (bir qurilmada ikki hisob aralashmasin) |

---

## Tartib va tekshiruv nuqtalari

1. **2.1 + 2.2** → 7 kun toza bazaviy raqam yig'iladi.
2. **2.3** admin panel.
3. **2.4 + 2.5** → 7 kundan keyin: qayta xarid ulushi 9,5% bilan solishtiriladi.
4. **2.7**, keyin **2C** bittadan, har biridan keyin o'lchov.
5. **2D** — bo'sh vaqtda, PRO oqimiga tegmaydi.

Bosqich tugash sharti: haftalik ko'rsatkichlar bazadan ishonchli chiqadi; qayta xarid ulushi va qaytgan xaridorlar soni bazaviy qiymat bilan solishtirilgan.

## Egasi qarorlari

- [ ] 2.1: GA'ga serverdan yuborish kerakmi (GA'da `api_secret` yaratish) yoki faqat baza + brauzer hodisasi yetarlimi? (tavsiya: hozircha baza + brauzer)
- [ ] 2.6: Telegram eslatmani qaysi bot yuboradi — public (`@Avtotestubot`) yoki admin bot? Yoki hozircha qoldiramizmi? (tavsiya: 2.4 dan keyin)
- [ ] 2.7: parol tiklash Telegram orqali — rozimisiz?
