import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { MinimalState } from '../../components/minimal-states';
import { GeniusSyncOverlay } from '../../components/GeniusSyncOverlay';
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
  type IntegrationSchedule,
} from '../analytics/analytics-api';
import type { AnalyticsSourceConfig } from '../analytics/analytics-model';
import type { AnalyticsSourceStatusPayload } from '@genius-support-os/contracts';
import { syncProgressLabel } from '../analytics/analytics-sync-progress.mjs';

const CONTROL = 'gso-settings-control w-full rounded-xl border border-[color:var(--minimal-border)] bg-[color:var(--minimal-surface)] px-3 py-2.5 text-sm text-[color:var(--minimal-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--minimal-focus)]';

const AREA_LABELS: Record<AnalyticsSourceConfig['areaKey'], string> = {
  commercial: 'Comercial',
  customer_success: 'Customer Success',
  support: 'Suporte',
  chat: 'Chat',
  a_classificar: 'A classificar',
};

function statusLabel(status: string) {
  return ({ fresh: 'Atualizada', syncing: 'Atualizando', failed: 'Falhou', partial: 'Parcial', stale: 'Desatualizada', never_synced: 'Ainda não atualizada', unavailable: 'Indisponível' } as Record<string, string>)[status] ?? 'Indisponível';
}

function formatDate(value: string | null | undefined) {
  return value ? new Date(value).toLocaleString('pt-BR') : 'Indisponível';
}

function sourceDetail(source: AnalyticsSourceStatusPayload['hubspot']) {
  if (source.status === 'syncing') {
    return source.lastSuccessAt
      ? `Atualização em andamento · último snapshot ${formatDate(source.lastSuccessAt)}`
      : 'Atualização em andamento · ainda não há snapshot publicado.';
  }
  if (source.status === 'failed') {
    return source.lastSuccessAt
      ? `Última tentativa ${formatDate(source.lastFailureAt ?? source.lastAttemptAt)} · snapshot anterior preservado`
      : source.sanitizedError ?? 'A última tentativa falhou e ainda não há snapshot publicado.';
  }
  if (source.lastSuccessAt) return `Último snapshot publicado: ${formatDate(source.lastSuccessAt)}`;
  return source.sanitizedError ?? 'Ainda não há uma atualização concluída.';
}

function PipelineRow({ row, canEdit, busy, onSave }: { row: AnalyticsSourceConfig; canEdit: boolean; busy: boolean; onSave: (row: AnalyticsSourceConfig, areaKey: AnalyticsSourceConfig['areaKey'], alias: string, isActive: boolean) => Promise<void> }) {
  const [areaKey, setAreaKey] = useState(row.areaKey);
  const [alias, setAlias] = useState(row.alias ?? '');
  const changed = areaKey !== row.areaKey || alias !== (row.alias ?? '');
  return (
    <li className={`gso-settings-pipeline-row ${row.isArchived ? 'gso-settings-pipeline-row--archived' : ''}`}>
      <div className="gso-settings-pipeline-main">
        <div>
          <strong>{row.label}</strong>
          <p>{row.objectType === 'deal' ? 'Deal · HubSpot' : 'Ticket · HubSpot'} <span aria-hidden="true">·</span> ID {row.pipelineId}</p>
        </div>
        <span className={`gso-settings-status ${row.isArchived ? 'gso-settings-status--muted' : row.areaKey === 'a_classificar' ? 'gso-settings-status--warning' : 'gso-settings-status--success'}`}>{row.isArchived ? 'Arquivado' : row.areaKey === 'a_classificar' ? 'A classificar' : 'Ativo'}</span>
      </div>
      <div className="gso-settings-pipeline-controls">
        <label className="gso-settings-field">
          <span>Área</span>
          <select className={CONTROL} disabled={!canEdit || row.isArchived || busy} value={areaKey} onChange={(event) => setAreaKey(event.target.value as AnalyticsSourceConfig['areaKey'])}>
            {Object.entries(AREA_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}
          </select>
        </label>
        <label className="gso-settings-field">
          <span>Alias interno <small>(opcional)</small></span>
          <input className={CONTROL} disabled={!canEdit || row.isArchived || busy} value={alias} onChange={(event) => setAlias(event.target.value)} placeholder={row.hubspotLabel ?? 'Nome oficial'} />
        </label>
        <label className="gso-settings-field gso-settings-field--toggle">
          <span>Usar nos indicadores</span>
          <input type="checkbox" disabled={!canEdit || row.isArchived || busy} checked={row.isActive && !row.isArchived} onChange={(event) => void onSave(row, areaKey, alias, event.target.checked)} />
        </label>
        {canEdit && !row.isArchived ? <button className="gso-settings-button gso-settings-button--secondary gso-settings-pipeline-save" type="button" disabled={busy || !changed} onClick={() => void onSave(row, areaKey, alias, row.isActive)}>Salvar linha</button> : null}
      </div>
      <footer className="gso-settings-pipeline-meta">
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
  const pendingCount = rows.filter((row) => !row.isArchived && row.areaKey === 'a_classificar').length;
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

  const saveSchedule = async () => {
    setBusy(true); setError(null); setMessage(null);
    try {
      await setIntegrationSchedule(schedule?.enabled ?? false, schedule?.frequency ?? 'off', false, 'off');
      setMessage('Atualização automática salva.');
      await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível salvar a atualização automática.'); } finally { setBusy(false); }
  };

  const run = async (kind: 'full' | 'hubspot' | 'omie') => {
    setBusy(true); setSyncingKind(kind); setSyncProgress(kind === 'full' ? 'O Gênio está atualizando HubSpot e OMIE em sequência.' : `O Gênio está atualizando ${kind === 'hubspot' ? 'HubSpot' : 'OMIE'}.`); setError(null); setMessage(null);
    try {
      if (kind === 'full') await triggerSequentialAnalyticsSync();
      if (kind === 'hubspot') await triggerHubspotSync(undefined, { phased: false });
      if (kind === 'omie') await triggerOmieSync();
      const completion = await waitForAnalyticsSyncCompletion(kind);
      setSourceStatus(completion.status);
      await load();
      setMessage(completion.timedOut ? syncProgressLabel(kind, true) : `Atualização ${kind === 'full' ? 'do painel' : kind === 'hubspot' ? 'do HubSpot' : 'do OMIE'} concluída; o estado publicado foi confirmado.`);
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível iniciar a atualização.'); } finally { setBusy(false); setSyncingKind(null); }
  };

  const sourcePills = sourceStatus ? [sourceStatus.hubspot, sourceStatus.omie] : [];
  if (loading && rows.length === 0) return <MinimalState loading title="Carregando fontes do Dashboard" description="Consultando catálogo, atualização automática e estado das conexões." />;
  if (error && rows.length === 0) return <MinimalState tone="critical" title="Não foi possível carregar" description={error} />;

  return (
    <div className="gso-settings-sources gso-settings-stack gso-visual-v1-settings">
      {syncingKind ? <GeniusSyncOverlay source={syncingKind === 'full' ? 'painel' : syncingKind === 'hubspot' ? 'HubSpot' : 'OMIE'} state={syncingKind === 'full' ? 'preparing' : syncingKind === 'hubspot' ? 'syncing_hubspot' : 'syncing_omie'} hasValidSnapshot={syncingKind === 'full' ? Boolean(sourceStatus?.hubspot.hasValidSnapshot && sourceStatus?.omie.hasValidSnapshot) : Boolean(sourceStatus?.[syncingKind]?.hasValidSnapshot)} detail={syncProgress} /> : null}
      <section className="gso-settings-source-overview" aria-labelledby="sources-overview-title">
        <div>
          <p className="gso-settings-eyebrow">Mapa de origem</p>
          <h3 id="sources-overview-title">Dados do Dashboard, com contexto</h3>
          <p>Os indicadores leem o HubSpot para Comercial, Customer Success e Suporte. O Financeiro lê o OMIE. Pipelines novos ficam ativos, mas aguardam classificação antes de compor uma área específica.</p>
        </div>
        <div className="gso-settings-source-summary">
          <strong>{activeCount}</strong><span>fontes ativas</span>
          <strong className={pendingCount ? 'gso-settings-number--warning' : ''}>{pendingCount}</strong><span>aguardando classificação</span>
        </div>
      </section>

      <section className="gso-settings-source-status-grid" aria-label="Estado das fontes">
        {sourcePills.map((source) => <div className="gso-settings-source-status" key={source.key}><span>{source.label}</span><strong>{statusLabel(source.status)}</strong><small>{sourceDetail(source)}</small></div>)}
      </section>

      <section className="gso-settings-card gso-settings-schedule-card" aria-labelledby="schedule-title">
        <div className="gso-settings-card-header"><div><p className="gso-settings-eyebrow">Ritmo de atualização</p><h3 id="schedule-title">Atualização automática do Dashboard</h3><p>O Dashboard atualiza primeiro o HubSpot e, em seguida, os dados financeiros do OMIE.</p></div><button className="gso-settings-button gso-settings-button--primary" type="button" disabled={!canEdit || busy} onClick={() => void run('full')}>Atualizar painel completo</button></div>
        <div className="gso-settings-form-grid gso-settings-schedule-controls">
          <label className="gso-settings-field"><span>Frequência</span><select className={CONTROL} disabled={!canEdit || busy} value={schedule?.frequency ?? 'off'} onChange={(event) => setSchedule((current) => ({ ...(current ?? { enabled: false, frequency: 'off', lastRunAt: null, lastStatus: null, lastMessage: null, hubspotEnabled: false, hubspotFrequency: 'off', hubspotLastRunAt: null, hubspotLastStatus: null, hubspotLastMessage: null }), frequency: event.target.value as IntegrationSchedule['frequency'] }))}><option value="off">Desativada</option><option value="hourly">De hora em hora</option><option value="daily">Diária</option></select></label>
          <label className="gso-settings-field gso-settings-field--toggle"><span>Atualização ativa</span><input type="checkbox" disabled={!canEdit || busy} checked={schedule?.enabled ?? false} onChange={(event) => setSchedule((current) => current ? { ...current, enabled: event.target.checked } : current)} /></label>
          <button className="gso-settings-button gso-settings-button--secondary gso-settings-schedule-save" type="button" disabled={!canEdit || busy} onClick={() => void saveSchedule()}>Salvar</button>
        </div>
        {!canEdit ? <p className="gso-settings-help">Seu perfil pode consultar as fontes, mas não pode alterar configurações ou iniciar atualizações.</p> : null}
      </section>

      <section className="gso-settings-card" aria-labelledby="manual-title">
        <div className="gso-settings-card-header"><div><p className="gso-settings-eyebrow">Ações manuais</p><h3 id="manual-title">Atualizar uma fonte</h3><p>Use uma ação real para atualizar o recorte escolhido e acompanhar o resultado no Histórico.</p></div></div>
        <div className="gso-settings-action-grid"><button className="gso-settings-action-card" type="button" disabled={!canEdit || busy} onClick={() => void run('hubspot')}><strong>Atualizar HubSpot</strong><span>Atualiza clientes, Comercial, Customer Success e Suporte.</span></button><button className="gso-settings-action-card" type="button" disabled={!canEdit || busy} onClick={() => void run('omie')}><strong>Atualizar OMIE</strong><span>Atualiza os dados financeiros e contas a receber.</span></button></div>
      </section>

      <section className="gso-settings-card" aria-labelledby="catalog-title">
        <div className="gso-settings-card-header"><div><p className="gso-settings-eyebrow">Catálogo vivo</p><h3 id="catalog-title">Pipelines usados por área</h3><p>O catálogo é descoberto no HubSpot. O nome oficial permanece visível; o alias é apenas uma ajuda interna.</p></div><label className="gso-settings-field gso-settings-filter"><span>Filtrar área</span><select className={CONTROL} value={areaFilter} onChange={(event) => setAreaFilter(event.target.value as typeof areaFilter)}><option value="all">Todas as áreas</option>{Object.entries(AREA_LABELS).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label></div>
        {message ? <p className="gso-settings-inline-message" role="status">{message} <Link className="font-medium underline" to="/admin/settings/sync-history">Acompanhar no Histórico</Link></p> : null}
        {error ? <p className="gso-settings-inline-error" role="alert">{error}</p> : null}
        <ul className="gso-settings-pipeline-list">{filteredRows.map((row) => <PipelineRow busy={busy} canEdit={canEdit} key={row.id} onSave={savePipeline} row={row} />)}</ul>
        {!filteredRows.length ? <p className="gso-settings-empty">Nenhum pipeline nesta área.</p> : null}
      </section>

      <section className="gso-settings-source-note"><strong>Como ler este catálogo</strong><p>“A classificar” significa que o HubSpot trouxe o pipeline, mas ainda não há decisão administrativa segura sobre a área. Esses registros permanecem carregados e ativos, porém não entram silenciosamente nos indicadores de Customer Success, Suporte ou Chat.</p></section>
    </div>
  );
}
