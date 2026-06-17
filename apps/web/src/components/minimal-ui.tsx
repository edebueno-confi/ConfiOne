import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
} from 'react';
import { cx } from './ui';

type MinimalButtonVariant = 'primary' | 'secondary' | 'quiet';

export function MinimalButton({
  children,
  className,
  disabled,
  loading = false,
  variant = 'primary',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  loading?: boolean;
  variant?: MinimalButtonVariant;
}) {
  const variantClass =
    variant === 'primary'
      ? 'border-[color:var(--minimal-action)] bg-[color:var(--minimal-action)] text-[color:var(--minimal-action-ink)] hover:bg-[color:var(--minimal-action-hover)]'
      : variant === 'secondary'
        ? 'border-[color:var(--minimal-border-strong)] bg-[color:var(--minimal-surface)] text-[color:var(--minimal-text)] hover:bg-[color:var(--minimal-surface-muted)]'
        : 'border-transparent bg-transparent text-[color:var(--minimal-text-secondary)] hover:bg-[color:var(--minimal-surface-muted)] hover:text-[color:var(--minimal-text)]';

  return (
    <button
      aria-busy={loading}
      className={cx(
        'inline-flex min-h-10 items-center justify-center gap-2 rounded-lg border px-4 text-sm font-semibold transition-colors duration-150',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--minimal-focus)] focus-visible:ring-offset-2',
        'disabled:cursor-not-allowed disabled:opacity-55',
        variantClass,
        className,
      )}
      type="button"
      {...props}
      disabled={loading || disabled}
    >
      {loading ? (
        <span
          aria-hidden="true"
          className="h-3.5 w-3.5 animate-pulse rounded-full bg-current opacity-55"
        />
      ) : null}
      {children}
    </button>
  );
}

export function MinimalPage({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <main
      className={cx(
        'flex min-h-screen items-center justify-center bg-[color:var(--minimal-canvas)] px-5 py-10 text-[color:var(--minimal-text)]',
        className,
      )}
    >
      {children}
    </main>
  );
}

export function MinimalSurface({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cx(
        'w-full rounded-xl border border-[color:var(--minimal-border)] bg-[color:var(--minimal-surface)] p-6 shadow-[var(--minimal-shadow)] sm:p-7',
        className,
      )}
    >
      {children}
    </section>
  );
}

export function MinimalField({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium text-[color:var(--minimal-text)]">
        {label}
      </span>
      {children}
    </label>
  );
}

export function MinimalTextInput({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cx(
        'h-11 w-full rounded-lg border border-[color:var(--minimal-border-strong)] bg-[color:var(--minimal-surface)] px-3.5 text-sm text-[color:var(--minimal-text)] outline-none transition-colors duration-150',
        'placeholder:text-[color:var(--minimal-text-tertiary)] hover:border-[color:var(--minimal-border-hover)]',
        'focus-visible:border-[color:var(--minimal-action)] focus-visible:ring-2 focus-visible:ring-[color:var(--minimal-focus)]',
        'disabled:cursor-not-allowed disabled:bg-[color:var(--minimal-surface-muted)] disabled:text-[color:var(--minimal-text-tertiary)]',
        className,
      )}
      {...props}
    />
  );
}

export function MinimalNotice({
  children,
  tone = 'neutral',
}: {
  children: ReactNode;
  tone?: 'neutral' | 'warning' | 'critical';
}) {
  const toneClass =
    tone === 'critical'
      ? 'border-[color:var(--minimal-danger-border)] bg-[color:var(--minimal-danger-surface)] text-[color:var(--minimal-danger-text)]'
      : tone === 'warning'
        ? 'border-[color:var(--minimal-warning-border)] bg-[color:var(--minimal-warning-surface)] text-[color:var(--minimal-warning-text)]'
        : 'border-[color:var(--minimal-border)] bg-[color:var(--minimal-surface-muted)] text-[color:var(--minimal-text-secondary)]';

  return (
    <div
      className={cx('rounded-lg border px-3.5 py-3 text-sm leading-5', toneClass)}
      role={tone === 'critical' ? 'alert' : 'status'}
    >
      {children}
    </div>
  );
}
