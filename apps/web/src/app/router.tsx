import { lazy, type ReactNode, Suspense } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { LoadingState } from '../components/states';
import { AuthBootstrap } from '../features/auth/AuthBootstrap';
import { AdminGate } from '../features/auth/AdminGate';

const AdminConsoleShell = lazy(async () => {
  const module = await import('../features/admin-shell/AdminConsoleShell');
  return { default: module.AdminConsoleShell };
});

const LoginPage = lazy(async () => {
  const module = await import('../features/login/LoginPage');
  return { default: module.LoginPage };
});

const AccessDeniedPage = lazy(async () => {
  const module = await import('../features/auth/AccessDeniedPage');
  return { default: module.AccessDeniedPage };
});

const CustomerPortalGate = lazy(async () => {
  const module = await import('../features/customer-portal/CustomerPortalPage');
  return { default: module.CustomerPortalGate };
});

const CustomerPortalLayout = lazy(async () => {
  const module = await import('../features/customer-portal/CustomerPortalPage');
  return { default: module.CustomerPortalLayout };
});

const CustomerPortalHomePage = lazy(async () => {
  const module = await import('../features/customer-portal/CustomerPortalPage');
  return { default: module.CustomerPortalHomePage };
});

const CustomerPortalTicketsPage = lazy(async () => {
  const module = await import('../features/customer-portal/CustomerPortalPage');
  return { default: module.CustomerPortalTicketsPage };
});

const CustomerPortalTicketPage = lazy(async () => {
  const module = await import('../features/customer-portal/CustomerPortalPage');
  return { default: module.CustomerPortalTicketPage };
});

const CustomerPortalHelpPage = lazy(async () => {
  const module = await import('../features/customer-portal/CustomerPortalPage');
  return { default: module.CustomerPortalHelpPage };
});

const CustomerPortalHelpArticlePage = lazy(async () => {
  const module = await import('../features/customer-portal/CustomerPortalPage');
  return { default: module.CustomerPortalHelpArticlePage };
});

const TenantsPage = lazy(async () => {
  const module = await import('../features/tenants/TenantsPage');
  return { default: module.TenantsPage };
});

const KnowledgePage = lazy(async () => {
  const module = await import('../features/knowledge/KnowledgePage');
  return { default: module.KnowledgePage };
});

const CustomerPortalAdminPage = lazy(async () => {
  const module = await import('../features/admin/CustomerPortalAdminPage');
  return { default: module.CustomerPortalAdminPage };
});

const HelpCenterPage = lazy(async () => {
  const module = await import('../features/help-center/HelpCenterPage');
  return { default: module.HelpCenterPage };
});

const HelpCenterSpaceLayout = lazy(async () => {
  const module = await import('../features/help-center/HelpCenterPage');
  return { default: module.HelpCenterSpaceLayout };
});

const HelpCenterHomePage = lazy(async () => {
  const module = await import('../features/help-center/HelpCenterHomePage');
  return { default: module.HelpCenterHomePage };
});

const HelpCenterArticlesPage = lazy(async () => {
  const module = await import('../features/help-center/HelpCenterArticlesPage');
  return { default: module.HelpCenterArticlesPage };
});

const HelpCenterArticlePage = lazy(async () => {
  const module = await import('../features/help-center/HelpCenterArticlePage');
  return { default: module.HelpCenterArticlePage };
});

const AccessPage = lazy(async () => {
  const module = await import('../features/access/AccessPage');
  return { default: module.AccessPage };
});

const SystemPage = lazy(async () => {
  const module = await import('../features/system/SystemPage');
  return { default: module.SystemPage };
});

const SupportWorkspaceShell = lazy(async () => {
  const module = await import('../features/support/SupportWorkspaceShell');
  return { default: module.SupportWorkspaceShell };
});

const SupportQueuePage = lazy(async () => {
  const module = await import('../features/support/SupportWorkspacePage');
  return { default: module.SupportQueuePage };
});

const SupportTicketsPage = lazy(async () => {
  const module = await import('../features/support/SupportWorkspacePage');
  return { default: module.SupportTicketsPage };
});

const SupportTicketPage = lazy(async () => {
  const module = await import('../features/support/SupportWorkspacePage');
  return { default: module.SupportTicketPage };
});

const EngineeringWorkspacePage = lazy(async () => {
  const module = await import('../features/engineering/EngineeringWorkspacePage');
  return { default: module.EngineeringWorkspacePage };
});

const SupportCustomerPage = lazy(async () => {
  const module = await import('../features/support/SupportWorkspacePage');
  return { default: module.SupportCustomerPage };
});

const SupportCustomersPage = lazy(async () => {
  const module = await import('../features/support/SupportWorkspacePage');
  return { default: module.SupportCustomersPage };
});

const SupportGate = lazy(async () => {
  const module = await import('../features/support/SupportGate');
  return { default: module.SupportGate };
});

function RouteLoading() {
  return (
    <div className="mx-auto flex min-h-screen w-full max-w-4xl items-center px-6 py-12">
      <LoadingState
        title="Carregando superficie"
        description="Estamos preparando a proxima area antes de abrir a tela solicitada."
      />
    </div>
  );
}

function withSuspense(element: ReactNode) {
  return <Suspense fallback={<RouteLoading />}>{element}</Suspense>;
}

export const router = createBrowserRouter([
  {
    element: <AuthBootstrap />,
    children: [
      {
        path: '/',
        element: <Navigate replace to="/admin" />,
      },
      {
        path: '/login',
        element: withSuspense(<LoginPage />),
      },
      {
        path: '/help',
        element: withSuspense(<HelpCenterPage />),
      },
      {
        path: '/help/:spaceSlug',
        element: withSuspense(<HelpCenterSpaceLayout />),
        children: [
          {
            index: true,
            element: withSuspense(<HelpCenterHomePage />),
          },
          {
            path: 'articles',
            element: withSuspense(<HelpCenterArticlesPage />),
          },
          {
            path: 'articles/:articleSlug',
            element: withSuspense(<HelpCenterArticlePage />),
          },
        ],
      },
      {
        path: '/access-denied',
        element: withSuspense(<AccessDeniedPage />),
      },
      {
        path: '/customer-portal',
        element: <Navigate replace to="/portal" />,
      },
      {
        path: '/portal',
        element: withSuspense(
          <CustomerPortalGate>
            <CustomerPortalLayout />
          </CustomerPortalGate>,
        ),
        children: [
          {
            index: true,
            element: withSuspense(<CustomerPortalHomePage />),
          },
          {
            path: 'tickets',
            element: withSuspense(<CustomerPortalTicketsPage />),
          },
          {
            path: 'tickets/:ticketId',
            element: withSuspense(<CustomerPortalTicketPage />),
          },
          {
            path: 'help',
            element: withSuspense(<CustomerPortalHelpPage />),
          },
          {
            path: 'help/:articleSlug',
            element: withSuspense(<CustomerPortalHelpArticlePage />),
          },
        ],
      },
      {
        path: '/admin',
        element: (
          <AdminGate>{withSuspense(<AdminConsoleShell />)}</AdminGate>
        ),
        children: [
          {
            index: true,
            element: <Navigate replace to="/admin/tenants" />,
          },
          {
            path: 'tenants',
            element: withSuspense(<TenantsPage />),
          },
          {
            path: 'knowledge',
            element: withSuspense(<KnowledgePage />),
          },
          {
            path: 'customer-portal',
            element: withSuspense(<CustomerPortalAdminPage />),
          },
          {
            path: 'access',
            element: withSuspense(<AccessPage />),
          },
          {
            path: 'system',
            element: withSuspense(<SystemPage />),
          },
        ],
      },
      {
        path: '/support',
        element: withSuspense(
          <SupportGate>
            <SupportWorkspaceShell />
          </SupportGate>,
        ),
        children: [
          {
            index: true,
            element: <Navigate replace to="/support/queue" />,
          },
          {
            path: 'queue',
            element: withSuspense(<SupportQueuePage />),
          },
          {
            path: 'tickets',
            element: withSuspense(<SupportTicketsPage />),
          },
          {
            path: 'tickets/:ticketId',
            element: withSuspense(<SupportTicketPage />),
          },
          {
            path: 'customers',
            element: withSuspense(<SupportCustomersPage />),
          },
          {
            path: 'customers/:tenantId',
            element: withSuspense(<SupportCustomerPage />),
          },
        ],
      },
      {
        path: '/engineering',
        element: withSuspense(
          <SupportGate>
            <SupportWorkspaceShell />
          </SupportGate>,
        ),
        children: [
          {
            index: true,
            element: withSuspense(<EngineeringWorkspacePage />),
          },
          {
            path: 'work-items/:workItemId',
            element: withSuspense(<EngineeringWorkspacePage />),
          },
        ],
      },
      {
        path: '*',
        element: <Navigate replace to="/admin" />,
      },
    ],
  },
]);
