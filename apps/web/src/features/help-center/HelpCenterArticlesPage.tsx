import { FormEvent, useMemo, useState } from 'react';
import { Link, useOutletContext, useSearchParams } from 'react-router-dom';
import { EmptyState } from '../../components/states';
import type { PublicKnowledgeNavigationRow } from '../../contracts/public-contracts';
import type { HelpCenterSpaceContext } from './context';
import {
  HelpIcon,
  PublicBreadcrumb,
  formatRelativePublicDate,
} from './public-ui';

function buildCategoryMap(navigation: PublicKnowledgeNavigationRow[]) {
  return new Map(
    navigation.map((entry) => [entry.category_id, entry.category_name] as const),
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
  const searchQuery = searchParams.get('q')?.trim().toLowerCase() ?? '';
  const [searchInput, setSearchInput] = useState(searchParams.get('q')?.trim() ?? '');

  const filteredArticles = useMemo(() => {
    return context.articles.filter((article) => {
      const matchesCategory = selectedCategoryTreeIds
        ? Boolean(article.category_id && selectedCategoryTreeIds.has(article.category_id))
        : true;
      const haystack = [
        article.title,
        article.summary ?? '',
        article.category_name ?? '',
      ]
        .join(' ')
        .toLowerCase();
      const matchesQuery = searchQuery ? haystack.includes(searchQuery) : true;
      return matchesCategory && matchesQuery;
    });
  }, [context.articles, searchQuery, selectedCategoryTreeIds]);

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextQuery = searchInput.trim();
    const nextParams = new URLSearchParams(searchParams);

    if (!nextQuery) {
      nextParams.delete('q');
    } else {
      nextParams.set('q', nextQuery);
    }

    setSearchParams(nextParams, { replace: true });
  }

  function handleCategorySelect(value: string) {
    const nextParams = new URLSearchParams(searchParams);
    if (!value) {
      nextParams.delete('category');
    } else {
      nextParams.set('category', value);
    }
    setSearchParams(nextParams, { replace: true });
  }

  return (
    <section className="rounded-[28px] border border-[rgba(20,31,71,0.08)] bg-[color:var(--color-surface-strong)] px-4 py-5 shadow-[0_18px_40px_rgba(20,31,71,0.05)] sm:px-6 lg:px-8">
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
            <form className="relative" onSubmit={handleSearchSubmit}>
              <HelpIcon
                className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-[var(--help-muted)]"
                kind="search"
              />
              <input
                autoComplete="off"
                className="h-11 w-full rounded-[14px] border border-[var(--help-border)] bg-[color:var(--color-surface-strong)] pl-10 pr-4 text-sm text-[var(--help-ink-strong)] outline-none placeholder:text-[var(--help-muted)] focus:border-[var(--help-accent)] focus:ring-2 focus:ring-[rgba(48,127,226,0.18)]"
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Buscar artigos nesta lista..."
                type="search"
                value={searchInput}
              />
            </form>

            <label className="relative">
              <select
                className="h-11 w-full appearance-none rounded-[14px] border border-[var(--help-border)] bg-[color:var(--color-surface-strong)] px-4 pr-10 text-sm text-[var(--help-ink)] outline-none focus:border-[var(--help-accent)] focus:ring-2 focus:ring-[rgba(48,127,226,0.18)]"
                onChange={(event) => handleCategorySelect(event.target.value)}
                value={selectedCategoryId}
              >
                <option value="">Todas as categorias</option>
                {rootCategories.map((category) => (
                  <option key={category.category_id} value={category.category_id}>
                    {category.category_name}
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

        <div className="grid gap-5 lg:grid-cols-[220px_minmax(0,1fr)]">
          <aside className="rounded-[22px] border border-[rgba(20,31,71,0.08)] bg-[#fbfcff] px-4 py-4">
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
                    {category.category_name}
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

          <div className="min-w-0 overflow-hidden rounded-[22px] border border-[rgba(20,31,71,0.08)]">
            <div className="hidden grid-cols-[minmax(0,1fr)_220px_180px] gap-4 bg-[#fbfcff] px-5 py-3 text-xs font-semibold uppercase tracking-[0.16em] text-[var(--help-muted)] md:grid">
              <span>Artigo</span>
              <span>Categoria</span>
              <span>Atualizado em</span>
            </div>
            {filteredArticles.length === 0 ? (
              <div className="bg-[color:var(--color-surface-strong)] px-6 py-10">
                <EmptyState
                  title="Nenhum artigo publicado"
                  description={
                    selectedCategory || searchQuery
                      ? 'Nao encontramos artigos publicos para este filtro. Revise os termos usados ou volte para a lista completa.'
                      : 'Esta central ainda nao possui artigos publicos publicados para a lista geral.'
                  }
                />
              </div>
            ) : (
              <div className="divide-y divide-[rgba(20,31,71,0.08)] bg-[color:var(--color-surface-strong)]">
                {filteredArticles.map((article) => (
                  <Link
                    key={article.id}
                    className="grid gap-2 px-5 py-4 no-underline transition hover:bg-[#fbfcff] md:grid-cols-[minmax(0,1fr)_220px_180px] md:items-center md:gap-4"
                    to={`/help/${context.primaryRoute.knowledge_space_slug}/articles/${article.slug}`}
                  >
                    <div className="min-w-0 text-sm font-medium text-[var(--help-ink)]">
                      {article.title}
                    </div>
                    <div className="text-sm">
                      {article.category_id ? (
                        <span className="inline-flex rounded-full bg-[var(--help-accent-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--help-link)]">
                          {categoryMap.get(article.category_id) ?? article.category_name ?? 'Categoria pública'}
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
          </div>
        </div>
      </div>
    </section>
  );
}
