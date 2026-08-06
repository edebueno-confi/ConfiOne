import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Link, useLocation, useNavigate } from 'react-router';
import { cx } from '../../components/ui';
import { GeniusLamp } from '../../components/GeniusLamp';
import { Avatar } from '../../components/Avatar';
import { ThemeToggle } from '../../components/ThemeToggle';
import { useAuthContext } from '../auth/auth-context';
import { SettingsNavIcon } from '../settings/settings-nav-icons';
import { GeniusGlobalSearch } from './GeniusGlobalSearch';
// A sidebar veste o mesmo sistema visual das telas de Configuracoes: a classe
// raiz `gso-ui` publica os tokens e o CSS abaixo aplica a linguagem nova.
import '../settings/settings-ui.css';
import {
  buildMinimalNavigation,
  resolveMinimalRouteLabel,
  type MinimalNavigationIcon,
  type MinimalNavigationPermissions,
} from './minimal-navigation';

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
  collapsed = false,
}: {
  onNavigate?: () => void;
  pathname: string;
  permissions: MinimalNavigationPermissions;
  collapsed?: boolean;
}) {
  const sections = useMemo(
    () => buildMinimalNavigation({ pathname, permissions }),
    [pathname, permissions],
  );

  const [collapsedSections, setCollapsedSections] = useState<Record<string, boolean>>(() => {
    try {
      return JSON.parse(window.localStorage.getItem('gso-shell-sections') ?? '{}') as Record<string, boolean>;
    } catch {
      return {};
    }
  });

  useEffect(() => {
    const activeSection = sections.find((section) => section.items.some((item) => item.matches(pathname)));
    if (!activeSection || collapsedSections[activeSection.id] !== true) return;
    setCollapsedSections((current) => ({ ...current, [activeSection.id]: false }));
  }, [sections, pathname, collapsedSections]);

  useEffect(() => {
    try {
      window.localStorage.setItem('gso-shell-sections', JSON.stringify(collapsedSections));
    } catch {
      // Preferência de navegação não bloqueia a aplicação.
    }
  }, [collapsedSections]);

  return (
    <nav aria-label="Navegação principal" className="space-y-5">
      {sections.map((section) => (
        <section key={section.id}>
          {!collapsed ? (
            <button
              aria-expanded={!collapsedSections[section.id]}
              className="gso-nav-group-toggle mb-1.5 flex min-h-8 w-full items-center justify-between gap-2 rounded-md px-2 text-left text-xs font-medium text-[color:var(--minimal-text-tertiary)] hover:bg-[color:var(--minimal-surface-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--minimal-focus)]"
              onClick={() => setCollapsedSections((current) => {
                const willOpen = current[section.id] !== false;
                return { ...current, [section.id]: !willOpen };
              })}
              type="button"
            >
              <span>{section.label}</span>
              <svg aria-hidden="true" className={cx('h-3.5 w-3.5 transition-transform', !collapsedSections[section.id] && 'rotate-180')} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6" /></svg>
            </button>
          ) : null}
          {(collapsed || !collapsedSections[section.id] || section.items.some((item) => item.matches(pathname))) ? <div className="space-y-0.5">
            {section.items.filter((item) => collapsed || !collapsedSections[section.id] || item.matches(pathname)).map((item) => {
              const active = item.matches(pathname);
              const linkClassName = cx(
                'gso-nav-link flex min-h-11 items-center gap-2.5 rounded-md px-2.5 text-sm transition-colors duration-150',
                collapsed && 'justify-center px-0',
                // Subitens de Configuracoes ficam recuados sob o rotulo do grupo.
                !collapsed && item.settingsSection && 'gso-nav-link--nested',
                'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--minimal-focus)]',
                active
                  ? 'gso-nav-link--active bg-[color:var(--minimal-selection)] font-medium text-[color:var(--minimal-selection-text)]'
                  : 'text-[color:var(--minimal-text-secondary)] hover:bg-[color:var(--minimal-surface-muted)] hover:text-[color:var(--minimal-text)]',
              );
              const linkContent = (
                <>
                  <span className="inline-flex h-5 w-5 items-center justify-center">
                    {/* Subitens de Configurações reaproveitam os ícones lineares
                        já desenhados para as seções da tela. */}
                    {item.settingsSection ? <SettingsNavIcon section={item.settingsSection} /> : <NavigationGlyph icon={item.icon} />}
                  </span>
                  {!collapsed ? <span className="truncate">{item.label}</span> : null}
                </>
              );

              // External entries leave the authenticated shell (public Help
              // Center), so they open in a new tab instead of routing.
              if (item.external) {
                return (
                  <a
                    className={linkClassName}
                    href={item.to}
                    key={item.id}
                    onClick={onNavigate}
                    rel="noreferrer"
                    target="_blank"
                    title={collapsed ? item.label : undefined}
                  >
                    {linkContent}
                  </a>
                );
              }

              return (
                <Link
                  aria-current={active ? 'page' : undefined}
                  className={linkClassName}
                  key={item.id}
                  onClick={onNavigate}
                  to={item.to}
                  title={collapsed ? item.label : undefined}
                >
                  {linkContent}
                </Link>
              );
            })}
          </div> : null}
        </section>
      ))}
    </nav>
  );
}

function SidebarIconButton({
  label,
  children,
  onClick,
}: {
  label: string;
  children: ReactNode;
  onClick?: () => void;
}) {
  return (
    <button
      aria-label={label}
      className="gso-sidebar-icon-button"
      onClick={onClick}
      title={label}
      type="button"
    >
      {children}
    </button>
  );
}

function GeniusSidebar({
  avatarUrl,
  collapsed,
  onCollapse,
  onNavigate,
  pathname,
  permissions,
  email,
  fullName,
  userTitle,
  userSubtitle,
  signOut,
}: {
  avatarUrl: string | null;
  collapsed: boolean;
  onCollapse: () => void;
  onNavigate?: () => void;
  pathname: string;
  permissions: MinimalNavigationPermissions;
  email: string | null;
  fullName: string | null;
  userTitle: string;
  userSubtitle: string;
  signOut: () => Promise<void>;
}) {
  const navigate = useNavigate();
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const accountMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!accountMenuOpen) return undefined;

    const closeOnOutsidePointer = (event: PointerEvent) => {
      const target = event.target;
      if (target instanceof Node && accountMenuRef.current?.contains(target)) return;
      setAccountMenuOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setAccountMenuOpen(false);
    };

    document.addEventListener('pointerdown', closeOnOutsidePointer);
    document.addEventListener('keydown', closeOnEscape);
    return () => {
      document.removeEventListener('pointerdown', closeOnOutsidePointer);
      document.removeEventListener('keydown', closeOnEscape);
    };
  }, [accountMenuOpen]);

  return (
    <aside
      aria-label="Navegação principal"
      className={cx('gso-ui gso-sidebar hidden shrink-0 lg:grid', collapsed ? 'gso-sidebar--collapsed' : 'gso-sidebar--open')}
      data-collapsed={collapsed}
    >
      <div className="gso-sidebar-header">
        <Link aria-label="GeniusOS" className="gso-brand-lockup" to="/">
          {!collapsed ? <span>Genius<span className="text-[color:var(--genius-site-pink)]">OS</span></span> : null}
        </Link>
        <SidebarIconButton label={collapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'} onClick={onCollapse}>
          <svg aria-hidden="true" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24"><path d={collapsed ? 'm9 6 6 6-6 6' : 'm15 6-6 6 6 6'} /></svg>
        </SidebarIconButton>
      </div>

      <div className="gso-sidebar-search">
        <GeniusGlobalSearch
          compact={collapsed}
          permissions={{
            isPlatformAdmin: permissions.isPlatformAdmin || (permissions.roles ?? []).includes('platform_admin'),
            screenKeys: permissions.screenKeys ?? [],
          }}
        />
      </div>

      <div className="gso-sidebar-nav">
        <ShellNavigation collapsed={collapsed} onNavigate={onNavigate} pathname={pathname} permissions={permissions} />
      </div>

      <div ref={accountMenuRef} className="gso-sidebar-account" data-collapsed={collapsed} data-menu-open={accountMenuOpen}>
        <div className="gso-sidebar-account-card">
          <button
            aria-expanded={accountMenuOpen}
            aria-haspopup="menu"
            className="gso-sidebar-account-trigger"
            onClick={() => setAccountMenuOpen((current) => !current)}
            title={collapsed ? `Abrir menu de ${userTitle}` : undefined}
            type="button"
          >
            <Avatar email={email} name={fullName} size="md" src={avatarUrl} label={`Perfil de ${userTitle}`} />
            {!collapsed ? <span className="gso-sidebar-account-identity"><strong>{userTitle}</strong><small>{userSubtitle}</small></span> : null}
            {!collapsed ? <svg aria-hidden="true" className={cx('gso-sidebar-chevron', accountMenuOpen && 'rotate-180')} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="m7 10 5 5 5-5" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" /></svg> : null}
          </button>
        </div>
        {accountMenuOpen ? <div className="gso-sidebar-account-menu" role="menu">
          <div className="gso-sidebar-menu-heading">
            <p className="gso-sidebar-menu-caption">Aparência e conta</p>
            <button aria-label="Fechar menu da conta" className="gso-sidebar-menu-close" onClick={() => setAccountMenuOpen(false)} type="button">×</button>
          </div>
          <ThemeToggle className="w-full justify-center" />
          {/* O chevron do rodape agora abre a conta de verdade: o proprio
              perfil, as preferencias e a saida da sessao. */}
          <button className="gso-sidebar-menu-action" onClick={() => { setAccountMenuOpen(false); navigate('/meu-perfil'); }} role="menuitem" type="button">Meu perfil</button>
          <button className="gso-sidebar-menu-action" onClick={() => navigate('/admin/settings')} role="menuitem" type="button">Preferências</button>
          <button className="gso-sidebar-menu-action gso-sidebar-menu-action--danger" onClick={() => void signOut()} role="menuitem" type="button">Encerrar sessão</button>
        </div> : null}
      </div>
    </aside>
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
  const { gate, signOut, user } = useAuthContext();
  const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false);
  const [accountMenuOpen, setAccountMenuOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      const stored = window.localStorage.getItem('gso-shell-sidebar-collapsed');
      if (stored !== null) return stored === 'true';
      return false;
    } catch {
      return false;
    }
  });
  const mobileCloseButtonRef = useRef<HTMLButtonElement>(null);
  const mobileMenuButtonRef = useRef<HTMLButtonElement>(null);
  // `profiles` e a fonte da verdade do nome e da foto: e o que a pessoa edita em
  // "Meu perfil". O metadado do Auth fica apenas como retaguarda para o
  // intervalo entre o login e a resolução do contexto.
  const fullName =
    String(gate.actor?.profile.full_name ?? user?.user_metadata?.full_name ?? '').trim() || null;
  const avatarUrl = gate.actor?.profile.avatar_url ?? null;
  const email = user?.email ?? null;
  const userTitle = fullName ?? email ?? 'Operador interno';
  const routeLabel = resolveMinimalRouteLabel(location.pathname);

  useEffect(() => {
    setMobileNavigationOpen(false);
    setAccountMenuOpen(false);
  }, [location.pathname]);

  useEffect(() => {
    if (!mobileNavigationOpen) return undefined;
    mobileCloseButtonRef.current?.focus();
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key !== 'Escape') return;
      setMobileNavigationOpen(false);
      mobileMenuButtonRef.current?.focus();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [mobileNavigationOpen]);

  useEffect(() => {
    try {
      window.localStorage.setItem('gso-shell-sidebar-collapsed', String(sidebarCollapsed));
    } catch {
      // Persistência local é apenas uma preferência de UX.
    }
  }, [sidebarCollapsed]);

  useEffect(() => {
    const handleKeyboardShortcut = (event: KeyboardEvent) => {
      if (!(event.ctrlKey || event.metaKey) || event.key.toLowerCase() !== 'b') {
        return;
      }

      const target = event.target as HTMLElement | null;
      if (target?.closest('input, textarea, select, [contenteditable="true"]')) {
        return;
      }

      event.preventDefault();
      setSidebarCollapsed((current) => !current);
    };

    document.addEventListener('keydown', handleKeyboardShortcut);
    return () => document.removeEventListener('keydown', handleKeyboardShortcut);
  }, []);

  return (
    <div className="gso-app-shell h-[var(--app-viewport-height)] min-h-0 overflow-hidden bg-[color:var(--minimal-canvas)] text-[color:var(--minimal-text)]">
      <a
        className="sr-only focus:not-sr-only focus:absolute focus:left-3 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-[color:var(--minimal-action)] focus:px-3 focus:py-2 focus:text-sm focus:font-medium focus:text-[color:var(--minimal-action-ink)]"
        href="#conteudo-principal"
      >
        Pular para o conteúdo
      </a>
      <div className="flex h-full min-h-0 gap-2 lg:p-2">
        <GeniusSidebar
          avatarUrl={avatarUrl}
          collapsed={sidebarCollapsed}
          email={email}
          fullName={fullName}
          onCollapse={() => setSidebarCollapsed((current) => !current)}
          pathname={location.pathname}
          permissions={permissions}
          signOut={signOut}
          userSubtitle={userSubtitle}
          userTitle={userTitle}
        />
        <aside className={cx(
          'gso-legacy-sidebar hidden h-full shrink-0',
          sidebarCollapsed ? 'w-[var(--shell-sidebar-collapsed)]' : 'w-[var(--shell-sidebar-width)]',
        )}>
          <div className={cx(
            'gso-sidebar-header flex h-[var(--shell-topbar-height)] shrink-0 items-center gap-1.5 px-2',
            sidebarCollapsed ? 'justify-center' : 'justify-between px-3',
          )}>
            <Link aria-label="GeniusOS" className={cx('gso-brand-lockup flex min-w-0 items-center gap-2 rounded-md text-sm font-semibold tracking-[-0.015em] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--minimal-focus)]', sidebarCollapsed ? 'shrink-0' : 'flex-1')} to="/">
              <GeniusLamp size="sm" />
              {!sidebarCollapsed ? <span>
                Genius<span className="text-[color:var(--genius-site-pink)]">OS</span>
              </span> : null}
            </Link>
            <div className={cx('gso-sidebar-search shrink-0', sidebarCollapsed ? 'w-8' : 'w-[142px]')}>
              <GeniusGlobalSearch
                compact={sidebarCollapsed}
                permissions={{
                  isPlatformAdmin: permissions.isPlatformAdmin || (permissions.roles ?? []).includes('platform_admin'),
                  screenKeys: permissions.screenKeys ?? [],
                }}
              />
            </div>
          </div>

          <div className={cx('min-h-0 flex-1 overflow-y-auto overscroll-contain py-4', sidebarCollapsed ? 'px-1.5' : 'px-2')}>
            <ShellNavigation collapsed={sidebarCollapsed} pathname={location.pathname} permissions={permissions} />
          </div>

          <div className={cx(
            'gso-sidebar-account shrink-0 border-t border-[color:var(--minimal-border)] p-3',
            sidebarCollapsed ? 'flex flex-col items-center gap-2 px-2' : 'space-y-2',
          )} data-collapsed={sidebarCollapsed}>
            <div className={cx('flex items-center gap-2.5', sidebarCollapsed ? 'justify-center' : 'min-w-0')}>
              <Avatar email={email} name={fullName} size={sidebarCollapsed ? 'sm' : 'md'} src={avatarUrl} label={`Perfil de ${userTitle}`} />
              {!sidebarCollapsed ? <div className="min-w-0 flex-1 leading-tight">
                <p className="truncate text-xs font-semibold text-[color:var(--minimal-text)]">{userTitle}</p>
                <p className="truncate text-[10px] text-[color:var(--minimal-text-tertiary)]">{userSubtitle}</p>
              </div> : null}
            </div>
            <button
              aria-label={sidebarCollapsed ? 'Abrir menu da conta' : 'Abrir opções da conta'}
              aria-expanded={accountMenuOpen}
              aria-haspopup="menu"
              className={cx(
                'gso-sidebar-account-trigger inline-flex min-h-8 items-center justify-center rounded-md text-[color:var(--minimal-text-tertiary)] hover:bg-[color:var(--minimal-surface-muted)] hover:text-[color:var(--minimal-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--minimal-focus)]',
                'h-8 w-8 px-0',
              )}
              onClick={() => setAccountMenuOpen((current) => !current)}
              type="button"
            >
              <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-1.8 1.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.5v.2h-2.6v-.2a1.7 1.7 0 0 0-1-1.5 1.7 1.7 0 0 0-1.9.3l-.1.1-1.8-1.8.1-.1A1.7 1.7 0 0 0 8 15a1.7 1.7 0 0 0-1.5-1H6.3v-2.6h.2a1.7 1.7 0 0 0 1.5-1 1.7 1.7 0 0 0-.3-1.9l-.1-.1 1.8-1.8.1.1a1.7 1.7 0 0 0 1.9.3 1.7 1.7 0 0 0 1-1.5v-.2H15v.2a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.9-.3l.1-.1 1.8 1.8-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.5 1h.2V14h-.2a1.7 1.7 0 0 0-1.5 1Z" /></svg>
              {!sidebarCollapsed ? <span className="sr-only">Opções da conta</span> : null}
            </button>
            {accountMenuOpen ? <div className="gso-sidebar-account-menu rounded-lg border border-[color:var(--minimal-border)] bg-[color:var(--minimal-surface)] p-2 shadow-lg" role="menu">
              <ThemeToggle className="w-full justify-center" />
              <Link className="gso-sidebar-menu-action mt-2 inline-flex min-h-9 w-full items-center justify-center rounded-md px-2.5 text-xs font-medium text-[color:var(--minimal-text-secondary)] hover:bg-[color:var(--minimal-surface-muted)] hover:text-[color:var(--minimal-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--minimal-focus)]" onClick={() => setAccountMenuOpen(false)} role="menuitem" to="/meu-perfil">Meu perfil</Link>
              <button aria-label="Encerrar sessão" className="gso-sidebar-signout mt-2 inline-flex min-h-9 w-full items-center justify-center gap-2 rounded-md px-2.5 text-xs font-medium text-[color:var(--minimal-text-secondary)] hover:bg-[color:var(--minimal-surface-muted)] hover:text-[color:var(--minimal-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--minimal-focus)]" onClick={() => void signOut()} role="menuitem" type="button">
                <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M14.5 7.5 19 12l-4.5 4.5M19 12H9M11 5H6.5A1.5 1.5 0 0 0 5 6.5v11A1.5 1.5 0 0 0 6.5 19H11" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" /></svg>
                <span>Encerrar sessão</span>
              </button>
            </div> : null}
          </div>

        </aside>

        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <header className="gso-topbar relative flex h-[var(--shell-topbar-height)] shrink-0 items-center gap-3 border-b border-[color:var(--minimal-border)] bg-[color:var(--minimal-surface)] px-3 sm:px-4">
            <button
              ref={mobileMenuButtonRef}
              aria-expanded={mobileNavigationOpen}
              aria-controls="gso-mobile-navigation"
              aria-label="Abrir navegação"
              className="inline-flex h-11 w-11 items-center justify-center rounded-md text-[color:var(--minimal-text-secondary)] hover:bg-[color:var(--minimal-surface-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--minimal-focus)] lg:hidden"
              onClick={() => setMobileNavigationOpen((current) => !current)}
              type="button"
            >
              <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" viewBox="0 0 24 24">
                <path d="M5 7h14M5 12h14M5 17h14" />
              </svg>
            </button>
            <button
              aria-label={sidebarCollapsed ? 'Expandir menu lateral' : 'Recolher menu lateral'}
              className="hidden h-11 w-11 items-center justify-center rounded-md text-[color:var(--minimal-text-secondary)] hover:bg-[color:var(--minimal-surface-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--minimal-focus)] lg:inline-flex"
              onClick={() => setSidebarCollapsed((current) => !current)}
              title="Atalho: Ctrl/Cmd+B"
              type="button"
            >
              <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24">
                <path d={sidebarCollapsed ? 'm10 6 6 6-6 6' : 'm14 6-6 6 6 6'} />
              </svg>
            </button>
            <p className="hidden max-w-[220px] truncate text-sm text-[color:var(--minimal-text-secondary)] lg:block">
              <span className="font-medium text-[color:var(--minimal-text)]">{routeLabel}</span>
            </p>
            {/* Busca global do Genio: centralizada no header, em todas as telas.
                Absoluta para ficar no centro otico independente da largura dos
                clusters da esquerda e da direita. */}
            <div className="pointer-events-none absolute left-1/2 top-1/2 hidden w-full max-w-xl -translate-x-1/2 -translate-y-1/2 justify-center px-4 md:flex">
              <div className="pointer-events-auto w-full">
                <GeniusGlobalSearch
                  permissions={{
                    isPlatformAdmin: permissions.isPlatformAdmin || (permissions.roles ?? []).includes('platform_admin'),
                    screenKeys: permissions.screenKeys ?? [],
                  }}
                />
              </div>
            </div>
            <div className="ml-auto flex items-center gap-2">
              <ThemeToggle />
              <div className="hidden items-center gap-2 border-l border-[color:var(--minimal-border)] pl-3 sm:flex">
                <Avatar email={email} name={fullName} size="sm" src={avatarUrl} label={`Perfil de ${userTitle}`} />
                <div className="max-w-[180px] leading-tight">
                  <p className="truncate text-xs font-medium text-[color:var(--minimal-text)]">{userTitle}</p>
                  <p className="truncate text-[10px] text-[color:var(--minimal-text-tertiary)]">{userSubtitle}</p>
                </div>
                <button aria-label="Encerrar sessão" className="inline-flex h-11 w-11 items-center justify-center rounded-md text-[color:var(--minimal-text-tertiary)] hover:bg-[color:var(--minimal-surface-muted)] hover:text-[color:var(--minimal-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--minimal-focus)]" onClick={() => void signOut()} type="button">
                  <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" viewBox="0 0 24 24"><path d="M14.5 7.5 19 12l-4.5 4.5M19 12H9M11 5H6.5A1.5 1.5 0 0 0 5 6.5v11A1.5 1.5 0 0 0 6.5 19H11" /></svg>
                </button>
              </div>
              <Avatar email={email} name={fullName} onClick={() => void signOut()} size="md" src={avatarUrl} label={`Encerrar sessão de ${userTitle}`} className="sm:hidden" />
            </div>
          </header>

          {mobileNavigationOpen ? (
            <div className="fixed inset-0 z-40 lg:hidden" id="gso-mobile-navigation">
              <button aria-label="Fechar navegação" className="absolute inset-0 bg-[color:var(--minimal-overlay)]" onClick={() => setMobileNavigationOpen(false)} type="button" />
              <aside aria-label="Menu principal mobile" aria-modal="true" className="gso-ui gso-sidebar-drawer relative flex h-full w-[min(19rem,86vw)] flex-col border-r border-[color:var(--minimal-border)] bg-[color:var(--minimal-sidebar)] shadow-[var(--minimal-drawer-shadow)]" role="dialog">
                <div className="flex h-14 items-center justify-between border-b border-[color:var(--minimal-border)] px-4">
                  <p className="flex items-center gap-2 text-sm font-semibold"><GeniusLamp size="sm" />Genius<span className="text-[color:var(--genius-site-pink)]">OS</span></p>
                  <button ref={mobileCloseButtonRef} aria-label="Fechar navegação" className="inline-flex h-11 w-11 items-center justify-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--minimal-focus)]" onClick={() => { setMobileNavigationOpen(false); mobileMenuButtonRef.current?.focus(); }} type="button">
                    <span aria-hidden="true">×</span>
                  </button>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto px-2 py-4">
                  <ShellNavigation onNavigate={() => setMobileNavigationOpen(false)} pathname={location.pathname} permissions={permissions} />
                </div>
                <div className="border-t border-[color:var(--minimal-border)] p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                  <div className="flex items-center gap-3">
                    <Avatar email={email} name={fullName} size="md" src={avatarUrl} />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-[color:var(--minimal-text)]">{userTitle}</p>
                      <p className="truncate text-xs text-[color:var(--minimal-text-tertiary)]">{userSubtitle}</p>
                    </div>
                    <button aria-label="Encerrar sessão" className="inline-flex h-11 w-11 items-center justify-center rounded-md text-[color:var(--minimal-text-tertiary)] hover:bg-[color:var(--minimal-surface-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--minimal-focus)]" onClick={() => void signOut()} type="button">
                      <span aria-hidden="true">↪</span>
                    </button>
                  </div>
                  <ThemeToggle className="mt-3 w-full justify-center" />
                </div>
              </aside>
            </div>
          ) : null}

          <main className="gso-main-canvas min-h-0 min-w-0 flex-1 overflow-hidden" id="conteudo-principal">{children}</main>
        </div>
      </div>
    </div>
  );
}
