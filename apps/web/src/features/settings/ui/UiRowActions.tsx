import { useEffect, useId, useRef, useState } from 'react';
import { UiIcon } from './UiIcon';

/** Uma acao do menu de linha. `tone` marca a acao destrutiva. */
export type UiRowAction = {
  disabled?: boolean;
  label: string;
  onSelect: () => void;
  tone?: 'default' | 'danger';
};

/**
 * Menu de acoes da linha, no padrao de tres pontos do blueprint.
 *
 * Fecha no Escape e no clique fora. Acoes sem permissao chegam com `disabled`,
 * nunca ausentes sem explicacao — o operador precisa ver que a acao existe e
 * que ele nao pode executa-la.
 */
export function UiRowActions({
  actions,
  label,
}: {
  actions: readonly UiRowAction[];
  label: string;
}) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return undefined;

    function onPointerDown(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') setOpen(false);
    }

    document.addEventListener('mousedown', onPointerDown);
    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
      document.removeEventListener('keydown', onKeyDown);
    };
  }, [open]);

  if (actions.length === 0) return null;

  return (
    <div className="gso-ui-row-actions" ref={containerRef}>
      <button
        aria-controls={open ? menuId : undefined}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-label={label}
        className="gso-ui-row-actions-trigger"
        onClick={() => setOpen((current) => !current)}
        type="button"
      >
        <UiIcon name="more" size={18} />
      </button>

      {open ? (
        <div className="gso-ui-row-actions-menu" id={menuId} role="menu">
          {actions.map((action) => (
            <button
              className={`gso-ui-row-actions-item${action.tone === 'danger' ? ' is-danger' : ''}`}
              disabled={action.disabled}
              key={action.label}
              onClick={() => {
                setOpen(false);
                action.onSelect();
              }}
              role="menuitem"
              type="button"
            >
              {action.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
