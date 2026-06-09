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

export { filterCsCustomerPortfolio } from './cs-model';
