# Task

## Task ID

CS-DOMAIN-AUDIT-2026-08-21

## Título

Auditar carteira, risco, churn, expansão e renovação

## Estado

READY_FOR_REVIEW

## Objetivo

Auditar, com evidência local, as fontes e os contratos existentes para carteira
de Customer Success, risco, churn, expansão e renovação. O lote deve separar
dados publicados de inferências e deixar explícito quando health score ou outro
sinal ainda não possui contrato canônico.

## Escopo

- localizar tabelas, views, RPCs, contratos, read models e documentos vigentes
  relacionados à carteira e aos sinais de Customer Success;
- confirmar campos, filtros temporais, tenant, permissões, proveniência,
  frescor e estados de ausência ou indisponibilidade;
- reconciliar o que já existe com o contrato de vencimento e renovação recém
  documentado;
- separar fato observado, hipótese, lacuna e proposta de próximo lote;
- materializar somente documentação e handoff quando não houver fonte
  publicável suficiente.

## Fora de escopo

- criar health score, risco, churn ou expansão por cálculo local ou heurístico;
- criar UI, dashboard, alerta, mutation ou contrato backend sem evidência;
- alterar migrations, RPCs, views, RLS, integrações, secrets ou release;
- executar escrita remota ou publicar superfície parcial.

## Critérios de aceitação

1. Fontes, campos e ausência de fontes são rastreáveis por caminho e contrato.
2. Carteira, risco, churn, expansão e renovação ficam semanticamente separados.
3. Tenant, permissões, período, timezone, frescor e estados de indisponibilidade
   são explicitados quando aplicáveis.
4. O documento distingue health score existente de health score ainda não
   definido.
5. O menor lote seguinte é documentado sem alterar comportamento não sustentado.
6. Gates documentais e de regressão aplicáveis passam sem alterar o baseline.

## Dependências e autorização

- Base SHA: `e8347f64f9b94a778d5e10df28dcf460ae33e072`.
- Branch: `main`.
- Owner: Sentinel para revisão independente.
- Reviewer active: Sentinel.
- Review mode: `SENTINEL_REQUIRED`.
- Approval: `APPROVED` na fila canônica.
- Dependências satisfeitas: `KPI-REGISTRY-2026-08-21` e
  `CONTRACT-EXPIRY-2026-08-21`.

## Allowlist inicial

1. `docs/ANALYTICS_CS_DOMAIN_AUDIT_V1.md`
2. `docs/PROJECT_STATE.md`
3. `docs/DOCUMENTATION_LEDGER.md`
4. `docs/README.md`
5. `handoffs/README.md`
6. `handoffs/current/TASK.md`
7. `handoffs/current/IMPLEMENTATION.md`
8. `handoffs/current/REVIEW.md`
9. `handoffs/current/STATUS.md`

A expansão da allowlist exige evidência objetiva durante a investigação.
