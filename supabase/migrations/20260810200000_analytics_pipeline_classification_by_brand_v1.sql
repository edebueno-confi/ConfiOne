-- Classificacao canonica dos pipelines do HubSpot por area e operacao do grupo.
--
-- CONTEXTO
-- O catalogo local conhecia 6 de 24 pipelines de ticket e nenhum pipeline
-- estava classificado como Customer Success, o que deixava a aba CS do
-- dashboard sem numero. O pipeline 1429283 e "CS | Neotrust" no HubSpot, mas
-- estava gravado como area_key='support' e sem operacao definida.
--
-- FONTE DA VERDADE
-- Rotulos lidos do HubSpot em 2026-08-10 via propriedades `pipeline` (deals) e
-- `hs_pipeline` (tickets). O prefixo de icone identifica a operacao do grupo:
--   heart roxo  -> Aftersale
--   lupa        -> Confi
--   grafico     -> Neotrust
--   olho        -> Confi Analytics
--   sem icone   -> operacao a definir
--
-- REGRA DE PRODUTO
-- Ingerir tudo, usar no dashboard apenas o que for decidido. A linha sempre
-- existe no catalogo; `is_active = false` remove do dashboard sem perder o
-- registro nem impedir inclusao futura.
--
-- Idempotente: pode ser reexecutada. Nao apaga linha, nao altera dado
-- operacional, nao toca RLS nem permissao.

begin;

-- NAO ha area 'product' aqui, por decisao de produto: a aba Produto e
-- Desenvolvimento do dashboard sera alimentada pelo contrato GitHub, nao por
-- pipeline de ticket do HubSpot. Os pipelines "Bug | Aftersale" e
-- "User Stories | Aftersale" continuam sendo ingeridos, mas ficam fora do
-- dashboard (is_active = false) ate existir destino proprio para eles.
-- O CHECK de area_key permanece intacto.

-- Classificacao ------------------------------------------------------------
with catalogo (domain_key, object_type, hubspot_pipeline_id, rotulo, area_key, group_company, is_active) as (
  values
    -- DEALS ----------------------------------------------------------------
    ('commercial','deal','5014418',  'Aquisicao | Aftersale',              'commercial',      'Aftersale',       true),
    ('commercial','deal','5051729',  'Pre-POC | Aftersale',                'commercial',      'Aftersale',       true),
    ('commercial','deal','5038166',  'Hunting - Parcerias MKT | Aftersale','commercial',      'Aftersale',       true),
    ('commercial','deal','892833861','Piloto Aftersale',                   'commercial',      'Aftersale',       true),
    ('commercial','deal','5038168',  'Expansao - Retracao | Aftersale',    'customer_success','Aftersale',       true),
    ('commercial','deal','5014421',  'Retencao de Churn | Aftersale',      'customer_success','Aftersale',       true),
    ('commercial','deal','10888352', 'Renovacao Contratual',               'customer_success','Aftersale',       true),
    ('commercial','deal','918743098','Gestao CS',                          'customer_success','a_definir',       true),
    ('commercial','deal','727372071','Pipe de Vendas',                     'commercial',      'a_definir',       true),
    ('commercial','deal','11065107', 'Black Friday - Hora Hora',           'commercial',      'a_definir',       true),
    ('commercial','deal','890074168','Gerenciamento Faturamento',          'commercial',      'a_definir',       true),

    -- TICKETS --------------------------------------------------------------
    ('cs','ticket','1429283',  'CS | Neotrust',                          'customer_success','Neotrust',        true),
    ('cs','ticket','1585486',  'Onboarding - B2B | Confi',               'customer_success','Confi',           true),
    ('cs','ticket','2013870',  'Suporte B2B | Confi',                    'support',         'Confi',           true),
    ('cs','ticket','841635',   'Suporte B2C | Confi',                    'support',         'Confi',           true),
    ('cs','ticket','23949674', 'Fale conosco | Confi',                   'support',         'Confi',           true),
    ('cs','ticket','95268403', 'Confi | Whatsapp',                       'support',         'Confi',           true),
    ('cs','ticket','53130860', 'Atendimento | Confi Analytics',          'support',         'Confi Analytics', true),
    ('cs','ticket','5038170',  'Onboarding Trocas e Devolucoes | Aftersale','customer_success','Aftersale',    true),
    ('cs','ticket','5080662',  'Onboarding Jornada de Entrega | Aftersale', 'customer_success','Aftersale',    true),
    ('cs','ticket','5034314',  'Criadouro de Tiquetes | Aftersale',      'support',         'Aftersale',       true),
    ('cs','ticket','5014430',  'Tarefas manuais | Aftersale',            'support',         'Aftersale',       true),
    ('cs','ticket','149481576','Aftersale - Processo Atendimento Samsung','support',        'Aftersale',       true),
    ('cs','ticket','5423143',  'POC | Aftersale',                        'commercial',      'Aftersale',       true),
    -- Ingeridos, fora do dashboard: destino sera a aba Produto e
    -- Desenvolvimento, que depende do contrato GitHub e nao do HubSpot.
    ('cs','ticket','5433491',  'Bug | Aftersale',                        'a_classificar',   'Aftersale',       false),
    ('cs','ticket','5034315',  'User Stories | Aftersale',               'a_classificar',   'Aftersale',       false),
    ('cs','ticket','918901665','CS | Gestao de Carteira',                'customer_success','a_definir',       true),
    ('cs','ticket','917379333','CS | Onboarding e Migracao',             'customer_success','a_definir',       true),
    ('cs','ticket','750874202','Customer Sucess',                        'customer_success','a_definir',       true),
    ('cs','ticket','751323779','Jornada do Cliente',                     'customer_success','a_definir',       true),
    ('cs','ticket','10909186', 'Retencao Churn',                         'customer_success','a_definir',       true),
    ('cs','ticket','9904973',  'Demanda de clientes novos',              'customer_success','a_definir',       true),
    ('cs','ticket','16235599', 'Service Desk',                           'support',         'a_definir',       true),

    -- Ingeridos, deliberadamente FORA do dashboard (is_active = false).
    -- Permanecem no catalogo e podem ser incluidos depois sem reimportacao.
    ('cs','ticket','1530793',  'Seguranca da Informacao',                'a_classificar',   'a_definir',       false),
    ('cs','ticket','738183788','Backoffice',                             'a_classificar',   'a_definir',       false)
)
insert into public.analytics_source_config as alvo (
  domain_key,
  object_type,
  hubspot_pipeline_id,
  hubspot_pipeline_label,
  area_key,
  classification_source,
  group_company,
  group_company_source,
  is_active,
  is_archived
)
select
  c.domain_key,
  c.object_type,
  c.hubspot_pipeline_id,
  c.rotulo,
  c.area_key,
  'confirmed',
  c.group_company,
  case when c.group_company = 'a_definir' then 'pending' else 'confirmed' end,
  c.is_active,
  false
from catalogo c
on conflict (domain_key, object_type, hubspot_pipeline_id) do update
set
  hubspot_pipeline_label = excluded.hubspot_pipeline_label,
  area_key               = excluded.area_key,
  classification_source  = excluded.classification_source,
  group_company          = excluded.group_company,
  group_company_source   = excluded.group_company_source,
  is_active              = excluded.is_active,
  is_archived            = false,
  updated_at             = timezone('utc', now());

commit;
