import { UiIcon } from './UiIcon';
import { PAGE_GAP, paginationRange, paginationSummary } from './pagination-range.mjs';

/**
 * Rodape de tabela do blueprint: contagem a esquerda, paginacao numerada ao
 * centro e seletor de itens por pagina a direita.
 *
 * A regra de quais numeros aparecem vive em `pagination-range.mjs`, testada sem
 * DOM. Aqui so a marcacao e a navegacao.
 */
export function UiPagination({
  noun,
  nounPlural,
  onPageChange,
  onPerPageChange,
  page,
  perPage,
  perPageOptions = [10, 25, 50],
  total,
}: {
  noun: string;
  nounPlural?: string;
  onPageChange: (next: number) => void;
  onPerPageChange?: (next: number) => void;
  page: number;
  perPage: number;
  perPageOptions?: readonly number[];
  total: number;
}) {
  const pageCount = Math.max(1, Math.ceil(total / Math.max(1, perPage)));
  const slots = paginationRange(page, pageCount);

  return (
    <div className="gso-ui-pagination">
      <p className="gso-ui-pagination-summary">
        {paginationSummary({ noun, nounPlural, page, perPage, total })}
      </p>

      {pageCount > 1 ? (
        <nav aria-label="Paginacao" className="gso-ui-pagination-pages">
          <button
            aria-label="Pagina anterior"
            className="gso-ui-pagination-step"
            disabled={page <= 1}
            onClick={() => onPageChange(page - 1)}
            type="button"
          >
            <UiIcon name="chevron-left" />
          </button>

          {slots.map((slot, index) => (slot === PAGE_GAP
            ? <span aria-hidden="true" className="gso-ui-pagination-gap" key={`gap-${index}`}>…</span>
            : (
              <button
                aria-current={slot === page ? 'page' : undefined}
                className={`gso-ui-pagination-page${slot === page ? ' is-current' : ''}`}
                key={slot}
                onClick={() => onPageChange(slot)}
                type="button"
              >
                {slot}
              </button>
            )))}

          <button
            aria-label="Proxima pagina"
            className="gso-ui-pagination-step"
            disabled={page >= pageCount}
            onClick={() => onPageChange(page + 1)}
            type="button"
          >
            <UiIcon name="chevron-right" />
          </button>
        </nav>
      ) : null}

      {onPerPageChange ? (
        <label className="gso-ui-pagination-size">
          <span className="gso-ui-sr-only">Itens por pagina</span>
          <select
            className="gso-ui-control gso-ui-select"
            onChange={(event) => onPerPageChange(Number(event.currentTarget.value))}
            value={perPage}
          >
            {perPageOptions.map((option) => (
              <option key={option} value={option}>{option} por pagina</option>
            ))}
          </select>
        </label>
      ) : null}
    </div>
  );
}
