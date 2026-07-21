import { useEffect, useEffectEvent, useMemo, useRef, useState } from 'react';
import { Link, Navigate, Outlet, useLocation, useParams } from 'react-router-dom';
import {
  ContractUnavailableState,
  EmptyState,
  ErrorState,
  LoadingState,
} from '../../components/states';
import { AppButton, GhostButton } from '../../components/ui';
import type { PublicKnowledgeSpaceResolverRow } from '../../contracts/public-contracts';
import { classifyAdminError } from '../admin/admin-errors';
import type { HelpCenterSpaceContext } from './context';
import {
  buildHelpCenterSeoTitle,
  buildHelpCenterTheme,
  sanitizePublicSupportContacts,
  sanitizePublicSeoDefaults,
  useHelpCenterDocumentMeta,
} from './branding';
import {
  getPublicKnowledgeSpace,
  listPublicKnowledgeArticles,
  listPublicKnowledgeNavigation,
  listPublicKnowledgeSpaces,
} from './public-api';
import {
  PublicBreadcrumb,
  PublicHelpFooter,
  PublicHelpHeader,
} from './public-ui';

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
    title: 'GeniusOS | Central de Ajuda B2B',
    description:
      'Documentação oficial para clientes B2B, com centrais públicas de configuração, operação e resolução de dúvidas.',
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

  const primarySpace = spaces[0] ?? null;

  return (
    <div className="min-h-screen bg-[#f4f7fc]">
      <PublicHelpHeader
        active="directory"
        brandName={primarySpace?.brandName ?? 'Genius Returns'}
        showOtherCenters={spaces.length > 1}
        spaceSlug={primarySpace?.knowledgeSpaceSlug ?? 'genius'}
      />

      <main className="mx-auto grid max-w-[1520px] gap-6 px-4 py-6 sm:px-6 lg:px-8 xl:px-10">
        <section className="rounded-[28px] border border-[rgba(20,31,71,0.1)] bg-[color:var(--color-surface-strong)] px-6 py-6 shadow-[0_18px_40px_rgba(20,31,71,0.05)] sm:px-8">
          <div className="space-y-4">
            <PublicBreadcrumb items={[{ label: 'Central de Ajuda' }, { label: 'Outras centrais' }]} />
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div className="space-y-2">
                <h1 className="text-[clamp(2rem,4vw,2.9rem)] font-semibold tracking-[-0.06em] text-[var(--color-ink)]">
                  Centrais públicas disponíveis
                </h1>
                <p className="max-w-3xl text-sm leading-7 text-[var(--color-muted)]">
                  Escolha a central publicada para navegar por artigos, categorias e
                  documentação oficial.
                </p>
              </div>
              {primarySpace ? (
                <Link to={`/help/${primarySpace.knowledgeSpaceSlug}`}>
                  <AppButton>Abrir central principal</AppButton>
                </Link>
              ) : null}
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {spaces.map((space) => (
              <article
                key={space.knowledgeSpaceId}
                className="rounded-[24px] border border-[rgba(20,31,71,0.08)] bg-[#fbfcff] px-5 py-5"
              >
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-semibold text-[var(--color-ink)]">
                      {space.brandName}
                    </p>
                    <p className="text-sm leading-6 text-[var(--color-muted)]">
                      {space.displayName}
                    </p>
                  </div>
                  <div className="text-xs leading-5 text-[var(--color-muted)]">
                    <p>{space.organizationDisplayName}</p>
                    <p>{space.canonicalPath}</p>
                    {space.canonicalHost ? <p>{space.canonicalHost}</p> : null}
                  </div>
                </div>
                <div className="mt-5 flex flex-wrap gap-3">
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
      </main>
    </div>
  );
}

export function HelpCenterSpaceLayout() {
  const location = useLocation();
  const { spaceSlug } = useParams<{ spaceSlug: string }>();
  const [phase, setPhase] = useState<LoadPhase>('loading');
  const [message, setMessage] = useState<string | null>(null);
  const [context, setContext] = useState<HelpCenterSpaceContext | null>(null);
  const [availableSpaces, setAvailableSpaces] = useState<HelpCenterSpaceSummary[]>([]);

  const loadSpace = useEffectEvent(async (targetSpaceSlug: string) => {
    try {
      const [routes, navigation, articles, directory] = await Promise.all([
        getPublicKnowledgeSpace(targetSpaceSlug),
        listPublicKnowledgeNavigation(targetSpaceSlug),
        listPublicKnowledgeArticles(targetSpaceSlug),
        listPublicKnowledgeSpaces(),
      ]);

      setAvailableSpaces(groupSpaceSummaries(directory));

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
  const helpCenterTitle = space
    ? buildHelpCenterSeoTitle(space)
    : 'Central de Ajuda B2B | GeniusOS';
  const helpCenterDescription = space
    ? seoDefaults?.description ??
      `${space.brand_name} publica guias oficiais de configuração, operação e resolução de dúvidas para clientes B2B.`
    : 'Guias públicos B2B da plataforma GeniusOS.';
  const supportContacts = sanitizePublicSupportContacts(space?.support_contacts);
  const portalHref = supportContacts.websiteUrl ?? supportContacts.docsUrl ?? null;

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
        <ContractUnavailableState contractName="central pública desta marca" />
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

  const active =
    location.pathname === `/help/${spaceSlug}`
      ? 'overview'
      : location.pathname.startsWith(`/help/${spaceSlug}/articles`)
        ? 'articles'
        : 'directory';

  return (
    <div
      className="min-h-screen bg-[#f4f7fc]"
      style={{
        ...theme,
      }}
    >
      <PublicHelpHeader
        active={active}
        brandName={space.brand_name}
        showOtherCenters={availableSpaces.length > 1}
        spaceSlug={space.knowledge_space_slug}
        tertiaryHref={`/help/${space.knowledge_space_slug}#categorias`}
        tertiaryLabel="Categorias"
        portalHref={portalHref}
      />

      <main className="mx-auto max-w-[1520px] px-4 py-6 sm:px-6 lg:px-8 xl:px-10">
        <Outlet context={context} />
      </main>

      <PublicHelpFooter brandName={space.brand_name} supportContacts={supportContacts} />
    </div>
  );
}
