import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
  useEffect,
} from 'react';
import { Platform } from 'react-native';
import { pl, en, TranslationKey } from '../i18n';
import { storage } from '../utils/storage';

export type Language = 'pl' | 'en';

const translations = { pl, en };

const LANG_KEY = 'tibia_language_v1';

// Allow ?lang=en|pl on web to override stored preference. Used for ad
// landing pages (e.g. Polish Meta campaign → ?lang=pl, English AdWords
// → ?lang=en). Default is always English — no browser-language auto-detect,
// so international visitors with a Polish browser still land on EN.
function readUrlLang(): Language | null {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return null;
  const param = new URLSearchParams(window.location.search).get('lang');
  if (param === 'en' || param === 'pl') return param;
  return null;
}

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextType>({
  language: 'en',
  setLanguage: () => {},
  t: (key) => en[key],
});

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>('en');
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    // Priority: URL param > stored preference > 'en' default. No browser
    // auto-detect — we want international visitors on EN by default.
    // URL param also persists so return visitors stay in that language.
    const urlLang = readUrlLang();
    if (urlLang) {
      setLanguageState(urlLang);
      storage.setItem(LANG_KEY, urlLang);
      setHydrated(true);
      return;
    }
    storage.getItem(LANG_KEY).then((stored) => {
      if (stored === 'en' || stored === 'pl') {
        setLanguageState(stored);
      }
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
