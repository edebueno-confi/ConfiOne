import type { ReactNode } from 'react';
import '../settings-ui.css';

/**
 * Canvas de uma tela de Configuracoes. A classe raiz `gso-ui` publica os tokens
 * do sistema visual para tudo que estiver dentro dela.
 */
export function UiPage({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={className ? `gso-ui gso-ui-page ${className}` : 'gso-ui gso-ui-page'}>{children}</div>;
}
