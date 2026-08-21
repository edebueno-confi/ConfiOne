# Implementation

## Task ID

COMMERCIAL-OWNER-STAGE-2026-08-21

## Implementador

Forge (Codex)

## Estado do handoff

COMPLETED. Correção do F-STAGE-001 aprovada pelo Sentinel e integrada localmente.

## Base e SHAs

- Base SHA: `63efe05f566dd63a2a74e7d4089abf14fa381373`.
- Implementation SHA: `19648adf0fda2b82fe7481bba7c98651084b5d8a`.
- Integration commit: `19648adf0fda2b82fe7481bba7c98651084b5d8a`.
- Branch: `main`.

## Investigação e decisão

O caminho executável confirmado foi:

1. `AnalyticsCommercialPage.tsx` chama `getCommercialSnapshot` com os filtros atuais, incluindo `ownerId` e `stageId`.
2. O snapshot comercial mantém esses dois predicados em conjunção no RPC.
3. A mesma resposta filtrada era usada para montar `stageOptions` por meio de `readAnalyticsStageScope`. Portanto, ao selecionar um responsável, stages sem registros para aquela combinação desapareciam do catálogo.

A solução mantém a fonte backend existente e separa as responsabilidades:

- a chamada principal continua filtrada por período, operação, pipelines excluídos, responsável e stage;
- quando `ownerId` ou `stageId` está presente, uma segunda chamada ao mesmo RPC remove somente esses dois filtros para construir o catálogo de stages;
- `stageOptions` e a validação de compatibilidade de pipeline usam esse catálogo, enquanto KPIs, funil, pipelines, owners e estado vazio continuam vindo da resposta filtrada;
- `commercialStageCatalogFilters` é uma função pura, não muta o filtro original e preserva período, prioridade e demais dimensões.

Isso preserva a conjunção `owner + stage` nos dados e deixa explícita a ausência de dados para combinações sem registros, sem apagar silenciosamente o stage do catálogo.

## Resposta ao finding F-STAGE-001

Finding aceito e corrigido. A composição foi extraída para dois helpers puros e passou a ser usada pela página:

- `buildCommercialStageQueryPlan` mantém `ownerId` e `stageId` na requisição de dados e remove somente esses dois filtros na requisição do catálogo, preservando período, operação, prioridade, pipelines excluídos e demais dimensões.
- `composeCommercialStageView` mantém o `dataState` da resposta filtrada, inclusive `empty`, enquanto lê as opções de stage do catálogo sem a atividade do owner.
- O contra-teste cobre o cenário em que o stage existe no catálogo, o owner não possui atividade e a resposta de dados permanece vazia. Ele verifica simultaneamente a composição das duas requisições, a presença do stage nas opções e a preservação do estado vazio.

## Alterações

- `apps/web/src/features/analytics/AnalyticsCommercialPage.tsx`: consulta o catálogo de stages sem owner/stage apenas quando necessário e usa o catálogo separado para as opções e compatibilidade.
- `apps/web/src/features/analytics/analytics-stage-scope.mjs`: adiciona os helpers puros `commercialStageCatalogFilters`, `buildCommercialStageQueryPlan` e `composeCommercialStageView`.
- `apps/web/src/features/analytics/analytics-stage-scope.d.mts`: registra as declarações TypeScript dos helpers sem perder o tipo `AnalyticsFilters`.
- `tests/scripts/analytics-stage-scope.test.mjs`: adiciona contra-teste de composição para owner sem atividade, catálogo com stage disponível e estado vazio dos dados.

Nenhuma migration, RPC, policy, tabela, contrato de dados ou release surface foi alterado. Não houve mudança documental de produto, pois a correção ajusta a composição do filtro sem alterar a semântica da métrica.

## Allowlist final

1. `apps/web/src/features/analytics/AnalyticsCommercialPage.tsx`
2. `apps/web/src/features/analytics/analytics-stage-scope.mjs`
3. `apps/web/src/features/analytics/analytics-stage-scope.d.mts`
4. `tests/scripts/analytics-stage-scope.test.mjs`
5. `handoffs/current/TASK.md`
6. `handoffs/current/IMPLEMENTATION.md`
7. `handoffs/current/REVIEW.md`
8. `handoffs/current/STATUS.md`
9. `handoffs/README.md`

As alterações restantes do worktree são preexistentes ou pertencem a outros lotes e permaneceram fora desta allowlist.

## Validações executadas

- `node --test tests/scripts/analytics-stage-scope.test.mjs`: PASS, 7/7.
- `npm run web:typecheck`: PASS.
- `npm run web:build`: PASS, Vite transformou 942 módulos.
- `npm run lint`: PASS, 0 erros e 160 warnings legados/preexistentes.
- `npm run review:gates`: PASS, 0 regressões bloqueantes e 45 itens do baseline resolvidos; baseline não foi alterado.
- `npm run docs:validate`: PASS, 0 documentos bloqueados e 9 alertas históricos.
- `git diff --check`: PASS.

Não foi necessário executar pgTAP ou migration local, pois o lote não altera SQL, RPC, RLS, dados ou contratos backend. Não foi feita validação visual ou de browser; build e typecheck comprovam compilação, não renderização nem integração remota.

## Segurança e limitações

- A autorização continua no RPC backend existente; o frontend apenas separa a consulta do catálogo da consulta de dados.
- Não foram executadas migration remota, deploy, push, merge, release surface ou alteração de secrets.
- O working tree continua contaminado por alterações legadas; nenhum arquivo fora da allowlist foi staged ou descartado.

## Pedido ao reviewer

Sentinel deve revisar a composição das duas chamadas, a preservação da conjunção owner + stage, o contra-teste e a allowlist. Forge não declara `APPROVED`.
