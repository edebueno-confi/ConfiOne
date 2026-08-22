# TASK: FINANCE-DOMAIN-AUDIT-2026-08-21

## Estado de abertura

- State: READY_FOR_IMPLEMENTATION
- Owner: Forge
- Role: EXECUTOR
- Reviewer active: Sentinel
- Review mode: SENTINEL_REQUIRED
- Approval: APPROVED
- Base SHA: `55c097e18016ecdcf8d561a8b46980f771e6acf2`
- Current SHA: `55c097e18016ecdcf8d561a8b46980f771e6acf2`

## Objetivo

Auditar e documentar a semântica do domínio Financeiro no ConfiOne, com foco em
recebido, a receber, vencido e aging. O documento deve distinguir posição
atual, histórico, metas e ausência de dados, deixando explícitos fonte,
proveniência, tenant, datas consideradas, timezone, frescor e permissões.

## Escopo autorizado

1. Criar `docs/ANALYTICS_FINANCE_DOMAIN_AUDIT_V1.md`.
2. Atualizar, somente se necessário para refletir esta auditoria,
   `docs/PROJECT_STATE.md`, `docs/DOCUMENTATION_LEDGER.md` e `docs/README.md`.
3. Atualizar os quatro artefatos deste handoff e a linha correspondente da
   fila em `handoffs/README.md`.
4. Auditar contratos, especificações e código local para registrar fatos,
   hipóteses, limitações, estados de ausência e o menor próximo lote.

## Fora de escopo

- Código de produto, SQL, RPC, view, migration, RLS, integração, ingestão ou
  alteração de contratos executáveis.
- UI, dashboard, cálculo local, escrita em HubSpot/Omie ou qualquer fonte
  externa.
- Push, merge, deploy, migration remota, secrets e release surface.

## Critérios de aceite

- Cada métrica documentada possui fonte, campo, recorte temporal, timezone,
  tenant, proveniência, cobertura, frescor e estado de ausência explicitados.
- `received`, `receivable`, `overdue` e `aging` não são tratados como
  equivalentes e ausência não é convertida em zero.
- A documentação distingue contrato executável, snapshot histórico, hipótese
  e capacidade que depende de nova ingestão, escopo ou decisão de produto.
- A menor próxima task autorizada para validação/ingestão fica registrada sem
  implementar trabalho fora deste lote.
- `docs:validate`, `review:gates` quando aplicável e `git diff --check` passam.
