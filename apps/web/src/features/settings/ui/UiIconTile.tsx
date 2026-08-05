import { UiIcon } from './UiIcon';
import type { UiIconName, UiTone } from './ui-types';

/**
 * Ladrilho de icone: quadrado com raio, fundo tonal e o glifo na cor do tom.
 * E o elemento que da o ar premium do sistema; entra nos indicadores e nos
 * cabecalhos de card.
 */
export function UiIconTile({
  icon,
  size = 'md',
  tone = 'neutral',
}: {
  icon: UiIconName;
  size?: 'sm' | 'md';
  tone?: UiTone;
}) {
  return (
    <span aria-hidden="true" className={`gso-ui-tile gso-ui-tile--${tone}${size === 'sm' ? ' gso-ui-tile--sm' : ''}`}>
      <UiIcon name={icon} size={size === 'sm' ? 16 : 18} />
    </span>
  );
}
