# TASK

- Task ID: `AUTH-ACCESS-MODEL-EXECUTABLE-2026-08-22`
- State: READY_FOR_REVIEW
- Owner: Sentinel
- Role: REVIEWER
- Reviewer active: Sentinel
- Review mode: SENTINEL_REQUIRED
- Coordinator: Codex
- Approval: APPROVED
- Base SHA: `5a523e0e`

## Objetivo

Auditar e especificar o modelo executável de acesso
`Nível → Área → Tela → READ/WRITE`, usando as fontes atuais como base e sem
aplicar mudanças remotas neste lote.

## Escopo

Reconciliar user context, tenant/área, telas, capabilities, roles, grants,
guards, menu, backend, RLS/RPCs, precedência, deny by default, `WRITE` implica
`READ`, auditoria, stale, compatibilidade, último administrador e plano de
migração. Classificar fatos, divergências, riscos e decisões pendentes.

## Fora do escopo

Não executar migrations, grants, RLS/RPC, alteração de claims/scopes, secrets,
produção, deploy, push, merge ou escritas externas. Não substituir fontes
atuais nem implementar a migração executável sem lote específico aprovado.

## Critérios de aceite

- inventário factual das fontes executáveis atuais;
- contrato alvo com semântica de READ/WRITE, escopo, precedência e auditoria;
- matriz de compatibilidade, riscos e contraexemplos;
- plano separado para implementação/migração, sem instrução remota implícita;
- testes/validações documentais, limitações e pedido de revisão independente.
