import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from 'react';
import { pl, en, TranslationKey } from '../i18n';
import { storage } from '../utils/storage';

export type Language = 'pl' | 'en';

const translations = { pl, en };

const LANG_KEY = 'tibia_language_v1';

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
  const [language, setLanguageState] = useState<Language>('pl');
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    storage.getItem(LANG_KEY).then((stored) => {
      if (stored === 'en' || stored === 'pl') setLanguageState(stored);
      setHydrated(true);
    });
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    storage.setItem(LANG_KEY, lang);
  }, []);

  const t = useCallback((key: TranslationKey): string => translations[language][key], [language]);

  if (!hydrated) return null;

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useTranslation() {
  return useContext(LanguageContext);
}
