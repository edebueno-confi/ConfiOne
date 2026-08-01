import { useState } from 'react';
import { ChartCard } from './analytics-ui';
import { runHubspotCsDiagnostic, type HubspotCsDiagnostic } from './analytics-api';

export function HubspotCsDiagnosticCard({ enabled }: { enabled: boolean }) {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<HubspotCsDiagnostic | null>(null);
  const [error, setError] = useState<string | null>(null);
  if (!enabled) return null;
  const run = async () => {
    setBusy(true); setError(null);
    try { setResult(await runHubspotCsDiagnostic()); } catch (cause) { setError(cause instanceof Error ? cause.message : 'Falha ao executar o diagnóstico.'); }
    finally { setBusy(false); }
  };
  return <ChartCard title="Diagnóstico read-only de CS / Suporte" description="Consulta a origem HubSpot com a sessão autenticada. Não grava dados e não executa sincronização.">
    <div className="flex flex-wrap items-center gap-3">
      <button type="button" onClick={() => void run()} disabled={busy} className="h-9 rounded-md border border-[color:var(--minimal-action)] px-3 text-sm font-medium text-[color:var(--minimal-action)] disabled:opacity-60">{busy ? 'Consultando origem…' : 'Executar diagnóstico read-only'}</button>
      {result ? <span className="text-xs text-[color:var(--minimal-text-secondary)]">Estado: <strong>{result.sourceState}</strong> · {result.total.toLocaleString('pt-BR')} tickets nos pipelines configurados</span> : null}
    </div>
    {error ? <p role="alert" className="mt-3 text-xs text-[color:var(--color-critical-text)]">{error}</p> : null}
    {result ? <div className="mt-3 grid gap-2 text-xs text-[color:var(--minimal-text-secondary)] md:grid-cols-2"><p>Endpoint: <code>{result.endpoint}</code></p><p>Paginação: {result.paginationComplete ? 'completa' : 'incompleta'} · páginas consultadas: {result.pages}</p><p>Scopes presentes: {result.scopesPresent.join(', ') || 'não confirmado'}</p><p>Pipelines disponíveis: {result.pipelines.length}</p></div> : null}
  </ChartCard>;
}
