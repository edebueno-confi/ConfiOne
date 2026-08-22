# Implementation

## Task ID

DATA-OPERATION-SCOPE-2026-08-21

## Implementador

Codex

## Base SHA

bdc1ea6404928e1ca4e8c7ccf9213d6a3090b6f9

## Implementation SHA

4219a0cd26a70c74fb11e5bcaea11db16b4ae14c

## Resumo

A investigação confirmou que KPIs, snapshots, breakdowns e saúde da fila já
recebiam o escopo de Operação, mas o gráfico compartilhado de evolução chamava
a RPC global sem `groupCompany`. O resumo executivo também reutilizava detalhes
globais de prioridade, encerramento, SLA e ciclo ao lado de totais filtrados.
Por fim, a exportação gerencial ignorava a operação selecionada.

O lote fechou esses caminhos sem criar regra local de negócio: a série temporal
agora usa uma RPC de escopo que filtra a mesma `analytics_source_config`, dados
sem dimensão publicada são marcados como indisponíveis e a exportação usa o
recorte de Comercial/Suporte, omitindo Visão Geral e Financeiro quando não há
dimensão de Operação.

## Decisões tomadas

- Preservar `rpc_analytics_timeseries(text,date,date,text)` para leituras
  globais existentes e adicionar `rpc_analytics_timeseries_by_operation(...)`
  como contrato explícito do filtro.
- Reutilizar `app.analytics_group_company` transacional e a configuração
  canônica de pipelines, sem criar tabela, endpoint, estado frontend ou regra
  paralela.
- Não atribuir Financeiro a uma Operação: a RPC devolve
  `operation_dimension_unavailable` e a UI não exporta esse domínio no recorte.
- Não fabricar prioridade, encerramento, SLA, ciclo, Customer Success ou
  financeiro a partir de dados globais. Esses sinais ficam indisponíveis quando
  a dimensão não está publicada.
- O filtro de período da evolução continua sendo uma janela própria do gráfico;
  este lote corrige somente a dimensão de Operação.

## Resposta aos achados da investigação

### Evolução sem escopo — CONCORDO — RESOLVIDO

`AnalyticsTrendPanel` agora recebe `groupCompany`, a API chama
`rpc_analytics_timeseries_by_operation` e a nova migration injeta o predicado
de grupo nos read models de Suporte e Comercial. Financeiro retorna estado
explícito de dimensão indisponível quando há Operação selecionada.

### Vazamento de detalhes globais no resumo — CONCORDO — RESOLVIDO

O resumo passa a ocultar detalhes globais de alta prioridade, encerramentos,
SLA e ciclo quando há recorte ativo. Exceções financeiras e de alta prioridade
globais também não são exibidas nesse contexto.

### Exportação fora do escopo — CONCORDO — RESOLVIDO

`AnalyticsReportExport` recebe a operação compartilhada. Comercial e Suporte
usam snapshots filtrados; Visão Geral e Financeiro não são carregados quando a
fonte não publica a dimensão.

## Resposta ao review independente — Ciclo 1

### DOS-F01 — HIGH — CONCORDO — RESOLVIDO

O review identificou que `operationScoped` era calculado no componente pai,
mas era usado em `ExecutiveHdCanvas` sem estar declarado nas props. Isso
quebrava `web:typecheck` e, por consequência, `web:build`.

A correção mínima foi propagar `operationScoped` no call site de
`ExecutiveHdCanvas`, incluí-lo no destructuring e no tipo explícito das props.
Os textos de indisponibilidade de encerramentos e prioridade foram preservados;
nenhum `any`, variável global ou remoção de cobertura foi introduzido.

`REVIEW.md` não foi alterado.

## Arquivos adicionados

- `supabase/migrations/20260821090000_analytics_timeseries_operation_scope_v1.sql`
- `supabase/tests/119_analytics_timeseries_operation_scope.sql`

## Arquivos modificados

- `apps/web/src/features/analytics/analytics-api.ts`
- `apps/web/src/features/analytics/AnalyticsTrendPanel.tsx`
- `apps/web/src/features/analytics/AnalyticsCeoPage.tsx`
- `apps/web/src/features/analytics/AnalyticsCommercialPage.tsx`
- `apps/web/src/features/analytics/AnalyticsCsPage.tsx`
- `apps/web/src/features/analytics/AnalyticsShell.tsx`
- `apps/web/src/features/analytics/AnalyticsReportExport.tsx`
- `apps/web/src/features/analytics/analytics-executive.ts`
- `tests/scripts/analytics-dashboard-domains-integrations.test.mjs`
- `tests/scripts/analytics-export-contract.test.mjs`

Os arquivos de produto acima já continham alterações preexistentes no worktree
de takeover. Este lote adicionou somente os caminhos descritos nesta seção;
nenhuma alteração preexistente foi descartada ou reclassificada.

## Migrations

- Aplicada somente no Supabase local, sem reset: `20260821090000_analytics_timeseries_operation_scope_v1.sql`.
- Nenhuma migration remota executada.

## Testes adicionados

- `supabase/tests/119_analytics_timeseries_operation_scope.sql`, com 6 asserts:
  contrato, duas operações, operação inexistente, Financeiro sem dimensão e
  preservação dos buckets.
- Contratos frontend atualizados para verificar propagação de Operação na
  evolução, exportação e estados de dimensão indisponível.

## Comandos de validação executados

- `npm run supabase:status`: PASS; banco local disponível.
- `npm exec -- supabase migration list --local`: PASS; apenas a migration deste
  lote estava pendente antes da aplicação local.
- `npm exec -- supabase migration up --local`: PASS; somente a migration deste
  lote aplicada localmente, sem reset.
- `npm run supabase:test:file -- supabase/tests/119_analytics_timeseries_operation_scope.sql`: PASS, 6/6.
- `node --test tests/scripts/analytics-dashboard-domains-integrations.test.mjs tests/scripts/analytics-export-contract.test.mjs tests/scripts/analytics-timeseries-contract.test.mjs`: PASS, 18/18.
- `npm run test:all`: PASS, 568/568.
- `npm run web:typecheck`: PASS.
- `npm run web:build`: PASS.
- `npm run lint`: PASS.
- `npm run docs:validate`: PASS, 0 bloqueios; alertas históricos preservados.
- `npm run supabase:lint:db`: exit 0; alertas históricos e warning de
  estabilidade das RPCs por operação permanecem registrados pelo lint.
- `npm run review:gates`: PASS, 0 regressões bloqueantes; baseline inalterado.
- `git diff --check`: PASS, limpo.

## Revalidação após DOS-F01

- `npm run supabase:status`: PASS; banco local disponível.
- `npm run supabase:test:file -- supabase/tests/119_analytics_timeseries_operation_scope.sql`: PASS, 6/6.
- `npm run web:typecheck`: PASS após a propagação de `operationScoped`.
- `npm run web:build`: PASS; `tsc --noEmit` e `vite build` concluídos.
- `npm run test:all`: PASS, 568/568.
- `npm run lint`: PASS, exit 0; warnings preexistentes permanecem registrados.
- `npm run docs:validate`: PASS, 0 bloqueios; alertas históricos preservados.
- `npm run supabase:lint:db`: exit 0; diagnósticos históricos das extensões e
  warnings de estabilidade de RPCs preexistentes permanecem registrados.
- `npm run review:gates`: PASS, 0 regressões bloqueantes; baseline inalterado.
- `git diff --check`: PASS, limpo.

## Resultados

- O filtro de Operação agora alcança KPIs, snapshots, breakdowns, saúde da fila,
  evolução e exportação aplicáveis.
- O contra-teste com operação inexistente retorna zero no recorte, em vez do
  total global.
- Financeiro e sinais sem dimensão publicada não são apresentados como se
  pertencessem à Operação.
- Nenhum arquivo de release surface, secret, integração externa ou produção foi
  alterado.

## Limitações conhecidas

- O recorte temporal da evolução continua independente do período dos cards,
  conforme contrato existente. A compatibilidade temporal é lote posterior.
- O Supabase lint local retorna alertas históricos nas extensões pgTAP e um
  warning de estabilidade para RPCs que configuram escopo transacional; não há
  bloqueio e o padrão já existe nos contratos de Operação anteriores.
- O worktree continua contaminado por alterações preexistentes de produto e
  documentação. Nenhuma delas foi descartada; o reviewer deve validar o diff
  do lote contra a allowlist antes de qualquer integração.

## Possíveis riscos

- A operação depende da classificação existente em `analytics_source_config`;
  pipeline sem classificação continua explicitamente fora do recorte.
- Chamadores externos que usam deliberadamente a RPC temporal global continuam
  sem filtro, enquanto a UI usa o novo contrato por Operação.
- Uma mudança futura na estrutura da série exige atualizar o pgTAP sem voltar a
  asserts posicionais.

## Itens que o reviewer deve observar

- confirmar que a migration injeta o predicado somente nos CTEs de Suporte e
  Comercial e não altera a leitura global sem escopo;
- confirmar que a operação selecionada chega à evolução em todas as superfícies
  que renderizam `AnalyticsTrendPanel`;
- confirmar que dados globais não reaparecem em cards, exceções ou exportação
  quando a dimensão não está publicada;
- confirmar a separação entre mudanças deste lote e o baseline preexistente;
- confirmar os 6 asserts pgTAP e a ausência de regressões em `review:gates`.
