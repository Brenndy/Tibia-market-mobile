import React, {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
  useEffect,
} from 'react';
import { Platform } from 'react-native';
import { pl, en, ptBR, TranslationKey } from '../i18n';
import { storage } from '../utils/storage';

export type Language = 'pl' | 'en' | 'pt-BR';

const translations = { pl, en, 'pt-BR': ptBR };

const LANG_KEY = 'tibia_language_v1';

// Accept ?lang=pt-BR case-insensitively (Google may normalize to pt-br).
function normalizeLangParam(raw: string | null): Language | null {
  if (!raw) return null;
  if (raw === 'en' || raw === 'pl') return raw;
  if (raw.toLowerCase() === 'pt-br') return 'pt-BR';
  return null;
}

// Allow ?lang=en|pl|pt-BR on web to override stored preference. Used for ad
// landing pages (e.g. Polish Meta campaign → ?lang=pl, Brazilian campaign
// → ?lang=pt-BR). Default is always English — no browser-language auto-detect,
// so international visitors still land on EN.
function readUrlLang(): Language | null {
  if (Platform.OS !== 'web' || typeof window === 'undefined') return null;
  return normalizeLangParam(new URLSearchParams(window.location.search).get('lang'));
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
      const normalized = normalizeLangParam(stored ?? null);
      if (normalized) setLanguageState(normalized);
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
