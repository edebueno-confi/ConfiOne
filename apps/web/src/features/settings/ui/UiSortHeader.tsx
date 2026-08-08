import { UiIcon } from './UiIcon';
import type { UiSortDirection } from './ui-sort';

/**
 * Cabecalho de coluna ordenavel.
 *
 * Deve ser usado dentro de um `th`, que carrega o `aria-sort` vindo de
 * `ariaSortOf` — o estado da ordenacao pertence a celula, nao ao botao. Colunas
 * sem ordenacao real no read model continuam como texto simples: seta que nao
 * ordena e mentira visual.
 */
export function UiSortHeader({
  direction,
  label,
  onSort,
}: {
  direction: UiSortDirection;
  label: string;
  onSort: () => void;
}) {
  const glyph = direction === 'asc' ? 'sort-asc' : direction === 'desc' ? 'sort-desc' : 'sort';

  return (
    <button
      className={`gso-ui-sort-header${direction ? ' is-sorted' : ''}`}
      onClick={onSort}
      type="button"
    >
      {label}
      <UiIcon name={glyph} />
    </button>
  );
}
