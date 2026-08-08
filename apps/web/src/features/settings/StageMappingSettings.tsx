import { useEffect, useMemo, useState } from 'react';
import { MinimalState } from '../../components/minimal-states';
import {
  listAnalyticsStageMapping,
  seedAnalyticsStageMapping,
  updateAnalyticsStageMapping,
  type StageMappingRow,
} from '../analytics/analytics-api';

/**
 * Cruzamento de etapas entre pipelines.
 *
 * Cada pipeline nomeia suas etapas do seu jeito. O Dashboard precisa contar
 * "Em tratativa" uma vez só, ainda que três times a chamem de formas
 * diferentes. A regra de agrupamento é simples e visível: **duas etapas com o
 * mesmo nome canônico passam a ser contadas juntas.**
 *
 * A tela é apenas o editor. A decisão vive no banco, porque se morasse aqui
 * cada tela poderia divergir e a duplicidade voltaria.
 */
export function StageMappingSettings() {
  const [rows, setRows] = useState<StageMappingRow[]>([]);
  const [phase, setPhase] = useState<'loading' | 'ready' | 'error'>('loading');
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<string | null>(null);
  const [onlyPending, setOnlyPending] = useState(false);

  const load = () => {
    setPhase((current) => (current === 'ready' ? current : 'loading'));
    void listAnalyticsStageMapping('ticket')
      .then((data) => { setRows(data); setPhase('ready'); })
      .catch(() => setPhase('error'));
  };

  useEffect(() => { load(); }, []);

  /** Agrupa por nome canônico: é assim que o Dashboard vai contar. */
  const groups = useMemo(() => {
    const map = new Map<string, StageMappingRow[]>();
    for (const row of rows) {
      const list = map.get(row.canonicalKey) ?? [];
      list.push(row);
      map.set(row.canonicalKey, list);
    }
    return [...map.entries()]
      .map(([key, items]) => ({
        key,
        label: items[0].canonicalLabel,
        items: items.slice().sort((a, b) => b.ticketCount - a.ticketCount),
        tickets: items.reduce((total, item) => total + item.ticketCount, 0),
        pending: items.filter((item) => !item.isReviewed).length,
      }))
      .filter((group) => (onlyPending ? group.pending > 0 : true))
      .sort((a, b) => b.tickets - a.tickets);
  }, [rows, onlyPending]);

  const pendingTotal = rows.filter((row) => !row.isReviewed).length;

  const rename = async (row: StageMappingRow, nextLabel: string) => {
    const key = `${row.pipelineId}:${row.stageId}`;
    setBusyKey(key);
    setFeedback(null);
    try {
      await updateAnalyticsStageMapping({
        objectType: 'ticket',
        pipelineId: row.pipelineId,
        stageId: row.stageId,
        canonicalLabel: nextLabel,
      });
      setDraft((current) => ({ ...current, [key]: '' }));
      load();
      setFeedback(`"${row.sourceLabel}" passou a ser contada como "${nextLabel}".`);
    } catch {
      setFeedback('Não foi possível salvar a alteração. Tente novamente.');
    } finally {
      setBusyKey(null);
    }
  };

  const reseed = async () => {
    setBusyKey('seed');
    setFeedback(null);
    try {
      const result = await seedAnalyticsStageMapping();
      load();
      setFeedback(`Etapas novas incorporadas. ${result.pendingReview} aguardando revisão. Nenhuma decisão anterior foi alterada.`);
    } catch {
      setFeedback('Não foi possível buscar etapas novas agora.');
    } finally {
      setBusyKey(null);
    }
  };

  if (phase === 'loading') {
    return <p className="text-sm text-[color:var(--minimal-text-secondary)]">Carregando o cruzamento de etapas…</p>;
  }

  if (phase === 'error') {
    return (
      <MinimalState
        tone="critical"
        title="Não foi possível carregar o cruzamento"
        description="A leitura das etapas está indisponível agora."
      />
    );
  }

  return (
    <section className="space-y-4">
      <header className="space-y-1">
        <h3 className="text-sm font-semibold text-[color:var(--minimal-text)]">Cruzamento de etapas</h3>
        <p className="text-xs leading-5 text-[color:var(--minimal-text-secondary)]">
          Cada fila nomeia suas etapas do seu jeito. Aqui você define como o Dashboard conta.
          <strong className="font-semibold"> Duas etapas com o mesmo nome passam a ser contadas juntas.</strong>{' '}
          Etapas parecidas mas escritas diferente já foram unidas automaticamente; nomes realmente distintos
          esperam sua decisão, porque agrupá-los seria adivinhação.
        </p>
      </header>

      <div className="flex flex-wrap items-center gap-3">
        {pendingTotal > 0 ? (
          <label className="inline-flex items-center gap-2 text-xs text-[color:var(--minimal-text-secondary)]">
            <input type="checkbox" checked={onlyPending} onChange={(event) => setOnlyPending(event.target.checked)} />
            Mostrar apenas o que aguarda revisão ({pendingTotal})
          </label>
        ) : (
          <span className="text-xs text-[color:var(--minimal-text-tertiary)]">Todas as etapas já foram revisadas.</span>
        )}
        <button
          type="button"
          onClick={reseed}
          disabled={busyKey === 'seed'}
          className="h-8 rounded-lg border border-[color:var(--minimal-border-strong)] px-3 text-xs font-medium text-[color:var(--minimal-text)] disabled:opacity-60"
        >
          {busyKey === 'seed' ? 'Buscando…' : 'Buscar etapas novas'}
        </button>
      </div>

      {feedback ? (
        <p className="rounded-lg border border-[color:var(--minimal-border)] px-3 py-2 text-xs text-[color:var(--minimal-text-secondary)]" role="status">
          {feedback}
        </p>
      ) : null}

      {groups.length === 0 ? (
        <MinimalState title="Nada a revisar" description="Nenhuma etapa aguarda decisão neste recorte." />
      ) : (
        <div className="space-y-3">
          {groups.map((group) => (
            <article key={group.key} className="rounded-xl border border-[color:var(--minimal-border)]">
              <header className="flex flex-wrap items-baseline justify-between gap-2 border-b border-[color:var(--minimal-border)] px-4 py-2.5">
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[color:var(--minimal-text)]">{group.label}</p>
                  <p className="text-xs text-[color:var(--minimal-text-tertiary)]">
                    {group.items.length === 1
                      ? 'Uma fila usa esta etapa'
                      : `${group.items.length} filas contadas juntas`}
                    {group.pending > 0 ? ` · ${group.pending} aguardando revisão` : null}
                  </p>
                </div>
                <p className="text-xs tabular-nums text-[color:var(--minimal-text-secondary)]">
                  {group.tickets.toLocaleString('pt-BR')} atendimentos
                </p>
              </header>

              <ul className="divide-y divide-[color:var(--minimal-border)]">
                {group.items.map((row) => {
                  const key = `${row.pipelineId}:${row.stageId}`;
                  const value = draft[key] ?? row.canonicalLabel;
                  const changed = value.trim() !== row.canonicalLabel;
                  return (
                    <li key={key} className="flex flex-wrap items-center gap-x-3 gap-y-2 px-4 py-2.5">
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-xs font-medium text-[color:var(--minimal-text)]">
                          {row.sourceLabel ?? 'Etapa sem nome'}
                          {!row.isReviewed ? (
                            <span className="ml-2 text-[10px] font-semibold uppercase tracking-wide text-[color:var(--minimal-warning-text)]">
                              não revisada
                            </span>
                          ) : null}
                        </p>
                        <p className="truncate text-[11px] text-[color:var(--minimal-text-tertiary)]">
                          {row.pipelineLabel}
                          {!row.pipelineActive ? ' · fila fora do recorte' : ''}
                          {' · '}
                          {row.ticketCount.toLocaleString('pt-BR')} atendimentos
                        </p>
                      </div>
                      <input
                        value={value}
                        onChange={(event) => setDraft((current) => ({ ...current, [key]: event.target.value }))}
                        aria-label={`Contar "${row.sourceLabel}" como`}
                        className="h-8 w-full rounded-lg border border-[color:var(--minimal-border-strong)] bg-[color:var(--minimal-surface)] px-2 text-xs text-[color:var(--minimal-text)] sm:w-52"
                      />
                      <button
                        type="button"
                        disabled={!changed || busyKey === key}
                        onClick={() => rename(row, value.trim())}
                        className="h-8 rounded-lg bg-[color:var(--minimal-text)] px-3 text-xs font-medium text-[color:var(--minimal-surface)] disabled:opacity-40"
                      >
                        {busyKey === key ? 'Salvando…' : 'Salvar'}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
