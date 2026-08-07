-- HUBSPOT-PROMOTION-TIMEOUT-HARDENING-V1
--
-- Correção de falha observada na primeira carga completa real, em 2026-08-07.
--
-- O que aconteceu
-- ---------------
-- A promoção do snapshot do HubSpot excedeu o `statement_timeout` ao publicar
-- 34.385 tickets e 3.329 negócios de uma só vez, e a execução terminou em
-- `failed` com código `timeout`.
--
-- O comportamento em si estava correto: a promoção é atômica, então o snapshot
-- anterior foi preservado e nada foi publicado pela metade. Mas a carga completa
-- ficava impossível de concluir.
--
-- Por que nunca apareceu antes
-- ----------------------------
-- A sincronização diária é incremental e promove poucas dezenas de linhas. Só a
-- carga completa expõe o custo real, que é dominado pelo gatilho de auditoria
-- por linha em `hubspot_companies`.
--
-- É o mesmo defeito que a promoção do OMIE teve, corrigido em
-- `20260806150000_omie_promotion_timeout_hardening.sql`. Esta migration leva a
-- mesma proteção para o lado do HubSpot, que havia ficado de fora.
--
-- O que muda
-- ----------
-- 1. `statement_timeout` explícito de 240s no escopo da transação de promoção.
-- 2. Trava consultiva por transação, impedindo que duas promoções simultâneas
--    disputem as mesmas linhas e multipliquem o tempo de bloqueio.
--
-- Nada além disso é alterado: a lógica de autorização, de falha, de limpeza de
-- staging e de marca d'água permanece idêntica.

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

  -- Uma carga completa publica dezenas de milhares de linhas e o gatilho de
  -- auditoria de empresas cobra por linha. O limite padrão não cobre esse caso.
  set local statement_timeout = '240s';

  -- Duas promoções concorrentes disputariam as mesmas linhas e somariam tempo de
  -- bloqueio até estourar de novo. A trava é por transação e é liberada sozinha.
  perform pg_advisory_xact_lock(hashtext('hubspot_snapshot_promotion'));

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
  'Promoção atômica do snapshot do HubSpot, endurecida para carga completa: tempo limite explícito de 240s e trava consultiva por transação. Falha continua preservando o snapshot anterior.';
