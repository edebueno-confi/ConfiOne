import type { ReactNode } from 'react';
import {
  SupportQuickActionButton,
  SupportQuickActionGrid,
  SupportRailCard,
  SupportRightRail,
  SupportSummaryRow,
  SupportTicketSummaryCard,
} from './SupportWorkspacePrimitives';

export interface SupportTicketRightRailAction {
  key: string;
  icon: ReactNode;
  label: string;
  onClick: () => void;
}

export function SupportTicketRightRail({
  tenantLabel,
  sourceBadge,
  priorityLabel,
  priorityIndicator,
  slaReference,
  slaPolicyName,
  slaRemainingLabel,
  slaProgress,
  assignedLabel,
  quickActions,
  slaPriorityBadge,
  resolutionDueLabel,
  slaDueLabel,
}: {
  tenantLabel: string;
  sourceBadge: ReactNode;
  priorityLabel: string;
  priorityIndicator?: ReactNode;
  slaReference: string;
  slaPolicyName: string;
  slaRemainingLabel: string;
  slaProgress: number;
  assignedLabel: string;
  quickActions: SupportTicketRightRailAction[];
  slaPriorityBadge: ReactNode;
  resolutionDueLabel: string;
  slaDueLabel: string;
}) {
  return (
    <SupportRightRail>
      <SupportRailCard title="Resumo do ticket">
        <SupportTicketSummaryCard>
          <SupportSummaryRow
            label="Cliente"
            value={
              <div className="flex items-center justify-between gap-2">
                <span className="truncate">{tenantLabel}</span>
                {sourceBadge}
              </div>
            }
          />
          <SupportSummaryRow
            label="Prioridade"
            value={
              <div className="flex items-center justify-between gap-2">
                <span>{priorityLabel}</span>
                {priorityIndicator}
              </div>
            }
          />
          <SupportSummaryRow
            label="SLA interno"
            value={
              <div className="space-y-1.5">
                <p>{slaReference}</p>
                <p className="text-[10.5px] font-medium text-[color:var(--color-muted)]">{slaPolicyName}</p>
                <p className="text-[10.5px] font-medium text-[color:var(--color-muted)]">{slaRemainingLabel}</p>
                <div className="flex items-center gap-2">
                  <meter className="support-sla-meter" max={100} min={0} value={slaProgress} />
                  <span className="text-[10.5px] font-semibold text-[color:var(--color-muted)]">{slaProgress}%</span>
                </div>
              </div>
            }
          />
          <SupportSummaryRow label="Responsável" value={assignedLabel} />
        </SupportTicketSummaryCard>
      </SupportRailCard>

      <SupportRailCard title="Ações rápidas">
        <SupportQuickActionGrid>
          {quickActions.map((action) => (
            <SupportQuickActionButton
              className="min-h-[52px] gap-1 px-2 py-2 text-[10.5px]"
              icon={action.icon}
              key={action.key}
              label={action.label}
              onClick={action.onClick}
            />
          ))}
        </SupportQuickActionGrid>
      </SupportRailCard>

      <SupportRailCard title="SLA interno">
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-2">
            <div>
              <p className="text-[12px] font-semibold text-[color:var(--color-ink)]">{slaReference}</p>
              <p className="mt-0.5 text-[10.5px] text-[color:var(--color-muted)]">{slaPolicyName}</p>
            </div>
            {slaPriorityBadge}
          </div>
          <div className="space-y-1.5">
            <p className="text-[11px] font-semibold text-[color:var(--color-ink)]">Prazo total: {resolutionDueLabel}</p>
            <p className="text-[11px] text-[color:var(--color-muted)]">Vencimento: {slaDueLabel}</p>
            <p className="text-[11px] text-[color:var(--color-muted)]">{slaRemainingLabel}</p>
          </div>
          <div className="flex items-center gap-2">
            <meter className="support-sla-meter" max={100} min={0} value={slaProgress} />
            <span className="text-[10.5px] font-semibold text-[color:var(--color-muted)]">{slaProgress}%</span>
          </div>
        </div>
      </SupportRailCard>
    </SupportRightRail>
  );
}
