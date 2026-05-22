import { useLocation } from 'react-router-dom';
import { UnifiedInternalSidebar } from '../navigation/UnifiedEnvironmentNavigation';
import { useAuthContext } from '../auth/auth-context';

function getUserInitials(fullName: string | null | undefined, email: string | null | undefined) {
  const base = String(fullName ?? email ?? 'PA')
    .trim()
    .split(/[\s@._-]+/)
    .filter(Boolean)
    .slice(0, 2);

  if (base.length === 0) {
    return 'PA';
  }

  return base.map((chunk) => chunk[0]?.toUpperCase() ?? '').join('');
}

export function AdminSidebar() {
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
      userInitials={getUserInitials(fullName, email)}
      userSubtitle={isPlatformAdmin ? 'Administrador da plataforma' : 'Sessão administrativa'}
      userTitle={fullName ?? email ?? 'Sessão administrativa'}
    />
  );
}
