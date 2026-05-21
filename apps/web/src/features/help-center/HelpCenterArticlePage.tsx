import { useEffect, useEffectEvent, useMemo, useState } from 'react';
import { Link, useOutletContext, useParams } from 'react-router-dom';
import {
  ContractUnavailableState,
  EmptyState,
  ErrorState,
} from '../../components/states';
import { GhostButton } from '../../components/ui';
import type {
  PublicKnowledgeArticleAssetRow,
  PublicKnowledgeArticleDetailRow,
} from '../../contracts/public-contracts';
import { classifyAdminError } from '../admin/admin-errors';
import type { HelpCenterSpaceContext } from './context';
import { useHelpCenterDocumentMeta } from './branding';
import { MarkdownDocument } from './markdown';
import {
  getPublicKnowledgeArticle,
  listPublicKnowledgeArticleAssets,
} from './public-api';
import {
  HelpIcon,
  PublicBreadcrumb,
  formatRelativePublicDate,
} from './public-ui';

type DetailPhase = 'loading' | 'ready' | 'empty' | 'contract-unavailable' | 'error';

interface ArticleSectionItem {
  id: string;
  label: string;
}

function slugifyHeading(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

function estimateReadingTime(source: string) {
  const plainText = source
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/`[^`]+`/g, ' ')
    .replace(/!\[[^\]]*\]\([^)]+\)/g, ' ')
    .replace(/\[[^\]]+\]\(([^)]+)\)/g, ' ')
    .replace(/[#>*_-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  const wordCount = plainText ? plainText.split(' ').length : 0;
  return Math.max(1, Math.ceil(wordCount / 190));
}

function stripDuplicateLeadHeading(source: string, title: string) {
  const normalizedTitle = title.trim().toLowerCase();
  const lines = source.replace(/\r\n/g, '\n').split('\n');

  if (lines.length === 0) {
    return source;
  }

  const firstMeaningfulIndex = lines.findIndex((line) => line.trim().length > 0);
  if (firstMeaningfulIndex === -1) {
    return source;
  }

  const firstLine = lines[firstMeaningfulIndex].trim();
  const match = /^#\s+(.+)$/.exec(firstLine);
  if (!match) {
    return source;
  }

  if (match[1].trim().toLowerCase() !== normalizedTitle) {
    return source;
  }

  lines.splice(firstMeaningfulIndex, 1);
  if (lines[firstMeaningfulIndex]?.trim() === '') {
    lines.splice(firstMeaningfulIndex, 1);
  }

  return lines.join('\n');
}

function extractArticleSections(source: string, fallbackTitle: string) {
  const sections: ArticleSectionItem[] = [];
  const usedIds = new Map<string, number>();

  for (const rawLine of source.replace(/\r\n/g, '\n').split('\n')) {
    const trimmed = rawLine.trim();
    const match = /^(#{1,3})\s+(.+)$/.exec(trimmed);
    if (!match) {
      continue;
    }

    if (match[1].length === 1) {
      continue;
    }

    const label = match[2].trim();
    const baseId = slugifyHeading(label) || 'secao';
    const count = usedIds.get(baseId) ?? 0;
    usedIds.set(baseId, count + 1);
    const id = count === 0 ? baseId : `${baseId}-${count + 1}`;
    sections.push({ id, label });
  }

  if (sections.length === 0) {
    return [
      {
        id: slugifyHeading(fallbackTitle) || 'visao-geral',
        label: 'Visão geral',
      },
    ];
  }

  return sections.slice(0, 10);
}

function ArticlePageSkeleton() {
  return (
    <div className="grid gap-5 lg:grid-cols-[196px_minmax(0,1fr)_220px] xl:grid-cols-[210px_minmax(0,1fr)_232px]">
      <div className="hidden rounded-[22px] border border-[rgba(20,31,71,0.08)] bg-white p-4 lg:block">
        <div className="h-5 w-28 rounded-full bg-[var(--help-surface)]" />
        <div className="mt-4 grid gap-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <div key={`left-${index}`} className="h-10 rounded-[14px] bg-[var(--help-surface)]" />
          ))}
        </div>
      </div>
      <div className="rounded-[28px] border border-[rgba(20,31,71,0.08)] bg-white px-6 py-6 shadow-[0_18px_40px_rgba(20,31,71,0.05)]">
        <div className="h-5 w-48 rounded-full bg-[var(--help-surface)]" />
        <div className="mt-5 h-12 w-3/4 rounded-[16px] bg-[var(--help-surface)]" />
        <div className="mt-4 h-6 w-56 rounded-full bg-[var(--help-surface)]" />
        <div className="mt-6 h-24 rounded-[20px] bg-[var(--help-surface)]" />
        <div className="mt-6 grid gap-3">
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={`line-${index}`}
              className={index % 2 === 0 ? 'h-4 w-full rounded-full bg-[var(--help-surface)]' : 'h-4 w-[86%] rounded-full bg-[var(--help-surface)]'}
            />
          ))}
        </div>
      </div>
      <div className="hidden rounded-[22px] border border-[rgba(20,31,71,0.08)] bg-white p-4 lg:block">
        <div className="h-5 w-24 rounded-full bg-[var(--help-surface)]" />
        <div className="mt-4 grid gap-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={`right-${index}`} className="h-9 rounded-[14px] bg-[var(--help-surface)]" />
          ))}
        </div>
      </div>
    </div>
  );
}

export function HelpCenterArticlePage() {
  const { spaceSlug, articleSlug } = useParams<{
    spaceSlug: string;
    articleSlug: string;
  }>();
  const context = useOutletContext<HelpCenterSpaceContext>();
  const [phase, setPhase] = useState<DetailPhase>('loading');
  const [message, setMessage] = useState<string | null>(null);
  const [article, setArticle] = useState<PublicKnowledgeArticleDetailRow | null>(null);
  const [articleAssets, setArticleAssets] = useState<PublicKnowledgeArticleAssetRow[]>([]);

  const loadArticle = useEffectEvent(
    async (targetSpaceSlug: string, targetArticleSlug: string) => {
      try {
        const data = await getPublicKnowledgeArticle(
          targetSpaceSlug,
          targetArticleSlug,
        );

        if (!data) {
          setArticle(null);
          setArticleAssets([]);
          setMessage(null);
          setPhase('empty');
          return;
        }

        const assets = await listPublicKnowledgeArticleAssets(data.id);
        setArticle(data);
        setArticleAssets(assets);
        setMessage(null);
        setPhase('ready');
      } catch (error) {
        const classified = classifyAdminError(
          error,
          'Não foi possível carregar o artigo público solicitado.',
        );
        setArticle(null);
        setArticleAssets([]);
        setMessage(classified.message);
        setPhase(
          classified.kind === 'contract-unavailable'
            ? 'contract-unavailable'
            : 'error',
        );
      }
    },
  );

  useEffect(() => {
    if (!spaceSlug || !articleSlug) {
      return;
    }

    setPhase('loading');
    void loadArticle(spaceSlug, articleSlug);
  }, [articleSlug, spaceSlug]);

  const articleMetaTitle = article
    ? `${article.title} | ${context.primaryRoute.brand_name}`
    : `${context.primaryRoute.brand_name} | Artigo`;
  const articleMetaDescription =
    article?.summary ??
    `${context.primaryRoute.brand_name} reúne guias aprovados para consulta B2B.`;

  useHelpCenterDocumentMeta({
    title: articleMetaTitle,
    description: articleMetaDescription,
    type: 'article',
  });

  const sameCategoryArticles = useMemo(
    () =>
      context.articles.filter((entry) =>
        article?.category_id ? entry.category_id === article.category_id : false,
      ),
    [article?.category_id, context.articles],
  );
  const relatedArticles = useMemo(
    () =>
      sameCategoryArticles
        .filter((entry) => entry.id !== article?.id)
        .slice(0, 3),
    [article?.id, sameCategoryArticles],
  );
  const articleSections = useMemo(
    () =>
      extractArticleSections(
        stripDuplicateLeadHeading(article?.body_md ?? '', article?.title ?? ''),
        article?.title ?? 'Visão geral',
      ),
    [article?.body_md, article?.title],
  );
  const readingTime = useMemo(
    () => estimateReadingTime(stripDuplicateLeadHeading(article?.body_md ?? '', article?.title ?? '')),
    [article?.body_md, article?.title],
  );
  const articleBody = useMemo(
    () => stripDuplicateLeadHeading(article?.body_md ?? '', article?.title ?? ''),
    [article?.body_md, article?.title],
  );
  const assetMap = useMemo(
    () =>
      Object.fromEntries(
        articleAssets.map((asset) => [
          asset.id,
          {
            alt_text: asset.alt_text,
            caption: asset.caption,
            height: asset.height,
            signed_url: asset.signed_url,
            width: asset.width,
          },
        ]),
      ),
    [articleAssets],
  );

  if (!spaceSlug || !articleSlug) {
    return (
      <div className="rounded-[28px] border border-[rgba(20,31,71,0.08)] bg-white px-6 py-8 shadow-[0_18px_40px_rgba(20,31,71,0.05)]">
        <EmptyState
          title="Artigo não encontrado"
          description="A rota informada não tem os dados necessários para abrir este artigo."
        />
      </div>
    );
  }

  if (phase === 'loading') {
    return <ArticlePageSkeleton />;
  }

  if (phase === 'contract-unavailable') {
    return (
      <div className="rounded-[28px] border border-[rgba(20,31,71,0.08)] bg-white px-6 py-8 shadow-[0_18px_40px_rgba(20,31,71,0.05)]">
        <ContractUnavailableState contractName="leitura pública do artigo" />
      </div>
    );
  }

  if (phase === 'error') {
    return (
      <div className="rounded-[28px] border border-[rgba(20,31,71,0.08)] bg-white px-6 py-8 shadow-[0_18px_40px_rgba(20,31,71,0.05)]">
        <ErrorState
          title="Falha ao carregar o artigo"
          description={
            message ??
            'Não foi possível carregar este artigo agora. Tente novamente em instantes ou volte para a central de ajuda.'
          }
          action={
            <GhostButton onClick={() => void loadArticle(spaceSlug, articleSlug)}>
              Tentar novamente
            </GhostButton>
          }
        />
      </div>
    );
  }

  if (phase === 'empty' || !article) {
    return (
      <div className="rounded-[28px] border border-[rgba(20,31,71,0.08)] bg-white px-6 py-8 shadow-[0_18px_40px_rgba(20,31,71,0.05)]">
        <EmptyState
          title="Artigo não encontrado"
          description="O artigo solicitado não está disponível nesta central pública. Volte para a lista de artigos ou siga pela navegação principal."
          action={
            <Link to={`/help/${spaceSlug}/articles`}>
              <GhostButton>Voltar para a lista de artigos</GhostButton>
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="grid gap-5 lg:grid-cols-[196px_minmax(0,1fr)_220px] xl:grid-cols-[210px_minmax(0,1fr)_232px]">
      <aside className="order-2 rounded-[22px] border border-[rgba(20,31,71,0.08)] bg-white px-4 py-4 lg:order-1 lg:sticky lg:top-24 lg:h-fit">
        <div className="space-y-4">
          <p className="text-sm font-semibold text-[var(--help-ink-strong)]">Nesta categoria</p>
          <div className="grid gap-1.5">
            {sameCategoryArticles.length > 0 ? (
              sameCategoryArticles.map((entry) => (
                <Link
                  key={entry.id}
                  className={`rounded-[14px] px-3 py-2 text-sm no-underline transition ${
                    entry.id === article.id
                      ? 'bg-[var(--help-accent-soft)] font-semibold text-[var(--help-link)]'
                      : 'text-[var(--help-ink)] hover:bg-[#fbfcff]'
                  }`}
                  to={`/help/${spaceSlug}/articles/${entry.slug}`}
                >
                  {entry.title}
                </Link>
              ))
            ) : (
              <p className="text-sm leading-6 text-[var(--help-muted)]">
                Esta categoria ainda não tem outros artigos publicados.
              </p>
            )}
          </div>
          <Link className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--help-link)] no-underline" to={`/help/${spaceSlug}/articles`}>
            Ver todos os artigos
            <HelpIcon kind="chevron-right" />
          </Link>
        </div>
      </aside>

      <article className="order-1 rounded-[28px] border border-[rgba(20,31,71,0.08)] bg-white px-5 py-5 shadow-[0_18px_40px_rgba(20,31,71,0.05)] sm:px-8 sm:py-6 lg:order-2 lg:px-11 xl:px-12">
        <div className="space-y-5">
          <PublicBreadcrumb
            items={[
              { label: 'Central de Ajuda', to: `/help/${spaceSlug}` },
              ...(article.category_name
                ? [{ label: article.category_name, to: `/help/${spaceSlug}/articles?category=${article.category_id}` }]
                : []),
              { label: article.title },
            ]}
          />

          <div className="space-y-3">
            {article.category_name ? (
              <span className="inline-flex rounded-full bg-[var(--help-accent-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--help-link)]">
                {article.category_name}
              </span>
            ) : null}

            <h1 className="max-w-4xl text-[clamp(2rem,4vw,3.05rem)] font-semibold tracking-[-0.06em] text-[var(--help-ink-strong)]">
              {article.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs text-[var(--help-muted)] sm:text-sm">
              <span className="inline-flex items-center gap-1.5">
                <HelpIcon kind="calendar" />
                {formatRelativePublicDate(article.updated_at)}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <HelpIcon kind="clock" />
                {readingTime} min de leitura
              </span>
            </div>

            <p className="max-w-3xl text-sm leading-7 text-[var(--help-muted)] sm:text-base">
              {article.summary ??
                'Aprenda como executar esta configuração pública com mais clareza e segurança.'}
            </p>
          </div>

          <details className="rounded-[18px] border border-[rgba(20,31,71,0.08)] bg-[#fbfcff] px-4 py-3 lg:hidden">
            <summary className="cursor-pointer list-none text-sm font-semibold text-[var(--help-ink-strong)]">
              Neste artigo
            </summary>
            <div className="mt-3 grid gap-2">
              {articleSections.map((section) => (
                <a
                  key={section.id}
                  className="text-sm text-[var(--help-link)] no-underline"
                  href={`#${section.id}`}
                >
                  {section.label}
                </a>
              ))}
            </div>
          </details>

          <div className="min-w-0">
            <MarkdownDocument assets={assetMap} source={articleBody} />
          </div>
        </div>
      </article>

      <aside className="order-3 grid gap-4 lg:sticky lg:top-24 lg:h-fit">
        <section className="hidden rounded-[22px] border border-[rgba(20,31,71,0.08)] bg-white px-4 py-4 lg:block">
          <div className="space-y-4">
            <p className="text-sm font-semibold text-[var(--help-ink-strong)]">Neste artigo</p>
            <div className="grid gap-2">
              {articleSections.map((section) => (
                <a
                  key={section.id}
                  className="text-sm leading-6 text-[var(--help-muted)] no-underline hover:text-[var(--help-link)]"
                  href={`#${section.id}`}
                >
                  {section.label}
                </a>
              ))}
            </div>
          </div>
        </section>

        {relatedArticles.length > 0 ? (
          <section className="rounded-[22px] border border-[rgba(20,31,71,0.08)] bg-white px-4 py-4">
            <div className="space-y-4">
              <p className="text-sm font-semibold text-[var(--help-ink-strong)]">Artigos relacionados</p>
              <div className="grid gap-3">
                {relatedArticles.map((entry) => (
                  <Link
                    key={entry.id}
                    className="text-sm font-medium leading-6 text-[var(--help-link)] no-underline"
                    to={`/help/${spaceSlug}/articles/${entry.slug}`}
                  >
                    {entry.title}
                  </Link>
                ))}
              </div>
            </div>
          </section>
        ) : null}
      </aside>
    </div>
  );
}
