# DASHBOARD-02 — Catálogo funcional do Dashboard

## Escopo e método

Catálogo baseado no roteador, páginas, APIs, views/RPCs, contratos e testes existentes na branch `codex/dashboard-02-foundation`. A qualidade indica confiança do contrato e da fonte, não a existência de dados locais. Nenhuma operação HubSpot/OMIE real foi executada.

| Domínio | Feature / rota | Usuário e origem | Contrato / interação | Estado, qualidade e testes | UX, risco e recomendação |
|---|---|---|---|---|---|
| Executivo | Visão executiva `/admin/analytics` | admin e `dashboard_viewer`; snapshots HubSpot/OMIE | `rpc_analytics_ceo_snapshot`, `rpc_analytics_ceo_history`, filtros de período | Completo no contrato, parcial em cobertura; alta/média; testes de estado e snapshot | Mistura desempenho e posição atual; risco de interpretação; preservar e reorganizar |
| Comercial | Snapshot `/admin/analytics/commercial` | admin; HubSpot deals e pipelines | `rpc_analytics_commercial_snapshot`, `rpc_analytics_commercial_funnel` | Contrato real, qualidade dependente de sync; testes de filtros | Muitos pipelines e detalhe concorrente; consolidar e levar detalhe para rota futura |
| Comercial | Funil e responsáveis | admin; views comerciais | views `vw_analytics_commercial_*`; filtros owner/stage | Real, cobertura focada; média | Boa investigação, baixa prioridade executiva; preservar sob demanda |
| CS | Snapshot `/admin/analytics/cs` | admin com escopo CS; HubSpot tickets | `rpc_analytics_cs_snapshot`, catálogo/exclusão de pipelines | Real, parcial quando pipeline não sincroniza; testes de exclusão | Precisa explicar volume, risco e frescor; preservar e resumir |
| CS | Carteira e status | admin/CS; read model de portfolio | `vw_cs_customer_portfolio`, `listCsCustomerPortfolio` | Real, dependente de grants; testes DB | Não deve aparecer no viewer; manter fora do escopo |
| Financeiro | Snapshot `/admin/analytics/finance` | admin; OMIE/read models | `rpc_analytics_finance_snapshot` e status da fonte | Real, qualidade condicionada à importação; testes financeiros | Separar posição atual do período; preservar |
| Financeiro | Recebíveis e não conciliados | admin; OMIE + reconciliação HubSpot | RPCs `rpc_analytics_finance_unmatched_clients` e relacionados | Real, auditável; cobertura DB existente | Detalhe pesado para rota/subtela; consolidar |
| Logs | `/admin/logs` | admin; view governada de runs | `vw_analytics_dashboard_sync_status`, filtro de status | Real após least privilege; qualidade média; smoke autenticado bloqueia viewer | Detalhe técnico não cabe no executivo; preservar para admin |
| Configuração | `/admin/analytics/config` | platform admin; configs analíticas | views de leitura e RPC administrativo | Real, escrita administrativa; testes de grants | Nunca expor ao viewer; preservar |
| Integrações | sincronização HubSpot/OMIE | platform admin; Edge Functions | `hubspot-sync`, `analytics-integration-run`, `triggerOmieSync` | Real, sem execução neste lote; risco externo alto | Ação deve exigir permissão e confirmação; manter fora do viewer |
| Agendamento | configuração diária/horária | platform admin | `rpc_admin_set_sync_schedules` e view de leitura | Real; bug UUID/true é backlog separado | Feedback e auditoria necessários; preservar com correção independente |
| Pipelines | catálogo e exclusões | admin; `analytics_source_config` | `vw_analytics_dashboard_pipeline_catalog`, RPC upsert | Real; 17 pipelines, qualidade desigual | Resumo até cinco; detalhe futuro `/admin/analytics/pipelines` |
| Indicadores | estados de frescor/cobertura | todos os perfis autorizados | contrato `AnalyticsMetricResult` | Fundação concluída; testes determinísticos | Preservar como linguagem transversal |
| Filtros | período, owner, estágio, prioridade | conforme domínio | estado local da página e RPCs | Real, comportamento desigual | Persistência/reset devem ser unificados no futuro |
| Exportação | relatório/CSV quando disponível | admin | ações de páginas e contratos existentes | Não comprovada como uniforme; revisão necessária | Não incluir no viewer até verificar vazamento; auditar |
| Reconciliação | qualidade e ambiguidade | admin | `rpc_analytics_ceo_reconciliation_quality_grouped` | Real, dados dependentes de matching; testes DB | Deve ser detalhe investigativo, não KPI primário |
| Componentes legados | funções `getCommercialKpis`, `getCsKpis` e helpers antigos | código sem uso confirmado | APIs/views anteriores aos snapshots | Legado/sem uso confirmado; cobertura baixa | Mapear consumidores, depois remover somente com evidência |

## Classificação consolidada

- Com contrato e uso ativo: visão executiva, comercial, CS, financeiro, logs, configuração, filtros, estados, sincronização governada e reconciliação.
- Parciais: cobertura de fontes, histórico/correlação de runs, qualidade financeira e densidade visual com dados reais.
- Não comprovadas: exportações uniformes e alguns helpers antigos.
- Não implementadas neste lote: `/admin/analytics/pipelines`, novo redesign produtivo e tombstones/watermarks por pipeline.

## Limites

`dashboard_viewer` só recebe o contrato de Analytics. O perfil não recebe telas, tabelas brutas, RPCs administrativos ou o portal. As views públicas do Dashboard sanitizam mensagens de erro; detalhes de investigação continuam sendo responsabilidade de superfícies administrativas autorizadas.
