import type { ReactNode } from 'react';
import { UiIconTile } from './UiIconTile';
import type { UiIconName } from './ui-types';

/** Estado vazio dentro do card: ladrilho neutro, titulo, descricao e acao opcional. */
export function UiEmptyState({
  action,
  description,
  icon = 'inbox',
  title,
}: {
  action?: ReactNode;
  description?: ReactNode;
  icon?: UiIconName;
  title: string;
}) {
  return (
    <div className="gso-ui-empty">
      <UiIconTile icon={icon} tone="neutral" />
      <strong>{title}</strong>
      {description ? <p>{description}</p> : null}
      {action}
    </div>
  );
}
