import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
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
  resolveMinimalBreadcrumb,
  type MinimalBreadcrumbSegment,
  type MinimalNavigationIcon,
  type MinimalNavigationItem,
  type MinimalNavigationPermissions,
} from './minimal-navigation';

type NavigationSection = ReturnType<typeof buildMinimalNavigation>[number];

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
    <svg aria-hidden="true" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" viewBox="0 0 24 24">
      {paths[icon]}
    </svg>
  );
}

function SidebarNavigationLink({
  collapsed = false,
  item,
  onNavigate,
}: {
  collapsed?: boolean;
  item: MinimalNavigationItem;
  onNavigate?: () => void;
}) {
  const location = useLocation();
  const active = item.matches(location.pathname);
  const linkClassName = cx(
    'gso-nav-link flex min-h-11 items-center gap-2.5 rounded-md px-2.5 text-sm transition-colors duration-150',
    collapsed && 'justify-center px-0',
    !collapsed && item.settingsSection && 'gso-nav-link--nested',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--minimal-focus)]',
    active
      ? 'gso-nav-link--active bg-[color:var(--minimal-selection)] font-medium text-[color:var(--minimal-selection-text)]'
      : 'text-[color:var(--minimal-text-secondary)] hover:bg-[color:var(--minimal-surface-muted)] hover:text-[color:var(--minimal-text)]',
  );
  const linkContent = (
    <>
      <span className="inline-flex h-[18px] w-[18px] items-center justify-center">
        {item.settingsSection ? <SettingsNavIcon section={item.settingsSection} /> : <NavigationGlyph icon={item.icon} />}
      </span>
      {!collapsed ? <span className="truncate">{item.label}</span> : null}
    </>
  );

  if (item.external) {
    return <a className={linkClassName} href={item.to} onClick={onNavigate} rel="noreferrer" target="_blank" title={collapsed ? item.label : undefined}>{linkContent}</a>;
  }

  return <Link aria-current={active ? 'page' : undefined} className={linkClassName} onClick={onNavigate} to={item.to} title={collapsed ? item.label : undefined}>{linkContent}</Link>;
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
  const [openFlyoutSectionId, setOpenFlyoutSectionId] = useState<string | null>(null);
  const [flyoutAnchor, setFlyoutAnchor] = useState({ top: 80, left: 64 });
  const flyoutRef = useRef<HTMLElement>(null);
  const flyoutTriggerRef = useRef<HTMLButtonElement>(null);
  const flyoutCloseTimerRef = useRef<number | null>(null);

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

  useEffect(() => {
    if (!collapsed) setOpenFlyoutSectionId(null);
  }, [collapsed]);

  const cancelFlyoutClose = useCallback(() => {
    if (flyoutCloseTimerRef.current !== null) {
      window.clearTimeout(flyoutCloseTimerRef.current);
      flyoutCloseTimerRef.current = null;
    }
  }, []);

  const closeFlyout = useCallback((restoreFocus = true) => {
    cancelFlyoutClose();
    setOpenFlyoutSectionId(null);
    if (restoreFocus) {
      window.requestAnimationFrame(() => flyoutTriggerRef.current?.focus());
    }
  }, [cancelFlyoutClose]);

  const scheduleFlyoutClose = useCallback(() => {
    cancelFlyoutClose();
    flyoutCloseTimerRef.current = window.setTimeout(() => closeFlyout(false), 350);
  }, [cancelFlyoutClose, closeFlyout]);

  const openFlyoutForSection = useCallback((section: NavigationSection, target: HTMLButtonElement) => {
    cancelFlyoutClose();
    flyoutTriggerRef.current = target;
    const triggerBounds = target.getBoundingClientRect();
    setFlyoutAnchor({
      top: Math.max(8, Math.min(triggerBounds.top, window.innerHeight - 280)),
      left: triggerBounds.right,
    });
    setOpenFlyoutSectionId(section.id);
  }, [cancelFlyoutClose]);

  useEffect(() => () => cancelFlyoutClose(), [cancelFlyoutClose]);

  useEffect(() => {
    if (!openFlyoutSectionId) return undefined;

    const focusableSelector = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';
    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target;
      if (target instanceof Node && (flyoutRef.current?.contains(target) || flyoutTriggerRef.current?.contains(target))) return;
      closeFlyout();
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        closeFlyout();
        return;
      }
    };

    document.addEventListener('pointerdown', handlePointerDown);
    document.addEventListener('keydown', handleKeyDown);
    return () => {
      document.removeEventListener('pointerdown', handlePointerDown);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [closeFlyout, openFlyoutSectionId]);

  const openFlyoutSection = sections.find((section) => section.id === openFlyoutSectionId) ?? null;

  return (
    <nav aria-label="Navegação principal" className="gso-sidebar-navigation">
      {sections.map((section) => {
        const sectionActive = section.items.some((item) => item.matches(pathname));
        return (
        <section className={cx('gso-nav-section', collapsed && 'gso-nav-section--collapsed', sectionActive && 'gso-nav-section--active')} key={section.id}>
          {collapsed ? (
            <button
              aria-controls={`gso-nav-flyout-${section.id}`}
              aria-expanded={openFlyoutSectionId === section.id}
              aria-haspopup="dialog"
              className={cx(
                'gso-nav-group-rail-button',
                sectionActive && 'gso-nav-group-rail-button--active',
              )}
              onClick={(event) => {
                openFlyoutForSection(section, event.currentTarget);
              }}
              onMouseEnter={(event) => openFlyoutForSection(section, event.currentTarget)}
              onMouseLeave={scheduleFlyoutClose}
              title={section.label}
              type="button"
            >
              <span aria-hidden="true">
                <NavigationGlyph icon={(section.items.find((item) => item.matches(pathname)) ?? section.items[0]).icon} />
              </span>
              <span className="sr-only">Abrir {section.label}</span>
            </button>
          ) : (
            <button
              aria-expanded={!collapsedSections[section.id]}
              className="gso-nav-group-toggle flex min-h-8 w-full items-center justify-between gap-2 rounded-md px-2 text-left text-xs font-medium text-[color:var(--minimal-text-tertiary)] hover:bg-[color:var(--minimal-surface-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--minimal-focus)]"
              onClick={() => setCollapsedSections((current) => {
                const willOpen = current[section.id] !== false;
                return { ...current, [section.id]: !willOpen };
              })}
              type="button"
            >
              <span>{section.label}</span>
              <svg aria-hidden="true" className={cx('h-3.5 w-3.5 transition-transform', !collapsedSections[section.id] && 'rotate-180')} fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" viewBox="0 0 24 24"><path d="m6 9 6 6 6-6" /></svg>
            </button>
          )}
          {!collapsed && (!collapsedSections[section.id] || sectionActive) ? <div className="gso-nav-section-items">
            {section.items.filter((item) => !collapsedSections[section.id] || item.matches(pathname)).map((item) => (
              <SidebarNavigationLink item={item} key={item.id} onNavigate={onNavigate} />
            ))}
          </div> : null}
        </section>
        );
      })}
      {collapsed && openFlyoutSection ? (
        <>
          <div aria-hidden="true" className="gso-nav-flyout-scrim" />
          <aside
            aria-label={`Submenu ${openFlyoutSection.label}`}
            aria-modal="false"
            className="gso-nav-flyout z-[80]"
            id={`gso-nav-flyout-${openFlyoutSection.id}`}
            ref={flyoutRef}
            role="region"
            style={{ top: flyoutAnchor.top, left: flyoutAnchor.left }}
            onMouseEnter={cancelFlyoutClose}
            onMouseLeave={scheduleFlyoutClose}
          >
            <div className="gso-nav-flyout-heading flex items-center justify-between px-3 py-2 border-b border-[color:var(--minimal-border,#22324D)] bg-[color:var(--minimal-surface-muted,#18263F)]">
              <p className="text-xs font-bold uppercase tracking-wider text-[color:var(--gso-brand-pink,#FF4FA3)]">{openFlyoutSection.label}</p>
              <button aria-label={`Fechar submenu ${openFlyoutSection.label}`} className="text-xs text-[color:var(--minimal-text-tertiary)] hover:text-[color:var(--minimal-text)]" onClick={() => closeFlyout()} type="button">✕</button>
            </div>
            <div className="gso-nav-flyout-items p-1.5 grid gap-1">
              {openFlyoutSection.items.map((item) => (
                <SidebarNavigationLink item={item} key={item.id} onNavigate={closeFlyout} />
              ))}
            </div>
          </aside>
        </>
      ) : null}
    </nav>
  );
}

/**
 * Identidade do usuario no rodape da barra lateral.
 *
 * Decisao de produto 2026-08-10: o menu do usuario saiu do Global Header e
 * passou a ser o rodape da sidebar. O header concentra contexto (trilha) e
 * busca; a sidebar concentra marca, navegacao e identidade. Nao existem os
 * dois — a identidade tem um unico lugar.
 *
 * O popover e renderizado em portal porque `.gso-sidebar` declara
 * `isolation: isolate`: um filho posicionado nao consegue subir acima do
 * conteudo apenas por z-index.
 */
function SidebarAccount({
  collapsed,
  email,
  fullName,
  onOpenPreferences,
  signOut,
  userSubtitle,
  userTitle,
}: {
  collapsed: boolean;
  email: string | null;
  fullName: string | null;
  onOpenPreferences: () => void;
  signOut: () => Promise<void>;
  userSubtitle: string;
  userTitle: string;
}) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const [anchor, setAnchor] = useState<{ left: number; bottom: number } | null>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const closeMenu = useCallback(() => {
    setOpen(false);
    triggerRef.current?.focus();
  }, []);

  const toggleMenu = useCallback(() => {
    setOpen((current) => {
      if (current) {
        return false;
      }

      const rect = triggerRef.current?.getBoundingClientRect();
      if (rect) {
        setAnchor({ left: rect.left, bottom: window.innerHeight - rect.top + 8 });
      }

      return true;
    });
  }, []);

  useEffect(() => {
    if (!open) {
      return undefined;
    }

    const closeOnOutsidePointer = (event: PointerEvent) => {
      if (!(event.target instanceof Node)) {
        return;
      }
      if (menuRef.current?.contains(event.target) || triggerRef.current?.contains(event.target)) {
        return;
      }
      setOpen(false);
    };
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeMenu();
      }
    };

    // O popover e ancorado por coordenada calculada no clique; se a janela
    // mudar de tamanho ou rolar, a ancora deixa de valer.
    const closeOnViewportChange = () => setOpen(false);

    document.addEventListener('pointerdown', closeOnOutsidePointer);
    document.addEventListener('keydown', closeOnEscape);
    window.addEventListener('resize', closeOnViewportChange);

    return () => {
      document.removeEventListener('pointerdown', closeOnOutsidePointer);
      document.removeEventListener('keydown', closeOnEscape);
      window.removeEventListener('resize', closeOnViewportChange);
    };
  }, [closeMenu, open]);

  const menuItemClass =
    'flex h-[36px] w-full items-center gap-2.5 rounded-[6px] px-2.5 text-left text-xs text-[color:var(--one-text-primary)] hover:bg-[color:var(--one-surface-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--one-border-focus)] transition-colors';

  return (
    <>
      <button
        ref={triggerRef}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={`Menu de ${userTitle}`}
        className={cx(
          'gso-sidebar-account-trigger flex w-full items-center rounded-[7px] text-left transition-colors',
          'hover:bg-[color:var(--one-surface-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--one-border-focus)]',
          collapsed ? 'justify-center px-0 py-1.5' : 'gap-2.5 px-2 py-1.5',
        )}
        onClick={toggleMenu}
        title={collapsed ? `${userTitle} — ${userSubtitle}` : undefined}
        type="button"
      >
        <Avatar email={email} name={fullName} size="sm" label={`Perfil de ${userTitle}`} />
        {collapsed ? null : (
          <>
            <span className="grid min-w-0 flex-1 leading-tight">
              <span className="truncate text-xs font-semibold text-[color:var(--one-text-primary)]">{userTitle}</span>
              <span className="truncate text-[10px] text-[color:var(--one-text-secondary)]">{userSubtitle}</span>
            </span>
            <svg
              aria-hidden="true"
              className={cx(
                'h-3.5 w-3.5 shrink-0 text-[color:var(--one-text-secondary)] transition-transform',
                open && 'rotate-180',
              )}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path d="m7 10 5 5 5-5" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" />
            </svg>
          </>
        )}
      </button>

      {open && anchor
        ? createPortal(
            <div
              ref={menuRef}
              className="gso-sidebar-account-portal fixed w-[280px] border border-[color:var(--one-border-strong)] bg-[color:var(--one-panel-bg)] p-2 text-xs text-[color:var(--one-text-primary)]"
              role="menu"
              style={{ left: anchor.left, bottom: anchor.bottom }}
            >
              <div className="flex items-center gap-2.5 border-b border-[color:var(--one-border-default)] p-2.5 pb-3">
                <Avatar email={email} name={fullName} size="md" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-[color:var(--one-text-primary)]">{userTitle}</p>
                  {email ? (
                    <p className="truncate text-[11px] text-[color:var(--one-text-secondary)]">{email}</p>
                  ) : null}
                  <span className="mt-1 inline-block rounded border border-[color:var(--one-border-default)] bg-[color:var(--one-panel-elevated-bg)] px-1.5 py-0.5 text-[10px] font-medium text-[color:var(--one-text-secondary)]">
                    {userSubtitle}
                  </span>
                </div>
              </div>

              <div className="space-y-0.5 py-1.5">
                <button
                  className={menuItemClass}
                  onClick={() => {
                    setOpen(false);
                    navigate('/meu-perfil');
                  }}
                  role="menuitem"
                  type="button"
                >
                  <svg className="h-4 w-4 text-[color:var(--one-text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" /></svg>
                  <span>Meu perfil</span>
                </button>

                <button
                  className={menuItemClass}
                  onClick={() => {
                    setOpen(false);
                    onOpenPreferences();
                  }}
                  role="menuitem"
                  type="button"
                >
                  <svg className="h-4 w-4 text-[color:var(--one-text-secondary)]" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" /><circle cx="12" cy="12" r="3" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" /></svg>
                  <span>Preferências</span>
                </button>
              </div>

              <div className="my-1 border-t border-[color:var(--one-border-default)]" />

              <button
                className={cx(menuItemClass, 'text-[color:var(--one-danger)]')}
                onClick={() => {
                  setOpen(false);
                  void signOut();
                }}
                role="menuitem"
                type="button"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" /></svg>
                <span>Sair da plataforma</span>
              </button>
            </div>,
            document.body,
          )
        : null}
    </>
  );
}

function GeniusSidebar({
  collapsed,
  email,
  fullName,
  onCollapse,
  onNavigate,
  onOpenPreferences,
  pathname,
  permissions,
  signOut,
  userSubtitle,
  userTitle,
}: {
  collapsed: boolean;
  email: string | null;
  fullName: string | null;
  onCollapse: () => void;
  onNavigate?: () => void;
  onOpenPreferences: () => void;
  pathname: string;
  permissions: MinimalNavigationPermissions;
  signOut: () => Promise<void>;
  userSubtitle: string;
  userTitle: string;
}) {
  return (
    <aside
      aria-label="Navegação principal"
      className={cx('gso-ui gso-sidebar hidden shrink-0 lg:grid', collapsed ? 'gso-sidebar--collapsed' : 'gso-sidebar--open')}
      data-collapsed={collapsed}
    >
      <div className="gso-sidebar-header flex h-[52px] items-center justify-between px-3.5 border-b border-[color:var(--one-border-default,#22324D)] bg-[color:var(--one-shell-bg,#0F1A2E)]">
        {collapsed ? (
          <button
            aria-label="Expandir menu lateral"
            className="flex h-8 w-8 items-center justify-center rounded-[7px] border border-[color:var(--one-border-default,#22324D)] bg-transparent text-[color:var(--one-text-secondary,#A6B2C7)] hover:border-[color:var(--one-border-strong,#2F4869)] hover:bg-[color:var(--one-surface-2,#18263F)] hover:text-[color:var(--one-text-primary,#E6ECF5)] transition-colors"
            onClick={onCollapse}
            title="Expandir menu (Ctrl+B)"
            type="button"
          >
            <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24">
              <path d="m9 6 6 6-6 6" />
            </svg>
          </button>
        ) : (
          <>
            <Link aria-label="Confi One" className="gso-brand-lockup flex items-center gap-2.5 text-base font-bold tracking-tight text-[color:var(--one-text-primary,#E6ECF5)]" to="/">
              <GeniusLamp animated={false} size="sm" />
              <span>Confi <span className="text-[color:var(--one-genius-pink,#FF4FA3)]">One</span></span>
            </Link>
            <button
              aria-label="Recolher menu lateral"
              className="flex h-8 w-8 items-center justify-center rounded-[7px] border border-[color:var(--one-border-default,#22324D)] bg-transparent text-[color:var(--one-text-secondary,#A6B2C7)] hover:border-[color:var(--one-border-strong,#2F4869)] hover:bg-[color:var(--one-surface-2,#18263F)] hover:text-[color:var(--one-text-primary,#E6ECF5)] transition-colors"
              onClick={onCollapse}
              title="Recolher menu (Ctrl+B)"
              type="button"
            >
              <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24">
                <path d="m15 6-6 6 6 6" />
              </svg>
            </button>
          </>
        )}
      </div>

      <div className="gso-sidebar-nav">
        <ShellNavigation collapsed={collapsed} onNavigate={onNavigate} pathname={pathname} permissions={permissions} />
      </div>

      {/* Rodape semantico: identidade do usuario. O divisor decorativo que
          existia aqui separava nada — o rodape estava vazio. */}
      <div className={cx('gso-sidebar-footer', collapsed ? 'px-1 pb-2 pt-1' : 'px-2 pb-2 pt-1')}>
        <SidebarAccount
          collapsed={collapsed}
          email={email}
          fullName={fullName}
          onOpenPreferences={onOpenPreferences}
          signOut={signOut}
          userSubtitle={userSubtitle}
          userTitle={userTitle}
        />
      </div>
    </aside>
  );
}

function PreferencesModal({
  isOpen,
  onClose,
}: {
  isOpen: boolean;
  onClose: () => void;
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/56" onClick={onClose} />
      <div
        aria-label="Preferências do usuário"
        aria-modal="true"
        className="relative w-full max-w-md rounded-[12px] border border-[color:var(--one-border-default,#22324D)] bg-[color:var(--one-surface-2,#18263F)] p-6 shadow-[0_20px_48px_rgba(0,0,0,0.45)] z-10 text-[color:var(--one-text-primary,#E6ECF5)] space-y-5"
        role="dialog"
      >
        <div className="flex items-center justify-between border-b border-[color:var(--one-border-default,#22324D)] pb-4">
          <div>
            <h3 className="text-base font-semibold text-[color:var(--one-text-primary,#E6ECF5)]">Preferências</h3>
            <p className="text-xs text-[color:var(--one-text-secondary,#A6B2C7)]">Personalize a sua experiência visual individual.</p>
          </div>
          <button
            aria-label="Fechar preferências"
            className="rounded-lg p-1 text-[color:var(--one-text-secondary,#A6B2C7)] hover:bg-[color:var(--one-surface-1,#131E33)] hover:text-[color:var(--one-text-primary,#E6ECF5)]"
            onClick={onClose}
            type="button"
          >
            ✕
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[color:var(--one-text-secondary,#A6B2C7)] mb-2">
              Aparência
            </h4>
            <div className="flex items-center justify-between rounded-[8px] border border-[color:var(--one-border-default,#22324D)] bg-[color:var(--one-surface-1,#131E33)] p-3">
              <div>
                <p className="text-xs font-medium text-[color:var(--one-text-primary,#E6ECF5)]">Tema da interface</p>
                <p className="text-[11px] text-[color:var(--one-text-secondary,#A6B2C7)]">Selecione claro, escuro ou automático.</p>
              </div>
              <ThemeToggle />
            </div>
          </div>

          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-[color:var(--one-text-secondary,#A6B2C7)] mb-2">
              Atalhos de teclado
            </h4>
            <div className="rounded-[8px] border border-[color:var(--one-border-default,#22324D)] bg-[color:var(--one-surface-1,#131E33)] p-3 space-y-2 text-xs">
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-[color:var(--one-text-secondary,#A6B2C7)]">Recolher/Expandir menu</span>
                <kbd className="px-2 py-0.5 rounded border border-[color:var(--one-border-default,#22324D)] bg-[color:var(--one-surface-2,#18263F)] font-mono text-[10px] text-[color:var(--one-text-primary,#E6ECF5)]">Ctrl/Cmd + B</kbd>
              </div>
              <div className="flex justify-between items-center text-[11px]">
                <span className="text-[color:var(--one-text-secondary,#A6B2C7)]">Busca global "Pergunte ao Gênio"</span>
                <kbd className="px-2 py-0.5 rounded border border-[color:var(--one-border-default,#22324D)] bg-[color:var(--one-surface-2,#18263F)] font-mono text-[10px] text-[color:var(--one-text-primary,#E6ECF5)]">Ctrl/Cmd + K</kbd>
              </div>
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-[color:var(--one-border-default,#22324D)]">
          <button
            className="rounded-[7px] bg-[color:var(--one-action-primary,#2D7CFF)] px-4 py-2 text-xs font-semibold text-white hover:bg-[color:var(--one-action-primary-hover,#428AFF)] transition-colors"
            onClick={onClose}
            type="button"
          >
            Concluído
          </button>
        </div>
      </div>
    </div>
  );
}

/**
 * Shared topbar primitive for the administrative shell.
 *
 * Height: 52px. Background: #0F1A2E (--one-shell-bg).
 * Bottom border: 1px solid #22324D (--one-border-default).
 * Padding: 16px horizontal.
 * Left: Breadcrumb (32px height)
 * Center: Global search / Pergunte ao Gênio
 * Right: Single User Menu Trigger & Popover
 */
function ShellTopbar({
  breadcrumb,
  canGoBack,
  mobileMenuButtonRef,
  mobileNavigationOpen,
  onToggleMobileNavigation,
  permissions,
}: {
  breadcrumb: MinimalBreadcrumbSegment[];
  canGoBack: boolean;
  mobileMenuButtonRef: React.RefObject<HTMLButtonElement | null>;
  mobileNavigationOpen: boolean;
  onToggleMobileNavigation: () => void;
  permissions: MinimalNavigationPermissions;
}) {
  const navigate = useNavigate();

  const searchPermissions = useMemo(
    () => ({
      isPlatformAdmin: permissions.isPlatformAdmin || (permissions.roles ?? []).includes('platform_admin'),
      screenKeys: permissions.screenKeys ?? [],
    }),
    [permissions],
  );

  return (
    <header className="gso-topbar relative z-40 flex h-[52px] items-center justify-between px-4 bg-[color:var(--gso-topbar-bg)] border-b border-[color:var(--gso-border)]">
      <div className="flex items-center gap-3 min-w-0">
        <button
          ref={mobileMenuButtonRef}
          aria-expanded={mobileNavigationOpen}
          aria-controls="gso-mobile-navigation"
          aria-label="Abrir navegação"
          className="gso-topbar-icon-button gso-topbar-menu-button lg:hidden"
          onClick={onToggleMobileNavigation}
          type="button"
        >
          <svg aria-hidden="true" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.8" viewBox="0 0 24 24">
            <path d="M5 7h14M5 12h14M5 17h14" />
          </svg>
        </button>
        {canGoBack ? (
          <button
            aria-label="Voltar para a superfície anterior"
            className="gso-topbar-icon-button gso-topbar-back-button"
            onClick={() => navigate(-1)}
            type="button"
          >
            <svg aria-hidden="true" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24">
              <path d="m15 6-6 6 6 6" />
            </svg>
          </button>
        ) : null}
        <nav aria-label="Trilha de navegação" className="gso-topbar-breadcrumb h-[32px] flex items-center">
          <ol className="flex items-center gap-2 text-xs">
            {breadcrumb.map((segment, index) => {
              const isLast = index === breadcrumb.length - 1;
              return (
                <li className="flex items-center gap-2" key={`${segment.label}-${index}`}>
                  {segment.to && !isLast ? (
                    <Link className="text-[color:var(--one-text-secondary)] hover:text-[color:var(--one-text-primary)] transition-colors" to={segment.to}>{segment.label}</Link>
                  ) : (
                    <span aria-current={isLast ? 'page' : undefined} className={isLast ? 'font-medium text-[color:var(--one-text-primary)]' : 'text-[color:var(--one-text-secondary)]'}>
                      {segment.label}
                    </span>
                  )}
                  {!isLast ? <span aria-hidden="true" className="text-[color:var(--one-text-muted)]">/</span> : null}
                </li>
              );
            })}
          </ol>
        </nav>
      </div>

      {/* Busca global do Gênio */}
      <div className="gso-topbar-search max-w-[420px] w-full flex justify-center mx-3">
        <GeniusGlobalSearch permissions={searchPermissions} />
      </div>

      {/* A identidade do usuario vive no rodape da barra lateral
          (<SidebarAccount>). O Global Header concentra apenas contexto, busca e
          acoes realmente globais. Decisao de produto de 2026-08-10: a
          identidade tem UM unico lugar; nao existem os dois. */}

    </header>
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
  const navigate = useNavigate();
  const { signOut, user } = useAuthContext();
  const [mobileNavigationOpen, setMobileNavigationOpen] = useState(false);
  const [preferencesOpen, setPreferencesOpen] = useState(false);
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
  const fullName = String(user?.user_metadata?.full_name ?? '').trim() || null;
  const email = user?.email ?? null;
  const userTitle = fullName ?? email ?? 'Operador interno';
  const breadcrumb = useMemo(() => resolveMinimalBreadcrumb(location.pathname), [location.pathname]);

  useEffect(() => {
    setMobileNavigationOpen(false);
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
      <div className="flex h-full min-h-0 gap-0 lg:p-0">
        <GeniusSidebar
          collapsed={sidebarCollapsed}
          email={email}
          fullName={fullName}
          onCollapse={() => setSidebarCollapsed((current) => !current)}
          onOpenPreferences={() => setPreferencesOpen(true)}
          pathname={location.pathname}
          permissions={permissions}
          signOut={signOut}
          userSubtitle={userSubtitle}
          userTitle={userTitle}
        />

        <div className="flex min-h-0 min-w-0 flex-1 flex-col">
          <ShellTopbar
            breadcrumb={breadcrumb}
            canGoBack={breadcrumb.length > 1}
            mobileMenuButtonRef={mobileMenuButtonRef}
            mobileNavigationOpen={mobileNavigationOpen}
            onToggleMobileNavigation={() => setMobileNavigationOpen((current) => !current)}
            permissions={permissions}
          />

          {mobileNavigationOpen ? (
            <div className="fixed inset-0 z-40 lg:hidden" id="gso-mobile-navigation">
              <button aria-label="Fechar navegação" className="absolute inset-0 bg-[color:var(--minimal-overlay)]" onClick={() => setMobileNavigationOpen(false)} type="button" />
              <aside aria-label="Menu principal mobile" aria-modal="true" className="gso-ui gso-sidebar-drawer relative flex h-full w-[min(19rem,86vw)] flex-col border-r border-[color:var(--minimal-border)] bg-[color:var(--minimal-sidebar)] shadow-[var(--minimal-drawer-shadow)]" role="dialog">
                <div className="flex h-14 items-center justify-between border-b border-[color:var(--minimal-border)] px-4">
                  <p className="flex items-center gap-2 text-sm font-semibold"><GeniusLamp size="sm" />Confi <span className="text-[color:var(--one-genius-pink)]">One</span></p>
                  <button ref={mobileCloseButtonRef} aria-label="Fechar navegação" className="inline-flex h-11 w-11 items-center justify-center rounded-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--minimal-focus)]" onClick={() => { setMobileNavigationOpen(false); mobileMenuButtonRef.current?.focus(); }} type="button">
                    <span aria-hidden="true">×</span>
                  </button>
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto px-2 py-4">
                  <ShellNavigation onNavigate={() => setMobileNavigationOpen(false)} pathname={location.pathname} permissions={permissions} />
                </div>
                {/* Abaixo de 1024px a barra lateral nao existe, entao o rodape
                    do drawer precisa oferecer os MESMOS itens do menu de
                    identidade; caso contrario /meu-perfil e as Preferencias
                    ficariam inalcancaveis em tablet e celular. */}
                <div className="border-t border-[color:var(--one-border-default)] p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
                  <div className="flex items-center gap-3">
                    <Avatar email={email} name={fullName} size="md" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-[color:var(--one-text-primary)]">{userTitle}</p>
                      <p className="truncate text-xs text-[color:var(--one-text-secondary)]">{userSubtitle}</p>
                    </div>
                  </div>
                  <div className="mt-2 space-y-0.5">
                    <button
                      className="flex h-11 w-full items-center rounded-[6px] px-2.5 text-left text-sm text-[color:var(--one-text-primary)] hover:bg-[color:var(--one-surface-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--one-border-focus)]"
                      onClick={() => {
                        setMobileNavigationOpen(false);
                        navigate('/meu-perfil');
                      }}
                      type="button"
                    >
                      Meu perfil
                    </button>
                    <button
                      className="flex h-11 w-full items-center rounded-[6px] px-2.5 text-left text-sm text-[color:var(--one-text-primary)] hover:bg-[color:var(--one-surface-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--one-border-focus)]"
                      onClick={() => {
                        setMobileNavigationOpen(false);
                        setPreferencesOpen(true);
                      }}
                      type="button"
                    >
                      Preferências
                    </button>
                    <button
                      className="flex h-11 w-full items-center rounded-[6px] px-2.5 text-left text-sm text-[color:var(--one-danger)] hover:bg-[color:var(--one-surface-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--one-border-focus)]"
                      onClick={() => void signOut()}
                      type="button"
                    >
                      Sair da plataforma
                    </button>
                  </div>
                </div>
              </aside>
            </div>
          ) : null}

          <main className="gso-main-canvas min-h-0 min-w-0 flex-1 overflow-hidden" id="conteudo-principal">{children}</main>
        </div>
      </div>

      <PreferencesModal isOpen={preferencesOpen} onClose={() => setPreferencesOpen(false)} />
    </div>
  );
}
