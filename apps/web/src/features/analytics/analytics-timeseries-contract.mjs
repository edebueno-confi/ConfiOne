// Contrato de apresentação das séries de evolução.
//
// Mesma responsabilidade do contrato de KPI: é o único ponto que traduz o
// payload técnico em linguagem de tela. Nenhum componente lê os campos crus.
//
// A regra que este módulo protege é a que o painel inteiro já segue: série sem
// história suficiente devolve motivo explícito e a tela mostra a frase, nunca um
// gráfico plano em zero.

/** Grãos aceitos. Qualquer outro valor cai em mês. */
export const TIMESERIES_GRAINS = ['day', 'week', 'month'];

const GRAIN_LABELS = {
  day: 'Por dia',
  week: 'Por semana',
  month: 'Por mês',
};

const UNAVAILABLE_REASONS = {
  history_insufficient:
    'Ainda não há histórico suficiente para desenhar uma evolução confiável deste tema.',
};

export function grainLabel(grain) {
  return GRAIN_LABELS[grain] ?? GRAIN_LABELS.month;
}

/**
 * Lê o payload da série.
 *
 * Devolve sempre a mesma forma, para que a tela não precise de condicionais
 * espalhadas: `{ available, points, legend, reason, grain }`.
 *
 * Uma série é considerada indisponível em três situações, e não apenas na
 * primeira: o backend declarou motivo; a lista veio vazia; ou todos os pontos
 * têm valor zero em todas as medidas. O terceiro caso importa porque uma série
 * inteira em zero é indistinguível de ausência de dado, e desenhá-la afirma que
 * "não aconteceu nada" quando a verdade é "não sabemos".
 */
export function readTimeseries(payload, measures = []) {
  if (!payload || typeof payload !== 'object') {
    return { available: false, points: [], legend: {}, reason: UNAVAILABLE_REASONS.history_insufficient, grain: 'month' };
  }

  const grain = TIMESERIES_GRAINS.includes(payload.grain) ? payload.grain : 'month';
  const legend = payload.legend && typeof payload.legend === 'object' ? payload.legend : {};
  const declared = payload.unavailable_reason;

  if (typeof declared === 'string' && declared.length > 0) {
    return {
      available: false,
      points: [],
      legend,
      reason: UNAVAILABLE_REASONS[declared] ?? UNAVAILABLE_REASONS.history_insufficient,
      grain,
    };
  }

  const points = Array.isArray(payload.series) ? payload.series : [];
  if (points.length === 0) {
    return { available: false, points: [], legend, reason: UNAVAILABLE_REASONS.history_insufficient, grain };
  }

  if (measures.length > 0) {
    const temSinal = points.some((point) =>
      measures.some((measure) => {
        const value = point?.[measure];
        return typeof value === 'number' && value !== 0;
      }),
    );
    if (!temSinal) {
      return { available: false, points: [], legend, reason: UNAVAILABLE_REASONS.history_insufficient, grain };
    }
  }

  return { available: true, points, legend, reason: null, grain };
}

/**
 * Descreve a coorte de uma medida, para o rodapé do gráfico.
 *
 * A legenda vem do backend justamente para que a frase não possa divergir da
 * fórmula. Medida sem legenda declarada devolve `null`, e a tela omite a linha
 * em vez de inventar uma explicação.
 */
export function measureBasis(legend, measure) {
  const value = legend?.[measure];
  return typeof value === 'string' && value.length > 0 ? value : null;
}

/** Todas as coortes declaradas, na ordem pedida, já filtradas. */
export function describeCohorts(legend, measures) {
  return measures
    .map((measure) => measureBasis(legend, measure))
    .filter((text) => text !== null);
}
