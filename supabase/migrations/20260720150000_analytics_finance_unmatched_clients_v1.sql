-- Lista (read-only) de clientes OMIE com saldo em aberto e sem empresa
-- correspondente no cache do HubSpot. Criterio de reconciliacao: CNPJ somente
-- digitos (regexp_replace '[^0-9]'). Nome NAO reconcilia (evita falso positivo),
-- mas e usado como pista (name_matches) para indicar provavel cadastro no HubSpot
-- com CNPJ divergente/ausente. Nenhuma escrita externa ocorre aqui.

create or replace function public.rpc_analytics_finance_unmatched_clients(
  p_client_query text default null,
  p_limit integer default 100
)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  result jsonb;
  v_source_key text;
begin
  if not app_private.can_read_analytics() then
    raise exception 'Acesso negado ao Analytics Financeiro';
  end if;

  select case
    when exists (select 1 from public.analytics_finance_receivables where source_key = 'omie_receivables_api')
      then 'omie_receivables_api'
    else (
      select source_key from public.analytics_finance_receivables
      where source_key <> 'omie_receivables_api'
      order by created_at desc limit 1
    )
  end into v_source_key;

  with grouped as (
    select
      coalesce(f.client_name, '(sem nome)') client,
      max(f.client_tax_id) tax_id,
      count(*)::integer titles,
      coalesce(sum(f.balance), 0)::numeric balance,
      coalesce(sum(f.balance) filter (where f.aging_bucket = 'atrasado'), 0)::numeric overdue_balance,
      nullif(regexp_replace(upper(coalesce(f.client_name, '')), '(\s+(LTDA|EIRELI|ME|EPP|S/?A|S\.?A\.?)\b.*)$', ''), '') core
    from public.analytics_finance_receivables f
    where v_source_key is not null and f.source_key = v_source_key and f.balance > 0
      and (nullif(trim(p_client_query), '') is null or f.client_name ilike '%' || trim(p_client_query) || '%')
      and not exists (
        select 1 from public.hubspot_companies c
        where nullif(regexp_replace(coalesce(f.client_tax_id, ''), '[^0-9]', '', 'g'), '') is not null
          and regexp_replace(coalesce(c.tax_id, ''), '[^0-9]', '', 'g') = regexp_replace(coalesce(f.client_tax_id, ''), '[^0-9]', '', 'g')
      )
    group by f.client_name
    order by balance desc
    limit greatest(least(coalesce(p_limit, 100), 500), 1)
  )
  select coalesce(jsonb_agg(jsonb_build_object(
      'client', client, 'tax_id', tax_id, 'titles', titles, 'balance', balance,
      'overdue_balance', overdue_balance, 'name_matches', name_matches
    ) order by balance desc), '[]'::jsonb)
  into result
  from (
    select g.*, (
      select count(*) from public.hubspot_companies c
      where g.core is not null and length(g.core) >= 4
        and upper(coalesce(c.name, '')) like '%' || g.core || '%'
    )::integer name_matches
    from grouped g
  ) y;

  return result;
end;
$$;

comment on function public.rpc_analytics_finance_unmatched_clients(text, integer) is
  'Clientes OMIE com saldo em aberto sem empresa correspondente no HubSpot por CNPJ. name_matches indica possivel cadastro por nome (CNPJ divergente/ausente). Somente leitura.';

revoke all on function public.rpc_analytics_finance_unmatched_clients(text, integer) from public, anon;
grant execute on function public.rpc_analytics_finance_unmatched_clients(text, integer) to authenticated, service_role;
