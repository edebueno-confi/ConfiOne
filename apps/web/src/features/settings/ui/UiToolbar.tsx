import type { ReactNode } from 'react';

/**
 * Barra de filtros.
 *
 * Por padrao e uma superficie propria, com raio e sombra. Com `inline` ela passa
 * a viver dentro do card que filtra — sem borda, sem sombra, so o filete que a
 * separa da tabela. E o arranjo do blueprint: o filtro pertence a lista, nao a
 * pagina.
 */
export function UiToolbar({
  actions,
  children,
  inline = false,
  label,
}: {
  actions?: ReactNode;
  children: ReactNode;
  inline?: boolean;
  label: string;
}) {
  return (
    <section aria-label={label} className={inline ? 'gso-ui-toolbar gso-ui-toolbar--inline' : 'gso-ui-toolbar'}>
      {children}
      {actions ? <div className="gso-ui-toolbar-actions">{actions}</div> : null}
    </section>
  );
}
