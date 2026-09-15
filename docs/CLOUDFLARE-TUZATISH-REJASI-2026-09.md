# Cloudflare tuzatish rejasi — avtotestu.uz

**Manba:** `avtotestu_cloudflare_audit.md` (2026-09-15, read-only audit) + shu sessiyada tekshirilgan DNS holati.
**Format:** Ustuvorlik va xavf darajasi bo'yicha bosqichlar. Har bandda: nima, qayerda, xavf, tekshirish/ortga qaytarish.

---

## 0. Avval bittasini boshqasidan ajratib olamiz

Bugun (2026-09-15) captcha kod tomoni (ilova + `phone-signup` funksiyasi) allaqachon tuzatilib deploy qilindi. Audit ham aynan shu kuni o'tkazilgan — ya'ni 249 ta challenge/57% statistikasi **tuzatishdan oldingi va keyingi aralashmasi** bo'lishi mumkin.

**Shuning uchun:** Rocket Loader'ga tegishdan oldin 24–48 soat kutamiz va Turnstile statistikasini qayta tekshiramiz. Aks holda ikkita o'zgarishni bir vaqtda qilib, qaysi biri yordam berganini bilmay qolamiz. Bu — birinchi qadam, hozir.

---

## 1-BOSQICH — Captcha (eng muhim, lekin ehtiyot bilan, ikki qadamli)

### 1.1 Kuzatish (hozir, harakatsiz)
- Cloudflare → **Turnstile** → asosiy widget → **Analytics**.
- 2026-09-16/17 dan boshlab challenge/solve/siteverify sonlarini kuzating.
- Agar solve foizi sezilarli ko'tarilsa (masalan 57% → 85%+) — muammo asosan kod tomonida edi, Rocket Loader'ga tegish shart emas.

### 1.2 Agar hali ham past bo'lsa — Rocket Loader'ni FAQAT /auth sahifasida o'chirish
Butun zona bo'ylab o'chirish shart emas — bu boshqa sahifalarning tezligiga (Speed Brain bilan birga) ijobiy ta'sirini yo'qotadi. O'rniga **Configuration Rule** bilan nuqtali o'chirish:

- Cloudflare → **Rules** → **Configuration Rules** → **Create rule**
- Nom: `Rocket Loader off — auth`
- Shart: `URI Path` `contains` `/auth`
- Sozlama: **Rocket Loader** → Off
- Saqlash, 3-5 kun kuzatish, keyin Turnstile analytics'ni qayta solishtirish.

**Xavf:** past — faqat bitta sahifaga ta'sir qiladi, istalgan vaqt qoidani o'chirib qaytarish mumkin.

---

## 2-BOSQICH — Domen konsolidatsiyasi

### 2.1 avtotestlar.uz → avtotestu.uz (tasdiqlangan, jonli — shoshilinch)

DNS tekshiruvi shuni ko'rsatdi: `avtotestlar.uz` haqiqatan Cloudflare orqali proksilanadi va jonli. Bu — SEO uchun eng katta xavf (Google ikkita saytni alohida ko'radi, backlink/PageRank qiymati bo'linadi).

**Qadamlar:**
1. Cloudflare dashboard yuqorisidagi **zona tanlash** ro'yxatida `avtotestlar.uz` bor-yo'qligini tekshiring (agar bor bo'lsa — bir xil akkauntda, keyingi qadamlar oson).
2. `avtotestlar.uz` zonasida: **Rules → Redirect Rules** (yoki eski **Bulk Redirects**) → yangi qoida:
   - Manba: `avtotestlar.uz/*` va `www.avtotestlar.uz/*`
   - Maqsad: `https://www.avtotestu.uz/$1`
   - Turi: **301 (Permanent Redirect)** — vaqtinchalik (302) emas, aks holda Google eski domenni asosiy deb hisoblashda davom etadi.
3. Redirect ishga tushgach (bir necha kun kutib, `curl -I avtotestlar.uz` orqali 301 qaytishini tasdiqlagach): Cloudflare Pages → `avtotestlaruz-v3-0-0` loyihasidan `avtotestlar.uz` custom domain ulanishini olib tashlang (aks holda Pages va Redirect Rule bir-biriga zid ishlashi mumkin — **redirect har doim domain ulanishidan OLDIN sinaladi**, shuning uchun aslida tartib muhim emas, lekin ozodlik uchun keyin tozalash tavsiya etiladi).
4. Loyihaning o'zini (`avtotestlaruz-v3-0-0`) — agar boshqa hech narsa unga bog'liq bo'lmasa — arxivlash yoki o'chirish mumkin, lekin FAQAT 2-3 qadam tugagach.
5. Turnstile'da eski hostname'larni tozalash: asosiy widget sozlamalaridan `avtotestlar.uz` ni olib tashlang; `admin.avtotestlar.uz` uchun alohida widget (trafiksiz) — agar u ishlatilmasa, o'chiring.

**Xavf:** past-o'rta. 301 redirect qaytarib bo'lmaydigan amal emas (qoidani o'chirsangiz eski holatga qaytadi), lekin Google indeksiga ta'sir qiladi — shuning uchun **doim to'g'ridan-to'g'ri 301**, hech qachon 302 ishlatmang.

### 2.2 avtosmart.uz — aniqlashtirish kerak (ochiq savol)

Bu domenda **hech qanday DNS yozuvi yo'q** — hatto Cloudflare'da ham, boshqa joyda ham ko'rinmayapti. Ikki variant:

- **Agar sizniki bo'lsa (sotib olingan, lekin sozlanmagan):** Cloudflare'ga zona sifatida qo'shing, keyin xuddi 2.1-bandidagi kabi `avtosmart.uz/*` → `https://www.avtotestu.uz/$1` 301 redirect qiling. Bu brend himoyasi uchun foydali (boshqa birov shu nomni ololmaydi/ishlatolmaydi).
- **Agar hali sotib olinmagan bo'lsa:** brend nomi "AvtoSmart" bo'lgani uchun bu domenni ro'yxatdan o'tkazib qo'yish tavsiya etiladi — hech bo'lmasa himoya maqsadida, hatto hozircha faol foydalanmasangiz ham.

Menga qaysi holat to'g'ri ekanini ayting — shunga qarab keyingi qadamni aniqlashtiraman.

---

## 3-BOSQICH — SSL/TLS xavfsizligi (past xavf, tezkor bajarsa bo'ladi)

Uchalasi ham audit tasdiqlagan raqamlarga ko'ra xavfsiz:

| Sozlama | Hozir | Yangi qiymat | Nega xavfsiz |
|---|---|---|---|
| SSL/TLS rejimi | Full | **Full (strict)** | Pages origin'ida haqiqiy sertifikat bor, muammo chiqarmaydi |
| Minimum TLS Version | TLS 1.0 | **TLS 1.2** | Oxirgi 24 soatda TLS 1.0/1.1 orqali so'rov — **0 ta** |
| HSTS | O'chiq | **Yoqish, lekin kichik qadam bilan** | Always Use HTTPS allaqachon yoqilgan |

**HSTS uchun alohida ehtiyot:** birinchi yoqishda `max-age=300` (5 daqiqa) bilan boshlang, `includeSubDomains` va **`preload`ni HOZIRCHA belgilamang** — preload brauzer ro'yxatiga kiritiladi va undan chiqish oylab davom etadi. Bir necha kun muammosiz ishlagach, `max-age`ni asta oshiring (1 kun → 1 hafta → keyin 1 yil).

**Joylashuv:** Cloudflare → zona → **SSL/TLS** → Overview (rejim) va Edge Certificates (Min TLS, HSTS).

---

## 4-BOSQICH — Tezlik (ixtiyoriy, bepul, past xavf)

- **HTTP/3 (QUIC)** — hozir o'chiq, so'rovlarning atigi ~0.4%i shu orqali kelayapti (chunki o'chiq). Yoqish: **Speed → Optimization → Protocol** bo'limida. Zarar keltirmaydi, faqat foyda.

---

## 5-BOSQICH — Tozalash (past ustuvorlik, shoshilinch emas)

| # | Ish | Qayerda | Eslatma |
|---|---|---|---|
| 1 | R2 bucket'ga custom domain ulash (masalan `files.avtotestu.uz`) | R2 → bucket → Settings → Custom Domains | `pub-*.r2.dev` ni Cloudflare o'zi "production uchun emas" deydi |
| 2 | R2 CORS | — | **Kerak emas** — kodni tekshirdim: desktop ilova fayli oddiy `<a href>` bilan yangi tabda ochiladi, fetch/XHR ishlatmaydi. Audit yozuvchisi buni bilmagan, men tasdiqlay olaman: bu band muammo emas. |
| 3 | Eski DNS TXT tozalash (`zoho-verification`, ortiqcha `yandex-verification`) | DNS → Records | Faqat agar Zoho Mail endi ishlatilmasa |
| 4 | DMARC TXT qo'shish | DNS → Records | Email spoofing himoyasi, zonadan tashqari ta'sir qilmaydi |
| 5 | Pages preview deployments cheklovi | Pages loyiha → Settings → Access policy | Ixtiyoriy — agar `*.pages.dev` sahifalari Google'da chiqib qolmasin desangiz |

---

## Hozircha TEGMAYMIZ (audit "yaxshi" yoki "past ustuvorlik" deb belgilagan)

- **Bot Fight Mode** — o'chiq qoldiring. Hozir zararli hujum belgisi yo'q (mitigatsiya 0.02%); yoqish real foydalanuvchiga qo'shimcha challenge qo'shishi mumkin — aynan hozir captcha muammosini yechayotgan paytda bu qarama-qarshi bo'lardi.
- **Xalqaro "xom so'rov" ulushi** (AQSh, Niderlandiya va h.k.) — normal, qidiruv botlari/crawler'lar. Harakat shart emas.
- **5xx xatolar (0.35%)** — bu Cloudflare emas, Supabase/backend tomoni. Alohida so'rasangiz, keyingi safar bazadan/edge function loglaridan tekshirib beraman.
- **Pages env variables** — hozirgi holat to'g'ri (barchasi `VITE_` prefiksli, oshkor bo'lishi normal). Faqat kelajakda haqiqiy maxfiy kalit qo'shilsa, "Secret" turida saqlash kerak — eslatma sifatida qoldiraman.

---

## Ijro tartibi (tavsiya etilgan ketma-ketlik)

1. **Hozir:** hech narsa qilmang, faqat Turnstile analyticsni belgilab qo'ying (2 kundan keyin qayta tekshirish uchun).
2. **1-2 kundan keyin:** Turnstile natijasiga qarab 1.2-bandni (Rocket Loader) kerak bo'lsa qo'llang.
3. **Parallel, istalgan vaqt:** 3-bosqich (SSL/TLS) — bu boshqa hech narsaga bog'liq emas, xohlasangiz bugunoq qiling.
4. **2.1-band (avtotestlar.uz redirect)** — bu eng katta SEO foydasi, lekin ozgina tayyorgarlik (zona sizning akkauntingizdami, tekshirish) talab qiladi. Menga zona ro'yxatida `avtotestlar.uz` borligini tasdiqlasangiz, aniq qoida matnini tayyorlab beraman.
5. **avtosmart.uz** — javobingizni kutaman.
6. **4 va 5-bosqich** — istalgan vaqt, shoshilinch emas.
