/**
 * Tema da aplicacao — Design System V3 (secao 7.3).
 *
 * A preferencia do usuario pode ser Claro, Escuro ou Sistema.
 * O tema efetivamente aplicado (`ResolvedTheme`) e sempre claro ou escuro:
 * quando a preferencia e "sistema", resolvemos pela media query do dispositivo.
 *
 * Regra de copy: a interface expoe apenas "Tema", "Claro", "Escuro" e "Sistema".
 * Os identificadores tecnicos abaixo nunca aparecem na UI.
 */
export type ThemePreference = 'light' | 'dark' | 'system';
export type ResolvedTheme = 'light' | 'dark';

export const THEME_STORAGE_KEY = 'genius.theme-preference';
export const THEME_PREFERENCES: readonly ThemePreference[] = ['light', 'dark', 'system'];

const THEME_LABELS: Record<ThemePreference, string> = {
  light: 'Claro',
  dark: 'Escuro',
  system: 'Sistema',
};

export function themePreferenceLabel(preference: ThemePreference): string {
  return THEME_LABELS[preference];
}

export function isThemePreference(value: unknown): value is ThemePreference {
  return value === 'light' || value === 'dark' || value === 'system';
}

export function readStoredThemePreference(): ThemePreference {
  if (typeof window === 'undefined') {
    return 'system';
  }

  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    return isThemePreference(stored) ? stored : 'system';
  } catch {
    return 'system';
  }
}

export function persistThemePreference(preference: ThemePreference): void {
  if (typeof window === 'undefined') {
    return;
  }

  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, preference);
  } catch {
    // Armazenamento indisponivel (modo privado, cota): a preferencia
    // continua valendo apenas para a sessao atual.
  }
}

export function prefersDarkScheme(): boolean {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return false;
  }

  return window.matchMedia('(prefers-color-scheme: dark)').matches;
}

export function resolveTheme(preference: ThemePreference): ResolvedTheme {
  if (preference === 'system') {
    return prefersDarkScheme() ? 'dark' : 'light';
  }

  return preference;
}

/**
 * Aplica o tema resolvido ao documento. Mantido em um unico lugar para que
 * o ThemeProvider e o script anti-flash de index.html apliquem exatamente
 * a mesma marcacao (`data-theme` + `color-scheme`).
 */
export function applyResolvedTheme(theme: ResolvedTheme): void {
  if (typeof document === 'undefined') {
    return;
  }

  const root = document.documentElement;
  root.setAttribute('data-theme', theme);
  root.style.colorScheme = theme;
}

/**
 * Superfícies públicas: Central de Ajuda, entrada e telas anônimas.
 *
 * Regra de produto: a Central Pública é sempre clara. O tema escuro existe
 * apenas em ambiente autenticado, onde o usuário escolhe a preferência. Esta
 * função é a fonte única dessa decisão e é usada tanto pelo React quanto pelo
 * script anti-flash de `index.html`, que replica a mesma lista de prefixos.
 */
export const PUBLIC_SURFACE_PREFIXES: readonly string[] = ['/help', '/login', '/access-denied'];

export function isPublicSurfacePath(pathname: string): boolean {
  if (pathname === '/') {
    return true;
  }

  return PUBLIC_SURFACE_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}
