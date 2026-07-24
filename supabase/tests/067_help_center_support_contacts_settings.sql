begin;

select plan(7);

select has_view(
  'public',
  'vw_admin_knowledge_space_support_contacts',
  'existe read model administrativo dos contatos da Central de Ajuda'
);

select has_function(
  'public',
  'rpc_admin_update_knowledge_space_support_contacts',
  array['uuid', 'text', 'text', 'text', 'text', 'text'],
  'existe RPC auditada para atualizar contatos da Central'
);

select has_column(
  'public',
  'vw_public_knowledge_space_resolver',
  'support_contacts',
  'resolver público continua expondo o contrato de contatos'
);

select ok(
  has_table_privilege('anon', 'public.vw_public_knowledge_space_resolver', 'select'),
  'anon pode ler apenas o read model público sanitizado'
);

select ok(
  has_table_privilege('authenticated', 'public.vw_public_knowledge_space_resolver', 'select'),
  'authenticated pode ler o read model público sanitizado'
);

select ok(
  not has_table_privilege('anon', 'public.vw_admin_knowledge_space_support_contacts', 'select'),
  'anon não lê o view administrativo'
);

select ok(
  has_function_privilege(
    'authenticated',
    'public.rpc_admin_update_knowledge_space_support_contacts(uuid,text,text,text,text,text)',
    'execute'
  ),
  'authenticated recebe execute apenas na RPC administrativa governada'
);

select * from finish();
rollback;
