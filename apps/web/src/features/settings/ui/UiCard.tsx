import type { ReactNode } from 'react';

/**
 * Bloco branco com raio generoso, traco leve e sombra suave. A variante `flush`
 * remove o padding para conter uma tabela de borda a borda.
 */
export function UiCard({
  children,
  fill = false,
  flush = false,
  label,
  labelledBy,
}: {
  children: ReactNode;
  /** Estica o card na altura disponível e deixa o corpo rolar por dentro. */
  fill?: boolean;
  flush?: boolean;
  label?: string;
  labelledBy?: string;
}) {
  const classes = ['gso-ui-card'];
  if (flush) classes.push('gso-ui-card--flush');
  if (fill) classes.push('gso-ui-card--fill');

  return (
    <section aria-label={label} aria-labelledby={labelledBy} className={classes.join(' ')}>
      {children}
    </section>
  );
}
