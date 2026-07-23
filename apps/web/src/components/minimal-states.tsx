import type { ReactNode } from 'react';
import { cx } from './ui';
import { GeniusMascot } from './GeniusMascot';

const MAGIC_KEYFRAMES = `
@keyframes geniusFloat { 0%,100% { transform: translateY(0) } 50% { transform: translateY(-10px) } }
@keyframes geniusGlow { 0%,100% { opacity: .35; transform: scale(1) } 50% { opacity: .6; transform: scale(1.08) } }
@keyframes geniusShadow { 0%,100% { opacity: .18; transform: scaleX(1) } 50% { opacity: .1; transform: scaleX(.8) } }
`;

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
  if (loading) {
    return (
      <div
        aria-busy="true"
        role="status"
        className="flex min-h-[60vh] w-full flex-col items-center justify-center gap-8 px-4 text-center"
      >
        <style>{MAGIC_KEYFRAMES}</style>
        <div className="relative flex h-40 w-40 items-center justify-center">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-0 rounded-full blur-2xl"
            style={{ backgroundColor: 'var(--minimal-action)', animation: 'geniusGlow 2.6s ease-in-out infinite' }}
          />
          <span
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-2 h-3 w-24 rounded-[50%]"
            style={{ background: 'var(--minimal-text)', animation: 'geniusShadow 3s ease-in-out infinite', filter: 'blur(6px)' }}
          />
          <div className="relative origin-center scale-[3]" style={{ animation: 'geniusFloat 3s ease-in-out infinite' }}>
            <GeniusMascot size="lg" surface="loading" alt="Gênio preparando os dados" />
          </div>
        </div>
        <div className="max-w-md">
          <h1 className="text-xl font-semibold tracking-[-0.02em] text-[color:var(--minimal-text)]">{title}</h1>
          <p className="mt-2 text-sm leading-6 text-[color:var(--minimal-text-secondary)]">{description}</p>
        </div>
      </div>
    );
  }

  return (
    <section
      className={cx(
        'w-full max-w-lg rounded-xl border bg-[color:var(--minimal-surface)] p-6 shadow-[var(--minimal-shadow)] sm:p-7',
        tone === 'critical'
          ? 'border-[color:var(--minimal-danger-border)]'
          : 'border-[color:var(--minimal-border)]',
      )}
      role={tone === 'critical' ? 'alert' : 'status'}
    >
      <div className="flex items-start gap-4">
        <GeniusMascot size="lg" surface="empty" alt="Gênio mostrando que não há dados" />
        <div className="min-w-0">
          <h1 className="text-xl font-semibold tracking-[-0.02em] text-[color:var(--minimal-text)]">{title}</h1>
          <p className="mt-2 max-w-[60ch] text-sm leading-6 text-[color:var(--minimal-text-secondary)]">{description}</p>
        </div>
      </div>
      {actions ? <div className="mt-6 flex flex-wrap gap-2">{actions}</div> : null}
    </section>
  );
}
