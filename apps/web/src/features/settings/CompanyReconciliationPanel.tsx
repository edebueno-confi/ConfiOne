import { useCallback, useEffect, useMemo, useState } from 'react';
import { MinimalState } from '../../components/minimal-states';
import { UiIcon } from './ui/UiIcon';
import { UiIconTile } from './ui/UiIconTile';
import {
  decideCompanyReconciliation,
  getCompanyReconciliationQueue,
  revokeCompanyReconciliation,
  type ReconciliationCandidate,
  type ReconciliationConfidence,
  type ReconciliationItem,
  type ReconciliationQueue,
} from './company-reconciliation-api';

const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const reason: Record<string, string> = {
  cnpj_exato: 'CNPJ exato',
  nome_exato: 'Razão social exata',
  nome_fantasia_exato: 'Nome fantasia exato',
  nome_similar: 'Nome parecido',
  sem_classificacao: 'Sem classificação',
};

export function CompanyReconciliationPanel() {
  const [queue, setQueue] = useState<ReconciliationQueue | null>(null);
  const [phase, setPhase] = useState<'loading' | 'ready' | 'error'>('loading');
  const [sourceKey, setSourceKey] = useState<string | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [evidence, setEvidence] = useState('');
  const [listQuery, setListQuery] = useState('');
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setPhase('loading');
    setError(null);
    try {
      const next = await getCompanyReconciliationQueue();
      setQueue(next);
      setSourceKey((current) => current && next.items.some((item) => item.sourceKey === current) ? current : next.items[0]?.sourceKey ?? null);
      setPhase('ready');
    } catch (cause) {
      setPhase('error');
      setError(cause instanceof Error ? cause.message : 'Não foi possível carregar a conciliação.');
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const item = useMemo(() => queue?.items.find((entry) => entry.sourceKey === sourceKey) ?? null, [queue, sourceKey]);
  const candidate = item?.candidates.find((entry) => entry.companyId === companyId)
    ?? item?.candidates.find((entry) => entry.decision === 'confirmed')
    ?? item?.candidates[0]
    ?? null;
  const visibleItems = useMemo(() => {
    const query = listQuery.trim().toLocaleLowerCase('pt-BR');
    if (!queue || !query) return queue?.items ?? [];
    return queue.items.filter((entry) => [entry.sourceName, entry.sourceTradeName, entry.sourceTaxId, entry.omieClientCode]
      .filter(Boolean)
      .some((value) => value!.toLocaleLowerCase('pt-BR').includes(query)));
  }, [listQuery, queue]);

  useEffect(() => {
    setCompanyId(item?.candidates.find((entry) => entry.decision === 'confirmed')?.companyId ?? item?.candidates[0]?.companyId ?? null);
    setEvidence('');
    setError(null);
  }, [item?.sourceKey]);

  async function save(decision: 'confirmed' | 'discarded' | 'revoked') {
    if (!item || !evidence.trim() || (decision !== 'revoked' && (!candidate || item.identityState === 'identity_unavailable'))) {
      setError('Selecione uma candidata válida e informe a evidência usada na decisão.');
      return;
    }
    setSaving(decision);
    setError(null);
    try {
      if (decision === 'revoked') await revokeCompanyReconciliation(item.sourceKey, evidence);
      else await decideCompanyReconciliation({ sourceKey: item.sourceKey, sourceName: item.sourceName, sourceTaxId: item.sourceTaxId, companyId: candidate!.companyId, decision, evidence });
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Não foi possível salvar a decisão.');
    } finally {
      setSaving(null);
    }
  }

  if (phase === 'loading' && !queue) return <p className="px-1 py-4 text-sm text-[color:var(--minimal-text-tertiary)]" role="status" aria-live="polite">Carregando pendências de conciliação…</p>;
  if (phase === 'error' && !queue) return <MinimalState tone="critical" title="Conciliação indisponível" description={error ?? 'Não foi possível carregar a fila.'} />;
  if (!queue || queue.items.length === 0) return <MinimalState tone="neutral" title="Nenhuma identidade financeira disponível" description="Quando houver títulos OMIE com uma identidade conciliável, eles aparecerão aqui. Se a carteira financeira ainda exibir apenas códigos, aguarde um snapshot de clientes OMIE completo." />;

  return (
    <section className="space-y-4" aria-labelledby="reconciliation-panel-title">
      <header className="overflow-hidden rounded-2xl border border-[color:var(--minimal-border)] bg-[color:var(--minimal-surface)] shadow-[var(--minimal-shadow)]">
        <div className="flex flex-wrap items-start justify-between gap-4 border-b border-[color:var(--minimal-border)] p-4 lg:p-5">
          <div className="flex min-w-0 items-start gap-3">
            <UiIconTile icon="link" size="md" tone="primary" />
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.16em] text-[color:var(--minimal-action)]">Governança · vínculo financeiro</p>
              <h3 id="reconciliation-panel-title" className="mt-1 text-lg font-semibold tracking-[-0.02em] text-[color:var(--minimal-text)]">Identifique o cliente OMIE no HubSpot</h3>
              <p className="mt-1 max-w-3xl text-xs leading-5 text-[color:var(--minimal-text-secondary)]">Revise o impacto financeiro, compare os sinais de identidade e registre uma decisão humana antes que o vínculo seja usado operacionalmente.</p>
            </div>
          </div>
          <button type="button" disabled={phase === 'loading'} onClick={() => void load()} className="inline-flex min-h-9 items-center gap-2 rounded-lg border border-[color:var(--minimal-border-strong)] px-3 py-2 text-xs font-semibold text-[color:var(--minimal-text)] transition-colors hover:border-[color:var(--minimal-action)] hover:bg-[color:var(--minimal-surface-muted)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--minimal-focus)] disabled:cursor-wait disabled:opacity-60" aria-label="Atualizar fila de reconciliação">
            <UiIcon name="refresh" size={16} />
            {phase === 'loading' ? 'Atualizando…' : 'Atualizar fila'}
          </button>
        </div>
        <div className="grid grid-cols-2 divide-x divide-y divide-[color:var(--minimal-border)] sm:grid-cols-4 sm:divide-y-0">
          <SummaryMetric label="No recorte" value={queue.summary.total} hint="identidades financeiras" />
          <SummaryMetric label="Pendentes" value={queue.summary.pending} hint="aguardam decisão" tone="warning" />
          <SummaryMetric label="Confirmadas" value={queue.summary.confirmed} hint="vínculos governados" tone="success" />
          <SummaryMetric label="Sem identidade" value={queue.summary.identityUnavailable} hint="sem evidência de origem" tone="warning" />
        </div>
      </header>

      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[color:var(--minimal-action)] bg-[color:var(--minimal-action)]/10 px-4 py-3" role="status" aria-live="polite">
        <div className="flex min-w-0 items-start gap-2 text-xs leading-5 text-[color:var(--minimal-text-secondary)]">
          <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-[color:var(--minimal-action)] shadow-[0_0_0_4px_rgba(45,124,255,0.12)]" aria-hidden="true" />
          <span><strong className="text-[color:var(--minimal-text)]">Sugestão não é vínculo.</strong> A correspondência só será registrada após decisão humana com evidência.</span>
        </div>
        <span className={`shrink-0 rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] ${queue.summary.clientIndexAvailable ? 'border-[color:var(--minimal-success-text)]/40 bg-[color:var(--minimal-success-text)]/10 text-[color:var(--minimal-success-text)]' : 'border-[color:var(--minimal-warning-text)]/40 bg-[color:var(--minimal-warning-surface)] text-[color:var(--minimal-warning-text)]'}`}>
          {queue.summary.clientIndexAvailable ? 'Índice OMIE publicado' : 'Índice OMIE ausente'}
        </span>
      </div>

      <div className="grid items-start gap-3 xl:grid-cols-[minmax(17rem,.78fr)_minmax(28rem,1.35fr)_minmax(21rem,.92fr)]">
        <aside className="min-w-0 overflow-hidden rounded-2xl border border-[color:var(--minimal-border)] bg-[color:var(--minimal-surface)] shadow-[var(--minimal-shadow)]" aria-label="Fila de identidades financeiras">
          <div className="flex items-start justify-between gap-3 border-b border-[color:var(--minimal-border)] p-4">
            <div className="flex min-w-0 items-start gap-3">
              <UiIconTile icon="list" size="sm" tone="neutral" />
              <div className="min-w-0">
                <h4 className="text-sm font-semibold text-[color:var(--minimal-text)]">Fila de reconciliação</h4>
                <p className="mt-0.5 text-[11px] text-[color:var(--minimal-text-tertiary)]">Selecione uma conta para revisar</p>
              </div>
            </div>
            <span className="shrink-0 rounded-full bg-[color:var(--minimal-surface-muted)] px-2 py-1 text-[10px] font-bold tabular-nums text-[color:var(--minimal-text-secondary)]">{queue.summary.pending} pendentes</span>
          </div>
          <div className="border-b border-[color:var(--minimal-border)] p-3">
            <label className="sr-only" htmlFor="reconciliation-search">Buscar cliente ou código OMIE</label>
            <div className="flex items-center gap-2 rounded-lg border border-[color:var(--minimal-border-strong)] bg-[color:var(--minimal-canvas)] px-3 py-2 transition-colors focus-within:border-[color:var(--minimal-action)] focus-within:ring-2 focus-within:ring-[color:var(--minimal-focus)]">
              <UiIcon name="search" size={16} />
              <input id="reconciliation-search" name="reconciliation-search" autoComplete="off" value={listQuery} onChange={(event) => setListQuery(event.target.value)} placeholder="Buscar cliente ou código…" className="min-w-0 flex-1 bg-transparent text-xs text-[color:var(--minimal-text)] outline-none focus-visible:ring-0 placeholder:text-[color:var(--minimal-text-tertiary)]" />
            </div>
          </div>
          <ul className="max-h-[32rem] space-y-1 overflow-y-auto p-2 overscroll-contain">
            {visibleItems.map((entry) => {
              const selected = entry.sourceKey === item?.sourceKey;
              return (
                <li key={entry.sourceKey} className="[contain-intrinsic-size:0_96px] [content-visibility:auto]">
                  <button type="button" onClick={() => setSourceKey(entry.sourceKey)} aria-pressed={selected} className={`group w-full rounded-xl border px-3 py-3 text-left transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--minimal-focus)] ${selected ? 'border-[color:var(--minimal-action)] bg-[color:var(--minimal-action)]/10 shadow-[inset_3px_0_0_var(--minimal-action)]' : 'border-transparent hover:border-[color:var(--minimal-border-hover)] hover:bg-[color:var(--minimal-surface-muted)]'}`}>
                    <div className="flex items-start justify-between gap-3">
                      <span className="min-w-0 truncate text-sm font-semibold text-[color:var(--minimal-text)]">{entry.sourceName}</span>
                      <span className={`mt-1 h-2 w-2 shrink-0 rounded-full ${entry.status === 'confirmed' ? 'bg-[color:var(--minimal-success-text)]' : entry.identityState === 'identity_unavailable' ? 'bg-[color:var(--minimal-warning-text)]' : 'bg-[color:var(--minimal-action)]'}`} aria-hidden="true" />
                    </div>
                    <span className="mt-1 block truncate text-[11px] text-[color:var(--minimal-text-tertiary)]">Código OMIE: {entry.omieClientCode ?? 'indisponível'}</span>
                    <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] tabular-nums text-[color:var(--minimal-text-secondary)]">
                      <span>{entry.titleCount} títulos</span><span aria-hidden="true">·</span><span>{money.format(entry.totalBalance)}</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <span className="text-[10px] font-bold uppercase tracking-[0.1em] text-[color:var(--minimal-text-tertiary)]">{entry.status === 'confirmed' ? 'Confirmado' : entry.identityState === 'identity_unavailable' ? 'Sem identidade' : 'A decidir'}</span>
                      {entry.overdueBalance > 0 ? <span className="text-[10px] font-semibold tabular-nums text-[color:var(--minimal-warning-text)]">vencido {money.format(entry.overdueBalance)}</span> : null}
                    </div>
                  </button>
                </li>
              );
            })}
            {visibleItems.length === 0 ? <li className="p-5 text-center text-xs leading-5 text-[color:var(--minimal-text-secondary)]">Nenhuma identidade corresponde à busca.</li> : null}
          </ul>
          <div className="border-t border-[color:var(--minimal-border)] px-4 py-3 text-[11px] text-[color:var(--minimal-text-tertiary)]">Mostrando {visibleItems.length} de {queue.items.length} identidades</div>
        </aside>

        {item ? <Comparison item={item} candidate={candidate} choose={setCompanyId} /> : <MinimalState tone="neutral" title="Selecione uma identidade" description="Escolha uma conta OMIE na fila para abrir a comparação." />}

        <section className="min-w-0 rounded-2xl border border-[color:var(--minimal-border)] bg-[color:var(--minimal-surface)] p-4 shadow-[var(--minimal-shadow)] lg:sticky lg:top-4">
          <div className="flex items-start gap-3">
            <UiIconTile icon="check" size="sm" tone="success" />
            <div className="min-w-0">
              <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[color:var(--minimal-success-text)]">Ação governada</p>
              <h4 className="mt-1 text-sm font-semibold text-[color:var(--minimal-text)]">Registrar decisão</h4>
              <p className="mt-1 text-xs leading-5 text-[color:var(--minimal-text-secondary)]">A decisão guarda autoria e data, sem escrever em nenhum sistema externo.</p>
            </div>
          </div>

          <div className="mt-4 rounded-xl border border-[color:var(--minimal-border)] bg-[color:var(--minimal-surface-muted)] p-3">
            <div className="flex items-start gap-2">
              <UiIcon name={candidate ? 'link' : 'alert'} size={16} />
              <div className="min-w-0 text-xs leading-5">
                <strong className="block text-[color:var(--minimal-text)]">{candidate ? 'Candidata selecionada' : 'Nenhuma candidata selecionada'}</strong>
                <span className="text-[color:var(--minimal-text-secondary)]">{candidate ? `${candidate.companyName} · ${confidenceLabel(candidate.confidence)}` : item?.identityState === 'identity_unavailable' ? 'O índice OMIE ainda não publicou nome ou CNPJ para sugerir um cliente.' : 'Selecione uma candidata na comparação para habilitar a decisão.'}</span>
              </div>
            </div>
          </div>

          <label className="mt-4 block text-xs font-semibold text-[color:var(--minimal-text)]" htmlFor="reconciliation-evidence">Evidência da decisão</label>
          <textarea id="reconciliation-evidence" name="reconciliation-evidence" value={evidence} onChange={(event) => setEvidence(event.target.value)} rows={4} aria-describedby="reconciliation-evidence-help" placeholder="Ex.: CNPJ conferido no contrato ou confirmação formal do CSM…" className="mt-2 min-h-28 w-full resize-y rounded-lg border border-[color:var(--minimal-border-strong)] bg-[color:var(--minimal-canvas)] px-3 py-2.5 text-sm leading-5 text-[color:var(--minimal-text)] outline-none transition-colors placeholder:text-[color:var(--minimal-text-tertiary)] focus-visible:border-[color:var(--minimal-action)] focus-visible:ring-2 focus-visible:ring-[color:var(--minimal-focus)]" />
          <p id="reconciliation-evidence-help" className="mt-1.5 text-[11px] leading-4 text-[color:var(--minimal-text-tertiary)]">Obrigatória para confirmar, descartar ou desfazer um vínculo.</p>
          {error ? <p className="mt-3 rounded-lg border border-[color:var(--minimal-danger-border)] bg-[color:var(--minimal-danger-surface)] px-3 py-2 text-xs leading-5 text-[color:var(--minimal-danger-text)]" role="alert" aria-live="polite">{error}</p> : null}
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {item?.status === 'confirmed' ? <button type="button" disabled={saving !== null} onClick={() => void save('revoked')} className="min-h-10 rounded-lg border border-[color:var(--minimal-danger-text)] px-3 py-2 text-xs font-semibold text-[color:var(--minimal-danger-text)] transition-colors hover:bg-[color:var(--minimal-danger-surface)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--minimal-focus)] disabled:cursor-not-allowed disabled:opacity-50">{saving === 'revoked' ? 'Desfazendo…' : 'Desfazer vínculo'}</button> : <>
              <button type="button" disabled={saving !== null || !candidate || item?.identityState === 'identity_unavailable'} onClick={() => void save('confirmed')} className="min-h-10 rounded-lg bg-[color:var(--minimal-action)] px-3 py-2 text-xs font-semibold text-[color:var(--minimal-action-ink)] transition-colors hover:bg-[color:var(--minimal-action-hover)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--minimal-focus)] disabled:cursor-not-allowed disabled:opacity-50">{saving === 'confirmed' ? 'Confirmando…' : 'Confirmar vínculo'}</button>
              <button type="button" disabled={saving !== null || !candidate || item?.identityState === 'identity_unavailable'} onClick={() => void save('discarded')} className="min-h-10 rounded-lg border border-[color:var(--minimal-border-strong)] px-3 py-2 text-xs font-semibold text-[color:var(--minimal-text-secondary)] transition-colors hover:border-[color:var(--minimal-danger-text)] hover:bg-[color:var(--minimal-danger-surface)] hover:text-[color:var(--minimal-danger-text)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--minimal-focus)] disabled:cursor-not-allowed disabled:opacity-50">{saving === 'discarded' ? 'Descartando…' : 'Descartar sugestão'}</button>
            </>}
          </div>
          {item?.identityState === 'identity_unavailable' ? <p className="mt-3 border-l-2 border-[color:var(--minimal-warning-text)] pl-3 text-xs leading-5 text-[color:var(--minimal-warning-text)]">O código OMIE ainda não trouxe nome nem CNPJ. Corrija a identidade na origem ou aguarde novo enriquecimento; não é seguro sugerir uma empresa do HubSpot.</p> : null}
        </section>
      </div>
    </section>
  );
}

function SummaryMetric({ label, value, hint, tone = 'neutral' }: { label: string; value: number; hint: string; tone?: 'neutral' | 'success' | 'warning' }) {
  const valueClass = tone === 'success' ? 'text-[color:var(--minimal-success-text)]' : tone === 'warning' ? 'text-[color:var(--minimal-warning-text)]' : 'text-[color:var(--minimal-text)]';
  return (
    <div className="min-w-0 px-4 py-3.5 lg:px-5">
      <p className="truncate text-[10px] font-bold uppercase tracking-[0.12em] text-[color:var(--minimal-text-tertiary)]">{label}</p>
      <p className={`mt-1 text-xl font-semibold tabular-nums tracking-[-0.03em] ${valueClass}`}>{value.toLocaleString('pt-BR')}</p>
      <p className="mt-0.5 truncate text-[11px] text-[color:var(--minimal-text-tertiary)]">{hint}</p>
    </div>
  );
}

function Comparison({ item, candidate, choose }: { item: ReconciliationItem; candidate: ReconciliationCandidate | null; choose: (companyId: string) => void }) {
  const hasCandidates = item.candidates.length > 0;
  return (
    <section className="min-w-0 overflow-hidden rounded-2xl border border-[color:var(--minimal-border)] bg-[color:var(--minimal-surface)] shadow-[var(--minimal-shadow)]" aria-labelledby="reconciliation-comparison-title">
      <div className="flex flex-wrap items-start justify-between gap-3 border-b border-[color:var(--minimal-border)] p-4 lg:p-5">
        <div className="flex min-w-0 items-start gap-3">
          <UiIconTile icon="layers" size="sm" tone="primary" />
          <div className="min-w-0">
            <p className="text-[10px] font-bold uppercase tracking-[0.14em] text-[color:var(--minimal-action)]">Evidência cruzada</p>
            <h4 id="reconciliation-comparison-title" className="mt-1 text-sm font-semibold text-[color:var(--minimal-text)]">Comparar cadastros</h4>
            <p className="mt-1 text-xs leading-5 text-[color:var(--minimal-text-secondary)]">Compare a identidade financeira com as empresas sugeridas.</p>
          </div>
        </div>
        <span className={`rounded-full border px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.1em] ${hasCandidates ? 'border-[color:var(--minimal-action)]/40 bg-[color:var(--minimal-action)]/10 text-[color:var(--minimal-action)]' : 'border-[color:var(--minimal-warning-text)]/40 bg-[color:var(--minimal-warning-surface)] text-[color:var(--minimal-warning-text)]'}`}>{hasCandidates ? `${item.candidates.length} candidata${item.candidates.length > 1 ? 's' : ''}` : 'Sem sugestão segura'}</span>
      </div>

      <div className="grid gap-3 p-4 lg:grid-cols-2 lg:p-5">
        <IdentityCard eyebrow="Origem · OMIE" title={item.sourceName} tone="primary">
          <IdentityRow label="Código OMIE" value={item.omieClientCode ?? 'Indisponível'} mono />
          <IdentityRow label="CNPJ" value={item.sourceTaxId ?? 'Não informado'} />
          <IdentityRow label="Títulos" value={item.titleCount.toLocaleString('pt-BR')} mono />
          <IdentityRow label="Saldo aberto" value={money.format(item.totalBalance)} mono strong />
          <IdentityRow label="Valor vencido" value={money.format(item.overdueBalance)} mono tone={item.overdueBalance > 0 ? 'warning' : 'neutral'} strong />
          {item.sourceTradeName ? <IdentityRow label="Nome fantasia" value={item.sourceTradeName} /> : null}
        </IdentityCard>
        <IdentityCard eyebrow="Destino · HubSpot" title={candidate?.companyName ?? 'Nenhuma candidata'} tone={candidate ? 'success' : 'neutral'}>
          <IdentityRow label="CNPJ" value={candidate?.taxId ?? 'Não informado'} />
          <IdentityRow label="CSM ID / owner" value={candidate?.ownerId ?? 'Indisponível'} mono />
          <IdentityRow label="Status CS" value={candidate?.clientStatus ?? 'Indisponível'} />
          <IdentityRow label="MRR" value={candidate?.mrr !== null && candidate?.mrr !== undefined ? money.format(candidate.mrr) : 'Indisponível'} mono strong />
          <IdentityRow label="Confiança" value={candidate ? confidenceLabel(candidate.confidence) : 'Aguardando sinais'} tone={candidate ? 'success' : 'neutral'} />
        </IdentityCard>
      </div>

      <div className="border-t border-[color:var(--minimal-border)] p-4 lg:p-5">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h5 className="text-sm font-semibold text-[color:var(--minimal-text)]">Candidatas do HubSpot</h5>
            <p className="mt-1 text-xs text-[color:var(--minimal-text-secondary)]">Escolha uma candidata para revisar; o foco não significa confirmação.</p>
          </div>
          {hasCandidates ? <span className="text-[11px] text-[color:var(--minimal-text-tertiary)]">Ordenadas por confiança</span> : null}
        </div>
        <div className="mt-3 space-y-2">
          {!hasCandidates ? (
            <div className="flex items-start gap-3 rounded-xl border border-dashed border-[color:var(--minimal-warning-border)] bg-[color:var(--minimal-warning-surface)] p-4">
              <UiIconTile icon="search" size="sm" tone="warning" />
              <div className="min-w-0 text-xs leading-5">
                <strong className="block text-[color:var(--minimal-text)]">Nenhuma candidata suficiente</strong>
                <span className="text-[color:var(--minimal-text-secondary)]">O sistema preserva o código OMIE e o impacto financeiro, mas não cria correspondência sem nome, CNPJ ou outro sinal publicado.</span>
              </div>
            </div>
          ) : item.candidates.map((entry) => (
            <label key={entry.companyId} className={`flex cursor-pointer gap-3 rounded-xl border p-3 transition-colors focus-within:ring-2 focus-within:ring-[color:var(--minimal-focus)] ${candidate?.companyId === entry.companyId ? 'border-[color:var(--minimal-action)] bg-[color:var(--minimal-action)]/10' : 'border-[color:var(--minimal-border)] hover:border-[color:var(--minimal-border-hover)] hover:bg-[color:var(--minimal-surface-muted)]'}`}>
              <input type="radio" name="reconciliation-candidate" checked={candidate?.companyId === entry.companyId} onChange={() => choose(entry.companyId)} className="mt-1 h-4 w-4 shrink-0 accent-[color:var(--minimal-action)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--minimal-focus)]" />
              <span className="min-w-0">
                <span className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm font-semibold text-[color:var(--minimal-text)]"><span className="truncate">{entry.companyName}</span><span className="rounded-full bg-[color:var(--minimal-surface-muted)] px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-[0.08em] text-[color:var(--minimal-action)]">{confidenceLabel(entry.confidence)}</span></span>
                <span className="mt-1 block text-xs text-[color:var(--minimal-text-secondary)]">{entry.taxId ? `CNPJ: ${entry.taxId}` : 'CNPJ não informado'} · {reason[entry.reason] ?? entry.reason}{entry.score !== null ? ` · ${(entry.score * 100).toFixed(0)}%` : ''}</span>
                <span className="mt-1 block text-[11px] leading-4 text-[color:var(--minimal-text-tertiary)]">{entry.matchedFields.length ? `Coincide: ${entry.matchedFields.join(', ')}` : 'Sem campo coincidente'} · Fonte: {entry.source}</span>
                {Object.entries(entry.differences).map(([key, difference]) => <span key={key} className="mt-1 block text-[11px] leading-4 text-[color:var(--minimal-warning-text)]">Diferença em {key}: OMIE “{difference.omie ?? 'indisponível'}” · HubSpot “{difference.hubspot ?? 'indisponível'}”</span>)}
                <span className="mt-1 block text-[10px] font-bold uppercase tracking-[0.1em] text-[color:var(--minimal-text-tertiary)]">{entry.decision === 'confirmed' ? 'vínculo confirmado' : 'apenas sugestão'}</span>
              </span>
            </label>
          ))}
        </div>
      </div>
    </section>
  );
}

function IdentityCard({ eyebrow, title, tone, children }: { eyebrow: string; title: string; tone: 'primary' | 'success' | 'neutral'; children: React.ReactNode }) {
  return (
    <div className="min-w-0 rounded-xl border border-[color:var(--minimal-border)] bg-[color:var(--minimal-canvas)] p-3.5">
      <p className={`text-[10px] font-bold uppercase tracking-[0.12em] ${tone === 'success' ? 'text-[color:var(--minimal-success-text)]' : tone === 'primary' ? 'text-[color:var(--minimal-action)]' : 'text-[color:var(--minimal-text-tertiary)]'}`}>{eyebrow}</p>
      <p className="mt-1 truncate text-sm font-semibold text-[color:var(--minimal-text)]" title={title}>{title}</p>
      <dl className="mt-3 divide-y divide-[color:var(--minimal-border)]">
        {children}
      </dl>
    </div>
  );
}

function IdentityRow({ label, value, tone = 'neutral', mono = false, strong = false }: { label: string; value: string; tone?: 'neutral' | 'warning' | 'success'; mono?: boolean; strong?: boolean }) {
  const valueClass = tone === 'warning' ? 'text-[color:var(--minimal-warning-text)]' : tone === 'success' ? 'text-[color:var(--minimal-success-text)]' : 'text-[color:var(--minimal-text)]';
  return (
    <div className="grid grid-cols-[minmax(5.5rem,.72fr)_minmax(0,1.28fr)] gap-3 py-2 first:pt-0 last:pb-0">
      <dt className="text-[11px] text-[color:var(--minimal-text-tertiary)]">{label}</dt>
      <dd className={`min-w-0 truncate text-right text-xs ${strong ? 'font-semibold' : 'font-medium'} ${mono ? 'tabular-nums' : ''} ${valueClass}`} title={value}>{value}</dd>
    </div>
  );
}

function confidenceLabel(value: ReconciliationConfidence) {
  return ({ exact: 'Exato', probable: 'Provável', weak: 'Fraco', inconclusive: 'Inconclusivo' } as Record<ReconciliationConfidence, string>)[value];
}
