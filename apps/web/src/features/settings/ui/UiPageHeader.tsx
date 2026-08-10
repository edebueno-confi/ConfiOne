import type { ReactNode } from 'react';

/**
 * Cabecalho de uma tela de Configuracoes: titulo, descricao e as acoes da
 * propria tela. Sem rotulo em caixa alta.
 *
 * Configuration PO V2.1: a trilha de navegacao pertence a topbar compartilhada
 * do shell. Mante-la aqui produzia dois breadcrumbs empilhados, o que o
 * blueprint aprovado nao tem. Os parametros de trilha continuam aceitos para
 * nao quebrar as chamadas existentes, mas nao renderizam nada.
 */
export function UiPageHeader({
  actions,
  description,
  eyebrow,
  meta,
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
    <header className="gso-ui-header">
      <div className="gso-ui-header-heading">
        {eyebrow ? (
          <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[color:var(--one-info,#4DA3FF)]">
            {eyebrow}
          </p>
        ) : null}
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
