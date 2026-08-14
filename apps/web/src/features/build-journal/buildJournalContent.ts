export type TimelineStatus = 'done' | 'progress' | 'planned';
export type TimelineArea = 'Produto' | 'Dados' | 'Publicação' | 'Cockpit' | 'Documentação' | 'Qualidade';
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
  period: string;
  area: TimelineArea;
  description: string;
  status: TimelineStatus;
  document: string;
  documentLabel: string;
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
  { key: 'ai', label: 'IA na construção' },
  { key: 'docs', label: 'Documentos' },
  { key: 'next', label: 'Próxima rota' },
];

export const buildJournalTimelinePhases: TimelinePhase[] = [
  {
    id: 'origem-da-plataforma',
    number: 1,
    title: 'Origem da plataforma',
    period: 'Origem',
    area: 'Produto',
    description: 'A visão começou ampla: uma plataforma interna para organizar suporte, conhecimento e operação técnica.',
    status: 'done',
    document: 'product-vision',
    documentLabel: 'Visão do Produto',
    extraDocuments: 2,
    icon: 'spark',
    accent: 'pink',
  },
  {
    id: 'fundacao-segura',
    number: 2,
    title: 'Fundação segura',
    period: 'Base',
    area: 'Dados',
    description: 'Identidade, escopo, permissões, leituras governadas e auditoria formaram a base técnica da solução.',
    status: 'done',
    document: 'auth-context-strategy',
    documentLabel: 'Estratégia de Auth e Contexto',
    extraDocuments: 3,
    icon: 'shield',
    accent: 'violet',
  },
  {
    id: 'dashboard-principal',
    number: 3,
    title: 'Dashboard assume prioridade',
    period: 'Produto atual',
    area: 'Produto',
    description: 'A primeira entrega publicada passou a ser o dashboard gerencial interno, com dados e decisões acessíveis à operação.',
    status: 'done',
    document: 'project-state',
    documentLabel: 'Estado do Projeto',
    extraDocuments: 3,
    icon: 'database',
    accent: 'blue',
  },
  {
    id: 'central-de-ajuda',
    number: 4,
    title: 'Central de Ajuda publicada',
    period: 'Produto atual',
    area: 'Publicação',
    description: 'A Central de Ajuda externa passou a acompanhar o dashboard como superfície pública da primeira versão.',
    status: 'done',
    document: 'roadmap-buildout-v3',
    documentLabel: 'Roadmap Buildout V3',
    extraDocuments: 2,
    icon: 'book',
    accent: 'cyan',
  },
  {
    id: 'cockpit-de-desenvolvimento',
    number: 5,
    title: 'Cockpit de desenvolvimento',
    period: 'Agora',
    area: 'Cockpit',
    description: 'Um subsistema restrito organiza backlog, Diário, Documentos, decisões e o acompanhamento operacional da construção.',
    status: 'progress',
    document: 'project-state',
    documentLabel: 'Estado do Projeto / cockpit',
    extraDocuments: 4,
    icon: 'code',
    accent: 'rose',
  },
  {
    id: 'memoria-documental',
    number: 6,
    title: 'Memória documental',
    period: 'Agora',
    area: 'Documentação',
    description: 'O repositório passa a registrar decisões, mudanças de rota, stack, handoffs e o que foi aprendido ao longo do build.',
    status: 'progress',
    document: 'documentation-ledger',
    documentLabel: 'Ledger de Documentação',
    extraDocuments: 5,
    icon: 'clipboard',
    accent: 'teal',
  },
  {
    id: 'qualidade-evolutiva',
    number: 7,
    title: 'Qualidade, performance e segurança',
    period: 'Próxima rota',
    area: 'Qualidade',
    description: 'Passagens de qualidade do código, performance e banco entram como tarefas simples, evidenciadas e acompanháveis.',
    status: 'planned',
    document: 'architecture-rules',
    documentLabel: 'Regras de Arquitetura',
    extraDocuments: 3,
    icon: 'shield',
    accent: 'orange',
  },
  {
    id: 'saas-interno-futuro',
    number: 8,
    title: 'SaaS interno completo',
    period: 'Depois',
    area: 'Produto',
    description: 'A visão mais ampla não foi descartada; ela retorna quando dashboard, ajuda e base operacional estiverem maduros.',
    status: 'planned',
    document: 'roadmap-buildout-v3',
    documentLabel: 'Roadmap Buildout V3',
    extraDocuments: 4,
    icon: 'portal',
    accent: 'blue',
  },
];

export const buildJournalRecentDeliveries = [
  ['Dashboard gerencial como produto principal', 'Estado atual'],
  ['Central de Ajuda externa como primeira publicação', 'Estado atual'],
  ['Cockpit de desenvolvimento com backlog operacional', '13/08/2026'],
  ['Diário e Documentos integrados ao subsistema', '13/08/2026'],
] as const;

export const buildJournalDocumentCategories: BuildJournalDocumentCategory[] = [
  {
    title: 'Direção do produto',
    eyebrow: 'O que estamos construindo',
    description: 'Registra a mudança de rota: a primeira versão publicada combina Central de Ajuda externa e Dashboard gerencial interno.',
    role: 'Ajuda a decidir o que é prioridade agora e o que permanece como caminho futuro.',
    tone: 'pink',
    icon: 'target',
    documents: [
      { title: 'Visão do Produto', purpose: 'Origem, problema e direção da solução.', productDocId: 'product-vision' },
      { title: 'Estado do Projeto', purpose: 'Checkpoint vivo do que existe e do que ainda não deve ser prometido.', productDocId: 'project-state' },
      { title: 'Roadmap Buildout V3', purpose: 'Sequência de evolução e retomada do SaaS interno.', productDocId: 'roadmap-buildout-v3' },
    ],
  },
  {
    title: 'Arquitetura e stack',
    eyebrow: 'Como funciona',
    description: 'Organiza os acordos técnicos que sustentam a interface, as leituras governadas, as ações e a plataforma de dados.',
    role: 'Mantém a evolução alinhada ao código e aos contratos reais, sem criar regras paralelas na tela.',
    tone: 'blue',
    icon: 'layers',
    documents: [
      { title: 'Regras de Arquitetura', purpose: 'Responsabilidades por camada e limites de acoplamento.', productDocId: 'architecture-rules' },
      { title: 'Workflow de Engenharia', purpose: 'Como demandas técnicas entram e retornam ao fluxo.', productDocId: 'engineering-workflow' },
      { title: 'Stack e decisões técnicas', purpose: 'Registro curto da stack atual e das decisões que a sustentam.', pendingReason: 'Ainda precisa ser publicado no catálogo oficial.' },
    ],
  },
  {
    title: 'Acesso e segurança',
    eyebrow: 'Quem pode ver o quê',
    description: 'Documenta autenticação, escopo, permissões e a fronteira entre o ConfiOne normal e o cockpit restrito.',
    role: 'Preserva acesso root admin para o responsável da plataforma sem abrir mão de regras reais para os demais perfis.',
    tone: 'green',
    icon: 'shield',
    documents: [
      { title: 'Estratégia de Auth e Contexto', purpose: 'Base de autenticação e fronteiras de acesso.', productDocId: 'auth-context-strategy' },
      { title: 'Painel de Controle de Desenvolvimento', purpose: 'Escopo, superfícies e permissões do cockpit.', pendingReason: 'Documento local atualizado; sincronização do catálogo ainda pendente.' },
    ],
  },
  {
    title: 'Memória de construção',
    eyebrow: 'O que aprendemos',
    description: 'Reúne decisões, ideias, desvios, erros, acertos e passagens de bastão de forma ilustrativa e operacional.',
    role: 'O Diário explica o caminho; o documento oficial preserva o acordo atual.',
    tone: 'teal',
    icon: 'book',
    documents: [
      { title: 'Ledger de Documentação', purpose: 'Trilha das mudanças que afetam a documentação viva.', productDocId: 'documentation-ledger' },
      { title: 'Handoffs e agentes', purpose: 'Como responsabilidades e contexto são passados entre agentes.', pendingReason: 'Registro operacional em consolidação no cockpit.' },
      { title: 'Decisões e mudanças de rota', purpose: 'Por que o produto mudou de uma plataforma ampla para a primeira entrega atual.', pendingReason: 'Registro operacional em consolidação no cockpit.' },
    ],
  },
  {
    title: 'Qualidade e próximos gates',
    eyebrow: 'O que precisa amadurecer',
    description: 'Transforma qualidade de código, performance, banco, UTF-8 e validação visual em pequenas tarefas acompanháveis.',
    role: 'Sem burocracia: cada passagem precisa deixar uma evidência curta e uma próxima ação clara.',
    tone: 'orange',
    icon: 'clipboard',
    documents: [
      { title: 'Checklist de Validação', purpose: 'Passos mínimos para validar uma evolução antes de considerá-la concluída.', pendingReason: 'Leitura completa será consolidada no catálogo do cockpit.' },
      { title: 'Revisão do modo escuro e responsividade', purpose: 'Critérios visuais para 1366, Full HD e mobile.', pendingReason: 'Registro de design em consolidação nesta evolução.' },
    ],
  },
];

export const buildJournalPlaceholderPanels: Record<'next', BuildJournalPlaceholderPanel> = {
  next: {
    title: 'Próxima rota',
    description: 'As próximas tarefas devem ampliar a memória do produto sem transformar o cockpit em um processo burocrático.',
    items: [
      'Concluir o redesenho visual do Diário e do leitor documental no modo escuro.',
      'Migrar os documentos canônicos e registrar decisões, ideias e handoffs no catálogo.',
      'Executar passagens curtas de qualidade, performance, segurança e navegação real.',
      'Retomar o SaaS interno quando Dashboard e Central de Ajuda estiverem maduros.',
    ],
    action: 'Ver sequência de fases',
  },
};

export const buildJournalDefaultQuote = {
  quote: 'Este Diário não substitui os documentos oficiais.',
  author: 'Ele preserva contexto, decisão e responsabilidade para que a próxima pessoa entenda o caminho.',
};
