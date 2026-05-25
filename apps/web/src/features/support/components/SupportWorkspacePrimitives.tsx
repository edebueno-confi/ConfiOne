import {
  useEffect,
  useRef,
  type ReactNode,
  type Ref,
} from 'react';
import { cx } from '../../../components/ui';

export type SupportBadgeTone =
  | 'default'
  | 'positive'
  | 'warning'
  | 'critical'
  | 'accent'
  | 'blue'
  | 'violet';

export type SupportBadgeVariant = 'pill' | 'queue';

export function SupportPrimaryActionButton({
  children,
  className,
  disabled = false,
  onClick,
  type = 'button',
}: {
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
  type?: 'button' | 'submit';
}) {
  return (
    <button
      className={cx(
        'support-primary-action-button inline-flex min-h-10 items-center justify-center gap-2 rounded-[12px] px-4 text-[12px] font-semibold text-white transition disabled:cursor-not-allowed disabled:opacity-55',
        className,
      )}
      disabled={disabled}
      onClick={onClick}
      type={type}
    >
      {children}
    </button>
  );
}

export function SupportSecondaryActionButton({
  children,
  className,
  disabled = false,
  onClick,
  title,
  type = 'button',
}: {
  children: ReactNode;
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
  title?: string;
  type?: 'button' | 'submit';
}) {
  return (
    <button
      className={cx(
        'support-secondary-action-button inline-flex min-h-9 items-center justify-center gap-2 rounded-[12px] border px-3 text-[11.5px] font-semibold transition disabled:cursor-not-allowed disabled:opacity-55',
        className,
      )}
      disabled={disabled}
      onClick={onClick}
      title={title}
      type={type}
    >
      {children}
    </button>
  );
}

export function SupportIconActionButton({
  children,
  ariaLabel,
  className,
  disabled = false,
  onClick,
  title,
}: {
  children: ReactNode;
  ariaLabel: string;
  className?: string;
  disabled?: boolean;
  onClick?: () => void;
  title?: string;
}) {
  return (
    <button
      aria-label={ariaLabel}
      className={cx(
        'support-icon-action-button inline-flex h-9 w-9 items-center justify-center rounded-[12px] border text-[12px] transition disabled:cursor-not-allowed disabled:opacity-55',
        className,
      )}
      disabled={disabled}
      onClick={onClick}
      title={title}
      type="button"
    >
      {children}
    </button>
  );
}

export function SupportSearchInput({
  icon,
  onChange,
  placeholder,
  value,
  className,
}: {
  icon?: ReactNode;
  onChange: (value: string) => void;
  placeholder: string;
  value: string;
  className?: string;
}) {
  return (
    <div className={cx('relative min-w-0 flex-1', className)}>
      {icon ? (
        <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--color-muted)]">
          {icon}
        </span>
      ) : null}
      <input
        className={cx('support-operational-input h-10 w-full', icon ? 'pl-9' : 'pl-3')}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        value={value}
      />
    </div>
  );
}

export function SupportComposerTextarea({
  internal = false,
  onChange,
  placeholder,
  value,
}: {
  internal?: boolean;
  onChange: (value: string) => void;
  placeholder: string;
  value: string;
}) {
  return (
    <textarea
      className={cx(
        'support-composer-textarea',
        internal && 'support-composer-textarea--internal',
      )}
      onChange={(event) => onChange(event.target.value)}
      placeholder={placeholder}
      value={value}
    />
  );
}

export function OperationalModal({
  children,
  description,
  footer,
  labelledById,
  onClose,
  open,
  title,
}: {
  children: ReactNode;
  description?: ReactNode;
  footer?: ReactNode;
  labelledById: string;
  onClose: () => void;
  open: boolean;
  title: string;
}) {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const frame = window.requestAnimationFrame(() => {
      const firstFocusable = modalRef.current?.querySelector<HTMLElement>(
        '.support-operational-modal__body select:not(:disabled), .support-operational-modal__body input:not(:disabled), .support-operational-modal__body textarea:not(:disabled), .support-operational-modal__body button:not(:disabled), .support-operational-modal__body [href], .support-operational-modal__body [tabindex]:not([tabindex="-1"])',
      );
      firstFocusable?.focus();
    });

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.cancelAnimationFrame(frame);
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose, open]);

  if (!open) {
    return null;
  }

  return (
    <div className="support-operational-modal">
      <button
        aria-label="Fechar modal de intake"
        className="support-operational-modal__scrim"
        onClick={onClose}
        type="button"
      />
      <section
        aria-labelledby={labelledById}
        aria-modal="true"
        className="support-operational-modal__panel"
        ref={modalRef}
        role="dialog"
      >
        <header className="support-operational-modal__header">
          <div className="min-w-0">
            <p className="support-operational-modal__eyebrow">Intake operacional</p>
            <h2 className="support-operational-modal__title" id={labelledById}>
              {title}
            </h2>
            {description ? (
              <div className="support-operational-modal__description">{description}</div>
            ) : null}
          </div>
          <button
            className="support-operational-modal__close"
            onClick={onClose}
            type="button"
          >
            Fechar
          </button>
        </header>
        <div className="support-operational-modal__body">{children}</div>
        {footer ? <footer className="support-operational-modal__footer">{footer}</footer> : null}
      </section>
    </div>
  );
}

export function OperationalFormGrid({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return <div className={cx('support-operational-form-grid', className)}>{children}</div>;
}

export function OperationalField({
  children,
  description,
  label,
  span = 'normal',
}: {
  children: ReactNode;
  description?: ReactNode;
  label: string;
  span?: 'normal' | 'wide';
}) {
  return (
    <label
      className={cx(
        'support-operational-field',
        span === 'wide' && 'support-operational-field--wide',
      )}
    >
      <span className="support-operational-field__label">{label}</span>
      {description ? (
        <span className="support-operational-field__description">{description}</span>
      ) : null}
      {children}
    </label>
  );
}

export function OperationalFooterActions({
  children,
  note,
}: {
  children: ReactNode;
  note?: ReactNode;
}) {
  return (
    <div className="support-operational-footer-actions">
      {note ? <p className="support-operational-footer-actions__note">{note}</p> : null}
      <div className="support-operational-footer-actions__buttons">{children}</div>
    </div>
  );
}

export function SupportBadge({
  children,
  tone = 'default',
  variant = 'pill',
  className,
}: {
  children: ReactNode;
  tone?: SupportBadgeTone;
  variant?: SupportBadgeVariant;
  className?: string;
}) {
  const toneClass =
    tone === 'positive'
      ? 'border-[color:var(--color-success-border)] bg-[color:var(--color-success-surface)] text-[color:var(--color-success-text)]'
      : tone === 'warning'
        ? 'border-[color:var(--color-warning-border)] bg-[color:var(--color-warning-surface)] text-[color:var(--color-warning-text)]'
        : tone === 'critical'
          ? 'border-[color:var(--color-danger-border)] bg-[color:var(--color-danger-surface)] text-[color:var(--color-danger-text)]'
          : tone === 'accent'
            ? 'border-[rgba(47,107,255,0.22)] bg-[rgba(47,107,255,0.08)] text-[color:var(--color-brand-blue)]'
            : tone === 'blue'
              ? 'border-[rgba(47,107,255,0.22)] bg-[rgba(47,107,255,0.12)] text-[color:var(--color-brand-blue)]'
              : tone === 'violet'
                ? 'border-[rgba(124,58,237,0.22)] bg-[rgba(124,58,237,0.12)] text-[rgb(109,40,217)]'
                : 'border-[rgba(220,228,242,0.98)] bg-[rgba(244,247,252,0.86)] text-[color:var(--color-muted)]';

  return (
    <span
      className={cx(
        variant === 'queue'
          ? 'inline-flex h-[20px] max-w-full items-center justify-center rounded-full border px-2.5 text-center text-[9.5px] font-semibold uppercase leading-none tracking-[0.08em]'
          : 'inline-flex min-h-[22px] items-center rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase leading-none tracking-[0.08em]',
        toneClass,
        className,
      )}
    >
      {children}
    </span>
  );
}

export function SupportWorkspaceGrid({
  queuePanel,
  mainPane,
  rightRail,
  drawerPane,
  collapseRightRail = false,
  showDrawer = false,
  rightPaneWidth = 'rail',
}: {
  queuePanel: ReactNode;
  mainPane: ReactNode;
  rightRail?: ReactNode;
  drawerPane?: ReactNode;
  collapseRightRail?: boolean;
  showDrawer?: boolean;
  rightPaneWidth?: 'rail' | 'drawer-default' | 'drawer-wide';
}) {
  return (
    <div
      className={cx(
        'support-workspace-grid',
        collapseRightRail
          ? 'support-workspace-grid--collapsed'
          : rightPaneWidth === 'drawer-wide'
              ? 'support-workspace-grid--drawer-wide'
              : rightPaneWidth === 'drawer-default'
                ? 'support-workspace-grid--drawer-default'
                : 'support-workspace-grid--rail',
      )}
    >
      {queuePanel}
      {mainPane}
      {!collapseRightRail ? (showDrawer ? drawerPane : rightRail) : null}
    </div>
  );
}

export function SupportQueuePanel({
  header,
  content,
  footer,
  className,
}: {
  header: ReactNode;
  content: ReactNode;
  footer?: ReactNode;
  className?: string;
}) {
  return (
    <aside
      className={cx(
        'support-panel-shell support-queue-panel min-w-0 min-h-0',
        className,
      )}
    >
      <div className="flex h-full min-h-0 flex-col">
        <div className="support-queue-panel__header shrink-0">
          {header}
        </div>
        <div className="support-queue-panel__body min-h-0 flex-1 overflow-y-auto">{content}</div>
        {footer ? (
          <div className="support-queue-panel__footer shrink-0">
            {footer}
          </div>
        ) : null}
      </div>
    </aside>
  );
}

export function QueueTicketItem({
  variant,
  isSelected,
  onSelect,
  statusBadge,
  code,
  title,
  tenantLabel,
  tenantSubLabel,
  categoryLabel,
  channelLabel,
  slaLabel,
  slaTone = 'default',
  assigneeInitials,
  assigneeLabel,
  timestampLabel,
}: {
  variant: 'workspace' | 'inbox';
  isSelected: boolean;
  onSelect: () => void;
  statusBadge: ReactNode;
  code: string;
  title: string;
  tenantLabel: string;
  tenantSubLabel?: string;
  categoryLabel: string;
  channelLabel?: string;
  slaLabel: string;
  slaTone?: 'default' | 'positive' | 'warning' | 'critical';
  assigneeInitials?: string;
  assigneeLabel?: string;
  timestampLabel: string;
}) {
  const slaToneClass =
    slaTone === 'critical'
      ? 'text-[color:var(--color-danger-text)]'
      : slaTone === 'warning'
        ? 'text-[color:var(--color-warning-text)]'
        : slaTone === 'positive'
          ? 'text-[color:var(--color-success-text)]'
          : 'text-[color:var(--color-muted)]';

  const slaDotClass =
    slaTone === 'critical'
      ? 'bg-[color:var(--color-danger-text)]'
      : slaTone === 'warning'
        ? 'bg-[color:var(--color-warning-text)]'
        : slaTone === 'positive'
          ? 'bg-[color:var(--color-success-text)]'
          : 'bg-[rgba(148,163,184,0.68)]';

  if (variant === 'inbox') {
    return (
      <button
        className={cx(
          'relative w-full rounded-[12px] border bg-white px-3 py-3 text-left transition',
          isSelected
            ? 'border-[rgba(47,107,255,0.48)] shadow-[0_8px_20px_rgba(22,36,67,0.06)]'
            : 'border-[color:var(--color-support-border)] hover:border-[rgba(47,107,255,0.28)] hover:bg-[color:var(--color-support-surface)]',
        )}
        onClick={onSelect}
        type="button"
      >
        <span
          className={cx(
            'absolute inset-y-2 left-0 w-[2px] rounded-full transition',
            isSelected ? 'bg-[color:var(--color-brand-blue)]' : 'bg-transparent',
          )}
        />
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="truncate text-[10px] font-bold uppercase tracking-[0.08em] text-[color:var(--color-brand-blue)]">
              {code}
            </p>
            <h3 className="mt-1 line-clamp-2 text-[13.5px] font-bold leading-[1.15rem] text-[color:var(--color-ink)]">
              {title}
            </h3>
          </div>
          <span className="shrink-0 text-[10px] font-medium text-[color:var(--color-muted)]">
            {timestampLabel}
          </span>
        </div>
        <p className="mt-1.5 truncate text-[11.5px] font-medium text-[color:var(--color-muted)]">
          {tenantLabel}
        </p>
        <p className="mt-1 truncate text-[10px] leading-4 text-[color:var(--color-muted)]">
          {categoryLabel} · {channelLabel ?? 'Canal indisponível'}
        </p>
        <div className="mt-2 flex items-center justify-between gap-2">
          <div className="flex min-w-0 items-center gap-1.5">
            {statusBadge}
            <span className="inline-flex h-[6px] w-[6px] shrink-0 rounded-full bg-[color:var(--color-brand-blue)]" />
            <span className={cx('truncate text-[10px] font-semibold', slaToneClass)}>{slaLabel}</span>
          </div>
          {tenantSubLabel ? (
            <span className="truncate text-[9.5px] font-medium text-[color:var(--color-muted)]">
              {tenantSubLabel}
            </span>
          ) : null}
        </div>
      </button>
    );
  }

  return (
    <button
      className={cx(
        'grid min-h-[56px] w-full grid-cols-[22px_92px_minmax(0,1.9fr)_minmax(0,1.02fr)_minmax(0,0.86fr)_66px_minmax(0,0.86fr)_68px] items-center gap-3 border-b border-[color:var(--color-border)] px-3.5 py-2 text-left transition last:border-b-0',
        isSelected
          ? 'relative z-[1] rounded-[12px] border border-[rgba(47,107,255,0.36)] bg-[rgba(47,107,255,0.04)] shadow-[0_8px_20px_rgba(22,36,67,0.05)]'
          : 'hover:bg-[color:var(--color-support-surface)]',
      )}
      onClick={onSelect}
      type="button"
    >
      <span
        className={cx(
          'flex h-4 w-4 items-center justify-center rounded-[4px] border text-[8px] font-bold',
          isSelected
            ? 'border-[color:var(--color-brand-blue)] bg-[color:var(--color-brand-blue)] text-white'
            : 'border-[rgba(148,163,184,0.42)] bg-white text-transparent',
        )}
      >
        ✓
      </span>
      <div className="min-w-0 space-y-1">
        {statusBadge}
        <div className="flex items-center gap-1 text-[9.5px] font-medium text-[color:var(--color-muted)]">
          <span className={cx('h-[6px] w-[6px] rounded-full', slaDotClass)} />
          <span className="truncate">{slaLabel}</span>
        </div>
      </div>
      <div className="min-w-0 space-y-1">
        <p className="text-[9px] font-bold uppercase tracking-[0.12em] text-[color:var(--color-brand-blue)]">
          {code}
        </p>
        <h3 className="line-clamp-2 text-[12.5px] font-bold leading-[1.02rem] text-[color:var(--color-ink)]">
          {title}
        </h3>
      </div>
      <div className="min-w-0 space-y-1">
        <p className="truncate text-[11px] font-semibold leading-4 text-[color:var(--color-ink)]">
          {tenantLabel}
        </p>
        <p className="truncate text-[10px] leading-4 text-[color:var(--color-muted)]">
          {tenantSubLabel ?? 'Indisponível'}
        </p>
      </div>
      <div className="min-w-0 space-y-0.5">
        <p className="truncate text-[10px] leading-4 text-[color:var(--color-muted)]">
          {categoryLabel}
        </p>
        <p className="truncate text-[9.5px] font-semibold leading-4 text-[color:var(--color-brand-blue)]">
          {channelLabel ?? 'Canal indisponível'}
        </p>
      </div>
      <p className={cx('truncate text-[10px] font-semibold', slaToneClass)}>{slaLabel}</p>
      <div className="flex min-w-0 items-center gap-2">
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-[rgba(220,228,242,0.92)] bg-[rgba(244,247,252,0.95)] text-[9px] font-semibold text-[color:var(--color-brand-navy)]">
          {assigneeInitials ?? '—'}
        </span>
        <span className="truncate text-[10px] font-semibold text-[color:var(--color-ink)]">
          {assigneeLabel ?? 'Não atribuído'}
        </span>
      </div>
      <p className="text-right text-[9.5px] font-medium leading-4 text-[color:var(--color-muted)]">
        {timestampLabel}
      </p>
    </button>
  );
}

export function SupportTicketHeader({
  topRow,
  badgeRow,
  utilityRow,
}: {
  topRow: ReactNode;
  badgeRow?: ReactNode;
  utilityRow?: ReactNode;
}) {
  return (
    <section className="support-panel-shell support-ticket-header shrink-0">
      <div className="support-ticket-header__content">
        <div className="space-y-2.5">
          {topRow}
          {badgeRow ? <div>{badgeRow}</div> : null}
          {utilityRow ? <div>{utilityRow}</div> : null}
        </div>
      </div>
    </section>
  );
}

export function SupportConversationPane({ children }: { children: ReactNode }) {
  return (
    <section className="support-panel-shell support-conversation-pane flex min-h-0 flex-1 flex-col">
      {children}
    </section>
  );
}

export function SupportToolsPanel({
  title,
  headerAction,
  children,
}: {
  title: ReactNode;
  headerAction?: ReactNode;
  children: ReactNode;
}) {
  return (
    <aside className="min-w-0 min-h-0 rounded-[16px] border border-[color:var(--color-support-border)] bg-white px-4 py-4 shadow-[var(--shadow-support-panel)] xl:w-[var(--support-workspace-tools-width)] xl:shrink-0">
      <div className="flex items-center justify-between gap-2">
        <h4 className="text-[15px] font-bold tracking-[-0.03em] text-[color:var(--color-ink)]">{title}</h4>
        {headerAction}
      </div>
      <div className="mt-4 space-y-4">{children}</div>
    </aside>
  );
}

export function SupportToolsSection({
  title,
  children,
}: {
  title: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="space-y-2.5">
      <p className="text-[12px] font-semibold tracking-[-0.02em] text-[color:var(--color-ink)]">{title}</p>
      {children}
    </section>
  );
}

export function SupportToolsButtonGrid({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-2 gap-2">{children}</div>;
}

export function SupportToolButton({
  icon,
  label,
  hint,
  onClick,
  disabled = false,
  className,
}: {
  icon: ReactNode;
  label: ReactNode;
  hint?: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}) {
  return (
    <button
      className={cx(
        'support-tool-button flex w-full flex-col items-center justify-center gap-1.5 text-center text-[11px] font-medium leading-[1.15rem] text-[color:var(--color-ink)] transition',
        disabled
          ? 'cursor-not-allowed opacity-55'
          : 'hover:border-[rgba(47,107,255,0.28)] hover:bg-[rgba(47,107,255,0.04)]',
        className,
      )}
      disabled={disabled}
      onClick={onClick}
      title={disabled ? 'Indisponível nesta versão' : undefined}
      type="button"
    >
      <span className="text-[color:var(--color-brand-navy)]">{icon}</span>
      <span className="block w-full text-balance">{label}</span>
      {hint ? <span className="text-[9.5px] font-medium text-[color:var(--color-muted)]">{hint}</span> : null}
    </button>
  );
}

export function SupportShortcutButton({
  icon,
  label,
  hint,
  hotkey,
  onClick,
  disabled = false,
}: {
  icon: ReactNode;
  label: ReactNode;
  hint?: ReactNode;
  hotkey?: ReactNode;
  onClick?: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      className={cx(
        'support-shortcut-button flex w-full items-center justify-between gap-2 text-left transition',
        disabled
          ? 'cursor-not-allowed opacity-55'
          : 'hover:border-[rgba(47,107,255,0.28)] hover:bg-[rgba(47,107,255,0.04)]',
      )}
      disabled={disabled}
      onClick={onClick}
      title={disabled ? 'Indisponível nesta versão' : undefined}
      type="button"
    >
      <span className="min-w-0 flex items-center gap-2">
        <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[color:var(--color-support-surface)] text-[color:var(--color-brand-navy)]">
          {icon}
        </span>
        <span className="min-w-0">
          <span className="block truncate text-[11.5px] font-medium text-[color:var(--color-ink)]">{label}</span>
          {hint ? <span className="block truncate text-[9.5px] text-[color:var(--color-muted)]">{hint}</span> : null}
        </span>
      </span>
      {hotkey ? (
        <span className="inline-flex h-5 min-w-[20px] items-center justify-center rounded-[999px] border border-[color:var(--color-support-border)] bg-[color:var(--color-support-surface)] px-1.5 text-[9px] font-semibold uppercase tracking-[0.08em] text-[color:var(--color-muted)]">
          {hotkey}
        </span>
      ) : null}
    </button>
  );
}

export function SupportConversationThread({
  children,
  className,
  scrollRef,
}: {
  children: ReactNode;
  className?: string;
  scrollRef?: Ref<HTMLDivElement>;
}) {
  return (
    <div
      className={cx('min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5', className)}
      data-ticket-thread-scroll
      ref={scrollRef}
    >
      {children}
    </div>
  );
}

export function SupportConversationMessage({
  author,
  avatar,
  children,
  meta,
  attachment,
  lane,
}: {
  author: ReactNode;
  avatar: ReactNode;
  children: ReactNode;
  meta: ReactNode;
  attachment?: ReactNode;
  lane: 'customer' | 'agent';
}) {
  return (
    <div className={cx('flex items-end gap-3', lane === 'agent' ? 'justify-end' : 'justify-start')}>
      {lane === 'customer' ? avatar : null}
      <div className={cx('min-w-0 max-w-[78%] space-y-1', lane === 'agent' && 'items-end')}>
        <div
          className={cx(
            'flex flex-wrap items-center gap-1.5 px-0.5 text-[10px]',
            lane === 'agent' ? 'justify-end' : 'justify-start',
          )}
        >
          <p className="font-semibold text-[color:var(--color-ink)]">{author}</p>
          {meta}
        </div>
        <article
          className={cx(
            'min-w-0 rounded-[14px] border px-4 py-3 shadow-[0_4px_10px_rgba(19,33,79,0.03)]',
            lane === 'agent'
              ? 'border-[rgba(47,107,255,0.2)] bg-[rgba(244,248,255,0.92)]'
              : 'border-[rgba(220,228,242,0.92)] bg-white',
          )}
        >
          <div className="space-y-1.5">
            <p className="whitespace-pre-wrap text-[13px] leading-5 text-[color:var(--color-ink)]">
              {children}
            </p>
            {attachment}
          </div>
        </article>
      </div>
      {lane === 'agent' ? avatar : null}
    </div>
  );
}

export function SupportInternalNote({
  children,
  timestamp,
}: {
  children: ReactNode;
  timestamp: ReactNode;
}) {
  return (
    <article className="mx-auto max-w-[86%] rounded-[14px] border border-[rgba(245,184,61,0.34)] bg-[color:var(--color-support-note)] px-4 py-3 shadow-[0_4px_10px_rgba(180,120,34,0.03)]">
      <div className="flex flex-wrap items-center gap-1.5 text-[10px]">
        <span className="inline-flex min-h-[18px] items-center rounded-full border border-[rgba(245,184,61,0.32)] bg-white/70 px-2 text-[8.5px] font-semibold uppercase tracking-[0.1em] text-[rgb(146,64,14)]">
          NOTA INTERNA
        </span>
        <span className="font-medium text-[rgb(146,64,14)]">Visível apenas para equipe interna</span>
        <span className="ml-auto text-[color:var(--color-muted)]">{timestamp}</span>
      </div>
      <p className="mt-2 whitespace-pre-wrap text-[13px] font-medium leading-5 text-[color:var(--color-ink)]">
        {children}
      </p>
    </article>
  );
}

export function SupportSystemEvent({
  icon,
  label,
  summary,
  timestamp,
}: {
  icon: ReactNode;
  label: ReactNode;
  summary: ReactNode;
  timestamp: ReactNode;
}) {
  return (
    <div className="flex items-center gap-2 py-1.5">
      <div className="h-px flex-1 bg-[rgba(220,228,242,0.92)]" />
      <div className="inline-flex max-w-[78%] items-center gap-2 rounded-full border border-[color:var(--color-support-border)] bg-[color:var(--color-support-surface)] px-3 py-1.5 text-[10px] text-[color:var(--color-muted)]">
        <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-white text-[color:var(--color-brand-blue)]">
          {icon}
        </span>
        <span className="truncate font-semibold text-[color:var(--color-ink)]">{label}</span>
        <span className="truncate text-[rgba(107,120,146,0.92)]">{summary}</span>
        <span className="shrink-0">{timestamp}</span>
      </div>
      <div className="h-px flex-1 bg-[rgba(220,228,242,0.92)]" />
    </div>
  );
}

export function SupportComposer({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cx(
        'support-docked-composer shrink-0 sm:px-5',
        className,
      )}
      data-ticket-composer
    >
      {children}
    </div>
  );
}

export function SupportRightRail({ children }: { children: ReactNode }) {
  return (
    <aside
      className="support-rail-column flex h-full min-w-0 min-h-0 flex-col overflow-y-auto xl:shrink-0"
      data-ticket-rail
    >
      {children}
    </aside>
  );
}

export function SupportContextRailSlot({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <aside
      className={cx(
        'support-context-rail-slot flex h-full min-w-0 min-h-0 flex-col overflow-hidden xl:shrink-0',
        className,
      )}
      data-ticket-context-rail
    >
      {children}
    </aside>
  );
}

export function SupportRailCard({
  title,
  headerAction,
  children,
  className,
}: {
  title?: ReactNode;
  headerAction?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cx(
        'support-rail-card',
        className,
      )}
    >
      {title ? (
        <div className="flex items-center justify-between gap-2">
          <h4 className="text-[15px] font-bold tracking-[-0.03em] text-[color:var(--color-ink)]">
            {title}
          </h4>
          {headerAction}
        </div>
      ) : null}
      {title ? <div className="mt-3">{children}</div> : children}
    </section>
  );
}

export function SupportQuickActionGrid({ children }: { children: ReactNode }) {
  return <div className="grid grid-cols-2 gap-2">{children}</div>;
}

export function SupportQuickActionButton({
  icon,
  label,
  onClick,
  className,
}: {
  icon: ReactNode;
  label: ReactNode;
  onClick: () => void;
  className?: string;
}) {
  return (
    <button
      className={cx(
        'support-action-card-button flex w-full flex-col items-center justify-center gap-1.5 text-center text-[11px] font-medium leading-[1.15rem] text-[color:var(--color-ink)] transition hover:border-[rgba(47,107,255,0.28)] hover:bg-[rgba(47,107,255,0.04)]',
        className,
      )}
      onClick={onClick}
      type="button"
    >
      {icon}
      <span className="block w-full text-balance">{label}</span>
    </button>
  );
}

export function SupportActionDrawer({
  title,
  subtitle,
  onClose,
  children,
  footer,
  bodyClassName,
  className,
  size = 'default',
}: {
  title: ReactNode;
  subtitle?: ReactNode;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
  bodyClassName?: string;
  className?: string;
  size?: 'default' | 'wide';
}) {
  return (
    <section
      className={cx(
        'support-context-panel flex h-full min-h-0 overflow-hidden',
        size === 'wide'
          ? 'support-context-panel--wide'
          : 'support-context-panel--default',
        className,
      )}
    >
      <div className="flex h-full min-h-0 flex-1 flex-col">
        <div className="support-context-panel__header flex items-start justify-between gap-3">
          <div className="space-y-1">
            <h3 className="support-context-panel__title">
              {title}
            </h3>
            {subtitle ? (
              <p className="support-context-panel__subtitle">
                {subtitle}
              </p>
            ) : null}
          </div>
          <button
            className="support-context-panel__close"
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </div>
        <div
          className={cx(
            'support-context-panel__body min-h-0 flex-1 overflow-y-auto',
            bodyClassName,
          )}
        >
          {children}
        </div>
        {footer ? (
          <div className="support-context-panel__footer shrink-0">
            {footer}
          </div>
        ) : null}
      </div>
    </section>
  );
}

export function EvidenceFileChip({
  title,
  meta,
  statusBadge,
  actions,
}: {
  title: ReactNode;
  meta: ReactNode;
  statusBadge?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <article className="support-drawer-resource-card">
      <div className="support-drawer-resource-card__header">
        <div className="min-w-0">
          <p className="support-drawer-resource-card__title">{title}</p>
          <p className="support-drawer-resource-card__meta">{meta}</p>
        </div>
        {statusBadge}
      </div>
      {actions ? (
        <div className="support-drawer-resource-card__actions">
          {actions}
        </div>
      ) : null}
    </article>
  );
}

export function SupportTicketSummaryCard({
  children,
}: {
  children: ReactNode;
}) {
  return <div className="space-y-3">{children}</div>;
}

export function SupportSummaryRow({
  label,
  value,
  className,
}: {
  label: ReactNode;
  value: ReactNode;
  className?: string;
}) {
  return (
    <div className={cx('grid grid-cols-[86px_minmax(0,1fr)] items-start gap-2', className)}>
      <span className="text-[11px] font-medium text-[color:var(--color-muted)]">{label}</span>
      <div className="min-w-0 text-[12px] font-semibold text-[color:var(--color-ink)]">{value}</div>
    </div>
  );
}

export function SupportRecentActivityItem({
  icon,
  title,
  meta,
  time,
}: {
  icon: ReactNode;
  title: ReactNode;
  meta?: ReactNode;
  time?: ReactNode;
}) {
  return (
    <div className="flex items-start gap-2 rounded-[12px] border border-[color:var(--color-support-border)] bg-[color:var(--color-support-surface)] px-3 py-2.5">
      <span className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-white text-[color:var(--color-brand-blue)]">
        {icon}
      </span>
      <div className="min-w-0 flex-1">
        <p className="line-clamp-2 text-[11.5px] font-semibold leading-4.5 text-[color:var(--color-ink)]">
          {title}
        </p>
        {meta ? (
          <p className="mt-0.5 truncate text-[10px] leading-4 text-[color:var(--color-muted)]">{meta}</p>
        ) : null}
      </div>
      {time ? (
        <span className="shrink-0 text-[10px] font-medium text-[color:var(--color-muted)]">{time}</span>
      ) : null}
    </div>
  );
}

export function SupportSlaSummary({
  headline,
  progress,
  tone = 'positive',
  detailLeft,
  detailRight,
  footer,
}: {
  headline: ReactNode;
  progress: number;
  tone?: 'positive' | 'warning' | 'critical';
  detailLeft: ReactNode;
  detailRight: ReactNode;
  footer?: ReactNode;
}) {
  const barToneClass =
    tone === 'critical'
      ? 'bg-[color:var(--color-danger-text)]'
      : tone === 'warning'
        ? 'bg-[color:var(--color-warning-text)]'
        : 'bg-[color:var(--color-success-text)]';

  return (
    <div className="space-y-3">
      <div className="flex items-end justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-medium text-[color:var(--color-muted)]">SLA do ticket</p>
          <p className="mt-1 text-[12px] font-semibold text-[color:var(--color-ink)]">{headline}</p>
        </div>
        <p className={cx('text-[1.85rem] font-extrabold tracking-[-0.05em]', barToneClass.replace('bg-', 'text-'))}>
          {progress}%
        </p>
      </div>
      <meter
        className={cx(
          'support-sla-meter',
          tone === 'critical'
            ? 'support-sla-meter--critical'
            : tone === 'warning'
              ? 'support-sla-meter--warning'
              : 'support-sla-meter--positive',
        )}
        max={100}
        min={0}
        value={Math.max(0, Math.min(100, progress))}
      />
      <div className="flex items-center justify-between gap-3 text-[11px]">
        <span className="font-medium text-[color:var(--color-muted)]">{detailLeft}</span>
        <span className="font-semibold text-[color:var(--color-ink)]">{detailRight}</span>
      </div>
      {footer ? <p className="text-[10.5px] leading-4 text-[color:var(--color-muted)]">{footer}</p> : null}
    </div>
  );
}
