import { useState, useEffect, useCallback } from 'react';
import en from '../locales/en.json';
import ru from '../locales/ru.json';
import es from '../locales/es.json';

const LOCALES: Record<string, Record<string, string>> = { en, ru, es };
const DEFAULT_LANG = 'en';

export type Language = 'en' | 'ru' | 'es';

export function useI18n() {
  const [lang, setLang] = useState<Language>(DEFAULT_LANG);
  const [t, setT] = useState<(key: string) => string>(() => (key: string) => key);

  useEffect(() => {
    const translations = LOCALES[lang] || LOCALES[DEFAULT_LANG];
    setT(() => (key: string) => translations[key] || key);
  }, [lang]);

  const setLanguage = useCallback((newLang: Language) => {
    setLang(newLang);
    localStorage.setItem('preferred_language', newLang);
  }, []);

  return { lang, t, setLanguage };
}
