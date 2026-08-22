# Review

## Task ID

COMMERCIAL-OWNER-STAGE-2026-08-21

## Reviewer

Sentinel (Codex Independent Reviewer)

## Estado

Aguardando implementação do Forge. Nenhum veredito foi emitido para este lote.

## Revisão independente — 2026-08-21

### Estado e SHAs efetivamente revisados

- Reviewer: Sentinel (Codex Independent Reviewer).
- Estado recebido: `READY_FOR_REVIEW`.
- Owner recebido: `Sentinel`.
- Task ID: `COMMERCIAL-OWNER-STAGE-2026-08-21`.
- Base SHA: `63efe05f566dd63a2a74e7d4089abf14fa381373`.
- HEAD efetivo: `63efe05f566dd63a2a74e7d4089abf14fa381373`.
- Implementação: `UNCOMMITTED_WORKTREE`.
- O diff foi conferido por allowlist; alterações preexistentes do worktree não
  foram absorvidas na revisão.

### O que foi confirmado

- `AnalyticsCommercialPage.tsx:113-126` mantém a chamada principal com os
  filtros atuais e, quando `ownerId` ou `stageId` existe, faz uma segunda
  chamada ao mesmo RPC com esses dois filtros removidos.
- `AnalyticsCommercialPage.tsx:157-158` monta as opções a partir do catálogo
  separado, enquanto o estado de dados, KPIs e estado vazio continuam vindo
  da resposta filtrada.
- `analytics-stage-scope.mjs:14-17` cria filtros sem mutar o objeto original;
  `tests/scripts/analytics-stage-scope.test.mjs:45-56` confirma a remoção
  somente de `ownerId` e `stageId` e a preservação das demais dimensões.
- Não foi identificada alteração de RPC, migration, policy, autorização,
  tenant, contrato backend ou release surface.

### Findings

#### F-STAGE-001 — MEDIUM — contra-teste obrigatório do catálogo sem atividade do owner não foi entregue

- Evidência: `tests/scripts/analytics-stage-scope.test.mjs:45-56` testa apenas
  a função pura `commercialStageCatalogFilters`. Não há fixture em que um stage
  exista no catálogo sem possuir registros para o owner, nem teste que verifique
  a composição das duas respostas no `AnalyticsCommercialPage`.
- Impacto: a suíte pode continuar verde mesmo se a página deixar de chamar o
  catálogo sem `ownerId`/`stageId`, voltar a usar o funil filtrado para as opções,
  ou deixar de preservar o estado vazio da combinação `owner + stage`.
- Requisito afetado: requisito 5 da TASK; também reduz a evidência dos
  requisitos 1, 2 e 3.
- Correção esperada: adicionar um teste comportamental focado que represente um
  stage presente na resposta de catálogo e ausente na resposta filtrada do
  owner, verificando simultaneamente que: a chamada de dados preserva
  `ownerId + stageId`; a chamada de catálogo remove somente esses dois filtros
  e preserva período, operação e pipelines excluídos; o stage permanece nas
  opções; e a resposta filtrada vazia continua sendo exibida como estado vazio.
  Pode ser um teste de orquestração com dependências mockadas ou uma extração
  pura equivalente, desde que cubra a decisão de composição e não apenas o
  helper isolado.

### Validações independentes

- `node --test tests/scripts/analytics-stage-scope.test.mjs`: **PASS**, 6/6.
- `npm run web:typecheck`: **PASS**.
- `npm run web:build`: **PASS**, 942 módulos transformados.
- `npm run review:gates`: **PASS**, 0 regressões e 45 itens do baseline
  resolvidos.
- `npm run lint`: **PASS**, 0 erros e 160 warnings legados/preexistentes.
- `npm run docs:validate`: **PASS**, 0 documentos bloqueados e 9 alertas
  históricos.
- `git diff --check`: **PASS**.
- Não foi executado pgTAP, pois o lote não altera SQL, RPC, RLS ou dados.
- Não foi feita validação visual/browser; build e typecheck não comprovam o
  fluxo renderizado nem a sequência real das duas chamadas.

### Segurança e limites

Não foi observada regressão nova de autorização, tenant, RLS, secrets ou
integrações externas. Sentinel não alterou código de produto, testes, contratos,
migrations ou configuração executável.

## Decisão

# CHANGES_REQUESTED

O caminho implementado parece preservar a separação entre catálogo e dados,
mas o requisito explícito de contra-teste para stage existente sem atividade do
owner não está demonstrado. Forge deve adicionar a evidência comportamental,
atualizar `IMPLEMENTATION.md` e reenviar `READY_FOR_REVIEW` com `Owner =
Sentinel`.

## Re-revisão incremental — 2026-08-21

### Estado e SHAs efetivamente revisados

- Reviewer: Sentinel (Codex Independent Reviewer).
- Estado recebido: `READY_FOR_REVIEW`.
- Owner recebido: `Sentinel`.
- Task ID: `COMMERCIAL-OWNER-STAGE-2026-08-21`.
- Base SHA: `63efe05f566dd63a2a74e7d4089abf14fa381373`.
- HEAD efetivo: `63efe05f566dd63a2a74e7d4089abf14fa381373`.
- Implementação: `UNCOMMITTED_WORKTREE`.
- O diff foi revisado por allowlist; alterações preexistentes do worktree
  permaneceram fora do lote.

### F-STAGE-001 — resolvido

O Forge extraiu `buildCommercialStageQueryPlan` e
`composeCommercialStageView` em `analytics-stage-scope.mjs` e passou a usá-los
em `AnalyticsCommercialPage.tsx:113-126` e `152-160`.

O teste `tests/scripts/analytics-stage-scope.test.mjs:61-84` agora demonstra o
cenário requerido: o plano mantém `ownerId + stageId` na consulta de dados,
remove somente esses filtros na consulta do catálogo e preserva período,
operação, pipelines excluídos e demais dimensões; a composição lê o stage da
resposta de catálogo mesmo quando a resposta filtrada está vazia e preserva
`dataState.status = empty`.

Também confirmei que a validação de compatibilidade de pipeline usa o catálogo
separado em `AnalyticsCommercialPage.tsx:291`, enquanto KPIs, funil e estado
vazio continuam derivados da resposta filtrada.

### Validações independentes desta re-revisão

- `node --test tests/scripts/analytics-stage-scope.test.mjs`: **PASS**, 7/7.
- `npm run web:typecheck`: **PASS**.
- `npm run web:build`: **PASS**, 942 módulos transformados.
- `npm run review:gates`: **PASS**, 0 regressões e 45 itens do baseline
  resolvidos.
- `npm run lint`: **PASS**, 0 erros e 160 warnings legados/preexistentes.
- `npm run docs:validate`: **PASS**, 0 documentos bloqueados e 9 alertas
  históricos.
- `git diff --check`: **PASS**.
- Não foi executado pgTAP, pois o lote não altera SQL, RPC, RLS ou dados.
- Não foi feita validação visual/browser; build e typecheck não comprovam
  renderização nem integração remota.

### Segurança e limites

Não foi observada regressão nova de autorização, tenant, RLS, secrets ou
integrações externas. Sentinel não alterou código de produto, testes, contratos,
migrations ou configuração executável.

## Decisão incremental

# APPROVED

F-STAGE-001 foi corrigido e a evidência agora cobre o requisito 5 da TASK e a
composição entre catálogo e dados filtrados. A task atende os critérios de
aceitação aplicáveis ao lote.

Como a fila canônica marca esta task com `Approval = APPROVED`, o próximo
owner é `Forge`. Forge está autorizado a validar a allowlist, criar commit
local exclusivo, arquivar o handoff, marcar a task como `DONE` e iniciar a
próxima task autorizada. Push, merge, deploy, migration remota, secrets e
release surface continuam proibidos.
