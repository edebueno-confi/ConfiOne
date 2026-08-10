import { useCallback, useRef, type KeyboardEvent, type ReactNode } from 'react';
/*
 * A folha de estilo do sistema visual interno ainda mora em features/settings
 * por razoes historicas: foi ali que o blueprint Configuration PO V2 nasceu.
 * Ela nao pertence mais a Configuracoes — e a camada de apresentacao de TODAS
 * as superficies internas. O import vive aqui para que qualquer dominio consuma
 * os primitives sem atravessar fronteira de feature.
 */
import '../../features/settings/settings-ui.css';

/**
 * PRIMITIVES ESTRUTURAIS — CONFI ONE V1 (Macro-lote 01)
 *
 * Contrato extraido do Dashboard Gerencial (golden reference):
 *
 *   SHELL (sidebar + topbar)
 *     -> PageShell             superficie do dominio
 *          -> PageShellChrome  page header + tabs, colados no topo
 *          -> PageCanvas       area de trabalho, um degrau abaixo
 *               -> paineis, filtros, tabelas
 *
 * Regra: paginas CONSOMEM este contrato. Paginas nao definem shell, nao
 * declaram background estrutural e nao criam a propria regua horizontal.
 */

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ');
}

/** Raiz de uma superficie de dominio. Publica os tokens e segura a altura. */
export function PageShell({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx('gso-ui', 'gso-ui-shell', className)}>{children}</div>;
}

/** Faixa superior fixa: page header e, quando houver, as abas do dominio. */
export function PageShellChrome({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx('gso-ui-shell-chrome', className)}>{children}</div>;
}

/** Corpo rolavel da superficie. */
export function PageShellBody({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cx('gso-ui-shell-body', className)}>{children}</div>;
}

/**
 * Canvas da pagina. Aplica a regua horizontal canonica (--one-space-page-x) e o
 * respiro vertical padrao. Use `fill` quando o conteudo precisar ocupar toda a
 * altura restante (listas com rolagem propria, master-detail).
 */
export function PageCanvas({
  children,
  className,
  fill = false,
}: {
  children: ReactNode;
  className?: string;
  fill?: boolean;
}) {
  return (
    <div className={cx('gso-ui', 'gso-ui-page', fill && 'gso-ui-page--fill', className)}>{children}</div>
  );
}

/**
 * Page header canonico: eyebrow opcional, titulo, descricao, meta e acoes.
 *
 * O titulo e o UNICO <h1> da tela. A trilha de navegacao pertence a topbar
 * compartilhada do shell; renderiza-la aqui produziria dois breadcrumbs
 * empilhados.
 */
export function PageHeader({
  actions,
  description,
  eyebrow,
  meta,
  title,
  titleId,
  as = 'h1',
}: {
  actions?: ReactNode;
  description?: ReactNode;
  eyebrow?: string;
  meta?: ReactNode;
  title: string;
  titleId: string;
  as?: 'h1' | 'h2';
}) {
  const Heading = as;

  return (
    <header className="gso-ui-header">
      <div className="gso-ui-header-heading">
        {eyebrow ? <p className="gso-ui-eyebrow">{eyebrow}</p> : null}
        <Heading id={titleId}>{title}</Heading>
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

export interface PageTabItem {
  key: string;
  label: string;
  badge?: ReactNode;
  disabled?: boolean;
}

/**
 * Abas horizontais do dominio. Definicao unica de estilo em index.css
 * (.gso-ui-tabs / .gso-ui-tab). Indicador ativo em rosa Genius, 2px.
 *
 * Navegacao por teclado conforme WAI-ARIA Tabs: setas movem, Home/End vao aos
 * extremos, e o item ativo e o unico focalizavel na sequencia de tabulacao.
 */
export function PageTabs({
  items,
  activeKey,
  onSelect,
  ariaLabel,
  className,
}: {
  items: readonly PageTabItem[];
  activeKey: string;
  onSelect: (key: string) => void;
  ariaLabel: string;
  className?: string;
}) {
  const listRef = useRef<HTMLDivElement | null>(null);

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLDivElement>) => {
      if (!['ArrowLeft', 'ArrowRight', 'Home', 'End'].includes(event.key)) {
        return;
      }

      const enabled = items.filter((item) => !item.disabled);
      if (enabled.length === 0) {
        return;
      }

      const current = enabled.findIndex((item) => item.key === activeKey);
      let next = current < 0 ? 0 : current;

      if (event.key === 'ArrowLeft') {
        next = (next - 1 + enabled.length) % enabled.length;
      } else if (event.key === 'ArrowRight') {
        next = (next + 1) % enabled.length;
      } else if (event.key === 'Home') {
        next = 0;
      } else {
        next = enabled.length - 1;
      }

      event.preventDefault();
      const target = enabled[next];
      onSelect(target.key);
      listRef.current?.querySelector<HTMLButtonElement>(`[data-tab-key="${target.key}"]`)?.focus();
    },
    [activeKey, items, onSelect],
  );

  return (
    <div
      ref={listRef}
      className={cx('gso-ui-tabs', className)}
      role="tablist"
      aria-label={ariaLabel}
      onKeyDown={handleKeyDown}
    >
      {items.map((item) => {
        const active = item.key === activeKey;

        return (
          <button
            key={item.key}
            type="button"
            role="tab"
            data-tab-key={item.key}
            className="gso-ui-tab"
            aria-selected={active}
            aria-current={active ? 'page' : undefined}
            aria-disabled={item.disabled || undefined}
            disabled={item.disabled}
            tabIndex={active ? 0 : -1}
            onClick={() => {
              if (!item.disabled) {
                onSelect(item.key);
              }
            }}
          >
            {item.label}
            {item.badge != null ? <span className="gso-ui-tab-badge">{item.badge}</span> : null}
          </button>
        );
      })}
    </div>
  );
}
