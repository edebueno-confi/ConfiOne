// Leitura da distribuição da fila por etapa canônica.
//
// Este módulo existe para que a tela nunca some etapas por conta própria. O
// agrupamento é decisão registrada no banco, na tabela de cruzamento; aqui só se
// lê o resultado e se traduz para linguagem de tela.
//
// A etapa sem decisão humana chega como "Não classificada" e permanece separada.
// Empurrá-la para dentro de outra barra faria o gráfico afirmar um agrupamento
// que ninguém decidiu.

/** Rótulo usado pelo backend para etapa ainda sem decisão. */
export const UNCLASSIFIED_LABEL = 'Não classificada';

/**
 * Lê o payload do cruzamento.
 *
 * Devolve `{ available, rows, unmapped, pendingReview, notice }`.
 *
 * `notice` é a frase que a tela mostra abaixo do gráfico quando há etapa sem
 * cruzamento. Ela é dirigida a quem lê o painel, não a quem mantém o sistema:
 * diz o efeito ("aparecem separadas") e onde resolver, sem nome de tabela.
 */
export function readStageBreakdown(payload) {
  if (!payload || typeof payload !== 'object') {
    return { available: false, rows: [], unmapped: 0, pendingReview: 0, notice: null };
  }

  const stages = Array.isArray(payload.stages) ? payload.stages : [];
  const rows = stages
    .map((stage) => ({
      stage: typeof stage?.stage === 'string' && stage.stage ? stage.stage : UNCLASSIFIED_LABEL,
      order: Number(stage?.stage_order ?? 999),
      openTickets: Number(stage?.open_tickets ?? 0),
      totalTickets: Number(stage?.total_tickets ?? 0),
      byPipeline: Array.isArray(stage?.by_pipeline)
        ? stage.by_pipeline.map((item) => ({
            pipelineLabel: String(item?.pipeline_label ?? ''),
            openTickets: Number(item?.open_tickets ?? 0),
          }))
        : [],
    }))
    // Ordem do fluxo primeiro, volume como desempate. Ordenar só por volume
    // embaralha as etapas e esconde a leitura de funil.
    .sort((a, b) => a.order - b.order || b.openTickets - a.openTickets);

  const unmapped = Number(payload.unmapped ?? 0);
  const pendingReview = Number(payload.pending_review ?? 0);

  return {
    available: rows.length > 0,
    rows,
    unmapped,
    pendingReview,
    notice: buildNotice(unmapped, pendingReview),
  };
}

function buildNotice(unmapped, pendingReview) {
  if (unmapped > 0) {
    return unmapped === 1
      ? 'Uma etapa ainda não foi cruzada e aparece separada, como "Não classificada". O cruzamento é definido em Configurações, Fontes do Dashboard.'
      : `${unmapped} etapas ainda não foram cruzadas e aparecem separadas, como "Não classificada". O cruzamento é definido em Configurações, Fontes do Dashboard.`;
  }
  if (pendingReview > 0) {
    return `O cruzamento inicial foi feito por semelhança de nome e ${pendingReview} etapa(s) ainda aguardam revisão de uma pessoa.`;
  }
  return null;
}

/**
 * Etapas cujo nome foi decidido igual entre pipelines diferentes.
 *
 * Serve à frase de contexto do gráfico: dizer que houve consolidação só faz
 * sentido quando houve, e a evidência é a própria etapa aparecer em mais de um
 * pipeline.
 */
export function consolidatedStages(rows) {
  return rows.filter((row) => row.byPipeline.length > 1).map((row) => row.stage);
}
