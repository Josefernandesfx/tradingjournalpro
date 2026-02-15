
import React, { createContext, useContext, useState, useEffect } from 'react';
import { Language } from './types';
import { translations } from './translations';

type TranslationKeys = keyof typeof translations.en;

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKeys) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('tjp_settings');
    if (saved) {
      const parsed = JSON.parse(saved);
      return (parsed.language as Language) || 'en';
    }
    return 'en';
  });

  const t = (key: TranslationKeys): string => {
    const langSet = translations[language] || translations.en;
    const value = (langSet as any)[key] || (translations.en as any)[key];
    
    // Debug mode: Log missing keys if needed
    if (!value) {
      console.warn(`[i18n] Missing translation key: ${key}`);
      return key;
    }
    return value;
  };

  return (
    <I18nContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </I18nContext.Provider>
  );
};

export const useTranslation = () => {
  const context = useContext(I18nContext);
  if (!context) throw new Error("useTranslation must be used within I18nProvider");
  return context;
};
