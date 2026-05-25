import type { ReactNode } from 'react';
import { SupportTicketHeader } from './SupportWorkspacePrimitives';

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
    <SupportTicketHeader
      badgeRow={<div className="support-true-ticket-header__badges">{badges}</div>}
      topRow={
        <div className="support-true-ticket-header__top">
          <div className="support-true-ticket-header__identity">
            <span>{ticketCode}</span>
            <h3>{title}</h3>
          </div>
          <div className="support-true-ticket-header__meta" aria-label="Resumo do ticket">
            <span>
              <small>Solicitante</small>
              <strong>{requesterLabel}</strong>
            </span>
            <span>
              <small>Responsável</small>
              <strong>{assignedLabel}</strong>
            </span>
          </div>
          {menuAction}
        </div>
      }
    />
  );
}
