import { useCallback, useEffect, useMemo, useState } from 'react';
import { MinimalState } from '../../components/minimal-states';
import { decideCompanyReconciliation, getCompanyReconciliationQueue, revokeCompanyReconciliation, type ReconciliationCandidate, type ReconciliationItem, type ReconciliationQueue } from './company-reconciliation-api';

const money = new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' });
const reason: Record<string, string> = { cnpj_exato: 'CNPJ exato', nome_exato: 'Nome exato', nome_similar: 'Nome parecido', sem_classificacao: 'Sem classificação' };

export function CompanyReconciliationPanel() {
  const [queue, setQueue] = useState<ReconciliationQueue | null>(null);
  const [phase, setPhase] = useState<'loading' | 'ready' | 'error'>('loading');
  const [sourceKey, setSourceKey] = useState<string | null>(null);
  const [companyId, setCompanyId] = useState<string | null>(null);
  const [evidence, setEvidence] = useState('');
  const [saving, setSaving] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setPhase('loading'); setError(null);
    try {
      const next = await getCompanyReconciliationQueue();
      setQueue(next);
      setSourceKey((current) => current && next.items.some((item) => item.sourceKey === current) ? current : next.items[0]?.sourceKey ?? null);
      setPhase('ready');
    } catch (cause) { setPhase('error'); setError(cause instanceof Error ? cause.message : 'Não foi possível carregar a conciliação.'); }
  }, []);
  useEffect(() => { void load(); }, [load]);

  const item = useMemo(() => queue?.items.find((entry) => entry.sourceKey === sourceKey) ?? null, [queue, sourceKey]);
  const candidate = item?.candidates.find((entry) => entry.companyId === companyId) ?? item?.candidates.find((entry) => entry.decision === 'confirmed') ?? item?.candidates[0] ?? null;
  useEffect(() => { setCompanyId(item?.candidates.find((entry) => entry.decision === 'confirmed')?.companyId ?? item?.candidates[0]?.companyId ?? null); setEvidence(''); setError(null); }, [item?.sourceKey]);

  async function save(decision: 'confirmed' | 'discarded' | 'revoked') {
    if (!item || !evidence.trim() || (decision !== 'revoked' && !candidate)) { setError('Selecione uma candidata e informe a evidência usada na decisão.'); return; }
    setSaving(decision); setError(null);
    try {
      if (decision === 'revoked') await revokeCompanyReconciliation(item.sourceKey, evidence);
      else await decideCompanyReconciliation({ sourceKey: item.sourceKey, sourceName: item.sourceName, sourceTaxId: item.sourceTaxId, companyId: candidate!.companyId, decision, evidence });
      await load();
    } catch (cause) { setError(cause instanceof Error ? cause.message : 'Não foi possível salvar a decisão.'); } finally { setSaving(null); }
  }

  if (phase === 'loading' && !queue) return <p className="text-sm text-[color:var(--minimal-text-tertiary)]">Carregando pendências de conciliação...</p>;
  if (phase === 'error' && !queue) return <MinimalState tone="critical" title="Conciliação indisponível" description={error ?? 'Não foi possível carregar a fila.'} />;
  if (!queue || queue.items.length === 0) return <MinimalState tone="neutral" title="Nenhuma identidade financeira disponível" description="Quando houver títulos OMIE com uma identidade conciliável, eles aparecerão aqui." />;

  return <section className="space-y-4" aria-label="Conciliação HubSpot e OMIE">
    <header className="flex flex-wrap items-end justify-between gap-3"><div><h3 className="text-sm font-semibold text-[color:var(--minimal-text)]">Uma identidade por vez</h3><p className="mt-1 text-xs leading-5 text-[color:var(--minimal-text-secondary)]">Sugestão não é vínculo. A decisão é auditada e não escreve no HubSpot nem na OMIE.</p></div><p className="text-xs tabular-nums text-[color:var(--minimal-text-secondary)]">{queue.summary.confirmed} confirmadas · {queue.summary.pending} pendentes</p></header>
    <div className="grid gap-px border border-[color:var(--minimal-border)] bg-[color:var(--minimal-border)] lg:grid-cols-[minmax(14rem,.7fr)_minmax(21rem,1.2fr)_minmax(17rem,.8fr)]">
      <aside className="bg-[color:var(--minimal-surface)]"><p className="border-b border-[color:var(--minimal-border)] px-4 py-3 text-xs text-[color:var(--minimal-text-secondary)]">{queue.summary.total} identidades financeiras</p><ul className="max-h-[28rem] overflow-y-auto">{queue.items.map((entry) => <li key={entry.sourceKey} className="border-b border-[color:var(--minimal-border)] last:border-0"><button type="button" onClick={() => setSourceKey(entry.sourceKey)} aria-pressed={entry.sourceKey === item?.sourceKey} className={`w-full px-4 py-3 text-left ${entry.sourceKey === item?.sourceKey ? 'bg-[color:var(--minimal-surface-muted)]' : 'hover:bg-[color:var(--minimal-surface-muted)]'}`}><span className="block truncate text-sm font-medium text-[color:var(--minimal-text)]">{entry.sourceName}</span><span className="mt-1 block text-[11px] tabular-nums text-[color:var(--minimal-text-tertiary)]">{entry.titleCount} títulos · {money.format(entry.totalBalance)}</span><span className={`mt-1 block text-[10px] font-medium uppercase tracking-wide ${entry.status === 'confirmed' ? 'text-[color:var(--minimal-success-text)]' : 'text-[color:var(--minimal-warning-text)]'}`}>{entry.status === 'confirmed' ? 'confirmado' : 'a decidir'}</span></button></li>)}</ul></aside>
      {item ? <Comparison item={item} candidate={candidate} choose={setCompanyId} /> : null}
      <section className="bg-[color:var(--minimal-surface)] p-4"><h4 className="text-sm font-semibold text-[color:var(--minimal-text)]">Registrar decisão</h4><p className="mt-1 text-xs leading-5 text-[color:var(--minimal-text-secondary)]">A evidência guarda autoria e data.</p><label className="mt-4 block text-xs font-medium text-[color:var(--minimal-text-secondary)]" htmlFor="reconciliation-evidence">Evidência usada</label><textarea id="reconciliation-evidence" value={evidence} onChange={(event) => setEvidence(event.target.value)} rows={5} placeholder="Ex.: CNPJ conferido no contrato." className="mt-1 w-full border border-[color:var(--minimal-border-strong)] bg-[color:var(--minimal-surface)] px-3 py-2 text-sm text-[color:var(--minimal-text)] outline-none focus:border-[color:var(--minimal-action)]" />{error ? <p role="alert" className="mt-2 text-xs text-[color:var(--minimal-danger-text)]">{error}</p> : null}<div className="mt-4 grid gap-2">{item?.status === 'confirmed' ? <button type="button" disabled={saving !== null} onClick={() => void save('revoked')} className="min-h-10 border border-[color:var(--minimal-danger-text)] px-3 text-sm font-medium text-[color:var(--minimal-danger-text)] disabled:opacity-50">{saving === 'revoked' ? 'Desfazendo...' : 'Desfazer vínculo'}</button> : <><button type="button" disabled={saving !== null || !candidate} onClick={() => void save('confirmed')} className="min-h-10 bg-[color:var(--minimal-text)] px-3 text-sm font-medium text-[color:var(--minimal-surface)] disabled:opacity-50">{saving === 'confirmed' ? 'Confirmando...' : 'Confirmar vínculo'}</button><button type="button" disabled={saving !== null || !candidate} onClick={() => void save('discarded')} className="min-h-10 border border-[color:var(--minimal-border-strong)] px-3 text-sm font-medium text-[color:var(--minimal-text-secondary)] disabled:opacity-50">{saving === 'discarded' ? 'Descartando...' : 'Descartar candidata'}</button></>}</div></section>
    </div>
  </section>;
}

function Comparison({ item, candidate, choose }: { item: ReconciliationItem; candidate: ReconciliationCandidate | null; choose: (companyId: string) => void }) {
  return <section className="bg-[color:var(--minimal-surface)] p-4"><h4 className="text-sm font-semibold text-[color:var(--minimal-text)]">Comparar cadastros</h4><dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2"><div><dt className="text-[11px] uppercase tracking-wide text-[color:var(--minimal-text-tertiary)]">OMIE</dt><dd className="mt-1 font-medium text-[color:var(--minimal-text)]">{item.sourceName}</dd><dd className="mt-1 text-xs text-[color:var(--minimal-text-secondary)]">{item.sourceTaxId ? `CNPJ: ${item.sourceTaxId}` : 'CNPJ não informado'}</dd></div><div><dt className="text-[11px] uppercase tracking-wide text-[color:var(--minimal-text-tertiary)]">HubSpot escolhido</dt><dd className="mt-1 font-medium text-[color:var(--minimal-text)]">{candidate?.companyName ?? 'Nenhuma candidata'}</dd><dd className="mt-1 text-xs text-[color:var(--minimal-text-secondary)]">{candidate?.taxId ? `CNPJ: ${candidate.taxId}` : 'CNPJ não informado'}</dd></div></dl><fieldset className="mt-5 border-t border-[color:var(--minimal-border)] pt-4"><legend className="text-xs font-medium text-[color:var(--minimal-text-secondary)]">Candidatas do HubSpot</legend><div className="mt-2 space-y-2">{item.candidates.length === 0 ? <p className="text-sm text-[color:var(--minimal-text-secondary)]">Não há candidata suficiente para sugerir.</p> : item.candidates.map((entry) => <label key={entry.companyId} className={`flex cursor-pointer gap-3 border px-3 py-3 ${candidate?.companyId === entry.companyId ? 'border-[color:var(--minimal-text)] bg-[color:var(--minimal-surface-muted)]' : 'border-[color:var(--minimal-border)]'}`}><input type="radio" name="reconciliation-candidate" checked={candidate?.companyId === entry.companyId} onChange={() => choose(entry.companyId)} /><span><span className="block text-sm font-medium text-[color:var(--minimal-text)]">{entry.companyName}</span><span className="mt-1 block text-xs text-[color:var(--minimal-text-secondary)]">{entry.taxId ? `CNPJ: ${entry.taxId}` : 'CNPJ não informado'} · {reason[entry.reason] ?? entry.reason}{entry.score !== null ? ` · ${(entry.score * 100).toFixed(0)}%` : ''}</span><span className={`mt-1 block text-[10px] uppercase tracking-wide ${entry.decision === 'confirmed' ? 'text-[color:var(--minimal-success-text)]' : 'text-[color:var(--minimal-text-tertiary)]'}`}>{entry.decision === 'confirmed' ? 'vínculo confirmado' : 'apenas sugestão'}</span></span></label>)}</div></fieldset></section>;
}
