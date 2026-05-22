import type { ReactNode, RefObject } from 'react';
import { cx } from '../../../components/ui';
import { SupportConversationPane, SupportConversationThread } from './SupportWorkspacePrimitives';

export function SupportTicketConversationSection({
  header,
  detailNotice,
  detailNoticeTone = 'default',
  thread,
  composer,
  threadScrollRef,
}: {
  header: ReactNode;
  detailNotice?: ReactNode;
  detailNoticeTone?: 'default' | 'critical';
  thread: ReactNode;
  composer: ReactNode;
  threadScrollRef: RefObject<HTMLDivElement | null>;
}) {
  return (
    <div className="min-w-0 flex min-h-0 flex-1 flex-col gap-3 overflow-hidden xl:gap-4">
      {header}
      {detailNotice ? (
        <div
          className={cx(
            'rounded-[14px] border px-3 py-2 text-[12px] leading-5 shadow-[0_6px_12px_rgba(19,33,79,0.05)]',
            detailNoticeTone === 'critical'
              ? 'border-[color:var(--color-danger-border)] bg-[color:var(--color-danger-surface)] text-[color:var(--color-danger-ink)]'
              : 'border-[color:var(--color-border)] bg-[color:var(--color-surface)] text-[color:var(--color-muted)]',
          )}
        >
          {detailNotice}
        </div>
      ) : null}
      <SupportConversationPane>
        <SupportConversationThread scrollRef={threadScrollRef}>{thread}</SupportConversationThread>
        {composer}
      </SupportConversationPane>
    </div>
  );
}
