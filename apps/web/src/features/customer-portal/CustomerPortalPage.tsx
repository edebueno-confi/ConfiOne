import { type FormEvent, type ReactNode, useEffect, useState } from 'react';
import { Link, NavLink, Navigate, Outlet, useLocation, useNavigate, useParams } from 'react-router-dom';
import {
  ContractUnavailableState,
  ErrorState,
  LoadingState,
  StateFrame,
} from '../../components/states';
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
  CustomerPortalKnowledgeArticle,
  CustomerPortalProfileContext,
  CustomerPortalTicketAttachment,
  CustomerPortalTicketDetail,
  CustomerPortalTicketListItem,
  CustomerPortalTicketTimelineItem,
} from '../../contracts/support-contracts';
import { useAuthContext } from '../auth/auth-context';
import {
  acknowledgeCustomerPortalTicketUpdate,
  addCustomerPortalTicketMessage,
  createCustomerPortalTicket,
  downloadCustomerPortalTicketAttachment,
  fetchCustomerPortalContexts,
  fetchCustomerPortalKnowledgeArticles,
  fetchCustomerPortalTicketAttachments,
  fetchCustomerPortalTicketDetail,
  fetchCustomerPortalTicketTimeline,
  fetchCustomerPortalTickets,
} from './customer-portal-api';

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

function PortalShell({ children }: { children: ReactNode }) {
  const { signOut, user } = useAuthContext();

  return (
    <div className="h-screen overflow-hidden bg-[linear-gradient(180deg,#eef4ff_0%,#f7faff_46%,#f2f5fb_100%)] text-[color:var(--color-ink)]">
      <div className="mx-auto flex h-full max-w-[1600px] gap-4 px-4 py-4">
        <aside className="hidden h-full w-[230px] shrink-0 flex-col rounded-[28px] bg-[linear-gradient(180deg,#06173f_0%,#082058_54%,#0b2a68_100%)] p-3 text-white shadow-[0_24px_50px_rgba(9,20,56,0.22)] lg:flex">
          <div className="px-2 pt-2">
            <p className="text-[0.62rem] font-semibold uppercase tracking-[0.24em] text-white/48">
              Genius
            </p>
            <h1 className="mt-1 text-lg font-semibold tracking-[-0.05em]">
              Portal cliente
            </h1>
            <p className="mt-2 text-xs leading-5 text-white/58">
              Acesso autenticado ao próprio contexto B2B.
            </p>
          </div>

          <nav className="mt-6 grid gap-2">
            {[
              { label: 'Visão operacional', to: '/portal' },
              { label: 'Tickets', to: '/portal/tickets' },
            ].map((item) => (
              <NavLink
                className={({ isActive }) =>
                  cx(
                    'rounded-[16px] px-3 py-3 text-sm font-medium transition',
                    isActive
                      ? 'bg-[linear-gradient(135deg,#1f67ff,#2f7eff)] text-white shadow-[0_12px_22px_rgba(18,81,213,0.25)]'
                      : 'text-white/72 hover:bg-white/9 hover:text-white',
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

          <div className="mt-auto rounded-[20px] border border-white/10 bg-white/7 p-3">
            <p className="truncate text-sm font-semibold text-white">
              {user?.email ?? 'Sessão autenticada'}
            </p>
            <p className="mt-1 text-xs text-white/58">Cliente B2B</p>
            <GhostButton
              className="mt-3 w-full border-white/12 bg-white/10 text-white hover:bg-white/16"
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
          description="Estamos validando sua sessão customer-facing."
        />
      </div>
    );
  }

  if (phase === 'anonymous') {
    const redirectTo = `${location.pathname}${location.search}`;
    return <Navigate replace to={`/login?redirectTo=${encodeURIComponent(redirectTo)}`} />;
  }

  return <PortalShell>{children}</PortalShell>;
}

export function CustomerPortalLayout() {
  return <Outlet />;
}

function ContextRail({ contexts }: { contexts: CustomerPortalProfileContext[] }) {
  const primary = contexts[0] ?? null;

  return (
    <aside className="grid gap-3">
      <Panel
        title="Seu contexto"
        description="Dados seguros do vínculo autenticado com o cliente B2B."
        className="p-4"
      >
        {primary ? (
          <div className="space-y-3 text-sm">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[color:var(--color-muted)]">
                Cliente
              </p>
              <p className="mt-1 font-semibold text-[color:var(--color-ink)]">
                {primary.tenantDisplayName}
              </p>
            </div>
            <div className="grid gap-2">
              <InfoLine label="Contato" value={primary.contactFullName} />
              <InfoLine label="Papel" value={primary.portalRole === 'customer_manager' ? 'Gestão cliente' : 'Usuário cliente'} />
              <InfoLine label="Produto" value={primary.productLine} />
              <InfoLine label="Status operacional" value={primary.operationalStatus} />
              <InfoLine label="Plano" value={primary.accountTier} />
            </div>
          </div>
        ) : (
          <InlineNotice tone="warning">
            Nenhum contexto customer-facing foi encontrado para esta sessão.
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
  const [contexts, setContexts] = useState<CustomerPortalProfileContext[]>([]);
  const [tickets, setTickets] = useState<CustomerPortalTicketListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);
      setErrorMessage(null);

      try {
        const [nextContexts, nextTickets] = await Promise.all([
          fetchCustomerPortalContexts(),
          fetchCustomerPortalTickets(),
        ]);

        if (!cancelled) {
          setContexts(nextContexts);
          setTickets(nextTickets);
        }
      } catch (error) {
        if (!cancelled) {
          setErrorMessage(mapError(error, 'Falha ao abrir o portal cliente.'));
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
  }, []);

  if (loading) {
    return (
      <div className="h-full overflow-hidden rounded-[28px] border border-[color:var(--color-border)] bg-white/92 p-6">
        <LoadingState title="Carregando portal" description="Buscando seu contexto e tickets autorizados." />
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="h-full overflow-hidden rounded-[28px] border border-[color:var(--color-border)] bg-white/92 p-6">
        {errorMessage.includes('não está disponível') ? (
          <ContractUnavailableState contractName="portal cliente" />
        ) : (
          <ErrorState title="Portal indisponível" description={errorMessage} />
        )}
      </div>
    );
  }

  return (
    <div className="grid h-full min-h-0 gap-4 overflow-hidden xl:grid-cols-[minmax(0,1fr)_320px]">
      <section className="min-h-0 overflow-y-auto rounded-[28px] border border-[color:var(--color-border)] bg-white/92 p-5 shadow-[var(--shadow-panel)]">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.26em] text-[color:var(--color-muted)]">
              Portal cliente B2B
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.05em] text-[color:var(--color-ink)]">
              Acompanhe seus tickets autorizados
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[color:var(--color-muted)]">
              Este portal mostra somente dados do seu tenant, sem contexto interno de suporte,
              engenharia, auditoria ou rascunhos de Knowledge.
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
            label="Artigos enviados"
            value={String(tickets.reduce((total, ticket) => total + ticket.publicArticleCount, 0))}
          />
        </div>

        <Panel
          title="Últimos tickets"
          description="Lista derivada do backend, já sanitizada para o portal cliente."
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
      </section>

      <div className="min-h-0 overflow-y-auto">
        <ContextRail contexts={contexts} />
      </div>
    </div>
  );
}

function TicketListRow({ ticket }: { ticket: CustomerPortalTicketListItem }) {
  return (
    <Link
      className="block rounded-[20px] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-4 py-4 transition hover:border-[color:var(--color-brand-blue)]/35 hover:bg-white"
      to={`/portal/tickets/${ticket.ticketId}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-base font-semibold tracking-[-0.03em] text-[color:var(--color-ink)]">
            {ticket.title}
          </p>
          <p className="mt-1 text-sm text-[color:var(--color-muted)]">
            Atualizado em {formatDate(ticket.updatedAt)}
          </p>
        </div>
        <StatusPill tone="accent">{ticket.customerStatusLabel}</StatusPill>
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-xs text-[color:var(--color-muted)]">
        <span>{ticket.customerMessageCount} mensagens</span>
        <span>{ticket.customerAttachmentCount} evidências</span>
        <span>{ticket.publicArticleCount} artigos</span>
      </div>
    </Link>
  );
}

export function CustomerPortalTicketsPage() {
  const navigate = useNavigate();
  const [contexts, setContexts] = useState<CustomerPortalProfileContext[]>([]);
  const [tickets, setTickets] = useState<CustomerPortalTicketListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [creating, setCreating] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');

  async function load() {
    setLoading(true);
    setErrorMessage(null);

    try {
      const [nextContexts, nextTickets] = await Promise.all([
        fetchCustomerPortalContexts(),
        fetchCustomerPortalTickets(),
      ]);
      setContexts(nextContexts);
      setTickets(nextTickets);
    } catch (error) {
      setErrorMessage(mapError(error, 'Falha ao carregar tickets do portal cliente.'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, []);

  async function handleCreateTicket(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const primaryContext = contexts[0] ?? null;

    if (!primaryContext) {
      setErrorMessage('Nenhum tenant customer-facing disponível para criar ticket.');
      return;
    }

    setCreating(true);
    setErrorMessage(null);

    try {
      const ticket = await createCustomerPortalTicket({
        description,
        tenantId: primaryContext.tenantId,
        title,
      });
      setTitle('');
      setDescription('');
      navigate(`/portal/tickets/${ticket.ticketId}`);
    } catch (error) {
      setErrorMessage(mapError(error, 'Falha ao criar ticket pelo portal cliente.'));
    } finally {
      setCreating(false);
    }
  }

  if (loading) {
    return (
      <div className="h-full rounded-[28px] border border-[color:var(--color-border)] bg-white/92 p-6">
        <LoadingState title="Carregando tickets" description="Buscando tickets autorizados do seu tenant." />
      </div>
    );
  }

  return (
    <div className="grid h-full min-h-0 gap-4 overflow-hidden xl:grid-cols-[minmax(0,1fr)_360px]">
      <section className="min-h-0 overflow-y-auto rounded-[28px] border border-[color:var(--color-border)] bg-white/92 p-5 shadow-[var(--shadow-panel)]">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.26em] text-[color:var(--color-muted)]">
              Tickets
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.05em] text-[color:var(--color-ink)]">
              Seus tickets
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[color:var(--color-muted)]">
              A lista vem do backend já limitada ao seu tenant e ao seu papel customer-facing.
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

      <aside className="min-h-0 overflow-y-auto rounded-[28px] border border-[color:var(--color-border)] bg-white/92 p-5 shadow-[var(--shadow-panel)]">
        <h2 className="text-lg font-semibold tracking-[-0.03em] text-[color:var(--color-ink)]">
          Abrir ticket
        </h2>
        <p className="mt-1 text-sm leading-6 text-[color:var(--color-muted)]">
          Criação real via RPC customer-facing. Categoria, SLA e roteamento continuam governados pelo backend.
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
          <AppButton disabled={creating || contexts.length === 0} type="submit">
            {creating ? 'Criando ticket...' : 'Criar ticket'}
          </AppButton>
          {contexts.length === 0 ? (
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
  const { ticketId = '' } = useParams();
  const [detail, setDetail] = useState<CustomerPortalTicketDetail | null>(null);
  const [timeline, setTimeline] = useState<CustomerPortalTicketTimelineItem[]>([]);
  const [attachments, setAttachments] = useState<CustomerPortalTicketAttachment[]>([]);
  const [articles, setArticles] = useState<CustomerPortalKnowledgeArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function load() {
    if (!ticketId) {
      return;
    }

    setLoading(true);
    setErrorMessage(null);

    try {
      const [nextDetail, nextTimeline, nextAttachments, nextArticles] = await Promise.all([
        fetchCustomerPortalTicketDetail(ticketId),
        fetchCustomerPortalTicketTimeline(ticketId),
        fetchCustomerPortalTicketAttachments(ticketId),
        fetchCustomerPortalKnowledgeArticles(ticketId),
      ]);
      setDetail(nextDetail);
      setTimeline(nextTimeline);
      setAttachments(nextAttachments);
      setArticles(nextArticles);
    } catch (error) {
      setErrorMessage(mapError(error, 'Falha ao carregar o ticket.'));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
  }, [ticketId]);

  async function handleAddMessage(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!ticketId || !message.trim()) {
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await addCustomerPortalTicketMessage({ body: message, ticketId });
      setMessage('');
      setSuccessMessage('Mensagem registrada no ticket.');
      await load();
    } catch (error) {
      setErrorMessage(mapError(error, 'Falha ao registrar mensagem.'));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleAcknowledge() {
    const lastEntry = timeline[timeline.length - 1] ?? null;

    setSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await acknowledgeCustomerPortalTicketUpdate({
        lastTimelineEntryId: lastEntry?.timelineEntryId ?? null,
        ticketId,
      });
      setSuccessMessage('Atualização marcada como lida.');
    } catch (error) {
      setErrorMessage(mapError(error, 'Falha ao marcar atualização como lida.'));
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDownload(attachment: CustomerPortalTicketAttachment) {
    setErrorMessage(null);

    try {
      const download = await downloadCustomerPortalTicketAttachment(attachment.attachmentId);
      window.open(download.signedUrl, '_blank', 'noopener,noreferrer');
    } catch (error) {
      setErrorMessage(mapError(error, 'Falha ao abrir download seguro.'));
    }
  }

  if (loading) {
    return (
      <div className="h-full rounded-[28px] border border-[color:var(--color-border)] bg-white/92 p-6">
        <LoadingState title="Carregando ticket" description="Buscando detalhe, timeline e evidências autorizadas." />
      </div>
    );
  }

  if (!detail) {
    return (
      <div className="h-full rounded-[28px] border border-[color:var(--color-border)] bg-white/92 p-6">
        <ErrorState
          title="Ticket indisponível"
          description={errorMessage ?? 'Este ticket não está disponível para sua sessão customer-facing.'}
        />
      </div>
    );
  }

  return (
    <div className="grid h-full min-h-0 gap-4 overflow-hidden xl:grid-cols-[minmax(0,1fr)_360px]">
      <section className="min-h-0 overflow-y-auto rounded-[28px] border border-[color:var(--color-border)] bg-white/92 p-5 shadow-[var(--shadow-panel)]">
        <Link className="text-sm font-medium text-[color:var(--color-brand-blue)]" to="/portal/tickets">
          Voltar para tickets
        </Link>
        <header className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <StatusPill tone="accent">{detail.customerStatusLabel}</StatusPill>
            <h1 className="mt-3 text-3xl font-semibold tracking-[-0.05em] text-[color:var(--color-ink)]">
              {detail.title}
            </h1>
            <p className="mt-2 max-w-3xl text-sm leading-6 text-[color:var(--color-muted)]">
              {detail.description}
            </p>
          </div>
          <GhostButton disabled={submitting} onClick={() => void handleAcknowledge()}>
            Marcar como lido
          </GhostButton>
        </header>

        <div className="mt-5 grid gap-3 sm:grid-cols-3">
          <InfoLine label="Cliente" value={detail.tenantDisplayName} />
          <InfoLine label="Solicitante" value={detail.requesterContactFullName} />
          <InfoLine label="Atualizado" value={formatDate(detail.updatedAt)} />
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
          description="Somente mensagens e eventos customer-facing. Eventos internos e engenharia não são expostos aqui."
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
                      {item.entryType === 'message' ? item.actorLabel : item.eventLabel}
                    </p>
                    <p className="text-xs text-[color:var(--color-muted)]">
                      {formatDate(item.occurredAt)}
                    </p>
                  </div>
                  {item.body ? (
                    <p className="mt-3 whitespace-pre-wrap text-sm leading-6 text-[color:var(--color-muted)]">
                      {item.body}
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

        {detail.canAddMessage ? (
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
          title="Evidências"
          description="Downloads usam URL temporária segura. Path interno nunca é exibido."
          className="p-4"
        >
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
          description="Apenas conteúdo público publicado e enviado ao cliente."
          className="p-4"
        >
          {articles.length === 0 ? (
            <InlineNotice>Nenhum artigo público foi vinculado a este ticket.</InlineNotice>
          ) : (
            <div className="grid gap-3">
              {articles.map((article) => (
                <Link
                  className="block rounded-[18px] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-3 transition hover:border-[color:var(--color-brand-blue)]/35 hover:bg-white"
                  key={article.articleId}
                  to={article.publicArticlePath}
                >
                  <p className="text-sm font-semibold text-[color:var(--color-ink)]">
                    {article.articleTitle}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-[color:var(--color-muted)]">
                    {article.articleSummary ?? 'Sem resumo disponível.'}
                  </p>
                </Link>
              ))}
            </div>
          )}
        </Panel>
      </aside>
    </div>
  );
}
