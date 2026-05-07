import { useMemo } from 'react';
import { Link, useOutletContext, useSearchParams } from 'react-router-dom';
import { EmptyState } from '../../components/states';
import { StatusPill } from '../../components/ui';
import { formatDateTime } from '../../app/format';
import type { PublicKnowledgeNavigationRow } from '../../contracts/public-contracts';
import type { HelpCenterSpaceContext } from './context';

function buildCategoryMap(navigation: PublicKnowledgeNavigationRow[]) {
  return new Map(
    navigation.map((entry) => [entry.category_id, entry.category_name] as const),
  );
}

export function HelpCenterArticlesPage() {
  const context = useOutletContext<HelpCenterSpaceContext>();
  const [searchParams] = useSearchParams();
  const categoryMap = buildCategoryMap(context.navigation);
  const featuredCategories = context.navigation.filter(
    (entry) => entry.parent_category_id === null,
  );
  const selectedCategoryId = searchParams.get('category')?.trim() ?? '';
  const selectedCategory = featuredCategories.find(
    (category) => category.category_id === selectedCategoryId,
  ) ?? null;
  const searchQuery = searchParams.get('q')?.trim().toLowerCase() ?? '';

  const filteredArticles = useMemo(() => {
    return context.articles.filter((article) => {
      const matchesCategory = selectedCategoryId
        ? article.category_id === selectedCategoryId
        : true;
      const haystack = [
        article.title,
        article.summary ?? '',
        article.category_name ?? '',
        article.category_id ?? '',
      ]
        .join(' ')
        .toLowerCase();
      const matchesQuery = searchQuery ? haystack.includes(searchQuery) : true;
      return matchesCategory && matchesQuery;
    });
  }, [context.articles, searchQuery, selectedCategoryId]);

  return (
    <div className="grid gap-6 xl:grid-cols-[280px_minmax(0,1.45fr)_300px]">
      <aside className="space-y-4">
        <section className="rounded-[28px] border border-[var(--help-border)] bg-white/88 p-5 shadow-[0_18px_42px_rgba(20,31,71,0.05)]">
          <div className="space-y-3">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-[var(--help-muted)]">
              Navegação
            </p>
            <div className="grid gap-2">
              <Link
                className="rounded-[18px] border border-[var(--help-border)] bg-[var(--help-surface)] px-4 py-3 text-sm font-medium text-[var(--help-ink)] no-underline transition hover:border-[rgba(48,127,226,0.18)] hover:text-[var(--help-link)]"
                to={`/help/${context.primaryRoute.knowledge_space_slug}`}
              >
                Voltar para a visão geral
              </Link>
              <Link
                className="rounded-[18px] border border-[rgba(48,127,226,0.18)] bg-[var(--help-accent-soft)] px-4 py-3 text-sm font-medium text-[var(--help-link)] no-underline"
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
              <StatusPill tone="accent">{featuredCategories.length}</StatusPill>
            </div>
            <div className="grid gap-2">
              <Link
                className={`rounded-[20px] border px-4 py-3 text-sm font-medium no-underline transition ${
                  !selectedCategoryId
                    ? 'border-[rgba(48,127,226,0.18)] bg-[var(--help-accent-soft)] text-[var(--help-link)]'
                    : 'border-[var(--help-border)] bg-[var(--help-surface)] text-[var(--help-ink)] hover:border-[rgba(48,127,226,0.18)] hover:bg-white'
                }`}
                to={`/help/${context.primaryRoute.knowledge_space_slug}/articles`}
              >
                Todas as categorias
              </Link>
              {featuredCategories.map((category) => (
                <Link
                  className={`rounded-[20px] border px-4 py-3 no-underline transition ${
                    selectedCategoryId === category.category_id
                      ? 'border-[rgba(48,127,226,0.18)] bg-[var(--help-accent-soft)]'
                      : 'border-[var(--help-border)] bg-[var(--help-surface)] hover:border-[rgba(48,127,226,0.18)] hover:bg-white'
                  }`}
                  key={category.category_id}
                  to={`/help/${context.primaryRoute.knowledge_space_slug}/articles?category=${category.category_id}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-[var(--help-ink-strong)]">
                        {category.category_name}
                      </p>
                      <p className="mt-1 text-xs leading-5 text-[var(--help-muted)]">
                        {category.category_description ?? 'Conteúdo público desta frente.'}
                      </p>
                    </div>
                    <StatusPill tone="default">{category.subtree_article_count}</StatusPill>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </aside>

      <main className="grid content-start gap-6">
        <section className="rounded-[32px] border border-[var(--help-border)] bg-[var(--help-panel)] p-6 shadow-[var(--shadow-panel)] backdrop-blur sm:p-7">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="space-y-2">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-[var(--help-muted)]">
                Todos os artigos
              </p>
              <h2 className="text-3xl font-semibold tracking-[-0.05em] text-[var(--help-ink-strong)]">
                Base publicada de {context.primaryRoute.brand_name}
              </h2>
              <p className="max-w-3xl text-sm leading-7 text-[var(--help-muted)]">
                Explore apenas artigos públicos aprovados, organizados para leitura rápida e navegação simples.
              </p>
            </div>
            <div className="flex flex-wrap gap-2">
              {selectedCategory ? (
                <StatusPill tone="accent">{selectedCategory.category_name}</StatusPill>
              ) : null}
              <StatusPill tone="positive">
                {filteredArticles.length} resultado{filteredArticles.length === 1 ? '' : 's'}
              </StatusPill>
            </div>
          </div>

          {(selectedCategory || searchQuery) ? (
            <div className="mt-5 flex flex-wrap gap-2">
              {selectedCategory ? (
                <span className="rounded-full border border-[var(--help-border)] bg-white px-3 py-1.5 text-xs text-[var(--help-muted)]">
                  filtro: {selectedCategory.category_name}
                </span>
              ) : null}
              {searchQuery ? (
                <span className="rounded-full border border-[var(--help-border)] bg-white px-3 py-1.5 text-xs text-[var(--help-muted)]">
                  busca: {searchQuery}
                </span>
              ) : null}
            </div>
          ) : null}

          {filteredArticles.length === 0 ? (
            <div className="mt-6">
              <EmptyState
                title="Nenhum artigo publicado"
                description={
                  selectedCategory || searchQuery
                    ? 'Não encontramos artigos públicos para este filtro.'
                    : 'Esta central ainda não possui artigos públicos publicados para a lista geral.'
                }
              />
            </div>
          ) : (
            <div className="mt-6 grid gap-3">
              {filteredArticles.map((article) => (
                <Link
                  className="rounded-[26px] border border-[var(--help-border)] bg-white px-5 py-5 no-underline transition hover:border-[var(--help-accent)]/30 hover:bg-[color:var(--help-surface)]"
                  key={article.id}
                  to={`/help/${context.primaryRoute.knowledge_space_slug}/articles/${article.slug}`}
                >
                  <div className="flex flex-wrap items-start justify-between gap-4">
                    <div className="min-w-0 space-y-2">
                      <div className="flex flex-wrap gap-2">
                        {article.category_id ? (
                          <StatusPill tone="accent">
                            {categoryMap.get(article.category_id) ?? article.category_name ?? 'Categoria pública'}
                          </StatusPill>
                        ) : (
                          <StatusPill tone="default">Indisponível</StatusPill>
                        )}
                      </div>
                      <h3 className="text-xl font-semibold tracking-[-0.04em] text-[var(--help-ink-strong)]">
                        {article.title}
                      </h3>
                      <p className="max-w-3xl text-sm leading-7 text-[var(--help-muted)]">
                        {article.summary ?? 'Artigo público sem resumo adicional.'}
                      </p>
                    </div>
                    <div className="text-left text-xs leading-5 text-[var(--help-muted)] sm:text-right">
                      <p>Publicado</p>
                      <p className="mt-1 font-medium text-[var(--help-ink)]">
                        {article.published_at
                          ? formatDateTime(article.published_at)
                          : formatDateTime(article.updated_at)}
                      </p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </section>
      </main>

      <aside className="space-y-4">
        <section className="rounded-[28px] border border-[var(--help-border)] bg-white/88 p-5 shadow-[0_18px_42px_rgba(20,31,71,0.05)]">
          <div className="space-y-3">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-[var(--help-muted)]">
              Como navegar
            </p>
            <p className="text-sm leading-7 text-[var(--help-ink)]">
              Use as categorias para reduzir a lista ou abra um artigo para acessar o índice lateral e os relacionados.
            </p>
          </div>
        </section>

        <section className="rounded-[28px] border border-[var(--help-border)] bg-white/88 p-5 shadow-[0_18px_42px_rgba(20,31,71,0.05)]">
          <div className="space-y-3">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-[var(--help-muted)]">
              Destaques
            </p>
            <div className="grid gap-2">
              {context.articles.slice(0, 3).map((article) => (
                <Link
                  className="rounded-[20px] border border-[var(--help-border)] bg-[var(--help-surface)] px-4 py-3 no-underline transition hover:border-[rgba(48,127,226,0.18)] hover:bg-white"
                  key={article.id}
                  to={`/help/${context.primaryRoute.knowledge_space_slug}/articles/${article.slug}`}
                >
                  <p className="text-sm font-semibold text-[var(--help-ink-strong)]">
                    {article.title}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-[var(--help-muted)]">
                    {article.summary ?? 'Artigo público para leitura rápida.'}
                  </p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </aside>
    </div>
  );
}
