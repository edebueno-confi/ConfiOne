# TASK: PRODUCT-DEV-DOMAIN-AUDIT-2026-08-21

## Estado de abertura

- State: READY_FOR_IMPLEMENTATION
- Owner: Forge
- Role: EXECUTOR
- Reviewer active: Sentinel
- Review mode: SENTINEL_REQUIRED
- Approval: APPROVED
- Base SHA: `f8cb344b7feac2b0dc4bcba42c86b0a28af88f4c`
- Current SHA: `f8cb344b7feac2b0dc4bcba42c86b0a28af88f4c`

## Objetivo

Auditar e documentar a semântica dos indicadores de Produto e Desenvolvimento
no ConfiOne, mantendo somente sinais ligados a decisões operacionais reais.
Cada indicador deve declarar fonte, campo de data, período, timezone,
proveniência, cobertura, frescor, permissões, estados de ausência e limitações.

## Escopo autorizado

1. Criar `docs/ANALYTICS_PRODUCT_DEV_DOMAIN_AUDIT_V1.md`.
2. Atualizar, somente se necessário, `docs/PROJECT_STATE.md`,
   `docs/DOCUMENTATION_LEDGER.md` e `docs/README.md`.
3. Atualizar os quatro artefatos deste handoff e a linha correspondente da fila
   em `handoffs/README.md`.
4. Auditar código, contratos, views/RPCs, migrations e testes locais para
   separar capacidade existente, hipótese, ausência e próximo lote mínimo.

## Fora de escopo

- Código de produto, SQL, RPC, view, migration, RLS, ingestão ou integração.
- UI, dashboard, cálculo local, novos indicadores ou alteração de contratos
  executáveis.
- Escrita em serviços externos, push, merge, deploy, secrets e release surface.

## Critérios de aceite

- Os indicadores documentados possuem fonte, regra, campo de data, timezone,
  cobertura, frescor, permissão e estado de ausência explícitos.
- Produto e Desenvolvimento não são usados como rótulo genérico para sinais sem
  contrato ou como preenchimento decorativo do Dashboard.
- A documentação distingue fonte executável, estado atual, histórico,
  hipótese, nova ingestão, escopo pendente e limitação comprovada.
- O menor próximo lote fica registrado sem implementar código ou UI fora desta
  auditoria.
- `docs:validate`, governance, `review:gates` quando aplicável e
  `git diff --check` passam.
