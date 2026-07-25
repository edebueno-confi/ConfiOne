# DASHBOARD-02.1 — Fundação de confiança

## Contrato e matriz de indicadores

O contrato compartilhado está em `packages/contracts/src/analytics.ts` e o
classificador em `apps/web/src/features/analytics/analytics-state.ts`.

| Indicador | Tipo temporal | Fonte | Filtro de período | Zero/empty |
| --- | --- | --- | --- | --- |
| Pipeline aberto | period_flow | HubSpot Deals | sim | `0` é valor válido; sem registros é `empty` |
| Receita ganha | period_flow | HubSpot Deals | sim | igual ao anterior |
| Conversão | period_flow | HubSpot Deals | sim | percentual calculado no backend |
| Tickets criados/abertos | period_flow | HubSpot Tickets | sim | `0` é valor válido |
| Saldo em aberto/vencido | current_position | OMIE/read model | não | posição atual, nunca apresentada como “sem dados” só por filtro |
| Clientes com alerta | current_position | OMIE + reconciliação HubSpot | não | zero significa nenhum alerta reconciliado |
| Aging/projeções | snapshot | OMIE | não | data de consulta e frescor explícitos |
| Comparação histórica | accumulated | snapshots aprovados | conforme snapshot | depende de ambas as fontes |

Cada bloco pode informar `fresh`, `stale`, `partial`, `empty`,
`not_configured`, `syncing`, `unavailable` ou `error`, com fonte, `asOf`,
último sync, correlação e cobertura.

## Frescor e reconciliação

HubSpot, OMIE, planilhas e fontes internas preservam a frequência que estiver
configurada; frequência desconhecida permanece `unknown`. A auditoria local
encontrou runs separados de HubSpot, OMIE e planilhas, sem correlação comum.
Não foi criado modelo paralelo nem chamada externa. O inventário de pipelines e
os limites da reconciliação estão em
`DASHBOARD_02_PIPELINE_INVENTORY_2026-07-24.md`.

## Permissões

A migration forward-only `20260724230314_dashboard_viewer_analytics_least_privilege.sql`
exige perfil ativo, mantém o viewer no shell de Analytics e direciona leituras
operacionais para views de leitura. Escritas e tabelas brutas permanecem fora
do grant do viewer. Nenhuma migration remota foi executada.

## Fixtures e blueprint

Fixtures determinísticas locais estão em `tests/fixtures/analytics/` e cobrem
zero, vazio, stale, partial, not configured, unavailable, syncing e error. O
blueprint futuro está em `DASHBOARD_02_UX_BLUEPRINT_2026-07-24.md`; não houve
redesign completo neste lote.
