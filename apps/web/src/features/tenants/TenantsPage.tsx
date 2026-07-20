import {
  type FormEvent,
  type ReactNode,
  useDeferredValue,
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Link, Navigate } from 'react-router-dom';
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
  GovernedActionDrawer,
  InlineNotice,
  SelectInput,
  StatusPill,
  TextInput,
  TextareaInput,
  cx,
} from '../../components/ui';
import type {
  AdminAuditFeedRow,
  AdminCustomerAccountAlert,
  AdminCustomerAccountCustomization,
  AdminCustomerAccountFeature,
  AdminCustomerAccountIntegration,
  AdminCustomerAccountProfileDetail,
  AdminCommercialProduct,
  AdminCommercialProductDetail,
  AdminCustomerProductSubscription,
  AdminCustomerProductSubscriptionDetail,
  AdminTenantContactRecordRow,
  AdminTenantContactViewRow,
  AdminTenantDetailRow,
  AdminTenantMembershipRow,
  AdminTenantsListItemRow,
  CustomerAlertSeverity,
  CustomerCustomizationRiskLevel,
  CustomerIntegrationEnvironment,
  CustomerIntegrationStatus,
  CustomerIntegrationType,
  CustomerOperationalStatus,
  CustomerProductFeatureEntitlementSource,
  CustomerProductFeatureEntitlementStatus,
  CustomerProductInternalOwnerRole,
  CustomerProductInternalOwnerStatus,
  CustomerProductLine,
  CustomerProductSubscriptionStatus,
  TenantStatus,
} from '../../contracts/admin-contracts';
import {
  CUSTOMER_ALERT_SEVERITIES,
  CUSTOMER_CUSTOMIZATION_RISK_LEVELS,
  CUSTOMER_INTEGRATION_ENVIRONMENTS,
  CUSTOMER_INTEGRATION_STATUSES,
  CUSTOMER_INTEGRATION_TYPES,
  CUSTOMER_OPERATIONAL_STATUSES,
  CUSTOMER_PRODUCT_LINES,
  TENANT_STATUSES,
} from '../../contracts/admin-contracts';
import { useAuthContext } from '../auth/auth-context';
import {
  createTenant,
  createTenantContact,
  addCustomerAccountAlert,
  addCustomerAccountCustomization,
  addCustomerAccountIntegration,
  archiveCustomerProductSubscription,
  archiveCustomerAccountAlert,
  archiveCustomerAccountCustomization,
  archiveCustomerAccountIntegration,
  createCustomerProductSubscription,
  getAdminTenantDetail,
  getAdminCommercialProductDetail,
  getAdminCustomerProductSubscriptionDetail,
  getAdminCustomerAccountProfile,
  listAdminAuditFeed,
  listAdminCommercialProducts,
  listAdminCustomerAccountAlerts,
  listAdminCustomerAccountCustomizations,
  listAdminCustomerAccountFeatures,
  listAdminCustomerAccountIntegrations,
  listAdminCustomerProductSubscriptions,
  listAdminMemberships,
  listAdminTenants,
  setCustomerAccountFeatureFlag,
  updateCustomerAccountAlert,
  updateCustomerAccountCustomization,
  updateCustomerAccountIntegration,
  updateCustomerProductSubscription,
  updateTenantContact,
  updateTenantStatus,
  upsertCustomerAccountProfile,
} from '../admin/admin-api';
import { classifyAdminError } from '../admin/admin-errors';

type PagePhase = 'loading' | 'ready' | 'contract-unavailable' | 'error';
type DetailPhase = 'idle' | 'loading' | 'ready' | 'contract-unavailable' | 'error';
type TenantTab = 'summary' | 'account' | 'subscriptions' | 'members' | 'status' | 'activity';
type TenantUpdatedFilter = 'all' | '24h' | '7d' | '30d';
type TenantMembershipFilter = 'all' | 'active' | 'invited' | 'none';
type TenantSort = 'updated' | 'name';

interface TenantFormState {
  slug: string;
  legalName: string;
  displayName: string;
  dataRegion: string;
}

interface ContactFormState {
  fullName: string;
  email: string;
  phone: string;
  jobTitle: string;
  linkedUserId: string;
  isPrimary: boolean;
  isActive: boolean;
}

interface AccountProfileFormState {
  productLine: CustomerProductLine;
  operationalStatus: CustomerOperationalStatus;
  accountTier: string;
  internalNotes: string;
  highTouchAccount: boolean;
  customOperationalFlow: boolean;
  financialAttentionRequired: boolean;
  restrictedSupportWindow: boolean;
  integrationSensitiveAccount: boolean;
}

interface AccountIntegrationFormState {
  integrationType: CustomerIntegrationType;
  provider: string;
  status: CustomerIntegrationStatus;
  environment: CustomerIntegrationEnvironment;
  notes: string;
}

interface AccountCustomizationFormState {
  title: string;
  description: string;
  riskLevel: CustomerCustomizationRiskLevel;
  operationalNote: string;
  status: string;
}

interface AccountAlertFormState {
  severity: CustomerAlertSeverity;
  title: string;
  description: string;
  expiresAt: string;
}

interface AccountFeatureFormState {
  featureKey: string;
  enabled: boolean;
  source: string;
  notes: string;
}

type SubscriptionActionMode = 'create' | 'update';

interface SubscriptionFormState {
  productId: string;
  planId: string;
  status: Extract<CustomerProductSubscriptionStatus, 'pending' | 'active' | 'suspended'>;
  startedAt: string;
  endedAt: string;
  renewalAt: string;
  contractReference: string;
  notesInternal: string;
}

interface CustomerAccountState {
  profile: AdminCustomerAccountProfileDetail | null;
  integrations: AdminCustomerAccountIntegration[];
  customizations: AdminCustomerAccountCustomization[];
  alerts: AdminCustomerAccountAlert[];
  features: AdminCustomerAccountFeature[];
}

function emptyTenantForm(): TenantFormState {
  return {
    slug: '',
    legalName: '',
    displayName: '',
    dataRegion: 'sa-east-1',
  };
}

function emptyContactForm(): ContactFormState {
  return {
    fullName: '',
    email: '',
    phone: '',
    jobTitle: '',
    linkedUserId: '',
    isPrimary: false,
    isActive: true,
  };
}

function emptyAccountProfileForm(): AccountProfileFormState {
  return {
    productLine: 'genius_returns',
    operationalStatus: 'active',
    accountTier: '',
    internalNotes: '',
    highTouchAccount: false,
    customOperationalFlow: false,
    financialAttentionRequired: false,
    restrictedSupportWindow: false,
    integrationSensitiveAccount: false,
  };
}

function emptyAccountIntegrationForm(): AccountIntegrationFormState {
  return {
    integrationType: 'ecommerce_platform',
    provider: '',
    status: 'active',
    environment: 'production',
    notes: '',
  };
}

function emptyAccountCustomizationForm(): AccountCustomizationFormState {
  return {
    title: '',
    description: '',
    riskLevel: 'medium',
    operationalNote: '',
    status: 'active',
  };
}

function emptyAccountAlertForm(): AccountAlertFormState {
  return {
    severity: 'warning',
    title: '',
    description: '',
    expiresAt: '',
  };
}

function emptyAccountFeatureForm(): AccountFeatureFormState {
  return {
    featureKey: '',
    enabled: true,
    source: 'operations',
    notes: '',
  };
}

function emptySubscriptionForm(): SubscriptionFormState {
  return {
    productId: '',
    planId: '',
    status: 'pending',
    startedAt: '',
    endedAt: '',
    renewalAt: '',
    contractReference: '',
    notesInternal: '',
  };
}

function buildAccountProfileForm(
  profile: AdminCustomerAccountProfileDetail | null,
): AccountProfileFormState {
  const flags = profile?.operationalFlags ?? {};

  return {
    productLine: profile?.productLine ?? 'genius_returns',
    operationalStatus: profile?.operationalStatus ?? 'active',
    accountTier: profile?.accountTier ?? '',
    internalNotes: profile?.internalNotes ?? '',
    highTouchAccount: flags.high_touch_account === true,
    customOperationalFlow: flags.custom_operational_flow === true,
    financialAttentionRequired: flags.financial_attention_required === true,
    restrictedSupportWindow: flags.restricted_support_window === true,
    integrationSensitiveAccount: flags.integration_sensitive_account === true,
  };
}

function buildAccountIntegrationForm(
  integration: AdminCustomerAccountIntegration,
): AccountIntegrationFormState {
  return {
    integrationType: integration.integrationType,
    provider: integration.provider,
    status: integration.status,
    environment: integration.environment,
    notes: integration.notes ?? '',
  };
}

function buildAccountCustomizationForm(
  customization: AdminCustomerAccountCustomization,
): AccountCustomizationFormState {
  return {
    title: customization.title,
    description: customization.description,
    riskLevel: customization.riskLevel,
    operationalNote: customization.operationalNote ?? '',
    status: customization.status,
  };
}

function buildAccountAlertForm(alert: AdminCustomerAccountAlert): AccountAlertFormState {
  return {
    severity: alert.severity,
    title: alert.title,
    description: alert.description,
    expiresAt: alert.expiresAt ?? '',
  };
}

function buildContactForm(contact: AdminTenantContactViewRow): ContactFormState {
  return {
    fullName: contact.full_name,
    email: contact.email ?? '',
    phone: contact.phone ?? '',
    jobTitle: contact.job_title ?? '',
    linkedUserId: contact.linked_user_id ?? '',
    isPrimary: contact.is_primary,
    isActive: contact.is_active,
  };
}

function normalizeOptionalText(value: string) {
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function toneForTenantStatus(status: TenantStatus) {
  if (status === 'active') {
    return 'positive' as const;
  }

  if (status === 'suspended') {
    return 'warning' as const;
  }

  return 'critical' as const;
}

function labelForTenantStatus(status: TenantStatus) {
  if (status === 'active') {
    return 'Ativo';
  }

  if (status === 'suspended') {
    return 'Suspenso';
  }

  return 'Arquivado';
}

function labelForProductLine(value: CustomerProductLine | null | undefined) {
  if (value === 'genius_returns') {
    return 'Genius Returns';
  }

  if (value === 'after_sale') {
    return 'After Sale';
  }

  if (value === 'hybrid') {
    return 'Híbrido';
  }

  if (value === 'other') {
    return 'Outro';
  }

  return 'Indisponível';
}

function labelForOperationalStatus(value: CustomerOperationalStatus | null | undefined) {
  if (value === 'onboarding') {
    return 'Onboarding';
  }

  if (value === 'active') {
    return 'Ativo';
  }

  if (value === 'limited') {
    return 'Limitado';
  }

  if (value === 'suspended') {
    return 'Suspenso';
  }

  if (value === 'legacy') {
    return 'Legado';
  }

  return 'Indisponível';
}

function labelForIntegrationType(value: CustomerIntegrationType) {
  const labels: Record<CustomerIntegrationType, string> = {
    carrier: 'Transportadora',
    custom_api: 'API customizada',
    ecommerce_platform: 'E-commerce',
    erp: 'ERP',
    gateway: 'Gateway',
    logistics_provider: 'Logística',
    oms: 'OMS',
    other: 'Outro',
    refund_provider: 'Estorno',
  };

  return labels[value];
}

function labelForIntegrationStatus(value: CustomerIntegrationStatus) {
  const labels: Record<CustomerIntegrationStatus, string> = {
    active: 'Ativa',
    degraded: 'Degradada',
    deprecated: 'Legada',
    disabled: 'Arquivada',
    planned: 'Planejada',
  };

  return labels[value];
}

function labelForIntegrationEnvironment(value: CustomerIntegrationEnvironment) {
  const labels: Record<CustomerIntegrationEnvironment, string> = {
    other: 'Outro',
    production: 'Produção',
    sandbox: 'Sandbox',
    staging: 'Homologação',
  };

  return labels[value];
}

function labelForRiskLevel(value: CustomerCustomizationRiskLevel) {
  const labels: Record<CustomerCustomizationRiskLevel, string> = {
    critical: 'Crítico',
    high: 'Alto',
    low: 'Baixo',
    medium: 'Médio',
  };

  return labels[value];
}

function labelForAlertSeverity(value: CustomerAlertSeverity) {
  const labels: Record<CustomerAlertSeverity, string> = {
    critical: 'Crítico',
    high: 'Alto',
    info: 'Informativo',
    warning: 'Atenção',
  };

  return labels[value];
}

function labelForSubscriptionStatus(value: CustomerProductSubscriptionStatus) {
  const labels: Record<CustomerProductSubscriptionStatus, string> = {
    active: 'Ativa',
    cancelled: 'Cancelada',
    expired: 'Expirada',
    pending: 'Pendente',
    suspended: 'Suspensa',
  };

  return labels[value];
}

function toneForSubscriptionStatus(value: CustomerProductSubscriptionStatus) {
  if (value === 'active') {
    return 'positive' as const;
  }

  if (value === 'pending' || value === 'suspended') {
    return 'warning' as const;
  }

  return 'critical' as const;
}

function labelForEntitlementStatus(value: CustomerProductFeatureEntitlementStatus) {
  const labels: Record<CustomerProductFeatureEntitlementStatus, string> = {
    active: 'Habilitada',
    archived: 'Arquivada',
    inactive: 'Inativa',
  };

  return labels[value];
}

function toneForEntitlementStatus(value: CustomerProductFeatureEntitlementStatus) {
  if (value === 'active') {
    return 'positive' as const;
  }

  if (value === 'inactive') {
    return 'warning' as const;
  }

  return 'critical' as const;
}

function labelForEntitlementSource(value: CustomerProductFeatureEntitlementSource) {
  const labels: Record<CustomerProductFeatureEntitlementSource, string> = {
    addon: 'Add-on',
    migration: 'Migração',
    ops_override: 'Override operacional',
    pilot: 'Piloto',
    plan: 'Plano',
  };

  return labels[value];
}

function labelForOwnerRole(value: CustomerProductInternalOwnerRole) {
  const labels: Record<CustomerProductInternalOwnerRole, string> = {
    account_owner: 'Account owner',
    cs_owner: 'CS',
    finance_owner: 'Financeiro operacional',
    implementation_owner: 'Implantação',
    support_owner: 'Suporte',
    technical_owner: 'Técnico',
  };

  return labels[value];
}

function labelForOwnerStatus(value: CustomerProductInternalOwnerStatus) {
  const labels: Record<CustomerProductInternalOwnerStatus, string> = {
    active: 'Ativo',
    archived: 'Arquivado',
    inactive: 'Inativo',
  };

  return labels[value];
}

function toneForOwnerStatus(value: CustomerProductInternalOwnerStatus) {
  if (value === 'active') {
    return 'positive' as const;
  }

  if (value === 'inactive') {
    return 'warning' as const;
  }

  return 'critical' as const;
}

function formatNullableDateTime(value: string | null | undefined) {
  return value ? formatDateTime(value) : 'Indisponível';
}

function displayOptionalText(value: string | null | undefined) {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : 'Indisponível';
}

function formatDateTimeInput(value: string | null | undefined) {
  if (!value) {
    return '';
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }

  const offsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - offsetMs).toISOString().slice(0, 16);
}

function normalizeOptionalDateTime(value: string) {
  const trimmed = value.trim();
  if (!trimmed) {
    return null;
  }

  const date = new Date(trimmed);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function buildSubscriptionForm(
  subscription: AdminCustomerProductSubscriptionDetail,
): SubscriptionFormState {
  return {
    productId: subscription.productId,
    planId: subscription.planId,
    status:
      subscription.status === 'pending' ||
      subscription.status === 'active' ||
      subscription.status === 'suspended'
        ? subscription.status
        : 'suspended',
    startedAt: formatDateTimeInput(subscription.startedAt),
    endedAt: formatDateTimeInput(subscription.endedAt),
    renewalAt: formatDateTimeInput(subscription.renewalAt),
    contractReference: subscription.contractReference ?? '',
    notesInternal: subscription.notesInternal ?? '',
  };
}

const SUBSCRIPTION_MUTABLE_STATUSES = ['pending', 'active', 'suspended'] as const;

function membershipPillTone(activeMembershipCount: number, membershipCount: number) {
  if (membershipCount === 0) {
    return 'critical' as const;
  }

  if (activeMembershipCount === membershipCount) {
    return 'default' as const;
  }

  return 'warning' as const;
}

function initialsFromName(value: string) {
  return value
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? '')
    .join('') || 'CL';
}

function withinUpdatedWindow(isoTimestamp: string, filter: TenantUpdatedFilter) {
  if (filter === 'all') {
    return true;
  }

  const now = Date.now();
  const timestamp = new Date(isoTimestamp).getTime();
  const age = now - timestamp;

  if (Number.isNaN(age)) {
    return false;
  }

  if (filter === '24h') {
    return age <= 24 * 60 * 60 * 1000;
  }

  if (filter === '7d') {
    return age <= 7 * 24 * 60 * 60 * 1000;
  }

  return age <= 30 * 24 * 60 * 60 * 1000;
}

function classifyActivityTone(entry: AdminAuditFeedRow) {
  if (entry.action === 'delete') {
    return 'critical' as const;
  }

  if (entry.action === 'update') {
    return 'warning' as const;
  }

  return 'positive' as const;
}

function activityLabel(entry: AdminAuditFeedRow) {
  if (entry.entity_table === 'tenants') {
    if (entry.action === 'insert') {
      return 'Cliente criado';
    }

    if (entry.action === 'update') {
      return 'Dados do cliente atualizados';
    }

    return 'Cliente removido';
  }

  if (entry.entity_table === 'tenant_contacts') {
    if (entry.action === 'insert') {
      return 'Contato vinculado';
    }

    if (entry.action === 'update') {
      return 'Contato atualizado';
    }

    return 'Contato removido';
  }

  if (entry.action === 'insert') {
    return 'Vínculo criado';
  }

  if (entry.action === 'update') {
    return 'Vínculo atualizado';
  }

  return 'Vínculo removido';
}

function activityDescription(entry: AdminAuditFeedRow) {
  return entry.actor_full_name ?? entry.actor_email ?? 'Operação administrativa';
}

function TenantMetricTile({
  label,
  helper,
  value,
  tone = 'default',
}: {
  label: string;
  helper: string;
  value: string;
  tone?: 'default' | 'positive' | 'warning' | 'critical';
}) {
  return (
    <div
      className={cx(
        'rounded-[16px] border px-2.5 py-1.5',
        tone === 'positive' && 'border-[color:var(--color-success-border)] bg-[color:var(--color-success-surface)]/80',
        tone === 'warning' && 'border-[color:var(--color-warning-border)] bg-[color:var(--color-warning-surface)]/80',
        tone === 'critical' && 'border-[color:var(--color-danger-border)] bg-[color:var(--color-danger-surface)]/80',
        tone === 'default' && 'border-[color:var(--color-border)] bg-[color:var(--color-surface-strong)]',
      )}
    >
      <p className="text-[0.58rem] font-semibold uppercase tracking-[0.14em] text-[color:var(--color-muted)]">
        {label}
      </p>
      <div className="mt-1 flex items-end justify-between gap-1.5">
        <p className="text-[0.92rem] font-semibold tracking-[-0.04em] text-[color:var(--color-ink)]">
          {value}
        </p>
        <p className="max-w-[6.25rem] text-right text-[0.56rem] leading-[0.88rem] text-[color:var(--color-muted)]">
          {helper}
        </p>
      </div>
    </div>
  );
}

function TenantRailInfoRow({
  label,
  value,
}: {
  label: string;
  value: string;
}) {
  return (
    <div className="grid grid-cols-[112px_minmax(0,1fr)] gap-3 border-b border-[color:var(--color-border)] py-2.5 last:border-b-0">
      <span className="text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-[color:var(--color-muted)]">
        {label}
      </span>
      <span className="text-sm text-[color:var(--color-ink)]">{value}</span>
    </div>
  );
}

function TenantModal({
  title,
  description,
  onClose,
  children,
}: {
  title: string;
  description: string;
  onClose: () => void;
  children: ReactNode;
}) {
  return (
    <GovernedActionDrawer description={description} onClose={onClose} title={title}>
      {children}
    </GovernedActionDrawer>
  );
}

export function TenantsPage() {
  const { markSessionExpired } = useAuthContext();
  const didBootstrapRef = useRef(false);
  const didPrefillCreateRef = useRef(false);
  const [backendDenied, setBackendDenied] = useState(false);
  const [phase, setPhase] = useState<PagePhase>('loading');
  const [pageMessage, setPageMessage] = useState<string | null>(null);
  const [tenants, setTenants] = useState<AdminTenantsListItemRow[]>([]);
  const [memberships, setMemberships] = useState<AdminTenantMembershipRow[]>([]);
  const [auditFeed, setAuditFeed] = useState<AdminAuditFeedRow[]>([]);
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
  const [detailPhase, setDetailPhase] = useState<DetailPhase>('idle');
  const [detailMessage, setDetailMessage] = useState<string | null>(null);
  const [tenantDetail, setTenantDetail] = useState<AdminTenantDetailRow | null>(null);
  const [customerAccount, setCustomerAccount] = useState<CustomerAccountState>({
    profile: null,
    integrations: [],
    customizations: [],
    alerts: [],
    features: [],
  });
  const [subscriptionsPhase, setSubscriptionsPhase] = useState<DetailPhase>('idle');
  const [subscriptionsMessage, setSubscriptionsMessage] = useState<string | null>(null);
  const [customerProductSubscriptions, setCustomerProductSubscriptions] = useState<
    AdminCustomerProductSubscription[]
  >([]);
  const [selectedSubscriptionId, setSelectedSubscriptionId] = useState<string | null>(null);
  const [customerProductSubscriptionDetail, setCustomerProductSubscriptionDetail] =
    useState<AdminCustomerProductSubscriptionDetail | null>(null);
  const [commercialProducts, setCommercialProducts] = useState<AdminCommercialProduct[]>([]);
  const [commercialProductDetails, setCommercialProductDetails] = useState<
    AdminCommercialProductDetail[]
  >([]);
  const [subscriptionForm, setSubscriptionForm] =
    useState<SubscriptionFormState>(emptySubscriptionForm);
  const [subscriptionActionMode, setSubscriptionActionMode] =
    useState<SubscriptionActionMode | null>(null);
  const [subscriptionSubmitting, setSubscriptionSubmitting] = useState(false);
  const [subscriptionActionMessage, setSubscriptionActionMessage] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TenantTab>('summary');
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | TenantStatus>('all');
  const [membershipFilter, setMembershipFilter] = useState<TenantMembershipFilter>('all');
  const [updatedFilter, setUpdatedFilter] = useState<TenantUpdatedFilter>('all');
  const [sortOrder, setSortOrder] = useState<TenantSort>('updated');
  const [showCreateTenant, setShowCreateTenant] = useState(false);
  const [showContactManager, setShowContactManager] = useState(false);
  const [showStatusManager, setShowStatusManager] = useState(false);
  const [tenantForm, setTenantForm] = useState<TenantFormState>(emptyTenantForm);
  const [tenantFormMessage, setTenantFormMessage] = useState<string | null>(null);
  const [tenantFormSubmitting, setTenantFormSubmitting] = useState(false);
  const [statusDraft, setStatusDraft] = useState<TenantStatus>('active');
  const [statusSubmitting, setStatusSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [editingContactId, setEditingContactId] = useState<string | null>(null);
  const [contactForm, setContactForm] = useState<ContactFormState>(emptyContactForm);
  const [contactSubmitting, setContactSubmitting] = useState(false);
  const [contactMessage, setContactMessage] = useState<string | null>(null);
  const [accountProfileForm, setAccountProfileForm] =
    useState<AccountProfileFormState>(emptyAccountProfileForm);
  const [accountIntegrationForm, setAccountIntegrationForm] =
    useState<AccountIntegrationFormState>(emptyAccountIntegrationForm);
  const [accountCustomizationForm, setAccountCustomizationForm] =
    useState<AccountCustomizationFormState>(emptyAccountCustomizationForm);
  const [accountAlertForm, setAccountAlertForm] =
    useState<AccountAlertFormState>(emptyAccountAlertForm);
  const [accountFeatureForm, setAccountFeatureForm] =
    useState<AccountFeatureFormState>(emptyAccountFeatureForm);
  const [editingIntegrationId, setEditingIntegrationId] = useState<string | null>(null);
  const [editingCustomizationId, setEditingCustomizationId] = useState<string | null>(null);
  const [editingAlertId, setEditingAlertId] = useState<string | null>(null);
  const [accountSubmittingKey, setAccountSubmittingKey] = useState<string | null>(null);
  const [accountMessage, setAccountMessage] = useState<string | null>(null);
  const deferredQuery = useDeferredValue(query);

  const loadSurface = useEffectEvent(async (preferredTenantId?: string | null) => {
    if (phase === 'loading') {
      setPageMessage(null);
    }

    try {
      const [tenantRows, membershipRows, auditRows] = await Promise.all([
        listAdminTenants(),
        listAdminMemberships(),
        listAdminAuditFeed(160),
      ]);

      setBackendDenied(false);
      setTenants(tenantRows);
      setMemberships(membershipRows);
      setAuditFeed(auditRows);
      setPhase('ready');
      setPageMessage(null);

      const preservedTenantId =
        preferredTenantId ??
        (tenantRows.some((tenant) => tenant.id === selectedTenantId) ? selectedTenantId : null);

      setSelectedTenantId(preservedTenantId ?? tenantRows[0]?.id ?? null);
    } catch (error) {
      const classified = classifyAdminError(
        error,
        'Não foi possível carregar a base administrativa de clientes.',
      );

      if (classified.kind === 'session-expired') {
        markSessionExpired();
        return;
      }

      if (classified.kind === 'permission-denied') {
        setBackendDenied(true);
        return;
      }

      setTenants([]);
      setMemberships([]);
      setAuditFeed([]);
      setSelectedTenantId(null);
      setPageMessage(classified.message);
      setPhase(
        classified.kind === 'contract-unavailable' ? 'contract-unavailable' : 'error',
      );
    }
  });

  const loadTenantDetail = useEffectEvent(async (tenantId: string) => {
    setDetailPhase('loading');
    setDetailMessage(null);

    try {
      const [detail, accountProfile, integrations, customizations, alerts, features] =
        await Promise.all([
          getAdminTenantDetail(tenantId),
          getAdminCustomerAccountProfile(tenantId),
          listAdminCustomerAccountIntegrations(tenantId),
          listAdminCustomerAccountCustomizations(tenantId),
          listAdminCustomerAccountAlerts(tenantId),
          listAdminCustomerAccountFeatures(tenantId),
        ]);
      setBackendDenied(false);

      if (!detail) {
        setTenantDetail(null);
        setCustomerAccount({
          profile: null,
          integrations: [],
          customizations: [],
          alerts: [],
          features: [],
        });
        setDetailPhase('error');
        setDetailMessage('Não foi possível abrir o cliente selecionado.');
        return;
      }

      setTenantDetail(detail);
      setCustomerAccount({
        profile: accountProfile,
        integrations,
        customizations,
        alerts,
        features,
      });
      setAccountProfileForm(buildAccountProfileForm(accountProfile));
      setAccountIntegrationForm(emptyAccountIntegrationForm());
      setAccountCustomizationForm(emptyAccountCustomizationForm());
      setAccountAlertForm(emptyAccountAlertForm());
      setEditingIntegrationId(null);
      setEditingCustomizationId(null);
      setEditingAlertId(null);
      setDetailPhase('ready');
      setStatusDraft(detail.status);
    } catch (error) {
      const classified = classifyAdminError(
        error,
        'Não foi possível carregar o contexto do cliente selecionado.',
      );

      if (classified.kind === 'session-expired') {
        markSessionExpired();
        return;
      }

      if (classified.kind === 'permission-denied') {
        setBackendDenied(true);
        return;
      }

      setTenantDetail(null);
      setCustomerAccount({
        profile: null,
        integrations: [],
        customizations: [],
        alerts: [],
        features: [],
      });
      setDetailMessage(classified.message);
      setDetailPhase(
        classified.kind === 'contract-unavailable' ? 'contract-unavailable' : 'error',
      );
    }
  });

  const loadCustomerProductSubscriptions = useEffectEvent(async (tenantId: string) => {
    setSubscriptionsPhase('loading');
    setSubscriptionsMessage(null);

    try {
      const subscriptions = await listAdminCustomerProductSubscriptions(tenantId);
      const nextSubscriptionId = subscriptions[0]?.subscriptionId ?? null;
      const detail = nextSubscriptionId
        ? await getAdminCustomerProductSubscriptionDetail(nextSubscriptionId)
        : null;

      setCustomerProductSubscriptions(subscriptions);
      setSelectedSubscriptionId(nextSubscriptionId);
      setCustomerProductSubscriptionDetail(detail);
      setSubscriptionsPhase('ready');
    } catch (error) {
      const classified = classifyAdminError(
        error,
        'Não foi possível carregar as assinaturas comerciais da conta B2B.',
      );

      if (classified.kind === 'session-expired') {
        markSessionExpired();
        return;
      }

      setCustomerProductSubscriptions([]);
      setSelectedSubscriptionId(null);
      setCustomerProductSubscriptionDetail(null);
      setSubscriptionsMessage(classified.message);
      setSubscriptionsPhase(
        classified.kind === 'contract-unavailable' ? 'contract-unavailable' : 'error',
      );
    }
  });

  const loadCustomerProductSubscriptionDetail = useEffectEvent(async (subscriptionId: string) => {
    setSubscriptionsPhase('loading');
    setSubscriptionsMessage(null);

    try {
      const detail = await getAdminCustomerProductSubscriptionDetail(subscriptionId);
      setSelectedSubscriptionId(subscriptionId);
      setCustomerProductSubscriptionDetail(detail);
      setSubscriptionsPhase('ready');
    } catch (error) {
      const classified = classifyAdminError(
        error,
        'Não foi possível carregar o detalhe da assinatura comercial.',
      );

      if (classified.kind === 'session-expired') {
        markSessionExpired();
        return;
      }

      setCustomerProductSubscriptionDetail(null);
      setSubscriptionsMessage(classified.message);
      setSubscriptionsPhase(
        classified.kind === 'contract-unavailable' ? 'contract-unavailable' : 'error',
      );
    }
  });

  const loadCommercialCatalog = useEffectEvent(async () => {
    try {
      const products = await listAdminCommercialProducts();
      const details = await Promise.all(
        products.map((product) => getAdminCommercialProductDetail(product.productId)),
      );

      setCommercialProducts(products);
      setCommercialProductDetails(
        details.filter((detail): detail is AdminCommercialProductDetail => Boolean(detail)),
      );
    } catch (error) {
      const classified = classifyAdminError(
        error,
        'Não foi possível carregar o catálogo comercial.',
      );

      if (classified.kind === 'session-expired') {
        markSessionExpired();
        return;
      }

      if (classified.kind === 'permission-denied') {
        setBackendDenied(true);
        return;
      }

      setSubscriptionsMessage(classified.message);
    }
  });

  useEffect(() => {
    if (didBootstrapRef.current) {
      return;
    }

    didBootstrapRef.current = true;
    void loadSurface();
    void loadCommercialCatalog();
  }, []);

  useEffect(() => {
    if (!selectedTenantId) {
      setTenantDetail(null);
      setDetailPhase('idle');
      setDetailMessage(null);
      return;
    }

    void loadTenantDetail(selectedTenantId);
  }, [selectedTenantId]);

  useEffect(() => {
    setEditingContactId(null);
    setContactForm(emptyContactForm());
    setContactMessage(null);
    setAccountMessage(null);
    setAccountIntegrationForm(emptyAccountIntegrationForm());
    setAccountCustomizationForm(emptyAccountCustomizationForm());
    setAccountAlertForm(emptyAccountAlertForm());
    setAccountFeatureForm(emptyAccountFeatureForm());
    setCustomerProductSubscriptions([]);
    setSelectedSubscriptionId(null);
    setCustomerProductSubscriptionDetail(null);
    setSubscriptionsMessage(null);
    setSubscriptionsPhase('idle');
    setSubscriptionForm(emptySubscriptionForm());
    setSubscriptionActionMode(null);
    setSubscriptionActionMessage(null);
  }, [selectedTenantId]);

  useEffect(() => {
    if (!selectedTenantId) {
      return;
    }

    void loadCustomerProductSubscriptions(selectedTenantId);
  }, [selectedTenantId]);

  const filteredTenants = useMemo(() => {
    const normalizedQuery = deferredQuery.trim().toLowerCase();
    const next = tenants.filter((tenant) => {
      if (statusFilter !== 'all' && tenant.status !== statusFilter) {
        return false;
      }

      if (membershipFilter === 'active' && tenant.active_membership_count === 0) {
        return false;
      }

      if (membershipFilter === 'invited' && tenant.invited_membership_count === 0) {
        return false;
      }

      if (membershipFilter === 'none' && tenant.membership_count > 0) {
        return false;
      }

      if (!withinUpdatedWindow(tenant.updated_at, updatedFilter)) {
        return false;
      }

      if (!normalizedQuery) {
        return true;
      }

      const haystack = [
        tenant.display_name,
        tenant.legal_name,
        tenant.slug,
        tenant.primary_contact_full_name ?? '',
        tenant.primary_contact_email ?? '',
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(normalizedQuery);
    });

    next.sort((left, right) => {
      if (sortOrder === 'name') {
        return left.display_name.localeCompare(right.display_name, 'pt-BR');
      }

      return (
        new Date(right.updated_at).getTime() - new Date(left.updated_at).getTime()
      );
    });

    return next;
  }, [deferredQuery, membershipFilter, sortOrder, statusFilter, tenants, updatedFilter]);

  useEffect(() => {
    if (filteredTenants.length === 0) {
      setSelectedTenantId(null);
      return;
    }

    if (!selectedTenantId || !filteredTenants.some((tenant) => tenant.id === selectedTenantId)) {
      setSelectedTenantId(filteredTenants[0]?.id ?? null);
    }
  }, [filteredTenants, selectedTenantId]);

  useEffect(() => {
    if (showCreateTenant || didPrefillCreateRef.current || !tenants.some((tenant) => tenant.slug === 'qa-local-tenant')) {
      return;
    }

    didPrefillCreateRef.current = true;
  }, [showCreateTenant, tenants]);

  const selectedTenantSummary =
    tenants.find((tenant) => tenant.id === selectedTenantId) ?? null;
  const selectedTenantMemberships = memberships.filter(
    (membership) => membership.tenant_id === selectedTenantId,
  );
  const selectedTenantActivity = auditFeed
    .filter(
      (entry) =>
        entry.tenant_id === selectedTenantId ||
        (entry.entity_table === 'tenants' && entry.entity_id === selectedTenantId),
    )
    .slice(0, 8);

  const primaryContact =
    tenantDetail?.contacts.find((contact) => contact.is_primary) ??
    tenantDetail?.contacts[0] ??
    null;
  const activeCommercialProducts = commercialProducts.filter(
    (product) => product.status === 'active',
  );
  const selectedSubscriptionProductDetail =
    commercialProductDetails.find((product) => product.productId === subscriptionForm.productId) ??
    null;
  const subscriptionPlanOptions =
    selectedSubscriptionProductDetail?.plans.filter(
      (plan) => plan.status === 'active' || plan.planId === subscriptionForm.planId,
    ) ?? [];

  const totalTenants = tenants.length;
  const activeTenants = tenants.filter((tenant) => tenant.status === 'active').length;
  const suspendedTenants = tenants.filter((tenant) => tenant.status === 'suspended').length;
  const totalContacts = tenants.reduce(
    (sum, tenant) => sum + tenant.active_contact_count,
    0,
  );

  async function handleCreateTenant(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setTenantFormSubmitting(true);
    setTenantFormMessage(null);

    try {
      const created = await createTenant({
        p_slug: tenantForm.slug.trim(),
        p_legal_name: tenantForm.legalName.trim(),
        p_display_name: tenantForm.displayName.trim(),
        p_data_region: tenantForm.dataRegion.trim() || 'sa-east-1',
      });

      setShowCreateTenant(false);
      setTenantForm(emptyTenantForm());
      await loadSurface(created.id);
      await loadTenantDetail(created.id);
    } catch (error) {
      const classified = classifyAdminError(error, 'Não foi possível criar o cliente.');

      if (classified.kind === 'session-expired') {
        markSessionExpired();
        return;
      }

      if (classified.kind === 'permission-denied') {
        setBackendDenied(true);
        return;
      }

      setTenantFormMessage(classified.message);
    } finally {
      setTenantFormSubmitting(false);
    }
  }

  async function handleUpdateStatus(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedTenantId) {
      return;
    }

    setStatusSubmitting(true);
    setStatusMessage(null);

    try {
      await updateTenantStatus({
        p_tenant_id: selectedTenantId,
        p_status: statusDraft,
      });
      await loadSurface(selectedTenantId);
      await loadTenantDetail(selectedTenantId);
      setShowStatusManager(false);
      setStatusMessage('Status operacional atualizado com sucesso.');
    } catch (error) {
      const classified = classifyAdminError(
        error,
        'Não foi possível atualizar o status do cliente.',
      );

      if (classified.kind === 'session-expired') {
        markSessionExpired();
        return;
      }

      if (classified.kind === 'permission-denied') {
        setBackendDenied(true);
        return;
      }

      setStatusMessage(classified.message);
    } finally {
      setStatusSubmitting(false);
    }
  }

  async function handleSaveContact(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedTenantId) {
      return;
    }

    setContactSubmitting(true);
    setContactMessage(null);

    try {
      let savedRecord: AdminTenantContactRecordRow;

      if (editingContactId) {
        savedRecord = await updateTenantContact({
          p_contact_id: editingContactId,
          p_full_name: contactForm.fullName.trim(),
          p_email: normalizeOptionalText(contactForm.email),
          p_phone: normalizeOptionalText(contactForm.phone),
          p_job_title: normalizeOptionalText(contactForm.jobTitle),
          p_is_primary: contactForm.isPrimary,
          p_is_active: contactForm.isActive,
          p_linked_user_id: normalizeOptionalText(contactForm.linkedUserId),
        });
      } else {
        savedRecord = await createTenantContact({
          p_tenant_id: selectedTenantId,
          p_full_name: contactForm.fullName.trim(),
          p_email: normalizeOptionalText(contactForm.email),
          p_phone: normalizeOptionalText(contactForm.phone),
          p_job_title: normalizeOptionalText(contactForm.jobTitle),
          p_is_primary: contactForm.isPrimary,
          p_is_active: contactForm.isActive,
          p_linked_user_id: normalizeOptionalText(contactForm.linkedUserId),
        });
      }

      setEditingContactId(savedRecord.id);
      await loadSurface(selectedTenantId);
      await loadTenantDetail(selectedTenantId);
      setEditingContactId(null);
      setContactForm(emptyContactForm());
      setContactMessage('Contato sincronizado com sucesso.');
    } catch (error) {
      const classified = classifyAdminError(
        error,
        'Não foi possível sincronizar o contato do cliente.',
      );

      if (classified.kind === 'session-expired') {
        markSessionExpired();
        return;
      }

      if (classified.kind === 'permission-denied') {
        setBackendDenied(true);
        return;
      }

      setContactMessage(classified.message);
    } finally {
      setContactSubmitting(false);
    }
  }

  async function runAccountAction(actionKey: string, action: () => Promise<void>) {
    if (!selectedTenantId) {
      return;
    }

    setAccountSubmittingKey(actionKey);
    setAccountMessage(null);

    try {
      await action();
      await loadSurface(selectedTenantId);
      await loadTenantDetail(selectedTenantId);
      setAccountMessage('Operação da conta B2B sincronizada com sucesso.');
    } catch (error) {
      const classified = classifyAdminError(
        error,
        'Não foi possível sincronizar a operação da conta B2B.',
      );

      if (classified.kind === 'session-expired') {
        markSessionExpired();
        return;
      }

      if (classified.kind === 'permission-denied') {
        setBackendDenied(true);
        return;
      }

      setAccountMessage(classified.message);
    } finally {
      setAccountSubmittingKey(null);
    }
  }

  async function handleSaveAccountProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedTenantId) {
      return;
    }

    await runAccountAction('profile', async () => {
      await upsertCustomerAccountProfile({
        p_tenant_id: selectedTenantId,
        p_product_line: accountProfileForm.productLine,
        p_operational_status: accountProfileForm.operationalStatus,
        p_account_tier: accountProfileForm.accountTier.trim(),
        p_internal_notes: normalizeOptionalText(accountProfileForm.internalNotes),
        p_operational_flags: {
          high_touch_account: accountProfileForm.highTouchAccount,
          custom_operational_flow: accountProfileForm.customOperationalFlow,
          financial_attention_required: accountProfileForm.financialAttentionRequired,
          restricted_support_window: accountProfileForm.restrictedSupportWindow,
          integration_sensitive_account: accountProfileForm.integrationSensitiveAccount,
        },
        p_features: null,
      });
    });
  }

  async function handleSaveAccountIntegration(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedTenantId) {
      return;
    }

    await runAccountAction(
      editingIntegrationId ? `integration:${editingIntegrationId}:update` : 'integration:add',
      async () => {
        if (editingIntegrationId) {
          await updateCustomerAccountIntegration({
            p_integration_id: editingIntegrationId,
            p_status: accountIntegrationForm.status,
            p_environment: accountIntegrationForm.environment,
            p_notes: normalizeOptionalText(accountIntegrationForm.notes),
          });
        } else {
          await addCustomerAccountIntegration({
            p_tenant_id: selectedTenantId,
            p_integration_type: accountIntegrationForm.integrationType,
            p_provider: accountIntegrationForm.provider.trim(),
            p_status: accountIntegrationForm.status,
            p_environment: accountIntegrationForm.environment,
            p_notes: normalizeOptionalText(accountIntegrationForm.notes),
          });
        }

        setEditingIntegrationId(null);
      },
    );
    if (!editingIntegrationId) {
      setAccountIntegrationForm(emptyAccountIntegrationForm());
    }
  }

  async function handleSaveAccountCustomization(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedTenantId) {
      return;
    }

    await runAccountAction(
      editingCustomizationId ? `customization:${editingCustomizationId}:update` : 'customization:add',
      async () => {
        if (editingCustomizationId) {
          await updateCustomerAccountCustomization({
            p_customization_id: editingCustomizationId,
            p_title: accountCustomizationForm.title.trim(),
            p_description: accountCustomizationForm.description.trim(),
            p_risk_level: accountCustomizationForm.riskLevel,
            p_operational_note: normalizeOptionalText(accountCustomizationForm.operationalNote),
            p_status: accountCustomizationForm.status.trim() || 'active',
          });
        } else {
          await addCustomerAccountCustomization({
            p_tenant_id: selectedTenantId,
            p_title: accountCustomizationForm.title.trim(),
            p_description: accountCustomizationForm.description.trim(),
            p_risk_level: accountCustomizationForm.riskLevel,
            p_operational_note: normalizeOptionalText(accountCustomizationForm.operationalNote),
            p_status: accountCustomizationForm.status.trim() || 'active',
          });
        }

        setEditingCustomizationId(null);
      },
    );
    if (!editingCustomizationId) {
      setAccountCustomizationForm(emptyAccountCustomizationForm());
    }
  }

  async function handleSaveAccountAlert(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedTenantId) {
      return;
    }

    await runAccountAction(
      editingAlertId ? `alert:${editingAlertId}:update` : 'alert:add',
      async () => {
        if (editingAlertId) {
          await updateCustomerAccountAlert({
            p_alert_id: editingAlertId,
            p_severity: accountAlertForm.severity,
            p_title: accountAlertForm.title.trim(),
            p_description: accountAlertForm.description.trim(),
            p_active: true,
            p_expires_at: normalizeOptionalText(accountAlertForm.expiresAt),
          });
        } else {
          await addCustomerAccountAlert({
            p_tenant_id: selectedTenantId,
            p_severity: accountAlertForm.severity,
            p_title: accountAlertForm.title.trim(),
            p_description: accountAlertForm.description.trim(),
            p_expires_at: normalizeOptionalText(accountAlertForm.expiresAt),
          });
        }

        setEditingAlertId(null);
      },
    );
    if (!editingAlertId) {
      setAccountAlertForm(emptyAccountAlertForm());
    }
  }

  async function handleSetAccountFeature(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedTenantId) {
      return;
    }

    await runAccountAction('feature:set', async () => {
      await setCustomerAccountFeatureFlag({
        p_tenant_id: selectedTenantId,
        p_feature_key: accountFeatureForm.featureKey.trim(),
        p_enabled: accountFeatureForm.enabled,
        p_source: accountFeatureForm.source.trim() || 'operations',
        p_notes: normalizeOptionalText(accountFeatureForm.notes),
      });
      setAccountFeatureForm(emptyAccountFeatureForm());
    });
  }

  function openCreateSubscription() {
    const firstProduct = activeCommercialProducts[0] ?? null;
    const firstProductDetail = firstProduct
      ? commercialProductDetails.find((product) => product.productId === firstProduct.productId)
      : null;
    const firstPlan =
      firstProductDetail?.plans.find((plan) => plan.status === 'active') ??
      firstProductDetail?.plans[0] ??
      null;

    setSubscriptionForm({
      ...emptySubscriptionForm(),
      productId: firstProduct?.productId ?? '',
      planId: firstPlan?.planId ?? '',
      status: 'active',
      startedAt: formatDateTimeInput(new Date().toISOString()),
    });
    setSubscriptionActionMessage(null);
    setSubscriptionActionMode('create');
  }

  function openUpdateSubscription() {
    if (!customerProductSubscriptionDetail) {
      setSubscriptionActionMessage('Selecione uma assinatura antes de editar.');
      return;
    }

    setSubscriptionForm(buildSubscriptionForm(customerProductSubscriptionDetail));
    setSubscriptionActionMessage(null);
    setSubscriptionActionMode('update');
  }

  async function handleSaveSubscription(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!selectedTenantId || !subscriptionActionMode) {
      return;
    }

    setSubscriptionSubmitting(true);
    setSubscriptionActionMessage(null);

    try {
      if (subscriptionActionMode === 'create') {
        await createCustomerProductSubscription({
          p_tenant_id: selectedTenantId,
          p_product_id: subscriptionForm.productId,
          p_plan_id: subscriptionForm.planId,
          p_status: subscriptionForm.status,
          p_started_at: normalizeOptionalDateTime(subscriptionForm.startedAt),
          p_renewal_at: normalizeOptionalDateTime(subscriptionForm.renewalAt),
          p_contract_reference: subscriptionForm.contractReference.trim(),
          p_source: 'manual_admin',
          p_notes_internal: subscriptionForm.notesInternal.trim(),
          p_metadata: {},
        });
      } else if (customerProductSubscriptionDetail) {
        await updateCustomerProductSubscription({
          p_subscription_id: customerProductSubscriptionDetail.subscriptionId,
          p_plan_id: subscriptionForm.planId,
          p_status: subscriptionForm.status,
          p_started_at: normalizeOptionalDateTime(subscriptionForm.startedAt),
          p_ended_at: normalizeOptionalDateTime(subscriptionForm.endedAt),
          p_renewal_at: normalizeOptionalDateTime(subscriptionForm.renewalAt),
          p_contract_reference: subscriptionForm.contractReference.trim(),
          p_notes_internal: subscriptionForm.notesInternal.trim(),
          p_metadata: {},
        });
      }

      await loadSurface(selectedTenantId);
      await loadCustomerProductSubscriptions(selectedTenantId);
      setSubscriptionActionMode(null);
      setSubscriptionForm(emptySubscriptionForm());
      setSubscriptionActionMessage('Assinatura comercial salva com sucesso.');
    } catch (error) {
      const classified = classifyAdminError(
        error,
        'Não foi possível salvar a assinatura comercial.',
      );

      if (classified.kind === 'session-expired') {
        markSessionExpired();
        return;
      }

      if (classified.kind === 'permission-denied') {
        setBackendDenied(true);
        return;
      }

      setSubscriptionActionMessage(classified.message);
    } finally {
      setSubscriptionSubmitting(false);
    }
  }

  async function handleArchiveSubscription() {
    if (!selectedTenantId || !customerProductSubscriptionDetail) {
      return;
    }

    setSubscriptionSubmitting(true);
    setSubscriptionActionMessage(null);

    try {
      await archiveCustomerProductSubscription({
        p_subscription_id: customerProductSubscriptionDetail.subscriptionId,
      });
      await loadSurface(selectedTenantId);
      await loadCustomerProductSubscriptions(selectedTenantId);
      setSubscriptionActionMessage('Assinatura arquivada com status cancelado.');
    } catch (error) {
      const classified = classifyAdminError(
        error,
        'Não foi possível arquivar a assinatura comercial.',
      );

      if (classified.kind === 'session-expired') {
        markSessionExpired();
        return;
      }

      if (classified.kind === 'permission-denied') {
        setBackendDenied(true);
        return;
      }

      setSubscriptionActionMessage(classified.message);
    } finally {
      setSubscriptionSubmitting(false);
    }
  }

  function resetFilters() {
    setQuery('');
    setStatusFilter('all');
    setMembershipFilter('all');
    setUpdatedFilter('all');
    setSortOrder('updated');
  }

  if (backendDenied) {
    return <Navigate replace state={{ reason: 'missing-authorized-workspace' }} to="/access-denied" />;
  }

  if (phase === 'loading') {
    return <LoadingState title="Carregando clientes B2B" />;
  }

  if (phase === 'contract-unavailable') {
    return <ContractUnavailableState contractName="base administrativa de clientes" />;
  }

  if (phase === 'error') {
    return (
      <ErrorState
        action={<AppButton onClick={() => void loadSurface()}>Tentar novamente</AppButton>}
        description={
          pageMessage ?? 'Não foi possível carregar a base administrativa de clientes.'
        }
      />
    );
  }

  return (
    <div className="flex h-full min-h-0 flex-col overflow-hidden bg-[color:var(--minimal-surface)]">
      <section className="shrink-0 border-b border-[color:var(--minimal-border)] bg-[color:var(--minimal-surface)] px-5 py-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-lg font-semibold tracking-[-0.02em] text-[color:var(--minimal-text)]">
              Clientes B2B
            </h1>
            <p className="text-sm text-[color:var(--minimal-text-secondary)]">
              Revise status e contexto de cada cliente.
            </p>
          </div>

          <AppButton
            className="min-h-9 gap-2 rounded-md px-4 text-sm"
            onClick={() => setShowCreateTenant((current) => !current)}
          >
            + Novo cliente
          </AppButton>
        </div>
      </section>

      <div className="grid min-h-0 flex-1 overflow-hidden xl:grid-cols-[220px_minmax(0,1fr)_360px]">
        <aside className="hidden space-y-4 xl:block xl:min-h-0 xl:overflow-hidden">
          <section className="h-full border-r border-[color:var(--minimal-border)] bg-[color:var(--minimal-sidebar)] p-3 xl:flex xl:min-h-0 xl:flex-col xl:overflow-y-auto">
            <div className="space-y-2 xl:flex xl:h-full xl:flex-col">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-[color:var(--color-muted)]">
                Ferramentas
              </p>

              <div className="hidden">
                <p className="text-[0.84rem] font-semibold text-[color:var(--color-ink)]">Resumo da base</p>
                <div className="grid grid-cols-2 gap-1.5">
                  <TenantMetricTile helper="base atual" label="Clientes" value={String(totalTenants)} />
                  <TenantMetricTile
                    helper="em operação"
                    label="Ativos"
                    tone="positive"
                    value={String(activeTenants)}
                  />
                  <TenantMetricTile
                    helper="pedem atenção"
                    label="Suspensos"
                    tone="warning"
                    value={String(suspendedTenants)}
                  />
                  <TenantMetricTile
                    helper="prontos para contato"
                    label="Contatos"
                    value={String(totalContacts)}
                  />
                </div>
              </div>

              <div className="hidden">
                <p className="text-[0.84rem] font-semibold text-[color:var(--color-ink)]">Ações rápidas</p>
                <div className="grid gap-1.5">
                  <AppButton
                    className="min-h-8 justify-start px-3.5 text-[0.78rem]"
                    onClick={() => setShowCreateTenant(true)}
                  >
                    Criar cliente
                  </AppButton>
                  <GhostButton className="min-h-8 justify-start px-3.5 text-[0.78rem]" onClick={() => void loadSurface(selectedTenantId)}>
                    Atualizar lista
                  </GhostButton>
                  {selectedTenantId ? (
                    <Link
                      className="inline-flex min-h-8 items-center justify-start rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface-strong)] px-3.5 text-[0.78rem] font-medium text-[color:var(--color-ink)] transition hover:border-[color:var(--color-brand-blue)]/40 hover:bg-[color:var(--color-surface)]"
                      to={`/support/customers/${selectedTenantId}`}
                    >
                      Abrir contexto
                    </Link>
                  ) : null}
                </div>
              </div>

              <div className="space-y-3 border-t border-[color:var(--minimal-border)] pt-3 xl:flex-1">
                <p className="text-[0.84rem] font-semibold text-[color:var(--color-ink)]">Filtros</p>

                <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
                  <div className="space-y-1">
                    <label className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[color:var(--color-muted)]">
                      Status
                    </label>
                    <SelectInput
                      className="min-h-8 text-[0.78rem]"
                      onChange={(event) =>
                        setStatusFilter(event.target.value as 'all' | TenantStatus)
                      }
                      value={statusFilter}
                    >
                      <option value="all">Todos</option>
                      {TENANT_STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {labelForTenantStatus(status)}
                        </option>
                      ))}
                    </SelectInput>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[color:var(--color-muted)]">
                      Vínculos
                    </label>
                    <SelectInput
                      className="min-h-8 text-[0.78rem]"
                      onChange={(event) =>
                        setMembershipFilter(event.target.value as TenantMembershipFilter)
                      }
                      value={membershipFilter}
                    >
                      <option value="all">Todas</option>
                      <option value="active">Com vínculos ativos</option>
                      <option value="invited">Com convites pendentes</option>
                      <option value="none">Sem vínculos</option>
                    </SelectInput>
                  </div>

                  <div className="space-y-1 sm:col-span-2 xl:col-span-1">
                    <label className="text-[0.68rem] font-semibold uppercase tracking-[0.16em] text-[color:var(--color-muted)]">
                      Última atualização
                    </label>
                    <SelectInput
                      className="min-h-8 text-[0.78rem]"
                      onChange={(event) =>
                        setUpdatedFilter(event.target.value as TenantUpdatedFilter)
                      }
                      value={updatedFilter}
                    >
                      <option value="all">Todas</option>
                      <option value="24h">Últimas 24 horas</option>
                      <option value="7d">Últimos 7 dias</option>
                      <option value="30d">Últimos 30 dias</option>
                    </SelectInput>
                  </div>
                </div>

                <GhostButton className="min-h-8 w-full text-[0.78rem]" onClick={resetFilters}>
                  Limpar filtros
                </GhostButton>
              </div>
            </div>
          </section>
        </aside>

        <section className="min-w-0 bg-[color:var(--minimal-surface)] xl:flex xl:h-full xl:flex-col xl:overflow-hidden">
          <header className="flex flex-wrap items-center justify-between gap-3 border-b border-[color:var(--color-border)] px-5 py-3.5">
            <div className="space-y-1">
              <h2 className="text-base font-semibold text-[color:var(--minimal-text)]">
                Base de clientes
              </h2>
              <p className="text-[0.92rem] text-[color:var(--color-muted)]">
                {filteredTenants.length} cliente(s) no recorte atual
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <TextInput
                className="min-h-9 w-[288px] text-[0.92rem]"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Buscar cliente, empresa ou contato"
                value={query}
              />
              <SelectInput
                className="min-h-9 w-[184px] text-[0.92rem]"
                onChange={(event) => setSortOrder(event.target.value as TenantSort)}
                value={sortOrder}
              >
                <option value="updated">Mais recentes</option>
                <option value="name">Ordem alfabética</option>
              </SelectInput>
            </div>
          </header>

          <div className="space-y-3 p-4 xl:flex xl:min-h-0 xl:flex-1 xl:flex-col">
            {tenants.length === 0 ? (
              <EmptyState
                description="Ainda não existe cliente operacional nesta área."
                title="Nenhum cliente cadastrado"
              />
            ) : filteredTenants.length === 0 ? (
              <EmptyState
                action={<GhostButton onClick={resetFilters}>Limpar filtros</GhostButton>}
                description="Ajuste o recorte atual para recuperar a base."
                title="Nenhum cliente encontrado"
              />
            ) : (
              <>
                <div className="xl:min-h-0 xl:flex-1 xl:overflow-y-auto">
                  {filteredTenants.map((tenant) => {
                    const isSelected = tenant.id === selectedTenantId;

                    return (
                      <button
                        className={cx(
                          'w-full border-b border-[color:var(--minimal-border)] px-4 py-3 text-left transition-colors',
                          isSelected
                            ? 'bg-[color:var(--minimal-selection)]'
                            : 'bg-[color:var(--minimal-surface)] hover:bg-[color:var(--minimal-surface-muted)]',
                        )}
                        key={tenant.id}
                        onClick={() => setSelectedTenantId(tenant.id)}
                        type="button"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="space-y-2.5">
                            <div className="flex flex-wrap items-center gap-2">
                              <StatusPill tone={toneForTenantStatus(tenant.status)}>
                                {labelForTenantStatus(tenant.status)}
                              </StatusPill>
                              <StatusPill
                                tone={membershipPillTone(
                                  tenant.active_membership_count,
                                  tenant.membership_count,
                                )}
                              >
                                {tenant.active_membership_count}/{tenant.membership_count} vínculos
                              </StatusPill>
                            </div>

                            <div className="space-y-1">
                              <p className="text-[0.98rem] font-semibold tracking-[-0.03em] text-[color:var(--color-ink)]">
                                {sanitizeOperationalVisibleText(tenant.display_name)}
                              </p>
                              <p className="text-[0.84rem] text-[color:var(--color-muted)]">
                                {sanitizeOperationalVisibleText(tenant.legal_name)}
                              </p>
                            </div>

                            <div className="flex flex-wrap gap-x-4 gap-y-1 text-[0.8rem] leading-5 text-[color:var(--color-muted)]">
                              <span>
                                Grupo: Indisponível
                              </span>
                              <span>
                                Contato principal:{' '}
                                {sanitizeOperationalVisibleText(tenant.primary_contact_full_name)}
                              </span>
                              <span>Plano: Indisponível</span>
                              <span>
                                Atualizado em {formatDateTime(tenant.updated_at)}
                              </span>
                            </div>
                          </div>

                          <span className="text-[1.25rem] text-[color:var(--color-muted)]">⋮</span>
                        </div>
                      </button>
                    );
                  })}
                </div>

                <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-[color:var(--color-border)] pt-3 text-[0.88rem] text-[color:var(--color-muted)]">
                  <span>
                    Exibindo 1-{filteredTenants.length} de {filteredTenants.length} cliente(s)
                  </span>
                </footer>
              </>
            )}
          </div>
        </section>

        <aside className="hidden min-w-0 border-l border-[color:var(--minimal-border)] bg-[color:var(--minimal-sidebar)] p-4 xl:flex xl:h-full xl:min-h-0 xl:flex-col xl:overflow-hidden">
          <div className="space-y-3 xl:flex xl:min-h-0 xl:flex-1 xl:flex-col">
            <div className="space-y-1">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-[color:var(--color-muted)]">
                Cliente selecionado
              </p>
              <h2 className="text-[1rem] font-semibold tracking-[-0.03em] text-[color:var(--color-ink)]">
                Contexto operacional
              </h2>
            </div>

            {detailPhase === 'idle' ? (
              <EmptyState
                description="Selecione uma linha da base principal para abrir o contexto do cliente."
                title="Nenhum cliente selecionado"
              />
            ) : detailPhase === 'loading' ? (
              <LoadingState
                description="Carregando o contexto detalhado do cliente."
                title="Abrindo cliente"
              />
            ) : detailPhase === 'contract-unavailable' ? (
              <ContractUnavailableState contractName="detalhe do cliente" />
            ) : detailPhase === 'error' || !tenantDetail || !selectedTenantSummary ? (
              <ErrorState
                description={detailMessage ?? 'O contexto do cliente não ficou disponível.'}
              />
            ) : (
              <div className="space-y-3 xl:min-h-0 xl:flex-1 xl:overflow-y-auto xl:pr-1">
                <section>
                  <div className="flex items-start gap-3.5">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[16px] bg-[rgba(48,127,226,0.08)] text-[1.12rem] font-semibold text-[color:var(--color-brand-blue)]">
                      {initialsFromName(tenantDetail.display_name)}
                    </div>
                    <div className="min-w-0 flex-1 space-y-1.5">
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusPill tone={toneForTenantStatus(tenantDetail.status)}>
                          {labelForTenantStatus(tenantDetail.status)}
                        </StatusPill>
                        <StatusPill>
                          {tenantDetail.active_membership_count}/{tenantDetail.membership_count} vínculos
                        </StatusPill>
                      </div>
                      <div className="space-y-1">
                        <h3 className="text-[0.98rem] font-semibold tracking-[-0.03em] text-[color:var(--color-ink)]">
                          {sanitizeOperationalVisibleText(tenantDetail.display_name)}
                        </h3>
                        <p className="text-[0.86rem] leading-5 text-[color:var(--color-muted)]">
                          {sanitizeOperationalVisibleText(tenantDetail.legal_name)}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-3.5 flex items-center justify-between gap-3 rounded-[18px] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3.5 py-2.5">
                    <div className="space-y-1">
                      <p className="text-xs uppercase tracking-[0.16em] text-[color:var(--color-muted)]">
                        Contato principal
                      </p>
                      <p className="text-[0.92rem] font-medium text-[color:var(--color-ink)]">
                        {sanitizeOperationalVisibleText(primaryContact?.full_name)}
                      </p>
                    </div>

                    {primaryContact?.email ? (
                      <a
                        className="inline-flex min-h-9 items-center justify-center rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface-strong)] px-4 text-[0.88rem] font-medium text-[color:var(--color-ink)] transition hover:border-[color:var(--color-brand-blue)]/40 hover:bg-[color:var(--color-surface)]"
                        href={`mailto:${primaryContact.email}`}
                      >
                        Ver contato
                      </a>
                    ) : (
                      <span className="text-sm text-[color:var(--color-muted)]">Sem email</span>
                    )}
                  </div>

                  <div className="mt-3.5 flex flex-wrap gap-2 border-b border-[color:var(--color-border)] pb-2.5">
                    {[
                      { id: 'summary', label: 'Resumo' },
                      { id: 'account', label: 'Conta B2B' },
                      { id: 'subscriptions', label: 'Assinaturas' },
                      { id: 'members', label: 'Membros' },
                      { id: 'status', label: 'Status' },
                      { id: 'activity', label: 'Atividade' },
                    ].map((tab) => (
                      <button
                        className={cx(
                          'border-b-2 px-1 pb-2 text-[0.92rem] font-semibold transition',
                          activeTab === tab.id
                            ? 'border-[color:var(--color-brand-blue)] text-[color:var(--color-brand-blue)]'
                            : 'border-transparent text-[color:var(--color-muted)] hover:text-[color:var(--color-ink)]',
                        )}
                        key={tab.id}
                        onClick={() => setActiveTab(tab.id as TenantTab)}
                        type="button"
                      >
                        {tab.label}
                      </button>
                    ))}
                  </div>

                  <div className="mt-3.5 space-y-3">
                    {activeTab === 'summary' ? (
                      <>
                        <div className="grid grid-cols-2 gap-2">
                          <TenantMetricTile
                            helper="vínculos ativos"
                            label="Vínculos"
                            value={String(tenantDetail.active_membership_count)}
                          />
                          <TenantMetricTile
                            helper="pontos de contato"
                            label="Contatos ativos"
                            value={String(tenantDetail.active_contact_count)}
                          />
                          <TenantMetricTile helper="não contratado" label="SLA críticos" value="0" />
                          <TenantMetricTile helper="sem leitura dedicada" label="Incidentes" value="0" />
                        </div>

                        <div className="rounded-[20px] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-3.5">
                          <p className="mb-1.5 text-[0.92rem] font-semibold text-[color:var(--color-ink)]">
                            Informações do cliente
                          </p>
                          <TenantRailInfoRow label="Grupo" value="Indisponível" />
                          <TenantRailInfoRow label="Empresa" value={sanitizeOperationalVisibleText(tenantDetail.legal_name)} />
                          <TenantRailInfoRow
                            label="Plano"
                            value={customerAccount.profile?.accountTier ?? 'Indisponível'}
                          />
                          <TenantRailInfoRow
                            label="Produto"
                            value={labelForProductLine(customerAccount.profile?.productLine)}
                          />
                          <TenantRailInfoRow
                            label="Atualizado"
                            value={formatDateTime(tenantDetail.updated_at)}
                          />
                        </div>

                        <div className="rounded-[20px] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-3.5">
                          <p className="mb-1.5 text-[0.92rem] font-semibold text-[color:var(--color-ink)]">
                            Ações rápidas
                          </p>
                          <div className="grid gap-1.5">
                            <Link
                              className="inline-flex min-h-9 items-center justify-center rounded-full bg-[linear-gradient(135deg,var(--color-brand-navy),var(--color-brand-blue))] px-4 text-[0.88rem] font-medium text-white shadow-[0_12px_30px_rgba(20,31,71,0.22)]"
                              to={`/support/customers/${tenantDetail.id}`}
                            >
                              Abrir contexto operacional
                            </Link>
                            <button
                              className="inline-flex min-h-9 items-center justify-center rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface-strong)] px-4 text-[0.88rem] font-medium text-[color:var(--color-ink)] transition hover:border-[color:var(--color-brand-blue)]/40 hover:bg-[color:var(--color-surface)]"
                              onClick={() => setActiveTab('members')}
                              type="button"
                            >
                              Gerenciar vínculos
                            </button>
                            <button
                              className="inline-flex min-h-9 items-center justify-center rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface-strong)] px-4 text-[0.88rem] font-medium text-[color:var(--color-ink)] transition hover:border-[color:var(--color-brand-blue)]/40 hover:bg-[color:var(--color-surface)]"
                              onClick={() => setShowContactManager(true)}
                              type="button"
                            >
                              Gerenciar contatos
                            </button>
                            <button
                              className="inline-flex min-h-9 items-center justify-center rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface-strong)] px-4 text-[0.88rem] font-medium text-[color:var(--color-ink)] transition hover:border-[color:var(--color-brand-blue)]/40 hover:bg-[color:var(--color-surface)]"
                              onClick={() => setActiveTab('activity')}
                              type="button"
                            >
                              Ver atividade do cliente
                            </button>
                          </div>
                        </div>

                        <div className="rounded-[20px] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-3.5">
                          <div className="flex items-center justify-between gap-3">
                            <p className="text-[0.92rem] font-semibold text-[color:var(--color-ink)]">
                              Contatos vinculados
                            </p>
                            <GhostButton
                              className="min-h-9 px-3 text-xs"
                              onClick={() => setShowContactManager(true)}
                              type="button"
                            >
                              Gerenciar
                            </GhostButton>
                          </div>

                          <div className="mt-3 space-y-2.5">
                            {tenantDetail.contacts.length === 0 ? (
                              <InlineNotice>Nenhum contato oficial vinculado.</InlineNotice>
                            ) : (
                              tenantDetail.contacts.slice(0, 2).map((contact) => (
                                <div
                                  className="rounded-[18px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-strong)] px-3 py-3"
                                  key={contact.id}
                                >
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="text-[0.92rem] font-medium text-[color:var(--color-ink)]">
                                      {sanitizeOperationalVisibleText(contact.full_name)}
                                    </span>
                                    {contact.is_primary ? (
                                      <StatusPill tone="accent">Principal</StatusPill>
                                    ) : null}
                                  </div>
                                  <p className="mt-1 text-[0.88rem] text-[color:var(--color-muted)]">
                                    {contact.email ?? 'Sem email'} · {contact.phone ?? 'Sem telefone'}
                                  </p>
                                </div>
                              ))
                            )}
                          </div>
                        </div>
                      </>
                    ) : null}

                    {activeTab === 'account' ? (
                      <div className="space-y-3">
                        {accountMessage ? <InlineNotice>{accountMessage}</InlineNotice> : null}

                        <form
                          className="space-y-3 rounded-[20px] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-3.5"
                          onSubmit={handleSaveAccountProfile}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <p className="text-[0.92rem] font-semibold text-[color:var(--color-ink)]">
                                Perfil operacional
                              </p>
                              <p className="mt-1 text-[0.78rem] leading-5 text-[color:var(--color-muted)]">
                                Mantido por ação administrativa auditada, com conteúdo sensível protegido.
                              </p>
                            </div>
                            <AppButton
                              className="min-h-9 px-3 text-xs"
                              disabled={accountSubmittingKey === 'profile'}
                              type="submit"
                            >
                              Salvar perfil
                            </AppButton>
                          </div>

                          <div className="grid gap-2">
                            <Field label="Produto">
                              <SelectInput
                                value={accountProfileForm.productLine}
                                onChange={(event) =>
                                  setAccountProfileForm((current) => ({
                                    ...current,
                                    productLine: event.target.value as CustomerProductLine,
                                  }))
                                }
                              >
                                {CUSTOMER_PRODUCT_LINES.map((value) => (
                                  <option key={value} value={value}>
                                    {labelForProductLine(value)}
                                  </option>
                                ))}
                              </SelectInput>
                            </Field>
                            <Field label="Status operacional">
                              <SelectInput
                                value={accountProfileForm.operationalStatus}
                                onChange={(event) =>
                                  setAccountProfileForm((current) => ({
                                    ...current,
                                    operationalStatus: event.target.value as CustomerOperationalStatus,
                                  }))
                                }
                              >
                                {CUSTOMER_OPERATIONAL_STATUSES.map((value) => (
                                  <option key={value} value={value}>
                                    {labelForOperationalStatus(value)}
                                  </option>
                                ))}
                              </SelectInput>
                            </Field>
                            <Field label="Plano / tier">
                              <TextInput
                                onChange={(event) =>
                                  setAccountProfileForm((current) => ({
                                    ...current,
                                    accountTier: event.target.value,
                                  }))
                                }
                                placeholder="enterprise"
                                value={accountProfileForm.accountTier}
                              />
                            </Field>
                            <Field label="Observação interna segura">
                              <TextareaInput
                                onChange={(event) =>
                                  setAccountProfileForm((current) => ({
                                    ...current,
                                    internalNotes: event.target.value,
                                  }))
                                }
                                placeholder="Sem tokens, URLs internas, endpoints ou credenciais."
                                rows={3}
                                value={accountProfileForm.internalNotes}
                              />
                            </Field>
                          </div>

                          <div className="grid gap-2 text-[0.82rem] text-[color:var(--color-ink)]">
                            {[
                              ['highTouchAccount', 'Conta high-touch'],
                              ['customOperationalFlow', 'Fluxo operacional customizado'],
                              ['financialAttentionRequired', 'Atenção financeira'],
                              ['restrictedSupportWindow', 'Janela de suporte restrita'],
                              ['integrationSensitiveAccount', 'Conta sensível a integração'],
                            ].map(([key, label]) => (
                              <label className="flex items-center gap-2" key={key}>
                                <input
                                  checked={Boolean(
                                    accountProfileForm[key as keyof AccountProfileFormState],
                                  )}
                                  onChange={(event) =>
                                    setAccountProfileForm((current) => ({
                                      ...current,
                                      [key]: event.target.checked,
                                    }))
                                  }
                                  type="checkbox"
                                />
                                {label}
                              </label>
                            ))}
                          </div>
                        </form>

                        <section className="space-y-2 rounded-[20px] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-3.5">
                          <p className="text-[0.92rem] font-semibold text-[color:var(--color-ink)]">
                            Integrações principais
                          </p>
                          <form className="grid gap-2" onSubmit={handleSaveAccountIntegration}>
                            {editingIntegrationId ? (
                              <InlineNotice>
                                Editando integração existente. Tipo e provedor ficam governados pelo
                                cadastro original; esta ação atualiza status, ambiente e nota segura.
                              </InlineNotice>
                            ) : null}
                            <Field label="Tipo">
                              <SelectInput
                                disabled={Boolean(editingIntegrationId)}
                                value={accountIntegrationForm.integrationType}
                                onChange={(event) =>
                                  setAccountIntegrationForm((current) => ({
                                    ...current,
                                    integrationType: event.target.value as CustomerIntegrationType,
                                  }))
                                }
                              >
                                {CUSTOMER_INTEGRATION_TYPES.map((value) => (
                                  <option key={value} value={value}>
                                    {labelForIntegrationType(value)}
                                  </option>
                                ))}
                              </SelectInput>
                            </Field>
                            <Field label="Provedor">
                              <TextInput
                                disabled={Boolean(editingIntegrationId)}
                                onChange={(event) =>
                                  setAccountIntegrationForm((current) => ({
                                    ...current,
                                    provider: event.target.value,
                                  }))
                                }
                                placeholder="Plataforma ou parceiro"
                                value={accountIntegrationForm.provider}
                              />
                            </Field>
                            <div className="grid grid-cols-2 gap-2">
                              <Field label="Status">
                                <SelectInput
                                  value={accountIntegrationForm.status}
                                  onChange={(event) =>
                                    setAccountIntegrationForm((current) => ({
                                      ...current,
                                      status: event.target.value as CustomerIntegrationStatus,
                                    }))
                                  }
                                >
                                  {CUSTOMER_INTEGRATION_STATUSES.map((value) => (
                                    <option key={value} value={value}>
                                      {labelForIntegrationStatus(value)}
                                    </option>
                                  ))}
                                </SelectInput>
                              </Field>
                              <Field label="Ambiente">
                                <SelectInput
                                  value={accountIntegrationForm.environment}
                                  onChange={(event) =>
                                    setAccountIntegrationForm((current) => ({
                                      ...current,
                                      environment: event.target.value as CustomerIntegrationEnvironment,
                                    }))
                                  }
                                >
                                  {CUSTOMER_INTEGRATION_ENVIRONMENTS.map((value) => (
                                    <option key={value} value={value}>
                                      {labelForIntegrationEnvironment(value)}
                                    </option>
                                  ))}
                                </SelectInput>
                              </Field>
                            </div>
                            <Field label="Nota segura">
                              <TextareaInput
                                onChange={(event) =>
                                  setAccountIntegrationForm((current) => ({
                                    ...current,
                                    notes: event.target.value,
                                  }))
                                }
                                rows={2}
                                value={accountIntegrationForm.notes}
                              />
                            </Field>
                            <div className="flex flex-wrap gap-2">
                              <AppButton
                                disabled={
                                  accountSubmittingKey === 'integration:add' ||
                                  accountSubmittingKey === `integration:${editingIntegrationId}:update`
                                }
                                type="submit"
                              >
                                {editingIntegrationId ? 'Salvar integração' : 'Adicionar integração'}
                              </AppButton>
                              {editingIntegrationId ? (
                                <GhostButton
                                  type="button"
                                  onClick={() => {
                                    setEditingIntegrationId(null);
                                    setAccountIntegrationForm(emptyAccountIntegrationForm());
                                  }}
                                >
                                  Cancelar edição
                                </GhostButton>
                              ) : null}
                            </div>
                          </form>
                          <div className="space-y-2">
                            {customerAccount.integrations.length === 0 ? (
                              <InlineNotice>Nenhuma integração operacional registrada.</InlineNotice>
                            ) : (
                              customerAccount.integrations.map((integration) => (
                                <div className="rounded-[16px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-strong)] p-3" key={integration.id}>
                                  <div className="flex items-start justify-between gap-3">
                                    <div>
                                      <p className="text-sm font-semibold text-[color:var(--color-ink)]">
                                        {integration.provider}
                                      </p>
                                      <p className="mt-1 text-[0.78rem] text-[color:var(--color-muted)]">
                                        {labelForIntegrationType(integration.integrationType)} · {labelForIntegrationStatus(integration.status)} · {labelForIntegrationEnvironment(integration.environment)}
                                      </p>
                                    </div>
                                    <div className="flex flex-wrap justify-end gap-2">
                                      <GhostButton
                                        className="min-h-8 px-3 text-xs"
                                        disabled={!integration.canUpdate}
                                        onClick={() => {
                                          setEditingIntegrationId(integration.id);
                                          setAccountIntegrationForm(buildAccountIntegrationForm(integration));
                                        }}
                                        type="button"
                                      >
                                        Editar
                                      </GhostButton>
                                      <GhostButton
                                        className="min-h-8 px-3 text-xs"
                                        disabled={!integration.canArchive || accountSubmittingKey === `integration:${integration.id}`}
                                        onClick={() =>
                                          void runAccountAction(`integration:${integration.id}`, async () => {
                                            await archiveCustomerAccountIntegration({
                                              p_integration_id: integration.id,
                                            });
                                          })
                                        }
                                        type="button"
                                      >
                                        Arquivar
                                      </GhostButton>
                                    </div>
                                  </div>
                                </div>
                              ))
                            )}
                          </div>
                        </section>

                        <section className="space-y-2 rounded-[20px] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-3.5">
                          <p className="text-[0.92rem] font-semibold text-[color:var(--color-ink)]">
                            Customizações e alertas
                          </p>
                          <form className="grid gap-2" onSubmit={handleSaveAccountCustomization}>
                            {editingCustomizationId ? (
                              <InlineNotice>
                                Editando customização existente por ação administrativa auditada.
                              </InlineNotice>
                            ) : null}
                            <Field label="Customização">
                              <TextInput
                                onChange={(event) =>
                                  setAccountCustomizationForm((current) => ({
                                    ...current,
                                    title: event.target.value,
                                  }))
                                }
                                placeholder="Exceção operacional"
                                value={accountCustomizationForm.title}
                              />
                            </Field>
                            <Field label="Descrição">
                              <TextareaInput
                                onChange={(event) =>
                                  setAccountCustomizationForm((current) => ({
                                    ...current,
                                    description: event.target.value,
                                  }))
                                }
                                rows={2}
                                value={accountCustomizationForm.description}
                              />
                            </Field>
                            <Field label="Risco">
                              <SelectInput
                                value={accountCustomizationForm.riskLevel}
                                onChange={(event) =>
                                  setAccountCustomizationForm((current) => ({
                                    ...current,
                                    riskLevel: event.target.value as CustomerCustomizationRiskLevel,
                                  }))
                                }
                              >
                                {CUSTOMER_CUSTOMIZATION_RISK_LEVELS.map((value) => (
                                  <option key={value} value={value}>
                                    {labelForRiskLevel(value)}
                                  </option>
                                ))}
                              </SelectInput>
                            </Field>
                            <div className="flex flex-wrap gap-2">
                              <AppButton
                                disabled={
                                  accountSubmittingKey === 'customization:add' ||
                                  accountSubmittingKey === `customization:${editingCustomizationId}:update`
                                }
                                type="submit"
                              >
                                {editingCustomizationId ? 'Salvar customização' : 'Adicionar customização'}
                              </AppButton>
                              {editingCustomizationId ? (
                                <GhostButton
                                  type="button"
                                  onClick={() => {
                                    setEditingCustomizationId(null);
                                    setAccountCustomizationForm(emptyAccountCustomizationForm());
                                  }}
                                >
                                  Cancelar edição
                                </GhostButton>
                              ) : null}
                            </div>
                          </form>
                          <div className="space-y-2">
                            {customerAccount.customizations.map((customization) => (
                              <div className="rounded-[16px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-strong)] p-3" key={customization.id}>
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <p className="text-sm font-semibold text-[color:var(--color-ink)]">{customization.title}</p>
                                    <p className="mt-1 text-[0.78rem] text-[color:var(--color-muted)]">{labelForRiskLevel(customization.riskLevel)} · {customization.status}</p>
                                  </div>
                                  <div className="flex flex-wrap justify-end gap-2">
                                    <GhostButton
                                      className="min-h-8 px-3 text-xs"
                                      disabled={!customization.canUpdate}
                                      onClick={() => {
                                        setEditingCustomizationId(customization.id);
                                        setAccountCustomizationForm(
                                          buildAccountCustomizationForm(customization),
                                        );
                                      }}
                                      type="button"
                                    >
                                      Editar
                                    </GhostButton>
                                    <GhostButton
                                      className="min-h-8 px-3 text-xs"
                                      disabled={!customization.canArchive || accountSubmittingKey === `customization:${customization.id}`}
                                      onClick={() =>
                                        void runAccountAction(`customization:${customization.id}`, async () => {
                                          await archiveCustomerAccountCustomization({
                                            p_customization_id: customization.id,
                                          });
                                        })
                                      }
                                      type="button"
                                    >
                                      Arquivar
                                    </GhostButton>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>

                          <form className="grid gap-2 border-t border-[color:var(--color-border)] pt-3" onSubmit={handleSaveAccountAlert}>
                            {editingAlertId ? (
                              <InlineNotice>
                                Editando alerta existente. O alerta permanece ativo após salvar; use
                                arquivar para encerrar o aviso.
                              </InlineNotice>
                            ) : null}
                            <Field label="Alerta interno">
                              <TextInput
                                onChange={(event) =>
                                  setAccountAlertForm((current) => ({
                                    ...current,
                                    title: event.target.value,
                                  }))
                                }
                                placeholder="Aviso para suporte/CS"
                                value={accountAlertForm.title}
                              />
                            </Field>
                            <Field label="Descrição">
                              <TextareaInput
                                onChange={(event) =>
                                  setAccountAlertForm((current) => ({
                                    ...current,
                                    description: event.target.value,
                                  }))
                                }
                                rows={2}
                                value={accountAlertForm.description}
                              />
                            </Field>
                            <Field label="Severidade">
                              <SelectInput
                                value={accountAlertForm.severity}
                                onChange={(event) =>
                                  setAccountAlertForm((current) => ({
                                    ...current,
                                    severity: event.target.value as CustomerAlertSeverity,
                                  }))
                                }
                              >
                                {CUSTOMER_ALERT_SEVERITIES.map((value) => (
                                  <option key={value} value={value}>
                                    {labelForAlertSeverity(value)}
                                  </option>
                                ))}
                              </SelectInput>
                            </Field>
                            <div className="flex flex-wrap gap-2">
                              <AppButton
                                disabled={
                                  accountSubmittingKey === 'alert:add' ||
                                  accountSubmittingKey === `alert:${editingAlertId}:update`
                                }
                                type="submit"
                              >
                                {editingAlertId ? 'Salvar alerta' : 'Adicionar alerta'}
                              </AppButton>
                              {editingAlertId ? (
                                <GhostButton
                                  type="button"
                                  onClick={() => {
                                    setEditingAlertId(null);
                                    setAccountAlertForm(emptyAccountAlertForm());
                                  }}
                                >
                                  Cancelar edição
                                </GhostButton>
                              ) : null}
                            </div>
                          </form>
                          <div className="space-y-2">
                            {customerAccount.alerts.map((alert) => (
                              <div className="rounded-[16px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-strong)] p-3" key={alert.id}>
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <p className="text-sm font-semibold text-[color:var(--color-ink)]">{alert.title}</p>
                                    <p className="mt-1 text-[0.78rem] text-[color:var(--color-muted)]">{labelForAlertSeverity(alert.severity)} · {alert.active ? 'Ativo' : 'Arquivado'}</p>
                                  </div>
                                  <div className="flex flex-wrap justify-end gap-2">
                                    <GhostButton
                                      className="min-h-8 px-3 text-xs"
                                      disabled={!alert.canUpdate}
                                      onClick={() => {
                                        setEditingAlertId(alert.id);
                                        setAccountAlertForm(buildAccountAlertForm(alert));
                                      }}
                                      type="button"
                                    >
                                      Editar
                                    </GhostButton>
                                    <GhostButton
                                      className="min-h-8 px-3 text-xs"
                                      disabled={!alert.canArchive || accountSubmittingKey === `alert:${alert.id}`}
                                      onClick={() =>
                                        void runAccountAction(`alert:${alert.id}`, async () => {
                                          await archiveCustomerAccountAlert({ p_alert_id: alert.id });
                                        })
                                      }
                                      type="button"
                                    >
                                      Arquivar
                                    </GhostButton>
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </section>

                        <section className="space-y-2 rounded-[20px] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-3.5">
                          <p className="text-[0.92rem] font-semibold text-[color:var(--color-ink)]">
                            Recursos e módulos
                          </p>
                          <form className="grid gap-2" onSubmit={handleSetAccountFeature}>
                            <Field label="Chave do recurso">
                              <TextInput
                                onChange={(event) =>
                                  setAccountFeatureForm((current) => ({
                                    ...current,
                                    featureKey: event.target.value,
                                  }))
                                }
                                placeholder="returns_portal"
                                value={accountFeatureForm.featureKey}
                              />
                            </Field>
                            <label className="flex items-center gap-2 text-[0.82rem] text-[color:var(--color-ink)]">
                              <input
                                checked={accountFeatureForm.enabled}
                                onChange={(event) =>
                                  setAccountFeatureForm((current) => ({
                                    ...current,
                                    enabled: event.target.checked,
                                  }))
                                }
                                type="checkbox"
                              />
                              Habilitada
                            </label>
                            <AppButton disabled={accountSubmittingKey === 'feature:set'} type="submit">
                              Atualizar recurso
                            </AppButton>
                          </form>
                          <div className="flex flex-wrap gap-2">
                            {customerAccount.features.length === 0 ? (
                              <InlineNotice>Nenhum recurso registrado.</InlineNotice>
                            ) : (
                              customerAccount.features.map((feature) => (
                                <StatusPill key={feature.id} tone={feature.enabled ? 'positive' : 'default'}>
                                  {feature.featureKey}: {feature.enabled ? 'ativo' : 'inativo'}
                                </StatusPill>
                              ))
                            )}
                          </div>
                        </section>
                      </div>
                    ) : null}

                    {activeTab === 'subscriptions' ? (
                      <div className="space-y-3">
                        <div className="rounded-[18px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-strong)] p-3">
                          <div className="flex flex-wrap items-start justify-between gap-3">
                            <div className="min-w-0">
                              <p className="text-[0.92rem] font-semibold text-[color:var(--color-ink)]">
                                Operação de assinaturas
                              </p>
                              <p className="mt-1 text-[0.78rem] leading-5 text-[color:var(--color-muted)]">
                                Criação, ajuste e arquivamento seguem os acessos administrativos da plataforma.
                              </p>
                            </div>
                            <div className="flex flex-wrap gap-2">
                              <GhostButton
                                disabled={activeCommercialProducts.length === 0 || subscriptionSubmitting}
                                onClick={openCreateSubscription}
                                type="button"
                              >
                                Nova assinatura
                              </GhostButton>
                              <GhostButton
                                disabled={!customerProductSubscriptionDetail || subscriptionSubmitting}
                                onClick={openUpdateSubscription}
                                type="button"
                              >
                                Editar selecionada
                              </GhostButton>
                              <GhostButton
                                disabled={!customerProductSubscriptionDetail || subscriptionSubmitting}
                                onClick={() => void handleArchiveSubscription()}
                                type="button"
                              >
                                Arquivar
                              </GhostButton>
                            </div>
                          </div>
                          {subscriptionActionMessage ? (
                            <div className="mt-3">
                              <InlineNotice>{subscriptionActionMessage}</InlineNotice>
                            </div>
                          ) : null}
                        </div>

                        {subscriptionsPhase === 'loading' ? (
                          <LoadingState
                            description="Carregando produtos, planos, recursos e responsáveis comerciais."
                            title="Carregando assinaturas"
                          />
                        ) : subscriptionsPhase === 'contract-unavailable' ? (
                          <ContractUnavailableState resourceName="as assinaturas comerciais" />
                        ) : subscriptionsPhase === 'error' ? (
                          <ErrorState
                            description={
                              subscriptionsMessage ??
                              'O contexto comercial da conta B2B não ficou disponível.'
                            }
                          />
                        ) : customerProductSubscriptions.length === 0 ? (
                          <EmptyState
                            description="Nenhuma assinatura comercial foi registrada para este cliente."
                            title="Sem assinaturas comerciais"
                          />
                        ) : (
                          <>
                            <div className="grid gap-2 md:grid-cols-3">
                              <TenantMetricTile
                                helper="vínculos cliente-produto"
                                label="Assinaturas"
                                value={String(customerProductSubscriptions.length)}
                              />
                              <TenantMetricTile
                                helper="recursos ativos"
                                label="Recursos"
                                value={String(
                                  customerProductSubscriptionDetail?.entitlements.length ?? 0,
                                )}
                              />
                              <TenantMetricTile
                                helper="responsáveis ativos"
                                label="Responsáveis"
                                value={String(customerProductSubscriptionDetail?.owners.length ?? 0)}
                              />
                            </div>

                            <div className="grid gap-3 2xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
                              <section className="space-y-2 rounded-[20px] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-3.5">
                                <div>
                                  <p className="text-[0.92rem] font-semibold text-[color:var(--color-ink)]">
                                    Produtos contratados
                                  </p>
                                  <p className="mt-1 text-[0.78rem] leading-5 text-[color:var(--color-muted)]">
                                    Leitura administrativa do vínculo cliente-produto-plano.
                                  </p>
                                </div>

                                <div className="space-y-2">
                                  {customerProductSubscriptions.map((subscription) => {
                                    const selected =
                                      subscription.subscriptionId === selectedSubscriptionId;

                                    return (
                                      <button
                                        className={cx(
                                          'w-full rounded-[16px] border bg-[color:var(--color-surface-strong)] p-3 text-left transition',
                                          selected
                                            ? 'border-[color:var(--color-brand-blue)] shadow-[0_12px_28px_rgba(48,127,226,0.12)]'
                                            : 'border-[color:var(--color-border)] hover:border-[color:var(--color-brand-blue)]/40',
                                        )}
                                        key={subscription.subscriptionId}
                                        onClick={() =>
                                          void loadCustomerProductSubscriptionDetail(
                                            subscription.subscriptionId,
                                          )
                                        }
                                        type="button"
                                      >
                                        <div className="flex flex-wrap items-center gap-2">
                                          <StatusPill tone={toneForSubscriptionStatus(subscription.status)}>
                                            {labelForSubscriptionStatus(subscription.status)}
                                          </StatusPill>
                                        </div>
                                        <p className="mt-2 text-sm font-semibold text-[color:var(--color-ink)]">
                                          {subscription.productDisplayName}
                                        </p>
                                        <p className="mt-1 text-[0.82rem] leading-5 text-[color:var(--color-muted)]">
                                          Plano {subscription.planDisplayName} · Renovação{' '}
                                          {formatNullableDateTime(subscription.renewalAt)}
                                        </p>
                                      </button>
                                    );
                                  })}
                                </div>
                              </section>

                              <section className="space-y-3 rounded-[20px] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-3.5">
                                {!customerProductSubscriptionDetail ? (
                                  <EmptyState
                                    description="Selecione uma assinatura para abrir produto, plano, recursos e responsáveis."
                                    title="Detalhe indisponível"
                                  />
                                ) : (
                                  <>
                                    <div className="rounded-[16px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-strong)] p-3">
                                      <div className="flex flex-wrap items-center gap-2">
                                        <StatusPill
                                          tone={toneForSubscriptionStatus(
                                            customerProductSubscriptionDetail.status,
                                          )}
                                        >
                                          {labelForSubscriptionStatus(
                                            customerProductSubscriptionDetail.status,
                                          )}
                                        </StatusPill>
                                        <StatusPill>
                                          Origem{' '}
                                          {displayOptionalText(
                                            customerProductSubscriptionDetail.source,
                                          )}
                                        </StatusPill>
                                      </div>
                                      <p className="mt-2 text-[0.98rem] font-semibold text-[color:var(--color-ink)]">
                                        {customerProductSubscriptionDetail.productDisplayName}
                                      </p>
                                      <p className="mt-1 text-[0.84rem] leading-5 text-[color:var(--color-muted)]">
                                        Plano {customerProductSubscriptionDetail.planDisplayName} ·
                                        Referência comercial{' '}
                                        {displayOptionalText(
                                          customerProductSubscriptionDetail.contractReference,
                                        )}
                                      </p>

                                      <div className="mt-3 grid gap-2 sm:grid-cols-2">
                                        <TenantRailInfoRow
                                          label="Início"
                                          value={formatNullableDateTime(
                                            customerProductSubscriptionDetail.startedAt,
                                          )}
                                        />
                                        <TenantRailInfoRow
                                          label="Renovação"
                                          value={formatNullableDateTime(
                                            customerProductSubscriptionDetail.renewalAt,
                                          )}
                                        />
                                        <TenantRailInfoRow
                                          label="Fim"
                                          value={formatNullableDateTime(
                                            customerProductSubscriptionDetail.endedAt,
                                          )}
                                        />
                                        <TenantRailInfoRow
                                          label="Atualizado"
                                          value={formatNullableDateTime(
                                            customerProductSubscriptionDetail.updatedAt,
                                          )}
                                        />
                                      </div>
                                    </div>

                                    <section className="space-y-2">
                                      <div className="flex flex-wrap items-center justify-between gap-2">
                                        <p className="text-[0.92rem] font-semibold text-[color:var(--color-ink)]">
                                          Recursos comerciais habilitados
                                        </p>
                                        <StatusPill>
                                          {customerProductSubscriptionDetail.entitlements.length}
                                        </StatusPill>
                                      </div>
                                      {customerProductSubscriptionDetail.entitlements.length === 0 ? (
                                        <InlineNotice>
                                          Nenhum recurso comercial ficou disponível para esta assinatura.
                                        </InlineNotice>
                                      ) : (
                                        <div className="space-y-2">
                                          {customerProductSubscriptionDetail.entitlements.map(
                                            (entitlement) => (
                                              <div
                                                className="rounded-[16px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-strong)] p-3"
                                                key={entitlement.entitlementId}
                                              >
                                                <div className="flex flex-wrap items-center gap-2">
                                                  <span className="text-sm font-semibold text-[color:var(--color-ink)]">
                                                    {entitlement.displayName}
                                                  </span>
                                                  <StatusPill
                                                    tone={toneForEntitlementStatus(
                                                      entitlement.status,
                                                    )}
                                                  >
                                                    {labelForEntitlementStatus(entitlement.status)}
                                                  </StatusPill>
                                                  <StatusPill>
                                                    {labelForEntitlementSource(
                                                      entitlement.entitlementSource,
                                                    )}
                                                  </StatusPill>
                                                </div>
                                                <p className="mt-1 text-[0.78rem] leading-5 text-[color:var(--color-muted)]">
                                                  {displayOptionalText(entitlement.reason)} · Vigência{' '}
                                                  {formatNullableDateTime(entitlement.startsAt)} até{' '}
                                                  {formatNullableDateTime(entitlement.endsAt)}
                                                </p>
                                              </div>
                                            ),
                                          )}
                                        </div>
                                      )}
                                    </section>

                                    <section className="space-y-2">
                                      <div className="flex flex-wrap items-center justify-between gap-2">
                                        <p className="text-[0.92rem] font-semibold text-[color:var(--color-ink)]">
                                          Responsáveis internos
                                        </p>
                                        <StatusPill>
                                          {customerProductSubscriptionDetail.owners.length}
                                        </StatusPill>
                                      </div>
                                      {customerProductSubscriptionDetail.owners.length === 0 ? (
                                        <InlineNotice>
                                          Nenhum responsável interno ficou disponível para esta assinatura.
                                        </InlineNotice>
                                      ) : (
                                        <div className="space-y-2">
                                          {customerProductSubscriptionDetail.owners.map((owner) => (
                                            <div
                                              className="rounded-[16px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-strong)] p-3"
                                              key={owner.ownerId}
                                            >
                                              <div className="flex flex-wrap items-center gap-2">
                                                <span className="text-sm font-semibold text-[color:var(--color-ink)]">
                                                  {displayOptionalText(owner.ownerFullName)}
                                                </span>
                                                <StatusPill>
                                                  {labelForOwnerRole(owner.ownerRole)}
                                                </StatusPill>
                                                <StatusPill tone={toneForOwnerStatus(owner.status)}>
                                                  {labelForOwnerStatus(owner.status)}
                                                </StatusPill>
                                              </div>
                                              <p className="mt-1 text-[0.78rem] leading-5 text-[color:var(--color-muted)]">
                                                {displayOptionalText(owner.ownerEmail)} · Área{' '}
                                                {displayOptionalText(owner.areaDisplayName)}
                                              </p>
                                            </div>
                                          ))}
                                        </div>
                                      )}
                                    </section>
                                  </>
                                )}
                              </section>
                            </div>
                          </>
                        )}
                      </div>
                    ) : null}

                    {activeTab === 'members' ? (
                      <div className="space-y-3">
                        {selectedTenantMemberships.length === 0 ? (
                          <EmptyState
                            description="Nenhum vínculo foi registrado para este cliente."
                            title="Sem vínculos"
                          />
                        ) : (
                          selectedTenantMemberships.map((membership) => (
                            <div
                              className="rounded-[18px] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-4 py-3"
                              key={membership.id}
                            >
                              <div className="flex flex-wrap items-center gap-2">
                                <span className="text-[0.92rem] font-semibold text-[color:var(--color-ink)]">
                                  {sanitizeOperationalVisibleText(membership.user_full_name, 'Usuario sem nome')}
                                </span>
                                <StatusPill>
                                  {membership.role.replace('tenant_', '').replace('_', ' ')}
                                </StatusPill>
                                <StatusPill
                                  tone={
                                    membership.status === 'active'
                                      ? 'positive'
                                      : membership.status === 'invited'
                                        ? 'warning'
                                        : 'critical'
                                  }
                                >
                                  {membership.status === 'active'
                                    ? 'Ativo'
                                    : membership.status === 'invited'
                                      ? 'Convidado'
                                      : 'Revogado'}
                                </StatusPill>
                              </div>
                              <p className="mt-1 text-[0.88rem] text-[color:var(--color-muted)]">
                                {membership.user_email ?? 'Sem email'} · Atualizado em{' '}
                                {formatDateTime(membership.updated_at)}
                              </p>
                            </div>
                          ))
                        )}
                      </div>
                    ) : null}

                    {activeTab === 'status' ? (
                      <div className="space-y-4">
                        <div className="rounded-[20px] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-4">
                          <p className="mb-3 text-sm font-semibold text-[color:var(--color-ink)]">
                            Ajustar status operacional
                          </p>
                          <p className="text-sm leading-6 text-[color:var(--color-muted)]">
                            Alterações de status usam painel dedicado para evitar compressão no rail.
                          </p>
                          <GhostButton
                            className="mt-3 min-h-10 w-full justify-center"
                            onClick={() => setShowStatusManager(true)}
                            type="button"
                          >
                            Alterar status
                          </GhostButton>

                          {statusMessage ? (
                            <div className="mt-3">
                              <InlineNotice
                                tone={statusMessage.includes('sucesso') ? 'positive' : 'critical'}
                              >
                                {statusMessage}
                              </InlineNotice>
                            </div>
                          ) : null}
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <TenantMetricTile
                            helper="com vínculo ativo"
                            label="Membros"
                            value={String(tenantDetail.active_membership_count)}
                          />
                          <TenantMetricTile
                            helper="contatos em operação"
                            label="Contatos"
                            value={String(tenantDetail.active_contact_count)}
                          />
                        </div>
                      </div>
                    ) : null}

                    {activeTab === 'activity' ? (
                      <div className="space-y-3">
                        {selectedTenantActivity.length === 0 ? (
                          <EmptyState
                            description="Ainda não existem eventos administrativos vinculados a este cliente."
                            title="Sem atividade recente"
                          />
                        ) : (
                          selectedTenantActivity.map((entry) => (
                            <div
                              className="rounded-[18px] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-4 py-3"
                              key={entry.id}
                            >
                              <div className="flex flex-wrap items-center gap-2">
                                <StatusPill tone={classifyActivityTone(entry)}>
                                  {activityLabel(entry)}
                                </StatusPill>
                                <span className="text-xs uppercase tracking-[0.16em] text-[color:var(--color-muted)]">
                                  {entry.entity_table}
                                </span>
                              </div>
                              <p className="mt-2 text-[0.92rem] font-medium text-[color:var(--color-ink)]">
                                {activityDescription(entry)}
                              </p>
                              <p className="mt-1 text-[0.88rem] text-[color:var(--color-muted)]">
                                {formatDateTime(entry.occurred_at)}
                              </p>
                            </div>
                          ))
                        )}
                      </div>
                    ) : null}
                  </div>
                </section>
              </div>
            )}
          </div>
        </aside>
      </div>

      {subscriptionActionMode ? (
        <GovernedActionDrawer
          description={
            subscriptionActionMode === 'create'
              ? 'Crie um vínculo cliente-produto-plano usando o catálogo comercial disponível.'
              : 'Atualize status, plano e campos operacionais da assinatura selecionada.'
          }
          footer={
            <>
              <GhostButton
                disabled={subscriptionSubmitting}
                onClick={() => {
                  setSubscriptionActionMode(null);
                  setSubscriptionForm(emptySubscriptionForm());
                }}
                type="button"
              >
                Cancelar
              </GhostButton>
              <AppButton
                disabled={
                  subscriptionSubmitting ||
                  !subscriptionForm.productId ||
                  !subscriptionForm.planId ||
                  subscriptionPlanOptions.length === 0
                }
                form="admin-subscription-form"
                type="submit"
              >
                {subscriptionSubmitting ? 'Salvando...' : 'Salvar assinatura'}
              </AppButton>
            </>
          }
          onClose={() => setSubscriptionActionMode(null)}
          title={
            subscriptionActionMode === 'create'
              ? 'Nova assinatura comercial'
              : 'Editar assinatura comercial'
          }
        >
          <form className="grid gap-4" id="admin-subscription-form" onSubmit={handleSaveSubscription}>
            {subscriptionActionMessage ? (
              <InlineNotice>{subscriptionActionMessage}</InlineNotice>
            ) : null}

            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Produto">
                <SelectInput
                  disabled={subscriptionActionMode === 'update'}
                  onChange={(event) => {
                    const productId = event.target.value;
                    const productDetail =
                      commercialProductDetails.find((product) => product.productId === productId) ??
                      null;
                    const firstPlan =
                      productDetail?.plans.find((plan) => plan.status === 'active') ??
                      productDetail?.plans[0] ??
                      null;

                    setSubscriptionForm((current) => ({
                      ...current,
                      productId,
                      planId: firstPlan?.planId ?? '',
                    }));
                  }}
                  value={subscriptionForm.productId}
                >
                  <option value="">Selecione um produto</option>
                  {activeCommercialProducts.map((product) => (
                    <option key={product.productId} value={product.productId}>
                      {product.displayName}
                    </option>
                  ))}
                </SelectInput>
              </Field>

              <Field label="Plano">
                <SelectInput
                  onChange={(event) =>
                    setSubscriptionForm((current) => ({
                      ...current,
                      planId: event.target.value,
                    }))
                  }
                  value={subscriptionForm.planId}
                >
                  <option value="">Selecione um plano</option>
                  {subscriptionPlanOptions.map((plan) => (
                    <option key={plan.planId} value={plan.planId}>
                      {plan.displayName}
                    </option>
                  ))}
                </SelectInput>
              </Field>
            </div>

            <div className="grid gap-3 md:grid-cols-2">
              <Field label="Status">
                <SelectInput
                  onChange={(event) =>
                    setSubscriptionForm((current) => ({
                      ...current,
                      status: event.target.value as SubscriptionFormState['status'],
                    }))
                  }
                  value={subscriptionForm.status}
                >
                  {SUBSCRIPTION_MUTABLE_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {labelForSubscriptionStatus(status)}
                    </option>
                  ))}
                </SelectInput>
              </Field>

              <Field label="Referência comercial">
                <TextInput
                  maxLength={120}
                  onChange={(event) =>
                    setSubscriptionForm((current) => ({
                      ...current,
                      contractReference: event.target.value,
                    }))
                  }
                  placeholder="Referência operacional ou comercial"
                  value={subscriptionForm.contractReference}
                />
              </Field>
            </div>

            <div className="grid gap-3 md:grid-cols-3">
              <Field label="Início">
                <TextInput
                  onChange={(event) =>
                    setSubscriptionForm((current) => ({
                      ...current,
                      startedAt: event.target.value,
                    }))
                  }
                  type="datetime-local"
                  value={subscriptionForm.startedAt}
                />
              </Field>

              <Field label="Renovação">
                <TextInput
                  onChange={(event) =>
                    setSubscriptionForm((current) => ({
                      ...current,
                      renewalAt: event.target.value,
                    }))
                  }
                  type="datetime-local"
                  value={subscriptionForm.renewalAt}
                />
              </Field>

              <Field label="Fim">
                <TextInput
                  disabled={subscriptionActionMode === 'create'}
                  onChange={(event) =>
                    setSubscriptionForm((current) => ({
                      ...current,
                      endedAt: event.target.value,
                    }))
                  }
                  type="datetime-local"
                  value={subscriptionForm.endedAt}
                />
              </Field>
            </div>

            <Field label="Notas internas">
              <TextareaInput
                maxLength={1000}
                onChange={(event) =>
                  setSubscriptionForm((current) => ({
                    ...current,
                    notesInternal: event.target.value,
                  }))
                }
                placeholder="Contexto operacional interno, sem segredo, token ou dado financeiro."
                value={subscriptionForm.notesInternal}
              />
            </Field>

            <InlineNotice>
              Cobrança, preço, nota fiscal e financeiro continuam fora deste corte. Recursos e responsáveis
              permanecem em leitura até o próximo lote de edição dedicada.
            </InlineNotice>
          </form>
        </GovernedActionDrawer>
      ) : null}

      {showCreateTenant ? (
        <GovernedActionDrawer
          description="Abra uma nova conta operacional com identificação, razão social e região de dados."
          footer={
            <>
              <GhostButton
                disabled={tenantFormSubmitting}
                onClick={() => {
                  setTenantForm(emptyTenantForm());
                  setTenantFormMessage(null);
                }}
                type="button"
              >
                Limpar
              </GhostButton>
              <AppButton
                disabled={tenantFormSubmitting}
                form="admin-tenant-create-form"
                type="submit"
              >
                {tenantFormSubmitting ? 'Criando...' : 'Criar cliente'}
              </AppButton>
            </>
          }
          onClose={() => setShowCreateTenant(false)}
          title="Novo cliente"
        >
          <form className="grid gap-4 md:grid-cols-2" id="admin-tenant-create-form" onSubmit={handleCreateTenant}>
            <Field label="Identificador público">
              <TextInput
                onChange={(event) =>
                  setTenantForm((current) => ({
                    ...current,
                    slug: event.target.value.toLowerCase(),
                  }))
                }
                placeholder="grupo-reserva"
                required
                value={tenantForm.slug}
              />
            </Field>

            <Field label="Região de dados">
              <TextInput
                onChange={(event) =>
                  setTenantForm((current) => ({
                    ...current,
                    dataRegion: event.target.value,
                  }))
                }
                placeholder="sa-east-1"
                required
                value={tenantForm.dataRegion}
              />
            </Field>

            <Field label="Razão social">
              <TextInput
                onChange={(event) =>
                  setTenantForm((current) => ({
                    ...current,
                    legalName: event.target.value,
                  }))
                }
                placeholder="Reserva Mini S.A."
                required
                value={tenantForm.legalName}
              />
            </Field>

            <Field label="Nome operacional">
              <TextInput
                onChange={(event) =>
                  setTenantForm((current) => ({
                    ...current,
                    displayName: event.target.value,
                  }))
                }
                placeholder="Reserva"
                required
                value={tenantForm.displayName}
              />
            </Field>

            <div className="md:col-span-2">
              {tenantFormMessage ? (
                <InlineNotice tone="critical">{tenantFormMessage}</InlineNotice>
              ) : null}
            </div>

          </form>
        </GovernedActionDrawer>
      ) : null}

      {showContactManager && tenantDetail ? (
        <TenantModal
          description="Revise e atualize os pontos de contato oficiais deste cliente sem reduzir a área útil do cockpit."
          onClose={() => setShowContactManager(false)}
          title="Contatos vinculados"
        >
          <div className="grid gap-5 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
            <div className="space-y-3">
              {tenantDetail.contacts.length === 0 ? (
                <InlineNotice>Nenhum contato oficial vinculado.</InlineNotice>
              ) : (
                tenantDetail.contacts.map((contact) => (
                  <button
                    className={cx(
                      'w-full rounded-[18px] border px-4 py-3 text-left transition',
                      editingContactId === contact.id
                        ? 'border-[rgba(48,127,226,0.3)] bg-[rgba(48,127,226,0.08)]'
                        : 'border-[color:var(--color-border)] bg-[color:var(--color-surface)] hover:border-[rgba(48,127,226,0.26)]',
                    )}
                    key={contact.id}
                    onClick={() => {
                      setEditingContactId(contact.id);
                      setContactForm(buildContactForm(contact));
                      setContactMessage(null);
                    }}
                    type="button"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium text-[color:var(--color-ink)]">
                        {sanitizeOperationalVisibleText(contact.full_name)}
                      </span>
                      {contact.is_primary ? <StatusPill tone="accent">Principal</StatusPill> : null}
                      <StatusPill tone={contact.is_active ? 'positive' : 'critical'}>
                        {contact.is_active ? 'Ativo' : 'Inativo'}
                      </StatusPill>
                    </div>
                    <p className="mt-1 text-sm text-[color:var(--color-muted)]">
                      {contact.email ?? 'Sem email'} · {contact.phone ?? 'Sem telefone'}
                    </p>
                    {contact.job_title ? (
                      <p className="mt-1 text-[0.88rem] text-[color:var(--color-muted)]">
                        {contact.job_title}
                      </p>
                    ) : null}
                  </button>
                ))
              )}
            </div>

            <form className="space-y-3" onSubmit={handleSaveContact}>
              <div className="flex items-center justify-between gap-3">
                <h3 className="text-base font-semibold text-[color:var(--color-ink)]">
                  {editingContactId ? 'Atualizar contato' : 'Novo contato'}
                </h3>
                <GhostButton
                  className="min-h-9 px-3 text-xs"
                  onClick={() => {
                    setEditingContactId(null);
                    setContactForm(emptyContactForm());
                    setContactMessage(null);
                  }}
                  type="button"
                >
                  Limpar seleção
                </GhostButton>
              </div>

              <Field label="Nome completo">
                <TextInput
                  onChange={(event) =>
                    setContactForm((current) => ({
                      ...current,
                      fullName: event.target.value,
                    }))
                  }
                  required
                  value={contactForm.fullName}
                />
              </Field>

              <Field label="Email">
                <TextInput
                  onChange={(event) =>
                    setContactForm((current) => ({
                      ...current,
                      email: event.target.value,
                    }))
                  }
                  placeholder="contato@cliente.com"
                  type="email"
                  value={contactForm.email}
                />
              </Field>

              <Field label="Telefone">
                <TextInput
                  onChange={(event) =>
                    setContactForm((current) => ({
                      ...current,
                      phone: event.target.value,
                    }))
                  }
                  placeholder="+55 11 99999-9999"
                  value={contactForm.phone}
                />
              </Field>

              <Field label="Cargo">
                <TextInput
                  onChange={(event) =>
                    setContactForm((current) => ({
                      ...current,
                      jobTitle: event.target.value,
                    }))
                  }
                  placeholder="Operações"
                  value={contactForm.jobTitle}
                />
              </Field>

              <Field label="Vínculo interno">
                <TextInput
                  onChange={(event) =>
                    setContactForm((current) => ({
                      ...current,
                      linkedUserId: event.target.value,
                    }))
                  }
                  placeholder="UUID do perfil, se existir"
                  value={contactForm.linkedUserId}
                />
              </Field>

              <div className="grid gap-2 text-sm text-[color:var(--color-ink)]">
                <label className="flex items-center gap-3">
                  <input
                    checked={contactForm.isPrimary}
                    className="h-4 w-4 rounded border-[color:var(--color-border)] text-[color:var(--color-brand-blue)]"
                    onChange={(event) =>
                      setContactForm((current) => ({
                        ...current,
                        isPrimary: event.target.checked,
                      }))
                    }
                    type="checkbox"
                  />
                  Contato principal
                </label>
                <label className="flex items-center gap-3">
                  <input
                    checked={contactForm.isActive}
                    className="h-4 w-4 rounded border-[color:var(--color-border)] text-[color:var(--color-brand-blue)]"
                    onChange={(event) =>
                      setContactForm((current) => ({
                        ...current,
                        isActive: event.target.checked,
                      }))
                    }
                    type="checkbox"
                  />
                  Contato ativo
                </label>
              </div>

              {contactMessage ? (
                <InlineNotice
                  tone={contactMessage.includes('sucesso') ? 'positive' : 'critical'}
                >
                  {contactMessage}
                </InlineNotice>
              ) : null}

              <div className="flex flex-wrap gap-3">
                <AppButton disabled={contactSubmitting} type="submit">
                  {contactSubmitting ? 'Salvando...' : 'Salvar contato'}
                </AppButton>
                <GhostButton onClick={() => setShowContactManager(false)} type="button">
                  Concluir
                </GhostButton>
              </div>
            </form>
          </div>
        </TenantModal>
      ) : null}

      {showStatusManager && tenantDetail ? (
        <GovernedActionDrawer
          description="Atualize a situação operacional do cliente selecionado com validação administrativa."
          footer={
            <>
              <GhostButton onClick={() => setShowStatusManager(false)} type="button">
                Cancelar
              </GhostButton>
              <AppButton
                disabled={statusSubmitting}
                form="admin-tenant-status-form"
                type="submit"
              >
                {statusSubmitting ? 'Salvando...' : 'Salvar status'}
              </AppButton>
            </>
          }
          onClose={() => setShowStatusManager(false)}
          title="Alterar status do cliente"
        >
          <form className="space-y-6" id="admin-tenant-status-form" onSubmit={handleUpdateStatus}>
            <section className="rounded-[22px] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-5">
              <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_180px_180px] md:items-center">
                <div className="min-w-0">
                  <p className="truncate text-lg font-semibold tracking-[-0.035em] text-[color:var(--color-ink)]">
                    {sanitizeOperationalVisibleText(tenantDetail.display_name)}
                  </p>
                  <p className="truncate text-sm text-[color:var(--color-muted)]">
                    {sanitizeOperationalVisibleText(tenantDetail.legal_name)}
                  </p>
                </div>
                <TenantMetricTile
                  helper="com vínculo ativo"
                  label="Membros"
                  value={String(tenantDetail.active_membership_count)}
                />
                <TenantMetricTile
                  helper="contatos ativos"
                  label="Contatos"
                  value={String(tenantDetail.active_contact_count)}
                />
              </div>
            </section>

            <section className="rounded-[22px] border border-[color:var(--color-border)] bg-[color:var(--color-surface-strong)] p-5">
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Status atual">
                  <SelectInput
                    onChange={(event) => setStatusDraft(event.target.value as TenantStatus)}
                    value={statusDraft}
                  >
                    {TENANT_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {labelForTenantStatus(status)}
                      </option>
                    ))}
                  </SelectInput>
                </Field>
                <div className="rounded-[18px] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-4 py-3 text-sm leading-6 text-[color:var(--color-muted)]">
                  A mudança afeta apenas o status operacional permitido para este cliente.
                </div>
              </div>
            </section>

            {statusMessage ? (
              <InlineNotice tone={statusMessage.includes('sucesso') ? 'positive' : 'critical'}>
                {statusMessage}
              </InlineNotice>
            ) : null}
          </form>
        </GovernedActionDrawer>
      ) : null}
    </div>
  );
}
