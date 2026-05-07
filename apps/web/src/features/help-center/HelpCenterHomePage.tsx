import { FormEvent, useEffect, useEffectEvent, useMemo, useState } from 'react';
import { Link, useOutletContext, useSearchParams } from 'react-router-dom';
import { formatDateTime } from '../../app/format';
import {
  EmptyState,
  ErrorState,
  LoadingState,
} from '../../components/states';
import { AppButton, GhostButton, InlineNotice, StatusPill } from '../../components/ui';
import type { PublicKnowledgeSearchArticleRow } from '../../contracts/public-contracts';
import { classifyAdminError } from '../admin/admin-errors';
import type { HelpCenterSpaceContext } from './context';
import { sanitizePublicSupportContacts } from './branding';
import { searchPublicKnowledgeArticles } from './public-api';

type SearchPhase = 'idle' | 'loading' | 'ready' | 'empty' | 'contract-unavailable' | 'error';

function toneForCategoryCount(count: number) {
  if (count >= 6) {
    return 'positive' as const;
  }

  if (count >= 2) {
    return 'accent' as const;
  }

  return 'default' as const;
}

export function HelpCenterHomePage() {
  const context = useOutletContext<HelpCenterSpaceContext>();
  const [searchParams, setSearchParams] = useSearchParams();
  const rootCategories = context.navigation.filter(
    (entry) => entry.parent_category_id === null,
  );
  const featuredArticles = context.articles.slice(0, 6);
  const supportContacts = sanitizePublicSupportContacts(
    context.primaryRoute.support_contacts,
  );
  const [searchInput, setSearchInput] = useState(searchParams.get('q') ?? '');
  const [searchPhase, setSearchPhase] = useState<SearchPhase>('idle');
  const [searchMessage, setSearchMessage] = useState<string | null>(null);
  const [searchResults, setSearchResults] = useState<PublicKnowledgeSearchArticleRow[]>([]);
  const activeQuery = (searchParams.get('q') ?? '').trim();
  const featuredArticle = featuredArticles[0] ?? null;
  const recentArticles = featuredArticles.slice(1, 4);
  const hasSupportLinks =
    Boolean(supportContacts.email) ||
    Boolean(supportContacts.docsUrl) ||
    Boolean(supportContacts.statusPageUrl) ||
    Boolean(supportContacts.websiteUrl);
  const emptySearchDescription = useMemo(
    () =>
      activeQuery.length < 2
        ? 'Use pelo menos 2 caracteres para pesquisar.'
        : 'Nenhum artigo publicado corresponde a esta busca. Tente outro termo ou navegue pelas categorias.',
    [activeQuery],
  );

  const loadSearch = useEffectEvent(async (query: string) => {
    try {
      const results = await searchPublicKnowledgeArticles(
        context.primaryRoute.knowledge_space_slug,
        query,
        10,
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

  function clearSearch() {
    setSearchInput('');
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('q');
    setSearchParams(nextParams, { replace: true });
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1.45fr)_320px]">
      <aside className="space-y-4">
        <section className="rounded-[28px] border border-[var(--help-border)] bg-white/88 p-5 shadow-[0_18px_42px_rgba(20,31,71,0.05)]">
          <div className="space-y-3">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-[var(--help-muted)]">
              Navegação rápida
            </p>
            <div className="grid gap-2">
              <Link
                className="rounded-[18px] border border-[rgba(48,127,226,0.18)] bg-[var(--help-accent-soft)] px-4 py-3 text-sm font-medium text-[var(--help-link)] no-underline"
                to={`/help/${context.primaryRoute.knowledge_space_slug}`}
              >
                Visão geral
              </Link>
              <Link
                className="rounded-[18px] border border-[var(--help-border)] bg-[var(--help-surface)] px-4 py-3 text-sm font-medium text-[var(--help-ink)] no-underline transition hover:border-[rgba(48,127,226,0.18)] hover:text-[var(--help-link)]"
                to={`/help/${context.primaryRoute.knowledge_space_slug}/articles`}
              >
                Todos os artigos
              </Link>
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-[var(--help-border)] bg-white/88 p-5 shadow-[0_18px_42px_rgba(20,31,71,0.05)]">
          <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-[var(--help-muted)]">
                Categorias
              </p>
              <StatusPill tone="accent">{rootCategories.length}</StatusPill>
            </div>
            <div className="grid gap-2">
              {rootCategories.length > 0 ? (
                rootCategories.map((category) => (
                  <Link
                    className="rounded-[20px] border border-[var(--help-border)] bg-[var(--help-surface)] px-4 py-3 no-underline transition hover:border-[rgba(48,127,226,0.18)] hover:bg-white"
                    key={category.category_id}
                    to={`/help/${context.primaryRoute.knowledge_space_slug}/articles?category=${category.category_id}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-[var(--help-ink-strong)]">
                          {category.category_name}
                        </p>
                        <p className="mt-1 text-xs leading-5 text-[var(--help-muted)]">
                          {category.category_description ??
                            'Categoria com conteúdo aprovado para leitura pública.'}
                        </p>
                      </div>
                      <StatusPill tone={toneForCategoryCount(category.subtree_article_count)}>
                        {category.subtree_article_count}
                      </StatusPill>
                    </div>
                  </Link>
                ))
              ) : (
                <InlineNotice>
                  Indisponível
                </InlineNotice>
              )}
            </div>
          </div>
        </section>

        {hasSupportLinks ? (
          <section className="rounded-[28px] border border-[var(--help-border)] bg-white/88 p-5 shadow-[0_18px_42px_rgba(20,31,71,0.05)]">
            <div className="space-y-3">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-[var(--help-muted)]">
                Canais oficiais
              </p>
              <div className="grid gap-2 text-sm">
                {supportContacts.email ? (
                  <a
                    className="rounded-[18px] border border-[var(--help-border)] bg-[var(--help-surface)] px-4 py-3 text-[var(--help-link)] no-underline transition hover:border-[rgba(48,127,226,0.18)] hover:bg-white"
                    href={`mailto:${supportContacts.email}`}
                  >
                    Falar com suporte
                  </a>
                ) : null}
                {supportContacts.docsUrl ? (
                  <a
                    className="rounded-[18px] border border-[var(--help-border)] bg-[var(--help-surface)] px-4 py-3 text-[var(--help-link)] no-underline transition hover:border-[rgba(48,127,226,0.18)] hover:bg-white"
                    href={supportContacts.docsUrl}
                    rel="noreferrer"
                    target="_blank"
                  >
                    Documentação oficial
                  </a>
                ) : null}
                {supportContacts.statusPageUrl ? (
                  <a
                    className="rounded-[18px] border border-[var(--help-border)] bg-[var(--help-surface)] px-4 py-3 text-[var(--help-link)] no-underline transition hover:border-[rgba(48,127,226,0.18)] hover:bg-white"
                    href={supportContacts.statusPageUrl}
                    rel="noreferrer"
                    target="_blank"
                  >
                    Status da plataforma
                  </a>
                ) : null}
                {supportContacts.websiteUrl ? (
                  <a
                    className="rounded-[18px] border border-[var(--help-border)] bg-[var(--help-surface)] px-4 py-3 text-[var(--help-link)] no-underline transition hover:border-[rgba(48,127,226,0.18)] hover:bg-white"
                    href={supportContacts.websiteUrl}
                    rel="noreferrer"
                    target="_blank"
                  >
                    Site institucional
                  </a>
                ) : null}
              </div>
            </div>
          </section>
        ) : null}
      </aside>

      <main className="grid content-start gap-6">
        <section className="rounded-[32px] border border-[var(--help-border)] bg-[var(--help-panel)] p-6 shadow-[var(--shadow-panel)] backdrop-blur sm:p-7">
          <div className="grid gap-5 lg:grid-cols-[minmax(0,1.25fr)_minmax(260px,0.72fr)]">
            <div className="space-y-4">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <StatusPill tone="accent">Visão geral</StatusPill>
                  <StatusPill tone="positive">
                    {context.articles.length} artigo{context.articles.length === 1 ? '' : 's'} publicado{context.articles.length === 1 ? '' : 's'}
                  </StatusPill>
                </div>
                <h2 className="text-[clamp(2.5rem,4vw,3.8rem)] font-semibold tracking-[-0.07em] text-[var(--help-ink-strong)]">
                  Encontre a orientação certa para operar com mais autonomia.
                </h2>
                <p className="max-w-3xl text-[1rem] leading-8 text-[var(--help-muted)]">
                  Esta central reúne apenas conteúdo publicado e aprovado, com foco em tarefas, configuração e uso diário da operação.
                </p>
              </div>

              <div className="flex flex-wrap gap-3">
                <Link to={`/help/${context.primaryRoute.knowledge_space_slug}/articles`}>
                  <AppButton>Ver todos os artigos</AppButton>
                </Link>
                {featuredArticle ? (
                  <Link to={`/help/${context.primaryRoute.knowledge_space_slug}/articles/${featuredArticle.slug}`}>
                    <GhostButton>Ler artigo em destaque</GhostButton>
                  </Link>
                ) : null}
              </div>

              <div className="grid gap-2 sm:grid-cols-3">
                <div className="rounded-[22px] border border-[var(--help-border)] bg-white px-4 py-4">
                  <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-[var(--help-muted)]">
                    Publicados
                  </p>
                  <p className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[var(--help-ink-strong)]">
                    {context.articles.length}
                  </p>
                </div>
                <div className="rounded-[22px] border border-[var(--help-border)] bg-white px-4 py-4">
                  <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-[var(--help-muted)]">
                    Categorias
                  </p>
                  <p className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[var(--help-ink-strong)]">
                    {rootCategories.length}
                  </p>
                </div>
                <div className="rounded-[22px] border border-[var(--help-border)] bg-white px-4 py-4">
                  <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-[var(--help-muted)]">
                    Leitura
                  </p>
                  <p className="mt-2 text-2xl font-semibold tracking-[-0.04em] text-[var(--help-ink-strong)]">
                    Pública
                  </p>
                </div>
              </div>
            </div>

            <div className="rounded-[28px] border border-[var(--help-border)] bg-white/88 p-5 shadow-[0_18px_42px_rgba(20,31,71,0.05)]">
              <div className="space-y-4">
                <div>
                  <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-[var(--help-muted)]">
                    Como esta central funciona
                  </p>
                  <p className="mt-3 text-sm leading-7 text-[var(--help-ink)]">
                    Aqui aparecem somente artigos aprovados para leitura pública. Quando faltar contexto adicional, use os canais oficiais abaixo.
                  </p>
                </div>
                <InlineNotice>
                  Conteúdos internos, rascunhos e materiais restritos não aparecem nesta camada.
                </InlineNotice>
                <div className="rounded-[20px] border border-dashed border-[rgba(48,127,226,0.28)] bg-[var(--help-surface)] px-4 py-4">
                  <p className="text-sm leading-7 text-[var(--help-muted)]">
                    Use a busca para localizar artigos por assunto ou abra a lista completa para navegar por categoria.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[32px] border border-[var(--help-border)] bg-[var(--help-panel)] p-6 shadow-[var(--shadow-panel)] backdrop-blur sm:p-7">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="space-y-2">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-[var(--help-muted)]">
                Busca pública
              </p>
              <h3 className="text-2xl font-semibold tracking-[-0.05em] text-[var(--help-ink-strong)]">
                Procurar artigos publicados
              </h3>
              <p className="max-w-3xl text-sm leading-7 text-[var(--help-muted)]">
                Pesquise por configuração, integração, uso diário ou nome da categoria.
              </p>
            </div>
            {activeQuery ? (
              <StatusPill tone={searchPhase === 'ready' ? 'positive' : 'default'}>
                busca: {activeQuery}
              </StatusPill>
            ) : null}
          </div>

          <form
            className="mt-5 grid gap-3 rounded-[26px] border border-[var(--help-border)] bg-white px-4 py-4 shadow-[0_18px_42px_rgba(20,31,71,0.05)] sm:grid-cols-[minmax(0,1fr)_auto]"
            onSubmit={handleSearchSubmit}
          >
            <label className="grid gap-2" htmlFor="help-center-search">
              <span className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-[var(--help-muted)]">
                Termo de busca
              </span>
              <input
                id="help-center-search"
                autoComplete="off"
                className="h-12 rounded-[18px] border border-[var(--help-border)] bg-[var(--help-surface)] px-4 text-sm text-[var(--help-ink-strong)] outline-none transition placeholder:text-[var(--help-muted)] focus:border-[var(--help-accent)] focus:ring-2 focus:ring-[color:var(--help-accent-soft)]"
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Ex.: integração, configuração, transportadora"
                type="search"
                value={searchInput}
              />
            </label>
            <div className="flex flex-wrap items-end gap-3">
              <AppButton type="submit">Buscar</AppButton>
              {(searchInput || activeQuery) ? (
                <GhostButton onClick={clearSearch} type="button">
                  Limpar
                </GhostButton>
              ) : null}
            </div>
          </form>

          <div className="mt-5">
            {searchPhase === 'idle' ? (
              <div className="rounded-[24px] border border-dashed border-[var(--help-border)] bg-white/66 px-5 py-5 text-sm leading-7 text-[var(--help-muted)]">
                Digite pelo menos 2 caracteres para procurar artigos nesta central.
              </div>
            ) : null}

            {searchPhase === 'loading' ? (
              <LoadingState
                title="Buscando artigos publicados"
                description="Estamos consultando o conteúdo público desta central."
              />
            ) : null}

            {searchPhase === 'contract-unavailable' ? (
              <ErrorState
                title="Busca pública indisponível"
                description="A busca desta central não está disponível neste ambiente agora."
              />
            ) : null}

            {searchPhase === 'error' ? (
              <ErrorState
                title="Falha ao executar a busca"
                description={
                  searchMessage ??
                  'Não foi possível consultar os artigos publicados neste ambiente.'
                }
                action={
                  <GhostButton onClick={() => void loadSearch(activeQuery)}>
                    Tentar novamente
                  </GhostButton>
                }
              />
            ) : null}

            {searchPhase === 'empty' ? (
              <div className="rounded-[24px] border border-dashed border-[var(--help-border)] bg-white/66 px-5 py-5 text-sm leading-7 text-[var(--help-muted)]">
                {emptySearchDescription}
              </div>
            ) : null}

            {searchPhase === 'ready' ? (
              <div className="grid gap-3">
                {searchResults.map((article) => (
                  <Link
                    className="rounded-[24px] border border-[var(--help-border)] bg-white px-5 py-4 no-underline transition hover:border-[var(--help-accent)]/30 hover:bg-[color:var(--help-surface)]"
                    key={article.article_id}
                    to={`/help/${context.primaryRoute.knowledge_space_slug}/articles/${article.slug}`}
                  >
                    <div className="flex flex-wrap items-start justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex flex-wrap gap-2">
                          <StatusPill tone="accent">
                            {article.category_name ?? 'Artigo público'}
                          </StatusPill>
                        </div>
                        <h4 className="text-lg font-semibold tracking-[-0.03em] text-[var(--help-ink-strong)]">
                          {article.title}
                        </h4>
                        <p className="max-w-3xl text-sm leading-7 text-[var(--help-muted)]">
                          {article.summary ?? 'Artigo publicado sem resumo adicional.'}
                        </p>
                      </div>
                      <div className="text-left text-xs leading-5 text-[var(--help-muted)] sm:text-right">
                        <p>Atualizado em {formatDateTime(article.updated_at)}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : null}
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1.15fr)_minmax(280px,0.85fr)]">
          <div className="rounded-[32px] border border-[var(--help-border)] bg-[var(--help-panel)] p-6 shadow-[var(--shadow-panel)] backdrop-blur sm:p-7">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="space-y-2">
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-[var(--help-muted)]">
                  Categorias em destaque
                </p>
                <h3 className="text-2xl font-semibold tracking-[-0.05em] text-[var(--help-ink-strong)]">
                  Navegue por assunto
                </h3>
              </div>
              <Link to={`/help/${context.primaryRoute.knowledge_space_slug}/articles`}>
                <GhostButton>Ver base completa</GhostButton>
              </Link>
            </div>
            {rootCategories.length === 0 ? (
              <div className="mt-5">
                <EmptyState
                  title="Categorias indisponíveis"
                  description="Os grupos públicos desta central ainda não estão visíveis neste ambiente."
                />
              </div>
            ) : (
              <div className="mt-5 grid gap-3 md:grid-cols-2">
                {rootCategories.map((category) => (
                  <Link
                    className="rounded-[24px] border border-[var(--help-border)] bg-white px-5 py-4 no-underline transition hover:border-[var(--help-accent)]/30 hover:bg-[color:var(--help-surface)]"
                    key={category.category_id}
                    to={`/help/${context.primaryRoute.knowledge_space_slug}/articles?category=${category.category_id}`}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-lg font-semibold tracking-[-0.03em] text-[var(--help-ink-strong)]">
                          {category.category_name}
                        </p>
                        <p className="mt-2 text-sm leading-7 text-[var(--help-muted)]">
                          {category.category_description ??
                            'Conteúdo público aprovado para esta frente operacional.'}
                        </p>
                      </div>
                      <StatusPill tone={toneForCategoryCount(category.subtree_article_count)}>
                        {category.subtree_article_count}
                      </StatusPill>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          <aside className="space-y-4">
            <section className="rounded-[32px] border border-[var(--help-border)] bg-white/88 p-5 shadow-[0_18px_42px_rgba(20,31,71,0.05)]">
              <div className="space-y-3">
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-[var(--help-muted)]">
                  Artigo em destaque
                </p>
                {featuredArticle ? (
                  <Link
                    className="block rounded-[22px] border border-[var(--help-border)] bg-[var(--help-surface)] px-4 py-4 no-underline transition hover:border-[rgba(48,127,226,0.18)] hover:bg-white"
                    to={`/help/${context.primaryRoute.knowledge_space_slug}/articles/${featuredArticle.slug}`}
                  >
                    <p className="text-lg font-semibold tracking-[-0.03em] text-[var(--help-ink-strong)]">
                      {featuredArticle.title}
                    </p>
                    <p className="mt-2 text-sm leading-7 text-[var(--help-muted)]">
                      {featuredArticle.summary ?? 'Artigo publicado para consulta rápida.'}
                    </p>
                  </Link>
                ) : (
                  <InlineNotice>
                    Indisponível
                  </InlineNotice>
                )}
              </div>
            </section>

            <section className="rounded-[32px] border border-[var(--help-border)] bg-white/88 p-5 shadow-[0_18px_42px_rgba(20,31,71,0.05)]">
              <div className="space-y-3">
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-[var(--help-muted)]">
                  Publicados recentemente
                </p>
                {recentArticles.length > 0 ? (
                  <div className="grid gap-2">
                    {recentArticles.map((article) => (
                      <Link
                        className="rounded-[20px] border border-[var(--help-border)] bg-[var(--help-surface)] px-4 py-3 no-underline transition hover:border-[rgba(48,127,226,0.18)] hover:bg-white"
                        key={article.id}
                        to={`/help/${context.primaryRoute.knowledge_space_slug}/articles/${article.slug}`}
                      >
                        <p className="text-sm font-semibold text-[var(--help-ink-strong)]">
                          {article.title}
                        </p>
                        <p className="mt-1 text-xs leading-5 text-[var(--help-muted)]">
                          Atualizado em {formatDateTime(article.updated_at)}
                        </p>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <InlineNotice>
                    Indisponível
                  </InlineNotice>
                )}
              </div>
            </section>
          </aside>
        </section>
      </main>

      <aside className="space-y-4">
        <section className="rounded-[32px] border border-[var(--help-border)] bg-white/88 p-5 shadow-[0_18px_42px_rgba(20,31,71,0.05)]">
          <div className="space-y-3">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-[var(--help-muted)]">
              Publicação
            </p>
            <p className="text-sm leading-7 text-[var(--help-ink)]">
              Esta área mostra apenas conteúdos liberados para leitura pública.
            </p>
            <div className="grid gap-2">
              <div className="rounded-[18px] border border-[var(--help-border)] bg-[var(--help-surface)] px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--help-muted)]">
                  Revisão
                </p>
                <p className="mt-1 text-sm text-[var(--help-ink)]">
                  Conteúdo validado antes da publicação.
                </p>
              </div>
              <div className="rounded-[18px] border border-[var(--help-border)] bg-[var(--help-surface)] px-4 py-3">
                <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--help-muted)]">
                  Escopo
                </p>
                <p className="mt-1 text-sm text-[var(--help-ink)]">
                  Guias de uso, configuração e integração disponíveis nesta central.
                </p>
              </div>
            </div>
          </div>
        </section>
      </aside>
    </div>
  );
}
