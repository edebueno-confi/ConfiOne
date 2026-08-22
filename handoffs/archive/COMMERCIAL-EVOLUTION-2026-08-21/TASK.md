# Task

## Task ID

COMMERCIAL-EVOLUTION-2026-08-21

## Título

Estruturar evolução e comparação temporal

## Estado

COMPLETED

## Objetivo

Expor no domínio Comercial a comparação entre o período corrente e o período
anterior equivalente, com delta absoluto, delta percentual, tendência e uma
declaração explícita sobre aging quando não houver histórico suficiente.

## Escopo

- reutilizar `rpc_analytics_commercial_kpis_by_operation` para buscar o mesmo
  contrato no período atual e no período anterior equivalente;
- preservar filtros, owner e operação nos dois recortes;
- calcular apenas deltas de apresentação no frontend, sem recalcular KPIs;
- exibir comparação de criação, ganhos, perdas, receita ganha e conversão;
- apresentar a taxa de ganho em pontos percentuais e também a variação relativa
  quando a base anterior permitir;
- manter a tendência já publicada e explicitar sua janela própria;
- exibir `stage_aging_days` como indisponível/aguardando histórico quando o
  contrato não publicar histórico de entrada em etapa;
- adicionar testes focados para datas, deltas, divisão por zero e estados sem
  fonte.

## Fora de escopo

- alterar SQL, RPC, view, migration, RLS, fórmula ou payload;
- inventar aging atual ou inferir entrada histórica em etapa;
- alterar a janela ou o contrato da série temporal já publicada;
- criar metas, forecast, distribuição de MRR ou nova integração;
- alterar filtros globais, shell, navegação ou outras telas.

## Critérios de aceitação

1. O Comercial mostra período atual e anterior equivalente usando a mesma
   operação e os mesmos filtros do recorte corrente.
2. Ganhos, perdas, negócios criados e receita exibem valor corrente, anterior,
   delta absoluto e delta percentual quando a base permitir.
3. Conversão mostra delta em pontos percentuais e não mistura pontos com
   percentual relativo.
4. Períodos sem limite, base anterior zero, estados `unavailable`, `partial` e
   `awaiting_history` não são convertidos silenciosamente em zero.
5. A tendência existente continua identificando sua janela própria e suas
   coortes.
6. Aging de etapa permanece explicitamente indisponível quando não há fonte
   histórica suficiente.
7. Testes focados, typecheck, build e `git diff --check` passam sem alteração
   de baseline.

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

- Base SHA: `de314b56ca57202290bbbd332a469bb1ffcb8afa`
- Branch: `main`
- Owner: Forge
- Reviewer active: Sentinel
- Approval: APPROVED na fila canônica
- Dependência: `KPI-REGISTRY-2026-08-21`, DONE

## Allowlist inicial

1. `apps/web/src/features/analytics/analytics-commercial-comparison.mjs`
2. `apps/web/src/features/analytics/analytics-commercial-comparison.d.mts`
3. `apps/web/src/features/analytics/AnalyticsCommercialComparison.tsx`
4. `apps/web/src/features/analytics/AnalyticsCommercialPage.tsx`
5. `tests/scripts/analytics-commercial-evolution.test.mjs`
6. `handoffs/current/TASK.md`
7. `handoffs/current/IMPLEMENTATION.md`
8. `handoffs/current/REVIEW.md`
9. `handoffs/current/STATUS.md`
10. `handoffs/README.md`

A allowlist adicional só pode ser aberta se a implementação demonstrar
necessidade objetiva. Alterações preexistentes fora do lote não pertencem a
esta task.
