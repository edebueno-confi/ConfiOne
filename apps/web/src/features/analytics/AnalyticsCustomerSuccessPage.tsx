import { useEffect, useState } from 'react';
import type { AnalyticsPageProps } from './analytics-model';
import { getCustomerSuccessKpisV2 } from './analytics-api';
import { AnalyticsHdDomainFrame } from './AnalyticsHdDomainFrame';
import { AnalyticsLoadingState, AnalyticsRetryAction, ChartCard, KpiCard } from './analytics-ui';
import { MinimalState } from '../../components/minimal-states';
import {
  describeKpiBasis,
  describeKpiLimitation,
  formatKpiValue,
  readKpi,
  readKpiMeta,
  toAnalyticsBlockState,
} from './analytics-kpi-contract.mjs';

const TITLE = 'Customer Success';
const DESCRIPTION = 'Carteira ativa, receita recorrente e risco financeiro dos clientes.';
const SOURCE = 'HubSpot · OMIE';

interface OwnerRow {
  owner_id: string;
  owner_name: string;
  customers: number;
  mrr: number | null;
  overdue_customers: number;
  overdue_amount: number;
}

interface RiskRow {
  signal: string;
  signal_label: string;
  customers: number;
  mrr_at_risk: number | null;
}

interface OverdueRow {
  company_id: string;
  company_name: string;
  cs_owner_name: string | null;
  mrr: number | null;
  overdue_balance: number;
  overdue_titles: number;
  max_overdue_days: number | null;
  open_tickets?: number;
}

function rows<T>(payload: unknown, key: string): T[] {
  const data = payload as Record<string, unknown> | null;
  const value = data && typeof data === 'object' ? data[key] : null;
  return Array.isArray(value) ? (value as T[]) : [];
}

function currency(value: number | null | undefined): string {
  if (value === null || value === undefined) return 'Indisponível';
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
}

export function AnalyticsCustomerSuccessPage({ onRetry }: AnalyticsPageProps) {
  const [result, setResult] = useState<{ loading: boolean; data?: unknown; error?: boolean }>({ loading: true });

  const load = () => {
    setResult((current) => (current.data ? { ...current, loading: true, error: undefined } : { loading: true }));
    void getCustomerSuccessKpisV2()
      .then((data) => setResult({ loading: false, data }))
      .catch(() => setResult((current) => ({ ...current, loading: false, error: true })));
  };

  useEffect(() => { load(); }, []);

  if (result.loading && !result.data) {
    return (
      <AnalyticsHdDomainFrame title={TITLE} description={DESCRIPTION} source={SOURCE}>
        <AnalyticsLoadingState title="Carregando Customer Success" description="Estamos preparando a leitura desta área." />
      </AnalyticsHdDomainFrame>
    );
  }

  if (result.error || !result.data) {
    return (
      <AnalyticsHdDomainFrame title={TITLE} description={DESCRIPTION} source={SOURCE}>
        <MinimalState
          tone="critical"
          title="Não foi possível carregar Customer Success"
          description="A leitura desta área está indisponível agora."
          actions={<AnalyticsRetryAction onRetry={onRetry ?? load} />}
        />
      </AnalyticsHdDomainFrame>
    );
  }

  const payload = result.data;
  const meta = readKpiMeta(payload);
  const state = toAnalyticsBlockState(payload, SOURCE);

  const activeCustomers = readKpi(payload, 'active_customers');
  const mrrTotal = readKpi(payload, 'mrr_total');
  const arpa = readKpi(payload, 'arpa');
  const overdueCustomers = readKpi(payload, 'overdue_customers');
  const mrrOverdue = readKpi(payload, 'mrr_overdue');
  const mappingCoverage = readKpi(payload, 'mapping_coverage_percent');
  const withOpenTickets = readKpi(payload, 'customers_with_open_tickets');
  const mrrCriticalTicket = readKpi(payload, 'mrr_with_critical_ticket');
  const withoutActivity = readKpi(payload, 'customers_without_recent_activity');
  const logoChurn = readKpi(payload, 'logo_churn_rate');
  const nrr = readKpi(payload, 'nrr');

  const owners = rows<OwnerRow>(payload, 'by_owner');
  const risks = rows<RiskRow>(payload, 'risk_signals');
  const overdue = rows<OverdueRow>(payload, 'top_overdue_customers');

  return (
    <AnalyticsHdDomainFrame title={TITLE} description={DESCRIPTION} source={SOURCE} state={state}>
      <div className="gso-pilot-kpi-grid grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Clientes ativos"
          value={formatKpiValue(activeCustomers, 'count')}
          hint={describeKpiLimitation(activeCustomers) || 'Carteira ativa segundo a regra definida pela operação'}
          source={describeKpiBasis(activeCustomers)}
          state={state}
        />
        <KpiCard
          label="Receita recorrente"
          value={formatKpiValue(mrrTotal, 'currency')}
          hint={describeKpiLimitation(mrrTotal) || 'Soma da recorrência dos clientes ativos'}
          source={describeKpiBasis(mrrTotal)}
          state={state}
          tone={mrrTotal.state === 'partial' ? 'warning' : 'neutral'}
        />
        <KpiCard
          label="Receita média por cliente"
          value={formatKpiValue(arpa, 'currency')}
          hint={describeKpiLimitation(arpa) || 'Recorrência dividida pelos clientes com valor registrado'}
          source={describeKpiBasis(arpa)}
          state={state}
        />
        <KpiCard
          label="Recorrência com atraso"
          value={formatKpiValue(mrrOverdue, 'currency')}
          hint={describeKpiLimitation(mrrOverdue) || 'Recorrência de clientes com títulos vencidos'}
          source={describeKpiBasis(mrrOverdue)}
          state={state}
          tone={(mrrOverdue.value ?? 0) > 0 ? 'warning' : 'neutral'}
        />
      </div>

      <div className="gso-pilot-kpi-grid grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard
          label="Clientes inadimplentes"
          value={formatKpiValue(overdueCustomers, 'count')}
          hint={describeKpiLimitation(overdueCustomers) || 'Clientes ativos com pelo menos um título vencido'}
          source={describeKpiBasis(overdueCustomers)}
          state={state}
          tone={(overdueCustomers.value ?? 0) > 0 ? 'warning' : 'neutral'}
          className="gso-kpi-secondary"
        />
        <KpiCard
          label="Clientes com cadastro financeiro"
          value={formatKpiValue(mappingCoverage, 'percent')}
          hint="Parte da carteira que pode ser cruzada com o financeiro"
          source={describeKpiBasis(mappingCoverage)}
          state={state}
          className="gso-kpi-secondary"
        />
        <KpiCard
          label="Clientes com atendimento aberto"
          value={formatKpiValue(withOpenTickets, 'count')}
          hint={describeKpiLimitation(withOpenTickets) || 'Clientes ativos com pelo menos um atendimento em aberto'}
          source={describeKpiBasis(withOpenTickets)}
          state={state}
          className="gso-kpi-secondary"
        />
        <KpiCard
          label="Recorrência com atendimento crítico"
          value={formatKpiValue(mrrCriticalTicket, 'currency')}
          hint={describeKpiLimitation(mrrCriticalTicket) || 'Recorrência de clientes com atendimento de prioridade alta em aberto'}
          source={describeKpiBasis(mrrCriticalTicket)}
          state={state}
          tone={(mrrCriticalTicket.value ?? 0) > 0 ? 'warning' : 'neutral'}
          className="gso-kpi-secondary"
        />
        <KpiCard
          label="Clientes sem interação recente"
          value={formatKpiValue(withoutActivity, 'count')}
          hint={describeKpiLimitation(withoutActivity) || 'Clientes ativos sem contato registrado no período definido'}
          source={describeKpiBasis(withoutActivity)}
          state={state}
          tone={(withoutActivity.value ?? 0) > 0 ? 'warning' : 'neutral'}
          className="gso-kpi-secondary"
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <ChartCard
          title="Carteira por responsável"
          description="Clientes ativos, recorrência e exposição a atraso de cada responsável."
        >
          {owners.length === 0 ? (
            <p className="text-sm text-[color:var(--minimal-text-secondary)]">Nenhum cliente ativo na carteira.</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[520px] text-left text-xs">
                <thead className="border-b border-[color:var(--minimal-border)] text-[color:var(--minimal-text-tertiary)]">
                  <tr>
                    <th className="px-2 py-2 font-medium">Responsável</th>
                    <th className="px-2 py-2 text-right font-medium">Clientes</th>
                    <th className="px-2 py-2 text-right font-medium">Recorrência</th>
                    <th className="px-2 py-2 text-right font-medium">Em atraso</th>
                  </tr>
                </thead>
                <tbody>
                  {owners.map((row) => (
                    <tr className="border-b border-[color:var(--minimal-border)] last:border-0" key={row.owner_id}>
                      <td className="px-2 py-2 font-medium text-[color:var(--minimal-text)]">{row.owner_name}</td>
                      <td className="px-2 py-2 text-right tabular-nums text-[color:var(--minimal-text-secondary)]">{row.customers.toLocaleString('pt-BR')}</td>
                      <td className="px-2 py-2 text-right tabular-nums text-[color:var(--minimal-text-secondary)]">{currency(row.mrr)}</td>
                      <td className="px-2 py-2 text-right tabular-nums text-[color:var(--minimal-text-secondary)]">{row.overdue_customers.toLocaleString('pt-BR')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </ChartCard>

        <ChartCard
          title="Receita em risco"
          description="Sinais explícitos, exibidos separadamente. Nenhum score composto é calculado."
        >
          {risks.length === 0 ? (
            <p className="text-sm text-[color:var(--minimal-text-secondary)]">Nenhum sinal de risco identificado na carteira ativa.</p>
          ) : (
            <div className="divide-y divide-[color:var(--minimal-border)]">
              {risks.map((row) => (
                <div className="flex items-center justify-between gap-3 py-2 text-sm" key={row.signal}>
                  <span className="min-w-0">
                    <span className="block truncate text-[color:var(--minimal-text)]">{row.signal_label}</span>
                    <span className="block text-xs text-[color:var(--minimal-text-tertiary)]">{row.customers.toLocaleString('pt-BR')} cliente(s)</span>
                  </span>
                  <strong className="tabular-nums text-[color:var(--minimal-text)]">{currency(row.mrr_at_risk)}</strong>
                </div>
              ))}
            </div>
          )}
        </ChartCard>
      </div>

      <ChartCard
        title="Clientes com maior valor vencido"
        description="Cruzamento entre a carteira e os títulos vencidos, feito apenas por cadastro fiscal conferido."
      >
        {overdue.length === 0 ? (
          <p className="text-sm text-[color:var(--minimal-text-secondary)]">Nenhum cliente ativo com título vencido.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left text-xs">
              <thead className="border-b border-[color:var(--minimal-border)] text-[color:var(--minimal-text-tertiary)]">
                <tr>
                  <th className="px-2 py-2 font-medium">Cliente</th>
                  <th className="px-2 py-2 font-medium">Responsável</th>
                  <th className="px-2 py-2 text-right font-medium">Recorrência</th>
                  <th className="px-2 py-2 text-right font-medium">Valor vencido</th>
                  <th className="px-2 py-2 text-right font-medium">Títulos</th>
                  <th className="px-2 py-2 text-right font-medium">Maior atraso</th>
                </tr>
              </thead>
              <tbody>
                {overdue.map((row) => (
                  <tr className="border-b border-[color:var(--minimal-border)] last:border-0" key={row.company_id}>
                    <td className="px-2 py-2 font-medium text-[color:var(--minimal-text)]">{row.company_name}</td>
                    <td className="px-2 py-2 text-[color:var(--minimal-text-secondary)]">{row.cs_owner_name ?? 'Sem responsável'}</td>
                    <td className="px-2 py-2 text-right tabular-nums text-[color:var(--minimal-text-secondary)]">{currency(row.mrr)}</td>
                    <td className="px-2 py-2 text-right tabular-nums text-[color:var(--minimal-text)]">{currency(row.overdue_balance)}</td>
                    <td className="px-2 py-2 text-right tabular-nums text-[color:var(--minimal-text-secondary)]">{row.overdue_titles.toLocaleString('pt-BR')}</td>
                    <td className="px-2 py-2 text-right tabular-nums text-[color:var(--minimal-text-secondary)]">{row.max_overdue_days === null ? 'Indisponível' : `${row.max_overdue_days} dias`}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </ChartCard>

      <div className="grid gap-3 sm:grid-cols-2">
        <KpiCard
          label="Churn de clientes"
          value={formatKpiValue(logoChurn, 'percent')}
          hint={describeKpiLimitation(logoChurn)}
          state={state}
          className="gso-kpi-secondary"
        />
        <KpiCard
          label="Retenção líquida de receita"
          value={formatKpiValue(nrr, 'percent')}
          hint={describeKpiLimitation(nrr)}
          state={state}
          className="gso-kpi-secondary"
        />
      </div>

      {meta.warnings.length > 0 ? (
        <div className="rounded-xl border border-[color:var(--minimal-border)] px-4 py-3">
          <p className="text-xs font-semibold text-[color:var(--minimal-text-secondary)]">O que limita esta leitura</p>
          <ul className="mt-1 list-disc space-y-0.5 pl-4 text-xs leading-5 text-[color:var(--minimal-text-tertiary)]">
            {meta.warnings.map((warning) => <li key={warning}>{warning}</li>)}
          </ul>
        </div>
      ) : null}
    </AnalyticsHdDomainFrame>
  );
}
