import { useCallback, useEffect, useMemo, useState } from 'react';
import { MinimalState } from '../../components/minimal-states';
import {
  listAnalyticsStageMapping,
  seedAnalyticsStageMapping,
  updateAnalyticsStageMapping,
  type StageMappingRow,
} from '../analytics/analytics-api';
import { UiBadge } from './ui/UiBadge';
import { UiButton } from './ui/UiButton';
import { UiCard } from './ui/UiCard';
import { UiCardHeader } from './ui/UiCardHeader';
import { UiEmptyState } from './ui/UiEmptyState';
import { UiField } from './ui/UiField';
import { UiSearchField } from './ui/UiSearchField';
import { UiTable } from './ui/UiTable';
import { UiToolbar } from './ui/UiToolbar';

export function StageMappingSettings() {
  const [rows, setRows] = useState<StageMappingRow[]>([]);
  const [phase, setPhase] = useState<'loading' | 'ready' | 'error'>('loading');
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [feedback, setFeedback] = useState<string | null>(null);
  const [onlyPending, setOnlyPending] = useState(false);
  const [query, setQuery] = useState('');

  const load = useCallback(async () => {
    setPhase((current) => current === 'ready' ? current : 'loading');
    try {
      setRows(await listAnalyticsStageMapping('ticket'));
      setPhase('ready');
    } catch {
      setPhase('error');
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const pendingTotal = rows.filter((row) => !row.isReviewed).length;
  const visibleRows = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('pt-BR');
    return rows
      .filter((row) => !onlyPending || !row.isReviewed)
      .filter((row) => !normalizedQuery || [row.sourceLabel, row.pipelineLabel, row.canonicalLabel]
        .filter(Boolean)
        .some((value) => String(value).toLocaleLowerCase('pt-BR').includes(normalizedQuery)))
      .slice()
      .sort((left, right) => left.canonicalOrder - right.canonicalOrder || left.pipelineLabel.localeCompare(right.pipelineLabel, 'pt-BR') || (left.sourceLabel ?? '').localeCompare(right.sourceLabel ?? '', 'pt-BR'));
  }, [onlyPending, query, rows]);

  const rename = async (row: StageMappingRow, nextLabel: string) => {
    const key = `${row.pipelineId}:${row.stageId}`;
    setBusyKey(key);
    setFeedback(null);
    try {
      await updateAnalyticsStageMapping({ objectType: 'ticket', pipelineId: row.pipelineId, stageId: row.stageId, canonicalLabel: nextLabel });
      setDraft((current) => ({ ...current, [key]: '' }));
      await load();
      setFeedback(`"${row.sourceLabel ?? 'Etapa sem nome'}" passou a ser contada como "${nextLabel}".`);
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
      await load();
      setFeedback(`Etapas novas incorporadas. ${result.pendingReview} aguardando revisão. Nenhuma decisão anterior foi alterada.`);
    } catch {
      setFeedback('Não foi possível buscar etapas novas agora.');
    } finally {
      setBusyKey(null);
    }
  };

  if (phase === 'loading' && rows.length === 0) {
    return <p className="gso-ui-note" role="status">Carregando mapeamento de etapas…</p>;
  }

  if (phase === 'error' && rows.length === 0) {
    return <MinimalState actions={<UiButton icon="refresh" onClick={() => void load()}>Tentar novamente</UiButton>} tone="critical" title="Mapeamento indisponível" description="Não foi possível consultar as etapas publicadas dos pipelines." />;
  }

  return (
    <UiCard flush labelledBy="stage-mapping-settings-title">
      <UiCardHeader
        description="Revise como cada etapa real dos pipelines é interpretada pelo ConfiOne."
        icon="layers"
        title="Etapas dos pipelines"
        titleId="stage-mapping-settings-title"
        tone="primary"
      />
      <UiToolbar label="Filtros do mapeamento de etapas">
        <UiSearchField aria-label="Buscar etapa ou pipeline" onChange={(event) => setQuery(event.currentTarget.value)} placeholder="Buscar etapa ou pipeline…" value={query} />
        <UiField label="Recorte">
          <label className="gso-ui-check-control">
            <input checked={onlyPending} onChange={(event) => setOnlyPending(event.currentTarget.checked)} type="checkbox" />
            <span>Apenas pendentes {pendingTotal ? `(${pendingTotal})` : ''}</span>
          </label>
        </UiField>
        <UiButton disabled={busyKey === 'seed'} icon="refresh" onClick={() => void reseed()}>
          {busyKey === 'seed' ? 'Sincronizando…' : 'Buscar etapas novas'}
        </UiButton>
      </UiToolbar>
      {feedback ? <p className="gso-ui-alert gso-ui-alert--success" role="status">{feedback}</p> : null}
      {visibleRows.length ? (
        <UiTable labelledBy="stage-mapping-settings-title">
          <thead>
            <tr>
              <th scope="col">Etapa</th>
              <th scope="col">Pipeline</th>
              <th scope="col">Classificação</th>
              <th scope="col">Atendimentos</th>
              <th scope="col">Estado</th>
              <th className="gso-ui-table-actions--head" scope="col">Ação</th>
            </tr>
          </thead>
          <tbody>
            {visibleRows.map((row) => {
              const key = `${row.pipelineId}:${row.stageId}`;
              const value = draft[key] ?? row.canonicalLabel;
              const changed = value.trim() !== row.canonicalLabel;
              return (
                <tr key={key}>
                  <td>
                    <strong>{row.sourceLabel ?? 'Etapa sem nome'}</strong>
                    <small>ID {row.stageId || 'Indisponível'}</small>
                  </td>
                  <td>
                    <strong>{row.pipelineLabel || 'Indisponível'}</strong>
                    <small>{row.pipelineActive ? 'Pipeline ativo' : 'Fora do recorte ativo'}</small>
                  </td>
                  <td>
                    <UiField label="Classificação">
                      <input aria-label={`Classificação de ${row.sourceLabel ?? 'etapa sem nome'}`} className="gso-ui-control" onChange={(event) => setDraft((current) => ({ ...current, [key]: event.currentTarget.value }))} value={value} />
                    </UiField>
                  </td>
                  <td className="gso-ui-table-numeric">{row.ticketCount.toLocaleString('pt-BR')}</td>
                  <td><UiBadge tone={row.isReviewed ? 'success' : 'warning'}>{row.isReviewed ? 'Revisada' : 'Aguardando revisão'}</UiBadge></td>
                  <td>
                    <UiButton compact disabled={!changed || busyKey === key} icon="check" onClick={() => void rename(row, value.trim())}>
                      {busyKey === key ? 'Salvando…' : 'Salvar'}
                    </UiButton>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </UiTable>
      ) : (
        <UiEmptyState description={query ? 'Ajuste a busca ou remova o filtro de pendências.' : 'Nenhuma etapa aguarda revisão neste recorte.'} icon="layers" title="Nenhuma etapa encontrada" />
      )}
    </UiCard>
  );
}
