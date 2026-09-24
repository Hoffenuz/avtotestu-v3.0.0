# Mobil ilova — mazmun, bo'limlar va optimizatsiya topshirig'i

> **Bu hujjat AI agent uchun prompt.** Uni to'liq nusxalab, mobil ilova
> repozitoriysida ishlayotgan agentga bering.
>
> **Juftlik hujjat:** [`MOBILE-INTEGRATION.md`](MOBILE-INTEGRATION.md) —
> u ro'yxatdan o'tish, kirish, PRO va to'lovni qamraydi. Bu hujjat esa
> **mazmun, bo'limlar va tezlikni** qamraydi. Ikkalasi bir-birini
> takrorlamaydi.

---

## Sen kimsan va vazifang nima

Sen O'zbekiston YHQ (yo'l harakati qoidalari) imtihoniga tayyorlash
ilovasining mobil versiyasi ustida ishlayapsan. Veb-sayt — **avtotestu.uz** —
allaqachon ishlab turibdi (~5100 foydalanuvchi, ~215 PRO obuna) va u
**haqiqat manbai** hisoblanadi.

Mobil ilovada "Bo'limlar" bo'limi bor, lekin **saytdagi hamma ma'lumot va
funksiya unda yo'q**. Sening vazifang — ilovani saytga to'liq
tenglashtirish, yangi savollarni qo'shish, imlo xatolarini topib tuzatish
va ilovani optimallashtirish.

### Ish tartibi (buzilmasin)

1. **Avval mobil repozitoriyni o'rgan.** Qaysi texnologiya (Flutter /
   React Native / Kotlin / Swift), ma'lumot qayerdan olinadi (ilova ichida
   bundle qilinganmi yoki tarmoqdan yuklanadimi), qaysi bo'limlar bor.
   **Hech narsani taxmin qilma** — kodni o'qi.
2. **Keyin sayt bilan solishtir** — quyidagi xarita bo'yicha.
3. **Farqlar ro'yxatini yoz** va menga ko'rsat.
4. **Shundan keyin** o'zgartirishni boshla.

---

## 1. Saytdagi ma'lumot fayllari — to'liq xarita

Barcha yo'llar sayt repozitoriysi ildizidan.

### 1.1 Savollar korpusi

| Fayl | Hajm | Savol | Nima uchun |
|---|---|---|---|
| `public/barcha.json` | 4.8 MB | 1259 | **Asosiy manba.** 3 til + izoh, hammasi bitta faylda |
| `public/barcha-uz-lat.json` | 1.5 MB | 1259 | Faqat lotin — ilova shuni yuklaydi |
| `public/barcha-uz-cyr.json` | 2.0 MB | 1259 | Faqat kirill |
| `public/barcha-ru.json` | 1.9 MB | 1259 | Faqat rus |
| `public/free-uz-lat.json` | 500 KB | 1009 | Bepul foydalanuvchi uchun, **izohsiz** |
| `public/free-uz-cyr.json` | 648 KB | 1009 | " |
| `public/free-ru.json` | 632 KB | 1009 | " |
| `public/600.json` | 3.0 MB | 1009 | Eski nom, bepul to'plamning izohli varianti |

**Muhim:** `free-*.json` fayllarida **izoh yo'q** — bu ataylab. Izoh faqat
PRO obunasi bor foydalanuvchi uchun. Buni `scripts/generate-free-tier.cjs`
generatsiya qiladi (`stripIzoh()` funksiyasi).

### 1.2 Variantlar (imtihon biletlari)

```
public/data/variants/v1.json … v63.json      — 63 ta fayl
```

Har bir variant ~20 savol. `v63.json` da **19 ta** savol (yangi qo'shilgan).

### 1.3 Mavzuli testlar

```
public/mavzuli2/1.json … 35b.json            — 34 ta fayl
```

Mavzu `id` → fayl nomi bog'lanishi
(`src/components/MavzuliTestInterface.tsx:190`):

```js
let filename = `${topicId}.json`;
if (topicId === '34') filename = '34tengaxamiyatli.json';   // istisno
const dataPath = topicId === '31'
  ? barchaByLang        // "Barcha savollar" — butun korpus
  : `/mavzuli2/${filename}`;
```

Ya'ni:
- `31` — alohida fayl **emas**, `barcha-{til}.json` ning o'zi
- `34` — fayl nomi `34tengaxamiyatli.json`
- `35a` — "Yangi savollar"
- Qolganlari — `{id}.json`

Mavzular ro'yxati va nomlari (3 tilda):
`src/pages/MavzuliTestlar.tsx` → `topicCategories`

Kategoriyalar: `asosiy`, `belgilar`, `chorrahalar` va boshqalar.

### 1.4 Yo'l belgilari

```
public/data/belgilar.json      — 7 ta kategoriya
public/belgilar/               — 420 ta rasm (.gif / .webp / .png)
```

Sxema:

```json
[{
  "title": { "uz_lat": "...", "uz_cyr": "...", "ru": "..." },
  "items": [{
    "src": "/belgilar/a8caf81b....gif",
    "code": "1.1",
    "title": { "uz_lat": "1.1 Shlagbaumli temir yo'l kesishmasi", "...": "..." },
    "description": { "...": "..." }
  }]
}]
```

### 1.5 Savol rasmlari

```
public/images/                        — 64 MB
src/data/question-image-sizes.json    — har bir rasmning o'lchami
```

`question-image-sizes.json` — **ilovada ham juda kerak**. U 738 ta rasmning
`[en, balandlik]` o'lchamini saqlaydi. Bularsiz rasm yuklanguncha joy
band qilinmaydi va ro'yxat sakraydi (pastda 4-vazifaga qara).

### 1.6 Kod ichidagi ma'lumot (JSON emas, TypeScript)

| Fayl | Eksport | Mazmun |
|---|---|---|
| `src/lib/yodlashRaqamlari.ts` | `FACT_TOPICS` | 9 ta mavzu — yodlash kerak bo'lgan raqamlar |
| `src/lib/avtodromPenalties.ts` | `PENALTY_GROUPS` | Avtodrom jarima ballari |
| `src/lib/siteSections.ts` | `SECTION_ITEMS`, `QUICK_ITEMS` | Bo'limlar ro'yxati |
| `src/data/videoDarslar.ts` | — | Video darsliklar |

Bular JSON emas — mobil ilova uchun ularni **JSON ga eksport qilish**
kerak bo'lishi mumkin. Qo'lda ko'chirma: manba o'zgarsa ilova eskiradi.
Kichik skript yozib, build paytida generatsiya qil.

---

## 2. JSON sxemasi

Bitta savol yozuvi:

```json
{
  "task_info": {
    "global_id": "t_1_q_1",      // BARQAROR kalit — hamma joyda shu ishlatiladi
    "global_id2": "t_1_q_1",
    "ticket_num": 1,             // variant raqami (1..63)
    "order": 1,                  // variant ichidagi tartib
    "remapped_from": "t_4_q_18"  // ixtiyoriy
  },
  "media_url": "u63-11.webp",    // bo'sh satr bo'lishi mumkin — rasmsiz savol
  "content": {
    "uz_lat": {
      "text": "Savol matni",
      "options": [
        { "id": 1, "text": "Javob", "is_correct": false },
        { "id": 2, "text": "Javob", "is_correct": true }
      ]
    },
    "uz_cyr": { "...": "..." },
    "ru":     { "...": "..." }
  },
  "izoh": {
    "uz_lat": "Tushuntirish matni…",
    "uz_cyr": "…",
    "ru": "…"
  }
}
```

### ⚠️ Tuzoq: ikki xil til kaliti

Loyihada **ikkita** til kalitlari konvensiyasi bor va ular **bir xil emas**:

| Qayerda | Kalitlar |
|---|---|
| Savol JSON fayllari | `uz_lat` · `uz_cyr` · `ru` |
| Interfeys ma'lumoti (`Localized`) | `oz` · `uz` · `ru` |

`Localized` — `src/lib/avtodromPenalties.ts:18` da aniqlangan va
`yodlashRaqamlari.ts` ham shuni ishlatadi. E'tibor ber: **`uz` ikkalasida
ham bor, lekin turli ma'noda** — JSON da `uz_cyr` kirill, `Localized` da
`uz` kirill, `oz` esa lotin.

Foydalanuvchi tanlagan til (`questionLang`) `'oz' | 'uz' | 'ru'` ko'rinishida
saqlanadi. JSON ga o'tkazish:

```js
questionLang === 'oz' ? 'uz_lat'
: questionLang === 'uz' ? 'uz_cyr'
: 'ru'
```

Bu almashtirishni bitta joyda yoz va hamma joyda shuni chaqir. Sayt buni
`src/lib/pickLangContent.ts` da qiladi.

### ⚠️ `izoh` — obyekt, satr emas

`izoh` — **har doim** `{uz_lat, uz_cyr, ru}` obyekti. Uni satr deb
yozib qo'yish — oldin sodir bo'lgan xato. Yozishdan oldin mavjud
yozuvning formatini o'qib solishtir.

---

## 3. Bo'limlar — har biri nima qiladi

Saytdagi to'liq ro'yxat. **Mobil ilovada qaysilari yo'qligini aniqla.**

| Bo'lim | Manzil | Manba | Kirish sharti |
|---|---|---|---|
| Test ishlash | `/test-ishlash` | `barcha-{til}.json` | ochiq |
| Variantlar | `/variant` | `data/variants/v*.json` | 1–2 bepul, qolgani PRO |
| Mavzuli testlar | `/mavzuli` | `mavzuli2/*.json` | PRO |
| **Real imtihon** | `/real-imtihon` | `barcha-{til}.json` | ochiq |
| Yo'l belgilari | `/belgilar` | `data/belgilar.json` | ochiq |
| **Avtodrom** | `/avtodrom` | `avtodromPenalties.ts` | ochiq |
| **Yodlash kerak** | `/yodlash-kerak` | `yodlashRaqamlari.ts` | ochiq |
| Savol qidirish | `/qidirish` | `barcha-{til}.json` | **PRO** |
| Xato savollarim | `/xatolarim` | baza + korpus | **PRO** |
| Xatolar ustida ishlash | `/xatolar-testi` | baza + korpus | **PRO** |
| Saqlangan savollar | `/saqlangan` | baza + korpus | kirish (PRO emas) |
| Darslik | `/darslik` | `videoDarslar.ts` | PRO |

**Qalin** belgilanganlari yaqinda qo'shilgan — mobil ilovada katta
ehtimol bilan yo'q.

### 3.1 Real imtihon — nima farqi bor

Rasmiy imtihon dasturiga o'xshatib qilingan rejim. Oddiy testdan farqi:

- **Izoh ko'rsatilmaydi** — hech qanday holatda
- **Til tanlash yo'q** — imtihon boshlangach til almashtirilmaydi
- Yuqorida **savol raqamlari paneli** — javob berilganlari boshqa rangda
- **Vaqt hisobi** ko'rinib turadi
- Javob tanlangach **keyingi javobsiz savolga o'zi o'tadi** (~900 ms)
- Hammasiga javob berilsa **o'zi yakunlanadi** (~1200 ms)
- To'liq ekranda ochiladi

Kod: `src/components/RealExamInterface.tsx`.

**Muhim tafsilot:** bu ekranda ranglar **ataylab qattiq yozilgan**
(`#2c6ba0`, `#3f4d61`, `#125c25`, `#7f1a1a`). Sabab — imtihon ekrani
yorug'/qorong'i rejimda **bir xil** ko'rinishi kerak. Mobil ilovada ham
shunday qil: bu ekranga mavzu (theme) ta'sir qilmasin.

### 3.2 Yodlash kerak — 9 mavzu

`FACT_TOPICS` dagi `id` lar:

```
tezlik · reaktsiya · toxtash · avariya-belgisi · gabarit
yuk · shatak · shina · rul-tormoz
```

Tuzilma: mavzu → guruhlar → qatorlar. Har bir qator `Localized` matn va
o'lchov birligi (km/soat, m, mm, gradus, %, soniya, MPa).

**Format qoidasi:** avval nima, keyin qiymat.
✅ `M1 yengil — lyuft yig'indisi 30 gradus`
❌ `Rul lyufti 30 gradus — M1 yengil`

### 3.3 Avtodrom

`PENALTY_GROUPS` — jarima ballari, uch daraja:
`"kichik" | "orta" | "qopol"` (`PenaltyLevel`).

---

## 4. VAZIFA A — yetishmayotgan bo'limlarni qo'shish

1. Mobil ilovadagi mavjud bo'limlar ro'yxatini chiqar.
2. Yuqoridagi jadval bilan solishtir.
3. Yo'qlarini qo'sh. Har biri uchun:
   - ma'lumot manbasi bir xil bo'lsin (sayt bilan **bitta** fayl)
   - **uchala tilda** to'liq
   - kirish sharti (PRO / kirish) sayt bilan **aynan** mos
4. `yodlashRaqamlari.ts` va `avtodromPenalties.ts` — TypeScript. Ularni
   JSON ga aylantiruvchi skript yoz, qo'lda ko'chirma.

**PRO cheklovlari — buzilmasin:**

- Izoh **har qanday holatda** faqat PRO uchun (saqlangan savollarda ham,
  xatolarda ham, qidiruvda ham)
- `/qidirish`, `/xatolarim`, `/xatolar-testi` — butunlay PRO
- `/saqlangan` — kirish yetarli, PRO shart emas (lekin izohi PRO)

Bu tekshiruvni **komponent ichida** qil, chaqiruvchi tomonda emas —
aks holda bir joyda unutilsa teshik qoladi. Saytda shu xato bo'lgan va
`QuestionReviewCard` ichiga ko'chirilgan.

---

## 5. VAZIFA B — yangi savollarni qo'shish

63-variantga **9 ta yangi savol** qo'shilgan: `t_63_q_11` … `t_63_q_19`.

| global_id | rasm |
|---|---|
| `t_63_q_11` | `u63-11.webp` |
| `t_63_q_12` | `u63-12.webp` |
| `t_63_q_13` | — rasmsiz |
| `t_63_q_14` | `u63-14.webp` |
| `t_63_q_15` | `u63-15.webp` |
| `t_63_q_16` | `u63-16.webp` |
| `t_63_q_17` | — rasmsiz |
| `t_63_q_18` | — rasmsiz |
| `t_63_q_19` | `u63-19.webp` |

Rasm nomlari **variant raqamiga bog'langan**: `u{variant}-{tartib}.webp`.

Bu savollar quyidagilarning **hammasida** bo'lishi kerak. Saytda holat
tekshirilgan (2026-08-31):

| Fayl | Holat |
|---|---|
| `public/data/variants/v63.json` | ✅ 19 savol, 11–19 bor |
| `public/barcha.json` | ✅ 9/9 |
| `public/barcha-uz-lat.json` | ✅ 9/9 |
| `public/barcha-uz-cyr.json` | ✅ 9/9 |
| `public/barcha-ru.json` | ✅ 9/9 |
| `public/free-uz-lat.json` | ✅ 9/9 (bepul to'plamga kiradi) |
| `public/mavzuli2/35a.json` | ✅ "Yangi savollar" — 34 savol, 18 tasi `t_63_*` |
| tegishli mavzu fayllari | tekshir |

Ya'ni **saytda tayyor** — mobil ilovada shu ro'yxatning barchasi
yangilanishi shart. Bittasi qolib ketsa, foydalanuvchi bir bo'limda
savolni ko'radi, boshqasida yo'q.

**Ogohlantirish:** `scripts/generate-free-tier.cjs` da `EXPECTED_COUNT`
qo'riqchisi bor (hozir `1009`). Savol soni o'zgarsa u build ni to'xtatadi —
bu **ataylab**. Sonni o'zgartirganda sababini izohda yoz.

---

## 6. VAZIFA C — JSON larni solishtirish va imlo xatolarini topish

Bu eng nozik vazifa. **Faraz qilma — o'lchab ko'rsat.**

### 6.1 Tuzilma bir xilligi

Har bir `global_id` uchun uchala tilda:

- [ ] savol mavjudmi (biror tilda tushib qolmaganmi)
- [ ] javob variantlari **soni** bir xilmi
- [ ] `is_correct: true` **bitta** va **bir xil `id`** dami
- [ ] `media_url` bir xilmi
- [ ] matn bo'sh emasmi

### 6.2 Fayllar orasida moslik

Bitta `global_id` bir necha faylda takrorlanadi. Matn **aynan** bir xil
bo'lishi kerak:

```
barcha.json  ↔  barcha-{til}.json  ↔  data/variants/v{N}.json  ↔  mavzuli2/{id}.json
```

Farq topilsa — qaysi biri to'g'ri? **`barcha.json` haqiqat manbai.**

### 6.3 Imlo va belgilar

Bu naqshlar avval haqiqiy xato bo'lib chiqqan:

1. **Aralash alifbo** — bitta so'z ichida lotin va kirill harflari
   (`Ｃ` kirill "с" bilan lotin "c" adashishi). Tekshiruv: har bir so'zda
   `[a-zA-Z]` ham, `[Ѐ-ӿ]` ham bormi.
   *Hozirgi holat: `barcha.json` da bunday so'z **0 ta** — toza.*

2. **To'liq kenglikdagi belgilar** — `３` (U+FF13) oddiy `3` o'rniga.
   Tekshiruv: `[＀-￯]`.

3. **Apostrof nomuvofiqligi** — **hozirda mavjud muammo:**

   | Joy | Tekis `'` | Egri `'` `'` |
   |---|---|---|
   | Savol matni va javoblar | **5463** | **0** |
   | Izoh matni | 3634 | **4795** |

   Ya'ni savollar faqat tekis apostrof ishlatadi, izohlar esa
   ikkalasini aralashtiradi. Bu qidiruvni buzadi (`o'q` va `o'q` —
   turli satr) va ko'rinishda ham chalkash.

   **Qaror kerak:** hammasini bir shaklga keltirish. Tavsiya — tekis `'`,
   chunki savollar allaqachon shunday va ular ko'proq.

   > Bu o'zgarish 8000 dan ortiq joyga tegadi. **Avtomatik almashtirishdan
   > oldin** namunani ko'rsat va tasdiq ol.

4. **Ortiqcha bo'sh joy** — qator boshi/oxiri, ikkilangan probel.

5. **Nuqta-vergul izchilligi** — savol matni `?` yoki `:` bilan
   tugaydimi, bir xil naqshdami.

### 6.4 Takroriy savollar — bu XATO EMAS

`barcha.json` da 66 guruh bir xil matnli savol bor. Ammo:

- 53 tasida **rasm boshqa**
- 63 tasida **javoblar boshqa**

Ya'ni bular haqiqiy dublikat emas — umumiy savol matni
(`"Bu belgi nimani bildiradi?"`) turli rasmlar bilan. **Bu normal va
ataylab.** Ularni "tozalash" — ma'lumotni buzish demakdir.

Faqat **matn + rasm + javoblar** uchalasi bir xil bo'lsa dublikat.
Bunday holatlar bor (3 guruh), lekin ular ham ataylab qoldirilgan.

### 6.5 Hisobot

Har bir topilma uchun: fayl, `global_id`, nima kutilgan, nima topilgan.
Avtomatik tuzatishdan oldin ro'yxatni ko'rsat.

---

## 7. VAZIFA D — optimizatsiya

Saytda o'lchov bilan tasdiqlangan muammolar. Mobil ilovada ham
tekshirilishi kerak.

### 7.1 Ro'yxat sakramasin (eng katta muammo edi)

Saytda savol ro'yxatlari CLS 0.68 gacha sakrardi. Uchta sabab:

**a) Layout qayta qurilishi.** Kirish tekshiruvi ekrani va kontent ekrani
har biri **o'z** layout'ini chizardi. Holat almashganda butun daraxt
yo'q qilinib qayta qurilardi. → Layout **bir marta** o'rnatilsin, faqat
ichi almashsin.

**b) Yuklanish joyi juda kichik.** Spinner 128px joy egallardi, keyin 15
ta karta paydo bo'lardi. → **Skelet** ko'rsat, va uning **soni** haqiqiy
ro'yxat uzunligiga teng bo'lsin. Ro'yxat uzunligi odatda kontentdan
oldin ma'lum bo'ladi (avval `id` lar keladi, keyin matnlar).

**c) Rasm joy zahiralamasdi.** Bu eng nozigi: rasmda `width`/`height`
**bor edi**, lekin CSS `width: auto` bo'lgani uchun brauzer rasm
kelmaguncha qutini `0x0` deb hisoblardi.

> Qoida: rasm uchun **aniq en** berilishi kerak, shunda nisbatdan
> balandlik hisoblanadi. Mobil ilovada ham xuddi shu — `AspectRatio`
> widget'i yoki `width`+`height` bilan oldindan joy band qil.
> `src/data/question-image-sizes.json` shuning uchun kerak.

Natija: 0.68 → **0.000**.

### 7.2 Birinchi ochilish

Sayt o'lchovi (kesh bo'sh, yangi qurilma):

```
Desktop           1128 ms
O'rtacha telefon  4894 ms   (LCP 5168 ms)
Zaif telefon 3G  16123 ms   (LCP 16536 ms)
```

Qotish yo'q edi (138–214 ms), lekin **kutish uzoq**. Mobil ilovada
afzallik shundaki, ma'lumotni ilova ichiga bundle qilish mumkin.

**Tavsiya:** savollar korpusini tarmoqdan yuklama — ilova ichiga jo'nat.
`barcha-uz-lat.json` 1.5 MB, uchala til 5.4 MB. Rasmlar 64 MB — bularni
talab bo'yicha yuklab, keshlab borish kerak.

### 7.3 Kichik ekranlar

Sayt 320px ekranda 4px ga toshib, butun sahifada gorizontal scroll
paydo qilardi. Mobil ilovada eng tor qurilmani (320dp) sinab ko'r.

### 7.4 Ekran o'quvchi

Javob tugmalarida tanlangan holat **faqat rang** bilan ko'rsatilardi —
ekran o'quvchi qaysi javob tanlanganini ayta olmasdi. Har bir javob
tugmasiga holat atributi ber (`Semantics(selected:)` / `accessibilityState`).

---

## 8. ⚠️ Telefon raqam — mobil ilovada ham xato bo'lishi mumkin

Bu saytda **haqiqiy xato** bo'lib chiqdi va bazada ko'rindi.

Kod telefon raqamdan `998` prefiksini kesib tashlardi:

```js
if (digits.startsWith('998')) digits = digits.slice(3);   // ❌ XATO
```

Muammo: **`99` — amaldagi operator kodi.** Ya'ni to'liq 9 xonali
raqamning o'zi `998` bilan boshlanishi mumkin: `99 812 34 56` →
`998123456`. Kod undan "mamlakat kodi"ni kesib `123456` qoldirardi.

Bazada tasdiq — `99` kodli 76 ta foydalanuvchining 3-xonasi taqsimoti:

```
0→13  1→10  2→4  3→10  4→10  5→10  6→4  7→7  8→0  9→8
                                            ▲
```

`8` aynan nol. Ya'ni `99 8xx xx xx` raqamli odamlar **ro'yxatdan o'ta
olmayotgan edi**.

**To'g'ri yechim — uzunlik bo'yicha, prefiks bo'yicha emas:**

```js
if (digits.length > 9 && digits.startsWith('998')) {
  digits = digits.slice(3);      // ✅ faqat 9 xonadan uzun bo'lsa
}
```

`MOBILE-INTEGRATION.md` dagi normalizatsiya spetsifikatsiyasi (64–72
qatorlar) **to'g'ri** — u uzunlikka asoslangan. Xato faqat kiritish
maydonini formatlashda edi.

**Yana:** sayt kirish sahifasida `+998` doimiy prefiksdan **voz kechdi**
va endi yagona maydon bor — telefon ham, email ham. Sabab: foydalanuvchi
`+998` bilan ham, `998` bilan ham, prefiksiz ham yozishi mumkin.
Mobil ilovada ham shunday qil.

Klaviatura haqida: agar maydon email ham qabul qilsa, `tel` klaviatura
**qo'yma** — iOS da telefon klaviaturasida harf yo'q va email egalari
yoza olmay qoladi. Bazada 383 ta parol bilan kiradigan email hisobi bor.

---

## 9. Tekshirish mezonlari

O'zgarishlarni tugatgach, quyidagilarni **o'lchab** ko'rsat:

- [ ] Mobil ilovadagi bo'limlar ro'yxati sayt bilan mos
- [ ] Har bir bo'lim uchala tilda to'liq ishlaydi
- [ ] PRO cheklovlari sayt bilan aynan bir xil
- [ ] `t_63_q_11` … `t_63_q_19` hamma kerakli fayllarda bor
- [ ] Uchala tilda savol soni bir xil (1259)
- [ ] `is_correct` uchala tilda bir xil `id` da
- [ ] Ro'yxatlar yuklanayotganda sakramaydi
- [ ] Rasm yuklanguncha joy band qilingan
- [ ] 320dp ekranda gorizontal scroll yo'q
- [ ] `99 812 34 56` raqami bilan ro'yxatdan o'tish ishlaydi
- [ ] Real imtihon ekrani yorug'/qorong'i rejimda bir xil ko'rinadi

---

## 10. Qilmaslik kerak

1. **Takroriy savol matnlarini "tozalama"** — 6.4 ga qara.
2. **Ma'lumotni qo'lda ko'chirma.** Sayt fayllaridan generatsiya qil,
   aks holda keyingi yangilanishda ilova eskiradi.
3. **Izohni bepul foydalanuvchiga ko'rsatma** — hech qanday holatda.
4. **Apostroflarni tasdiqsiz almashtirma** — 8000+ joyga tegadi.
5. **Savol sonini o'zgartirganda qo'riqchini shunchaki o'chirma** —
   sababini izohda yoz.
6. Backend'ga tegma — u tayyor. `MOBILE-INTEGRATION.md` ga qara.

---

## 11. Savol berish

Agar biror narsa noaniq bo'lsa yoki ikki xil yechim bo'lsa — **so'ra**,
taxmin qilma. Ayniqsa:

- apostrof qaysi shaklga keltirilsin
- qaysi ma'lumot ilova ichida, qaysi biri tarmoqdan
- yangi savollar bepul to'plamga kirsinmi
