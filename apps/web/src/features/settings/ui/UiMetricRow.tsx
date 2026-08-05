import type { ReactNode } from 'react';

/**
 * Faixa de indicadores: UM card branco com raio grande contendo as celulas,
 * separadas por borda interna a partir da segunda.
 */
export function UiMetricRow({ children, label }: { children: ReactNode; label: string }) {
  return (
    <section aria-label={label} className="gso-ui-metrics">
      {children}
    </section>
  );
}
