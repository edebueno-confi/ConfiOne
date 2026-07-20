-- Guarda o nome fantasia do cliente (OMIE ListarClientesResumido) e usa razao
-- social + nome fantasia como pista de duplicidade contra o HubSpot (que pode
-- cadastrar a empresa pelo nome comercial). A reconciliacao oficial continua por
-- CNPJ; o nome apenas sinaliza provavel cadastro existente.

alter table public.analytics_finance_receivables
  add column if not exists client_trade_name text;

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
      max(f.client_trade_name) trade_name,
      count(*)::integer titles,
      coalesce(sum(f.balance), 0)::numeric balance,
      coalesce(sum(f.balance) filter (where f.aging_bucket = 'atrasado'), 0)::numeric overdue_balance
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
  ),
  scored as (
    select
      g.*,
      nullif(regexp_replace(upper(coalesce(g.client, '')), '(\s+(LTDA|EIRELI|ME|EPP|S/?A|S\.?A\.?)\b.*)$', ''), '') core_name,
      nullif(regexp_replace(upper(coalesce(g.trade_name, '')), '(\s+(LTDA|EIRELI|ME|EPP|S/?A|S\.?A\.?)\b.*)$', ''), '') core_trade
    from grouped g
  )
  select coalesce(jsonb_agg(jsonb_build_object(
      'client', client, 'tax_id', tax_id, 'trade_name', trade_name, 'titles', titles,
      'balance', balance, 'overdue_balance', overdue_balance, 'name_matches', name_matches
    ) order by balance desc), '[]'::jsonb)
  into result
  from (
    select s.*, (
      select count(*) from public.hubspot_companies c
      where (s.core_name is not null and length(s.core_name) >= 4 and upper(coalesce(c.name, '')) like '%' || s.core_name || '%')
         or (s.core_trade is not null and length(s.core_trade) >= 4 and upper(coalesce(c.name, '')) like '%' || s.core_trade || '%')
    )::integer name_matches
    from scored s
  ) y;

  return result;
end;
$$;

revoke all on function public.rpc_analytics_finance_unmatched_clients(text, integer) from public, anon;
grant execute on function public.rpc_analytics_finance_unmatched_clients(text, integer) to authenticated, service_role;
