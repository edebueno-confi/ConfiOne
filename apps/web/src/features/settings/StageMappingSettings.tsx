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

interface StageMappingGroup {
  key: string;
  rows: StageMappingRow[];
  representative: StageMappingRow;
  duplicateCount: number;
  ticketCount: number;
  isReviewed: boolean;
}

function normalizeStageText(value: string | null) {
  return (value ?? '').trim().replace(/\s+/g, ' ').toLocaleLowerCase('pt-BR');
}

export function StageMappingSettings() {
  const [rows, setRows] = useState<StageMappingRow[]>([]);
  const [phase, setPhase] = useState<'loading' | 'ready' | 'error'>('loading');
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [draft, setDraft] = useState<Record<string, string>>({});
  const [editingKeys, setEditingKeys] = useState<Set<string>>(new Set());
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

  const groupedRows = useMemo<StageMappingGroup[]>(() => {
    const groups = new Map<string, StageMappingRow[]>();
    for (const row of rows) {
      // Duas IDs distintas podem representar a mesma etapa nominal no HubSpot.
      // Agrupar só a leitura evita ruído sem apagar a identidade de cada etapa.
      const key = [row.pipelineId, normalizeStageText(row.sourceLabel), row.canonicalKey].join(':');
      groups.set(key, [...(groups.get(key) ?? []), row]);
    }
    return [...groups.entries()].map(([key, groupRows]) => ({
      key,
      rows: groupRows,
      representative: groupRows[0],
      duplicateCount: groupRows.length,
      ticketCount: groupRows.reduce((sum, row) => sum + row.ticketCount, 0),
      isReviewed: groupRows.every((row) => row.isReviewed),
    }));
  }, [rows]);

  const pendingTotal = groupedRows.filter((group) => !group.isReviewed).length;
  const visibleRows = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('pt-BR');
    return groupedRows
      .filter((group) => !onlyPending || !group.isReviewed)
      .filter((group) => !normalizedQuery || group.rows.some((row) => [row.sourceLabel, row.pipelineLabel, row.canonicalLabel]
        .filter(Boolean)
        .some((value) => String(value).toLocaleLowerCase('pt-BR').includes(normalizedQuery))))
      .slice()
      .sort((left, right) => left.representative.canonicalOrder - right.representative.canonicalOrder
        || left.representative.pipelineLabel.localeCompare(right.representative.pipelineLabel, 'pt-BR')
        || (left.representative.sourceLabel ?? '').localeCompare(right.representative.sourceLabel ?? '', 'pt-BR'));
  }, [groupedRows, onlyPending, query]);

  const saveGroup = async (group: StageMappingGroup, nextLabel: string) => {
    const key = group.key;
    setBusyKey(key);
    setFeedback(null);
    try {
      // Uma decisão nominal deve valer para todas as IDs que o HubSpot publicou
      // com o mesmo pipeline, rótulo e classificação atual.
      for (const row of group.rows) {
        await updateAnalyticsStageMapping({ objectType: 'ticket', pipelineId: row.pipelineId, stageId: row.stageId, canonicalLabel: nextLabel });
      }
      setDraft((current) => ({ ...current, [key]: '' }));
      setEditingKeys((current) => {
        const next = new Set(current);
        next.delete(key);
        return next;
      });
      await load();
      setFeedback(group.duplicateCount > 1
        ? `As ${group.duplicateCount} etapas "${group.representative.sourceLabel ?? 'sem nome'}" foram confirmadas como "${nextLabel}".`
        : `"${group.representative.sourceLabel ?? 'Etapa sem nome'}" foi confirmada como "${nextLabel}".`);
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
        description="Revise como cada etapa real dos pipelines é interpretada pelo ConfiOne. Etapas com o mesmo nome são agrupadas sem perder suas IDs de origem."
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
        <UiTable className="gso-ui-table--stages" labelledBy="stage-mapping-settings-title">
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
            {visibleRows.map((group) => {
              const row = group.representative;
              const value = draft[group.key] ?? row.canonicalLabel;
              const changed = value.trim() !== row.canonicalLabel;
              const needsReview = !group.isReviewed;
              const editing = editingKeys.has(group.key);
              return (
                <tr key={group.key}>
                  <td>
                    <strong>{row.sourceLabel ?? 'Etapa sem nome'}</strong>
                    <small>{group.duplicateCount > 1 ? `${group.duplicateCount} IDs HubSpot · ` : ''}ID {row.stageId || 'Indisponível'}</small>
                  </td>
                  <td>
                    <strong>{row.pipelineLabel || 'Indisponível'}</strong>
                    <small>{row.pipelineActive ? 'Pipeline ativo' : 'Fora do recorte ativo'}</small>
                  </td>
                  <td>
                    {editing ? (
                      <UiField label="Classificação">
                        <input aria-label={`Classificação de ${row.sourceLabel ?? 'etapa sem nome'}`} className="gso-ui-control" onChange={(event) => setDraft((current) => ({ ...current, [group.key]: event.currentTarget.value }))} value={value} />
                      </UiField>
                    ) : <span className="gso-ui-read-value">{row.canonicalLabel}</span>}
                  </td>
                  <td className="gso-ui-table-numeric">{group.ticketCount.toLocaleString('pt-BR')}</td>
                  <td><UiBadge tone={group.isReviewed ? 'success' : 'warning'}>{group.isReviewed ? 'Revisada' : 'Aguardando revisão'}</UiBadge></td>
                  <td>
                    <div className="gso-ui-table-actions">
                      {editing ? <>
                        <UiButton compact disabled={!changed || busyKey === group.key} icon="check" onClick={() => void saveGroup(group, value.trim())}>
                          {busyKey === group.key ? 'Salvando…' : 'Salvar'}
                        </UiButton>
                        <UiButton compact disabled={busyKey === group.key} onClick={() => { setDraft((current) => ({ ...current, [group.key]: row.canonicalLabel })); setEditingKeys((current) => { const next = new Set(current); next.delete(group.key); return next; }); }}>Cancelar</UiButton>
                      </> : <>
                        {needsReview ? <UiButton compact disabled={busyKey === group.key} icon="check" onClick={() => void saveGroup(group, row.canonicalLabel)}>
                          {busyKey === group.key ? 'Confirmando…' : 'Confirmar revisão'}
                        </UiButton> : null}
                        <UiButton compact disabled={busyKey === group.key} onClick={() => { setDraft((current) => ({ ...current, [group.key]: row.canonicalLabel })); setEditingKeys((current) => new Set(current).add(group.key)); }}>Editar</UiButton>
                      </>}
                    </div>
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
