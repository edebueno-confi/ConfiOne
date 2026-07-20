-- Preserva o nome oficial do pipeline retornado pelo HubSpot separado do alias
-- interno usado pelo Dashboard Gerencial.

alter table public.analytics_source_config
  add column if not exists hubspot_pipeline_label text;

comment on column public.analytics_source_config.hubspot_pipeline_label is
  'Nome oficial do pipeline retornado pela API do HubSpot. Somente leitura no GSO; o alias operacional permanece em label.';
