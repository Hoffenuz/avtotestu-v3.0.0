# Harf chalkashligi (rasm A/B/C ↔ matn V / kirill)

**Maqsad:** o‘zingiz tuzatishingiz uchun ro‘yxat. Kodga tegilmadi.

**Qoida:** rasmdagi yorliq qanday bo‘lsa (odatda Latin **A B C** yoki kirill **А Б В**), `uz_lat` / `uz_cyr` / `ru` variant matnlari shu alifboga mos bo‘lishi kerak.

---

## Sizning skrinshotlaringiz (tasdiqlangan)

### 1) `t_28_q_8` — media: `u311uz.webp`

| | |
|--|--|
| **Savol** | Qaysi belgi tartibga solinmagan piyodalar o'tish joyiga yaqinlashayotganlik haqida ogohlantiradi? |
| **Rasm** | Belgilar ostida Latin **A**, **B**, **C** |
| **Javoblar** | `Hammasi` \| **`A va V`** \| `Faqat A` |
| **Xato** | Rasmda **B**, matnda **V** |
| **Tuzatish** | `A va V` → `A va B` (barcha tillarda tekshiring) |

### 2) `t_28_q_14` — media: `u317uz.webp`

| | |
|--|--|
| **Savol** | Qaysi transport vositalariga yo'lovchilarni tushirishga ruxsat etiladi? |
| **Rasm** | Mashinalar ostida Latin **A**, **B**, **C**; o‘ng tomonda katta **A** — bu odatda avtobus bekatining yo‘l chizig‘i (yorliq emas) |
| **Javoblar (uz_lat)** | **`«Б»`** \| `Hech qaysi biriga` \| **`«А»`** \| **`«В»`** |
| **Xato** | Rasm Latin **A/B/C**, matn kirill **А/Б/В** (Б≈B, В≈V — chalkashadi) |
| **Tuzatish** | `«А»`→`A` (yoki `«A»`), `«Б»`→`B`, `«В»`→`C` — **rasmdagi harfga qarab** (В≠C!) |

> Diqqat: kirill **«В»** = lotin **V**, rasmdagi **C** emas. Agar rasmda C bo‘lsa, variantni `C` qiling, `V` emas.

---

## Tip A — `uz_lat` da Latin **V** (rasmda ko‘pincha **B**)

Matnda `V` / `A va V` / `B va V` bor; rasmlar odatda A–B–C. Har birini media bilan tekshiring.

| ID | media | Variantlar (LAT) | To‘g‘ri deb belgilangan |
|----|-------|------------------|-------------------------|
| `t_11_q_16` | u124uz.webp | B \| A \| **A, B, V** \| A va B | A, B, V |
| `t_14_q_9` | u156uz.webp | S \| A \| **V** | S |
| `t_15_q_14` | u169uz.webp | B \| **B va V** \| A \| G \| A va G | A |
| `t_15_q_16` | u170uz.webp | B \| **V** \| A | V |
| `t_17_q_10` | u187uz.webp | B \| A \| G \| **B va V** \| A va G | B |
| `t_19_q_6` | u211uz.webp | A \| A va B \| **V** | V |
| **`t_28_q_8`** | u311uz.webp | Hammasi \| **A va V** \| Faqat A | Faqat A |
| `t_44_q_9` | u506uz.webp | G \| B \| A \| **V** | V |
| `t_44_q_19` | u514uz.webp | **V** \| **A va V** \| B | B |
| `t_45_q_16` | u525uz.webp | A \| **V** \| B | V |
| `t_46_q_8` | u529uz.webp | A \| **V** \| A va S \| S | V |
| `t_48_q_9` | u550uz.webp | **V va G** \| **V** \| A va B \| Barchasi | V |
| `t_53_q_1` | u605uz.webp | A \| B va G \| **V** \| G \| B | B va G |
| `t_57_q_5` | u656uz.webp | A \| S \| **V** | S |

**Taxminiy tuzatish:** rasmda B bo‘lsa `V`→`B`; `A va V`→`A va B`; `B va V`→`B va C` (yoki rasmda uchinchi harf nima bo‘lsa).

---

## Tip B — aralash (bir savolda Latin + kirill)

| ID | media | Variantlar | Muammo |
|----|-------|------------|--------|
| `t_27_q_4` | u296uz.webp | Faqat «Б» \| Faqat «А» va **«B»** \| Faqat «А» | «А»/«Б» kirill, «B» lotin |
| `t_54_q_9` | u623uz.webp | **«B»** \| «А» \| «А» va «B» | Xuddi shu aralash |

---

## Tip C — `uz_lat` da to‘liq kirill «А/Б/В/Г» + rasm (40 ta)

Bu yerda **hammasi xato emas**: ba’zi rasmlarda yorliqlar ham kirill. Lekin LAT interfeys + rasmdagi Latin A/B/C bo‘lsa — sizning `t_28_q_14` tipidagi xato.

To‘liq ro‘yxat: `scripts/_letter-mismatch-report.json` (flag: `CYR_IN_LAT`).

Muhimlar (media bor):

`t_1_q_12`, `t_2_q_9`, `t_7_q_9`, `t_7_q_15`, `t_7_q_19`, `t_16_q_17`, `t_17_q_1`, `t_17_q_6`, `t_19_q_14`, `t_20_q_11`, `t_21_q_14`, `t_22_q_3`, `t_22_q_6`, `t_22_q_9`, `t_23_q_12`, `t_24_q_16`, `t_26_q_8`, `t_27_q_4`, **`t_28_q_12`**, **`t_28_q_14`**, `t_28_q_18`, `t_28_q_20`, `t_29_q_1`, `t_30_q_16`, `t_31_q_11`, `t_32_q_17`, `t_33_q_14`, `t_37_q_20`, `t_39_q_20`, `t_40_q_11`, `t_43_q_9`, `t_46_q_15`, `t_46_q_20`, `t_47_q_5`, `t_48_q_2`, `t_48_q_10`, `t_51_q_14`, `t_53_q_5`, `t_54_q_9`, `t_55_q_13`

**Tekshiruv tartibi:** rasmni oching → yorliq Latinmi yoki kirillmi → matnni shunga tenglashtiring.  
**Hech qachon** ko‘r-ko‘rona `«В»` ni `B` qilmang: kirill В = lotin **V**; kirill **Б** = lotin **B**.

---

## Tezkor xulosa

| Tip | Soni | Ishonch |
|-----|------|---------|
| Skrinshot bilan tasdiqlangan | 2 | 100% (`t_28_q_8`, `t_28_q_14`) |
| Latin **V** (Tip A) | 14 | Yuqori — deyarli hammasi B/C chalkashi |
| Aralash A/B (Tip B) | 2 | Aniq matn xatosi |
| Kirill in LAT + media (Tip C) | 40 | Media tekshiruvisiz mass-fix qilmang |

Lokal `public/images/` da eski `u*.webp` yo‘q (faqat yangi u62/u63) — qolganlarini sayt/CDN orqali ochib tekshiring.
