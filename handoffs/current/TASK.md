# Task

## Task ID

CONTRACT-EXPIRY-2026-08-21

## Título

Investigar contratos próximos do vencimento

## Estado

READY_FOR_REVIEW

## Objetivo

Investigar, com evidência local, se o ConfiOne possui fonte confiável para
contratos próximos do vencimento, responsável pela renovação e MRR em risco,
sem inventar dados ou publicar uma UI sem contrato backend.

## Escopo

- localizar fontes, views, RPCs, contratos e estados existentes relacionados a
  vencimento, renovação, responsável, assinatura e MRR;
- separar dados observados, campos ausentes, hipóteses e lacunas de contrato;
- confirmar tenant, permissões, filtros temporais, timezone e proveniência;
- materializar somente documentação e handoff quando não houver fonte
  publicável suficiente;
- registrar o menor próximo lote implementável, se houver.

## Fora de escopo

- criar UI, cálculo local, forecast ou MRR em risco sem contrato backend;
- inventar datas de vencimento, responsável, probabilidade de renovação ou
  valor financeiro;
- alterar migrations, RPCs, views, RLS, integrações, secrets ou release;
- executar escrita remota ou publicar uma superfície parcial.

## Critérios de aceitação

1. Fontes e ausência de fontes são rastreáveis por caminho e contrato.
2. Vencimento, renovação e MRR em risco ficam separados de inferências.
3. Permissões, tenant, período, timezone e estados de indisponibilidade são
   explicitados quando aplicáveis.
4. O menor lote seguinte é documentado sem alterar comportamento não sustentado.
5. Gates documentais e de regressão aplicáveis passam sem alterar o baseline.

## Dependências e autorização

- Base SHA: `667a4a31b0a9764427d7488ef54ecb68378d70ed`.
- Branch: `main`.
- Owner: Forge.
- Reviewer active: Sentinel.
- Review mode: `SENTINEL_REQUIRED`.
- Approval: `APPROVED` na fila canônica.
- Dependência satisfeita: `KPI-REGISTRY-2026-08-21`.

## Allowlist inicial

1. `docs/ANALYTICS_CONTRACT_EXPIRY_FOUNDATION_V1.md`
2. `docs/PROJECT_STATE.md`
3. `docs/DOCUMENTATION_LEDGER.md`
4. `docs/README.md`
5. `handoffs/README.md`
6. `handoffs/current/TASK.md`
7. `handoffs/current/IMPLEMENTATION.md`
8. `handoffs/current/REVIEW.md`
9. `handoffs/current/STATUS.md`

A expansão da allowlist exige evidência objetiva durante a investigação.
