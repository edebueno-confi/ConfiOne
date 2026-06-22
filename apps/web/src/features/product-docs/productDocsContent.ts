export type ProductDocCategory =
  | 'Produto e visão'
  | 'Arquitetura e segurança'
  | 'Operação'
  | 'Governança documental'
  | 'Diário de Construção'
  | 'Design e UX';

export interface ProductDocsReadingTrack {
  title:
    | 'Produto'
    | 'Arquitetura'
    | 'Segurança'
    | 'Suporte'
    | 'Knowledge'
    | 'Portal Cliente'
    | 'Design';
  summary: string;
  documentIds: string[];
}

export const productDocsWhitelist = [
  'PRODUCT.md',
  'DESIGN.md',
  'docs/PRODUCT_VISION.md',
  'docs/ARCHITECTURE_RULES.md',
  'docs/AUTH_CONTEXT_STRATEGY.md',
  'docs/ROADMAP_BUILDOUT_V3.md',
  'docs/PROJECT_STATE.md',
  'docs/DOCUMENTATION_LEDGER.md',
  'docs/SUPPORT_WORKFLOW.md',
  'docs/ENGINEERING_WORKFLOW.md',
  'docs/BUILD_JOURNAL_STRATEGY.md',
  'docs/BUILD_JOURNAL_SCREEN_SPEC.md',
] as const;

export const productDocsCategories: ProductDocCategory[] = [
  'Produto e visão',
  'Arquitetura e segurança',
  'Operação',
  'Governança documental',
  'Diário de Construção',
  'Design e UX',
];

export const productDocsStarterIds = [
  'product',
  'product-vision',
  'architecture-rules',
  'project-state',
] as const;

export const productDocsReadingTracks: ProductDocsReadingTrack[] = [
  {
    title: 'Produto',
    summary: 'Comece pela tese do cockpit, pelo problema operacional e pelo estado atual do buildout.',
    documentIds: ['product', 'product-vision', 'project-state'],
  },
  {
    title: 'Arquitetura',
    summary: 'Leia primeiro os limites estruturais e depois a direção de evolução do buildout.',
    documentIds: ['architecture-rules', 'roadmap-buildout-v3', 'project-state'],
  },
  {
    title: 'Segurança',
    summary: 'Entenda boundary, autorização, sanitização e o que deliberadamente não é exposto nesta UI.',
    documentIds: ['auth-context-strategy', 'architecture-rules', 'documentation-ledger'],
  },
  {
    title: 'Suporte',
    summary: 'Veja como o fluxo operacional de tickets ganhou contexto, handoff e trilha auditável.',
    documentIds: ['support-workflow', 'engineering-workflow', 'project-state'],
  },
  {
    title: 'Knowledge',
    summary: 'A trilha de Knowledge continua passando por governança editorial e pelos limites do buildout atual.',
    documentIds: ['roadmap-buildout-v3', 'project-state', 'documentation-ledger'],
  },
  {
    title: 'Portal Cliente',
    summary:
      'Esta trilha explica o boundary customer-facing e o roadmap relacionado sem abrir documentos fora da whitelist.',
    documentIds: ['auth-context-strategy', 'roadmap-buildout-v3', 'project-state'],
  },
  {
    title: 'Design',
    summary:
      'Use esta trilha para entender o acordo visual do cockpit e como ele conversa com a narrativa do diário.',
    documentIds: ['design', 'build-journal-strategy', 'build-journal-screen-spec'],
  },
];
