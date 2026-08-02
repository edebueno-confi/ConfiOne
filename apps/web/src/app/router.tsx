import { lazy, type ComponentType, type ReactNode, Suspense } from 'react';
import { createBrowserRouter, Navigate, useRouteError, useSearchParams } from 'react-router-dom';
import { ErrorState, LoadingState } from '../components/states';
import { GeniusMascot } from '../components/GeniusMascot';
import { AppButton, GhostButton } from '../components/ui';
import { AuthBootstrap } from '../features/auth/AuthBootstrap';
import { AdminGate } from '../features/auth/AdminGate';
import { ReleaseSurfaceGate } from '../features/auth/ReleaseSurfaceGate';

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
    ? 'Esta área precisa ser recarregada para sincronizar a versão mais recente da interface.'
    : 'Não foi possível concluir a abertura desta área. Recarregue a página ou tente novamente.';

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

const AdminOverviewPage = lazyRouteModule(
  () => import('../features/admin/AdminOverviewPage'),
  'AdminOverviewPage',
);

const AnalyticsShell = lazyRouteModule(
  () => import('../features/analytics/AnalyticsShell'),
  'AnalyticsShell',
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

const AccessPage = lazyRouteModule(() => import('../features/access/InternalControlPlanePage'), 'InternalControlPlanePage');

const SystemPage = lazyRouteModule(() => import('../features/system/SystemPage'), 'SystemPage');

const SettingsPage = lazyRouteModule(
  () => import('../features/settings/SettingsPage'),
  'SettingsPage',
);

function SettingsLegacyRedirect() {
  const [searchParams] = useSearchParams();
  const legacy = searchParams.get('section');
  const target = ({
    marcas: '/admin/settings/brands',
    'central-ajuda': '/admin/settings/help-center',
    analytics: '/admin/settings/integrations',
    integracoes: '/admin/settings/integrations',
    'dashboard-fontes': '/admin/settings/dashboard-sources',
    'dashboard-historico': '/admin/settings/sync-history',
  } as Record<string, string>)[legacy ?? ''] ?? '/admin/settings/integrations';
  return <Navigate replace to={target} />;
}

const SupportWorkspaceShell = lazyRouteModule(
  () => import('../features/support/SupportWorkspaceShell'),
  'SupportWorkspaceShell',
);

const CustomersPage = lazyRouteModule(
  () => import('../features/customers/CustomersPage'),
  'CustomersPage',
);

const HomePage = lazyRouteModule(
  () => import('../features/home/HomePage'),
  'HomePage',
);

const PublicHomePage = lazyRouteModule(
  () => import('../features/public-home/PublicHomePage'),
  'PublicHomePage',
);

const InboxPage = lazyRouteModule(
  () => import('../features/inbox/InboxPage'),
  'InboxPage',
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
    <div className="flex min-h-screen w-full items-center justify-center bg-[color:var(--color-background)] px-4 py-8" role="status" aria-busy="true" aria-label="Consultando a superfície solicitada">
      <section className="flex min-h-[170px] w-full max-w-3xl flex-col items-center justify-center gap-3 px-4 text-center sm:min-h-[240px]">
        <div className="flex h-36 w-36 items-center justify-center sm:h-44 sm:w-44">
          <div className="scale-[0.7] sm:scale-[0.9]"><GeniusMascot alt="Gênio preparando a próxima superfície" expression="happy" pose="magic" size="xl" surface="loading" /></div>
        </div>
        <h1 className="text-base font-semibold text-[color:var(--color-ink)]">Consultando a superfície</h1>
        <p className="text-sm leading-6 text-[color:var(--color-muted)]">Estamos preparando a próxima área.</p>
      </section>
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
        element: withSuspense(<PublicHomePage />),
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
          <ReleaseSurfaceGate>
            <CustomerPortalGate>
              <CustomerPortalLayout />
            </CustomerPortalGate>
          </ReleaseSurfaceGate>,
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
          <ReleaseSurfaceGate>
            <AdminGate>{withSuspense(<AdminConsoleShell />)}</AdminGate>
          </ReleaseSurfaceGate>
        ),
        children: [
          {
            index: true,
            element: <Navigate replace to="/admin/analytics" />,
          },
          {
            path: 'visao-geral',
            element: withSuspense(<AdminOverviewPage />),
          },
          {
            path: 'analytics',
            element: withSuspense(<AnalyticsShell />),
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
            element: <Navigate replace to="/admin/access?tab=structure" />,
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
          {
            path: 'settings',
            element: <SettingsLegacyRedirect />,
          },
          {
            path: 'settings/brands',
            element: withSuspense(<SettingsPage />),
          },
          {
            path: 'settings/help-center',
            element: withSuspense(<SettingsPage />),
          },
          {
            path: 'settings/integrations',
            element: withSuspense(<SettingsPage />),
          },
          {
            path: 'settings/dashboard-sources',
            element: withSuspense(<SettingsPage />),
          },
          {
            path: 'settings/sync-history',
            element: withSuspense(<SettingsPage />),
          },
        ],
      },
      {
        path: '/cs',
        element: withSuspense(
          <ReleaseSurfaceGate>
            <CsGate>
              <CsWorkspaceShell />
            </CsGate>
          </ReleaseSurfaceGate>,
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
          <ReleaseSurfaceGate>
            <SupportGate>
              <SupportWorkspaceShell />
            </SupportGate>
          </ReleaseSurfaceGate>,
        ),
        children: [
          {
            index: true,
            element: <Navigate replace to="/support/queue" />,
          },
          {
            path: 'inbox',
            element: withSuspense(<InboxPage />),
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
            path: 'clientes',
            element: withSuspense(<CustomersPage />),
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
        path: '/inicio',
        element: withSuspense(
          <ReleaseSurfaceGate>
            <SupportGate>
              <SupportWorkspaceShell />
            </SupportGate>
          </ReleaseSurfaceGate>,
        ),
        children: [
          {
            index: true,
            element: withSuspense(<HomePage />),
          },
        ],
      },
      {
        path: '/engineering',
        element: withSuspense(
          <ReleaseSurfaceGate>
            <SupportGate>
              <SupportWorkspaceShell />
            </SupportGate>
          </ReleaseSurfaceGate>,
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
          <ReleaseSurfaceGate>
            <SupportGate>
              <SupportWorkspaceShell />
            </SupportGate>
          </ReleaseSurfaceGate>,
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
