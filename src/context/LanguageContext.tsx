import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from 'react';
import { Platform } from 'react-native';
import { pl, en, TranslationKey } from '../i18n';
import { storage } from '../utils/storage';

export type Language = 'pl' | 'en';

const translations = { pl, en };

const LANG_KEY = 'tibia_language_v1';

// Allow ?lang=en|pl on web to override stored preference. Used for ad
// landing pages (e.g. Polish Meta campaign → ?lang=pl, English AdWords
// → ?lang=en). Falls back to browser Accept-Language on first visit.
function readUrlLang(): Language | null {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return null;
  const param = new URLSearchParams(window.location.search).get('lang');
  if (param === 'en' || param === 'pl') return param;
  return null;
}

function readBrowserLang(): Language {
  if (Platform.OS !== 'web' || typeof navigator === 'undefined') return 'pl';
  const nav = navigator.language?.toLowerCase() ?? '';
  return nav.startsWith('pl') ? 'pl' : 'en';
}

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
    // Priority: URL param > stored preference > browser locale > 'pl' default.
    // URL param also persists to storage so return visitors stay in that language.
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
      } else {
        setLanguageState(readBrowserLang());
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
