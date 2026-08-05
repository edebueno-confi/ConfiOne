import { Outlet } from 'react-router';
import { useAuthContext } from '../auth/auth-context';
import { MinimalAppShell } from '../navigation/MinimalAppShell';

export function CsWorkspaceShell() {
  const { gate } = useAuthContext();
  const isPlatformAdmin = gate.actor?.is_platform_admin === true;

  return (
    <MinimalAppShell
      permissions={{ isPlatformAdmin, roles: gate.actor?.roles ?? [], hasCsPortfolioAccess: true }}
      userSubtitle={isPlatformAdmin ? 'Administrador da plataforma' : 'Customer Success'}
    >
      <Outlet />
    </MinimalAppShell>
  );
}
