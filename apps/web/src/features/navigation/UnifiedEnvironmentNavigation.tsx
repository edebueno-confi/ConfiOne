import type { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import mascotUrl from '../../../assets/brand/genius-mascot.svg';
import { cx } from '../../components/ui';

export type UnifiedNavigationIcon =
  | 'queue'
  | 'tickets'
  | 'customers'
  | 'engineering'
  | 'knowledge'
  | 'admin'
  | 'portal'
  | 'access'
  | 'system';

export interface UnifiedEnvironmentItem {
  label: string;
  to: string;
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

function SectionLabel({ children, collapsed }: { children: string; collapsed: boolean }) {
  if (collapsed) {
    return null;
  }

  return (
    <p className="px-2 text-[0.62rem] font-semibold uppercase tracking-[0.22em] text-white/42">
      {children}
    </p>
  );
}

function EnvironmentPill({
  collapsed,
  label,
  to,
  active,
}: {
  collapsed: boolean;
  label: string;
  to: string;
  active: boolean;
}) {
  const compactLabel = label.slice(0, 3).toUpperCase();

  return (
    <Link
      className={cx(
        'inline-flex min-h-9 items-center justify-center rounded-full border px-3 text-[0.72rem] font-semibold uppercase tracking-[0.16em] transition',
        collapsed ? 'w-full px-0' : '',
        active
          ? 'border-white/18 bg-white/15 text-white shadow-[0_10px_18px_rgba(9,20,56,0.18)]'
          : 'border-white/10 bg-white/6 text-white/64 hover:bg-white/10 hover:text-white',
      )}
      to={to}
    >
      {collapsed ? compactLabel : label}
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
  collapsed,
  pathname,
  environmentLabel,
  environmentDescription,
  environmentItems,
  moduleItems,
  userInitials,
  userTitle,
  userSubtitle,
  onSignOut,
  onToggle,
  className,
}: {
  collapsed: boolean;
  pathname: string;
  environmentLabel: string;
  environmentDescription: string;
  environmentItems: UnifiedEnvironmentItem[];
  moduleItems: UnifiedModuleItem[];
  userInitials: string;
  userTitle: string;
  userSubtitle: string;
  onSignOut: () => void;
  onToggle?: () => void;
  className?: string;
}) {
  return (
    <aside
      className={cx(
        'flex h-full flex-col rounded-[24px] border border-[rgba(255,255,255,0.08)] bg-[linear-gradient(180deg,#06173f_0%,#082058_52%,#0b2a68_100%)] text-white shadow-[0_24px_52px_rgba(9,20,56,0.24)] transition-[width,padding] duration-200',
        collapsed ? 'w-[84px] px-2.5 py-3' : 'w-[224px] px-3 py-4',
        className,
      )}
    >
      <div className={cx('flex items-start gap-2 px-1', collapsed && 'justify-center')}>
        <div className={cx('flex min-w-0 items-center gap-3', collapsed && 'justify-center')}>
          <img alt="Mascote Genius" className="w-9 shrink-0" src={mascotUrl} />
          {!collapsed ? (
            <div className="min-w-0 pt-0.5">
              <p className="text-[0.6rem] font-semibold uppercase tracking-[0.22em] text-white/46">
                Genius Support OS
              </p>
              <h1 className="mt-1 text-[0.96rem] font-semibold leading-tight tracking-[-0.04em] text-white">
                {environmentLabel}
              </h1>
              <p className="mt-1 text-[0.68rem] leading-4 text-white/56">{environmentDescription}</p>
            </div>
          ) : null}
        </div>
        {onToggle ? (
          <button
            aria-label={collapsed ? 'Expandir menu' : 'Recolher menu'}
            className={cx(
              'mt-0.5 inline-flex min-h-8 shrink-0 items-center justify-center rounded-full border border-white/18 bg-[rgba(255,255,255,0.14)] px-2 text-white transition hover:bg-[rgba(255,255,255,0.2)]',
              collapsed ? 'w-8 px-0' : 'ml-auto',
            )}
            onClick={onToggle}
            title={collapsed ? 'Expandir menu' : 'Recolher menu'}
            type="button"
          >
            <svg
              aria-hidden="true"
              className={cx('h-3.5 w-3.5', !collapsed && 'rotate-180')}
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path d="m9 18 6-6-6-6" />
            </svg>
          </button>
        ) : null}
      </div>

      <div className="mt-5 space-y-4">
        <div className="space-y-2">
          <SectionLabel collapsed={collapsed}>Ambientes</SectionLabel>
          <div className={cx('grid gap-2', collapsed ? 'px-0.5' : 'px-1')}>
            {environmentItems.map((item) => (
              <EnvironmentPill
                active={item.matches(pathname)}
                collapsed={collapsed}
                key={`${item.label}:${item.to}`}
                label={item.label}
                to={item.to}
              />
            ))}
          </div>
        </div>

        <div className="space-y-2">
          <SectionLabel collapsed={collapsed}>Operação</SectionLabel>
          <nav className="grid gap-1">
            {moduleItems.map((item) => {
              const active = item.matches(pathname);

              return (
                <Link
                  className={cx(
                    'group flex min-h-[46px] items-center gap-2 rounded-[14px] px-2.5 py-1.5 text-[0.84rem] font-medium transition',
                    collapsed ? 'justify-center px-0' : '',
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
                  {!collapsed ? <span className="min-w-0 truncate">{item.label}</span> : null}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      <div className="mt-auto px-0.5">
        <div className={cx('rounded-[16px] border border-white/10 bg-white/7 px-2 py-2', collapsed ? 'flex justify-center' : 'space-y-2.5')}>
          <div className={cx('flex items-center', collapsed ? 'justify-center' : 'gap-2')}>
            <div className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#f4b1c8,#ffffff)] text-[11px] font-semibold text-[color:var(--color-brand-navy)]">
              {userInitials}
            </div>
            {!collapsed ? (
              <div className="min-w-0">
                <p className="truncate text-[0.76rem] font-semibold text-white">{userTitle}</p>
                <p className="truncate text-[0.64rem] text-white/58">{userSubtitle}</p>
              </div>
            ) : null}
          </div>
          {!collapsed ? (
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
          ) : (
            <button
              aria-label="Encerrar sessão"
              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/5 text-white/82 transition hover:bg-white/10 hover:text-white"
              onClick={onSignOut}
              title="Encerrar sessão"
              type="button"
            >
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
                <path d="M12 5H6.75A1.75 1.75 0 0 0 5 6.75v10.5A1.75 1.75 0 0 0 6.75 19H12" />
              </svg>
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
