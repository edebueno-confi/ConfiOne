import type { ReactNode } from 'react';

/**
 * Campo de formulario: rotulo acima em caixa normal, controle, texto de apoio e
 * mensagem de erro. O `id` do erro e devolvido para o controle referenciar com
 * `aria-describedby`, que continua sendo responsabilidade de quem monta o campo.
 */
export function UiField({
  children,
  error,
  errorId,
  hint,
  hintId,
  label,
  wide = false,
}: {
  children: ReactNode;
  error?: string | null;
  errorId?: string;
  hint?: ReactNode;
  hintId?: string;
  label: ReactNode;
  wide?: boolean;
}) {
  return (
    <label className={wide ? 'gso-ui-field gso-ui-field--wide' : 'gso-ui-field'}>
      <span className="gso-ui-field-label">{label}</span>
      {children}
      {hint ? <span className="gso-ui-field-hint" id={hintId}>{hint}</span> : null}
      {error ? <span className="gso-ui-field-error" id={errorId}>{error}</span> : null}
    </label>
  );
}
