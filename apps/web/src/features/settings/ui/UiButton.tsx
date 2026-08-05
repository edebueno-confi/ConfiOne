import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { UiIcon } from './UiIcon';
import type { UiIconName } from './ui-types';

/**
 * Botao do sistema visual. Suporta icone linear a esquerda e as quatro
 * variantes aprovadas. Nao altera comportamento: e so apresentacao sobre o
 * `<button>` nativo.
 */
export function UiButton({
  children,
  className,
  compact = false,
  icon,
  variant = 'secondary',
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  children: ReactNode;
  compact?: boolean;
  icon?: UiIconName;
  variant?: 'primary' | 'secondary' | 'ghost' | 'danger';
}) {
  const base = `gso-ui-button gso-ui-button--${variant}${compact ? ' gso-ui-button--compact' : ''}`;
  return (
    <button className={className ? `${base} ${className}` : base} type="button" {...rest}>
      {icon ? <UiIcon name={icon} /> : null}
      {children}
    </button>
  );
}
