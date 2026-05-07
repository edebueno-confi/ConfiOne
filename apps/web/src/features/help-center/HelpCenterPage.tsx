import { useEffect, useEffectEvent, useMemo, useRef, useState } from 'react';
import { Link, Navigate, Outlet, useLocation, useParams } from 'react-router-dom';
import {
  ContractUnavailableState,
  EmptyState,
  ErrorState,
  LoadingState,
} from '../../components/states';
import { AppButton, GhostButton, InlineNotice, StatusPill } from '../../components/ui';
import type {
  PublicKnowledgeArticleListRow,
  PublicKnowledgeSpaceResolverRow,
} from '../../contracts/public-contracts';
import { classifyAdminError } from '../admin/admin-errors';
import type { HelpCenterSpaceContext } from './context';
import {
  buildHelpCenterSeoTitle,
  buildHelpCenterTheme,
  resolvePublicLogoUrl,
  sanitizePublicSeoDefaults,
  sanitizePublicSupportContacts,
  useHelpCenterDocumentMeta,
} from './branding';
import {
  getPublicKnowledgeSpace,
  listPublicKnowledgeArticles,
  listPublicKnowledgeNavigation,
  listPublicKnowledgeSpaces,
} from './public-api';

type LoadPhase = 'loading' | 'ready' | 'empty' | 'contract-unavailable' | 'error';

interface HelpCenterSpaceSummary {
  knowledgeSpaceId: string;
  knowledgeSpaceSlug: string;
  displayName: string;
  brandName: string;
  defaultLocale: string;
  organizationDisplayName: string;
  canonicalPath: string;
  canonicalHost: string | null;
  routeCount: number;
  logoAssetUrl: string | null;
}

function toneForArticleCount(count: number) {
  if (count >= 8) {
    return 'positive' as const;
  }

  if (count >= 3) {
    return 'accent' as const;
  }

  return 'default' as const;
}

function buildSpaceSummary(
  rows: PublicKnowledgeSpaceResolverRow[],
): HelpCenterSpaceSummary {
  const primaryRoute =
    rows.find((row) => row.route_kind === 'space_slug') ??
    rows.find((row) => row.is_canonical) ??
    rows[0];

  const domainRoute =
    rows.find((row) => row.route_kind === 'domain' && row.is_canonical) ??
    rows.find((row) => row.route_kind === 'domain') ??
    null;

  return {
    knowledgeSpaceId: primaryRoute.knowledge_space_id,
    knowledgeSpaceSlug: primaryRoute.knowledge_space_slug,
    displayName: primaryRoute.knowledge_space_display_name,
    brandName: primaryRoute.brand_name,
    defaultLocale: primaryRoute.default_locale,
    organizationDisplayName: primaryRoute.organization_display_name,
    canonicalPath:
      primaryRoute.route_kind === 'space_slug'
        ? primaryRoute.route_path_prefix
        : `/help/${primaryRoute.knowledge_space_slug}`,
    canonicalHost: domainRoute?.route_host ?? null,
    routeCount: rows.length,
    logoAssetUrl: resolvePublicLogoUrl(primaryRoute.logo_asset_url),
  };
}

function groupSpaceSummaries(rows: PublicKnowledgeSpaceResolverRow[]) {
  const bySpace = new Map<string, PublicKnowledgeSpaceResolverRow[]>();

  for (const row of rows) {
    const current = bySpace.get(row.knowledge_space_slug) ?? [];
    current.push(row);
    bySpace.set(row.knowledge_space_slug, current);
  }

  return Array.from(bySpace.values())
    .map(buildSpaceSummary)
    .sort((left, right) => left.displayName.localeCompare(right.displayName, 'pt-BR'));
}

export function HelpCenterPage() {
  const didLoadRef = useRef(false);
  const [phase, setPhase] = useState<LoadPhase>('loading');
  const [message, setMessage] = useState<string | null>(null);
  const [spaces, setSpaces] = useState<HelpCenterSpaceSummary[]>([]);

  useHelpCenterDocumentMeta({
    title: 'Genius Support OS | Central de Ajuda B2B',
    description:
      'Guias públicos de uso, configuração e integração para clientes B2B da plataforma Genius Support OS.',
  });

  const loadSpaces = useEffectEvent(async () => {
    try {
      const rows = await listPublicKnowledgeSpaces();
      const nextSpaces = groupSpaceSummaries(rows);
      setSpaces(nextSpaces);
      setPhase(nextSpaces.length === 0 ? 'empty' : 'ready');
      setMessage(null);
    } catch (error) {
      const classified = classifyAdminError(
        error,
        'Não foi possível carregar a Central de Ajuda.',
      );
      setMessage(classified.message);
      setPhase(
        classified.kind === 'contract-unavailable'
          ? 'contract-unavailable'
          : 'error',
      );
    }
  });

  useEffect(() => {
    if (didLoadRef.current) {
      return;
    }

    didLoadRef.current = true;
    void loadSpaces();
  }, []);

  if (phase === 'loading') {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-5xl items-center px-6 py-12">
        <LoadingState
          title="Carregando a Central de Ajuda"
          description="Estamos preparando as centrais públicas disponíveis."
        />
      </div>
    );
  }

  if (phase === 'contract-unavailable') {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-5xl items-center px-6 py-12">
        <ContractUnavailableState contractName="central pública de ajuda" />
      </div>
    );
  }

  if (phase === 'error') {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-5xl items-center px-6 py-12">
        <ErrorState
          title="Falha ao carregar a Central de Ajuda"
          description={
            message ??
            'Não foi possível carregar as centrais públicas disponíveis neste ambiente.'
          }
          action={<GhostButton onClick={() => void loadSpaces()}>Tentar novamente</GhostButton>}
        />
      </div>
    );
  }

  if (phase === 'empty') {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-5xl items-center px-6 py-12">
        <EmptyState
          title="Nenhuma central disponível"
          description="Ainda não existe uma central publicada para leitura neste ambiente."
          action={<GhostButton onClick={() => void loadSpaces()}>Tentar novamente</GhostButton>}
        />
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto grid max-w-6xl gap-6">
        <section className="relative overflow-hidden rounded-[36px] border border-[rgba(20,31,71,0.12)] bg-[linear-gradient(135deg,rgba(20,31,71,0.98),rgba(48,127,226,0.95)_54%,rgba(116,210,231,0.9))] px-6 py-8 text-white shadow-[0_28px_80px_rgba(20,31,71,0.16)] sm:px-8 sm:py-10">
          <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.18),transparent_28%),radial-gradient(circle_at_bottom_left,rgba(225,0,152,0.18),transparent_24%)]" />
          <div className="relative grid gap-8 lg:grid-cols-[minmax(0,1.8fr)_minmax(260px,0.8fr)]">
            <div className="space-y-5">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.3em] text-white/72">
                Central de Ajuda B2B
              </p>
              <div className="space-y-3">
                <h1 className="max-w-3xl text-4xl font-semibold tracking-[-0.06em] text-white sm:text-5xl">
                  Orientações públicas para operar a plataforma com mais autonomia.
                </h1>
                <p className="max-w-2xl text-sm leading-7 text-white/80 sm:text-base">
                  Guias publicados de uso, configuração e integração para clientes B2B e operadores da plataforma.
                </p>
              </div>
              <div className="flex flex-wrap gap-3">
                {spaces.slice(0, 3).map((space) => (
                  <Link
                    key={space.knowledgeSpaceSlug}
                    className="inline-flex items-center rounded-full border border-white/20 bg-white/10 px-4 py-2 text-sm font-medium text-white transition hover:bg-white/16"
                    to={`/help/${space.knowledgeSpaceSlug}`}
                  >
                    Abrir {space.brandName}
                  </Link>
                ))}
              </div>
              <div className="flex flex-wrap gap-3 text-xs text-white/76">
                <span className="rounded-full border border-white/18 bg-white/10 px-3 py-1.5">
                  leitura simples e navegação direta
                </span>
                <span className="rounded-full border border-white/18 bg-white/10 px-3 py-1.5">
                  foco em operação B2B
                </span>
              </div>
            </div>
            <div className="grid gap-4 rounded-[30px] border border-white/18 bg-[linear-gradient(180deg,rgba(12,19,42,0.42),rgba(19,31,67,0.68))] p-5 shadow-[0_16px_34px_rgba(8,13,32,0.18)]">
              <div>
                <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-white/78">
                  Disponível agora
                </p>
                <p className="mt-2 text-3xl font-semibold tracking-[-0.05em] text-white">
                  {spaces.length}
                </p>
                <p className="mt-2 text-sm leading-6 text-white/88">
                  central{spaces.length > 1 ? 'is' : ''} pronta{spaces.length > 1 ? 's' : ''} para leitura neste ambiente.
                </p>
              </div>
              <div className="grid gap-3">
                {spaces.map((space) => (
                  <div
                    key={space.knowledgeSpaceSlug}
                    className="rounded-[24px] border border-white/14 bg-[rgba(255,255,255,0.14)] px-4 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold text-white">{space.brandName}</p>
                        <p className="text-xs text-white/82">{space.organizationDisplayName}</p>
                      </div>
                      {space.logoAssetUrl ? (
                        <img
                          alt={`Logo ${space.brandName}`}
                          className="h-10 w-10 rounded-2xl border border-white/12 bg-white/88 object-contain p-1.5"
                          src={space.logoAssetUrl}
                        />
                      ) : null}
                      <StatusPill tone="positive">ativo</StatusPill>
                    </div>
                    <p className="mt-3 text-xs leading-5 text-white/84">
                      Acesso principal: {space.canonicalPath}
                      {space.canonicalHost ? ` ou ${space.canonicalHost}` : ''}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="rounded-[30px] border border-[rgba(20,31,71,0.12)] bg-white/88 p-5 shadow-[var(--shadow-panel)] sm:p-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="space-y-2">
              <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-[color:var(--color-muted)]">
              Centrais públicas
              </p>
              <h2 className="text-2xl font-semibold tracking-[-0.05em] text-[color:var(--color-ink)] sm:text-3xl">
                Escolha a central certa para a sua operação.
              </h2>
              <p className="max-w-3xl text-sm leading-7 text-[color:var(--color-muted)]">
                Cada central reúne artigos publicados para uma marca ou operação.
              </p>
            </div>
          </div>
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {spaces.map((space) => (
            <article
              key={space.knowledgeSpaceSlug}
              className="rounded-[28px] border border-[rgba(20,31,71,0.12)] bg-[color:var(--color-surface)] p-6 shadow-[0_18px_44px_rgba(20,31,71,0.06)]"
            >
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-[color:var(--color-muted)]">
                    Central
                  </p>
                  {space.logoAssetUrl ? (
                    <img
                      alt={`Logo ${space.brandName}`}
                      className="mt-4 h-14 w-14 rounded-[20px] border border-[rgba(20,31,71,0.08)] bg-[color:var(--color-surface)] object-contain p-2"
                      src={space.logoAssetUrl}
                    />
                  ) : null}
                  <h2 className="mt-3 text-2xl font-semibold tracking-[-0.05em] text-[color:var(--color-ink)]">
                    {space.brandName}
                  </h2>
                </div>
                <StatusPill tone={toneForArticleCount(space.routeCount)}>
                  {space.defaultLocale}
                </StatusPill>
              </div>
              <p className="mt-4 text-sm leading-7 text-[color:var(--color-muted)]">
                {space.displayName} publica guias de uso, configuração e integração para a operação B2B da plataforma.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link to={`/help/${space.knowledgeSpaceSlug}`}>
                  <AppButton>Abrir central</AppButton>
                </Link>
                <Link to={`/help/${space.knowledgeSpaceSlug}/articles`}>
                  <GhostButton>Ver artigos</GhostButton>
                </Link>
              </div>
            </article>
          ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function PublicHelpCenterHeader({
  brandName,
  logoAssetUrl,
  spaceSlug,
  spaceDescription,
  articleCount,
  categoryCount,
}: {
  brandName: string;
  logoAssetUrl: string | null;
  spaceSlug: string;
  spaceDescription: string;
  articleCount: number;
  categoryCount: number;
}) {
  const brandMonogram = (brandName || 'GS').slice(0, 2).toUpperCase();

  return (
    <header className="border-b border-[var(--help-border)] bg-white/92 shadow-[0_14px_30px_rgba(20,31,71,0.04)] backdrop-blur">
      <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-5 px-5 py-4 sm:px-6 lg:px-8">
        <div className="flex min-w-0 items-center gap-3">
          <Link
            className="flex items-center gap-3 no-underline"
            to={`/help/${spaceSlug}`}
          >
            {logoAssetUrl ? (
              <img
                alt={`Logo ${brandName}`}
                className="h-12 w-12 rounded-[16px] border border-[var(--help-border)] bg-white object-contain p-2 shadow-[0_10px_24px_rgba(20,31,71,0.08)]"
                src={logoAssetUrl}
              />
            ) : (
              <div className="flex h-12 w-12 items-center justify-center rounded-[16px] bg-[linear-gradient(135deg,var(--color-brand-navy),var(--color-brand-blue)_66%,var(--color-brand-magenta))] text-base font-semibold text-white shadow-[0_12px_26px_rgba(20,31,71,0.22)]">
                {brandMonogram}
              </div>
            )}
            <div className="min-w-0 leading-tight">
              <p className="truncate text-[1.1rem] font-semibold tracking-[-0.03em] text-[var(--help-ink-strong)]">
                {brandName}
              </p>
              <p className="truncate text-[0.92rem] text-[var(--help-muted)]">
                Central de ajuda pública
              </p>
            </div>
          </Link>
          <StatusPill tone="positive">Publicado</StatusPill>
        </div>

        <nav className="flex flex-wrap items-center gap-2">
          <Link
            className="rounded-full px-3.5 py-2 text-sm font-medium text-[var(--help-ink)] no-underline transition hover:bg-[var(--help-surface)] hover:text-[var(--help-link)]"
            to={`/help/${spaceSlug}`}
          >
            Visão geral
          </Link>
          <Link
            className="rounded-full px-3.5 py-2 text-sm font-medium text-[var(--help-ink)] no-underline transition hover:bg-[var(--help-surface)] hover:text-[var(--help-link)]"
            to={`/help/${spaceSlug}/articles`}
          >
            Artigos
          </Link>
          <Link
            className="rounded-full px-3.5 py-2 text-sm font-medium text-[var(--help-ink)] no-underline transition hover:bg-[var(--help-surface)] hover:text-[var(--help-link)]"
            to="/help"
          >
            Outras centrais
          </Link>
        </nav>
      </div>

      <div className="mx-auto max-w-[1600px] px-5 pb-5 sm:px-6 lg:px-8">
        <div className="grid gap-4 rounded-[28px] border border-[var(--help-border)] bg-[linear-gradient(135deg,rgba(255,255,255,0.94),rgba(244,249,255,0.98))] px-5 py-5 shadow-[0_18px_42px_rgba(20,31,71,0.05)] lg:grid-cols-[minmax(0,1.3fr)_auto] lg:items-center">
          <div className="space-y-2">
            <p className="text-[0.72rem] font-semibold uppercase tracking-[0.24em] text-[var(--help-muted)]">
              Central pública
            </p>
            <h1 className="text-[clamp(2rem,3vw,2.8rem)] font-semibold tracking-[-0.06em] text-[var(--help-ink-strong)]">
              {brandName}
            </h1>
            <p className="max-w-4xl text-sm leading-7 text-[var(--help-muted)]">
              {spaceDescription}
            </p>
          </div>
          <div className="flex flex-wrap gap-2.5">
            <StatusPill tone="positive">
              {articleCount} artigo{articleCount === 1 ? '' : 's'} publicado{articleCount === 1 ? '' : 's'}
            </StatusPill>
            <StatusPill tone="accent">
              {categoryCount} categoria{categoryCount === 1 ? '' : 's'}
            </StatusPill>
          </div>
        </div>
      </div>
    </header>
  );
}

export function HelpCenterSpaceLayout() {
  const location = useLocation();
  const { spaceSlug } = useParams<{ spaceSlug: string }>();
  const [phase, setPhase] = useState<LoadPhase>('loading');
  const [message, setMessage] = useState<string | null>(null);
  const [context, setContext] = useState<HelpCenterSpaceContext | null>(null);

  const loadSpace = useEffectEvent(async (targetSpaceSlug: string) => {
    try {
      const [routes, navigation, articles] = await Promise.all([
        getPublicKnowledgeSpace(targetSpaceSlug),
        listPublicKnowledgeNavigation(targetSpaceSlug),
        listPublicKnowledgeArticles(targetSpaceSlug),
      ]);

      if (routes.length === 0) {
        setContext(null);
        setPhase('empty');
        setMessage(null);
        return;
      }

      const primaryRoute =
        routes.find((row) => row.route_kind === 'space_slug') ??
        routes.find((row) => row.is_canonical) ??
        routes[0];

      setContext({
        routes,
        primaryRoute,
        navigation,
        articles,
      });
      setMessage(null);
      setPhase('ready');
    } catch (error) {
      const classified = classifyAdminError(
        error,
          'Não foi possível carregar a central solicitada.',
      );
      setContext(null);
      setMessage(classified.message);
      setPhase(
        classified.kind === 'contract-unavailable'
          ? 'contract-unavailable'
          : 'error',
      );
    }
  });

  useEffect(() => {
    if (!spaceSlug) {
      return;
    }

    setPhase('loading');
    void loadSpace(spaceSlug);
  }, [spaceSlug]);

  const space = context?.primaryRoute ?? null;
  const theme = useMemo(
    () =>
      space
        ? buildHelpCenterTheme({
            brandName: space.brand_name,
            knowledgeSpaceSlug: space.knowledge_space_slug,
            themeTokens: space.theme_tokens,
          })
        : null,
    [space],
  );
  const seoDefaults = useMemo(
    () => (space ? sanitizePublicSeoDefaults(space.seo_defaults) : null),
    [space],
  );
  const supportContacts = useMemo(
    () => (space ? sanitizePublicSupportContacts(space.support_contacts) : null),
    [space],
  );
  const logoAssetUrl = useMemo(
    () => (space ? resolvePublicLogoUrl(space.logo_asset_url) : null),
    [space],
  );
  const isArticleDetailRoute = /\/articles\/[^/]+\/?$/.test(location.pathname);
  const helpCenterTitle = space
    ? buildHelpCenterSeoTitle(space)
    : 'Help Center B2B | Genius Support OS';
  const helpCenterDescription = space
    ? seoDefaults?.description ??
      `${space.brand_name} publica guias de uso, configuração e integração para clientes B2B.`
    : 'Guias públicos B2B da plataforma Genius Support OS.';

  useHelpCenterDocumentMeta({
    title: helpCenterTitle,
    description: helpCenterDescription,
  });

  if (!spaceSlug) {
    return <Navigate replace to="/help" />;
  }

  if (phase === 'loading') {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-5xl items-center px-6 py-12">
        <LoadingState
          title="Carregando a central"
          description="Estamos preparando esta central e a navegação publicada."
        />
      </div>
    );
  }

  if (phase === 'contract-unavailable') {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-5xl items-center px-6 py-12">
        <ContractUnavailableState contractName="central publica desta marca" />
      </div>
    );
  }

  if (phase === 'error') {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-5xl items-center px-6 py-12">
        <ErrorState
          title="Falha ao carregar a central pública"
          description={
            message ??
            'Não foi possível abrir a central solicitada neste ambiente.'
          }
          action={<GhostButton onClick={() => void loadSpace(spaceSlug)}>Tentar novamente</GhostButton>}
        />
      </div>
    );
  }

  if (phase === 'empty' || !context || !space) {
    return (
      <div className="mx-auto flex min-h-screen w-full max-w-5xl items-center px-6 py-12">
        <EmptyState
          title="Central pública não encontrada"
          description="A central solicitada não existe ou ainda não ficou disponível para leitura."
          action={
            <Link to="/help">
              <GhostButton>Voltar para a Central de Ajuda</GhostButton>
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div
      className="min-h-screen"
      style={{
        background:
          'radial-gradient(circle at top right, var(--help-orb-a), transparent 24%), radial-gradient(circle at bottom left, var(--help-orb-b), transparent 20%), linear-gradient(180deg, var(--help-surface) 0%, #f8fbff 48%, #f3f6fb 100%)',
        ...theme,
      }}
    >
      {isArticleDetailRoute ? (
        <main className="min-h-screen">
          <Outlet context={context} />
        </main>
      ) : (
        <>
          <PublicHelpCenterHeader
            articleCount={context.articles.length}
            brandName={space.brand_name}
            categoryCount={
              context.navigation.filter((entry) => entry.parent_category_id === null).length
            }
            logoAssetUrl={logoAssetUrl}
            spaceDescription={
              seoDefaults?.description ??
              `${space.knowledge_space_display_name} reúne orientações públicas aprovadas para clientes e equipes operacionais.`
            }
            spaceSlug={space.knowledge_space_slug}
          />
          <main className="mx-auto grid max-w-[1600px] content-start gap-6 px-4 py-6 sm:px-6 lg:px-8">
            <Outlet context={context} />
          </main>
        </>
      )}
    </div>
  );
}
