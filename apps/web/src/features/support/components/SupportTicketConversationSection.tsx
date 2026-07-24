import type { ReactNode, RefObject } from 'react';
import { cx } from '../../../components/ui';

export function SupportTicketConversationSection({
  header,
  detailNotice,
  detailNoticeTone = 'default',
  thread,
  composer,
  threadScrollRef,
  tabs,
}: {
  header: ReactNode;
  detailNotice?: ReactNode;
  detailNoticeTone?: 'default' | 'critical';
  thread: ReactNode;
  composer: ReactNode;
  threadScrollRef: RefObject<HTMLDivElement | null>;
  tabs?: ReactNode;
}) {
  return (
    <section className="flex min-h-0 min-w-0 flex-1 flex-col overflow-hidden bg-[color:var(--minimal-surface)]">
      {header}
      {tabs ? (
        <div className="shrink-0 border-b border-[color:var(--minimal-border)] bg-[color:var(--minimal-sidebar)]">
          {tabs}
        </div>
      ) : null}
      {detailNotice ? (
        <div
          className={cx(
            'mx-4 mt-3 rounded-md border px-3 py-2 text-xs leading-5 sm:mx-5',
            detailNoticeTone === 'critical'
              ? 'border-[color:var(--minimal-danger-border)] bg-[color:var(--minimal-danger-surface)] text-[color:var(--minimal-danger-text)]'
              : 'border-[color:var(--minimal-border)] bg-[color:var(--minimal-surface-muted)] text-[color:var(--minimal-text-secondary)]',
          )}
        >
          {detailNotice}
        </div>
      ) : null}
      <div
        className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5"
        data-ticket-thread-scroll
        ref={threadScrollRef}
      >
        {thread}
      </div>
      {composer}
    </section>
  );
}
