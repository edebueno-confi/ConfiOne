import type { ReactNode } from 'react';
import { PageCanvas } from '../../../components/page/page-primitives';

/**
 * Canvas de uma tela de Configuracoes.
 *
 * Macro-lote 01: passou a ser um alias fino de <PageCanvas>, o primitive
 * compartilhado. Configuracoes deixou de ter um contrato de canvas proprio —
 * a mesma superficie serve Conhecimento, Acessos e demais dominios internos.
 * Mantido para nao reescrever as sete chamadas existentes de uma vez.
 */
export function UiPage({ children, className }: { children: ReactNode; className?: string }) {
  return <PageCanvas className={className}>{children}</PageCanvas>;
}
