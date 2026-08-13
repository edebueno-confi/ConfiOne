export type TimelineStatus = 'done' | 'progress' | 'planned';
export type TimelineArea = 'Produto' | 'Segurança' | 'Suporte' | 'Knowledge' | 'Portal' | 'Engenharia' | 'Docs';
export type TimelineAccent = 'blue' | 'cyan' | 'orange' | 'pink' | 'rose' | 'teal' | 'violet';
export type BuildJournalTab = 'overview' | 'timeline' | 'architecture' | 'ai' | 'docs' | 'next';
export type BuildJournalDocumentTone = 'blue' | 'green' | 'pink' | 'violet' | 'orange' | 'teal';

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

export interface BuildJournalDocumentReference {
  title: string;
  purpose: string;
  productDocId?: string;
  pendingReason?: string;
}

export interface BuildJournalDocumentCategory {
  title: string;
  eyebrow: string;
  description: string;
  role: string;
  tone: BuildJournalDocumentTone;
  icon: string;
  documents: BuildJournalDocumentReference[];
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
      'Identidade, escopos de cliente, permissões e auditoria estabelecidas com controle de acesso e trilhas de segurança.',
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
      'Domínio de tickets, mensagens, eventos e anexos com leitura e ação controladas.',
    status: 'done',
    document: 'OPERATIONAL_CONTRACTS.md',
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

export const buildJournalDocumentCategories: BuildJournalDocumentCategory[] = [
  {
    title: 'Visão e produto',
    eyebrow: 'Origem e norte',
    description:
      'Define por que o ConfiOne existe, qual dor operacional resolve e como a construção evolui sem virar CRM genérico.',
    role: 'Serve como bússola para priorização, narrativa de produto e leitura executiva do buildout.',
    tone: 'pink',
    icon: 'target',
    documents: [
      {
        title: 'Produto',
        purpose: 'Tese principal do cockpit, usuários, limites e princípios estruturais.',
        productDocId: 'product',
      },
      {
        title: 'Visão do Produto',
        purpose: 'Problema operacional, objetivos e direção de plataforma CX B2B técnica.',
        productDocId: 'product-vision',
      },
      {
        title: 'Roadmap Buildout V3',
        purpose: 'Sequência de evolução e blocos planejados da construção.',
        productDocId: 'roadmap-buildout-v3',
      },
    ],
  },
  {
    title: 'Arquitetura operacional',
    eyebrow: 'Como o sistema se sustenta',
    description:
      'Explica camadas, limites e a separação entre interface, leitura controlada, ação transacional e fonte oficial.',
    role: 'Evita decisões soltas na UI e preserva acordos reais como base de evolução.',
    tone: 'blue',
    icon: 'layers',
    documents: [
      {
        title: 'Regras de Arquitetura',
        purpose: 'Princípios técnicos, responsabilidades por camada e limites de acoplamento.',
        productDocId: 'architecture-rules',
      },
      {
        title: 'Leituras e ações governadas',
        purpose: 'Inventário operacional de leitura e ação por acordo de produto.',
        pendingReason: 'Ainda não está exposto na whitelist atual do Product Docs.',
      },
    ],
  },
  {
    title: 'Segurança e permissões',
    eyebrow: 'Boundary antes de feature',
    description:
      'Documenta autorização, tenancy, contexto de sessão e o motivo de segurança vir antes de qualquer automação.',
    role: 'Garante que a memória do produto preserve os limites de acesso e auditoria.',
    tone: 'green',
    icon: 'shield',
    documents: [
      {
        title: 'Estratégia de Auth e Contexto',
        purpose: 'Base de autenticação, contexto administrativo e fronteiras de acesso.',
        productDocId: 'auth-context-strategy',
      },
      {
        title: 'Estado do Projeto',
        purpose: 'Registro vivo das capacidades já existentes e limites ainda pendentes.',
        productDocId: 'project-state',
      },
    ],
  },
  {
    title: 'Suporte e operação',
    eyebrow: 'Da fila ao atendimento',
    description:
      'Organiza a evolução do suporte técnico B2B: tickets, contexto do cliente, timeline, handoff e governança operacional.',
    role: 'Conecta decisões arquiteturais ao fluxo real de atendimento.',
    tone: 'orange',
    icon: 'headset',
    documents: [
      {
        title: 'Workflow de Suporte',
        purpose: 'Fluxo operacional, papéis, atendimento e continuidade entre suporte e contexto técnico.',
        productDocId: 'support-workflow',
      },
    ],
  },
  {
    title: 'Knowledge e conteúdo',
    eyebrow: 'Conhecimento governado',
    description:
      'Explica por que conteúdo precisa de curadoria, versionamento e fronteiras entre público, interno e restrito.',
    role: 'Impede que a Knowledge vire repositório solto ou fonte não governada para IA.',
    tone: 'teal',
    icon: 'book',
    documents: [
      {
        title: 'Knowledge Base Strategy',
        purpose: 'Modelo editorial, espaços, curadoria e governança de publicação.',
        pendingReason: 'Documento citado no buildout, mas ainda não está exposto na whitelist atual do Product Docs.',
      },
      {
        title: 'Ledger de Documentação',
        purpose: 'Trilha versionada de decisões e entregas que afetam a documentação viva.',
        productDocId: 'documentation-ledger',
      },
    ],
  },
  {
    title: 'Portal do cliente',
    eyebrow: 'Boundary customer-facing',
    description:
      'Reúne a direção do acesso B2B seguro do cliente, sem misturar operação interna com superfície pública ou autenticada.',
    role: 'Ajuda a entender o que pode aparecer para cliente e o que deve permanecer interno.',
    tone: 'blue',
    icon: 'portal',
    documents: [
      {
        title: 'Roadmap Buildout V3',
        purpose: 'Direção de evolução para portal, colaboração e próximos blocos customer-facing.',
        productDocId: 'roadmap-buildout-v3',
      },
      {
        title: 'Customer Portal Specs',
        purpose: 'Acordos e decisões específicas do portal cliente B2B.',
        pendingReason: 'Specs existem no projeto, mas não estão expostas nesta whitelist do Product Docs.',
      },
    ],
  },
  {
    title: 'Engenharia',
    eyebrow: 'Ponte técnica',
    description:
      'Mostra como demandas técnicas entram no fluxo sem substituir suporte nem fechar ticket por fora do processo.',
    role: 'Preserva a separação entre atendimento, engenharia e retorno estruturado.',
    tone: 'violet',
    icon: 'code',
    documents: [
      {
        title: 'Workflow de Engenharia',
        purpose: 'Modelo de work items, devolutivas técnicas e conexão com suporte.',
        productDocId: 'engineering-workflow',
      },
    ],
  },
  {
    title: 'Design e experiência',
    eyebrow: 'Diretriz visual',
    description:
      'Registra a linguagem visual, os princípios de cockpit interno e os limites contra dashboard genérico.',
    role: 'Mantém consistência entre blueprint aprovado, UI implementada e leitura operacional.',
    tone: 'pink',
    icon: 'spark',
    documents: [
      {
        title: 'Design',
        purpose: 'Contexto visual, regras de experiência e princípios de interface do cockpit.',
        productDocId: 'design',
      },
      {
        title: 'Spec da Tela Diário de Construção',
        purpose: 'Diretriz específica da tela e evolução do próprio Diário.',
        productDocId: 'build-journal-screen-spec',
      },
    ],
  },
  {
    title: 'Governança documental',
    eyebrow: 'Memória controlada',
    description:
      'Define como a documentação permanece viva, versionada e segura sem abrir o repositório como file explorer.',
    role: 'Dá continuidade ao produto e evita drift entre tela, documentação e acordos reais.',
    tone: 'green',
    icon: 'clipboard',
    documents: [
      {
        title: 'Estado do Projeto',
        purpose: 'Checkpoint vivo do que existe, do que está pendente e do que não deve ser prometido.',
        productDocId: 'project-state',
      },
      {
        title: 'Ledger de Documentação',
        purpose: 'Registro por fase para auditoria interna e continuidade de execução.',
        productDocId: 'documentation-ledger',
      },
      {
        title: 'Estratégia do Diário de Construção',
        purpose: 'Finalidade narrativa e governança do próprio diário.',
        productDocId: 'build-journal-strategy',
      },
    ],
  },
];

export const buildJournalPlaceholderPanels: Record<'next', BuildJournalPlaceholderPanel> = {
  next: {
    title: 'Próximos passos',
    description:
      'Frentes ainda em evolução, registradas sem prometer entrega concluída antes de acordo real.',
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
