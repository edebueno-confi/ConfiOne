begin;

select plan(9);

select ok(
  to_regclass('public.vw_analytics_spreadsheet_import_runs_read') is not null,
  'histórico de importações possui read model seguro'
);

select ok(
  has_table_privilege(
    'authenticated',
    'public.vw_analytics_spreadsheet_import_runs_read',
    'SELECT'
  ),
  'authenticated possui somente leitura no read model de importações'
);

select ok(
  not has_table_privilege(
    'authenticated',
    'public.analytics_spreadsheet_import_runs',
    'SELECT'
  ),
  'authenticated não lê diretamente a tabela bruta de importações'
);

select ok(
  not has_table_privilege(
    'authenticated',
    'public.vw_analytics_spreadsheet_import_runs_read',
    'INSERT'
  ),
  'authenticated nao insere no read model de importacoes'
);

select ok(
  not has_table_privilege(
    'authenticated',
    'public.vw_analytics_spreadsheet_import_runs_read',
    'UPDATE'
  ),
  'authenticated nao atualiza o read model de importacoes'
);

select lives_ok(
  $$
    update public.analytics_integration_schedule
       set hubspot_enabled = true,
           hubspot_frequency = 'daily'
     where id = true
  $$,
  'atualização do singleton booleano não quebra o trigger de auditoria'
);

select ok(
  to_regprocedure('public.rpc_admin_set_sync_schedules(boolean,text,boolean,text)') is not null,
  'RPC de agendamento mantém a assinatura estável'
);

select ok(
  (select data_type from information_schema.columns
    where table_schema = 'public'
      and table_name = 'analytics_integration_schedule'
      and column_name = 'id') = 'boolean',
  'singleton da agenda mantém o tipo booleano compatível'
);

select ok(
  pg_get_viewdef('public.vw_analytics_spreadsheet_import_runs_read'::regclass) like '%original_filename%'
    and pg_get_viewdef('public.vw_analytics_spreadsheet_import_runs_read'::regclass) like '%platform_admin%',
  'read model expõe colunas necessárias e restringe a platform_admin'
);

select * from finish();
rollback;
