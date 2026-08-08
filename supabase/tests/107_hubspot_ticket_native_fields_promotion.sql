-- Campos nativos de ticket precisam atravessar staging e promocao atomica.
-- Sem esta cadeia, uma carga completa pode terminar com sucesso sem preencher
-- os atributos que destravam os indicadores do Dashboard.

begin;

select plan(19);

select has_column('public', 'analytics_cs_ticket_staging', 'subject', 'staging guarda o assunto do ticket');
select has_column('public', 'analytics_cs_ticket_staging', 'first_agent_reply_at', 'staging guarda a primeira resposta do agente');
select has_column('public', 'analytics_cs_ticket_staging', 'reopened_at', 'staging guarda a reabertura nativa');
select has_column('public', 'analytics_cs_ticket_staging', 'time_to_close_ms', 'staging guarda o tempo de fechamento nativo');
select has_column('public', 'analytics_cs_ticket_staging', 'is_one_touch', 'staging guarda o indicador de atendimento em um toque');
select has_column('public', 'analytics_cs_ticket_staging', 'closure_type', 'staging guarda o tipo de fechamento informado');
select has_column('public', 'analytics_cs_ticket_staging', 'closure_marked_at', 'staging guarda a data de marcacao do fechamento');
select has_column('public', 'analytics_cs_ticket_staging', 'resolution_note', 'staging guarda a observacao de resolucao');

select ok(
  position('subject' in pg_get_functiondef('public.rpc_analytics_hubspot_finalize_run(uuid)'::regprocedure)) > 0
    and position('first_agent_reply_at' in pg_get_functiondef('public.rpc_analytics_hubspot_finalize_run(uuid)'::regprocedure)) > 0
    and position('reopened_at' in pg_get_functiondef('public.rpc_analytics_hubspot_finalize_run(uuid)'::regprocedure)) > 0
    and position('is_one_touch' in pg_get_functiondef('public.rpc_analytics_hubspot_finalize_run(uuid)'::regprocedure)) > 0,
  'finalizador promove os campos nativos de ticket'
);

select ok(
  position('closure_type' in pg_get_functiondef('public.rpc_analytics_hubspot_finalize_run(uuid)'::regprocedure)) > 0
    and position('closure_marked_at' in pg_get_functiondef('public.rpc_analytics_hubspot_finalize_run(uuid)'::regprocedure)) > 0
    and position('resolution_note' in pg_get_functiondef('public.rpc_analytics_hubspot_finalize_run(uuid)'::regprocedure)) > 0,
  'finalizador promove os campos de fechamento sem interpreta-los'
);

-- Prova comportamental: uma pagina ja marcada como concluida e promovida pelo
-- mesmo finalizador usado pelo worker. O teste roda em transacao e nao deixa
-- ticket, run ou staging persistidos.
set local request.jwt.claim.role = 'service_role';

create temporary table native_ticket_promotion_context (
  run_id uuid not null
) on commit drop;

with inserted as (
  insert into public.hubspot_sync_runs (
    provider, domain_key, domains, mode, status, correlation_id, heartbeat_at
  ) values (
    'hubspot', 'all', array['cs'], 'full', 'running',
    extensions.gen_random_uuid(), timezone('utc', now())
  )
  returning id
)
insert into native_ticket_promotion_context (run_id)
select id from inserted;

insert into public.analytics_cs_sync_work_items (
  parent_run_id, domain_key, object_type, pipeline_id, status, finished_at
)
select run_id, 'cs', 'ticket', 'native-promotion-pipeline', 'succeeded', timezone('utc', now())
from native_ticket_promotion_context;

insert into public.analytics_cs_ticket_staging (
  parent_run_id, pipeline_id, ticket_id, subject, first_agent_reply_at, reopened_at,
  time_to_close_ms, is_one_touch, closure_type, closure_marked_at, resolution_note, raw
)
select
  run_id, 'native-promotion-pipeline', 'native-promotion-ticket',
  'Assunto trazido da origem', '2026-08-01T10:00:00Z', '2026-08-02T10:00:00Z',
  7200000, true, 'Solicitacao concluida', '2026-08-03T10:00:00Z',
  'Resolvido pela operacao', '{}'::jsonb
from native_ticket_promotion_context;

select is(
  (select public.rpc_analytics_hubspot_finalize_run(run_id) ->> 'status'
   from native_ticket_promotion_context),
  'success',
  'finalizador conclui o run com os campos nativos no staging'
);

select is((select subject from public.hubspot_tickets where ticket_id = 'native-promotion-ticket'), 'Assunto trazido da origem', 'promocao persiste o assunto');
select is((select first_agent_reply_at from public.hubspot_tickets where ticket_id = 'native-promotion-ticket'), '2026-08-01T10:00:00Z'::timestamptz, 'promocao persiste a primeira resposta');
select is((select reopened_at from public.hubspot_tickets where ticket_id = 'native-promotion-ticket'), '2026-08-02T10:00:00Z'::timestamptz, 'promocao persiste a reabertura');
select is((select time_to_close_ms from public.hubspot_tickets where ticket_id = 'native-promotion-ticket'), 7200000::numeric, 'promocao persiste o tempo nativo de fechamento');
select is((select is_one_touch from public.hubspot_tickets where ticket_id = 'native-promotion-ticket'), true, 'promocao persiste o indicador de um toque');
select is((select closure_type from public.hubspot_tickets where ticket_id = 'native-promotion-ticket'), 'Solicitacao concluida', 'promocao persiste o tipo de fechamento sem interpreta-lo');
select is((select closure_marked_at from public.hubspot_tickets where ticket_id = 'native-promotion-ticket'), '2026-08-03T10:00:00Z'::timestamptz, 'promocao persiste a data de marcacao');
select is((select resolution_note from public.hubspot_tickets where ticket_id = 'native-promotion-ticket'), 'Resolvido pela operacao', 'promocao persiste a observacao de resolucao');

select * from finish();

rollback;
