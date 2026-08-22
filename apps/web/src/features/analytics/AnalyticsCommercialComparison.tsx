import { MinimalState } from '../../components/minimal-states';
import { AnalyticsLoadingState, ChartCard } from './analytics-ui';
import { describeKpiLimitation, formatKpiValue, readKpi, type KpiValueKind } from './analytics-kpi-contract.mjs';
import { buildCommercialComparisons } from './analytics-commercial-comparison.mjs';

type Period = { from: string; to: string };

export function AnalyticsCommercialComparison({
  currentPayload,
  previousPayload,
  currentPeriod,
  previousPeriod,
  phase,
}: {
  currentPayload: unknown;
  previousPayload: unknown;
  currentPeriod: Period;
  previousPeriod: Period | null;
  phase: 'loading' | 'ready' | 'error' | 'unavailable';
}) {
  if (phase === 'loading') {
    return <ChartCard title="Comparação temporal" description="Mesmo recorte operacional, comparado ao período anterior equivalente."><AnalyticsLoadingState title="Carregando comparação" description="Consultando o período anterior com os mesmos filtros." /></ChartCard>;
  }

  if (phase === 'unavailable' || !previousPeriod) {
    return <ChartCard title="Comparação temporal" description="A comparação exige um período delimitado."><MinimalState title="Comparação indisponível" description="Selecione uma data inicial e final. Todo o período não recebe uma comparação arbitrária." /></ChartCard>;
  }

  if (phase === 'error' || !currentPayload || !previousPayload) {
    return <ChartCard title="Comparação temporal" description="Mesmo recorte operacional, comparado ao período anterior equivalente."><MinimalState tone="critical" title="Não foi possível comparar" description="Um dos períodos está indisponível. Nenhum delta foi estimado a partir de ausência de dados." /></ChartCard>;
  }

  const comparisons = buildCommercialComparisons(currentPayload, previousPayload);
  const aging = readKpi(currentPayload, 'stage_aging_days');

  return (
    <ChartCard title="Comparação temporal" description="Mesmo recorte operacional, comparado ao período anterior equivalente.">
      <p className="mb-3 text-xs text-[color:var(--minimal-text-tertiary)]">
        Atual: {formatPeriod(currentPeriod)} · Anterior: {formatPeriod(previousPeriod)}
      </p>
      <div className="overflow-x-auto">
        <table className="gso-analytics-responsive-table w-full min-w-[720px] text-sm">
          <thead>
            <tr className="border-b border-[color:var(--minimal-border)] text-left text-[11px] font-semibold uppercase tracking-wide text-[color:var(--minimal-text-tertiary)]">
              <th className="py-2 pr-4">Indicador</th>
              <th className="py-2 pr-4 text-right">Atual</th>
              <th className="py-2 pr-4 text-right">Anterior</th>
              <th className="py-2 pr-4 text-right">Delta absoluto</th>
              <th className="py-2 text-right">Delta percentual</th>
            </tr>
          </thead>
          <tbody>
            {comparisons.map((item) => (
              <tr key={item.key} className="border-b border-[color:var(--minimal-border)] last:border-0">
                <td data-label="Indicador" className="py-2 pr-4 text-[color:var(--minimal-text)]">{item.label}</td>
                <td data-label="Atual" className="py-2 pr-4 text-right tabular-nums text-[color:var(--minimal-text)]">{formatKpiValue(item.current, item.kind)}</td>
                <td data-label="Anterior" className="py-2 pr-4 text-right tabular-nums text-[color:var(--minimal-text-secondary)]">{formatKpiValue(item.previous, item.kind)}</td>
                <td data-label="Delta absoluto" className="py-2 pr-4 text-right tabular-nums text-[color:var(--minimal-text-secondary)]">{formatAbsolute(item.delta?.absolute, item.kind, item.isRate)}</td>
                <td data-label="Delta percentual" className="py-2 text-right tabular-nums text-[color:var(--minimal-text-secondary)]">{formatRelative(item.delta?.relativePercent)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-[11px] leading-4 text-[color:var(--minimal-text-tertiary)]">Na taxa de ganho, o delta absoluto é expresso em pontos percentuais. O delta percentual relativo só aparece quando o período anterior tem uma base diferente de zero.</p>
      <p className="mt-2 text-[11px] leading-4 text-[color:var(--minimal-text-tertiary)]"><strong>Tempo na etapa atual:</strong> {formatKpiValue(aging, 'days')}. {describeKpiLimitation(aging) || 'O histórico de entrada em etapa ainda não está publicado.'}</p>
    </ChartCard>
  );
}

function formatPeriod(period: Period): string {
  return `${period.from} a ${period.to}`;
}

function formatAbsolute(value: number | null | undefined, kind: KpiValueKind, isRate?: boolean): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return 'Indisponível';
  const formatted = formatKpiValue({ state: 'available', value, basis: null, reason: null }, kind);
  return isRate ? `${formatted} p.p.` : `${value > 0 ? '+' : ''}${formatted}`;
}

function formatRelative(value: number | null | undefined): string {
  if (value === null || value === undefined || !Number.isFinite(value)) return 'Indisponível';
  return `${value > 0 ? '+' : ''}${value.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`;
}
