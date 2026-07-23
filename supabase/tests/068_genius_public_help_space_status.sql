create extension if not exists pgtap with schema extensions;

begin;

select plan(2);

select ok(
  to_regclass('public.knowledge_spaces') is not null,
  'tabela de espacos de conhecimento existe'
);

select is(
  (
    select status::text
    from public.knowledge_spaces
    where slug = 'genius'
    limit 1
  ),
  'active',
  'Central Genius permanece ativa para leitura publica'
);

select * from finish();
rollback;
