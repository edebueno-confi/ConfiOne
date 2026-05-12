import { useEffect, useMemo, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { cx } from '../../components/ui';
import { useAuthContext } from '../auth/auth-context';
import {
  UnifiedEnvironmentSidebar,
  UnifiedQuickNavigation,
  type UnifiedEnvironmentItem,
  type UnifiedModuleItem,
} from '../navigation/UnifiedEnvironmentNavigation';

const SIDEBAR_STORAGE_KEY = 'support-workspace-shell-collapsed';

function usePersistedSidebarState() {
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    const stored = window.localStorage.getItem(SIDEBAR_STORAGE_KEY);
    setCollapsed(stored === 'true');
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') {
      return;
    }

    window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(collapsed));
  }, [collapsed]);

  return [collapsed, setCollapsed] as const;
}

function buildInitials(fullName: string | null | undefined, email: string | null | undefined) {
  const parts = String(fullName ?? email ?? 'QA')
    .trim()
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2);

  if (parts.length === 0) {
    return 'QA';
  }

  return parts.map((chunk) => chunk[0]?.toUpperCase() ?? '').join('');
}

function useSupportNavigation() {
  const { gate } = useAuthContext();
  const isPlatformAdmin = gate.actor?.is_platform_admin === true;

  const environmentItems = useMemo(
    () =>
      [
        {
          label: 'Suporte',
          to: '/support/queue',
          matches: (pathname: string) =>
            pathname === '/support' || pathname.startsWith('/support/'),
        },
        {
          label: 'Engenharia',
          to: '/engineering',
          matches: (pathname: string) => pathname.startsWith('/engineering'),
        },
        ...(isPlatformAdmin
          ? [
              {
                label: 'Administração',
                to: '/admin/tenants',
                matches: (pathname: string) => pathname.startsWith('/admin/'),
              },
            ]
          : []),
      ] satisfies UnifiedEnvironmentItem[],
    [isPlatformAdmin],
  );

  const moduleItems = useMemo(
    () =>
      [
        {
          label: 'Fila',
          icon: 'queue' as const,
          to: '/support/queue',
          matches: (pathname: string) =>
            pathname === '/support' || pathname === '/support/queue',
        },
        {
          label: 'Tickets',
          icon: 'tickets' as const,
          to: '/support/tickets',
          matches: (pathname: string) => pathname.startsWith('/support/tickets'),
        },
        {
          label: 'Clientes',
          icon: 'customers' as const,
          to: '/support/customers',
          matches: (pathname: string) => pathname.startsWith('/support/customers'),
        },
        ...(isPlatformAdmin
          ? [
              {
                label: 'Conhecimento',
                icon: 'knowledge' as const,
                to: '/admin/knowledge',
                matches: (pathname: string) => pathname.startsWith('/admin/knowledge'),
              },
            ]
          : []),
      ] satisfies UnifiedModuleItem[],
    [isPlatformAdmin],
  );

  return {
    environmentItems,
    moduleItems,
    isPlatformAdmin,
  };
}

function SupportSidebar({
  collapsed,
  onToggle,
}: {
  collapsed: boolean;
  onToggle: () => void;
}) {
  const location = useLocation();
  const { signOut, user } = useAuthContext();
  const { environmentItems, moduleItems, isPlatformAdmin } = useSupportNavigation();
  const fullName = String(user?.user_metadata?.full_name ?? '').trim() || null;
  const email = user?.email ?? null;

  return (
    <UnifiedEnvironmentSidebar
      className={collapsed ? 'w-[76px]' : 'w-[206px]'}
      collapsed={collapsed}
      environmentDescription="Fila, clientes e continuidade do atendimento."
      environmentItems={environmentItems}
      environmentLabel="Suporte"
      moduleItems={moduleItems}
      onSignOut={() => void signOut()}
      onToggle={onToggle}
      pathname={location.pathname}
      userInitials={buildInitials(fullName, email)}
      userSubtitle={isPlatformAdmin ? 'Administrador da plataforma' : 'Operação de suporte'}
      userTitle={fullName ?? email ?? 'Operador interno'}
    />
  );
}

function SupportTopbar({
  compact = false,
}: {
  compact?: boolean;
}) {
  const location = useLocation();
  const { environmentItems, moduleItems } = useSupportNavigation();

  return (
    <header className={cx(compact ? 'py-0' : 'py-0')}>
      <div className={cx('space-y-2 lg:hidden', compact ? 'lg:hidden' : 'lg:hidden')}>
        <UnifiedQuickNavigation
          items={environmentItems}
          pathname={location.pathname}
          title="Ambientes"
        />
        <UnifiedQuickNavigation
          items={moduleItems.map((item) => ({
            label: item.label,
            to: item.to,
            matches: item.matches,
          }))}
          pathname={location.pathname}
          title="Seções"
        />
      </div>
    </header>
  );
}

export function SupportWorkspaceShell() {
  const [sidebarCollapsed, setSidebarCollapsed] = usePersistedSidebarState();
  const location = useLocation();
  const isOperationalSupportRoute = /^\/(support|engineering)(\/|$)/.test(location.pathname);

  return (
    <div
      className={cx(
        'bg-[linear-gradient(180deg,#eef4ff_0%,#f7faff_42%,#f3f6fb_100%)] text-[color:var(--color-ink)]',
        isOperationalSupportRoute
          ? 'xl:h-[var(--app-viewport-height)] xl:overflow-hidden'
          : 'min-h-screen',
      )}
    >
      <div
        className={cx(
          'flex w-full gap-3 px-1.5 sm:px-2.5 lg:px-2',
          isOperationalSupportRoute
            ? 'h-full py-2 pl-0 pr-2 sm:pl-0 lg:overflow-hidden lg:py-2 lg:pr-3'
            : 'py-3',
        )}
      >
        <div className="hidden shrink-0 lg:block">
          <div
            className={cx(
              'sticky transition-[width] duration-200',
              isOperationalSupportRoute
                ? 'top-2 h-[calc(var(--app-viewport-height)-1rem)] max-h-[calc(var(--app-viewport-height)-1rem)]'
                : 'top-3 h-[calc(var(--app-viewport-height)-1.5rem)]',
            )}
          >
            <SupportSidebar
              collapsed={sidebarCollapsed}
              onToggle={() => setSidebarCollapsed((current) => !current)}
            />
          </div>
        </div>

        <div
          className={cx(
            'min-w-0 flex-1',
            isOperationalSupportRoute && 'min-h-0 lg:overflow-hidden',
          )}
        >
          <div
            className={cx(
              isOperationalSupportRoute
                ? 'flex h-full min-h-0 flex-col gap-1 lg:overflow-hidden'
                : 'space-y-3',
            )}
          >
            <SupportTopbar compact={isOperationalSupportRoute} />
            <main
              className={cx(
                'min-w-0',
                isOperationalSupportRoute && 'min-h-0 flex-1 overflow-hidden',
              )}
            >
              <Outlet />
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
