# Task

## Task ID

COMMERCIAL-PREDICTION-2026-08-21

## Título

Criar Predição explicável baseada em dados

## Estado

READY_FOR_REVIEW

## Objetivo

Investigar e materializar uma predição comercial explicável usando somente
dados e contratos reais de pipeline, conversão, lead time e ticket, sem usar IA
generativa para matemática nem apresentar inferência como fato.

## Escopo

- mapear as fontes reais e os contratos publicados para pipeline, conversão,
  lead time e ticket;
- separar observado, derivado, projetado e indisponível;
- definir a semântica temporal, coortes, filtros, timezone e cobertura antes de
  qualquer cálculo;
- implementar somente comportamento sustentado por contrato backend existente,
  ou registrar a fundação documental se faltar fonte publicável;
- preservar estados de ausência e cobertura insuficiente sem convertê-los em
  previsão ou zero silencioso;
- adicionar testes e documentação proporcionais à mudança comprovada.

## Fora de escopo

- usar IA generativa para calcular valores, probabilidades ou totais;
- inventar fonte, fórmula, lead time, ticket, baseline, forecast ou dado;
- criar UI parcial sem contrato backend correspondente;
- alterar integrações externas, secrets, migrations remotas ou release;
- publicar previsão como fato quando a fonte ou cobertura forem insuficientes.

## Critérios de aceitação

1. Fontes, campos, fórmulas e semântica temporal ficam rastreáveis.
2. A predição distingue dado observado, cálculo derivado, projeção e
   indisponibilidade.
3. Ausência, nulo ou cobertura insuficiente não vira zero nem confiança
   artificial.
4. O backend permanece a fonte da verdade e os gates aplicáveis passam sem
   alterar o baseline.
5. Lacunas não resolvidas são registradas como `PROPOSED` ou
   `OWNER_DECISION_REQUIRED`, nunca como comportamento inventado.

## Dependências e autorização

- Base SHA: `158069d34d6ab191177cfab32d77fa5349ba9d91`.
- Branch: `main`.
- Owner: Forge.
- Reviewer active: Sentinel.
- Review mode: `SENTINEL_REQUIRED`.
- Approval: `APPROVED` na fila canônica.
- Dependências satisfeitas: `COMMERCIAL-GOALS-MRR-2026-08-21` e
  `COMMERCIAL-RECONCILIATION-2026-08-21`.

## Allowlist inicial

1. `apps/web/src/features/analytics/analytics-api.ts`
2. `apps/web/src/features/analytics/analytics-model.ts`
3. `apps/web/src/features/analytics/analytics-kpi-contract.mjs`
4. `apps/web/src/features/analytics/AnalyticsCommercialPage.tsx`
5. `docs/ANALYTICS_PREDICTION_FOUNDATION_V1.md`
6. `docs/PROJECT_STATE.md`
7. `docs/DOCUMENTATION_LEDGER.md`
8. `docs/README.md`
9. `handoffs/README.md`
10. `handoffs/current/TASK.md`
11. `handoffs/current/IMPLEMENTATION.md`
12. `handoffs/current/REVIEW.md`
13. `handoffs/current/STATUS.md`

A expansão da allowlist executável exige evidência objetiva durante a
investigação. Não alterar SQL, migrations, RPCs, contratos ou UI fora do
escopo demonstrado por fontes reais.
