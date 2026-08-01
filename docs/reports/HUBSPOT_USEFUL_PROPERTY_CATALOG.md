# Catálogo de propriedades HubSpot para o painel executivo

## Confirmadas no contrato local

- Deals: `deal_id`, `pipeline_id`, `dealstage`, `amount_home`, owner, `hs_created_at`, `hs_closed_at` e flags derivadas de pipeline/stage.
- Tickets: `ticket_id`, `pipeline_id`, `pipeline_stage`, `priority`, `source_type`, owner, `hs_created_at`, `hs_closed_at`, `time_to_first_response_sla_status` e `time_to_close_sla_status`.
- Catálogos: owners, pipelines e stages sincronizados para interpretação dos IDs.
- Empresas: cadastro e campos usados na reconciliação financeira, sem transformar o cadastro em indicador de Customer Success.

## Parciais ou ausentes

Relacionamentos ticket-empresa-contato, conversas, inbox, atividades, CSAT, NPS, health score e propriedades customizadas não possuem ingestão executiva confirmada. Não devem ser publicados como KPI até contrato e proveniência serem validados.

## Regra de uso

O HubSpot é fonte de origem para Comercial e Suporte no escopo atual. A leitura é somente de snapshot no aplicativo; este lote não executa escrita ou sincronização externa.
