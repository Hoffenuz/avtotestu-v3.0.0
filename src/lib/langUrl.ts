// ============================================================================
// langUrl — til manzil prefiksi
// ----------------------------------------------------------------------------
// MUAMMO: sayt uch tilda, lekin bitta manzilda edi — til `localStorage` da
// saqlanardi. Google bir manzil uchun FAQAT BITTA til versiyasini indekslay
// oladi, ya'ni ruscha va kirillcha kontent qidiruvda deyarli ko'rinmasdi.
// O'lchov: kirill yozuvidagi so'rovlar oyiga 25 775 ko'rsatish beradi —
// talab bor, mos manzil yo'q.
//
// YECHIM: har til uchun alohida manzil.
//
//   /belgilar        →  o'zbekcha (lotin)   ← ASOSIY, O'ZGARMAYDI
//   /cyr/belgilar    →  o'zbekcha (kirill)
//   /ru/belgilar     →  ruscha
//
// NEGA ASOSIY TIL PREFIKSSIZ: mavjud manzillar tegilmaydi. Sayt "avto test"
// bo'yicha 1,1-pozitsiyada va oyiga 60 000 dan ortiq klik oladi — ularni
// ko'chirish keraksiz tavakkalchilik bo'lardi. Faqat YANGI manzillar
// qo'shiladi.
//
// MANBA — MANZIL: til endi manzildan olinadi, `localStorage` dan emas.
// Aks holda bitta manzil ikki xil tilda ko'rinardi va biz hal qilmoqchi
// bo'lgan muammo qaytardi.
// ============================================================================

import type { Language } from "@/contexts/LanguageContext";

/** Til → manzil prefiksi. Asosiy tilda prefiks yo'q. */
export const LANG_PREFIX: Record<Language, string> = {
  "uz-lat": "",
  uz: "/cyr",
  ru: "/ru",
};

/** Asosiy (prefikssiz) til. */
export const DEFAULT_LANG: Language = "uz-lat";

/** `hreflang` atributi uchun BCP-47 kodlari. */
export const HREFLANG: Record<Language, string> = {
  "uz-lat": "uz-Latn",
  uz: "uz-Cyrl",
  ru: "ru",
};

/** Prefiksli tillar — `/` dan boshlanadigan qismlar. */
const PREFIXLI: ReadonlyArray<[string, Language]> = [
  ["/ru", "ru"],
  ["/cyr", "uz"],
];

export interface ParsedPath {
  /** Manzildan aniqlangan til. */
  lang: Language;
  /**
   * Prefikssiz yo'l — doim `/` bilan boshlanadi.
   * `/ru/belgilar` → `/belgilar`, `/ru` → `/`.
   */
  basePath: string;
}

/**
 * Manzildan tilni va prefikssiz yo'lni ajratadi.
 *
 * Prefiks FAQAT to'liq bo'lak bo'lsa hisobga olinadi: `/ruslar` — bu `/ru`
 * prefiksi emas, oddiy sahifa. Shuning uchun keyingi belgi `/` yoki yo'l
 * oxiri bo'lishi tekshiriladi.
 */
export function parseLangPath(pathname: string): ParsedPath {
  for (const [prefix, lang] of PREFIXLI) {
    if (pathname === prefix || pathname.startsWith(prefix + "/")) {
      const qolgan = pathname.slice(prefix.length);
      return { lang, basePath: qolgan === "" ? "/" : qolgan };
    }
  }
  return { lang: DEFAULT_LANG, basePath: pathname || "/" };
}

/**
 * Prefikssiz yo'lga til prefiksini qo'shadi.
 * `("ru", "/belgilar")` → `/ru/belgilar`; `("uz-lat", "/belgilar")` → `/belgilar`.
 */
export function buildLangPath(lang: Language, basePath: string): string {
  const yol = basePath.startsWith("/") ? basePath : `/${basePath}`;
  const prefix = LANG_PREFIX[lang] ?? "";
  if (!prefix) return yol;
  return yol === "/" ? prefix : `${prefix}${yol}`;
}

/**
 * Sahifaning uchala tildagi to'liq manzili — `hreflang` va sitemap uchun.
 */
export function langAlternates(basePath: string, origin: string) {
  return (Object.keys(LANG_PREFIX) as Language[]).map((lang) => ({
    lang,
    hreflang: HREFLANG[lang],
    href: `${origin}${buildLangPath(lang, basePath)}`,
  }));
}

/**
 * Brauzer manzilidan til prefiksini o'qiydi.
 *
 * NEGA `window.location` DAN, `useLocation` DAN EMAS: prefiks Router ga
 * `basename` sifatida beriladi va Router uni yo'ldan KESIB TASHLAYDI.
 * Ya'ni `useLocation().pathname` prefikssiz keladi va undan tilni
 * aniqlab bo'lmaydi. Haqiqiy manzil faqat `window.location` da qoladi.
 *
 * Server tomonida (SSR/test) `window` bo'lmasligi mumkin — o'shanda
 * asosiy til qaytariladi.
 */
export function detectLangFromWindow(): { lang: Language; prefix: string; basePath: string } {
  if (typeof window === "undefined") {
    return { lang: DEFAULT_LANG, prefix: "", basePath: "/" };
  }
  const { lang, basePath } = parseLangPath(window.location.pathname);
  return { lang, prefix: LANG_PREFIX[lang], basePath };
}
