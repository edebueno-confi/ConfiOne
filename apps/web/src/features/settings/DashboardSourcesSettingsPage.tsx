import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { MinimalState } from '../../components/minimal-states';
import { GeniusSyncOverlay, type SyncSource, type SyncVisualState } from '../../components/GeniusSyncOverlay';
import { useAuthContext } from '../auth/auth-context';
import { canManageAnalyticsIntegration } from '../analytics/analytics-permissions.mjs';
import { PipelineRoleSettings } from './PipelineRoleSettings';
import { StageMappingSettings } from './StageMappingSettings';
import { CompanyReconciliationPanel } from './CompanyReconciliationPanel';
import {
  getAnalyticsSourceStatus,
  getIntegrationSchedule,
  listAnalyticsSourceConfig,
  setIntegrationSchedule,
  triggerHubspotSync,
  triggerOmieSync,
  triggerSequentialAnalyticsSync,
  waitForAnalyticsSyncCompletion,
  updateAnalyticsPipelineConfig,
  updateAnalyticsPipelineOperation,
  type IntegrationSchedule,
} from '../analytics/analytics-api';
import type { AnalyticsSourceConfig } from '../analytics/analytics-model';
import type { AnalyticsSourceStatusPayload } from '@genius-support-os/contracts';
import { areAnalyticsSourcesActive, syncProgressLabel } from '../analytics/analytics-sync-progress.mjs';
import { UiBadge } from './ui/UiBadge';
import { UiButton } from './ui/UiButton';
import { UiCard } from './ui/UiCard';
import { UiCardHeader } from './ui/UiCardHeader';
import { UiEmptyState } from './ui/UiEmptyState';
import { UiField } from './ui/UiField';
import { UiHintBand } from './ui/UiHintBand';
import { UiMetric } from './ui/UiMetric';
import { UiMetricRow } from './ui/UiMetricRow';
import { UiPage } from './ui/UiPage';
import { UiPageHeader } from './ui/UiPageHeader';
import { UiSearchField } from './ui/UiSearchField';
import { UiTable } from './ui/UiTable';
import { UiToolbar } from './ui/UiToolbar';
import type { UiTone } from './ui/ui-types';
import './settings-ui.css';

type DashboardTab = 'sources' | 'pipelines' | 'stages' | 'reconciliation';

const DASHBOARD_TABS: ReadonlyArray<{ key: DashboardTab; label: string }> = [
  { key: 'sources', label: 'Fontes' },
  { key: 'pipelines', label: 'Pipelines' },
  { key: 'stages', label: 'Etapas' },
  { key: 'reconciliation', label: 'Conciliação' },
];

function isDashboardTab(value: string | null): value is DashboardTab {
  return DASHBOARD_TABS.some((tab) => tab.key === value);
}

const PUBLISHED_SOURCE_STATES = new Set(['fresh', 'syncing', 'failed', 'partial', 'stale', 'never_synced']);

const AREA_LABELS: Record<AnalyticsSourceConfig['areaKey'], string> = {
  commercial: 'Comercial',
  customer_success: 'Customer Success',
  support: 'Suporte',
  chat: 'Chat',
  a_classificar: 'A classificar',
};

const GROUP_COMPANY_OPTIONS = ['a_definir', 'Confi', 'Neotrust', 'Aftersale', 'SocialSoul/Lomadee', 'Confi Analytics'];

function statusLabel(status: string) {
  return ({ fresh: 'Atualizada', syncing: 'Atualizando', failed: 'Falhou', partial: 'Parcial', stale: 'Desatualizada', never_synced: 'Ainda não atualizada', unavailable: 'Indisponível' } as Record<string, string>)[status] ?? 'Indisponível';
}

function formatDate(value: string | null | undefined) {
  return value ? new Date(value).toLocaleString('pt-BR') : 'Indisponível';
}

/** Tom do estado publicado da fonte, no vocabulário do sistema visual. */
function sourceStatusTone(status: string): UiTone {
  if (status === 'fresh') return 'success';
  if (status === 'syncing') return 'primary';
  if (status === 'failed') return 'danger';
  if (status === 'partial' || status === 'stale') return 'warning';
  return 'neutral';
}

/** Frequência da atualização automática, sem inventar valor quando está desligada. */
function scheduleFrequencyLabel(schedule: IntegrationSchedule | null) {
  if (!schedule || !schedule.enabled || schedule.frequency === 'off') return 'Desativada';
  return schedule.frequency === 'hourly' ? 'De hora em hora' : 'Diária';
}

function sourceDetail(source: AnalyticsSourceStatusPayload['hubspot']) {
  if (source.status === 'syncing') {
    return source.lastSuccessAt
      ? `Atualização em andamento · última atualização publicada ${formatDate(source.lastSuccessAt)}`
      : 'Atualização em andamento · ainda não há atualização publicada.';
  }
  if (source.status === 'failed') {
    return source.lastSuccessAt
      ? `Última tentativa ${formatDate(source.lastFailureAt ?? source.lastAttemptAt)} · dados anteriores preservados`
      : source.sanitizedError ?? 'A última tentativa falhou e ainda não há atualização publicada.';
  }
  if (source.lastSuccessAt) return `Última atualização publicada: ${formatDate(source.lastSuccessAt)}`;
  return source.sanitizedError ?? 'Ainda não há uma atualização concluída.';
}

function terminalSyncState(status: AnalyticsSourceStatusPayload, kind: 'full' | 'hubspot' | 'omie'): SyncVisualState {
  const sources = kind === 'full' ? [status.hubspot, status.omie] : [status[kind]];
  if (sources.some((source) => source.currentRunStatus === 'timed_out')) return 'timed_out';
  if (sources.some((source) => source.currentRunStatus === 'abandoned')) return 'abandoned';
  if (sources.some((source) => source.currentRunStatus === 'failed' || source.status === 'failed')) return 'failed';
  return 'publishing';
}

function isSyncAlreadyRunning(cause: unknown) {
  return cause instanceof Error
    && cause.name === 'AnalyticsSyncError'
    && String(cause.cause ?? '').includes('status=409');
}

function PipelineTableRow({ row, canEdit, busy, onSave, onSaveOperation }: { row: AnalyticsSourceConfig; canEdit: boolean; busy: boolean; onSave: (row: AnalyticsSourceConfig, areaKey: AnalyticsSourceConfig['areaKey'], alias: string, isActive: boolean) => Promise<void>; onSaveOperation: (row: AnalyticsSourceConfig, groupCompany: string) => Promise<void> }) {
  const [areaKey, setAreaKey] = useState(row.areaKey);
  const [alias, setAlias] = useState(row.alias ?? '');
  const [groupCompany, setGroupCompany] = useState(row.groupCompany);
  const changed = areaKey !== row.areaKey || alias !== (row.alias ?? '');
  const operationChanged = groupCompany !== row.groupCompany || row.groupCompanySource !== 'confirmed';

  return (
    <tr className={row.isArchived ? 'is-muted' : undefined}>
      <td>
        <strong>{row.label}</strong>
        <small>{row.objectType === 'deal' ? 'Deal' : 'Ticket'} · HubSpot · ID {row.pipelineId}</small>
      </td>
      <td>
        <UiBadge dot tone={row.isArchived ? 'neutral' : row.areaKey === 'a_classificar' ? 'warning' : 'success'}>
          {row.isArchived ? 'Arquivado' : row.areaKey === 'a_classificar' ? 'A classificar' : 'Ativo'}
        </UiBadge>
        <small>{formatDate(row.lastDiscoveredAt)}</small>
      </td>
      <td>
        <UiField label="Área">
          <select className="gso-ui-control gso-ui-select" disabled={!canEdit || row.isArchived || busy} onChange={(event) => setAreaKey(event.currentTarget.value as AnalyticsSourceConfig['areaKey'])} value={areaKey}>
            {Object.entries(AREA_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
          </select>
        </UiField>
      </td>
      <td>
        <UiField label="Operação">
          <select className="gso-ui-control gso-ui-select" disabled={!canEdit || row.isArchived || busy} onChange={(event) => setGroupCompany(event.currentTarget.value)} value={groupCompany}>
            {GROUP_COMPANY_OPTIONS.map((option) => <option key={option} value={option}>{option === 'a_definir' ? 'A decidir' : option}</option>)}
          </select>
        </UiField>
        <small>{row.groupCompanySource === 'confirmed' ? 'Confirmada' : 'Sugestão pendente'}</small>
      </td>
      <td>
        <UiField label="Alias">
          <input className="gso-ui-control" disabled={!canEdit || row.isArchived || busy} onChange={(event) => setAlias(event.currentTarget.value)} placeholder="Opcional" value={alias} />
        </UiField>
      </td>
      <td>
        <div className="gso-ui-table-actions">
          {canEdit && !row.isArchived ? <UiButton compact disabled={busy || !changed} icon="check" onClick={() => void onSave(row, areaKey, alias, row.isActive)}>Salvar</UiButton> : null}
          {canEdit && !row.isArchived ? <UiButton compact disabled={busy || !operationChanged} onClick={() => void onSaveOperation(row, groupCompany)}>Confirmar operação</UiButton> : null}
        </div>
      </td>
    </tr>
  );
}

export function DashboardSourcesSettingsPage() {
  const { gate } = useAuthContext();
  const canEdit = canManageAnalyticsIntegration(gate.actor);
  const [searchParams, setSearchParams] = useSearchParams();
  const [tab, setTab] = useState<DashboardTab>(() => isDashboardTab(searchParams.get('tab')) ? searchParams.get('tab') as DashboardTab : 'sources');
  const [rows, setRows] = useState<AnalyticsSourceConfig[]>([]);
  const [schedule, setSchedule] = useState<IntegrationSchedule | null>(null);
  const [sourceStatus, setSourceStatus] = useState<AnalyticsSourceStatusPayload | null>(null);
  const [areaFilter, setAreaFilter] = useState<'all' | AnalyticsSourceConfig['areaKey']>('all');
  const [pipelineSearch, setPipelineSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [syncingKind, setSyncingKind] = useState<'full' | 'hubspot' | 'omie' | null>(null);
  const [syncFeedback, setSyncFeedback] = useState<{ source: SyncSource; state: SyncVisualState; detail?: string } | null>(null);
  const [syncProgress, setSyncProgress] = useState('Preparando a atualização das fontes.');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [catalog, nextSchedule, nextStatus] = await Promise.all([listAnalyticsSourceConfig(), getIntegrationSchedule(), getAnalyticsSourceStatus()]);
      setRows(catalog);
      setSchedule(nextSchedule);
      setSourceStatus(nextStatus);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível carregar as fontes do Dashboard.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  useEffect(() => {
    const nextTab = searchParams.get('tab');
    setTab(isDashboardTab(nextTab) ? nextTab : 'sources');
  }, [searchParams]);

  const selectTab = (nextTab: DashboardTab) => {
    setTab(nextTab);
    const nextParams = new URLSearchParams(searchParams);
    nextParams.set('tab', nextTab);
    setSearchParams(nextParams, { replace: true });
  };

  const filteredRows = useMemo(() => {
    const query = pipelineSearch.trim().toLocaleLowerCase('pt-BR');
    return rows.filter((row) => {
      const matchesArea = areaFilter === 'all' || row.areaKey === areaFilter;
      const matchesQuery = !query || [row.label, row.hubspotLabel, row.alias, row.pipelineId]
        .filter(Boolean)
        .some((value) => String(value).toLocaleLowerCase('pt-BR').includes(query));
      return matchesArea && matchesQuery;
    });
  }, [areaFilter, pipelineSearch, rows]);
  const groupedRows = useMemo(() => Object.entries(filteredRows.reduce<Record<string, AnalyticsSourceConfig[]>>((groups, row) => { (groups[row.areaKey] ??= []).push(row); return groups; }, {})), [filteredRows]);
  const pendingRows = useMemo(() => rows.filter((row) => !row.isArchived && row.areaKey === 'a_classificar'), [rows]);
  const pendingCount = pendingRows.length;
  const activePipelineCount = rows.filter((row) => row.isActive).length;

  const savePipeline = async (row: AnalyticsSourceConfig, areaKey: AnalyticsSourceConfig['areaKey'], alias: string, isActive: boolean) => {
    setBusy(true); setError(null); setMessage(null);
    try {
      const saved = await updateAnalyticsPipelineConfig({ id: row.id, areaKey, alias, isActive });
      setRows((current) => current.map((item) => item.id === saved.id ? saved : item));
      setMessage(`Configuração de “${saved.label}” salva.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível salvar o pipeline.');
    } finally { setBusy(false); }
  };

  const savePipelineOperation = async (row: AnalyticsSourceConfig, groupCompany: string) => {
    setBusy(true); setError(null); setMessage(null);
    try {
      const saved = await updateAnalyticsPipelineOperation(row.id, groupCompany);
      setRows((current) => current.map((item) => item.id === saved.id ? saved : item));
      setMessage(`Operação de “${saved.label}” confirmada como ${saved.groupCompany}.`);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível salvar a operação do pipeline.');
    } finally { setBusy(false); }
  };

  const saveSchedule = async () => {
    setBusy(true); setError(null); setMessage(null);
    try {
      await setIntegrationSchedule(schedule?.enabled ?? false, schedule?.frequency ?? 'off', false, 'off');
      setMessage('Atualização automática salva.');
      await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível salvar a atualização automática.'); } finally { setBusy(false); }
  };

  const run = async (kind: 'full' | 'hubspot' | 'omie') => {
    const latestStatus = sourceStatus ?? await getAnalyticsSourceStatus();
    if (areAnalyticsSourcesActive(latestStatus, kind)) {
      setError('Já existe uma atualização em andamento. Aguarde a conclusão antes de iniciar outra.');
      return;
    }
    const source: SyncSource = kind === 'full' ? 'painel' : kind === 'hubspot' ? 'HubSpot' : 'OMIE';
    const activeState: SyncVisualState = kind === 'full' ? 'preparing' : kind === 'hubspot' ? 'syncing_hubspot' : 'syncing_omie';
    const detail = kind === 'full' ? 'O Gênio está atualizando HubSpot e OMIE em sequência.' : `O Gênio está atualizando ${kind === 'hubspot' ? 'HubSpot' : 'OMIE'}.`;
    setBusy(true); setSyncingKind(kind); setSyncFeedback({ source, state: activeState, detail }); setSyncProgress(detail); setError(null); setMessage(null);
    try {
      if (kind === 'full') await triggerSequentialAnalyticsSync();
      if (kind === 'hubspot') await triggerHubspotSync(undefined, { phased: false });
      if (kind === 'omie') await triggerOmieSync();
      const completion = await waitForAnalyticsSyncCompletion(kind);
      setSourceStatus(completion.status);
      const finalState = completion.timedOut ? 'timed_out' : terminalSyncState(completion.status, kind);
      setSyncFeedback({ source, state: finalState, detail: completion.timedOut ? syncProgressLabel(kind, true) : undefined });
       await load();
       if (finalState === 'publishing') setSyncFeedback(null);
       setMessage(completion.timedOut ? syncProgressLabel(kind, true) : `Atualização ${kind === 'full' ? 'do painel' : kind === 'hubspot' ? 'do HubSpot' : 'do OMIE'} concluída; o estado publicado foi confirmado.`);
    } catch (cause) {
      if (isSyncAlreadyRunning(cause)) {
        const current = await getAnalyticsSourceStatus().catch(() => null);
        if (current) setSourceStatus(current);
        setSyncFeedback(null);
        setMessage(`A atualização ${kind === 'hubspot' ? 'do HubSpot' : kind === 'omie' ? 'do OMIE' : 'do painel'} já estava em andamento; o estado publicado continua sendo acompanhado.`);
        return;
      }
      const message = cause instanceof Error ? cause.message : 'Não foi possível iniciar a atualização.';
      setSyncFeedback({ source, state: 'failed', detail: message });
      setError(message);
    } finally { setBusy(false); setSyncingKind(null); }
  };

  const sourcePills = sourceStatus ? [sourceStatus.hubspot, sourceStatus.omie] : [];
  if (loading && rows.length === 0) return <MinimalState loading title="Carregando fontes do Dashboard" description="Consultando catálogo, atualização automática e estado das conexões." />;
  if (error && rows.length === 0) return <MinimalState tone="critical" title="Não foi possível carregar" description={error} />;

  return (
    <UiPage className="gso-ui-page--fill gso-po-v2-dashboard-sources">
      {syncFeedback ? <GeniusSyncOverlay source={syncFeedback.source} state={syncFeedback.state} hasValidSnapshot={syncFeedback.state === 'failed' || syncFeedback.state === 'timed_out' || syncFeedback.state === 'abandoned' ? Boolean(syncFeedback.source === 'painel' ? sourceStatus?.hubspot.hasValidSnapshot && sourceStatus?.omie.hasValidSnapshot : sourceStatus?.[syncFeedback.source.toLowerCase() as 'hubspot' | 'omie']?.hasValidSnapshot) : syncingKind === 'full' ? Boolean(sourceStatus?.hubspot.hasValidSnapshot && sourceStatus?.omie.hasValidSnapshot) : Boolean(sourceStatus?.[syncingKind ?? 'hubspot']?.hasValidSnapshot)} detail={syncFeedback.detail ?? syncProgress} historyHref="/admin/settings/sync-history" /> : null}
      <UiPageHeader
        actions={
          <>
            <UiButton disabled={busy || loading} icon="refresh" onClick={() => void load()}>
              {loading ? 'Lendo…' : 'Reler estado'}
            </UiButton>
            <UiButton disabled={!canEdit || busy} icon="database" onClick={() => void run('full')} variant="primary">
              Atualizar painel completo
            </UiButton>
          </>
        }
        description="Configure, classifique e concilie os dados utilizados pelo Dashboard Gerencial."
        meta={`${rows.length} pipelines no catálogo`}
        title="Governança de dados"
        titleId="settings-sources-title"
      />

      <nav aria-label="Seções de governança de dados" className="gso-ui-tabs">
        {DASHBOARD_TABS.map((item) => (
          <button
            aria-current={tab === item.key ? 'page' : undefined}
            className={`gso-ui-tab${tab === item.key ? ' is-active' : ''}`}
            key={item.key}
            onClick={() => selectTab(item.key)}
            type="button"
          >
            {item.label}
          </button>
        ))}
      </nav>

      {tab === 'sources' ? <>
      <UiMetricRow label="Resumo das fontes">
        <UiMetric
          icon="database"
          label="Fontes ativas"
          sub={sourcePills.length ? `${sourcePills.filter((source) => PUBLISHED_SOURCE_STATES.has(source.status)).length} fontes com estado publicado` : 'Indisponível'}
          tone="primary"
          value={sourcePills.length ? sourcePills.filter((source) => PUBLISHED_SOURCE_STATES.has(source.status)).length : 'Indisponível'}
        />
        <UiMetric
          icon="layers"
          label="Pipelines ativos"
          sub={rows.length ? `${rows.length} no catálogo` : 'Indisponível'}
          tone="neutral"
          value={rows.length ? `${activePipelineCount} de ${rows.length}` : 'Indisponível'}
        />
        <UiMetric
          icon="alert"
          label="Aguardando classificação"
          sub="Pipelines sem área definida"
          tone="warning"
          value={pendingCount}
          valueTone="warning"
        />
        <UiMetric
          icon="clock"
          label="Última atualização"
          sub={sourcePills.some((source) => source.lastSuccessAt) ? 'Estado publicado mais recente' : 'Indisponível'}
          tone="neutral"
          value={formatDate(sourcePills.map((source) => source.lastSuccessAt).filter((value): value is string => Boolean(value)).sort().at(-1))}
        />
      </UiMetricRow>

      <UiCard flush labelledBy="sources-table-title">
        <UiCardHeader
          description="HubSpot abastece Comercial, Customer Success e Suporte. OMIE abastece o Financeiro."
          icon="plug"
          title="Fontes ativas"
          titleId="sources-table-title"
          tone="primary"
        />
        <UiTable labelledBy="sources-table-title">
          <thead>
            <tr>
              <th scope="col">Fonte</th>
              <th scope="col">Domínios atendidos</th>
              <th scope="col">Estado publicado</th>
              <th scope="col">Última atualização</th>
              <th scope="col">Volume da última carga</th>
              <th className="gso-ui-table-actions--head" scope="col">Ações</th>
            </tr>
          </thead>
          <tbody>
            {sourcePills.length ? sourcePills.map((source) => {
              const kind = source.key === 'omie' ? 'omie' : 'hubspot';
              return (
                <tr key={source.key}>
                  <td>
                    <strong>{source.label}</strong>
                    <small>{kind === 'omie' ? 'Financeiro · API' : 'Operação · API'}</small>
                  </td>
                  <td>{kind === 'omie' ? 'Financeiro' : 'Comercial, Customer Success e Suporte'}</td>
                  <td>
                    <UiBadge dot tone={sourceStatusTone(source.status)}>{statusLabel(source.status)}</UiBadge>
                    <small>{sourceDetail(source)}</small>
                  </td>
                  <td className="gso-ui-table-numeric">{formatDate(source.lastSuccessAt ?? source.lastAttemptAt)}</td>
                  <td className="gso-ui-table-numeric">
                    {source.processedCount ? source.processedCount.toLocaleString('pt-BR') : 'Indisponível'}
                    {source.rejectedCount ? <small>{source.rejectedCount.toLocaleString('pt-BR')} recusados</small> : null}
                  </td>
                  <td>
                    <div className="gso-ui-table-actions">
                      <UiButton
                        aria-label={kind === 'omie' ? 'Atualizar OMIE' : 'Atualizar HubSpot'}
                        compact
                        disabled={!canEdit || busy}
                        icon="refresh"
                        onClick={() => void run(kind)}
                      >
                        Atualizar
                      </UiButton>
                      <Link className="gso-ui-button gso-ui-button--secondary gso-ui-button--compact" to="/admin/settings/integrations">
                        Credencial
                      </Link>
                    </div>
                  </td>
                </tr>
              );
            }) : (
              <tr>
                <td colSpan={6}>
                  <UiEmptyState
                    description="Conecte ou sincronize uma fonte para que o estado operacional possa ser exibido."
                    icon="database"
                    title="Nenhuma fonte disponível para esta leitura."
                  />
                </td>
              </tr>
            )}
          </tbody>
        </UiTable>
        <p className="gso-ui-card-foot">
          Cada atualização avança a partir do último ponto seguro disponível. Quando a origem não informa esse ponto, o sistema confirma a leitura completa e registra volume, duração e chamadas no Histórico.
        </p>
      </UiCard>

      </> : null}

      {tab === 'pipelines' ? <>
      <UiToolbar label="Filtros de pipelines">
        <UiSearchField aria-label="Buscar pipeline" onChange={(event) => setPipelineSearch(event.currentTarget.value)} placeholder="Buscar pipeline…" value={pipelineSearch} />
        <UiField label="Área / operação">
          <select className="gso-ui-control gso-ui-select" value={areaFilter} onChange={(event) => setAreaFilter(event.target.value as typeof areaFilter)}>
            <option value="all">Todas as áreas</option>
            {Object.entries(AREA_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
          </select>
        </UiField>
      </UiToolbar>

      <UiCard flush labelledBy="pending-sources-title">
        <UiCardHeader
          description="Pipelines que o HubSpot trouxe e que ainda não têm decisão administrativa de área."
          icon="alert"
          title="Aguardando classificação"
          titleId="pending-sources-title"
          tone={pendingCount ? 'warning' : 'neutral'}
        />
        {pendingRows.length ? (
          <UiTable labelledBy="pending-sources-title">
            <thead>
              <tr>
                <th scope="col">Pipeline</th>
                <th scope="col">Tipo</th>
                <th scope="col">Descoberto em</th>
              </tr>
            </thead>
            <tbody>
              {pendingRows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <strong>{row.label}</strong>
                    <small>ID {row.pipelineId}</small>
                  </td>
                  <td>{row.objectType === 'deal' ? 'Negócio' : 'Ticket'}</td>
                  <td className="gso-ui-table-numeric">{formatDate(row.lastDiscoveredAt)}</td>
                </tr>
              ))}
            </tbody>
          </UiTable>
        ) : (
          <UiEmptyState
            description="Todas as fontes descobertas já têm área definida."
            icon="check"
            title="Nenhuma fonte aguardando classificação"
          />
        )}
      </UiCard>

      </> : null}

      {tab === 'sources' ? <UiCard labelledBy="schedule-title">
        <UiCardHeader
          description="O Dashboard atualiza primeiro o HubSpot e, em seguida, os dados financeiros do OMIE."
          icon="calendar"
          title="Atualização automática do Dashboard"
          titleId="schedule-title"
          tone="accent"
        />
        <div className="gso-ui-card-body">
          <div className="gso-ui-rowcard-controls">
            <UiField label="Frequência">
              <select className="gso-ui-control gso-ui-select" disabled={!canEdit || busy} value={schedule?.frequency ?? 'off'} onChange={(event) => setSchedule((current) => ({ ...(current ?? { enabled: false, frequency: 'off', lastRunAt: null, lastStatus: null, lastMessage: null, hubspotEnabled: false, hubspotFrequency: 'off', hubspotLastRunAt: null, hubspotLastStatus: null, hubspotLastMessage: null }), frequency: event.target.value as IntegrationSchedule['frequency'] }))}>
                <option value="off">Desativada</option>
                <option value="hourly">De hora em hora</option>
                <option value="daily">Diária</option>
              </select>
            </UiField>
            <label className="gso-ui-toggle">
              <span>Atualização ativa</span>
              <input type="checkbox" disabled={!canEdit || busy} checked={schedule?.enabled ?? false} onChange={(event) => setSchedule((current) => current ? { ...current, enabled: event.target.checked } : current)} />
            </label>
            <UiBadge dot tone={schedule?.enabled ? 'success' : 'neutral'}>{scheduleFrequencyLabel(schedule)}</UiBadge>
            <UiButton className="gso-ui-rowcard-save" disabled={!canEdit || busy} icon="check" onClick={() => void saveSchedule()}>
              Salvar
            </UiButton>
          </div>
        </div>
        {!canEdit ? <p className="gso-ui-note">Seu perfil pode consultar as fontes, mas não pode alterar configurações ou iniciar atualizações.</p> : null}
      </UiCard> : null}

      {tab === 'pipelines' ? <>
      <UiCard labelledBy="catalog-title">
        <UiCardHeader
          description="Organize as fontes por área sem alterar o nome oficial que aparece na origem."
          icon="layers"
          title="Pipelines usados por área"
          titleId="catalog-title"
          tone="primary"
        />
        {message ? (
          <p className="gso-ui-alert gso-ui-alert--success" role="status">
            {message} <Link className="gso-ui-link" to="/admin/settings/sync-history">Acompanhar no Histórico</Link>
          </p>
        ) : null}
        {error ? <p className="gso-ui-alert gso-ui-alert--error" role="alert">{error}</p> : null}
        <div className="gso-ui-groups">
          {groupedRows.map(([areaKey, areaRows]) => (
            <section className="gso-ui-group" key={areaKey}>
              <header className="gso-ui-group-heading">
                <h3>{AREA_LABELS[areaKey as AnalyticsSourceConfig['areaKey']] ?? 'A classificar'}</h3>
                <span>{areaRows.length} pipelines</span>
              </header>
              <UiTable label={`Pipelines da área ${AREA_LABELS[areaKey as AnalyticsSourceConfig['areaKey']] ?? 'A classificar'}`}>
                <thead>
                  <tr>
                    <th scope="col">Pipeline</th>
                    <th scope="col">Status</th>
                    <th scope="col">Área</th>
                    <th scope="col">Operação</th>
                    <th scope="col">Alias</th>
                    <th className="gso-ui-table-actions--head" scope="col">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {areaRows.map((row) => <PipelineTableRow busy={busy} canEdit={canEdit} key={row.id} onSave={savePipeline} onSaveOperation={savePipelineOperation} row={row} />)}
                </tbody>
              </UiTable>
            </section>
          ))}
        </div>
        {!filteredRows.length ? <UiEmptyState icon="layers" title="Nenhum pipeline nesta área." /> : null}
      </UiCard>

      <PipelineRoleSettings />

      <UiHintBand
        description="“A classificar” significa que o HubSpot trouxe o pipeline, mas ainda não há decisão administrativa segura sobre a área. Esses registros permanecem carregados e ativos, porém não entram silenciosamente nos indicadores de Customer Success, Suporte ou Chat."
        title="Como ler este catálogo"
      />
      </> : null}

      {tab === 'stages' ? <>
        <StageMappingSettings />
        <UiHintBand
          description="O mapeamento define como uma etapa existente é interpretada pelo ConfiOne. Alterar a classificação não cria uma nova etapa no HubSpot."
          title="Como ler o mapeamento"
        />
      </> : null}

      {tab === 'reconciliation' ? <>
      <section aria-labelledby="sources-conciliacao" className="space-y-4 border-t border-[color:var(--one-border-default,#22324D)] pt-4">
        <div className="border-b border-[color:var(--one-border-default,#22324D)] pb-2">
          <h2 id="sources-conciliacao" className="text-base font-semibold text-[color:var(--one-text-primary,#E6ECF5)]">
            Conciliação de empresas
          </h2>
          <p className="mt-1 text-xs text-[color:var(--one-text-secondary,#A6B2C7)]">
            A conciliação manual HubSpot–OMIE entra aqui. Sugestões por nome não valem como vínculo até uma pessoa autorizada confirmar a evidência.
          </p>
        </div>
        <CompanyReconciliationPanel />
      </section>
      </> : null}

    </UiPage>
  );
}
