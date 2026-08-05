import type { ButtonHTMLAttributes, InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from 'react';

export function cx(...values: Array<string | false | null | undefined>) {
  return values.filter(Boolean).join(' ');
}

export function AppButton({
  children,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cx(
        'gso-action-button inline-flex min-h-10 items-center justify-center rounded-[var(--radius)] border border-[color:var(--action)] bg-[color:var(--action)] px-4 py-2 text-sm font-medium text-[color:var(--action-ink)] transition-colors hover:bg-[color:var(--brand-700)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--focus)] disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      type="button"
      {...props}
    >
      {children}
    </button>
  );
}

export function GhostButton({
  children,
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={cx(
        'gso-ghost-button inline-flex min-h-10 items-center justify-center rounded-[var(--radius)] border border-[color:var(--border-strong)] bg-[color:var(--surface)] px-4 py-2 text-sm font-medium text-[color:var(--text)] transition-colors hover:bg-[color:var(--surface-2)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--focus)] disabled:cursor-not-allowed disabled:opacity-50',
        className,
      )}
      type="button"
      {...props}
    >
      {children}
    </button>
  );
}

export function Panel({
  title,
  description,
  actions,
  children,
  className,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cx(
        'gso-panel rounded-[var(--radius-lg)] border border-[color:var(--border)] bg-[color:var(--surface)] p-5 sm:p-6 shadow-[var(--shadow-sm)]',
        className,
      )}
    >
      <header className="mb-5 flex flex-wrap items-start justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold tracking-[-0.02em] text-[color:var(--text)]">
            {title}
          </h2>
          {description ? (
            <p className="max-w-2xl text-sm leading-6 text-[color:var(--text-2)]">
              {description}
            </p>
          ) : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </header>
      {children}
    </section>
  );
}

export function PageHeader({
  title,
  description,
  action,
  eyebrow,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  eyebrow?: string;
}) {
  return (
    <header className="gso-page-header flex flex-wrap items-start justify-between gap-4">
      <div className="space-y-2">
        {eyebrow ? <p className="text-[0.72rem] font-semibold uppercase tracking-[0.28em] text-[color:var(--text-3)]">{eyebrow}</p> : null}
        <div className="space-y-1">
          <h1 className="text-3xl font-semibold tracking-[-0.04em] text-[color:var(--text)]">
            {title}
          </h1>
          <p className="max-w-3xl text-sm leading-6 text-[color:var(--text-2)]">
            {description}
          </p>
        </div>
      </div>
      {action}
    </header>
  );
}

export function StatusPill({
  children,
  tone = 'default',
}: {
  children: ReactNode;
  tone?: 'default' | 'positive' | 'warning' | 'critical' | 'accent';
}) {
  const toneClass =
    tone === 'positive'
      ? 'border-[color:var(--color-success-border)] bg-[color:var(--color-success-surface)] text-[color:var(--color-success-ink)]'
      : tone === 'warning'
        ? 'border-[color:var(--color-warning-border)] bg-[color:var(--color-warning-surface)] text-[color:var(--color-warning-ink)]'
        : tone === 'critical'
          ? 'border-[color:var(--color-danger-border)] bg-[color:var(--color-danger-surface)] text-[color:var(--color-danger-ink)]'
          : tone === 'accent'
            ? 'border-[color:var(--minimal-border-strong)] bg-[color:var(--minimal-selection)] text-[color:var(--minimal-selection-text)]'
            : 'border-[color:var(--minimal-border)] bg-[color:var(--minimal-surface-muted)] text-[color:var(--minimal-text-secondary)]';

  return (
    <span
      className={cx(
        'inline-flex items-center rounded-md border px-2 py-0.5 text-[0.68rem] font-medium uppercase tracking-[0.08em]',
        toneClass,
      )}
    >
      {children}
    </span>
  );
}

export function MetricCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper?: string;
}) {
  return (
    <div className="border-b border-[color:var(--minimal-border)] py-3">
      <p className="text-xs text-[color:var(--minimal-text-tertiary)]">
        {label}
      </p>
      <p className="mt-1 text-lg font-semibold text-[color:var(--minimal-text)]">
        {value}
      </p>
      {helper ? (
        <p className="mt-1 text-xs leading-5 text-[color:var(--minimal-text-secondary)]">{helper}</p>
      ) : null}
    </div>
  );
}

export function SummaryStrip({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cx(
        'gso-summary-strip rounded-[24px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-strong)]/92 px-4 py-4 shadow-[var(--shadow-panel)]',
        className,
      )}
    >
      <div className="flex flex-wrap gap-3">{children}</div>
    </section>
  );
}

export function SummaryStripItem({
  label,
  value,
  helper,
  tone = 'default',
}: {
  label: string;
  value: ReactNode;
  helper?: string;
  tone?: 'default' | 'positive' | 'warning' | 'critical' | 'accent';
}) {
  return (
    <div
      className={cx(
        'min-w-[140px] flex-1 rounded-[18px] border px-4 py-3',
        tone === 'positive' && 'border-[color:var(--color-success-border)] bg-[color:var(--color-success-surface)]/80',
        tone === 'warning' && 'border-[color:var(--color-warning-border)] bg-[color:var(--color-warning-surface)]/80',
        tone === 'critical' && 'border-[color:var(--color-danger-border)] bg-[color:var(--color-danger-surface)]/80',
        tone === 'accent' && 'border-[color:var(--color-info-border)] bg-[color:var(--color-info-surface)]/80',
        tone === 'default' && 'border-[color:var(--color-border)] bg-[color:var(--color-surface)]',
      )}
    >
      <p className="text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-[color:var(--color-muted)]">
        {label}
      </p>
      <div className="mt-2 flex items-end justify-between gap-3">
        <p className="text-xl font-semibold tracking-[-0.04em] text-[color:var(--color-ink)]">
          {value}
        </p>
        {helper ? (
          <p className="text-right text-xs leading-5 text-[color:var(--color-muted)]">
            {helper}
          </p>
        ) : null}
      </div>
    </div>
  );
}

export function WorkspaceSplit({
  sidebar,
  main,
  className,
  layoutClassName = 'xl:grid-cols-[280px_minmax(0,1fr)]',
}: {
  sidebar: ReactNode;
  main: ReactNode;
  className?: string;
  layoutClassName?: string;
}) {
  return (
    <div className={cx('grid gap-5 items-start', layoutClassName, className)}>
      <div className="min-w-0">{sidebar}</div>
      <div className="min-w-0">{main}</div>
    </div>
  );
}

export function ContextSubsidebar({
  title,
  description,
  actions,
  children,
  className,
  sticky = true,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  children: ReactNode;
  className?: string;
  sticky?: boolean;
}) {
  return (
    <aside
      className={cx(
        sticky && 'xl:sticky xl:top-4',
        className,
      )}
    >
      <section className="rounded-[24px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-strong)]/94 px-4 py-4 shadow-[0_14px_28px_rgba(19,33,79,0.08)]">
        <header className="space-y-3">
          <div className="space-y-1">
            <h2 className="text-base font-semibold tracking-[-0.03em] text-[color:var(--color-ink)]">
              {title}
            </h2>
            {description ? (
              <p className="text-sm leading-6 text-[color:var(--color-muted)]">
                {description}
              </p>
            ) : null}
          </div>
          {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
        </header>
        <div className="mt-4 space-y-3">{children}</div>
      </section>
    </aside>
  );
}

export function ContextSubsidebarSection({
  title,
  description,
  children,
  className,
  collapsible = false,
  defaultOpen = false,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  collapsible?: boolean;
  defaultOpen?: boolean;
}) {
  if (collapsible) {
    return (
      <details
        className={cx(
          'rounded-[18px] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-4 py-3',
          className,
        )}
        open={defaultOpen}
      >
        <summary className="cursor-pointer text-sm font-semibold text-[color:var(--color-ink)]">
          {title}
        </summary>
        {description ? (
          <p className="mt-2 text-sm leading-6 text-[color:var(--color-muted)]">
            {description}
          </p>
        ) : null}
        <div className="mt-3 space-y-3">{children}</div>
      </details>
    );
  }

  return (
    <section
      className={cx(
        'rounded-[18px] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-4 py-4',
        className,
      )}
    >
      <div className="space-y-1">
        <h3 className="text-sm font-semibold text-[color:var(--color-ink)]">{title}</h3>
        {description ? (
          <p className="text-sm leading-6 text-[color:var(--color-muted)]">
            {description}
          </p>
        ) : null}
      </div>
      <div className="mt-3 space-y-3">{children}</div>
    </section>
  );
}

export function GovernedActionDrawer({
  title,
  description,
  onClose,
  children,
  footer,
  className,
}: {
  title: string;
  description: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end overflow-hidden bg-[rgba(7,15,35,0.42)] backdrop-blur-[3px]">
      <section
        aria-modal="true"
        className={cx(
          'flex h-dvh w-[clamp(720px,50vw,860px)] max-w-[calc(100vw-32px)] flex-col overflow-hidden rounded-l-[30px] border-l border-[color:var(--color-border)] bg-[color:var(--color-surface-strong)] shadow-[0_32px_90px_rgba(10,22,50,0.28)]',
          className,
        )}
        role="dialog"
      >
        <header className="flex shrink-0 items-start justify-between gap-5 border-b border-[color:var(--color-border)] px-8 py-6">
          <div className="min-w-0 space-y-1">
            <h2 className="text-[1.45rem] font-semibold tracking-[-0.045em] text-[color:var(--color-ink)]">
              {title}
            </h2>
            <p className="text-sm leading-6 text-[color:var(--color-muted)]">{description}</p>
          </div>
          <button
            aria-label="Fechar painel"
            className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface-strong)] text-xl leading-none text-[color:var(--color-ink)] transition hover:border-[color:var(--color-brand-blue)]/40 hover:bg-[color:var(--color-surface)]"
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-8 py-6">{children}</div>
        {footer ? (
          <footer className="flex shrink-0 justify-end gap-3 border-t border-[color:var(--color-border)] bg-[color:var(--color-surface-strong)] px-8 py-5">
            {footer}
          </footer>
        ) : null}
      </section>
    </div>
  );
}

export function Field({
  label,
  description,
  children,
}: {
  label: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <label className="grid gap-2">
      <span className="text-sm font-medium text-[color:var(--color-ink)]">{label}</span>
      {children}
      {description ? (
        <span className="text-xs leading-5 text-[color:var(--color-muted)]">{description}</span>
      ) : null}
    </label>
  );
}

export function TextInput({
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cx(
        'h-10 rounded-lg border border-[color:var(--minimal-border-strong)] bg-[color:var(--minimal-surface)] px-3.5 text-sm text-[color:var(--minimal-text)] outline-none transition-colors placeholder:text-[color:var(--minimal-text-tertiary)] focus:border-[color:var(--minimal-action)] focus:ring-2 focus:ring-[color:var(--minimal-focus)]',
        className,
      )}
      {...props}
    />
  );
}

export function SelectInput({
  className,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cx(
        'h-10 min-w-0 w-full rounded-lg border border-[color:var(--minimal-border-strong)] bg-[color:var(--minimal-surface)] px-3.5 text-sm text-[color:var(--minimal-text)] outline-none transition-colors focus:border-[color:var(--minimal-action)] focus:ring-2 focus:ring-[color:var(--minimal-focus)]',
        className,
      )}
      {...props}
    />
  );
}

export function TextareaInput({
  className,
  ...props
}: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      className={cx(
        'min-h-28 rounded-lg border border-[color:var(--minimal-border-strong)] bg-[color:var(--minimal-surface)] px-3.5 py-3 text-sm text-[color:var(--minimal-text)] outline-none transition-colors placeholder:text-[color:var(--minimal-text-tertiary)] focus:border-[color:var(--minimal-action)] focus:ring-2 focus:ring-[color:var(--minimal-focus)]',
        className,
      )}
      {...props}
    />
  );
}

export function InlineNotice({
  children,
  tone = 'default',
}: {
  children: ReactNode;
  tone?: 'default' | 'positive' | 'warning' | 'critical';
}) {
  const toneClass =
    tone === 'positive'
      ? 'border-[color:var(--color-success-border)] bg-[color:var(--color-success-surface)] text-[color:var(--color-success-ink)]'
      : tone === 'warning'
      ? 'border-[color:var(--color-warning-border)] bg-[color:var(--color-warning-surface)] text-[color:var(--color-warning-ink)]'
      : tone === 'critical'
        ? 'border-[color:var(--color-danger-border)] bg-[color:var(--color-danger-surface)] text-[color:var(--color-danger-ink)]'
      : 'border-[color:var(--color-border)] bg-[color:var(--color-surface)] text-[color:var(--color-muted)]';

  const toneIcon =
    tone === 'positive' ? '✓' : tone === 'warning' ? '!' : tone === 'critical' ? '!' : 'i';

  return (
    <div
      aria-atomic="true"
      aria-live={tone === 'critical' ? 'assertive' : 'polite'}
      className={cx('flex items-start gap-2 rounded-xl border px-4 py-3 text-sm leading-6', toneClass)}
      role={tone === 'critical' ? 'alert' : 'status'}
    >
      <span aria-hidden="true" className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-full border border-current text-xs font-bold">
        {toneIcon}
      </span>
      {children}
    </div>
  );
}
