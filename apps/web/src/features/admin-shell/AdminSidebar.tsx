import { useLocation } from 'react-router-dom';
import { UnifiedEnvironmentSidebar } from '../navigation/UnifiedEnvironmentNavigation';
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

export function AdminSidebar({
  collapsed,
}: {
  collapsed: boolean;
}) {
  const location = useLocation();
  const { gate, signOut, user } = useAuthContext();
  const fullName = String(user?.user_metadata?.full_name ?? '').trim() || null;
  const email = user?.email ?? null;

  return (
    <UnifiedEnvironmentSidebar
      className={collapsed ? 'w-[88px]' : 'w-[242px]'}
      collapsed={collapsed}
      environmentDescription="Governança da plataforma e configuração operacional."
      environmentItems={[
        {
          label: 'Suporte',
          to: '/support/queue',
          matches: (pathname) => pathname === '/support' || pathname.startsWith('/support/'),
        },
        {
          label: 'Engenharia',
          to: '/engineering',
          matches: (pathname) => pathname.startsWith('/engineering'),
        },
        {
          label: 'Administração',
          to: '/admin/tenants',
          matches: (pathname) => pathname.startsWith('/admin/'),
        },
      ]}
      environmentLabel="Administração"
      moduleItems={[
        {
          label: 'Clientes B2B',
          to: '/admin/tenants',
          icon: 'customers',
          matches: (pathname) => pathname === '/admin' || pathname.startsWith('/admin/tenants'),
        },
        {
          label: 'Conhecimento',
          to: '/admin/knowledge',
          icon: 'knowledge',
          matches: (pathname) => pathname.startsWith('/admin/knowledge'),
        },
        {
          label: 'Portal do cliente',
          to: '/admin/customer-portal',
          icon: 'portal',
          matches: (pathname) => pathname.startsWith('/admin/customer-portal'),
        },
        {
          label: 'Acessos',
          to: '/admin/access',
          icon: 'access',
          matches: (pathname) => pathname.startsWith('/admin/access'),
        },
        {
          label: 'Sistema',
          to: '/admin/system',
          icon: 'system',
          matches: (pathname) => pathname.startsWith('/admin/system'),
        },
      ]}
      onSignOut={() => void signOut()}
      pathname={location.pathname}
      userInitials={getUserInitials(fullName, email)}
      userSubtitle={gate.actor?.is_platform_admin ? 'Administrador da plataforma' : 'Sessão administrativa'}
      userTitle={fullName ?? email ?? 'Sessão administrativa'}
    />
  );
}
