import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useOutletContext, useParams } from 'react-router';
import {
  ContractUnavailableState,
  EmptyState,
  ErrorState,
} from '../../components/states';
import { GhostButton } from '../../components/ui';
import { GeniusMascot } from '../../components/GeniusMascot';
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
  PublicSearchStateCard,
} from './public-ui';
import {
  formatRelativePublicDate,
  getPublicCategoryLabel,
} from './public-presentation';

type DetailPhase = 'loading' | 'ready' | 'empty' | 'contract-unavailable' | 'error';
type ArticleAssetPhase = 'not-required' | 'ready' | 'unavailable';

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

function hasKnowledgeAssetReferences(source: string) {
  return /(?:^|\n)\s*(?:#{1,6}\s+)?!\[[^\]]*]\(knowledge-asset:[^)]+\)/i.test(source);
}

function normalizeEditorialText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLocaleLowerCase('pt-BR')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

function isAllCapsLead(value: string) {
  return /^\p{Lu}[\p{Lu}\p{N}\s:?!-]{8,}$/u.test(value.trim());
}

function isLikelyDuplicateLead(line: string, title: string) {
  const lineWords = new Set(normalizeEditorialText(line).split(' ').filter((word) => word.length > 2));
  const titleWords = new Set(normalizeEditorialText(title).split(' ').filter((word) => word.length > 2));
  if (lineWords.size === 0 || titleWords.size === 0) {
    return false;
  }

  const overlap = [...lineWords].filter((word) => titleWords.has(word)).length;
  return normalizeEditorialText(line) === normalizeEditorialText(title) || overlap >= 2 && overlap / Math.min(lineWords.size, titleWords.size) >= 0.5;
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
  const combinedLead = /^(?<lead>[\s\S]+?)\s+(?<steps>Passo a passo\b.+)$/i.exec(firstLine);
  if (combinedLead && isAllCapsLead(combinedLead.groups?.lead ?? '') && isLikelyDuplicateLead(combinedLead.groups?.lead ?? '', title)) {
    lines[firstMeaningfulIndex] = combinedLead.groups?.steps ?? firstLine;
    return lines.join('\n');
  }

  if (isLikelyDuplicateLead(firstLine, title) && firstLine.length <= 140) {
    lines.splice(firstMeaningfulIndex, 1);
    if (lines[firstMeaningfulIndex]?.trim() === '') {
      lines.splice(firstMeaningfulIndex, 1);
    }
    return lines.join('\n');
  }

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

function isRawConfigurationSummary(summary: string | null, categoryName: string | null) {
  const normalizedCategory = categoryName?.toLocaleLowerCase('pt-BR') ?? '';
  if (!summary || !(normalizedCategory.startsWith('configura') || normalizedCategory.startsWith('sellers e loja'))) {
    return false;
  }

  return summary.length > 80 && /passo a passo|acesse (o painel|a área)|no menu/i.test(summary);
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
    <div className="grid gap-5 lg:grid-cols-[minmax(0,1fr)_220px] xl:grid-cols-[minmax(0,1fr)_232px]">
      <div className="rounded-[28px] border border-[var(--help-border)] bg-[var(--help-surface-strong)] px-6 py-6 shadow-[var(--help-shadow)]">
        <div className="mb-5 flex items-center gap-3 border-b border-[var(--help-border)] pb-4">
          <GeniusMascot alt="Gênio preparando o artigo" expression="happy" pose="magic" size="sm" surface="loading" />
          <div className="h-4 w-48 animate-pulse rounded-full bg-[var(--help-surface)]" />
        </div>
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
      <div className="hidden rounded-[22px] border border-[var(--help-border)] bg-[var(--help-surface-strong)] p-4 lg:block">
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
  const navigate = useNavigate();
  const [phase, setPhase] = useState<DetailPhase>('loading');
  const [message, setMessage] = useState<string | null>(null);
  const [article, setArticle] = useState<PublicKnowledgeArticleDetailRow | null>(null);
  const [articleAssets, setArticleAssets] = useState<PublicKnowledgeArticleAssetRow[]>([]);
  const [articleAssetPhase, setArticleAssetPhase] = useState<ArticleAssetPhase>('not-required');

  // Carregador usado tanto pelo Effect de rota quanto pelo botão de nova
  // tentativa. Não captura valor reativo: só parâmetros, setters e funções de
  // módulo. Por isso a lista de dependências é vazia e a referência é estável.
  const loadArticle = useCallback(
    async (targetSpaceSlug: string, targetArticleSlug: string) => {
      try {
        const data = await getPublicKnowledgeArticle(
          targetSpaceSlug,
          targetArticleSlug,
        );

        if (!data) {
          setArticle(null);
          setArticleAssets([]);
          setArticleAssetPhase('not-required');
          setMessage(null);
          setPhase('empty');
          return;
        }

        let assets: PublicKnowledgeArticleAssetRow[] = [];
        if (hasKnowledgeAssetReferences(data.body_md ?? '')) {
          setArticleAssetPhase('ready');
          try {
            assets = await listPublicKnowledgeArticleAssets(data.id);
            setArticleAssetPhase(assets.length > 0 ? 'ready' : 'unavailable');
          } catch {
            // The article remains readable, but the UI must make the incomplete
            // visual experience explicit instead of silently claiming success.
            assets = [];
            setArticleAssetPhase('unavailable');
          }
        } else {
          setArticleAssetPhase('not-required');
        }

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
        setArticleAssetPhase('not-required');
        setMessage(classified.message);
        setPhase(
          classified.kind === 'contract-unavailable'
            ? 'contract-unavailable'
            : 'error',
        );
      }
    },
    [],
  );

  useEffect(() => {
    if (!spaceSlug || !articleSlug) {
      return;
    }

    setPhase('loading');
    void loadArticle(spaceSlug, articleSlug);
  }, [articleSlug, loadArticle, spaceSlug]);

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
  const articleSummary = isRawConfigurationSummary(article?.summary ?? null, article?.category_name ?? null)
    ? null
    : article?.summary;
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
      <div className="rounded-[28px] border border-[var(--help-border)] bg-[var(--help-surface-strong)] px-6 py-8 shadow-[var(--help-shadow)]">
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
      <div className="rounded-[28px] border border-[var(--help-border)] bg-[var(--help-surface-strong)] px-6 py-8 shadow-[var(--help-shadow)]">
        <ContractUnavailableState contractName="leitura pública do artigo" />
      </div>
    );
  }

  if (phase === 'error') {
    return (
      <div className="rounded-[28px] border border-[var(--help-border)] bg-[var(--help-surface-strong)] px-6 py-8 shadow-[var(--help-shadow)]">
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
      <div className="rounded-[28px] border border-[var(--help-border)] bg-[var(--help-surface-strong)] px-6 py-8 shadow-[var(--help-shadow)]">
        <PublicSearchStateCard
          action={
            <div className="grid gap-3">
              <form className="flex flex-wrap gap-2" onSubmit={(event) => { event.preventDefault(); const query = new FormData(event.currentTarget).get('q')?.toString().trim(); navigate(`/help/${spaceSlug}/articles${query ? `?q=${encodeURIComponent(query)}` : ''}`); }}>
                <input aria-label="Buscar artigos" className="h-10 min-w-0 flex-1 rounded-[12px] border border-[var(--help-border)] px-3 text-sm" name="q" placeholder="Buscar na documentação" type="search" />
                <GhostButton type="submit">Buscar</GhostButton>
              </form>
              <div className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
                <Link className="font-semibold text-[var(--help-link)] no-underline" to={`/help/${spaceSlug}`}>Voltar para a visão geral</Link>
                <Link className="font-semibold text-[var(--help-link)] no-underline" to={`/help/${spaceSlug}/articles`}>Ver todos os artigos</Link>
                {context.navigation.filter((entry) => entry.parent_category_id === null).slice(0, 3).map((category) => <Link className="text-[var(--help-link)] no-underline" key={category.category_id} to={`/help/${spaceSlug}/articles?category=${category.category_id}`}>{getPublicCategoryLabel(category.category_name)}</Link>)}
              </div>
            </div>
          }
          description="O artigo solicitado não está disponível nesta Central Pública. Volte para a lista, busque outro termo ou explore as categorias."
          title="Artigo não encontrado"
          mascotExpression="happy"
          tone="empty"
        />
      </div>
    );
  }

  return (
    <div className={articleSections.length >= 3 ? 'grid gap-5 lg:grid-cols-[minmax(0,1fr)_220px] xl:grid-cols-[minmax(0,1fr)_232px]' : 'grid gap-5'}>
      <article className="mx-auto w-full max-w-[1080px] rounded-[28px] border border-[var(--help-border)] bg-[var(--help-surface-strong)] px-5 py-5 shadow-[var(--help-shadow)] sm:px-8 sm:py-6 lg:px-11 xl:px-12">
        <div className="space-y-5">
          <PublicBreadcrumb
            items={[
              { label: 'Central de Ajuda', to: `/help/${spaceSlug}` },
              ...(article.category_name
                ? [{ label: getPublicCategoryLabel(article.category_name), to: `/help/${spaceSlug}/articles?category=${article.category_id}` }]
                : []),
              { label: article.title },
            ]}
          />

          <div className="space-y-3">
            {article.category_name ? (
              <span className="inline-flex rounded-full bg-[var(--help-accent-soft)] px-2.5 py-1 text-xs font-semibold text-[var(--help-link)]">
                {getPublicCategoryLabel(article.category_name)}
              </span>
            ) : null}

            <h1 className="max-w-4xl text-[clamp(2rem,4vw,3.05rem)] font-semibold tracking-[-0.06em] text-[var(--help-ink-strong)]">
              {article.title}
            </h1>

            <div className="flex flex-wrap items-center gap-4 text-xs text-[var(--help-muted)] sm:text-sm">
              <span className="inline-flex items-center gap-1.5">
                <HelpIcon kind="calendar" />
                {formatRelativePublicDate(article.published_at)}
              </span>
              <span className="inline-flex items-center gap-1.5">
                <HelpIcon kind="clock" />
                {readingTime} min de leitura
              </span>
            </div>

            {articleSummary || !article?.summary ? <p className="max-w-3xl text-sm leading-7 text-[var(--help-muted)] sm:text-base">
              {articleSummary ??
                'Aprenda como executar esta configuração pública com mais clareza e segurança.'}
            </p> : null}

            {articleAssetPhase === 'unavailable' ? (
              <div
                className="flex items-start gap-2 rounded-[12px] bg-[var(--help-content-note)] px-3 py-2 text-sm leading-6 text-[var(--help-muted)]"
                role="status"
              >
                <HelpIcon className="mt-1 shrink-0 text-[var(--help-link)]" kind="alert" />
                <span>Algumas imagens estão indisponíveis no momento. O conteúdo deste artigo continua disponível em texto.</span>
              </div>
            ) : null}
          </div>

          {articleSections.length >= 3 ? <details className="rounded-[18px] border border-[var(--help-border)] bg-[var(--help-surface)] px-4 py-3 lg:hidden">
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
          </details> : null}

          <div className="min-w-0">
            <MarkdownDocument
              assets={assetMap}
              categoryName={article.category_name ?? undefined}
              relatedArticles={context.articles}
              source={articleBody}
            />
          </div>
          <section className="grid gap-4 border-t border-[var(--help-border)] pt-6 sm:grid-cols-[auto_minmax(0,1fr)] sm:items-center">
            <GeniusMascot alt="Gênio indicando o próximo passo" expression="happy" pose="present" size="lg" surface="default" />
            <div className="space-y-2">
              <p className="text-sm font-semibold text-[var(--help-ink-strong)]">Próximo passo</p>
              <p className="text-sm leading-6 text-[var(--help-muted)]">Se esta orientação não resolver sua dúvida, consulte um artigo relacionado ou entre no portal para falar com o suporte.</p>
              {relatedArticles.length > 0 ? <div className="flex flex-wrap gap-x-4 gap-y-2 pt-1">{relatedArticles.map((entry) => <Link key={entry.id} className="text-sm font-semibold text-[var(--help-link)] no-underline" to={`/help/${spaceSlug}/articles/${entry.slug}`}>{entry.title}</Link>)}</div> : null}
            </div>
          </section>
        </div>
      </article>

      {articleSections.length >= 3 ? <aside className="hidden lg:block lg:sticky lg:top-24 lg:h-fit">
        <section className="rounded-[22px] border border-[var(--help-border)] bg-[var(--help-surface-strong)] px-4 py-4 lg:block">
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

      </aside> : null}
    </div>
  );
}
