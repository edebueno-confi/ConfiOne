import { useRef } from 'react';
import type { FormEventHandler, ReactNode } from 'react';
import { cx } from '../../../components/ui';

export function SupportTicketComposerSection({
  composerMode,
  canUsePublicComposer,
  canUseInternalComposer,
  composerDraft,
  composerDisabled,
  publicReplyLabel,
  publicReplyUnavailableReason,
  submitting,
  onSelectPublicMode,
  onSelectInternalMode,
  onComposerDraftChange,
  onOpenEvidenceSurface,
  onSubmit,
  attachmentIcon,
  onOpenStatusSurface,
}: {
  composerMode: 'public' | 'internal';
  canUsePublicComposer: boolean;
  canUseInternalComposer: boolean;
  composerDraft: string;
  composerDisabled: boolean;
  publicReplyLabel: string;
  publicReplyUnavailableReason: string | null;
  submitting: boolean;
  onSelectPublicMode: () => void;
  onSelectInternalMode: () => void;
  onComposerDraftChange: (value: string) => void;
  onOpenEvidenceSurface: () => void;
  onSubmit: FormEventHandler<HTMLFormElement>;
  attachmentIcon: ReactNode;
  onOpenStatusSurface: () => void;
}) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  function applyComposerToken(kind: 'bold' | 'italic' | 'list' | 'link') {
    if (composerDisabled) {
      return;
    }

    const textarea = textareaRef.current;
    const selectionStart = textarea?.selectionStart ?? composerDraft.length;
    const selectionEnd = textarea?.selectionEnd ?? composerDraft.length;
    const selected = composerDraft.slice(selectionStart, selectionEnd);
    const before = composerDraft.slice(0, selectionStart);
    const after = composerDraft.slice(selectionEnd);
    const fallback = selected || (kind === 'link' ? 'texto do link' : 'texto');
    const replacements: Record<typeof kind, string> = {
      bold: `**${fallback}**`,
      italic: `_${fallback}_`,
      list: selected
        ? selected
            .split('\n')
            .map((line) => (line.trim() ? `- ${line.replace(/^-\s*/, '')}` : line))
            .join('\n')
        : '- ',
      link: `[${fallback}](https://)`,
    };

    const replacement = replacements[kind];
    onComposerDraftChange(`${before}${replacement}${after}`);
    window.setTimeout(() => {
      textarea?.focus();
      const cursor = before.length + replacement.length;
      textarea?.setSelectionRange(cursor, cursor);
    }, 0);
  }

  const availabilityLabel =
    composerMode === 'public'
      ? publicReplyUnavailableReason ?? publicReplyLabel
      : 'Visível apenas para a operação interna';

  return (
    <div
      className="shrink-0 border-t border-[color:var(--minimal-border)] bg-[color:var(--minimal-surface)] px-4 py-3 sm:px-5"
      data-ticket-composer
    >
      <form onSubmit={onSubmit}>
        <div className="flex flex-wrap items-center gap-1 border-b border-[color:var(--minimal-border)]">
          <button
            className={cx(
              'min-h-9 border-b-2 px-2 text-sm',
              composerMode === 'public'
                ? 'border-[color:var(--minimal-action)] font-medium text-[color:var(--minimal-text)]'
                : 'border-transparent text-[color:var(--minimal-text-secondary)]',
            )}
            disabled={!canUsePublicComposer}
            onClick={onSelectPublicMode}
            type="button"
          >
            Resposta pública
          </button>
          <button
            className={cx(
              'min-h-9 border-b-2 px-2 text-sm',
              composerMode === 'internal'
                ? 'border-[color:var(--minimal-warning-text)] font-medium text-[color:var(--minimal-text)]'
                : 'border-transparent text-[color:var(--minimal-text-secondary)]',
            )}
            disabled={!canUseInternalComposer}
            onClick={onSelectInternalMode}
            type="button"
          >
            Nota interna
          </button>
          <span className="ml-auto hidden text-xs text-[color:var(--minimal-text-tertiary)] md:block">
            {availabilityLabel}
          </span>
        </div>

        <div
          className={cx(
            'mt-3 overflow-hidden rounded-lg border bg-[color:var(--minimal-surface)]',
            composerMode === 'internal'
              ? 'border-[color:var(--minimal-warning-border)]'
              : 'border-[color:var(--minimal-border-strong)]',
          )}
        >
          <div className="flex items-center gap-1 border-b border-[color:var(--minimal-border)] px-2 py-1" aria-label="Ferramentas de edição">
            {[
              ['B', 'Negrito', 'bold'],
              ['I', 'Itálico', 'italic'],
              ['•', 'Lista', 'list'],
              ['↗', 'Link', 'link'],
            ].map(([label, title, kind]) => (
              <button
                className="inline-flex h-8 min-w-8 items-center justify-center rounded text-xs font-medium text-[color:var(--minimal-text-secondary)] hover:bg-[color:var(--minimal-surface-muted)] hover:text-[color:var(--minimal-text)]"
                disabled={composerDisabled}
                key={title}
                onClick={() => applyComposerToken(kind as Parameters<typeof applyComposerToken>[0])}
                title={title}
                type="button"
              >
                {label}
              </button>
            ))}
          </div>
          <textarea
            className={cx(
              'min-h-24 w-full resize-none bg-transparent px-3 py-3 text-sm leading-6 text-[color:var(--minimal-text)] outline-none placeholder:text-[color:var(--minimal-text-tertiary)]',
              composerMode === 'internal' && 'bg-[color:var(--minimal-warning-surface)]',
            )}
            disabled={composerDisabled}
            onChange={(event) => onComposerDraftChange(event.target.value)}
            placeholder={
              composerMode === 'public'
                ? 'Escreva uma resposta para o cliente...'
                : 'Registre uma nota interna...'
            }
            ref={textareaRef}
            value={composerDraft}
          />
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="mr-auto text-xs text-[color:var(--minimal-text-tertiary)] md:hidden">
            {availabilityLabel}
          </span>
          <button
            className="inline-flex h-9 items-center gap-1.5 rounded-md px-2.5 text-sm text-[color:var(--minimal-text-secondary)] hover:bg-[color:var(--minimal-surface-muted)]"
            onClick={onOpenEvidenceSurface}
            type="button"
          >
            {attachmentIcon}
            Anexar
          </button>
          {composerMode === 'public' ? (
            <button
              className="h-9 rounded-md px-2.5 text-sm text-[color:var(--minimal-text-secondary)] hover:bg-[color:var(--minimal-surface-muted)]"
              onClick={onOpenStatusSurface}
              type="button"
            >
              Alterar status
            </button>
          ) : null}
          <button
            className={cx(
              'h-9 rounded-md px-4 text-sm font-medium',
              composerMode === 'internal'
                ? 'bg-[color:var(--minimal-warning-text)] text-[color:var(--minimal-action-ink)]'
                : 'bg-[color:var(--minimal-action)] text-[color:var(--minimal-action-ink)]',
            )}
            disabled={composerDisabled}
            type="submit"
          >
            {submitting
              ? composerMode === 'public'
                ? 'Enviando...'
                : 'Salvando...'
              : composerMode === 'public'
                ? 'Enviar resposta'
                : 'Salvar nota'}
          </button>
        </div>
      </form>
    </div>
  );
}
