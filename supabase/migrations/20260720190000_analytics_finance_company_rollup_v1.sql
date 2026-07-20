-- Rollup financeiro por empresa do HubSpot (match por CNPJ exato) para alimentar
-- as propriedades omie_* via sincronizacao de saida. Somente leitura.

create or replace function public.rpc_analytics_finance_company_rollup()
returns jsonb
language plpgsql
security definer
set search_path = ''
as $$
declare
  result jsonb;
  v_source_key text;
begin
  if not (app_private.can_read_analytics() or auth.uid() is null) then
    raise exception 'Acesso negado.' using errcode = '42501';
  end if;

  select case
    when exists (select 1 from public.analytics_finance_receivables where source_key = 'omie_receivables_api')
      then 'omie_receivables_api'
    else (
      select source_key from public.analytics_finance_receivables
      where source_key <> 'omie_receivables_api' order by created_at desc limit 1
    )
  end into v_source_key;

  select coalesce(jsonb_agg(jsonb_build_object(
    'company_id', company_id,
    'company_name', company_name,
    'saldo_aberto', saldo_aberto,
    'saldo_vencido', saldo_vencido,
    'titulos_abertos', titulos_abertos,
    'atraso_medio_dias', atraso_medio_dias,
    'situacao', situacao
  ) order by saldo_aberto desc), '[]'::jsonb)
  into result
  from (
    select
      c.company_id,
      max(c.name) company_name,
      round(sum(f.balance)::numeric, 2) saldo_aberto,
      round(coalesce(sum(f.balance) filter (where f.aging_bucket = 'atrasado'), 0)::numeric, 2) saldo_vencido,
      count(*)::integer titulos_abertos,
      coalesce(round(avg(current_date - f.due_date) filter (where f.aging_bucket = 'atrasado' and f.due_date is not null), 0), 0)::integer atraso_medio_dias,
      case
        when coalesce(sum(f.balance) filter (where f.aging_bucket = 'atrasado'), 0) = 0 then 'a_vencer'
        when sum(f.balance) filter (where f.aging_bucket = 'atrasado') >= 0.5 * sum(f.balance) then 'critico'
        else 'vencido'
      end situacao
    from public.analytics_finance_receivables f
    join public.hubspot_companies c
      on nullif(regexp_replace(coalesce(f.client_tax_id, ''), '[^0-9]', '', 'g'), '') is not null
     and regexp_replace(coalesce(c.tax_id, ''), '[^0-9]', '', 'g') = regexp_replace(coalesce(f.client_tax_id, ''), '[^0-9]', '', 'g')
    where v_source_key is not null and f.source_key = v_source_key and f.balance > 0
    group by c.company_id
  ) x;

  return result;
end;
$$;

comment on function public.rpc_analytics_finance_company_rollup() is
  'Rollup financeiro por empresa HubSpot (match CNPJ exato) para sincronizacao de saida das propriedades omie_*. Somente leitura.';

revoke all on function public.rpc_analytics_finance_company_rollup() from public, anon;
grant execute on function public.rpc_analytics_finance_company_rollup() to authenticated, service_role;
