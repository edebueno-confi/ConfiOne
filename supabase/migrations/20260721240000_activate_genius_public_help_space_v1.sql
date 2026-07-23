-- Ativa a Central Genius criada pelo bootstrap para que artigos publicados
-- possam ser lidos pelo contrato publico da Central de Ajuda.
-- A operacao e idempotente e nao publica artigos por si só.
update public.knowledge_spaces
set
  status = 'active'::public.knowledge_space_status,
  updated_at = now()
where slug = 'genius'
  and status = 'draft'::public.knowledge_space_status;

