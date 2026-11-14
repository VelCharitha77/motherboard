'use client';

import React, { createContext, useContext, useState, useEffect } from 'react';
import enDictionary from '@/messages/en.json';
import esDictionary from '@/messages/es.json';
import { Locale } from '@/lib/data/types';

type Dictionaries = typeof enDictionary;

interface I18nContextType {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: (path: string, fallback?: string) => string;
}

const I18nContext = createContext<I18nContextType>({
  locale: 'en',
  setLocale: () => {},
  t: (path: string, fallback?: string) => fallback ?? path,
});

const dictionaries: Record<Locale, Dictionaries> = {
  en: enDictionary,
  es: esDictionary,
};

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>('en');

  useEffect(() => {
    const saved = localStorage.getItem('motherboard_locale');
    if (saved === 'en' || saved === 'es') {
      setLocaleState(saved);
    }
  }, []);

  const setLocale = (newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem('motherboard_locale', newLocale);
  };

  const t = (path: string, fallback?: string): string => {
    const dict = dictionaries[locale] || dictionaries.en;
    const parts = path.split('.');
    let current: unknown = dict;

    for (const part of parts) {
      if (current && typeof current === 'object' && part in current) {
        current = (current as Record<string, unknown>)[part];
      } else {
        return fallback ?? path;
      }
    }

    return typeof current === 'string' ? current : fallback ?? path;
  };

  return (
    <I18nContext.Provider value={{ locale, setLocale, t }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
