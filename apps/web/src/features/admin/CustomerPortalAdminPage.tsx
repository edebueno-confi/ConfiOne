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
import { sanitizeOperationalVisibleText } from '../../lib/operational-copy';
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
type PortalStatusFilter = 'all' | AdminCustomerPortalTenantAccessRow['tenant_status'];
type EntitlementFilter = 'all' | CustomerPortalEntitlementStatus;
type PendingFilter = 'all' | 'with_pending' | 'without_pending';
type GovernedDrawer = 'access' | 'grant-article' | 'link-ticket' | null;

const CUSTOMER_PORTAL_ADMIN_BOOTSTRAP_TIMEOUT_MS = 15_000;
const CUSTOMER_PORTAL_ADMIN_DETAIL_TIMEOUT_MS = 10_000;

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

function initialsFromName(value: string | null | undefined) {
  const words = (value ?? 'Cliente')
    .split(/\s+/)
    .map((word) => word.trim())
    .filter(Boolean);

  return words
    .slice(0, 2)
    .map((word) => word[0]?.toLocaleUpperCase('pt-BR') ?? '')
    .join('');
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
        'rounded-[18px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-strong)]/95 px-4 py-4',
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
    <div className="grid min-w-0 grid-cols-[minmax(0,1fr)_minmax(0,1fr)] items-start gap-2 py-1">
      <span className="truncate text-[0.66rem] font-semibold leading-5 text-[color:var(--color-muted)]">
        {label}
      </span>
      <span
        className={cx(
          'min-w-0 text-right text-[0.8rem] font-semibold leading-5',
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

function TinyBadge({
  children,
  tone = 'default',
}: {
  children: React.ReactNode;
  tone?: 'default' | 'positive' | 'warning' | 'critical';
}) {
  return (
    <span
      className={cx(
        'inline-flex max-w-full truncate rounded-full border px-2 py-1 text-[0.66rem] font-semibold leading-none',
        tone === 'positive' &&
          'border-[color:var(--color-success-border)] bg-[color:var(--color-success-surface)] text-[color:var(--color-success-ink)]',
        tone === 'warning' &&
          'border-[color:var(--color-warning-border)] bg-[color:var(--color-warning-surface)] text-[color:var(--color-warning-ink)]',
        tone === 'critical' &&
          'border-[color:var(--color-danger-border)] bg-[color:var(--color-danger-surface)] text-[color:var(--color-danger-ink)]',
        tone === 'default' &&
          'border-[color:var(--color-border)] bg-[color:var(--color-surface)] text-[color:var(--color-ink)]',
      )}
    >
      {children}
    </span>
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
    <div className="rounded-[16px] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-3">
      <p className="text-[0.62rem] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-muted)]">
        {label}
      </p>
      <p className="mt-1.5 text-[1.5rem] font-semibold text-[color:var(--color-ink)]">
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
      data-tenant-card
      className={cx(
        'w-full min-w-0 overflow-hidden rounded-[18px] border px-3.5 py-3.5 text-left transition',
        selected
          ? 'border-[color:var(--color-brand-blue)]/35 bg-[rgba(68,110,255,0.08)] shadow-[0_12px_24px_rgba(44,79,182,0.08)]'
          : 'border-[color:var(--color-border)] bg-[color:var(--color-surface-strong)] hover:border-[color:var(--color-brand-blue)]/22',
      )}
      onClick={() => onSelect(tenant.tenant_id)}
      type="button"
    >
      <div className="min-w-0">
        <p className="truncate text-sm font-semibold text-[color:var(--color-ink)]">
          {sanitizeOperationalVisibleText(tenant.tenant_display_name)}
        </p>
        <p className="mt-1.5 truncate text-[0.76rem] text-[color:var(--color-muted)]">
          {tenant.portal_user_count} usuários com acesso
        </p>
      </div>

      <div className="mt-2 flex min-w-0">
        <span
          className={cx(
            'inline-flex max-w-full truncate rounded-full border px-2 py-0.5 text-[0.64rem] font-semibold',
            tenant.has_active_manager
              ? 'border-[color:var(--color-success-border)] bg-[color:var(--color-success-surface)] text-[color:var(--color-success-ink)]'
              : 'border-[color:var(--color-warning-border)] bg-[color:var(--color-warning-surface)] text-[color:var(--color-warning-ink)]',
          )}
        >
          {tenant.has_active_manager ? 'Com gestão' : 'Sem gestão'}
        </span>
      </div>

      <div className="mt-3 grid min-w-0 grid-cols-2 gap-4 border-t border-[color:var(--color-border)] pt-3">
        <div className="min-w-0">
          <p className="truncate text-[0.66rem] font-semibold text-[color:var(--color-muted)]">
            Tickets visíveis
          </p>
          <p className="mt-1 text-base font-semibold text-[color:var(--color-ink)]">
            {tenant.visible_ticket_count}
          </p>
        </div>
        <div className="min-w-0">
          <p className="truncate text-[0.66rem] font-semibold text-[color:var(--color-muted)]">
            Artigos autorizados
          </p>
          <p className="mt-1 text-base font-semibold text-[color:var(--color-ink)]">
            {tenant.authorized_article_count}
          </p>
        </div>
      </div>
      {tenant.risk_summary ? (
        <p className="mt-2 line-clamp-2 text-[0.72rem] leading-5 text-[color:var(--color-muted)]">
          {sanitizeOperationalVisibleText(tenant.risk_summary)}
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
        'grid w-full grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)_104px_92px_minmax(0,1.25fr)] gap-3 border-b border-[color:var(--color-border)] px-4 py-3.5 text-left transition last:border-b-0',
        selected
          ? 'rounded-[16px] border border-[color:var(--color-brand-blue)]/36 bg-[rgba(68,110,255,0.08)] shadow-[0_14px_28px_rgba(40,75,174,0.08)]'
          : 'bg-[color:var(--color-surface-strong)] hover:bg-[color:var(--color-surface)]',
      )}
      onClick={() => onSelect(user.membership_id)}
      type="button"
    >
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface)] text-[0.72rem] font-semibold text-[color:var(--color-brand-blue)]">
          {initialsFromName(user.user_full_name)}
        </span>
        <span className="min-w-0">
          <p className="truncate text-sm font-semibold text-[color:var(--color-ink)]">
            {sanitizeOperationalVisibleText(user.user_full_name)}
          </p>
          <p className="mt-1 truncate text-[0.78rem] text-[color:var(--color-muted)]">
            {user.user_email ?? 'Indisponível'}
          </p>
        </span>
      </div>
      <div className="min-w-0">
        <p className="truncate text-sm font-medium text-[color:var(--color-ink)]">
          {sanitizeOperationalVisibleText(user.tenant_display_name)}
        </p>
        <p className="mt-1 truncate text-[0.78rem] text-[color:var(--color-muted)]">
          {sanitizeOperationalVisibleText(user.linked_contact_full_name, 'Contato indisponivel')}
        </p>
      </div>
      <div className="min-w-0">
        <TinyBadge>{roleLabel(user.portal_role)}</TinyBadge>
      </div>
      <div className="min-w-0">
        <TinyBadge tone={accessTone(user.access_status)}>{accessLabel(user.access_status)}</TinyBadge>
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

function TenantTableRow({
  tenant,
  selected,
  onSelect,
}: {
  tenant: AdminCustomerPortalTenantAccessRow;
  selected: boolean;
  onSelect: (tenantId: Uuid) => void;
}) {
  const hasPending = Boolean(tenant.risk_summary) || !tenant.has_active_manager;

  return (
    <button
      className={cx(
        'flex w-full min-w-0 flex-col gap-3 border-b border-[color:var(--color-border)] px-4 py-4 text-left transition last:border-b-0 lg:grid lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)_minmax(0,1fr)_18px] lg:items-center',
        selected
          ? 'border border-[color:var(--color-brand-blue)]/38 bg-[rgba(68,110,255,0.08)]'
          : 'bg-[color:var(--color-surface-strong)] hover:bg-[color:var(--color-surface)]',
      )}
      onClick={() => onSelect(tenant.tenant_id)}
      type="button"
    >
      <div className="flex min-w-0 items-center gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[color:var(--color-surface)] text-[0.75rem] font-semibold text-[color:var(--color-brand-blue)]">
          {initialsFromName(tenant.tenant_display_name)}
        </span>
        <span className="min-w-0">
          <p className="truncate text-sm font-semibold text-[color:var(--color-ink)]">
            {sanitizeOperationalVisibleText(tenant.tenant_display_name)}
          </p>
          <p className="mt-1 truncate text-[0.76rem] text-[color:var(--color-muted)]">
            {tenant.tenant_slug || 'Conta sem identificador público'}
          </p>
        </span>
      </div>

      <div className="flex min-w-0 flex-wrap items-center gap-2">
        <TinyBadge tone={tenantStatusTone(tenant.tenant_status)}>
          {tenantStatusLabel(tenant.tenant_status)}
        </TinyBadge>
        <TinyBadge tone={tenant.has_active_manager ? 'positive' : 'warning'}>
          {tenant.has_active_manager ? 'Com responsável' : 'Sem responsável'}
        </TinyBadge>
      </div>

      <div className="grid min-w-0 grid-cols-2 gap-3 sm:grid-cols-5 lg:justify-items-end">
        <TenantRowMetric label="Usuários" value={tenant.portal_user_count} />
        <TenantRowMetric label="Tickets" value={tenant.visible_ticket_count} />
        <TenantRowMetric label="Artigos" value={tenant.authorized_article_count} />
        <TenantRowMetric label="Pendências" tone={hasPending ? 'warning' : 'default'} value={hasPending ? 1 : 0} />
        <span className="min-w-0 sm:col-span-1">
          <span className="block truncate text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-[color:var(--color-muted)]">
            Último acesso
          </span>
          <span className="mt-1 block truncate text-sm font-semibold leading-5 text-[color:var(--color-ink)]">
            {formatOptionalDate(tenant.last_access_at)}
          </span>
        </span>
      </div>
      <span className="hidden text-lg text-[color:var(--color-brand-blue)] lg:block">›</span>
    </button>
  );
}

function TenantRowMetric({
  value,
  label,
  tone = 'default',
}: {
  value: number;
  label: string;
  tone?: 'default' | 'warning';
}) {
  return (
    <span className="min-w-0">
      <span className="block truncate text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-[color:var(--color-muted)]">
        {label}
      </span>
      <span
        className={cx(
          'mt-1 block text-sm font-semibold text-[color:var(--color-ink)]',
          tone === 'warning' && value > 0 && 'text-[color:var(--color-warning-ink)]',
        )}
      >
        {value}
      </span>
    </span>
  );
}

function ActionBlock({
  title,
  description,
  disabled = false,
  children,
}: {
  title: string;
  description?: string;
  disabled?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section
      className={cx(
        'rounded-[12px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-strong)] px-3 py-2.5',
        disabled && 'opacity-65',
      )}
    >
      <header className="mb-2 flex min-w-0 items-center justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-[color:var(--color-ink)]">{title}</h3>
          {description ? (
            <p className="mt-0.5 truncate text-[0.72rem] text-[color:var(--color-muted)]">
              {description}
            </p>
          ) : null}
        </div>
        <span className="h-2 w-2 shrink-0 rounded-full bg-[color:var(--color-brand-blue)]" />
      </header>
      {children}
    </section>
  );
}

function RailSection({
  title,
  children,
  sectionKey,
}: {
  title: string;
  children: React.ReactNode;
  sectionKey: 'tenant' | 'user' | 'actions';
}) {
  return (
    <section
      className="rounded-[18px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-strong)] px-3 py-2.5"
      data-rail-section={sectionKey}
    >
      <div className="mb-2 flex items-center gap-2">
        <span className="h-5 w-5 rounded-[8px] bg-[rgba(37,99,235,0.1)]" />
        <h3 className="text-sm font-semibold text-[color:var(--color-ink)]">{title}</h3>
      </div>
      {children}
    </section>
  );
}

function GovernedActionDrawer({
  title,
  description,
  children,
  footer,
  onClose,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
  footer: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-[rgba(11,22,48,0.18)] backdrop-blur-[2px]">
      <button
        aria-label="Fechar painel de ação"
        className="absolute inset-0 cursor-default"
        onClick={onClose}
        type="button"
      />
      <aside
        data-responsive-drawer="true"
        aria-modal="true"
        className="relative z-10 flex h-full w-[clamp(720px,50vw,860px)] max-w-[calc(100vw-32px)] flex-col overflow-hidden rounded-l-[26px] border-l border-[color:var(--color-border)] bg-[color:var(--color-surface-strong)] shadow-[0_28px_72px_rgba(15,23,42,0.22)]"
        role="dialog"
      >
        <header className="flex shrink-0 items-start justify-between gap-4 border-b border-[color:var(--color-border)] px-7 py-6">
          <div className="min-w-0">
            <h2 className="text-[1.6rem] font-semibold tracking-[-0.04em] text-[color:var(--color-ink)]">
              {title}
            </h2>
            <p className="mt-1 max-w-xl text-sm leading-6 text-[color:var(--color-muted)]">
              {description}
            </p>
          </div>
          <button
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-[color:var(--color-border)] text-xl text-[color:var(--color-ink)] transition hover:bg-[color:var(--color-surface)]"
            onClick={onClose}
            type="button"
          >
            ×
          </button>
        </header>
        <div className="min-h-0 flex-1 overflow-y-auto overflow-x-hidden px-7 py-5" data-governed-drawer-body>
          {children}
        </div>
        <footer className="shrink-0 border-t border-[color:var(--color-border)] bg-[color:var(--color-surface-strong)] px-7 py-5">
          <div className="flex items-center justify-end gap-3">{footer}</div>
        </footer>
      </aside>
    </div>
  );
}

function DrawerSection({
  index,
  title,
  description,
  children,
  action,
}: {
  index: number;
  title: string;
  description?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 gap-3">
          <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-[8px] bg-[color:var(--color-surface)] text-[0.72rem] font-semibold text-[color:var(--color-muted)]">
            {index}
          </span>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-[color:var(--color-ink)]">{title}</h3>
            {description ? (
              <p className="mt-1 text-[0.78rem] leading-5 text-[color:var(--color-muted)]">
                {description}
              </p>
            ) : null}
          </div>
        </div>
        {action}
      </div>
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
  const [portalStatusFilter, setPortalStatusFilter] = useState<PortalStatusFilter>('all');
  const [entitlementFilter, setEntitlementFilter] = useState<EntitlementFilter>('all');
  const [pendingFilter, setPendingFilter] = useState<PendingFilter>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeDrawer, setActiveDrawer] = useState<GovernedDrawer>(null);
  const [grantArticleSearch, setGrantArticleSearch] = useState('');
  const [grantCategoryFilter, setGrantCategoryFilter] = useState('all');
  const [linkArticleSearch, setLinkArticleSearch] = useState('');
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
          'Os detalhes do usuário demoraram mais do que o esperado para carregar.',
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
          'Os detalhes do acesso ao artigo demoraram mais do que o esperado para carregar.',
        );

        if (!cancelled) {
          setEntitlementDetail(detail);
        }
      } catch (error) {
        if (!cancelled) {
          setActionTone('critical');
          setActionMessage(
            classifyAdminError(error, 'Falha ao carregar os detalhes do acesso ao artigo.').message,
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
    return tenantAccess.filter((tenant) => {
      if (portalStatusFilter !== 'all' && tenant.tenant_status !== portalStatusFilter) {
        return false;
      }

      if (entitlementFilter === 'active' && tenant.active_entitlement_count <= 0) {
        return false;
      }

      if (
        entitlementFilter === 'archived' &&
        !entitlements.some(
          (entitlement) =>
            entitlement.tenant_id === tenant.tenant_id &&
            entitlement.entitlement_status === 'archived',
        )
      ) {
        return false;
      }

      const hasPending = Boolean(tenant.risk_summary) || !tenant.has_active_manager;
      if (pendingFilter === 'with_pending' && !hasPending) {
        return false;
      }

      if (pendingFilter === 'without_pending' && hasPending) {
        return false;
      }

      if (!lookup) {
        return true;
      }

      return [tenant.tenant_display_name, tenant.tenant_slug].some((value) =>
        value.toLocaleLowerCase('pt-BR').includes(lookup),
      );
    });
  }, [entitlementFilter, entitlements, lookup, pendingFilter, portalStatusFilter, tenantAccess]);

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
  }, [lookup, users]);

  const selectedTenantUsers = useMemo(() => {
    if (!selectedTenantId) {
      return [] as AdminCustomerPortalUserRow[];
    }

    return users.filter((user) => user.tenant_id === selectedTenantId);
  }, [selectedTenantId, users]);

  useEffect(() => {
    if (
      selectedUserMembershipId &&
      selectedTenantUsers.some((user) => user.membership_id === selectedUserMembershipId)
    ) {
      return;
    }

    setSelectedUserMembershipId(selectedTenantUsers[0]?.membership_id ?? null);
  }, [selectedTenantUsers, selectedUserMembershipId]);

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

  const articleCategories = useMemo(() => {
    const categories = new Set<string>();

    articleCandidates.forEach((article) => {
      if (article.category_name) {
        categories.add(article.category_name);
      }
    });

    return Array.from(categories).sort((left, right) => left.localeCompare(right, 'pt-BR'));
  }, [articleCandidates]);

  const grantArticleLookup = useMemo(() => normalizeLookup(grantArticleSearch), [grantArticleSearch]);

  const filteredArticleCandidates = useMemo(() => {
    return articleCandidates.filter((article) => {
      if (grantCategoryFilter !== 'all' && article.category_name !== grantCategoryFilter) {
        return false;
      }

      if (!grantArticleLookup) {
        return true;
      }

      return [article.article_title, article.article_slug, article.category_name]
        .filter(Boolean)
        .join(' ')
        .toLocaleLowerCase('pt-BR')
        .includes(grantArticleLookup);
    });
  }, [articleCandidates, grantArticleLookup, grantCategoryFilter]);

  const linkArticleLookup = useMemo(() => normalizeLookup(linkArticleSearch), [linkArticleSearch]);

  const filteredLinkArticleCandidates = useMemo(() => {
    if (!linkArticleLookup) {
      return articleCandidates;
    }

    return articleCandidates.filter((article) =>
      [article.article_title, article.article_slug, article.category_name]
        .filter(Boolean)
        .join(' ')
        .toLocaleLowerCase('pt-BR')
        .includes(linkArticleLookup),
    );
  }, [articleCandidates, linkArticleLookup]);

  const selectedTicketCandidate = useMemo(
    () => tenantScopedTickets.find((ticket) => ticket.ticket_id === linkForm.ticketId) ?? null,
    [linkForm.ticketId, tenantScopedTickets],
  );

  const selectedGrantArticle = useMemo(
    () => articleCandidates.find((article) => article.article_id === grantForm.articleId) ?? null,
    [articleCandidates, grantForm.articleId],
  );

  const selectedUser = useMemo(
    () => selectedTenantUsers.find((user) => user.membership_id === selectedUserMembershipId) ?? null,
    [selectedTenantUsers, selectedUserMembershipId],
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
      'Papel de acesso atualizado.',
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
      'Status do acesso do cliente atualizado.',
    );
  }

  async function handleSaveAccessDrawer() {
    if (!selectedUserMembershipId) {
      setActionTone('warning');
      setActionMessage('Selecione um usuário com acesso antes de salvar alterações.');
      return;
    }

    await withAction(
      'save-access-drawer',
      async () => {
        await updateCustomerPortalUserRole({
          p_membership_id: selectedUserMembershipId,
          p_role: roleDraft,
        });
        await updateCustomerPortalUserStatus({
          p_membership_id: selectedUserMembershipId,
          p_status: statusDraft,
        });
      },
      'Acesso do cliente atualizado.',
    );
  }

  async function handleGrantEntitlement(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!grantForm.tenantId || !grantForm.articleId) {
      setActionTone('warning');
      setActionMessage('Selecione cliente e artigo antes de conceder o acesso.');
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
      'Acesso ao artigo arquivado e retirado do portal do cliente.',
    );
  }

  async function handleLinkArticleToTicket(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!linkForm.tenantId || !linkForm.ticketId || !linkForm.articleId) {
      setActionTone('warning');
      setActionMessage('Selecione cliente, ticket e artigo antes de registrar o vínculo.');
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
      'Artigo vinculado ao ticket com governança de acesso.',
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
      'Vínculo entre ticket e artigo removido do portal do cliente.',
    );
  }

  useEffect(() => {
    if (!activeDrawer) {
      return;
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        setActiveDrawer(null);
      }
    }

    window.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [activeDrawer]);

  if (phase === 'loading') {
    return (
      <div className="flex h-full min-h-0 items-center justify-center rounded-[28px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-strong)]/92 p-6">
        <LoadingState
          title="Carregando administração do portal"
          description="Buscando usuários, clientes e acessos autorizados."
        />
      </div>
    );
  }

  if (phase === 'contract-unavailable') {
    return (
      <div className="rounded-[28px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-strong)]/92 p-6">
        <ContractUnavailableState contractName="administração do portal cliente" />
      </div>
    );
  }

  if (phase === 'error') {
    return (
      <div className="rounded-[28px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-strong)]/92 p-6">
        <ErrorState
          title="Portal do cliente indisponível na administração"
          description={errorMessage ?? 'Falha ao carregar a administração do portal cliente.'}
        />
      </div>
    );
  }

  return (
    <>
      <div className="gso-screen-frame grid h-full min-h-0 gap-4 overflow-hidden xl:grid-cols-[250px_minmax(0,1fr)_300px] 2xl:grid-cols-[250px_minmax(0,1fr)_300px]">
      <aside className="min-h-0 overflow-hidden" data-portal-admin-left>
        <SurfaceCard
          className="h-full overflow-hidden !px-3.5 !py-4"
          description="Refine a lista de clientes e o status do portal."
          title="Filtros"
        >
          <div className="space-y-3.5">
            <Field label="Status do portal">
              <SelectInput
                className="h-9 rounded-[14px] text-sm"
                onChange={(event) => setPortalStatusFilter(event.target.value as PortalStatusFilter)}
                value={portalStatusFilter}
              >
                <option value="all">Todos os status</option>
                <option value="active">Operacional</option>
                <option value="suspended">Suspenso</option>
                <option value="archived">Arquivado</option>
              </SelectInput>
            </Field>

            <Field label="Acesso a artigos">
              <SelectInput
                className="h-9 rounded-[14px] text-sm"
                onChange={(event) => setEntitlementFilter(event.target.value as EntitlementFilter)}
                value={entitlementFilter}
              >
                <option value="all">Todos</option>
                <option value="active">Ativos</option>
                <option value="archived">Arquivados</option>
              </SelectInput>
            </Field>

            <Field label="Pendências">
              <SelectInput
                className="h-9 rounded-[14px] text-sm"
                onChange={(event) => setPendingFilter(event.target.value as PendingFilter)}
                value={pendingFilter}
              >
                <option value="all">Todos</option>
                <option value="with_pending">Com pendência</option>
                <option value="without_pending">Sem pendência</option>
              </SelectInput>
            </Field>

            <Field label="Buscar cliente...">
              <TextInput
                className="h-9 rounded-[14px] text-sm"
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Nome, email ou cliente"
                value={searchTerm}
              />
            </Field>
          </div>
        </SurfaceCard>
      </aside>

      <section
        className="min-h-0 overflow-x-hidden overflow-y-auto rounded-[28px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-strong)]/94 p-5 shadow-[0_18px_40px_rgba(18,31,72,0.08)]"
        data-portal-admin-center
      >
        <header className="relative">
          <div className="min-w-0 space-y-2">
            <p className="text-[0.68rem] font-semibold uppercase tracking-[0.28em] text-[color:var(--color-muted)]">
              GENIUS SUPPORT OS
            </p>
            <div className="space-y-1">
              <h1 className="text-[2rem] font-semibold tracking-[-0.05em] text-[color:var(--color-ink)]">
                Portal do cliente
              </h1>
              <p className="max-w-[680px] text-[0.84rem] leading-6 text-[color:var(--color-muted)]">
                Acessos, artigos autorizados e vínculos com tickets em um fluxo claro para operação.
              </p>
            </div>
          </div>

          <div className="absolute right-0 top-0 flex shrink-0 items-center gap-2">
            <AppButton
              className="h-10 rounded-full px-4 text-sm shadow-[0_12px_28px_rgba(20,31,71,0.16)]"
              onClick={() => {
                if (selectedTenantUsers[0]) {
                  setSelectedUserMembershipId(selectedTenantUsers[0].membership_id);
                }
                setActiveDrawer('access');
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
          <CompactKpi label="Clientes com portal" value={String(overview?.active_tenant_count ?? 0)} />
          <CompactKpi label="Usuários com acesso" value={String(overview?.active_user_count ?? 0)} />
          <CompactKpi label="Tickets visíveis" value={String(overview?.visible_ticket_count ?? 0)} />
          <CompactKpi
            label="Artigos autorizados"
            value={String(overview?.authorized_article_count ?? 0)}
          />
          <CompactKpi label="Pendências" value={String(pendingCount)} />
        </div>

        <SurfaceCard
          className="mt-4 min-h-[430px]"
          description="Clientes B2B com portal habilitado, acessos e conteúdo autorizado."
          title="Clientes com portal"
          actions={
            <span className="text-[0.76rem] font-medium text-[color:var(--color-muted)]">
              {orderedVisibleTenants.length} clientes
            </span>
          }
        >
          {orderedVisibleTenants.length === 0 ? (
            <EmptyState
              title="Nenhum cliente encontrado"
              description="Ajuste os filtros para localizar clientes com portal."
            />
          ) : (
            <div className="overflow-hidden rounded-[18px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-strong)]">
              <div className="flex items-center justify-between gap-3 border-b border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-4 py-3 text-[0.68rem] font-semibold uppercase tracking-[0.12em] text-[color:var(--color-muted)]">
                <span className="min-w-0 truncate">Cliente, status e responsáveis</span>
                <span className="hidden min-w-0 truncate lg:block">Usuários, tickets, artigos e pendências</span>
              </div>

              <div className="grid">
                {orderedVisibleTenants.map((tenant) => (
                  <TenantTableRow
                    key={tenant.tenant_id}
                    onSelect={setSelectedTenantId}
                    selected={tenant.tenant_id === selectedTenantId}
                    tenant={tenant}
                  />
                ))}
              </div>
              <div className="flex items-center justify-between border-t border-[color:var(--color-border)] bg-[color:var(--color-surface-strong)] px-4 py-3 text-[0.78rem] text-[color:var(--color-muted)]">
                <span>Exibindo {orderedVisibleTenants.length} cliente(s)</span>
                <span>Governança do portal</span>
              </div>
            </div>
          )}
        </SurfaceCard>
      </section>

      <aside className="min-h-0 overflow-y-auto" data-portal-admin-rail ref={actionsRailRef}>
        <SurfaceCard
          className="min-h-full !px-3.5 !py-4"
          description="Detalhes do cliente e ações de governança."
          title="Contexto selecionado"
        >
          <div className="space-y-3">
            <RailSection sectionKey="tenant" title="Cliente em foco">
              {selectedTenant ? (
                <div className="space-y-2">
                  <div className="mb-1.5 flex min-w-0 items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[rgba(68,110,255,0.1)] text-sm font-semibold text-[color:var(--color-brand-blue)]">
                      {initialsFromName(selectedTenant.tenant_display_name)}
                    </span>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-[color:var(--color-ink)]">
                        {sanitizeOperationalVisibleText(selectedTenant.tenant_display_name)}
                      </p>
                      <p className="mt-1 truncate text-[0.76rem] text-[color:var(--color-muted)]">
                        {selectedTenant.tenant_slug || 'Indisponível'}
                      </p>
                    </div>
                  </div>
                  <DetailLine
                    label="Status do portal"
                    tone={selectedTenant.has_active_manager ? 'positive' : 'warning'}
                    value={selectedTenant.has_active_manager ? 'Com gestão' : 'Sem gestão'}
                  />
                  <DetailLine
                    label="Último acesso real"
                    value={formatOptionalDate(selectedTenant.last_access_at)}
                  />
                  <DetailLine
                    label="Usuários com acesso"
                    value={String(selectedTenant.portal_user_count)}
                  />
                  <DetailLine label="Tickets visíveis" value={String(selectedTenant.visible_ticket_count)} />
                  <DetailLine
                    label="Artigos autorizados"
                    value={String(selectedTenant.authorized_article_count)}
                  />
                  <DetailLine
                    label="Pendências"
                    tone={selectedTenant.risk_summary ? 'warning' : 'positive'}
                    value={sanitizeOperationalVisibleText(selectedTenant.risk_summary ?? 'Nenhuma pendencia operacional.')}
                  />
                </div>
              ) : (
                <InlineNotice>Nenhum cliente selecionado.</InlineNotice>
              )}
            </RailSection>

            <RailSection sectionKey="user" title={`Usuários com acesso (${selectedTenantUsers.length})`}>
              {selectedTenantUsers.length > 0 ? (
                <div className="space-y-2">
                  {selectedTenantUsers.slice(0, 3).map((user) => (
                    <button
                      className="flex w-full min-w-0 items-center gap-2 rounded-[14px] px-1.5 py-0.5 text-left hover:bg-[color:var(--color-surface)]"
                      key={user.membership_id}
                      onClick={() => setSelectedUserMembershipId(user.membership_id)}
                      type="button"
                    >
                      <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[color:var(--color-surface)] text-[0.68rem] font-semibold text-[color:var(--color-brand-blue)]">
                        {initialsFromName(user.user_full_name)}
                      </span>
                      <span className="min-w-0 flex-1">
                        <p className="truncate text-[0.8rem] font-semibold text-[color:var(--color-ink)]">
                          {sanitizeOperationalVisibleText(user.user_full_name)}
                        </p>
                        <p className="truncate text-[0.68rem] text-[color:var(--color-muted)]">
                          {user.user_email ?? 'Indisponível'}
                        </p>
                        <span className="mt-1 inline-flex">
                          <TinyBadge>{roleLabel(user.portal_role)}</TinyBadge>
                        </span>
                      </span>
                    </button>
                  ))}
                  {selectedTenantUsers.length > 3 ? (
                    <button
                      className="text-[0.78rem] font-semibold text-[color:var(--color-brand-blue)]"
                      onClick={() => {
                        if (selectedTenantUsers[3]) {
                          setSelectedUserMembershipId(selectedTenantUsers[3].membership_id);
                        }
                      }}
                      type="button"
                    >
                      Ver todos
                    </button>
                  ) : null}
                </div>
              ) : (
                <InlineNotice>Nenhum usuário com acesso neste cliente.</InlineNotice>
              )}
            </RailSection>

            <RailSection sectionKey="actions" title="Ações governadas">
              <div className="grid grid-cols-2 gap-2">
                <button
                  className="min-w-0 rounded-[12px] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-2 py-1.5 text-left text-[0.68rem] font-semibold leading-4 text-[color:var(--color-brand-blue)]"
                  onClick={() => setActiveDrawer('access')}
                  type="button"
                >
                  Gerenciar acesso
                </button>
                <button
                  className="min-w-0 rounded-[12px] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-2 py-1.5 text-left text-[0.68rem] font-semibold leading-4 text-[color:var(--color-brand-blue)]"
                  onClick={() => setActiveDrawer('grant-article')}
                  type="button"
                >
                  Conceder artigo
                </button>
                <button
                  className="min-w-0 rounded-[12px] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-2 py-1.5 text-left text-[0.68rem] font-semibold leading-4 text-[color:var(--color-brand-blue)]"
                  onClick={() => setActiveDrawer('link-ticket')}
                  type="button"
                >
                  Vincular a ticket
                </button>

                <button
                  className="min-w-0 rounded-[12px] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-2 py-1.5 text-left text-[0.68rem] font-semibold leading-4 text-[color:var(--color-muted)]"
                  disabled
                  title="Acesso direto aos tickets do portal ainda indisponível nesta tela."
                  type="button"
                >
                  Ver tickets
                </button>
              </div>
            </RailSection>
          </div>
        </SurfaceCard>
      </aside>
    </div>
      {activeDrawer === 'access' ? (
        <GovernedActionDrawer
          description="Ajuste os usuários que podem acessar o portal do cliente selecionado."
          footer={
            <>
              <GhostButton className="h-10 rounded-full px-6 text-sm" onClick={() => setActiveDrawer(null)}>
                Cancelar
              </GhostButton>
              <AppButton
                className="h-10 rounded-full px-6 text-sm"
                disabled={!selectedUser || submittingKey === 'save-access-drawer'}
                onClick={() => void handleSaveAccessDrawer()}
              >
                {submittingKey === 'save-access-drawer' ? 'Salvando...' : 'Salvar alterações'}
              </AppButton>
            </>
          }
          onClose={() => setActiveDrawer(null)}
          title="Gerenciar acesso do cliente"
        >
          <div className="space-y-6">
            <div className="rounded-[20px] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-5">
              <div className="grid grid-cols-[auto_minmax(0,1fr)_260px] items-center gap-5">
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-[18px] bg-[rgba(68,110,255,0.1)] text-base font-semibold text-[color:var(--color-brand-blue)]">
                  {initialsFromName(selectedTenant?.tenant_display_name)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="text-base font-semibold leading-6 text-[color:var(--color-ink)]">
                    {sanitizeOperationalVisibleText(selectedTenant?.tenant_display_name)}
                  </p>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <TinyBadge tone={selectedTenant?.has_active_manager ? 'positive' : 'warning'}>
                      {selectedTenant?.has_active_manager ? 'Com gestão' : 'Sem gestão'}
                    </TinyBadge>
                    <span className="text-[0.78rem] text-[color:var(--color-muted)]">
                      {selectedTenant ? tenantStatusLabel(selectedTenant.tenant_status) : 'Indisponível'}
                    </span>
                  </div>
                </div>
                <div className="grid min-w-0 grid-cols-3 gap-4 border-l border-[color:var(--color-border)] pl-5 text-center text-sm">
                  <div>
                    <p className="text-base font-semibold text-[color:var(--color-ink)]">
                      {selectedTenant?.portal_user_count ?? 0}
                    </p>
                    <p className="text-[0.68rem] text-[color:var(--color-muted)]">Usuários</p>
                  </div>
                  <div>
                    <p className="text-base font-semibold text-[color:var(--color-ink)]">
                      {selectedTenant?.visible_ticket_count ?? 0}
                    </p>
                    <p className="text-[0.68rem] text-[color:var(--color-muted)]">Tickets visíveis</p>
                  </div>
                  <div>
                    <p className="text-base font-semibold text-[color:var(--color-ink)]">
                      {selectedTenant?.authorized_article_count ?? 0}
                    </p>
                    <p className="text-[0.68rem] text-[color:var(--color-muted)]">Artigos autorizados</p>
                  </div>
                </div>
              </div>
            </div>

            <DrawerSection
              action={<span className="text-[0.78rem] text-[color:var(--color-muted)]">{selectedTenantUsers.length} usuários</span>}
              index={1}
              title="Usuários com acesso"
            >
              <div className="overflow-hidden rounded-[16px] border border-[color:var(--color-border)]">
                <div className="grid grid-cols-[minmax(0,1.8fr)_144px_116px_32px] gap-4 bg-[color:var(--color-surface)] px-4 py-2 text-[0.65rem] font-semibold uppercase tracking-[0.14em] text-[color:var(--color-muted)]">
                  <span>Usuário</span>
                  <span>Papel</span>
                  <span>Status</span>
                  <span />
                </div>
                {selectedTenantUsers.map((user) => (
                  <button
                    className={cx(
                      'grid w-full grid-cols-[minmax(0,1.8fr)_144px_116px_32px] items-center gap-4 border-t border-[color:var(--color-border)] px-4 py-3 text-left',
                      user.membership_id === selectedUserMembershipId && 'bg-[rgba(68,110,255,0.08)]',
                    )}
                    key={user.membership_id}
                    onClick={() => {
                      setSelectedUserMembershipId(user.membership_id);
                      setRoleDraft(user.portal_role);
                      setStatusDraft(user.membership_status);
                    }}
                    type="button"
                  >
                    <span className="flex min-w-0 items-center gap-3">
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[color:var(--color-surface)] text-[0.72rem] font-semibold text-[color:var(--color-brand-blue)]">
                        {initialsFromName(user.user_full_name)}
                      </span>
                      <span className="min-w-0">
                        <span className="block truncate text-sm font-semibold text-[color:var(--color-ink)]">
                          {sanitizeOperationalVisibleText(user.user_full_name)}
                        </span>
                        <span className="block truncate text-[0.74rem] text-[color:var(--color-muted)]">
                          {user.user_email ?? 'Indisponível'}
                        </span>
                      </span>
                    </span>
                    <TinyBadge>{roleLabel(user.portal_role)}</TinyBadge>
                    <TinyBadge tone={accessTone(user.access_status)}>{accessLabel(user.access_status)}</TinyBadge>
                    <span className="text-lg text-[color:var(--color-muted)]">⋮</span>
                  </button>
                ))}
              </div>
            </DrawerSection>

            <DrawerSection
              description="A inclusão inicial segue indisponível, mas a estrutura de governança permanece preparada."
              index={2}
              title="Adicionar usuário"
            >
              <div className="grid grid-cols-2 gap-4">
                <Field label="Nome completo">
                  <TextInput className="h-11 rounded-[14px] text-sm" disabled placeholder="Nome completo" />
                </Field>
                <Field label="E-mail">
                  <TextInput className="h-11 rounded-[14px] text-sm" disabled placeholder="usuario@empresa.com" />
                </Field>
                <Field label="Papel">
                  <SelectInput className="h-11 rounded-[14px] text-sm" disabled>
                    <option>Selecione o papel</option>
                  </SelectInput>
                </Field>
                <Field label="Status">
                  <SelectInput className="h-11 rounded-[14px] text-sm" disabled>
                    <option>Selecione o status</option>
                  </SelectInput>
                </Field>
              </div>
              <div className="mt-4 flex justify-end gap-2">
                <GhostButton className="h-10 rounded-full px-6 text-sm" disabled>
                  Limpar
                </GhostButton>
                <AppButton className="h-10 rounded-full px-6 text-sm" disabled>
                  Adicionar usuário
                </AppButton>
              </div>
            </DrawerSection>

            <DrawerSection
              description="Permissões exibidas como estado operacional."
              index={3}
              title="Permissões e visibilidade"
            >
              <div className="overflow-hidden rounded-[16px] border border-[color:var(--color-border)]">
                {['Acesso ao portal', 'Pode responder tickets', 'Pode visualizar artigos autenticados'].map((item) => (
                  <div
                    className="flex items-center justify-between border-b border-[color:var(--color-border)] px-4 py-3 last:border-b-0"
                    key={item}
                  >
                    <span>
                      <span className="block text-sm font-semibold text-[color:var(--color-ink)]">{item}</span>
                      <span className="text-[0.76rem] text-[color:var(--color-muted)]">Governado pelas permissões do portal.</span>
                    </span>
                    <span className="h-6 w-11 rounded-full bg-[color:var(--color-brand-blue)] p-1">
                      <span className="block h-4 w-4 translate-x-5 rounded-full bg-[color:var(--color-surface-strong)]" />
                    </span>
                  </div>
                ))}
              </div>
            </DrawerSection>
          </div>
        </GovernedActionDrawer>
      ) : null}

      {activeDrawer === 'grant-article' ? (
        <GovernedActionDrawer
          description="Autorize conteúdo autenticado para o cliente selecionado."
          footer={
            <>
              <GhostButton className="h-10 rounded-full px-6 text-sm" onClick={() => setActiveDrawer(null)}>
                Cancelar
              </GhostButton>
              <AppButton
                className="h-10 rounded-full px-6 text-sm"
                disabled={!selectedTenant || !grantForm.articleId || submittingKey === 'grant-entitlement'}
                form="grant-article-form"
                type="submit"
              >
                {submittingKey === 'grant-entitlement' ? 'Concedendo...' : 'Conceder acesso'}
              </AppButton>
            </>
          }
          onClose={() => setActiveDrawer(null)}
          title="Conceder artigo"
        >
          <form className="space-y-6" id="grant-article-form" onSubmit={handleGrantEntitlement}>
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-[16px] border border-[color:var(--color-border)] p-4">
                  <p className="text-[0.72rem] text-[color:var(--color-muted)]">Cliente</p>
                  <p className="mt-1 text-sm font-semibold text-[color:var(--color-ink)]">
                    {sanitizeOperationalVisibleText(selectedTenant?.tenant_display_name)}
                  </p>
                </div>
              <div className="rounded-[16px] border border-[color:var(--color-border)] p-4">
                <p className="text-[0.72rem] text-[color:var(--color-muted)]">Artigos autorizados</p>
                <p className="mt-1 text-sm font-semibold text-[color:var(--color-ink)]">
                  {selectedTenant?.authorized_article_count ?? 0}
                </p>
              </div>
            </div>

            <DrawerSection index={1} title="Buscar e filtrar artigos">
              <TextInput
                className="h-11 w-full rounded-[14px] text-sm"
                onChange={(event) => setGrantArticleSearch(event.target.value)}
                placeholder="Buscar artigo"
                value={grantArticleSearch}
              />
              <div className="mt-3 flex flex-wrap gap-2">
                <button
                  className={cx(
                    'rounded-full border px-4 py-2 text-[0.78rem] font-semibold',
                    grantCategoryFilter === 'all'
                      ? 'border-[color:var(--color-brand-blue)] text-[color:var(--color-brand-blue)]'
                      : 'border-[color:var(--color-border)] text-[color:var(--color-muted)]',
                  )}
                  onClick={() => setGrantCategoryFilter('all')}
                  type="button"
                >
                  Todos
                </button>
                {articleCategories.slice(0, 4).map((category) => (
                  <button
                    className={cx(
                      'rounded-full border px-4 py-2 text-[0.78rem] font-semibold',
                      grantCategoryFilter === category
                        ? 'border-[color:var(--color-brand-blue)] text-[color:var(--color-brand-blue)]'
                        : 'border-[color:var(--color-border)] text-[color:var(--color-muted)]',
                    )}
                    key={category}
                    onClick={() => setGrantCategoryFilter(category)}
                    type="button"
                  >
                    {category}
                  </button>
                ))}
              </div>
            </DrawerSection>

            <DrawerSection
              action={<span className="text-[0.78rem] text-[color:var(--color-muted)]">{filteredArticleCandidates.length} artigos</span>}
              index={2}
              title="Artigos disponíveis"
            >
              <div className="overflow-hidden rounded-[16px] border border-[color:var(--color-border)]">
                {filteredArticleCandidates.slice(0, 6).map((article) => (
                  <button
                    className={cx(
                      'grid w-full grid-cols-[minmax(0,1fr)_132px_40px] items-center gap-4 border-b border-[color:var(--color-border)] px-5 py-3.5 text-left last:border-b-0',
                      grantForm.articleId === article.article_id && 'bg-[rgba(68,110,255,0.08)]',
                    )}
                    key={article.article_id}
                    onClick={() => setGrantForm((current) => ({ ...current, articleId: article.article_id }))}
                    type="button"
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-[color:var(--color-ink)]">
                        {article.article_title}
                      </span>
                      <span className="text-[0.76rem] text-[color:var(--color-muted)]">
                        {article.category_name ?? 'Sem categoria'}
                      </span>
                    </span>
                    <TinyBadge>{article.article_visibility === 'public' ? 'Público' : 'Autenticado'}</TinyBadge>
                      <span className="flex h-5 w-5 items-center justify-center justify-self-end rounded-[6px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-strong)] text-[0.72rem] font-semibold text-[color:var(--color-brand-blue)]">
                        {grantForm.articleId === article.article_id ? '✓' : ''}
                      </span>
                  </button>
                ))}
              </div>
            </DrawerSection>

            <DrawerSection
              action={<span className="text-[0.78rem] text-[color:var(--color-muted)]">{selectedGrantArticle ? '1 artigo selecionado' : '0 artigos selecionados'}</span>}
              index={3}
              title="Resumo da concessão"
            >
              <TextareaInput
                className="min-h-[124px] w-full rounded-[14px] px-3 py-3 text-sm"
                onChange={(event) =>
                  setGrantForm((current) => ({ ...current, relationReason: event.target.value }))
                }
                placeholder="Descreva o motivo da concessão (opcional)"
                value={grantForm.relationReason}
              />
            </DrawerSection>
          </form>
        </GovernedActionDrawer>
      ) : null}

      {activeDrawer === 'link-ticket' ? (
        <GovernedActionDrawer
          description="Associe conhecimento útil ao contexto operacional do cliente."
          footer={
            <>
              <GhostButton className="h-10 rounded-full px-6 text-sm" onClick={() => setActiveDrawer(null)}>
                Cancelar
              </GhostButton>
              <AppButton
                className="h-10 rounded-full px-6 text-sm"
                disabled={!linkForm.ticketId || !linkForm.articleId || submittingKey === 'link-ticket-article'}
                form="link-ticket-article-form"
                type="submit"
              >
                {submittingKey === 'link-ticket-article' ? 'Salvando...' : 'Salvar vínculo'}
              </AppButton>
            </>
          }
          onClose={() => setActiveDrawer(null)}
          title="Vincular artigo a ticket"
        >
          <form className="space-y-6" id="link-ticket-article-form" onSubmit={handleLinkArticleToTicket}>
            <div className="rounded-[16px] border border-[color:var(--color-border)] p-4">
              <p className="text-sm font-semibold text-[color:var(--color-ink)]">
                {sanitizeOperationalVisibleText(selectedTenant?.tenant_display_name)}
              </p>
              <p className="mt-1 text-[0.78rem] text-[color:var(--color-muted)]">
                O vínculo será visível no portal de acordo com as permissões do cliente.
              </p>
            </div>

            <DrawerSection
              description="Selecione o ticket que receberá o vínculo com o artigo."
              index={1}
              title="Ticket em foco"
            >
              <SelectInput
                className="h-11 w-full rounded-[14px] text-sm"
                onChange={(event) => setLinkForm((current) => ({ ...current, ticketId: event.target.value }))}
                value={linkForm.ticketId}
              >
                <option value="">Selecione o ticket</option>
                {tenantScopedTickets.map((ticket) => (
                  <option key={ticket.ticket_id} value={ticket.ticket_id}>
                    {ticket.ticket_title}
                  </option>
                ))}
              </SelectInput>
              <div className="grid grid-cols-[0.55fr_minmax(0,1.5fr)_0.7fr_0.75fr] gap-4 rounded-[16px] border border-[color:var(--color-border)] p-4 text-sm">
                {[
                  {
                    label: 'ID do ticket',
                    value: selectedTicketCandidate ? `#${selectedTicketCandidate.ticket_id.slice(0, 8)}` : 'Indisponível',
                  },
                  {
                    label: 'Assunto',
                    value: selectedTicketCandidate?.ticket_title ?? 'Indisponível',
                  },
                  {
                    label: 'Status',
                    value: selectedTicketCandidate?.customer_status_label ?? 'Indisponível',
                  },
                  {
                    label: 'Categoria',
                    value: 'Indisponível',
                  },
                ].map((item) => (
                  <div className="min-w-0" key={item.label}>
                    <p className="truncate text-[0.68rem] font-semibold text-[color:var(--color-muted)]">
                      {item.label}
                    </p>
                    <p className="mt-2 line-clamp-2 text-[0.8rem] font-semibold leading-5 text-[color:var(--color-ink)]">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </DrawerSection>

            <DrawerSection
              description="Escolha um artigo elegível para vincular a este ticket."
              index={2}
              title="Selecionar artigo"
            >
              <TextInput
                className="h-11 w-full rounded-[14px] text-sm"
                onChange={(event) => setLinkArticleSearch(event.target.value)}
                placeholder="Buscar artigo por título ou palavra-chave"
                value={linkArticleSearch}
              />
              <div className="mt-3 overflow-hidden rounded-[16px] border border-[color:var(--color-border)]">
                {filteredLinkArticleCandidates.slice(0, 5).map((article) => (
                  <button
                    className={cx(
                      'grid w-full grid-cols-[28px_minmax(0,1fr)_132px] items-center gap-4 border-b border-[color:var(--color-border)] px-5 py-3.5 text-left last:border-b-0',
                      linkForm.articleId === article.article_id && 'bg-[rgba(68,110,255,0.08)]',
                    )}
                    key={article.article_id}
                    onClick={() => setLinkForm((current) => ({ ...current, articleId: article.article_id }))}
                    type="button"
                  >
                    <span className="h-4 w-4 rounded-full border border-[color:var(--color-border)] text-center text-[0.6rem]">
                      {linkForm.articleId === article.article_id ? '●' : ''}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-semibold text-[color:var(--color-ink)]">
                        {article.article_title}
                      </span>
                      <span className="block truncate text-[0.76rem] text-[color:var(--color-muted)]">
                        {article.category_name ?? 'Sem categoria'}
                      </span>
                    </span>
                    <TinyBadge>{article.article_visibility === 'public' ? 'Público' : 'Autenticado'}</TinyBadge>
                  </button>
                ))}
              </div>
            </DrawerSection>

            <DrawerSection
              description="Adicione uma mensagem opcional para contextualizar o vínculo."
              index={3}
              title="Mensagem de contexto"
            >
              <TextareaInput
                className="min-h-[124px] w-full rounded-[14px] px-3 py-3 text-sm"
                onChange={(event) =>
                  setLinkForm((current) => ({ ...current, relationReason: event.target.value }))
                }
                placeholder="Este artigo pode ajudar na tratativa deste ticket."
                value={linkForm.relationReason}
              />
            </DrawerSection>

            <DrawerSection
              description="Informações sobre o vínculo e sua governança."
              index={4}
              title="Vínculo governado"
            >
              <div className="grid grid-cols-3 gap-4 rounded-[16px] border border-[color:var(--color-border)] p-4 text-sm">
                <DetailLine label="Visível no portal" value="Sim, conforme permissões" />
                <DetailLine label="Origem" value="Administração" />
                <DetailLine label="Última revisão" value="Indisponível" />
              </div>
            </DrawerSection>
          </form>
        </GovernedActionDrawer>
      ) : null}
    </>
  );
}
