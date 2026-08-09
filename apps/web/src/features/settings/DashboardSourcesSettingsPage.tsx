import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router';
import { MinimalState } from '../../components/minimal-states';
import { GeniusSyncOverlay, type SyncSource, type SyncVisualState } from '../../components/GeniusSyncOverlay';
import { useAuthContext } from '../auth/auth-context';
import { canManageAnalyticsIntegration } from '../analytics/analytics-permissions.mjs';
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
import { UiTable } from './ui/UiTable';
import type { UiTone } from './ui/ui-types';
import './settings-ui.css';

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

function PipelineRow({ row, canEdit, busy, onSave, onSaveOperation }: { row: AnalyticsSourceConfig; canEdit: boolean; busy: boolean; onSave: (row: AnalyticsSourceConfig, areaKey: AnalyticsSourceConfig['areaKey'], alias: string, isActive: boolean) => Promise<void>; onSaveOperation: (row: AnalyticsSourceConfig, groupCompany: string) => Promise<void> }) {
  const [areaKey, setAreaKey] = useState(row.areaKey);
  const [alias, setAlias] = useState(row.alias ?? '');
  const [groupCompany, setGroupCompany] = useState(row.groupCompany);
  const changed = areaKey !== row.areaKey || alias !== (row.alias ?? '');
  const operationChanged = groupCompany !== row.groupCompany || row.groupCompanySource !== 'confirmed';
  return (
    <li className={row.isArchived ? 'gso-ui-rowcard gso-ui-rowcard--archived' : 'gso-ui-rowcard'}>
      <div className="gso-ui-rowcard-main">
        <div>
          <strong>{row.label}</strong>
          <p>{row.objectType === 'deal' ? 'Deal · HubSpot' : 'Ticket · HubSpot'} <span aria-hidden="true">·</span> ID {row.pipelineId}</p>
        </div>
        <UiBadge dot tone={row.isArchived ? 'neutral' : row.areaKey === 'a_classificar' ? 'warning' : 'success'}>
          {row.isArchived ? 'Arquivado' : row.areaKey === 'a_classificar' ? 'A classificar' : 'Ativo'}
        </UiBadge>
      </div>
      <div className="gso-ui-rowcard-controls">
        <UiField label="Área">
          <select className="gso-ui-control gso-ui-select" disabled={!canEdit || row.isArchived || busy} value={areaKey} onChange={(event) => setAreaKey(event.target.value as AnalyticsSourceConfig['areaKey'])}>
            {Object.entries(AREA_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
          </select>
        </UiField>
        <UiField label="Operação do grupo">
          <select className="gso-ui-control gso-ui-select" disabled={!canEdit || row.isArchived || busy} value={groupCompany} onChange={(event) => setGroupCompany(event.target.value)}>
            {GROUP_COMPANY_OPTIONS.map((option) => <option key={option} value={option}>{option === 'a_definir' ? 'A decidir' : option}</option>)}
          </select>
          <small>{row.groupCompanySource === 'confirmed' ? 'Confirmada por pessoa autorizada.' : 'Sugestão: confirme antes de publicar o recorte.'}</small>
        </UiField>
        <UiField label={<>Alias interno <small>(opcional)</small></>}>
          <input className="gso-ui-control" disabled={!canEdit || row.isArchived || busy} value={alias} onChange={(event) => setAlias(event.target.value)} placeholder={row.hubspotLabel ?? 'Nome oficial'} />
        </UiField>
        <label className="gso-ui-toggle">
          <span>Usar nos indicadores</span>
          <input type="checkbox" disabled={!canEdit || row.isArchived || busy} checked={row.isActive && !row.isArchived} onChange={(event) => void onSave(row, areaKey, alias, event.target.checked)} />
        </label>
        {canEdit && !row.isArchived ? (
          <UiButton className="gso-ui-rowcard-save" disabled={busy || !changed} icon="check" onClick={() => void onSave(row, areaKey, alias, row.isActive)}>
            Salvar linha
          </UiButton>
        ) : null}
        {canEdit && !row.isArchived ? (
          <UiButton className="gso-ui-rowcard-save" disabled={busy || !operationChanged} icon="check" onClick={() => void onSaveOperation(row, groupCompany)}>
            Confirmar operação
          </UiButton>
        ) : null}
      </div>
      <footer className="gso-ui-rowcard-meta">
        <span>Nome oficial: {row.hubspotLabel ?? 'Indisponível'}</span>
        <span>Última descoberta: {formatDate(row.lastDiscoveredAt)}</span>
        <span>Origem: HubSpot</span>
      </footer>
    </li>
  );
}

export function DashboardSourcesSettingsPage() {
  const { gate } = useAuthContext();
  const canEdit = canManageAnalyticsIntegration(gate.actor);
  const [rows, setRows] = useState<AnalyticsSourceConfig[]>([]);
  const [schedule, setSchedule] = useState<IntegrationSchedule | null>(null);
  const [sourceStatus, setSourceStatus] = useState<AnalyticsSourceStatusPayload | null>(null);
  const [areaFilter, setAreaFilter] = useState<'all' | AnalyticsSourceConfig['areaKey']>('all');
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

  const filteredRows = useMemo(() => areaFilter === 'all' ? rows : rows.filter((row) => row.areaKey === areaFilter), [areaFilter, rows]);
  const groupedRows = useMemo(() => Object.entries(filteredRows.reduce<Record<string, AnalyticsSourceConfig[]>>((groups, row) => { (groups[row.areaKey] ??= []).push(row); return groups; }, {})), [filteredRows]);
  const pendingRows = useMemo(() => rows.filter((row) => !row.isArchived && row.areaKey === 'a_classificar'), [rows]);
  const pendingCount = pendingRows.length;
  const activeCount = rows.filter((row) => row.isActive && !row.isArchived).length;

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
        description="Fontes externas que alimentam o Dashboard Gerencial, com o estado publicado de cada uma e a classificação dos pipelines por área."
        meta={`${rows.length} pipelines no catálogo`}
        title="Fontes do Dashboard"
        titleId="settings-sources-title"
      />

      <UiMetricRow label="Resumo das fontes">
        <UiMetric icon="database" label="Fontes ativas" sub="pipelines compondo indicadores" tone="primary" value={activeCount} />
        <UiMetric
          icon="alert"
          label="Aguardando classificação"
          sub={pendingCount ? 'sem área definida ainda' : 'nenhuma pendência de área'}
          tone={pendingCount ? 'warning' : 'neutral'}
          value={pendingCount}
          valueTone={pendingCount ? 'warning' : undefined}
        />
        <UiMetric
          icon="calendar"
          label="Atualização automática"
          sub={schedule?.enabled ? 'HubSpot e depois OMIE' : 'atualização apenas manual'}
          text
          tone={schedule?.enabled ? 'success' : 'neutral'}
          value={scheduleFrequencyLabel(schedule)}
        />
        <UiMetric
          icon="clock"
          label="Última carga automática"
          sub={schedule?.lastStatus ? `resultado: ${schedule.lastStatus}` : 'sem execução automática registrada'}
          text
          tone="neutral"
          value={formatDate(schedule?.lastRunAt)}
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
                <td colSpan={6}>Estado das fontes indisponível nesta leitura.</td>
              </tr>
            )}
          </tbody>
        </UiTable>
        <p className="gso-ui-card-foot">
          Cada atualização avança a partir do último ponto seguro disponível. Quando a origem não informa esse ponto, o sistema confirma a leitura completa e registra volume, duração e chamadas no Histórico.
        </p>
      </UiCard>

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

      <UiCard labelledBy="schedule-title">
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
            <UiButton className="gso-ui-rowcard-save" disabled={!canEdit || busy} icon="check" onClick={() => void saveSchedule()}>
              Salvar
            </UiButton>
          </div>
        </div>
        {!canEdit ? <p className="gso-ui-note">Seu perfil pode consultar as fontes, mas não pode alterar configurações ou iniciar atualizações.</p> : null}
      </UiCard>

      <UiCard labelledBy="catalog-title">
        <UiCardHeader
          actions={
            <div className="gso-ui-toolbar-field">
              <UiField label="Filtrar área">
                <select className="gso-ui-control gso-ui-select" value={areaFilter} onChange={(event) => setAreaFilter(event.target.value as typeof areaFilter)}>
                  <option value="all">Todas as áreas</option>
                  {Object.entries(AREA_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
                </select>
              </UiField>
            </div>
          }
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
        <details className="gso-ui-disclosure" open={areaFilter !== 'all' || filteredRows.length <= 12}>
          <summary>
            <span>Editar classificação das fontes</span>
            <small>{filteredRows.length} pipelines encontrados</small>
          </summary>
          <div className="gso-ui-groups">
            {groupedRows.map(([areaKey, areaRows]) => (
              <details className="gso-ui-disclosure" key={areaKey} open={areaFilter !== 'all' || areaRows.length <= 8}>
                <summary>
                  <span>{AREA_LABELS[areaKey as AnalyticsSourceConfig['areaKey']] ?? 'A classificar'}</span>
                  <small>{areaRows.length} fontes</small>
                </summary>
                <ul className="gso-ui-rowlist">
                  {areaRows.map((row) => <PipelineRow busy={busy} canEdit={canEdit} key={row.id} onSave={savePipeline} onSaveOperation={savePipelineOperation} row={row} />)}
                </ul>
              </details>
            ))}
          </div>
          {!filteredRows.length ? <UiEmptyState icon="layers" title="Nenhum pipeline nesta área." /> : null}
        </details>
      </UiCard>

      <UiHintBand
        description="“A classificar” significa que o HubSpot trouxe o pipeline, mas ainda não há decisão administrativa segura sobre a área. Esses registros permanecem carregados e ativos, porém não entram silenciosamente nos indicadores de Customer Success, Suporte ou Chat."
        title="Como ler este catálogo"
      />
    </UiPage>
  );
}
