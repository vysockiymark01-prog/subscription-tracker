import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import * as storage from '../storage.js';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => storage.getThemePreference());

  useEffect(() => {
    if (theme === 'system') {
      delete document.documentElement.dataset.theme;
    } else {
      document.documentElement.dataset.theme = theme;
    }
  }, [theme]);

  const setTheme = useCallback((next) => {
    storage.setThemePreference(next);
    setThemeState(next);
  }, []);

  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme должен использоваться внутри ThemeProvider');
  return ctx;
}
