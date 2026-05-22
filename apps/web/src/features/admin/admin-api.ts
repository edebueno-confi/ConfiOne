import { toAppError } from '../../app/errors';
import { requireSupabaseBrowserClient } from '../../app/supabase-browser';
import type {
  AdminAuditFeedRow,
  AdminAccessMembershipRow,
  AdminAccessUserRow,
  AdminCustomerPortalAccessOverviewRow,
  AdminCustomerPortalArticleCandidateRow,
  AdminCustomerPortalTicketCandidateRow,
  AdminCustomerPortalTenantAccessRow,
  AdminCustomerPortalUserDetailRow,
  AdminCustomerPortalUserRow,
  AdminKnowledgeArticleDetailV2Row,
  AdminKnowledgeArticleEditorialDraftRow,
  AdminKnowledgeArticleAssetRow,
  AdminKnowledgeArticleListItemV2Row,
  AdminKnowledgeArticleReviewAdvisoryRow,
  AdminKnowledgeEntitlementDetailRow,
  AdminKnowledgeEntitlementRow,
  AdminKnowledgeCategoryRecordRow,
  AdminKnowledgeCategoryV2Row,
  AdminKnowledgeSpaceRow,
  AdminTenantContactRecordRow,
  AdminTenantContactViewRow,
  AdminTenantDetailRow,
  AdminTenantMembershipRecordRow,
  AdminTenantMembershipRow,
  AdminTenantRecordRow,
  AdminTenantsListItemRow,
  AdminSystemAuditEventRow,
  AdminSystemHealthCheckRow,
  AdminSystemOperationalSummaryRow,
  AdminTicketKnowledgeLinkRow,
  AdminUserLookupRow,
  CustomerPortalRole,
  KnowledgeAdvisoryClassification,
  KnowledgeArticleStatus,
  KnowledgeArticleReviewStatus,
  KnowledgeReviewHumanConfirmations,
  KnowledgeVisibility,
  RpcAdminAddTenantMemberPayload,
  RpcAdminAddTenantMemberResponse,
  RpcAdminArchiveKnowledgeArticleV2Response,
  RpcAdminArticleSpaceActionV2Payload,
  RpcAdminBeginKnowledgeArticleEditorialRevisionV2Response,
  RpcAdminCreateKnowledgeArticleDraftV2Payload,
  RpcAdminCreateKnowledgeArticleDraftV2Response,
  RpcAdminCreateKnowledgeCategoryV2Payload,
  RpcAdminCreateKnowledgeCategoryV2Response,
  RpcAdminCreateTenantContactPayload,
  RpcAdminCreateTenantContactResponse,
  RpcAdminCreateTenantPayload,
  RpcAdminCreateTenantResponse,
  RpcAdminArchiveKnowledgeArticleEntitlementPayload,
  RpcAdminArchiveKnowledgeArticleEntitlementResponse,
  RpcAdminDiscardKnowledgeArticleEditorialRevisionV2Response,
  RpcAdminGrantKnowledgeArticleEntitlementPayload,
  RpcAdminGrantKnowledgeArticleEntitlementResponse,
  RpcAdminLinkKnowledgeArticleToTicketPayload,
  RpcAdminLinkKnowledgeArticleToTicketResponse,
  RpcAdminMarkKnowledgeArticleReviewedPayload,
  RpcAdminMarkKnowledgeArticleReviewedResponse,
  RpcAdminPrepareKnowledgeArticlePublicationEvidencePayload,
  RpcAdminPrepareKnowledgeArticlePublicationEvidenceResponse,
  RpcAdminPublishKnowledgeArticleV2Response,
  RpcAdminPublishKnowledgeArticleEditorialRevisionV2Response,
  RpcAdminSubmitKnowledgeArticleForReviewV2Response,
  RpcAdminUnlinkKnowledgeArticleFromTicketPayload,
  RpcAdminUnlinkKnowledgeArticleFromTicketResponse,
  RpcAdminUpdateKnowledgeArticleReviewStatusPayload,
  RpcAdminUpdateKnowledgeArticleReviewStatusResponse,
  RpcAdminUpsertKnowledgeArticleAssetPayload,
  RpcAdminUpsertKnowledgeArticleAssetResponse,
  RpcAdminUpdateKnowledgeArticleAssetReviewPayload,
  RpcAdminUpdateKnowledgeArticleAssetReviewResponse,
  RpcAdminUpdateKnowledgeArticleDraftV2Payload,
  RpcAdminUpdateKnowledgeArticleDraftV2Response,
  RpcAdminUpdateKnowledgeArticleEditorialRevisionV2Payload,
  RpcAdminUpdateKnowledgeArticleEditorialRevisionV2Response,
  RpcAdminUpdateTenantContactPayload,
  RpcAdminUpdateTenantContactResponse,
  RpcAdminUpdateTenantMemberRolePayload,
  RpcAdminUpdateTenantMemberRoleResponse,
  RpcAdminUpdateTenantMemberStatusPayload,
  RpcAdminUpdateTenantMemberStatusResponse,
  RpcAdminUpdateTenantStatusPayload,
  RpcAdminUpdateTenantStatusResponse,
} from '../../contracts/admin-contracts';

function requireClient() {
  return requireSupabaseBrowserClient();
}

function escapeLookupTerm(value: string) {
  return value.replace(/[%_,]/g, ' ').trim();
}

const KNOWLEDGE_ASSET_BUCKET = 'knowledge-assets';
const KNOWLEDGE_ASSET_MAX_BYTES = 10 * 1024 * 1024;
const KNOWLEDGE_ASSET_ALLOWED_TYPES = new Set([
  'image/png',
  'image/jpeg',
  'image/webp',
  'image/gif',
]);

function normalizeStorageFilename(fileName: string) {
  const fallback = 'knowledge-asset';
  const sanitized = fileName
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9.]+/g, '-')
    .replace(/^-+|-+$/g, '');

  return sanitized || fallback;
}

async function digestFileSha256(file: File) {
  const buffer = await file.arrayBuffer();
  const digest = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

async function readImageDimensions(file: File) {
  if (!file.type.startsWith('image/')) {
    return { width: null, height: null };
  }

  const objectUrl = URL.createObjectURL(file);
  try {
    const image = new Image();
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error('Não foi possível ler as dimensões da imagem.'));
      image.src = objectUrl;
    });

    return {
      width: Number.isFinite(image.naturalWidth) ? image.naturalWidth : null,
      height: Number.isFinite(image.naturalHeight) ? image.naturalHeight : null,
    };
  } finally {
    URL.revokeObjectURL(objectUrl);
  }
}

export async function listAdminTenants() {
  const client = requireClient();
  const { data, error } = await client
    .from('vw_admin_tenants_list')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw toAppError(error, 'Falha ao carregar a lista de clientes.');
  }

  return (data ?? []) as AdminTenantsListItemRow[];
}

export async function getAdminTenantDetail(tenantId: string) {
  const client = requireClient();
  const { data, error } = await client
    .from('vw_admin_tenant_detail')
    .select('*')
    .eq('id', tenantId)
    .maybeSingle();

  if (error) {
    throw toAppError(error, 'Falha ao carregar o detalhe do cliente.');
  }

  if (!data) {
    return null;
  }

  return {
    ...(data as AdminTenantDetailRow),
    contacts: Array.isArray(data.contacts) ? (data.contacts as AdminTenantDetailRow['contacts']) : [],
  } satisfies AdminTenantDetailRow;
}

export async function listAdminMemberships() {
  const client = requireClient();
  const { data, error } = await client
    .from('vw_admin_tenant_memberships')
    .select('*')
    .order('tenant_display_name', { ascending: true });

  if (error) {
    throw toAppError(error, 'Falha ao carregar os vínculos administrativos.');
  }

  return (data ?? []) as AdminTenantMembershipRow[];
}

export async function listAdminAccessUsers() {
  const client = requireClient();
  const { data, error } = await client
    .from('vw_admin_access_users')
    .select('*')
    .order('last_access_updated_at', { ascending: false });

  if (error) {
    throw toAppError(error, 'Falha ao carregar o control plane de usuários.');
  }

  return (data ?? []) as AdminAccessUserRow[];
}

export async function listAdminAccessMemberships() {
  const client = requireClient();
  const { data, error } = await client
    .from('vw_admin_access_memberships')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) {
    throw toAppError(error, 'Falha ao carregar os vínculos de acesso.');
  }

  return (data ?? []) as AdminAccessMembershipRow[];
}

export async function lookupAdminUsers(rawQuery: string, limit = 8) {
  const client = requireClient();
  const query = escapeLookupTerm(rawQuery);

  if (!query) {
    return [] as AdminUserLookupRow[];
  }

  const { data, error } = await client
    .from('vw_admin_user_lookup')
    .select('*')
    .or(`email.ilike.%${query}%,full_name.ilike.%${query}%`)
    .order('created_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw toAppError(error, 'Falha ao buscar usuários para os vínculos.');
  }

  return (data ?? []) as AdminUserLookupRow[];
}

export async function listAdminAuditFeed(limit = 120) {
  const client = requireClient();
  const { data, error } = await client
    .from('vw_admin_audit_feed')
    .select('*')
    .limit(limit)
    .order('occurred_at', { ascending: false });

  if (error) {
    throw toAppError(error, 'Falha ao carregar o feed de auditoria.');
  }

  return (data ?? []) as AdminAuditFeedRow[];
}

export async function listAdminSystemAuditEvents(limit = 120) {
  const client = requireClient();
  const { data, error } = await client
    .from('vw_admin_system_audit_events')
    .select('*')
    .limit(limit)
    .order('occurred_at', { ascending: false });

  if (error) {
    throw toAppError(error, 'Falha ao carregar a auditoria administrativa sanitizada.');
  }

  return (data ?? []) as AdminSystemAuditEventRow[];
}

export async function listAdminSystemHealthChecks() {
  const client = requireClient();
  const { data, error } = await client
    .from('vw_admin_system_health_checks')
    .select('*')
    .order('area', { ascending: true });

  if (error) {
    throw toAppError(error, 'Falha ao carregar os checks operacionais.');
  }

  return (data ?? []) as AdminSystemHealthCheckRow[];
}

export async function getAdminSystemOperationalSummary() {
  const client = requireClient();
  const { data, error } = await client
    .from('vw_admin_system_operational_summary')
    .select('*')
    .maybeSingle();

  if (error) {
    throw toAppError(error, 'Falha ao carregar o resumo operacional do sistema.');
  }

  return data as AdminSystemOperationalSummaryRow | null;
}

export async function getAdminCustomerPortalAccessOverview() {
  const client = requireClient();
  const { data, error } = await client
    .from('vw_admin_customer_portal_access_overview')
    .select('*')
    .maybeSingle();

  if (error) {
    throw toAppError(error, 'Falha ao carregar o resumo do portal cliente.');
  }

  return data as AdminCustomerPortalAccessOverviewRow | null;
}

export async function listAdminCustomerPortalTenantAccess() {
  const client = requireClient();
  const { data, error } = await client
    .from('vw_admin_customer_portal_tenant_access')
    .select('*')
    .order('tenant_display_name', { ascending: true });

  if (error) {
    throw toAppError(error, 'Falha ao carregar o panorama por tenant do portal cliente.');
  }

  return (data ?? []) as AdminCustomerPortalTenantAccessRow[];
}

export async function listAdminCustomerPortalUsers() {
  const client = requireClient();
  const { data, error } = await client
    .from('vw_admin_customer_portal_users')
    .select('*')
    .order('tenant_display_name', { ascending: true })
    .order('user_full_name', { ascending: true, nullsFirst: false });

  if (error) {
    throw toAppError(error, 'Falha ao carregar os usuários customer-facing.');
  }

  return (data ?? []) as AdminCustomerPortalUserRow[];
}

export async function getAdminCustomerPortalUserDetail(membershipId: string) {
  const client = requireClient();
  const { data, error } = await client
    .from('vw_admin_customer_portal_user_detail')
    .select('*')
    .eq('membership_id', membershipId)
    .maybeSingle();

  if (error) {
    throw toAppError(error, 'Falha ao carregar o detalhe do usuário customer-facing.');
  }

  return data as AdminCustomerPortalUserDetailRow | null;
}

export async function listAdminKnowledgeEntitlements() {
  const client = requireClient();
  const { data, error } = await client
    .from('vw_admin_knowledge_entitlements')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw toAppError(error, 'Falha ao carregar os entitlements do portal cliente.');
  }

  return (data ?? []) as AdminKnowledgeEntitlementRow[];
}

export async function getAdminKnowledgeEntitlementDetail(entitlementId: string) {
  const client = requireClient();
  const { data, error } = await client
    .from('vw_admin_knowledge_entitlement_detail')
    .select('*')
    .eq('entitlement_id', entitlementId)
    .maybeSingle();

  if (error) {
    throw toAppError(error, 'Falha ao carregar o detalhe do entitlement.');
  }

  return data as AdminKnowledgeEntitlementDetailRow | null;
}

export async function listAdminTicketKnowledgeLinks() {
  const client = requireClient();
  const { data, error } = await client
    .from('vw_admin_ticket_knowledge_links')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw toAppError(error, 'Falha ao carregar os vínculos de artigo por ticket.');
  }

  return (data ?? []) as AdminTicketKnowledgeLinkRow[];
}

export async function listAdminCustomerPortalArticleCandidates() {
  const client = requireClient();
  const { data, error } = await client
    .from('vw_admin_customer_portal_article_candidates')
    .select('*')
    .order('published_at', { ascending: false, nullsFirst: false })
    .order('article_title', { ascending: true });

  if (error) {
    throw toAppError(error, 'Falha ao carregar artigos elegíveis para o portal cliente.');
  }

  return (data ?? []) as AdminCustomerPortalArticleCandidateRow[];
}

export async function listAdminCustomerPortalTicketCandidates() {
  const client = requireClient();
  const { data, error } = await client
    .from('vw_admin_customer_portal_ticket_candidates')
    .select('*')
    .order('updated_at', { ascending: false });

  if (error) {
    throw toAppError(error, 'Falha ao carregar tickets elegíveis para vínculo com Knowledge.');
  }

  return (data ?? []) as AdminCustomerPortalTicketCandidateRow[];
}

export async function listAdminKnowledgeSpaces() {
  const client = requireClient();
  const { data, error } = await client
    .from('vw_admin_knowledge_spaces')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw toAppError(error, 'Falha ao carregar as áreas de conhecimento administrativas.');
  }

  return (data ?? []) as AdminKnowledgeSpaceRow[];
}

export async function listAdminKnowledgeCategoriesV2(knowledgeSpaceId: string) {
  const client = requireClient();
  const { data, error } = await client
    .from('vw_admin_knowledge_categories_v2')
    .select('*')
    .eq('knowledge_space_id', knowledgeSpaceId)
    .order('name', { ascending: true });

  if (error) {
    throw toAppError(
      error,
      'Falha ao carregar as categorias administrativas da central de ajuda.',
    );
  }

  return (data ?? []) as AdminKnowledgeCategoryV2Row[];
}

export async function listAdminKnowledgeArticlesV2(options: {
  knowledgeSpaceId: string;
  status?: KnowledgeArticleStatus | 'all';
  visibility?: KnowledgeVisibility | 'all';
}) {
  const client = requireClient();
  let query = client
    .from('vw_admin_knowledge_articles_list_v2')
    .select('*')
    .eq('knowledge_space_id', options.knowledgeSpaceId)
    .order('updated_at', { ascending: false });

  if (options.status && options.status !== 'all') {
    query = query.eq('status', options.status);
  }

  if (options.visibility && options.visibility !== 'all') {
    query = query.eq('visibility', options.visibility);
  }

  const { data, error } = await query;

  if (error) {
    throw toAppError(
      error,
      'Falha ao carregar a lista administrativa de artigos da central de ajuda.',
    );
  }

  return (data ?? []) as AdminKnowledgeArticleListItemV2Row[];
}

export async function getAdminKnowledgeArticleDetailV2(articleId: string) {
  const client = requireClient();
  const { data, error } = await client
    .from('vw_admin_knowledge_article_detail_v2')
    .select('*')
    .eq('id', articleId)
    .maybeSingle();

  if (error) {
    throw toAppError(
      error,
      'Falha ao carregar o detalhe administrativo do artigo.',
    );
  }

  if (!data) {
    return null;
  }

  return {
    ...(data as AdminKnowledgeArticleDetailV2Row),
    revisions: Array.isArray(data.revisions)
      ? (data.revisions as AdminKnowledgeArticleDetailV2Row['revisions'])
      : [],
    sources: Array.isArray(data.sources)
      ? (data.sources as AdminKnowledgeArticleDetailV2Row['sources'])
      : [],
    editorial_draft:
      data.editorial_draft &&
      typeof data.editorial_draft === 'object' &&
      !Array.isArray(data.editorial_draft)
        ? (data.editorial_draft as AdminKnowledgeArticleDetailV2Row['editorial_draft'])
        : null,
  } satisfies AdminKnowledgeArticleDetailV2Row;
}

export async function listAdminKnowledgeArticleReviewAdvisories(
  knowledgeSpaceId: string,
) {
  const client = requireClient();
  const { data, error } = await client
    .from('vw_admin_knowledge_article_review_advisories')
    .select('*')
    .eq('knowledge_space_id', knowledgeSpaceId)
    .order('updated_at', { ascending: false });

  if (error) {
    throw toAppError(
      error,
      'Falha ao carregar os alertas editoriais da central de ajuda.',
    );
  }

  return (data ?? []) as AdminKnowledgeArticleReviewAdvisoryRow[];
}

export async function createTenant(payload: RpcAdminCreateTenantPayload) {
  const client = requireClient();
  const { data, error } = await client.rpc('rpc_admin_create_tenant', payload);

  if (error) {
    throw toAppError(error, 'Falha ao criar tenant.');
  }

  return data as RpcAdminCreateTenantResponse;
}

export async function updateTenantStatus(payload: RpcAdminUpdateTenantStatusPayload) {
  const client = requireClient();
  const { data, error } = await client.rpc('rpc_admin_update_tenant_status', payload);

  if (error) {
    throw toAppError(error, 'Falha ao atualizar o status do tenant.');
  }

  return data as RpcAdminUpdateTenantStatusResponse;
}

export async function addTenantMember(payload: RpcAdminAddTenantMemberPayload) {
  const client = requireClient();
  const { data, error } = await client.rpc('rpc_admin_add_tenant_member', payload);

  if (error) {
    throw toAppError(error, 'Falha ao adicionar membership.');
  }

  return data as RpcAdminAddTenantMemberResponse;
}

export async function updateTenantMemberRole(
  payload: RpcAdminUpdateTenantMemberRolePayload,
) {
  const client = requireClient();
  const { data, error } = await client.rpc(
    'rpc_admin_update_tenant_member_role',
    payload,
  );

  if (error) {
    throw toAppError(error, 'Falha ao atualizar a role do membership.');
  }

  return data as RpcAdminUpdateTenantMemberRoleResponse;
}

export async function updateTenantMemberStatus(
  payload: RpcAdminUpdateTenantMemberStatusPayload,
) {
  const client = requireClient();
  const { data, error } = await client.rpc(
    'rpc_admin_update_tenant_member_status',
    payload,
  );

  if (error) {
    throw toAppError(error, 'Falha ao atualizar o status do membership.');
  }

  return data as RpcAdminUpdateTenantMemberStatusResponse;
}

export async function listAdminKnowledgeArticleAssets(articleId: string) {
  const client = requireClient();
  const { data, error } = await client
    .from('vw_admin_knowledge_article_assets')
    .select('*')
    .eq('article_id', articleId)
    .order('created_at', { ascending: true });

  if (error) {
    throw toAppError(
      error,
      'Falha ao carregar os assets administrativos do artigo.',
    );
  }

  const rows = (data ?? []) as AdminKnowledgeArticleAssetRow[];
  const enriched = await Promise.all(
    rows.map(async (row) => {
      const { data: signedData } = await client.storage
        .from(row.storage_bucket)
        .createSignedUrl(row.storage_object_path, 60 * 10);

      return {
        ...row,
        signed_url: signedData?.signedUrl ?? null,
      } satisfies AdminKnowledgeArticleAssetRow;
    }),
  );

  return enriched;
}

export async function upsertKnowledgeArticleAsset(
  payload: RpcAdminUpsertKnowledgeArticleAssetPayload,
) {
  const client = requireClient();
  const { data, error } = await client.rpc(
    'rpc_admin_upsert_knowledge_article_asset_v1',
    payload,
  );

  if (error) {
    throw toAppError(error, 'Falha ao registrar o asset governado do artigo.');
  }

  return data as RpcAdminUpsertKnowledgeArticleAssetResponse;
}

export async function uploadKnowledgeArticleAssetFile(options: {
  articleId: string;
  knowledgeSpaceId: string;
  file: File;
  sourceKind: 'upload' | 'paste';
}) {
  const client = requireClient();
  const { articleId, knowledgeSpaceId, file, sourceKind } = options;

  if (!KNOWLEDGE_ASSET_ALLOWED_TYPES.has(file.type)) {
    throw toAppError(
      new Error('Tipo de arquivo não permitido para assets da base de conhecimento.'),
      'Use PNG, JPG, WEBP ou GIF no editor de artigos.',
    );
  }

  if (file.size > KNOWLEDGE_ASSET_MAX_BYTES) {
    throw toAppError(
      new Error('Arquivo acima do limite de 10 MB.'),
      'O asset excede o limite de 10 MB do bucket governado.',
    );
  }

  const sourceHash = await digestFileSha256(file);
  const dimensions = await readImageDimensions(file);
  const safeName = normalizeStorageFilename(file.name);
  const extension = safeName.includes('.') ? safeName.split('.').pop() : 'bin';
  const objectPath = `${knowledgeSpaceId}/${articleId}/${sourceKind}-${sourceHash.slice(
    0,
    12,
  )}-${crypto.randomUUID()}.${extension}`;

  const { error: uploadError } = await client.storage
    .from(KNOWLEDGE_ASSET_BUCKET)
    .upload(objectPath, file, {
      cacheControl: '3600',
      contentType: file.type,
      upsert: false,
    });

  if (uploadError) {
    throw toAppError(
      new Error(uploadError.message),
      'Falha ao enviar a imagem para o bucket governado.',
    );
  }

  try {
    return await upsertKnowledgeArticleAsset({
      p_article_id: articleId,
      p_knowledge_space_id: knowledgeSpaceId,
      p_source_url: null,
      p_source_path: `manual/${sourceKind}/${safeName}`,
      p_source_hash: sourceHash,
      p_storage_object_path: objectPath,
      p_detected_mime_type: file.type,
      p_file_size_bytes: file.size,
      p_width: dimensions.width,
      p_height: dimensions.height,
      p_alt_text: file.name.replace(/\.[^.]+$/, ''),
      p_caption: null,
      p_review_status: 'pending',
      p_visibility: 'internal',
      p_is_blocked: false,
    });
  } catch (error) {
    await client.storage.from(KNOWLEDGE_ASSET_BUCKET).remove([objectPath]);
    throw error;
  }
}

export async function updateKnowledgeArticleAssetReview(
  payload: RpcAdminUpdateKnowledgeArticleAssetReviewPayload,
) {
  const client = requireClient();
  const { data, error } = await client.rpc(
    'rpc_admin_update_knowledge_article_asset_review_v1',
    payload,
  );

  if (error) {
    throw toAppError(error, 'Falha ao atualizar a revisão do asset do artigo.');
  }

  return data as RpcAdminUpdateKnowledgeArticleAssetReviewResponse;
}

export async function updateCustomerPortalUserRole(payload: {
  p_membership_id: string;
  p_role: CustomerPortalRole;
}) {
  const client = requireClient();
  const { data, error } = await client.rpc(
    'rpc_admin_update_tenant_member_role',
    payload,
  );

  if (error) {
    throw toAppError(error, 'Falha ao atualizar o papel customer-facing.');
  }

  return data as RpcAdminUpdateTenantMemberRoleResponse;
}

export async function updateCustomerPortalUserStatus(
  payload: RpcAdminUpdateTenantMemberStatusPayload,
) {
  return updateTenantMemberStatus(payload);
}

export async function grantKnowledgeArticleEntitlement(
  payload: RpcAdminGrantKnowledgeArticleEntitlementPayload,
) {
  const client = requireClient();
  const { data, error } = await client.rpc(
    'rpc_admin_grant_knowledge_article_entitlement',
    payload,
  );

  if (error) {
    throw toAppError(error, 'Falha ao conceder entitlement do portal cliente.');
  }

  return data as RpcAdminGrantKnowledgeArticleEntitlementResponse;
}

export async function archiveKnowledgeArticleEntitlement(
  payload: RpcAdminArchiveKnowledgeArticleEntitlementPayload,
) {
  const client = requireClient();
  const { data, error } = await client.rpc(
    'rpc_admin_archive_knowledge_article_entitlement',
    payload,
  );

  if (error) {
    throw toAppError(error, 'Falha ao arquivar entitlement do portal cliente.');
  }

  return data as RpcAdminArchiveKnowledgeArticleEntitlementResponse;
}

export async function linkKnowledgeArticleToTicket(
  payload: RpcAdminLinkKnowledgeArticleToTicketPayload,
) {
  const client = requireClient();
  const { data, error } = await client.rpc(
    'rpc_admin_link_knowledge_article_to_ticket',
    payload,
  );

  if (error) {
    throw toAppError(error, 'Falha ao vincular artigo autorizado ao ticket.');
  }

  return data as RpcAdminLinkKnowledgeArticleToTicketResponse;
}

export async function unlinkKnowledgeArticleFromTicket(
  payload: RpcAdminUnlinkKnowledgeArticleFromTicketPayload,
) {
  const client = requireClient();
  const { data, error } = await client.rpc(
    'rpc_admin_unlink_knowledge_article_from_ticket',
    payload,
  );

  if (error) {
    throw toAppError(error, 'Falha ao remover o vínculo entre ticket e artigo.');
  }

  return data as RpcAdminUnlinkKnowledgeArticleFromTicketResponse;
}

export async function createTenantContact(
  payload: RpcAdminCreateTenantContactPayload,
) {
  const client = requireClient();
  const { data, error } = await client.rpc(
    'rpc_admin_create_tenant_contact',
    payload,
  );

  if (error) {
    throw toAppError(error, 'Falha ao criar contato do tenant.');
  }

  return data as RpcAdminCreateTenantContactResponse;
}

export async function updateTenantContact(
  payload: RpcAdminUpdateTenantContactPayload,
) {
  const client = requireClient();
  const { data, error } = await client.rpc(
    'rpc_admin_update_tenant_contact',
    payload,
  );

  if (error) {
    throw toAppError(error, 'Falha ao atualizar contato do tenant.');
  }

  return data as RpcAdminUpdateTenantContactResponse;
}

export async function createKnowledgeCategoryV2(
  payload: RpcAdminCreateKnowledgeCategoryV2Payload,
) {
  const client = requireClient();
  const { data, error } = await client.rpc(
    'rpc_admin_create_knowledge_category_v2',
    payload,
  );

  if (error) {
    throw toAppError(error, 'Falha ao criar a categoria da central de ajuda.');
  }

  return data as RpcAdminCreateKnowledgeCategoryV2Response;
}

export async function createKnowledgeArticleDraftV2(
  payload: RpcAdminCreateKnowledgeArticleDraftV2Payload,
) {
  const client = requireClient();
  const { data, error } = await client.rpc(
    'rpc_admin_create_knowledge_article_draft_v2',
    payload,
  );

  if (error) {
    throw toAppError(error, 'Falha ao criar o rascunho da central de ajuda.');
  }

  return data as RpcAdminCreateKnowledgeArticleDraftV2Response;
}

export async function updateKnowledgeArticleDraftV2(
  payload: RpcAdminUpdateKnowledgeArticleDraftV2Payload,
) {
  const client = requireClient();
  const { data, error } = await client.rpc(
    'rpc_admin_update_knowledge_article_draft_v2',
    payload,
  );

  if (error) {
    throw toAppError(error, 'Falha ao atualizar o rascunho da central de ajuda.');
  }

  return data as RpcAdminUpdateKnowledgeArticleDraftV2Response;
}

export async function beginKnowledgeArticleEditorialRevisionV2(
  payload: RpcAdminArticleSpaceActionV2Payload,
) {
  const client = requireClient();
  const { data, error } = await client.rpc(
    'rpc_admin_begin_knowledge_article_editorial_revision_v2',
    payload,
  );

  if (error) {
    throw toAppError(
      error,
      'Falha ao iniciar a revisão editorial do artigo publicado.',
    );
  }

  return data as RpcAdminBeginKnowledgeArticleEditorialRevisionV2Response;
}

export async function updateKnowledgeArticleEditorialRevisionV2(
  payload: RpcAdminUpdateKnowledgeArticleEditorialRevisionV2Payload,
) {
  const client = requireClient();
  const { data, error } = await client.rpc(
    'rpc_admin_update_knowledge_article_editorial_revision_v2',
    payload,
  );

  if (error) {
    throw toAppError(
      error,
      'Falha ao salvar a revisão editorial do artigo publicado.',
    );
  }

  return data as RpcAdminUpdateKnowledgeArticleEditorialRevisionV2Response;
}

export async function submitKnowledgeArticleForReviewV2(
  payload: RpcAdminArticleSpaceActionV2Payload,
) {
  const client = requireClient();
  const { data, error } = await client.rpc(
    'rpc_admin_submit_knowledge_article_for_review_v2',
    payload,
  );

  if (error) {
    throw toAppError(
      error,
      'Falha ao enviar o artigo para revisão editorial.',
    );
  }

  return data as RpcAdminSubmitKnowledgeArticleForReviewV2Response;
}

export async function publishKnowledgeArticleV2(
  payload: RpcAdminArticleSpaceActionV2Payload,
) {
  const client = requireClient();
  const { data, error } = await client.rpc(
    'rpc_admin_publish_knowledge_article_v2',
    payload,
  );

  if (error) {
    throw toAppError(error, 'Falha ao publicar o artigo da central de ajuda.');
  }

  return data as RpcAdminPublishKnowledgeArticleV2Response;
}

export async function archiveKnowledgeArticleV2(
  payload: RpcAdminArticleSpaceActionV2Payload,
) {
  const client = requireClient();
  const { data, error } = await client.rpc(
    'rpc_admin_archive_knowledge_article_v2',
    payload,
  );

  if (error) {
    throw toAppError(error, 'Falha ao arquivar o artigo da central de ajuda.');
  }

  return data as RpcAdminArchiveKnowledgeArticleV2Response;
}

export async function publishKnowledgeArticleEditorialRevisionV2(
  payload: RpcAdminArticleSpaceActionV2Payload,
) {
  const client = requireClient();
  const { data, error } = await client.rpc(
    'rpc_admin_publish_knowledge_article_editorial_revision_v2',
    payload,
  );

  if (error) {
    throw toAppError(
      error,
      'Falha ao publicar a atualização do artigo.',
    );
  }

  return data as RpcAdminPublishKnowledgeArticleEditorialRevisionV2Response;
}

export async function discardKnowledgeArticleEditorialRevisionV2(
  payload: RpcAdminArticleSpaceActionV2Payload,
) {
  const client = requireClient();
  const { data, error } = await client.rpc(
    'rpc_admin_discard_knowledge_article_editorial_revision_v2',
    payload,
  );

  if (error) {
    throw toAppError(
      error,
      'Falha ao descartar a revisão editorial do artigo.',
    );
  }

  return data as RpcAdminDiscardKnowledgeArticleEditorialRevisionV2Response;
}

export async function updateKnowledgeArticleReviewStatus(
  payload: RpcAdminUpdateKnowledgeArticleReviewStatusPayload,
) {
  const client = requireClient();
  const { data, error } = await client.rpc(
    'rpc_admin_update_knowledge_article_review_status',
    payload,
  );

  if (error) {
    throw toAppError(error, 'Falha ao atualizar o status da revisão editorial.');
  }

  return data as RpcAdminUpdateKnowledgeArticleReviewStatusResponse;
}

export async function markKnowledgeArticleReviewed(
  payload: RpcAdminMarkKnowledgeArticleReviewedPayload,
) {
  const client = requireClient();
  const { data, error } = await client.rpc(
    'rpc_admin_mark_knowledge_article_reviewed',
    payload,
  );

  if (error) {
    throw toAppError(error, 'Falha ao marcar a revisão editorial como concluída.');
  }

  return data as RpcAdminMarkKnowledgeArticleReviewedResponse;
}

export async function prepareKnowledgeArticlePublicationEvidence(
  payload: RpcAdminPrepareKnowledgeArticlePublicationEvidencePayload,
) {
  const client = requireClient();
  const { data, error } = await client.rpc(
    'rpc_admin_prepare_knowledge_article_publication_evidence_v1',
    payload,
  );

  if (error) {
    throw toAppError(error, 'Falha ao preparar evidência editorial pública.');
  }

  return data as RpcAdminPrepareKnowledgeArticlePublicationEvidenceResponse;
}

export type {
  AdminAccessMembershipRow,
  AdminAccessUserRow,
  AdminAuditFeedRow,
  AdminCustomerPortalAccessOverviewRow,
  AdminCustomerPortalArticleCandidateRow,
  AdminCustomerPortalTicketCandidateRow,
  AdminCustomerPortalTenantAccessRow,
  AdminCustomerPortalUserDetailRow,
  AdminCustomerPortalUserRow,
  AdminKnowledgeArticleDetailV2Row,
  AdminKnowledgeArticleEditorialDraftRow,
  AdminKnowledgeArticleAssetRow,
  AdminKnowledgeArticleListItemV2Row,
  AdminKnowledgeArticleReviewAdvisoryRow,
  AdminKnowledgeEntitlementDetailRow,
  AdminKnowledgeEntitlementRow,
  AdminKnowledgeCategoryRecordRow,
  AdminKnowledgeCategoryV2Row,
  AdminKnowledgeSpaceRow,
  AdminTenantContactRecordRow,
  AdminTenantContactViewRow,
  AdminTenantDetailRow,
  AdminTenantMembershipRecordRow,
  AdminTenantMembershipRow,
  AdminTenantRecordRow,
  AdminTenantsListItemRow,
  AdminSystemAuditEventRow,
  AdminSystemHealthCheckRow,
  AdminSystemOperationalSummaryRow,
  AdminTicketKnowledgeLinkRow,
  AdminUserLookupRow,
  CustomerPortalRole,
  KnowledgeAdvisoryClassification,
  KnowledgeArticleStatus,
  KnowledgeArticleReviewStatus,
  KnowledgeReviewHumanConfirmations,
  KnowledgeVisibility,
};
