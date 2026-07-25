import type { AnalyticsBlockState } from '@genius-support-os/contracts';
import type { CeoSnapshot, CsPipelinePoint } from './analytics-model';

export type ExecutivePipeline = {
  id: string;
  label: string;
  domain: 'CS / Suporte';
  count: number;
  href: string;
};

export type ExecutiveException = {
  key: string;
  domain: 'Comercial' | 'CS / Suporte' | 'Financeiro' | 'Dados e integrações';
  title: string;
  detail: string;
  action: string;
  href: string;
  severity: 1 | 2 | 3;
};

const STATUS_SEVERITY: Record<AnalyticsBlockState['status'], 1 | 2 | 3> = {
  error: 3,
  unavailable: 3,
  not_configured: 3,
  partial: 2,
  stale: 2,
  syncing: 2,
  empty: 1,
  fresh: 1,
};

export function rankExecutivePipelines(rows: CsPipelinePoint[], limit = 5): ExecutivePipeline[] {
  return [...rows]
    .filter((row) => row.pipelineId && row.ticketCount > 0)
    .sort((left, right) => right.ticketCount - left.ticketCount || left.label.localeCompare(right.label, 'pt-BR') || left.pipelineId.localeCompare(right.pipelineId))
    .slice(0, limit)
    .map((row) => ({ id: row.pipelineId, label: row.label, domain: 'CS / Suporte', count: row.ticketCount, href: '/admin/analytics/cs' }));
}

export function buildExecutiveExceptions(snapshot: CeoSnapshot): ExecutiveException[] {
  const exceptions: ExecutiveException[] = [];
  const state = snapshot.state;
  if (state && state.status !== 'fresh') {
    const label = state.status === 'stale' ? 'Fonte com atualização atrasada' : state.status === 'partial' ? 'Fonte com cobertura parcial' : state.status === 'syncing' ? 'Fonte em atualização' : state.status === 'empty' ? 'Nenhum registro no recorte' : state.status === 'not_configured' ? 'Fonte ainda não configurada' : 'Fonte indisponível para leitura';
    exceptions.push({ key: `source-${state.status}`, domain: 'Dados e integrações', title: label, detail: state.reason || 'A leitura executiva precisa ser interpretada com cautela.', action: 'Verificar fontes', href: '/admin/analytics/config', severity: STATUS_SEVERITY[state.status] });
  }
  if (snapshot.support.highPriorityOpen > 0) {
    exceptions.push({ key: 'support-high-priority', domain: 'CS / Suporte', title: 'Tickets de alta prioridade em aberto', detail: `${snapshot.support.highPriorityOpen.toLocaleString('pt-BR')} ${snapshot.support.highPriorityOpen === 1 ? 'ticket exige' : 'tickets exigem'} acompanhamento.`, action: 'Abrir CS / Suporte', href: '/admin/analytics/cs', severity: 2 });
  }
  if (snapshot.finance.overdueBalance > 0) {
    exceptions.push({ key: 'finance-overdue', domain: 'Financeiro', title: 'Saldo vencido identificado', detail: `${snapshot.finance.overdueTitles.toLocaleString('pt-BR')} ${snapshot.finance.overdueTitles === 1 ? 'título vencido' : 'títulos vencidos'} somam ${formatCurrency(snapshot.finance.overdueBalance)}.`, action: 'Abrir Financeiro', href: '/admin/analytics/finance', severity: 3 });
  }
  return exceptions.sort((left, right) => right.severity - left.severity || left.key.localeCompare(right.key)).slice(0, 3);
}

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
}
