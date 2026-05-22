import type { ReactNode } from 'react';
import { SupportTicketHeader } from './SupportWorkspacePrimitives';

export function SupportTicketWorkspaceHeader({
  ticketCode,
  title,
  badges,
  menuAction,
}: {
  ticketCode: string;
  title: string;
  badges: ReactNode;
  menuAction: ReactNode;
}) {
  return (
    <SupportTicketHeader
      badgeRow={<div className="flex flex-wrap items-center gap-1.5">{badges}</div>}
      topRow={
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              <span className="shrink-0 text-[1.35rem] font-extrabold tracking-[-0.05em] text-[color:var(--color-brand-navy)]">
                {ticketCode}
              </span>
              <h3 className="min-w-0 flex-1 truncate text-[1.08rem] font-bold leading-tight tracking-[-0.03em] text-[color:var(--color-ink)]">
                {title}
              </h3>
            </div>
          </div>
          {menuAction}
        </div>
      }
    />
  );
}
