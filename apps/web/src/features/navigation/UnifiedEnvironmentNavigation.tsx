import { Link } from 'react-router-dom';
import mascotUrl from '../../../assets/brand/genius-mascot.svg';
import { cx } from '../../components/ui';

export const UNIFIED_INTERNAL_SIDEBAR_WIDTH_CLASS = 'w-[240px]';

export type UnifiedNavigationIcon =
  | 'queue'
  | 'tickets'
  | 'customers'
  | 'engineering'
  | 'knowledge'
  | 'admin'
  | 'portal'
  | 'access'
  | 'system'
  | 'return';

export interface UnifiedEnvironmentItem {
  label: string;
  to?: string;
  disabled?: boolean;
  disabledReason?: string;
  matches: (pathname: string) => boolean;
}

export interface UnifiedModuleItem {
  label: string;
  to: string;
  icon: UnifiedNavigationIcon;
  matches: (pathname: string) => boolean;
}

function UnifiedNavigationIconGlyph({
  icon,
  active,
}: {
  icon: UnifiedNavigationIcon;
  active: boolean;
}) {
  const iconClassName = cx(
    'h-[18px] w-[18px] shrink-0',
    active ? 'text-white' : 'text-white/82 group-hover:text-white',
  );

  switch (icon) {
    case 'queue':
      return (
        <svg aria-hidden="true" className={iconClassName} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
          <rect height="14" rx="2.4" width="14" x="5" y="5" />
          <path d="M9 9h6M9 12h6M9 15h4" strokeLinecap="round" />
        </svg>
      );
    case 'tickets':
      return (
        <svg aria-hidden="true" className={iconClassName} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
          <path d="M8 6h8a2 2 0 0 1 2 2v2a2.5 2.5 0 0 0 0 5v1a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2v-1a2.5 2.5 0 0 0 0-5V8a2 2 0 0 1 2-2Z" />
          <path d="M12 8v8" strokeDasharray="2.4 2.4" strokeLinecap="round" />
        </svg>
      );
    case 'customers':
      return (
        <svg aria-hidden="true" className={iconClassName} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
          <circle cx="12" cy="8" r="3.2" />
          <path d="M6.5 18.2a5.9 5.9 0 0 1 11 0" strokeLinecap="round" />
        </svg>
      );
    case 'engineering':
      return (
        <svg aria-hidden="true" className={iconClassName} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
          <path d="M14.7 5.3 18.7 9.3M8 18l-2 1 1-2 9.6-9.6a1.8 1.8 0 0 1 2.5 2.5L9.5 19.5Z" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M5 7.5h6M5 11h4" strokeLinecap="round" />
        </svg>
      );
    case 'knowledge':
      return (
        <svg aria-hidden="true" className={iconClassName} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
          <path d="M7 5.8h8.4A2.6 2.6 0 0 1 18 8.4V18H9.5A2.5 2.5 0 0 0 7 20.5V5.8Z" />
          <path d="M7 18V5.8H5.8A1.8 1.8 0 0 0 4 7.6V18a2.5 2.5 0 0 1 2.5-2.5H18" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      );
    case 'access':
      return (
        <svg aria-hidden="true" className={iconClassName} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
          <path d="M7.5 10V7.75A4.5 4.5 0 0 1 12 3.25a4.5 4.5 0 0 1 4.5 4.5V10" strokeLinecap="round" strokeLinejoin="round" />
          <rect height="9" rx="2.2" width="13" x="5.5" y="10" />
        </svg>
      );
    case 'portal':
      return (
        <svg aria-hidden="true" className={iconClassName} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
          <path d="M6 6.25A2.25 2.25 0 0 1 8.25 4h7.5A2.25 2.25 0 0 1 18 6.25v11.5A2.25 2.25 0 0 1 15.75 20h-7.5A2.25 2.25 0 0 1 6 17.75V6.25Z" />
          <path d="M9 8.5h6M9 12h6M9 15.5h3.5" strokeLinecap="round" />
        </svg>
      );
    case 'system':
      return (
        <svg aria-hidden="true" className={iconClassName} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
          <path d="M12 4.5 13.5 7l3 .6-1 2.8 1.7 2.4-2.4 1.6.6 3-2.8-1-2.4 1.7-1.6-2.4-3 .6 1-2.8-1.7-2.4 2.4-1.6-.6-3 2.8 1L12 4.5Z" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M12 9a3 3 0 1 1 0 6 3 3 0 0 1 0-6Z" />
        </svg>
      );
    case 'return':
      return (
        <svg aria-hidden="true" className={iconClassName} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
          <path d="M9 8 5 12l4 4" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M5.5 12H16a3 3 0 0 1 3 3v1.5" strokeLinecap="round" />
        </svg>
      );
    case 'admin':
    default:
      return (
        <svg aria-hidden="true" className={iconClassName} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
          <path d="M12 4.5 18.5 8v8L12 19.5 5.5 16V8L12 4.5Z" />
          <path d="M12 9v6M9 12h6" strokeLinecap="round" />
        </svg>
      );
  }
}

function SectionLabel({ children }: { children: string }) {
  return (
    <p className="px-2 text-[0.62rem] font-semibold uppercase tracking-[0.22em] text-white/42">
      {children}
    </p>
  );
}

function LockIcon() {
  return (
    <svg aria-hidden="true" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="M8 10V7.8a4 4 0 0 1 8 0V10" strokeLinecap="round" />
      <rect height="9" rx="2" width="12" x="6" y="10" />
    </svg>
  );
}

function environmentIconFor(label: string): UnifiedNavigationIcon {
  if (label === 'Engenharia') {
    return 'engineering';
  }

  if (label === 'Administração') {
    return 'admin';
  }

  return 'queue';
}

function EnvironmentItem({
  label,
  to,
  active,
  disabled,
  disabledReason,
}: {
  label: string;
  to?: string;
  active: boolean;
  disabled?: boolean;
  disabledReason?: string;
}) {
  const className = cx(
    'group flex min-h-11 items-center gap-2 rounded-[15px] border px-2.5 py-2 text-[0.82rem] font-semibold transition',
    active
      ? 'border-[rgba(75,137,255,0.42)] bg-[linear-gradient(135deg,rgba(27,98,240,0.95),rgba(47,126,255,0.92))] text-white shadow-[0_12px_24px_rgba(16,73,202,0.24)]'
      : disabled
        ? 'cursor-not-allowed border-white/7 bg-white/5 text-white/46'
        : 'border-white/8 bg-white/5 text-white/78 hover:border-white/14 hover:bg-white/9 hover:text-white',
  );

  const icon = environmentIconFor(label);
  const content = (
    <>
      <span
        className={cx(
          'inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-[10px] border',
          active
            ? 'border-white/14 bg-white/16 text-white'
            : disabled
              ? 'border-white/7 bg-white/5 text-white/44'
              : 'border-white/10 bg-white/7 text-white/82 group-hover:text-white',
        )}
      >
        <UnifiedNavigationIconGlyph active={active} icon={icon} />
      </span>
      <span className="min-w-0 flex-1 truncate">{label}</span>
      {active ? (
        <span className="rounded-full bg-white/14 px-2 py-0.5 text-[0.62rem] font-semibold text-white/88">
          Atual
        </span>
      ) : null}
      {disabled ? (
        <span className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-[10px] bg-white/8 text-white/54">
          <LockIcon />
        </span>
      ) : null}
    </>
  );

  if (disabled || !to) {
    return (
      <div aria-disabled="true" className={className} title={disabledReason ?? 'Ambiente indisponível'}>
        {content}
      </div>
    );
  }

  return (
    <Link className={className} to={to}>
      {content}
    </Link>
  );
}

export function UnifiedQuickNavigation({
  pathname,
  title,
  items,
}: {
  pathname: string;
  title: string;
  items: Array<{ label: string; to: string; matches: (pathname: string) => boolean }>;
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      <p className="px-1 text-[0.64rem] font-semibold uppercase tracking-[0.2em] text-[color:var(--color-muted)]">
        {title}
      </p>
      <nav className="flex gap-2 overflow-x-auto pb-1">
        {items.map((item) => {
          const active = item.matches(pathname);

          return (
            <Link
              className={cx(
                'inline-flex min-h-10 shrink-0 items-center justify-center rounded-full border px-4 py-2 text-sm font-medium transition',
                active
                  ? 'border-[rgba(48,127,226,0.26)] bg-[rgba(48,127,226,0.1)] text-[color:var(--color-brand-blue)]'
                  : 'border-[color:var(--color-border)] bg-white text-[color:var(--color-ink)]',
              )}
              key={`${item.label}:${item.to}`}
              to={item.to}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
    </div>
  );
}

export function UnifiedEnvironmentSidebar({
  pathname,
  environmentSubtitle,
  moduleSectionLabel,
  environmentItems,
  moduleItems,
  userInitials,
  userTitle,
  userSubtitle,
  onSignOut,
  className,
}: {
  pathname: string;
  environmentSubtitle: string;
  moduleSectionLabel: string;
  environmentItems: UnifiedEnvironmentItem[];
  moduleItems: UnifiedModuleItem[];
  userInitials: string;
  userTitle: string;
  userSubtitle: string;
  onSignOut: () => void;
  className?: string;
}) {
  return (
    <aside
      className={cx(
        'flex h-full flex-col overflow-hidden rounded-[24px] border border-[rgba(255,255,255,0.08)] bg-[linear-gradient(180deg,#06173f_0%,#082058_52%,#0b2a68_100%)] px-3 py-4 text-white shadow-[0_24px_52px_rgba(9,20,56,0.24)]',
        UNIFIED_INTERNAL_SIDEBAR_WIDTH_CLASS,
        className,
      )}
    >
      <div className="flex items-center gap-3 px-1">
        <img alt="Mascote Genius" className="w-9 shrink-0" src={mascotUrl} />
        <div className="min-w-0">
          <h1 className="truncate text-[0.92rem] font-semibold leading-tight tracking-[-0.03em] text-white">
            Genius Support OS
          </h1>
          <p className="mt-1 truncate text-[0.68rem] leading-4 text-white/62">{environmentSubtitle}</p>
        </div>
      </div>

      <div className="mt-5 space-y-4">
        <div className="space-y-2">
          <SectionLabel>Ambientes</SectionLabel>
          <div className="grid gap-2 px-1">
            {environmentItems.map((item) => (
              <EnvironmentItem
                active={item.matches(pathname)}
                disabled={item.disabled}
                disabledReason={item.disabledReason}
                key={`${item.label}:${item.to ?? 'indisponivel'}`}
                label={item.label}
                to={item.to}
              />
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <SectionLabel>{moduleSectionLabel}</SectionLabel>
          <nav className="grid gap-1">
            {moduleItems.map((item) => {
              const active = item.matches(pathname);

              return (
                <Link
                  className={cx(
                    'group flex min-h-[46px] items-center gap-2 rounded-[14px] px-2.5 py-1.5 text-[0.84rem] font-medium transition',
                    active
                      ? 'bg-[linear-gradient(135deg,rgba(31,103,255,0.92),rgba(47,126,255,0.92))] text-white shadow-[0_10px_20px_rgba(18,81,213,0.22)]'
                      : 'text-white/74 hover:bg-white/9 hover:text-white',
                  )}
                  key={`${item.label}:${item.to}`}
                  title={item.label}
                  to={item.to}
                >
                  <span
                    className={cx(
                      'inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[12px] border',
                      active
                        ? 'border-white/12 bg-white/14 text-white'
                        : 'border-white/10 bg-white/6 text-white/88',
                    )}
                  >
                    <UnifiedNavigationIconGlyph active={active} icon={item.icon} />
                  </span>
                  <span className="min-w-0 truncate">{item.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      <div className="mt-auto px-0.5">
        <div className="space-y-2.5 rounded-[16px] border border-white/10 bg-white/7 px-2 py-2">
          <div className="flex items-center gap-2">
            <div className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#f4b1c8,#ffffff)] text-[11px] font-semibold text-[color:var(--color-brand-navy)]">
              {userInitials}
            </div>
            <div className="min-w-0">
              <p className="truncate text-[0.76rem] font-semibold text-white">{userTitle}</p>
              <p className="truncate text-[0.64rem] text-white/58">{userSubtitle}</p>
            </div>
          </div>
          <button
            className="flex w-full items-center justify-between rounded-[12px] border border-white/14 bg-white/8 px-2.5 py-1.5 text-left text-[11px] font-medium text-white/88 transition hover:bg-white/12 hover:text-white"
            onClick={onSignOut}
            type="button"
          >
            <span>Encerrar sessão</span>
            <svg
              aria-hidden="true"
              className="h-3.5 w-3.5"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.8"
              viewBox="0 0 24 24"
            >
              <path d="M15 16.5 19.5 12 15 7.5" />
              <path d="M19 12H9" />
            </svg>
          </button>
        </div>
      </div>
    </aside>
  );
}
