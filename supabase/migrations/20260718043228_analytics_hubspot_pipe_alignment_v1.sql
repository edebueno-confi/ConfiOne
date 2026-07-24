-- Alinhamento do pipe de CS com o pipe operacional ativo observado na conta.
-- O pipe legado Criadouro de Tíquetes | Aftersale permanece no catálogo para
-- auditoria e seleção explícita, sem ser substituído pelo pipe legado 1429283.

update public.analytics_source_config
set label = 'Criadouro de Tíquetes | Aftersale'
where domain_key = 'cs'
  and object_type = 'ticket'
  and hubspot_pipeline_id = '5034314';

comment on table public.analytics_source_config is
  'Pipes HubSpot explicitamente selecionados por domínio; não assumir pipe legado sem validação operacional.';
