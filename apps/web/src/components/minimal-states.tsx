import type { ReactNode } from 'react';
import { cx } from './ui';

export function MinimalState({
  actions,
  description,
  loading = false,
  title,
  tone = 'neutral',
}: {
  actions?: ReactNode;
  description: string;
  loading?: boolean;
  title: string;
  tone?: 'neutral' | 'critical';
}) {
  return (
    <section
      aria-busy={loading}
      className={cx(
        'w-full max-w-lg rounded-xl border bg-[color:var(--minimal-surface)] p-6 shadow-[var(--minimal-shadow)] sm:p-7',
        tone === 'critical'
          ? 'border-[color:var(--minimal-danger-border)]'
          : 'border-[color:var(--minimal-border)]',
      )}
      role={tone === 'critical' ? 'alert' : 'status'}
    >
      {loading ? (
        <div
          aria-hidden="true"
          className="mb-5 h-1 w-12 animate-pulse rounded-full bg-[color:var(--minimal-action)]"
        />
      ) : null}
      <h1 className="text-xl font-semibold tracking-[-0.02em] text-[color:var(--minimal-text)]">
        {title}
      </h1>
      <p className="mt-2 max-w-[60ch] text-sm leading-6 text-[color:var(--minimal-text-secondary)]">
        {description}
      </p>
      {actions ? <div className="mt-6 flex flex-wrap gap-2">{actions}</div> : null}
    </section>
  );
}
