import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAuthContext } from '../auth/auth-context';
import { MinimalAppShell } from '../navigation/MinimalAppShell';

export function AdminConsoleShell() {
  const { gate } = useAuthContext();
  const location = useLocation();
  const isPlatformAdmin = gate.actor?.is_platform_admin === true;
  const isDashboardViewer = gate.actor?.roles.includes('dashboard_viewer') === true;
  const viewerAllowed = ['/admin/analytics', '/admin/customer-portal', '/admin/knowledge', '/admin/settings']
    .some((path) => location.pathname === path || location.pathname.startsWith(`${path}/`));

  if (!isPlatformAdmin && isDashboardViewer && !viewerAllowed) {
    return <Navigate replace to="/admin/analytics" />;
  }

  return (
    <MinimalAppShell
      permissions={{ isPlatformAdmin, hasDashboardViewerAccess: isDashboardViewer }}
      userSubtitle="Administrador da plataforma"
    >
      <Outlet />
    </MinimalAppShell>
  );
}
