import type { ReactNode } from 'react';
import { Link } from 'react-router';
import './settings-page-header.css';
import './settings-shell.css';

/**
 * Cabecalho de uma secao de Configuracoes. O titulo global da area continua no
 * shell; aqui fica o breadcrumb, o contexto da secao aberta, o metadado de
 * leitura e as acoes que pertencem a propria secao.
 */
export function SettingsPageHeader({
  actions,
  description,
  eyebrow,
  meta,
  parentHref = '/admin/settings/integrations',
  parentLabel = 'Configurações',
  title,
  titleId,
}: {
  actions?: ReactNode;
  description?: string;
  eyebrow?: string;
  meta?: ReactNode;
  parentHref?: string;
  parentLabel?: string;
  title: string;
  titleId: string;
}) {
  return (
    <header className="gso-settings-page-header">
      <div className="gso-settings-page-header-heading">
        <nav aria-label="Trilha de navegação" className="gso-settings-breadcrumb">
          <Link to={parentHref}>{parentLabel}</Link>
          <span aria-hidden="true">/</span>
          <span aria-current="page">{title}</span>
        </nav>
        {eyebrow ? <p className="gso-settings-eyebrow">{eyebrow}</p> : null}
        <h2 id={titleId}>{title}</h2>
        {description ? <p>{description}</p> : null}
      </div>
      {meta || actions ? (
        <div className="gso-settings-page-header-side">
          {meta ? <p className="gso-settings-page-header-meta">{meta}</p> : null}
          {actions ? <div className="gso-settings-page-header-actions">{actions}</div> : null}
        </div>
      ) : null}
    </header>
  );
}
