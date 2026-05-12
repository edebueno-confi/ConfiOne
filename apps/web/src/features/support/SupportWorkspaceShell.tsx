import { useMemo } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { cx } from '../../components/ui';
import { useAuthContext } from '../auth/auth-context';
import {
  UNIFIED_INTERNAL_SIDEBAR_WIDTH_CLASS,
  UnifiedEnvironmentSidebar,
  UnifiedQuickNavigation,
  type UnifiedEnvironmentItem,
  type UnifiedModuleItem,
} from '../navigation/UnifiedEnvironmentNavigation';

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

function resolveInternalEnvironment(pathname: string) {
  if (pathname.startsWith('/engineering')) {
    return 'engineering';
  }

  return 'support';
}

function useSupportNavigation(pathname: string) {
  const { gate } = useAuthContext();
  const isPlatformAdmin = gate.actor?.is_platform_admin === true;
  const currentEnvironment = resolveInternalEnvironment(pathname);

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
        {
          label: 'Administração',
          to: isPlatformAdmin ? '/admin/tenants' : undefined,
          disabled: !isPlatformAdmin,
          disabledReason: 'Acesso administrativo indisponível para este usuário.',
          matches: (pathname: string) => pathname.startsWith('/admin/'),
        },
      ] satisfies UnifiedEnvironmentItem[],
    [isPlatformAdmin],
  );

  const moduleItems = useMemo(
    () => {
      if (currentEnvironment === 'engineering') {
        return [
          {
            label: 'Fila técnica',
            icon: 'engineering' as const,
            to: '/engineering',
            matches: (pathname: string) => pathname === '/engineering',
          },
          {
            label: 'Itens técnicos',
            icon: 'tickets' as const,
            to: '/engineering',
            matches: (pathname: string) => pathname.startsWith('/engineering/work-items/'),
          },
          {
            label: 'Retornos ao suporte',
            icon: 'return' as const,
            to: '/support/queue',
            matches: (pathname: string) => pathname === '/support' || pathname === '/support/queue',
          },
        ] satisfies UnifiedModuleItem[];
      }

      return [
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
      ] satisfies UnifiedModuleItem[];
    },
    [currentEnvironment, isPlatformAdmin],
  );

  return {
    currentEnvironment,
    environmentItems,
    moduleItems,
    isPlatformAdmin,
  };
}

function SupportSidebar() {
  const location = useLocation();
  const { signOut, user } = useAuthContext();
  const { currentEnvironment, environmentItems, moduleItems, isPlatformAdmin } =
    useSupportNavigation(location.pathname);
  const fullName = String(user?.user_metadata?.full_name ?? '').trim() || null;
  const email = user?.email ?? null;
  const isEngineering = currentEnvironment === 'engineering';

  return (
    <UnifiedEnvironmentSidebar
      environmentSubtitle={isEngineering ? 'Engenharia' : 'Suporte operacional'}
      environmentItems={environmentItems}
      moduleSectionLabel={isEngineering ? 'Tecnologia' : 'Operação'}
      moduleItems={moduleItems}
      onSignOut={() => void signOut()}
      pathname={location.pathname}
      userInitials={buildInitials(fullName, email)}
      userSubtitle={
        isPlatformAdmin
          ? 'Administrador da plataforma'
          : isEngineering
            ? 'Engenharia'
            : 'Operação de suporte'
      }
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
  const { environmentItems, moduleItems } = useSupportNavigation(location.pathname);

  return (
    <header className={cx(compact ? 'py-0' : 'py-0')}>
      <div className={cx('space-y-2 lg:hidden', compact ? 'lg:hidden' : 'lg:hidden')}>
        <UnifiedQuickNavigation
          items={environmentItems
            .flatMap((item) =>
              item.to && !item.disabled
                ? [
                    {
                      label: item.label,
                      to: item.to,
                      matches: item.matches,
                    },
                  ]
                : [],
            )}
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
              'sticky',
              UNIFIED_INTERNAL_SIDEBAR_WIDTH_CLASS,
              isOperationalSupportRoute
                ? 'top-2 h-[calc(var(--app-viewport-height)-1rem)] max-h-[calc(var(--app-viewport-height)-1rem)]'
                : 'top-3 h-[calc(var(--app-viewport-height)-1.5rem)]',
            )}
          >
            <SupportSidebar />
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
