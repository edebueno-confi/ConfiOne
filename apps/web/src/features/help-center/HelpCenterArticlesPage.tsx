import { FormEvent, useMemo, useState } from 'react';
import { Link, useOutletContext, useSearchParams } from 'react-router-dom';
import { EmptyState } from '../../components/states';
import { AppButton, GhostButton, InlineNotice, StatusPill } from '../../components/ui';
import { formatDateTime } from '../../app/format';
import type { PublicKnowledgeNavigationRow } from '../../contracts/public-contracts';
import type { HelpCenterSpaceContext } from './context';

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

function categoryJourneyLabel(name: string | null | undefined) {
  const normalized = (name ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase();

  if (normalized.includes('primeiro')) {
    return 'Entrada operacional';
  }

  if (normalized.includes('integr')) {
    return 'Integrações e validações';
  }

  if (normalized.includes('suporte')) {
    return 'Tratativa com suporte';
  }

  if (normalized.includes('reversa') || normalized.includes('operacao')) {
    return 'Fluxo diário da operação';
  }

  return 'Leitura por jornada';
}

function estimateListReadingTime(summary: string | null | undefined) {
  const words = (summary ?? '').trim().split(/\s+/).filter(Boolean).length;
  return `${Math.max(1, Math.ceil(Math.max(words, 24) / 18))} min`;
}

export function HelpCenterArticlesPage() {
  const context = useOutletContext<HelpCenterSpaceContext>();
  const [searchParams, setSearchParams] = useSearchParams();
  const categoryMap = buildCategoryMap(context.navigation);
  const featuredCategories = context.navigation.filter(
    (entry) => entry.parent_category_id === null,
  );
  const selectedCategoryId = searchParams.get('category')?.trim() ?? '';
  const selectedCategory = featuredCategories.find(
    (category) => category.category_id === selectedCategoryId,
  ) ?? null;
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
        article.category_id ?? '',
      ]
        .join(' ')
        .toLowerCase();
      const matchesQuery = searchQuery ? haystack.includes(searchQuery) : true;
      return matchesCategory && matchesQuery;
    });
  }, [context.articles, searchQuery, selectedCategoryTreeIds]);
  const highlightedArticles = filteredArticles.slice(0, 3);

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextQuery = searchInput.trim();
    const nextParams = new URLSearchParams(searchParams);

    if (!nextQuery) {
      nextParams.delete('q');
    } else {
      nextParams.set('q', nextQuery);
    }

    setSearchParams(nextParams, { replace: nextQuery === searchQuery });
  }

  function clearSearch() {
    setSearchInput('');
    const nextParams = new URLSearchParams(searchParams);
    nextParams.delete('q');
    setSearchParams(nextParams, { replace: true });
  }

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
                Explore apenas artigos públicos aprovados, organizados por jornada operacional para facilitar descoberta, leitura e compartilhamento seguro.
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

          <form
            className="mt-5 grid gap-3 rounded-[24px] border border-[var(--help-border)] bg-white px-4 py-4 shadow-[0_18px_42px_rgba(20,31,71,0.05)] sm:grid-cols-[minmax(0,1fr)_auto]"
            onSubmit={handleSearchSubmit}
          >
            <label className="grid gap-2" htmlFor="public-articles-search">
              <span className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-[var(--help-muted)]">
                Buscar nesta base
              </span>
              <input
                id="public-articles-search"
                autoComplete="off"
                className="h-11 rounded-[16px] border border-[var(--help-border)] bg-[var(--help-surface)] px-4 text-sm text-[var(--help-ink-strong)] outline-none transition placeholder:text-[var(--help-muted)] focus:border-[var(--help-accent)] focus:ring-2 focus:ring-[color:var(--help-accent-soft)]"
                onChange={(event) => setSearchInput(event.target.value)}
                placeholder="Ex.: integração, ticket, configuração"
                type="search"
                value={searchInput}
              />
            </label>
            <div className="flex flex-wrap items-end gap-3">
              <AppButton type="submit">Buscar</AppButton>
              {(searchInput || searchQuery) ? (
                <GhostButton onClick={clearSearch} type="button">
                  Limpar
                </GhostButton>
              ) : null}
            </div>
          </form>

          {filteredArticles.length === 0 ? (
            <div className="mt-6">
              <EmptyState
                title="Nenhum artigo publicado"
                description={
                  selectedCategory || searchQuery
                    ? 'Não encontramos artigos públicos para este filtro. Revise os termos da busca ou volte para a lista completa.'
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
                        <StatusPill>{categoryJourneyLabel(article.category_name)}</StatusPill>
                        <StatusPill tone="positive">Aprovado</StatusPill>
                      </div>
                      <h3 className="text-xl font-semibold tracking-[-0.04em] text-[var(--help-ink-strong)]">
                        {article.title}
                      </h3>
                      <p className="max-w-3xl text-sm leading-7 text-[var(--help-muted)]">
                        {article.summary ?? 'Artigo público sem resumo adicional.'}
                      </p>
                    </div>
                    <div className="text-left text-xs leading-5 text-[var(--help-muted)] sm:text-right">
                      <p>{estimateListReadingTime(article.summary)} de leitura</p>
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
              Use as categorias para abrir uma jornada operacional específica, aplique a busca quando souber o assunto e abra um artigo para acessar índice lateral e relacionados.
            </p>
          </div>
        </section>

        <section className="rounded-[28px] border border-[var(--help-border)] bg-white/88 p-5 shadow-[0_18px_42px_rgba(20,31,71,0.05)]">
          <div className="space-y-3">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-[var(--help-muted)]">
              Orientação de suporte
            </p>
            <p className="text-sm leading-7 text-[var(--help-ink)]">
              Quando a base pública não resolver o caso, use o canal operacional já acordado com a sua conta para falar com o time Genius.
            </p>
          </div>
        </section>

        <section className="rounded-[28px] border border-[var(--help-border)] bg-white/88 p-5 shadow-[0_18px_42px_rgba(20,31,71,0.05)]">
          <div className="space-y-3">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-[var(--help-muted)]">
              Destaques
            </p>
            <div className="grid gap-2">
              {highlightedArticles.map((article) => (
                <Link
                  className="rounded-[20px] border border-[var(--help-border)] bg-[var(--help-surface)] px-4 py-3 no-underline transition hover:border-[rgba(48,127,226,0.18)] hover:bg-white"
                  key={article.id}
                  to={`/help/${context.primaryRoute.knowledge_space_slug}/articles/${article.slug}`}
                >
                  <p className="text-sm font-semibold text-[var(--help-ink-strong)]">
                    {article.title}
                  </p>
                  <p className="mt-1 text-xs leading-5 text-[var(--help-muted)]">
                    {article.category_name ?? 'Categoria pública'} · {estimateListReadingTime(article.summary)} de leitura
                  </p>
                </Link>
              ))}
              {highlightedArticles.length === 0 ? <InlineNotice>Indisponível</InlineNotice> : null}
            </div>
          </div>
        </section>

        <section className="rounded-[28px] border border-[var(--help-border)] bg-white/88 p-5 shadow-[0_18px_42px_rgba(20,31,71,0.05)]">
          <div className="space-y-3">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.22em] text-[var(--help-muted)]">
              Jornada atual
            </p>
            <p className="text-sm leading-7 text-[var(--help-ink)]">
              {selectedCategory
                ? `${categoryJourneyLabel(selectedCategory.category_name)} · ${selectedCategory.category_description ?? 'Conteúdo público aprovado para esta frente.'}`
                : 'A lista completa reúne todas as jornadas públicas aprovadas desta central, sem misturar material interno ou rascunho.'}
            </p>
          </div>
        </section>
      </aside>
    </div>
  );
}
