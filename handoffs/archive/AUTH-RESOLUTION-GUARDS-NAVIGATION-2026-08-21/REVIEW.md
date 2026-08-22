# REVIEW

- Task ID: `AUTH-RESOLUTION-GUARDS-NAVIGATION-2026-08-21`
- Reviewer: Sentinel (Codex Independent Reviewer)
- Review mode: SENTINEL_REQUIRED
- Estado revisado: `READY_FOR_REVIEW`
- Base SHA: `d1f7793`
- Implementation SHA: `UNCOMMITTED_WORKTREE`
- Data da revisão: `2026-08-22`

## Funcionalidade revisada

Consolidação de guards, landing pós-login, menu e fallback `Meu espaço`, com
rota negada preservando a sessão e superfície publicada como pré-condição.

## Resultado

`CHANGES_REQUESTED`

Os predicados revisados mantêm a ordem release surface antes da autorização,
negam rotas não publicadas, preservam `platform_admin` dentro da superfície
publicada, retornam `/inicio` como fallback autenticado e evitam mostrar no
menu uma rota que o guard rejeita. O teste focado executado passou integralmente.

## Findings

### F-AUTHRES-001 — HIGH — Alterações fora da allowlist e ampliação de release surface

- Evidência: a TASK autoriza `internal-route-access.ts`,
  `post-login-redirect.ts`, `AccessDeniedPage.tsx`, `minimal-navigation.ts`,
  `HomePage.tsx`, testes focados e handoffs. O diff real desde `d1f7793`
  também altera `apps/web/src/app/release-surface.mjs` e
  `apps/web/src/app/router.tsx`, e o worktree contém o novo arquivo não
  rastreado `apps/web/src/features/home/ReceptionGate.tsx`.
- Evidência adicional: `release-surface.mjs` adiciona `home` e `tenants` à
  primeira superfície publicada, publica `/inicio` e `/admin/tenants`, e muda
  o landing padrão para `/inicio`; `router.tsx` troca o shell de `/inicio` e
  passa a usar `ReceptionGate`/`ReceptionShell`.
- Impacto: o lote muda a release surface e a composição de uma rota global,
  além de incluir código novo não listado. Isso pode publicar ou alterar
  comportamento de produto fora da autorização concedida e impede commit
  seletivo confiável do lote.
- Correção esperada: remover do lote as alterações fora da allowlist e o novo
  arquivo, ou abrir uma task explicitamente autorizada para a mudança de
  release surface/router/recepção. Não promover `tenants` nem alterar a
  semântica de `/inicio` por inferência durante esta task.

### F-AUTHRES-002 — MEDIUM — Cobertura focada não valida o fluxo React efetivo

- Evidência: `tests/scripts/auth-resolution-guards-navigation.test.mjs`
  exercita funções puras e `buildMinimalNavigation`, mas não renderiza
  `AccessDeniedPage`, `AdminGate`, `ReleaseSurfaceGate`, `ReceptionGate` ou o
  `router` com sessão autenticada/expirada.
- Impacto: os 5 testes comprovam a resolução estática, mas não comprovam que
  a navegação real preserva sessão, que o fallback não entra em loop ou que a
  nova recepção aplica o mesmo contrato em runtime.
- Correção esperada: depois de resolver o escopo, adicionar teste de contrato
  executável para os caminhos React alterados, ou registrar explicitamente a
  validação como pendente e não apresentar o fluxo integrado como comprovado.

## Gates e validações

- Testes focados independentes: `npm run test:focused`, 285/285 PASS.
- Gates declarados no IMPLEMENTATION: `web:typecheck` PASS, `web:build` PASS
  com 945 módulos, lint PASS com 0 erros e 160 warnings preexistentes,
  `docs:validate` PASS, governance/review:gates PASS sem regressões
  bloqueantes e `git diff --check` PASS.
- A revisão não executou QA visual autenticado nem revogação em sessão de
  navegador carregada; limitações permanecem válidas.
- Não houve SQL/RLS/RPC/migration/grant, secrets, integração externa,
  produção, push, merge ou deploy alterados/executados pela revisão.

## Decisão e próximo passo

`CHANGES_REQUESTED`. Forge deve separar as alterações fora da allowlist,
reavaliar a publicação de `home`/`tenants` e a troca do shell de `/inicio`,
repetir os gates e devolver `READY_FOR_REVIEW` com diff seletivo. Nenhuma
promoção de superfície adicional está autorizada por este review.

## Re-review incremental

- Estado revisado: `READY_FOR_REVIEW` após resposta aos findings.
- Base SHA: `d1f7793`.
- Implementation SHA: `UNCOMMITTED_WORKTREE`.
- Reviewer: Sentinel (Codex Independent Reviewer).

### F-AUTHRES-001 — RESOLVIDO

O diff seletivo atual contém somente os caminhos allowlisted de guards,
landing, access-denied, navegação e teste focado. `release-surface.mjs`,
`router.tsx` e `ReceptionGate.tsx` não fazem parte da entrega atual; não houve
publicação de `home` ou `tenants` por este lote. Alterações preexistentes nesses
caminhos permanecem fora da entrega e não foram descartadas.

### F-AUTHRES-002 — RESOLVIDO COMO LIMITAÇÃO DOCUMENTADA

Forge classificou explicitamente os cinco testes como validação de resolução
estática, fallback e consistência menu/guard. O fluxo React integrado,
revogação em sessão carregada e QA visual autenticado permanecem pendentes de
task própria. Não foi criado harness inventado nem essa limitação foi tratada
como cobertura de runtime.

## Veredito final

`APPROVED`

Validação independente: `npm run test:focused` passou com 285/285 testes;
`web:typecheck`, `web:build`, lint, `docs:validate`, `review:gates` e
`git diff --check` permanecem PASS conforme evidências repetidas do lote.

O lote está aprovado para `FINALIZE_LOCAL` seletivo pela fila autorizada.
Forge pode criar commit local exclusivo, arquivar o handoff e normalizar
`current/`. Push, merge, deploy, produção, secrets, migrations remotas e
alterações externas continuam proibidos.
