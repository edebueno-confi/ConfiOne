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
import { kpiLabel } from './analytics-vocabulary.mjs';

/**
 * Renderização dos indicadores do Dashboard.
 *
 * Três garantias que só existem por estarem centralizadas aqui:
 *
 * 1. **Um conceito, um nome.** O rótulo vem do glossário canônico, nunca da
 *    tela. Foi assim que "Conversão" e "Taxa de ganho" deixaram de conviver.
 * 2. **Ausência de fonte nunca vira zero.** O texto de estado substitui o
 *    número, e a limitação é explicada em linguagem de negócio.
 * 3. **A coorte de data é sempre declarada.** Posição de hoje e fluxo do
 *    período não podem ser lidos como a mesma coisa.
 *
 * A hierarquia é explícita: indicadores de decisão vêm primeiro e maiores; os
 * de apoio vêm depois, menores. Uma grade plana de doze cartões não é um
 * painel, é uma lista.
 */
export interface KpiDescriptor {
  /** Chave do indicador no payload; o rótulo vem do glossário. */
  key: string;
  kind?: KpiValueKind;
  /** Texto de apoio quando o indicador está íntegro. */
  hint?: string;
  /** Destaca o cartão quando o valor for maior que zero. */
  warnWhenPositive?: boolean;
}

export function AnalyticsKpiGrid({
  payload,
  primary,
  secondary = [],
  state,
  title,
  description,
}: {
  payload: unknown;
  /** Indicadores de decisão. No máximo quatro, para a hierarquia significar algo. */
  primary: KpiDescriptor[];
  /** Indicadores de apoio, exibidos menores e depois. */
  secondary?: KpiDescriptor[];
  state?: AnalyticsBlockState;
  title?: string;
  description?: string;
}) {
  return (
    <section className="space-y-3" aria-label={title}>
      {title ? (
        <header>
          <h3 className="text-sm font-semibold text-[color:var(--minimal-text)]">{title}</h3>
          {description ? (
            <p className="mt-0.5 text-xs leading-5 text-[color:var(--minimal-text-secondary)]">{description}</p>
          ) : null}
        </header>
      ) : null}

      {/* Uma coluna no celular: valores monetários lado a lado em 390px ficam
          ilegíveis, e o cartão perde o rótulo por truncamento. */}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        {primary.map((item) => <KpiCardFromDescriptor key={item.key} payload={payload} item={item} state={state} />)}
      </div>

      {secondary.length > 0 ? (
        <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {secondary.map((item) => (
            <KpiCardFromDescriptor key={item.key} payload={payload} item={item} state={state} secondary />
          ))}
        </div>
      ) : null}
    </section>
  );
}

function KpiCardFromDescriptor({
  payload,
  item,
  state,
  secondary = false,
}: {
  payload: unknown;
  item: KpiDescriptor;
  state?: AnalyticsBlockState;
  secondary?: boolean;
}) {
  const entry = readKpi(payload, item.key);
  const limitation = describeKpiLimitation(entry);
  const shouldWarn = item.warnWhenPositive === true && (entry.value ?? 0) > 0;
  return (
    <KpiCard
      label={kpiLabel(item.key)}
      value={formatKpiValue(entry, item.kind ?? 'count')}
      hint={limitation || item.hint}
      source={describeKpiBasis(entry)}
      state={state}
      tone={shouldWarn ? 'warning' : entry.state === 'partial' ? 'warning' : 'neutral'}
      className={secondary ? 'gso-kpi-secondary' : ''}
    />
  );
}

/**
 * Faixa que explica, em linguagem de negócio, o que limita a leitura corrente.
 * Fica oculta quando não há limitação, para não virar ruído permanente.
 */
export function AnalyticsKpiLimitations({ payload }: { payload: unknown }) {
  const meta = readKpiMeta(payload);
  if (meta.warnings.length === 0) return null;
  return (
    <details className="rounded-xl border border-[color:var(--minimal-border)] px-4 py-3">
      <summary className="cursor-pointer list-none text-xs font-semibold text-[color:var(--minimal-text-secondary)] [&::-webkit-details-marker]:hidden">
        O que limita esta leitura ({meta.warnings.length})
      </summary>
      <ul className="mt-2 list-disc space-y-1 pl-4 text-xs leading-5 text-[color:var(--minimal-text-tertiary)]">
        {meta.warnings.map((warning) => <li key={warning}>{warning}</li>)}
      </ul>
    </details>
  );
}
