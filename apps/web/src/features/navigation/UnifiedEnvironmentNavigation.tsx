import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import mascotUrl from '../../../assets/brand/genius-mascot.svg';
import { cx } from '../../components/ui';

const SIDEBAR_STORAGE_KEY = 'genius.internalSidebarCollapsed';

export const UNIFIED_INTERNAL_SIDEBAR_EXPANDED_WIDTH_CLASS = 'w-[280px]';
export const UNIFIED_INTERNAL_SIDEBAR_COLLAPSED_WIDTH_CLASS = 'w-[72px]';
export const UNIFIED_INTERNAL_SIDEBAR_WIDTH_CLASS = UNIFIED_INTERNAL_SIDEBAR_EXPANDED_WIDTH_CLASS;

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
  | 'journal'
  | 'documents'
  | 'return';

type NavigationAvailability = 'enabled' | 'disabled' | 'hidden';

export interface UnifiedNavigationItem {
  id: string;
  label: string;
  to?: string;
  icon: UnifiedNavigationIcon;
  availability: NavigationAvailability;
  disabledReason?: string;
  matches: (pathname: string) => boolean;
}

export interface UnifiedNavigationDomain {
  id: 'operation-cx' | 'engineering' | 'governance';
  label: string;
  icon: UnifiedNavigationIcon;
  availability: NavigationAvailability;
  disabledReason?: string;
  items: UnifiedNavigationItem[];
  matches: (pathname: string) => boolean;
}

export interface InternalNavigationPermissions {
  isPlatformAdmin: boolean;
}

export interface UnifiedInternalNavigation {
  domains: UnifiedNavigationDomain[];
}

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

function isSupportRoute(pathname: string) {
  return pathname === '/support' || pathname.startsWith('/support/');
}

function isEngineeringRoute(pathname: string) {
  return pathname.startsWith('/engineering');
}

function isInternalActionsRoute(pathname: string) {
  return pathname === '/internal-actions' || pathname.startsWith('/internal-actions/');
}

function isAdminRoute(pathname: string) {
  return pathname === '/admin' || pathname.startsWith('/admin/');
}

function adminOnly(isPlatformAdmin: boolean): Pick<UnifiedNavigationItem, 'availability' | 'disabledReason'> {
  if (isPlatformAdmin) {
    return { availability: 'enabled' };
  }

  return {
    availability: 'disabled',
    disabledReason: 'Sem acesso neste perfil',
  };
}

export function buildInternalNavigation({
  pathname,
  permissions,
}: {
  pathname: string;
  permissions: InternalNavigationPermissions;
}): UnifiedInternalNavigation {
  const { isPlatformAdmin } = permissions;
  const currentSupport = isSupportRoute(pathname);
  const currentInternalActions = isInternalActionsRoute(pathname);
  const currentEngineering = isEngineeringRoute(pathname);
  const operationEnabled = isPlatformAdmin || currentSupport || currentInternalActions;
  const operationAvailability = operationEnabled ? 'enabled' : 'disabled';
  const operationDisabledReason = operationEnabled ? undefined : 'Sem acesso neste perfil';
  const engineeringEnabled = isPlatformAdmin || currentEngineering;
  const engineeringAvailability = engineeringEnabled ? 'enabled' : 'disabled';
  const engineeringDisabledReason = engineeringEnabled ? undefined : 'Sem acesso neste perfil';
  const governanceAccess = adminOnly(isPlatformAdmin);

  return {
    domains: [
      {
        id: 'operation-cx',
        label: 'Operação CX',
        icon: 'queue',
        availability: operationAvailability,
        disabledReason: operationDisabledReason,
        matches: (path) => isSupportRoute(path) || isInternalActionsRoute(path),
        items: [
          {
            id: 'support-queue',
            label: 'Fila operacional',
            to: operationEnabled ? '/support/queue' : undefined,
            icon: 'queue',
            availability: operationAvailability,
            disabledReason: operationDisabledReason,
            matches: (path) => path === '/support' || path === '/support/queue',
          },
          {
            id: 'support-tickets',
            label: 'Tickets',
            to: operationEnabled ? '/support/tickets' : undefined,
            icon: 'tickets',
            availability: operationAvailability,
            disabledReason: operationDisabledReason,
            matches: (path) => path.startsWith('/support/tickets'),
          },
          {
            id: 'support-customers',
            label: 'Clientes B2B',
            to: operationEnabled ? '/support/customers' : undefined,
            icon: 'customers',
            availability: operationAvailability,
            disabledReason: operationDisabledReason,
            matches: (path) => path.startsWith('/support/customers'),
          },
          {
            id: 'internal-actions',
            label: 'Acionamentos',
            to: operationEnabled ? '/internal-actions' : undefined,
            icon: 'return',
            availability: operationAvailability,
            disabledReason: operationDisabledReason,
            matches: isInternalActionsRoute,
          },
          {
            id: 'support-knowledge',
            label: 'Conhecimento',
            to: isPlatformAdmin ? '/admin/knowledge' : undefined,
            icon: 'knowledge',
            ...adminOnly(isPlatformAdmin),
            matches: () => false,
          },
        ],
      },
      {
        id: 'engineering',
        label: 'Engenharia',
        icon: 'engineering',
        availability: engineeringAvailability,
        disabledReason: engineeringDisabledReason,
        matches: isEngineeringRoute,
        items: [
          {
            id: 'engineering-queue',
            label: 'Fila técnica',
            to: engineeringEnabled ? '/engineering' : undefined,
            icon: 'engineering',
            availability: engineeringAvailability,
            disabledReason: engineeringDisabledReason,
            matches: (path) => path === '/engineering',
          },
          {
            id: 'engineering-items',
            label: 'Itens técnicos',
            to: engineeringEnabled ? '/engineering' : undefined,
            icon: 'tickets',
            availability: engineeringAvailability,
            disabledReason: engineeringDisabledReason,
            matches: (path) => path.startsWith('/engineering/work-items/'),
          },
          {
            id: 'engineering-return',
            label: 'Retornos ao CX',
            to: engineeringEnabled ? '/support/queue' : undefined,
            icon: 'return',
            availability: engineeringAvailability,
            disabledReason: engineeringDisabledReason,
            matches: () => false,
          },
        ],
      },
      {
        id: 'governance',
        label: 'Governança',
        icon: 'admin',
        ...governanceAccess,
        matches: isAdminRoute,
        items: [
          {
            id: 'admin-tenants',
            label: 'Contas B2B',
            to: isPlatformAdmin ? '/admin/tenants' : undefined,
            icon: 'customers',
            ...governanceAccess,
            matches: (path) => path === '/admin' || path.startsWith('/admin/tenants'),
          },
          {
            id: 'admin-portal',
            label: 'Portal do cliente',
            to: isPlatformAdmin ? '/admin/customer-portal' : undefined,
            icon: 'portal',
            ...governanceAccess,
            matches: (path) => path.startsWith('/admin/customer-portal'),
          },
          {
            id: 'admin-internal-areas',
            label: 'Áreas internas',
            to: isPlatformAdmin ? '/admin/internal-areas' : undefined,
            icon: 'access',
            ...governanceAccess,
            matches: (path) => path.startsWith('/admin/internal-areas'),
          },
          {
            id: 'admin-access',
            label: 'Acessos',
            to: isPlatformAdmin ? '/admin/access' : undefined,
            icon: 'access',
            ...governanceAccess,
            matches: (path) => path.startsWith('/admin/access'),
          },
          {
            id: 'admin-system',
            label: 'Sistema',
            to: isPlatformAdmin ? '/admin/system' : undefined,
            icon: 'system',
            ...governanceAccess,
            matches: (path) => path.startsWith('/admin/system'),
          },
          {
            id: 'admin-knowledge',
            label: 'Governança de conhecimento',
            to: isPlatformAdmin ? '/admin/knowledge' : undefined,
            icon: 'knowledge',
            ...governanceAccess,
            matches: (path) => path.startsWith('/admin/knowledge'),
          },
          {
            id: 'admin-build-journal',
            label: 'Diário de Construção',
            to: isPlatformAdmin ? '/admin/build-journal' : undefined,
            icon: 'journal',
            ...governanceAccess,
            matches: (path) => path.startsWith('/admin/build-journal'),
          },
          {
            id: 'admin-product-docs',
            label: 'Documentos do produto',
            to: isPlatformAdmin ? '/admin/product-docs' : undefined,
            icon: 'documents',
            ...governanceAccess,
            matches: (path) => path.startsWith('/admin/product-docs'),
          },
        ],
      },
    ],
  };
}

function UnifiedNavigationIconGlyph({
  icon,
  active,
  muted = false,
}: {
  icon: UnifiedNavigationIcon;
  active?: boolean;
  muted?: boolean;
}) {
  const iconClassName = cx(
    'h-[18px] w-[18px] shrink-0',
    muted
      ? 'text-slate-500'
      : active
        ? 'text-white'
        : 'text-white/82 group-hover:text-white',
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
    case 'journal':
      return (
        <svg aria-hidden="true" className={iconClassName} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
          <path d="M6.5 4.8h8.8A2.7 2.7 0 0 1 18 7.5v11.7H8.2a2.2 2.2 0 0 1-2.2-2.2V5.3a.5.5 0 0 1 .5-.5Z" />
          <path d="M9 8.3h5.6M9 11.5h5.6M9 14.7h3.6" strokeLinecap="round" />
          <path d="M6 17h12" strokeLinecap="round" />
        </svg>
      );
    case 'documents':
      return (
        <svg aria-hidden="true" className={iconClassName} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
          <path d="M7.2 4.8h6.9L18 8.7v10.5H7.2A1.2 1.2 0 0 1 6 18V6a1.2 1.2 0 0 1 1.2-1.2Z" strokeLinejoin="round" />
          <path d="M14 5v4h4" strokeLinejoin="round" />
          <path d="M9 12h6M9 15h6M9 18h3.8" strokeLinecap="round" />
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

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      aria-hidden="true"
      className={cx('h-4 w-4 transition-transform duration-200', open && 'rotate-180')}
      fill="none"
      stroke="currentColor"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="2"
      viewBox="0 0 24 24"
    >
      <path d="m6 9 6 6 6-6" />
    </svg>
  );
}

function LockIcon({ className }: { className?: string }) {
  return (
    <svg aria-hidden="true" className={cx('h-3.5 w-3.5', className)} fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="M8 10V7.8a4 4 0 0 1 8 0V10" strokeLinecap="round" />
      <rect height="9" rx="2" width="12" x="6" y="10" />
    </svg>
  );
}

function CollapsedSidebarTooltip({ children }: { children: string }) {
  return (
    <span className="pointer-events-none absolute left-[58px] top-1/2 z-50 hidden -translate-y-1/2 whitespace-nowrap rounded-[10px] border border-white/10 bg-[#061A3A] px-3 py-2 text-xs font-semibold text-white shadow-[0_16px_40px_rgba(2,8,23,0.35)] group-hover:block">
      {children}
    </span>
  );
}

function SidebarItem({
  item,
  pathname,
  collapsed,
  domainLabel,
}: {
  item: UnifiedNavigationItem;
  pathname: string;
  collapsed: boolean;
  domainLabel: string;
}) {
  const active = item.matches(pathname);
  const disabled = item.availability !== 'enabled' || !item.to;
  const title = disabled
    ? `${domainLabel} · ${item.label} bloqueado`
    : `${domainLabel} · ${item.label}`;
  const className = cx(
    'group relative flex h-10 items-center rounded-[13px] text-[0.86rem] transition duration-200',
    collapsed ? 'w-10 justify-center' : 'w-full gap-3 px-3',
    active
      ? 'bg-[rgba(37,99,235,0.35)] text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.08)]'
      : disabled
        ? 'cursor-not-allowed text-slate-500'
        : 'text-white/84 hover:translate-x-[1px] hover:bg-white/6 hover:text-white',
  );
  const content = (
    <>
      <span
        aria-hidden="true"
        className={cx(
          'absolute left-0 top-1/2 h-6 w-[3px] -translate-y-1/2 rounded-r-full bg-[#EC4899] transition-opacity',
          active ? 'opacity-100' : 'opacity-0',
        )}
      />
      <span className={cx('inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px]', active ? 'bg-white/10' : 'bg-transparent')}>
        <UnifiedNavigationIconGlyph active={active} icon={item.icon} muted={disabled} />
      </span>
      {collapsed ? null : (
        <>
          <span className="min-w-0 flex-1 truncate font-medium">{item.label}</span>
          {disabled ? <LockIcon className="text-[#EC4899]/80" /> : null}
        </>
      )}
      {collapsed && disabled ? (
        <span className="absolute right-0 top-1 h-1.5 w-1.5 rounded-full bg-[#EC4899]" />
      ) : null}
      {collapsed ? <CollapsedSidebarTooltip>{title}</CollapsedSidebarTooltip> : null}
    </>
  );

  if (disabled) {
    return (
      <div aria-disabled="true" className={className} title={item.disabledReason ?? 'Sem acesso neste perfil'}>
        {content}
      </div>
    );
  }

  return (
    <Link className={className} title={title} to={item.to!}>
      {content}
    </Link>
  );
}

function SidebarDomainGroup({
  domain,
  pathname,
  collapsed,
  open,
  onToggle,
}: {
  domain: UnifiedNavigationDomain;
  pathname: string;
  collapsed: boolean;
  open: boolean;
  onToggle: () => void;
}) {
  const active = domain.matches(pathname) || domain.items.some((item) => item.matches(pathname));
  const disabled = domain.availability !== 'enabled';
  const visibleItems = domain.items.filter((item) => item.availability !== 'hidden');

  if (collapsed) {
    return (
      <div className="space-y-2 border-b border-white/10 pb-3 last:border-b-0 last:pb-0">
        {visibleItems.map((item) => (
          <SidebarItem
            collapsed
            domainLabel={domain.label}
            item={item}
            key={item.id}
            pathname={pathname}
          />
        ))}
      </div>
    );
  }

  return (
    <section className="space-y-2">
      <button
        className={cx(
          'group flex h-10 w-full items-center gap-3 rounded-[13px] px-3 text-left text-[0.86rem] font-bold transition',
          active
            ? 'text-[#F472B6]'
            : disabled
              ? 'cursor-not-allowed text-slate-500'
              : 'text-white/86 hover:bg-white/6 hover:text-white',
        )}
        disabled={disabled}
        onClick={onToggle}
        title={disabled ? domain.disabledReason ?? 'Sem acesso neste perfil' : domain.label}
        type="button"
      >
        <span className={cx('inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-[10px]', active ? 'bg-[#EC4899]/12' : 'bg-white/5')}>
          <UnifiedNavigationIconGlyph active={active} icon={domain.icon} muted={disabled} />
        </span>
          <span className="min-w-0 flex-1 truncate">{domain.label}</span>
        {disabled ? (
          <LockIcon className="text-[#EC4899]/80" />
        ) : (
          <ChevronIcon open={open} />
        )}
      </button>
      <div
        className={cx(
          'grid overflow-hidden transition-[grid-template-rows,opacity] duration-200 ease-out',
          open && !disabled ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
        )}
      >
        <nav className="min-h-0 space-y-1 overflow-hidden pl-4">
          {visibleItems.map((item) => (
            <SidebarItem
              collapsed={false}
              domainLabel={domain.label}
              item={item}
              key={item.id}
              pathname={pathname}
            />
          ))}
        </nav>
      </div>
    </section>
  );
}

function readInitialCollapsedState() {
  if (typeof window === 'undefined') {
    return false;
  }

  return window.localStorage.getItem(SIDEBAR_STORAGE_KEY) === 'true';
}

export function UnifiedInternalSidebar({
  pathname,
  permissions,
  userInitials,
  userTitle,
  userSubtitle,
  onSignOut,
  className,
}: {
  pathname: string;
  permissions: InternalNavigationPermissions;
  userInitials: string;
  userTitle: string;
  userSubtitle: string;
  onSignOut: () => void;
  className?: string;
}) {
  const navigation = useMemo(
    () => buildInternalNavigation({ pathname, permissions }),
    [pathname, permissions],
  );
  const [collapsed, setCollapsed] = useState(readInitialCollapsedState);
  const activeDomain = navigation.domains.find((domain) =>
    domain.matches(pathname) || domain.items.some((item) => item.matches(pathname)),
  );
  const [openDomainIds, setOpenDomainIds] = useState<string[]>(() =>
    activeDomain ? [activeDomain.id] : ['operation-cx'],
  );

  useEffect(() => {
    if (!activeDomain || collapsed) {
      return;
    }

    setOpenDomainIds((current) =>
      current.includes(activeDomain.id) ? current : [...current, activeDomain.id],
    );
  }, [activeDomain, collapsed]);

  useEffect(() => {
    window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(collapsed));
  }, [collapsed]);

  const visibleDomains = navigation.domains.filter((domain) => domain.availability !== 'hidden');

  return (
    <aside
      className={cx(
        'relative flex h-full shrink-0 flex-col rounded-[24px] border border-white/10 bg-[linear-gradient(180deg,#061A3A_0%,#071C45_48%,#09265C_100%)] text-white shadow-[0_26px_58px_rgba(9,20,56,0.26)] transition-[width] duration-200 ease-out',
        collapsed ? UNIFIED_INTERNAL_SIDEBAR_COLLAPSED_WIDTH_CLASS : UNIFIED_INTERNAL_SIDEBAR_EXPANDED_WIDTH_CLASS,
        className,
      )}
      data-sidebar-state={collapsed ? 'collapsed' : 'expanded'}
    >
      <div className={cx('flex h-full min-h-0 flex-col', collapsed ? 'px-2 py-4' : 'px-4 py-5')}>
        <div className={cx('flex items-start', collapsed ? 'justify-center' : 'gap-3')}>
          <img
            alt="Mascote Genius"
            className={cx('shrink-0 rounded-full', collapsed ? 'w-11' : 'w-12')}
            src={mascotUrl}
          />
          {collapsed ? null : (
            <div className="min-w-0 flex-1 pt-1">
              <h1 className="truncate text-[15px] font-bold leading-tight tracking-[-0.03em] text-white">
                Genius Support OS
              </h1>
              <p className="mt-1 truncate text-xs font-medium leading-4 text-[#AAB7D4]">
                Operação interna CX B2B
              </p>
            </div>
          )}
          <button
            aria-label={collapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
            className={cx(
              'group inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-[10px] bg-[#EC4899] text-white shadow-[0_10px_24px_rgba(236,72,153,0.28)] transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-[#EC4899]/45',
              collapsed && 'absolute left-[50px] top-4 z-40',
            )}
            onClick={() => setCollapsed((current) => !current)}
            type="button"
          >
            <svg
              aria-hidden="true"
              className={cx('h-4 w-4 transition-transform', collapsed ? 'rotate-180' : '')}
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2.2"
              viewBox="0 0 24 24"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
          </button>
        </div>

        <div className={cx('min-h-0 flex-1 overflow-y-auto overflow-x-visible', collapsed ? 'mt-8' : 'mt-7')}>
          {collapsed ? (
            <nav className="flex flex-col items-center gap-3">
              {visibleDomains.map((domain) => (
                <SidebarDomainGroup
                  collapsed
                  domain={domain}
                  key={domain.id}
                  onToggle={() => undefined}
                  open
                  pathname={pathname}
                />
              ))}
            </nav>
          ) : (
            <div className="space-y-4">
              <p className="px-3 text-[11px] font-bold uppercase tracking-[0.24em] text-white/42">
                Navegação
              </p>
              <nav className="space-y-3">
                {visibleDomains.map((domain) => (
                  <SidebarDomainGroup
                    collapsed={false}
                    domain={domain}
                    key={domain.id}
                    onToggle={() =>
                      setOpenDomainIds((current) =>
                        current.includes(domain.id)
                          ? current.filter((id) => id !== domain.id)
                          : [...current, domain.id],
                      )
                    }
                    open={openDomainIds.includes(domain.id)}
                    pathname={pathname}
                  />
                ))}
              </nav>
            </div>
          )}
        </div>

        <div className={cx('border-t border-white/10', collapsed ? 'mt-4 pt-4' : 'mt-5 pt-4')}>
          {collapsed ? (
            <div className="flex flex-col items-center gap-3">
              <div
                className="group relative inline-flex h-10 w-10 items-center justify-center rounded-full bg-[linear-gradient(135deg,#FBCFE8,#FFFFFF)] text-xs font-bold text-[#061A3A]"
                title={`${userTitle} · ${userSubtitle}`}
              >
                {userInitials}
                <CollapsedSidebarTooltip>{`${userTitle} · ${userSubtitle}`}</CollapsedSidebarTooltip>
              </div>
              <button
                className="group relative inline-flex h-10 w-10 items-center justify-center rounded-[13px] text-white/78 transition hover:bg-white/8 hover:text-white"
                onClick={onSignOut}
                title="Encerrar sessão"
                type="button"
              >
                <svg aria-hidden="true" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24">
                  <path d="M15 16.5 19.5 12 15 7.5" />
                  <path d="M19 12H9" />
                  <path d="M12 5H6.5A1.5 1.5 0 0 0 5 6.5v11A1.5 1.5 0 0 0 6.5 19H12" />
                </svg>
                <CollapsedSidebarTooltip>Encerrar sessão</CollapsedSidebarTooltip>
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-3 rounded-[16px] border border-white/10 bg-white/7 px-3 py-3">
                <div className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#FBCFE8,#FFFFFF)] text-xs font-bold text-[#061A3A]">
                  {userInitials}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-[0.82rem] font-bold text-white">{userTitle}</p>
                  <p className="truncate text-[0.68rem] font-medium text-[#AAB7D4]">{userSubtitle}</p>
                </div>
                <ChevronIcon open={false} />
              </div>
              <button
                className="flex h-11 w-full items-center justify-between rounded-[14px] border border-white/12 bg-white/8 px-3 text-left text-sm font-semibold text-white/90 transition hover:bg-white/12 hover:text-white"
                onClick={onSignOut}
                type="button"
              >
                <span>Encerrar sessão</span>
                <svg aria-hidden="true" className="h-4 w-4" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" viewBox="0 0 24 24">
                  <path d="M15 16.5 19.5 12 15 7.5" />
                  <path d="M19 12H9" />
                </svg>
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
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

export function UnifiedInternalTopbar({
  pathname,
  permissions,
}: {
  pathname: string;
  permissions: InternalNavigationPermissions;
}) {
  const navigation = buildInternalNavigation({ pathname, permissions });
  const items = navigation.domains.flatMap((domain) =>
    domain.items.flatMap((item) =>
      item.availability === 'enabled' && item.to
        ? [
            {
              label: item.label,
              to: item.to,
              matches: item.matches,
            },
          ]
        : [],
    ),
  );

  return (
    <header className="space-y-2 lg:hidden xl:hidden">
      <UnifiedQuickNavigation items={items} pathname={pathname} title="Navegação" />
    </header>
  );
}
