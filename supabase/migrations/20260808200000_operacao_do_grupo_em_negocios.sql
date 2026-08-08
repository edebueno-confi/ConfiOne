-- OPERAÇÃO DO GRUPO TAMBÉM NOS PIPELINES DE NEGÓCIO
--
-- A semeadura anterior cobriu apenas atendimentos. A auditoria dos indicadores
-- mostrou que o Comercial tem o mesmo problema, e um agravante.
--
--   "Piloto Aftersale", apelido "Comercial Aftersale" — 1.171 negócios
--   "Pipe de Vendas" — 908 negócios, sem convenção de nome
--   "Gestão CS" — 25 negócios, e **não é comercial**
--
-- O indicador comercial soma pelo menos duas operações e inclui um pipeline de
-- CS. "Taxa de ganho: 8%" é a média de coisas que não se comparam.
--
-- Esta migration só **semeia e expõe**. Não altera nenhum indicador: fazer isso
-- sem decisão humana repetiria o erro de classificar pelo rótulo.

update public.analytics_source_config
   set group_company = case
         when hubspot_pipeline_label like '💜%' then 'Aftersale'
         when hubspot_pipeline_label like '🔎%' then 'Confi'
         when hubspot_pipeline_label like '📊%' then 'Neotrust'
         when hubspot_pipeline_label like '👁%' then 'Confi Analytics'
         else 'a_definir' end,
       group_company_source = case
         when hubspot_pipeline_label like '💜%'
           or hubspot_pipeline_label like '🔎%'
           or hubspot_pipeline_label like '📊%'
           or hubspot_pipeline_label like '👁%' then 'suggested'
         else 'pending' end,
       updated_at = timezone('utc', now())
 where object_type = 'deal' and group_company_source = 'pending';

-- Leitura de apoio para a decisão: por operação, por pipeline, com o nome
-- oficial ao lado do apelido e o volume que cada um carrega.
create or replace function public.rpc_analytics_pipeline_inventory(p_object_type text default 'ticket')
returns jsonb
language plpgsql
stable
security definer
set search_path = ''
as $$
declare
  v_result jsonb;
begin
  if not app_private.can_read_analytics() then
    raise exception 'Acesso negado.' using errcode = '42501';
  end if;

  with base as (
    select
      c.hubspot_pipeline_id as pipeline_id,
      coalesce(nullif(c.hubspot_pipeline_label, ''), c.hubspot_pipeline_id) as pipeline_name,
      nullif(c.label, '') as pipeline_alias,
      c.group_company, c.group_company_source, c.is_active, c.area_key,
      case when p_object_type = 'deal'
        then (select count(*) from public.hubspot_deals d where d.pipeline_id = c.hubspot_pipeline_id)
        else (select count(*) from public.hubspot_tickets t where t.pipeline_id = c.hubspot_pipeline_id)
      end::integer as records
    from public.analytics_source_config c
    where c.object_type = p_object_type and not coalesce(c.is_archived, false)
  )
  select jsonb_build_object(
    'object_type', p_object_type,
    'pipelines', coalesce((select jsonb_agg(row_to_json(b) order by b.records desc) from base b), '[]'::jsonb),
    'undefined_company_records', coalesce((
      select sum(records) from base where group_company = 'a_definir' and is_active), 0),
    'confirmed_pipelines', (select count(*) from base where group_company_source = 'confirmed'),
    'total_pipelines', (select count(*) from base)
  ) into v_result;

  return coalesce(v_result, '{}'::jsonb);
end;
$$;

comment on function public.rpc_analytics_pipeline_inventory(text) is
  'Inventario de pipelines com nome oficial, apelido, operacao do grupo e volume. Existe para que a classificacao seja decidida com a evidencia a vista, e nao pelo rotulo.';

revoke all on function public.rpc_analytics_pipeline_inventory(text) from public, anon;
grant execute on function public.rpc_analytics_pipeline_inventory(text) to authenticated, service_role;
