-- O cache de empresas não define, sozinho, a carteira de Customer Success.
-- Mantemos registros e histórico para investigação, mas não publicamos o
-- catálogo geral como carteira até existir um denominador aprovado.

create or replace function public.rpc_analytics_customer_success_snapshot()
returns jsonb
language sql
stable
security definer
set search_path = ''
as $$
select case when app_private.can_read_analytics() then jsonb_build_object(
  'contract_version', 'customer_success_hubspot_v2',
  'source', 'HubSpot',
  'source_key', 'hubspot_companies',
  'status', 'unavailable',
  'last_successful_sync_at', null,
  'expected_count', null,
  'reason', 'Dados de carteira ainda não consolidados: o critério de cliente ativo não está definido neste contrato.',
  'kpis', '{}'::jsonb,
  'by_owner', '[]'::jsonb,
  'by_client_status', '[]'::jsonb,
  'by_contract_status', '[]'::jsonb,
  'companies', '[]'::jsonb,
  'limitations', jsonb_build_array(
    'O catálogo geral de empresas HubSpot não é um denominador aprovado para Customer Success.',
    'Cliente ativo, carteira e health score aguardam regra de negócio e read model confirmados.'
  )
) else jsonb_build_object(
  'contract_version', 'customer_success_hubspot_v2',
  'source', 'Indisponível',
  'status', 'unavailable',
  'reason', 'Acesso negado ao contrato de Customer Success.'
) end;
$$;

revoke all on function public.rpc_analytics_customer_success_snapshot() from public, anon;
grant execute on function public.rpc_analytics_customer_success_snapshot() to authenticated, service_role;
