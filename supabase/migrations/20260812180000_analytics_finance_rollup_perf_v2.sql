--
-- O rollup de propriedades precisa publicar somente o snapshot corrente e
-- rejeitar chaves ambíguas. A versão anterior varria versões históricas e
-- usava um OR entre CNPJ e código OMIE, o que podia exceder o timeout local.

begin;

create index if not exists analytics_finance_receivables_current_positive_idx
  on public.analytics_finance_receivables (source_key, is_current, balance)
  where balance > 0;

create index if not exists analytics_finance_receivables_current_tax_id_idx
  on public.analytics_finance_receivables (
    source_key,
    is_current,
    (nullif(regexp_replace(coalesce(client_tax_id, ''), '[^0-9]', '', 'g'), ''))
  )
  where balance > 0;

create index if not exists analytics_finance_receivables_current_omie_client_idx
  on public.analytics_finance_receivables (
    source_key,
    is_current,
    (nullif(trim(raw_payload ->> 'codigo_cliente_fornecedor'), ''))
  )
  where balance > 0;

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
      where source_key <> 'omie_receivables_api'
      order by created_at desc
      limit 1
    )
  end into v_source_key;

  with hubspot_identity as (
    select
      c.company_id,
      c.name,
      c.client_status,
      nullif(regexp_replace(
        coalesce(nullif(c.raw ->> 'cnpj__chave_unica_', ''), nullif(c.raw ->> 'cnpj_id', ''), c.tax_id, ''),
        '[^0-9]', '', 'g'
      ), '') as omie_tax_id,
      nullif(trim(c.raw ->> 'omie_cliente_id'), '') as omie_client_id
    from public.hubspot_companies c
  ), receivable_base as (
    select
      f.id,
      f.balance,
      f.aging_bucket,
      f.due_date,
      nullif(regexp_replace(coalesce(f.client_tax_id, ''), '[^0-9]', '', 'g'), '') as omie_tax_id,
      nullif(trim(f.raw_payload ->> 'codigo_cliente_fornecedor'), '') as omie_client_id
    from public.analytics_finance_receivables f
    where f.source_key = v_source_key
      and f.is_current
      and f.balance > 0
  ), candidate_pairs as (
    select distinct r.id as receivable_id, h.company_id, 0 as priority
    from receivable_base r
    join hubspot_identity h on h.omie_tax_id = r.omie_tax_id
    where r.omie_tax_id is not null
    union all
    select distinct r.id as receivable_id, h.company_id, 1 as priority
    from receivable_base r
    join hubspot_identity h on h.omie_client_id = r.omie_client_id
    where r.omie_client_id is not null
  ), unique_matches as (
    select distinct on (p.receivable_id)
      p.receivable_id,
      p.company_id
    from (
      select p.*, count(*) over (partition by p.receivable_id) as candidate_count
      from candidate_pairs p
    ) p
    where p.candidate_count = 1
    order by p.receivable_id, p.priority, p.company_id
  )
  select coalesce(jsonb_agg(jsonb_build_object(
    'company_id', x.company_id,
    'company_name', x.company_name,
    'omie_client_code', x.omie_client_code,
    'saldo_aberto', x.saldo_aberto,
    'saldo_vencido', x.saldo_vencido,
    'titulos_abertos', x.titulos_abertos,
    'atraso_medio_dias', x.atraso_medio_dias,
    'situacao', x.situacao
  ) order by x.saldo_aberto desc), '[]'::jsonb)
  into result
  from (
    select
      c.company_id,
      max(c.name) as company_name,
      max(nullif(trim(f.raw_payload ->> 'codigo_cliente_fornecedor'), '')) as omie_client_code,
      round(sum(f.balance)::numeric, 2) as saldo_aberto,
      round(coalesce(sum(f.balance) filter (where f.aging_bucket = 'atrasado'), 0)::numeric, 2) as saldo_vencido,
      count(*)::integer as titulos_abertos,
      coalesce(round(avg(current_date - f.due_date) filter (where f.aging_bucket = 'atrasado' and f.due_date is not null), 0), 0)::integer as atraso_medio_dias,
      case
        when coalesce(sum(f.balance) filter (where f.aging_bucket = 'atrasado'), 0) = 0 then 'a_vencer'
        when sum(f.balance) filter (where f.aging_bucket = 'atrasado') >= 0.5 * sum(f.balance) then 'critico'
        else 'vencido'
      end as situacao
    from receivable_base f
    join unique_matches m on m.receivable_id = f.id
    join hubspot_identity c on c.company_id = m.company_id
    group by c.company_id
  ) x;

  return result;
end;
$$;

comment on function public.rpc_analytics_finance_company_rollup() is
  'Rollup financeiro por empresa HubSpot usando apenas o snapshot OMIE corrente e chaves fiscais/código OMIE únicos; somente leitura.';

commit;
