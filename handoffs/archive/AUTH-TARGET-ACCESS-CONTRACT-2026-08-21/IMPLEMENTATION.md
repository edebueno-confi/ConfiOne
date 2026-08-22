# IMPLEMENTATION

- Task ID: `AUTH-TARGET-ACCESS-CONTRACT-2026-08-21`
- State: READY_FOR_REVIEW
- Owner: Forge
- Role: IMPLEMENTER
- Reviewer active: Sentinel
- Review mode: SENTINEL_REQUIRED
- Coordinator: Codex
- Approval: APPROVED
- Base SHA: `32c5edc`
- Implementation SHA: UNCOMMITTED_WORKTREE

## Estado

Correção factual da especificação documental concluída. Nenhum código
executável, SQL, RLS, RPC, migration, grant, secret ou serviço externo foi
alterado neste lote.

## Resposta aos findings

- F-AUTHTARGET-001: substituir `internal_actor_contexts` por
  `user_actor_contexts`, preservando a distinção entre contexto do ator,
  tenant membership e area membership.
- F-AUTHTARGET-002: alinhar este handoff com o estado `CHANGES_REQUESTED`
  registrado no STATUS antes de devolver para revisão.

## Gates

- `npm run docs:validate`: PASS, 0 bloqueios.
- Auditoria de governança read-only: PASS, 0 bloqueadores.
- `npm run review:gates`: PASS, 0 regressões bloqueantes.
- `git diff --check`: PASS.

## Resultado e evidências

O plano canônico agora define Usuário -> Nível -> Área -> Tela -> READ/WRITE,
deny by default, precedência, escopo tenant/área, stale, auditoria, último
admin, autoalteração, ciclo de vida e de-para conceitual. Fatos executáveis,
recomendações e decisões do proprietário estão separados. Nenhuma alteração
de runtime foi feita.

## Gates

- `npm run docs:validate`: PASS, 0 bloqueios.
- Auditoria de governança read-only: PASS, 0 bloqueadores.
- `npm run review:gates`: PASS, 0 regressões bloqueantes.
- `git diff --check`: PASS.

Limitações: o contrato é proposto e não substitui os contratos atuais; a
cadência de revalidação stale, precedência final e participação de profile
screen grants exigem decisão do proprietário.

Registrar semântica proposta, de-para factual, regras de precedência, riscos,
decisões pendentes, limitações e gates documentais.
