import type { ReactNode } from 'react';

/**
 * Bloco branco com raio generoso, traco leve e sombra suave. A variante `flush`
 * remove o padding para conter uma tabela de borda a borda.
 */
export function UiCard({
  children,
  flush = false,
  label,
  labelledBy,
}: {
  children: ReactNode;
  flush?: boolean;
  label?: string;
  labelledBy?: string;
}) {
  return (
    <section
      aria-label={label}
      aria-labelledby={labelledBy}
      className={flush ? 'gso-ui-card gso-ui-card--flush' : 'gso-ui-card'}
    >
      {children}
    </section>
  );
}
