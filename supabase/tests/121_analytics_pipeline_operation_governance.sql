begin;

select plan(25);

insert into public.analytics_source_config (
  domain_key,
  object_type,
  hubspot_pipeline_id,
  label,
  area_key,
  classification_source,
  discovery_status,
  group_company,
  group_company_source
) values
  ('commercial', 'deal', 'fdata-suggested-deal', 'Fixture sugerida', 'commercial', 'admin', 'active', 'Operacao sugerida', 'suggested'),
  ('cs', 'ticket', 'fdata-ambiguous-ticket', 'Fixture ambigua A', 'support', 'admin', 'active', 'Operacao A', 'confirmed'),
  ('support', 'ticket', 'fdata-ambiguous-ticket', 'Fixture ambigua B', 'support', 'admin', 'active', 'Operacao B', 'confirmed');

insert into public.analytics_source_config (
  domain_key,
  object_type,
  hubspot_pipeline_id,
  label,
  area_key,
  classification_source,
  discovery_status,
  group_company,
  group_company_source
) values
  ('cs', 'ticket', 'fdata-cs-zero-association', 'Fixture CS sem associacao', 'customer_success', 'admin', 'active', 'Operacao sem cobertura', 'confirmed');

insert into public.hubspot_pipeline_stages (
  object_type, pipeline_id, stage_id, label, display_order, is_closed, is_won, metadata
) values
  ('deal', 'fdata-suggested-deal', 'open', 'Aberto', 1, false, false, '{}'::jsonb),
  ('ticket', 'fdata-ambiguous-ticket', 'open', 'Aberto', 1, false, false, '{"ticketState":"OPEN"}'::jsonb);

insert into public.hubspot_deals (deal_id, pipeline_id, dealstage, hs_created_at, synced_at)
values ('fdata-suggested-deal-row', 'fdata-suggested-deal', 'open', '2026-08-01T09:00:00Z', timezone('utc', now()));

insert into public.hubspot_tickets (ticket_id, pipeline_id, pipeline_stage, hs_created_at, synced_at)
values
  ('fdata-ambiguous-ticket-row', 'fdata-ambiguous-ticket', 'open', '2026-08-01T09:00:00Z', timezone('utc', now())),
  ('fdata-cs-zero-association-row', 'fdata-cs-zero-association', 'open', '2026-08-01T09:00:00Z', timezone('utc', now()));

select has_function(
  'public',
  'rpc_analytics_pipeline_inventory',
  array['text'],
  'inventario canonico aceita objeto deal ou ticket'
);

select has_function(
  'public',
  'rpc_analytics_customer_success_kpis_by_operation',
  array['text'],
  'Customer Success aceita escopo de operacao server-side'
);

select has_column(
  'public',
  'vw_admin_analytics_pipeline_catalog_v2',
  'group_company_source',
  'catalogo publica a origem da operacao'
);

select has_column(
  'public',
  'vw_admin_analytics_pipeline_catalog_v2',
  'area_key',
  'catalogo publica a area do pipeline'
);

select ok(
  not exists (
    select 1 from public.analytics_source_config
    where lower(coalesce(area_key, '')) in ('finance', 'financial', 'financeiro')
  ),
  'Financeiro nao e incluido no mapa de dimensao operacional'
);

select ok(
  position('mapping_state' in pg_get_functiondef('public.rpc_analytics_pipeline_inventory(text)'::regprocedure)) > 0,
  'inventario explicita o estado do mapeamento'
);

select ok(
  position('ambiguous' in pg_get_functiondef('public.rpc_analytics_pipeline_inventory(text)'::regprocedure)) > 0,
  'inventario preserva mapeamentos ambiguos para triagem'
);

select ok(
  position('analytics_pipeline_operation_eligible' in pg_get_functiondef('public.rpc_analytics_customer_success_kpis_by_operation(text)'::regprocedure)) > 0,
  'Customer Success exige classificacao confirmada'
);

select ok(
  position('analytics_hubspot_associations' in pg_get_functiondef('public.rpc_analytics_customer_success_kpis_v2()'::regprocedure)) > 0,
  'Customer Success usa associacao ticket-empresa real no recorte'
);

select ok(
  not has_function_privilege('anon', 'public.rpc_analytics_customer_success_kpis_by_operation(text)', 'EXECUTE'),
  'anonimo nao le Customer Success por operacao'
);

select ok(
  has_function_privilege(
    'authenticated',
    'public.rpc_analytics_customer_success_kpis_by_operation(text)',
    'EXECUTE'
  ),
  'usuario autenticado recebe somente o wrapper publicado'
);

select ok(
  position('confirmed ticket pipeline -> company association' in pg_get_functiondef('public.rpc_analytics_customer_success_kpis_by_operation(text)'::regprocedure)) > 0,
  'wrapper registra a proveniencia do escopo'
);

select has_function(
  'app_private',
  'analytics_pipeline_operation_eligible',
  array['text', 'text', 'text', 'text'],
  'elegibilidade canonica e server-side'
);

select ok(
  not app_private.analytics_pipeline_operation_eligible('deal', 'fdata-suggested-deal', 'Operacao sugerida', 'commercial'),
  'pipeline suggested nao e elegivel para KPI publicado'
);

select ok(
  not app_private.analytics_pipeline_operation_eligible('ticket', 'fdata-ambiguous-ticket', 'Operacao A', 'support'),
  'pipeline ambiguous nao e elegivel para KPI publicado'
);

select ok(
  position('analytics_pipeline_operation_eligible' in pg_get_functiondef('public.rpc_analytics_commercial_kpis_v2(date,date,text,text)'::regprocedure)) > 0,
  'KPI comercial aplica elegibilidade canonica'
);

select ok(
  position('analytics_pipeline_operation_eligible' in pg_get_functiondef('public.rpc_analytics_support_kpis_v2(date,date,text,text)'::regprocedure)) > 0,
  'KPI de suporte aplica elegibilidade canonica'
);

select ok(
  position('analytics_pipeline_operation_eligible' in pg_get_functiondef('public.rpc_analytics_commercial_snapshot_by_operation(date,date,text,text,text[],text)'::regprocedure)) > 0,
  'snapshot comercial aplica elegibilidade canonica'
);

select ok(
  position('analytics_pipeline_operation_eligible' in pg_get_functiondef('public.rpc_analytics_cs_snapshot_by_operation(date,date,text,text,text[],text)'::regprocedure)) > 0,
  'snapshot de Customer Success aplica elegibilidade canonica'
);

select ok(
  position('ticket_company_association_missing' in pg_get_functiondef('public.rpc_analytics_customer_success_kpis_by_operation(text)'::regprocedure)) > 0
    and position('ticket_company_association_partial' in pg_get_functiondef('public.rpc_analytics_customer_success_kpis_by_operation(text)'::regprocedure)) > 0,
  'Customer Success diferencia cobertura ticket-empresa ausente e parcial'
);

select is(
  coalesce((public.rpc_analytics_commercial_kpis_by_operation('2026-08-01', '2026-08-01', null, 'Operacao sugerida') -> 'kpis' -> 'total_deals' ->> 'value')::integer, 0),
  0,
  'KPI comercial exclui pipeline suggested mesmo com registro fixture'
);

select is(
  (public.rpc_analytics_commercial_snapshot_by_operation(null, null, null, null, '{}'::text[], 'Operacao sugerida') -> 'kpis' ->> 'total_deals')::integer,
  0,
  'snapshot comercial exclui pipeline suggested'
);

select is(
  (public.rpc_analytics_support_kpis_by_operation('2026-08-01', '2026-08-01', null, 'Operacao A') -> 'kpis' -> 'created_tickets' ->> 'value')::integer,
  0,
  'KPI de suporte exclui pipeline ambiguous'
);

select is(
  (public.rpc_analytics_cs_snapshot_by_operation(null, null, null, null, '{}'::text[], 'Operacao A') -> 'kpis' ->> 'total_tickets')::integer,
  0,
  'snapshot de suporte exclui pipeline ambiguous'
);

select is(
  public.rpc_analytics_customer_success_kpis_by_operation('Operacao sem cobertura') #>> '{operation_scope,state}',
  'unavailable',
  'Customer Success marca pipeline confirmado sem associacao como unavailable'
);

select * from finish();

rollback;
