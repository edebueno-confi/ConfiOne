# Task

## Task ID

OVERVIEW-QUEUE-SEMANTICS-2026-08-21

## Título

Resolver a duplicidade de Fila atual

## Estado

APPROVED / FINALIZE_LOCAL

## Contexto

A Visão Geral exibe uma faixa de posição corrente com a fila de Suporte e
também apresenta sinais de fila em cartões e blocos de domínio. A repetição
do rótulo e da mesma contagem pode sugerir que são métricas diferentes, sem
deixar claro qual conceito, fonte ou recorte cada leitura representa.

## Objetivo

Investigar a duplicidade de `Fila atual`, identificar se as ocorrências são o
mesmo indicador ou conceitos distintos e corrigir somente a apresentação e o
contrato de leitura necessário para que cada ocorrência tenha semântica clara,
sem duplicar consulta nem inventar uma métrica nova.

## Escopo

- rastrear as ocorrências de fila na Visão Geral e seus read models;
- confirmar fonte, período, filtros e estado publicado de cada ocorrência;
- consolidar ou diferenciar os sinais conforme a evidência do contrato;
- adicionar teste comportamental para evitar regressão de rótulo, fonte ou
  recorte;
- preservar operação, tenant, autorização, estados de indisponibilidade e a
  separação entre posição atual e movimento no período.

## Fora de escopo

- alterar fórmula, RPC, migration, RLS, permissões ou integrações externas;
- criar nova tabela, endpoint, KPI ou regra frontend paralela;
- redesenhar a Visão Geral ou corrigir findings não relacionados;
- alterar o contrato de período ou a semântica já aprovada do lote anterior.

## Requisitos de aceitação

1. Cada sinal de fila exibido deve ter rótulo e semântica inequívocos.
2. O usuário não deve interpretar duas ocorrências da mesma fonte como duas
   métricas independentes.
3. A posição corrente não pode receber valor temporal nem o movimento pode
   receber valor global por fallback.
4. A operação selecionada, tenant, autorização e estados explícitos devem ser
   preservados.
5. O teste deve cobrir a ocorrência duplicada e a ausência de dados sem zero
   artificial.

## Documentos normativos aplicáveis

- `AGENTS.md`
- `docs/PROJECT_STATE.md`
- `docs/README.md`
- `docs/VIEW_RPC_CONTRACTS.md`
- `docs/engineering/REVIEW_PROTOCOL.md`
- `handoffs/README.md`

## Base e autorização

- Base commit SHA: `f26ef07c3f507640c37ac4f488c0a240a7b7cb9d`
- Branch: `main`
- Owner: Forge
- Reviewer active: Sentinel
- Approval: APPROVED na fila canônica
- Dependências: `DATA-OPERATION-SCOPE-2026-08-21`, `DATA-TEMPORAL-SEMANTICS-2026-08-21`, DONE.

## Allowlist inicial

1. `apps/web/src/features/analytics/AnalyticsCeoPage.tsx`
2. `apps/web/src/features/analytics/analytics-ceo-snapshot.mjs`
3. `apps/web/src/features/analytics/analytics-ceo-snapshot.d.mts`
4. `tests/scripts/analytics-ceo-snapshot.test.mjs`
5. `handoffs/current/TASK.md`
6. `handoffs/current/IMPLEMENTATION.md`
7. `handoffs/current/REVIEW.md`
8. `handoffs/current/STATUS.md`
9. `handoffs/README.md`

A allowlist pode ser refinada somente se a investigação demonstrar que outro
arquivo do mesmo contrato é indispensável. Não absorver alterações
preexistentes do worktree.
