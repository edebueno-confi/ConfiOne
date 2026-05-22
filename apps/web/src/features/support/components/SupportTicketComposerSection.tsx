import type { FormEventHandler, ReactNode } from 'react';
import { AppButton, GhostButton, TextareaInput, cx } from '../../../components/ui';
import { SupportComposer } from './SupportWorkspacePrimitives';

export function SupportTicketComposerSection({
  composerMode,
  canUsePublicComposer,
  canUseInternalComposer,
  composerDraft,
  composerDisabled,
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
        </div>
        <div className="rounded-[16px] border border-[color:var(--color-support-border)] bg-white px-3 py-3">
          <TextareaInput
            className={cx(
              'min-h-[84px] w-full resize-none overflow-hidden rounded-[12px] border px-3 py-3 text-[13px] leading-5 shadow-none focus:ring-0',
              composerMode === 'internal'
                ? 'border-amber-200 bg-[color:var(--color-support-note)] placeholder:text-[rgba(125,92,13,0.7)]'
                : 'border-[color:var(--color-support-border)] bg-white',
            )}
            onChange={(event) => onComposerDraftChange(event.target.value)}
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
            <div className="flex flex-wrap items-center gap-1.5">
              {['B', 'I', 'U', '≡', '⋯'].map((item) => (
                <button
                  className="inline-flex min-h-8 min-w-8 items-center justify-center rounded-[10px] border border-[color:var(--color-support-border)] bg-[color:var(--color-support-surface)] px-0 text-[10px] font-semibold text-[color:var(--color-muted)]"
                  disabled
                  key={item}
                  title="Disponível em breve"
                  type="button"
                >
                  {item}
                </button>
              ))}
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <GhostButton
                className="min-h-9 rounded-[12px] px-3 text-[11px]"
                onClick={onOpenEvidenceSurface}
                type="button"
              >
                <span className="inline-flex items-center gap-1.5">
                  {attachmentIcon}
                  Anexar evidência
                </span>
              </GhostButton>
              <AppButton
                className={cx(
                  'min-h-10 rounded-[12px] px-4 text-[12px] text-white disabled:opacity-60',
                  composerMode === 'internal'
                    ? 'bg-[linear-gradient(135deg,#9a5d12,#f5b83d)] shadow-[0_10px_18px_rgba(245,184,61,0.22)]'
                    : 'bg-[color:var(--color-brand-blue)] shadow-[0_12px_20px_rgba(47,107,255,0.18)]',
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
              </AppButton>
            </div>
          </div>
        </div>
      </form>
    </SupportComposer>
  );
}
