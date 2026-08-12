import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useOutletContext, useSearchParams } from 'react-router';
import { GhostButton } from '../../components/ui';
import type { PublicKnowledgeNavigationRow } from '../../contracts/public-contracts';
import { classifyAdminError } from '../admin/admin-errors';
import type { HelpCenterSpaceContext } from './context';
import { listPublicKnowledgeArticlePage } from './public-api';
import {
  HelpIcon,
  PublicBreadcrumb,
  PublicSearchStateCard,
} from './public-ui';
import {
  formatRelativePublicDate,
  getPublicCategoryLabel,
} from './public-presentation';

function buildCategoryMap(navigation: PublicKnowledgeNavigationRow[]) {
  return new Map(
    navigation.map((entry) => [entry.category_id, getPublicCategoryLabel(entry.category_name)] as const),
  );
}

function collectCategoryTreeIds(
  navigation: PublicKnowledgeNavigationRow[],
  rootCategoryId: string,
) {
  const selectedIds = new Set([rootCategoryId]);
  let changed = true;

  while (changed) {
    changed = false;

    for (const category of navigation) {
      if (
        category.parent_category_id &&
        selectedIds.has(category.parent_category_id) &&
        !selectedIds.has(category.category_id)
      ) {
        selectedIds.add(category.category_id);
        changed = true;
      }
    }
  }

  return selectedIds;
}

export function HelpCenterArticlesPage() {
  const context = useOutletContext<HelpCenterSpaceContext>();
  const [searchParams, setSearchParams] = useSearchParams();
  const rootCategories = context.navigation.filter(
    (entry) => entry.parent_category_id === null,
  );
  const categoryMap = buildCategoryMap(context.navigation);
  const selectedCategoryId = searchParams.get('category')?.trim() ?? '';
  const selectedCategory =
    rootCategories.find((category) => category.category_id === selectedCategoryId) ?? null;
  const selectedCategoryTreeIds = useMemo(
    () =>
      selectedCategoryId
        ? collectCategoryTreeIds(context.navigation, selectedCategoryId)
        : null,
    [context.navigation, selectedCategoryId],
  );
  const searchQuery = searchParams.get('q')?.trim() ?? '';
  const [searchInput, setSearchInput] = useState(searchParams.get('q')?.trim() ?? '');
  const pageSize = 10;
  const requestedPage = Number.parseInt(searchParams.get('page') ?? '1', 10);
  const [pagePhase, setPagePhase] = useState<'loading' | 'ready' | 'empty' | 'error'>('loading');
  const [pageMessage, setPageMessage] = useState<string | null>(null);
  const [pageRows, setPageRows] = useState<HelpCenterSpaceContext['articles']>([]);
  const [totalArticles, setTotalArticles] = useState(0);
  const currentPage = Math.max(Number.isFinite(requestedPage) ? requestedPage : 1, 1);
  const pageCount = Math.max(1, Math.ceil(totalArticles / pageSize));
  const categoryIds = useMemo(
    () => (selectedCategoryTreeIds ? Array.from(selectedCategoryTreeIds) : []),
    [selectedCategoryTreeIds],
  );

  const loadPage = useCallback(async () => {
    setPagePhase('loading');
    try {
      const result = await listPublicKnowledgeArticlePage(
        context.primaryRoute.knowledge_space_slug,
        {
          categoryIds,
          page: currentPage,
          pageSize,
          query: searchQuery,
        },
      );

      const nextPageCount = Math.max(1, Math.ceil(result.total / result.pageSize));
      if (result.total > 0 && currentPage > nextPageCount) {
        const nextParams = new URLSearchParams(searchParams);
        nextParams.set('page', String(nextPageCount));
        setSearchParams(nextParams, { replace: true });
        return;
      }

      setPageRows(result.rows);
      setTotalArticles(result.total);
      setPageMessage(null);
      setPagePhase(result.rows.length > 0 ? 'ready' : 'empty');
    } catch (error) {
      const classified = classifyAdminError(
        error,
        'Não foi possível carregar os artigos públicos.',
      );
      setPageRows([]);
      setTotalArticles(0);
      setPageMessage(classified.message);
      setPagePhase('error');
    }
  }, [categoryIds, context.primaryRoute.knowledge_space_slug, currentPage, searchParams, searchQuery, setSearchParams]);

  useEffect(() => {
    void loadPage();
  }, [loadPage]);

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextQuery = searchInput.trim();
    const nextParams = new URLSearchParams(searchParams);

    if (!nextQuery) {
      nextParams.delete('q');
    } else {
      nextParams.set('q', nextQuery);
    }
    nextParams.delete('page');

    setSearchParams(nextParams, { replace: true });
  }

  function handleCategorySelect(value: string) {
    const nextParams = new URLSearchParams(searchParams);
    if (!value) {
      nextParams.delete('category');
    } else {
      nextParams.set('category', value);
    }
    nextParams.delete('page');
    setSearchParams(nextParams, { replace: true });
  }

  return (
    <section className="rounded-[28px] border border-[var(--help-border)] bg-[var(--help-surface-strong)] px-4 py-5 shadow-[var(--help-shadow)] sm:px-6 lg:px-8">
      <div className="space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <PublicBreadcrumb
              items={[
                { label: 'Central de Ajuda', to: `/help/${context.primaryRoute.knowledge_space_slug}` },
                { label: 'Artigos' },
              ]}
            />
            <div className="space-y-1">
              <h1 className="text-[clamp(2rem,4vw,2.9rem)] font-semibold tracking-[-0.06em] text-[var(--help-ink-strong)]">
                Todos os artigos
              </h1>
              <p className="text-sm leading-6 text-[var(--help-muted)]">
                Navegue por todos os conteúdos publicados.
              </p>
            </div>
          </div>

          <div className="grid w-full gap-3 md:w-auto md:grid-cols-[420px_220px]">
            <form aria-label="Buscar artigos" className="relative" onSubmit={handleSearchSubmit}>
              <HelpIcon
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--help-muted)]"
                kind="search"
              />
              <input
                aria-label="Buscar artigos nesta lista"
                autoComplete="off"
                className="h-11 w-full rounded-[14px] border border-[var(--help-border)] bg-[var(--help-surface-strong)] pl-10 pr-4 text-sm text-[var(--help-ink-strong)] outline-none placeholder:text-[var(--help-muted)] focus:border-[var(--help-accent)] focus:ring-2 focus:ring-[var(--help-focus)]"
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Buscar artigos nesta lista..."
                name="q"
                type="search"
                value={searchInput}
              />
            </form>

            <label className="relative">
              <span className="sr-only">Filtrar por categoria</span>
              <select
                aria-label="Filtrar por categoria"
                className="h-11 w-full appearance-none rounded-[14px] border border-[var(--help-border)] bg-[var(--help-surface-strong)] px-4 pr-10 text-sm text-[var(--help-ink)] outline-none focus:border-[var(--help-accent)] focus:ring-2 focus:ring-[var(--help-focus)]"
                onChange={(event) => handleCategorySelect(event.target.value)}
                value={selectedCategoryId}
              >
                <option value="">Todas as categorias</option>
                {rootCategories.map((category) => (
                  <option key={category.category_id} value={category.category_id}>
                    {getPublicCategoryLabel(category.category_name)}
                  </option>
                ))}
              </select>
              <HelpIcon
                className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[var(--help-muted)]"
                kind="chevron-down"
              />
            </label>
          </div>
        </div>

        <div className="grid items-start gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">
          <aside className="hidden rounded-[22px] border border-[var(--help-border)] bg-[var(--help-surface)] px-4 py-4 lg:block">
            <div className="space-y-3">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--help-muted)]">
                Categorias
              </p>
              <div className="grid gap-1.5">
                <button
                  className={`rounded-[14px] px-3 py-2 text-left text-sm font-medium ${
                    !selectedCategoryId
                      ? 'bg-[var(--help-accent-soft)] text-[var(--help-link)]'
                      : 'text-[var(--help-ink)] hover:bg-[color:var(--color-surface-strong)]'
                  }`}
                  onClick={() => handleCategorySelect('')}
                  type="button"
                >
                  Todas as categorias
                </button>
                {rootCategories.map((category) => (
                  <button
                    key={category.category_id}
                    className={`rounded-[14px] px-3 py-2 text-left text-sm font-medium ${
                      selectedCategoryId === category.category_id
                        ? 'bg-[var(--help-accent-soft)] text-[var(--help-link)]'
                        : 'text-[var(--help-ink)] hover:bg-[color:var(--color-surface-strong)]'
                    }`}
                    onClick={() => handleCategorySelect(category.category_id)}
                    type="button"
                  >
                    {getPublicCategoryLabel(category.category_name)}
                  </button>
                ))}
              </div>
              <Link
                className="inline-flex items-center gap-2 pt-2 text-sm font-semibold text-[var(--help-link)] no-underline"
                to={`/help/${context.primaryRoute.knowledge_space_slug}/articles`}
              >
                Ver todos os artigos
                <HelpIcon kind="chevron-right" />
              </Link>
            </div>
          </aside>

          <div className="min-w-0 self-start overflow-hidden rounded-[22px] border border-[var(--help-border)]">
            <div className="hidden grid-cols-[minmax(0,1fr)_220px_180px] gap-4 bg-[var(--help-surface)] px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--help-muted)] md:grid">
              <span>Artigo</span>
              <span>Categoria</span>
              <span>Atualizado em</span>
            </div>
            {pagePhase === 'loading' ? (
              <div className="bg-[var(--help-surface-strong)] px-4 py-5 sm:px-6" aria-busy="true">
                <PublicSearchStateCard
                  description="Estamos consultando os artigos publicados para este filtro."
                  showMascot={false}
                  title="Carregando artigos"
                  tone="loading"
                />
              </div>
            ) : pagePhase === 'error' ? (
              <div className="bg-[var(--help-surface-strong)] px-4 py-5 sm:px-6">
                <PublicSearchStateCard
                  action={<GhostButton onClick={() => void loadPage()}>Tentar novamente</GhostButton>}
                  description={pageMessage ?? 'Não foi possível carregar os artigos desta lista.'}
                  showMascot={false}
                  title="Falha ao carregar artigos"
                  tone="error"
                />
              </div>
            ) : pagePhase === 'empty' ? (
              <div className="bg-[var(--help-surface-strong)] px-4 py-5 sm:px-6">
                <PublicSearchStateCard
                  description={selectedCategory || searchQuery ? 'Não encontramos artigos públicos para este filtro. Revise os termos ou volte para a lista completa.' : 'Esta central ainda não possui artigos públicos publicados para a lista geral.'}
                  action={
                    <div className="flex flex-wrap items-center gap-2">
                      {searchQuery ? <GhostButton onClick={() => { const next = new URLSearchParams(searchParams); next.delete('q'); next.delete('page'); setSearchInput(''); setSearchParams(next, { replace: true }); }}>Limpar busca</GhostButton> : null}
                      <Link className="text-sm font-semibold text-[var(--help-link)] no-underline" to={`/help/${context.primaryRoute.knowledge_space_slug}/articles`}>Ver todos os artigos</Link>
                      {rootCategories.slice(0, 3).map((category) => <Link className="text-sm text-[var(--help-link)] no-underline" key={`empty-${category.category_id}`} to={`/help/${context.primaryRoute.knowledge_space_slug}/articles?category=${category.category_id}`}>{getPublicCategoryLabel(category.category_name)}</Link>)}
                    </div>
                  }
                  title="Nenhum artigo publicado"
                  mascotExpression="wink"
                  tone="empty"
                />
              </div>
            ) : (
              <div className="divide-y divide-[var(--help-border)] bg-[var(--help-surface-strong)]">
                {pageRows.map((article) => (
                  <Link
                    key={article.id}
                    className="grid gap-2 px-5 py-4 no-underline transition hover:bg-[var(--help-surface)] md:grid-cols-[minmax(0,1fr)_220px_180px] md:items-center md:gap-4"
                    to={`/help/${context.primaryRoute.knowledge_space_slug}/articles/${article.slug}`}
                  >
                    <div className="min-w-0 text-sm font-medium text-[var(--help-ink)]">
                      {article.title}
                    </div>
                    <div className="text-sm">
                      {article.category_id ? (
                        <span className="inline-flex rounded-full bg-[var(--help-accent-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--help-link)]">
                          {categoryMap.get(article.category_id) ?? getPublicCategoryLabel(article.category_name)}
                        </span>
                      ) : (
                        <span className="text-xs text-[var(--help-muted)]">Categoria pública</span>
                      )}
                    </div>
                    <div className="text-xs text-[var(--help-muted)]">
                      {formatRelativePublicDate(article.published_at ?? article.updated_at)}
                    </div>
                  </Link>
                ))}
              </div>
            )}
            {pagePhase === 'ready' ? (
              <nav aria-label="Paginação de artigos" className="flex flex-wrap items-center justify-between gap-3 border-t border-[var(--help-border)] bg-[var(--help-surface)] px-5 py-4">
                <p aria-live="polite" className="text-xs text-[var(--help-muted)]">Página {currentPage} de {pageCount} · {totalArticles} artigos</p>
                <div className="flex items-center gap-2">
                  <button className="rounded-[12px] border border-[var(--help-border)] px-3 py-2 text-sm font-semibold text-[var(--help-link)] disabled:cursor-not-allowed disabled:opacity-45" disabled={currentPage === 1} onClick={() => { const next = new URLSearchParams(searchParams); next.set('page', String(currentPage - 1)); setSearchParams(next, { replace: true }); }} type="button">Anterior</button>
                  <button className="rounded-[12px] border border-[var(--help-border)] px-3 py-2 text-sm font-semibold text-[var(--help-link)] disabled:cursor-not-allowed disabled:opacity-45" disabled={currentPage === pageCount} onClick={() => { const next = new URLSearchParams(searchParams); next.set('page', String(currentPage + 1)); setSearchParams(next, { replace: true }); }} type="button">Próxima</button>
                </div>
              </nav>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
