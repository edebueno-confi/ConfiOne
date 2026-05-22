import { Outlet, useLocation } from 'react-router-dom';
import { cx } from '../../components/ui';
import { useAuthContext } from '../auth/auth-context';
import {
  UnifiedInternalSidebar,
  UnifiedInternalTopbar,
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

function SupportSidebar() {
  const location = useLocation();
  const { gate, signOut, user } = useAuthContext();
  const fullName = String(user?.user_metadata?.full_name ?? '').trim() || null;
  const email = user?.email ?? null;
  const isPlatformAdmin = gate.actor?.is_platform_admin === true;

  return (
    <UnifiedInternalSidebar
      onSignOut={() => void signOut()}
      pathname={location.pathname}
      permissions={{ isPlatformAdmin }}
      userInitials={buildInitials(fullName, email)}
      userSubtitle={isPlatformAdmin ? 'Administrador da plataforma' : 'Operação interna'}
      userTitle={fullName ?? email ?? 'Operador interno'}
    />
  );
}

function SupportTopbar() {
  const location = useLocation();
  const { gate } = useAuthContext();

  return (
    <UnifiedInternalTopbar
      pathname={location.pathname}
      permissions={{ isPlatformAdmin: gate.actor?.is_platform_admin === true }}
    />
  );
}

export function SupportWorkspaceShell() {
  const location = useLocation();
  const isOperationalSupportRoute = /^\/(support|engineering)(\/|$)/.test(location.pathname);

  return (
    <div
      className={cx(
        'support-operational-shell',
        isOperationalSupportRoute
          ? 'xl:h-dvh xl:min-h-0 xl:overflow-hidden'
          : 'min-h-screen',
      )}
    >
      <div
        className={cx(
          'support-operational-body flex w-full min-w-0 px-1.5 sm:px-2.5 lg:px-2',
          isOperationalSupportRoute
            ? 'h-full min-h-0 pl-0 sm:pl-0 lg:overflow-hidden'
            : 'py-3',
        )}
      >
        <div className="hidden shrink-0 lg:block">
          <div
            className={cx(
              'sticky support-operational-sidebar-frame',
              isOperationalSupportRoute
                ? ''
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
                ? 'support-operational-stack flex h-full min-h-0 flex-col lg:overflow-hidden'
                : 'space-y-3',
              )}
            >
            <SupportTopbar />
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
