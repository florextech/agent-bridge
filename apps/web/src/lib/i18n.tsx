'use client';

import { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import en from '@/messages/en.json';
import es from '@/messages/es.json';

const messages: Record<string, Record<string, Record<string, string>>> = { en, es };

type TFunc = (key: string) => string;

const I18nContext = createContext<{ t: TFunc; locale: string; toggle: () => void }>({
  t: (k) => k,
  locale: 'en',
  toggle: () => {},
});

export function I18nProvider({ initialLocale, children }: { initialLocale: string; children: ReactNode }) {
  const [locale, setLocale] = useState(initialLocale);

  const toggle = useCallback(() => {
    const next = locale === 'en' ? 'es' : 'en';
    localStorage.setItem('locale', next);
    document.cookie = `locale=${next};path=/;max-age=31536000;SameSite=Lax`;
    setLocale(next);
  }, [locale]);

  const t: TFunc = useCallback((key: string) => {
    const [ns, ...rest] = key.split('.');
    const k = rest.join('.');
    return messages[locale]?.[ns!]?.[k] ?? key;
  }, [locale]);

  return (
    <I18nContext.Provider value={{ t, locale, toggle }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
