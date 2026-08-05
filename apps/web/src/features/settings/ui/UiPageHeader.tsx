import type { ReactNode } from 'react';
import { Link } from 'react-router';

/**
 * Cabecalho de uma tela de Configuracoes: trilha curta, titulo grande na fonte
 * de corpo, descricao e as acoes da propria tela. Sem rotulo em caixa alta.
 */
export function UiPageHeader({
  actions,
  description,
  meta,
  parentHref = '/admin/settings/integrations',
  parentLabel = 'Configurações',
  title,
  titleId,
}: {
  actions?: ReactNode;
  description?: string;
  meta?: ReactNode;
  parentHref?: string;
  parentLabel?: string;
  title: string;
  titleId: string;
}) {
  return (
    <header className="gso-ui-header">
      <div className="gso-ui-header-heading">
        <nav aria-label="Trilha de navegação" className="gso-ui-crumbs">
          <Link to={parentHref}>{parentLabel}</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{title}</span>
        </nav>
        <h2 id={titleId}>{title}</h2>
        {description ? <p>{description}</p> : null}
      </div>
      {meta || actions ? (
        <div className="gso-ui-header-side">
          {meta ? <p className="gso-ui-header-meta">{meta}</p> : null}
          {actions ? <div className="gso-ui-header-actions">{actions}</div> : null}
        </div>
      ) : null}
    </header>
  );
}
