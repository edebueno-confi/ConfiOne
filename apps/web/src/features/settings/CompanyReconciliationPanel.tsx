import { useCallback, useEffect, useMemo, useState } from 'react';
import { buildHubSpotCompanyUrl } from '../../app/runtime-config';
import { MinimalState } from '../../components/minimal-states';
import { decideCompanyReconciliation, getCompanyReconciliationQueue, revokeCompanyReconciliation, type ReconciliationCandidate, type ReconciliationItem, type ReconciliationQueue } from './company-reconciliation-api';
import { UiBadge } from './ui/UiBadge';
import { UiButton } from './ui/UiButton';
import { UiCard } from './ui/UiCard';
import { UiCardHeader } from './ui/UiCardHeader';
import { UiEmptyState } from './ui/UiEmptyState';
import { UiField } from './ui/UiField';
import { UiMetric } from './ui/UiMetric';
import { UiMetricRow } from './ui/UiMetricRow';
import { UiPagination } from './ui/UiPagination';
import { UiSearchField } from './ui/UiSearchField';
import { UiSortHeader } from './ui/UiSortHeader';
import { UiTable } from './ui/UiTable';
import { UiToolbar } from './ui/UiToolbar';
import type { UiSortDirection } from './ui/ui-sort';

const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const reason: Record<string, string> = {
  cnpj_exato: 'CNPJ exato',
  confirmada: 'Confirmação manual',
  identidade_exata: 'Razão social ou nome fantasia exato',
  identidade_similar: 'Nome semelhante',
  nome_exato: 'Nome exato',
  nome_similar: 'Nome parecido',
  sem_classificacao: 'Sem classificação',
};
const PAGE_SIZE_OPTIONS = [25, 50, 100] as const;
type StatusFilter = 'all' | 'pending' | 'confirmed';
type SortKey = 'balance' | 'name';

function matchesQuery(item: ReconciliationItem, query: string) {
  if (!query) return true;
  return [item.sourceName, item.sourceTradeName, item.sourceTaxId]
    .filter(Boolean)
    .some((value) => String(value).toLocaleLowerCase('pt-BR').includes(query));
}

function candidateDecisionTone(decision: ReconciliationCandidate['decision']) {
  return decision === 'confirmed' ? 'success' : decision === 'discarded' ? 'neutral' : 'primary';
}

export function CompanyReconciliationPanel() {
  const [queue, setQueue] = useState<ReconciliationQueue | null>(null);
  const [phase, setPhase] = useState<'loading' | 'ready' | 'error'>('loading');
  const [sourceKey, setSourceKey] = useState<string | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [evidence, setEvidence] = useState('');
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [sortKey, setSortKey] = useState<SortKey>('balance');
  const [sortDirection, setSortDirection] = useState<UiSortDirection>('desc');
  const [page, setPage] = useState(1);
  const [perPage, setPerPage] = useState<number>(PAGE_SIZE_OPTIONS[0]);

  const load = useCallback(async (nextPage: number, nextPerPage: number) => {
    setPhase('loading');
    setError(null);
    try {
      const next = await getCompanyReconciliationQueue({ limit: nextPerPage, offset: (nextPage - 1) * nextPerPage });
      setQueue(next);
      setSourceKey((current) => current && next.items.some((item) => item.sourceKey === current) ? current : next.items[0]?.sourceKey ?? null);
      setPhase('ready');
    } catch (cause) {
      setPhase('error');
      setError(cause instanceof Error ? cause.message : 'Não foi possível carregar a conciliação.');
    }
  }, []);

  useEffect(() => { void load(page, perPage); }, [load, page, perPage]);

  const item = useMemo(() => queue?.items.find((entry) => entry.sourceKey === sourceKey) ?? null, [queue, sourceKey]);
  const candidate = item?.candidates.find((entry) => entry.companyId === companyId) ?? null;

  useEffect(() => {
    setCompanyId(item?.candidates.find((entry) => entry.decision === 'confirmed')?.companyId ?? null);
    setEvidence('');
    setError(null);
  }, [item?.sourceKey]);

  const visibleItems = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase('pt-BR');
    return [...(queue?.items ?? [])]
      .filter((entry) => statusFilter === 'all' || entry.status === statusFilter)
      .filter((entry) => matchesQuery(entry, normalizedQuery))
      .sort((left, right) => {
        const comparison = sortKey === 'name'
          ? left.sourceName.localeCompare(right.sourceName, 'pt-BR')
          : left.totalBalance - right.totalBalance;
        return sortDirection === 'asc' ? comparison : -comparison;
      });
  }, [query, queue?.items, sortDirection, sortKey, statusFilter]);

  const totalForFilter = statusFilter === 'pending' ? queue?.summary.pending ?? 0 : statusFilter === 'confirmed' ? queue?.summary.confirmed ?? 0 : queue?.summary.total ?? 0;

  function sortBy(nextKey: SortKey) {
    if (sortKey === nextKey) setSortDirection((current) => current === 'desc' ? 'asc' : 'desc');
    else { setSortKey(nextKey); setSortDirection(nextKey === 'balance' ? 'desc' : 'asc'); }
  }

  async function save(decision: 'confirmed' | 'discarded' | 'revoked') {
    if (!item || !evidence.trim() || (decision !== 'revoked' && !candidate)) {
      setError('Selecione uma candidata e informe a evidência usada na decisão.');
      return;
    }
    setSaving(decision);
    setError(null);
    try {
      if (decision === 'revoked') await revokeCompanyReconciliation(item.sourceKey, evidence);
      else await decideCompanyReconciliation({ sourceKey: item.sourceKey, sourceName: item.sourceName, sourceTaxId: item.sourceTaxId, companyId: candidate!.companyId, decision, evidence });
      await load(page, perPage);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível salvar a decisão.');
    } finally { setSaving(null); }
  }

  if (phase === 'loading' && !queue) return <MinimalState loading title="Carregando conciliação" description="Consultando a fila de identidades financeiras." />;
  if (phase === 'error' && !queue) return <MinimalState tone="critical" title="Conciliação indisponível" description={error ?? 'Não foi possível carregar a fila.'} />;
  if (!queue) return null;

  return (
    <section aria-label="Conciliação HubSpot e OMIE" className="gso-ui-stack gso-reconciliation-stack">
      <UiMetricRow label="Resumo da conciliação">
        <UiMetric icon="database" label="Total de identidades" value={queue.summary.total} />
        <UiMetric icon="check" label="Confirmadas" tone="success" value={queue.summary.confirmed} valueTone="success" />
        <UiMetric icon="alert" label="Pendentes" tone="warning" value={queue.summary.pending} valueTone="warning" />
      </UiMetricRow>

      <UiToolbar label="Filtros da conciliação">
        <UiSearchField aria-label="Buscar por razão social, nome fantasia ou CNPJ" onChange={(event) => setQuery(event.currentTarget.value)} placeholder="Buscar por razão social, nome fantasia ou CNPJ…" value={query} />
        <UiField label="Situação">
          <select className="gso-ui-control gso-ui-select" onChange={(event) => { setStatusFilter(event.currentTarget.value as StatusFilter); setPage(1); }} value={statusFilter}>
            <option value="all">Todas</option>
            <option value="pending">Pendentes</option>
            <option value="confirmed">Confirmadas</option>
          </select>
        </UiField>
        <UiField label="Ordenar por">
          <select className="gso-ui-control gso-ui-select" onChange={(event) => { const next = event.currentTarget.value as SortKey; setSortKey(next); setSortDirection(next === 'balance' ? 'desc' : 'asc'); }} value={sortKey}>
            <option value="balance">Saldo em aberto</option>
            <option value="name">Nome</option>
          </select>
        </UiField>
      </UiToolbar>

      <p className="gso-ui-reconciliation-callout" role="note"><strong>Sugestão não é vínculo.</strong> A correspondência só será registrada após uma decisão humana com evidência.</p>

      {visibleItems.length ? (
        <div className="gso-ui-split gso-ui-split--wide-detail gso-reconciliation-split">
          <UiCard flush labelledBy="reconciliation-queue-title">
            <aside className="gso-ui-aside" aria-label="Fila de identidades financeiras">
              <UiCardHeader actions={<UiSortHeader direction={sortKey === 'balance' ? sortDirection : null} label="Saldo em aberto" onSort={() => sortBy('balance')} />} description={`${totalForFilter} identidades no recorte`} icon="list" title="Fila" titleId="reconciliation-queue-title" tone="primary" />
              <ul className="gso-ui-reconciliation-list">
                {visibleItems.map((entry) => (
                  <li key={entry.sourceKey}>
                    <button aria-pressed={entry.sourceKey === item?.sourceKey} className={`gso-ui-reconciliation-item${entry.sourceKey === item?.sourceKey ? ' is-selected' : ''}`} onClick={() => setSourceKey(entry.sourceKey)} type="button">
                      <strong>{entry.sourceName}</strong>
                      {entry.sourceTradeName ? <small>{entry.sourceTradeName}</small> : null}
                      <small>{entry.sourceTaxId ? `CNPJ: ${entry.sourceTaxId}` : 'CNPJ não informado'}</small>
                      <span>{entry.titleCount} títulos · {money.format(entry.totalBalance)}</span>
                      <UiBadge tone={entry.status === 'confirmed' ? 'success' : 'warning'}>{entry.status === 'confirmed' ? 'Confirmada' : 'Pendente'}</UiBadge>
                    </button>
                  </li>
                ))}
              </ul>
            </aside>
          </UiCard>

          {item ? <Comparison item={item} candidate={candidate} choose={setCompanyId} /> : <UiEmptyState title="Selecione uma identidade" />}

          <Decision item={item} candidate={candidate} evidence={evidence} error={error} saving={saving} setEvidence={setEvidence} save={save} />
        </div>
      ) : (
        <UiCard><UiEmptyState description="Nenhuma identidade corresponde ao recorte atual." icon="search" title="Nenhum resultado" /></UiCard>
      )}

      <UiPagination noun="identidade" nounPlural="identidades" onPageChange={(next) => setPage(next)} onPerPageChange={(next) => { setPerPage(next); setPage(1); }} page={page} perPage={perPage} perPageOptions={PAGE_SIZE_OPTIONS} total={totalForFilter} />
      {phase === 'error' && queue ? <p className="gso-ui-alert gso-ui-alert--error" role="alert">{error}</p> : null}
    </section>
  );
}

function Comparison({ item, candidate, choose }: { item: ReconciliationItem; candidate: ReconciliationCandidate | null; choose: (companyId: string) => void }) {
  const sourceFields = [
    ['Razão social', item.sourceName],
    ['Nome fantasia', item.sourceTradeName ?? 'Indisponível'],
    ['CNPJ', item.sourceTaxId ?? 'Indisponível'],
    ['Títulos', item.titleCount.toLocaleString('pt-BR')],
    ['Saldo em aberto', money.format(item.totalBalance)],
  ];
  return (
    <UiCard flush labelledBy="reconciliation-comparison-title">
      <UiCardHeader description="Compare a identidade financeira com as empresas sugeridas." icon="layers" title="Comparação" titleId="reconciliation-comparison-title" tone="neutral" />
      <div className="gso-ui-card-body">
        <dl className="gso-ui-reconciliation-source">
          {sourceFields.map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}
        </dl>
        <div className="gso-ui-reconciliation-candidates">
          <div className="gso-ui-section-heading"><div><h4>Candidatas no HubSpot</h4><p>Escolha uma candidata para revisar; foco não significa confirmação.</p></div></div>
          {item.candidates.length ? (
            <UiTable labelledBy="reconciliation-candidates-title">
              <thead><tr><th scope="col">Empresa</th><th scope="col">Score</th><th scope="col">Decisão atual</th></tr></thead>
              <tbody>
                {item.candidates.map((entry) => (
                  <tr className={candidate?.companyId === entry.companyId ? 'is-selected' : undefined} key={entry.companyId}>
                    <td><label className="gso-ui-reconciliation-candidate"><input checked={candidate?.companyId === entry.companyId} name="reconciliation-candidate" onChange={() => choose(entry.companyId)} type="radio" /><span><strong>{entry.companyName}</strong><small>{entry.taxId ? `CNPJ: ${entry.taxId}` : 'CNPJ não informado'} · {reason[entry.reason] ?? entry.reason}</small>{buildHubSpotCompanyUrl(entry.companyId) ? <a className="gso-ui-link" href={buildHubSpotCompanyUrl(entry.companyId) ?? undefined} rel="noreferrer" target="_blank">Abrir no HubSpot</a> : null}</span></label></td>
                    <td className="gso-ui-table-numeric">{entry.score === null ? 'Indisponível' : `${(entry.score * 100).toFixed(0)}%`}</td>
                    <td><UiBadge tone={candidateDecisionTone(entry.decision)}>{entry.decision === 'confirmed' ? 'Confirmada' : entry.decision === 'discarded' ? 'Descartada' : 'Sugestão'}</UiBadge></td>
                  </tr>
                ))}
              </tbody>
            </UiTable>
          ) : <UiEmptyState icon="search" title="Nenhuma candidata suficiente" />}
        </div>
      </div>
    </UiCard>
  );
}

function Decision({ item, candidate, evidence, error, saving, setEvidence, save }: { item: ReconciliationItem | null; candidate: ReconciliationCandidate | null; evidence: string; error: string | null; saving: string | null; setEvidence: (value: string) => void; save: (decision: 'confirmed' | 'discarded' | 'revoked') => Promise<void> }) {
  return (
    <UiCard labelledBy="reconciliation-decision-title">
      <UiCardHeader description="A decisão fica registrada com autoria e evidência." icon="check" title="Decisão" titleId="reconciliation-decision-title" tone="primary" />
      <div className="gso-ui-card-body gso-ui-decision-body">
        <p className="gso-ui-reconciliation-callout"><strong>Sugestão não é vínculo.</strong> Nenhuma candidata é confirmada automaticamente.</p>
        <div className="gso-ui-selected-candidate">
          <span>Candidata selecionada</span>
          <strong>{candidate?.companyName ?? 'Nenhuma candidata selecionada'}</strong>
          <small>{candidate?.taxId ? `CNPJ: ${candidate.taxId}` : 'Selecione uma candidata na comparação.'}</small>
          {candidate && buildHubSpotCompanyUrl(candidate.companyId) ? <a className="gso-ui-link" href={buildHubSpotCompanyUrl(candidate.companyId) ?? undefined} rel="noreferrer" target="_blank">Abrir empresa no HubSpot</a> : null}
          {candidate && candidate.score !== null ? <small>Score: {(candidate.score * 100).toFixed(0)}% · {reason[candidate.reason] ?? candidate.reason}</small> : null}
        </div>
        <UiField label="Evidência da decisão" hint="Obrigatória para registrar qualquer decisão." wide>
          <textarea aria-label="Evidência da decisão" className="gso-ui-control gso-ui-textarea" onChange={(event) => setEvidence(event.currentTarget.value)} placeholder="Registre o motivo e a evidência utilizada para esta decisão." rows={5} value={evidence} />
        </UiField>
        {error ? <p className="gso-ui-alert gso-ui-alert--error" role="alert">{error}</p> : null}
        <div className="gso-ui-decision-actions">
          {item?.status === 'confirmed' ? <UiButton disabled={saving !== null || !evidence.trim()} icon="link" onClick={() => void save('revoked')} variant="danger">{saving === 'revoked' ? 'Desfazendo…' : 'Desfazer vínculo'}</UiButton> : <>
            <UiButton disabled={saving !== null || !candidate || !evidence.trim()} icon="check" onClick={() => void save('confirmed')} variant="primary">{saving === 'confirmed' ? 'Confirmando…' : 'Confirmar vínculo'}</UiButton>
            <UiButton disabled={saving !== null || !candidate || !evidence.trim()} onClick={() => void save('discarded')} variant="danger">{saving === 'discarded' ? 'Descartando…' : 'Descartar sugestão'}</UiButton>
          </>}
        </div>
      </div>
    </UiCard>
  );
}
