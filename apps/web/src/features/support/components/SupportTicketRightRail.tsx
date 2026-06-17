import type { ReactNode } from 'react';

export interface SupportTicketRightRailAction {
  key: string;
  icon: ReactNode;
  label: string;
  onClick: () => void;
}

function RailSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="border-b border-[color:var(--minimal-border)] px-4 py-4 last:border-b-0">
      <h3 className="text-xs font-semibold uppercase tracking-[0.08em] text-[color:var(--minimal-text-tertiary)]">
        {title}
      </h3>
      <div className="mt-3">{children}</div>
    </section>
  );
}

function RailRow({
  label,
  value,
}: {
  label: string;
  value: ReactNode;
}) {
  return (
    <div className="grid grid-cols-[92px_minmax(0,1fr)] gap-3 py-1.5 text-xs">
      <dt className="text-[color:var(--minimal-text-tertiary)]">{label}</dt>
      <dd className="min-w-0 truncate text-right font-medium text-[color:var(--minimal-text)]">
        {value}
      </dd>
    </div>
  );
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
    <aside
      className="flex h-full min-h-0 min-w-0 flex-col overflow-y-auto border-l border-[color:var(--minimal-border)] bg-[color:var(--minimal-sidebar)]"
      data-ticket-rail
    >
      <RailSection title="Contexto">
        <dl>
          <RailRow label="Cliente" value={tenantLabel} />
          <RailRow label="Status" value={statusLabel} />
          <RailRow
            label="Prioridade"
            value={
              <span className="inline-flex items-center justify-end gap-1">
                {priorityIndicator}
                {priorityLabel}
              </span>
            }
          />
          <RailRow label="Categoria" value={categoryLabel} />
          <RailRow label="Responsável" value={assignedLabel} />
          <RailRow label="Solicitante" value={requesterLabel} />
          <RailRow label="Documento" value={customerDocumentLabel} />
        </dl>
        <div className="mt-2 flex justify-end">{sourceBadge}</div>
      </RailSection>

      <RailSection title="Ações">
        <div className="grid">
          {quickActions.map((action) => (
            <button
              className="flex min-h-10 items-center gap-2 border-b border-[color:var(--minimal-border)] px-1 text-left text-sm text-[color:var(--minimal-text-secondary)] last:border-b-0 hover:text-[color:var(--minimal-text)]"
              key={action.key}
              onClick={action.onClick}
              type="button"
            >
              <span className="text-[color:var(--minimal-text-tertiary)]">{action.icon}</span>
              {action.label}
            </button>
          ))}
        </div>
      </RailSection>

      <RailSection title="SLA">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium text-[color:var(--minimal-text)]">{slaReference}</p>
            <p className="mt-1 text-xs text-[color:var(--minimal-text-tertiary)]">{slaPolicyName}</p>
          </div>
          {slaPriorityBadge}
        </div>
        <dl className="mt-3">
          <RailRow label="Resolução" value={resolutionDueLabel} />
          <RailRow label="Vencimento" value={slaDueLabel} />
        </dl>
        <div className="mt-3 flex items-center gap-2">
          <meter className="h-1.5 min-w-0 flex-1" max={100} min={0} value={slaProgress} />
          <span className="text-xs text-[color:var(--minimal-text-tertiary)]">{slaProgress}%</span>
        </div>
        <p className="mt-2 text-xs text-[color:var(--minimal-text-secondary)]">{slaRemainingLabel}</p>
      </RailSection>

      {relatedArticles.length > 0 ? (
        <RailSection title="Conhecimento relacionado">
          <div className="grid gap-3">
            {relatedArticles.slice(0, 3).map((article) => (
              <article key={article.id}>
                <p className="line-clamp-2 text-sm font-medium leading-5 text-[color:var(--minimal-text)]">
                  {article.title}
                </p>
                {article.summary ? (
                  <p className="mt-1 line-clamp-2 text-xs leading-5 text-[color:var(--minimal-text-tertiary)]">
                    {article.summary}
                  </p>
                ) : null}
              </article>
            ))}
          </div>
        </RailSection>
      ) : null}
    </aside>
  );
}
