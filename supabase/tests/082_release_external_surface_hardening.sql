begin;

select plan(18);

select ok(
  to_regprocedure('public.rls_auto_enable()') is null
    or not has_function_privilege('anon', 'public.rls_auto_enable()', 'execute'),
  'anon não executa rls_auto_enable'
);

select ok(
  not has_function_privilege('anon', 'public.rpc_admin_create_brand(text,text,text,integer)', 'execute'),
  'anon não executa RPC administrativa de brands'
);
select ok(
  not has_function_privilege('anon', 'public.rpc_admin_create_conversation_type(text,text,text,text,integer)', 'execute'),
  'anon não executa RPC administrativa de tipos de conversa'
);
select ok(
  not has_function_privilege('anon', 'public.rpc_admin_create_customer_segment(text,text,text,text,integer)', 'execute'),
  'anon não executa RPC administrativa de segmentos'
);
select ok(
  not has_function_privilege('anon', 'public.rpc_admin_create_priority_level(text,text,integer,text,integer)', 'execute'),
  'anon não executa RPC administrativa de prioridades'
);
select ok(
  not has_function_privilege('anon', 'public.rpc_admin_create_quick_reply(text,text,integer)', 'execute'),
  'anon não executa RPC administrativa de respostas rápidas'
);
select ok(
  not has_function_privilege('anon', 'public.rpc_support_get_ticket_timeline(uuid,integer,timestamptz,uuid)', 'execute'),
  'anon não executa timeline de suporte'
);
select ok(
  not has_function_privilege('anon', 'public.rpc_support_set_ticket_conversation_type(uuid,text)', 'execute'),
  'anon não executa alteração de tipo de conversa'
);

select ok(
  has_function_privilege('anon', 'public.rpc_public_search_knowledge_articles(text,text,integer)', 'execute'),
  'anon mantém busca pública da Central'
);
select ok(
  has_function_privilege('anon', 'app_private.can_read_knowledge_article_asset(uuid,knowledge_visibility,knowledge_article_asset_review_status,boolean)', 'execute'),
  'anon mantém helper necessário para assets públicos aprovados'
);

select ok(not has_table_privilege('anon', 'public.analytics_finance_receivables_staging', 'select'), 'anon não lê staging financeiro');
select ok(not has_table_privilege('authenticated', 'public.analytics_finance_receivables_staging', 'select'), 'authenticated não lê staging financeiro');
select ok(not has_table_privilege('anon', 'public.analytics_spreadsheet_rows', 'select'), 'anon não lê linhas de importação');
select ok(not has_table_privilege('authenticated', 'public.analytics_spreadsheet_rows', 'select'), 'authenticated não lê linhas de importação');
select ok(not has_table_privilege('anon', 'public.ticket_attachment_download_grants', 'select'), 'anon não lê grants de download');
select ok(not has_table_privilege('authenticated', 'public.ticket_attachment_download_grants', 'select'), 'authenticated não lê grants de download');

select ok(
  has_table_privilege('anon', 'public.vw_public_knowledge_navigation', 'select'),
  'anon mantém navegação pública da Central'
);
select ok(
  (select count(*) = 0 from public.analytics_integration_schedule where enabled),
  'nenhum agendamento permanece ativo'
);

select * from finish();
rollback;
