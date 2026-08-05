begin;
select plan(18);

set local request.jwt.claim.role = 'service_role';

create temporary table test_cycle_context (cycle_id uuid) on commit drop;
insert into test_cycle_context
select ((public.rpc_service_start_analytics_sync_cycle('diagnostic', null))->>'cycle_id')::uuid;

select ok((select cycle_id is not null from test_cycle_context), 'RPC cria ciclo pai com identificador');
select is((select status from public.analytics_sync_cycles where id = (select cycle_id from test_cycle_context)), 'running', 'ciclo começa em execução');
select is((select count(*)::int from public.analytics_sync_cycle_steps where cycle_id = (select cycle_id from test_cycle_context)), 2, 'ciclo cria as duas etapas');
select is((select status from public.analytics_sync_cycle_steps where cycle_id = (select cycle_id from test_cycle_context) and step_key = 'hubspot'), 'running', 'etapa HubSpot começa em execução');
select is((select status from public.analytics_sync_cycle_steps where cycle_id = (select cycle_id from test_cycle_context) and step_key = 'omie'), 'queued', 'etapa OMIE começa aguardando HubSpot');

update public.analytics_sync_cycles
set status = 'partial', current_step = 'complete', overall_result = 'partial', finished_at = timezone('utc', now()), sanitized_error = 'Uma ou mais fontes não concluíram a atualização.'
where id = (select cycle_id from test_cycle_context);
update public.analytics_sync_cycle_steps
set status = 'succeeded', finished_at = timezone('utc', now()), processed_count = 36315
where cycle_id = (select cycle_id from test_cycle_context) and step_key = 'hubspot';
update public.analytics_sync_cycle_steps
set status = 'failed', finished_at = timezone('utc', now()), sanitized_error = 'A atualização do OMIE não foi concluída.'
where cycle_id = (select cycle_id from test_cycle_context) and step_key = 'omie';

select is((select status from public.analytics_sync_cycles where id = (select cycle_id from test_cycle_context)), 'partial', 'ciclo registra resultado parcial');
select is((select overall_result from public.analytics_sync_cycles where id = (select cycle_id from test_cycle_context)), 'partial', 'ciclo registra resultado geral parcial');
select is((select status from public.analytics_sync_cycle_steps where cycle_id = (select cycle_id from test_cycle_context) and step_key = 'hubspot'), 'succeeded', 'HubSpot permanece concluído quando OMIE falha');
select is((select processed_count::int from public.analytics_sync_cycle_steps where cycle_id = (select cycle_id from test_cycle_context) and step_key = 'hubspot'), 36315, 'etapa HubSpot preserva a quantidade processada');
select is((select status from public.analytics_sync_cycle_steps where cycle_id = (select cycle_id from test_cycle_context) and step_key = 'omie'), 'failed', 'OMIE registra falha na etapa');
select ok((select sanitized_error not like '%SOAP%' from public.analytics_sync_cycle_steps where cycle_id = (select cycle_id from test_cycle_context) and step_key = 'omie'), 'etapa OMIE não persiste erro SOAP bruto');
select is((select count(*)::int from public.vw_admin_analytics_sync_history_v2 where cycle_id = (select cycle_id from test_cycle_context)), 3, 'histórico publica ciclo e suas duas etapas');

create temporary table test_orphan_context (run_id uuid, snapshot_rows bigint) on commit drop;
with inserted as (
  insert into public.hubspot_sync_runs (domain_key, status, started_at, last_heartbeat_at, provider, mode)
  values ('all', 'running', timezone('utc', now()) - interval '30 minutes', timezone('utc', now()) - interval '30 minutes', 'hubspot', 'full')
  returning id
)
insert into test_orphan_context (run_id, snapshot_rows)
select inserted.id, (select count(*) from public.analytics_finance_receivables where source_key = 'omie_receivables_api' and is_current)
from inserted;

select ok((((public.rpc_admin_reconcile_analytics_sync_runs(60))->>'hubspot')::int) >= 1, 'reconciliador encontra run HubSpot órfão');
select is((select status from public.hubspot_sync_runs where id = (select run_id from test_orphan_context)), 'timed_out', 'run HubSpot órfão vira timed_out');
select is((select error_code from public.hubspot_sync_runs where id = (select run_id from test_orphan_context)), 'EXECUTION_TIMEOUT', 'run órfão recebe código de timeout');
select ok((select sanitized_error not like '%SOAP%' from public.hubspot_sync_runs where id = (select run_id from test_orphan_context)), 'run órfão recebe erro sanitizado');
select ok((((public.rpc_admin_reconcile_analytics_sync_runs(60))->>'hubspot')::int) = 0, 'reconciliação é idempotente');
select is((select snapshot_rows from test_orphan_context limit 1), (select count(*) from public.analytics_finance_receivables where source_key = 'omie_receivables_api' and is_current), 'reconciliação não altera snapshot financeiro');

select * from finish();
rollback;
