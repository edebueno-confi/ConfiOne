import type { FormEventHandler, ReactNode } from 'react';
import { cx } from '../../../components/ui';
import {
  SupportComposer,
  SupportComposerTextarea,
  SupportPrimaryActionButton,
  SupportSecondaryActionButton,
} from './SupportWorkspacePrimitives';

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
}) {
  return (
    <SupportComposer>
      <form className="space-y-3" onSubmit={onSubmit}>
        <div className="flex flex-wrap gap-5 border-b border-[color:var(--color-border)] pb-2">
          <button
            className={cx(
              'inline-flex min-h-7 items-center gap-1 text-[12px] font-semibold transition',
              composerMode === 'public'
                ? 'text-[color:var(--color-brand-blue)]'
                : 'text-[color:var(--color-muted)] hover:text-[color:var(--color-ink)]',
            )}
            disabled={!canUsePublicComposer}
            onClick={onSelectPublicMode}
            type="button"
          >
            Resposta pública
          </button>
          <button
            className={cx(
              'inline-flex min-h-7 items-center gap-1 text-[12px] font-semibold transition',
              composerMode === 'internal'
                ? 'text-[color:var(--color-warning-text)]'
                : 'text-[color:var(--color-muted)] hover:text-[color:var(--color-ink)]',
            )}
            disabled={!canUseInternalComposer}
            onClick={onSelectInternalMode}
            type="button"
          >
            Nota interna
          </button>
          <span className="ml-auto inline-flex min-h-7 items-center text-[11px] font-medium text-[color:var(--color-muted)]">
            {composerMode === 'public'
              ? publicReplyUnavailableReason ?? publicReplyLabel
              : 'Visível apenas para operação interna'}
          </span>
        </div>
        <div className="rounded-[16px] border border-[color:var(--color-support-border)] bg-white px-3 py-3">
          <SupportComposerTextarea
            internal={composerMode === 'internal'}
            onChange={onComposerDraftChange}
            placeholder={
              composerMode === 'public'
                ? 'Digite sua resposta para o cliente...'
                : 'Registre a nota interna da tratativa...'
            }
            value={composerDraft}
          />
          <div
            className={cx(
              'mt-3 flex flex-wrap items-center justify-between gap-3 border-t pt-3',
              composerMode === 'internal' ? 'border-amber-200/80' : 'border-[color:var(--color-border)]',
            )}
          >
            <div className="flex min-w-0 flex-wrap items-center gap-2 text-[11px] font-medium text-[color:var(--color-muted)]">
              <span>
                {composerMode === 'public'
                  ? 'Resposta customer-facing via Portal'
                  : 'Nota interna protegida'}
              </span>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <SupportSecondaryActionButton
                onClick={onOpenEvidenceSurface}
              >
                <span className="inline-flex items-center gap-1.5">
                  {attachmentIcon}
                  Anexar evidência
                </span>
              </SupportSecondaryActionButton>
              <SupportPrimaryActionButton
                className={cx(
                  composerMode === 'internal'
                    ? 'support-primary-action-button--internal'
                    : 'support-primary-action-button--public',
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
              </SupportPrimaryActionButton>
            </div>
          </div>
        </div>
      </form>
    </SupportComposer>
  );
}
