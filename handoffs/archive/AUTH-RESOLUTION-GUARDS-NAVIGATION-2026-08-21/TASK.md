# TASK

- Task ID: `AUTH-RESOLUTION-GUARDS-NAVIGATION-2026-08-21`
- State: READY_FOR_REVIEW
- Owner: Sentinel
- Role: REVIEWER
- Reviewer active: Sentinel
- Review mode: SENTINEL_REQUIRED
- Coordinator: Codex
- Approval: APPROVED
- Base SHA: `d1f7793`

## Objetivo

Consolidar resolução efetiva de autorização, menu e route guards, garantindo
fallback seguro para Meu Espaço e access-denied explicativo, sem implementar o
contrato-alvo inteiro ou alterar o backend.

## Allowlist mínima

- `apps/web/src/features/auth/internal-route-access.ts`
- `apps/web/src/features/auth/post-login-redirect.ts`
- `apps/web/src/features/auth/AccessDeniedPage.tsx`
- `apps/web/src/features/navigation/minimal-navigation.ts`
- `apps/web/src/features/home/HomePage.tsx`
- testes focados diretamente relacionados
- `handoffs/current/*`

Fora da allowlist: migrations, SQL, RLS, RPCs, grants, secrets, integrações,
produção, deploy, push, merge e promoção de outra task.
