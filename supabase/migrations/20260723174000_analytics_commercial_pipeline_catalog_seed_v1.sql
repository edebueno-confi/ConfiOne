-- Bootstrap do catalogo comercial confirmado no portal HubSpot 20108050.
-- A descoberta dinamica do hubspot-sync continua sendo a fonte de atualizacao;
-- este lote apenas deixa o ambiente local navegavel antes do primeiro sync.
-- Novos pipelines entram inativos para nao alterar silenciosamente o recorte.

insert into public.analytics_source_config (
  domain_key,
  object_type,
  hubspot_pipeline_id,
  hubspot_pipeline_label,
  label,
  is_active
)
values
  ('commercial', 'deal', '5014418', 'Aquisicao | Aftersale', null, false),
  ('commercial', 'deal', '5038168', 'Expansao - Retracao | Aftersale', null, false),
  ('commercial', 'deal', '5051729', 'Pre-POC | Aftersale', null, false),
  ('commercial', 'deal', '5014421', 'Retencao de Churn | Aftersale', null, false),
  ('commercial', 'deal', '5038166', 'Hunting - Parcerias MKT | Aftersale', null, false),
  ('commercial', 'deal', '918743098', 'Carteira CS', null, false),
  ('commercial', 'deal', '10888352', 'Renovacao Contratual', null, false),
  ('commercial', 'deal', '727372071', 'Pipe de Vendas', null, false),
  ('commercial', 'deal', '11065107', 'Black Friday - Hora Hora', null, false),
  ('commercial', 'deal', '890074168', 'Gerenciamento Faturamento', null, false),
  ('commercial', 'deal', '892833861', 'Piloto Aftersale', 'Comercial Aftersale', true)
on conflict (domain_key, object_type, hubspot_pipeline_id)
do update set
  hubspot_pipeline_label = excluded.hubspot_pipeline_label,
  updated_at = timezone('utc', now());

comment on table public.analytics_source_config is
  'Catalogo de fontes HubSpot por dominio; pipelines comerciais descobertos permanecem inativos ate selecao explicita do administrador.';
