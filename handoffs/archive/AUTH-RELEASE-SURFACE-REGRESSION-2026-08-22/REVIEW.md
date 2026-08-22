# REVIEW

- Task ID: `AUTH-RELEASE-SURFACE-REGRESSION-2026-08-22`
- Reviewer: Sentinel (Codex Independent Reviewer)
- Review mode: SENTINEL_REQUIRED
- Estado revisado: READY_FOR_REVIEW
- Base SHA: `8d16f40b`
- Implementation SHA: `UNCOMMITTED_WORKTREE`
- Decisão: **APPROVED**
- Data da revisão: 2026-08-22

## Funcionalidade avaliada

Publicação de `/admin/tenants` no manifesto first-release usando a screen key
existente `tenants`, mantendo os guards, menu e contratos de autorização
existentes. O lote não altera backend, RLS, banco ou integrações.

## Evidências independentes

- Diff allowlisted confirmado em `release-surface.mjs` e
  `shell-navigation-auth-integration.test.mjs`.
- `tenants` foi adicionado a `FIRST_RELEASE_SCREEN_KEYS` e
  `/admin/tenants` foi associado à mesma screen key.
- `internal-route-access.ts` já mapeia `/admin/tenants` para `tenants`; não
  foi criado bypass novo.
- O teste allowlisted executou 4 testes e passou 4/4.
- `npm run test:focused`: PASS, 285/285 testes.
- `npm run web:typecheck`: PASS.
- `git diff --check`: PASS.
- Gates registrados: build 945 módulos, lint 0 erros/160 warnings legados,
  docs:validate PASS e review:gates PASS com 0 regressões/47 baseline.

## Avaliação técnica

O diff mantém coerência entre manifesto, screen key, rota, menu e guard. O
cenário de `platform_admin` e a negação por ausência de `tenants` são cobertos
pelas asserções do teste. O checklist de deploy/rollback está documentado e
nenhum deploy ou ação externa foi executado.

## Finding histórico

### F-AUTHREL-001 — Contagem do gate focused não é reproduzível — RESOLVIDO

- Severidade: MEDIUM, integridade de evidência
- Evidência original: `IMPLEMENTATION.md` declarava 40/40 sem comando ou
  conjunto reproduzível correspondente.
- Resolução verificada: o handoff agora registra 4/4 para o teste allowlisted e
  285/285 para `npm run test:focused`, removendo a contagem incorreta.
- O finding permanece para rastreabilidade e não bloqueia o lote.

## Ganho para o produto e o SaaS

O lote torna a Central de Clientes acessível na primeira superfície publicada
para perfis autorizados, sem criar uma regra de autorização paralela. A
reconciliação da evidência é necessária para que o deploy não seja baseado em
um gate não auditável.

## Limitações e decisão

Não foram executados deploy, produção, secrets, banco, RLS/RPC, migrations,
push, merge ou chamadas externas. O lote está **APPROVED**. Owner é devolvido
ao Forge para `FINALIZE_LOCAL` seletivo, validação da allowlist e eventual
checklist operacional separado. A aprovação do Sentinel não substitui
autorização operacional separada para deploy.
