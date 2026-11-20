import { useCallback, useEffect, useRef, useState } from 'react';

export type ThemeMode = 'light' | 'dark';

const STORAGE_KEY_THEME = 'pcm-study-checklist.theme.v1';
const THEME_TRANSITION_MS = 400;

function getInitialTheme(): ThemeMode {
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY_THEME);
    if (saved === 'light' || saved === 'dark') {
      return saved;
    }
    if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
  } catch {
    // Fallback to light mode if storage is unavailable
  }
  return 'light';
}

export function useTheme() {
  const [theme, setTheme] = useState<ThemeMode>(getInitialTheme);
  const isFirstRender = useRef(true);
  const transitionTimerRef = useRef<number | null>(null);

  useEffect(() => {
    const root = document.documentElement;

    if (isFirstRender.current) {
      isFirstRender.current = false;
    } else {
      if (transitionTimerRef.current !== null) {
        window.clearTimeout(transitionTimerRef.current);
      }
      root.classList.add('theme-transition');
      // Force style flush so initial state is committed before class toggle
      void root.offsetWidth;
      transitionTimerRef.current = window.setTimeout(() => {
        root.classList.remove('theme-transition');
        transitionTimerRef.current = null;
      }, THEME_TRANSITION_MS);
    }

    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }

    const metaTheme = document.querySelector('meta[name="theme-color"]');
    if (metaTheme) {
      metaTheme.setAttribute(
        'content',
        theme === 'dark' ? '#131B17' : '#F5EFE6'
      );
    }

    try {
      window.localStorage.setItem(STORAGE_KEY_THEME, theme);
    } catch {
      // Ignore storage errors
    }
  }, [theme]);

  useEffect(() => {
    return () => {
      if (transitionTimerRef.current !== null) {
        window.clearTimeout(transitionTimerRef.current);
      }
    };
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  return { theme, setTheme, toggleTheme };
}
