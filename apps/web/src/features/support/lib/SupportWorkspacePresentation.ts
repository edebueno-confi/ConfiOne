import { formatDateTime, humanizeToken } from '../../../app/format';
import type {
  KnowledgeArticleStatus,
  KnowledgeArticleVisibility,
  SupportCustomer360,
  SupportCustomer360Contact,
  SupportTicketDetail,
  SupportTicketQueueItem,
  TicketKnowledgeLinkType,
  TicketPriority,
  TicketSeverity,
  TicketStatus,
} from '../../../contracts/support-contracts';

export function toneForTicketStatus(status: TicketStatus) {
  if (status === 'resolved' || status === 'closed') {
    return 'positive' as const;
  }

  if (status === 'cancelled') {
    return 'critical' as const;
  }

  if (status === 'waiting_customer' || status === 'waiting_engineering') {
    return 'warning' as const;
  }

  return 'default' as const;
}

export function toneForSlaStatus(
  status: SupportTicketQueueItem['slaStatus'] | SupportTicketDetail['slaStatus'],
) {
  if (status === 'breached') {
    return 'critical' as const;
  }

  if (status === 'at_risk') {
    return 'warning' as const;
  }

  if (status === 'on_track' || status === 'complete') {
    return 'positive' as const;
  }

  return 'default' as const;
}

export function formatSlaDueLabel(
  firstResponseDueAt: string | null,
  resolutionDueAt: string | null,
) {
  if (resolutionDueAt) {
    return `Resolução: ${formatDateTime(resolutionDueAt)}`;
  }

  if (firstResponseDueAt) {
    return `Primeira resposta: ${formatDateTime(firstResponseDueAt)}`;
  }

  return 'Prazo: Indisponível';
}

export function humanizeStatus(status: TicketStatus) {
  switch (status) {
    case 'new':
      return 'Novo';
    case 'triage':
      return 'Triagem';
    case 'in_progress':
      return 'Em andamento';
    case 'waiting_customer':
      return 'Aguardando cliente';
    case 'waiting_support':
      return 'Aguardando suporte';
    case 'waiting_engineering':
      return 'Aguardando engenharia';
    case 'resolved':
      return 'Resolvido';
    case 'closed':
      return 'Fechado';
    case 'cancelled':
      return 'Cancelado';
    default:
      return humanizeToken(status).replaceAll('_', ' ');
  }
}

export function compactTicketStatusLabel(status: TicketStatus) {
  switch (status) {
    case 'waiting_customer':
      return 'Ag. cliente';
    case 'waiting_support':
      return 'Ag. suporte';
    case 'waiting_engineering':
      return 'Ag. eng.';
    case 'in_progress':
      return 'Em tratativa';
    default:
      return humanizeStatus(status);
  }
}

export function compactSlaStatusLabel(label: string | null | undefined) {
  const raw = (label ?? 'Indisponível').trim();
  const normalized = raw
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR');

  if (normalized.includes('fora da governanca')) {
    return 'Fora gov.';
  }

  if (normalized.includes('dentro da governanca')) {
    return 'Dentro gov.';
  }

  if (normalized.includes('encerrado para sla')) {
    return 'Enc. SLA';
  }

  if (normalized.includes('governanca interna')) {
    return 'Gov. interna';
  }

  if (normalized.includes('sem politica')) {
    return 'Sem política';
  }

  if (normalized.includes('próximo') || normalized.includes('proximo')) {
    return 'Próx. limite';
  }

  return raw || 'Indisponível';
}

export function formatSupportShortTime(value: string | null | undefined) {
  if (!value) {
    return 'Indisponível';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Indisponível';
  }

  return date.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function supportTicketCode(id: string | null | undefined) {
  return `#${(id ?? 'Indisponível').slice(0, 8).toUpperCase()}`;
}

export function humanizePriority(priority: TicketPriority) {
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
      return humanizeToken(priority);
  }
}

export function humanizeSeverity(severity: TicketSeverity) {
  switch (severity) {
    case 'low':
      return 'Baixa';
    case 'medium':
      return 'Média';
    case 'high':
      return 'Alta';
    case 'critical':
      return 'Crítica';
    default:
      return humanizeToken(severity);
  }
}

export function humanizeKnowledgeVisibility(visibility: KnowledgeArticleVisibility) {
  if (visibility === 'public') {
    return 'Público';
  }

  if (visibility === 'internal') {
    return 'Interno';
  }

  return 'Restrito';
}

export function humanizeKnowledgeStatus(status: KnowledgeArticleStatus) {
  if (status === 'draft') {
    return 'Rascunho';
  }

  if (status === 'review') {
    return 'Em revisão';
  }

  if (status === 'published') {
    return 'Publicado';
  }

  if (status === 'archived') {
    return 'Arquivado';
  }

  return humanizeToken(status).replaceAll('_', ' ');
}

export function humanizeKnowledgeLinkType(linkType: TicketKnowledgeLinkType) {
  switch (linkType) {
    case 'reference_internal':
      return 'Referencia interna';
    case 'sent_to_customer':
      return 'Link enviado ao cliente';
    case 'documentation_gap':
      return 'Lacuna de documentação';
    case 'needs_update':
      return 'Precisa revisão';
    case 'suggested_article':
      return 'Artigo sugerido';
    default:
      return humanizeToken(linkType).replaceAll('_', ' ');
  }
}

export function toneForKnowledgeLinkType(linkType: TicketKnowledgeLinkType) {
  if (linkType === 'sent_to_customer') {
    return 'positive' as const;
  }

  if (linkType === 'documentation_gap' || linkType === 'needs_update') {
    return 'warning' as const;
  }

  if (linkType === 'suggested_article') {
    return 'accent' as const;
  }

  return 'default' as const;
}

export function ticketTenantLabel(
  ticket: Pick<SupportTicketQueueItem, 'tenantDisplayName' | 'tenantLegalName' | 'tenantSlug'>,
) {
  return ticket.tenantDisplayName ?? ticket.tenantLegalName ?? ticket.tenantSlug ?? 'Cliente indisponível';
}

export function primaryContactFromCustomer(customer: SupportCustomer360) {
  return customer.activeContacts.find((contact) => contact.isPrimary) ?? customer.activeContacts[0] ?? null;
}

export function readCustomerDocumentLabel(customer: SupportCustomer360 | null) {
  if (!customer) {
    return null;
  }

  const candidate = customer as unknown as Record<string, unknown>;
  const keys = ['taxRegistrationNumber', 'taxDocument', 'documentNumber', 'cnpj'];

  for (const key of keys) {
    const value = candidate[key];
    if (typeof value === 'string' && value.trim().length > 0) {
      return value.trim();
    }
  }

  return null;
}

export type { SupportCustomer360Contact };
