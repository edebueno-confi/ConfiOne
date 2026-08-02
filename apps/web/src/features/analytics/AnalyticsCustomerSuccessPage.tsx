import { useEffect, useState } from 'react';
import type { AnalyticsPageProps, CustomerSuccessSnapshot } from './analytics-model';
import { getCustomerSuccessSnapshot } from './analytics-api';
import { AnalyticsHdDomainFrame } from './AnalyticsHdDomainFrame';
import { AnalyticsLoadingState, AnalyticsRetryAction, ChartCard, KpiCard } from './analytics-ui';
import { MinimalState } from '../../components/minimal-states';

export function AnalyticsCustomerSuccessPage({ onRetry }: AnalyticsPageProps) {
  const [result, setResult] = useState<{ loading: boolean; data?: CustomerSuccessSnapshot; error?: boolean }>({ loading: true });

  const load = () => {
    setResult((current) => current.data ? { ...current, loading: true, error: undefined } : { loading: true });
    void getCustomerSuccessSnapshot()
      .then((data) => setResult({ loading: false, data }))
      .catch(() => setResult((current) => ({ ...current, loading: false, error: true })));
  };

  useEffect(() => { load(); }, []);

  if (result.loading && !result.data) {
    return <AnalyticsLoadingState title="Carregando Customer Success" description="Estamos consultando o cache oficial de empresas do HubSpot." />;
  }
  if (result.error || !result.data) {
    return <MinimalState tone="critical" title="Não foi possível carregar Customer Success" description="A leitura do HubSpot está indisponível agora." actions={<AnalyticsRetryAction onRetry={onRetry ?? load} />} />;
  }

  const data = result.data;
  const state = data.state;
  const unavailable = ['unavailable', 'error', 'not_configured'].includes(state?.status ?? 'unavailable');
  const value = (amount: number, suffix = '') => unavailable ? 'Indisponível' : `${amount.toLocaleString('pt-BR')}${suffix}`;

  return (
    <AnalyticsHdDomainFrame title="Customer Success" description="Carteira HubSpot, cobertura de responsáveis e preenchimento dos campos operacionais." source={data.source} state={state}>
      {state?.status === 'empty' ? <MinimalState title="Nenhuma empresa disponível no recorte" description="O HubSpot não retornou empresas para esta leitura. Nenhum indicador foi inventado." /> : null}
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
        <KpiCard label="Empresas no HubSpot" value={value(data.kpis.companiesTotal)} hint="Registros no cache oficial" source="Contagem de empresas disponíveis no contrato HubSpot." state={state} />
        <KpiCard label="Status de cliente preenchido" value={value(data.kpis.clientStatusFilled)} hint="Empresas com o campo informado" source="Presença do campo; não interpreta a regra de cliente ativo." state={state} />
        <KpiCard label="Status contratual preenchido" value={value(data.kpis.contractStatusFilled)} hint="Empresas com o campo informado" source="Presença do campo no HubSpot." state={state} />
        <KpiCard label="Sem responsável" value={value(data.kpis.withoutOwner)} hint="Empresas sem owner associado" source="Owner ausente no cache HubSpot." state={state} tone={data.kpis.withoutOwner > 0 ? 'warning' : 'neutral'} />
        <KpiCard label="MRR observado" value={data.kpis.mrrFilled > 0 ? value(data.kpis.mrrFilled) : 'Indisponível'} hint={data.kpis.mrrFilled > 0 ? 'Empresas com campo preenchido' : 'O valor de MRR não é publicado neste contrato'} source="O read model informa presença do campo, não um valor financeiro utilizável." state={state} />
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        <ChartCard title="Carteira por responsável" description="Distribuição factual das empresas que possuem owner no HubSpot.">
          <SimpleRows rows={data.byOwner.map((row) => ({ label: row.ownerName, value: row.companyCount }))} empty="Nenhum responsável informado." />
        </ChartCard>
        <ChartCard title="Status operacional" description="Campos exibidos como foram recebidos; ausência permanece indisponível.">
          <div className="grid gap-4 sm:grid-cols-2">
            <SimpleRows rows={data.byClientStatus.map((row) => ({ label: row.key, value: row.companyCount }))} empty="Status de cliente indisponível." />
            <SimpleRows rows={data.byContractStatus.map((row) => ({ label: row.key, value: row.companyCount }))} empty="Status contratual indisponível." />
          </div>
        </ChartCard>
      </div>
      <ChartCard title="Empresas consultadas" description="Amostra limitada pelo contrato; health score, regra de cliente ativo e risco não são inferidos.">
        {data.companies.length === 0 ? <p className="text-sm text-[color:var(--minimal-text-secondary)]">Nenhuma empresa disponível.</p> : <div className="overflow-x-auto"><table className="w-full min-w-[720px] text-left text-xs"><thead className="border-b border-[color:var(--minimal-border)] text-[color:var(--minimal-text-tertiary)]"><tr><th className="px-2 py-2 font-medium">Empresa</th><th className="px-2 py-2 font-medium">Status cliente</th><th className="px-2 py-2 font-medium">Status contratual</th><th className="px-2 py-2 font-medium">Responsável</th><th className="px-2 py-2 font-medium">Atualização</th></tr></thead><tbody>{data.companies.map((row) => <tr className="border-b border-[color:var(--minimal-border)] last:border-0" key={row.companyId}><td className="px-2 py-2 font-medium text-[color:var(--minimal-text)]">{row.companyName}</td><td className="px-2 py-2 text-[color:var(--minimal-text-secondary)]">{row.clientStatus ?? 'Indisponível'}</td><td className="px-2 py-2 text-[color:var(--minimal-text-secondary)]">{row.contractStatus ?? 'Indisponível'}</td><td className="px-2 py-2 text-[color:var(--minimal-text-secondary)]">{row.csOwnerName}</td><td className="px-2 py-2 text-[color:var(--minimal-text-tertiary)]">{row.syncedAt ? new Date(row.syncedAt).toLocaleString('pt-BR') : 'Indisponível'}</td></tr>)}</tbody></table></div>}
      </ChartCard>
      {data.limitations.length > 0 ? <p className="text-xs leading-5 text-[color:var(--minimal-text-tertiary)]">Limitações do contrato: {data.limitations.join(' ')}</p> : null}
    </AnalyticsHdDomainFrame>
  );
}

function SimpleRows({ rows, empty }: { rows: Array<{ label: string; value: number }>; empty: string }) {
  if (rows.length === 0) return <p className="text-sm text-[color:var(--minimal-text-secondary)]">{empty}</p>;
  return <div className="divide-y divide-[color:var(--minimal-border)]">{rows.map((row) => <div className="flex items-center justify-between gap-3 py-2 text-sm" key={row.label}><span className="min-w-0 truncate text-[color:var(--minimal-text-secondary)]">{row.label}</span><strong className="tabular-nums text-[color:var(--minimal-text)]">{row.value.toLocaleString('pt-BR')}</strong></div>)}</div>;
}
