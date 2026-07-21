-- Garante o catálogo completo de pipelines CS em bases que receberam o antigo
-- alinhamento por substituição. O pipe legado e o Criadouro são registros
-- distintos e só entram no recorte quando estiverem ativos/configurados.

insert into public.analytics_source_config (
  domain_key, object_type, hubspot_pipeline_id, label, is_active
)
values
  ('cs', 'ticket', '5034314', 'Criadouro de Tíquetes | Aftersale', true),
  ('cs', 'ticket', '1429283', 'Suporte', true)
on conflict (domain_key, object_type, hubspot_pipeline_id)
do update set
  label = excluded.label,
  is_active = true,
  updated_at = timezone('utc', now());

comment on table public.analytics_source_config is
  'Catálogo de fontes HubSpot por domínio; pipelines históricos permanecem disponíveis para seleção e auditoria.';
