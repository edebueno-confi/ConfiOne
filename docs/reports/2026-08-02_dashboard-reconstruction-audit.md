# Auditoria de reconstrução do Dashboard Gerencial — 2026-08-02

## Escopo e estado observado

- Checkout canônico: `C:\Projetos\GSO-old`.
- Branch: `codex/dashboard-management-rebuild-20260802`.
- HEAD observado: `ade706a`.
- `origin/main...HEAD`: `0 53`.
- Upstream da branch de trabalho: não configurado.
- Worktree: limpo antes desta auditoria.
- Worktrees ativos: 1.
- Stash preservado: `stash@{0}`.
- Nenhuma operação destrutiva, push, merge, rebase, reset, clean ou migration foi executada nesta etapa.

O estado informado no texto de autorização (`main`, `c3976241...`, upstream configurado) não corresponde ao checkout real atual. O estado real acima prevalece; nenhum histórico foi descartado.

## AtualizaÃ§Ã£o apÃ³s a implementaÃ§Ã£o e reconciliaÃ§Ã£o local

O estado observado acima Ã© uma fotografia prÃ©-implementaÃ§Ã£o. Durante este lote,
as correÃ§Ãµes abaixo foram aplicadas de forma forward-only no checkout canÃ´nico:

- `dashboard_viewer` passou a consultar as cinco Ã¡reas publicadas; a UI continua sem aÃ§Ãµes administrativas de sincronizaÃ§Ã£o.
- O histÃ³rico de execuÃ§Ãµes passou a separar HubSpot e OMIE, sem publicar planilhas.
- A superfÃ­cie de IntegraÃ§Ãµes passou a exibir somente HubSpot e OMIE, com campos API, ativo, escopo/recurso e substituiÃ§Ã£o segura de credencial.
- O componente de integraÃ§Ã£o morto `IntegrationSettingsPanel.tsx` foi removido por nÃ£o possuir consumidor.
- As migrations `20260802050000_dashboard_sync_history_api_only_v1.sql` e `20260802060000_dashboard_local_scheduler_guard_v1.sql` foram aplicadas somente no banco local persistente.
- A migration `20260727033235_access_01_internal_control_plane.sql` jÃ¡ estava materializada no schema, mas ausente no histÃ³rico local; o histÃ³rico foi reparado como `applied`, sem reexecutar SQL destrutivo.
- O job legado `analytics-hubspot-daily-incremental` foi confirmado ausente no banco local; nenhum scheduler remoto foi ativado.

ValidaÃ§Ãµes do estado pÃ³s-implementaÃ§Ã£o:

- `web:build`, `quality:changed`, `quality:module -- apps/web/src/features/analytics` e typechecks passaram.
- pgTAP focado `088` + `089`: 37/37 asserÃ§Ãµes passaram.
- `supabase:test:db` completo permanece parcial no banco persistente, pois fixtures antigas inserem UUIDs fixos e colidem sem reset; nenhum reset foi executado.
- QA autenticado em `127.0.0.1:4173`: VisÃ£o Geral, Customer Success, Financeiro, IntegraÃ§Ãµes e HistÃ³rico carregaram; console sem erros.
- Capturas reais foram gravadas em `docs/reports/visual-audit/screenshots/` para claro/escuro, desktop 1440x900 e mobile 390x844. O servidor isolado `4180` carregou, mas permaneceu sem sessÃ£o autenticada.

As capturas e a validaÃ§Ã£o visual nÃ£o executaram botÃµes de salvar, sincronizar,
diagnÃ³stico ou atualizaÃ§Ã£o. Sync real HubSpot/OMIE continua dependente de
credenciais externas autorizadas e nÃ£o foi declarado validado.

## Matriz de estado

| Domínio | Componente atual | Fonte | Contrato | Estado observado | Ação necessária |
|---|---|---|---|---|---|
| Resumo Gerencial | `AnalyticsCeoPage.tsx` | HubSpot + OMIE API | `rpc_analytics_ceo_snapshot` | Frontend e migration forward-only existem; override API-only ainda não aplicado ao banco | Aplicar/validar read model e confirmar estados sem planilha |
| Comercial | `AnalyticsCommercialPage.tsx` | HubSpot Deals | `rpc_analytics_commercial_snapshot` | Consumidor RPC real, filtros e estados presentes | Validar fonte, fórmula, permissões e viewport |
| Customer Success | `AnalyticsCustomerSuccessPage.tsx` | HubSpot Companies | `rpc_analytics_customer_success_snapshot` | Componente dedicado existe; RPC está somente na migration `20260802030000` e a captura autenticada retornou indisponível | Aplicar migration local, executar pgTAP e recapturar |
| Suporte & Chat | `AnalyticsCsPage.tsx` via `AnalyticsSupportPage.tsx` | HubSpot Tickets; Chat factual | `rpc_analytics_cs_snapshot` | Consumidor RPC real; Chat não é inferido de `source_type` | Validar estados e contrato de Chat indisponível |
| Financeiro | `AnalyticsFinancePage.tsx` | OMIE API | `rpc_analytics_finance_snapshot` e `rpc_analytics_finance_source_status` | Snapshot API-only; status ainda publica chave textual `fallback` e o copy aponta para histórico de importações | Remover sinal legado da superfície ativa e testar contrato |
| Configurações > Integrações | `ManagedIntegrationPanel` em `SettingsPage.tsx` | Vault + `managed_integrations` | `rpc_admin_upsert_managed_integration` | Campos HubSpot/OMIE e ações protegidas por `platform_admin` presentes | Remover panorama GitHub desta tela e validar permissões |
| Configurações > Histórico | `AnalyticsLogsPage.tsx` | Runs HubSpot | `listHubspotSyncRuns` | Lista somente HubSpot; OMIE não aparece | Criar leitura consolidada/individual de HubSpot e OMIE |
| Scheduler | `analytics-scheduled-run` | Agenda única | `analytics-sequential-sync` | Scheduler chama ciclo sequencial; migration altera RPC de agenda, ainda não aplicada | Aplicar e testar concorrência, falhas parciais e status |
| Sincronização HubSpot | `hubspot-orchestrator-*`, `hubspot-sync` | HubSpot API | runs HubSpot | Executor independente presente | Validar preflight/run sem write externo |
| Sincronização OMIE | `omie-sync` | OMIE API | `analytics_finance_sync_runs` | Executor independente presente | Validar preflight/run sem write externo |
| Planilhas | `analytics-spreadsheet-import`, tabelas históricas e migrações | Histórico/migração | contratos históricos | Sem consumidor frontend ativo do Dashboard; funções de migração permanecem | Preservar histórico; remover apenas consumidores ativos e copy/configuração vigente |
| Permissões | `internal-route-access`, `analytics-permissions` | Contexto Auth/RLS | `can_read_analytics`, `platform_admin`, `dashboard_viewer` | Ações de integração exigem `platform_admin`; viewer é limitado à leitura do Dashboard | Confirmar acesso aos cinco domínios e ausência de ações para viewer |

## Inventário de planilhas e fallback

### Consumidores ativos ou potencialmente ativos

- `supabase/functions/analytics-spreadsheet-import/index.ts`: ingestão histórica ainda existente; não é chamada pelo frontend atual e não deve ser apagada sem decisão sobre migração/auditoria.
- `supabase/functions/hubspot-cs-migration/index.ts`: usa o histórico de importação para uma migração operacional separada; não é fonte do Dashboard, portanto permanece fora do escopo de remoção física.
- `analytics-model.ts` e `settings-api.ts`: carregam nomes/tipos legados que podem induzir fallback ou providers históricos; devem ser estreitados na superfície ativa sem quebrar o histórico de banco.

### Código sem consumidor identificado

- O componente morto `IntegrationSettingsPanel.tsx` não possuía import ou consumidor no código atual e foi removido no commit `13ac83e`.

### Histórico que deve permanecer

- Migrations de staging/importação de planilhas.
- Testes pgTAP que comprovam RLS/auditoria do histórico.
- Relatórios e entradas históricas de `PROJECT_STATE.md` e ledger.

## Catálogo preliminar de métricas

| Métrica/sinal | Domínio | Fonte/campo | Status |
|---|---|---|---|
| Negócios totais, abertos, ganhos, receita, conversão | Comercial | RPC HubSpot Deals | Contrato real; validar fórmula no banco |
| Tickets totais, abertos, encerrados, prioridade e status | Suporte | RPC HubSpot Tickets | Contrato real; Chat separado |
| Empresas, status de cliente/contrato, owner | Customer Success | RPC dedicada sobre `hubspot_companies` | Contrato novo; dependente de migration não aplicada |
| Títulos, saldo, vencido, aging, recebidos | Financeiro | RPC OMIE API e `analytics_finance_receivables.source_key = 'omie_receivables_api'` | Contrato real API-only |
| Receita e alertas executivos | Resumo | RPC CEO composta | Depende do override API-only e de dados frescos |
| Health, cliente ativo, risco, Chat e MRR | CS/Resumo | Sem contrato confirmado completo | Deve permanecer `Indisponível`, sem inferência |

## Decisões de implementação decorrentes

1. Não editar nem apagar migrations históricas de planilha.
2. Criar somente migrations forward-only para retirar chaves/consumidores da superfície publicada.
3. Manter HubSpot e OMIE como executores independentes; o scheduler permanece único e sequencial.
4. Não executar write externo; sync real só será classificado após preflight e credencial autorizada.
5. Validar `platform_admin` para configuração/execução e `dashboard_viewer` apenas para leitura.
6. Não declarar o lote concluído antes de aplicar/validar as migrations locais, executar os testes SQL possíveis e gerar a matriz visual exigida.
