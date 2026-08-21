# Implementation

## Task ID

DATA-PIPELINE-STAGE-SCOPE-2026-08-21

## Implementador

Codex

## Base SHA

b676e6f095cdff09bb9b4150af36822612b3c5b7

## Implementation SHA

UNCOMMITTED_WORKTREE

## Status

READY_FOR_REVIEW. Implementação concluída e entregue ao Claude para revisão
independente. O trabalho permanece não commitado e limitado aos arquivos do
lote; alterações preexistentes do worktree não foram staged nem modificadas.

## Resumo

Foi formalizada a compatibilidade Operação → Pipeline → Stage usando o payload
publicado pelos snapshots existentes. O snapshot comercial agora devolve a
decomposição de cada stage por pipeline e aceita a seleção de múltiplos stage
ids compatíveis. Suporte já possuía essa decomposição; as duas telas passaram a
derivar as opções de stage somente dela e a limpar seleção incompatível quando
a operação ou os pipelines mudam.

## Decisões tomadas

- O backend continua sendo a fonte da verdade: `analytics_source_config`,
  `hubspot_pipeline_stages` e os snapshots/RPCs existentes.
- Não foi criada tabela, catálogo ou heurística paralela. O frontend apenas
  intersecta `pipeline_breakdown` publicado com os pipelines selecionados.
- Payload sem `pipelineBreakdown` é tratado como cobertura parcial e não gera
  opção por inferência. A operação sem valor mantém todos os pipelines ativos;
  pipeline sem operação não é atribuído a uma operação por nome.
- A seleção comercial pode carregar ids separados por vírgula porque o RPC
  agora aplica `any(string_to_array(...))`, alinhando-a ao contrato já usado
  pelo snapshot de Suporte.

## Arquivos adicionados

- `supabase/migrations/20260821093000_analytics_pipeline_stage_scope_v1.sql`
- `apps/web/src/features/analytics/analytics-stage-scope.mjs`
- `apps/web/src/features/analytics/analytics-stage-scope.d.mts`
- `tests/scripts/analytics-stage-scope.test.mjs`
- `supabase/tests/120_analytics_pipeline_stage_scope.sql`

## Arquivos modificados

- `apps/web/src/features/analytics/AnalyticsCommercialPage.tsx`
- `apps/web/src/features/analytics/AnalyticsCsPage.tsx`
- `apps/web/src/features/analytics/analytics-api.ts`

## Migrations

- Migration forward-only substitui a definição do snapshot comercial de cinco
  argumentos. Não há escrita externa, alteração de dados, RLS, grants ou
  mudança de release surface.

## Testes adicionados

- `analytics-stage-scope.test.mjs`: 5/5, incluindo stage incompatível,
  stage compartilhado, pipeline sem operação e payload parcial.
- O enriquecimento do snapshot comercial é aplicado em `analytics-api.ts`; o
  `analytics-model.ts` preexistente não foi modificado pelo lote.
- `120_analytics_pipeline_stage_scope.sql`: 8/8, incluindo operação
  divergente e stage/status fora do recorte.

## Comandos de validação executados

- `node --test tests/scripts/analytics-stage-scope.test.mjs`: PASS, 5/5.
- `npm run web:typecheck`: PASS.
- `npm run web:build`: PASS.
- `node --test tests/scripts/analytics-pipeline-filter.test.mjs tests/scripts/analytics-stage-breakdown.test.mjs tests/scripts/analytics-stage-scope.test.mjs`: PASS, 16/16.
- `pnpm exec supabase migration up --local`: PASS, aplicou somente a migration deste lote no banco local para permitir o pgTAP. Nenhuma migration remota foi executada.
- `npm run supabase:test:file -- supabase/tests/120_analytics_pipeline_stage_scope.sql`: PASS, 8/8.
- `npm run test:all`: PASS, 573/573.
- `npm run lint`: PASS, exit 0; 160 warnings já existentes no worktree, sem erro.
- `npm run docs:validate`: PASS, 0 bloqueios.
- `npm run review:gates`: PASS, 0 regressões contra o baseline.
- `npm run supabase:lint:db`: PASS, exit 0; diagnósticos históricos de
  extensões e volatilidade permaneceram não bloqueantes.
- `git diff --check`: PASS, limpo.

## Limitações conhecidas

- A validade da combinação depende da cobertura publicada no snapshot. Quando
  o payload não traz a decomposição por pipeline, a UI informa cobertura
  parcial e não oferece uma opção que não consiga provar.
- Não foi executada validação browser autenticada neste lote; a mudança foi
  validada por contrato, testes puros, typecheck, build e pgTAP local.

## Itens que o reviewer deve observar

- confirmar que o snapshot comercial mantém a decomposição por pipeline;
- confirmar que as opções das duas telas não são montadas de stage ids sem
  origem;
- confirmar o tratamento de operação ausente, pipeline sem operação e payload
  parcial;
- confirmar que tenant isolation, RLS, autorização e auditoria não foram
  alterados.
