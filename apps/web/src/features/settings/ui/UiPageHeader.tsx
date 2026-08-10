import type { ReactNode } from 'react';
import { PageHeader } from '../../../components/page/page-primitives';

/**
 * Cabecalho de uma tela de Configuracoes.
 *
 * Macro-lote 01: passou a ser um alias fino de <PageHeader>, o primitive
 * compartilhado. O titulo agora e <h1> — antes era <h2>, e as telas de
 * Configuracoes ficavam sem nenhum <h1>. A escala visual nao mudou: o CSS ja
 * estilizava h1 e h2 identicamente.
 *
 * A trilha de navegacao pertence a topbar compartilhada do shell. Os
 * parametros de trilha continuam aceitos para nao quebrar chamadas existentes,
 * mas nao renderizam nada.
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
    <PageHeader
      actions={actions}
      description={description}
      eyebrow={eyebrow}
      meta={meta}
      title={title}
      titleId={titleId}
    />
  );
}
