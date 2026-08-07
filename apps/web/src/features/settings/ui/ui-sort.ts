/**
 * Regras de ordenacao do sistema visual de Configuracoes.
 *
 * Modulo sem componente, no mesmo padrao de `ui-types.ts`: mantem o tipo e o
 * helper fora do arquivo do componente para nao quebrar o fast refresh.
 */

/** Direcao corrente da ordenacao de uma coluna. */
export type UiSortDirection = 'asc' | 'desc' | null;

/** Valor de `aria-sort` para o `th` que envolve o botao de ordenacao. */
export function ariaSortOf(direction: UiSortDirection) {
  if (direction === 'asc') return 'ascending' as const;
  if (direction === 'desc') return 'descending' as const;
  return 'none' as const;
}
