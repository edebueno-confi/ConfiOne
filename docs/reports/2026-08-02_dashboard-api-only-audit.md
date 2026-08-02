# Auditoria do Dashboard Gerencial - API-only

**Data:** 2026-08-02
**Checkout:** `C:\Projetos\GSO-old`
**Branch:** `codex/dashboard-management-rebuild-20260802`
**HEAD de inicio preservado em:** `refs/archive/dashboard-rebuild-start-20260802`

## Objetivo

Registrar o estado factual antes da reconstrucao do Dashboard Gerencial. O
Dashboard publicado deve operar com contratos backend reais, sem planilha como
fonte, fallback ou contingencia, e sem apagar migrations, dados historicos ou
artefatos de QA que ainda sejam necessarios para auditoria.

## Estado Git de entrada

- Worktree limpo antes da auditoria.
- Branch de trabalho criada a partir de `b121b446d743a0d84928456b0d4ef66c10007f55`.
- `origin/main...HEAD`: `0 44`; a branch local contem 44 commits alem do
  `origin/main` observado no inicio deste lote.
- Nenhuma operacao destrutiva, integracao de branch, push ou alteracao remota
  foi executada neste lote.

## Superficies ativas e fonte contratual

| Superficie | Entrada atual | Fonte aprovada para o lote | Situacao observada | Acao do lote |
|---|---|---|---|---|
| Resumo Gerencial | `rpc_analytics_ceo_snapshot` e historico | HubSpot + OMIE API por read models/RPCs | Publicado; ainda carrega blocos Produto/Desenvolvimento no modelo | Manter cinco areas ativas e retirar Produto/Desenvolvimento da navegacao e do resumo publicado |
| Comercial | `rpc_analytics_commercial_snapshot` | HubSpot Deals, pipelines, stages e owners | Publicado e server-side | Preservar contrato, revisar estados de vazio/frescor e visual |
| Customer Success | `AnalyticsCustomerSuccessPage` | HubSpot Companies/Deals somente quando houver contrato confirmado | A pagina publicada esta indisponivel; o resumo CEO possui campos de CS, mas isso nao constitui uma pagina CS completa | Nao inventar carteira/health; publicar apenas dados confirmados ou indisponibilidade factual |
| Suporte & Chat | `rpc_analytics_cs_snapshot` | HubSpot Tickets; Conversations/Inbox/Chat somente com contrato real | Tickets existem; rotulos de origem nao provam integracao de chat | Renomear a area e separar ticket confirmado de Chat indisponivel |
| Financeiro | `rpc_analytics_finance_snapshot` | OMIE API, `source_key = omie_receivables_api` | Migration `20260802004655_analytics_finance_omie_only_contract_v1.sql` ja impede fallback de planilha no snapshot | Manter API-only; remover referencia de planilha da superficie ativa e preservar historico |
| Configuracoes/Integracoes | `AnalyticsConfigPage` em Settings | RPCs administrativos e status sanitizado | Ainda contem upload, listagem e dry-run/aplicacao de CS Ops | Remover acoes de planilha da UI; preservar backend historico de migracao |
| Historico | `AnalyticsLogsPage` | Logs de sincronizacao HubSpot | Nao e fonte de metrica | Manter como observabilidade de sincronizacao, sem promover planilha a fonte |

## Consumidores de planilha classificados

### Consumidores ativos que precisam sair da superficie publicada

- `apps/web/src/features/analytics/AnalyticsConfigPage.tsx` importa e chama
  `triggerCsOpsSpreadsheetImport`, `listCsOpsImportRuns` e
  `runCsOpsMigration`; tambem oferece upload, dry-run e aplicacao.
- `apps/web/src/features/analytics/analytics-model.ts` expoe o objeto
  `FinanceSourceStatus.spreadsheet`, embora o snapshot financeiro publicado ja
  seja somente OMIE.
- `apps/web/src/features/analytics/analytics-api.ts` mantem exports de upload
  e leitura de lotes. Eles devem deixar de ser chamados pela UI do Dashboard;
  a remocao fisica sera decidida apos a checagem de consumidores e testes.

### Codigo historico que deve ser preservado neste lote

- `supabase/functions/analytics-spreadsheet-import` e
  `supabase/functions/hubspot-cs-migration`: fluxo de staging e migracao
  auditavel, sem promocao para fonte operacional do Dashboard.
- Tabelas, views, migrations e testes `analytics_spreadsheet_*` que registram
  proveniencia, hash, rejeicoes e dry-run.
- Fixtures, parsers e relatorios historicos de CS Ops/financeiro/comercial.
- Documentos historicos que descrevem ciclos anteriores; eles nao devem ser
  reescritos como se a decisao API-only tivesse existido no passado.

## Gaps e riscos de contrato

1. A migration OMIE-only ainda publica metadados historicos de planilha no RPC
   `rpc_analytics_finance_source_status`. Isso nao alimenta o snapshot, mas
   permite que a UI continue exibindo a planilha. A superficie ativa deve
   consumir apenas configuracao, execucao, frescor e estado OMIE.
2. O modelo CEO ainda contem `product` e `development`. O codigo pode ser
   preservado, mas esses blocos nao devem aparecer como areas ativas no Dashboard
   deste lote.
3. O suporte atual observa labels de origem de tickets. Isso nao e evidencia de
   HubSpot Conversations/Inbox/Chat; Chat deve ser marcado como indisponivel ate
   existir read model ou RPC confirmado.
4. `toNumber` e agregacoes SQL usam zero em alguns caminhos. Zero so e valido
   quando o contrato backend confirma uma contagem/valor igual a zero; ausencia
   de fonte, campo ou snapshot deve manter estado de indisponibilidade.
5. A execucao manual combinada existente (`runIntegrationNow`) e compatibilidade
   e nao substitui os executores independentes HubSpot e OMIE nem o orquestrador
   sequencial HubSpot -> OMIE requerido para este lote.

## Decisoes de implementacao

- As cinco areas ativas serao `ceo`, `commercial`, `customer_success`,
  `support` e `finance`; Produto e Desenvolvimento permanecem no repositorio,
  mas fora da navegacao e dos cards ativos.
- O frontend continuara consumindo somente views/read models/RPCs e estados de
  qualidade/frescor fornecidos pelo backend.
- A planilha nao sera consultada para preencher vazio, indisponibilidade ou
  fallback. O historico sera preservado e ficara fora do caminho operacional.
- A fonte OMIE API pode aparecer como `Indisponivel`, `Nao configurada`,
  `Sincronizando`, `Desatualizada` ou `Erro`, conforme o contrato real; nenhum
  zero sera fabricado para mascarar ausencia.
- Nenhuma migration sera aplicada ao banco local neste ciclo sem uma etapa
  explicita de validacao/autorizacao; nao sera executado `db reset`.

## Proxima etapa autorizada

Auditar o catalogo de metricas e os contratos RPC/migrations exatos, depois
implementar em commits pequenos: contrato/modelo, primitivas visuais, resumo,
Comercial, CS, Suporte & Chat, Financeiro, remocao da UI de planilha,
executores/orquestracao, testes e evidencias.
