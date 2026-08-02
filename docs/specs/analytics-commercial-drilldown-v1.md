# Especificação — Comercial e Drill-down V1

Status: KPIs e funil existentes; drill-down por negócio ainda é backlog.

## Contrato atual

Fonte: HubSpot Deals sincronizado server-side. Read models atuais:
`vw_analytics_commercial_kpis`, `vw_analytics_commercial_funnel`,
`vw_analytics_commercial_by_owner` e `vw_analytics_commercial_monthly`.

As métricas usam os metadados de pipeline/etapa sincronizados. Ganho/perda não
deve ser inferido pelo rótulo visual. Receita usa o valor doméstico disponível;
moeda e política financeira precisam permanecer explícitas.

## Drill-down necessário

O detalhe deve ser uma consulta paginada por `deal_id`, com pipeline, etapa,
owner, valor, moeda, datas de criação/fechamento, empresa associada, qualidade e
link contextual para o portal HubSpot. O frontend não deve montar detalhes a
partir de cards agregados.

Antes da implementação, auditar o modelo de associações e decidir se o link
empresa-negócio é garantido pelo snapshot local ou se precisa de ingestão
adicional. A API oficial de Deals exige escopo de leitura e suporta paginação,
propriedades e associações: [guia de Deals](https://developers.hubspot.com/docs/api-reference/latest/crm/objects/deals/guide),
[listagem de Deals](https://developers.hubspot.com/docs/api-reference/latest/crm/objects/deals/get-deals)
e [associações](https://developers.hubspot.com/docs/api-reference/latest/crm/associations/overview).

## Aceite

- filtros são enviados ao backend;
- paginação e ordenação são determinísticas;
- valores ausentes aparecem como indisponíveis;
- acesso respeita tenant, RLS e permissão;
- link externo usa portal e ID validados, sem inventar URL;
- sem chamada HubSpot no carregamento da tela.
