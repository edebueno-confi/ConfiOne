import { useLocation } from 'react-router-dom';
import { UnifiedQuickNavigation } from '../navigation/UnifiedEnvironmentNavigation';

export function AdminTopbar() {
  const location = useLocation();

  return (
    <header className="space-y-2 xl:hidden">
      <UnifiedQuickNavigation
        items={[
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
        pathname={location.pathname}
        title="Ambientes"
      />
      <UnifiedQuickNavigation
        items={[
          {
            label: 'Clientes B2B',
            to: '/admin/tenants',
            matches: (pathname) => pathname === '/admin' || pathname.startsWith('/admin/tenants'),
          },
          {
            label: 'Conhecimento',
            to: '/admin/knowledge',
            matches: (pathname) => pathname.startsWith('/admin/knowledge'),
          },
          {
            label: 'Portal do cliente',
            to: '/admin/customer-portal',
            matches: (pathname) => pathname.startsWith('/admin/customer-portal'),
          },
          {
            label: 'Acessos',
            to: '/admin/access',
            matches: (pathname) => pathname.startsWith('/admin/access'),
          },
          {
            label: 'Sistema',
            to: '/admin/system',
            matches: (pathname) => pathname.startsWith('/admin/system'),
          },
        ]}
        pathname={location.pathname}
        title="Seções"
      />
    </header>
  );
}
