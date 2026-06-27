import { createContext, useContext, useEffect, useMemo, useState } from 'react';

const ThemeContext = createContext(null);
const STORAGE_KEY = 'splito_theme';
const THEMES = ['tripsy', 'classic'];

function getInitialTheme() {
  if (typeof window === 'undefined') return 'tripsy';
  const saved = window.localStorage.getItem(STORAGE_KEY);
  return THEMES.includes(saved) ? saved : 'tripsy';
}

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    window.localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const value = useMemo(() => ({
    theme,
    isClassic: theme === 'classic',
    toggleTheme: () => setTheme(current => current === 'classic' ? 'tripsy' : 'classic'),
  }), [theme]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used inside ThemeProvider');
  return context;
}
