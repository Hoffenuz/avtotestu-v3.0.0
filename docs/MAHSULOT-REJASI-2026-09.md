# AvtoSmart — mahsulot rejasi (2026-09)

**Sana:** 2026-09-10
**Manba:** (1) foydalanuvchi joylashtirgan strategik tahlil (Oson Prava'ga javob), (2) `docs/O-SISH-REJASI.md` — real Search Console/Supabase/Ads raqamlari, (3) `docs/STARTUP-GOYALAR.md` — e'tiborni tarqatmaslik haqida ogohlantirish, (4) shu sessiyada admin panel va asosiy saytda bajarilgan ishlar.

Bu hujjat uchta manbani BITTA amaliy rejaga birlashtiradi. Ular orasida ziddiyat bor joylarda (masalan "PRO'ni qulflamang" vs "PRO qiymatini tushurmang") — pastda aniq hal qilingan.

---

## 0. Uchta hujjat qanday bog'lanadi

| Hujjat | Nima haqida | Kuchi |
|---|---|---|
| `O-SISH-REJASI.md` | **Nega** hozir pul kam kelayapti (raqamlar bilan) | Haqiqiy o'lchov: 2094 klik/kun, 0.42% konversiya, Telegram bot 26x samaraliroq |
| Joylashtirilgan matn | **Nima** qurish kerak (Oson Prava'ga javob) | Mahsulot fikri: diagnostika, shaxsiy reja, PRO pozitsiyasi |
| `STARTUP-GOYALAR.md` | **Nimaga tegmaslik** kerak | Ogohlantirish: yangi loyihaga chalg'imang, birinchi shu saytni oxirigacha yeching |
| Shu sessiya | **Nima allaqachon qilindi** | Admin panel, daromad hisob-kitobi, PRO qayta yopish, funnel tekshiruvi |

**Asosiy xulosa, uchalasi ham rozi:** muammo trafik emas — **konversiya** (0.42%, normal 1-2%). Yangi sahifa yoki yangi loyiha emas, **mavjud foydalanuvchidan ko'proq pul va sodiqlik** olish kerak.

---

## 1. Hozirgi holat — nima allaqachon bor

### Texnik asos
- React 18 + Vite + Supabase (Postgres, RLS, Edge Functions) + Cloudflare Pages.
- Savol bazasi: 1250 ta (1009 bepul + PRO qo'shimchasi), variant testlari, mavzuli testlar, real imtihon simulyatori.
- To'lov: Payme (avtomatik) + Naqt/qo'lda (admin orqali "Tarif berish"). Ikkalasi ham endi to'g'ri hisoblanadi (shu sessiyada tuzatildi — pastda).
- Admin panel (`avtotestu-admin-3.0.0-main`): Dashboard, Users, Payme, Moliya (Naqt), Testlar, Sozlamalar, Arxiv — yaqinda to'liq qayta ko'rib chiqilgan.
- Telegram: guruh (@avtosmartuzb, 317 a'zo), admin/ochiq botlar (@avtosmart1, @Avtotestubot, 106 foydalanuvchi). Tashqi bot serveri (droplet) alohida ishlaydi — saytga hali ulanmagan.
- GA4 funnel: `page_view`, `paywall_view`, `paywall_cta_click`, `checkout_start`, `guest_buy_click`, `payment_complete` — hammasi jonli tekshirilgan va ishlaydi.

### Real raqamlar (`O-SISH-REJASI.md`dan, 2026-09)
- Trafik: ~2094-2226 klik/kun, **94.2%i bosh sahifadan**. Boshqa sahifalar (`/variant`, `/mavzuli`, `/darslik`) Google'dan deyarli hech narsa olmaydi.
- Konversiya: **0.42%** (klik→to'lov). Normal: 1-2%. Bu — eng katta, eng arzon imkoniyat.
- Ro'yxatdan o'tish: ~30/kun (iyulga nisbatan +40%).
- Tarif taqsimoti: Haftalik 67.6%, Oylik 29.6%, 3 oylik 2.8% — odamlar arzonini tanlaydi, oylikka ko'tarish mexanizmi yo'q.
- Telegram bot orqali reklama — sayt havolasiga nisbatan **26 barobar** samaraliroq (9.8% vs 0.38% harakat).

### Shu sessiyada tuzatilgan/qilingan ishlar
1. **Admin panel to'liq audit va tozalash**: o'lik sahifalar (`UsersPageNew`, `PaymentStatisticsPage`, eski `useAdminData.ts` — 254 qator dublikat kod) o'chirildi, `UsersPage.tsx` (1249→166 qator) modullarga bo'lindi.
2. **Dashboard "qotish" muammosi tuzatildi**: kirilganda 82,000+ qatorli `test_results` jadvali 2 marta, `profiles` 3 marta to'liq yuklanardi — endi bitta tayyor SQL agregatsiyadan foydalaniladi (~180 so'rovdan ~20 taga).
3. **Vaqt zonasi xatosi tuzatildi**: server (Deno/UTC) va Toshkent (UTC+5) orasidagi 5 soatlik farq "bugungi daromad/yangi user" sonlarini noto'g'ri hisoblardi.
4. **Eng jiddiy topilma — takroriy to'lovlar yo'qolishi**: "Tarif berish" amali `subscriptions` jadvaliga yozuv qo'shmasdi, shuning uchun bir necha marta to'lagan mijozning faqat oxirgi to'lovi hisoblanardi. Endi to'liq to'lov tarixi saqlanadi va audit qilinadi.
5. **Payme/Moliya bo'limlariga**: erkin sana oralig'i bo'yicha tushum hisoblash (kalendar) + kechagiga nisbatan +/- ko'rsatkichlar (Dashboard va Moliyada).
6. **"Xatolar ustida ishlash" va "Xatolarim" qayta PRO qilindi** — avval ro'yxatdan o'tish yetarli edi (ro'yxatdan o'tishni oshirish uchun o'lchangan qaror edi), lekin PRO qiymatini pasaytirmaslik uchun qaytarildi. Home sahifadagi 3 ta tezkor tugma kattalashtirildi.
7. **`delete_test_result`** amali qo'shildi (avval "o'chirish" tugmasi ishlamas edi).
8. `pg_net` xavfsizlik ogohlantirishi, ESLint xatolari, SEO keywords — barchasi tozalangan.

---

## 2. Ziddiyatni hal qilish: "PRO'ni qulflamang" vs "PRO qiymatini saqlang"

Joylashtirilgan matn: *"savollarni bloklash orqali raqobatlashmang... PRO shaxsiy tayyorgarlik rejasi, cheksiz xatolar ustida mashq... bo'lsin"*.

Siz esa shu sessiyada aniq qaror qildingiz: xatolar ustida ishlash **PRO bo'lib qolishi kerak**, chunki foydalanuvchi sonini oshirish Telegram orqali bo'ladi, PRO qiymati tushmasligi kerak.

**Bu ikkalasi ziddiyatli EMAS — o'qish farqi bor:**
- Joylashtirilgan matn "savol bloklash"ga qarshi (ya'ni "shu bitta savolni ko'rish uchun to'la" degan mayda-chuyda cheklovlarga qarshi).
- Sizning qaroringiz "xatolar ustida ishlash" ni **PRO'ning bir qismi** deb belgilaydi — bu "cheksiz shaxsiy mashq" taklifining aynan o'zi, faqat **bepul emas**.
- Ya'ni: PRO sotuv taklifida "Xatolaringiz ustida cheklovsiz ishlang" degan band **bo'lishi kerak** — bu hozirgi holatga to'liq mos. Faqat buni bepul qismga ochib qo'ymaslik kerak edi, va siz to'g'ri qildingiz.

**Xulosa qabul qilindi deb hisoblanadi.** Pastdagi rejada PRO tarkibi shunga mos yozilgan.

---

## 3. PRO qanday sotilishi kerak (yangilangan taklif)

Hozirgi holat + joylashtirilgan tavsiyalar asosida, PRO shu bandlarni o'z ichiga oladi:

1. **Shaxsiy tayyorgarlik rejasi** — "Bugungi reja" ekrani (bo'lim 4.2).
2. **Xatolar ustida cheklovsiz mashq** — allaqachon PRO (2-bo'limga qarang).
3. **To'liq savol bazasi + izohlar** — allaqachon mavjud (1250 vs 1009).
4. **Qiyin savollar** — allaqachon PRO.
5. **Chuqur tahlil / tayyorgarlik bahosi** — yangi, "Bugungi reja" bilan birga quriladi.
6. **Audio/video izohlar** (eng ko'p xato qilingan 50-100 savol) — yangi, Bosqich 2.
7. **Reklamasiz tajriba** — tekshirish kerak: hozir reklama bormi?
8. **Natija tarixi** — qisman bor (`test_results`), "sertifikat" g'oyasi yangi.

**Muhim: haftalikdan oylikka ko'tarish mexanizmi yo'q** (`O-SISH-REJASI.md`, 67.6% haftalik tanlaydi). Bu — tezkor, past xarajatli, yuqori ta'sirli ish: haftalik tugaganda "oylikka o'tsangiz +N kun bepul" taklifi.

---

## 4. Bosqichma-bosqich reja

Tartib **muhim**: pastdagi bosqichlar ketma-ket, chunki har biri avvalgisining ma'lumotidan foydalanadi (masalan "Bugungi reja" yangi kontent emas, mavjud xato/natija ma'lumotidan tavsiya chiqaradi).

### Bosqich 1 (1-2 hafta) — Konversiyani o'lchash va tezkor tuzatishlar

Bularning aksariyati **allaqachon qilindi** (yuqoridagi 1-bo'limga qarang). Qolgani:

| Ish | Nega | Holat |
|---|---|---|
| Funnel to'liq o'lchangan (`test_started → completed → paywall → checkout → payment`) | Qayerda tushib qolinayotganini bilish | ✅ Asosiy qismi tayyor (GA4 events) |
| Payme monitoring | Xato/muvaffaqiyatsiz to'lovlarni ko'rish | ✅ Admin panelda Payme sahifasi + sana oralig'i hisoblash tayyor |
| Lint/typecheck | Kod sifati | ✅ Tozalandi |
| **Haftalik→oylik ko'tarish taklifi** | O'rtacha chek oshadi, yangi trafiksiz | ⬜ Qilinmagan — **keyingi eng arzon ish** |
| **Play Market'da ilova nomini moslash** (`Avtodars`→`AvtoSmart`) | Brend nomuvofiqligi Google/foydalanuvchini chalkashtiradi | ⬜ Qilinmagan |
| GA4'da funnel dashboardini ko'rish/tahlil qilish | Haqiqiy tushib qolish foizlarini bilish | ⬜ Ma'lumot yig'ilmoqda, hali tahlil qilinmagan |

### Bosqich 2 (3-6 hafta) — "Shaxsiy o'qituvchi"ga aylanish

Bu — joylashtirilgan matnning eng kuchli g'oyasi, va u **mavjud ma'lumotdan** foydalanadi (yangi kontent yozish shart emas):

1. **"Imtihonga tayyormisiz?" diagnostikasi** — bosh sahifada, mavjud "Test ishlash" yonida, 5-10 savollik BEPUL diagnostika. Natija: tayyorgarlik foizi + zaif mavzular + "Bugungi reja"ga yo'naltirish.
   - Texnik eslatma: yangi sahifa emas, mavjud `/test-ishlash` oqimining variantidir — `O-SISH-REJASI.md`ning "yangi sahifa qurmang" qoidasini buzmaydi (bu YANGI SEO sahifasi emas, mavjud oqim ichidagi funksiya).

2. **Shaxsiy "Bugungi reja" ekrani** — kirgan foydalanuvchi uchun, profil/bosh sahifada:
   - Bugun N ta savol, M ta xatoni qaytarish, 1 ta mavzu
   - Imtihongacha necha kun (agar foydalanuvchi sana kiritgan bo'lsa)
   - Tayyorgarlik foizi
   - Ma'lumot manbai: mavjud `user_question_state`, `test_results` — yangi jadval deyarli kerak emas, faqat agregatsiya funksiyasi.

3. **Lvl tizimi** (sizning g'oyangiz) — ishlangan testlar soniga qarab: yo'lovchi → velosiped → avtomaktab o'quvchisi → ... Bu "Bugungi reja" ekrani bilan tabiiy birlashadi (masalan "Keyingi lvl'gacha: 12 ta test").

4. **Kunlik challenge — YENGIL versiya** (murakkab live o'yin emas):
   - "Bugungi 5 savol" + 24 soatlik umumiy reyting + streak (ketma-ket kunlar)
   - Do'stga natija havolasi yuborish
   - **Bot-simulyatsiya/soxta xona g'oyangiz hali kerak emas** — bu yengil versiya hech qanday soxta ishtirokchisiz ham "birgalikda" hissini beradi va ishonch xavfisiz. Agar bu versiya talabni isbotlasa, keyin murakkabroq (bot bilan to'ldirilgan xona) versiyaga o'tish mumkin — lekin FAQAT o'shanda.

5. **Eng ko'p xato qilingan 50 savolga audio/video izoh** — 1250 tasiga emas, eng samaraliga. "Ko'p odam shu yerda xato qiladi" belgisi + "xato topdingizmi?" tugmasi.

### Bosqich 3 (7-12 hafta) — Telegram: marketingdan retentionga

`O-SISH-REJASI.md`ning eng kuchli, eng arzon topilmasi shu yerda: Telegram bot orqali harakat 26x yuqori.

1. **Telegram Login (akkaunt bog'lash)** — bu eng katta imkoniyat: parolsiz, SMS'siz ro'yxatdan o'tish. Hozirgi telefon-orqali ro'yxatdan o'tish SMS talab qiladi (pul + ishqalanish). Bu ro'yxatdan o'tish konversiyasini sezilarli oshirishi mumkin.
   - Bu ish tashqi bot server (droplet) bilan ulanishni talab qiladi — bu **ilgari kelishilgan, hali boshlanmagan "ikkinchi prompt"** ishi.
2. **Botda: bugungi reja, test eslatmasi, PRO tugash eslatmasi** — retention, yangi kontent emas.
3. **Guruhda: kuniga 1 savol (poll) + qisqa izoh + "saytda mashq qil" deep-link**, haftalik "imtihondan o'tganlar" hikoyalari, haftalik challenge natijalari.
4. **Botda izohni cheklash** — `O-SISH-REJASI.md`ning aniq tavsiyasi: botda to'liq izoh ko'rsatmang, faqat natija + "Izohni ko'rish va xatolaring ustida ishlash →" havolasi (saytga, PRO gate orqali). Bu bot foydali bo'lib qoladi, lekin PRO'ning o'rnini bosmaydi — 2-bo'limdagi qarorga mos.
5. **Lvl asosida guruh leaderboard** — sizning g'oyangiz, lvl tizimi (Bosqich 2) tayyor bo'lgach tabiiy davomi.
6. **Har postdan `utm_source=telegram` bilan kirish** — haqiqiy konversiyani o'lchash uchun.

### Bosqich 4 (keyinroq, shart bilan) — Kengaytirish

Bu bosqich **faqat Bosqich 2-3 talabni isbotlagandan keyin** boshlanadi:

- **Bot-simulyatsiya bilan "birga ishlash" xonalari** (sizning g'oyangiz) — agar yengil "Kunlik challenge" (Bosqich 2.4) real qiziqish ko'rsatsa.
- **Do'stga challenge / referral tizimi**: "do'stingiz 3 ta test ishlasa, sizga PRO kuni".
- **Video darslar / kontent sotuvi** — alohida ish, alohida reja talab qiladi (hosting, to'lov oqimi). Bosqich 2'dagi qisqa audio/video izohlardan farqli — bu to'liq video kurs.
- **1v1 live duel** — faqat kunlik challenge talabni isbotlagandan keyin.
- **Yangi vertikal** (`STARTUP-GOYALAR.md`: DTM, o'qituvchilar attestatsiyasi va h.k.) — **hozir emas**. `STARTUP-GOYALAR.md`ning o'z so'zi bilan: "Avtotestlar.uz'ni 3.5 mln'dan 15 mln'ga chiqarish — noldan yangi loyihani 3.5 mln'ga chiqarishdan OSONROQ."

---

## 5. Nima QILMASLIK kerak (uch hujjatdan birlashtirilgan)

1. **Yangi SEO sahifa qurmang** — `/variant`, `/mavzuli`, `/darslik` kabi sahifalar Google'dan deyarli trafik olmaydi. Diagnostika/Bugungi reja — mavjud oqim ICHIDA, yangi mustaqil sahifa emas.
2. **Bosh sahifa sarlavhasini brend bilan boshlamang** — "avto test" so'zi bo'yicha 1.15-pozitsiya (10 915 klik/oy) xavf ostida qoladi.
3. **Murakkab live o'yin/soxta ishtirokchili xonani darhol qurmang** — avval yengil versiya (Bosqich 2.4), talab isbotlangandan keyin murakkablashtirish.
4. **Reklama byudjetini konversiya tuzatilmasdan oshirmang** — hozir daromadga deyarli ta'sir qilmaydi.
5. **Yangi loyiha/vertikal boshlamang** — bitta mahsulotni oxirigacha yeching.
6. **Botda to'liq izoh ko'rsatmang** — bu botni "to'liq mahsulot"ga aylantirib, saytga/PRO'ga qaytishni kamaytiradi.
7. **1250 ta savolga birdan audio yozishga urinmang** — eng ko'p xato qilingan 50 tasidan boshlang.

---

## 6. Ochiq savollar (qaror kerak)

1. Telegram bot server (droplet) bilan sayt/Supabase'ni bog'lash — qachon boshlaymiz? (Bosqich 3ning kaliti shu.)
2. Haftalikdan oylikka o'tish taklifi qanday shaklda bo'lsin (aniq foiz/muddat)?
3. "Bugungi reja"da imtihon sanasini foydalanuvchi qo'lda kiritadimi, yoki hisoblanmaydimi?
4. Reklamasiz tajriba — hozir saytda reklama bormi? PRO buni olib tashlashi kerakmi?
5. Play Market'dagi "Avtodars" nomini "AvtoSmart"ga o'zgartirish — kim/qachon amalga oshiradi?

---

## Xulosa

Uchta hujjat va shu sessiyadagi ish bir joyga to'plansa, ketma-ketlik aniq:

**Konversiyani tuzatish (asosan tayyor) → Shaxsiy o'qituvchi tajribasi (Bugungi reja + lvl + yengil challenge) → Telegram'ni retention mahsulotiga aylantirish (Login + bot cheklovi) → shundan keyingina kengaytirish (live duel, video kurslar, yangi vertikal).**

Har bir keyingi bosqich avvalgisining natijasidan (ma'lumot, auditoriya, ishonch) foydalanadi — shuning uchun tartibni o'zgartirish samarani kamaytiradi.
