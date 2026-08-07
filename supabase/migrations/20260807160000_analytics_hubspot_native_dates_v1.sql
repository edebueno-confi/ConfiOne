-- ANALYTICS-HUBSPOT-NATIVE-DATES-V1
--
-- Correção de causa raiz descoberta pela sondagem da API em 2026-08-07.
--
-- O que estava errado
-- -------------------
-- O ingester pedia a propriedade `closedate` para tickets. Essa propriedade
-- **não existe** na conta: das 1.147 propriedades de ticket do portal, nenhuma
-- se chama `closedate`. O HubSpot ignora silenciosamente propriedade inexistente
-- em vez de falhar, então a coluna `hs_closed_at` ficou nula em 100% dos 31.530
-- tickets encerrados e o defeito passou despercebido.
--
-- Diagnóstico anterior corrigido: não era a operação que deixava de preencher a
-- data. Era o nome da propriedade solicitada que estava errado.
--
-- O que a conta realmente tem, medido em 100 tickets encerrados dos pipelines
-- que o Dashboard publica:
--
--   closed_date                                   100%
--   hs_last_closed_date                           100%  (idêntico a closed_date)
--   time_to_close                                 100%  (milissegundos; confere
--                                                        exatamente com a
--                                                        diferença das datas)
--   hs_lastactivitydate                           100%
--   hs_time_to_first_response_in_operating_hours   77%  (milissegundos, apesar
--                                                        do nome)
--
-- E em empresas marcadas como cliente ativo:
--
--   notes_last_contacted                          100%
--   hs_notes_last_activity                        100%
--
-- Consequência
-- ------------
-- Tickets resolvidos, tempo de resolução, tempo de primeira resposta e clientes
-- sem interação recente deixam de exigir reconstrução por histórico de
-- propriedade. Basta ingerir os campos certos. O histórico de estágio continua
-- necessário apenas para reabertura e tempo por etapa.

-- ---------------------------------------------------------------------------
-- 1. Colunas novas
-- ---------------------------------------------------------------------------

alter table public.hubspot_tickets
  add column if not exists last_activity_at timestamptz null,
  add column if not exists first_response_ms bigint null;

comment on column public.hubspot_tickets.last_activity_at is
  'Última atividade registrada no atendimento, vinda de hs_lastactivitydate.';
comment on column public.hubspot_tickets.first_response_ms is
  'Tempo até a primeira resposta, em milissegundos, contado apenas em horas úteis. Origem: hs_time_to_first_response_in_operating_hours, cujo nome sugere horas mas cujo valor é em milissegundos.';

alter table public.analytics_cs_ticket_staging
  add column if not exists last_activity_at timestamptz null,
  add column if not exists first_response_ms bigint null;

alter table public.hubspot_companies
  add column if not exists last_activity_at timestamptz null;

comment on column public.hubspot_companies.last_activity_at is
  'Última interação registrada com a empresa, vinda de notes_last_contacted.';

alter table public.analytics_hubspot_company_staging
  add column if not exists last_activity_at timestamptz null;

create index if not exists hubspot_tickets_closed_at_idx
  on public.hubspot_tickets (hs_closed_at)
  where hs_closed_at is not null;

-- ---------------------------------------------------------------------------
-- 2. Resolução de ticket: propriedade nativa primeiro, histórico como reforço
-- ---------------------------------------------------------------------------
--
-- A ordem de precedência é explícita: a data nativa do HubSpot vence, porque é
-- a fonte oficial. O histórico de estágio entra apenas quando a data nativa
-- está ausente, e continua sendo a única fonte de reabertura.
--
-- As três views deste lote ganham colunas no meio da projeção, e
-- `create or replace view` não aceita renomear ou reordenar coluna existente.
-- Por isso elas são derrubadas primeiro, na ordem inversa da dependência.
-- Nenhuma tabela é tocada: view não guarda dado, e as RPCs que as consomem
-- resolvem o nome em tempo de execução.

drop view if exists public.vw_analytics_customer_financial_link;
drop view if exists public.vw_analytics_customer_base;
drop view if exists public.vw_analytics_ticket_resolution;

create view public.vw_analytics_ticket_resolution
with (security_invoker = true)
as
with events as (
  select
    e.object_id as ticket_id,
    e.changed_at,
    coalesce(s.metadata ->> 'ticketState', '') = 'CLOSED' as is_closed_stage,
    lag(coalesce(s.metadata ->> 'ticketState', '')) over (
      partition by e.object_id order by e.changed_at
    ) as previous_state
  from public.analytics_hubspot_stage_events e
  left join public.hubspot_pipeline_stages s
    on s.object_type = 'ticket' and s.stage_id = e.stage_id
  where e.object_type = 'ticket'
),
aggregated as (
  select
    ticket_id,
    min(changed_at) filter (where is_closed_stage) as first_closed_at,
    max(changed_at) filter (where is_closed_stage) as last_closed_at,
    count(*) filter (where previous_state = 'CLOSED' and not is_closed_stage)::integer as reopened_count,
    count(*)::integer as stage_changes
  from events
  group by ticket_id
),
base as (
  select
    t.ticket_id,
    t.pipeline_id,
    t.hs_created_at,
    t.hs_closed_at,
    t.first_response_ms,
    t.last_activity_at,
    coalesce(cur.metadata ->> 'ticketState', '') = 'CLOSED' as is_closed_now,
    coalesce(cur.metadata ->> 'ticketState', '') = 'OPEN' as is_currently_open,
    a.ticket_id is not null as has_history,
    a.first_closed_at,
    a.last_closed_at,
    coalesce(a.reopened_count, 0) as reopened_count,
    coalesce(a.stage_changes, 0) as stage_changes
  from public.hubspot_tickets t
  left join public.hubspot_pipeline_stages cur
    on cur.object_type = 'ticket'
   and cur.pipeline_id = t.pipeline_id
   and cur.stage_id = t.pipeline_stage
  left join aggregated a on a.ticket_id = t.ticket_id
)
select
  b.ticket_id,
  b.pipeline_id,
  b.hs_created_at,
  b.has_history,
  b.is_currently_open,
  b.first_closed_at,
  b.reopened_count,
  b.stage_changes,
  b.last_activity_at,
  -- Precedência: data nativa do HubSpot, depois histórico de estágio.
  case
    when not b.is_closed_now then null
    when b.hs_closed_at is not null then b.hs_closed_at
    else b.last_closed_at
  end as resolved_at,
  case
    when b.hs_closed_at is not null then 'hubspot_property'
    when b.is_closed_now and b.last_closed_at is not null then 'stage_history'
    else null
  end as resolution_source,
  case
    when not b.is_closed_now then null
    when b.hs_created_at is null then null
    when b.hs_closed_at is not null
      then round(extract(epoch from (b.hs_closed_at - b.hs_created_at)) / 86400.0, 2)
    when b.last_closed_at is not null
      then round(extract(epoch from (b.last_closed_at - b.hs_created_at)) / 86400.0, 2)
    else null
  end as resolution_days,
  -- Convertido de milissegundos para horas na fronteira do read model, para que
  -- nenhuma tela precise conhecer a unidade da origem.
  case
    when b.first_response_ms is null then null
    else round(b.first_response_ms::numeric / 3600000.0, 2)
  end as first_response_hours
from base b;

comment on view public.vw_analytics_ticket_resolution is
  'Resolução, reabertura e primeira resposta do atendimento. A data de encerramento usa a propriedade nativa do HubSpot e recorre ao histórico de estágio apenas quando ela falta; resolution_source registra qual das duas foi usada.';

revoke all on public.vw_analytics_ticket_resolution from public, anon;
grant select on public.vw_analytics_ticket_resolution to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 3. Base de clientes com última interação
-- ---------------------------------------------------------------------------

create view public.vw_analytics_customer_base
with (security_invoker = true)
as
with settings as (
  select * from public.analytics_kpi_settings where id
)
select
  c.company_id,
  c.name as company_name,
  nullif(regexp_replace(coalesce(c.tax_id, ''), '[^0-9]', '', 'g'), '') as tax_id_normalized,
  nullif(btrim(coalesce(c.client_status, '')), '') as client_status,
  nullif(btrim(coalesce(c.contract_status, '')), '') as contract_status,
  c.cs_owner_id,
  o.full_name as cs_owner_name,
  c.last_activity_at,
  case
    when c.last_activity_at is null then null
    else (timezone('utc', now())::date - c.last_activity_at::date)
  end as days_since_last_activity,
  s.inactivity_threshold_days,
  case
    when s.mrr_source = 'HUBSPOT_RECURRING_REVENUE' then nullif(greatest(coalesce(c.mrr, 0), 0), 0)
    else null
  end as mrr,
  case s.active_customer_rule
    when 'HUBSPOT_CLIENT_STATUS'
      then btrim(coalesce(c.client_status, '')) = 'Cliente'
    when 'HUBSPOT_CLIENT_STATUS_WITH_CONTRACT'
      then btrim(coalesce(c.client_status, '')) = 'Cliente'
        and btrim(coalesce(c.contract_status, '')) in ('Vigente', 'Com Contrato')
    when 'HUBSPOT_MRR_POSITIVE'
      then coalesce(c.mrr, 0) > 0
    else null
  end as is_active_customer,
  s.mrr_source,
  s.active_customer_rule,
  s.calculation_version,
  c.synced_at as freshness_at
from public.hubspot_companies c
cross join settings s
left join public.hubspot_owners o on o.owner_id = c.cs_owner_id;

comment on view public.vw_analytics_customer_base is
  'Base canônica de clientes do Dashboard, agora com a última interação registrada. Cliente ativo e MRR seguem resolvidos pela configuração; decisão não resolvida devolve NULL em vez de zero.';

revoke all on public.vw_analytics_customer_base from public, anon;
grant select on public.vw_analytics_customer_base to authenticated, service_role;

-- A view de ligação financeira depende da base e precisa propagar os campos.
create view public.vw_analytics_customer_financial_link
with (security_invoker = true)
as
with receivables as (
  select
    nullif(regexp_replace(coalesce(r.client_tax_id, ''), '[^0-9]', '', 'g'), '') as tax_id_normalized,
    r.balance,
    r.due_date
  from public.analytics_finance_receivables r
  where r.is_current
    and not coalesce(r.is_cancelled, false)
    and coalesce(r.balance, 0) > 0
), aggregated as (
  select
    tax_id_normalized,
    round(sum(balance)::numeric, 2) as open_balance,
    round(coalesce(sum(balance) filter (where due_date < current_date), 0)::numeric, 2) as overdue_balance,
    count(*)::integer as open_titles,
    count(*) filter (where due_date < current_date)::integer as overdue_titles,
    max(current_date - due_date) filter (where due_date < current_date)::integer as max_overdue_days
  from receivables
  where tax_id_normalized is not null
  group by tax_id_normalized
)
select
  b.company_id,
  b.company_name,
  b.tax_id_normalized,
  b.client_status,
  b.contract_status,
  b.cs_owner_id,
  b.cs_owner_name,
  b.mrr,
  b.is_active_customer,
  b.last_activity_at,
  b.days_since_last_activity,
  b.inactivity_threshold_days,
  a.tax_id_normalized is not null as has_financial_link,
  coalesce(a.open_balance, 0)::numeric as open_balance,
  coalesce(a.overdue_balance, 0)::numeric as overdue_balance,
  coalesce(a.open_titles, 0)::integer as open_titles,
  coalesce(a.overdue_titles, 0)::integer as overdue_titles,
  a.max_overdue_days
from public.vw_analytics_customer_base b
left join aggregated a on a.tax_id_normalized = b.tax_id_normalized;

comment on view public.vw_analytics_customer_financial_link is
  'Ligação auditável entre a empresa do HubSpot e os títulos do OMIE por CNPJ normalizado, com última interação propagada. Nunca faz match por nome, domínio ou e-mail.';

revoke all on public.vw_analytics_customer_financial_link from public, anon;
grant select on public.vw_analytics_customer_financial_link to authenticated, service_role;

-- ---------------------------------------------------------------------------
-- 4. Promoção do staging: carregar as colunas novas
-- ---------------------------------------------------------------------------
--
-- Substituição em lugar. A única mudança em relação à versão anterior é a
-- inclusão de `last_activity_at` e `first_response_ms` em tickets e de
-- `last_activity_at` em empresas. Toda a lógica de autorização, falha, limpeza
-- de staging e marca d'água é preservada sem alteração.

create or replace function public.rpc_analytics_hubspot_finalize_run(p_run_id uuid)
returns jsonb
language plpgsql
security definer
set search_path = ''
as $function$
declare
  v_run public.hubspot_sync_runs;
  v_total integer;
  v_completed integer;
  v_promoted integer := 0;
  v_shared integer := 0;
  v_now timestamptz := timezone('utc', now());
  v_object_type text;
  v_pipelines jsonb;
begin
  if not app_private.is_internal_service_request()
     and not app_private.has_global_role('platform_admin'::public.platform_role) then
    raise exception 'analytics HubSpot finalize denied';
  end if;

  select * into v_run from public.hubspot_sync_runs where id = p_run_id for update;
  if v_run.id is null then raise exception 'run nao encontrado'; end if;
  if v_run.status in ('success','succeeded','failed','error','abandoned','cancelled','timed_out') then
    return jsonb_build_object('status',v_run.status,'run_id',v_run.id,'watermark_advanced',v_run.watermark_advanced);
  end if;

  select count(*)::integer,count(*) filter(where status='succeeded')::integer
    into v_total,v_completed
  from public.analytics_cs_sync_work_items
  where parent_run_id=p_run_id;

  if exists(select 1 from public.analytics_cs_sync_work_items where parent_run_id=p_run_id and status='failed') then
    delete from public.analytics_hubspot_company_staging where parent_run_id=p_run_id;
    delete from public.analytics_hubspot_owner_staging where parent_run_id=p_run_id;
    delete from public.analytics_hubspot_pipeline_staging where parent_run_id=p_run_id;
    delete from public.analytics_hubspot_stage_staging where parent_run_id=p_run_id;
    delete from public.analytics_cs_ticket_staging where parent_run_id=p_run_id;
    delete from public.analytics_hubspot_deal_staging where parent_run_id=p_run_id;
    update public.hubspot_sync_runs
    set status='failed',finished_at=v_now,heartbeat_at=v_now,error_code='WORK_ITEM_FAILED',
        error_message='Um ou mais lotes do HubSpot falharam; snapshot anterior preservado.',watermark_advanced=false
    where id=p_run_id;
    return jsonb_build_object('status','failed','run_id',p_run_id,'watermark_advanced',false);
  end if;
  if v_total=0 or v_completed<v_total then
    return jsonb_build_object('status',v_run.status,'run_id',p_run_id,'watermark_advanced',false);
  end if;

  insert into public.hubspot_tickets(ticket_id,pipeline_id,pipeline_stage,owner_id,source_type,priority,hs_created_at,hs_closed_at,last_activity_at,first_response_ms,time_to_first_response_sla_status,time_to_close_sla_status,raw,synced_at)
    select ticket_id,pipeline_id,pipeline_stage,owner_id,source_type,priority,hs_created_at,hs_closed_at,last_activity_at,first_response_ms,time_to_first_response_sla_status,time_to_close_sla_status,raw,v_now
    from public.analytics_cs_ticket_staging where parent_run_id=p_run_id
    on conflict(ticket_id) do update set pipeline_id=excluded.pipeline_id,pipeline_stage=excluded.pipeline_stage,owner_id=excluded.owner_id,source_type=excluded.source_type,priority=excluded.priority,hs_created_at=excluded.hs_created_at,hs_closed_at=excluded.hs_closed_at,last_activity_at=excluded.last_activity_at,first_response_ms=excluded.first_response_ms,time_to_first_response_sla_status=excluded.time_to_first_response_sla_status,time_to_close_sla_status=excluded.time_to_close_sla_status,raw=excluded.raw,synced_at=excluded.synced_at;
  get diagnostics v_promoted=row_count;

  insert into public.hubspot_deals(deal_id,pipeline_id,dealstage,owner_id,amount_home,dealtype,deal_name,hs_created_at,hs_closed_at,raw,synced_at)
    select deal_id,pipeline_id,dealstage,owner_id,amount_home,dealtype,deal_name,hs_created_at,hs_closed_at,raw,v_now
    from public.analytics_hubspot_deal_staging where parent_run_id=p_run_id
    on conflict(deal_id) do update set pipeline_id=excluded.pipeline_id,dealstage=excluded.dealstage,owner_id=excluded.owner_id,amount_home=excluded.amount_home,dealtype=excluded.dealtype,deal_name=excluded.deal_name,hs_created_at=excluded.hs_created_at,hs_closed_at=excluded.hs_closed_at,raw=excluded.raw,synced_at=excluded.synced_at;
  v_promoted:=v_promoted+coalesce((select count(*)::integer from public.analytics_hubspot_deal_staging where parent_run_id=p_run_id),0);

  insert into public.hubspot_companies(company_id,name,domain,tax_id,mrr,client_status,contract_status,cs_owner_id,last_activity_at,raw,synced_at)
    select company_id,name,domain,tax_id,mrr,client_status,contract_status,cs_owner_id,last_activity_at,raw,v_now
    from public.analytics_hubspot_company_staging where parent_run_id=p_run_id
    on conflict(company_id) do update set name=excluded.name,domain=excluded.domain,tax_id=excluded.tax_id,mrr=excluded.mrr,client_status=excluded.client_status,contract_status=excluded.contract_status,cs_owner_id=excluded.cs_owner_id,last_activity_at=excluded.last_activity_at,raw=excluded.raw,synced_at=excluded.synced_at;
  get diagnostics v_shared=row_count;
  v_promoted:=v_promoted+v_shared;

  insert into public.hubspot_owners(owner_id,email,first_name,last_name,full_name,archived,raw,synced_at)
    select owner_id,email,first_name,last_name,full_name,archived,raw,v_now
    from public.analytics_hubspot_owner_staging where parent_run_id=p_run_id
    on conflict(owner_id) do update set email=excluded.email,first_name=excluded.first_name,last_name=excluded.last_name,full_name=excluded.full_name,archived=excluded.archived,raw=excluded.raw,synced_at=excluded.synced_at;
  v_promoted:=v_promoted+coalesce((select count(*)::integer from public.analytics_hubspot_owner_staging where parent_run_id=p_run_id),0);

  for v_object_type in select distinct object_type from public.analytics_hubspot_pipeline_staging where parent_run_id=p_run_id loop
    select coalesce(jsonb_agg(jsonb_build_object('pipeline_id',pipeline_id,'label',label) order by pipeline_id) filter (where not archived), '[]'::jsonb)
      into v_pipelines
    from public.analytics_hubspot_pipeline_staging
    where parent_run_id=p_run_id and object_type=v_object_type;
    perform public.rpc_service_reconcile_hubspot_pipeline_catalog(p_object_type => v_object_type, p_pipelines => v_pipelines);
  end loop;

  insert into public.hubspot_pipeline_stages(object_type,pipeline_id,stage_id,label,display_order,is_closed,is_won,metadata,synced_at)
    select object_type,pipeline_id,stage_id,label,display_order,is_closed,is_won,metadata,v_now
    from public.analytics_hubspot_stage_staging where parent_run_id=p_run_id
    on conflict(object_type,pipeline_id,stage_id) do update set label=excluded.label,display_order=excluded.display_order,is_closed=excluded.is_closed,is_won=excluded.is_won,metadata=excluded.metadata,synced_at=excluded.synced_at;
  v_promoted:=v_promoted+coalesce((select count(*)::integer from public.analytics_hubspot_stage_staging where parent_run_id=p_run_id),0);

  delete from public.analytics_hubspot_company_staging where parent_run_id=p_run_id;
  delete from public.analytics_hubspot_owner_staging where parent_run_id=p_run_id;
  delete from public.analytics_hubspot_pipeline_staging where parent_run_id=p_run_id;
  delete from public.analytics_hubspot_stage_staging where parent_run_id=p_run_id;
  delete from public.analytics_cs_ticket_staging where parent_run_id=p_run_id;
  delete from public.analytics_hubspot_deal_staging where parent_run_id=p_run_id;

  update public.hubspot_sync_runs
  set status='success',finished_at=v_now,heartbeat_at=v_now,records_promoted=v_promoted,
      source_pagination_complete=true,source_state='complete',watermark_advanced=true,error_code=null,error_message=null
  where id=p_run_id;
  return jsonb_build_object('status','success','run_id',p_run_id,'records_promoted',v_promoted,'watermark_advanced',true);
end;
$function$;

comment on function public.rpc_analytics_hubspot_finalize_run(uuid) is
  'Promoção atômica do staging do HubSpot. Passa a carregar última interação e tempo de primeira resposta, campos que a conta preenche e que antes não eram ingeridos.';
