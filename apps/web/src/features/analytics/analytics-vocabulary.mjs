// Glossário canônico do Dashboard.
//
// Por que existe
// --------------
// Em 2026-08-07 a auditoria encontrou o mesmo conceito com dois nomes na mesma
// tela — "Conversão" e "Taxa de ganho" — e, pior, o mesmo nome com dois valores
// diferentes: "Receita ganha" aparecia duas vezes, calculada por coortes de data
// distintas. Num painel de decisão isso é mais grave que um número ausente,
// porque destrói a confiança em todos os outros.
//
// A regra passa a ser: **um conceito, um nome, uma definição, um lugar.**
//
// Decisões de vocabulário registradas pela operação em 2026-08-07:
//   - a unidade comercial se chama "negócio", nunca "deal" nem "oportunidade";
//   - a unidade de suporte se chama "atendimento", nunca "ticket" nem "chamado".

/** Termos que não podem aparecer na interface, e o que usar no lugar. */
export const FORBIDDEN_TERMS = {
  deal: 'negócio',
  deals: 'negócios',
  oportunidade: 'negócio',
  oportunidades: 'negócios',
  ticket: 'atendimento',
  tickets: 'atendimentos',
  chamado: 'atendimento',
  chamados: 'atendimentos',
};

/**
 * Rótulos canônicos por chave de indicador. Cada entrada existe uma única vez
 * em todo o Dashboard; repetir a chave em duas áreas é aceitável, repetir o
 * rótulo com outra definição não é.
 */
export const KPI_LABELS = {
  // Comercial — a coorte de data faz parte da definição, não é detalhe.
  open_pipeline_amount: 'Valor em negociação',
  weighted_pipeline_amount: 'Valor ponderado',
  open_deals: 'Negócios em negociação',
  created_deals: 'Negócios abertos',
  won_deals: 'Negócios ganhos',
  lost_deals: 'Negócios perdidos',
  won_amount: 'Receita fechada',
  win_rate: 'Taxa de ganho',
  avg_deal_amount: 'Valor médio por negócio',
  median_deal_amount: 'Valor mediano por negócio',
  median_sales_cycle_days: 'Tempo até fechar',
  avg_sales_cycle_days: 'Tempo médio até fechar',
  stage_aging_days: 'Tempo na etapa atual',
  stage_conversion_rate: 'Avanço entre etapas',

  // Suporte.
  created_tickets: 'Atendimentos abertos',
  resolved_tickets: 'Atendimentos resolvidos',
  open_backlog: 'Fila atual',
  median_backlog_age_days: 'Espera mediana na fila',
  // "Passivo" e não "fila antiga": o que está fora das filas de trabalho não é
  // uma fila mais velha, é um acúmulo que ninguém assumiu.
  dormant_backlog: 'Passivo fora da fila',
  stagnant_in_queue: 'Parados dentro da fila',
  // Nome deliberadamente descritivo e não avaliativo: encerrar no ato pode ser
  // automação inútil ou atendimento genuinamente rápido, e o painel não sabe
  // qual dos dois.
  instant_resolutions: 'Encerrados no mesmo instante em que abriram',
  median_time_to_resolution_days: 'Tempo até resolver',
  avg_time_to_resolution_days: 'Tempo médio até resolver',
  p90_time_to_resolution_days: 'Tempo até resolver, pior caso',
  median_first_response_hours: 'Tempo até a primeira resposta',
  avg_first_response_hours: 'Primeira resposta, média',
  p90_first_response_hours: 'Primeira resposta, pior caso',
  reopen_rate: 'Taxa de reabertura',
  first_response_sla_coverage_percent: 'Prazo de primeira resposta registrado',
  close_sla_coverage_percent: 'Prazo de encerramento registrado',
  historic_backlog: 'Fila ao longo do tempo',

  // Carteira.
  active_customers: 'Clientes ativos',
  mrr_total: 'Receita recorrente',
  arpa: 'Receita média por cliente',
  overdue_customers: 'Clientes com atraso',
  overdue_amount: 'Valor em atraso',
  mrr_overdue: 'Recorrência com atraso',
  mapping_coverage_percent: 'Clientes com cadastro financeiro',
  customers_with_open_tickets: 'Clientes com atendimento aberto',
  mrr_with_critical_ticket: 'Recorrência com atendimento crítico',
  customers_without_recent_activity: 'Clientes sem contato recente',
  mrr_without_recent_activity: 'Recorrência sem contato recente',
  logo_churn_rate: 'Perda de clientes',
  churned_mrr: 'Recorrência perdida',
  new_mrr: 'Recorrência nova',
  nrr: 'Retenção líquida',
  grr: 'Retenção bruta',

  // Financeiro, no Resumo.
  received_amount: 'Recebido no período',
  open_receivables: 'A receber',
  overdue_receivables: 'A receber em atraso',
  overdue_rate: 'Percentual em atraso',
};

/**
 * Resolve o rótulo de um indicador. Um indicador sem rótulo canônico é um
 * defeito de contrato, não algo a improvisar na tela: devolver a chave crua
 * exporia nome interno ao usuário.
 */
export function kpiLabel(key) {
  return KPI_LABELS[key] ?? 'Indicador sem nome definido';
}

/**
 * Verifica se um texto de interface usa termo proibido. Usado pelos testes para
 * impedir que o vocabulário volte a divergir com o tempo.
 */
export function findForbiddenTerms(text) {
  const found = new Set();
  for (const term of Object.keys(FORBIDDEN_TERMS)) {
    const pattern = new RegExp(`(^|[^a-zà-ú])${term}([^a-zà-ú]|$)`, 'i');
    if (pattern.test(String(text))) found.add(term);
  }
  return [...found];
}
