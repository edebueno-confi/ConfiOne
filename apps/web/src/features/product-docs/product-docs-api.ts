import { toAppError } from '../../app/errors';
import { requireSupabaseBrowserClient } from '../../app/supabase-browser';
import type {
  AdminInternalDocumentCatalogRow,
  AdminInternalDocumentDetailRow,
} from '../../contracts/admin-contracts';

const PRODUCT_DOCS_SURFACE = ['product-docs'];
const BUILD_JOURNAL_SURFACE = ['build-journal'];

export type InternalDocumentSurfaceFilter = 'product-docs' | 'build-journal';

function surfaceFilter(surface: InternalDocumentSurfaceFilter) {
  return surface === 'build-journal' ? BUILD_JOURNAL_SURFACE : PRODUCT_DOCS_SURFACE;
}

function requireClient() {
  return requireSupabaseBrowserClient();
}

export async function listInternalDocumentsCatalog(
  surface: InternalDocumentSurfaceFilter = 'product-docs',
) {
  const client = requireClient();
  const { data, error } = await client
    .from('vw_internal_documents_catalog')
    .select('*')
    .contains('surfaces', surfaceFilter(surface))
    .order('category', { ascending: true })
    .order('title', { ascending: true });

  if (error) {
    throw toAppError(error, 'Falha ao carregar o catálogo oficial de documentos.');
  }

  return (data ?? []) as AdminInternalDocumentCatalogRow[];
}

export async function getInternalDocumentDetailBySlug(
  slug: string,
  surface: InternalDocumentSurfaceFilter = 'product-docs',
) {
  const client = requireClient();
  const { data, error } = await client
    .from('vw_internal_document_detail')
    .select('*')
    .eq('slug', slug)
    .contains('surfaces', surfaceFilter(surface))
    .maybeSingle();

  if (error) {
    throw toAppError(error, 'Falha ao carregar o documento oficial solicitado.');
  }

  return (data ?? null) as AdminInternalDocumentDetailRow | null;
}

export function listProductDocsCatalog() {
  return listInternalDocumentsCatalog('product-docs');
}

export function getProductDocDetailBySlug(slug: string) {
  return getInternalDocumentDetailBySlug(slug, 'product-docs');
}
