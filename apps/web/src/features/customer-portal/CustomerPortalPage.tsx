import {
  type ChangeEvent,
  type FormEvent,
  type ReactNode,
  useEffect,
  useMemo,
  useState,
} from 'react';
import {
  Link,
  NavLink,
  Navigate,
  Outlet,
  useLocation,
  useNavigate,
  useParams,
  useSearchParams,
} from 'react-router-dom';
import {
  ContractUnavailableState,
  ErrorState,
  LoadingState,
  SessionExpiredState,
  StateFrame,
} from '../../components/states';
import { GeniusMascot } from '../../components/GeniusMascot';
import {
  AppButton,
  Field,
  GhostButton,
  InlineNotice,
  Panel,
  StatusPill,
  TextInput,
  TextareaInput,
  cx,
} from '../../components/ui';
import { AppError } from '../../app/errors';
import type {
  CustomerPortalActiveTenantContext,
  CustomerPortalAvailableTenant,
  CustomerPortalKnowledgeArticle,
  CustomerPortalKnowledgeArticleDetail,
  CustomerPortalKnowledgeSearchResult,
  CustomerPortalTicketAttachment,
  CustomerPortalTicketCollaborationState,
  CustomerPortalTicketDetail,
  CustomerPortalTicketKnowledgeLink,
  CustomerPortalTicketListItem,
  CustomerPortalTicketTimelineItem,
} from '../../contracts/support-contracts';
import { useAuthContext } from '../auth/auth-context';
import {
  acknowledgeCustomerPortalTicketUpdate,
  addCustomerPortalTicketMessage,
  confirmCustomerPortalTicketResolved,
  createCustomerPortalTicket,
  CUSTOMER_PORTAL_ATTACHMENT_ALLOWED_TYPES,
  CUSTOMER_PORTAL_ATTACHMENT_MAX_SIZE_BYTES,
  downloadCustomerPortalTicketAttachment,
  fetchCustomerPortalKnowledgeArticleDetail,
  fetchCustomerPortalKnowledgeArticles,
  searchCustomerPortalKnowledgeArticles,
  fetchCustomerPortalTicketKnowledgeLinks,
  fetchCustomerPortalTicketAttachments,
  fetchCustomerPortalTicketCollaborationState,
  fetchCustomerPortalTicketDetail,
  fetchCustomerPortalTicketTimeline,
  fetchCustomerPortalTickets,
  requestCustomerPortalTicketReopen,
  uploadCustomerPortalTicketAttachment,
} from './customer-portal-api';
import {
  CustomerPortalTenantContextProvider,
  getCustomerPortalBlockedActionMessage,
  useCustomerPortalTenantContext,
} from './customer-portal-context';
import { MarkdownDocument } from '../help-center/markdown';

function formatDate(value: string | null) {
  if (!value) {
    return 'Indisponível';
  }

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(new Date(value));
}

function mapError(error: unknown, fallback: string) {
  if (error instanceof AppError) {
    return error.message;
  }

  return error instanceof Error ? error.message : fallback;
}

function isNetworkRetryableAppError(error: unknown) {
  return error instanceof AppError && error.code === 'network-retryable';
}

function isContractUnavailableMessage(message: string | null) {
  return message?.includes('não está disponível') ?? false;
}

function isNetworkRetryableMessage(message: string | null) {
  return (
    /não foi possível falar com o portal agora|demorou mais do que o esperado|tente novamente|reconectar|conexão/i.test(
      message ?? '',
    )
  );
}

function describeCustomerAttachmentLimits() {
  return 'PDF, PNG, JPG ou WebP até 10 MB.';
}

function isCustomerAttachmentTypeAllowed(file: File) {
  return CUSTOMER_PORTAL_ATTACHMENT_ALLOWED_TYPES.includes(
    file.type as (typeof CUSTOMER_PORTAL_ATTACHMENT_ALLOWED_TYPES)[number],
  );
}

function buildPortalKnowledgePath(slug: string) {
  return `/portal/help/${slug}`;
}

function sanitizeCustomerFacingText(value: string | null | undefined) {
  return (value ?? 'IndisponÃ­vel')
    .replace(/\bfixture local sanitizada\b/gi, 'Registro operacional')
    .replace(/\bfixture\b/gi, 'registro operacional')
    .replace(/\btenant\b/gi, 'cliente')
    .replace(/\bbackend\b/gi, 'operaÃ§Ã£o')
    .replace(/\bprovider\b/gi, 'serviÃ§o externo')
    .replace(/\bcontratos?\b/gi, 'acordos operacionais')
    .replace(/\bRPCs?\b/g, 'rotina operacional')
    .replace(/\bRLS\b/g, 'regra de acesso')
    .replace(/\bpayload\b/gi, 'conteÃºdo tÃ©cnico');
}

function buildPortalHelpSearchPath(params: {
  query?: string;
  category?: string;
  source?: string;
}) {
  const nextParams = new URLSearchParams();
  const query = params.query?.trim() ?? '';
  const category = params.category?.trim() ?? '';
  const source = params.source?.trim() ?? '';

  if (query) {
    nextParams.set('q', query);
  }

  if (category) {
    nextParams.set('category', category);
  }

  if (source && source !== 'all') {
    nextParams.set('source', source);
  }

  const serialized = nextParams.toString();
  return serialized ? `/portal/help?${serialized}` : '/portal/help';
}

function humanizeKnowledgeSourceLabel(source: CustomerPortalKnowledgeArticle['source']) {
  if (source === 'public') {
    return 'Público';
  }

  if (source === 'ticket_linked') {
    return 'Relacionada ao ticket';
  }

  return 'Autorizado no portal';
}

function toneForKnowledgeSource(source: CustomerPortalKnowledgeArticle['source']) {
  if (source === 'ticket_linked') {
    return 'accent' as const;
  }

  if (source === 'customer_portal') {
    return 'positive' as const;
  }

  return 'default' as const;
}

function normalizePortalSearchQuery(value: string | null) {
  return (value ?? '').trim();
}

function normalizePortalSearchSource(value: string | null) {
  if (value === 'public' || value === 'customer_portal' || value === 'ticket_linked') {
    return value;
  }

  return 'all';
}

function portalRoleLabel(role: CustomerPortalAvailableTenant['portalRole']) {
  return role === 'customer_manager' ? 'Gestão cliente' : 'Usuário cliente';
}

function PortalShell({ children }: { children: ReactNode }) {
  const { signOut, user } = useAuthContext();
  const {
    activeContext,
    availableTenants,
    canRunSensitiveActions,
    errorMessage,
    isContextStale,
    isLoading,
    isRefreshing,
    isSwitching,
    pendingContext,
    phase,
    phaseMessage,
    refresh,
    staleMessage,
    switchingTenantId,
    switchTenant,
  } = useCustomerPortalTenantContext();
  const displayContext = activeContext ?? pendingContext;
  const sidebarNotice =
    phase === 'stale_context'
      ? staleMessage
      : phase !== 'ready' && phase !== 'initializing'
        ? getCustomerPortalBlockedActionMessage(phase, phaseMessage)
        : errorMessage;

  function handleTenantChange(event: ChangeEvent<HTMLSelectElement>) {
    const nextTenantId = event.target.value.trim();
    if (!nextTenantId || nextTenantId === displayContext?.tenantId) {
      return;
    }

    void switchTenant(nextTenantId);
  }

  return (
    <div className="h-screen overflow-hidden bg-[linear-gradient(180deg,#eef4ff_0%,#f7faff_46%,#f2f5fb_100%)] text-[color:var(--color-ink)]">
      <div className="mx-auto flex h-full max-w-[1600px] gap-4 px-4 py-4">
        <aside className="hidden h-full w-[230px] shrink-0 flex-col rounded-[28px] bg-[linear-gradient(180deg,#06173f_0%,#082058_54%,#0b2a68_100%)] p-3 text-white shadow-[0_24px_50px_rgba(9,20,56,0.22)] lg:flex">
          <div className="px-2 pt-2">
              <div className="flex items-center gap-2">
                <GeniusMascot size="sm" />
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-white/70">
                  Genius<span className="text-[color:var(--genius-site-pink)]">OS</span>
                </p>
              </div>
              <h1 className="mt-2 text-lg font-semibold tracking-[-0.05em]">
                Portal do cliente
              </h1>
            <p className="mt-2 text-xs leading-5 text-white/58">
              Acesso autenticado ao próprio contexto B2B.
            </p>
          </div>

          <nav className="mt-6 grid gap-2">
            {[
              { label: 'Visão operacional', to: '/portal' },
              { label: 'Tickets', to: '/portal/tickets' },
              { label: 'Central autorizada', to: '/portal/help' },
            ].map((item) => (
              <NavLink
                className={({ isActive }) =>
                  cx(
                    'rounded-[16px] px-3 py-3 text-sm font-medium transition',
                    isActive
                      ? 'bg-[linear-gradient(135deg,#1f67ff,#2f7eff)] text-white shadow-[0_12px_22px_rgba(18,81,213,0.25)]'
                      : 'text-white/72 hover:bg-[color:var(--color-surface-strong)]/9 hover:text-white',
                  )
                }
                end={item.to === '/portal'}
                key={item.to}
                to={item.to}
              >
                {item.label}
              </NavLink>
            ))}
          </nav>

          <div className="mt-6 rounded-[20px] border border-white/10 bg-[color:var(--color-surface-strong)]/7 p-3">
            <p className="text-[0.62rem] font-semibold uppercase tracking-[0.2em] text-white/48">
              Conta ativa
            </p>
            <p className="mt-2 truncate text-sm font-semibold text-white">
              {sanitizeCustomerFacingText(displayContext?.tenantDisplayName ?? 'Indisponível')}
            </p>
            <p className="mt-1 text-xs text-white/58">
              {displayContext
                ? portalRoleLabel(displayContext.portalRole)
                : 'Sem contexto ativo no portal'}
            </p>
            {availableTenants.length > 1 ? (
              <div className="mt-3">
                <label className="mb-1 block text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-white/48">
                  Trocar conta
                </label>
                <select
                  className="h-11 w-full rounded-[16px] border border-white/12 bg-[color:var(--color-surface-strong)]/10 px-3 text-sm text-white outline-none transition focus:border-white/28"
                  disabled={isLoading || isSwitching || isRefreshing}
                  onChange={handleTenantChange}
                  value={displayContext?.tenantId ?? ''}
                >
                  {availableTenants.map((tenant) => (
                    <option className="text-[color:var(--color-ink)]" key={tenant.tenantId} value={tenant.tenantId}>
                      {sanitizeCustomerFacingText(tenant.tenantDisplayName)}
                    </option>
                  ))}
                </select>
                <p className="mt-2 text-xs leading-5 text-white/58">
                  O portal revalida seu acesso a cada troca. Dados da conta anterior são descartados com segurança.
                </p>
              </div>
            ) : null}
            {isContextStale && staleMessage ? (
              <div className="mt-3 rounded-[16px] border border-[#ffd873]/35 bg-[#ffd873]/12 px-3 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#ffe7ad]">
                  Contexto alterado
                </p>
                <p className="mt-2 text-xs leading-5 text-white/78">{staleMessage}</p>
                <GhostButton
                  className="mt-3 border-white/12 bg-[color:var(--color-surface-strong)]/10 text-white hover:bg-[color:var(--color-surface-strong)]/16"
                  disabled={isRefreshing || isSwitching}
                  onClick={() => void refresh()}
                >
                  {isRefreshing ? 'Atualizando...' : 'Atualizar contexto'}
                </GhostButton>
              </div>
            ) : null}
            {!isContextStale && phase === 'network_retryable' && sidebarNotice ? (
              <div className="mt-3 rounded-[16px] border border-[#92b6ff]/35 bg-[#92b6ff]/12 px-3 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#d9e7ff]">
                  Reconexão necessária
                </p>
                <p className="mt-2 text-xs leading-5 text-white/78">{sidebarNotice}</p>
                <GhostButton
                  className="mt-3 border-white/12 bg-[color:var(--color-surface-strong)]/10 text-white hover:bg-[color:var(--color-surface-strong)]/16"
                  disabled={isRefreshing || isSwitching}
                  onClick={() => void refresh()}
                >
                  {isRefreshing ? 'Tentando novamente...' : 'Tentar novamente'}
                </GhostButton>
              </div>
            ) : null}
            {!isContextStale &&
            (phase === 'access_revoked' ||
              phase === 'tenant_unavailable' ||
              phase === 'session_expired' ||
              phase === 'fatal_error') &&
            sidebarNotice ? (
              <div className="mt-3 rounded-[16px] border border-[#ffb2b2]/35 bg-[#ffb2b2]/12 px-3 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#ffe1e1]">
                  Contexto indisponível
                </p>
                <p className="mt-2 text-xs leading-5 text-white/78">{sidebarNotice}</p>
              </div>
            ) : null}
            {isSwitching && switchingTenantId ? (
              <p className="mt-3 text-xs leading-5 text-white/58">
                Atualizando o contexto do portal...
              </p>
            ) : null}
            {phase === 'ready' && !canRunSensitiveActions ? (
              <p className="mt-3 text-xs leading-5 text-white/58">
                O portal está revalidando seu contexto antes de liberar novas ações.
              </p>
            ) : null}
            {phase === 'ready' && errorMessage ? (
              <p className="mt-3 text-xs leading-5 text-[#ffd8d8]">
                {errorMessage}
              </p>
            ) : null}
          </div>

          <div className="mt-auto rounded-[20px] border border-white/10 bg-[color:var(--color-surface-strong)]/7 p-3">
            <p className="truncate text-sm font-semibold text-white">
              {user?.email ?? 'Sessão autenticada'}
            </p>
              <p className="mt-1 text-xs text-white/58">Ambiente do cliente</p>
            <GhostButton
              className="mt-3 w-full border-white/12 bg-[color:var(--color-surface-strong)]/10 text-white hover:bg-[color:var(--color-surface-strong)]/16"
              onClick={() => void signOut()}
            >
              Sair
            </GhostButton>
          </div>
        </aside>

        <main className="min-w-0 flex-1 overflow-hidden">{children}</main>
      </div>
    </div>
  );
}

export function CustomerPortalGate({ children }: { children: ReactNode }) {
  const location = useLocation();
  const { phase, configError, sessionExpired, signOut, clearSessionExpired } = useAuthContext();

  if (phase === 'config-error') {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-4xl items-center px-6 py-12">
        <ErrorState
          title="Configuração de acesso indisponível"
          description={
            configError ??
            'Este ambiente ainda não recebeu as configurações mínimas do portal cliente.'
          }
        />
      </div>
    );
  }

  if (sessionExpired) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-4xl items-center px-6 py-12">
        <StateFrame
          title="Sessão expirada"
          description="Entre novamente para continuar no portal cliente."
          eyebrow="portal"
          tone="critical"
          actions={
            <>
              <AppButton
                onClick={() => {
                  clearSessionExpired();
                  void signOut();
                }}
              >
                Voltar ao login
              </AppButton>
              <GhostButton onClick={() => clearSessionExpired()}>
                Fechar aviso
              </GhostButton>
            </>
          }
        />
      </div>
    );
  }

  if (phase === 'booting') {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-4xl items-center px-6 py-12">
        <LoadingState
          title="Carregando portal"
          description="Estamos validando sua sessão no portal."
        />
      </div>
    );
  }

  if (phase === 'anonymous') {
    const redirectTo = `${location.pathname}${location.search}`;
    return <Navigate replace to={`/login?redirectTo=${encodeURIComponent(redirectTo)}`} />;
  }

  return (
    <CustomerPortalTenantContextProvider>
      <PortalShell>{children}</PortalShell>
    </CustomerPortalTenantContextProvider>
  );
}

export function CustomerPortalLayout() {
  const {
    activeContext,
    isContextStale,
    isLoading,
    isRefreshing,
    isSwitching,
    pendingContext,
    phase,
    phaseMessage,
    refresh,
    staleMessage,
  } = useCustomerPortalTenantContext();
  const { clearSessionExpired, signOut } = useAuthContext();

  if (isLoading || isSwitching) {
    return (
      <div className="h-full overflow-hidden rounded-[28px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-strong)]/92 p-6">
        <LoadingState
          title={isSwitching ? 'Trocando conta' : 'Carregando contexto do portal'}
          description={
            isSwitching
              ? 'Limpando o contexto anterior e validando a próxima conta ativa.'
              : 'Validando os clientes disponíveis para esta sessão no portal.'
          }
        />
      </div>
    );
  }

  if (isContextStale) {
    return (
      <div className="h-full overflow-hidden rounded-[28px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-strong)]/92 p-6">
        <StateFrame
          title="Contexto alterado em outra aba"
          description={
            pendingContext
              ? `${staleMessage ?? 'O contexto do portal mudou em outra aba. Atualize para continuar.'} A conta ativa agora é ${sanitizeCustomerFacingText(pendingContext.tenantDisplayName)}.`
              : staleMessage ??
                'O contexto do portal mudou e a conta anterior não está mais disponível para esta sessão.'
          }
          eyebrow="portal"
          tone="default"
          actions={
            <AppButton disabled={isRefreshing} onClick={() => void refresh()}>
              {isRefreshing ? 'Atualizando contexto...' : 'Atualizar contexto'}
            </AppButton>
          }
        />
      </div>
    );
  }

  if (phase === 'session_expired') {
    return (
      <div className="h-full overflow-hidden rounded-[28px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-strong)]/92 p-6">
        <SessionExpiredState
          action={
            <AppButton
              onClick={() => {
                clearSessionExpired();
                void signOut();
              }}
            >
              Entrar novamente
            </AppButton>
          }
        />
      </div>
    );
  }

  if (phase === 'access_revoked') {
    return (
      <div className="h-full overflow-hidden rounded-[28px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-strong)]/92 p-6">
        <StateFrame
          title="Acesso revogado"
          description={
            phaseMessage ??
            'Seu acesso ao portal foi revogado ou deixou de atender os requisitos desta conta.'
          }
          eyebrow="portal"
          tone="critical"
        />
      </div>
    );
  }

  if (phase === 'tenant_unavailable') {
    return (
      <div className="h-full overflow-hidden rounded-[28px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-strong)]/92 p-6">
        <StateFrame
          title="Conta indisponível"
          description={
            phaseMessage ??
            'Nenhuma conta habilitada no portal está disponível para esta sessão agora.'
          }
          eyebrow="portal"
          tone="default"
          actions={
            <AppButton disabled={isRefreshing} onClick={() => void refresh()}>
              {isRefreshing ? 'Atualizando...' : 'Tentar novamente'}
            </AppButton>
          }
        />
      </div>
    );
  }

  if (phase === 'network_retryable') {
    return (
      <div className="h-full overflow-hidden rounded-[28px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-strong)]/92 p-6">
        <ErrorState
          title="Conexão temporariamente indisponível"
          description={
            phaseMessage ??
            'O portal não conseguiu validar sua sessão agora. Tente novamente em instantes.'
          }
          action={
            <AppButton disabled={isRefreshing} onClick={() => void refresh()}>
              {isRefreshing ? 'Tentando novamente...' : 'Tentar novamente'}
            </AppButton>
          }
        />
      </div>
    );
  }

  if (phase === 'fatal_error') {
    return (
      <div className="h-full overflow-hidden rounded-[28px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-strong)]/92 p-6">
        <ErrorState
          title="Contexto do portal indisponível"
          description={
            phaseMessage ??
            'O portal não conseguiu validar sua sessão agora.'
          }
          action={
            <AppButton disabled={isRefreshing} onClick={() => void refresh()}>
              {isRefreshing ? 'Tentando novamente...' : 'Tentar novamente'}
            </AppButton>
          }
        />
      </div>
    );
  }

  if (!activeContext) {
    return (
      <div className="h-full overflow-hidden rounded-[28px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-strong)]/92 p-6">
        <LoadingState
          title="Revalidando contexto do portal"
          description="Estamos confirmando o cliente ativo e a sessão do portal."
        />
      </div>
    );
  }

  return (
    <div className="h-full overflow-hidden" key={activeContext.tenantId}>
      <Outlet />
    </div>
  );
}

function ContextRail({
  activeContext,
}: {
  activeContext: CustomerPortalActiveTenantContext | null;
}) {
  return (
    <aside className="grid gap-3">
      <Panel
        title="Seu contexto"
        description="Dados seguros do vínculo autenticado com o cliente B2B."
        className="p-4"
      >
        {activeContext ? (
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--color-muted)]">
                Cliente
              </p>
              <p className="mt-1 font-semibold text-[color:var(--color-ink)]">
                {sanitizeCustomerFacingText(activeContext.tenantDisplayName)}
              </p>
            </div>
            <div className="grid gap-2">
              <InfoLine label="Contato" value={sanitizeCustomerFacingText(activeContext.contactFullName)} />
              <InfoLine label="Papel" value={portalRoleLabel(activeContext.portalRole)} />
              <InfoLine label="Produto" value={activeContext.productLine} />
              <InfoLine label="Status operacional" value={activeContext.operationalStatus} />
              <InfoLine label="Plano" value={activeContext.accountTier} />
            </div>
          </div>
        ) : (
          <InlineNotice tone="warning">
            Nenhum contexto do portal foi encontrado para esta sessão.
          </InlineNotice>
        )}
      </Panel>
    </aside>
  );
}

function InfoLine({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="rounded-[16px] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-2">
      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[color:var(--color-muted)]">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-[color:var(--color-ink)]">
        {value || 'Indisponível'}
      </p>
    </div>
  );
}

export function CustomerPortalHomePage() {
  const navigate = useNavigate();
  const { activeContext, refresh, reportOperationalNetworkIssue } =
    useCustomerPortalTenantContext();
  const [tickets, setTickets] = useState<CustomerPortalTicketListItem[]>([]);
  const [articles, setArticles] = useState<CustomerPortalKnowledgeArticle[]>([]);
  const [knowledgeSearchInput, setKnowledgeSearchInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  function handleKnowledgeDiscoverSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    navigate(
      buildPortalHelpSearchPath({
        query: knowledgeSearchInput,
      }),
    );
  }

  useEffect(() => {
    let cancelled = false;

    async function load() {
      if (!activeContext?.tenantId) {
        setTickets([]);
        setArticles([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setErrorMessage(null);

      try {
        const [nextTickets, nextArticles] = await Promise.all([
          fetchCustomerPortalTickets(),
          fetchCustomerPortalKnowledgeArticles(activeContext.tenantId),
        ]);

        if (!cancelled) {
          setTickets(nextTickets);
          setArticles(nextArticles);
        }
      } catch (error) {
        if (!cancelled) {
          const nextMessage = mapError(error, 'Falha ao abrir o portal cliente.');
          setTickets([]);
          setArticles([]);
          setErrorMessage(nextMessage);
          if (isNetworkRetryableAppError(error)) {
            reportOperationalNetworkIssue(nextMessage);
          }
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void load();

    return () => {
      cancelled = true;
    };
  }, [activeContext?.tenantId]);

  if (loading) {
    return (
      <div className="h-full overflow-hidden rounded-[28px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-strong)]/92 p-6">
        <LoadingState title="Carregando portal" description="Buscando seu contexto e tickets autorizados." />
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="h-full overflow-hidden rounded-[28px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-strong)]/92 p-6">
        {isContractUnavailableMessage(errorMessage) ? (
          <ContractUnavailableState contractName="portal cliente" />
        ) : (
          <ErrorState
            title={
              isNetworkRetryableMessage(errorMessage)
                ? 'Conexão indisponível'
                : 'Portal indisponível'
            }
            description={errorMessage}
            action={
              isNetworkRetryableMessage(errorMessage) ? (
                <AppButton disabled={loading} onClick={() => void refresh()}>
                  Tentar novamente
                </AppButton>
              ) : undefined
            }
          />
        )}
      </div>
    );
  }

  return (
    <div className="grid h-full min-h-0 gap-4 overflow-hidden xl:grid-cols-[minmax(0,1fr)_320px]">
      <section className="min-h-0 overflow-y-auto rounded-[28px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-strong)]/92 p-5 shadow-[var(--shadow-panel)]">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.26em] text-[color:var(--color-muted)]">
                Portal do cliente
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.05em] text-[color:var(--color-ink)]">
              Acompanhe seus tickets autorizados
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[color:var(--color-muted)]">
              Este portal mostra somente as informações autorizadas da sua conta e dos seus
              atendimentos.
            </p>
          </div>
          <Link to="/portal/tickets">
            <AppButton>Ver tickets</AppButton>
          </Link>
        </header>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <InfoLine label="Tickets visíveis" value={String(tickets.length)} />
          <InfoLine
            label="Com evidências"
            value={String(tickets.filter((ticket) => ticket.customerAttachmentCount > 0).length)}
          />
          <InfoLine
            label="Artigos autorizados"
            value={String(articles.length)}
          />
        </div>

        <Panel
          title="Últimos tickets"
          description="Lista oficial já preparada para o portal cliente."
          className="mt-5"
        >
          {tickets.length === 0 ? (
            <InlineNotice>Não há tickets visíveis para sua sessão neste momento.</InlineNotice>
          ) : (
            <div className="grid gap-3">
              {tickets.slice(0, 5).map((ticket) => (
                <TicketListRow key={ticket.ticketId} ticket={ticket} />
              ))}
            </div>
          )}
        </Panel>

        <Panel
          title="Central de ajuda autorizada"
          description="Conteúdo público ou autenticado já liberado para esta conta."
          className="mt-5"
        >
          <form className="mb-4 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]" onSubmit={handleKnowledgeDiscoverSubmit}>
            <Field
              label="Buscar na central autorizada"
              description="Use termos do problema, integração ou operação. A busca real acontece na camada autenticada."
            >
              <TextInput
                onChange={(event) => setKnowledgeSearchInput(event.target.value)}
                placeholder="Ex.: webhook, expedição, evidência"
                type="search"
                value={knowledgeSearchInput}
              />
            </Field>
            <div className="flex items-end">
              <AppButton className="w-full lg:w-auto" type="submit">
                Buscar artigo
              </AppButton>
            </div>
          </form>
          {articles.length === 0 ? (
            <InlineNotice>
              Nenhum artigo autenticado está liberado para esta sessão no momento.
            </InlineNotice>
          ) : (
            <div className="grid gap-3">
              {articles.slice(0, 4).map((article) => (
                <KnowledgeArticleCard key={article.articleId} article={article} />
              ))}
              <div className="pt-1">
                <Link to="/portal/help">
                  <GhostButton>Ver central autorizada</GhostButton>
                </Link>
              </div>
            </div>
          )}
        </Panel>
      </section>

      <div className="min-h-0 overflow-y-auto">
        <ContextRail activeContext={activeContext} />
      </div>
    </div>
  );
}

function TicketListRow({ ticket }: { ticket: CustomerPortalTicketListItem }) {
  return (
    <Link
      className="block w-full min-w-0 overflow-hidden rounded-[20px] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-4 py-4 transition hover:border-[color:var(--color-brand-blue)]/35 hover:bg-[color:var(--color-surface-strong)]"
      to={`/portal/tickets/${ticket.ticketId}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-semibold tracking-[-0.03em] text-[color:var(--color-ink)]">
            {sanitizeCustomerFacingText(ticket.title)}
          </p>
          <p className="mt-1 text-sm text-[color:var(--color-muted)]">
            Atualizado em {formatDate(ticket.updatedAt)}
          </p>
        </div>
        <StatusPill tone="accent">{ticket.customerStatusLabel}</StatusPill>
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-xs text-[color:var(--color-muted)]">
        <span>{sanitizeCustomerFacingText(ticket.customerOriginLabel)}</span>
        <span>{ticket.customerMessageCount} mensagens</span>
        <span>{ticket.customerAttachmentCount} evidências</span>
        <span>Artigos autorizados: Indisponível</span>
      </div>
    </Link>
  );
}

function KnowledgeArticleCard({
  article,
  compact = false,
}: {
  article: CustomerPortalKnowledgeArticle & { matchReason?: string | null };
  compact?: boolean;
}) {
  return (
    <Link
      className="block w-full min-w-0 overflow-hidden rounded-[20px] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-4 py-4 transition hover:border-[color:var(--color-brand-blue)]/35 hover:bg-[color:var(--color-surface-strong)]"
      to={buildPortalKnowledgePath(article.slug)}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate text-base font-semibold tracking-[-0.03em] text-[color:var(--color-ink)]">
            {sanitizeCustomerFacingText(article.title)}
          </p>
          <p className="mt-1 text-sm text-[color:var(--color-muted)]">
            {sanitizeCustomerFacingText(article.categoryName ?? 'Categoria indisponível')}
          </p>
        </div>
        <StatusPill tone={toneForKnowledgeSource(article.source)}>
          {sanitizeCustomerFacingText(article.sourceLabel || humanizeKnowledgeSourceLabel(article.source))}
        </StatusPill>
      </div>
      <p className="mt-3 text-sm leading-6 text-[color:var(--color-muted)]">
        {sanitizeCustomerFacingText(article.summary ?? 'Resumo indisponível.')}
      </p>
      {!compact && article.relationReason ? (
        <p className="mt-3 rounded-[16px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-strong)] px-3 py-2 text-xs leading-5 text-[color:var(--color-muted)]">
          {sanitizeCustomerFacingText(article.relationReason)}
        </p>
      ) : null}
      {article.matchReason ? (
        <p className="mt-3 break-words text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-brand-blue)]">
          Encontrado por: {article.matchReason}
        </p>
      ) : null}
    </Link>
  );
}

function PortalKnowledgeHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow: string;
  title: string;
  description: string;
}) {
  return (
    <header className="flex flex-wrap items-start justify-between gap-4">
      <div>
        <p className="text-[0.72rem] font-semibold uppercase tracking-[0.26em] text-[color:var(--color-muted)]">
          {eyebrow}
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-[-0.05em] text-[color:var(--color-ink)]">
          {title}
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[color:var(--color-muted)]">
          {description}
        </p>
      </div>
    </header>
  );
}

export function CustomerPortalHelpPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { activeContext, refresh, reportOperationalNetworkIssue } =
    useCustomerPortalTenantContext();
  const [browseArticles, setBrowseArticles] = useState<CustomerPortalKnowledgeArticle[]>([]);
  const [searchResults, setSearchResults] = useState<CustomerPortalKnowledgeSearchResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchLoading, setSearchLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [searchMessage, setSearchMessage] = useState<string | null>(null);
  const [searchInput, setSearchInput] = useState('');

  const activeQuery = normalizePortalSearchQuery(searchParams.get('q'));
  const selectedCategory = normalizePortalSearchQuery(searchParams.get('category'));
  const selectedSource = normalizePortalSearchSource(searchParams.get('source'));
  const activeTenantId = activeContext?.tenantId ?? null;

  const categoryOptions = useMemo(
    () =>
      Array.from(
        new Set(
          browseArticles
            .map((article) => article.categoryName?.trim() ?? '')
            .filter(Boolean),
        ),
      ).sort((left, right) => left.localeCompare(right, 'pt-BR')),
    [browseArticles],
  );

  const visibleArticles = searchResults;
  const publicArticleCount = browseArticles.filter((article) => article.source === 'public').length;
  const authorizedArticleCount = browseArticles.filter((article) => article.source !== 'public').length;
  const isShortQueryWithoutFilters =
    !selectedCategory &&
    selectedSource === 'all' &&
    activeQuery.length > 0 &&
    activeQuery.length < 2;

  const searchState = useMemo(() => {
    if (searchLoading) {
      return 'loading' as const;
    }

    if (searchMessage?.includes('não está disponível')) {
      return 'contract-unavailable' as const;
    }

    if (searchMessage) {
      return 'error' as const;
    }

    if (isShortQueryWithoutFilters) {
      return 'empty' as const;
    }

    if (visibleArticles.length === 0) {
      return 'empty' as const;
    }

    return 'ready' as const;
  }, [isShortQueryWithoutFilters, searchLoading, searchMessage, visibleArticles.length]);

  async function load() {
    if (!activeTenantId) {
      setBrowseArticles([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const nextArticles = await fetchCustomerPortalKnowledgeArticles(activeTenantId);
      setBrowseArticles(nextArticles);
    } catch (error) {
      const nextMessage = mapError(error, 'Falha ao carregar a central autorizada do portal.');
      setBrowseArticles([]);
      setErrorMessage(nextMessage);
      if (isNetworkRetryableAppError(error)) {
        reportOperationalNetworkIssue(nextMessage);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [activeTenantId]);

  useEffect(() => {
    setSearchInput(activeQuery);
  }, [activeQuery]);

  useEffect(() => {
    if (loading || errorMessage) {
      return;
    }

    if (!activeTenantId) {
      setSearchResults([]);
      setSearchMessage(null);
      return;
    }

    let cancelled = false;
    const tenantId = activeTenantId;
    const trimmedQuery = activeQuery.trim();

    if (!selectedCategory && selectedSource === 'all' && trimmedQuery && trimmedQuery.length < 2) {
      setSearchResults([]);
      setSearchMessage(null);
      setSearchLoading(false);
      return () => {
        cancelled = true;
      };
    }

    async function loadKnowledgeSearch() {
      setSearchLoading(true);
      setSearchMessage(null);

      try {
        const nextResults = await searchCustomerPortalKnowledgeArticles({
          tenantId,
          searchQuery: trimmedQuery || null,
          categoryName: selectedCategory || null,
          source: selectedSource,
          limit: 24,
          offset: 0,
        });

        if (!cancelled) {
          setSearchResults(nextResults);
        }
      } catch (error) {
        if (!cancelled) {
          const nextMessage = mapError(
            error,
            'Falha ao buscar artigos autorizados no portal.',
          );
          setSearchMessage(nextMessage);
          if (isNetworkRetryableAppError(error)) {
            reportOperationalNetworkIssue(nextMessage);
          }
          setSearchResults([]);
        }
      } finally {
        if (!cancelled) {
          setSearchLoading(false);
        }
      }
    }

    void loadKnowledgeSearch();

    return () => {
      cancelled = true;
    };
  }, [loading, errorMessage, activeTenantId, activeQuery, selectedCategory, selectedSource]);

  function updateSearchParams(next: {
    q?: string;
    category?: string;
    source?: string;
  }) {
    const params = new URLSearchParams(searchParams);
    const query = next.q ?? activeQuery;
    const category = next.category ?? selectedCategory;
    const source = next.source ?? selectedSource;

    if (query.trim()) {
      params.set('q', query.trim());
    } else {
      params.delete('q');
    }

    if (category.trim()) {
      params.set('category', category.trim());
    } else {
      params.delete('category');
    }

    if (source.trim() && source !== 'all') {
      params.set('source', source.trim());
    } else {
      params.delete('source');
    }

    setSearchParams(params, { replace: true });
  }

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    updateSearchParams({ q: searchInput });
  }

  function clearSearch() {
    setSearchInput('');
    updateSearchParams({ q: '', category: '', source: 'all' });
  }

  if (loading) {
    return (
      <div className="h-full rounded-[28px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-strong)]/92 p-6">
        <LoadingState
          title="Carregando central autorizada"
          description="Buscando artigos públicos e autenticados liberados para esta sessão."
        />
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="h-full rounded-[28px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-strong)]/92 p-6">
        {isContractUnavailableMessage(errorMessage) ? (
          <ContractUnavailableState contractName="central autorizada do portal" />
        ) : (
          <ErrorState
            title={
              isNetworkRetryableMessage(errorMessage)
                ? 'Conexão indisponível'
                : 'Central indisponível'
            }
            description={errorMessage}
            action={
              isNetworkRetryableMessage(errorMessage) ? (
                <AppButton disabled={loading} onClick={() => void refresh()}>
                  Tentar novamente
                </AppButton>
              ) : undefined
            }
          />
        )}
      </div>
    );
  }

  return (
    <div className="grid h-full min-h-0 gap-4 overflow-hidden xl:grid-cols-[minmax(0,1fr)_320px]">
      <section className="min-h-0 overflow-y-auto rounded-[28px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-strong)]/92 p-5 shadow-[var(--shadow-panel)]">
        <PortalKnowledgeHeader
          eyebrow="Central autorizada"
          title="Knowledge liberada para sua conta"
          description="A busca e a descoberta desta área respeitam liberações aprovadas, publicação concluída e vínculos reais com tickets permitidos."
        />

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <InfoLine label="Artigos visíveis" value={String(browseArticles.length)} />
          <InfoLine
            label="Públicos"
            value={String(publicArticleCount)}
          />
          <InfoLine
            label="Autorizados"
            value={String(authorizedArticleCount)}
          />
        </div>

        <Panel
          title="Buscar e navegar"
          description="Os filtros abaixo usam apenas dados reais desta conta. A busca nunca expõe conteúdo não liberado para você."
          className="mt-5"
        >
          <form className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_220px_220px_auto]" onSubmit={handleSearchSubmit}>
            <Field
              label="Buscar artigo"
              description="Procure por integração, operação, ticket ou conteúdo já aprovado."
            >
              <TextInput
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Ex.: webhook, expedição, evidência"
                type="search"
                value={searchInput}
              />
            </Field>
            <Field label="Categoria">
              <select
                className="h-11 rounded-[16px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-strong)] px-3 text-sm text-[color:var(--color-ink)]"
                onChange={(event) => updateSearchParams({ category: event.target.value })}
                value={selectedCategory}
              >
                <option value="">Todas</option>
                {categoryOptions.map((category) => (
                  <option key={category} value={category}>
                    {sanitizeCustomerFacingText(category)}
                  </option>
                ))}
              </select>
            </Field>
            <Field label="Origem">
              <select
                className="h-11 rounded-[16px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-strong)] px-3 text-sm text-[color:var(--color-ink)]"
                onChange={(event) => updateSearchParams({ source: event.target.value })}
                value={selectedSource}
              >
                <option value="all">Todas</option>
                <option value="public">Público</option>
                <option value="customer_portal">Autorizado no portal</option>
                <option value="ticket_linked">Relacionado ao ticket</option>
              </select>
            </Field>
            <div className="flex items-end gap-2">
              <AppButton className="w-full lg:w-auto" type="submit">
                Buscar
              </AppButton>
              {(activeQuery || selectedCategory || selectedSource !== 'all') ? (
                <GhostButton onClick={clearSearch} type="button">
                  Limpar
                </GhostButton>
              ) : null}
            </div>
          </form>

          <div className="mt-4 flex flex-wrap gap-2">
            <StatusPill tone="default">
              {visibleArticles.length} resultado{visibleArticles.length === 1 ? '' : 's'}
            </StatusPill>
            {activeQuery ? <StatusPill tone="accent">busca: {activeQuery}</StatusPill> : null}
            {selectedCategory ? (
              <StatusPill tone="default">categoria: {sanitizeCustomerFacingText(selectedCategory)}</StatusPill>
            ) : null}
            {selectedSource !== 'all' ? (
              <StatusPill tone="default">
                origem: {selectedSource === 'public'
                  ? 'Público'
                  : selectedSource === 'customer_portal'
                    ? 'Autorizado no portal'
                    : 'Relacionado ao ticket'}
              </StatusPill>
            ) : null}
          </div>
        </Panel>

        <Panel
          title="Resultados autorizados"
          description="Ordenação segura da plataforma, sem recomendações artificiais e sem depender de filtros locais."
          className="mt-5"
        >
          {searchState === 'loading' ? (
            <LoadingState
              title="Buscando artigos autorizados"
              description="Consultando a camada autenticada da Knowledge."
            />
          ) : null}

          {searchState === 'contract-unavailable' ? (
            <ContractUnavailableState contractName="busca autenticada do portal" />
          ) : null}

          {searchState === 'error' ? (
            <ErrorState
              title="Busca indisponível"
              description={searchMessage ?? 'Falha ao buscar artigos autorizados.'}
            />
          ) : null}

          {searchState === 'empty' ? (
            <InlineNotice>
              {isShortQueryWithoutFilters
                ? 'Digite pelo menos 2 caracteres para buscar ou use um filtro real da central autorizada.'
                : activeQuery || selectedCategory || selectedSource !== 'all'
                  ? 'Nenhum artigo autorizado corresponde aos filtros atuais.'
                : 'Nenhum artigo autenticado ou relacionado a ticket foi liberado para esta sessão.'}
            </InlineNotice>
          ) : null}

          {searchState === 'ready' ? (
            <div className="grid gap-3">
              {visibleArticles.map((article) => (
                <KnowledgeArticleCard key={article.articleId} article={article} />
              ))}
            </div>
          ) : null}
        </Panel>
      </section>

      <div className="min-h-0 overflow-y-auto">
        <ContextRail activeContext={activeContext} />
      </div>
    </div>
  );
}

function PortalKnowledgeInfoLine({
  label,
  value,
}: {
  label: string;
  value: string | null;
}) {
  return (
    <div className="rounded-[16px] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-2">
      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[color:var(--color-muted)]">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-[color:var(--color-ink)]">
        {value ?? 'Indisponível'}
      </p>
    </div>
  );
}

export function CustomerPortalHelpArticlePage() {
  const { articleSlug = '' } = useParams();
  const { activeContext, refresh, reportOperationalNetworkIssue } =
    useCustomerPortalTenantContext();
  const [article, setArticle] = useState<CustomerPortalKnowledgeArticleDetail | null>(null);
  const [articles, setArticles] = useState<CustomerPortalKnowledgeArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function load() {
    if (!activeContext?.tenantId) {
      setArticles([]);
      setArticle(null);
      setLoading(false);
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const [nextArticles, nextArticle] = await Promise.all([
        fetchCustomerPortalKnowledgeArticles(activeContext.tenantId),
        fetchCustomerPortalKnowledgeArticleDetail(activeContext.tenantId, articleSlug),
      ]);
      setArticles(nextArticles);
      setArticle(nextArticle);
    } catch (error) {
      const nextMessage = mapError(error, 'Falha ao carregar o artigo autorizado.');
      setArticles([]);
      setArticle(null);
      setErrorMessage(nextMessage);
      if (isNetworkRetryableAppError(error)) {
        reportOperationalNetworkIssue(nextMessage);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [activeContext?.tenantId, articleSlug]);

  if (loading) {
    return (
      <div className="h-full rounded-[28px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-strong)]/92 p-6">
        <LoadingState
          title="Carregando artigo"
          description="Buscando o detalhe autorizado deste conteúdo."
        />
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="h-full rounded-[28px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-strong)]/92 p-6">
        {isContractUnavailableMessage(errorMessage) ? (
          <ContractUnavailableState contractName="artigo autorizado do portal" />
        ) : (
          <ErrorState
            title={
              isNetworkRetryableMessage(errorMessage)
                ? 'Conexão indisponível'
                : 'Artigo indisponível'
            }
            description={errorMessage}
            action={
              isNetworkRetryableMessage(errorMessage) ? (
                <AppButton disabled={loading} onClick={() => void refresh()}>
                  Tentar novamente
                </AppButton>
              ) : undefined
            }
          />
        )}
      </div>
    );
  }

  if (!article) {
    return (
      <div className="h-full rounded-[28px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-strong)]/92 p-6">
        <ErrorState
          title="Artigo indisponível"
          description="Este conteúdo não está autorizado para a sua sessão no portal."
        />
      </div>
    );
  }

  const relatedArticles = articles
    .filter((candidate) => candidate.articleId !== article.articleId)
    .slice(0, 4);

  return (
    <div className="grid h-full min-h-0 gap-4 overflow-hidden xl:grid-cols-[minmax(0,1fr)_320px]">
      <section className="min-h-0 overflow-y-auto rounded-[28px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-strong)]/92 p-5 shadow-[var(--shadow-panel)]">
        <Link className="text-sm font-medium text-[color:var(--color-brand-blue)]" to="/portal/help">
          Voltar para a central autorizada
        </Link>
        <div className="mt-4 flex flex-wrap items-center gap-2">
          <StatusPill tone={toneForKnowledgeSource(article.source)}>
            {sanitizeCustomerFacingText(article.sourceLabel || humanizeKnowledgeSourceLabel(article.source))}
          </StatusPill>
          <StatusPill tone="default">
            {sanitizeCustomerFacingText(article.categoryName ?? 'Categoria indisponível')}
          </StatusPill>
        </div>
        <h1 className="mt-4 text-3xl font-semibold tracking-[-0.05em] text-[color:var(--color-ink)]">
          {sanitizeCustomerFacingText(article.title)}
        </h1>
        <p className="mt-2 max-w-3xl text-sm leading-6 text-[color:var(--color-muted)]">
          {sanitizeCustomerFacingText(article.summary ?? 'Resumo indisponível.')}
        </p>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <PortalKnowledgeInfoLine label="Publicação" value={formatDate(article.publishedAt)} />
          <PortalKnowledgeInfoLine label="Atualização" value={formatDate(article.updatedAt)} />
          <PortalKnowledgeInfoLine
            label="Origem do acesso"
            value={sanitizeCustomerFacingText(article.sourceLabel || humanizeKnowledgeSourceLabel(article.source))}
          />
        </div>

        {article.relationReason ? (
          <div className="mt-5 rounded-[20px] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-4 py-4">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-[color:var(--color-muted)]">
              Motivo da liberação
            </p>
            <p className="mt-2 text-sm leading-6 text-[color:var(--color-muted)]">
              {sanitizeCustomerFacingText(article.relationReason)}
            </p>
          </div>
        ) : null}

        <div className="mt-6 rounded-[28px] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-5 py-5">
          <MarkdownDocument source={sanitizeCustomerFacingText(article.bodyMd)} />
        </div>
      </section>

      <aside className="min-h-0 space-y-4 overflow-y-auto">
        <ContextRail activeContext={activeContext} />

        <Panel
          title="Outros artigos autorizados"
          description="Somente conteúdos já liberados para esta sessão no portal."
          className="p-4"
        >
          {relatedArticles.length === 0 ? (
            <InlineNotice>Nenhum outro artigo autorizado está disponível agora.</InlineNotice>
          ) : (
            <div className="grid gap-3">
              {relatedArticles.map((candidate) => (
                <KnowledgeArticleCard key={candidate.articleId} article={candidate} compact />
              ))}
            </div>
          )}
        </Panel>
      </aside>
    </div>
  );
}

export function CustomerPortalTicketsPage() {
  const navigate = useNavigate();
  const { activeContext, ensureFreshContext, refresh, reportOperationalNetworkIssue } =
    useCustomerPortalTenantContext();
  const [tickets, setTickets] = useState<CustomerPortalTicketListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  async function load() {
    if (!activeContext?.tenantId) {
      setTickets([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const nextTickets = await fetchCustomerPortalTickets();
      setTickets(nextTickets);
    } catch (error) {
      const nextMessage = mapError(error, 'Falha ao carregar tickets do portal cliente.');
      setTickets([]);
      setErrorMessage(nextMessage);
      if (isNetworkRetryableAppError(error)) {
        reportOperationalNetworkIssue(nextMessage);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [activeContext?.tenantId]);

  async function handleCreateTicket(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!activeContext) {
      setErrorMessage('Nenhum cliente disponível no portal pode abrir ticket agora.');
      return;
    }

    setCreating(true);
    setErrorMessage(null);

    try {
      const isFreshContext = await ensureFreshContext();
      if (!isFreshContext) {
        setErrorMessage('O contexto do portal mudou em outra aba. Atualize para criar o ticket na conta correta.');
        return;
      }

      const ticket = await createCustomerPortalTicket({
        description,
        tenantId: activeContext.tenantId,
        title,
      });
      setTitle('');
      setDescription('');
      navigate(`/portal/tickets/${ticket.ticketId}`);
    } catch (error) {
      const nextMessage = mapError(error, 'Falha ao criar ticket pelo portal cliente.');
      setErrorMessage(nextMessage);
      if (isNetworkRetryableAppError(error)) {
        reportOperationalNetworkIssue(nextMessage);
      }
    } finally {
      setCreating(false);
    }
  }

  if (loading) {
    return (
      <div className="h-full rounded-[28px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-strong)]/92 p-6">
        <LoadingState title="Carregando tickets" description="Buscando tickets autorizados da sua conta." />
      </div>
    );
  }

  return (
    <div className="grid h-full min-h-0 gap-4 overflow-hidden xl:grid-cols-[minmax(0,1fr)_360px]">
      <section className="min-h-0 overflow-y-auto rounded-[28px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-strong)]/92 p-5 shadow-[var(--shadow-panel)]">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.26em] text-[color:var(--color-muted)]">
              Tickets
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.05em] text-[color:var(--color-ink)]">
              Seus tickets
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[color:var(--color-muted)]">
              A lista já chega limitada à sua conta e ao seu papel no portal.
            </p>
          </div>
          <GhostButton onClick={() => void load()}>Atualizar</GhostButton>
        </header>

        {errorMessage ? (
          <div className="mt-5">
            <InlineNotice tone="critical">{errorMessage}</InlineNotice>
          </div>
        ) : null}

        <div className="mt-5 grid gap-3">
          {tickets.length === 0 ? (
            <InlineNotice>Não há tickets visíveis para sua sessão neste momento.</InlineNotice>
          ) : (
            tickets.map((ticket) => <TicketListRow key={ticket.ticketId} ticket={ticket} />)
          )}
        </div>
      </section>

      <aside className="min-h-0 overflow-y-auto rounded-[28px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-strong)]/92 p-5 shadow-[var(--shadow-panel)]">
        <h2 className="text-lg font-semibold tracking-[-0.03em] text-[color:var(--color-ink)]">
          Abrir ticket
        </h2>
        <p className="mt-1 text-sm leading-6 text-[color:var(--color-muted)]">
          A abertura segue as regras operacionais da plataforma. Categoria, SLA e roteamento continuam governados automaticamente.
        </p>
        <form className="mt-5 space-y-4" onSubmit={handleCreateTicket}>
          <Field label="Título">
            <TextInput
              onChange={(event) => setTitle(event.target.value)}
              placeholder="Resumo operacional do problema"
              required
              value={title}
            />
          </Field>
          <Field label="Descrição">
            <TextareaInput
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Descreva o contexto de forma objetiva."
              required
              value={description}
            />
          </Field>
          <AppButton disabled={creating || !activeContext} type="submit">
            {creating ? 'Criando ticket...' : 'Criar ticket'}
          </AppButton>
          {!activeContext ? (
            <InlineNotice tone="warning">
              Nenhum contexto de cliente ativo foi encontrado para habilitar criação.
            </InlineNotice>
          ) : null}
        </form>
      </aside>
    </div>
  );
}

export function CustomerPortalTicketPage() {
  const { ensureFreshContext, refresh, reportOperationalNetworkIssue } =
    useCustomerPortalTenantContext();
  const { ticketId = '' } = useParams();
  const [detail, setDetail] = useState<CustomerPortalTicketDetail | null>(null);
  const [collaborationState, setCollaborationState] =
    useState<CustomerPortalTicketCollaborationState | null>(null);
  const [timeline, setTimeline] = useState<CustomerPortalTicketTimelineItem[]>([]);
  const [attachments, setAttachments] = useState<CustomerPortalTicketAttachment[]>([]);
  const [articles, setArticles] = useState<CustomerPortalTicketKnowledgeLink[]>([]);
  const [knowledgeSearchQuery, setKnowledgeSearchQuery] = useState('');
  const [knowledgeSearchResults, setKnowledgeSearchResults] = useState<
    CustomerPortalKnowledgeSearchResult[]
  >([]);
  const [knowledgeSearchLoading, setKnowledgeSearchLoading] = useState(false);
  const [knowledgeSearchMessage, setKnowledgeSearchMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingAttachment, setUploadingAttachment] = useState(false);
  const [message, setMessage] = useState('');
  const [reopenReason, setReopenReason] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function load() {
    if (!ticketId) {
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const [
        nextDetail,
        nextCollaborationState,
        nextTimeline,
        nextAttachments,
        nextArticles,
      ] = await Promise.all([
        fetchCustomerPortalTicketDetail(ticketId),
        fetchCustomerPortalTicketCollaborationState(ticketId),
        fetchCustomerPortalTicketTimeline(ticketId),
        fetchCustomerPortalTicketAttachments(ticketId),
        fetchCustomerPortalTicketKnowledgeLinks(ticketId),
      ]);
      setDetail(nextDetail);
      setCollaborationState(nextCollaborationState);
      setTimeline(nextTimeline);
      setAttachments(nextAttachments);
      setArticles(nextArticles);
    } catch (error) {
      const nextMessage = mapError(error, 'Falha ao carregar o ticket.');
      setDetail(null);
      setCollaborationState(null);
      setTimeline([]);
      setAttachments([]);
      setArticles([]);
      setKnowledgeSearchResults([]);
      setErrorMessage(nextMessage);
      if (isNetworkRetryableAppError(error)) {
        reportOperationalNetworkIssue(nextMessage);
      }
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [ticketId]);

  useEffect(() => {
    if (!detail || !ticketId) {
      setKnowledgeSearchResults([]);
      setKnowledgeSearchMessage(null);
      return;
    }

    let cancelled = false;
    const tenantId = detail.tenantId;

    async function loadKnowledgeDiscoverability() {
      setKnowledgeSearchLoading(true);
      setKnowledgeSearchMessage(null);

      try {
        const nextResults = await searchCustomerPortalKnowledgeArticles({
          tenantId,
          ticketId,
          searchQuery: knowledgeSearchQuery.trim() || null,
          limit: 6,
          offset: 0,
        });

        if (!cancelled) {
          setKnowledgeSearchResults(nextResults);
        }
      } catch (error) {
        if (!cancelled) {
          const nextMessage = mapError(
            error,
            'Falha ao buscar artigos autorizados no contexto do ticket.',
          );
          setKnowledgeSearchMessage(nextMessage);
          if (isNetworkRetryableAppError(error)) {
            reportOperationalNetworkIssue(nextMessage);
          }
          setKnowledgeSearchResults([]);
        }
      } finally {
        if (!cancelled) {
          setKnowledgeSearchLoading(false);
        }
      }
    }

    void loadKnowledgeDiscoverability();

    return () => {
      cancelled = true;
    };
  }, [detail, knowledgeSearchQuery, ticketId]);

  const contextualArticles = useMemo(
    () =>
      knowledgeSearchResults.filter(
        (candidate) => !articles.some((linkedArticle) => linkedArticle.articleId === candidate.articleId),
      ),
    [articles, knowledgeSearchResults],
  );

  async function handleAddMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!ticketId || !message.trim()) {
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const isFreshContext = await ensureFreshContext();
      if (!isFreshContext) {
        setErrorMessage('O contexto do portal mudou em outra aba. Atualize antes de responder este ticket.');
        return;
      }

      await addCustomerPortalTicketMessage({ body: message, ticketId });
      setMessage('');
      setSuccessMessage('Mensagem registrada no ticket.');
      await load();
    } catch (error) {
      const nextMessage = mapError(error, 'Falha ao registrar mensagem.');
      setErrorMessage(nextMessage);
      if (isNetworkRetryableAppError(error)) {
        reportOperationalNetworkIssue(nextMessage);
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAcknowledge() {
    const lastEntryId =
      collaborationState?.latestTimelineEntryId ??
      timeline[timeline.length - 1]?.timelineEntryId ??
      null;

    setSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const isFreshContext = await ensureFreshContext();
      if (!isFreshContext) {
        setErrorMessage('O contexto do portal mudou em outra aba. Atualize antes de registrar a leitura.');
        return;
      }

      await acknowledgeCustomerPortalTicketUpdate({
        lastTimelineEntryId: lastEntryId,
        ticketId,
      });
      setSuccessMessage('Atualização marcada como lida.');
      await load();
    } catch (error) {
      const nextMessage = mapError(error, 'Falha ao marcar atualização como lida.');
      setErrorMessage(nextMessage);
      if (isNetworkRetryableAppError(error)) {
        reportOperationalNetworkIssue(nextMessage);
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDownload(attachment: CustomerPortalTicketAttachment) {
    setErrorMessage(null);

    try {
      const isFreshContext = await ensureFreshContext();
      if (!isFreshContext) {
        setErrorMessage('O contexto do portal mudou em outra aba. Atualize antes de baixar esta evidência.');
        return;
      }

      const download = await downloadCustomerPortalTicketAttachment(attachment.attachmentId);
      window.open(download.signedUrl, '_blank', 'noopener,noreferrer');
    } catch (error) {
      const nextMessage = mapError(error, 'Falha ao abrir download seguro.');
      setErrorMessage(nextMessage);
      if (isNetworkRetryableAppError(error)) {
        reportOperationalNetworkIssue(nextMessage);
      }
    }
  }

  async function handleAttachmentUpload(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!detail || !ticketId) {
      return;
    }

    const fileInput = event.currentTarget.elements.namedItem('evidence') as HTMLInputElement | null;
    const file = fileInput?.files?.[0] ?? null;

    setErrorMessage(null);
    setSuccessMessage(null);

    if (!(collaborationState?.canReply ?? detail.canAddMessage)) {
      setErrorMessage('Este status não aceita novas evidências pelo portal.');
      return;
    }

    if (!file) {
      setErrorMessage('Selecione uma evidência antes de enviar.');
      return;
    }

    if (!isCustomerAttachmentTypeAllowed(file)) {
      setErrorMessage(`Tipo de arquivo não permitido. Use ${describeCustomerAttachmentLimits()}`);
      return;
    }

    if (file.size <= 0 || file.size > CUSTOMER_PORTAL_ATTACHMENT_MAX_SIZE_BYTES) {
      setErrorMessage(`Tamanho inválido. Use ${describeCustomerAttachmentLimits()}`);
      return;
    }

    setUploadingAttachment(true);

    try {
      const isFreshContext = await ensureFreshContext();
      if (!isFreshContext) {
        setErrorMessage('O contexto do portal mudou em outra aba. Atualize antes de enviar a evidência.');
        return;
      }

      await uploadCustomerPortalTicketAttachment({
        file,
        tenantId: detail.tenantId,
        ticketId,
      });
      if (fileInput) {
        fileInput.value = '';
      }
      setSuccessMessage('Evidência enviada com segurança.');
      await load();
    } catch (error) {
      const nextMessage = mapError(error, 'Falha ao enviar evidência pelo portal.');
      setErrorMessage(nextMessage);
      if (isNetworkRetryableAppError(error)) {
        reportOperationalNetworkIssue(nextMessage);
      }
    } finally {
      setUploadingAttachment(false);
    }
  }

  async function handleConfirmResolution() {
    if (!ticketId) {
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const isFreshContext = await ensureFreshContext();
      if (!isFreshContext) {
        setErrorMessage('O contexto do portal mudou em outra aba. Atualize antes de confirmar a resolução.');
        return;
      }

      await confirmCustomerPortalTicketResolved({ ticketId });
      setSuccessMessage('Resolução confirmada. O ticket foi encerrado pelo fluxo do portal.');
      await load();
    } catch (error) {
      const nextMessage = mapError(error, 'Falha ao confirmar resolução.');
      setErrorMessage(nextMessage);
      if (isNetworkRetryableAppError(error)) {
        reportOperationalNetworkIssue(nextMessage);
      }
    } finally {
      setSubmitting(false);
    }
  }

  async function handleRequestReopen(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!ticketId || !reopenReason.trim()) {
      setErrorMessage('Informe o motivo para solicitar reabertura.');
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      const isFreshContext = await ensureFreshContext();
      if (!isFreshContext) {
        setErrorMessage('O contexto do portal mudou em outra aba. Atualize antes de solicitar a reabertura.');
        return;
      }

      await requestCustomerPortalTicketReopen({
        reason: reopenReason,
        ticketId,
      });
      setReopenReason('');
      setSuccessMessage('Reabertura solicitada. A equipe Genius recebeu o retorno.');
      await load();
    } catch (error) {
      const nextMessage = mapError(error, 'Falha ao solicitar reabertura.');
      setErrorMessage(nextMessage);
      if (isNetworkRetryableAppError(error)) {
        reportOperationalNetworkIssue(nextMessage);
      }
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="h-full rounded-[28px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-strong)]/92 p-6">
        <LoadingState title="Carregando ticket" description="Buscando detalhe, timeline e evidências autorizadas." />
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="h-full rounded-[28px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-strong)]/92 p-6">
        <ErrorState
          title={
            isNetworkRetryableMessage(errorMessage)
              ? 'Conexão indisponível'
              : 'Ticket indisponível'
          }
          description={errorMessage ?? 'Este ticket não está disponível para a sua sessão no portal.'}
          action={
              errorMessage && isNetworkRetryableMessage(errorMessage) ? (
                <AppButton disabled={loading} onClick={() => void refresh()}>
                  Tentar novamente
                </AppButton>
              ) : undefined
          }
        />
      </div>
    );
  }

  return (
    <div className="grid h-full min-h-0 gap-4 overflow-hidden xl:grid-cols-[minmax(0,1fr)_360px]">
      <section className="min-h-0 overflow-y-auto rounded-[28px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-strong)]/92 p-5 shadow-[var(--shadow-panel)]">
        <Link className="text-sm font-medium text-[color:var(--color-brand-blue)]" to="/portal/tickets">
          Voltar para tickets
        </Link>
        <header className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill tone="accent">
                {collaborationState?.customerStatusLabel ?? detail.customerStatusLabel}
              </StatusPill>
              {collaborationState?.hasNewUpdates ? (
                <StatusPill tone="warning">
                  {collaborationState.unreadCount} atualização(ões) nova(s)
                </StatusPill>
              ) : (
                <StatusPill tone="default">Sem atualização nova</StatusPill>
              )}
            </div>
            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-[color:var(--color-ink)]">
              {sanitizeCustomerFacingText(detail.title)}
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[color:var(--color-muted)]">
              {sanitizeCustomerFacingText(detail.description)}
            </p>
          </div>
          <GhostButton
            disabled={submitting || !(collaborationState?.canAcknowledge ?? false)}
            onClick={() => void handleAcknowledge()}
          >
            {submitting ? 'Registrando...' : 'Marcar como lido'}
          </GhostButton>
        </header>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <InfoLine label="Cliente" value={sanitizeCustomerFacingText(detail.tenantDisplayName)} />
          <InfoLine label="Solicitante" value={sanitizeCustomerFacingText(detail.requesterContactFullName)} />
          <InfoLine label="Origem" value={detail.customerOriginLabel} />
          <InfoLine label="Atualizado" value={formatDate(detail.updatedAt)} />
          <InfoLine
            label="Última resposta Genius"
            value={formatDate(collaborationState?.lastSupportResponseAt ?? null)}
          />
          <InfoLine
            label="Sua última resposta"
            value={formatDate(collaborationState?.lastCustomerMessageAt ?? null)}
          />
          <InfoLine
            label="Última leitura"
            value={formatDate(collaborationState?.lastAcknowledgedAt ?? null)}
          />
        </div>

        {errorMessage ? (
          <div className="mt-5">
            <InlineNotice tone="critical">{errorMessage}</InlineNotice>
          </div>
        ) : null}
        {successMessage ? (
          <div className="mt-5">
            <InlineNotice tone="positive">{successMessage}</InlineNotice>
          </div>
        ) : null}

        <Panel
          title="Timeline"
          description="Somente mensagens e atualizações liberadas para acompanhamento do cliente aparecem aqui."
          className="mt-5"
        >
          {timeline.length === 0 ? (
            <InlineNotice>Não há atualizações visíveis neste ticket.</InlineNotice>
          ) : (
            <div className="grid gap-3">
              {timeline.map((item) => (
                <article
                  className="rounded-[20px] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-4 py-4"
                  key={item.timelineEntryId}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-sm font-semibold text-[color:var(--color-ink)]">
                      {sanitizeCustomerFacingText(item.entryType === 'message' ? item.actorLabel : item.eventLabel)}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 text-xs text-[color:var(--color-muted)]">
                      <span>{sanitizeCustomerFacingText(item.customerEntryLabel)}</span>
                      <span>{formatDate(item.occurredAt)}</span>
                    </div>
                  </div>
                  {item.body ? (
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[color:var(--color-muted)]">
                      {sanitizeCustomerFacingText(item.body)}
                    </p>
                  ) : (
                    <p className="mt-3 text-sm leading-6 text-[color:var(--color-muted)]">
                      Atualização registrada no ticket.
                    </p>
                  )}
                </article>
              ))}
            </div>
          )}
        </Panel>

        {(collaborationState?.canReply ?? detail.canAddMessage) ? (
          <Panel title="Responder" description="Mensagem pública do cliente no ticket." className="mt-5">
            <form className="space-y-4" onSubmit={handleAddMessage}>
              <TextareaInput
                onChange={(event) => setMessage(event.target.value)}
                placeholder="Escreva uma atualização para o suporte."
                required
                value={message}
              />
              <AppButton disabled={submitting} type="submit">
                {submitting ? 'Registrando...' : 'Enviar mensagem'}
              </AppButton>
            </form>
          </Panel>
        ) : (
          <div className="mt-5">
            <InlineNotice tone="warning">
              Este status não aceita novas mensagens pelo portal.
            </InlineNotice>
          </div>
        )}
      </section>

      <aside className="min-h-0 space-y-4 overflow-y-auto">
        <Panel
          title="Resolução"
          description="Ações disponíveis conforme as regras operacionais desta conta."
          className="p-4"
        >
          {collaborationState?.canConfirmResolution ? (
            <div className="rounded-[18px] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-3">
              <p className="text-sm font-semibold text-[color:var(--color-ink)]">
                O suporte marcou este ticket como resolvido.
              </p>
              <p className="mt-1 text-xs leading-5 text-[color:var(--color-muted)]">
                Confirme apenas se a operação voltou ao estado esperado.
              </p>
              <AppButton
                className="mt-3 w-full"
                disabled={submitting}
                onClick={() => void handleConfirmResolution()}
              >
                Confirmar resolução
              </AppButton>
            </div>
          ) : null}

          {collaborationState?.canRequestReopen ? (
            <form className="mt-3 space-y-3" onSubmit={handleRequestReopen}>
              <Field
                label="Solicitar reabertura"
                description="Informe o motivo operacional para devolver o ticket ao suporte."
              >
                <TextareaInput
                  onChange={(event) => setReopenReason(event.target.value)}
                  placeholder="Descreva o que voltou a ocorrer."
                  required
                  value={reopenReason}
                />
              </Field>
              <GhostButton className="w-full" disabled={submitting} type="submit">
                Solicitar reabertura
              </GhostButton>
            </form>
          ) : null}

          {!collaborationState?.canConfirmResolution &&
          !collaborationState?.canRequestReopen ? (
            <InlineNotice>
              Confirmação de resolução e reabertura ficam disponíveis apenas quando o status do ticket permitir.
            </InlineNotice>
          ) : null}
        </Panel>

        <Panel
          title="Evidências"
          description="Uploads e downloads seguem acesso seguro. Endereços internos nunca são exibidos."
          className="p-4"
        >
          {(collaborationState?.canReply ?? detail.canAddMessage) ? (
            <form className="mb-4 space-y-3" onSubmit={handleAttachmentUpload}>
              <Field
                label="Adicionar evidência"
                description={describeCustomerAttachmentLimits()}
              >
                <input
                  accept={CUSTOMER_PORTAL_ATTACHMENT_ALLOWED_TYPES.join(',')}
                  className="block w-full rounded-[16px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-strong)] px-3 py-2 text-sm text-[color:var(--color-ink)] file:mr-3 file:rounded-full file:border-0 file:bg-[color:var(--color-brand-blue)]/10 file:px-3 file:py-1.5 file:text-xs file:font-semibold file:text-[color:var(--color-brand-blue)]"
                  disabled={uploadingAttachment}
                  name="evidence"
                  type="file"
                />
              </Field>
              <AppButton className="w-full" disabled={uploadingAttachment} type="submit">
                {uploadingAttachment ? 'Enviando evidência...' : 'Enviar evidência'}
              </AppButton>
            </form>
          ) : (
            <div className="mb-4">
              <InlineNotice tone="warning">
                Este status não aceita novas evidências pelo portal.
              </InlineNotice>
            </div>
          )}

          {attachments.length === 0 ? (
            <InlineNotice>Não há evidências visíveis para este ticket.</InlineNotice>
          ) : (
            <div className="grid gap-3">
              {attachments.map((attachment) => (
                <div
                  className="rounded-[18px] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-3"
                  key={attachment.attachmentId}
                >
                  <p className="text-sm font-semibold text-[color:var(--color-ink)]">
                    {attachment.displayName}
                  </p>
                  <p className="mt-1 text-xs text-[color:var(--color-muted)]">
                    {attachment.sizeLabel} · {attachment.uploadedByLabel}
                  </p>
                  <GhostButton
                    className="mt-3"
                    disabled={!attachment.canDownload}
                    onClick={() => void handleDownload(attachment)}
                  >
                    Abrir download seguro
                  </GhostButton>
                </div>
              ))}
            </div>
          )}
        </Panel>

        <Panel
          title="Artigos relacionados"
          description="Somente artigos autorizados para este ticket. Conteúdo interno e materiais ainda não publicados não aparecem aqui."
          className="p-4"
        >
          {articles.length === 0 ? (
            <InlineNotice>Nenhum artigo autorizado foi vinculado a este ticket.</InlineNotice>
          ) : (
            <div className="grid gap-3">
              {articles.map((article) => (
                <KnowledgeArticleCard key={article.articleId} article={article} compact />
              ))}
            </div>
          )}
        </Panel>

        <Panel
          title="Buscar na central autorizada"
          description="Descoberta contextual segura, sem expor conteúdo fora do seu ticket ou da sua conta."
          className="p-4"
        >
          <Field
            label="Buscar artigo autorizado"
            description="Procure por integração, operação ou orientação aprovada relacionada ao contexto deste ticket."
          >
            <TextInput
              onChange={(event) => setKnowledgeSearchQuery(event.target.value)}
              placeholder="Ex.: webhook, expedição, evidência"
              type="search"
              value={knowledgeSearchQuery}
            />
          </Field>

          {knowledgeSearchMessage ? (
            <div className="mt-3">
              <InlineNotice tone="critical">{knowledgeSearchMessage}</InlineNotice>
            </div>
          ) : null}

          {knowledgeSearchLoading ? (
            <div className="mt-3">
              <LoadingState
                title="Buscando artigos autorizados"
                description="Consultando a Knowledge liberada para este ticket."
              />
            </div>
          ) : null}

          {!knowledgeSearchLoading && !knowledgeSearchMessage ? (
            <div className="mt-3 grid gap-3">
              {contextualArticles.length === 0 ? (
                <InlineNotice>
                  {knowledgeSearchQuery.trim()
                    ? 'Nenhum outro artigo autorizado corresponde a esta busca.'
                    : 'Nenhum outro artigo autorizado foi encontrado além dos vínculos já existentes.'}
                </InlineNotice>
              ) : (
                contextualArticles.map((article) => (
                  <KnowledgeArticleCard key={article.articleId} article={article} compact />
                ))
              )}
            </div>
          ) : null}
        </Panel>
      </aside>
    </div>
  );
}
