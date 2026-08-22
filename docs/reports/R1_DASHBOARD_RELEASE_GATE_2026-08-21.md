# R1 Dashboard Release Gate V1

## Estado e escopo

- Task: `R1-DASHBOARD-RELEASE-GATE-2026-08-21`
- Base: `9cafdaf3b30d9581821a519933b5d74e0763dd32`
- Tipo: auditoria local de contratos, read models, componentes e testes.
- Nenhuma chamada externa, escrita em HubSpot/OMIE, alteração de secret,
  migration remota, RLS/RPC, grant ou shell global foi executada.

Este relatório não cria KPI, endpoint ou fonte. Código executável, migrations,
contratos e testes locais prevalecem sobre documentação histórica.

## Matriz executiva

| Superfície | Fonte/contrato real | Recorte e filtros | Estado auditável | Limitações |
|---|---|---|---|---|
| Visão Geral | `rpc_analytics_executive_kpis_v2` e `rpc_analytics_ceo_snapshot` | chamadas separadas para período e posição atual; composição dos domínios | disponível por bloco; ausência preserva `unavailable`/`partial` | Produto/Desenvolvimento não tem KPI numérico publicado |
| Comercial | `rpc_analytics_commercial_kpis_by_operation`, snapshots e views `vw_analytics_commercial_*` | período, owner, stage, pipeline/operação server-side; posição aberta separada de coortes | `available`, `partial` ou `awaiting_history` por KPI | aging/conversão histórica dependem de série de transições |
| Customer Success | `rpc_analytics_customer_success_kpis_by_operation` e read models de empresas, tickets e vínculo financeiro | carteira atual; grupo/operação quando suportado pelo contrato | `partial`/`unavailable` quando cobertura empresa, financeiro ou tickets é insuficiente | não inferir carteira por catálogo ou ausência de associação |
| Suporte | `rpc_analytics_support_kpis_by_operation` e `rpc_analytics_cs_snapshot_by_operation` | período, prioridade, stage e operação; fila corrente é posição | estados de cobertura, frescor, SLA e histórico | fila local e analytics HubSpot são contratos distintos |
| Financeiro | `rpc_analytics_finance_snapshot`, `rpc_analytics_finance_source_status` e read model OMIE | status/aging e cliente; posição atual baseada no livro financeiro | `fresh`, `stale`, `partial`, `failed` ou `unavailable` | recebimento por data de pagamento exige movimento/read model próprio; não é fluxo inferido do recorte por vencimento |
| Produto/Desenvolvimento | contrato de espera `product`/`development` no snapshot; `AnalyticsUnavailablePages` | sem filtro ou KPI publicado | `not_configured`/`unavailable` explícito | GitHub, PR, release, deployment, throughput e lead time não possuem read model local publicado |

## Semântica de data e posição

- Comercial usa `hs_created_at` para criados e `hs_closed_at` para ganhos,
  perdas, conversão e ciclos. Pipeline aberto é posição pelo estágio atual.
- Suporte distingue `hs_created_at`, resolução, primeira resposta e estado
  corrente. `open_backlog` não é “aberto no período”.
- Customer Success é posição atual de empresas/clientes e depende de cobertura
  de associações e vínculo HubSpot-OMIE.
- Financeiro distingue vencimento/emissão, saldo corrente e data de pagamento.
  A consulta atual do snapshot não deve ser apresentada como recebimento no
  período sem o contrato de movimentos correspondente.
- O timezone operacional é `America/Sao_Paulo`, com timestamps de origem em UTC,
  início inclusivo e fim exclusivo conforme o contrato temporal.

## Todas versus operação

O filtro de operação passa por RPCs server-side e pelo mapa canônico de pipeline,
área e operação. A UI publica somente operações confirmadas e não oferece
configurações sugeridas, pendentes ou ambíguas. `Todas` significa ausência de
recorte operacional, não soma manual de cards filtrados. Financeiro fica fora
dessa dimensão conforme o contrato atual.

## Refresh, 503 e ausência

`rpc_analytics_source_status`, `vw_analytics_dashboard_sync_status` e os read
models de sync fornecem frescor, execução e erro. `analytics-sync-errors.mjs`
separa timeout, 502/503, execução em andamento e falha de fonte. Payload vazio,
sem metadado confiável ou sem cobertura não vira zero silenciosamente. O caso
`/admin/tenants` em `release-surface.test.mjs` permanece uma falha preexistente
fora desta task e não foi alterado.

## Visualizações e acessibilidade

Os testes locais confirmam que a navegação por domínio, tabs, gráficos de série,
legendas, tooltips e estados de KPI mantêm semântica explícita. A escolha é por
pergunta: cards para posição, tabelas/funil para composição, séries para
evolução e estados textuais para ausência. Não houve QA visual autenticado neste
runner.

## Classificação de lacunas

- Fato local: contratos e RPCs acima existem no código/migrations versionados.
- Fato local: Produto/Desenvolvimento não tem read model analítico publicado.
- Fato local: Financeiro possui read model de recebíveis, mas a semântica de
  recebido por data de pagamento depende de movimentos OMIE não ingeridos como
  contrato publicado.
- Hipótese não validada: disponibilidade atual de credenciais, volume remoto,
  rate limits ou configuração do portal HubSpot/OMIE.
- Próximo lote: qualquer ingestão GitHub ou movimentos OMIE, se autorizada, deve
  criar read model, proveniência, frescor, escopo e testes antes da UI.

## Evidência local

Arquivos principais auditados: `analytics-api.ts`, `analytics-model.ts`,
`analytics-kpi-contract.mjs`, `analytics-stage-scope.mjs`,
`AnalyticsDomainTabs.tsx`, `AnalyticsOperationScope.tsx`, componentes de cada
domínio, migrations dos RPCs analíticos, registros de KPI e auditorias de
Suporte, Financeiro e Produto/Desenvolvimento.

Nenhum dado externo foi consultado ou inventado.
