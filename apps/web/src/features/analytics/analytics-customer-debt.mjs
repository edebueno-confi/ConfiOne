// Contrato de apresentação da dívida com clientes.
//
// "Dívida" é a palavra certa e foi escolhida com cuidado. Não é backlog, que
// sugere trabalho a fazer; não é pendência, que sugere algo neutro. São pedidos
// de clientes que ficaram sem resposta por mais tempo do que qualquer explicação
// justifica, e a tela precisa dizer isso sem rodeio.

export const PRIORITY_LABELS = { alta: 'Alta', media: 'Média', baixa: 'Baixa' };

/** Transforma dias em uma frase que uma pessoa lê sem converter nada. */
export function humanizeSilence(days) {
  const dias = Number(days ?? 0);
  if (!Number.isFinite(dias) || dias <= 0) return 'Indisponível';
  if (dias < 60) return `${Math.round(dias)} dias`;
  if (dias < 365) return `${Math.round(dias / 30)} meses`;
  const anos = dias / 365;
  return anos < 2 ? 'mais de 1 ano' : `mais de ${Math.floor(anos)} anos`;
}

export function readCustomerDebt(payload) {
  if (!payload || typeof payload !== 'object') {
    return { available: false, threshold: null, totalTickets: 0, totalCompanies: 0, companies: [], highPriority: 0 };
  }

  const companies = (Array.isArray(payload.companies) ? payload.companies : []).map((row) => ({
    companyId: String(row?.company_id ?? ''),
    name: String(row?.company_name ?? 'Empresa sem nome'),
    tickets: Number(row?.tickets ?? 0),
    oldestDaysSilent: Number(row?.oldest_days_silent ?? 0),
    avgDaysSilent: Number(row?.avg_days_silent ?? 0),
    inWorkedQueue: Number(row?.tickets_in_worked_queue ?? 0),
    priority: ['alta', 'media', 'baixa'].includes(row?.priority) ? row.priority : 'baixa',
    details: Array.isArray(row?.tickets_detail)
      ? row.tickets_detail.map((t) => ({
          ticketId: String(t?.ticket_id ?? ''),
          pipelineLabel: String(t?.pipeline_label ?? ''),
          daysSilent: Number(t?.days_silent ?? 0),
          ownerName: String(t?.owner_name ?? 'Sem responsável'),
        }))
      : [],
  }));

  return {
    available: companies.length > 0,
    threshold: Number(payload.threshold_days ?? 0) || null,
    totalTickets: Number(payload.total_tickets ?? 0),
    totalCompanies: Number(payload.total_companies ?? 0),
    companies,
    highPriority: Number(payload.high_priority ?? 0),
    // O que está esquecido dentro da fila que o time trabalha é mais grave do
    // que o esquecido numa caixa de entrada que ninguém abre: ali não houve nem
    // a desculpa de o canal não ter dono.
    inWorkedQueue: Number(payload.in_worked_queue ?? 0),
  };
}

/**
 * Linhas para exportação, uma por atendimento.
 *
 * Uma linha por empresa não serve para trabalhar: quem vai tratar precisa da
 * lista de atendimentos, não do resumo.
 */
export function toDebtRows(reading) {
  const linhas = [];
  for (const company of reading.companies ?? []) {
    for (const detalhe of company.details) {
      linhas.push({
        empresa: company.name,
        prioridade: PRIORITY_LABELS[company.priority] ?? 'Baixa',
        atendimento: detalhe.ticketId,
        pipeline: detalhe.pipelineLabel,
        responsavel: detalhe.ownerName,
        dias_sem_resposta: detalhe.daysSilent,
      });
    }
  }
  return linhas.sort((a, b) => b.dias_sem_resposta - a.dias_sem_resposta);
}

/** CSV com separador de ponto e vírgula, que é o que o Excel em português espera. */
export function toDebtCsv(reading) {
  const linhas = toDebtRows(reading);
  const cabecalho = ['Empresa', 'Prioridade', 'Atendimento', 'Pipeline', 'Responsável', 'Dias sem resposta'];
  const escapar = (valor) => {
    const texto = String(valor ?? '');
    return /[";\n]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto;
  };
  return [
    cabecalho.join(';'),
    ...linhas.map((l) => [l.empresa, l.prioridade, l.atendimento, l.pipeline, l.responsavel, l.dias_sem_resposta].map(escapar).join(';')),
  ].join('\r\n');
}
