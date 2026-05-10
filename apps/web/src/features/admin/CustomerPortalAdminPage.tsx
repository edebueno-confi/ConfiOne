import {
  type FormEvent,
  useEffect,
  useEffectEvent,
  useMemo,
  useState,
} from 'react';
import type { Uuid } from '@genius-support-os/contracts';
import { formatDateTime } from '../../app/format';
import {
  ContractUnavailableState,
  EmptyState,
  ErrorState,
  LoadingState,
} from '../../components/states';
import {
  AppButton,
  ContextSubsidebar,
  ContextSubsidebarSection,
  Field,
  GhostButton,
  InlineNotice,
  MetricCard,
  PageHeader,
  Panel,
  SelectInput,
  StatusPill,
  SummaryStrip,
  SummaryStripItem,
  TextareaInput,
  cx,
} from '../../components/ui';
import type {
  AdminCustomerPortalAccessOverviewRow,
  AdminCustomerPortalArticleCandidateRow,
  AdminCustomerPortalTicketCandidateRow,
  AdminCustomerPortalTenantAccessRow,
  AdminCustomerPortalUserDetailRow,
  AdminCustomerPortalUserRow,
  AdminKnowledgeEntitlementDetailRow,
  AdminKnowledgeEntitlementRow,
  AdminTicketKnowledgeLinkRow,
  CustomerPortalAccessStatus,
  CustomerPortalEntitlementScope,
  CustomerPortalEntitlementStatus,
  CustomerPortalRole,
  MembershipStatus,
} from '../../contracts/admin-contracts';
import {
  archiveKnowledgeArticleEntitlement,
  getAdminCustomerPortalAccessOverview,
  getAdminCustomerPortalUserDetail,
  getAdminKnowledgeEntitlementDetail,
  grantKnowledgeArticleEntitlement,
  linkKnowledgeArticleToTicket,
  listAdminCustomerPortalArticleCandidates,
  listAdminCustomerPortalTenantAccess,
  listAdminCustomerPortalTicketCandidates,
  listAdminCustomerPortalUsers,
  listAdminKnowledgeEntitlements,
  listAdminTicketKnowledgeLinks,
  unlinkKnowledgeArticleFromTicket,
  updateCustomerPortalUserRole,
  updateCustomerPortalUserStatus,
} from './admin-api';
import { classifyAdminError, type ClassifiedAdminError } from './admin-errors';

type PagePhase = 'loading' | 'ready' | 'contract-unavailable' | 'error';
type TenantFilter = 'all' | Uuid;
type UserAccessFilter = 'all' | CustomerPortalAccessStatus;
type EntitlementFilter = 'all' | CustomerPortalEntitlementStatus;

interface GrantEntitlementFormState {
  tenantId: string;
  articleId: string;
  scope: CustomerPortalEntitlementScope;
  relationReason: string;
}

interface LinkTicketArticleFormState {
  tenantId: string;
  ticketId: string;
  articleId: string;
  relationReason: string;
}

function formatOptionalDate(value: string | null) {
  return value ? formatDateTime(value) : 'Indisponível';
}

function roleLabel(role: CustomerPortalRole) {
  return role === 'customer_manager' ? 'Gestão cliente' : 'Usuário cliente';
}

function roleHelper(role: CustomerPortalRole) {
  return role === 'customer_manager'
    ? 'Vê o tenant completo, inclusive todos os tickets autorizados.'
    : 'Vê apenas o próprio escopo customer-facing vinculado ao contato.';
}

function accessLabel(status: CustomerPortalAccessStatus) {
  if (status === 'active') {
    return 'Acesso ativo';
  }

  if (status === 'pending') {
    return 'Pendente';
  }

  return 'Bloqueado';
}

function accessTone(status: CustomerPortalAccessStatus) {
  if (status === 'active') {
    return 'positive' as const;
  }

  if (status === 'pending') {
    return 'warning' as const;
  }

  return 'critical' as const;
}

function entitlementStatusLabel(status: CustomerPortalEntitlementStatus) {
  return status === 'active' ? 'Ativo' : 'Arquivado';
}

function entitlementTone(status: CustomerPortalEntitlementStatus) {
  return status === 'active' ? 'positive' as const : 'critical' as const;
}

function scopeLabel(scope: CustomerPortalEntitlementScope) {
  return scope === 'tenant' ? 'Tenant inteiro' : 'Portal autenticado';
}

function sourceLabel(source: 'public' | 'customer_portal' | 'ticket_linked') {
  if (source === 'public') {
    return 'Público';
  }

  if (source === 'ticket_linked') {
    return 'Ticket vinculado';
  }

  return 'Autorizado no portal';
}

function membershipStatusLabel(status: MembershipStatus) {
  if (status === 'active') {
    return 'Ativo';
  }

  if (status === 'invited') {
    return 'Convite pendente';
  }

  return 'Revogado';
}

function emptyGrantForm(): GrantEntitlementFormState {
  return {
    tenantId: '',
    articleId: '',
    scope: 'customer_portal',
    relationReason: '',
  };
}

function emptyLinkForm(): LinkTicketArticleFormState {
  return {
    tenantId: '',
    ticketId: '',
    articleId: '',
    relationReason: '',
  };
}

function applyClassifiedFailure(error: ClassifiedAdminError) {
  if (error.kind === 'contract-unavailable') {
    return {
      phase: 'contract-unavailable' as const,
      message: error.message,
    };
  }

  return {
    phase: 'error' as const,
    message: error.message,
  };
}

function InfoLine({
  label,
  value,
  tone = 'default',
}: {
  label: string;
  value: string;
  tone?: 'default' | 'positive' | 'warning' | 'critical';
}) {
  return (
    <div
      className={cx(
        'rounded-[18px] border px-3 py-3',
        tone === 'positive' && 'border-emerald-200 bg-emerald-50/80',
        tone === 'warning' && 'border-amber-200 bg-amber-50/80',
        tone === 'critical' && 'border-rose-200 bg-rose-50/80',
        tone === 'default' && 'border-[color:var(--color-border)] bg-[color:var(--color-surface)]',
      )}
    >
      <p className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[color:var(--color-muted)]">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-[color:var(--color-ink)]">{value}</p>
    </div>
  );
}

function TenantAccessCard({
  tenant,
  selected,
  onSelect,
}: {
  tenant: AdminCustomerPortalTenantAccessRow;
  selected: boolean;
  onSelect: (tenantId: Uuid) => void;
}) {
  return (
    <button
      className={cx(
        'w-full rounded-[20px] border px-4 py-4 text-left transition',
        selected
          ? 'border-[color:var(--color-brand-blue)]/45 bg-[color:var(--color-surface)] shadow-[0_12px_24px_rgba(23,52,126,0.08)]'
          : 'border-[color:var(--color-border)] bg-white hover:border-[color:var(--color-brand-blue)]/25',
      )}
      onClick={() => onSelect(tenant.tenant_id)}
      type="button"
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-[color:var(--color-ink)]">
            {tenant.tenant_display_name}
          </p>
          <p className="mt-1 text-xs text-[color:var(--color-muted)]">
            {tenant.portal_user_count} usuários customer-facing
          </p>
        </div>
        <StatusPill tone={tenant.has_active_manager ? 'positive' : 'warning'}>
          {tenant.has_active_manager ? 'Com gestão' : 'Sem gestão'}
        </StatusPill>
      </div>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <InfoLine label="Tickets visíveis" value={String(tenant.visible_ticket_count)} />
        <InfoLine label="Artigos autorizados" value={String(tenant.authorized_article_count)} />
      </div>
      {tenant.risk_summary ? (
        <p className="mt-3 text-xs leading-5 text-[color:var(--color-muted)]">
          {tenant.risk_summary}
        </p>
      ) : null}
    </button>
  );
}

function PortalUserRow({
  user,
  selected,
  onSelect,
}: {
  user: AdminCustomerPortalUserRow;
  selected: boolean;
  onSelect: (membershipId: Uuid) => void;
}) {
  return (
    <button
      className={cx(
        'grid w-full gap-3 rounded-[20px] border px-4 py-4 text-left transition lg:grid-cols-[minmax(0,1fr)_auto]',
        selected
          ? 'border-[color:var(--color-brand-blue)]/45 bg-[color:var(--color-surface)] shadow-[0_12px_24px_rgba(23,52,126,0.08)]'
          : 'border-[color:var(--color-border)] bg-white hover:border-[color:var(--color-brand-blue)]/25',
      )}
      onClick={() => onSelect(user.membership_id)}
      type="button"
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-sm font-semibold text-[color:var(--color-ink)]">
            {user.user_full_name ?? 'Usuário sem nome'}
          </p>
          <StatusPill tone={accessTone(user.access_status)}>
            {accessLabel(user.access_status)}
          </StatusPill>
          <StatusPill tone="default">{roleLabel(user.portal_role)}</StatusPill>
        </div>
        <p className="mt-1 truncate text-sm text-[color:var(--color-muted)]">
          {user.user_email ?? 'Email indisponível'} · {user.tenant_display_name}
        </p>
        {user.risk_summary ? (
          <p className="mt-2 text-xs leading-5 text-[color:var(--color-muted)]">
            {user.risk_summary}
          </p>
        ) : null}
      </div>
      <div className="grid gap-2 text-right text-xs text-[color:var(--color-muted)] lg:min-w-[180px]">
        <span>{user.visible_ticket_count} tickets visíveis</span>
        <span>{user.authorized_article_count} artigos autorizados</span>
        <span>{formatOptionalDate(user.last_access_at)}</span>
      </div>
    </button>
  );
}

function EntitlementRow({
  entitlement,
  selected,
  onSelect,
}: {
  entitlement: AdminKnowledgeEntitlementRow;
  selected: boolean;
  onSelect: (entitlementId: Uuid) => void;
}) {
  return (
    <button
      className={cx(
        'grid w-full gap-3 rounded-[20px] border px-4 py-4 text-left transition lg:grid-cols-[minmax(0,1fr)_auto]',
        selected
          ? 'border-[color:var(--color-brand-blue)]/45 bg-[color:var(--color-surface)] shadow-[0_12px_24px_rgba(23,52,126,0.08)]'
          : 'border-[color:var(--color-border)] bg-white hover:border-[color:var(--color-brand-blue)]/25',
      )}
      onClick={() => onSelect(entitlement.entitlement_id)}
      type="button"
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-sm font-semibold text-[color:var(--color-ink)]">
            {entitlement.article_title}
          </p>
          <StatusPill tone={entitlementTone(entitlement.entitlement_status)}>
            {entitlementStatusLabel(entitlement.entitlement_status)}
          </StatusPill>
          <StatusPill tone="default">{scopeLabel(entitlement.entitlement_scope)}</StatusPill>
        </div>
        <p className="mt-1 truncate text-sm text-[color:var(--color-muted)]">
          {entitlement.tenant_display_name} · {sourceLabel(entitlement.exposure_source)}
        </p>
        {entitlement.relation_reason ? (
          <p className="mt-2 text-xs leading-5 text-[color:var(--color-muted)]">
            {entitlement.relation_reason}
          </p>
        ) : null}
      </div>
      <div className="grid gap-2 text-right text-xs text-[color:var(--color-muted)] lg:min-w-[180px]">
        <span>{entitlement.article_slug}</span>
        <span>{formatDateTime(entitlement.created_at)}</span>
      </div>
    </button>
  );
}

function TicketKnowledgeLinkRow({
  link,
  selected,
  onSelect,
}: {
  link: AdminTicketKnowledgeLinkRow;
  selected: boolean;
  onSelect: (ticketKnowledgeLinkId: Uuid) => void;
}) {
  return (
    <button
      className={cx(
        'grid w-full gap-3 rounded-[20px] border px-4 py-4 text-left transition lg:grid-cols-[minmax(0,1fr)_auto]',
        selected
          ? 'border-[color:var(--color-brand-blue)]/45 bg-[color:var(--color-surface)] shadow-[0_12px_24px_rgba(23,52,126,0.08)]'
          : 'border-[color:var(--color-border)] bg-white hover:border-[color:var(--color-brand-blue)]/25',
      )}
      onClick={() => onSelect(link.ticket_knowledge_link_id)}
      type="button"
    >
      <div className="min-w-0">
        <div className="flex flex-wrap items-center gap-2">
          <p className="truncate text-sm font-semibold text-[color:var(--color-ink)]">
            {link.article_title}
          </p>
          <StatusPill tone={entitlementTone(link.link_status)}>
            {entitlementStatusLabel(link.link_status)}
          </StatusPill>
          <StatusPill tone="accent">Ticket vinculado</StatusPill>
        </div>
        <p className="mt-1 truncate text-sm text-[color:var(--color-muted)]">
          {link.ticket_title} · {link.tenant_display_name}
        </p>
        <p className="mt-2 text-xs leading-5 text-[color:var(--color-muted)]">
          {link.relation_reason ?? 'Vínculo registrado sem contexto adicional.'}
        </p>
      </div>
      <div className="grid gap-2 text-right text-xs text-[color:var(--color-muted)] lg:min-w-[180px]">
        <span>{link.article_slug}</span>
        <span>{formatDateTime(link.created_at)}</span>
      </div>
    </button>
  );
}

export function CustomerPortalAdminPage() {
  const [phase, setPhase] = useState<PagePhase>('loading');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [overview, setOverview] = useState<AdminCustomerPortalAccessOverviewRow | null>(null);
  const [tenantAccess, setTenantAccess] = useState<AdminCustomerPortalTenantAccessRow[]>([]);
  const [users, setUsers] = useState<AdminCustomerPortalUserRow[]>([]);
  const [userDetail, setUserDetail] = useState<AdminCustomerPortalUserDetailRow | null>(null);
  const [entitlements, setEntitlements] = useState<AdminKnowledgeEntitlementRow[]>([]);
  const [entitlementDetail, setEntitlementDetail] =
    useState<AdminKnowledgeEntitlementDetailRow | null>(null);
  const [ticketLinks, setTicketLinks] = useState<AdminTicketKnowledgeLinkRow[]>([]);
  const [articleCandidates, setArticleCandidates] = useState<AdminCustomerPortalArticleCandidateRow[]>([]);
  const [ticketCandidates, setTicketCandidates] = useState<AdminCustomerPortalTicketCandidateRow[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState<TenantFilter>('all');
  const [selectedUserMembershipId, setSelectedUserMembershipId] = useState<Uuid | null>(null);
  const [selectedEntitlementId, setSelectedEntitlementId] = useState<Uuid | null>(null);
  const [selectedTicketLinkId, setSelectedTicketLinkId] = useState<Uuid | null>(null);
  const [userAccessFilter, setUserAccessFilter] = useState<UserAccessFilter>('all');
  const [entitlementFilter, setEntitlementFilter] = useState<EntitlementFilter>('all');
  const [roleDraft, setRoleDraft] = useState<CustomerPortalRole>('customer_user');
  const [statusDraft, setStatusDraft] = useState<MembershipStatus>('active');
  const [grantForm, setGrantForm] = useState<GrantEntitlementFormState>(emptyGrantForm);
  const [linkForm, setLinkForm] = useState<LinkTicketArticleFormState>(emptyLinkForm);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [actionTone, setActionTone] = useState<'positive' | 'critical' | 'warning'>('positive');
  const [submittingKey, setSubmittingKey] = useState<string | null>(null);

  const applyFailure = useEffectEvent((error: unknown, fallbackMessage: string) => {
    const classified = classifyAdminError(error, fallbackMessage);
    const failure = applyClassifiedFailure(classified);
    setPhase(failure.phase);
    setErrorMessage(failure.message);
  });

  const loadPage = useEffectEvent(async () => {
    setPhase('loading');
    setErrorMessage(null);

    try {
      const [
        nextOverview,
        nextTenantAccess,
        nextUsers,
        nextEntitlements,
        nextTicketLinks,
        nextArticleCandidates,
        nextTicketCandidates,
      ] = await Promise.all([
        getAdminCustomerPortalAccessOverview(),
        listAdminCustomerPortalTenantAccess(),
        listAdminCustomerPortalUsers(),
        listAdminKnowledgeEntitlements(),
        listAdminTicketKnowledgeLinks(),
        listAdminCustomerPortalArticleCandidates(),
        listAdminCustomerPortalTicketCandidates(),
      ]);

      setOverview(nextOverview);
      setTenantAccess(nextTenantAccess);
      setUsers(nextUsers);
      setEntitlements(nextEntitlements);
      setTicketLinks(nextTicketLinks);
      setArticleCandidates(nextArticleCandidates);
      setTicketCandidates(nextTicketCandidates);
      setSelectedTenantId((current) => {
        if (current !== 'all' && nextTenantAccess.some((tenant) => tenant.tenant_id === current)) {
          return current;
        }

        return nextTenantAccess[0]?.tenant_id ?? 'all';
      });
      setSelectedUserMembershipId((current) => {
        if (current && nextUsers.some((row) => row.membership_id === current)) {
          return current;
        }

        return nextUsers[0]?.membership_id ?? null;
      });
      setSelectedEntitlementId((current) => {
        if (current && nextEntitlements.some((row) => row.entitlement_id === current)) {
          return current;
        }

        return nextEntitlements[0]?.entitlement_id ?? null;
      });
      setSelectedTicketLinkId((current) => {
        if (current && nextTicketLinks.some((row) => row.ticket_knowledge_link_id === current)) {
          return current;
        }

        return nextTicketLinks[0]?.ticket_knowledge_link_id ?? null;
      });
      setGrantForm((current) => ({
        ...current,
        tenantId: current.tenantId || nextTenantAccess[0]?.tenant_id || '',
        articleId: current.articleId || nextArticleCandidates[0]?.article_id || '',
      }));
      setLinkForm((current) => {
        const nextTenantId = current.tenantId || nextTenantAccess[0]?.tenant_id || '';
        const tenantTickets = nextTicketCandidates.filter((ticket) => ticket.tenant_id === nextTenantId);

        return {
          ...current,
          tenantId: nextTenantId,
          ticketId: current.ticketId || tenantTickets[0]?.ticket_id || '',
          articleId: current.articleId || nextArticleCandidates[0]?.article_id || '',
        };
      });
      setPhase('ready');
    } catch (error) {
      applyFailure(error, 'Falha ao carregar a administração do portal cliente.');
    }
  });

  useEffect(() => {
    void loadPage();
  }, [loadPage]);

  useEffect(() => {
    if (!selectedUserMembershipId) {
      setUserDetail(null);
      return;
    }

    const membershipId = selectedUserMembershipId;
    let cancelled = false;

    async function loadUserDetail() {
      try {
        const detail = await getAdminCustomerPortalUserDetail(membershipId);
        if (!cancelled) {
          setUserDetail(detail);
          if (detail) {
            setRoleDraft(detail.portal_role);
            setStatusDraft(detail.membership_status);
          }
        }
      } catch (error) {
        if (!cancelled) {
          setActionTone('critical');
          setActionMessage(
            classifyAdminError(error, 'Falha ao carregar o detalhe do usuário.').message,
          );
        }
      }
    }

    void loadUserDetail();

    return () => {
      cancelled = true;
    };
  }, [selectedUserMembershipId]);

  useEffect(() => {
    if (!selectedEntitlementId) {
      setEntitlementDetail(null);
      return;
    }

    const entitlementId = selectedEntitlementId;
    let cancelled = false;

    async function loadEntitlementDetail() {
      try {
        const detail = await getAdminKnowledgeEntitlementDetail(entitlementId);
        if (!cancelled) {
          setEntitlementDetail(detail);
        }
      } catch (error) {
        if (!cancelled) {
          setActionTone('critical');
          setActionMessage(
            classifyAdminError(error, 'Falha ao carregar o detalhe do entitlement.').message,
          );
        }
      }
    }

    void loadEntitlementDetail();

    return () => {
      cancelled = true;
    };
  }, [selectedEntitlementId]);

  const selectedTenant = useMemo(
    () =>
      selectedTenantId === 'all'
        ? tenantAccess[0] ?? null
        : tenantAccess.find((tenant) => tenant.tenant_id === selectedTenantId) ?? null,
    [selectedTenantId, tenantAccess],
  );

  const visibleUsers = useMemo(() => {
    return users.filter((user) => {
      if (selectedTenantId !== 'all' && user.tenant_id !== selectedTenantId) {
        return false;
      }

      if (userAccessFilter !== 'all' && user.access_status !== userAccessFilter) {
        return false;
      }

      return true;
    });
  }, [selectedTenantId, userAccessFilter, users]);

  const visibleEntitlements = useMemo(() => {
    return entitlements.filter((entitlement) => {
      if (selectedTenantId !== 'all' && entitlement.tenant_id !== selectedTenantId) {
        return false;
      }

      if (entitlementFilter !== 'all' && entitlement.entitlement_status !== entitlementFilter) {
        return false;
      }

      return true;
    });
  }, [entitlementFilter, entitlements, selectedTenantId]);

  const visibleTicketLinks = useMemo(() => {
    return ticketLinks.filter((link) => {
      if (selectedTenantId !== 'all' && link.tenant_id !== selectedTenantId) {
        return false;
      }

      return true;
    });
  }, [selectedTenantId, ticketLinks]);

  const selectedTicketLink = useMemo(
    () =>
      selectedTicketLinkId
        ? ticketLinks.find((link) => link.ticket_knowledge_link_id === selectedTicketLinkId) ?? null
        : null,
    [selectedTicketLinkId, ticketLinks],
  );

  const tenantScopedTickets = useMemo(() => {
    if (!linkForm.tenantId) {
      return ticketCandidates;
    }

    return ticketCandidates.filter((ticket) => ticket.tenant_id === linkForm.tenantId);
  }, [linkForm.tenantId, ticketCandidates]);

  async function withAction<T>(key: string, action: () => Promise<T>, successMessage: string) {
    setSubmittingKey(key);
    setActionMessage(null);

    try {
      await action();
      setActionTone('positive');
      setActionMessage(successMessage);
      await loadPage();
    } catch (error) {
      const classified = classifyAdminError(error, 'Não foi possível concluir a ação agora.');
      setActionTone(classified.kind === 'permission-denied' ? 'warning' : 'critical');
      setActionMessage(classified.message);
    } finally {
      setSubmittingKey(null);
    }
  }

  async function handleUpdateUserRole(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedUserMembershipId) {
      return;
    }

    await withAction(
      'update-role',
      () =>
        updateCustomerPortalUserRole({
          p_membership_id: selectedUserMembershipId,
          p_role: roleDraft,
        }),
      'Papel customer-facing atualizado.',
    );
  }

  async function handleUpdateUserStatus(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedUserMembershipId) {
      return;
    }

    await withAction(
      'update-status',
      () =>
        updateCustomerPortalUserStatus({
          p_membership_id: selectedUserMembershipId,
          p_status: statusDraft,
        }),
      'Status do vínculo customer-facing atualizado.',
    );
  }

  async function handleGrantEntitlement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!grantForm.tenantId || !grantForm.articleId) {
      setActionTone('warning');
      setActionMessage('Selecione tenant e artigo antes de conceder o acesso.');
      return;
    }

    await withAction(
      'grant-entitlement',
      () =>
        grantKnowledgeArticleEntitlement({
          p_tenant_id: grantForm.tenantId,
          p_article_id: grantForm.articleId,
          p_entitlement_scope: grantForm.scope,
          p_relation_reason: grantForm.relationReason.trim() || null,
        }),
      'Entitlement customer-facing concedido.',
    );
  }

  async function handleArchiveEntitlement() {
    if (!entitlementDetail || entitlementDetail.entitlement_status !== 'active') {
      return;
    }

    await withAction(
      'archive-entitlement',
      () =>
        archiveKnowledgeArticleEntitlement({
          p_entitlement_id: entitlementDetail.entitlement_id,
        }),
      'Entitlement arquivado e retirado da exposição customer-facing.',
    );
  }

  async function handleLinkArticleToTicket(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!linkForm.tenantId || !linkForm.ticketId || !linkForm.articleId) {
      setActionTone('warning');
      setActionMessage('Selecione tenant, ticket e artigo antes de registrar o vínculo.');
      return;
    }

    await withAction(
      'link-ticket-article',
      () =>
        linkKnowledgeArticleToTicket({
          p_tenant_id: linkForm.tenantId,
          p_ticket_id: linkForm.ticketId,
          p_article_id: linkForm.articleId,
          p_relation_reason: linkForm.relationReason.trim() || null,
        }),
      'Artigo vinculado ao ticket com governança customer-facing.',
    );
  }

  async function handleUnlinkTicketKnowledgeLink() {
    if (!selectedTicketLink || selectedTicketLink.link_status !== 'active') {
      return;
    }

    await withAction(
      'unlink-ticket-article',
      () =>
        unlinkKnowledgeArticleFromTicket({
          p_ticket_knowledge_link_id: selectedTicketLink.ticket_knowledge_link_id,
        }),
      'Vínculo entre ticket e artigo removido da exposição customer-facing.',
    );
  }

  if (phase === 'loading') {
    return (
      <div className="flex h-full min-h-0 items-center justify-center rounded-[28px] border border-[color:var(--color-border)] bg-white/92 p-6">
        <LoadingState
          title="Carregando administração do portal"
          description="Buscando usuários customer-facing, tenants e entitlements já governados pelo backend."
        />
      </div>
    );
  }

  if (phase === 'contract-unavailable') {
    return (
      <div className="rounded-[28px] border border-[color:var(--color-border)] bg-white/92 p-6">
        <ContractUnavailableState contractName="administração do portal cliente" />
      </div>
    );
  }

  if (phase === 'error') {
    return (
      <div className="rounded-[28px] border border-[color:var(--color-border)] bg-white/92 p-6">
        <ErrorState
          title="Portal cliente indisponível no Admin Console"
          description={errorMessage ?? 'Falha ao carregar a administração do portal cliente.'}
        />
      </div>
    );
  }

  return (
    <div className="grid h-full min-h-0 gap-4 overflow-hidden xl:grid-cols-[280px_minmax(0,1fr)_360px]">
      <aside className="min-h-0 overflow-y-auto">
        <ContextSubsidebar
          title="Governança customer-facing"
          description="Leitura sanitizada do acesso ao portal, das permissões de Knowledge autenticada e dos artigos vinculados a tickets."
        >
          <ContextSubsidebarSection
            title="Filtros"
            description="Ajuste a leitura por tenant e pelo estado real do acesso."
          >
            <Field label="Tenant">
              <SelectInput
                onChange={(event) => setSelectedTenantId(event.target.value as TenantFilter)}
                value={selectedTenantId}
              >
                <option value="all">Todos os tenants</option>
                {tenantAccess.map((tenant) => (
                  <option key={tenant.tenant_id} value={tenant.tenant_id}>
                    {tenant.tenant_display_name}
                  </option>
                ))}
              </SelectInput>
            </Field>
            <Field label="Acesso customer-facing">
              <SelectInput
                onChange={(event) => setUserAccessFilter(event.target.value as UserAccessFilter)}
                value={userAccessFilter}
              >
                <option value="all">Todos os estados</option>
                <option value="active">Acesso ativo</option>
                <option value="pending">Pendente</option>
                <option value="blocked">Bloqueado</option>
              </SelectInput>
            </Field>
            <Field label="Entitlements">
              <SelectInput
                onChange={(event) =>
                  setEntitlementFilter(event.target.value as EntitlementFilter)
                }
                value={entitlementFilter}
              >
                <option value="all">Todos</option>
                <option value="active">Ativos</option>
                <option value="archived">Arquivados</option>
              </SelectInput>
            </Field>
          </ContextSubsidebarSection>

          <ContextSubsidebarSection
            title="Tenants governados"
            description="Panorama por tenant do portal cliente B2B."
          >
            {tenantAccess.length === 0 ? (
              <InlineNotice>Nenhum tenant com contrato customer-facing foi encontrado.</InlineNotice>
            ) : (
              <div className="grid gap-3">
                {tenantAccess.map((tenant) => (
                  <TenantAccessCard
                    key={tenant.tenant_id}
                    onSelect={(tenantId) => {
                      setSelectedTenantId(tenantId);
                      setGrantForm((current) => ({ ...current, tenantId }));
                      setLinkForm((current) => ({
                        ...current,
                        tenantId,
                        ticketId:
                          ticketCandidates.find((ticket) => ticket.tenant_id === tenantId)?.ticket_id ?? '',
                      }));
                    }}
                    selected={tenant.tenant_id === selectedTenantId}
                    tenant={tenant}
                  />
                ))}
              </div>
            )}
          </ContextSubsidebarSection>
        </ContextSubsidebar>
      </aside>

      <section className="min-h-0 overflow-y-auto rounded-[28px] border border-[color:var(--color-border)] bg-white/92 p-5 shadow-[var(--shadow-panel)]">
        <PageHeader
          eyebrow="Admin Console"
          title="Portal cliente"
          description="Controle operacional dos acessos customer-facing, dos artigos autenticados e dos vínculos com tickets, sempre com contrato real e sem expor conteúdo interno."
        />

        {actionMessage ? (
          <div className="mt-5">
            <InlineNotice tone={actionTone}>{actionMessage}</InlineNotice>
          </div>
        ) : null}

        <div className="mt-5 grid gap-3 md:grid-cols-2 2xl:grid-cols-4">
          <MetricCard
            helper="Tenants com contrato customer-facing ou entitlement registrado."
            label="Tenants"
            value={String(overview?.tenant_count ?? 0)}
          />
          <MetricCard
            helper="Usuários customer-facing com leitura realmente habilitada."
            label="Acesso ativo"
            value={String(overview?.active_user_count ?? 0)}
          />
          <MetricCard
            helper="Tickets visíveis pelo modelo real do portal."
            label="Tickets visíveis"
            value={String(overview?.visible_ticket_count ?? 0)}
          />
          <MetricCard
            helper="Base publicada e autorizada, já sem draft ou internal."
            label="Artigos autorizados"
            value={String(overview?.authorized_article_count ?? 0)}
          />
        </div>

        <SummaryStrip className="mt-5">
          <SummaryStripItem
            helper="Pelo menos um customer_manager ativo por tenant."
            label="Tenants sem gestão"
            tone={(overview?.tenant_without_manager_count ?? 0) > 0 ? 'warning' : 'positive'}
            value={String(overview?.tenant_without_manager_count ?? 0)}
          />
          <SummaryStripItem
            helper="Memberships ainda sem contato linked ao portal."
            label="Sem contato vinculado"
            tone={(overview?.missing_contact_count ?? 0) > 0 ? 'warning' : 'default'}
            value={String(overview?.missing_contact_count ?? 0)}
          />
          <SummaryStripItem
            helper="Contatos customer-facing encontrados em estado inativo."
            label="Contato inativo"
            tone={(overview?.inactive_contact_count ?? 0) > 0 ? 'warning' : 'default'}
            value={String(overview?.inactive_contact_count ?? 0)}
          />
          <SummaryStripItem
            helper="Convites ou bloqueios ainda pendentes de ajuste."
            label="Pendências"
            tone={(overview?.invited_user_count ?? 0) > 0 ? 'warning' : 'default'}
            value={String((overview?.invited_user_count ?? 0) + (overview?.blocked_user_count ?? 0))}
          />
        </SummaryStrip>

        <Panel
          className="mt-5"
          title="Usuários customer-facing"
          description="Leitura real dos vínculos do portal cliente. Nada aqui decide segurança no frontend."
        >
          {visibleUsers.length === 0 ? (
            <EmptyState
              title="Nenhum usuário customer-facing encontrado"
              description="Ajuste os filtros ou revise se o tenant já possui membership customer-facing e contato vinculado."
            />
          ) : (
            <div className="grid gap-3">
              {visibleUsers.map((user) => (
                <PortalUserRow
                  key={user.membership_id}
                  onSelect={setSelectedUserMembershipId}
                  selected={user.membership_id === selectedUserMembershipId}
                  user={user}
                />
              ))}
            </div>
          )}
        </Panel>

        <Panel
          className="mt-5"
          title="Entitlements de Knowledge"
          description="Acesso autenticado governado por tenant, sem publicar nem aprovar artigo automaticamente."
          actions={
            <GhostButton
              onClick={() =>
                setGrantForm((current) => ({
                  ...current,
                  tenantId:
                    current.tenantId ||
                    (selectedTenantId !== 'all' ? selectedTenantId : tenantAccess[0]?.tenant_id ?? ''),
                }))
              }
            >
              Preparar novo entitlement
            </GhostButton>
          }
        >
          {visibleEntitlements.length === 0 ? (
            <EmptyState
              title="Nenhum entitlement encontrado"
              description="Quando um artigo autenticado for liberado para tenant ou portal, ele aparecerá aqui com trilha auditável."
            />
          ) : (
            <div className="grid gap-3">
              {visibleEntitlements.map((entitlement) => (
                <EntitlementRow
                  entitlement={entitlement}
                  key={entitlement.entitlement_id}
                  onSelect={setSelectedEntitlementId}
                  selected={entitlement.entitlement_id === selectedEntitlementId}
                />
              ))}
            </div>
          )}
        </Panel>

        <Panel
          className="mt-5"
          title="Artigos vinculados a tickets"
          description="Somente vínculos customer-facing enviados ao cliente. Draft, internal e advisory editorial não entram aqui."
        >
          {visibleTicketLinks.length === 0 ? (
            <EmptyState
              title="Nenhum artigo vinculado a ticket"
              description="Os vínculos surgem quando um artigo publicado e autorizado é associado a um ticket permitido."
            />
          ) : (
            <div className="grid gap-3">
              {visibleTicketLinks.map((link) => (
                <TicketKnowledgeLinkRow
                  key={link.ticket_knowledge_link_id}
                  link={link}
                  onSelect={setSelectedTicketLinkId}
                  selected={link.ticket_knowledge_link_id === selectedTicketLinkId}
                />
              ))}
            </div>
          )}
        </Panel>
      </section>

      <aside className="min-h-0 space-y-4 overflow-y-auto">
        <Panel
          title="Tenant em foco"
          description="Resumo operacional do tenant atualmente selecionado."
          className="p-4"
        >
          {selectedTenant ? (
            <div className="grid gap-3">
              <InfoLine label="Tenant" value={selectedTenant.tenant_display_name} />
              <InfoLine label="Status" value={selectedTenant.tenant_status} />
              <InfoLine
                label="Último acesso real"
                value={formatOptionalDate(selectedTenant.last_access_at)}
              />
              <InfoLine
                label="Artigos autorizados"
                value={String(selectedTenant.authorized_article_count)}
              />
              {selectedTenant.risk_summary ? (
                <InlineNotice tone="warning">{selectedTenant.risk_summary}</InlineNotice>
              ) : (
                <InlineNotice tone="positive">
                  Nenhuma pendência estrutural foi encontrada para este tenant.
                </InlineNotice>
              )}
            </div>
          ) : (
            <InlineNotice>Nenhum tenant customer-facing foi selecionado.</InlineNotice>
          )}
        </Panel>

        <Panel
          title="Usuário em foco"
          description="Ajustes reais de papel e status via RPC já auditada."
          className="p-4"
        >
          {userDetail ? (
            <div className="space-y-4">
              <div className="grid gap-3">
                <InfoLine label="Nome" value={userDetail.user_full_name ?? 'Indisponível'} />
                <InfoLine label="Email" value={userDetail.user_email ?? 'Indisponível'} />
                <InfoLine label="Papel" value={roleLabel(userDetail.portal_role)} />
                <InfoLine
                  label="Contato vinculado"
                  tone={userDetail.missing_contact ? 'warning' : 'default'}
                  value={userDetail.linked_contact_full_name ?? 'Indisponível'}
                />
                <InfoLine
                  label="Último acesso"
                  value={formatOptionalDate(userDetail.last_access_at)}
                />
              </div>

              {userDetail.risk_summary ? (
                <InlineNotice tone="warning">{userDetail.risk_summary}</InlineNotice>
              ) : null}

              <form className="space-y-3" onSubmit={handleUpdateUserRole}>
                <Field label="Atualizar papel customer-facing" description={roleHelper(roleDraft)}>
                  <SelectInput
                    onChange={(event) => setRoleDraft(event.target.value as CustomerPortalRole)}
                    value={roleDraft}
                  >
                    <option value="customer_user">Usuário cliente</option>
                    <option value="customer_manager">Gestão cliente</option>
                  </SelectInput>
                </Field>
                <AppButton
                  className="w-full"
                  disabled={submittingKey === 'update-role'}
                  type="submit"
                >
                  {submittingKey === 'update-role' ? 'Atualizando papel...' : 'Salvar papel'}
                </AppButton>
              </form>

              <form className="space-y-3" onSubmit={handleUpdateUserStatus}>
                <Field
                  label="Atualizar status do vínculo"
                  description="Convite, acesso ativo ou revogação continuam governados pelo backend."
                >
                  <SelectInput
                    onChange={(event) => setStatusDraft(event.target.value as MembershipStatus)}
                    value={statusDraft}
                  >
                    <option value="active">Ativo</option>
                    <option value="invited">Convite pendente</option>
                    <option value="revoked">Revogado</option>
                  </SelectInput>
                </Field>
                <AppButton
                  className="w-full"
                  disabled={submittingKey === 'update-status'}
                  type="submit"
                >
                  {submittingKey === 'update-status' ? 'Atualizando status...' : 'Salvar status'}
                </AppButton>
              </form>
            </div>
          ) : (
            <InlineNotice>Selecione um usuário customer-facing para abrir o detalhe.</InlineNotice>
          )}
        </Panel>

        <Panel
          title="Conceder entitlement"
          description="A liberação não publica nem aprova o artigo. Só expõe o que já passou pelo gate editorial."
          className="p-4"
        >
          <form className="space-y-3" onSubmit={handleGrantEntitlement}>
            <Field label="Tenant">
              <SelectInput
                onChange={(event) =>
                  setGrantForm((current) => ({ ...current, tenantId: event.target.value }))
                }
                value={grantForm.tenantId}
              >
                <option value="">Selecione</option>
                {tenantAccess.map((tenant) => (
                  <option key={tenant.tenant_id} value={tenant.tenant_id}>
                    {tenant.tenant_display_name}
                  </option>
                ))}
              </SelectInput>
            </Field>
            <Field label="Artigo elegível">
              <SelectInput
                onChange={(event) =>
                  setGrantForm((current) => ({ ...current, articleId: event.target.value }))
                }
                value={grantForm.articleId}
              >
                <option value="">Selecione</option>
                {articleCandidates.map((article) => (
                  <option key={article.article_id} value={article.article_id}>
                    {article.article_title} · {article.article_slug}
                  </option>
                ))}
              </SelectInput>
            </Field>
            <Field label="Escopo">
              <SelectInput
                onChange={(event) =>
                  setGrantForm((current) => ({
                    ...current,
                    scope: event.target.value as CustomerPortalEntitlementScope,
                  }))
                }
                value={grantForm.scope}
              >
                <option value="customer_portal">Portal autenticado</option>
                <option value="tenant">Tenant inteiro</option>
              </SelectInput>
            </Field>
            <Field label="Motivo operacional" description="Explicação segura para a liberação customer-facing.">
              <TextareaInput
                onChange={(event) =>
                  setGrantForm((current) => ({ ...current, relationReason: event.target.value }))
                }
                placeholder="Explique por que este conteúdo foi liberado."
                value={grantForm.relationReason}
              />
            </Field>
            <AppButton
              className="w-full"
              disabled={submittingKey === 'grant-entitlement'}
              type="submit"
            >
              {submittingKey === 'grant-entitlement' ? 'Concedendo...' : 'Conceder entitlement'}
            </AppButton>
          </form>
        </Panel>

        <Panel
          title="Entitlement em foco"
          description="Detalhe auditável do artigo já liberado para o portal."
          className="p-4"
        >
          {entitlementDetail ? (
            <div className="space-y-3">
              <InfoLine label="Artigo" value={entitlementDetail.article_title} />
              <InfoLine label="Tenant" value={entitlementDetail.tenant_display_name} />
              <InfoLine label="Escopo" value={scopeLabel(entitlementDetail.entitlement_scope)} />
              <InfoLine
                label="Status"
                tone={entitlementDetail.entitlement_status === 'active' ? 'positive' : 'critical'}
                value={entitlementStatusLabel(entitlementDetail.entitlement_status)}
              />
              <InfoLine
                label="Links ativos em tickets"
                value={String(entitlementDetail.active_ticket_link_count)}
              />
              <InfoLine
                label="Criado em"
                value={formatDateTime(entitlementDetail.created_at)}
              />
              {entitlementDetail.relation_reason ? (
                <InlineNotice>{entitlementDetail.relation_reason}</InlineNotice>
              ) : null}
              {entitlementDetail.entitlement_status === 'active' ? (
                <GhostButton
                  className="w-full"
                  disabled={submittingKey === 'archive-entitlement'}
                  onClick={() => void handleArchiveEntitlement()}
                >
                  {submittingKey === 'archive-entitlement'
                    ? 'Arquivando...'
                    : 'Arquivar entitlement'}
                </GhostButton>
              ) : (
                <InlineNotice tone="warning">
                  Este entitlement já está arquivado e não expõe mais o artigo no portal.
                </InlineNotice>
              )}
            </div>
          ) : (
            <InlineNotice>Selecione um entitlement para abrir o detalhe.</InlineNotice>
          )}
        </Panel>

        <Panel
          title="Vincular artigo a ticket"
          description="O vínculo só usa artigos publicados e tickets reais do tenant escolhido."
          className="p-4"
        >
          <form className="space-y-3" onSubmit={handleLinkArticleToTicket}>
            <Field label="Tenant">
              <SelectInput
                onChange={(event) =>
                  setLinkForm((current) => {
                    const nextTenantId = event.target.value;
                    const nextTicketId =
                      ticketCandidates.find((ticket) => ticket.tenant_id === nextTenantId)?.ticket_id ??
                      '';

                    return {
                      ...current,
                      tenantId: nextTenantId,
                      ticketId: nextTicketId,
                    };
                  })
                }
                value={linkForm.tenantId}
              >
                <option value="">Selecione</option>
                {tenantAccess.map((tenant) => (
                  <option key={tenant.tenant_id} value={tenant.tenant_id}>
                    {tenant.tenant_display_name}
                  </option>
                ))}
              </SelectInput>
            </Field>
            <Field label="Ticket">
              <SelectInput
                onChange={(event) =>
                  setLinkForm((current) => ({ ...current, ticketId: event.target.value }))
                }
                value={linkForm.ticketId}
              >
                <option value="">Selecione</option>
                {tenantScopedTickets.map((ticket) => (
                  <option key={ticket.ticket_id} value={ticket.ticket_id}>
                    {ticket.ticket_title}
                  </option>
                ))}
              </SelectInput>
            </Field>
            <Field label="Artigo elegível">
              <SelectInput
                onChange={(event) =>
                  setLinkForm((current) => ({ ...current, articleId: event.target.value }))
                }
                value={linkForm.articleId}
              >
                <option value="">Selecione</option>
                {articleCandidates.map((article) => (
                  <option key={article.article_id} value={article.article_id}>
                    {article.article_title} · {article.article_slug}
                  </option>
                ))}
              </SelectInput>
            </Field>
            <Field label="Motivo do vínculo" description="Contexto seguro para a leitura customer-facing do ticket.">
              <TextareaInput
                onChange={(event) =>
                  setLinkForm((current) => ({ ...current, relationReason: event.target.value }))
                }
                placeholder="Explique por que este artigo foi relacionado ao ticket."
                value={linkForm.relationReason}
              />
            </Field>
            <AppButton
              className="w-full"
              disabled={submittingKey === 'link-ticket-article'}
              type="submit"
            >
              {submittingKey === 'link-ticket-article' ? 'Vinculando...' : 'Vincular artigo'}
            </AppButton>
          </form>
        </Panel>

        <Panel
          title="Vínculo em foco"
          description="Retirada do vínculo sem afetar o artigo publicado nem o gate editorial."
          className="p-4"
        >
          {selectedTicketLink ? (
            <div className="space-y-3">
              <InfoLine label="Artigo" value={selectedTicketLink.article_title} />
              <InfoLine label="Ticket" value={selectedTicketLink.ticket_title} />
              <InfoLine label="Tenant" value={selectedTicketLink.tenant_display_name} />
              <InfoLine
                label="Status"
                tone={selectedTicketLink.link_status === 'active' ? 'positive' : 'critical'}
                value={entitlementStatusLabel(selectedTicketLink.link_status)}
              />
              <InfoLine label="Criado em" value={formatDateTime(selectedTicketLink.created_at)} />
              {selectedTicketLink.relation_reason ? (
                <InlineNotice>{selectedTicketLink.relation_reason}</InlineNotice>
              ) : null}
              {selectedTicketLink.link_status === 'active' ? (
                <GhostButton
                  className="w-full"
                  disabled={submittingKey === 'unlink-ticket-article'}
                  onClick={() => void handleUnlinkTicketKnowledgeLink()}
                >
                  {submittingKey === 'unlink-ticket-article'
                    ? 'Removendo vínculo...'
                    : 'Desvincular artigo'}
                </GhostButton>
              ) : (
                <InlineNotice tone="warning">
                  Este vínculo já foi arquivado e não aparece mais no portal.
                </InlineNotice>
              )}
            </div>
          ) : (
            <InlineNotice>Selecione um vínculo para abrir o detalhe.</InlineNotice>
          )}
        </Panel>
      </aside>
    </div>
  );
}
