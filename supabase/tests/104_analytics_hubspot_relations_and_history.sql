-- Associations e histórico de estágio: idempotência, derivação da resolução,
-- reabertura e cobertura honesta.

begin;

select plan(25);

-- ---------------------------------------------------------------------------
-- Estrutura e acesso
-- ---------------------------------------------------------------------------

select has_table('public', 'analytics_hubspot_associations', 'tabela de associations existe');
select has_table('public', 'analytics_hubspot_stage_events', 'tabela de eventos de estágio existe');
select has_table('public', 'analytics_hubspot_history_sync_state', 'marca d''água da ingestão existe');
select has_view('public', 'vw_analytics_ticket_resolution', 'resolução derivada existe');
select has_view('public', 'vw_analytics_ticket_company', 'ticket com empresa existe');

select ok(
  (select relrowsecurity from pg_class where oid = 'public.analytics_hubspot_associations'::regclass),
  'associations têm RLS habilitada'
);

select ok(
  (select relrowsecurity from pg_class where oid = 'public.analytics_hubspot_stage_events'::regclass),
  'eventos de estágio têm RLS habilitada'
);

select ok(
  not has_function_privilege(
    'authenticated',
    'public.rpc_service_upsert_hubspot_associations(text, text, jsonb, text, integer, boolean)',
    'EXECUTE'
  ),
  'gravação de vínculos é restrita ao service_role'
);

select ok(
  not has_function_privilege(
    'authenticated',
    'public.rpc_service_upsert_hubspot_stage_events(text, jsonb, text, integer, boolean)',
    'EXECUTE'
  ),
  'gravação de histórico é restrita ao service_role'
);

-- A versão de três argumentos foi substituída pela retomável; deixar as duas
-- ativas criaria dois contratos para a mesma operação.
select is(
  (select count(*)::integer from pg_proc p join pg_namespace n on n.oid = p.pronamespace
   where n.nspname = 'public' and p.proname = 'rpc_service_upsert_hubspot_associations'),
  1,
  'existe uma única assinatura de gravação de vínculos'
);

-- Um vínculo só pode apontar para tipos previstos no contrato.
select throws_ok(
  $$ insert into public.analytics_hubspot_associations (from_object_type, from_id, to_object_type, to_id)
     values ('faturas', '1', 'companies', '2') $$,
  '23514',
  null,
  'tipo de origem fora do contrato é rejeitado'
);

-- ---------------------------------------------------------------------------
-- Idempotência
-- ---------------------------------------------------------------------------

insert into public.analytics_hubspot_associations (from_object_type, from_id, to_object_type, to_id)
values ('tickets', 'rel-t1', 'companies', 'rel-c1');
insert into public.analytics_hubspot_associations (from_object_type, from_id, to_object_type, to_id)
values ('tickets', 'rel-t1', 'companies', 'rel-c1')
on conflict (from_object_type, from_id, to_object_type, to_id) do nothing;

select is(
  (select count(*)::integer from public.analytics_hubspot_associations
   where from_id = 'rel-t1' and to_id = 'rel-c1'),
  1,
  'reingerir o mesmo vínculo não duplica'
);

insert into public.analytics_hubspot_stage_events (object_type, object_id, changed_at, stage_id)
values ('ticket', 'rel-t1', '2026-03-01T10:00:00Z', 'rel-open');
insert into public.analytics_hubspot_stage_events (object_type, object_id, changed_at, stage_id)
values ('ticket', 'rel-t1', '2026-03-01T10:00:00Z', 'rel-open')
on conflict (object_type, object_id, changed_at) do nothing;

select is(
  (select count(*)::integer from public.analytics_hubspot_stage_events where object_id = 'rel-t1'),
  1,
  'reingerir o mesmo evento de estágio não duplica'
);

-- ---------------------------------------------------------------------------
-- Golden fixture: resolução, reabertura e ausência de histórico
-- ---------------------------------------------------------------------------
--
-- res-1: abre 01/03, encerra 05/03            → resolvido, 4 dias, 0 reaberturas
-- res-2: abre 01/03, encerra 03/03, reabre
--        06/03 e encerra de novo 10/03        → resolvido, 9 dias, 1 reabertura
-- res-3: abre 01/03 e continua aberto          → sem data de resolução
-- res-4: encerrado, mas sem histórico ingerido → has_history falso

insert into public.analytics_source_config (domain_key, object_type, hubspot_pipeline_id, label, is_active)
values ('cs', 'ticket', 'rel-pipe', 'Suporte de teste', true)
on conflict do nothing;

insert into public.hubspot_pipeline_stages (object_type, pipeline_id, stage_id, label, display_order, is_closed, is_won, metadata)
values
  ('ticket', 'rel-pipe', 'rs-open',   'Aberto',    1, false, false, '{"ticketState":"OPEN","isClosed":false}'::jsonb),
  ('ticket', 'rel-pipe', 'rs-closed', 'Resolvido', 2, true,  false, '{"ticketState":"CLOSED","isClosed":true}'::jsonb);

insert into public.hubspot_tickets (ticket_id, pipeline_id, pipeline_stage, hs_created_at, synced_at)
values
  ('res-1', 'rel-pipe', 'rs-closed', '2026-03-01T00:00:00Z', timezone('utc', now())),
  ('res-2', 'rel-pipe', 'rs-closed', '2026-03-01T00:00:00Z', timezone('utc', now())),
  ('res-3', 'rel-pipe', 'rs-open',   '2026-03-01T00:00:00Z', timezone('utc', now())),
  ('res-4', 'rel-pipe', 'rs-closed', '2026-03-01T00:00:00Z', timezone('utc', now()));

insert into public.analytics_hubspot_stage_events (object_type, object_id, changed_at, stage_id, pipeline_id)
values
  ('ticket', 'res-1', '2026-03-01T00:00:00Z', 'rs-open',   'rel-pipe'),
  ('ticket', 'res-1', '2026-03-05T00:00:00Z', 'rs-closed', 'rel-pipe'),
  ('ticket', 'res-2', '2026-03-01T00:00:00Z', 'rs-open',   'rel-pipe'),
  ('ticket', 'res-2', '2026-03-03T00:00:00Z', 'rs-closed', 'rel-pipe'),
  ('ticket', 'res-2', '2026-03-06T00:00:00Z', 'rs-open',   'rel-pipe'),
  ('ticket', 'res-2', '2026-03-10T00:00:00Z', 'rs-closed', 'rel-pipe'),
  ('ticket', 'res-3', '2026-03-01T00:00:00Z', 'rs-open',   'rel-pipe');

select is(
  (select resolved_at from public.vw_analytics_ticket_resolution where ticket_id = 'res-1'),
  '2026-03-05T00:00:00Z'::timestamptz,
  'data de resolução vem da entrada em estágio encerrado'
);

select is(
  (select resolution_days from public.vw_analytics_ticket_resolution where ticket_id = 'res-1'),
  4.00::numeric,
  'tempo de resolução é medido entre abertura e encerramento reais'
);

select is(
  (select reopened_count from public.vw_analytics_ticket_resolution where ticket_id = 'res-2'),
  1,
  'reabertura é contada na transição de encerrado para aberto'
);

-- Reabertura usa o último encerramento, não o primeiro.
select is(
  (select resolution_days from public.vw_analytics_ticket_resolution where ticket_id = 'res-2'),
  9.00::numeric,
  'ticket reaberto usa o encerramento mais recente'
);

select is(
  (select resolved_at from public.vw_analytics_ticket_resolution where ticket_id = 'res-3'),
  null,
  'ticket ainda aberto não recebe data de resolução'
);

select is(
  (select is_currently_open from public.vw_analytics_ticket_resolution where ticket_id = 'res-3'),
  true,
  'estado corrente do ticket é preservado'
);

-- Distinção essencial: sem histórico não é o mesmo que sem resolução.
select is(
  (select has_history from public.vw_analytics_ticket_resolution where ticket_id = 'res-4'),
  false,
  'ticket sem histórico é marcado como tal, não como não resolvido'
);

select is(
  (select resolved_at from public.vw_analytics_ticket_resolution where ticket_id = 'res-4'),
  null,
  'ticket sem histórico não recebe data inventada'
);

-- ---------------------------------------------------------------------------
-- Vínculo com empresa
-- ---------------------------------------------------------------------------

insert into public.analytics_hubspot_associations (from_object_type, from_id, to_object_type, to_id)
values ('tickets', 'res-3', 'companies', 'rel-company-1');

select is(
  (select company_id from public.vw_analytics_ticket_company where ticket_id = 'res-3'),
  'rel-company-1',
  'ticket vinculado expõe a empresa associada'
);

select is(
  (select company_id from public.vw_analytics_ticket_company where ticket_id = 'res-1'),
  null,
  'ticket sem vínculo devolve empresa nula, nunca um valor de preenchimento'
);

-- ---------------------------------------------------------------------------
-- Estado do KPI acompanha a cobertura
-- ---------------------------------------------------------------------------

select is(
  (public.rpc_analytics_support_kpis_v2('2026-03-01', '2026-03-31', 'rel-pipe', null)
    -> 'kpis' -> 'resolved_tickets' ->> 'state'),
  'partial',
  'com histórico incompleto o indicador de resolvidos fica parcial, não disponível'
);

select is(
  (public.rpc_analytics_support_kpis_v2('2026-03-01', '2026-03-31', 'rel-pipe', null)
    -> 'kpis' -> 'resolved_tickets' ->> 'value')::numeric,
  2::numeric,
  'resolvidos no período usam a data derivada do histórico'
);

select * from finish();
rollback;
