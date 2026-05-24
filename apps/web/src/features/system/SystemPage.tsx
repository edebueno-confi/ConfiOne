import {
  useDeferredValue,
  useEffect,
  useEffectEvent,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Navigate } from 'react-router-dom';
import {
  getAdminAiOperationalContextReadiness,
  getAdminSystemOperationalSummary,
  listAdminAiActionPolicies,
  listAdminAiContextSourcePolicies,
  listAdminCommunicationChannelReadiness,
  listAdminSystemAuditEvents,
  listAdminSystemHealthChecks,
  type AdminAiActionPolicyRow,
  type AdminAiContextSourcePolicyRow,
  type AdminAiOperationalContextReadinessRow,
  type AdminCommunicationChannelReadinessRow,
  type AdminSystemAuditEventRow,
  type AdminSystemHealthCheckRow,
  type AdminSystemOperationalSummaryRow,
} from '../admin/admin-api';
import { classifyAdminError } from '../admin/admin-errors';
import { formatDateTime } from '../../app/format';
import {
  ContractUnavailableState,
  EmptyState,
  ErrorState,
  LoadingState,
} from '../../components/states';
import {
  AppButton,
  GhostButton,
  InlineNotice,
  SelectInput,
  StatusPill,
  TextInput,
  cx,
} from '../../components/ui';
import { useAuthContext } from '../auth/auth-context';

type PagePhase = 'loading' | 'ready' | 'contract-unavailable' | 'error';
type SystemTab = 'health' | 'audit' | 'jobs' | 'security';
type SystemSeverity = 'ok' | 'attention' | 'critical';
type SystemPeriodFilter = '24h' | '7d' | '30d' | 'all';
type AdminAuditFeedRow = AdminSystemAuditEventRow;
type ChannelReadinessSummary = {
  channelKey: AdminCommunicationChannelReadinessRow['channel_key'];
  channelLabel: string;
  statusLabel: string;
  tone: 'positive' | 'warning' | 'critical' | 'default';
  tenantCount: number;
  activeCount: number;
  unavailableCount: number;
  isExternal: boolean;
  canSendCount: number;
  reason: string;
  setup: string;
};

function lower(value: string | null | undefined) {
  return String(value ?? '').toLowerCase();
}

function toneForSystemSeverity(severity: SystemSeverity) {
  if (severity === 'critical') {
    return 'critical' as const;
  }

  if (severity === 'attention') {
    return 'warning' as const;
  }

  return 'positive' as const;
}

function humanizeSystemSeverity(severity: SystemSeverity) {
  if (severity === 'critical') {
    return 'Crítico';
  }

  if (severity === 'attention') {
    return 'Atenção';
  }

  return 'Estavel';
}

function humanizeChannelReadiness(status: AdminCommunicationChannelReadinessRow['readiness_status']) {
  if (status === 'active') {
    return 'Ativo';
  }

  if (status === 'not_configured') {
    return 'Não configurado';
  }

  if (status === 'future') {
    return 'Preparado para futuro';
  }

  if (status === 'blocked') {
    return 'Bloqueado';
  }

  if (status === 'disabled') {
    return 'Desabilitado';
  }

  return 'Indisponível';
}

function toneForChannelReadiness(status: AdminCommunicationChannelReadinessRow['readiness_status']) {
  if (status === 'active') {
    return 'positive' as const;
  }

  if (status === 'blocked' || status === 'unavailable') {
    return 'critical' as const;
  }

  if (status === 'disabled' || status === 'not_configured' || status === 'future') {
    return 'warning' as const;
  }

  return 'default' as const;
}

function formatSanitizedContext(value: unknown) {
  if (!value || typeof value !== 'object') {
    return 'Indisponível';
  }

  const context = value as {
    metadata_keys?: unknown;
    before_keys?: unknown;
    after_keys?: unknown;
  };
  const keys = [
    ...(Array.isArray(context.metadata_keys) ? context.metadata_keys : []),
    ...(Array.isArray(context.before_keys) ? context.before_keys : []),
    ...(Array.isArray(context.after_keys) ? context.after_keys : []),
  ]
    .filter((item): item is string => typeof item === 'string' && item.trim().length > 0)
    .filter((item, index, all) => all.indexOf(item) === index);

  return keys.length > 0 ? keys.join(', ') : 'Indisponível';
}

function buildSystemEventMessage(entry: AdminAuditFeedRow) {
  const actor = entry.actor_display_name || entry.actor_email || 'Operador interno';
  const service = entry.service_label || 'Sistema';
  const action = entry.action_label || 'Evento';
  const scope = entry.scope_label || 'escopo global';

  return `${actor} registrou ${action.toLowerCase()} em ${service.toLowerCase()} dentro de ${scope}.`;
}

function buildSystemImpact(entry: AdminAuditFeedRow) {
  return entry.impact_label || 'Registro informativo para manter contexto do control plane.';
}

function buildSystemActions(entry: AdminAuditFeedRow) {
  const severity = entry.severity;
  const isSecurity = matchesSecurityLens(entry);

  if (severity === 'critical') {
    return [
      'Conferir se a alteração era esperada pela operação.',
      'Revisar o impacto no cliente ou no escopo geral antes de seguir.',
      'Registrar acompanhamento interno se houver risco de regressão.',
    ];
  }

  if (isSecurity) {
    return [
      'Validar o papel, status ou convite envolvido.',
      'Confirmar se o acesso refletiu o estado aprovado.',
      'Escalar apenas se houver incoerência entre papel e uso esperado.',
    ];
  }

  return [
    'Manter o registro como trilha de auditoria.',
    'Cruzar com eventos relacionados se houver dúvida de sequência.',
    'Usar o feed para explicar a última mudança operacional.',
  ];
}

function matchesSecurityLens(entry: AdminAuditFeedRow) {
  const entity = lower(entry.service_key);
  const action = lower(entry.action);

  return (
    entity.includes('membership') ||
    entity.includes('role') ||
    entity.includes('access') ||
    action.includes('invite') ||
    action.includes('revoke')
  );
}

function matchesJobsLens(entry: AdminAuditFeedRow) {
  const action = lower(entry.action);

  return (
    action.includes('create') ||
    action.includes('update') ||
    action.includes('publish') ||
    action.includes('archive') ||
    action.includes('review')
  );
}

function withinPeriod(occurredAt: string, period: SystemPeriodFilter) {
  if (period === 'all') {
    return true;
  }

  const now = Date.now();
  const happenedAt = new Date(occurredAt).getTime();

  if (Number.isNaN(happenedAt)) {
    return false;
  }

  const diffHours = (now - happenedAt) / (1000 * 60 * 60);

  if (period === '24h') {
    return diffHours <= 24;
  }

  if (period === '7d') {
    return diffHours <= 24 * 7;
  }

  return diffHours <= 24 * 30;
}

function matchesTab(entry: AdminAuditFeedRow, activeTab: SystemTab) {
  if (activeTab === 'audit') {
    return true;
  }

  if (activeTab === 'security') {
    return matchesSecurityLens(entry);
  }

  if (activeTab === 'jobs') {
    return matchesJobsLens(entry);
  }

  return !matchesSecurityLens(entry) || entry.severity !== 'ok';
}

function SystemMetricCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <div className="rounded-[20px] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-4 py-3.5">
      <p className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-muted)]">
        {label}
      </p>
      <p className="mt-1.5 text-[1.55rem] font-semibold tracking-[-0.045em] text-[color:var(--color-ink)]">
        {value}
      </p>
      <p className="mt-1 text-xs leading-5 text-[color:var(--color-muted)]">{helper}</p>
    </div>
  );
}

function SystemSurfaceCard({
  title,
  description,
  children,
  actions,
  className,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cx(
        'rounded-[28px] border border-[color:var(--color-border)] bg-white/94 px-5 py-5 shadow-[0_16px_34px_rgba(16,30,74,0.08)]',
        className,
      )}
    >
      <header className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-[1.04rem] font-semibold tracking-[-0.035em] text-[color:var(--color-ink)]">
            {title}
          </h2>
          {description ? (
            <p className="text-sm leading-6 text-[color:var(--color-muted)]">{description}</p>
          ) : null}
        </div>
        {actions ? <div className="flex flex-wrap gap-2">{actions}</div> : null}
      </header>
      {children}
    </section>
  );
}

export function SystemPage() {
  const { markSessionExpired } = useAuthContext();
  const didBootstrapRef = useRef(false);
  const [backendDenied, setBackendDenied] = useState(false);
  const [phase, setPhase] = useState<PagePhase>('loading');
  const [pageMessage, setPageMessage] = useState<string | null>(null);
  const [auditFeed, setAuditFeed] = useState<AdminAuditFeedRow[]>([]);
  const [channelReadiness, setChannelReadiness] = useState<AdminCommunicationChannelReadinessRow[]>([]);
  const [aiReadiness, setAiReadiness] =
    useState<AdminAiOperationalContextReadinessRow | null>(null);
  const [aiSourcePolicies, setAiSourcePolicies] = useState<AdminAiContextSourcePolicyRow[]>([]);
  const [aiActionPolicies, setAiActionPolicies] = useState<AdminAiActionPolicyRow[]>([]);
  const [healthChecks, setHealthChecks] = useState<AdminSystemHealthCheckRow[]>([]);
  const [summary, setSummary] = useState<AdminSystemOperationalSummaryRow | null>(null);
  const [activeTab, setActiveTab] = useState<SystemTab>('health');
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null);
  const [actionFilter, setActionFilter] = useState<string>('all');
  const [severityFilter, setSeverityFilter] = useState<'all' | SystemSeverity>('all');
  const [periodFilter, setPeriodFilter] = useState<SystemPeriodFilter>('7d');
  const [serviceFilter, setServiceFilter] = useState<string>('all');
  const [query, setQuery] = useState('');
  const deferredQuery = useDeferredValue(query);

  const loadSurface = useEffectEvent(async () => {
    try {
      const [
        auditRows,
        healthRows,
        summaryRow,
        channelRows,
        aiReadinessRow,
        aiSourcePolicyRows,
        aiActionPolicyRows,
      ] = await Promise.all([
        listAdminSystemAuditEvents(),
        listAdminSystemHealthChecks(),
        getAdminSystemOperationalSummary(),
        listAdminCommunicationChannelReadiness(),
        getAdminAiOperationalContextReadiness(),
        listAdminAiContextSourcePolicies(),
        listAdminAiActionPolicies(),
      ]);

      setBackendDenied(false);
      setAuditFeed(auditRows);
      setHealthChecks(healthRows);
      setSummary(summaryRow);
      setChannelReadiness(channelRows);
      setAiReadiness(aiReadinessRow);
      setAiSourcePolicies(aiSourcePolicyRows);
      setAiActionPolicies(aiActionPolicyRows);
      setPageMessage(null);
      setPhase('ready');
    } catch (error) {
      const classified = classifyAdminError(
        error,
        'Falha ao carregar a rastreabilidade administrativa oficial.',
      );

      if (classified.kind === 'session-expired') {
        markSessionExpired();
        return;
      }

      if (classified.kind === 'permission-denied') {
        setBackendDenied(true);
        return;
      }

        setAuditFeed([]);
        setChannelReadiness([]);
        setAiReadiness(null);
        setAiSourcePolicies([]);
        setAiActionPolicies([]);
        setHealthChecks([]);
      setSummary(null);
      setPageMessage(classified.message);
      setPhase(
        classified.kind === 'contract-unavailable' ? 'contract-unavailable' : 'error',
      );
    }
  });

  useEffect(() => {
    if (didBootstrapRef.current) {
      return;
    }

    didBootstrapRef.current = true;
    void loadSurface();
  }, []);

  const distinctActions = useMemo(
    () => Array.from(new Set(auditFeed.map((entry) => entry.action))).sort(),
    [auditFeed],
  );
  const distinctServices = useMemo(
    () => Array.from(new Set(auditFeed.map((entry) => entry.service_key))).sort(),
    [auditFeed],
  );

  const filteredFeed = useMemo(
    () =>
      auditFeed.filter((entry) => {
        if (!matchesTab(entry, activeTab)) {
          return false;
        }

        if (actionFilter !== 'all' && entry.action !== actionFilter) {
          return false;
        }

        if (serviceFilter !== 'all' && entry.service_key !== serviceFilter) {
          return false;
        }

        if (severityFilter !== 'all' && entry.severity !== severityFilter) {
          return false;
        }

        if (!withinPeriod(entry.occurred_at, periodFilter)) {
          return false;
        }

        if (!deferredQuery.trim()) {
          return true;
        }

        const haystack = [
          entry.actor_display_name ?? '',
          entry.actor_email ?? '',
          entry.scope_label ?? '',
          entry.tenant_slug ?? '',
          entry.service_key,
          entry.service_label,
          entry.action,
          entry.action_label,
          buildSystemEventMessage(entry),
        ]
          .join(' ')
          .toLowerCase();

        return haystack.includes(deferredQuery.trim().toLowerCase());
      }),
    [activeTab, actionFilter, auditFeed, deferredQuery, periodFilter, serviceFilter, severityFilter],
  );

  useEffect(() => {
    if (filteredFeed.length === 0) {
      setSelectedEventId(null);
      return;
    }

    if (!selectedEventId || !filteredFeed.some((entry) => entry.id === selectedEventId)) {
      setSelectedEventId(filteredFeed[0]?.id ?? null);
    }
  }, [filteredFeed, selectedEventId]);

  const selectedEntry =
    filteredFeed.find((entry) => entry.id === selectedEventId) ?? filteredFeed[0] ?? null;

  const channelSummaries = useMemo(() => {
    const grouped = new Map<string, AdminCommunicationChannelReadinessRow[]>();

    for (const row of channelReadiness) {
      const rows = grouped.get(row.channel_key) ?? [];
      rows.push(row);
      grouped.set(row.channel_key, rows);
    }

    return Array.from(grouped.values()).map((rows): ChannelReadinessSummary => {
      const first = rows[0];
      const activeCount = rows.filter((row) => row.readiness_status === 'active').length;
      const canSendCount = rows.filter((row) => row.can_send).length;
      const unavailableRows = rows.filter((row) => row.readiness_status !== 'active');
      const referenceRow = unavailableRows[0] ?? first;

      return {
        channelKey: first.channel_key,
        channelLabel: first.channel_label,
        statusLabel:
          activeCount === rows.length
            ? 'Ativo'
            : humanizeChannelReadiness(referenceRow.readiness_status),
        tone:
          activeCount === rows.length
            ? 'positive'
            : toneForChannelReadiness(referenceRow.readiness_status),
        tenantCount: rows.length,
        activeCount,
        unavailableCount: rows.length - activeCount,
        isExternal: first.is_external,
        canSendCount,
        reason:
          referenceRow.reason_if_unavailable ??
          (activeCount === rows.length ? 'Canal disponível conforme contrato atual.' : 'Indisponível'),
        setup: referenceRow.required_setup_summary || 'Indisponível',
      };
    });
  }, [channelReadiness]);

  const aiPolicySummary = useMemo(() => {
    const updatedAt = [...aiSourcePolicies, ...aiActionPolicies]
      .map((policy) => policy.updated_at)
      .filter(Boolean)
      .sort()
      .at(-1);
    const blockedAutomationCount = aiActionPolicies.filter(
      (policy) => policy.decision === 'denied',
    ).length;
    const reviewRequiredCount = aiActionPolicies.filter(
      (policy) => policy.requires_human_review,
    ).length;

    return {
      actionPolicyCount: aiActionPolicies.length,
      blockedAutomationCount,
      sourcePolicyCount: aiSourcePolicies.length,
      reviewRequiredCount,
      updatedAt: updatedAt ?? null,
    };
  }, [aiActionPolicies, aiSourcePolicies]);

  const relatedEntries = useMemo(() => {
    if (!selectedEntry) {
      return [] as AdminAuditFeedRow[];
    }

    return auditFeed
      .filter(
        (entry) =>
          entry.id !== selectedEntry.id &&
          (entry.service_key === selectedEntry.service_key ||
            (entry.tenant_id && entry.tenant_id === selectedEntry.tenant_id)),
      )
      .slice(0, 4);
  }, [auditFeed, selectedEntry]);

  const checksOkCount = healthChecks.filter((check) => check.status === 'ok').length;
  const unavailableCheckCount = healthChecks.filter((check) => check.status === 'unavailable').length;
  const alertCount = summary?.attention_event_count ?? 0;
  const failureCount = summary?.critical_event_count ?? 0;
  const recentCount = summary?.audit_events_24h ?? 0;
  const selectedSeverity = selectedEntry ? selectedEntry.severity : 'ok';

  if (backendDenied) {
    return <Navigate replace state={{ reason: 'backend-permission' }} to="/access-denied" />;
  }

  if (phase === 'loading') {
    return <LoadingState title="Carregando estado do sistema" />;
  }

  if (phase === 'contract-unavailable') {
    return <ContractUnavailableState contractName="feed administrativo" />;
  }

  if (phase === 'error') {
    return (
      <ErrorState
        action={<AppButton onClick={() => void loadSurface()}>Tentar novamente</AppButton>}
        description={
          pageMessage ?? 'Não foi possível carregar o feed administrativo desta área.'
        }
      />
    );
  }

  return (
    <div className="space-y-3 xl:flex xl:h-full xl:min-h-0 xl:flex-col xl:overflow-hidden">
      <section className="rounded-[22px] border border-[color:var(--color-border)] bg-white/96 px-5 py-3.5 shadow-[0_18px_40px_rgba(16,30,74,0.08)]">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-1">
            <h1 className="text-[1.76rem] font-semibold tracking-[-0.055em] text-[color:var(--color-ink)]">
              Sistema
            </h1>
            <p className="text-[0.84rem] leading-5 text-[color:var(--color-muted)]">
              Auditoria, saúde do sistema e eventos operacionais.
            </p>
          </div>

          <GhostButton className="min-h-10 rounded-full px-4 text-[13px]" onClick={() => void loadSurface()}>
            Recarregar
          </GhostButton>
        </div>

        <nav className="mt-4 flex flex-wrap gap-5 border-b border-[color:var(--color-border)] pb-2">
          {[
            { id: 'health', label: 'Saúde' },
            { id: 'audit', label: 'Auditoria' },
            { id: 'jobs', label: 'Jobs' },
            { id: 'security', label: 'Segurança' },
          ].map((tab) => (
            <button
              className={cx(
                'inline-flex min-h-10 items-center border-b-2 border-transparent px-1 pb-2.5 text-[0.92rem] font-semibold transition',
                activeTab === tab.id
                  ? 'border-[color:var(--color-brand-blue)] text-[color:var(--color-brand-blue)]'
                  : 'text-[color:var(--color-muted)] hover:text-[color:var(--color-ink)]',
              )}
              key={tab.id}
              onClick={() => setActiveTab(tab.id as SystemTab)}
              type="button"
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </section>

      <div className="grid gap-4 xl:min-h-0 xl:flex-1 xl:grid-cols-[252px_minmax(0,1fr)_388px] xl:overflow-hidden 2xl:grid-cols-[260px_minmax(0,1fr)_396px]">
        <aside className="rounded-[20px] border border-[color:var(--color-border)] bg-white/96 p-3.5 shadow-[0_16px_34px_rgba(16,30,74,0.08)] xl:flex xl:min-h-0 xl:flex-col xl:overflow-hidden">
          <div className="space-y-3">
            <div className="space-y-1">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-[color:var(--color-muted)]">
                Monitoramento
              </p>
            </div>

            <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-1">
              {[
                { id: 'health', label: 'Saúde geral', count: `${checksOkCount} checks` },
                { id: 'audit', label: 'Auditoria', count: `${auditFeed.length} eventos` },
                { id: 'jobs', label: 'Falhas recentes', count: `${failureCount} críticos` },
                { id: 'security', label: 'Segurança', count: `${unavailableCheckCount} pendências` },
              ].map((item) => (
                <button
                  className={cx(
                    'flex w-full items-center justify-between rounded-[15px] border px-3 py-2.25 text-left transition',
                    activeTab === item.id
                      ? 'border-[rgba(48,127,226,0.3)] bg-[rgba(48,127,226,0.08)]'
                      : 'border-[color:var(--color-border)] bg-[color:var(--color-surface)] hover:bg-white',
                  )}
                  key={item.id}
                  onClick={() => setActiveTab(item.id as SystemTab)}
                  type="button"
                >
                  <span className="text-[0.8rem] font-semibold text-[color:var(--color-ink)]">{item.label}</span>
                  <span className="text-[0.72rem] text-[color:var(--color-muted)]">{item.count}</span>
                </button>
              ))}
            </div>

            <label className="grid gap-1.5">
              <span className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-muted)]">Tipo</span>
              <SelectInput className="h-9 rounded-[14px] px-3.5 text-[13px]" onChange={(event) => setActionFilter(event.target.value)} value={actionFilter}>
                <option value="all">Todos</option>
                {distinctActions.map((action) => (
                  <option key={action} value={action}>
                    {auditFeed.find((entry) => entry.action === action)?.action_label ?? action}
                  </option>
                ))}
              </SelectInput>
            </label>

            <label className="grid gap-1.5">
              <span className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-muted)]">Severidade</span>
              <SelectInput
                className="h-9 rounded-[14px] px-3.5 text-[13px]"
                onChange={(event) => setSeverityFilter(event.target.value as 'all' | SystemSeverity)}
                value={severityFilter}
              >
                <option value="all">Todas</option>
                <option value="ok">Estável</option>
                <option value="attention">Atenção</option>
                <option value="critical">Crítico</option>
              </SelectInput>
            </label>

            <label className="grid gap-1.5">
              <span className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-muted)]">Período</span>
              <SelectInput
                className="h-9 rounded-[14px] px-3.5 text-[13px]"
                onChange={(event) => setPeriodFilter(event.target.value as SystemPeriodFilter)}
                value={periodFilter}
              >
                <option value="24h">Últimas 24h</option>
                <option value="7d">Últimos 7 dias</option>
                <option value="30d">Últimos 30 dias</option>
                <option value="all">Todo o feed</option>
              </SelectInput>
            </label>

            <label className="grid gap-1.5">
              <span className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-muted)]">Serviço</span>
              <SelectInput className="h-9 rounded-[14px] px-3.5 text-[13px]" onChange={(event) => setServiceFilter(event.target.value)} value={serviceFilter}>
                <option value="all">Todos</option>
                {distinctServices.map((service) => (
                  <option key={service} value={service}>
                    {auditFeed.find((entry) => entry.service_key === service)?.service_label ?? service}
                  </option>
                ))}
              </SelectInput>
            </label>

            <label className="grid gap-1.5">
              <span className="text-[0.72rem] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-muted)]">Buscar</span>
              <TextInput
                className="h-9 rounded-[14px] px-3.5 text-[13px]"
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Pessoa, cliente ou serviço"
                value={query}
              />
            </label>

            <AppButton className="min-h-9 w-full px-4 text-[12.5px]" onClick={() => void loadSurface()}>
              Recarregar
            </AppButton>
          </div>
        </aside>

        <div className="min-w-0 xl:flex xl:min-h-0 xl:flex-col xl:overflow-hidden">
          <SystemSurfaceCard
            actions={
              <div className="flex flex-wrap items-center gap-2 text-[0.72rem] uppercase tracking-[0.16em] text-[color:var(--color-muted)]">
                <span>{filteredFeed.length} itens visíveis</span>
              </div>
            }
            className="xl:flex xl:min-h-0 xl:flex-1 xl:flex-col"
            title="Feed operacional"
          >
            <div className="mb-4 rounded-[20px] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-4 py-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <h3 className="text-[0.98rem] font-semibold text-[color:var(--color-ink)]">
                    Governança de canais
                  </h3>
                  <p className="text-sm leading-6 text-[color:var(--color-muted)]">
                    Portal é o canal ativo do MVP. Canais externos permanecem sem envio real.
                  </p>
                </div>
                <StatusPill>Sem segredo configurado</StatusPill>
              </div>

              {channelSummaries.length === 0 ? (
                <div className="mt-3">
                  <InlineNotice>
                    Readiness de canais indisponível neste ambiente.
                  </InlineNotice>
                </div>
              ) : (
                <div className="mt-4 grid gap-2 lg:grid-cols-2">
                  {channelSummaries.map((channel) => (
                    <div
                      className="rounded-[16px] border border-[color:var(--color-border)] bg-white px-3.5 py-3"
                      key={channel.channelKey}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-sm font-semibold text-[color:var(--color-ink)]">
                            {channel.channelLabel}
                          </p>
                          <p className="mt-1 text-xs leading-5 text-[color:var(--color-muted)]">
                            {channel.isExternal
                              ? 'Provider externo não configurado'
                              : 'Canal nativo governado'}
                          </p>
                        </div>
                        <StatusPill tone={channel.tone}>{channel.statusLabel}</StatusPill>
                      </div>
                      <div className="mt-3 grid gap-1 text-xs leading-5 text-[color:var(--color-muted)]">
                        <p>
                          Tenants ativos: {channel.activeCount}/{channel.tenantCount}
                        </p>
                        <p>Envio permitido: {channel.canSendCount > 0 ? 'Sim, via contrato atual' : 'Não'}</p>
                        <p>{channel.reason}</p>
                        <p>Próximo requisito: {channel.setup}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="mb-4 rounded-[20px] border border-[color:var(--color-border)] bg-white px-4 py-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="space-y-1">
                  <h3 className="text-[0.98rem] font-semibold text-[color:var(--color-ink)]">
                    AI-native readiness
                  </h3>
                  <p className="text-sm leading-6 text-[color:var(--color-muted)]">
                    Preparado para governança, não ativo. Nenhuma resposta é enviada automaticamente.
                  </p>
                </div>
                <StatusPill tone="warning">Preparada, não ativa</StatusPill>
              </div>

              {!aiReadiness ? (
                <div className="mt-3">
                  <InlineNotice>Readiness AI-native indisponível neste ambiente.</InlineNotice>
                </div>
              ) : (
                <>
                  <div className="mt-4 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
                    <div className="rounded-[16px] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3.5 py-3">
                      <p className="text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-[color:var(--color-muted)]">
                        Fontes
                      </p>
                      <p className="mt-1 text-sm font-semibold text-[color:var(--color-ink)]">
                        {aiPolicySummary.sourcePolicyCount || aiReadiness.allowed_source_count + aiReadiness.restricted_source_count + aiReadiness.future_source_count}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-[color:var(--color-muted)]">
                        {aiReadiness.allowed_source_count} permitidas, {aiReadiness.restricted_source_count} restritas, {aiReadiness.future_source_count} futuras
                      </p>
                    </div>
                    <div className="rounded-[16px] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3.5 py-3">
                      <p className="text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-[color:var(--color-muted)]">
                        Políticas de ação
                      </p>
                      <p className="mt-1 text-sm font-semibold text-[color:var(--color-ink)]">
                        {aiPolicySummary.actionPolicyCount || 'Indisponível'}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-[color:var(--color-muted)]">
                        {aiPolicySummary.blockedAutomationCount} automações bloqueadas; {aiPolicySummary.reviewRequiredCount} exigem revisão humana
                      </p>
                    </div>
                    <div className="rounded-[16px] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3.5 py-3">
                      <p className="text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-[color:var(--color-muted)]">
                        Provider/modelo
                      </p>
                      <p className="mt-1 text-sm font-semibold text-[color:var(--color-ink)]">
                        Não configurado
                      </p>
                      <p className="mt-1 text-xs leading-5 text-[color:var(--color-muted)]">
                        Sem LLM, embedding, job ou credencial externa nesta versão
                      </p>
                    </div>
                    <div className="rounded-[16px] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3.5 py-3">
                      <p className="text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-[color:var(--color-muted)]">
                        Última atualização
                      </p>
                      <p className="mt-1 text-sm font-semibold text-[color:var(--color-ink)]">
                        {aiPolicySummary.updatedAt ? formatDateTime(aiPolicySummary.updatedAt) : 'Indisponível'}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-[color:var(--color-muted)]">
                        Fonte: policies AI-native governadas pelo backend
                      </p>
                    </div>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <StatusPill>{aiReadiness.human_review_required ? 'Revisão humana obrigatória' : 'Revisão indisponível'}</StatusPill>
                    <StatusPill>{aiReadiness.audit_required ? 'Auditoria obrigatória' : 'Auditoria indisponível'}</StatusPill>
                    <StatusPill tone={aiReadiness.auto_send_enabled ? 'critical' : 'default'}>Resposta automática bloqueada</StatusPill>
                    <StatusPill tone={aiReadiness.auto_publish_enabled ? 'critical' : 'default'}>Publicação automática bloqueada</StatusPill>
                    <StatusPill tone={aiReadiness.embeddings_enabled ? 'critical' : 'default'}>Embeddings inativos</StatusPill>
                  </div>
                </>
              )}
            </div>
            <div className="mb-4 grid gap-2 md:grid-cols-2 xl:grid-cols-4">
              <SystemMetricCard helper="Em leitura estável." label="Checks verdes" value={String(checksOkCount)} />
              <SystemMetricCard helper="Eventos classificados pelo backend." label="Alertas" value={String(alertCount)} />
              <SystemMetricCard helper="Nas últimas 24h." label="Eventos recentes" value={String(recentCount)} />
              <SystemMetricCard helper="Eventos críticos do backend." label="Críticos" value={String(failureCount)} />
            </div>
            {auditFeed.length === 0 ? (
              <EmptyState
                description="Ainda não existem eventos de auditoria nesta área."
                title="Sem eventos administrativos"
              />
            ) : filteredFeed.length === 0 ? (
              <EmptyState
                description="Ajuste os filtros ou troque de aba para recuperar os registros esperados."
                title="Nenhum registro bateu com o recorte"
              />
            ) : (
              <div className="overflow-hidden rounded-[20px] border border-[color:var(--color-border)] xl:min-h-0 xl:flex-1 xl:overflow-y-auto">
                <div className="hidden grid-cols-[136px_112px_150px_minmax(0,1fr)_144px_114px] gap-3 border-b border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-4 py-3 text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-[color:var(--color-muted)] lg:grid">
                  <span>Tipo</span>
                  <span>Severidade</span>
                  <span>Origem</span>
                  <span>Resumo</span>
                  <span>Data</span>
                  <span>Situação</span>
                </div>
                <div className="divide-y divide-[color:var(--color-border)]">
                  {filteredFeed.map((entry) => {
                    const severity = entry.severity;
                    const selected = entry.id === selectedEntry?.id;

                    return (
                      <button
                        className={cx(
                          'grid w-full gap-3 px-4 py-4 text-left transition lg:grid-cols-[136px_112px_150px_minmax(0,1fr)_144px_114px]',
                          selected
                            ? 'bg-[rgba(48,127,226,0.08)]'
                            : 'bg-white hover:bg-[color:var(--color-surface)]',
                        )}
                        key={entry.id}
                        onClick={() => setSelectedEventId(entry.id)}
                        type="button"
                      >
                        <div className="min-w-0">
                          <p className="line-clamp-1 text-sm font-semibold text-[color:var(--color-ink)]">
                            {entry.action_label}
                          </p>
                        </div>
                        <div className="min-w-0">
                          <StatusPill tone={toneForSystemSeverity(severity)}>
                            {humanizeSystemSeverity(severity)}
                          </StatusPill>
                        </div>
                        <div className="min-w-0 text-sm text-[color:var(--color-muted)]">
                          {entry.service_label}
                        </div>
                        <div className="min-w-0">
                          <p className="line-clamp-2 text-sm leading-6 text-[color:var(--color-ink)]">
                            {buildSystemEventMessage(entry)}
                          </p>
                        </div>
                        <div className="text-sm text-[color:var(--color-muted)]">
                          {formatDateTime(entry.occurred_at)}
                        </div>
                        <div className="text-sm font-medium text-[color:var(--color-ink)]">
                          {severity === 'ok'
                            ? 'Monitorado'
                            : severity === 'attention'
                              ? 'Em observação'
                              : 'Escalar'}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </SystemSurfaceCard>
        </div>

        <aside className="rounded-[22px] border border-[color:var(--color-border)] bg-white/96 p-4 shadow-[0_16px_34px_rgba(16,30,74,0.08)] xl:flex xl:min-h-0 xl:flex-col xl:overflow-hidden">
          <div className="space-y-4 xl:min-h-0 xl:flex-1 xl:overflow-y-auto xl:pr-1">
            <div className="space-y-1">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.2em] text-[color:var(--color-muted)]">
                Detalhe operacional
              </p>
            </div>
            {!selectedEntry ? (
              <InlineNotice>Nenhum evento ficou disponível para abrir detalhes neste recorte.</InlineNotice>
            ) : (
              <div className="space-y-4">
                <section className="rounded-[22px] bg-[linear-gradient(180deg,#081d4a_0%,#102c6d_100%)] px-4 py-4 text-white shadow-[0_18px_34px_rgba(12,25,66,0.28)]">
                  <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusPill tone={toneForSystemSeverity(selectedSeverity)}>
                        {humanizeSystemSeverity(selectedSeverity)}
                      </StatusPill>
                      <StatusPill>{selectedEntry.service_label}</StatusPill>
                    </div>
                    <div className="space-y-1">
                      <h3 className="text-lg font-semibold tracking-[-0.04em]">
                        {selectedEntry.action_label}
                      </h3>
                      <p className="text-sm leading-6 text-white/78">
                        {buildSystemEventMessage(selectedEntry)}
                      </p>
                    </div>
                    <div className="grid gap-2 text-sm leading-6 text-white/78">
                      <p>Serviço: {selectedEntry.service_label}</p>
                      <p>Severidade: {humanizeSystemSeverity(selectedSeverity)}</p>
                      <p>Timestamp: {formatDateTime(selectedEntry.occurred_at)}</p>
                    </div>
                  </div>
                </section>

                <section className="rounded-[18px] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-4 py-4">
                  <h3 className="text-[0.98rem] font-semibold text-[color:var(--color-ink)]">Contexto</h3>
                  <div className="mt-3 grid gap-2 text-sm leading-6 text-[color:var(--color-muted)]">
                    <p>Escopo: {selectedEntry.scope_label ?? 'Indisponível'}</p>
                    <p>Slug: {selectedEntry.tenant_slug ?? 'Indisponível'}</p>
                    <p>Operador: {selectedEntry.actor_display_name ?? selectedEntry.actor_email ?? 'Indisponível'}</p>
                  </div>
                </section>

                <section className="rounded-[18px] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-4 py-4">
                  <h3 className="text-[0.98rem] font-semibold text-[color:var(--color-ink)]">Impacto</h3>
                  <p className="mt-3 text-sm leading-6 text-[color:var(--color-muted)]">
                    {buildSystemImpact(selectedEntry)}
                  </p>
                </section>

                <section className="rounded-[18px] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-4 py-4">
                  <h3 className="text-[0.98rem] font-semibold text-[color:var(--color-ink)]">Ações recomendadas</h3>
                  <ul className="mt-3 space-y-2 text-sm leading-6 text-[color:var(--color-muted)]">
                    {buildSystemActions(selectedEntry).map((item) => (
                      <li key={item}>{item}</li>
                    ))}
                  </ul>
                </section>

                <section className="rounded-[18px] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-4 py-4">
                  <h3 className="text-[0.98rem] font-semibold text-[color:var(--color-ink)]">Histórico relacionado</h3>
                  {relatedEntries.length === 0 ? (
                    <p className="mt-3 text-sm leading-6 text-[color:var(--color-muted)]">
                      Indisponível.
                    </p>
                  ) : (
                    <div className="mt-3 space-y-2">
                      {relatedEntries.map((entry) => (
                        <div
                          className="rounded-[16px] border border-[color:var(--color-border)] bg-white px-3 py-3"
                          key={entry.id}
                        >
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-sm font-semibold text-[color:var(--color-ink)]">
                              {entry.action_label}
                            </p>
                            <StatusPill tone={toneForSystemSeverity(entry.severity)}>
                              {humanizeSystemSeverity(entry.severity)}
                            </StatusPill>
                          </div>
                          <p className="mt-1 text-sm leading-6 text-[color:var(--color-muted)]">
                            {formatDateTime(entry.occurred_at)}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </section>

                <section className="rounded-[18px] border border-[color:var(--color-border)] bg-white px-4 py-4">
                  <h3 className="text-[0.98rem] font-semibold text-[color:var(--color-ink)]">Contexto sanitizado</h3>
                  <div className="mt-3 space-y-3 text-sm leading-6 text-[color:var(--color-muted)]">
                    <p>Referência interna: {selectedEntry.entity_id ?? 'Indisponível'}</p>
                    <p>Chaves disponíveis: {formatSanitizedContext(selectedEntry.sanitized_context)}</p>
                    <p>Valores brutos e payloads sensíveis não são expostos nesta tela.</p>
                  </div>
                </section>
              </div>
            )}
          </div>
        </aside>
      </div>
    </div>
  );
}
