import { toAppError } from '../../app/errors';
import { requireSupabaseBrowserClient } from '../../app/supabase-browser';
import {
  mapCustomerRelationshipSnapshot,
  normalizeCustomerRelationshipPage,
  type CustomerRelationshipSnapshot,
} from './customer-relationship-model';

const MAX_RELATIONSHIP_PAGE_SIZE = 100;

export async function getCustomerRelationshipSnapshot(
  limit = MAX_RELATIONSHIP_PAGE_SIZE,
  offset = 0,
): Promise<CustomerRelationshipSnapshot> {
  const client = requireSupabaseBrowserClient();
  const page = normalizeCustomerRelationshipPage(limit, offset);
  const { data, error } = await client.rpc('rpc_analytics_customer_relationship_contract', {
    p_limit: Math.min(page.limit, MAX_RELATIONSHIP_PAGE_SIZE),
    p_offset: page.offset,
  });

  if (error) {
    throw toAppError(error, 'Não foi possível carregar o contexto do HubSpot.');
  }

  return mapCustomerRelationshipSnapshot(data);
}
