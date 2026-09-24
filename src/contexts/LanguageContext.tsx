import React, { createContext, useContext, useEffect, useCallback, useMemo, ReactNode } from 'react';

import uzLatTranslations from '@/locales/uz-lat.json';
import uzTranslations from '@/locales/uz.json';
import ruTranslations from '@/locales/ru.json';
import { detectLangFromWindow, buildLangPath } from '@/lib/langUrl';

export type Language = 'uz-lat' | 'uz' | 'ru';

type Translations = Record<string, unknown>;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
  questionLang: 'oz' | 'uz' | 'ru';
}

const translations: Record<Language, Translations> = {
  'uz-lat': uzLatTranslations,
  uz: uzTranslations,
  ru: ruTranslations,
};

/**
 * `<html lang>` uchun BCP-47 kodlari.
 *
 * NEGA KERAK: `index.html` da `lang="uz"` qotib qolgan edi va til
 * almashtirilganda o'zgarmasdi. Natijada ruscha sahifa ham o'zbek tili deb
 * e'lon qilinardi — ekran o'quvchi (screen reader) matnni noto'g'ri talaffuz
 * qiladi, brauzer "tarjima qilinsinmi?" degan taklifni noto'g'ri ko'rsatadi,
 * qidiruv tizimlari esa sahifa tilini xato aniqlaydi.
 */
const HTML_LANG: Record<Language, string> = {
  'uz-lat': 'uz-Latn',
  uz: 'uz-Cyrl',
  ru: 'ru',
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {

  /*
    TIL MANBASI — MANZIL, `localStorage` EMAS.

    Ilgari til faqat `localStorage` da saqlanardi va uchala til bitta
    manzilda ko'rinardi. Google bir manzil uchun faqat bitta til
    versiyasini indekslay oladi — shu sababli ruscha va kirillcha kontent
    qidiruvda deyarli ko'rinmasdi (kirill so'rovlari oyiga 25 775
    ko'rsatish beradi, mos sahifa esa yo'q edi).

    Endi manzil hal qiladi: `/belgilar` lotin, `/cyr/belgilar` kirill,
    `/ru/belgilar` ruscha. Bitta manzil — bitta til.
  */
  const { lang: language } = detectLangFromWindow();

  useEffect(() => {
    /*
      `localStorage` YOZILADI, lekin O'QILMAYDI. Sabab: uni o'qib tilni
      tanlasak, bitta manzil yana ikki xil tilda ko'rinardi. Yozib
      qo'yilishi esa foydali — kelajakda "sizning tilingiz" taklifini
      ko'rsatish uchun asqotadi.
    */
    try { localStorage.setItem('language', language); } catch { /* kvota yoki maxfiy rejim */ }
    document.documentElement.lang = HTML_LANG[language];
  }, [language]);

  /**
   * Tilni almashtirish — SHU SAHIFANING boshqa tildagi manzeliga o'tish.
   * Qidiruv so'rovi va lange saqlanadi, faqat prefiks almashadi.
   */
  const setLanguage = useCallback((lang: Language) => {
    /*
      TO'LIQ QAYTA YUKLASH, client-side navigate EMAS.

      Til prefiksi Router ga `basename` sifatida berilgan va u faqat
      Router yaratilganda o'qiladi. Client-side o'tishda `basename`
      eski qiymatida qolib, barcha havolalar noto'g'ri prefiks olardi.

      Til almashtirish kamdan-kam bo'ladigan amal, shuning uchun to'liq
      yuklash sezilarli emas — buzuq navigatsiyadan esa ancha yaxshi.
    */
    if (typeof window === 'undefined') return;

    /*
      YO'L AYNAN SHU YERDA O'QILADI, render vaqtida EMAS.

      Bu provider `<Routes>` dan yuqorida turadi va `useLocation()` ni
      ishlatmaydi, ya'ni client-side o'tishlarda QAYTA RENDER BO'LMAYDI.
      Yo'l render vaqtida o'qilganda u sahifa birinchi yuklangan
      manzilda qotib qolardi: `/profile` da ochilgan sayt keyin
      `/belgilar` ga o'tsa ham, til almashtirilganda foydalanuvchi
      `/profile` ga qaytarib tashlanardi.

      `window.location` esa har doim haqiqiy joriy manzilni beradi.
    */
    const { basePath } = detectLangFromWindow();
    const yangi = buildLangPath(lang, basePath);
    window.location.assign(`${yangi}${window.location.search}${window.location.hash}`);
  }, []);

  const t = useCallback((key: string): string => {
    const keys = key.split('.');
    let result: unknown = translations[language];

    for (const k of keys) {
      if (result && typeof result === 'object' && k in result) {
        result = (result as Record<string, unknown>)[k];
      } else {
        return key;
      }
    }

    return typeof result === 'string' ? result : key;
  }, [language]);

  const questionLang: 'oz' | 'uz' | 'ru' = useMemo(
    () => language === 'uz-lat' ? 'oz' : language,
    [language]
  );

  const value = useMemo(
    () => ({ language, setLanguage, t, questionLang }),
    [language, setLanguage, t, questionLang]
  );

  return (
    <LanguageContext.Provider value={value}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
