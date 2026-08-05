import type { ReactNode } from 'react';
import { GeniusMascot } from '../../../components/GeniusMascot';

/**
 * Faixa de contexto: fundo tonal sem borda dura, com o mascote do Genio em
 * tamanho pequeno como elemento de identidade. Nao e ilustracao decorativa: a
 * faixa carrega o que a tela nao resolve.
 */
export function UiHintBand({ description, title }: { description: ReactNode; title: string }) {
  return (
    <section className="gso-ui-hint">
      <span className="gso-ui-hint-figure">
        <GeniusMascot animated={false} size="sm" />
      </span>
      <div className="gso-ui-hint-text">
        <strong>{title}</strong>
        <p>{description}</p>
      </div>
    </section>
  );
}
