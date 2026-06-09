import { lazy, type ComponentType, type ReactNode, Suspense } from 'react';
import { createBrowserRouter, Navigate, useRouteError } from 'react-router-dom';
import { ErrorState, LoadingState } from '../components/states';
import { AppButton, GhostButton } from '../components/ui';
import { AuthBootstrap } from '../features/auth/AuthBootstrap';
import { AdminGate } from '../features/auth/AdminGate';

const CHUNK_RECOVERY_KEY = 'genius.lazy-reload-once';

function isChunkLoadError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  return /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module/i.test(
    error.message,
  );
}

async function importWithChunkRecovery<T>(loader: () => Promise<T>) {
  try {
    const module = await loader();

    if (typeof window !== 'undefined') {
      window.sessionStorage.removeItem(CHUNK_RECOVERY_KEY);
    }

    return module;
  } catch (error) {
    if (typeof window !== 'undefined' && isChunkLoadError(error)) {
      const alreadyRetried = window.sessionStorage.getItem(CHUNK_RECOVERY_KEY) === '1';

      if (!alreadyRetried) {
        window.sessionStorage.setItem(CHUNK_RECOVERY_KEY, '1');
        window.location.reload();

        return await new Promise<never>(() => {
          // Wait for the reload to replace this execution path.
        });
      }

      window.sessionStorage.removeItem(CHUNK_RECOVERY_KEY);
    }

    throw error;
  }
}

function lazyRouteModule<TModule, TKey extends keyof TModule>(
  loader: () => Promise<TModule>,
  exportName: TKey,
) {
  return lazy(async () => {
    const module = await importWithChunkRecovery(loader);
    return { default: module[exportName] as ComponentType };
  });
}

function RouteErrorBoundary() {
  const error = useRouteError();
  const description = isChunkLoadError(error)
    ? 'A aplicação tentou abrir uma área com um arquivo de interface que ficou desatualizado no navegador. Recarregue a página para sincronizar os assets do build atual.'
    : error instanceof Error
      ? error.message
      : 'Ocorreu uma falha inesperada ao abrir esta área.';

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-4xl items-center px-6 py-12">
      <ErrorState
        title="Não foi possível abrir esta superfície"
        description={description}
        action={
          <>
            <AppButton onClick={() => window.location.reload()}>Recarregar página</AppButton>
            <GhostButton onClick={() => window.location.assign('/admin')}>
              Voltar ao Admin
            </GhostButton>
          </>
        }
      />
    </div>
  );
}

const AdminConsoleShell = lazyRouteModule(
  () => import('../features/admin-shell/AdminConsoleShell'),
  'AdminConsoleShell',
);

const LoginPage = lazyRouteModule(() => import('../features/login/LoginPage'), 'LoginPage');

const AccessDeniedPage = lazyRouteModule(
  () => import('../features/auth/AccessDeniedPage'),
  'AccessDeniedPage',
);

const CustomerPortalGate = lazyRouteModule(
  () => import('../features/customer-portal/CustomerPortalPage'),
  'CustomerPortalGate',
) as ReturnType<typeof lazy<ComponentType<{ children?: ReactNode }>>>;

const CustomerPortalLayout = lazyRouteModule(
  () => import('../features/customer-portal/CustomerPortalPage'),
  'CustomerPortalLayout',
);

const CustomerPortalHomePage = lazyRouteModule(
  () => import('../features/customer-portal/CustomerPortalPage'),
  'CustomerPortalHomePage',
);

const CustomerPortalTicketsPage = lazyRouteModule(
  () => import('../features/customer-portal/CustomerPortalPage'),
  'CustomerPortalTicketsPage',
);

const CustomerPortalTicketPage = lazyRouteModule(
  () => import('../features/customer-portal/CustomerPortalPage'),
  'CustomerPortalTicketPage',
);

const CustomerPortalHelpPage = lazyRouteModule(
  () => import('../features/customer-portal/CustomerPortalPage'),
  'CustomerPortalHelpPage',
);

const CustomerPortalHelpArticlePage = lazyRouteModule(
  () => import('../features/customer-portal/CustomerPortalPage'),
  'CustomerPortalHelpArticlePage',
);

const TenantsPage = lazyRouteModule(() => import('../features/tenants/TenantsPage'), 'TenantsPage');

const KnowledgePage = lazyRouteModule(
  () => import('../features/knowledge/KnowledgePage'),
  'KnowledgePage',
);

const KnowledgeArticleEditorPage = lazyRouteModule(
  () => import('../features/knowledge/KnowledgeArticleEditorPage'),
  'KnowledgeArticleEditorPage',
);

const CustomerPortalAdminPage = lazyRouteModule(
  () => import('../features/admin/CustomerPortalAdminPage'),
  'CustomerPortalAdminPage',
);

const InternalAreasAdminPage = lazyRouteModule(
  () => import('../features/admin/InternalAreasAdminPage'),
  'InternalAreasAdminPage',
);

const BuildJournalPage = lazyRouteModule(
  () => import('../features/build-journal/BuildJournalPage'),
  'BuildJournalPage',
);

const ProductDocsPage = lazyRouteModule(
  () => import('../features/product-docs/ProductDocsPage'),
  'ProductDocsPage',
);

const HelpCenterPage = lazyRouteModule(
  () => import('../features/help-center/HelpCenterPage'),
  'HelpCenterPage',
);

const HelpCenterSpaceLayout = lazyRouteModule(
  () => import('../features/help-center/HelpCenterPage'),
  'HelpCenterSpaceLayout',
);

const HelpCenterHomePage = lazyRouteModule(
  () => import('../features/help-center/HelpCenterHomePage'),
  'HelpCenterHomePage',
);

const HelpCenterArticlesPage = lazyRouteModule(
  () => import('../features/help-center/HelpCenterArticlesPage'),
  'HelpCenterArticlesPage',
);

const HelpCenterArticlePage = lazyRouteModule(
  () => import('../features/help-center/HelpCenterArticlePage'),
  'HelpCenterArticlePage',
);

const AccessPage = lazyRouteModule(() => import('../features/access/AccessPage'), 'AccessPage');

const SystemPage = lazyRouteModule(() => import('../features/system/SystemPage'), 'SystemPage');

const SupportWorkspaceShell = lazyRouteModule(
  () => import('../features/support/SupportWorkspaceShell'),
  'SupportWorkspaceShell',
);

const SupportQueuePage = lazyRouteModule(
  () => import('../features/support/SupportWorkspacePage'),
  'SupportQueuePage',
);

const SupportTicketsPage = lazyRouteModule(
  () => import('../features/support/SupportWorkspacePage'),
  'SupportTicketsPage',
);

const SupportTicketPage = lazyRouteModule(
  () => import('../features/support/SupportWorkspacePage'),
  'SupportTicketPage',
);

const EngineeringWorkspacePage = lazyRouteModule(
  () => import('../features/engineering/EngineeringWorkspacePage'),
  'EngineeringWorkspacePage',
);

const InternalActionsWorkspacePage = lazyRouteModule(
  () => import('../features/internal-actions/InternalActionsWorkspacePage'),
  'InternalActionsWorkspacePage',
);

const SupportCustomerPage = lazyRouteModule(
  () => import('../features/support/SupportWorkspacePage'),
  'SupportCustomerPage',
);

const SupportCustomersPage = lazyRouteModule(
  () => import('../features/support/SupportWorkspacePage'),
  'SupportCustomersPage',
);

const SupportGate = lazyRouteModule(
  () => import('../features/support/SupportGate'),
  'SupportGate',
) as ReturnType<typeof lazy<ComponentType<{ children?: ReactNode }>>>;

const CsGate = lazyRouteModule(
  () => import('../features/cs/CsGate'),
  'CsGate',
) as ReturnType<typeof lazy<ComponentType<{ children?: ReactNode }>>>;

const CsWorkspaceShell = lazyRouteModule(
  () => import('../features/cs/CsWorkspaceShell'),
  'CsWorkspaceShell',
);

const CsPortfolioPage = lazyRouteModule(
  () => import('../features/cs/CsPortfolioPage'),
  'CsPortfolioPage',
);

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
    errorElement: <RouteErrorBoundary />,
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
            path: 'knowledge/new',
            element: withSuspense(<KnowledgeArticleEditorPage />),
          },
          {
            path: 'knowledge/:articleId/edit',
            element: withSuspense(<KnowledgeArticleEditorPage />),
          },
          {
            path: 'customer-portal',
            element: withSuspense(<CustomerPortalAdminPage />),
          },
          {
            path: 'internal-areas',
            element: withSuspense(<InternalAreasAdminPage />),
          },
          {
            path: 'build-journal',
            element: withSuspense(<BuildJournalPage />),
          },
          {
            path: 'product-docs',
            element: withSuspense(<ProductDocsPage />),
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
        path: '/cs',
        element: withSuspense(
          <CsGate>
            <CsWorkspaceShell />
          </CsGate>,
        ),
        children: [
          {
            index: true,
            element: <Navigate replace to="/cs/portfolio" />,
          },
          {
            path: 'portfolio',
            element: withSuspense(<CsPortfolioPage />),
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
        path: '/internal-actions',
        element: withSuspense(
          <SupportGate>
            <SupportWorkspaceShell />
          </SupportGate>,
        ),
        children: [
          {
            index: true,
            element: withSuspense(<InternalActionsWorkspacePage />),
          },
          {
            path: ':actionId',
            element: withSuspense(<InternalActionsWorkspacePage />),
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
