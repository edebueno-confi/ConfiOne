# Task

## Task ID

SUPPORT-DOMAIN-AUDIT-2026-08-21

## Título

Auditar fila, SLA, aging, prioridade e operação

## Estado

READY_FOR_REVIEW

## Objetivo

Auditar, com evidência local, as fontes e os contratos existentes para fila de
suporte, tickets, conversas, chat, SLA, aging, prioridade e operação. O lote
deve separar objetos e semânticas distintas e deixar explícito quando uma
capacidade não possui contrato canônico.

## Escopo

- localizar tabelas, views, RPCs, contratos, read models, componentes e
  documentos vigentes relacionados a suporte;
- confirmar campos, filtros temporais, `created_at`, `closed_at`,
  `updated_at`, tenant, permissões, proveniência, frescor e estados de
  ausência;
- distinguir tickets, conversas, chat, reuniões e atividades quando as fontes
  reais não forem equivalentes;
- auditar SLA, aging, prioridade, status, fila, responsável e associações sem
  transformar ausência de dado em zero;
- separar fato observado, hipótese, lacuna e proposta do menor lote seguinte;
- materializar somente documentação e handoff quando não houver fonte
  publicável suficiente.

## Fora de escopo

- criar cálculo local de SLA, aging, prioridade ou produtividade sem contrato;
- criar UI, dashboard, alerta, mutation ou contrato backend sem evidência;
- alterar migrations, RPCs, views, RLS, integrações, secrets ou release;
- executar escrita remota ou publicar superfície parcial.

## Critérios de aceitação

1. Fontes, campos e ausência de fontes são rastreáveis por caminho e contrato.
2. Tickets, conversas e chat ficam semanticamente separados quando aplicável.
3. Campo de data, período, timezone, tenant, permissão, frescor e estados de
   indisponibilidade são explícitos.
4. SLA, aging, prioridade, status, fila e responsável não são inferidos como
   equivalentes sem evidência.
5. O menor lote seguinte é documentado sem alterar comportamento não
   sustentado.
6. Gates documentais e de regressão aplicáveis passam sem alterar o baseline.

## Dependências e autorização

- Base SHA: `8c3eff708811bcb19e28e56dbafda6131d89ea35`.
- Branch: `main`.
- Owner: Forge para implementação.
- Reviewer active: Sentinel.
- Review mode: `SENTINEL_REQUIRED`.
- Approval: `APPROVED` na fila canônica.
- Dependência satisfeita: `KPI-REGISTRY-2026-08-21`.

## Allowlist inicial

1. `docs/ANALYTICS_SUPPORT_DOMAIN_AUDIT_V1.md`
2. `docs/PROJECT_STATE.md`
3. `docs/DOCUMENTATION_LEDGER.md`
4. `docs/README.md`
5. `handoffs/README.md`
6. `handoffs/current/TASK.md`
7. `handoffs/current/IMPLEMENTATION.md`
8. `handoffs/current/REVIEW.md`
9. `handoffs/current/STATUS.md`

A expansão da allowlist exige evidência objetiva durante a investigação.

## Limites operacionais

Push, merge, deploy, migrations remotas, secrets e release surface continuam
proibidos.
