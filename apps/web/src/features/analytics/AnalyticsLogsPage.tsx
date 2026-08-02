import { useCallback, useEffect, useState } from 'react';
import { MinimalState } from '../../components/minimal-states';
import { formatDateTime } from '../../app/format';
import { listHubspotSyncRuns, listOmieSyncRuns } from './analytics-api';
import type { OmieSyncRun, SyncRun } from './analytics-model';

type StatusFilter = 'all' | 'success' | 'partial' | 'error' | 'running';

function matchesHubspot(run: SyncRun, filter: StatusFilter) {
  if (filter === 'all') return true;
  if (filter === 'success') return run.status === 'success' || run.status === 'succeeded';
  if (filter === 'partial') return run.status === 'partial';
  if (filter === 'error') return run.status === 'error' || run.status === 'failed' || run.status === 'abandoned';
  return run.status === 'queued' || run.status === 'running';
}

function matchesOmie(run: OmieSyncRun, filter: StatusFilter) {
  if (filter === 'all') return true;
  if (filter === 'success') return run.status === 'completed';
  if (filter === 'partial') return run.status === 'partial';
  if (filter === 'error') return run.status === 'failed' || run.status === 'abandoned';
  return run.status === 'processing';
}

function statusLabel(status: string) {
  if (status === 'success' || status === 'succeeded' || status === 'completed') return 'Concluída';
  if (status === 'partial') return 'Parcial';
  if (status === 'running' || status === 'queued' || status === 'processing') return 'Em andamento';
  return 'Erro';
}

export function AnalyticsLogsPage() {
  const [state, setState] = useState<{ loading: boolean; hubspot: SyncRun[]; omie: OmieSyncRun[]; error?: string }>({ loading: true, hubspot: [], omie: [] });
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  const load = useCallback(() => {
    setState((current) => ({ ...current, loading: current.hubspot.length === 0 && current.omie.length === 0, error: undefined }));
    Promise.all([listHubspotSyncRuns(), listOmieSyncRuns()])
      .then(([hubspot, omie]) => setState({ loading: false, hubspot, omie }))
      .catch((error) => setState({ loading: false, hubspot: [], omie: [], error: error instanceof Error ? error.message : 'Falha ao carregar os logs.' }));
  }, []);

  useEffect(() => { load(); }, [load]);

  if (state.loading) return <MinimalState loading title="Carregando histórico" description="Consultando as execuções HubSpot e OMIE." />;
  if (state.error) return <MinimalState tone="critical" title="Não foi possível carregar o histórico" description={state.error} />;

  const hubspotRows = state.hubspot.filter((run) => matchesHubspot(run, statusFilter));
  const omieRows = state.omie.filter((run) => matchesOmie(run, statusFilter));

  return <div className="space-y-4">
    <header className="flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="text-sm font-semibold text-[color:var(--minimal-text)]">Histórico de sincronizações</h2>
        <p className="mt-1 text-xs text-[color:var(--minimal-text-secondary)]">Execuções individuais das fontes oficiais. O histórico de planilhas não alimenta nem aparece nesta superfície.</p>
      </div>
      <div className="flex items-center gap-2">
        <label className="text-xs text-[color:var(--minimal-text-secondary)]">Status
          <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as StatusFilter)} className="ml-2 rounded-md border border-[color:var(--minimal-border-strong)] bg-[color:var(--minimal-surface)] px-2 py-1.5 text-xs text-[color:var(--minimal-text)]">
            <option value="all">Todos</option><option value="success">Concluídas</option><option value="partial">Parciais</option><option value="error">Com erro</option><option value="running">Em andamento</option>
          </select>
        </label>
        <button type="button" onClick={load} className="rounded-md border border-[color:var(--minimal-border-strong)] px-2.5 py-1.5 text-xs font-medium text-[color:var(--minimal-text)]">Atualizar</button>
      </div>
    </header>

    <section className="rounded-xl border border-[color:var(--minimal-border)] bg-[color:var(--minimal-surface)] p-4">
      <div className="mb-3"><h3 className="text-sm font-semibold text-[color:var(--minimal-text)]">HubSpot</h3><p className="mt-1 text-xs text-[color:var(--minimal-text-secondary)]">Empresas, Comercial e CS / Suporte.</p></div>
      {hubspotRows.length ? <div className="overflow-x-auto"><table className="w-full min-w-[940px] text-sm"><thead><tr className="border-b border-[color:var(--minimal-border)] text-left text-xs text-[color:var(--minimal-text-tertiary)]"><th className="py-2">Início</th><th className="py-2">Domínio</th><th className="py-2">Status</th><th className="py-2 text-right">Empresas</th><th className="py-2 text-right">Deals</th><th className="py-2 text-right">Tickets</th><th className="py-2 text-right">Owners</th><th className="py-2">Detalhe</th></tr></thead><tbody>{hubspotRows.map((run) => <tr key={run.id} className="border-b border-[color:var(--minimal-border)] last:border-0 align-top"><td className="whitespace-nowrap py-2">{formatDateTime(run.startedAt)}<div className="text-xs text-[color:var(--minimal-text-tertiary)]">{run.finishedAt ? `fim ${formatDateTime(run.finishedAt)}` : 'em andamento'}</div></td><td className="py-2">{run.domainKey || 'todos'}</td><td className="py-2 font-medium">{statusLabel(run.status)}</td><td className="py-2 text-right tabular-nums">{run.companiesSynced}</td><td className="py-2 text-right tabular-nums">{run.dealsSynced}</td><td className="py-2 text-right tabular-nums">{run.ticketsSynced}</td><td className="py-2 text-right tabular-nums">{run.ownersSynced}</td><td className="max-w-[360px] py-2 text-xs text-[color:var(--minimal-text-secondary)]">{run.errorMessage || 'Execução concluída sem erro.'}</td></tr>)}</tbody></table></div> : <p className="text-xs text-[color:var(--minimal-text-tertiary)]">Nenhuma execução HubSpot neste filtro.</p>}
    </section>

    <section className="rounded-xl border border-[color:var(--minimal-border)] bg-[color:var(--minimal-surface)] p-4">
      <div className="mb-3"><h3 className="text-sm font-semibold text-[color:var(--minimal-text)]">OMIE</h3><p className="mt-1 text-xs text-[color:var(--minimal-text-secondary)]">Contas a receber e persistência do read model financeiro.</p></div>
      {omieRows.length ? <div className="overflow-x-auto"><table className="w-full min-w-[820px] text-sm"><thead><tr className="border-b border-[color:var(--minimal-border)] text-left text-xs text-[color:var(--minimal-text-tertiary)]"><th className="py-2">Início</th><th className="py-2">Status</th><th className="py-2 text-right">Recebidos</th><th className="py-2 text-right">Rejeitados</th><th className="py-2 text-right">Total</th><th className="py-2">Detalhe</th></tr></thead><tbody>{omieRows.map((run) => <tr key={run.id} className="border-b border-[color:var(--minimal-border)] last:border-0 align-top"><td className="whitespace-nowrap py-2">{formatDateTime(run.startedAt)}<div className="text-xs text-[color:var(--minimal-text-tertiary)]">{run.finishedAt ? `fim ${formatDateTime(run.finishedAt)}` : 'em andamento'}</div></td><td className="py-2 font-medium">{statusLabel(run.status)}</td><td className="py-2 text-right tabular-nums">{run.acceptedRows.toLocaleString('pt-BR')}</td><td className="py-2 text-right tabular-nums">{run.rejectedRows.toLocaleString('pt-BR')}</td><td className="py-2 text-right tabular-nums">{run.totalRows.toLocaleString('pt-BR')}</td><td className="max-w-[360px] py-2 text-xs text-[color:var(--minimal-text-secondary)]">{run.errorMessage || 'Execução concluída sem erro.'}</td></tr>)}</tbody></table></div> : <p className="text-xs text-[color:var(--minimal-text-tertiary)]">Nenhuma execução OMIE neste filtro.</p>}
    </section>
  </div>;
}
