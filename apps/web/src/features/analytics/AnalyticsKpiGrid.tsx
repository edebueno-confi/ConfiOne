import type { AnalyticsBlockState } from '@genius-support-os/contracts';
import { KpiCard } from './analytics-ui';
import {
  describeKpiBasis,
  describeKpiLimitation,
  formatKpiValue,
  readKpi,
  readKpiMeta,
  type KpiValueKind,
} from './analytics-kpi-contract.mjs';

/**
 * Renderização genérica de indicadores vindos dos read models de KPI.
 *
 * Existe para que nenhuma tela precise conhecer o formato interno do payload
 * nem os códigos técnicos de estado e limitação. A tradução para linguagem
 * gerencial acontece uma única vez, no contrato de apresentação, e todas as
 * áreas herdam o mesmo comportamento: ausência de fonte nunca vira zero, e a
 * coorte de data de cada indicador é sempre declarada.
 */
export interface KpiDescriptor {
  /** Chave do indicador no payload do read model. */
  key: string;
  label: string;
  kind?: KpiValueKind;
  /** Texto de apoio quando o indicador está íntegro. */
  hint?: string;
  /** Destaca o cartão quando o valor for maior que zero. */
  warnWhenPositive?: boolean;
  secondary?: boolean;
}

export function AnalyticsKpiGrid({
  payload,
  items,
  state,
  columns = 4,
}: {
  payload: unknown;
  items: KpiDescriptor[];
  state?: AnalyticsBlockState;
  columns?: 3 | 4 | 5;
}) {
  const columnClass = columns === 5
    ? 'xl:grid-cols-5'
    : columns === 3
      ? 'xl:grid-cols-3'
      : 'xl:grid-cols-4';

  return (
    <div className={`gso-pilot-kpi-grid grid gap-3 sm:grid-cols-2 ${columnClass}`}>
      {items.map((item) => {
        const entry = readKpi(payload, item.key);
        const limitation = describeKpiLimitation(entry);
        const shouldWarn = item.warnWhenPositive === true && (entry.value ?? 0) > 0;
        return (
          <KpiCard
            key={item.key}
            label={item.label}
            value={formatKpiValue(entry, item.kind ?? 'count')}
            hint={limitation || item.hint}
            source={describeKpiBasis(entry)}
            state={state}
            tone={shouldWarn ? 'warning' : entry.state === 'partial' ? 'warning' : 'neutral'}
            className={item.secondary ? 'gso-kpi-secondary' : ''}
          />
        );
      })}
    </div>
  );
}

/**
 * Faixa que explica, em linguagem de negócio, o que limita a leitura corrente.
 * Fica oculta quando não há limitação, para não poluir a tela com ruído.
 */
export function AnalyticsKpiLimitations({ payload }: { payload: unknown }) {
  const meta = readKpiMeta(payload);
  if (meta.warnings.length === 0) return null;
  return (
    <div className="rounded-xl border border-[color:var(--minimal-border)] px-4 py-3">
      <p className="text-xs font-semibold text-[color:var(--minimal-text-secondary)]">
        O que limita esta leitura
      </p>
      <ul className="mt-1 list-disc space-y-0.5 pl-4 text-xs leading-5 text-[color:var(--minimal-text-tertiary)]">
        {meta.warnings.map((warning) => <li key={warning}>{warning}</li>)}
      </ul>
    </div>
  );
}
