import { type ReactNode } from 'react';
import { cx } from './ui';
import { useTheme } from '../app/theme-context';
import { THEME_PREFERENCES, themePreferenceLabel, type ThemePreference } from '../lib/theme';

function ThemeGlyph({ preference }: { preference: ThemePreference }) {
  const paths: Record<ThemePreference, ReactNode> = {
    light: (
      <>
        <circle cx="12" cy="12" r="3.4" />
        <path d="M12 4.5v1.6M12 17.9v1.6M4.5 12h1.6M17.9 12h1.6M6.7 6.7l1.1 1.1M15.9 15.9l1.1 1.1M17.3 6.7l-1.1 1.1M7.8 15.9l-1.1 1.1" />
      </>
    ),
    dark: <path d="M18 13.4A6.5 6.5 0 0 1 10.6 6a5 5 0 1 0 7.4 7.4Z" />,
    system: (
      <>
        <rect height="10.5" rx="1.6" width="15" x="4.5" y="5" />
        <path d="M9.5 19h5M12 15.5V19" />
      </>
    ),
  };

  return (
    <svg
      aria-hidden="true"
      className="h-3.5 w-3.5"
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="1.7"
      viewBox="0 0 24 24"
    >
      {paths[preference]}
    </svg>
  );
}

/**
 * Seletor de tema Claro / Escuro / Sistema.
 * Segue a regra de copy do Design System V3: rotulo "Tema" e opcoes humanas,
 * sem termos tecnicos como light/dark/system na interface.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const { preference, setPreference } = useTheme();

  return (
    <div
      aria-label="Tema"
      className={cx(
        'flex items-center gap-0.5 rounded-lg border border-[color:var(--minimal-border)] bg-[color:var(--minimal-surface-muted)] p-0.5',
        className,
      )}
      role="radiogroup"
    >
      {THEME_PREFERENCES.map((option) => {
        const active = preference === option;
        const label = themePreferenceLabel(option);

        return (
          <button
            aria-checked={active}
            aria-label={label}
            className={cx(
              'inline-flex h-6 w-7 items-center justify-center rounded-md transition-colors duration-150',
              'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--minimal-focus)]',
              active
                ? 'bg-[color:var(--minimal-surface)] text-[color:var(--minimal-selection-text)] shadow-[var(--minimal-shadow)]'
                : 'text-[color:var(--minimal-text-tertiary)] hover:text-[color:var(--minimal-text)]',
            )}
            key={option}
            onClick={() => setPreference(option)}
            role="radio"
            title={label}
            type="button"
          >
            <ThemeGlyph preference={option} />
          </button>
        );
      })}
    </div>
  );
}
