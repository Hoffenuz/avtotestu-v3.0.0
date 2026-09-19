/**
 * Bepul va PRO taqqoslash — YAGONA manba.
 *
 * NEGA KERAK: bu taqqoslash ikki sahifada ko'rsatiladi — `/pro` (sotuv
 * sahifasi) va `/qoshimcha` (qo'llanma). Ular alohida yozilganda darrov
 * bir-biridan ajralib ketdi: bir joyda 5 ta qator, boshqasida 10 ta va
 * boshqacha so'zlar bilan. Foydalanuvchi uchun bu ikki xil va'da degani.
 *
 * Endi mazmun SHU YERDA, sahifalar esa faqat ko'rinishi bilan farq qiladi:
 * `/pro` — sotuv uslubida (oltin, toj, chizilgan qatorlar),
 * `/qoshimcha` — bezaksiz, tushuntirish uchun.
 *
 * RAQAMLAR HAQIQIY BAZADAN OLINGAN (o'zgartirishdan oldin sanab ko'ring):
 *   bepul  public/free-*.json   = 1009 savol
 *   PRO    public/barcha-*.json = 1275 savol  (farqi 266)
 *   variantlar: src/components/TestStartPage.tsx -> TOTAL_VARIANTS = 64
 *   bepul variant: src/lib/variantAccess.ts -> FREE_VARIANT_UI = 1
 * Noto'g'ri raqam bu yerda reklama da'vosiga aylanadi.
 */
export interface ProComparisonRow {
  /** "Bepul" ustunidagi matn kaliti. */
  freeKey: string;
  /** "PRO" ustunidagi matn kaliti. */
  proKey: string;
  /**
   * Bepul versiyada bormi.
   *
   * `false` bo'lsa "Bepul" ustunida chizib tashlanadi — ya'ni imkoniyat
   * nomi ko'rinadi, lekin mavjud emasligi aniq bo'ladi.
   */
  inFree: boolean;
}

export const PRO_COMPARISON: readonly ProComparisonRow[] = [
  { freeKey: "pro.comparisonBasic1", proKey: "pro.comparisonPro1", inFree: true },
  { freeKey: "pro.comparisonBasic2", proKey: "pro.comparisonPro2", inFree: false },
  { freeKey: "pro.comparisonBasic3", proKey: "pro.comparisonPro3", inFree: false },
  { freeKey: "pro.comparisonBasic4", proKey: "pro.comparisonPro4", inFree: false },
  { freeKey: "pro.comparisonBasic5", proKey: "pro.comparisonPro5", inFree: false },
];
