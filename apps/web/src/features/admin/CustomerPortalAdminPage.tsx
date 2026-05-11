import {
  type FormEvent,
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
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
  Field,
  GhostButton,
  InlineNotice,
  SelectInput,
  StatusPill,
  TextInput,
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
type TenantFilter = Uuid | null;
type UserAccessFilter = 'all' | CustomerPortalAccessStatus;
type EntitlementFilter = 'all' | CustomerPortalEntitlementStatus;

const CUSTOMER_PORTAL_ADMIN_BOOTSTRAP_TIMEOUT_MS = 15_000;
const CUSTOMER_PORTAL_ADMIN_DETAIL_TIMEOUT_MS = 10_000;
const LEFT_COLUMN_VISIBLE_TENANTS = 6;

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
    ? 'Escopo amplo no tenant, inclusive tickets customer-facing permitidos.'
    : 'Escopo operacional vinculado ao contato customer-facing.';
}

function accessLabel(status: CustomerPortalAccessStatus) {
  if (status === 'active') {
    return 'Ativo';
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

function tenantStatusLabel(status: AdminCustomerPortalTenantAccessRow['tenant_status']) {
  if (status === 'active') {
    return 'Operacional';
  }

  if (status === 'suspended') {
    return 'Suspenso';
  }

  return 'Arquivado';
}

function tenantStatusTone(status: AdminCustomerPortalTenantAccessRow['tenant_status']) {
  if (status === 'active') {
    return 'positive' as const;
  }

  if (status === 'suspended') {
    return 'warning' as const;
  }

  return 'critical' as const;
}

function entitlementStatusLabel(status: CustomerPortalEntitlementStatus) {
  return status === 'active' ? 'Ativo' : 'Arquivado';
}

function scopeLabel(scope: CustomerPortalEntitlementScope) {
  return scope === 'tenant' ? 'Tenant inteiro' : 'Portal autenticado';
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

function normalizeLookup(value: string) {
  return value.trim().toLocaleLowerCase('pt-BR');
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

function withTimeout<T>(promise: Promise<T>, timeoutMs: number, message: string) {
  return Promise.race<T>([
    promise,
    new Promise<T>((_, reject) => {
      const timer = window.setTimeout(() => {
        reject(new Error(message));
      }, timeoutMs);

      promise.finally(() => {
        window.clearTimeout(timer);
      });
    }),
  ]);
}

function SurfaceCard({
  title,
  description,
  className,
  children,
  actions,
  id,
}: {
  title: string;
  description?: string;
  className?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  id?: string;
}) {
  return (
    <section
      className={cx(
        'rounded-[24px] border border-[color:var(--color-border)] bg-white/94 px-4 py-4 shadow-[0_16px_34px_rgba(19,33,79,0.08)]',
        className,
      )}
      id={id}
    >
      <header className="mb-4 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h2 className="text-[0.98rem] font-semibold tracking-[-0.03em] text-[color:var(--color-ink)]">
            {title}
          </h2>
          {description ? (
            <p className="mt-1 text-[0.78rem] leading-5 text-[color:var(--color-muted)]">
              {description}
            </p>
          ) : null}
        </div>
        {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
      </header>
      {children}
    </section>
  );
}

function DetailLine({
  label,
  value,
  tone = 'default',
}: {
  label: string;
  value: string;
  tone?: 'default' | 'positive' | 'warning' | 'critical';
}) {
  return (
    <div className="grid gap-1 rounded-[18px] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-3">
      <span className="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-muted)]">
        {label}
      </span>
      <span
        className={cx(
          'text-sm font-medium leading-5',
          tone === 'positive' && 'text-[color:var(--color-success-ink)]',
          tone === 'warning' && 'text-[color:var(--color-warning-ink)]',
          tone === 'critical' && 'text-[color:var(--color-danger-ink)]',
          tone === 'default' && 'text-[color:var(--color-ink)]',
        )}
      >
        {value}
      </span>
    </div>
  );
}

function CompactKpi({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[20px] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-3">
      <p className="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-muted)]">
        {label}
      </p>
      <p className="mt-2 text-[1.55rem] font-semibold tracking-[-0.05em] text-[color:var(--color-ink)]">
        {value}
      </p>
    </div>
  );
}

function TenantFilterCard({
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
        'w-full rounded-[18px] border px-3 py-3 text-left transition',
        selected
          ? 'border-[color:var(--color-brand-blue)]/35 bg-[rgba(68,110,255,0.08)] shadow-[0_12px_24px_rgba(44,79,182,0.08)]'
          : 'border-[color:var(--color-border)] bg-white hover:border-[color:var(--color-brand-blue)]/22',
      )}
      onClick={() => onSelect(tenant.tenant_id)}
      type="button"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold text-[color:var(--color-ink)]">
            {tenant.tenant_display_name}
          </p>
          <p className="mt-1 truncate text-[0.76rem] text-[color:var(--color-muted)]">
            {tenant.portal_user_count} acessos customer-facing
          </p>
        </div>
        <StatusPill tone={tenantStatusTone(tenant.tenant_status)}>
          {tenantStatusLabel(tenant.tenant_status)}
        </StatusPill>
      </div>
      <div className="mt-3 flex flex-wrap gap-2 text-[0.72rem] text-[color:var(--color-muted)]">
        <span>{tenant.visible_ticket_count} tickets</span>
        <span>{tenant.authorized_article_count} artigos</span>
        <span>{tenant.active_entitlement_count} entitlements</span>
      </div>
      {tenant.risk_summary ? (
        <p className="mt-2 line-clamp-2 text-[0.72rem] leading-5 text-[color:var(--color-muted)]">
          {tenant.risk_summary}
        </p>
      ) : null}
    </button>
  );
}

function UserTableRow({
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
        'grid w-full grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)_132px_132px_minmax(0,1.4fr)] gap-3 rounded-[18px] border px-4 py-3 text-left transition',
        selected
          ? 'border-[color:var(--color-brand-blue)]/36 bg-[rgba(68,110,255,0.08)] shadow-[0_14px_28px_rgba(40,75,174,0.08)]'
          : 'border-transparent bg-white hover:border-[color:var(--color-brand-blue)]/20 hover:bg-[color:var(--color-surface)]',
      )}
      onClick={() => onSelect(user.membership_id)}
      type="button"
    >
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-[color:var(--color-ink)]">
          {user.user_full_name ?? 'Indisponível'}
        </p>
        <p className="mt-1 truncate text-[0.78rem] text-[color:var(--color-muted)]">
          {user.user_email ?? 'Indisponível'}
        </p>
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-[color:var(--color-ink)]">
          {user.tenant_display_name}
        </p>
        <p className="mt-1 truncate text-[0.78rem] text-[color:var(--color-muted)]">
          {user.linked_contact_full_name ?? 'Contato indisponível'}
        </p>
      </div>
      <div className="min-w-0">
        <StatusPill tone="default">{roleLabel(user.portal_role)}</StatusPill>
      </div>
      <div className="min-w-0">
        <StatusPill tone={accessTone(user.access_status)}>
          {accessLabel(user.access_status)}
        </StatusPill>
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm text-[color:var(--color-ink)]">
          {user.visible_ticket_count} tickets · {user.authorized_article_count} artigos
        </p>
        <p className="mt-1 truncate text-[0.78rem] text-[color:var(--color-muted)]">
          Último acesso: {formatOptionalDate(user.last_access_at)}
        </p>
      </div>
    </button>
  );
}

function ActionBlock({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-[18px] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-3">
      <header className="mb-3">
        <h3 className="text-sm font-semibold text-[color:var(--color-ink)]">{title}</h3>
        {description ? (
          <p className="mt-1 text-[0.76rem] leading-5 text-[color:var(--color-muted)]">
            {description}
          </p>
        ) : null}
      </header>
      {children}
    </section>
  );
}

export function CustomerPortalAdminPage() {
  const didBootstrapRef = useRef(false);
  const actionsRailRef = useRef<HTMLDivElement | null>(null);

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
  const [articleCandidates, setArticleCandidates] = useState<AdminCustomerPortalArticleCandidateRow[]>(
    [],
  );
  const [ticketCandidates, setTicketCandidates] = useState<AdminCustomerPortalTicketCandidateRow[]>(
    [],
  );
  const [selectedTenantId, setSelectedTenantId] = useState<TenantFilter>(null);
  const [selectedUserMembershipId, setSelectedUserMembershipId] = useState<Uuid | null>(null);
  const [selectedEntitlementId, setSelectedEntitlementId] = useState<Uuid | null>(null);
  const [selectedTicketLinkId, setSelectedTicketLinkId] = useState<Uuid | null>(null);
  const [userAccessFilter, setUserAccessFilter] = useState<UserAccessFilter>('all');
  const [entitlementFilter, setEntitlementFilter] = useState<EntitlementFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');
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
      ] = await withTimeout(
        Promise.all([
          getAdminCustomerPortalAccessOverview(),
          listAdminCustomerPortalTenantAccess(),
          listAdminCustomerPortalUsers(),
          listAdminKnowledgeEntitlements(),
          listAdminTicketKnowledgeLinks(),
          listAdminCustomerPortalArticleCandidates(),
          listAdminCustomerPortalTicketCandidates(),
        ]),
        CUSTOMER_PORTAL_ADMIN_BOOTSTRAP_TIMEOUT_MS,
        'O painel do portal cliente demorou mais do que o esperado para responder. Tente novamente em instantes.',
      );

      setOverview(nextOverview);
      setTenantAccess(nextTenantAccess);
      setUsers(nextUsers);
      setEntitlements(nextEntitlements);
      setTicketLinks(nextTicketLinks);
      setArticleCandidates(nextArticleCandidates);
      setTicketCandidates(nextTicketCandidates);
      setSelectedTenantId((current) => {
        if (current && nextTenantAccess.some((tenant) => tenant.tenant_id === current)) {
          return current;
        }

        return nextTenantAccess[0]?.tenant_id ?? null;
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
    if (didBootstrapRef.current) {
      return;
    }

    didBootstrapRef.current = true;
    void loadPage();
  }, []);

  useEffect(() => {
    if (!selectedUserMembershipId) {
      setUserDetail(null);
      return;
    }

    const membershipId = selectedUserMembershipId;
    let cancelled = false;

    async function loadUserDetail() {
      try {
        const detail = await withTimeout(
          getAdminCustomerPortalUserDetail(membershipId),
          CUSTOMER_PORTAL_ADMIN_DETAIL_TIMEOUT_MS,
          'O detalhe do usuário customer-facing demorou mais do que o esperado para responder.',
        );

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
        const detail = await withTimeout(
          getAdminKnowledgeEntitlementDetail(entitlementId),
          CUSTOMER_PORTAL_ADMIN_DETAIL_TIMEOUT_MS,
          'O detalhe do entitlement demorou mais do que o esperado para responder.',
        );

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

  const lookup = useMemo(() => normalizeLookup(searchTerm), [searchTerm]);

  const filteredTenantAccess = useMemo(() => {
    if (!lookup) {
      return tenantAccess;
    }

    return tenantAccess.filter((tenant) =>
      [tenant.tenant_display_name, tenant.tenant_slug].some((value) =>
        value.toLocaleLowerCase('pt-BR').includes(lookup),
      ),
    );
  }, [lookup, tenantAccess]);

  useEffect(() => {
    if (selectedTenantId && filteredTenantAccess.some((tenant) => tenant.tenant_id === selectedTenantId)) {
      return;
    }

    setSelectedTenantId(filteredTenantAccess[0]?.tenant_id ?? null);
  }, [filteredTenantAccess, selectedTenantId]);

  const selectedTenant = useMemo(
    () => tenantAccess.find((tenant) => tenant.tenant_id === selectedTenantId) ?? null,
    [selectedTenantId, tenantAccess],
  );

  const visibleUsers = useMemo(() => {
    return users.filter((user) => {
      if (selectedTenantId && user.tenant_id !== selectedTenantId) {
        return false;
      }

      if (userAccessFilter !== 'all' && user.access_status !== userAccessFilter) {
        return false;
      }

      if (lookup) {
        const haystack = [
          user.user_full_name,
          user.user_email,
          user.tenant_display_name,
          user.linked_contact_full_name,
        ]
          .filter(Boolean)
          .join(' ')
          .toLocaleLowerCase('pt-BR');

        if (!haystack.includes(lookup)) {
          return false;
        }
      }

      return true;
    });
  }, [lookup, selectedTenantId, userAccessFilter, users]);

  useEffect(() => {
    if (selectedUserMembershipId && visibleUsers.some((user) => user.membership_id === selectedUserMembershipId)) {
      return;
    }

    setSelectedUserMembershipId(visibleUsers[0]?.membership_id ?? null);
  }, [selectedUserMembershipId, visibleUsers]);

  const visibleEntitlements = useMemo(() => {
    return entitlements.filter((entitlement) => {
      if (selectedTenantId && entitlement.tenant_id !== selectedTenantId) {
        return false;
      }

      if (entitlementFilter !== 'all' && entitlement.entitlement_status !== entitlementFilter) {
        return false;
      }

      if (lookup) {
        const haystack = [
          entitlement.article_title,
          entitlement.article_slug,
          entitlement.tenant_display_name,
          entitlement.category_name,
        ]
          .filter(Boolean)
          .join(' ')
          .toLocaleLowerCase('pt-BR');

        if (!haystack.includes(lookup)) {
          return false;
        }
      }

      return true;
    });
  }, [entitlementFilter, entitlements, lookup, selectedTenantId]);

  useEffect(() => {
    if (
      selectedEntitlementId &&
      visibleEntitlements.some((entitlement) => entitlement.entitlement_id === selectedEntitlementId)
    ) {
      return;
    }

    setSelectedEntitlementId(visibleEntitlements[0]?.entitlement_id ?? null);
  }, [selectedEntitlementId, visibleEntitlements]);

  const visibleTicketLinks = useMemo(() => {
    return ticketLinks.filter((link) => {
      if (selectedTenantId && link.tenant_id !== selectedTenantId) {
        return false;
      }

      if (lookup) {
        const haystack = [link.article_title, link.ticket_title, link.tenant_display_name]
          .join(' ')
          .toLocaleLowerCase('pt-BR');

        if (!haystack.includes(lookup)) {
          return false;
        }
      }

      return true;
    });
  }, [lookup, selectedTenantId, ticketLinks]);

  useEffect(() => {
    if (
      selectedTicketLinkId &&
      visibleTicketLinks.some((link) => link.ticket_knowledge_link_id === selectedTicketLinkId)
    ) {
      return;
    }

    setSelectedTicketLinkId(visibleTicketLinks[0]?.ticket_knowledge_link_id ?? null);
  }, [selectedTicketLinkId, visibleTicketLinks]);

  const selectedTicketLink = useMemo(
    () =>
      ticketLinks.find((link) => link.ticket_knowledge_link_id === selectedTicketLinkId) ?? null,
    [selectedTicketLinkId, ticketLinks],
  );

  useEffect(() => {
    const nextTenantId = selectedTenantId ?? '';

    setGrantForm((current) => ({
      ...current,
      tenantId: nextTenantId,
      articleId:
        current.tenantId === nextTenantId && current.articleId
          ? current.articleId
          : current.articleId || articleCandidates[0]?.article_id || '',
    }));

    setLinkForm((current) => {
      const tenantScoped = ticketCandidates.filter((ticket) => ticket.tenant_id === nextTenantId);
      const currentTicketStillValid = tenantScoped.some((ticket) => ticket.ticket_id === current.ticketId);

      return {
        ...current,
        tenantId: nextTenantId,
        ticketId: currentTicketStillValid ? current.ticketId : tenantScoped[0]?.ticket_id ?? '',
        articleId: current.articleId || articleCandidates[0]?.article_id || '',
      };
    });
  }, [articleCandidates, selectedTenantId, ticketCandidates]);

  const tenantScopedTickets = useMemo(() => {
    if (!linkForm.tenantId) {
      return [] as AdminCustomerPortalTicketCandidateRow[];
    }

    return ticketCandidates.filter((ticket) => ticket.tenant_id === linkForm.tenantId);
  }, [linkForm.tenantId, ticketCandidates]);

  const selectedUser = useMemo(
    () => visibleUsers.find((user) => user.membership_id === selectedUserMembershipId) ?? null,
    [selectedUserMembershipId, visibleUsers],
  );

  const pendingCount = useMemo(() => {
    return (
      (overview?.tenant_without_manager_count ?? 0) +
      (overview?.missing_contact_count ?? 0) +
      (overview?.inactive_contact_count ?? 0) +
      (overview?.invited_user_count ?? 0) +
      (overview?.blocked_user_count ?? 0)
    );
  }, [overview]);

  const orderedVisibleTenants = useMemo(() => {
    const nextTenants = [...filteredTenantAccess];

    nextTenants.sort((left, right) => {
      if (left.tenant_id === selectedTenantId) {
        return -1;
      }

      if (right.tenant_id === selectedTenantId) {
        return 1;
      }

      return left.tenant_display_name.localeCompare(right.tenant_display_name, 'pt-BR');
    });

    return nextTenants;
  }, [filteredTenantAccess, selectedTenantId]);

  const visibleTenantCards = orderedVisibleTenants.slice(0, LEFT_COLUMN_VISIBLE_TENANTS);
  const hiddenTenantCount = Math.max(orderedVisibleTenants.length - visibleTenantCards.length, 0);

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
      'Artigo autorizado para o portal cliente.',
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
          description="Buscando usuários customer-facing, tenants governados e acessos autorizados."
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
    <div className="grid h-full min-h-0 gap-4 overflow-hidden xl:grid-cols-[280px_minmax(0,1fr)_408px]">
      <aside className="min-h-0 overflow-hidden">
        <SurfaceCard
          className="h-full"
          description="Filtros e tenants governados para o portal cliente."
          title="Governança"
        >
          <div className="space-y-3">
            <Field label="Status do portal">
              <SelectInput
                className="h-10 rounded-[16px] text-sm"
                onChange={(event) => setUserAccessFilter(event.target.value as UserAccessFilter)}
                value={userAccessFilter}
              >
                <option value="all">Todos</option>
                <option value="active">Ativo</option>
                <option value="pending">Pendente</option>
                <option value="blocked">Bloqueado</option>
              </SelectInput>
            </Field>

            <Field label="Entitlements">
              <SelectInput
                className="h-10 rounded-[16px] text-sm"
                onChange={(event) => setEntitlementFilter(event.target.value as EntitlementFilter)}
                value={entitlementFilter}
              >
                <option value="all">Todos</option>
                <option value="active">Ativos</option>
                <option value="archived">Arquivados</option>
              </SelectInput>
            </Field>

            <Field label="Buscar cliente...">
              <TextInput
                className="h-10 rounded-[16px] text-sm"
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Nome, email ou tenant"
                value={searchTerm}
              />
            </Field>
          </div>

          <div className="mt-4 border-t border-[color:var(--color-border)] pt-4">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h3 className="text-sm font-semibold text-[color:var(--color-ink)]">
                Tenants governados
              </h3>
              <span className="text-[0.76rem] text-[color:var(--color-muted)]">
                {filteredTenantAccess.length}
              </span>
            </div>

            {visibleTenantCards.length === 0 ? (
              <EmptyState
                title="Nenhum tenant encontrado"
                description="Ajuste os filtros para localizar o tenant customer-facing."
              />
            ) : (
              <div className="grid gap-2.5">
                {visibleTenantCards.map((tenant) => (
                  <TenantFilterCard
                    key={tenant.tenant_id}
                    onSelect={setSelectedTenantId}
                    selected={tenant.tenant_id === selectedTenantId}
                    tenant={tenant}
                  />
                ))}
              </div>
            )}

            {hiddenTenantCount > 0 ? (
              <InlineNotice tone="default">
                {hiddenTenantCount} tenant(s) ocultados para manter a leitura operacional compacta.
              </InlineNotice>
            ) : null}
          </div>
        </SurfaceCard>
      </aside>

      <section className="min-h-0 overflow-y-auto rounded-[28px] border border-[color:var(--color-border)] bg-white/94 p-5 shadow-[0_18px_40px_rgba(18,31,72,0.08)]">
        <header className="flex flex-wrap items-start justify-between gap-4">
          <div className="min-w-0 space-y-2">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-[color:var(--color-muted)]">
              ADMIN CONSOLE
            </p>
            <div className="space-y-1">
              <h1 className="text-[2rem] font-semibold tracking-[-0.05em] text-[color:var(--color-ink)]">
                Portal cliente
              </h1>
              <p className="max-w-3xl text-sm leading-6 text-[color:var(--color-muted)]">
                Governança dos acessos customer-facing, artigos autorizados e vínculos com tickets.
              </p>
            </div>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <AppButton
              className="h-10 rounded-full px-4 text-sm shadow-[0_12px_28px_rgba(20,31,71,0.16)]"
              onClick={() => {
                if (visibleUsers[0]) {
                  setSelectedUserMembershipId(visibleUsers[0].membership_id);
                }
                actionsRailRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
              }}
            >
              Gerenciar acesso
            </AppButton>
            <GhostButton
              className="h-10 rounded-full px-4 text-sm"
              onClick={() => void loadPage()}
            >
              Recarregar
            </GhostButton>
          </div>
        </header>

        {actionMessage ? (
          <div className="mt-4">
            <InlineNotice tone={actionTone}>{actionMessage}</InlineNotice>
          </div>
        ) : null}

        <div className="mt-4 grid gap-3 xl:grid-cols-5">
          <CompactKpi label="Tenants com portal" value={String(overview?.active_tenant_count ?? 0)} />
          <CompactKpi label="Acessos ativos" value={String(overview?.active_user_count ?? 0)} />
          <CompactKpi label="Tickets visíveis" value={String(overview?.visible_ticket_count ?? 0)} />
          <CompactKpi
            label="Artigos autorizados"
            value={String(overview?.authorized_article_count ?? 0)}
          />
          <CompactKpi label="Pendências" value={String(pendingCount)} />
        </div>

        <SurfaceCard
          className="mt-4"
          description="Leitura real dos usuários customer-facing por tenant, com densidade operacional."
          title="Usuários customer-facing"
        >
          {visibleUsers.length === 0 ? (
            <EmptyState
              title="Nenhum usuário customer-facing encontrado"
              description="Ajuste os filtros ou revise o tenant selecionado."
            />
          ) : (
            <div className="space-y-2">
              <div className="grid grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)_132px_132px_minmax(0,1.4fr)] gap-3 border-b border-[color:var(--color-border)] px-4 pb-2 text-[0.68rem] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-muted)]">
                <span>Usuário</span>
                <span>Tenant</span>
                <span>Papel</span>
                <span>Status</span>
                <span>Resumo de acesso</span>
              </div>

              <div className="grid gap-2">
                {visibleUsers.map((user) => (
                  <UserTableRow
                    key={user.membership_id}
                    onSelect={setSelectedUserMembershipId}
                    selected={user.membership_id === selectedUserMembershipId}
                    user={user}
                  />
                ))}
              </div>
            </div>
          )}
        </SurfaceCard>
      </section>

      <aside className="min-h-0 overflow-y-auto" ref={actionsRailRef}>
        <div className="space-y-4">
          <SurfaceCard
            description="Resumo operacional do tenant atualmente selecionado."
            title="Contexto selecionado"
          >
            <div className="space-y-4">
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-[color:var(--color-ink)]">Tenant em foco</h3>
                {selectedTenant ? (
                  <div className="grid gap-2">
                    <DetailLine label="Tenant" value={selectedTenant.tenant_display_name} />
                    <DetailLine
                      label="Status do portal"
                      tone={tenantStatusTone(selectedTenant.tenant_status)}
                      value={tenantStatusLabel(selectedTenant.tenant_status)}
                    />
                    <DetailLine
                      label="Último acesso real"
                      value={formatOptionalDate(selectedTenant.last_access_at)}
                    />
                    <DetailLine
                      label="Artigos autorizados"
                      value={String(selectedTenant.authorized_article_count)}
                    />
                    <DetailLine
                      label="Tickets visíveis"
                      value={String(selectedTenant.visible_ticket_count)}
                    />
                    <DetailLine
                      label="Pendências"
                      tone={selectedTenant.risk_summary ? 'warning' : 'positive'}
                      value={
                        selectedTenant.risk_summary
                          ? selectedTenant.risk_summary
                          : 'Nenhuma pendência operacional.'
                      }
                    />
                  </div>
                ) : (
                  <InlineNotice>Nenhum tenant selecionado.</InlineNotice>
                )}
              </div>

              <div className="space-y-3 border-t border-[color:var(--color-border)] pt-4">
                <h3 className="text-sm font-semibold text-[color:var(--color-ink)]">Usuário em foco</h3>
                {userDetail ? (
                  <div className="grid gap-2">
                    <DetailLine label="Nome" value={userDetail.user_full_name ?? 'Indisponível'} />
                    <DetailLine label="E-mail" value={userDetail.user_email ?? 'Indisponível'} />
                    <DetailLine label="Papel" value={roleLabel(userDetail.portal_role)} />
                    <DetailLine
                      label="Status"
                      tone={accessTone(userDetail.access_status)}
                      value={`${accessLabel(userDetail.access_status)} · ${membershipStatusLabel(userDetail.membership_status)}`}
                    />
                    <DetailLine
                      label="Tenant ativo"
                      value={userDetail.tenant_display_name ?? 'Indisponível'}
                    />
                    <DetailLine
                      label="Último acesso"
                      value={formatOptionalDate(userDetail.last_access_at)}
                    />
                  </div>
                ) : (
                  <InlineNotice>Selecione um usuário customer-facing para abrir o contexto.</InlineNotice>
                )}
              </div>
            </div>
          </SurfaceCard>

          <SurfaceCard
            description="Ações operacionais habilitadas pelos contratos reais da tela."
            title="Ações governadas"
          >
            <div className="space-y-3">
              <ActionBlock
                description={selectedUser ? roleHelper(roleDraft) : 'Selecione um usuário customer-facing para continuar.'}
                title="Gerenciar papel"
              >
                {selectedUser ? (
                  <form className="space-y-3" onSubmit={handleUpdateUserRole}>
                    <SelectInput
                      className="h-10 rounded-[16px] text-sm"
                      onChange={(event) => setRoleDraft(event.target.value as CustomerPortalRole)}
                      value={roleDraft}
                    >
                      <option value="customer_user">Usuário cliente</option>
                      <option value="customer_manager">Gestão cliente</option>
                    </SelectInput>
                    <AppButton
                      className="h-10 w-full rounded-full text-sm"
                      disabled={submittingKey === 'update-role'}
                      type="submit"
                    >
                      {submittingKey === 'update-role' ? 'Atualizando...' : 'Gerenciar papel'}
                    </AppButton>
                  </form>
                ) : (
                  <InlineNotice>Indisponível sem usuário selecionado.</InlineNotice>
                )}
              </ActionBlock>

              <ActionBlock
                description="Ajuste do estado do vínculo customer-facing com governança já auditada."
                title="Alterar status"
              >
                {selectedUser ? (
                  <form className="space-y-3" onSubmit={handleUpdateUserStatus}>
                    <SelectInput
                      className="h-10 rounded-[16px] text-sm"
                      onChange={(event) => setStatusDraft(event.target.value as MembershipStatus)}
                      value={statusDraft}
                    >
                      <option value="active">Ativo</option>
                      <option value="invited">Convite pendente</option>
                      <option value="revoked">Revogado</option>
                    </SelectInput>
                    <GhostButton
                      className="h-10 w-full rounded-full text-sm"
                      disabled={submittingKey === 'update-status'}
                      type="submit"
                    >
                      {submittingKey === 'update-status' ? 'Atualizando...' : 'Alterar status'}
                    </GhostButton>
                  </form>
                ) : (
                  <InlineNotice>Indisponível sem usuário selecionado.</InlineNotice>
                )}
              </ActionBlock>

              <ActionBlock
                description="Liberação real sem publicar nem aprovar artigo automaticamente."
                title="Conceder artigo"
              >
                {selectedTenant ? (
                  <form className="space-y-3" onSubmit={handleGrantEntitlement}>
                    <SelectInput
                      className="h-10 rounded-[16px] text-sm"
                      onChange={(event) =>
                        setGrantForm((current) => ({ ...current, tenantId: event.target.value }))
                      }
                      value={grantForm.tenantId}
                    >
                      <option value="">Selecione o tenant</option>
                      {tenantAccess.map((tenant) => (
                        <option key={tenant.tenant_id} value={tenant.tenant_id}>
                          {tenant.tenant_display_name}
                        </option>
                      ))}
                    </SelectInput>
                    <SelectInput
                      className="h-10 rounded-[16px] text-sm"
                      onChange={(event) =>
                        setGrantForm((current) => ({ ...current, articleId: event.target.value }))
                      }
                      value={grantForm.articleId}
                    >
                      <option value="">Selecione o artigo</option>
                      {articleCandidates.map((article) => (
                        <option key={article.article_id} value={article.article_id}>
                          {article.article_title}
                        </option>
                      ))}
                    </SelectInput>
                    <SelectInput
                      className="h-10 rounded-[16px] text-sm"
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
                    <TextareaInput
                      className="min-h-[88px] rounded-[18px] px-3 py-3 text-sm"
                      onChange={(event) =>
                        setGrantForm((current) => ({
                          ...current,
                          relationReason: event.target.value,
                        }))
                      }
                      placeholder="Motivo operacional"
                      value={grantForm.relationReason}
                    />
                    <AppButton
                      className="h-10 w-full rounded-full text-sm"
                      disabled={submittingKey === 'grant-entitlement'}
                      type="submit"
                    >
                      {submittingKey === 'grant-entitlement' ? 'Concedendo...' : 'Conceder artigo'}
                    </AppButton>
                  </form>
                ) : (
                  <InlineNotice>Indisponível sem tenant em foco.</InlineNotice>
                )}
              </ActionBlock>

              <ActionBlock
                description="Retirada controlada da exposição customer-facing já liberada."
                title="Arquivar entitlement"
              >
                {visibleEntitlements.length > 0 ? (
                  <div className="space-y-3">
                    <SelectInput
                      className="h-10 rounded-[16px] text-sm"
                      onChange={(event) => setSelectedEntitlementId(event.target.value as Uuid)}
                      value={selectedEntitlementId ?? ''}
                    >
                      <option value="">Selecione o entitlement</option>
                      {visibleEntitlements.map((entitlement) => (
                        <option key={entitlement.entitlement_id} value={entitlement.entitlement_id}>
                          {entitlement.article_title} · {entitlementStatusLabel(entitlement.entitlement_status)}
                        </option>
                      ))}
                    </SelectInput>

                    {entitlementDetail ? (
                      <div className="grid gap-2">
                        <DetailLine label="Artigo" value={entitlementDetail.article_title} />
                        <DetailLine label="Escopo" value={scopeLabel(entitlementDetail.entitlement_scope)} />
                        <DetailLine
                          label="Status"
                          tone={entitlementDetail.entitlement_status === 'active' ? 'positive' : 'critical'}
                          value={entitlementStatusLabel(entitlementDetail.entitlement_status)}
                        />
                      </div>
                    ) : null}

                    <GhostButton
                      className="h-10 w-full rounded-full text-sm"
                      disabled={
                        submittingKey === 'archive-entitlement' ||
                        !entitlementDetail ||
                        entitlementDetail.entitlement_status !== 'active'
                      }
                      onClick={() => void handleArchiveEntitlement()}
                    >
                      {submittingKey === 'archive-entitlement'
                        ? 'Arquivando...'
                        : 'Arquivar entitlement'}
                    </GhostButton>
                  </div>
                ) : (
                  <InlineNotice>Nenhum entitlement disponível para o tenant filtrado.</InlineNotice>
                )}
              </ActionBlock>

              <ActionBlock
                description="Associação governada entre ticket permitido e artigo publicado."
                title="Vincular artigo a ticket"
              >
                {selectedTenant ? (
                  <form className="space-y-3" onSubmit={handleLinkArticleToTicket}>
                    <SelectInput
                      className="h-10 rounded-[16px] text-sm"
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
                      <option value="">Selecione o tenant</option>
                      {tenantAccess.map((tenant) => (
                        <option key={tenant.tenant_id} value={tenant.tenant_id}>
                          {tenant.tenant_display_name}
                        </option>
                      ))}
                    </SelectInput>
                    <SelectInput
                      className="h-10 rounded-[16px] text-sm"
                      onChange={(event) =>
                        setLinkForm((current) => ({ ...current, ticketId: event.target.value }))
                      }
                      value={linkForm.ticketId}
                    >
                      <option value="">Selecione o ticket</option>
                      {tenantScopedTickets.map((ticket) => (
                        <option key={ticket.ticket_id} value={ticket.ticket_id}>
                          {ticket.ticket_title}
                        </option>
                      ))}
                    </SelectInput>
                    <SelectInput
                      className="h-10 rounded-[16px] text-sm"
                      onChange={(event) =>
                        setLinkForm((current) => ({ ...current, articleId: event.target.value }))
                      }
                      value={linkForm.articleId}
                    >
                      <option value="">Selecione o artigo</option>
                      {articleCandidates.map((article) => (
                        <option key={article.article_id} value={article.article_id}>
                          {article.article_title}
                        </option>
                      ))}
                    </SelectInput>
                    <TextareaInput
                      className="min-h-[88px] rounded-[18px] px-3 py-3 text-sm"
                      onChange={(event) =>
                        setLinkForm((current) => ({
                          ...current,
                          relationReason: event.target.value,
                        }))
                      }
                      placeholder="Motivo do vínculo"
                      value={linkForm.relationReason}
                    />
                    <AppButton
                      className="h-10 w-full rounded-full text-sm"
                      disabled={submittingKey === 'link-ticket-article'}
                      type="submit"
                    >
                      {submittingKey === 'link-ticket-article' ? 'Vinculando...' : 'Vincular artigo a ticket'}
                    </AppButton>
                  </form>
                ) : (
                  <InlineNotice>Indisponível sem tenant em foco.</InlineNotice>
                )}

                {selectedTicketLink ? (
                  <div className="mt-3 border-t border-[color:var(--color-border)] pt-3">
                    <SelectInput
                      className="h-10 rounded-[16px] text-sm"
                      onChange={(event) => setSelectedTicketLinkId(event.target.value as Uuid)}
                      value={selectedTicketLinkId ?? ''}
                    >
                      <option value="">Selecione um vínculo ativo</option>
                      {visibleTicketLinks.map((link) => (
                        <option key={link.ticket_knowledge_link_id} value={link.ticket_knowledge_link_id}>
                          {link.ticket_title} · {link.article_title}
                        </option>
                      ))}
                    </SelectInput>
                    <GhostButton
                      className="mt-3 h-10 w-full rounded-full text-sm"
                      disabled={
                        submittingKey === 'unlink-ticket-article' || selectedTicketLink.link_status !== 'active'
                      }
                      onClick={() => void handleUnlinkTicketKnowledgeLink()}
                    >
                      {submittingKey === 'unlink-ticket-article' ? 'Removendo...' : 'Desvincular artigo'}
                    </GhostButton>
                  </div>
                ) : null}
              </ActionBlock>
            </div>
          </SurfaceCard>
        </div>
      </aside>
    </div>
  );
}
