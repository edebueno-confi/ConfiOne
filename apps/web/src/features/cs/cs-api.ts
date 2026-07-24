import { toAppError } from '../../app/errors';
import { requireSupabaseBrowserClient } from '../../app/supabase-browser';
import { mapCsCustomerPortfolio } from './cs-model';

export async function listCsCustomerPortfolio() {
  const client = requireSupabaseBrowserClient();
  const { data, error } = await client
    .from('vw_cs_customer_portfolio')
    .select('*')
    .order('tenant_display_name', { ascending: true });

  if (error) {
    throw toAppError(error, 'Falha ao carregar a carteira de Customer Success.');
  }

  return (data ?? []).map((row) =>
    mapCsCustomerPortfolio(row as Record<string, unknown>),
  );
}

export interface UpdateCsCustomerPortfolioInput {
  tenantId: string;
  portfolioName: string;
  assignmentStatus?: 'active' | 'paused' | 'archived';
  ownerUserId?: string | null;
  clusterKey?: string | null;
  serviceModel?: string | null;
  contactFrequency?: string | null;
  healthStatus?: string | null;
  priority?: string | null;
  notes?: string | null;
  source?: string;
  sourceRecordId?: string | null;
}

export async function upsertCsCustomerPortfolio(input: UpdateCsCustomerPortfolioInput) {
  const client = requireSupabaseBrowserClient();
  const { error } = await client.rpc('rpc_admin_upsert_cs_customer_portfolio', {
    p_tenant_id: input.tenantId,
    p_portfolio_name: input.portfolioName,
    p_assignment_status: input.assignmentStatus ?? 'active',
    p_owner_user_id: input.ownerUserId ?? null,
    p_cluster_key: input.clusterKey ?? null,
    p_service_model: input.serviceModel ?? null,
    p_contact_frequency: input.contactFrequency ?? null,
    p_health_status: input.healthStatus ?? null,
    p_priority: input.priority ?? null,
    p_notes: input.notes ?? null,
    p_source: input.source ?? 'manual',
    p_source_record_id: input.sourceRecordId ?? null,
  });

  if (error) {
    throw toAppError(error, 'Não foi possível atualizar a carteira CS.');
  }
}

export { filterCsCustomerPortfolio } from './cs-model';
