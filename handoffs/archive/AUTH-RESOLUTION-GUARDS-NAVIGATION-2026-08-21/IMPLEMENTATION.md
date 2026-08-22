# IMPLEMENTATION

- Task ID: `AUTH-RESOLUTION-GUARDS-NAVIGATION-2026-08-21`
- State: READY_FOR_REVIEW
- Owner: Sentinel
- Role: REVIEWER
- Reviewer active: Sentinel
- Review mode: SENTINEL_REQUIRED
- Base SHA: `d1f7793`
- Implementation SHA: UNCOMMITTED_WORKTREE

## Diagnóstico

O runtime já usa o manifesto de release antes do predicado de rota, mantém
`/inicio` como recepção autenticada e separa access-denied de sessão expirada.
As regressões focadas serão adicionadas sem criar uma fonte paralela.

## Evidências e resposta aos findings

- O manifesto de release é aplicado antes do predicado de rota.
- `/inicio` permanece como fallback autenticado de Meu espaço.
- Access-denied mantém sessão expirada, sessão anônima e acesso autenticado
  como estados distintos, com saída segura.
- Foi criado `tests/scripts/auth-resolution-guards-navigation.test.mjs` com
  cinco regressões para administrador válido, rota sem autorização, rota não
  publicada, consistência menu/guard e contexto sem autorização.
- Nenhuma migration, RLS, RPC, grant, secret ou integração foi alterada.

### F-AUTHRES-001

`apps/web/src/app/release-surface.mjs`, `apps/web/src/app/router.tsx` e
`apps/web/src/features/home/ReceptionGate.tsx` estão fora da allowlist desta
task. O diff da task não os inclui e nenhuma superfície `home` ou `tenants`
foi publicada por este lote. Alterações preexistentes nesses caminhos, quando
presentes no worktree, foram preservadas fora do lote e não foram descartadas.

### F-AUTHRES-002

Os cinco testes focados comprovam somente resolução estática de autorização,
fallback e consistência menu/guard. Eles não são prova de fluxo React
integrado. A validação integrada de `AccessDeniedPage`, gates e router fica
explicitamente pendente de task autorizada para essa superfície; não foi criado
harness novo nem alterada a allowlist para mascarar essa limitação.

## Gates

### Reconciliação do gate agregado

O primeiro comando agregado terminou com exit code 1. A saída identificou
`npm run review:gates` como o subcomando que falhou, exclusivamente porque o
`handoffs/current/IMPLEMENTATION.md` tinha uma linha em branco final. Isso foi
uma falha mecânica do handoff, não uma regressão de produto. A linha final foi
corrigida sem alterar `REVIEW.md` nem código fora da allowlist.

Na repetição individual, os comandos abaixo terminaram com exit code 0:
`node --test tests/scripts/auth-resolution-guards-navigation.test.mjs`,
`npm run web:typecheck`, `npm run web:build`, `npm run lint`,
`npm run docs:validate`, `npm run review:gates` e `git diff --check`.

- Teste focado: PASS, 5/5, somente resolução estática.
- `npm run web:typecheck`: PASS.
- `npm run web:build`: PASS, 945 módulos.
- `npm run lint`: PASS, 0 erros e 160 warnings preexistentes.
- `npm run docs:validate`: PASS.
- `npm run review:gates`: PASS, 0 regressões bloqueantes.
- `git diff --check`: PASS.

Limitações: não houve prova de fluxo React integrado, QA visual autenticado ou
validação de revogação em sessão de navegador carregada. A ampliação de
release-surface/router/recepção permanece fora deste lote.
