import { UiIconTile } from './UiIconTile';
import type { UiIconName, UiTone } from './ui-types';

/**
 * Interruptor rotulado do blueprint: ladrilho de icone, titulo, descricao e o
 * controle a direita.
 *
 * O controle e um `input[type=checkbox]` real, com `role=switch`, para que
 * teclado e leitor de tela funcionem sem ARIA improvisada. A pintura fica na
 * folha de estilo; aqui so o marcador semantico.
 *
 * Use `readOnly` quando o estado vier do backend mas nao houver comando de
 * escrita publicado: o interruptor aparece desabilitado e a tela declara o
 * motivo. Interruptor que nao grava nunca deve parecer acionavel.
 */
export function UiToggleField({
  checked,
  description,
  icon,
  label,
  name,
  onChange,
  readOnly = false,
  tone = 'primary',
}: {
  checked: boolean;
  description?: string;
  icon?: UiIconName;
  label: string;
  name: string;
  onChange?: (next: boolean) => void;
  readOnly?: boolean;
  tone?: UiTone;
}) {
  const describedBy = description ? `${name}-description` : undefined;

  return (
    <div className={`gso-ui-toggle-field${readOnly ? ' gso-ui-toggle-field--readonly' : ''}`}>
      {icon ? <UiIconTile icon={icon} tone={tone} /> : null}
      <div className="gso-ui-toggle-field-text">
        <label className="gso-ui-toggle-field-label" htmlFor={name}>{label}</label>
        {description ? <p className="gso-ui-toggle-field-hint" id={describedBy}>{description}</p> : null}
      </div>
      <input
        aria-describedby={describedBy}
        checked={checked}
        className="gso-ui-switch"
        disabled={readOnly}
        id={name}
        name={name}
        onChange={(event) => onChange?.(event.currentTarget.checked)}
        role="switch"
        type="checkbox"
      />
    </div>
  );
}
