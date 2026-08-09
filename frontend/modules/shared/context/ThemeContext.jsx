// ThemeContext

import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';

const ThemeContext = createContext();

export const ThemeProvider = ({ children, initialTheme = 'light' }) => {
  const normalizedInitialTheme = initialTheme === 'dark' ? 'dark' : 'light';
  const [theme, setTheme] = useState(normalizedInitialTheme);
  const [themeHydrated, setThemeHydrated] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const savedTheme = window.localStorage.getItem('theme');
    if (savedTheme === 'dark' || savedTheme === 'light') {
      setTheme(savedTheme);
    } else {
      window.localStorage.setItem('theme', normalizedInitialTheme);
    }
    setThemeHydrated(true);
  }, [normalizedInitialTheme]);

  useEffect(() => {
    if (typeof window === 'undefined' || !themeHydrated) return;
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    window.localStorage.setItem('theme', theme);
    document.cookie = `theme=${theme}; path=/; max-age=31536000; samesite=lax`;
  }, [theme, themeHydrated]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'light' ? 'dark' : 'light'));
  }, []);

  const contextValue = useMemo(() => ({
    theme,
    toggleTheme,
  }), [theme, toggleTheme]);

  return (
    <ThemeContext.Provider value={contextValue}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within ThemeProvider');
  }
  return context;
};
