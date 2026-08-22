# IMPLEMENTATION

- Task ID: `AUTH-SCREEN-REGISTRY-2026-08-21`
- State: READY_FOR_REVIEW
- Owner: Forge
- Role: IMPLEMENTER
- Reviewer active: Sentinel
- Review mode: SENTINEL_REQUIRED
- Coordinator: Codex
- Approval: APPROVED
- Base SHA: `56b8119`
- Implementation SHA: UNCOMMITTED_WORKTREE

## Estado

Task promovida sequencialmente a partir da fila canônica. Correção documental
F-AUTHSCREEN-001 concluída; nenhuma alteração de runtime foi feita.

## Resposta ao finding

- Analytics referencia `analytics.view`; `dashboard_viewer` é distinguido como
  papel global, não capability.
- Customer Success, Support e Engenharia são não publicados no manifesto
  `first-release`, embora existam no router/guards.
- Portal foi separado do registry interno como superfície customer-facing.

## Gates

- `npm run docs:validate`: PASS, 0 bloqueios.
- Auditoria de governança read-only: PASS, 0 bloqueadores.
- `npm run review:gates`: PASS, 0 regressões bloqueantes e 47 itens baseline
  resolvidos.
- `git diff --check`: PASS.

## Evidências

- Publicação: `apps/web/src/app/release-surface.mjs`, incluindo screen keys,
  rotas, domínios Analytics e seções de Configurações.
- Router e guards: `apps/web/src/app/router.tsx`,
  `apps/web/src/features/auth/internal-route-access.ts`,
  `AdminGate`, `SupportGate`, `CsGate` e `ReleaseSurfaceGate`.
- Navegação: `apps/web/src/features/navigation/minimal-navigation.ts`.
- Backend/contratos: `packages/contracts/src/index.ts` e migrations de
  capabilities/effective permissions; a autorização efetiva permanece no
  backend/RLS/RPC.
- Testes read-only: `tests/scripts/release-surface.test.mjs` e
  `tests/scripts/access-control-v2-contract.test.mjs`.

O documento canônico agora separa publicação, descoberta no menu, proteção por
guard e boundary backend, além de classificar Support/CS/Engineering como
divergências ou lacunas quando não existe uma fonte única comprovada. Nenhuma
tela, capability ou rota foi inventada.

## Gates e limitações

- `npm run docs:validate`: PASS, 0 bloqueios; alertas históricos preservados.
- Auditoria de governança read-only: PASS, 0 bloqueadores; ressalvas
  heurísticas preexistentes preservadas.
- `npm run review:gates`: PASS, 0 regressões bloqueantes e 47 itens baseline
  resolvidos.
- `git diff --check`: PASS.
- Não houve mudança executável nem QA visual/autenticado; a reconciliação é
  documental e não prova equivalência ponta a ponta entre menu, guards e
  backend. Rotas ocultas e capabilities não encontradas no manifesto ficaram
  como futuras/lacunas, não foram promovidas.

## Evidência prevista

Registrar fontes reconciliadas, matriz factual, divergências, gates e limitações
antes de entregar o lote ao Sentinel.
