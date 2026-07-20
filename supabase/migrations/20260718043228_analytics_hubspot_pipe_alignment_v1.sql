-- Alinhamento do pipe de CS com o pipe operacional ativo observado na conta.
-- O pipe legado Criadouro de Tíquetes | Aftersale permanece fora do dashboard
-- gerencial por misturar atendimento amplo e volume histórico.

update public.analytics_source_config
set hubspot_pipeline_id = '1429283'
where domain_key = 'cs'
  and object_type = 'ticket'
  and hubspot_pipeline_id = '5034314';

comment on table public.analytics_source_config is
  'Pipes HubSpot explicitamente selecionados por domínio; não assumir pipe legado sem validação operacional.';
