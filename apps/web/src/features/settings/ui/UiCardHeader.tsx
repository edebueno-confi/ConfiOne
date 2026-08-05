import type { ReactNode } from 'react';
import { UiIconTile } from './UiIconTile';
import type { UiIconName, UiTone } from './ui-types';

/**
 * Cabecalho de card: ladrilho de icone opcional, titulo, descricao e as acoes
 * do proprio card alinhadas a direita.
 */
export function UiCardHeader({
  actions,
  description,
  icon,
  title,
  titleId,
  tone = 'primary',
}: {
  actions?: ReactNode;
  description?: string;
  icon?: UiIconName;
  title: string;
  titleId?: string;
  tone?: UiTone;
}) {
  return (
    <div className={icon ? 'gso-ui-card-header' : 'gso-ui-card-header gso-ui-card-header--plain'}>
      {icon ? <UiIconTile icon={icon} tone={tone} /> : null}
      <div className="gso-ui-card-header-text">
        <h3 id={titleId}>{title}</h3>
        {description ? <p>{description}</p> : null}
      </div>
      {actions ? <div className="gso-ui-card-header-actions">{actions}</div> : null}
    </div>
  );
}
