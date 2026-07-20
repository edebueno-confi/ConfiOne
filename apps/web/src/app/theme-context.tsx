import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import {
  applyResolvedTheme,
  persistThemePreference,
  prefersDarkScheme,
  readStoredThemePreference,
  resolveTheme,
  type ResolvedTheme,
  type ThemePreference,
} from '../lib/theme';

type ThemeContextValue = {
  /** Preferencia escolhida pelo usuario: Claro, Escuro ou Sistema. */
  preference: ThemePreference;
  /** Tema efetivamente aplicado ao documento (claro ou escuro). */
  resolvedTheme: ResolvedTheme;
  setPreference: (preference: ThemePreference) => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [preference, setPreferenceState] = useState<ThemePreference>(() =>
    readStoredThemePreference(),
  );
  const [systemPrefersDark, setSystemPrefersDark] = useState<boolean>(() =>
    prefersDarkScheme(),
  );

  // Acompanha mudancas do tema do sistema operacional em tempo real,
  // relevante apenas quando a preferencia esta em "Sistema".
  useEffect(() => {
    if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
      return undefined;
    }

    const query = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = (event: MediaQueryListEvent) => {
      setSystemPrefersDark(event.matches);
    };

    query.addEventListener('change', handleChange);
    return () => query.removeEventListener('change', handleChange);
  }, []);

  const resolvedTheme = useMemo<ResolvedTheme>(() => {
    if (preference === 'system') {
      return systemPrefersDark ? 'dark' : 'light';
    }

    return preference;
  }, [preference, systemPrefersDark]);

  useEffect(() => {
    applyResolvedTheme(resolvedTheme);
  }, [resolvedTheme]);

  const setPreference = useCallback((next: ThemePreference) => {
    setPreferenceState(next);
    persistThemePreference(next);
    // Aplica imediatamente para evitar qualquer defasagem visual.
    applyResolvedTheme(resolveTheme(next));
  }, []);

  const value = useMemo<ThemeContextValue>(
    () => ({ preference, resolvedTheme, setPreference }),
    [preference, resolvedTheme, setPreference],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const context = useContext(ThemeContext);

  if (!context) {
    throw new Error('useTheme deve ser usado dentro de <ThemeProvider>.');
  }

  return context;
}
