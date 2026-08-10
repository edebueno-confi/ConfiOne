begin;

select plan(19);

select has_table(
  'public',
  'analytics_company_reconciliation_decisions',
  'decisoes manuais de conciliacao ficam em tabela auditavel'
);

select has_function(
  'public',
  'rpc_analytics_company_reconciliation_queue',
  array['integer', 'integer'],
  'fila de conciliacao le candidatas sem criar vinculos'
);

select has_function(
  'public',
  'rpc_admin_decide_company_reconciliation',
  array['text', 'text', 'text', 'text', 'text', 'text'],
  'administrador confirma ou descarta uma candidata com evidencia'
);

select has_function(
  'public',
  'rpc_admin_revoke_company_reconciliation',
  array['text', 'text'],
  'administrador pode desfazer uma confirmacao'
);

select has_table(
  'audit',
  'company_reconciliation_decision_events',
  'historico imutavel registra cada decisao'
);

insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at
)
values
  (
    '00000000-0000-0000-0000-000000000000',
    'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa',
    'authenticated', 'authenticated', 'reconciliation-admin@genius.local',
    crypt('password', gen_salt('bf')), timezone('utc', now()),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Reconciliation Admin"}'::jsonb,
    timezone('utc', now()), timezone('utc', now())
  ),
  (
    '00000000-0000-0000-0000-000000000000',
    'dddddddd-dddd-4ddd-8ddd-dddddddddddd',
    'authenticated', 'authenticated', 'reconciliation-viewer@genius.local',
    crypt('password', gen_salt('bf')), timezone('utc', now()),
    '{"provider":"email","providers":["email"]}'::jsonb,
    '{"full_name":"Reconciliation Viewer"}'::jsonb,
    timezone('utc', now()), timezone('utc', now())
  )
on conflict (id) do nothing;

do $$
begin
  if exists (select 1 from public.user_global_roles where role = 'platform_admin') then
    insert into public.user_global_roles (user_id, role)
    values ('aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'::uuid, 'platform_admin'::public.platform_role)
    on conflict (user_id, role) do nothing;
  else
    perform app_private.bootstrap_first_platform_admin(
      'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'::uuid,
      'pgTAP company reconciliation'
    );
  end if;
end $$;

select ok(
  exists (
    select 1 from public.user_global_roles
    where user_id = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa'::uuid
      and role = 'platform_admin'::public.platform_role
  ),
  'fixture possui platform_admin para validar as RPCs'
);

insert into public.hubspot_companies (company_id, name, tax_id, synced_at)
values
  ('reconciliation-fixture-company', 'Empresa de Conciliacao Ltda', '12.345.678/0001-90', timezone('utc', now())),
  ('reconciliation-manual-company', 'Financeira Manual Destino Ltda', '98.765.432/0001-10', timezone('utc', now())),
  ('reconciliation-alias-company', 'Malwee Comercial', null, timezone('utc', now()));

update public.hubspot_companies
set raw = '{"razao_social":"MALWEE MALHAS LTDA","nome_fantasia___aftersale":"Malwee"}'::jsonb
where company_id = 'reconciliation-alias-company';

insert into public.analytics_finance_receivables (
  id, source_key, source_record_id, status_original, aging_bucket, client_name, client_tax_id,
  net_amount, received_amount, balance, due_date, is_current, is_cancelled, created_at, updated_at
)
values
  (
    gen_random_uuid(), 'omie_receivables_api', 'reconciliation-title-1', 'A VENCER', 'a_vencer',
    'Empresa de Conciliacao Ltda', '12.345.678/0001-90',
    321, 0, 321, current_date + 5, true, false, timezone('utc', now()), timezone('utc', now())
  ),
  (
    gen_random_uuid(), 'omie_receivables_api', 'reconciliation-title-manual', 'ATRASADO', 'atrasado',
    'Identidade Financeira Manual', null,
    654, 0, 654, current_date - 7, true, false, timezone('utc', now()), timezone('utc', now())
  ),
  (
    gen_random_uuid(), 'omie_receivables_api', 'reconciliation-title-alias', 'A VENCER', 'a_vencer',
    'MALWEE MALHAS LTDA', null,
    987, 0, 987, current_date + 3, true, false, timezone('utc', now()), timezone('utc', now())
  );

select is(
  app_private.company_reconciliation_source_key('Empresa de Conciliacao Ltda', '12.345.678/0001-90'),
  'tax:12345678000190',
  'a identidade financeira prioriza o CNPJ normalizado'
);

set local role authenticated;
set local request.jwt.claim.role = 'authenticated';
set local request.jwt.claim.sub = 'aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa';

select ok(
  public.rpc_analytics_company_reconciliation_queue(100, 0) @? '$.items[*] ? (@.source_key == "tax:12345678000190" && @.candidates[*].company_id == "reconciliation-fixture-company")',
  'fila devolve a candidata real, sem criar vinculo automaticamente'
);

select ok(
  public.rpc_analytics_company_reconciliation_queue(100, 0) @? '$.items[*] ? (@.source_key == "name:MALWEE MALHAS" && @.candidates[*].company_id == "reconciliation-alias-company")',
  'fila encontra razao social e nome fantasia armazenados no cache do HubSpot como candidatos para revisao'
);

select ok(
  public.rpc_analytics_finance_unmatched_clients(null, 100) @? '$[*] ? (@.client == "MALWEE MALHAS LTDA" && @.name_matches > 0)',
  'lista financeira sinaliza candidata por identidade alternativa sem marcar conciliacao automatica'
);

select is(
  public.rpc_admin_decide_company_reconciliation(
    'tax:12345678000190', 'Empresa de Conciliacao Ltda', '12.345.678/0001-90',
    'reconciliation-fixture-company', 'confirmed', 'CNPJ conferido no contrato financeiro'
  ) ->> 'status',
  'confirmed',
  'platform_admin confirma vinculacao com evidencia'
);

select is(
  public.rpc_analytics_company_reconciliation_queue(100, 0) @? '$.items[*] ? (@.source_key == "tax:12345678000190" && @.status == "confirmed")',
  true,
  'confirmacao passa a aparecer na fila sem expor a tabela de decisoes'
);

select ok(
  not has_table_privilege('authenticated', 'public.analytics_company_reconciliation_decisions', 'SELECT'),
  'tabela de decisoes continua fechada ao usuario autenticado'
);

select ok(
  not has_table_privilege('authenticated', 'audit.company_reconciliation_decision_events', 'SELECT'),
  'historico de auditoria continua fechado ao usuario autenticado'
);

select is(
  public.rpc_admin_decide_company_reconciliation(
    'name:IDENTIDADE FINANCEIRA MANUAL', 'Identidade Financeira Manual', null,
    'reconciliation-manual-company', 'confirmed', 'Razao social confirmada pela operacao financeira'
  ) ->> 'status',
  'confirmed',
  'operador autorizado pode resolver uma identidade sem CNPJ'
);

select ok(
  public.rpc_analytics_ceo_snapshot(null, current_date) @? '$.financial_alerts[*] ? (@.company_id == "reconciliation-manual-company" && @.match_method == "manual")',
  'vinculo manual confirmado passa a compor o cruzamento executivo'
);

select ok(
  (public.rpc_analytics_finance_snapshot(null, null, null, null, null) #>> '{cs_reconciliation,matched_balance}')::numeric >= 975,
  'vinculo manual confirmado tambem entra no saldo conciliado da carteira financeira'
);

select ok(
  not public.rpc_analytics_finance_unmatched_clients(null, 100) @? '$[*] ? (@.client == "Identidade Financeira Manual")',
  'vinculo manual confirmado deixa de ser listado como pendencia financeira'
);

set local request.jwt.claim.sub = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';

select throws_ok(
  $$ select public.rpc_admin_revoke_company_reconciliation('tax:12345678000190', 'tentativa sem permissao') $$,
  '42501',
  'Acesso negado.',
  'usuario sem platform_admin nao altera uma conciliacao'
);

select * from finish();

rollback;
