import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { SupportedLanguage } from '../types/triage';
import { en, TranslationSchema } from './translations/en';
import { hi } from './translations/hi';
import { pa } from './translations/pa';

const DICTIONARIES: Record<SupportedLanguage, TranslationSchema> = {
  en,
  hi,
  pa,
};

const STORAGE_KEY = 'ai_triage_interface_lang';

interface I18nContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  t: (path: string, params?: Record<string, string | number>) => string;
  dict: TranslationSchema;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

/**
 * Helper to resolve nested dot-path keys safely with fallback to English
 */
function resolvePath(obj: any, path: string): string | undefined {
  const parts = path.split('.');
  let current = obj;
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      return undefined;
    }
  }
  return typeof current === 'string' ? current : undefined;
}

export const I18nProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<SupportedLanguage>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY) as SupportedLanguage | null;
      if (saved && (saved === 'en' || saved === 'hi' || saved === 'pa')) {
        return saved;
      }
    } catch {}
    return 'en';
  });

  const setLanguage = useCallback((lang: SupportedLanguage) => {
    setLanguageState(lang);
    try {
      localStorage.setItem(STORAGE_KEY, lang);
    } catch {}
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  const t = useCallback(
    (path: string, params?: Record<string, string | number>): string => {
      const activeDict = DICTIONARIES[language] || en;
      let raw = resolvePath(activeDict, path);

      // Fallback to English if missing in target dictionary
      if (raw === undefined) {
        raw = resolvePath(en, path) ?? path;
      }

      if (params) {
        return Object.entries(params).reduce((acc, [k, v]) => {
          return acc.replace(new RegExp(`\\{${k}\\}`, 'g'), String(v));
        }, raw);
      }

      return raw;
    },
    [language]
  );

  const dict = DICTIONARIES[language] || en;

  return (
    <I18nContext.Provider value={{ language, setLanguage, t, dict }}>
      {children}
    </I18nContext.Provider>
  );
};

export function useI18n(): I18nContextType {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
}
