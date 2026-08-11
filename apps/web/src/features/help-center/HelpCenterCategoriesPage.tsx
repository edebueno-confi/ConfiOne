import { Link, useOutletContext } from 'react-router';
import type { HelpCenterSpaceContext } from './context';
import { buildHelpCenterCategoryHref } from './help-center-navigation';
import {
  HelpIcon,
  PublicBreadcrumb,
  PublicIconBadge,
} from './public-ui';
import {
  getCategoryVisuals,
  getPublicCategoryLabel,
} from './public-presentation';

function formatArticleCount(count: number) {
  return `${count} ${count === 1 ? 'artigo publicado' : 'artigos publicados'}`;
}
export function HelpCenterCategoriesPage() {
  const context = useOutletContext<HelpCenterSpaceContext>();
  const categories = context.navigation.filter(
    (entry) => entry.parent_category_id === null,
  );

  return (
    <section className="space-y-6" aria-labelledby="help-categories-title">
      <div className="rounded-[28px] border border-[var(--help-border)] bg-[var(--help-surface-strong)] px-6 py-6 shadow-[var(--help-shadow)] sm:px-8">
        <PublicBreadcrumb
          items={[
            { label: 'Central de Ajuda', to: `/help/${context.primaryRoute.knowledge_space_slug}` },
            { label: 'Categorias' },
          ]}
        />
        <div className="mt-5 max-w-3xl">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--help-link)]">
            Navegação por tema
          </p>
          <h1
            className="mt-2 text-[clamp(2rem,4vw,3rem)] font-semibold tracking-[-0.06em] text-[var(--help-ink-strong)]"
            id="help-categories-title"
          >
            Encontre a orientação certa para sua operação
          </h1>
          <p className="mt-3 text-sm leading-7 text-[var(--help-muted)]">
            Explore as categorias publicadas da central e abra somente os artigos
            disponíveis para leitura.
          </p>
        </div>
      </div>

      {categories.length > 0 ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {categories.map((category) => {
            const visuals = getCategoryVisuals(category.category_name);
            const count = category.subtree_article_count ?? category.article_count ?? 0;

            return (
              <Link
                className="group flex min-h-[190px] flex-col justify-between rounded-[24px] border border-[var(--help-border)] bg-[var(--help-surface-strong)] p-5 no-underline shadow-[var(--help-shadow)] transition hover:-translate-y-0.5 hover:border-[var(--help-link)]"
                key={category.category_id}
                to={buildHelpCenterCategoryHref(
                  context.primaryRoute.knowledge_space_slug,
                  category.category_id,
                  category.category_slug,
                )}
              >
                <div>
                  <div className="flex items-start justify-between gap-4">
                    <PublicIconBadge icon={visuals.icon} tone={visuals.tone} />
                    <span className="rounded-full bg-[var(--help-accent-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--help-link)]">
                      {formatArticleCount(count)}
                    </span>
                  </div>
                  <h2 className="mt-5 text-lg font-semibold text-[var(--help-ink-strong)] group-hover:text-[var(--help-link)]">
                    {getPublicCategoryLabel(category.category_name)}
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-[var(--help-muted)]">
                    {category.category_description?.trim() || 'Orientações publicadas para esta frente da operação.'}
                  </p>
                </div>
                <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-[var(--help-link)]">
                  Ver artigos
                  <HelpIcon className="transition group-hover:translate-x-0.5" kind="chevron-right" />
                </span>
              </Link>
            );
          })}
        </div>
      ) : (
        <div className="rounded-[24px] border border-dashed border-[var(--help-border)] bg-[var(--help-surface-strong)] px-6 py-10 text-center">
          <h2 className="text-base font-semibold text-[var(--help-ink-strong)]">
            Nenhuma categoria publicada ainda
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-[var(--help-muted)]">
            As categorias aparecem aqui assim que tiverem artigos públicos disponíveis.
          </p>
        </div>
      )}
    </section>
  );
}
