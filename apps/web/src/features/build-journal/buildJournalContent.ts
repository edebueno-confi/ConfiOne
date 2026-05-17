export type TimelineStatus = 'done' | 'progress' | 'planned';
export type TimelineArea = 'Produto' | 'Segurança' | 'Suporte' | 'Knowledge' | 'Portal' | 'Engenharia' | 'Docs';
export type TimelineAccent = 'blue' | 'cyan' | 'orange' | 'pink' | 'rose' | 'teal' | 'violet';
export type BuildJournalTab = 'overview' | 'timeline' | 'architecture' | 'ai' | 'docs' | 'next';

export interface BuildJournalTabItem {
  key: BuildJournalTab;
  label: string;
}

export interface TimelinePhase {
  id: string;
  number: number;
  title: string;
  period: 'Abr 2026' | 'Mai 2026';
  area: TimelineArea;
  description: string;
  status: TimelineStatus;
  document: string;
  extraDocuments: number;
  icon: string;
  accent: TimelineAccent;
}

export interface BuildJournalPlaceholderPanel {
  title: string;
  description: string;
  items: string[];
  action: string;
}

export const buildJournalTabs: BuildJournalTabItem[] = [
  { key: 'overview', label: 'Visão geral' },
  { key: 'timeline', label: 'Linha do tempo' },
  { key: 'architecture', label: 'Arquitetura' },
  { key: 'ai', label: 'IA na Construção' },
  { key: 'docs', label: 'Documentos oficiais' },
  { key: 'next', label: 'Próximos passos' },
];

export const buildJournalTimelinePhases: TimelinePhase[] = [
  {
    id: 'origem-do-problema',
    number: 1,
    title: 'Origem do problema',
    period: 'Abr 2026',
    area: 'Produto',
    description:
      'Entendimento profundo das dores operacionais de suporte técnico descentralizado e conhecimento espalhado.',
    status: 'done',
    document: 'PRODUCT_VISION.md',
    extraDocuments: 2,
    icon: 'spark',
    accent: 'pink',
  },
  {
    id: 'fundacao-segura',
    number: 2,
    title: 'Fundação segura',
    period: 'Abr 2026',
    area: 'Segurança',
    description:
      'Identidade, tenancy, permissões e auditoria estabelecidas com RLS, multi-tenant e trilhas de segurança.',
    status: 'done',
    document: 'AUTH_CONTEXT_STRATEGY.md',
    extraDocuments: 3,
    icon: 'shield',
    accent: 'violet',
  },
  {
    id: 'ticketing-core',
    number: 3,
    title: 'Ticketing Core',
    period: 'Mai 2026',
    area: 'Suporte',
    description:
      'Domínio de tickets, mensagens, eventos e anexos com contratos de leitura e escrita.',
    status: 'done',
    document: 'VIEW_RPC_CONTRACTS.md',
    extraDocuments: 4,
    icon: 'database',
    accent: 'blue',
  },
  {
    id: 'knowledge-base',
    number: 4,
    title: 'Knowledge Base',
    period: 'Mai 2026',
    area: 'Knowledge',
    description:
      'Estrutura editorial, espaços de conhecimento, governança e superfície pública segura.',
    status: 'done',
    document: 'KNOWLEDGE_BASE_STRATEGY.md',
    extraDocuments: 3,
    icon: 'book',
    accent: 'cyan',
  },
  {
    id: 'support-workspace',
    number: 5,
    title: 'Support Workspace',
    period: 'Mai 2026',
    area: 'Suporte',
    description:
      'Fila de tickets, timeline, contexto do cliente B2B e ponte com conhecimento.',
    status: 'progress',
    document: 'SUPPORT_WORKFLOW.md',
    extraDocuments: 5,
    icon: 'headset',
    accent: 'orange',
  },
  {
    id: 'customer-portal',
    number: 6,
    title: 'Customer Portal',
    period: 'Mai 2026',
    area: 'Portal',
    description:
      'Acesso seguro para clientes B2B, histórico, evidências e base autorizada.',
    status: 'progress',
    document: 'CUSTOMER_PORTAL_..._V3.md',
    extraDocuments: 4,
    icon: 'portal',
    accent: 'rose',
  },
  {
    id: 'engineering-workspace',
    number: 7,
    title: 'Engineering Workspace',
    period: 'Mai 2026',
    area: 'Engenharia',
    description:
      'Workspace técnico para demandas de engenharia com atualização estruturada e retorno ao suporte.',
    status: 'progress',
    document: 'ENGINEERING_WORKSPACE_..._V3.md',
    extraDocuments: 2,
    icon: 'code',
    accent: 'violet',
  },
  {
    id: 'governanca-docs',
    number: 8,
    title: 'Governança Docs',
    period: 'Mai 2026',
    area: 'Docs',
    description:
      'Documentação governada, políticas, auditoria e publicações oficiais.',
    status: 'planned',
    document: 'DOCUMENTATION_UPDATE_POLICY.md',
    extraDocuments: 3,
    icon: 'clipboard',
    accent: 'blue',
  },
];

export const buildJournalRecentDeliveries = [
  ['Ticketing Core operacional', '10/05/2026'],
  ['Perfil operacional do cliente', '09/05/2026'],
  ['Knowledge Admin Governance', '08/05/2026'],
  ['Workspace de Engenharia', '07/05/2026'],
] as const;

export const buildJournalPlaceholderPanels: Record<'docs' | 'next', BuildJournalPlaceholderPanel> = {
  docs: {
    title: 'Documentos oficiais',
    description:
      'Ponte para a área governada de leitura documental. O diário organiza a história; Product Docs mantém a fonte oficial.',
    items: ['Produto e visão.', 'Arquitetura e contratos.', 'Segurança, Knowledge, Portal e Operação.'],
    action: 'Ver linha do tempo documental',
  },
  next: {
    title: 'Próximos passos',
    description:
      'Frentes ainda em evolução, registradas sem prometer entrega concluída antes de contrato real.',
    items: [
      'Omni Work e histórico de conversas.',
      'Chat com cliente B2B e IA assistente citável.',
      'Analytics, automações e escala de disponibilidade.',
    ],
    action: 'Ver sequência de fases',
  },
};

export const buildJournalDefaultQuote = {
  quote: 'Este diário não substitui os documentos oficiais.',
  author: 'Ele organiza a história para que qualquer pessoa entenda por que cada decisão existe.',
};
