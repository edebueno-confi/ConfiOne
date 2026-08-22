# TASK

- Task ID: `R1-SHELL-NAV-AUTH-INTEGRATION-2026-08-21`
- State: READY_FOR_REVIEW
- Owner: Sentinel
- Role: REVIEWER
- Reviewer active: Sentinel
- Review mode: SENTINEL_REQUIRED
- Coordinator: Codex
- Approval: APPROVED
- Base SHA: `66952d6`

## Objetivo

Fechar o shell interno e sua integração com a autorização efetiva, garantindo
sidebar, header, busca global, menu do usuário, rotas, guards e fallback
consistentes.

## Escopo

Validar e corrigir somente a composição existente de shell e navegação. Menu e
guards devem usar a mesma fonte de verdade, com estados loading, error, empty,
denied e fallback. Preservar a landing `/inicio` aprovada e o menu global único.

Allowlist: runtime de shell/navegação/guards diretamente relacionado, testes
focused e handoffs. Não redesenhar o shell nem duplicar navegação.

## Fora do escopo

Não alterar backend, RLS, RPC, migrations, grants, policies, secrets,
integrações, produção ou rotas externas. Não inventar permissões, itens de menu
ou dados; toda visibilidade deve vir da autorização efetiva.

## Critérios de aceite

- sidebar e menu refletem rotas efetivamente permitidas;
- header, busca global e usuário permanecem em ponto único;
- guards, menu e landing não divergem nem criam loops;
- loading/error/empty/denied/fallback cobertos;
- testes, gates e limitações de QA autenticado registrados.
