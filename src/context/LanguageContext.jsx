import { createContext, useCallback, useContext, useMemo, useState } from 'react';
import * as storage from '../storage.js';
import { LOCALES, DEFAULT_LOCALE, interpolate, pluralForm } from '../i18n/index.js';

const LanguageContext = createContext(null);

export function LanguageProvider({ children }) {
  const [language, setLanguageState] = useState(() => storage.getLanguagePreference());

  const setLanguage = useCallback((value) => {
    storage.setLanguagePreference(value);
    setLanguageState(value);
  }, []);

  const t = useCallback(
    (key, vars) => {
      const dict = LOCALES[language] ?? LOCALES[DEFAULT_LOCALE];
      const str = dict[key] ?? LOCALES[DEFAULT_LOCALE][key] ?? key;
      return interpolate(str, vars);
    },
    [language],
  );

  /**
   * Перевод с учётом множественного числа: tp('tips.stale', count, {count})
   * ищет ключ вида 'tips.stale.one' / '.few' / '.many' в зависимости от языка и числа.
   */
  const tp = useCallback(
    (baseKey, count, vars) => {
      const form = pluralForm(language, count);
      return t(`${baseKey}.${form}`, { count, ...vars });
    },
    [language, t],
  );

  const value = useMemo(() => ({ language, setLanguage, t, tp }), [language, setLanguage, t, tp]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage должен использоваться внутри LanguageProvider');
  return ctx;
}
