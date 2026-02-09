import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import uzLatTranslations from '@/locales/uz-lat.json';
import uzTranslations from '@/locales/uz.json';
import ruTranslations from '@/locales/ru.json';

type Language = 'uz-lat' | 'uz' | 'ru';

interface Translations {
  [key: string]: any;
}

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

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('language');
    return (saved === 'uz-lat' || saved === 'uz' || saved === 'ru') ? saved : 'uz';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  // Get translation by dot-notation key (e.g., "test.selectVariant")
  const t = (key: string): string => {
    const keys = key.split('.');
    let result: any = translations[language];
    
    for (const k of keys) {
      if (result && typeof result === 'object' && k in result) {
        result = result[k];
      } else {
        return key; // Return key if translation not found
      }
    }
    
    return typeof result === 'string' ? result : key;
  };

  // Question language key for JSON data
  // uz-lat (Uzbek Latin) -> 'oz' in JSON
  // uz (Uzbek Cyrillic) -> 'uz' in JSON
  // ru (Russian) -> 'ru' in JSON
  const questionLang: 'oz' | 'uz' | 'ru' = language === 'uz-lat' ? 'oz' : language;

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, questionLang }}>
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
