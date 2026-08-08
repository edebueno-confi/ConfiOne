/**
 * Regra pura da paginacao numerada.
 *
 * Fica fora do componente para ser testavel sem DOM. Devolve a sequencia de
 * botoes que o blueprint mostra: primeira pagina, uma janela ao redor da atual,
 * ultima pagina e reticencias onde houver salto.
 */

/** Marcador de salto. A tela renderiza como texto inerte, nunca como botao. */
export const PAGE_GAP = 'gap';

/**
 * @param {number} current pagina atual, base 1
 * @param {number} total total de paginas
 * @param {number} window quantas paginas mostrar de cada lado da atual
 * @returns {Array<number|'gap'>}
 */
export function paginationRange(current, total, window = 1) {
  if (!Number.isFinite(total) || total <= 0) return [];
  const last = Math.max(1, Math.trunc(total));
  const page = Math.min(Math.max(1, Math.trunc(current) || 1), last);
  if (last <= 1) return [1];

  const wanted = new Set([1, last]);
  for (let offset = -window; offset <= window; offset += 1) {
    const candidate = page + offset;
    if (candidate >= 1 && candidate <= last) wanted.add(candidate);
  }

  const pages = [...wanted].sort((a, b) => a - b);
  const output = [];
  let previous = 0;
  for (const value of pages) {
    if (previous && value - previous > 1) output.push(PAGE_GAP);
    output.push(value);
    previous = value;
  }
  return output;
}

/**
 * Texto do rodape: "Mostrando 1 a 6 de 32 usuarios".
 * Com zero itens devolve a forma vazia, sem intervalo inventado.
 *
 * @param {{ page: number, perPage: number, total: number, noun: string, nounPlural?: string }} input
 */
export function paginationSummary({ page, perPage, total, noun, nounPlural }) {
  const plural = nounPlural ?? `${noun}s`;
  if (!total || total <= 0) return `Nenhum ${noun}`;
  const first = (Math.max(1, page) - 1) * perPage + 1;
  const lastShown = Math.min(total, Math.max(1, page) * perPage);
  if (first > total) return `Nenhum ${noun} nesta pagina`;
  return `Mostrando ${first} a ${lastShown} de ${total} ${total === 1 ? noun : plural}`;
}
