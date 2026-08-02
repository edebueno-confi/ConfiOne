import { useCallback, useEffect, useMemo, useState } from 'react';
import { MinimalState } from '../../components/minimal-states';
import { listAnalyticsSyncHistory } from '../analytics/analytics-api';
import type { AnalyticsSyncHistoryRow } from '../analytics/analytics-model';

function formatDate(value: string | null) {
  return value ? new Date(value).toLocaleString('pt-BR') : 'Em andamento';
}

function formatDuration(value: number) {
  if (!value) return 'Indisponível';
  const seconds = Math.max(1, Math.round(value / 1000));
  if (seconds < 60) return `${seconds}s`;
  return `${Math.floor(seconds / 60)}min ${seconds % 60}s`;
}

function statusLabel(value: string) {
  return ({
    queued: 'Na fila',
    running: 'Em andamento',
    success: 'Concluída',
    succeeded: 'Concluída',
    partial: 'Parcial',
    failed: 'Falhou',
    error: 'Falhou',
    abandoned: 'Interrompida',
    cancelled: 'Cancelada',
    empty: 'Sem dados',
  } as Record<string, string>)[value] ?? 'Indisponível';
}

function HistoryGroup({ rows }: { rows: AnalyticsSyncHistoryRow[] }) {
  const first = rows[0];
  const hasFailure = rows.some((row) => ['failed', 'error', 'abandoned', 'cancelled'].includes(row.status));
  const status = hasFailure ? 'failed' : rows.some((row) => ['running', 'queued'].includes(row.status)) ? 'running' : rows.some((row) => row.status === 'partial') ? 'partial' : first.status;
  const totalProcessed = rows.reduce((sum, row) => sum + row.processedCount, 0);
  return (
    <li className="gso-settings-history-group">
      <header className="gso-settings-history-summary">
        <div>
          <p className="gso-settings-eyebrow">{first.triggerKind === 'manual' ? 'Ação manual' : 'Atualização automática'}</p>
          <h3>{rows.length > 1 ? 'Ciclo de atualização' : first.sourceLabel}</h3>
          <p>{formatDate(first.startedAt)} · {rows.map((row) => row.sourceLabel).join(' + ')}</p>
        </div>
        <span className={`gso-settings-status gso-settings-status--${status}`}>{statusLabel(status)}</span>
      </header>
      <div className="gso-settings-history-details">
        {rows.map((row) => (
          <div className="gso-settings-history-source" key={`${row.sourceKey}-${row.runId}`}>
            <div><strong>{row.sourceLabel}</strong><span>{statusLabel(row.status)}</span></div>
            <dl>
              <div><dt>Início</dt><dd>{formatDate(row.startedAt)}</dd></div>
              <div><dt>Fim</dt><dd>{formatDate(row.finishedAt)}</dd></div>
              <div><dt>Duração</dt><dd>{formatDuration(row.durationMs)}</dd></div>
              <div><dt>Registros lidos</dt><dd>{row.processedCount || 'Indisponível'}</dd></div>
            </dl>
            {row.errorMessage ? <p className="gso-settings-history-error">{row.errorMessage}</p> : null}
          </div>
        ))}
      </div>
      <footer className="gso-settings-history-footer">{totalProcessed ? `${totalProcessed} registros processados no ciclo.` : 'Quantidade processada indisponível neste ciclo.'}</footer>
    </li>
  );
}

export function SyncHistorySettingsPage() {
  const [rows, setRows] = useState<AnalyticsSyncHistoryRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setRows(await listAnalyticsSyncHistory());
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível carregar o histórico agora.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const groups = useMemo(() => {
    const grouped = new Map<string, AnalyticsSyncHistoryRow[]>();
    for (const row of rows) {
      const key = row.correlationId ?? row.runId;
      grouped.set(key, [...(grouped.get(key) ?? []), row]);
    }
    return [...grouped.values()];
  }, [rows]);

  if (loading && !rows.length) return <MinimalState loading title="Carregando histórico" description="Consultando as atualizações registradas das fontes." />;
  if (error && !rows.length) return <MinimalState tone="critical" title="Não foi possível carregar o histórico" description={error} />;

  return (
    <div className="gso-settings-stack gso-settings-history">
      <section className="gso-settings-source-overview">
        <div>
          <p className="gso-settings-eyebrow">Rastreabilidade</p>
          <h3>Histórico de atualizações</h3>
          <p>Cada ciclo aparece separado por origem, resultado, duração e quantidade processada. Erros são exibidos de forma resumida, sem credenciais ou detalhes internos.</p>
        </div>
        <button className="gso-settings-button gso-settings-button--secondary" type="button" onClick={() => void load()} disabled={loading}>Atualizar histórico</button>
      </section>
      {error ? <p className="gso-settings-inline-error" role="alert">{error}</p> : null}
      {groups.length ? <ol className="gso-settings-history-list">{groups.map((group) => <HistoryGroup key={group[0].correlationId ?? group[0].runId} rows={group} />)}</ol> : <p className="gso-settings-empty">Nenhuma atualização registrada neste ambiente.</p>}
    </div>
  );
}
