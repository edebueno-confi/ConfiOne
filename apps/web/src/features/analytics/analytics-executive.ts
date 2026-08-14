import type { CeoSnapshot } from './analytics-model';

export type ExecutivePipeline = {
  id: string;
  label: string;
  domain: 'Suporte';
  count: number;
  href: string;
};

export type ExecutiveException = {
  key: string;
  domain: 'Comercial' | 'Suporte' | 'Financeiro' | 'Dados e integrações';
  title: string;
  detail: string;
  action: string;
  href: string;
  severity: 1 | 2 | 3;
};

/** Adapta a lista já ranqueada pelo read model para a navegação da UI. */
export function rankExecutivePipelines(rows: CeoSnapshot['executivePipelines'], limit = 5): ExecutivePipeline[] {
  return rows.slice(0, limit).map((row) => ({
    id: row.pipelineId,
    label: row.label,
    domain: 'Suporte',
    count: row.ticketCount,
    href: `/admin/analytics?tab=support&pipeline=${encodeURIComponent(row.pipelineId)}`,
  }));
}

/** Adapta exceções do backend para copy e rotas da tela, sem recalcular risco. */
export function buildExecutiveExceptions(snapshot: CeoSnapshot): ExecutiveException[] {
  return snapshot.executiveExceptions.map((exception) => {
    if (exception.key === 'support-high-priority') {
      return {
        key: exception.key,
        domain: 'Suporte',
        title: 'Tickets de alta prioridade em aberto',
        detail: `${exception.count.toLocaleString('pt-BR')} ${exception.count === 1 ? 'ticket exige' : 'tickets exigem'} acompanhamento.`,
        action: 'Abrir Suporte',
        href: '/admin/analytics?tab=support',
        severity: exception.severity,
      };
    }
    if (exception.key === 'finance-overdue') {
      return {
        key: exception.key,
        domain: 'Financeiro',
        title: 'Saldo vencido identificado',
        detail: `${exception.count.toLocaleString('pt-BR')} ${exception.count === 1 ? 'título vencido' : 'títulos vencidos'} somam ${formatCurrency(exception.amount)}.`,
        action: 'Abrir Financeiro',
        href: '/admin/analytics?tab=finance',
        severity: exception.severity,
      };
    }
    return {
      key: exception.key,
      domain: 'Dados e integrações',
      title: exception.key,
      detail: 'A leitura executiva precisa ser interpretada com cautela.',
      action: 'Verificar fontes',
      href: '/admin/settings?section=analytics&panel=diagnostics',
      severity: exception.severity,
    };
  });
}

function formatCurrency(value: number) {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 });
}
