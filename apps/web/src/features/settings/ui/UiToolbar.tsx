import type { ReactNode } from 'react';

/** Barra de filtros: superficie com raio grande e as acoes secundarias a direita. */
export function UiToolbar({
  actions,
  children,
  label,
}: {
  actions?: ReactNode;
  children: ReactNode;
  label: string;
}) {
  return (
    <section aria-label={label} className="gso-ui-toolbar">
      {children}
      {actions ? <div className="gso-ui-toolbar-actions">{actions}</div> : null}
    </section>
  );
}
