import type {
  TicketPriority,
  TicketSeverity,
  TicketStatus,
  Uuid,
} from '../../../contracts/support-contracts';

export type KnowledgePhase = 'idle' | 'loading' | 'ready' | 'contract-unavailable' | 'error';

export type TicketActionDrawer =
  | 'none'
  | 'classification'
  | 'status'
  | 'evidence'
  | 'knowledge'
  | 'automation'
  | 'handoff'
  | 'related';

export type TicketActionDrawerSize = 'default' | 'wide';

export interface QueueFilters {
  status: TicketStatus | 'all';
  priority: TicketPriority | 'all';
  severity: TicketSeverity | 'all';
  categoryId: Uuid | 'all';
  tenantId: Uuid | 'all';
  assignedToUserId: Uuid | 'all' | 'unassigned';
}
