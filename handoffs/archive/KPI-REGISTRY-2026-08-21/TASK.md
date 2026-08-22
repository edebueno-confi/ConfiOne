# Task

## Task ID

KPI-REGISTRY-2026-08-21

## Título

Consolidar registro canônico de KPIs

## Estado

READY_FOR_IMPLEMENTATION

## Contexto

O repositório contém definições distribuídas entre catálogo histórico,
contratos de leitura, mapeadores e telas. Isso dificulta saber, para cada KPI,
qual fonte, campo de data, coorte, fórmula, filtro, timezone, estado nulo e
limitação devem ser apresentados ao usuário e auditados pela operação.

## Objetivo

Criar um registro canônico, rastreável e legível dos KPIs já publicados,
reconciliando documentação com código, views e contratos reais sem alterar
fórmulas ou inventar métricas novas.

## Escopo

- inventariar os KPIs publicados da Visão Geral, Comercial e Suporte/Customer
  Success que já possuem fonte e contrato local;
- registrar definição de negócio, read model/RPC/view, grão, campo de data ou
  posição corrente, coorte, período, timezone, filtros, fórmula, unidade,
  tratamento de nulos e exclusões;
- diferenciar explicitamente posição corrente de movimento selecionado;
- registrar limitações, estados `unavailable`, `partial`, `empty` e ausência de
  fonte quando aplicável;
- atualizar os índices e o ledger documental conforme a política vigente;
- executar validação documental e conferir que cada afirmação importante pode
  ser rastreada ao contrato executável.

## Fora de escopo

- alterar SQL, RPC, view, migration, RLS, fórmula ou comportamento do produto;
- expor ainda o registro na interface;
- criar catálogo de planilhas, integração externa ou fallback de dados;
- documentar métricas PROPOSED como se fossem publicadas;
- corrigir findings de código não relacionados.

## Requisitos de aceitação

1. Cada KPI publicado inventariado possui fonte e definição rastreáveis.
2. O registro diferencia `created_at`, `closed_at`, `createdate`, `closedate`
   e posição corrente quando essas semânticas existirem.
3. Fórmula, denominador, unidade, timezone, filtros e tratamento de nulos
   estão explícitos, inclusive para conversão e ausência de dados.
4. O documento não contradiz views, RPCs, contratos ou testes existentes.
5. Métricas sem contrato suficiente permanecem marcadas como indisponíveis,
   propostas ou pendentes, sem inferência silenciosa.
6. `npm run docs:validate` passa sem novos bloqueios.

## Documentos normativos aplicáveis

- `AGENTS.md`
- `docs/PROJECT_STATE.md`
- `docs/README.md`
- `docs/ANALYTICS_METRIC_CATALOG_V1.md`
- `docs/VIEW_RPC_CONTRACTS.md`
- `docs/DOCUMENTATION_UPDATE_POLICY.md`
- `docs/DOCUMENTATION_GOVERNANCE_RUNBOOK.md`
- `docs/DOCUMENTATION_LEDGER.md`
- `docs/engineering/REVIEW_PROTOCOL.md`
- `handoffs/README.md`

## Base e autorização

- Base commit SHA: `06b24742013dfcd3e74c805b3a8754bd2c632581`
- Branch: `main`
- Owner: Forge
- Reviewer active: Sentinel
- Approval: APPROVED na fila canônica
- Dependências: `COMMERCIAL-RECONCILIATION-2026-08-21`,
  `COMMERCIAL-CONVERSION-SEMANTICS-2026-08-21` e
  `OVERVIEW-SNAPSHOT-FLOW-2026-08-21`, DONE.

## Allowlist inicial

1. `docs/ANALYTICS_KPI_REGISTRY_V1.md`
2. `docs/README.md`
3. `docs/DOCUMENTATION_LEDGER.md`
4. `handoffs/current/TASK.md`
5. `handoffs/current/IMPLEMENTATION.md`
6. `handoffs/current/REVIEW.md`
7. `handoffs/current/STATUS.md`
8. `handoffs/README.md`

A allowlist pode ser refinada somente se a investigação documental demonstrar
que outro arquivo canônico é indispensável. Não absorver alterações
preexistentes do worktree.
