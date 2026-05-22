import {
  type FormEvent,
  type ReactNode,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Link, useParams } from 'react-router-dom';
import { formatDateTime } from '../../app/format';
import { EmptyState, ErrorState, LoadingState } from '../../components/states';
import {
  AppButton,
  Field,
  GhostButton,
  GovernedActionDrawer,
  InlineNotice,
  SelectInput,
  StatusPill,
  TextareaInput,
  TextInput,
  cx,
} from '../../components/ui';
import {
  ENGINEERING_WORK_ITEM_STATUSES,
  ENGINEERING_WORK_ITEM_TYPES,
  type EngineeringWorkspaceTicketLink,
  type EngineeringWorkspaceUpdate,
  type EngineeringWorkspaceWorkItem,
  type EngineeringWorkItemStatus,
  type EngineeringWorkItemType,
} from '../../contracts/support-contracts';
import { classifyAdminError } from '../admin/admin-errors';
import { useAuthContext } from '../auth/auth-context';
import {
  addEngineeringWorkItemUpdate,
  assignEngineeringWorkItem,
  getEngineeringWorkItemDetail,
  listEngineeringWorkItemTicketLinks,
  listEngineeringWorkItemUpdates,
  listEngineeringWorkItemsQueue,
  returnEngineeringWorkItemToSupport,
  unassignEngineeringWorkItem,
  updateEngineeringWorkItemStatus,
} from './engineering-api';

type Phase = 'loading' | 'ready' | 'contract-unavailable' | 'error';
type EngineeringActionDrawer = 'status' | 'update' | 'return' | null;
type EngineeringQuickFilter =
  | 'all'
  | 'mine'
  | 'unassigned'
  | 'triage'
  | 'returned_to_support'
  | 'waiting_external';

interface WorkItemDetail extends EngineeringWorkspaceWorkItem {
  linkedTickets?: unknown[];
}

interface StatusDraft {
  status: EngineeringWorkItemStatus;
  summary: string;
  nextStep: string;
}

interface UpdateDraft {
  summary: string;
  nextStep: string;
}

function humanizeWorkItemType(type: EngineeringWorkItemType) {
  switch (type) {
    case 'bug':
      return 'Bug';
    case 'improvement':
      return 'Melhoria';
    case 'technical_task':
      return 'Tarefa técnica';
    case 'investigation':
      return 'Investigação';
  }
}

function toneForWorkItemType(type: EngineeringWorkItemType) {
  if (type === 'bug') {
    return 'critical' as const;
  }

  if (type === 'improvement') {
    return 'accent' as const;
  }

  if (type === 'investigation') {
    return 'positive' as const;
  }

  return 'default' as const;
}

function humanizeEngineeringStatus(status: EngineeringWorkItemStatus) {
  switch (status) {
    case 'triage':
      return 'Em triagem';
    case 'accepted':
      return 'Aceito';
    case 'rejected':
      return 'Rejeitado';
    case 'in_progress':
      return 'Em execução';
    case 'waiting_external':
      return 'Aguardando externo';
    case 'returned_to_support':
      return 'Pronto para retorno';
    case 'released':
      return 'Concluído';
    case 'cancelled':
      return 'Cancelado';
  }
}

function toneForEngineeringStatus(status: EngineeringWorkItemStatus) {
  if (status === 'released') {
    return 'positive' as const;
  }

  if (status === 'rejected' || status === 'cancelled') {
    return 'critical' as const;
  }

  if (status === 'waiting_external' || status === 'returned_to_support') {
    return 'warning' as const;
  }

  if (status === 'in_progress' || status === 'accepted') {
    return 'accent' as const;
  }

  return 'default' as const;
}

function humanizePriority(priority: string | null | undefined) {
  switch (priority) {
    case 'low':
      return 'Baixa';
    case 'normal':
      return 'Normal';
    case 'high':
      return 'Alta';
    case 'urgent':
      return 'Urgente';
    default:
      return 'Indisponível';
  }
}

function toneForPriority(priority: string | null | undefined) {
  if (priority === 'urgent' || priority === 'high') {
    return 'critical' as const;
  }

  if (priority === 'normal') {
    return 'warning' as const;
  }

  if (priority === 'low') {
    return 'positive' as const;
  }

  return 'default' as const;
}

function humanizeImpact(value: string | null | undefined) {
  switch (value) {
    case 'critical':
      return 'Crítico';
    case 'high':
      return 'Alto';
    case 'medium':
      return 'Médio';
    case 'low':
      return 'Baixo';
    default:
      return 'Indisponível';
  }
}

function humanizeOperationalText(value: string | null | undefined, fallback = 'Indisponível') {
  if (!value?.trim()) {
    return fallback;
  }

  return value
    .replace(/\bpayload sensível\b/gi, 'conteúdo sensível')
    .replace(/\bpayload\b/gi, 'conteúdo sensível')
    .replace(/\bendpoint\b/gi, 'serviço de integração');
}

function emptyStatusDraft(currentStatus: EngineeringWorkItemStatus = 'triage'): StatusDraft {
  return {
    status: currentStatus,
    summary: '',
    nextStep: '',
  };
}

function emptyUpdateDraft(): UpdateDraft {
  return {
    summary: '',
    nextStep: '',
  };
}

function compactWorkItemCode(item: EngineeringWorkspaceWorkItem) {
  return `WI-${item.engineeringWorkItemId.slice(0, 8).toUpperCase()}`;
}

function initialsFromName(value: string | null | undefined) {
  const parts = (value ?? 'Indisponível')
    .split(/[\s@._-]+/)
    .map((part) => part.trim())
    .filter(Boolean)
    .slice(0, 2);

  return parts.length > 0
    ? parts.map((part) => part[0]?.toLocaleUpperCase('pt-BR') ?? '').join('')
    : 'IN';
}

function MetricIcon({ tone }: { tone: 'blue' | 'amber' | 'orange' | 'violet' | 'green' }) {
  const classes = {
    blue: 'bg-[rgba(48,127,226,0.1)] text-[color:var(--color-brand-blue)]',
    amber: 'bg-[rgba(245,158,11,0.12)] text-[rgb(180,83,9)]',
    orange: 'bg-[rgba(249,115,22,0.12)] text-[rgb(194,65,12)]',
    violet: 'bg-[rgba(124,58,237,0.11)] text-[rgb(109,40,217)]',
    green: 'bg-[rgba(16,185,129,0.12)] text-[rgb(4,120,87)]',
  }[tone];

  return (
    <span className={cx('inline-flex h-9 w-9 items-center justify-center rounded-full text-[18px]', classes)}>
      ●
    </span>
  );
}

function CompactPill({
  children,
  tone = 'default',
}: {
  children: ReactNode;
  tone?: 'default' | 'accent' | 'positive' | 'warning' | 'critical';
}) {
  const classes = {
    default: 'border-[color:var(--color-border)] bg-[color:var(--color-surface)] text-[color:var(--color-ink)]',
    accent: 'border-[rgba(48,127,226,0.28)] bg-[rgba(48,127,226,0.1)] text-[color:var(--color-brand-blue)]',
    positive: 'border-[color:var(--color-success-border)] bg-[color:var(--color-success-surface)] text-[color:var(--color-success-text)]',
    warning: 'border-[color:var(--color-warning-border)] bg-[color:var(--color-warning-surface)] text-[color:var(--color-warning-text)]',
    critical: 'border-[color:var(--color-danger-border)] bg-[color:var(--color-danger-surface)] text-[color:var(--color-danger-text)]',
  }[tone];

  return (
    <span
      className={cx(
        'inline-flex max-w-full items-center rounded-full border px-2 py-1 text-[9px] font-semibold uppercase leading-none tracking-[0.14em]',
        classes,
      )}
    >
      <span className="truncate">{children}</span>
    </span>
  );
}

function EngineeringSummaryStrip({
  triage,
  inProgress,
  waitingExternal,
  returnedToSupport,
  released,
}: {
  triage: number;
  inProgress: number;
  waitingExternal: number;
  returnedToSupport: number;
  released: number;
}) {
  const items = [
    { label: 'Em triagem', value: triage, tone: 'blue' as const },
    { label: 'Em execução', value: inProgress, tone: 'amber' as const },
    { label: 'Aguardando externo', value: waitingExternal, tone: 'orange' as const },
    { label: 'Prontos para retorno', value: returnedToSupport, tone: 'violet' as const },
    { label: 'Concluídos', value: released, tone: 'green' as const },
  ];

  return (
    <div className="grid shrink-0 gap-[var(--workspace-panel-gap)] lg:grid-cols-5">
      {items.map((item) => (
        <div
          className="flex min-h-[var(--workspace-kpi-min-height)] items-center gap-3 rounded-[16px] border border-[color:var(--color-border)] bg-white/95 px-4 py-[var(--workspace-card-y)] shadow-[0_8px_16px_rgba(19,33,79,0.04)]"
          key={item.label}
        >
          <MetricIcon tone={item.tone} />
          <div className="min-w-0">
            <p className="truncate text-[11px] font-semibold text-[color:var(--color-ink)]">
              {item.label}
            </p>
            <p className="mt-0.5 text-[1.15rem] font-semibold tracking-[-0.04em] text-[color:var(--color-ink)]">
              {item.value}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

function WorkItemRow({
  active,
  item,
}: {
  active: boolean;
  item: EngineeringWorkspaceWorkItem;
}) {
  return (
    <Link
      className={cx(
        'grid min-h-[55px] grid-cols-[minmax(230px,1.75fr)_78px_94px_minmax(96px,0.78fr)_78px_minmax(98px,0.78fr)_74px_82px] items-center gap-1.5 border-b border-[color:var(--color-border)] px-3 py-1.5 text-left transition last:border-b-0',
        active
          ? 'rounded-[12px] border border-[rgba(48,127,226,0.55)] bg-[linear-gradient(90deg,rgba(48,127,226,0.11),rgba(255,255,255,0.96))] shadow-[0_10px_22px_rgba(19,33,79,0.08)]'
          : 'hover:bg-[color:var(--color-surface)]',
      )}
      to={`/engineering/work-items/${item.engineeringWorkItemId}`}
    >
      <div className="min-w-0">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[color:var(--color-brand-blue)]">
          {compactWorkItemCode(item)}
        </p>
        <p className="mt-0.5 line-clamp-1 text-[12.5px] font-semibold text-[color:var(--color-ink)]">
          {item.title}
        </p>
        <p className="mt-0.5 line-clamp-1 text-[10.5px] text-[color:var(--color-muted)]">
          {humanizeOperationalText(item.description)}
        </p>
      </div>
      <div className="min-w-0 truncate">
        <CompactPill tone={toneForWorkItemType(item.workItemType)}>
          {humanizeWorkItemType(item.workItemType)}
        </CompactPill>
      </div>
      <div className="min-w-0 truncate">
        <CompactPill tone={toneForEngineeringStatus(item.status)}>
          {humanizeEngineeringStatus(item.status)}
        </CompactPill>
      </div>
      <div className="min-w-0">
        <p className="truncate text-[12px] font-semibold text-[color:var(--color-ink)]">
          {item.tenantName ?? 'Indisponível'}
        </p>
        <p className="text-[10px] text-[color:var(--color-muted)]">{item.tenantSlug}</p>
      </div>
      <div className="min-w-0">
        {item.originTicketId ? (
          <span className="truncate text-[12px] font-semibold text-[color:var(--color-brand-blue)]">
            #{item.originTicketId.slice(0, 8)}
          </span>
        ) : (
          <span className="text-[12px] text-[color:var(--color-muted)]">Indisponível</span>
        )}
      </div>
      <div className="flex min-w-0 items-center gap-2">
        <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-[color:var(--color-border)] bg-[color:var(--color-surface)] text-[10px] font-semibold text-[color:var(--color-brand-navy)]">
          {initialsFromName(item.assignedToFullName)}
        </span>
        <span className="truncate text-[12px] font-semibold text-[color:var(--color-ink)]">
          {item.assignedToFullName ?? 'Indisponível'}
        </span>
      </div>
      <div className="min-w-0 truncate">
        <CompactPill tone={toneForPriority(item.priority)}>{humanizePriority(item.priority)}</CompactPill>
      </div>
      <p className="text-right text-[11px] leading-4 text-[color:var(--color-muted)]">
        {formatDateTime(item.updatedAt)}
      </p>
    </Link>
  );
}

function QuickFilterButton({
  active,
  disabled,
  helper,
  label,
  onClick,
  value,
}: {
  active: boolean;
  disabled: boolean;
  helper: string;
  label: string;
  onClick: () => void;
  value: number | null;
}) {
  return (
    <button
      className={cx(
        'flex min-h-[34px] items-center justify-between gap-2 rounded-[12px] border px-3 py-1.5 text-left transition',
        active
          ? 'border-[rgba(48,127,226,0.34)] bg-[rgba(48,127,226,0.1)] text-[color:var(--color-brand-blue)]'
          : 'border-[color:var(--color-border)] bg-white text-[color:var(--color-ink)] hover:border-[rgba(48,127,226,0.24)] hover:bg-[color:var(--color-surface)]',
        disabled ? 'cursor-not-allowed opacity-55 hover:bg-white' : '',
      )}
      disabled={disabled}
      onClick={onClick}
      type="button"
    >
      <span className="min-w-0">
        <span className="block text-[11.5px] font-semibold">{label}</span>
        <span className="block truncate text-[9.5px] text-[color:var(--color-muted)]">{helper}</span>
      </span>
      <span className="text-[12px] font-semibold">{value ?? 'Indisponível'}</span>
    </button>
  );
}

function CenterContextCard({
  title,
  label,
  children,
  tone = 'default',
}: {
  title: string;
  label: string;
  children: ReactNode;
  tone?: 'default' | 'blue' | 'warning' | 'critical';
}) {
  return (
    <section
      className={cx(
        'min-h-[118px] rounded-[16px] border px-4 py-3 shadow-[0_8px_18px_rgba(19,33,79,0.04)]',
        tone === 'default' && 'border-[color:var(--color-border)] bg-white',
        tone === 'blue' && 'border-[rgba(48,127,226,0.24)] bg-[rgba(48,127,226,0.06)]',
        tone === 'warning' && 'border-[color:var(--color-warning-border)] bg-[color:var(--color-warning-surface)]',
        tone === 'critical' && 'border-[color:var(--color-danger-border)] bg-[color:var(--color-danger-surface)]',
      )}
    >
      <p className="text-[10px] font-semibold uppercase tracking-[0.17em] text-[color:var(--color-muted)]">
        {label}
      </p>
      <h3 className="mt-1 text-[13px] font-semibold tracking-[-0.02em] text-[color:var(--color-ink)]">
        {title}
      </h3>
      <div className="mt-2 text-[12px] leading-5 text-[color:var(--color-muted)]">{children}</div>
    </section>
  );
}

function RailDetailLine({
  label,
  value,
  href,
}: {
  label: string;
  value: string;
  href?: string;
}) {
  const content = href ? (
    <Link className="font-semibold text-[color:var(--color-brand-blue)] hover:underline" to={href}>
      {value}
    </Link>
  ) : (
    <span className="font-semibold text-[color:var(--color-ink)]">{value}</span>
  );

  return (
    <div className="grid grid-cols-[104px_minmax(0,1fr)] gap-2.5 border-b border-[color:var(--color-border)] py-1.5 last:border-b-0">
      <span className="text-[10.5px] text-[color:var(--color-muted)]">{label}</span>
      <span className="min-w-0 truncate text-[11.5px]">{content}</span>
    </div>
  );
}

function WorkItemRail({
  selected,
  links,
  updates,
  submitting,
  onAssignToMe,
  onUnassign,
  onOpenStatus,
  onOpenUpdate,
  onOpenReturn,
}: {
  selected: WorkItemDetail | null;
  links: EngineeringWorkspaceTicketLink[];
  updates: EngineeringWorkspaceUpdate[];
  submitting: boolean;
  onAssignToMe: () => void;
  onUnassign: () => void;
  onOpenStatus: () => void;
  onOpenUpdate: () => void;
  onOpenReturn: () => void;
}) {
  if (!selected) {
    return (
      <EmptyState
        title="Nenhum item selecionado"
        description="Selecione uma linha técnica para ver contexto, vínculo com suporte e ações reais."
      />
    );
  }

  const originLink = links[0] ?? null;
  const latestUpdate = updates[0] ?? null;
  const originTicketId = originLink?.ticketId ?? selected.originTicketId ?? null;
  const originTicketTitle = originLink?.ticketTitle ?? selected.originTicketTitle ?? null;

  return (
    <div className="grid min-h-0 gap-1.5">
      <section className="rounded-[16px] border border-[rgba(48,127,226,0.22)] bg-[linear-gradient(180deg,rgba(8,24,61,1),rgba(13,36,92,0.98))] px-4 py-3 text-white shadow-[0_14px_28px_rgba(8,22,61,0.22)]">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-white/58">
          Item selecionado
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-1.5">
          <h2 className="mr-auto text-[1.15rem] font-semibold tracking-[-0.045em]">
            {compactWorkItemCode(selected)}
          </h2>
          <StatusPill tone={toneForWorkItemType(selected.workItemType)}>
            {humanizeWorkItemType(selected.workItemType)}
          </StatusPill>
          <StatusPill tone={toneForEngineeringStatus(selected.status)}>
            {humanizeEngineeringStatus(selected.status)}
          </StatusPill>
        </div>
        <StatusPill tone={toneForPriority(selected.priority)}>
          {humanizePriority(selected.priority)}
        </StatusPill>
        <h3 className="mt-2 line-clamp-2 text-[0.98rem] font-semibold leading-tight tracking-[-0.035em]">
          {selected.title}
        </h3>
        <p className="mt-1 line-clamp-2 text-[11.5px] leading-[1.125rem] text-white/74">
          {humanizeOperationalText(selected.description)}
        </p>
      </section>

      <section className="rounded-[14px] border border-[color:var(--color-border)] bg-white px-3 py-2">
        <RailDetailLine label="Cliente" value={selected.tenantName ?? 'Indisponível'} />
        <RailDetailLine
          href={originTicketId ? `/support/tickets/${originTicketId}` : undefined}
          label="Ticket de origem"
          value={originTicketId ? `#${originTicketId.slice(0, 8)}` : 'Indisponível'}
        />
        <RailDetailLine label="Responsável" value={selected.assignedToFullName ?? 'Indisponível'} />
        <RailDetailLine label="Impacto" value={humanizeImpact(selected.originTicketSeverity)} />
        <RailDetailLine label="Última atualização" value={formatDateTime(selected.updatedAt)} />
      </section>

      <section className="rounded-[14px] border border-[color:var(--color-border)] bg-white px-3 py-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--color-muted)]">
          Vínculo com suporte
        </p>
        {originTicketId ? (
          <Link
            className="mt-1.5 block rounded-[12px] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-1.5 transition hover:border-[rgba(48,127,226,0.28)] hover:bg-white"
            to={`/support/tickets/${originTicketId}`}
          >
            <p className="text-[12px] font-semibold text-[color:var(--color-brand-blue)]">
              Abrir ticket de origem
            </p>
            <p className="mt-0.5 line-clamp-1 text-[11px] text-[color:var(--color-muted)]">
              {originTicketTitle ?? 'Título indisponível'}
            </p>
          </Link>
        ) : (
          <p className="mt-2 text-[12px] text-[color:var(--color-muted)]">Indisponível</p>
        )}
      </section>

      <section className="rounded-[14px] border border-[color:var(--color-border)] bg-white px-3 py-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--color-muted)]">
          Última devolutiva
        </p>
        <p className="mt-1.5 line-clamp-2 text-[11.5px] leading-[1.125rem] text-[color:var(--color-ink)]">
          {humanizeOperationalText(latestUpdate?.summary ?? selected.lastUpdateSummary)}
        </p>
        <p className="mt-1 line-clamp-1 text-[10.5px] text-[color:var(--color-muted)]">
          Próximo passo: {humanizeOperationalText(latestUpdate?.nextStep ?? selected.lastUpdateNextStep)}
        </p>
      </section>

      <section className="rounded-[14px] border border-[color:var(--color-border)] bg-white px-3 py-2">
        <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-[color:var(--color-muted)]">
          Ações
        </p>
        <div className="mt-1.5 grid gap-1">
          <AppButton className="min-h-7.5 w-full rounded-[10px] px-3 text-[11.5px]" disabled={submitting} onClick={onOpenUpdate}>
            Registrar atualização
          </AppButton>
          <GhostButton className="min-h-7.5 w-full rounded-[10px] px-3 text-[11.5px]" disabled={submitting} onClick={onOpenStatus}>
            Alterar status
          </GhostButton>
          <GhostButton className="min-h-7.5 w-full rounded-[10px] px-3 text-[11.5px]" disabled={submitting} onClick={onAssignToMe}>
            Assumir para mim
          </GhostButton>
          <GhostButton
            className="min-h-7.5 w-full rounded-[10px] px-3 text-[11.5px]"
            disabled={submitting || !selected.assignedToUserId}
            onClick={onUnassign}
          >
            Remover responsável
          </GhostButton>
          <GhostButton className="min-h-7.5 w-full rounded-[10px] px-3 text-[11.5px]" disabled={submitting} onClick={onOpenReturn}>
            Retornar ao suporte
          </GhostButton>
        </div>
      </section>
    </div>
  );
}

export function EngineeringWorkspacePage() {
  const { workItemId } = useParams();
  const { user } = useAuthContext();
  const [phase, setPhase] = useState<Phase>('loading');
  const [message, setMessage] = useState<string | null>(null);
  const [items, setItems] = useState<EngineeringWorkspaceWorkItem[]>([]);
  const [selected, setSelected] = useState<WorkItemDetail | null>(null);
  const [links, setLinks] = useState<EngineeringWorkspaceTicketLink[]>([]);
  const [updates, setUpdates] = useState<EngineeringWorkspaceUpdate[]>([]);
  const [statusFilter, setStatusFilter] = useState<EngineeringWorkItemStatus | 'all'>('all');
  const [typeFilter, setTypeFilter] = useState<EngineeringWorkItemType | 'all'>('all');
  const [clientFilter, setClientFilter] = useState<string>('all');
  const [responsibleFilter, setResponsibleFilter] = useState<string>('all');
  const [quickFilter, setQuickFilter] = useState<EngineeringQuickFilter>('all');
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [statusDraft, setStatusDraft] = useState<StatusDraft>(emptyStatusDraft());
  const [updateDraft, setUpdateDraft] = useState<UpdateDraft>(emptyUpdateDraft());
  const [returnDraft, setReturnDraft] = useState<UpdateDraft>(emptyUpdateDraft());
  const [activeActionDrawer, setActiveActionDrawer] = useState<EngineeringActionDrawer>(null);

  const selectedId = workItemId ?? selected?.engineeringWorkItemId ?? items[0]?.engineeringWorkItemId ?? null;

  async function loadWorkspace() {
    setPhase('loading');
    setMessage(null);

    try {
      const queue = await listEngineeringWorkItemsQueue({
        status: statusFilter,
        workItemType: typeFilter,
      });
      setItems(queue);

      const nextSelectedId = workItemId ?? queue[0]?.engineeringWorkItemId ?? null;
      if (!nextSelectedId) {
        setSelected(null);
        setLinks([]);
        setUpdates([]);
        setPhase('ready');
        return;
      }

      const [detail, linkRows, updateRows] = await Promise.all([
        getEngineeringWorkItemDetail(nextSelectedId),
        listEngineeringWorkItemTicketLinks(nextSelectedId),
        listEngineeringWorkItemUpdates(nextSelectedId),
      ]);

      setSelected(detail);
      setLinks(linkRows);
      setUpdates(updateRows);
      setStatusDraft(emptyStatusDraft(detail?.status ?? 'triage'));
      setPhase('ready');
    } catch (error) {
      const classified = classifyAdminError(
        error,
        'Não foi possível carregar o workspace de engenharia agora.',
      );
      setMessage(classified.message);
      setPhase(classified.kind === 'contract-unavailable' ? 'contract-unavailable' : 'error');
    }
  }

  useEffect(() => {
    void loadWorkspace();
  }, [statusFilter, typeFilter, workItemId]);

  const counts = useMemo(() => ({
    total: items.length,
    open: items.filter((item) => !['released', 'rejected', 'cancelled'].includes(item.status)).length,
    triage: items.filter((item) => item.status === 'triage').length,
    inProgress: items.filter((item) => item.status === 'in_progress' || item.status === 'accepted').length,
    waitingExternal: items.filter((item) => item.status === 'waiting_external').length,
    waitingSupport: items.filter((item) => item.status === 'returned_to_support').length,
    unassigned: items.filter((item) => !item.assignedToUserId).length,
    mine: user?.id ? items.filter((item) => item.assignedToUserId === user.id).length : null,
    released: items.filter((item) => item.status === 'released').length,
  }), [items, user?.id]);

  const clientOptions = useMemo(() => (
    Array.from(new Map(items.map((item) => [
      item.tenantId,
      item.tenantName ?? item.tenantSlug ?? 'Indisponível',
    ])).entries())
  ), [items]);

  const responsibleOptions = useMemo(() => (
    Array.from(new Map(
      items
        .filter((item) => item.assignedToUserId)
        .map((item) => [item.assignedToUserId as string, item.assignedToFullName ?? 'Indisponível']),
    ).entries())
  ), [items]);

  const visibleItems = useMemo(() => {
    let nextItems = items;

    if (clientFilter !== 'all') {
      nextItems = nextItems.filter((item) => item.tenantId === clientFilter);
    }

    if (responsibleFilter !== 'all') {
      nextItems = nextItems.filter((item) => item.assignedToUserId === responsibleFilter);
    }

    switch (quickFilter) {
      case 'mine':
        return user?.id ? nextItems.filter((item) => item.assignedToUserId === user.id) : [];
      case 'unassigned':
        return nextItems.filter((item) => !item.assignedToUserId);
      case 'triage':
        return nextItems.filter((item) => item.status === 'triage');
      case 'returned_to_support':
        return nextItems.filter((item) => item.status === 'returned_to_support');
      case 'waiting_external':
        return nextItems.filter((item) => item.status === 'waiting_external');
      case 'all':
      default:
        return nextItems;
    }
  }, [clientFilter, items, quickFilter, responsibleFilter, user?.id]);

  const quickFilters = [
    { key: 'all', label: 'Todos', helper: 'fila técnica', value: counts.total, disabled: false },
    { key: 'mine', label: 'Meus itens', helper: 'sob minha responsabilidade', value: counts.mine, disabled: !user?.id },
    { key: 'unassigned', label: 'Não atribuídos', helper: 'precisam de responsável', value: counts.unassigned, disabled: false },
    { key: 'triage', label: 'Em triagem', helper: 'a qualificar', value: counts.triage, disabled: false },
    { key: 'returned_to_support', label: 'Aguardando suporte', helper: 'prontos para retorno', value: counts.waitingSupport, disabled: false },
    { key: 'waiting_external', label: 'Aguardando externo', helper: 'bloqueio fora do time', value: counts.waitingExternal, disabled: false },
  ] satisfies Array<{
    key: EngineeringQuickFilter;
    label: string;
    helper: string;
    value: number | null;
    disabled: boolean;
  }>;

  async function runAction(action: () => Promise<unknown>, successMessage: string) {
    setSubmitting(true);
    setActionMessage(null);

    try {
      await action();
      setActionMessage(successMessage);
      await loadWorkspace();
    } catch (error) {
      const classified = classifyAdminError(
        error,
        'Não foi possível concluir a ação técnica agora.',
      );
      setActionMessage(classified.message);
    } finally {
      setSubmitting(false);
    }
  }

  function handleAssignToMe() {
    if (!selected) {
      return;
    }

    void runAction(
      () =>
        assignEngineeringWorkItem({
          engineeringWorkItemId: selected.engineeringWorkItemId,
          tenantId: selected.tenantId,
          assignedToUserId: user?.id ?? null,
        }),
      'Responsável técnico atualizado.',
    );
  }

  function handleUnassign() {
    if (!selected) {
      return;
    }

    void runAction(
      () =>
        unassignEngineeringWorkItem({
          engineeringWorkItemId: selected.engineeringWorkItemId,
          tenantId: selected.tenantId,
        }),
      'Responsável técnico removido.',
    );
  }

  function handleStatusSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) {
      return;
    }

    void runAction(
      () =>
        updateEngineeringWorkItemStatus({
          engineeringWorkItemId: selected.engineeringWorkItemId,
          tenantId: selected.tenantId,
          status: statusDraft.status,
          summary: statusDraft.summary,
          nextStep: statusDraft.nextStep || null,
        }),
      'Status técnico atualizado.',
    );
  }

  function handleUpdateSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) {
      return;
    }

    void runAction(
      () =>
        addEngineeringWorkItemUpdate({
          engineeringWorkItemId: selected.engineeringWorkItemId,
          tenantId: selected.tenantId,
          summary: updateDraft.summary,
          nextStep: updateDraft.nextStep || null,
        }),
      'Atualização técnica registrada.',
    );
    setUpdateDraft(emptyUpdateDraft());
  }

  function handleReturnSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) {
      return;
    }

    void runAction(
      () =>
        returnEngineeringWorkItemToSupport({
          engineeringWorkItemId: selected.engineeringWorkItemId,
          tenantId: selected.tenantId,
          summary: returnDraft.summary,
          nextStep: returnDraft.nextStep,
        }),
      'Demanda devolvida ao suporte.',
    );
    setReturnDraft(emptyUpdateDraft());
  }

  if (phase === 'loading') {
    return <LoadingState title="Carregando engenharia" />;
  }

  if (phase === 'contract-unavailable') {
    return (
      <ErrorState
        title="Workspace de engenharia indisponível"
        description={message ?? 'A área de engenharia ainda não está disponível.'}
        action={<GhostButton onClick={() => void loadWorkspace()}>Tentar novamente</GhostButton>}
      />
    );
  }

  if (phase === 'error') {
    return (
      <ErrorState
        description={message ?? 'Não foi possível carregar o workspace de engenharia.'}
        action={<GhostButton onClick={() => void loadWorkspace()}>Tentar novamente</GhostButton>}
      />
    );
  }

  return (
    <>
      <div className="flex h-full min-h-0 flex-col gap-[var(--workspace-panel-gap)] overflow-hidden">
        <header className="shrink-0 rounded-[18px] border border-[color:var(--color-border)] bg-white/95 px-4 py-[var(--workspace-header-y)] shadow-[0_10px_22px_rgba(19,33,79,0.05)]">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h1 className="text-[1.55rem] font-semibold leading-tight tracking-[-0.045em] text-[color:var(--color-ink)]">
                Engenharia
              </h1>
              <p className="mt-1 text-[13px] text-[color:var(--color-muted)]">
                Demandas técnicas vinculadas ao suporte e à operação.
              </p>
            </div>
            <GhostButton className="min-h-9 rounded-[12px] px-4 text-[12px]" onClick={() => void loadWorkspace()} type="button">
              Recarregar
            </GhostButton>
          </div>
        </header>

        <EngineeringSummaryStrip
          inProgress={counts.inProgress}
          released={counts.released}
          returnedToSupport={counts.waitingSupport}
          triage={counts.triage}
          waitingExternal={counts.waitingExternal}
        />

        {actionMessage ? <InlineNotice>{actionMessage}</InlineNotice> : null}

        <div className="grid min-h-0 flex-1 gap-[var(--workspace-panel-gap)] overflow-hidden xl:grid-cols-[minmax(250px,286px)_minmax(0,1fr)_minmax(318px,352px)] 2xl:grid-cols-[minmax(260px,292px)_minmax(0,1fr)_minmax(326px,360px)]">
          <aside className="grid min-h-0 grid-rows-[auto_auto_minmax(0,1fr)] gap-[var(--workspace-panel-gap)] overflow-hidden rounded-[18px] border border-[color:var(--color-border)] bg-white/93 p-3 shadow-[0_12px_24px_rgba(19,33,79,0.05)]">
            <section className="rounded-[14px] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-2.5">
              <h2 className="text-[0.98rem] font-semibold tracking-[-0.03em] text-[color:var(--color-ink)]">
                Triagem técnica
              </h2>
              <p className="mt-1 text-[11.5px] leading-5 text-[color:var(--color-muted)]">
                Selecione uma fila ou filtre os itens.
              </p>
            </section>

            <section className="rounded-[14px] border border-[color:var(--color-border)] bg-white px-3 py-2.5">
              <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-muted)]">
                Fila rápida
              </p>
              <div className="mt-2 grid gap-1.5">
                {quickFilters.map((filter) => (
                  <QuickFilterButton
                    active={quickFilter === filter.key}
                    disabled={filter.disabled}
                    helper={filter.helper}
                    key={filter.key}
                    label={filter.label}
                    onClick={() => setQuickFilter(filter.key)}
                    value={filter.value}
                  />
                ))}
              </div>
            </section>

            <section className="min-h-0 overflow-y-auto rounded-[14px] border border-[color:var(--color-border)] bg-white px-3 py-2.5">
              <div className="mb-2 flex items-center justify-between gap-2">
                <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-muted)]">
                  Filtros
                </p>
                <button
                  className="text-[10.5px] font-semibold text-[color:var(--color-brand-blue)] disabled:text-[color:var(--color-muted)]"
                  disabled={
                    statusFilter === 'all' &&
                    typeFilter === 'all' &&
                    clientFilter === 'all' &&
                    responsibleFilter === 'all' &&
                    quickFilter === 'all'
                  }
                  onClick={() => {
                    setStatusFilter('all');
                    setTypeFilter('all');
                    setClientFilter('all');
                    setResponsibleFilter('all');
                    setQuickFilter('all');
                  }}
                  type="button"
                >
                  Limpar filtros
                </button>
              </div>
              <div className="grid gap-2">
                <Field label="Status">
                  <SelectInput
                    className="h-8.5 rounded-[12px] px-3 text-[12px]"
                    value={statusFilter}
                    onChange={(event) =>
                      setStatusFilter(event.target.value as EngineeringWorkItemStatus | 'all')
                    }
                  >
                    <option value="all">Todos</option>
                    {ENGINEERING_WORK_ITEM_STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {humanizeEngineeringStatus(status)}
                      </option>
                    ))}
                  </SelectInput>
                </Field>
                <Field label="Tipo">
                  <SelectInput
                    className="h-8.5 rounded-[12px] px-3 text-[12px]"
                    value={typeFilter}
                    onChange={(event) =>
                      setTypeFilter(event.target.value as EngineeringWorkItemType | 'all')
                    }
                  >
                    <option value="all">Todos</option>
                    {ENGINEERING_WORK_ITEM_TYPES.map((type) => (
                      <option key={type} value={type}>
                        {humanizeWorkItemType(type)}
                      </option>
                    ))}
                  </SelectInput>
                </Field>
                <Field label="Cliente">
                  <SelectInput
                    className="h-8.5 rounded-[12px] px-3 text-[12px]"
                    onChange={(event) => setClientFilter(event.target.value)}
                    value={clientFilter}
                  >
                    <option value="all">Todos</option>
                    {clientOptions.map(([tenantId, tenantName]) => (
                      <option key={tenantId} value={tenantId}>
                        {tenantName}
                      </option>
                    ))}
                  </SelectInput>
                </Field>
                {responsibleOptions.length > 0 ? (
                  <Field label="Responsável">
                    <SelectInput
                      className="h-8.5 rounded-[12px] px-3 text-[12px]"
                      onChange={(event) => setResponsibleFilter(event.target.value)}
                      value={responsibleFilter}
                    >
                      <option value="all">Todos</option>
                      {responsibleOptions.map(([userId, fullName]) => (
                        <option key={userId} value={userId}>
                          {fullName}
                        </option>
                      ))}
                    </SelectInput>
                  </Field>
                ) : null}
              </div>
            </section>
          </aside>

          <main className="flex min-h-0 min-w-0 flex-col overflow-hidden rounded-[18px] border border-[color:var(--color-border)] bg-white/95 shadow-[0_12px_24px_rgba(19,33,79,0.05)]">
            <div className="flex shrink-0 items-center justify-between gap-3 border-b border-[color:var(--color-border)] px-4 py-2.5">
              <div>
                <h2 className="text-[1rem] font-semibold tracking-[-0.03em] text-[color:var(--color-ink)]">
                  Itens técnicos
                </h2>
                <p className="mt-0.5 text-[12px] text-[color:var(--color-muted)]">
                  {visibleItems.length} item(ns) encontrados
                </p>
              </div>
              <StatusPill>{counts.open} em aberto</StatusPill>
            </div>
            <div className="grid grid-cols-[minmax(230px,1.75fr)_78px_94px_minmax(96px,0.78fr)_78px_minmax(98px,0.78fr)_74px_82px] gap-1.5 border-b border-[color:var(--color-border)] bg-[color:var(--color-surface)] px-3 py-1.5 text-[9.5px] font-semibold uppercase tracking-[0.14em] text-[color:var(--color-muted)]">
              <span>Item</span>
              <span>Tipo</span>
              <span>Status</span>
              <span>Cliente</span>
              <span>Ticket origem</span>
              <span>Responsável</span>
              <span>Prioridade</span>
              <span className="text-right">Atualizado</span>
            </div>
            <div className="shrink-0 overflow-hidden px-3 py-2">
              {visibleItems.length === 0 ? (
                <EmptyState
                  title="Nenhum item técnico neste recorte"
                  description="Ajuste a fila rápida ou os filtros operacionais para ampliar a visão."
                />
              ) : (
                <div className="overflow-hidden rounded-[14px] border border-[color:var(--color-border)] bg-white">
                  {visibleItems.map((item) => (
                    <WorkItemRow
                      active={item.engineeringWorkItemId === selectedId}
                      item={item}
                      key={item.engineeringWorkItemId}
                    />
                  ))}
                </div>
              )}
            </div>
            {selected ? (
              <section className="min-h-0 flex-1 overflow-y-auto border-t border-[color:var(--color-border)] bg-[linear-gradient(180deg,#ffffff_0%,#f8fbff_100%)] px-3 py-[var(--workspace-card-y)]">
                <div className="mb-2 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-[color:var(--color-muted)]">
                      Contexto técnico
                    </p>
                    <h3 className="mt-0.5 text-[15px] font-semibold tracking-[-0.03em] text-[color:var(--color-ink)]">
                      {selected.title}
                    </h3>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <StatusPill tone={toneForEngineeringStatus(selected.status)}>
                      {humanizeEngineeringStatus(selected.status)}
                    </StatusPill>
                    <StatusPill tone={toneForPriority(selected.priority)}>
                      {humanizePriority(selected.priority)}
                    </StatusPill>
                  </div>
                </div>
                <div className="grid gap-2 md:grid-cols-2">
                  <CenterContextCard label="Resumo técnico" title="Descrição da demanda" tone="blue">
                    <p className="line-clamp-3">{humanizeOperationalText(selected.description)}</p>
                  </CenterContextCard>
                  <CenterContextCard label="Vínculo" title="Ticket de origem">
                    {selected.originTicketId ? (
                      <Link className="font-semibold text-[color:var(--color-brand-blue)] hover:underline" to={`/support/tickets/${selected.originTicketId}`}>
                        #{selected.originTicketId.slice(0, 8)} · {selected.originTicketTitle ?? 'Título indisponível'}
                      </Link>
                    ) : (
                      <p>Indisponível</p>
                    )}
                  </CenterContextCard>
                  <CenterContextCard label="Última devolutiva" title="Registro técnico mais recente">
                    <p className="line-clamp-2">
                      {humanizeOperationalText(updates[0]?.summary ?? selected.lastUpdateSummary)}
                    </p>
                    <p className="mt-1 line-clamp-1 text-[11px]">
                      Por {updates[0]?.createdByFullName ?? selected.lastUpdateByFullName ?? 'Indisponível'}
                    </p>
                  </CenterContextCard>
                  <CenterContextCard label="Próximo passo" title="Continuidade operacional" tone="warning">
                    <p className="line-clamp-3">
                      {humanizeOperationalText(updates[0]?.nextStep ?? selected.lastUpdateNextStep)}
                    </p>
                  </CenterContextCard>
                </div>
              </section>
            ) : null}
            <footer className="flex shrink-0 items-center justify-between border-t border-[color:var(--color-border)] px-4 py-2 text-[11.5px] text-[color:var(--color-muted)]">
              <span>
                Mostrando {visibleItems.length} de {items.length} item{items.length === 1 ? '' : 's'}
              </span>
            </footer>
          </main>

          <aside className="min-h-0 overflow-y-auto rounded-[18px] border border-[color:var(--color-border)] bg-white/93 p-3 shadow-[0_12px_24px_rgba(19,33,79,0.05)]">
            <WorkItemRail
              links={links}
              onAssignToMe={handleAssignToMe}
              onOpenReturn={() => setActiveActionDrawer('return')}
              onOpenStatus={() => setActiveActionDrawer('status')}
              onOpenUpdate={() => setActiveActionDrawer('update')}
              onUnassign={handleUnassign}
              selected={selected}
              submitting={submitting}
              updates={updates}
            />
          </aside>
        </div>
      </div>

      {activeActionDrawer === 'status' && selected ? (
        <GovernedActionDrawer
          description="Atualize o andamento técnico com resumo e próximo passo."
          footer={
            <>
              <GhostButton onClick={() => setActiveActionDrawer(null)} type="button">
                Cancelar
              </GhostButton>
              <AppButton disabled={submitting} form="engineering-status-form" type="submit">
                Atualizar status
              </AppButton>
            </>
          }
          onClose={() => setActiveActionDrawer(null)}
          title="Alterar status técnico"
        >
          <form className="space-y-5" id="engineering-status-form" onSubmit={handleStatusSubmit}>
            <section className="rounded-[22px] border border-[color:var(--color-border)] bg-[color:var(--color-surface)] p-5">
              <p className="text-lg font-semibold tracking-[-0.035em] text-[color:var(--color-ink)]">
                {selected.title}
              </p>
              <p className="mt-1 text-sm text-[color:var(--color-muted)]">
                {selected.tenantName ?? 'Cliente indisponível'}
              </p>
            </section>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Novo status">
                <SelectInput
                  value={statusDraft.status}
                  onChange={(event) =>
                    setStatusDraft((current) => ({
                      ...current,
                      status: event.target.value as EngineeringWorkItemStatus,
                    }))
                  }
                >
                  {ENGINEERING_WORK_ITEM_STATUSES.map((status) => (
                    <option key={status} value={status}>
                      {humanizeEngineeringStatus(status)}
                    </option>
                  ))}
                </SelectInput>
              </Field>
              <Field label="Próximo passo">
                <TextInput
                  onChange={(event) =>
                    setStatusDraft((current) => ({
                      ...current,
                      nextStep: event.target.value,
                    }))
                  }
                  value={statusDraft.nextStep}
                />
              </Field>
            </div>
            <Field label="Resumo">
              <TextareaInput
                className="min-h-[180px]"
                minLength={8}
                onChange={(event) =>
                  setStatusDraft((current) => ({
                    ...current,
                    summary: event.target.value,
                  }))
                }
                required
                value={statusDraft.summary}
              />
            </Field>
          </form>
        </GovernedActionDrawer>
      ) : null}

      {activeActionDrawer === 'update' && selected ? (
        <GovernedActionDrawer
          description="Registre uma atualização técnica ampla e objetiva."
          footer={
            <>
              <GhostButton onClick={() => setActiveActionDrawer(null)} type="button">
                Cancelar
              </GhostButton>
              <AppButton disabled={submitting} form="engineering-update-form" type="submit">
                Registrar atualização
              </AppButton>
            </>
          }
          onClose={() => setActiveActionDrawer(null)}
          title="Registrar atualização"
        >
          <form className="space-y-5" id="engineering-update-form" onSubmit={handleUpdateSubmit}>
            <Field label="Resumo técnico">
              <TextareaInput
                className="min-h-[220px]"
                minLength={8}
                onChange={(event) =>
                  setUpdateDraft((current) => ({
                    ...current,
                    summary: event.target.value,
                  }))
                }
                required
                value={updateDraft.summary}
              />
            </Field>
            <Field label="Próximo passo">
              <TextInput
                onChange={(event) =>
                  setUpdateDraft((current) => ({
                    ...current,
                    nextStep: event.target.value,
                  }))
                }
                value={updateDraft.nextStep}
              />
            </Field>
          </form>
        </GovernedActionDrawer>
      ) : null}

      {activeActionDrawer === 'return' && selected ? (
        <GovernedActionDrawer
          description="Devolva a demanda ao suporte com contexto suficiente para continuidade."
          footer={
            <>
              <GhostButton onClick={() => setActiveActionDrawer(null)} type="button">
                Cancelar
              </GhostButton>
              <AppButton disabled={submitting} form="engineering-return-form" type="submit">
                Devolver ao suporte
              </AppButton>
            </>
          }
          onClose={() => setActiveActionDrawer(null)}
          title="Devolver ao suporte"
        >
          <form className="space-y-5" id="engineering-return-form" onSubmit={handleReturnSubmit}>
            <Field label="Resumo para suporte">
              <TextareaInput
                className="min-h-[220px]"
                minLength={8}
                onChange={(event) =>
                  setReturnDraft((current) => ({
                    ...current,
                    summary: event.target.value,
                  }))
                }
                required
                value={returnDraft.summary}
              />
            </Field>
            <Field label="Próximo passo para suporte">
              <TextInput
                minLength={4}
                onChange={(event) =>
                  setReturnDraft((current) => ({
                    ...current,
                    nextStep: event.target.value,
                  }))
                }
                required
                value={returnDraft.nextStep}
              />
            </Field>
          </form>
        </GovernedActionDrawer>
      ) : null}
    </>
  );
}
