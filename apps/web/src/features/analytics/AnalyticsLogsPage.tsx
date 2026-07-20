import { useCallback, useEffect, useState } from 'react';
import { MinimalState } from '../../components/minimal-states';
import { formatDateTime } from '../../app/format';
import { listHubspotSyncRuns } from './analytics-api';
import type { SyncRun } from './analytics-model';

export function AnalyticsLogsPage() {
  const [state, setState] = useState<{ loading: boolean; rows: SyncRun[]; error?: string }>({ loading: true, rows: [] });
  const [statusFilter, setStatusFilter] = useState<'all' | 'success' | 'error' | 'running'>('all');

  const load = useCallback(() => {
    let cancelled = false;
    setState((current) => ({ ...current, loading: current.rows.length === 0, error: undefined }));
    listHubspotSyncRuns()
      .then((rows) => { if (!cancelled) setState({ loading: false, rows }); })
      .catch((error) => { if (!cancelled) setState({ loading: false, rows: [], error: error instanceof Error ? error.message : 'Falha ao carregar os logs.' }); });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => load(), [load]);

  if (state.loading) return <MinimalState title="Carregando logs" description="Consultando o histórico das integrações gerenciais." />;
  if (state.error) return <MinimalState tone="critical" title="Não foi possível carregar os logs" description={state.error} />;

  const rows = state.rows.filter((run) => statusFilter === 'all' || run.status === statusFilter);
  return <section className="rounded-xl border border-[color:var(--minimal-border)] bg-[color:var(--minimal-surface)] p-4">
    <header className="mb-4 flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-sm font-semibold text-[color:var(--minimal-text)]">Logs de integração</h2><p className="mt-1 text-xs text-[color:var(--minimal-text-secondary)]">Histórico persistido das execuções do sincronizador HubSpot. Falhas de boot podem não gerar uma linha porque ocorrem antes da execução iniciar.</p></div><div className="flex items-center gap-2"><label className="text-xs text-[color:var(--minimal-text-secondary)]">Status<select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value as typeof statusFilter)} className="ml-2 rounded-md border border-[color:var(--minimal-border-strong)] bg-[color:var(--minimal-surface)] px-2 py-1.5 text-xs text-[color:var(--minimal-text)]"><option value="all">Todos</option><option value="success">Concluídas</option><option value="error">Com erro</option><option value="running">Em andamento</option></select></label><button type="button" onClick={() => void load()} className="rounded-md border border-[color:var(--minimal-border-strong)] px-2.5 py-1.5 text-xs font-medium text-[color:var(--minimal-text)]">Atualizar</button></div></header>
    {rows.length ? <div className="overflow-x-auto"><table className="w-full min-w-[940px] text-sm"><thead><tr className="border-b border-[color:var(--minimal-border)] text-left text-xs text-[color:var(--minimal-text-tertiary)]"><th className="py-2">Início</th><th className="py-2">Domínio</th><th className="py-2">Status</th><th className="py-2 text-right">Empresas</th><th className="py-2 text-right">Deals</th><th className="py-2 text-right">Tickets</th><th className="py-2 text-right">Owners</th><th className="py-2 text-right">Estágios</th><th className="py-2">Detalhe</th></tr></thead><tbody>{rows.map((run) => <tr key={run.id} className="border-b border-[color:var(--minimal-border)] last:border-0 align-top"><td className="py-2 whitespace-nowrap">{formatDateTime(run.startedAt)}<div className="text-xs text-[color:var(--minimal-text-tertiary)]">{run.finishedAt ? `fim ${formatDateTime(run.finishedAt)}` : 'em andamento'}</div></td><td className="py-2">{run.domainKey || 'todos'}</td><td className={`py-2 font-medium ${run.status === 'error' ? 'text-[color:var(--color-brand-blue)]' : 'text-[color:var(--minimal-text)]'}`}>{run.status === 'success' ? 'Concluída' : run.status === 'error' ? 'Erro' : 'Em andamento'}</td><td className="py-2 text-right tabular-nums">{run.companiesSynced}</td><td className="py-2 text-right tabular-nums">{run.dealsSynced}</td><td className="py-2 text-right tabular-nums">{run.ticketsSynced}</td><td className="py-2 text-right tabular-nums">{run.ownersSynced}</td><td className="py-2 text-right tabular-nums">{run.stagesSynced}</td><td className="max-w-[360px] py-2 text-xs text-[color:var(--minimal-text-secondary)]">{run.errorMessage || (run.status === 'success' ? 'Execução concluída sem erro.' : 'Aguardando conclusão.')}</td></tr>)}</tbody></table></div> : <MinimalState title="Nenhuma execução registrada" description="Execute uma sincronização do HubSpot para criar o primeiro registro." />}
  </section>;
}
