import { Outlet, useLocation } from 'react-router-dom';
import { useAuthContext } from '../auth/auth-context';
import {
  UnifiedInternalSidebar,
  UnifiedInternalTopbar,
} from '../navigation/UnifiedEnvironmentNavigation';

function buildInitials(fullName: string | null, email: string | null) {
  return String(fullName ?? email ?? 'CS')
    .trim()
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('');
}

function useCsShellIdentity() {
  const { gate, signOut, user } = useAuthContext();
  const fullName = String(user?.user_metadata?.full_name ?? '').trim() || null;
  const email = user?.email ?? null;
  const isPlatformAdmin = gate.actor?.is_platform_admin === true;

  return {
    email,
    fullName,
    initials: buildInitials(fullName, email),
    isPlatformAdmin,
    signOut,
  };
}

export function CsWorkspaceShell() {
  const location = useLocation();
  const identity = useCsShellIdentity();
  const permissions = {
    isPlatformAdmin: identity.isPlatformAdmin,
    hasCsPortfolioAccess: true,
  };

  return (
    <div className="support-operational-shell xl:h-dvh xl:min-h-0 xl:overflow-hidden">
      <div className="support-operational-body flex h-full w-full min-w-0 px-1.5 pl-0 sm:px-2.5 sm:pl-0 lg:overflow-hidden lg:px-2">
        <div className="hidden shrink-0 lg:block">
          <div className="support-operational-sidebar-frame sticky">
            <UnifiedInternalSidebar
              onSignOut={() => void identity.signOut()}
              pathname={location.pathname}
              permissions={permissions}
              userInitials={identity.initials || 'CS'}
              userSubtitle={
                identity.isPlatformAdmin
                  ? 'Administrador da plataforma'
                  : 'Customer Success'
              }
              userTitle={identity.fullName ?? identity.email ?? 'Customer Success'}
            />
          </div>
        </div>

        <div className="min-h-0 min-w-0 flex-1 lg:overflow-hidden">
          <div className="support-operational-stack flex h-full min-h-0 flex-col lg:overflow-hidden">
            <UnifiedInternalTopbar
              pathname={location.pathname}
              permissions={permissions}
            />
            <main className="min-h-0 min-w-0 flex-1 overflow-hidden">
              <Outlet />
            </main>
          </div>
        </div>
      </div>
    </div>
  );
}
