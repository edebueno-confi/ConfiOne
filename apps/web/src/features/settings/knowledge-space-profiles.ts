import { useEffect, useState } from 'react';
import { listAdminKnowledgeSpaces } from '../admin/admin-api';

/**
 * Perfil publicado de uma central de ajuda, na forma que as telas de
 * Configuracoes consomem.
 *
 * A leitura reaproveita `listAdminKnowledgeSpaces`, que ja existia em
 * `features/admin/admin-api.ts`; nada novo foi criado no backend. O vinculo com
 * a marca e o slug da central (`brands.helpCenterSlug`).
 *
 * O enriquecimento e OPCIONAL: a origem tem regra de acesso propria e pode
 * negar a leitura. Nesse caso o estado fica `unavailable` e as telas continuam
 * exibindo "Indisponivel" em vez de quebrar ou inventar valor.
 */
export interface KnowledgeSpaceProfile {
  slug: string;
  displayName: string;
  brandName: string | null;
  logoUrl: string | null;
  defaultLocale: string | null;
  primaryDomain: string | null;
  articleCount: number | null;
  publishedArticleCount: number | null;
  categoryCount: number | null;
}

export type KnowledgeSpaceProfilesState =
  | { status: 'loading' }
  | { status: 'unavailable' }
  | { status: 'ready'; bySlug: Map<string, KnowledgeSpaceProfile> };

/** Endereco publico da central: host mais o prefixo de caminho, quando houver. */
function formatPrimaryDomain(host: string | null, pathPrefix: string | null) {
  if (!host) return null;
  const suffix = pathPrefix && pathPrefix !== '/' ? pathPrefix : '';
  return `${host}${suffix}`;
}

function toCount(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? value : null;
}

/**
 * Le os perfis das centrais uma vez por montagem da tela e indexa por slug.
 * Falha de leitura nunca propaga: vira `unavailable`.
 */
export function useKnowledgeSpaceProfiles(): KnowledgeSpaceProfilesState {
  const [state, setState] = useState<KnowledgeSpaceProfilesState>({ status: 'loading' });

  useEffect(() => {
    let active = true;
    void (async () => {
      try {
        const rows = await listAdminKnowledgeSpaces();
        if (!active) return;
        const bySlug = new Map<string, KnowledgeSpaceProfile>();
        for (const row of rows) {
          bySlug.set(row.slug, {
            slug: row.slug,
            displayName: row.display_name,
            brandName: row.brand_name ?? null,
            logoUrl: row.logo_asset_url ?? null,
            defaultLocale: row.default_locale ?? null,
            primaryDomain: formatPrimaryDomain(row.primary_domain_host, row.primary_domain_path_prefix),
            articleCount: toCount(row.article_count),
            publishedArticleCount: toCount(row.published_article_count),
            categoryCount: toCount(row.category_count),
          });
        }
        setState({ status: 'ready', bySlug });
      } catch {
        if (active) setState({ status: 'unavailable' });
      }
    })();
    return () => {
      active = false;
    };
  }, []);

  return state;
}

/** Perfil de uma central pelo slug, quando o enriquecimento resolveu. */
export function profileForSlug(state: KnowledgeSpaceProfilesState, slug: string | null) {
  if (state.status !== 'ready' || !slug) return null;
  return state.bySlug.get(slug) ?? null;
}
