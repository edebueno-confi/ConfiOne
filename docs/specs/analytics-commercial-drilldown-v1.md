# Especificação — Comercial e Drill-down V1

Status: KPIs/funil publicados; detalhe por negócio e links contextuais são
backlog. Esta especificação não autoriza implementar o drill-down neste lote.

## Contrato atual

Fonte: Deals HubSpot sincronizados server-side. Read models observados:
`vw_analytics_commercial_kpis`, `vw_analytics_commercial_funnel`,
`vw_analytics_commercial_by_owner` e `vw_analytics_commercial_monthly`.
O frontend recebe agregados e não deve reconstruir regras a partir de títulos
ou labels.

| Métrica atual | Definição de contrato | Granularidade/período | Campos de origem | Estado |
|---|---|---|---|---|
| Total de Deals | `count(deal_id elegível)` | pipeline e período | deal_id, pipeline_id, stage_id, created_at | Publicada |
| Abertos | `count(deals não encerrados)` | pipeline e fotografia | is_closed/closed_at, stage | Publicada |
| Ganhos | `count(deals em estágio terminal ganho governado)` | pipeline e período | stage_id, is_closed, closed_at | Publicada |
| Perdidos | `count(deals em estágio terminal perdido governado)` | pipeline e período | stage_id, is_closed, closed_at | Publicada |
| Pipeline aberto | soma do valor de Deals abertos | pipeline e fotografia | amount, currency, stage | Publicada; moeda deve permanecer explícita |
| Receita ganha | soma do amount em Deals ganhos | período de fechamento | amount, closed_at, currency | Publicada |
| Conversão | `ganhos / (ganhos + perdidos)` | pipeline e período | agregados + denominador | Publicada; denominador zero = indisponível |
| Ticket médio | `receita ganha / ganhos` | período | amount + count ganhos | Publicada; sem ganhos = indisponível |
| Ciclo médio | média de `closed_at - created_at` | Deals fechados no período | timestamps | Publicada quando timestamps válidos |
| Sem owner | Deals elegíveis sem owner | pipeline e período | owner_id | Publicada |

## Drill-down necessário

O detalhe deve ser uma consulta backend paginada, com filtros enviados como
contrato e ordenação determinística. O frontend não pode montar linhas a partir
dos cards.

| Campo do detalhe | Regra | Null/qualidade | Associação |
|---|---|---|---|
| `deal_id` | ID HubSpot estável | obrigatório; ausência exclui a linha | raiz |
| nome/título | propriedade retornada pela fonte | nulo = `indisponível` | nenhuma inferência |
| pipeline/etapa | IDs e labels do catálogo sincronizado | ID sem label = ID + qualidade parcial | pipeline/stage |
| owner | ID/nome sincronizado | nulo = `Sem responsável` | owner |
| amount/currency | valor e moeda originais | nulo/moeda ausente = indisponível | política financeira |
| created/closed at | timestamps com timezone | ausente não entra em cálculos | período |
| empresa | Company associada na fonte | zero/múltiplas associações ficam explícitas | Deal↔Company |
| qualidade | `quality_status`, `observed_at`, `source_system` | obrigatório no read model | auditoria |
| link HubSpot | helper server-side com portal + deal ID validados | sem portal/ID = sem link | nenhum URL inventado |

## Link helper

O helper futuro recebe `portal_id` e `deal_id` provenientes de configuração ou
read model autorizado, valida que ambos pertencem ao tenant e só então retorna
um link contextual do portal. `VITE_HUBSPOT_PORTAL_ID` pode ser usado como
configuração pública de navegação, mas não substitui validação de associação e
não deve ser concatenado pelo componente de card. Sem portal/ID, o botão deve
ser omitido ou exibir `indisponível`.

## Auditoria de associações e API

Antes da implementação, confirmar no snapshot local se Deal↔Company é
determinístico, se há múltiplas empresas e qual associação é primária. A API
oficial de Deals documenta propriedades e paginação em [guia de
Deals](https://developers.hubspot.com/docs/api-reference/latest/crm/objects/deals/guide)
e [listagem](https://developers.hubspot.com/docs/api-reference/latest/crm/objects/deals/get-deals);
as regras de associação estão em [associações CRM](https://developers.hubspot.com/docs/api-reference/latest/crm/associations/overview).
Não criar chamada HubSpot no carregamento da tela.

## Segurança e aceite

- filtros, paginação e ordenação chegam a view/RPC com tenant explícito;
- RLS, permissão Analytics, auditoria e limites de página são obrigatórios;
- valores ausentes aparecem como indisponíveis, sem zero fabricado;
- não há alteração de Deal, Company ou pipeline neste fluxo;
- contrato typecheck, pgTAP cross-tenant, testes de paginação e QA visual em
  desktop/1024px passam antes da publicação.
