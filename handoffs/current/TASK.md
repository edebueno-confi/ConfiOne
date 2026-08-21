# Task

## Task ID

COMMERCIAL-GOALS-MRR-2026-08-21

## Título

Criar fundação de metas financeiras/MRR

## Estado

READY_FOR_REVIEW

## Objetivo

Delimitar a fundação de metas financeiras/MRR sem misturar período da meta
com janela histórica e sem distribuir meta sem dados válidos.

## Escopo

- investigar contratos e read models existentes para receita/MRR e períodos;
- separar período da meta, janela histórica e data de corte;
- documentar ou implementar somente comportamento suportado por fontes reais;
- validar dados, ausência de fonte e cobertura antes de qualquer distribuição;
- adicionar testes e documentação necessários conforme a evidência.

## Fora de escopo

- inventar fonte de MRR, meta, forecast ou distribuição;
- alterar integrações externas, secrets, migrations remotas ou release;
- criar UI parcial quando não existir contrato backend correspondente;
- tratar ausência de dados como zero.

## Critérios de aceitação

1. Fontes, contratos e semântica temporal ficam rastreáveis.
2. Período da meta, janela histórica e data de corte não são misturados.
3. Ausência ou cobertura insuficiente não é convertida silenciosamente em zero.
4. Gates relevantes passam sem alteração do baseline.
5. Qualquer lacuna não resolvida vira `PROPOSED` ou
   `OWNER_DECISION_REQUIRED`, nunca inferência não comprovada.

## Documentos e contratos aplicáveis

- `AGENTS.md`
- `docs/PROJECT_STATE.md`
- `docs/README.md`
- `docs/ANALYTICS_KPI_REGISTRY_V1.md`
- `docs/VIEW_RPC_CONTRACTS.md`
- `docs/engineering/REVIEW_PROTOCOL.md`
- `handoffs/README.md`
- `apps/web/src/features/analytics/analytics-kpi-contract.mjs`
- `apps/web/src/features/analytics/analytics-periods.ts`

## Base e autorização

- Base SHA: `d3f26bfe6ac22f06376c5797c48d6b1221366cf2`
- Branch: `main`
- Owner: Forge
- Reviewer active: Sentinel
- Review mode: `SENTINEL_REQUIRED`
- Approval: `APPROVED` na fila canônica
- Dependências: `KPI-REGISTRY-2026-08-21` e
  `COMMERCIAL-EVOLUTION-2026-08-21`, DONE

## Allowlist inicial

1. `docs/ANALYTICS_KPI_REGISTRY_V1.md`
2. `apps/web/src/features/analytics/analytics-kpi-contract.mjs`
3. `apps/web/src/features/analytics/analytics-model.ts`
4. `apps/web/src/features/analytics/analytics-api.ts`
5. `handoffs/current/TASK.md`
6. `handoffs/current/IMPLEMENTATION.md`
7. `handoffs/current/REVIEW.md`
8. `handoffs/current/STATUS.md`
9. `handoffs/README.md`
10. `docs/ANALYTICS_MRR_GOALS_FOUNDATION_V1.md`
11. `docs/PROJECT_STATE.md`
12. `docs/DOCUMENTATION_LEDGER.md`
13. `docs/README.md`

A expansão da allowlist executável exige evidência objetiva durante a
investigação. Não alterar código, SQL, contratos ou UI fora do escopo
demonstrado pelos contratos reais.

A expansão documental foi autorizada pelo próprio objetivo desta task e pela
investigação que confirmou que a fonte de metas ainda não existe. Nenhum novo
objeto executável será criado neste lote.
