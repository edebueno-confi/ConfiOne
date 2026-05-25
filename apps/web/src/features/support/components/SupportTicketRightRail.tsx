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
  statusLabel,
  categoryLabel,
  slaReference,
  slaPolicyName,
  slaRemainingLabel,
  slaProgress,
  assignedLabel,
  quickActions,
  slaPriorityBadge,
  resolutionDueLabel,
  slaDueLabel,
  requesterLabel,
  customerDocumentLabel,
  relatedArticles = [],
}: {
  tenantLabel: string;
  sourceBadge: ReactNode;
  priorityLabel: string;
  priorityIndicator?: ReactNode;
  statusLabel: string;
  categoryLabel: string;
  slaReference: string;
  slaPolicyName: string;
  slaRemainingLabel: string;
  slaProgress: number;
  assignedLabel: string;
  quickActions: SupportTicketRightRailAction[];
  slaPriorityBadge: ReactNode;
  resolutionDueLabel: string;
  slaDueLabel: string;
  requesterLabel: string;
  customerDocumentLabel: string;
  relatedArticles?: Array<{
    id: string;
    title: string;
    summary?: string | null;
  }>;
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
          <SupportSummaryRow label="Status" value={statusLabel} />
          <SupportSummaryRow label="Categoria" value={categoryLabel} />
          <SupportSummaryRow label="Responsável" value={assignedLabel} />
          <SupportSummaryRow label="Solicitante" value={requesterLabel} />
          <SupportSummaryRow label="Documento" value={customerDocumentLabel} />
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

      {relatedArticles.length > 0 ? (
        <SupportRailCard title="Artigos relacionados">
          <div className="space-y-3">
            {relatedArticles.slice(0, 3).map((article) => (
              <article
                className="rounded-[12px] border border-[color:var(--color-support-border)] bg-[color:var(--color-support-surface)] px-3 py-2.5"
                key={article.id}
              >
                <p className="line-clamp-2 text-[11.5px] font-semibold leading-4 text-[color:var(--color-ink)]">
                  {article.title}
                </p>
                {article.summary ? (
                  <p className="mt-1 line-clamp-2 text-[10.5px] leading-4 text-[color:var(--color-muted)]">
                    {article.summary}
                  </p>
                ) : null}
              </article>
            ))}
          </div>
        </SupportRailCard>
      ) : null}

    </SupportRightRail>
  );
}
