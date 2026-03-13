import { useEffect } from 'react';
import { useApp } from '../contexts/AppContext';

export function useTheme() {
  const { state } = useApp();
  const { theme } = state.settings;

  useEffect(() => {
    const root = document.documentElement;

    const applyTheme = (mode: 'light' | 'dark') => {
      root.setAttribute('data-theme', mode);
    };

    if (theme === 'system') {
      const mq = window.matchMedia('(prefers-color-scheme: dark)');
      applyTheme(mq.matches ? 'dark' : 'light');

      const handler = (e: MediaQueryListEvent) => {
        applyTheme(e.matches ? 'dark' : 'light');
      };
      mq.addEventListener('change', handler);
      return () => mq.removeEventListener('change', handler);
    } else {
      applyTheme(theme);
    }
  }, [theme]);
}
