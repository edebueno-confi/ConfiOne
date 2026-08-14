import { Outlet } from 'react-router';
import { useAuthContext } from '../auth/auth-context';
import { MinimalAppShell } from '../navigation/MinimalAppShell';

export function AdminConsoleShell() {
  const { gate } = useAuthContext();
  const isPlatformAdmin = gate.actor?.is_platform_admin === true;
  const isDashboardViewer = gate.actor?.roles.includes('dashboard_viewer') === true;

  return (
    <MinimalAppShell
      permissions={{
        isPlatformAdmin,
        fullName: gate.actor?.profile.full_name ?? null,
        roles: gate.actor?.roles ?? [],
        screenKeys: gate.actor?.screen_keys ?? [],
        hasDashboardViewerAccess: isDashboardViewer,
      }}
      userSubtitle={isDashboardViewer && !isPlatformAdmin ? 'Visualizador gerencial' : 'Administrador da plataforma'}
    >
      <Outlet />
    </MinimalAppShell>
  );
}
