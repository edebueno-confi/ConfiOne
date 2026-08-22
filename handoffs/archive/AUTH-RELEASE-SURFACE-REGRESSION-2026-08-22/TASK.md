# TASK

- Task ID: `AUTH-RELEASE-SURFACE-REGRESSION-2026-08-22`
- State: READY_FOR_REVIEW
- Owner: Sentinel
- Role: REVIEWER
- Reviewer active: Sentinel
- Review mode: SENTINEL_REQUIRED
- Coordinator: Codex
- Approval: APPROVED
- Base SHA: `8d16f40b`

## Objetivo

Publicar `/admin/tenants` no manifesto `first-release`, corrigir a divergência
entre rota, screen key, guards, navegação e testes, e preparar o deploy
solicitado pelo proprietário sem bypass de autorização.

## Escopo

Atualizar apenas o release surface e testes diretamente relacionados, usando a
screen key `tenants` e os guards/contratos já existentes. Validar navegação,
post-login, acesso de `platform_admin`, negação por perfil sem capability,
rotas filhas e inconsistências do manifesto. Preparar checklist de deploy e
registrar o destino/limitações do fluxo Vercel.

## Fora do escopo

Não alterar RLS/RPC, migrations, banco, secrets, credenciais ou dados externos.
Não criar bypass de autorização. Não fazer deploy antes da revisão independente,
gates verdes e verificação do caminho autorizado em `main`.

## Critérios de aceite

- `/admin/tenants` publicado no manifesto first-release;
- screen key, guards, menu e testes coerentes;
- `platform_admin` alcança a rota e perfis sem capability continuam negados;
- testes, typecheck, build, lint, docs e review gates passam;
- checklist de deploy, rollback e pré-condições registrado.
