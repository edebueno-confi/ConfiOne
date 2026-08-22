create extension if not exists pgtap with schema extensions;

begin;

select plan(40);

select has_table('public', 'customer_account_sources', 'origens do cliente existem');
select has_table('public', 'customer_account_stores', 'lojas do cliente existem');
select has_table('public', 'customer_inventory_snapshots', 'snapshots de inventario existem');
select has_table('public', 'customer_inventory_feature_observations', 'observacoes de funcionalidades existem');
select has_table('public', 'customer_operation_evidence', 'metadados de evidencia existem');
select has_table('public', 'customer_projects', 'projetos genericos existem');
select has_table('public', 'customer_migration_projects', 'especializacao de migracao existe');
select has_table('public', 'customer_migration_project_stores', 'escopo de lojas do projeto existe');
select has_table('public', 'customer_migration_eligibility_evaluations', 'avaliacoes de elegibilidade existem');
select has_table('public', 'customer_migration_batches', 'lotes existem');
select has_table('public', 'customer_migration_waves', 'levas existem');
select has_table('public', 'customer_migration_batch_items', 'itens de lote existem');
select has_table('public', 'customer_project_comments', 'comentarios de projeto existem');
select has_table('public', 'customer_project_activities', 'atividades de projeto existem');
select has_table('public', 'customer_migration_approvals', 'aprovacoes de migracao existem');
select has_table('public', 'customer_migration_execution_requests', 'solicitacoes de execucao existem');
select has_table('public', 'customer_migration_validation_results', 'resultados de validacao existem');

select has_view('public', 'vw_admin_customer_operations_directory', 'diretorio operacional existe');
select has_view('public', 'vw_admin_customer_inventory_observations', 'read model de inventario existe');
select has_view('public', 'vw_admin_customer_migration_kanban', 'read model de kanban existe');

select ok((select relrowsecurity from pg_class where oid = 'public.customer_projects'::regclass), 'projetos possuem RLS');
select ok((select relrowsecurity from pg_class where oid = 'public.customer_inventory_snapshots'::regclass), 'snapshots possuem RLS');
select is((select count(*)::integer from pg_policies where schemaname = 'public' and tablename = 'customer_projects'), 1, 'projetos possuem politica de leitura sem DML direto');
select is((select count(*)::integer from information_schema.role_table_grants where table_schema = 'public' and table_name = 'customer_projects' and grantee = 'anon'), 0, 'anon nao acessa projetos');

select ok(app_private.customer_migration_project_status_is_valid_transition('draft', 'inventory_pending'), 'draft pode iniciar inventario');
select ok(app_private.customer_migration_project_status_is_valid_transition('ready_to_execute', 'running'), 'projeto aprovado pode executar');
select ok(app_private.customer_migration_project_status_is_valid_transition('running', 'validating'), 'execucao pode entrar em validacao');
select ok(not app_private.customer_migration_project_status_is_valid_transition('completed', 'running'), 'projeto concluido nao volta para execucao');
select ok(not app_private.customer_migration_project_status_is_valid_transition('draft', 'completed'), 'projeto em rascunho nao pula para concluido');

select is((select count(*)::integer from pg_enum e join pg_type t on t.oid = e.enumtypid where t.typname = 'customer_source_product' and e.enumlabel in ('after_sale', 'genius')), 2, 'origens After Sale e Genius sao explicitas');
select is((select count(*)::integer from pg_enum e join pg_type t on t.oid = e.enumtypid where t.typname = 'customer_migration_validation_status' and e.enumlabel in ('validated', 'validated_with_reservation', 'divergent', 'not_validated', 'interrupted')), 5, 'validacao possui estados explicitos');

select has_function('public', 'rpc_admin_upsert_customer_source', 'RPC de origem existe');
select has_function('public', 'rpc_admin_upsert_customer_store', 'RPC de loja existe');
select has_function('public', 'rpc_admin_import_customer_inventory_snapshot', 'RPC idempotente de inventario existe');
select has_function('public', 'rpc_admin_create_customer_migration_project', 'RPC de projeto de migracao existe');
select has_function('public', 'rpc_admin_approve_customer_migration', 'RPC de aprovacao existe');
select has_function('public', 'rpc_admin_request_customer_migration_execution', 'RPC de solicitacao de executor existe');
select has_function('public', 'rpc_admin_record_customer_migration_validation', 'RPC de validacao existe');
select ok((select count(*) from pg_indexes where schemaname = 'public' and indexname = 'customer_migration_validation_execution_store_key') = 1, 'validacao por execucao e loja e idempotente');
select is((select count(*)::integer from information_schema.routine_privileges where routine_schema = 'public' and routine_name = 'rpc_admin_link_migration_project_store' and grantee = 'anon' and privilege_type = 'EXECUTE'), 0, 'vinculo de loja nao e publico');

select * from finish();
rollback;
