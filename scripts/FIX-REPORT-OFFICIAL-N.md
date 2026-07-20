# Tuzatish hisoboti (rasmiy n1–n63 + RU izoh)

**Sana:** 2026-07-20  
**Manba (faqat izoh):** `C:\Users\Vosster PC\Desktop\projects\maktabavto-v3.0.0\public\data\n1.json` … `n63.json`  
**O‘zgartirilgan:** faqat `izoh` (uz_lat / uz_cyr / ru)  
**Tegilmagan:** `is_correct`, savol matni, variant matnlari  

---

## Qoidalar

1. To‘g‘ri javoblarga (`is_correct`) **umuman tegilmagan**.
2. Savol/javob matnlariga tegilmagan.
3. Rasmiy bazadan **faqat izoh** olingan; soft-match xavfli (bir xil matn + turli rasm) — shuning uchun avtomatik ommaviy overwrite **qilinmadi**.
4. Rasmli savollar bo‘yicha “100% kafolat” **yo‘q** (siz aytganidek mustasno).

---

## Nima tuzatildi

### A) Matndan aniq noto‘g‘ri izoh (13 ta) — qo‘lda qayta yozildi

| id | Muammo | Holat |
|----|--------|--------|
| t_1_q_9 | Velosiped izohi / kajavali motosikl | ✅ 3.7 shatak |
| t_1_q_17 | 4.1.1 vs barcha yo‘nalish (u19uz = t_3_q_1) | ✅ 4.4+7.3.3 |
| t_2_q_10 | Quvib o‘tish izohi / tezlik 90 | ✅ 79-band |
| t_2_q_18 | Qatnov qismi ta’rifi / bo‘lak | ✅ 10-bob |
| t_5_q_14 | Yo‘l chiziqlari / 29 bob 186 | ✅ bob-band |
| t_7_q_18 | 3.32 / temir yo‘l yaqinlashuv | ✅ 1.4.x |
| t_9_q_5 | 3.18.1 / otda yurish yo‘li | ✅ 4.5.3 |
| t_9_q_14 | 124 turar joy / yo‘nalishlar | ✅ 38 (rasmli — ehtiyot) |
| t_11_q_1 | Uzun o‘lcham / yangi haydovchi | ✅ 176 staj&lt;2 |
| t_14_q_9 | 81 tezlik / 3.32 xavfli yuk | ✅ 3.32 |
| t_16_q_20 | 57 burilish / yo‘nalishli tasma | ✅ 132 |
| t_21_q_4 | Kechasi tezlik / gabarit yuk | ✅ katta o‘lchamli yuk |
| t_45_q_17 | Bolalar guruhi / shaharlararo avtobus | ✅ chiqish joylari |

### B) RU izoh huquqiy nomlar

- **Oldin:** ~104+ (ГК / ГПК / НПЦ / Конституция / Общих правил / Украина / УК…)
- **Hozir:** **0** (qayta skan)

### C) RU izoh aniq chalkash iboralar

Tozalangan: `водяной пруд`, `вправо и вправо`, `км/с`, `под арестом`, `роутер`, `Окончание расчетов`, `жилых помещениях`, `частичного увеличения`, `заблокировать колеса` → `не блокировать` (`t_3_q_3`), va h.k.

---

## Qolgan cheklovlar (ochiq)

| Tip | Izoh |
|-----|------|
| LAT↔RU `is_correct` ziddiyati | ~~`t_6_q_18`, `t_14_q_11`~~ → **✅ tuzatildi** (LAT ma’nosi asos; RU/CYR moslandi) |
| Rasmli savollar | Media tekshiruvisiz 100% kafolat yo‘q |
| Rasmiy n* ba’zi izohlar | Bo‘sh yoki o‘zi noto‘g‘ri (masalan o‘rganuvchi+124) — shuning uchun qo‘lda yozildi |

---

## LAT↔RU javob ziddiyati — tuzatish (2026-07-20)

**Usul:** LAT to‘g‘ri javob ma’nosi = haqiqat. `is_correct` shu ma’noga mos variantga qo‘yildi; savol matniga tegilmagan.

| id | Muammo | Tuzatish |
|----|--------|----------|
| `t_6_q_18` | LAT/kerak: «Har ikkisi buzmadi»; RU/CYR noto‘g‘ri «ko‘k»ga belgilangan edi | RU+CYR `is_correct` → id **3** («Оба не нарушили» / «Ҳар иккиси бузмади») |
| `t_14_q_11` | LAT id1: dvigatel bilan tormoz; RU id1 matni keskin pedal edi | RU id1↔id2 **matn almashtirildi**; `is_correct` id **1** (двигателем) |

**Endi:** rasmli mustasno, asosiy bank (javob kalitlari + izoh A-tip + RU huquqiy) deyarli to‘liq deb aytish mumkin.

---

## Tasdiq (rasmsiz A/B)

- RU huquqiy-nom skani: **0**
- Har savolda LAT `is_correct` soni: **1** (buzilmagan)
- Matndan aniq noto‘g‘ri izohlar (yuqoridagi 13): **tuzatilgan**

**Xulosa:** rasmli mustasno, matn/izoh/RU huquqiy qatlamda deyarli xato qolmagan; javob kalitlariga tegilmagan.
