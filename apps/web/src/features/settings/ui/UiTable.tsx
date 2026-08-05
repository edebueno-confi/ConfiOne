import type { ReactNode } from 'react';

/**
 * Moldura da tabela operacional. Vive dentro de um `UiCard` com a variante
 * `flush`, para a tabela encostar na borda arredondada do card.
 */
export function UiTable({
  children,
  label,
  labelledBy,
}: {
  children: ReactNode;
  label?: string;
  labelledBy?: string;
}) {
  return (
    <div className="gso-ui-table-frame">
      <table aria-label={label} aria-labelledby={labelledBy} className="gso-ui-table">
        {children}
      </table>
    </div>
  );
}
