import { useState, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { GeniusMascot } from '../../components/GeniusMascot';
import { AppButton, GhostButton, cx } from '../../components/ui';
import type { PublicHelpSupportContacts } from '../../contracts/public-contracts';

export type HelpIconKind =
  | 'search'
  | 'shield'
  | 'puzzle'
  | 'gear'
  | 'truck'
  | 'chart'
  | 'cap'
  | 'support'
  | 'doc'
  | 'alert'
  | 'menu'
  | 'clock'
  | 'calendar'
  | 'chevron-right'
  | 'chevron-down'
  | 'circle';

function iconToneClasses(tone: 'blue' | 'pink' | 'neutral') {
  if (tone === 'pink') {
    return 'border-[var(--help-border)] bg-[var(--help-accent-soft)] text-[var(--color-brand-magenta)]';
  }

  if (tone === 'neutral') {
    return 'border-[var(--help-border)] bg-[var(--help-surface)] text-[var(--help-ink)]';
  }

  return 'border-[var(--help-border)] bg-[var(--help-accent-soft)] text-[var(--help-link)]';
}

export function HelpIcon({
  kind,
  className,
}: {
  kind: HelpIconKind;
  className?: string;
}) {
  const common = 'fill-none stroke-current stroke-[1.8]';

  if (kind === 'search') {
    return (
      <svg aria-hidden="true" className={cx('h-5 w-5', className)} viewBox="0 0 24 24">
        <circle className={common} cx="11" cy="11" r="6" />
        <path className={common} d="m20 20-3.8-3.8" strokeLinecap="round" />
      </svg>
    );
  }

  if (kind === 'shield') {
    return (
      <svg aria-hidden="true" className={cx('h-5 w-5', className)} viewBox="0 0 24 24">
        <path
          className={common}
          d="M12 3.5 6 6v5.5c0 3.5 2.2 6.6 6 8.9 3.8-2.3 6-5.4 6-8.9V6l-6-2.5Z"
          strokeLinejoin="round"
        />
        <path className={common} d="M12 8.5v6" strokeLinecap="round" />
        <path className={common} d="M9.5 11.5h5" strokeLinecap="round" />
      </svg>
    );
  }

  if (kind === 'puzzle') {
    return (
      <svg aria-hidden="true" className={cx('h-5 w-5', className)} viewBox="0 0 24 24">
        <path
          className={common}
          d="M8 4h3a2 2 0 1 1 4 0h3v5a2 2 0 1 0 0 4v5h-5a2 2 0 1 1-4 0H4v-5a2 2 0 1 0 0-4V4h4Z"
          strokeLinejoin="round"
        />
      </svg>
    );
  }

  if (kind === 'gear') {
    return (
      <svg aria-hidden="true" className={cx('h-5 w-5', className)} viewBox="0 0 24 24">
        <path
          className={common}
          d="m12 3 1.1 2.3 2.5.5.8 2.4 2.2 1.3-.8 2.4.8 2.4-2.2 1.3-.8 2.4-2.5.5L12 21l-1.1-2.3-2.5-.5-.8-2.4-2.2-1.3.8-2.4-.8-2.4 2.2-1.3.8-2.4 2.5-.5L12 3Z"
          strokeLinejoin="round"
        />
        <circle className={common} cx="12" cy="12" r="3.2" />
      </svg>
    );
  }

  if (kind === 'truck') {
    return (
      <svg aria-hidden="true" className={cx('h-5 w-5', className)} viewBox="0 0 24 24">
        <path className={common} d="M3.5 6.5h10v8h-10z" strokeLinejoin="round" />
        <path className={common} d="M13.5 9.5H18l2.5 2.7v2.3h-2" strokeLinejoin="round" />
        <circle className={common} cx="8" cy="17" r="1.8" />
        <circle className={common} cx="18" cy="17" r="1.8" />
      </svg>
    );
  }

  if (kind === 'chart') {
    return (
      <svg aria-hidden="true" className={cx('h-5 w-5', className)} viewBox="0 0 24 24">
        <path className={common} d="M4.5 4.5v15h15" strokeLinecap="round" />
        <path className={common} d="M8 16v-4" strokeLinecap="round" />
        <path className={common} d="M12 16V8" strokeLinecap="round" />
        <path className={common} d="M16 16v-6" strokeLinecap="round" />
      </svg>
    );
  }

  if (kind === 'cap') {
    return (
      <svg aria-hidden="true" className={cx('h-5 w-5', className)} viewBox="0 0 24 24">
        <path className={common} d="m3.5 9 8.5-4 8.5 4-8.5 4-8.5-4Z" strokeLinejoin="round" />
        <path className={common} d="M6.5 10.5V15l5.5 3 5.5-3v-4.5" strokeLinejoin="round" />
      </svg>
    );
  }

  if (kind === 'support') {
    return (
      <svg aria-hidden="true" className={cx('h-5 w-5', className)} viewBox="0 0 24 24">
        <path className={common} d="M7 10a5 5 0 0 1 10 0" strokeLinecap="round" />
        <path className={common} d="M6 11.5h2.5v5H6z" strokeLinejoin="round" />
        <path className={common} d="M15.5 11.5H18v5h-2.5z" strokeLinejoin="round" />
        <path className={common} d="M8.5 17.5c.7 1 1.9 1.5 3.5 1.5h1.5" strokeLinecap="round" />
      </svg>
    );
  }

  if (kind === 'doc') {
    return (
      <svg aria-hidden="true" className={cx('h-4.5 w-4.5', className)} viewBox="0 0 24 24">
        <path
          className={common}
          d="M7 4.5h6l4 4v11H7z"
          strokeLinejoin="round"
        />
        <path className={common} d="M13 4.5v4h4" strokeLinejoin="round" />
      </svg>
    );
  }

  if (kind === 'alert') {
    return (
      <svg aria-hidden="true" className={cx('h-5 w-5', className)} viewBox="0 0 24 24">
        <path
          className={common}
          d="M12 5 4 19h16L12 5Z"
          strokeLinejoin="round"
        />
        <path className={common} d="M12 10.5v3.5" strokeLinecap="round" />
        <circle cx="12" cy="16.5" r="1" fill="currentColor" />
      </svg>
    );
  }

  if (kind === 'menu') {
    return (
      <svg aria-hidden="true" className={cx('h-5 w-5', className)} viewBox="0 0 24 24">
        <path className={common} d="M5 7h14" strokeLinecap="round" />
        <path className={common} d="M5 12h14" strokeLinecap="round" />
        <path className={common} d="M5 17h14" strokeLinecap="round" />
      </svg>
    );
  }

  if (kind === 'clock') {
    return (
      <svg aria-hidden="true" className={cx('h-4 w-4', className)} viewBox="0 0 24 24">
        <circle className={common} cx="12" cy="12" r="7.5" />
        <path className={common} d="M12 8.5v4l2.5 1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (kind === 'calendar') {
    return (
      <svg aria-hidden="true" className={cx('h-4 w-4', className)} viewBox="0 0 24 24">
        <path className={common} d="M5 6.5h14v12H5z" strokeLinejoin="round" />
        <path className={common} d="M8 4.5v4" strokeLinecap="round" />
        <path className={common} d="M16 4.5v4" strokeLinecap="round" />
        <path className={common} d="M5 9.5h14" strokeLinecap="round" />
      </svg>
    );
  }

  if (kind === 'chevron-down') {
    return (
      <svg aria-hidden="true" className={cx('h-4 w-4', className)} viewBox="0 0 24 24">
        <path className={common} d="m7 10 5 5 5-5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    );
  }

  if (kind === 'circle') {
    return <span aria-hidden="true" className={cx('block h-2 w-2 rounded-full bg-current', className)} />;
  }

  return (
    <svg aria-hidden="true" className={cx('h-4 w-4', className)} viewBox="0 0 24 24">
      <path className={common} d="m9 6 6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function PublicIconBadge({
  icon,
  tone = 'blue',
  className,
}: {
  icon: HelpIconKind;
  tone?: 'blue' | 'pink' | 'neutral';
  className?: string;
}) {
  return (
    <span
      className={cx(
        'inline-flex h-10 w-10 items-center justify-center rounded-[14px] border',
        iconToneClasses(tone),
        className,
      )}
    >
      <HelpIcon kind={icon} />
    </span>
  );
}

export function getCategoryVisuals(name: string | null | undefined) {
  const normalized = (name ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  if (normalized.includes('integr')) {
    return { icon: 'puzzle' as const, tone: 'blue' as const };
  }

  if (normalized.includes('config') || normalized.includes('primeiro')) {
    return { icon: 'gear' as const, tone: 'pink' as const };
  }

  if (normalized.includes('oper') || normalized.includes('reversa') || normalized.includes('troca')) {
    return { icon: 'truck' as const, tone: 'blue' as const };
  }

  if (normalized.includes('relat') || normalized.includes('solu') || normalized.includes('problem')) {
    return { icon: 'chart' as const, tone: 'pink' as const };
  }

  if (normalized.includes('boa') || normalized.includes('seller') || normalized.includes('loja')) {
    return { icon: 'cap' as const, tone: 'blue' as const };
  }

  if (normalized.includes('suporte')) {
    return { icon: 'support' as const, tone: 'blue' as const };
  }

  return { icon: 'doc' as const, tone: 'neutral' as const };
}

export function formatRelativePublicDate(value: string | null | undefined) {
  if (!value) {
    return 'Atualizado recentemente';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return 'Atualizado recentemente';
  }

  const now = Date.now();
  const diffMs = date.getTime() - now;
  const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));
  const absDays = Math.abs(diffDays);
  const formatter = new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto' });

  if (absDays < 7) {
    return `Atualizado ${formatter.format(diffDays, 'day')}`;
  }

  if (absDays < 30) {
    return `Atualizado ${formatter.format(Math.round(diffDays / 7), 'week')}`;
  }

  if (absDays < 365) {
    return `Atualizado ${formatter.format(Math.round(diffDays / 30), 'month')}`;
  }

  return `Atualizado ${formatter.format(Math.round(diffDays / 365), 'year')}`;
}

export function getPublicCategoryLabel(value: string | null | undefined) {
  const label = value?.trim();
  if (!label) return 'Categoria pública';

  const normalized = label
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR');

  if (normalized === 'operacao de trocas e devolucoes') return 'Trocas e devoluções';
  return label;
}

export function isPublicNavigationCategory(value: string | null | undefined) {
  const normalized = value
    ?.trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR');

  return normalized !== 'primeiros passos';
}

export function PublicSearchStateCard({
  tone,
  title,
  description,
  action,
  mascotPose,
  mascotExpression,
  showMascot = true,
}: {
  tone: 'loading' | 'empty' | 'error';
  title: string;
  description: string;
  action?: ReactNode;
  mascotPose?: 'magic' | 'shrug';
  mascotExpression?: 'happy' | 'wink';
  showMascot?: boolean;
}) {
  const toneMap =
    tone === 'error'
      ? {
          icon: 'alert' as const,
          iconTone: 'pink' as const,
          border: 'border-[var(--help-border)]',
        }
      : tone === 'empty'
        ? {
            icon: 'doc' as const,
            iconTone: 'neutral' as const,
            border: 'border-[var(--help-border)]',
          }
        : {
            icon: 'search' as const,
            iconTone: 'blue' as const,
            border: 'border-[var(--help-border)]',
        };
  const resolvedMascotPose = mascotPose ?? (tone === 'loading' ? 'magic' : 'shrug');
  const resolvedMascotExpression = mascotExpression ?? (tone === 'empty' ? 'wink' : 'happy');

  return (
    <div className={cx('rounded-[26px] border bg-[var(--help-surface-strong)] px-5 py-5 shadow-[var(--help-shadow)]', toneMap.border)}>
      <div className="flex items-start gap-4">
            {showMascot ? <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-[20px] bg-[var(--help-accent-soft)]">
              <GeniusMascot alt="Gênio orientando a consulta" expression={resolvedMascotExpression} pose={resolvedMascotPose} size="sm" surface={tone === 'loading' ? 'loading' : 'empty'} />
            </div> : null}
        <div className="space-y-2">
          <p className="text-base font-semibold text-[var(--help-ink-strong)]">{title}</p>
          <p className="max-w-xl text-sm leading-7 text-[var(--help-muted)]">{description}</p>
          {tone === 'loading' ? (
            <div className="flex items-center gap-2 pt-1 text-[var(--help-link)]">
              <HelpIcon kind="circle" className="animate-pulse" />
              <HelpIcon kind="circle" className="animate-pulse [animation-delay:120ms]" />
              <HelpIcon kind="circle" className="animate-pulse [animation-delay:240ms]" />
            </div>
          ) : null}
          {action ? <div className="pt-1">{action}</div> : null}
        </div>
      </div>
    </div>
  );
}

export function PublicHelpHeader({
  brandName,
  spaceSlug,
  active,
  showOtherCenters,
  mobileTitle = 'Central de Ajuda',
  tertiaryLabel = 'Outras centrais',
  tertiaryHref,
  portalHref,
}: {
  brandName: string;
  spaceSlug: string;
  active: 'overview' | 'articles' | 'directory';
  showOtherCenters: boolean;
  mobileTitle?: string;
  tertiaryLabel?: string;
  tertiaryHref?: string | null;
  portalHref?: string | null;
}) {
  const [portalNoticeOpen, setPortalNoticeOpen] = useState(false);
  const navLink = (label: string, to: string, isActive: boolean) => (
    <Link
      className={cx(
        'relative inline-flex min-h-12 items-center px-1 text-[0.95rem] font-semibold no-underline transition',
        isActive ? 'text-[var(--help-link)]' : 'text-[var(--help-ink)] hover:text-[var(--help-link)]',
      )}
      to={to}
    >
      {label}
      <span
        className={cx(
          'absolute inset-x-0 bottom-[-20px] h-[2px] rounded-full bg-[var(--help-link)] transition',
          isActive ? 'opacity-100' : 'opacity-0',
        )}
      />
    </Link>
  );

  return (
    <header className="gso-help-header border-b border-[var(--help-border)] bg-[var(--help-surface-strong)]">
      <div className="mx-auto flex max-w-[1520px] items-center justify-between gap-5 px-4 py-4 sm:px-6 lg:px-8 xl:px-10">
        <div className="flex min-w-0 items-center gap-3.5">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[var(--help-accent-strong)] text-sm font-semibold text-[var(--help-hero-text)]">
            <GeniusMascot
              alt="Gênio da Central de Ajuda"
              animated={false}
              size="sm"
              surface="avatar"
            />
          </div>
          <div className="min-w-0 sm:flex sm:items-center sm:gap-3">
            <p className="truncate text-sm font-semibold text-[var(--help-ink-strong)] sm:text-[1rem]">
              {brandName}
            </p>
            <span className="hidden rounded-full border border-[var(--help-content-callout-border)] bg-[var(--help-content-callout)] px-3 py-1 text-[0.72rem] font-semibold uppercase tracking-[0.08em] text-[var(--help-link)] sm:inline-flex">
              {mobileTitle}
            </span>
            <p className="truncate text-[0.74rem] text-[var(--help-muted)] sm:hidden">
              {mobileTitle}
            </p>
          </div>
        </div>

        <div className="hidden items-center gap-8 md:flex">
          <nav className="hidden items-center gap-10 md:flex">
          {navLink('Visão geral', `/help/${spaceSlug}`, active === 'overview')}
          {navLink('Artigos', `/help/${spaceSlug}/articles`, active === 'articles')}
          {tertiaryHref ? (
            <div className="relative">
              <a
                className={cx(
                  'relative inline-flex min-h-12 items-center px-1 text-[0.95rem] font-semibold no-underline transition',
                  active === 'directory' ? 'text-[var(--help-link)]' : 'text-[var(--help-ink)] hover:text-[var(--help-link)]',
                )}
                href={tertiaryHref}
              >
                {tertiaryLabel}
              </a>
              <HelpIcon className="pointer-events-none absolute right-[-18px] top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--help-muted)]" kind="chevron-down" />
            </div>
          ) : showOtherCenters ? (
            <div className="relative">
              {navLink(tertiaryLabel, '/help', active === 'directory')}
              <HelpIcon className="pointer-events-none absolute right-[-18px] top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--help-muted)]" kind="chevron-down" />
            </div>
          ) : (
            <span className="inline-flex min-h-12 items-center gap-1 text-[0.95rem] font-semibold text-[var(--help-muted)]">
              {tertiaryLabel}
              <HelpIcon kind="chevron-down" className="h-4 w-4" />
            </span>
          )}
          </nav>
          {portalHref ? <AppButton className="min-h-11 rounded-[14px] px-5" onClick={() => setPortalNoticeOpen(true)}>Entrar no portal</AppButton> : null}
        </div>

        <details className="relative md:hidden">
          <summary className="flex h-11 w-11 cursor-pointer list-none items-center justify-center rounded-[14px] border border-[var(--help-border)] bg-[color:var(--color-surface-strong)] text-[var(--help-ink)]">
            <HelpIcon kind="menu" />
          </summary>
          <div className="absolute right-0 top-[calc(100%+10px)] z-30 grid min-w-[210px] gap-1 rounded-[18px] border border-[var(--help-border)] bg-[var(--help-surface-strong)] p-2 shadow-[var(--help-shadow)]">
            <Link
              className={cx(
                'rounded-[12px] px-3 py-2 text-sm font-medium no-underline',
                active === 'overview'
                  ? 'bg-[var(--help-accent-soft)] text-[var(--help-link)]'
                  : 'text-[var(--help-ink)]',
              )}
              to={`/help/${spaceSlug}`}
            >
              Visão geral
            </Link>
            <Link
              className={cx(
                'rounded-[12px] px-3 py-2 text-sm font-medium no-underline',
                active === 'articles'
                  ? 'bg-[var(--help-accent-soft)] text-[var(--help-link)]'
                  : 'text-[var(--help-ink)]',
              )}
              to={`/help/${spaceSlug}/articles`}
            >
              Artigos
            </Link>
            {tertiaryHref ? (
              <a
                className="rounded-[12px] px-3 py-2 text-sm font-medium no-underline text-[var(--help-ink)]"
                href={tertiaryHref}
              >
                {tertiaryLabel}
              </a>
            ) : showOtherCenters ? (
              <Link
                className={cx(
                  'rounded-[12px] px-3 py-2 text-sm font-medium no-underline',
                  active === 'directory'
                    ? 'bg-[var(--help-accent-soft)] text-[var(--help-link)]'
                    : 'text-[var(--help-ink)]',
                )}
                to="/help"
              >
                {tertiaryLabel}
              </Link>
            ) : (
              <span className="rounded-[12px] px-3 py-2 text-sm text-[var(--help-muted)]">
                {tertiaryLabel}
              </span>
            )}
            {portalHref ? <button className="rounded-[12px] bg-[var(--help-link)] px-3 py-2 text-left text-sm font-semibold text-white" onClick={() => setPortalNoticeOpen(true)} type="button">Entrar no portal</button> : null}
          </div>
        </details>
      </div>
      {portalNoticeOpen ? (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-5" role="presentation" onClick={() => setPortalNoticeOpen(false)}>
          <section aria-labelledby="portal-notice-title" aria-modal="true" className="w-full max-w-md rounded-[24px] bg-[var(--help-surface-strong)] p-6 shadow-[var(--help-shadow)]" onClick={(event) => event.stopPropagation()} role="dialog">
            <div className="flex items-start gap-4">
              <GeniusMascot alt="Gênio avisando sobre o portal" expression="happy" pose="magic" size="md" surface="empty" />
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--help-link)]">Um pouquinho mais</p>
                <h2 className="mt-1 text-xl font-semibold text-[var(--help-ink-strong)]" id="portal-notice-title">O portal está quase pronto</h2>
                <p className="mt-2 text-sm leading-6 text-[var(--help-muted)]">O Gênio está preparando esse espaço para você acompanhar tudo com tranquilidade. Em breve, ele estará pronto para receber você.</p>
              </div>
            </div>
            <div className="mt-5 flex justify-end"><GhostButton onClick={() => setPortalNoticeOpen(false)}>Entendi</GhostButton></div>
          </section>
        </div>
      ) : null}
      </header>
  );
}

function whatsappHref(value: string | null | undefined) {
  const digits = value?.replace(/\D/g, '') ?? '';
  return digits.length >= 10 ? `https://wa.me/${digits}` : null;
}

export function PublicHelpFooter({
  brandName,
  supportContacts,
}: {
  brandName: string;
  supportContacts: PublicHelpSupportContacts;
}) {
  const whatsapp = whatsappHref(supportContacts.whatsapp);
  const hasContact = Boolean(supportContacts.email || whatsapp);

  return (
    <footer className="mt-10 border-t border-[var(--help-border)] bg-[var(--help-surface-strong)]">
      <div className="mx-auto flex max-w-[1520px] flex-col gap-5 px-4 py-7 sm:px-6 lg:flex-row lg:items-center lg:justify-between lg:px-8 xl:px-10">
        <div className="space-y-1">
          <p className="text-sm font-semibold text-[var(--help-ink-strong)]">Precisa de ajuda?</p>
          <p className="text-sm leading-6 text-[var(--help-muted)]">
            Fale com o suporte {brandName} pelos canais oficiais.
          </p>
        </div>
        {hasContact ? (
          <div className="flex flex-wrap gap-2.5 text-sm">
            {supportContacts.email ? (
              <a
                className="inline-flex min-h-10 items-center rounded-[12px] border border-[var(--help-border)] px-3.5 font-semibold text-[var(--help-link)] no-underline transition hover:border-[var(--help-link)]"
                href={`mailto:${supportContacts.email}`}
              >
                E-mail: {supportContacts.email}
              </a>
            ) : null}
            {whatsapp ? (
              <a
                className="inline-flex min-h-10 items-center rounded-[12px] bg-[var(--help-link)] px-3.5 font-semibold text-white no-underline transition hover:bg-[var(--help-link-hover)]"
                href={whatsapp}
                rel="noreferrer"
                target="_blank"
              >
                WhatsApp: {supportContacts.whatsapp}
              </a>
            ) : null}
          </div>
        ) : (
          <p className="text-sm text-[var(--help-muted)]">Canais de contato indisponíveis no momento.</p>
        )}
      </div>
    </footer>
  );
}

export function PublicBreadcrumb({
  items,
}: {
  items: Array<{ label: string; to?: string }>;
}) {
  return (
    <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-2 text-[0.84rem] text-[var(--help-muted)]">
      {items.map((item, index) => (
        <span key={`${item.label}-${index}`} className="inline-flex items-center gap-2">
          {item.to ? (
            <Link className="font-medium text-[var(--help-muted)] no-underline hover:text-[var(--help-link)]" to={item.to}>
              {item.label}
            </Link>
          ) : (
            <span className="font-medium text-[var(--help-ink)]">{item.label}</span>
          )}
          {index < items.length - 1 ? <span>{'>'}</span> : null}
        </span>
      ))}
    </nav>
  );
}

export function PublicSupportAction({
  href,
  label,
}: {
  href: string | null;
  label: string;
}) {
  if (!href) {
    return (
      <GhostButton className="w-full justify-between" disabled>
        {label}
        <HelpIcon kind="chevron-right" />
      </GhostButton>
    );
  }

  const content = (
    <>
      {label}
      <HelpIcon kind="chevron-right" />
    </>
  );

  if (href.startsWith('http')) {
    return (
      <a className="inline-flex w-full" href={href} rel="noreferrer" target="_blank">
        <GhostButton className="w-full justify-between">{content}</GhostButton>
      </a>
    );
  }

  return (
    <a className="inline-flex w-full" href={href}>
      <GhostButton className="w-full justify-between">{content}</GhostButton>
    </a>
  );
}
