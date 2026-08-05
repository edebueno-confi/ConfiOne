import type { ReactNode } from 'react';
import { UiIcon } from './UiIcon';
import type { UiIconName } from './ui-types';

/**
 * Lista de definicao: icone pequeno e rotulo secundario a esquerda, valor real
 * a direita. Dado ausente chega aqui como "Indisponivel"; a primitiva nunca
 * inventa valor.
 */
export function UiDetailList({
  columns = false,
  items,
}: {
  columns?: boolean;
  items: readonly { icon: UiIconName; label: string; value: ReactNode }[];
}) {
  return (
    <dl className={columns ? 'gso-ui-details gso-ui-details--columns' : 'gso-ui-details'}>
      {items.map((item) => (
        <div key={item.label}>
          <dt>
            <UiIcon name={item.icon} />
            {item.label}
          </dt>
          <dd>{item.value}</dd>
        </div>
      ))}
    </dl>
  );
}
