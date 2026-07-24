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
import { sanitizePublicSupportContacts } from './branding';
import { searchPublicKnowledgeArticles } from './public-api';
import { buildHelpCenterCategoryHref } from './help-center-navigation';
import {
  HelpIcon,
  PublicIconBadge,
  PublicSearchStateCard,
  PublicSupportAction,
  formatRelativePublicDate,
} from './public-ui';

type SearchPhase = 'idle' | 'loading' | 'ready' | 'empty' | 'contract-unavailable' | 'error';

const suggestedSearchItems = [
  'Como configurar a integração com Shopify?',
  'Onde acompanho uma solicitação?',
  'Quais são as boas práticas de operação?',
] as const;

function buildCategoryCards(
  spaceSlug: string,
  rootCategories: PublicKnowledgeNavigationRow[],
  articles: PublicKnowledgeArticleListRow[],
  supportLinks: {
    email: string | null;
    docsUrl: string | null;
    statusPageUrl: string | null;
    websiteUrl: string | null;
  },
) {
  const normalize = (value: string | null | undefined) =>
    (value ?? '')
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toLowerCase();

  const findCategory = (patterns: string[]) =>
    rootCategories.find((category) => patterns.some((pattern) => normalize(category.category_name).includes(pattern)));

  const countByPatterns = (patterns: string[]) =>
    articles.filter((article) => {
      const haystack = normalize(
        [article.category_name, article.title, article.summary ?? ''].join(' '),
      );
      return patterns.some((pattern) => haystack.includes(pattern));
    }).length;

  const buildInternalCard = ({
    id,
    title,
    description,
    query,
    patterns,
    icon,
    tone,
  }: {
    id: string;
    title: string;
    description: string;
    query: string;
    patterns: string[];
    icon: 'puzzle' | 'gear' | 'truck' | 'chart' | 'cap';
    tone: 'blue' | 'pink';
  }) => {
    const matchedCategory = findCategory(patterns);
    const count =
      matchedCategory?.subtree_article_count ??
      matchedCategory?.article_count ??
      countByPatterns(patterns);

    return {
      id,
      title,
      description,
      count,
      icon,
      tone,
      to: buildHelpCenterCategoryHref(spaceSlug, matchedCategory?.category_id, query),
      isSupport: false,
      external: false,
    };
  };

  const supportHref =
    supportLinks.email ? `mailto:${supportLinks.email}` : supportLinks.docsUrl ?? null;

  return [
    buildInternalCard({
      id: 'integracoes',
      title: 'Integrações',
      description: 'Conecte sua loja, ERPs e plataformas ao Genius Returns.',
      query: 'integração',
      patterns: ['integr'],
      icon: 'puzzle',
      tone: 'blue',
    }),
    buildInternalCard({
      id: 'configuracoes',
      title: 'Configurações',
      description: 'Ajustes essenciais para deixar o sistema do seu jeito.',
      query: 'configuração',
      patterns: ['config', 'primeiro passo', 'primeiros passos'],
      icon: 'gear',
      tone: 'pink',
    }),
    buildInternalCard({
      id: 'operacao-reversa',
      title: 'Operação reversa',
      description: 'Fluxos de devolução, regras, etiquetas e transportadoras.',
      query: 'operação reversa',
      patterns: ['oper', 'reversa', 'logistica'],
      icon: 'truck',
      tone: 'blue',
    }),
    buildInternalCard({
      id: 'relatorios',
      title: 'Relatórios',
      description: 'Resultados, indicadores e como interpretar os dados.',
      query: 'relatório',
      patterns: ['relat', 'indicador', 'desempenho'],
      icon: 'chart',
      tone: 'pink',
    }),
    buildInternalCard({
      id: 'boas-praticas',
      title: 'Boas práticas',
      description: 'Recomendações para melhor performance operacional.',
      query: 'boas práticas',
      patterns: ['boa pratica', 'boas praticas', 'melhor pratica', 'suporte tecnico'],
      icon: 'cap',
      tone: 'blue',
    }),
    {
      id: 'support-card',
      title: 'Suporte no portal',
      description:
        'Abertura e acompanhamento de chamados após login no ambiente público disponível da sua conta.',
      count: null,
      icon: 'support' as const,
      tone: 'pink' as const,
      to: supportHref,
      isSupport: true,
      external: true,
    },
  ];
}

export function HelpCenterHomePage() {
  const context = useOutletContext<HelpCenterSpaceContext>();
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchInput, setSearchInput] = useState(searchParams.get('q') ?? '');
  const [searchPhase, setSearchPhase] = useState<SearchPhase>('idle');
  const [searchMessage, setSearchMessage] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<PublicKnowledgeSearchArticleRow[]>([]);

  const rootCategories = context.navigation.filter(
    (entry) => entry.parent_category_id === null,
  );
  const supportContacts = sanitizePublicSupportContacts(
    context.primaryRoute.support_contacts,
  );
  const categoryCards = useMemo(
    () =>
      buildCategoryCards(
        context.primaryRoute.knowledge_space_slug,
        rootCategories,
        context.articles,
        supportContacts,
      ),
    [context.articles, context.primaryRoute.knowledge_space_slug, rootCategories, supportContacts],
  );
  const activeQuery = (searchParams.get('q') ?? '').trim();
  const topArticles = context.articles.slice(0, 3);
  const visibleCategoryCards = categoryCards.filter((card) => !card.isSupport);
  const portalHref = supportContacts.websiteUrl ?? supportContacts.docsUrl ?? null;
  const onboardingArticle =
    context.articles.find((article) => article.category_name?.toLowerCase().includes('primeiro')) ??
    context.articles[0] ??
    null;
  const guideHref = onboardingArticle
    ? `/help/${context.primaryRoute.knowledge_space_slug}/articles/${onboardingArticle.slug}`
    : `/help/${context.primaryRoute.knowledge_space_slug}/articles`;

  const loadSearch = useEffectEvent(async (query: string) => {
    try {
      const results = await searchPublicKnowledgeArticles(
        context.primaryRoute.knowledge_space_slug,
        query,
        6,
      );
      setSearchResults(results);
      setSearchMessage(null);
      setSearchPhase(results.length === 0 ? 'empty' : 'ready');
    } catch (error) {
      const classified = classifyAdminError(
        error,
        'Não foi possível executar a busca pública da Central de Ajuda.',
      );
      setSearchResults([]);
      setSearchMessage(classified.message);
      setSearchPhase(
        classified.kind === 'contract-unavailable'
          ? 'contract-unavailable'
          : 'error',
      );
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

    if (!nextQuery) {
      nextParams.delete('q');
    } else {
      nextParams.set('q', nextQuery);
    }

    setSearchParams(nextParams, { replace: nextQuery === activeQuery });
  }

  function renderSearchContent() {
    if (searchPhase === 'loading') {
      return (
        <PublicSearchStateCard
          description="Estamos buscando os melhores conteúdos para você."
          showMascot={false}
          title="Buscando..."
          tone="loading"
        />
      );
    }

    if (searchPhase === 'empty') {
      return (
        <PublicSearchStateCard
          description={
            activeQuery.length < 2
              ? 'Use pelo menos 2 caracteres para iniciar a busca.'
              : 'Não encontramos artigos para este termo. Tente outras palavras ou navegue pelas categorias.'
          }
          title="Sem resultados"
          tone="empty"
        />
      );
    }

    if (searchPhase === 'contract-unavailable' || searchPhase === 'error') {
      return (
        <PublicSearchStateCard
          action={
            <GhostButton onClick={() => void loadSearch(activeQuery)}>
              Tentar novamente
            </GhostButton>
          }
          description={
            searchMessage ??
            'Não foi possível realizar a busca neste momento.'
          }
          title="Erro ao buscar"
          tone="error"
        />
      );
    }

    if (searchPhase === 'ready') {
      return (
        <div className="grid gap-3">
          {searchResults.map((article) => (
            <Link
              key={article.article_id}
              className="rounded-[20px] border border-[var(--help-border)] bg-[var(--help-surface-strong)] px-4 py-4 no-underline transition hover:border-[var(--help-accent)]"
              to={`/help/${context.primaryRoute.knowledge_space_slug}/articles/${article.slug}`}
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 space-y-1.5">
                  <p className="text-sm font-semibold text-[var(--help-ink-strong)]">
                    {article.title}
                  </p>
                  <p className="text-sm leading-6 text-[var(--help-muted)]">
                    {article.summary ?? 'Artigo público disponível para leitura.'}
                  </p>
                </div>
                <HelpIcon kind="chevron-right" className="mt-1 shrink-0 text-[var(--help-muted)]" />
              </div>
            </Link>
          ))}
        </div>
      );
    }

    return null;
  }

  return (
    <div className="grid gap-5 pb-8">
      <section className="grid gap-4">
        <div className="gso-help-hero relative overflow-hidden rounded-[28px] border border-[var(--help-hero-border)] bg-[var(--help-hero)] px-6 py-6 shadow-[var(--help-shadow)] sm:px-8 sm:py-7 lg:min-h-[390px] lg:px-10 lg:py-8 xl:px-12">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,var(--help-orb-a),transparent_28%)]" />

          <div className="relative flex flex-col gap-4 lg:h-full lg:pr-[410px] xl:pr-[448px]">
            <div className="space-y-3 pt-1 lg:max-w-[760px]">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-[var(--help-hero-muted)]">Central de Ajuda</p>
              <h1 className="max-w-[760px] text-[2.55rem] font-semibold leading-[0.98] tracking-[-0.07em] text-[var(--help-hero-text)] sm:text-[3rem] lg:text-[3.75rem]">
                <span className="block">Seu desejo é uma</span>
                <span className="block">consulta.</span>
              </h1>
              <p className="max-w-[700px] text-[0.98rem] leading-7 text-[var(--help-hero-muted)]">
                Pergunte ao Gênio e encontre orientações para configurar, operar e resolver dúvidas no Genius Returns.
              </p>
            </div>

            <form
              className="relative z-10 flex max-w-[840px] min-w-0 flex-col gap-3 sm:flex-row sm:items-center"
              onSubmit={handleSearchSubmit}
            >
              <div className="flex min-w-0 flex-1 flex-col gap-2 rounded-[16px] border border-[var(--help-hero-border)] bg-[var(--help-surface-strong)] p-1.5 shadow-[var(--help-shadow)] sm:flex-row sm:items-center sm:gap-0">
                <label className="relative min-w-0 flex-1">
                  <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[var(--help-muted)]">
                    <HelpIcon kind="search" />
                  </span>
                  <input
                    autoComplete="off"
                    className="h-11 w-full rounded-[12px] bg-transparent pl-11 pr-4 text-sm text-[var(--help-ink-strong)] outline-none placeholder:text-[var(--help-muted)] focus:ring-2 focus:ring-[var(--help-focus)]"
                    onChange={(event) => setSearchInput(event.target.value)}
                    placeholder="O que você quer saber?"
                    type="search"
                    value={searchInput}
                  />
                </label>
                <AppButton className="h-11 w-full shrink-0 rounded-[12px] px-7 text-base sm:w-auto sm:min-w-[126px]" type="submit">
                  Buscar
                </AppButton>
              </div>
            </form>

            <div className="flex flex-wrap gap-2.5 text-sm">
              <span className="inline-flex min-h-9 items-center gap-2 rounded-[12px] border border-[var(--help-hero-border)] bg-[var(--help-accent-soft)] px-3.5 text-[var(--help-hero-text)]">
                <HelpIcon kind="search" className="h-4 w-4" />
                Busca global inteligente
              </span>
              <Link
                className="inline-flex min-h-9 items-center gap-2 rounded-[12px] border border-[var(--help-hero-border)] bg-[color:var(--help-hero-soft)] px-3.5 text-[var(--help-hero-muted)] no-underline transition hover:bg-[var(--help-accent-soft)]"
                to={`/help/${context.primaryRoute.knowledge_space_slug}/articles`}
              >
                <HelpIcon kind="doc" className="h-4 w-4" />
                Artigos
              </Link>
              <Link
                className="inline-flex min-h-9 items-center gap-2 rounded-[12px] border border-[var(--help-hero-border)] bg-[color:var(--help-hero-soft)] px-3.5 text-[var(--help-hero-muted)] no-underline transition hover:bg-[var(--help-accent-soft)]"
                to={guideHref}
              >
                <HelpIcon kind="doc" className="h-4 w-4" />
                Guias passo a passo
              </Link>
              <Link
                className="inline-flex min-h-9 items-center gap-2 rounded-[12px] border border-[var(--help-hero-border)] bg-[color:var(--help-hero-soft)] px-3.5 text-[var(--help-hero-muted)] no-underline transition hover:bg-[var(--help-accent-soft)]"
                to={guideHref}
              >
                <HelpIcon kind="support" className="h-4 w-4" />
                Buscar orientação
              </Link>
            </div>

            <p className="pt-1 text-xs leading-5 text-[var(--help-hero-muted)]">
              Exemplos: integração com Shopify, etiquetas reversas, relatórios,
              transportadoras
            </p>
          </div>

          <div className="hidden lg:absolute lg:right-8 lg:top-8 lg:block lg:w-[360px] xl:right-12 xl:w-[390px]">
            <div className="flex flex-col items-center gap-4 px-4 py-2 text-center">
              <div className="space-y-4">
                <GeniusMascot alt="Gênio anfitrião da consulta" expression="happy" pose="welcome" size="xl" surface="default" />
                <div className="space-y-1.5">
                  <h2 className="text-[1.18rem] font-semibold leading-7 tracking-[-0.04em] text-[var(--help-hero-text)]">Pergunte ao Gênio</h2>
                  <p className="text-sm leading-6 text-[var(--help-hero-muted)]">Comece pela busca ou escolha uma sugestão de consulta.</p>
                </div>

                <div className="grid gap-2.5">
                  {suggestedSearchItems.map((prompt) => (
                    <Link
                      key={prompt}
                      className="flex min-h-[44px] items-center gap-3 rounded-[14px] border border-[var(--help-hero-border)] bg-[color:var(--help-hero-soft)] px-3.5 text-left text-sm text-[var(--help-hero-text)] no-underline transition hover:border-[var(--help-accent)]"
                      to={`/help/${context.primaryRoute.knowledge_space_slug}?q=${encodeURIComponent(prompt)}`}
                    >
                      <PublicIconBadge className="h-7 w-7 rounded-[10px]" icon="support" tone="blue" />
                      <span className="min-w-0 flex-1">{prompt}</span>
                    </Link>
                  ))}
                </div>

                <div className="space-y-3 pt-1">
                  <Link className="block no-underline" to={guideHref}>
                    <AppButton className="min-h-[46px] w-full justify-center rounded-[14px] text-base">
                      Ver guia recomendado
                    </AppButton>
                  </Link>
                  <div className="text-center">
                    <Link
                      className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--help-hero-text)] no-underline"
                      to={guideHref}
                    >
                      Saiba como funciona
                      <HelpIcon kind="chevron-right" />
                    </Link>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="gso-help-mobile-genius mt-5 border-t border-[var(--help-hero-border)] pt-5 lg:hidden">
            <div className="space-y-4">
            <div className="flex flex-col items-center gap-2 text-center">
              <GeniusMascot alt="Gênio anfitrião da consulta" expression="happy" pose="welcome" size="xl" surface="default" />
              <div className="space-y-1.5">
                <h2 className="text-[1.1rem] font-semibold tracking-[-0.04em] text-[var(--help-hero-text)]">Pergunte ao Gênio</h2>
                <p className="text-sm leading-6 text-[var(--help-hero-muted)]">Escolha uma sugestão ou refine sua pergunta na busca.</p>
              </div>
            </div>
            <div className="grid gap-2.5">
              {suggestedSearchItems.map((prompt) => (
                <Link
                  key={`mobile-${prompt}`}
                  className="flex min-h-[44px] items-center gap-3 rounded-[14px] border border-[var(--help-hero-border)] bg-[color:var(--help-hero-soft)] px-3.5 text-sm text-[var(--help-hero-text)] no-underline"
                  to={`/help/${context.primaryRoute.knowledge_space_slug}?q=${encodeURIComponent(prompt)}`}
                >
                  <PublicIconBadge className="h-7 w-7 rounded-[10px]" icon="support" tone="blue" />
                  <span className="min-w-0 flex-1">{prompt}</span>
                </Link>
              ))}
            </div>
            <Link className="block no-underline" to={guideHref}>
              <AppButton className="min-h-[46px] w-full justify-center rounded-[14px] text-base">
                Ver guia recomendado
              </AppButton>
            </Link>
            <div>
              <Link
                className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--help-hero-text)] no-underline"
                to={guideHref}
              >
                Saiba como funciona
                <HelpIcon kind="chevron-right" />
              </Link>
            </div>
          </div>
        </div>

        </div>

        {searchPhase !== 'idle' ? <div className="mt-1">{renderSearchContent()}</div> : null}
      </section>

      <section className="hidden">
        <article className="rounded-[22px] border border-[var(--help-border)] bg-[color:var(--help-surface-strong)] px-5 py-5 shadow-[var(--help-shadow)]">
          <div className="flex items-start gap-4">
            <PublicIconBadge className="h-12 w-12 rounded-[18px]" icon="search" tone="blue" />
            <div className="min-w-0 flex-1 space-y-1.5">
              <h2 className="text-[1.15rem] font-semibold tracking-[-0.04em] text-[var(--help-ink-strong)]">
                Buscar na documentação
              </h2>
              <p className="text-sm leading-6 text-[var(--help-muted)]">
                Encontre artigos, guias e respostas usando a busca global
                inteligente.
              </p>
              <Link
                className="inline-flex items-center gap-2 pt-1 text-sm font-semibold text-[var(--help-link)] no-underline"
                to={`/help/${context.primaryRoute.knowledge_space_slug}/articles`}
              >
                Explorar artigos
                <HelpIcon kind="chevron-right" />
              </Link>
            </div>
          </div>
        </article>

        <article className="rounded-[22px] border border-[var(--help-border)] bg-[color:var(--help-surface-strong)] px-5 py-5 shadow-[var(--help-shadow)]">
          <div className="flex items-start gap-4">
            <PublicIconBadge className="h-12 w-12 rounded-[18px]" icon="support" tone="blue" />
            <div className="min-w-0 flex-1 space-y-1.5">
              <h2 className="text-[1.15rem] font-semibold tracking-[-0.04em] text-[var(--help-ink-strong)]">
                Orientação assistida por conteúdo
              </h2>
              <p className="text-sm leading-6 text-[var(--help-muted)]">
                Use guias públicos e sugestões de busca para encontrar o próximo
                passo sem depender de automação.
              </p>
              <Link
                className="inline-flex items-center gap-2 pt-1 text-sm font-semibold text-[var(--help-link)] no-underline"
                to={guideHref}
              >
                Saiba como funciona
                <HelpIcon kind="chevron-right" />
              </Link>
            </div>
          </div>
        </article>

        <article className="rounded-[22px] border border-[var(--help-border)] bg-[color:var(--help-surface-strong)] px-5 py-5 shadow-[var(--help-shadow)]">
          <div className="flex items-start gap-4">
            <PublicIconBadge className="h-12 w-12 rounded-[18px]" icon="support" tone="pink" />
            <div className="min-w-0 flex-1 space-y-1.5">
              <h2 className="text-[1.15rem] font-semibold tracking-[-0.04em] text-[var(--help-ink-strong)]">
                Entrar no portal do cliente
              </h2>
              <p className="text-sm leading-6 text-[var(--help-muted)]">
                {portalHref
                  ? 'Abra e acompanhe chamados, visualize solicitações e fale com o suporte.'
                  : 'Use o portal da conta quando disponível para tratar temas específicos do relacionamento.'}
              </p>
              {portalHref ? (
                <a
                  className="inline-flex items-center gap-2 pt-1 text-sm font-semibold text-[var(--help-link)] no-underline"
                  href={portalHref}
                  rel="noreferrer"
                  target="_blank"
                >
                  Entrar no portal
                  <HelpIcon kind="chevron-right" />
                </a>
              ) : (
                <Link
                  className="inline-flex items-center gap-2 pt-1 text-sm font-semibold text-[var(--help-link)] no-underline"
                  to={`/help/${context.primaryRoute.knowledge_space_slug}/articles`}
                >
                  Navegar na central
                  <HelpIcon kind="chevron-right" />
                </Link>
              )}
            </div>
          </div>
        </article>
      </section>

      <section className="grid gap-4" id="categorias">
        <div className="space-y-1">
          <h2 className="text-[1.65rem] font-semibold tracking-[-0.05em] text-[var(--help-ink-strong)]">
            Explore por categoria
          </h2>
          <p className="text-sm leading-6 text-[var(--help-muted)]">
            Encontre orientações organizadas por tema.
          </p>
        </div>

        <div className="grid gap-3 md:hidden">
          {visibleCategoryCards.slice(0, 3).map((card) => (
            <article
              key={`mobile-${card.id}`}
              className="rounded-[20px] border border-[var(--help-border)] bg-[var(--help-surface-strong)] px-4 py-4 shadow-[var(--help-shadow)]"
            >
              <div className="flex items-start gap-3">
                <PublicIconBadge className="h-11 w-11 rounded-[16px]" icon={card.icon} tone={card.tone} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-[1rem] font-semibold tracking-[-0.03em] text-[var(--help-ink-strong)]">
                        {card.title}
                      </h3>
                      {typeof card.count === 'number' ? (
                        <p className="pt-1 text-xs text-[var(--help-muted)]">{card.count} artigos</p>
                      ) : null}
                    </div>
                    <span className="pt-1 text-[var(--help-muted)]">
                      <HelpIcon kind="chevron-right" />
                    </span>
                  </div>
                  <p className="pt-2 text-sm leading-6 text-[var(--help-muted)]">
                    {card.description}
                  </p>
                  <div className="pt-3">
                    {card.isSupport ? (
                      <PublicSupportAction href={typeof card.to === 'string' ? card.to : null} label="Entrar no portal" />
                    ) : (
                      <Link
                        className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--help-link)] no-underline"
                        to={card.to ?? `/help/${context.primaryRoute.knowledge_space_slug}/articles`}
                      >
                        Ver artigos
                        <HelpIcon kind="chevron-right" />
                      </Link>
                    )}
                  </div>
                </div>
              </div>
            </article>
          ))}
          {visibleCategoryCards.length > 3 ? (
            <Link className="pt-1 text-sm font-semibold text-[var(--help-link)] no-underline" to={`/help/${context.primaryRoute.knowledge_space_slug}/articles`}>
              Ver todas as categorias <HelpIcon kind="chevron-right" />
            </Link>
          ) : null}
        </div>

        <div className="hidden gap-4 md:grid md:grid-cols-2 xl:grid-cols-5">
          {visibleCategoryCards.map((card) => (
            <article
              key={card.id}
              className="flex min-h-[248px] flex-col rounded-[22px] border border-[var(--help-border)] bg-[var(--help-surface-strong)] px-4 py-5 shadow-[var(--help-shadow)]"
            >
              <div className="space-y-4">
                <PublicIconBadge icon={card.icon} tone={card.tone} />
                <div className="space-y-2">
                  <h3 className="text-[1rem] font-semibold tracking-[-0.03em] text-[var(--help-ink-strong)]">
                    {card.title}
                  </h3>
                  <p className="text-sm leading-6 text-[var(--help-muted)]">
                    {card.description}
                  </p>
                </div>
              </div>

              <div className="mt-auto space-y-3 pt-4">
                {card.isSupport ? (
                  <PublicSupportAction href={typeof card.to === 'string' ? card.to : null} label="Entrar no portal" />
                ) : (
                  <Link
                    className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--help-link)] no-underline"
                    to={card.to ?? `/help/${context.primaryRoute.knowledge_space_slug}/articles`}
                  >
                    Ver artigos
                    <HelpIcon kind="chevron-right" />
                  </Link>
                )}
                {typeof card.count === 'number' ? (
                  <p className="text-xs text-[var(--help-muted)]">{card.count} artigos</p>
                ) : null}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="grid gap-5">
        <div className="rounded-[28px] border border-[var(--help-border)] bg-[var(--help-surface-strong)] px-4 py-5 shadow-[var(--help-shadow)] sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="space-y-1">
              <h2 className="text-[1.65rem] font-semibold tracking-[-0.05em] text-[var(--help-ink-strong)]">
                Artigos mais úteis
              </h2>
              <p className="text-sm leading-6 text-[var(--help-muted)]">
                Conteúdos que podem ajudar no seu dia a dia.
              </p>
            </div>
            <Link
              className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--help-link)] no-underline"
              to={`/help/${context.primaryRoute.knowledge_space_slug}/articles`}
            >
              Ver todos os artigos
              <HelpIcon kind="chevron-right" />
            </Link>
          </div>

          <div className="mt-5 overflow-hidden rounded-[20px] border border-[var(--help-border)]">
            <div className="hidden grid-cols-[minmax(0,1fr)_150px_150px_28px] items-center gap-4 bg-[var(--help-surface)] px-4 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--help-muted)] md:grid">
              <span>Artigo</span>
              <span>Categoria</span>
              <span>Atualizado</span>
              <span />
            </div>
            <div className="divide-y divide-[var(--help-border)]">
              {topArticles.map((article) => (
                <Link
                  key={article.id}
                  className="grid gap-2 px-4 py-4 no-underline transition hover:bg-[var(--help-surface)] md:grid-cols-[minmax(0,1fr)_150px_150px_28px] md:items-center md:gap-4"
                  to={`/help/${context.primaryRoute.knowledge_space_slug}/articles/${article.slug}`}
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-[12px] border border-[var(--help-border)] bg-[color:var(--help-surface-strong)] text-[var(--help-muted)]">
                      <HelpIcon kind="doc" />
                    </span>
                    <p className="min-w-0 text-sm font-medium text-[var(--help-ink)]">
                      {article.title}
                    </p>
                  </div>
                  <div className="text-sm">
                    {article.category_name ? (
                      <span className="inline-flex rounded-full bg-[var(--help-accent-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--help-link)]">
                        {article.category_name}
                      </span>
                    ) : (
                      <span className="text-xs text-[var(--help-muted)]">Categoria pública</span>
                    )}
                  </div>
                  <p className="text-xs text-[var(--help-muted)]">
                    {formatRelativePublicDate(article.updated_at)}
                  </p>
                  <span className="hidden justify-self-end text-[var(--help-muted)] md:inline-flex">
                    <HelpIcon kind="chevron-right" />
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </div>

        <aside className="hidden">
          <section className="rounded-[24px] border border-[var(--help-border)] bg-[color:var(--help-surface-strong)] px-5 py-5 shadow-[var(--help-shadow)]">
            <div className="space-y-4">
              <h2 className="text-[1.55rem] font-semibold tracking-[-0.05em] text-[var(--help-ink-strong)]">
                Acesso rápido
              </h2>
              <div className="grid gap-3">
                <Link className="flex items-center justify-between gap-3 text-sm font-medium text-[var(--help-link)] no-underline" to={`/help/${context.primaryRoute.knowledge_space_slug}/articles`}>
                  <span>Ver todos os artigos</span>
                  <HelpIcon kind="chevron-right" />
                </Link>
                <a className="flex items-center justify-between gap-3 text-sm font-medium text-[var(--help-link)] no-underline" href={`#categorias`}>
                  <span>Navegar por categorias</span>
                  <HelpIcon kind="chevron-right" />
                </a>
                {portalHref ? (
                  <a className="flex items-center justify-between gap-3 text-sm font-medium text-[var(--help-link)] no-underline" href={portalHref} rel="noreferrer" target="_blank">
                    <span>Entrar no portal</span>
                    <HelpIcon kind="chevron-right" />
                  </a>
                ) : null}
                <Link className="flex items-center justify-between gap-3 text-sm font-medium text-[var(--help-link)] no-underline" to={guideHref}>
                  <span>Ver guia recomendado</span>
                  <HelpIcon kind="chevron-right" />
                </Link>
              </div>
            </div>
          </section>

          <section className="rounded-[24px] border border-[var(--help-border)] bg-[color:var(--help-surface-strong)] px-5 py-5 shadow-[var(--help-shadow)]">
            <div className="space-y-4">
              <h2 className="text-[1.55rem] font-semibold tracking-[-0.05em] text-[var(--help-ink-strong)]">
                Como esta central ajuda você
              </h2>
              <div className="grid gap-4">
                <div className="flex items-start gap-3">
                  <PublicIconBadge className="h-11 w-11 rounded-[16px]" icon="shield" tone="blue" />
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-[var(--help-ink-strong)]">Conteúdo oficial e atualizado</p>
                    <p className="text-sm leading-6 text-[var(--help-muted)]">Guia confiável para configurar, operar e evoluir com segurança.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <PublicIconBadge className="h-11 w-11 rounded-[16px]" icon="search" tone="blue" />
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-[var(--help-ink-strong)]">Busca por artigos e contexto</p>
                    <p className="text-sm leading-6 text-[var(--help-muted)]">Encontre respostas mais rápido usando a busca da central e guias públicos.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <PublicIconBadge className="h-11 w-11 rounded-[16px]" icon="support" tone="blue" />
                  <div className="space-y-1">
                    <p className="text-sm font-semibold text-[var(--help-ink-strong)]">
                      Suporte no portal do cliente
                    </p>
                    <p className="text-sm leading-6 text-[var(--help-muted)]">
                      {portalHref
                        ? 'Abra, acompanhe e resolva suas solicitações com o suporte.'
                        : 'Use esta central junto do canal operacional já combinado para temas específicos da sua conta.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </aside>
      </section>

    </div>
  );
}
