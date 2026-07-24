-- Permite que a view pública e a policy de storage avaliem a regra de leitura
-- sem expor a tabela de assets nem transformar o bucket em público.
grant execute on function app_private.can_read_knowledge_article_asset(
  uuid,
  public.knowledge_visibility,
  public.knowledge_article_asset_review_status,
  boolean
) to anon, authenticated, service_role;

comment on function app_private.can_read_knowledge_article_asset(
  uuid,
  public.knowledge_visibility,
  public.knowledge_article_asset_review_status,
  boolean
) is
  'Decide se um asset pode ser lido na camada publica ou administrativa; o acesso anonimo continua limitado a artigo published/public, asset approved/public e nao bloqueado.';
