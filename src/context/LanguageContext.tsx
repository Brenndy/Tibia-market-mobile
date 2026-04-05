import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { pl, en, TranslationKey } from '../i18n';

export type Language = 'pl' | 'en';

const translations = { pl, en };

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'pl',
  setLanguage: () => {},
  t: (key) => pl[key],
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('pl');

  const t = useCallback(
    (key: TranslationKey): string => translations[language][key],
    [language]
  );

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  return useContext(LanguageContext);
}
