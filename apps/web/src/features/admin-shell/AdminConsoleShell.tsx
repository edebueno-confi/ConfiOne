import { Outlet } from 'react-router-dom';
import { useAuthContext } from '../auth/auth-context';
import { MinimalAppShell } from '../navigation/MinimalAppShell';

export function AdminConsoleShell() {
  const { gate } = useAuthContext();

  return (
    <MinimalAppShell
      permissions={{ isPlatformAdmin: gate.actor?.is_platform_admin === true }}
      userSubtitle="Administrador da plataforma"
    >
      <Outlet />
    </MinimalAppShell>
  );
}
