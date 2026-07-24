import { FormEvent, useEffect, useEffectEvent, useMemo, useState } from 'react';
import { Link, useOutletContext, useSearchParams } from 'react-router-dom';
import { AppButton, GhostButton } from '../../components/ui';
import { GeniusMascot } from '../../components/GeniusMascot';
import type {
  PublicKnowledgeArticleListRow,
  PublicKnowledgeNavigationRow,
  PublicKnowledgeSearchArticleRow,
} from '../../contracts/public-contracts';
import { classifyAdminError } from '../admin/admin-errors';
import type { HelpCenterSpaceContext } from './context';
import { searchPublicKnowledgeArticles } from './public-api';
import { buildHelpCenterCategoryHref } from './help-center-navigation';
import {
  formatRelativePublicDate,
  getCategoryVisuals,
  HelpIcon,
  PublicIconBadge,
  PublicSearchStateCard,
} from './public-ui';

type SearchPhase = 'idle' | 'loading' | 'ready' | 'empty' | 'contract-unavailable' | 'error';

const HELP_CENTER_AI_ENABLED = String(import.meta.env.VITE_HELP_CENTER_AI_ENABLED ?? '').toLowerCase() === 'true';
const heroGuidanceCopy = HELP_CENTER_AI_ENABLED
  ? {
      label: 'Consulta assistida por IA',
      message: 'Estou pronto para ajudar com sua consulta.',
    }
  : {
      label: 'Busca guiada pelo Gênio',
      message: 'Pronto para ajudar',
    };

const suggestedArticleDefinitions = [
  {
    id: 'calculo-do-estorno',
    title: 'Como configurar o cálculo do estorno',
    match: 'como configurar o calculo do estorno',
  },
  {
    id: 'pagamento-estorno',
    title: 'Como automatizar o pagamento de Estorno e Vale-Compra',
    match: 'como automatizar o pagamento de estorno e vale-compra',
  },
  {
    id: 'acompanhar-solicitacoes',
    title: 'Como acompanhar solicitações de troca e devolução',
    match: 'como acompanhar solicitacoes de troca e devolucao',
  },
] as const;

type SuggestedArticle = {
  id: string;
  title: string;
  articleId: string;
  to: string;
};

type HeroAssistantState = 'waiting' | 'focused' | 'processing' | 'result' | 'empty' | 'error';

const heroMascotByState: Record<HeroAssistantState, {
  message: string;
  pose: 'welcome' | 'present' | 'think' | 'celebrate' | 'magic' | 'shrug';
  expression: 'happy' | 'wink' | 'wow';
}> = {
  waiting: {
    message: heroGuidanceCopy.message,
    pose: 'shrug',
    expression: 'happy',
  },
  focused: {
    message: 'Estou entendendo a sua dúvida.',
    pose: 'think',
    expression: 'happy',
  },
  processing: {
    message: 'Consultando a documentação...',
    pose: 'think',
    expression: 'happy',
  },
  result: {
    message: 'Encontrei caminhos para você.',
    pose: 'present',
    expression: 'happy',
  },
  empty: {
    message: 'Vamos tentar por outro caminho.',
    pose: 'shrug',
    expression: 'happy',
  },
  error: {
    message: 'A consulta encontrou um obstáculo.',
    pose: 'shrug',
    expression: 'wink',
  },
};

type CategoryCard = {
  id: string;
  title: string;
  description: string;
  count: number;
  icon: 'puzzle' | 'gear' | 'truck' | 'chart' | 'cap';
  tone: 'blue' | 'pink';
  to: string;
};

function normalize(value: string | null | undefined) {
  return (value ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();
}

function buildSuggestedArticleLinks(
  spaceSlug: string,
  articles: PublicKnowledgeArticleListRow[],
): SuggestedArticle[] {
  return suggestedArticleDefinitions.flatMap((definition) => {
    const article = articles.find((candidate) => normalize(candidate.title) === definition.match);
    if (!article) return [];

    return [{
      id: definition.id,
      title: article.title,
      articleId: article.id,
      to: `/help/${spaceSlug}/articles/${article.slug}`,
    }];
  });
}

function resolveHeroAssistantState({
  activeQuery,
  searchInput,
  searchPhase,
}: {
  activeQuery: string;
  searchInput: string;
  searchPhase: SearchPhase;
}): HeroAssistantState {
  if (searchInput.trim() && searchInput.trim() !== activeQuery) return 'focused';
  if (searchPhase === 'loading' || (activeQuery && searchPhase === 'idle')) return 'processing';
  if (searchPhase === 'ready') return 'result';
  if (searchPhase === 'empty') return 'empty';
  if (searchPhase === 'error' || searchPhase === 'contract-unavailable') return 'error';
  if (searchInput.trim()) return 'focused';
  return 'waiting';
}

function buildCategoryCards(
  spaceSlug: string,
  rootCategories: PublicKnowledgeNavigationRow[],
  articles: PublicKnowledgeArticleListRow[],
) {
  if (rootCategories.length > 0) return buildTaxonomyCategoryCards(spaceSlug, rootCategories);

  const definitions: Array<Omit<CategoryCard, 'count' | 'to'> & { query: string; patterns: string[] }> = [
    {
      id: 'integracoes',
      title: 'Integrações e API',
      description: 'Conecte sua loja, ERPs e plataformas ao Genius Returns.',
      query: 'integração',
      patterns: ['integr'],
      icon: 'puzzle',
      tone: 'blue',
    },
    {
      id: 'configuracoes',
      title: 'Configurações',
      description: 'Ajustes essenciais para deixar o sistema do seu jeito.',
      query: 'configuração',
      patterns: ['config', 'primeiro passo', 'primeiros passos'],
      icon: 'gear',
      tone: 'pink',
    },
    {
      id: 'operacao-reversa',
      title: 'Operação reversa',
      description: 'Fluxos de devolução, regras, etiquetas e transportadoras.',
      query: 'operação reversa',
      patterns: ['oper', 'reversa', 'logistica'],
      icon: 'truck',
      tone: 'blue',
    },
    {
      id: 'erros-e-solucoes',
      title: 'Erros e soluções',
      description: 'Diagnósticos, correções e caminhos para resolver ocorrências.',
      query: 'erro',
      patterns: ['erro', 'pendencia', 'solucao'],
      icon: 'chart',
      tone: 'pink',
    },
    {
      id: 'boas-praticas',
      title: 'Boas práticas',
      description: 'Recomendações para melhorar a operação no dia a dia.',
      query: 'boas práticas',
      patterns: ['boa pratica', 'boas praticas', 'melhor pratica', 'suporte tecnico'],
      icon: 'cap',
      tone: 'blue',
    },
  ];

  return definitions.map(({ patterns, query, ...definition }) => {
    const category = rootCategories.find((entry) =>
      patterns.some((pattern) => normalize(entry.category_name).includes(pattern)),
    );
    const count = category?.subtree_article_count ?? articles.filter((article) => {
      const haystack = normalize([article.category_name, article.title, article.summary].join(' '));
      return patterns.some((pattern) => haystack.includes(pattern));
    }).length;

    return {
      ...definition,
      count,
      to: buildHelpCenterCategoryHref(spaceSlug, category?.category_id, query),
    } satisfies CategoryCard;
  }).filter((card) => card.count > 0);
}

function buildTaxonomyCategoryCards(
  spaceSlug: string,
  rootCategories: PublicKnowledgeNavigationRow[],
) {
  const definitions: Array<Omit<CategoryCard, 'count' | 'to'> & { categorySlug: string }> = [
    { id: 'integracoes', title: 'Integra\u00e7\u00f5es e API', description: 'Conecte sua loja, ERPs e plataformas ao Genius Returns.', categorySlug: 'integracoes', icon: 'puzzle', tone: 'blue' },
    { id: 'configuracoes', title: 'Configura\u00e7\u00e3o da opera\u00e7\u00e3o', description: 'Organize par\u00e2metros, regras, estornos e comunica\u00e7\u00e3o com o cliente.', categorySlug: 'configuracao-da-operacao', icon: 'gear', tone: 'pink' },
    { id: 'operacao-reversa', title: 'Trocas e devolu\u00e7\u00f5es', description: 'Acompanhe solicita\u00e7\u00f5es e entenda cada etapa da log\u00edstica reversa.', categorySlug: 'operacao-de-trocas-e-devolucoes', icon: 'truck', tone: 'blue' },
    { id: 'erros-e-solucoes', title: 'Solu\u00e7\u00e3o de problemas', description: 'Encontre diagn\u00f3sticos, corre\u00e7\u00f5es e caminhos de recupera\u00e7\u00e3o.', categorySlug: 'solucao-de-problemas', icon: 'chart', tone: 'pink' },
    { id: 'sellers-e-lojas', title: 'Sellers e lojas', description: 'Configure lojas, sellers e os canais que participam da opera\u00e7\u00e3o.', categorySlug: 'sellers-e-lojas', icon: 'cap', tone: 'blue' },
  ];

  return definitions
    .map(({ categorySlug, ...definition }) => {
      const category = rootCategories.find((entry) => entry.category_slug === categorySlug);
      return {
        ...definition,
        count: category?.subtree_article_count ?? 0,
        to: buildHelpCenterCategoryHref(spaceSlug, category?.category_id, categorySlug),
      } satisfies CategoryCard;
    })
    .filter((card) => card.count > 0);
}

export function HelpCenterHomePage() {
  const context = useOutletContext<HelpCenterSpaceContext>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState(searchParams.get('q') ?? '');
  const [searchPhase, setSearchPhase] = useState<SearchPhase>('idle');
  const [searchMessage, setSearchMessage] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<PublicKnowledgeSearchArticleRow[]>([]);

  const activeQuery = (searchParams.get('q') ?? '').trim();
  const rootCategories = context.navigation.filter((entry) => entry.parent_category_id === null);
  const categoryCards = useMemo(
    () => buildCategoryCards(context.primaryRoute.knowledge_space_slug, rootCategories, context.articles),
    [context.articles, context.primaryRoute.knowledge_space_slug, rootCategories],
  );
  const suggestedArticles = useMemo(
    () => buildSuggestedArticleLinks(context.primaryRoute.knowledge_space_slug, context.articles),
    [context.articles, context.primaryRoute.knowledge_space_slug],
  );
  const heroAssistantState = resolveHeroAssistantState({
    activeQuery,
    searchInput,
    searchPhase,
  });
  const heroMascot = heroMascotByState[heroAssistantState];
  const topArticles = context.articles.slice(0, 3);

  const loadSearch = useEffectEvent(async (query: string) => {
    try {
      const results = await searchPublicKnowledgeArticles(
        context.primaryRoute.knowledge_space_slug,
        query,
        5,
      );
      setSearchResults(results.slice(0, 5));
      setSearchMessage(null);
      setSearchPhase(results.length === 0 ? 'empty' : 'ready');
    } catch (error) {
      const classified = classifyAdminError(
        error,
        'Não foi possível executar a busca pública da Central de Ajuda.',
      );
      setSearchResults([]);
      setSearchMessage(classified.message);
      setSearchPhase(classified.kind === 'contract-unavailable' ? 'contract-unavailable' : 'error');
    }
  });

  useEffect(() => {
    setSearchInput(searchParams.get('q') ?? '');
  }, [searchParams]);

  useEffect(() => {
    if (!activeQuery) {
      setSearchResults([]);
      setSearchMessage(null);
      setSearchPhase('idle');
      return;
    }

    if (activeQuery.length < 2) {
      setSearchResults([]);
      setSearchMessage(null);
      setSearchPhase('empty');
      return;
    }

    setSearchPhase('loading');
    void loadSearch(activeQuery);
  }, [activeQuery, context.primaryRoute.knowledge_space_slug]);

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextQuery = searchInput.trim();
    const nextParams = new URLSearchParams(searchParams);
    if (nextQuery) nextParams.set('q', nextQuery);
    else nextParams.delete('q');
    setSearchParams(nextParams, { replace: nextQuery === activeQuery });
  }

  function clearSearch() {
    setSearchInput('');
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('q');
    setSearchParams(nextParams, { replace: true });
  }

  function renderSearchContent() {
    if (searchPhase === 'loading') {
      return (
        <PublicSearchStateCard
          description="Estamos consultando a documentação para você."
          showMascot={false}
          title="Buscando..."
          tone="loading"
        />
      );
    }

    if (searchPhase === 'empty') {
      return (
        <div className="rounded-[22px] border border-[var(--help-border)] bg-[var(--help-surface-strong)] px-5 py-5" role="status">
          <p className="text-base font-semibold text-[var(--help-ink-strong)]">Não encontrei resultados para “{activeQuery}”.</p>
          <p className="mt-1 text-sm leading-6 text-[var(--help-muted)]">Tente usar outras palavras ou explore as categorias disponíveis.</p>
          <div className="mt-4 flex flex-wrap gap-3">
            <GhostButton onClick={clearSearch}>Limpar busca</GhostButton>
            <Link className="inline-flex min-h-10 items-center rounded-[12px] bg-[var(--help-link)] px-4 text-sm font-semibold text-white no-underline" to="#categorias">Explorar categorias</Link>
          </div>
        </div>
      );
    }

    if (searchPhase === 'contract-unavailable' || searchPhase === 'error') {
      return (
        <PublicSearchStateCard
          action={<GhostButton onClick={() => void loadSearch(activeQuery)}>Tentar novamente</GhostButton>}
          description={searchMessage ?? 'Não foi possível realizar a busca neste momento.'}
          showMascot={false}
          title="Erro ao buscar"
          tone="error"
        />
      );
    }

    if (searchPhase === 'ready') {
      return (
        <section aria-live="polite" aria-label={`Resultados para ${activeQuery}`} className="space-y-3">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--help-link)]">Consulta</p>
              <h2 className="mt-1 text-[1.4rem] font-semibold tracking-[-0.04em] text-[var(--help-ink-strong)]">Resultados para “{activeQuery}”</h2>
            </div>
            <button className="text-sm font-semibold text-[var(--help-link)]" onClick={clearSearch} type="button">Limpar busca</button>
          </div>
          <div className="grid gap-3 md:grid-cols-2">
            {searchResults.map((article) => (
              <Link
                className="group rounded-[20px] border border-[var(--help-border)] bg-[var(--help-surface-strong)] px-4 py-4 no-underline transition hover:border-[var(--help-accent)] hover:shadow-[var(--help-shadow)]"
                key={article.article_id}
                to={`/help/${context.primaryRoute.knowledge_space_slug}/articles/${article.slug}`}
              >
                <div className="flex h-full flex-col gap-3">
                  <div className="flex items-center justify-between gap-3">
                    <span className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--help-link)]">{article.category_name ?? 'Central de Ajuda'}</span>
                    <HelpIcon className="shrink-0 text-[var(--help-muted)] transition group-hover:text-[var(--help-link)]" kind="chevron-right" />
                  </div>
                  <h3 className="text-base font-semibold text-[var(--help-ink-strong)]">{article.title}</h3>
                  <p className="line-clamp-3 text-sm leading-6 text-[var(--help-muted)]">{article.summary ?? 'Orientação pública disponível para consulta.'}</p>
                </div>
              </Link>
            ))}
          </div>
        </section>
      );
    }

    return null;
  }

  return (
    <div className="grid gap-8 pb-8">
      <section className="grid gap-4" aria-labelledby="help-home-title">
        <div className="relative overflow-hidden rounded-[28px] border border-[var(--help-consultation-border)] bg-[var(--help-consultation-canvas)] shadow-[var(--help-consultation-shadow)] lg:grid lg:min-h-[440px] lg:grid-cols-[minmax(0,1fr)_minmax(390px,0.92fr)]" data-testid="help-home-hero">
          <div className="relative flex flex-col justify-center gap-5 px-6 py-9 sm:px-10 sm:py-12 lg:px-12 lg:py-14">
            <p className="flex items-center gap-2 text-sm font-semibold text-[var(--help-consultation-ink)]"><span aria-hidden="true" className="text-lg text-[var(--color-brand-magenta)]">✦</span> Bem-vindo à Central de Ajuda</p>
            <h1 className="max-w-[620px] text-[2.8rem] font-semibold leading-[0.98] tracking-[-0.07em] text-[var(--help-consultation-ink)] sm:text-[3.6rem] lg:text-[4.1rem]" id="help-home-title">
              <span className="block">Seu desejo é uma</span>
              <span className="block"><span data-testid="hero-title-highlight" className="text-[var(--help-consultation-accent)]">consulta.</span></span>
            </h1>
            <p className="max-w-[35rem] text-base leading-7 text-[var(--help-consultation-muted)]">Pergunte ao Gênio e encontre respostas para configurar, operar e resolver dúvidas no Genius Returns.</p>

            <form className="flex min-w-0 max-w-[620px] flex-col gap-3 sm:flex-row sm:items-center" onSubmit={handleSearchSubmit} role="search">
              <label className="relative min-w-0 flex-1">
                <span className="sr-only">Buscar na Central de Ajuda</span>
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--help-muted)]"><HelpIcon kind="search" /></span>
                <input
                  aria-label="Buscar na Central de Ajuda"
                  autoComplete="off"
                  className="h-14 w-full rounded-[16px] border border-[var(--help-border)] bg-[var(--help-consultation-surface)] pl-11 pr-4 text-base text-[var(--help-consultation-ink)] outline-none placeholder:text-[var(--help-muted)] focus:ring-2 focus:ring-[var(--help-focus)]"
                  onChange={(event) => setSearchInput(event.target.value)}
                  placeholder="Digite sua dúvida..."
                  type="search"
                  value={searchInput}
                />
              </label>
              <AppButton className="h-14 w-full shrink-0 rounded-[16px] px-8 text-base sm:w-auto" type="submit">Buscar</AppButton>
            </form>

            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3" data-ai-enabled={HELP_CENTER_AI_ENABLED} data-testid="hero-ai-guidance">
              <span className="inline-flex w-fit items-center gap-2 rounded-full bg-[var(--help-consultation-accent-soft)] px-3 py-2 text-xs font-semibold text-[var(--help-consultation-accent)]"><span aria-hidden="true" className="text-base text-[var(--color-brand-magenta)]">✦</span> {heroGuidanceCopy.label}</span>
              <span className="text-xs leading-5 text-[var(--help-consultation-muted)]">O Gênio ajuda a encontrar o artigo certo.</span>
            </div>
          </div>

          <div className="relative flex items-center justify-center border-t border-[var(--help-consultation-border)] px-5 py-8 sm:px-8 lg:border-l lg:border-t-0 lg:px-8" data-testid="hero-companion">
            <div className="pointer-events-none absolute inset-5 rounded-[24px] bg-[var(--help-consultation-soft)] opacity-70" />
            <div className="relative flex w-full max-w-[440px] flex-col items-center gap-3">
              <div aria-live="polite" className="max-w-[230px] rounded-[16px] border border-[var(--help-consultation-border)] bg-[var(--help-consultation-surface)] px-4 py-3 text-center text-xs font-semibold leading-5 text-[var(--help-consultation-ink)] shadow-[var(--help-consultation-shadow)]" data-testid="hero-assistant-message">
                {heroMascot.message}
              </div>
              <div className="flex min-h-[190px] items-center justify-center sm:min-h-[220px]" data-testid="hero-mascot">
                <GeniusMascot alt="Gênio acompanhando a consulta na Central de Ajuda" expression={heroMascot.expression} pose={heroMascot.pose} size="xl" surface={heroAssistantState === 'processing' ? 'loading' : 'default'} />
              </div>
              <div className="w-full space-y-3" data-testid="hero-suggestions">
                <div className="flex items-center justify-between gap-3">
                  <p className="flex items-center gap-2 text-sm font-semibold text-[var(--help-consultation-ink)]"><span aria-hidden="true" className="text-base text-[var(--color-brand-magenta)]">✦</span> Sugestões do Gênio</p>
                  <span className="inline-flex items-center gap-1 text-xs text-[var(--color-success-ink)]"><span aria-hidden="true" className="h-2 w-2 rounded-full bg-[var(--color-success-text)]" /> Gênio disponível</span>
                </div>
                <div className="grid gap-2">
                  {suggestedArticles.map(({ id, title, to }) => (
                    <Link
                      aria-label={`Abrir artigo: ${title}`}
                      className="group flex min-h-14 items-center gap-3 rounded-[14px] border border-[var(--help-consultation-border)] bg-[var(--help-consultation-surface)] px-3 py-2.5 text-sm font-medium leading-5 text-[var(--help-consultation-ink)] no-underline transition hover:border-[var(--help-consultation-accent)] hover:bg-[var(--help-consultation-accent-soft)]"
                      data-suggestion-id={id}
                      key={id}
                      to={to}
                    >
                      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[var(--help-consultation-soft)] text-[var(--help-consultation-accent)]"><HelpIcon className="h-4 w-4" kind="search" /></span>
                      <span className="min-w-0 flex-1">{title}</span>
                      <HelpIcon className="shrink-0 text-[var(--help-consultation-muted)] transition group-hover:translate-x-0.5 group-hover:text-[var(--help-consultation-accent)]" kind="chevron-right" />
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        {searchPhase !== 'idle' ? <div aria-busy={searchPhase === 'loading'} className="mt-1" data-testid="help-home-search-results">{renderSearchContent()}</div> : null}
      </section>

      <section className="grid gap-4" id="categorias">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-[1.65rem] font-semibold tracking-[-0.05em] text-[var(--help-ink-strong)]">Explore por categoria</h2>
            <p className="mt-1 text-sm leading-6 text-[var(--help-muted)]">Encontre orientações organizadas por tema.</p>
          </div>
          <Link className="text-sm font-semibold text-[var(--help-link)] no-underline" to={`/help/${context.primaryRoute.knowledge_space_slug}/articles`}>Ver todas as categorias <HelpIcon className="ml-1 inline-block" kind="chevron-right" /></Link>
        </div>

        <div className="grid gap-3 md:hidden">
          {categoryCards.slice(0, 3).map((card) => <CategoryCard card={card} key={card.id} mobile />)}
        </div>
        <div className="hidden gap-4 md:grid md:grid-cols-2 xl:grid-cols-5">
          {categoryCards.map((card) => <CategoryCard card={card} key={card.id} />)}
        </div>
      </section>

      <section className="grid gap-4" aria-labelledby="featured-articles-title">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="text-[1.65rem] font-semibold tracking-[-0.05em] text-[var(--help-ink-strong)]" id="featured-articles-title">Artigos mais úteis</h2>
            <p className="mt-1 text-sm leading-6 text-[var(--help-muted)]">Recomendações para continuar sua consulta.</p>
          </div>
          <Link className="text-sm font-semibold text-[var(--help-link)] no-underline" to={`/help/${context.primaryRoute.knowledge_space_slug}/articles`}>Ver todos os artigos <HelpIcon className="ml-1 inline-block" kind="chevron-right" /></Link>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          {topArticles.map((article) => <FeaturedArticleCard article={article} key={article.id} spaceSlug={context.primaryRoute.knowledge_space_slug} />)}
        </div>
      </section>
    </div>
  );
}

function CategoryCard({ card, mobile = false }: { card: CategoryCard; mobile?: boolean }) {
  const visual = getCategoryVisuals(card.title);
  const sizeClass = mobile ? 'min-h-0' : 'min-h-[220px]';
  return (
    <Link className={`group flex ${sizeClass} flex-col rounded-[20px] border border-[var(--help-border)] bg-[var(--help-surface-strong)] px-4 py-4 no-underline shadow-[var(--help-shadow)] transition hover:-translate-y-0.5 hover:border-[var(--help-accent)] ${mobile ? '' : 'px-5 py-5'}`} to={card.to}>
      <PublicIconBadge className={mobile ? 'h-10 w-10 rounded-[14px]' : ''} icon={visual.icon} tone={visual.tone} />
      <h3 className="mt-4 text-base font-semibold tracking-[-0.03em] text-[var(--help-ink-strong)]">{card.title}</h3>
      <p className="mt-2 text-sm leading-6 text-[var(--help-muted)]">{card.description}</p>
      <span className="mt-auto flex items-center justify-between gap-3 pt-5 text-sm font-semibold text-[var(--help-link)]">
        <span>{card.count} {card.count === 1 ? 'artigo' : 'artigos'}</span>
        <span>Explorar <HelpIcon className="ml-1 inline-block transition group-hover:translate-x-0.5" kind="chevron-right" /></span>
      </span>
  </Link>
  );
}

function FeaturedArticleCard({ article, spaceSlug }: { article: PublicKnowledgeArticleListRow; spaceSlug: string }) {
  return (
    <Link className="group flex min-h-[210px] flex-col rounded-[20px] border border-[var(--help-border)] bg-[var(--help-surface-strong)] p-5 no-underline shadow-[var(--help-shadow)] transition hover:-translate-y-0.5 hover:border-[var(--help-accent)]" data-testid="featured-article-card" to={`/help/${spaceSlug}/articles/${article.slug}`}>
      <div className="flex items-center justify-between gap-3">
        <span className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--help-link)]">{article.category_name ?? 'Central de Ajuda'}</span>
        <HelpIcon className="text-[var(--help-muted)] transition group-hover:text-[var(--help-link)]" kind="chevron-right" />
      </div>
      <h3 className="mt-4 text-lg font-semibold leading-7 tracking-[-0.03em] text-[var(--help-ink-strong)]">{article.title}</h3>
      <p className="mt-2 line-clamp-3 text-sm leading-6 text-[var(--help-muted)]">{article.summary ?? 'Orientação pública disponível para consulta.'}</p>
      <span className="mt-auto pt-4 text-xs text-[var(--help-muted)]">{formatRelativePublicDate(article.updated_at)}</span>
    </Link>
  );
}
