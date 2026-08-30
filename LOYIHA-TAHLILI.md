# Avtotestlar.uz — Loyiha tahlili va strategiya

**Sana:** 2026-yil 2-avgust
**Manba:** Google Search Console (oxirgi 28 kun), kod bazasi auditi, Supabase konfiguratsiyasi
**Muallif:** Claude (Anthropic) — texnik va biznes auditi

---

## 1. Qisqa xulosa

> **Mahsulot — kuchli. Muhandislik — o'rta, lekin tez yaxshilanmoqda. Biznes — jiddiy kam monetizatsiya qilingan.**

**"Professional loyiham bor" deb ayta olasizmi?** — Ha, to'liq huquq bilan.

O'zbekistonda "avto test" bo'yicha **#1 pozitsiya** va oyiga **61 ming klik** — bu tasodifan bo'lmaydi. Ko'p "professional" deb atalgan loyihalarda bunday trafik umuman yo'q. Siz eng qiyin narsani — **auditoriyani** — allaqachon yechgansiz.

**Lekin asosiy xulosa shu:** sizning muammongiz trafik emas. Muammo — **shu trafikni pulga aylantirish**. Hozir 400 ta tashrifchidan atigi 1 tasi to'layapti.

---

## 2. Umumiy raqamlar

### 2.1. Trafik (28 kun)

| Ko'rsatkich | Qiymat |
|---|---|
| Jami klik | **61,252** |
| Jami ko'rsatilish | 368,790 |
| O'rtacha CTR | 16.6% |
| O'rtacha pozitsiya | 4.4 |
| Kunlik o'rtacha klik | ~2,188 |
| O'zbekiston ulushi | **98%** (60,115 klik) |

Trend barqaror — 28 kun davomida sezilarli tushish yo'q, CTR hatto oxirgi haftada yaxshilangan (19%gacha).

### 2.2. Daromad

| Ko'rsatkich | Qiymat |
|---|---|
| Oylik daromad | **3,500,000 so'm** (~$280) |
| PRO narxi | 29,000 so'm/oy |
| Demak to'lovchilar | **~120 kishi/oy** |
| Konversiya | **~0.25–0.3%** |
| Har bir klikdan daromad | **~57 so'm** |

---

## 3. ⚠️ Asosiy topilma — konversiya

Bu hisobotdagi eng muhim bo'lim.

```
61,000 klik  →  ~120 to'lovchi  =  0.25% konversiya
```

Bu turdagi saytlar uchun normal diapazon **0.5–3%**. Ya'ni siz **quyi chegaradasiz** — trafikingiz daromadingizdan **4–10 barobar oldinda**.

### Nega bunday? Sabab — to'lov jarayonidagi ishqalanish

Hozirgi to'lov oqimi (kodda ko'rdim):

```
1. Foydalanuvchi PRO sahifasiga kiradi
2. Telegram orqali adminga yozadi  ← yoki →  Paynet QR kodini skanerlaydi
3. To'lovni amalga oshiradi
4. YANA adminga yozadi va chekni yuboradi
5. Admin QO'LDA faollashtiradi
6. Foydalanuvchi kutadi...
```

**Bu 5–6 qadam va oradа tirik odam bor.** Har bir qadamda odamlarning yarmi yo'qoladi. Kechasi soat 2 da to'lamoqchi bo'lgan odam admin uyg'onishini kutishi kerak.

### Payme buni tubdan o'zgartiradi

Avtomatlashtirilgan to'lov:
```
1. "PRO ol" tugmasi  →  2. Karta ma'lumoti  →  3. Darhol faol
```

**Bu sizning eng katta daromad richagingiz.** Payme ulash rejangiz — juda to'g'ri qaror.

### Realistik prognoz

| Ssenariy | Konversiya | To'lovchilar | Oylik daromad |
|---|---|---|---|
| **Hozir** (qo'lda to'lov) | 0.25% | ~120 | 3.5 mln |
| Payme + avtomatik faollashtirish | 0.5–0.7% | 225–315 | **6.5–9 mln** |
| + Yaxshi funnel, eslatmalar | 1.0% | ~450 | **13 mln** |
| + Ilova va retention | 1.5% | ~675 | **19.6 mln** |

Trafikni **umuman oshirmasdan**, faqat to'lov jarayonini tuzatib 2–4 barobar o'sish real.

---

## 4. Kuchli tomonlaringiz

### 4.1. SEO — haqiqiy mudofaa devori

| So'rov | Klik | CTR | Pozitsiya |
|---|---|---|---|
| avto test | 12,439 | **66.17%** | 1.13 |
| avtotest | 7,513 | 66.12% | 1.23 |
| prava test | 4,108 | 56.13% | 1.23 |
| avtotest uz | 3,300 | 68.49% | 1.12 |
| avto test ishlash | 2,406 | 48.81% | 1.24 |

66% CTR pozitsiya 1.13 da — bu **brend darajasidagi natija**. Odamlar sizni qidirib topmayapti, ular **sizni tanigan holda** bosayapti. Bunday mavqeni raqobatchi bir yilda ham egallay olmaydi.

### 4.2. Texnik jihatdan to'g'ri qilingan narsalar

- ✅ **Server tomonda kirish nazorati** — `get_user_access_state` RPC `auth.uid()` dan foydalanadi va klient yuborgan `user_id` ni **e'tiborsiz qoldiradi**. Ya'ni boshqa odamning PRO holatini so'rab bo'lmaydi. To'g'ri qurilgan.
- ✅ **RLS to'g'ri sozlangan** — `subscriptions`, `profiles` da foydalanuvchi faqat o'zinikini ko'radi.
- ✅ **Payme edge function sifatli yozilgan** — merchant kaliti Vault'da, `service_role` client, atomik SQL tranzaksiyalar, to'liq JSON-RPC xato katalogi. Bu havaskor ish emas.
- ✅ **Himoya kodi** — `withTimeout`, `lazyWithRetry`, `ErrorBoundary`, build-time assert skriptlari.
- ✅ **R2 dan foydalanish** — video/fayllar uchun to'g'ri tanlov (arzon egress).
- ✅ **Endi testlar va CI bor** (bugun qo'shildi).

### 4.3. Biznes jihatdan

- Aniq va tushunarli qiymat taklifi
- Real, to'layotgan mijozlar bor (~120 kishi/oy)
- Takrorlanuvchi ehtiyoj — har yili yangi haydovchilar
- Flutter ilovasi mavjud

---

## 5. Zaif tomonlaringiz

### 5.1. 🔴 To'lov tizimidagi xavfsizlik zaifligi (Payme ishga tushishidan OLDIN hal qilinishi shart)

Barcha `payme_*` funksiyalari `anon` roli uchun ochiq va ularning **ichida avtorizatsiya tekshiruvi yo'q**. Yagona himoya edge function ichida, lekin PostgREST orqali to'g'ridan-to'g'ri murojaat qilinsa u chetlab o'tiladi.

**Oqibat:** har kim `anon` kaliti bilan (u frontend JS'da ochiq turadi) o'ziga **to'lovsiz PRO obuna** yozdirishi mumkin.

**Yechim** (Payme jonli ishga tushishidan oldin):

```sql
REVOKE EXECUTE ON FUNCTION public.payme_perform_transaction(text, bigint)              FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.payme_create_transaction(text, text, bigint, bigint)  FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.payme_cancel_transaction(text, smallint, bigint)      FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.payme_check_perform_transaction(text, bigint)         FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.payme_resolve_account(text, text)                     FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.payme_verify_key(text)                                FROM anon, authenticated, PUBLIC;
```

`service_role` ruxsati saqlanadi → edge function ishlashda davom etadi. Frontend bu funksiyalarni umuman chaqirmaydi (tekshirdim), shuning uchun hech narsa buzilmaydi.

### 5.2. 🔴 Supabase Free tarif — biznes uchun jiddiy xavf

Sizda **to'layotgan mijozlar bor**, lekin baza Free tarifda:

| Xavf | Oqibat |
|---|---|
| **Zaxira nusxa (backup) yo'q** | Baza yo'qolsa — barcha obunalar, foydalanuvchilar, to'lov tarixi yo'q bo'ladi |
| PITR yo'q | Xato `DELETE` dan keyin tiklab bo'lmaydi |
| 500 MB baza limiti | O'sish bilan to'lib qoladi |
| Qo'llab-quvvatlash yo'q | Muammo chiqsa yolg'iz qolasiz |

**Tavsiya:** Payme jonli ishga tushgan kuni **Pro tarifga o'ting ($25/oy)**.

Bu daromadingizning ~9% i. Butun biznesingiz uchun sug'urta sifatida — **arzon**. To'layotgan mijoz ma'lumotini backup'siz saqlash katta tavakkalchilik.

### 5.3. 🟡 Trafik konsentratsiyasi

| Xavf | Raqam |
|---|---|
| Bitta sahifa (bosh sahifa) | klikning **96.3%** |
| Top 5 so'rov | klikning **48.6%** |
| Bitta kanal (Google) | trafikning **~98%** |
| Bitta davlat | klikning **98%** |

Bu — **bitta oyoqda turgan stol**. Google algoritmi o'zgarsa yoki raqobatchi sizni o'tib ketsa, daromad bir oyda yo'qoladi. Diversifikatsiya — uzoq muddatli hayotiylik masalasi.

### 5.4. 🟡 Mobil CTR yo'qotishi — bepul trafik yotibdi

| Qurilma | Ko'rsatilish | Klik | CTR |
|---|---|---|---|
| Desktop | 166,472 | 31,847 | **19.13%** |
| Mobil | **200,077** | 29,060 | **14.52%** |

Mobilda ko'rsatilish **20% ko'p**, lekin klik **kamroq**. Agar mobil CTR desktop darajasiga yaqinlashsa (17%):

```
200,077 × 17% = ~34,000 klik   (hozir 29,060)
= oyiga +5,000 bepul klik  (+8% umumiy trafik)
```

Sabablari: mobil tezlik, Core Web Vitals, SERP'da snippet ko'rinishi.

### 5.5. 🟡 Ma'lumot sifati

Namuna asosida tekshirganda **4 ta noto'g'ri izoh** topildi (savol bilan tushuntirish mos kelmasdi). 1250 savoldan ~1240 tasi tekshirilmagan.

Haydovchilik testi saytida noto'g'ri izoh — bu oddiy bug emas, **ishonch masalasi**. Foydalanuvchi imtihonda yiqilsa, sizga qaytmaydi va tanishlariga aytadi.

### 5.6. 🟡 Texnik qarz

| Muammo | Ta'sir |
|---|---|
| `barcha-*.json` — 1.9–2.3 MB | Arzon telefonlarda qotish |
| `dist/images` — 62 MB | Build va deploy sekinligi |
| Ikkilangan kontent (React + bot uchun statik HTML) | Doimiy sinxrondan chiqish |
| Testlar endigina qo'shildi | Bug'lar foydalanuvchi shikoyatidan keyin topilardi |

---

## 6. Supabase — davom ettiraymi yoki ko'chiraymi?

### Javob: **Albatta davom eting. Ko'chirmang.**

**Sabablari:**

1. **Sizning masshtabingiz Postgres uchun juda kichik.** 61 ming oylik klik, bir necha ming obuna — bu Postgres uchun "issiqlik" ham emas. Supabase bundan 1000 barobar kattaroq yukni ko'taradi.

2. **Muammolaringiz Supabase'dan emas edi.** Bugun topilgan barcha bug'lar — `INITIAL_SESSION` e'tiborsizligi, cheksiz spinner, timeout'siz so'rov — bular **ilova mantiqidagi** xatolar. Boshqa platformaga ko'chsangiz ham ular siz bilan birga ko'chadi.

3. **Ko'chirish narxi juda qimmat.** Auth, RLS, RPC, edge functions, Vault — bularning hammasini qayta yozish 2–3 oy. Bu vaqtda foydalanuvchi uchun **hech narsa yaxshilanmaydi**, faqat yangi bug'lar paydo bo'ladi.

4. **Sizga kerak bo'lgan narsalar allaqachon bor:** RLS, `SECURITY DEFINER` RPC, Vault, edge functions, OAuth.

### Ko'chirish o'rniga — Supabase'dan yaxshiroq foydalaning

- ✅ **Pro tarifga o'ting** (backup uchun — yuqorida yozildi)
- ✅ **`payme_*` grant'larini tuzating** (yuqorida yozildi)
- ✅ **Security Advisor'ni oyiga bir marta ko'ring** — bugun 20+ ogohlantirish chiqdi
- ✅ **Leaked password protection** ni yoqing (Auth sozlamalarida, bir marta bosish)
- ⚠️ **Video'ni Supabase Storage'ga QO'YMANG** — Free'da 1 GB, egress qimmat. R2'da qoldiring.

---

## 7. Rejalaringiz bo'yicha maslahat

### 7.1. Payme ulash — ✅ To'g'ri qaror, eng yuqori ROI

Bu sizning **eng katta daromad richagingiz**. Lekin ishga tushirishdan oldin:

- [ ] `payme_*` REVOKE'larni qo'llang (5.1-bo'lim)
- [ ] Pro tarifga o'ting (backup)
- [ ] Test rejimida to'liq oqimni sinang: yaratish → to'lash → bekor qilish → qaytarish
- [ ] Obuna tugashidan 3 kun oldin eslatma yuboring (Telegram bot orqali — sizda bor)

**Qo'shimcha g'oya:** yillik tarif qo'shing. 29,000×12 = 348,000 so'm o'rniga **250,000 so'm/yil**. Bu:
- Bir martalik to'lov → kamroq ishqalanish
- Pulni oldindan olasiz
- Churn muammosi yo'qoladi

### 7.2. Video darslar — ✅ Yaxshi, lekin ehtiyot bo'ling

**Ijobiy:** video — PRO uchun eng kuchli sabab. Test hamma joyda bor, sifatli video yo'q. Bu sizni ajratib turadi.

**Ehtiyot bo'ling:**
- Video ishlab chiqarish **qimmat va sekin**. 211 ta video rejalashtirilgan — bu katta ish.
- **R2'da qoldiring** (allaqachon shunday) — Supabase Storage'ga o'tkazmang.
- Avval **10–15 ta eng muhim mavzu** bilan boshlang, konversiyaga ta'sirini o'lchang, keyin kengaytiring.
- Video sahifalari **SEO uchun ham** ishlaydi — "yo'l belgilari video dars" kabi so'rovlar yangi trafik keltiradi.

### 7.3. Flutter ilova (1k yuklash) — 🔴 Katta imkoniyat qo'ldan ketmoqda

```
Oyiga 61,000 web tashrifchi   →   jami atigi 1,000 ilova yuklash
```

Bu nisbat juda past. Ilova foydalanuvchilari:
- **Ancha yaxshi qoladi** (retention)
- Push bildirishnoma orqali qaytariladi
- Osonroq to'laydi (App Store / Play billing)

**Tavsiya:**
- Saytga **"Ilovani yuklab oling"** bannerini qo'ying (mobil foydalanuvchilarga)
- Test yakunida natija sahifasida taklif qiling — bu eng yuqori qiziqish momenti
- Play Store sahifasini ASO bo'yicha optimallashtiring ("avto test", "prava test" kalit so'zlari bilan)

---

## 8. Xavflar ro'yxati

| # | Xavf | Ehtimol | Zarar | Ustuvorlik |
|---|---|---|---|---|
| 1 | Payme zaifligi orqali bepul PRO | Yuqori | Yuqori | 🔴 **Darhol** |
| 2 | Free tarif — backup yo'q, baza yo'qolishi | O'rta | **Halokatli** | 🔴 **Darhol** |
| 3 | Google algoritmi o'zgarishi | O'rta | Halokatli | 🟡 Uzoq muddat |
| 4 | Noto'g'ri izohlar → ishonch yo'qolishi | Yuqori | O'rta | 🟡 O'rta muddat |
| 5 | Raqobatchi SEO'da o'tib ketishi | Past | Yuqori | 🟡 Uzoq muddat |
| 6 | Yakka dasturchi (bus factor) | — | Yuqori | 🟢 Rejalashtirish |

---

## 9. Ustuvorlik rejasi

### 🔴 Darhol (1–2 hafta) — Payme'dan oldin

1. `payme_*` funksiyalaridan `anon`/`authenticated` ruxsatini olib tashlash
2. Supabase **Pro tarifga** o'tish (backup)
3. Leaked password protection'ni yoqish
4. Payme'ni test rejimida to'liq sinash

### 🟠 Qisqa muddat (1–2 oy) — Daromadni oshirish

5. Payme'ni jonli ishga tushirish → **avtomatik faollashtirish**
6. Yillik tarif qo'shish (250,000 so'm/yil)
7. Obuna tugashi haqida eslatma (Telegram bot)
8. Saytga ilova yuklash bannerini qo'yish
9. Mobil tezlik va Core Web Vitals

### 🟡 O'rta muddat (3–6 oy) — Mustahkamlash

10. 1250 savol izohlarini to'liq audit qilish
11. `barcha-*.json` ni mavzu bo'yicha bo'lish (2 MB → 100–200 KB)
12. Video darslarni bosqichma-bosqich qo'shish
13. Ichki sahifalar uchun SEO kontent (bosh sahifaga bog'liqlikni kamaytirish)
14. Testlar qamrovini kengaytirish (to'lov oqimi, test sessiyasi)

### 🟢 Uzoq muddat (6–12 oy) — Diversifikatsiya

15. Trafik kanallarini kengaytirish (YouTube, Telegram kanal, Instagram)
16. Qo'shni bozorlar (Qozog'iston, Qirg'iziston — CTR allaqachon yaxshi: 19–20%)
17. B2B yo'nalish — avtomaktablar uchun tarif
18. Ikkinchi dasturchi yoki hech bo'lmasa hujjatlashtirish

---

## 10. Kelajak prognozi

### Agar hech narsa o'zgartirmasangiz
Daromad 3–4 mln so'm atrofida qoladi. Trafik asta o'sishi mumkin, lekin konversiya past bo'lgani uchun daromad sekin o'sadi. Google'ga bog'liqlik xavf bo'lib qolaveradi.

### Agar faqat Payme'ni to'g'ri ulasangiz (eng real ssenariy)
**6–9 mln so'm/oy** — 3–6 oy ichida. Bu eng kam kuch bilan eng katta natija.

### Agar Payme + ilova + video + eslatmalarni bajarsangiz
**13–20 mln so'm/oy** — 12 oy ichida real. Bu allaqachon jiddiy biznes, xodim yollash mumkin bo'lgan daraja.

### Nima bu prognozni buzishi mumkin
- Google algoritmi (eng katta xavf)
- Davlat platformasi (e-avtomaktab) bepul muqobil chiqarishi
- Baza yo'qolishi (backup'siz)

---

## 11. Yakuniy so'z

Siz **eng qiyin qismini allaqachon yechgansiz**. Trafik yig'ish — bu yerda ko'pchilik yiqiladi. Sizda 60 ming oylik tashrifchi va #1 pozitsiya bor.

Endi vazifa — **shu qiymatni to'g'ri yig'ib olish**. To'lovni avtomatlashtirish, ma'lumotni himoyalash va foydalanuvchini ilovaga olib o'tish.

**Loyihangiz professionalmi?** — Ha. Lekin hozircha **mo'rt poydevorda turgan professional loyiha**. Bugun qo'shilgan testlar va CI — poydevorni mustahkamlashning boshlanishi. Backup va to'lov xavfsizligi — keyingi ikkita g'isht.

---

## Ilova: Bugun bajarilgan ishlar

| Commit | Mazmun |
|---|---|
| `edc026b` | 3 ta auth bug (foydalanuvchi "mehmon" bo'lib qolishi, cheksiz spinner, timeout'siz so'rov) + deploy oq ekran guard + kesh optimizatsiyasi |
| `7c9f611` | Vitest + Testing Library, 7 ta test (2 tasi mutatsiya bilan tasdiqlangan) |
| `7177b07` | GitHub Actions CI — har push'da lint, tiplar, testlar, build |

**Eslatma:** CI deploy'ni avtomatik bloklamaydi (Cloudflare Pages mustaqil build qiladi). To'liq himoya uchun GitHub → Settings → Branches → `main` uchun branch protection qo'shing va `Lint · Types · Test · Build` ni majburiy qiling.
