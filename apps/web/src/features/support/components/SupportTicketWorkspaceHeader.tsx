import type { ReactNode } from 'react';

export function SupportTicketWorkspaceHeader({
  ticketCode,
  title,
  badges,
  menuAction,
  requesterLabel,
  assignedLabel,
}: {
  ticketCode: string;
  title: string;
  badges: ReactNode;
  menuAction: ReactNode;
  requesterLabel: string;
  assignedLabel: string;
}) {
  return (
    <header className="shrink-0 border-b border-[color:var(--minimal-border)] bg-[color:var(--minimal-surface)] px-4 py-3 sm:px-5">
      <div className="flex min-w-0 items-start gap-3">
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="text-xs font-medium text-[color:var(--minimal-text-tertiary)]">
              {ticketCode}
            </span>
            <div className="flex flex-wrap items-center gap-1.5">{badges}</div>
          </div>
          <h2 className="mt-1 truncate text-base font-semibold text-[color:var(--minimal-text)] sm:text-lg">
            {title}
          </h2>
          <p className="mt-1 truncate text-xs text-[color:var(--minimal-text-secondary)]">
            {requesterLabel} · Responsável: {assignedLabel}
          </p>
        </div>
        {menuAction}
      </div>
    </header>
  );
}
