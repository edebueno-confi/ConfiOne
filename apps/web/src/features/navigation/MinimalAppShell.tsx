import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { cx } from '../../components/ui';
import { GeniusMascot } from '../../components/GeniusMascot';
import { ThemeToggle } from '../../components/ThemeToggle';
import { useAuthContext } from '../auth/auth-context';
import {
  buildMinimalNavigation,
  resolveMinimalRouteLabel,
  type MinimalNavigationIcon,
  type MinimalNavigationPermissions,
} from './minimal-navigation';

function getInitials(fullName: string | null, email: string | null) {
  return String(fullName ?? email ?? 'GS')
    .trim()
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

function NavigationGlyph({ icon }: { icon: MinimalNavigationIcon }) {
  const paths: Record<MinimalNavigationIcon, ReactNode> = {
    inbox: <path d="M4.5 6.5h15v11h-15zM4.5 13h4l1.5 2h4l1.5-2h4" />,
    ticket: <path d="M6 5.5h12v4a2.5 2.5 0 0 0 0 5v4H6v-4a2.5 2.5 0 0 0 0-5zM12 8v8" />,
    users: <path d="M12 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6ZM6.5 19a5.5 5.5 0 0 1 11 0" />,
    workflow: <path d="M6 6h5v5H6zM13 13h5v5h-5zM11 8.5h4a2 2 0 0 1 2 2V13M8.5 11v3a2 2 0 0 0 2 2H13" />,
    engineering: <path d="m6 18 3.5-1 8-8a2 2 0 0 0-2.8-2.8l-8 8zM13.5 7.5l3 3" />,
    shield: <path d="M12 4.5 18 7v4.5c0 3.6-2.4 6.8-6 8-3.6-1.2-6-4.4-6-8V7zM9.5 12l1.6 1.6 3.6-3.6" />,
    book: <path d="M5.5 5.5h9a3 3 0 0 1 3 3v10h-9a3 3 0 0 0-3 1zM5.5 5.5v14" />,
    settings: <path d="M12 8.5a3.5 3.5 0 1 0 0 7 3.5 3.5 0 0 0 0-7ZM12 4.5v2M12 17.5v2M4.5 12h2M17.5 12h2M6.7 6.7l1.4 1.4M15.9 15.9l1.4 1.4M17.3 6.7l-1.4 1.4M8.1 15.9l-1.4 1.4" />,
    document: <path d="M7 4.5h7l3 3v12H7zM14 4.5v3h3M9.5 12h5M9.5 15h5" />,
  };

  return (
    <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" viewBox="0 0 24 24">
      {paths[icon]}
    </svg>
  );
}

function ShellNavigation({
  onNavigate,
  pathname,
  permissions,
}: {
  onNavigate?: () => void;
  pathname: string;
  permissions: MinimalNavigationPermissions;
}) {
  const sections = useMemo(
    () => buildMinimalNavigation({ pathname, permissions }),
    [pathname, permissions],
  );

  return (
    <nav aria-label="Navegação principal" className="space-y-5">
      {sections.map((section) => (
        <section key={section.id}>
          <h2 className="mb-1.5 px-2 text-xs font-medium text-[color:var(--minimal-text-tertiary)]">
            {section.label}
          </h2>
          <div className="space-y-0.5">
            {section.items.map((item) => {
              const active = item.matches(pathname);

              return (
                <Link
                  aria-current={active ? 'page' : undefined}
                  className={cx(
                    'flex min-h-9 items-center gap-2.5 rounded-md px-2.5 text-sm transition-colors duration-150',
                    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--minimal-focus)]',
                    active
                      ? 'bg-[color:var(--minimal-selection)] font-medium text-[color:var(--minimal-selection-text)]'
                      : 'text-[color:var(--minimal-text-secondary)] hover:bg-[color:var(--minimal-surface-muted)] hover:text-[color:var(--minimal-text)]',
                  )}
                  key={item.id}
                  onClick={onNavigate}
                  to={item.to}
                >
                  <span className="inline-flex h-5 w-5 items-center justify-center">
                    <NavigationGlyph icon={item.icon} />
                  </span>
                  <span className="truncate">{item.label}</span>
                </Link>
              );
            })}
          </div>
        </section>
      ))}
    </nav>
  );
}

export function MinimalAppShell({
  children,
  permissions,
  userSubtitle,
}: {
  children: ReactNode;
  permissions: MinimalNavigationPermissions;
  userSubtitle: string;
}) {
  const location = useLocation();
  const { signOut, user } = useAuthContext();
  const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false);
  const fullName = String(user?.user_metadata?.full_name ?? '').trim() || null;
  const email = user?.email ?? null;
  const userTitle = fullName ?? email ?? 'Operador interno';
  const initials = getInitials(fullName, email) || 'GS';
  const routeLabel = resolveMinimalRouteLabel(location.pathname);

  useEffect(() => {
    setMobileNavigationOpen(false);
  }, [location.pathname]);

  return (
    <div className="h-[var(--app-viewport-height)] min-h-0 overflow-hidden bg-[color:var(--minimal-canvas)] text-[color:var(--minimal-text)]">
      <a
        className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-[color:var(--minimal-action)] focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-[color:var(--minimal-action-ink)]"
        href="#conteudo-principal"
      >
        Pular para o conteúdo
      </a>
      <div className="flex h-full min-h-0">
        <aside className="hidden h-full w-[232px] shrink-0 border-r border-[color:var(--minimal-border)] bg-[color:var(--minimal-sidebar)] lg:flex lg:flex-col">
          <div className="flex h-14 shrink-0 items-center border-b border-[color:var(--minimal-border)] px-4">
            <Link className="flex items-center gap-2 rounded-md text-sm font-semibold tracking-[-0.015em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--minimal-focus)]" to="/">
              <GeniusMascot size="sm" />
              <span>
                Genius<span className="text-[color:var(--genius-site-pink)]">OS</span>
              </span>
            </Link>
          </div>

          <div className="min-h-0 flex-1 overflow-y-auto px-2 py-4">
            <ShellNavigation pathname={location.pathname} permissions={permissions} />
          </div>

        </aside>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <header className="flex h-14 shrink-0 items-center gap-3 border-b border-[color:var(--minimal-border)] bg-[color:var(--minimal-surface)] px-3 sm:px-4">
            <button
              aria-expanded={mobileNavigationOpen}
              aria-label="Abrir navegação"
              className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[color:var(--minimal-text-secondary)] hover:bg-[color:var(--minimal-surface-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--minimal-focus)] lg:hidden"
              onClick={() => setMobileNavigationOpen((current) => !current)}
              type="button"
            >
              <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" viewBox="0 0 24 24">
                <path d="M5 7h14M5 12h14M5 17h14" />
              </svg>
            </button>
            <p className="truncate text-sm text-[color:var(--minimal-text-secondary)]">
              <span className="hidden text-[color:var(--minimal-text-tertiary)] sm:inline">
                GeniusOS&nbsp;&nbsp;/&nbsp;&nbsp;
              </span>
              <span className="font-medium text-[color:var(--minimal-text)]">{routeLabel}</span>
            </p>
            <div className="ml-auto flex items-center gap-2">
              <ThemeToggle />
              <div className="hidden items-center gap-2 border-l border-[color:var(--minimal-border)] pl-3 sm:flex">
                <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-[color:var(--minimal-selection)] text-[11px] font-semibold text-[color:var(--minimal-selection-text)]" title={userTitle}>{initials}</span>
                <div className="max-w-[180px] leading-tight">
                  <p className="truncate text-xs font-medium text-[color:var(--minimal-text)]">{userTitle}</p>
                  <p className="truncate text-[10px] text-[color:var(--minimal-text-tertiary)]">{userSubtitle}</p>
                </div>
                <button aria-label="Encerrar sessão" className="inline-flex h-8 w-8 items-center justify-center rounded-md text-[color:var(--minimal-text-tertiary)] hover:bg-[color:var(--minimal-surface-muted)] hover:text-[color:var(--minimal-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--minimal-focus)]" onClick={() => void signOut()} type="button">
                  <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M14.5 7.5 19 12l-4.5 4.5M19 12H9M11 5H6.5A1.5 1.5 0 0 0 5 6.5v11A1.5 1.5 0 0 0 6.5 19H11" /></svg>
                </button>
              </div>
              <button aria-label={`Encerrar sessão de ${userTitle}`} className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-[color:var(--minimal-selection)] text-[11px] font-semibold text-[color:var(--minimal-selection-text)] sm:hidden" onClick={() => void signOut()} type="button">{initials}</button>
            </div>
          </header>

          {mobileNavigationOpen ? (
            <div className="fixed inset-0 z-40 lg:hidden">
              <button aria-label="Fechar navegação" className="absolute inset-0 bg-[color:var(--minimal-overlay)]" onClick={() => setMobileNavigationOpen(false)} type="button" />
              <aside className="relative flex h-full w-[min(19rem,86vw)] flex-col border-r border-[color:var(--minimal-border)] bg-[color:var(--minimal-sidebar)] shadow-[var(--minimal-drawer-shadow)]">
                <div className="flex h-14 items-center justify-between border-b border-[color:var(--minimal-border)] px-4">
                  <p className="flex items-center gap-2 text-sm font-semibold"><GeniusMascot size="sm" />Genius<span className="text-[color:var(--genius-site-pink)]">OS</span></p>
                  <button aria-label="Fechar navegação" className="inline-flex h-8 w-8 items-center justify-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--minimal-focus)]" onClick={() => setMobileNavigationOpen(false)} type="button">
                    <span aria-hidden="true">×</span>
                  </button>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto px-2 py-4">
                  <ShellNavigation onNavigate={() => setMobileNavigationOpen(false)} pathname={location.pathname} permissions={permissions} />
                </div>
              </aside>
            </div>
          ) : null}

          <main className="min-h-0 min-w-0 flex-1 overflow-hidden" id="conteudo-principal">{children}</main>
        </div>
      </div>
    </div>
  );
}
