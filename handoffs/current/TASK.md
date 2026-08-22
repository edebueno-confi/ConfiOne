# TASK

- Task ID: `AUTH-ADMIN-DENIAL-ROOT-CAUSE-2026-08-21`
- State: `READY_FOR_IMPLEMENTATION`
- Owner: `Forge`
- Role: `EXECUTOR`
- Reviewer active: `Sentinel`
- Review mode: `SENTINEL_REQUIRED`
- Approval: `APPROVED`
- Base SHA: `56e5fd3b0a5812fac6f22572f136b2feb82fd8e1`
- Current SHA: `UNCOMMITTED_WORKTREE`

## Objetivo

Reproduzir e corrigir a causa raiz do caso em que um administrador válido recebe
`Acesso negado`, rastreando o fluxo real de cadastro, convite/ativação,
autenticação, sessão, perfil, tenant/organização, role, permissões, route guard,
página, backend e dados.

## Escopo autorizado

- Reproduzir o cenário com usuário administrador válido.
- Inspecionar role persistida e carregada, vínculo organizacional, sessão,
  cache, guards, redirects, resolução de permissões, views/RPCs, policies e
  rotas.
- Corrigir somente a causa mínima comprovada por evidência.
- Adicionar regressão automatizada que autentique, confirme o vínculo, acesse a
  rota esperada e não produza `Acesso negado` indevido.
- Confirmar que rota negada não altera `is_active`, não encerra a sessão e
  oferece `/inicio` como recepção quando autorizado.
- Preservar deny by default, isolamento entre organizações e o tratamento
  distinto de usuário desativado, ausência de workspace e rota inválida.

## Fora de escopo

- Criar nova taxonomia de permissões ou simplificar estruturalmente o modelo.
- Redesign do painel ou alteração do shell global.
- Bypass por e-mail ou pelo frontend.
- Remoção ou enfraquecimento de RLS, permissões ou auditoria.
- Migração em massa, escrita remota, deploy, push, merge, secrets ou release.

## Critérios de aceitação

1. A causa raiz é documentada com evidência de código e contrato.
2. O cenário é reproduzido antes da correção, ou a limitação é explicitada.
3. A correção é validada no backend e na rota afetada.
4. Existe regressão automatizada para o caso corrigido.
5. Deny by default, isolamento entre organizações e usuário desativado são
   preservados.
6. Rota negada e perfil inativo permanecem estados distintos.
7. Nenhum arquivo fora da allowlist é alterado sem decisão de escopo.
8. A entrega para Sentinel ocorre com `State=READY_FOR_REVIEW` e
   `Owner=Sentinel`.

## Allowlist do lote

- `apps/web/src/app/router.tsx`
- `apps/web/src/features/auth/AccessDeniedPage.tsx`
- `apps/web/src/features/auth/AdminGate.tsx`
- `apps/web/src/features/auth/AuthBootstrap.tsx`
- `apps/web/src/features/auth/auth-api.ts`
- `apps/web/src/features/auth/auth-context.tsx`
- `apps/web/src/features/auth/internal-route-access.ts`
- `apps/web/src/features/auth/post-login-navigation.ts`
- `apps/web/src/features/auth/post-login-redirect.ts`
- `apps/web/src/features/home/HomePage.tsx`
- `apps/web/src/features/login/LoginPage.tsx`
- `tests/scripts/access-denied-feedback.test.mjs`
- `tests/scripts/access-control-v2-contract.test.mjs`
- `tests/scripts/post-login-denial-feedback.test.mjs`
- `tests/scripts/release-surface.test.mjs`
- `handoffs/current/TASK.md`
- `handoffs/current/IMPLEMENTATION.md`
- `handoffs/current/REVIEW.md`
- `handoffs/current/STATUS.md`
- `handoffs/README.md`

Qualquer alteração em banco, migration, RLS, RPC, contrato ou arquivo fora da
allowlist exige decisão de escopo antes da inclusão.
