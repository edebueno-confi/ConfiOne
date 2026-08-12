/**
 * Fontes da busca global do Gênio.
 *
 * Lógica pura, sem React e sem rede, para poder ser testada por `node --test`.
 * Segue a convenção `.mjs` + `.d.mts` já usada no repositório.
 *
 * A busca é uma superfície de navegação: ela nunca oferece um destino que a
 * superfície do release não publicou. Quem decide isso é o manifesto, não esta
 * lista.
 */

/** Destinos de navegação candidatos. `screenKey` é a permissão exigida. */
export const GENIUS_NAVIGATION_TARGETS = [
  {
    id: 'nav-dashboard',
    kind: 'tela',
    label: 'Dashboard gerencial',
    hint: 'Visão executiva, comercial, CS e financeiro',
    to: '/admin/analytics',
    screenKey: 'analytics',
    keywords: ['dashboard', 'painel', 'indicadores', 'kpi', 'executivo', 'receita', 'metricas'],
  },
  {
    id: 'nav-articles',
    kind: 'tela',
    label: 'Artigos',
    hint: 'Administração da base de conhecimento',
    to: '/admin/knowledge',
    screenKey: 'knowledge',
    keywords: ['artigos', 'conhecimento', 'base', 'central de ajuda', 'conteudo'],
  },
  {
    id: 'nav-new-article',
    kind: 'ação',
    label: 'Criar novo artigo',
    hint: 'Abre o editor com um rascunho vazio',
    to: '/admin/knowledge/new',
    screenKey: 'knowledge',
    keywords: ['novo', 'criar', 'escrever', 'redigir', 'rascunho', 'artigo'],
  },
  {
    id: 'nav-settings',
    kind: 'tela',
    label: 'Configurações',
    hint: 'Parâmetros do sistema',
    to: '/admin/settings',
    screenKey: 'settings',
    keywords: ['configuracao', 'configuracoes', 'parametros', 'ajustes', 'sistema'],
  },
  {
    id: 'nav-public-help',
    kind: 'externo',
    label: 'Abrir Central pública',
    hint: 'Ver a Central de Ajuda como o cliente vê',
    to: '/help/genius',
    screenKey: 'knowledge',
    external: true,
    keywords: ['central', 'publica', 'ajuda', 'cliente', 'site'],
  },
];

/** Seções de Configurações alcançáveis pela busca. */
export const GENIUS_SETTINGS_TARGETS = [
  {
    id: 'set-marcas',
    sectionId: 'marcas',
    label: 'Marcas',
    hint: 'Configurações · identidade das marcas atendidas',
    keywords: ['marca', 'marcas', 'brand', 'identidade', 'slug'],
  },
  {
    id: 'set-central',
    sectionId: 'central-ajuda',
    label: 'Central de ajuda',
    hint: 'Configurações · aparência e conteúdo da Central',
    keywords: ['central', 'ajuda', 'help', 'publica'],
  },
  {
    id: 'set-categorias',
    sectionId: 'categorias',
    label: 'Categorias e classificações',
    hint: 'Configurações · taxonomia do conhecimento',
    keywords: ['categoria', 'categorias', 'taxonomia', 'classificacao'],
  },
  {
    id: 'set-integracoes',
    sectionId: 'integracoes',
    label: 'Integrações',
    hint: 'Configurações · HubSpot, OMIE e credenciais',
    keywords: ['integracao', 'integracoes', 'hubspot', 'omie', 'credencial', 'token', 'api'],
  },
  {
    id: 'set-dashboard-fontes',
    sectionId: 'dashboard-fontes',
    label: 'Governança de dados',
    hint: 'Configurações · pipelines e fontes dos indicadores',
    keywords: ['fonte', 'fontes', 'pipeline', 'dashboard', 'dados', 'configuracao do dashboard'],
  },
  {
    id: 'set-dashboard-historico',
    sectionId: 'dashboard-historico',
    label: 'Histórico de sincronizações',
    hint: 'Configurações · execuções e erros das integrações',
    keywords: ['historico', 'log', 'logs', 'sincronizacao', 'execucao', 'erro'],
  },
];

/**
 * Sugestões que aparecem sem digitar nada, conforme a tela atual.
 * É o que dá o comportamento adaptativo ao contexto.
 */
export function resolveContextSuggestions(pathname) {
  if (pathname.startsWith('/admin/knowledge')) {
    return {
      title: 'Aqui em Artigos',
      ids: ['nav-new-article', 'set-categorias', 'nav-public-help'],
    };
  }
  if (pathname.startsWith('/admin/settings')) {
    return {
      title: 'Aqui em Configurações',
      ids: ['set-integracoes', 'set-dashboard-fontes', 'set-dashboard-historico'],
    };
  }
  if (pathname.startsWith('/admin/analytics')) {
    return {
      title: 'Aqui no Dashboard',
      ids: ['set-dashboard-fontes', 'set-dashboard-historico', 'nav-articles'],
    };
  }

  return { title: 'Comece por aqui', ids: ['nav-dashboard', 'nav-articles', 'nav-new-article'] };
}

/** Normaliza para comparação sem acento e sem caixa. */
export function normalizeSearchText(value) {
  return String(value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function scoreCandidate(query, haystackParts) {
  const needle = normalizeSearchText(query);
  if (!needle) return 0;

  const terms = needle.split(/\s+/).filter(Boolean);
  const haystack = normalizeSearchText(haystackParts.filter(Boolean).join('  '));

  let score = 0;
  for (const term of terms) {
    const index = haystack.indexOf(term);
    if (index === -1) return 0;
    // Inicio de palavra vale mais que ocorrencia no meio de uma palavra.
    score += index === 0 || haystack[index - 1] === ' ' ? 3 : 1;
  }

  return score;
}

/**
 * Ranqueia os destinos de navegação e de configuração disponíveis.
 *
 * `isTargetAvailable` recebe o candidato e decide se ele existe para o perfil
 * e para o release. Nenhuma decisão de exposição é tomada aqui.
 */
export function rankGeniusTargets(query, { isTargetAvailable = () => true, limit = 8 } = {}) {
  const candidates = [
    ...GENIUS_NAVIGATION_TARGETS.map((target) => ({ ...target, source: 'navigation' })),
    ...GENIUS_SETTINGS_TARGETS.map((target) => ({
      ...target,
      source: 'settings',
      kind: 'configuração',
      to: '/admin/settings',
    })),
  ].filter((candidate) => isTargetAvailable(candidate));

  if (!normalizeSearchText(query)) return [];

  return candidates
    .map((candidate) => ({
      candidate,
      score: scoreCandidate(query, [candidate.label, candidate.hint, ...(candidate.keywords ?? [])]),
    }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score || left.candidate.label.localeCompare(right.candidate.label))
    .slice(0, limit)
    .map((entry) => entry.candidate);
}

/**
 * Ranqueia artigos já carregados. Reaproveita o mesmo haystack textual usado
 * pela lista de artigos, em vez de criar um contrato de busca novo.
 */
export function rankGeniusArticles(query, articles, { limit = 6 } = {}) {
  if (!normalizeSearchText(query)) return [];

  return (articles ?? [])
    .map((article) => ({
      article,
      score: scoreCandidate(query, [
        article.title,
        article.summary ?? '',
        article.slug ?? '',
        article.category_name ?? '',
      ]),
    }))
    .filter((entry) => entry.score > 0)
    .sort((left, right) => right.score - left.score)
    .slice(0, limit)
    .map((entry) => entry.article);
}
