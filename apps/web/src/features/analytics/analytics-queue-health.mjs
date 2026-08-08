// Contrato de apresentação da saúde da fila.
//
// Traduz a medição de estagnação para linguagem de tela, e — mais importante —
// impede que o passivo seja lido como um segundo número de fila. São naturezas
// diferentes: um é trabalho em curso, o outro é dívida acumulada. Se a tela
// tratar os dois como indicadores iguais, o leitor soma mentalmente e volta ao
// número enganoso de onde partimos.

/** Papéis possíveis, e como cada um se chama na tela. */
const PAPEIS = {
  trabalhada: 'Fila de trabalho',
  caixa_de_entrada: 'Caixa de entrada',
  a_classificar: 'A classificar',
};

export function queueRoleLabel(role) {
  return PAPEIS[role] ?? PAPEIS.a_classificar;
}

/**
 * Lê a medição de saúde da fila.
 *
 * Devolve `{ available, threshold, inQueue, stagnant, stagnantRate, pipelines,
 * classified, total, notice }`.
 *
 * `notice` é a frase que a tela mostra e muda conforme o estágio da decisão:
 * enquanto ninguém classificou, ela diz que o recorte ainda não vale; depois,
 * diz quantos pipelines faltam.
 */
export function readQueueHealth(payload) {
  if (!payload || typeof payload !== 'object') {
    return {
      available: false, threshold: null, inQueue: 0, stagnant: 0, stagnantRate: null,
      pipelines: [], classified: 0, total: 0, notice: null, ageBuckets: [],
      unknown: 0, measured: 0, moving: 0, partial: false, coverageWarning: null,
      byGroupCompany: [], waitingThirdParty: 0, unowned: 0, waitingUndecided: 0,
    };
  }

  const threshold = Number(payload.stagnation_threshold_days ?? 0) || null;
  const inQueue = Number(payload.total_in_queue ?? 0);
  const stagnant = Number(payload.total_stagnant ?? 0);
  const unknown = Number(payload.total_unknown_activity ?? 0);
  const classified = Number(payload.classified_pipelines ?? 0);
  const total = Number(payload.total_pipelines ?? 0);
  const medidos = inQueue - unknown;

  const pipelines = (Array.isArray(payload.pipelines) ? payload.pipelines : [])
    .map((row) => ({
      pipelineId: String(row?.pipeline_id ?? ''),
      // O nome oficial é o rótulo. O apelido vem ao lado, nunca no lugar: foi o
      // apelido sozinho que fez "CS | Neotrust" ser aprovado como "Suporte".
      label: String(row?.pipeline_name ?? row?.pipeline_label ?? ''),
      alias: row?.pipeline_alias ? String(row.pipeline_alias) : null,
      groupCompany: String(row?.group_company ?? 'a_definir'),
      groupCompanyConfirmed: row?.group_company_source === 'confirmed',
      waitingThirdParty: Number(row?.waiting_third_party ?? 0),
      unowned: Number(row?.unowned ?? 0),
      waitingUndecided: Number(row?.waiting_undecided ?? 0),
      role: typeof row?.queue_role === 'string' ? row.queue_role : 'a_classificar',
      inQueue: Number(row?.in_queue ?? 0),
      stagnant: Number(row?.stagnant ?? 0),
      unknownActivity: Number(row?.unknown_activity ?? 0),
      stagnantRate: row?.stagnant_rate === null || row?.stagnant_rate === undefined
        ? null
        : Number(row.stagnant_rate),
      arrived30d: Number(row?.arrived_30d ?? 0),
      medianAgeDays: row?.median_age_days === null || row?.median_age_days === undefined
        ? null
        : Number(row.median_age_days),
    }));

  // As faixas existem para que o limiar de estagnação possa ser conferido por
  // quem lê, em vez de aceito como dado. Sem elas, "parado há mais de 180 dias"
  // é uma afirmação que ninguém tem como pesar.
  const ageBuckets = (Array.isArray(payload.age_buckets) ? payload.age_buckets : [])
    .map((row) => ({
      bucket: String(row?.bucket ?? ''),
      tickets: Number(row?.tickets ?? 0),
      order: Number(row?.sort_order ?? 99),
    }))
    .filter((row) => row.bucket !== '' && row.tickets > 0)
    .sort((a, b) => a.order - b.order);

  // A operação do grupo é a dimensão que faltava. O portal do HubSpot é
  // compartilhado, e somar Confi, Neotrust e Aftersale num indicador único
  // produz um número que não serve para nenhuma das três.
  const byGroupCompany = (Array.isArray(payload.by_group_company) ? payload.by_group_company : [])
    .map((row) => ({
      company: String(row?.group_company ?? 'a_definir'),
      pipelines: Number(row?.pipelines ?? 0),
      inQueue: Number(row?.in_queue ?? 0),
      unowned: Number(row?.unowned ?? 0),
      waitingThirdParty: Number(row?.waiting_third_party ?? 0),
      confirmedPipelines: Number(row?.confirmed_pipelines ?? 0),
    }))
    .sort((a, b) => b.inQueue - a.inQueue);

  return {
    ageBuckets,
    byGroupCompany,
    // "Sem dono" é o problema de atendimento. "Esperando terceiro" é fila
    // legítima que ninguém encerrou. Tratar os dois como a mesma coisa inflou o
    // problema em quase o triplo na leitura anterior.
    waitingThirdParty: Number(payload.total_waiting_third_party ?? 0),
    unowned: Number(payload.total_unowned ?? 0),
    waitingUndecided: Number(payload.total_waiting_undecided ?? 0),
    // A medição só existe se houver fila E se ao menos parte dela tiver data de
    // atividade. Sem data nenhuma, dizer "0 em movimento" seria publicar
    // ausência de dado com a confiança de um zero medido.
    available: inQueue > 0 && pipelines.length > 0 && medidos > 0,
    threshold,
    inQueue,
    stagnant,
    unknown,
    measured: Math.max(0, medidos),
    // Divisão por zero devolve null, e a tela mostra "Indisponível" — nunca 0%,
    // que afirmaria que nada está parado.
    stagnantRate: medidos > 0 ? Math.round((stagnant / medidos) * 1000) / 10 : null,
    moving: Math.max(0, medidos - stagnant),
    // Metade sem data já basta para a leitura deixar de ser confiável.
    partial: inQueue > 0 && unknown > 0,
    coverageWarning: buildCoverageWarning(inQueue, unknown),
    pipelines,
    classified,
    total,
    notice: buildNotice(classified, total),
  };
}

/**
 * Aviso de cobertura da medição.
 *
 * Existe porque a ausência de data de atividade não é um detalhe técnico: sem
 * ela, não há como separar fila que anda de fila que apodrece, e o painel
 * precisa dizer isso em vez de escolher um dos dois lados.
 */
function buildCoverageWarning(inQueue, unknown) {
  if (inQueue === 0 || unknown === 0) return null;
  if (unknown >= inQueue) {
    return 'Nenhum atendimento da fila tem registro de última atividade, então não é possível separar o que está em andamento do que está parado. A sincronização precisa trazer esse dado.';
  }
  const pct = Math.round((unknown / inQueue) * 100);
  return `${unknown.toLocaleString('pt-BR')} atendimentos (${pct}%) não têm registro de última atividade e ficam fora desta leitura.`;
}

function buildNotice(classified, total) {
  if (total === 0) return null;
  if (classified === 0) {
    return 'Nenhum pipeline teve o papel definido ainda, então "Fila atual" segue contando todos eles. A contagem só muda depois que alguém decidir quais são filas de trabalho.';
  }
  if (classified < total) {
    const faltam = total - classified;
    return faltam === 1
      ? 'Um pipeline ainda não teve o papel definido e segue contando na fila.'
      : `${faltam} pipelines ainda não tiveram o papel definido e seguem contando na fila.`;
  }
  return null;
}

/**
 * Pipelines cuja evidência sugere que não são fila de trabalho.
 *
 * Isto **não** classifica nada: é leitura, oferecida a quem vai decidir. O
 * critério é conservador de propósito — muito parado **e** quase nada entrando —
 * porque um pipeline com entrada saudável e acúmulo é um problema de capacidade,
 * não de escopo, e apontá-lo aqui levaria à decisão errada.
 */
export function suggestsInbox(pipeline, threshold = 60) {
  if (!pipeline || pipeline.inQueue < 20) return false;
  // Sem taxa medida não há leitura a oferecer. Apontar mesmo assim seria
  // sugerir uma decisão sem base.
  if (pipeline.stagnantRate === null || pipeline.stagnantRate === undefined) return false;
  return pipeline.stagnantRate >= threshold && pipeline.arrived30d <= 5;
}
