# IMPLEMENTATION

- Task ID: `R1-MY-SPACE-SAFE-LANDING-2026-08-21`
- State: READY_FOR_REVIEW
- Owner: Sentinel
- Reviewer active: Sentinel
- Review mode: SENTINEL_REQUIRED
- Base SHA: `cce0fdd`
- Implementation SHA: UNCOMMITTED_WORKTREE

## Instrução operacional

Reconciliar a landing e o fallback com guards, menu e resolução de autorização
existentes. Alterações devem ser pequenas e limitadas à allowlist. O backend é
a fonte da verdade; não criar regra local de permissão ou workspace falso.

## Entregáveis

- matriz de rotas e superfícies permitidas;
- testes focados de landing, access denied e fallback;
- estados loading/error/empty e ausência de workspace;
- evidência de ausência de loop e de bypass;
- gates e limitações de QA autenticado registrados antes de READY_FOR_REVIEW.

## Evidências e matriz

O runtime diretamente relacionado foi alterado apenas para alinhar a recepção
segura ao contrato da task. O comportamento foi validado contra os contratos
reais:

| Cenário | Resultado | Evidência | Limitação |
| --- | --- | --- | --- |
| Sessão interna autenticada | PASS contratual | `post-login-redirect.ts` define `hasReceptionAccess: true`; `internal-route-access.ts` aceita `/inicio` publicado | sem QA browser autenticado nesta task |
| Rota sem autorização | PASS | `getDefaultInternalLandingRoute` procura rota publicada permitida e retorna `null` quando não há contexto | resolução async completa depende do backend local |
| Rota não publicada | PASS | guard rejeita superfície não publicada antes da autorização; teste focused cobre `/support/queue` | sem navegação browser |
| Access Denied | PASS contratual | autenticado retorna `/inicio` com `fromAccessDenied`; anônimo retorna `/login` | renderização React não executada |
| Ausência de workspace | PASS contratual | contexto vazio mantém recepção e fallback seguro; não inventa screen key ou workspace | cenário completo depende de view/RPC local |
| Loading/error/empty | PASS estático | `AdminGate` cobre loading, contract-unavailable, error, denied e session expired; `HomePage` cobre loading/error/empty operacional | estados foram validados por contrato, não por browser |
| Loop de redirect | PASS estático | normalização rejeita `/login` e `/access-denied` como destino e fallback converge em `/inicio` | ausência de teste E2E autenticado |
| Menu/guard | PASS | `auth-resolution-guards-navigation.test.mjs` compara destinos publicados contra `canOpenInternalRoute` | sem QA visual autenticado |

Arquivos executáveis do lote: `release-surface.mjs`, `router.tsx`,
`ReceptionGate.tsx`, `auth-resolution-guards-navigation.test.mjs` e
`my-space-safe-landing.test.mjs`. O teste novo cobre landing, composição do
router, retorno do Access Denied e estados do guard.

## Gates

- testes focused combinados: 12/12 PASS após a regressão de sessão expirada;
- `npm run web:typecheck`: PASS;
- `npm run web:build`: PASS, 945 módulos transformados;
- `npm run lint`: PASS, 0 erros e 160 warnings legados;
- `npm run docs:validate`: PASS, 0 bloqueios;
- `npm run review:gates`: PASS, 0 regressões bloqueantes e 47 itens do baseline
  resolvidos;
- `git diff --check`: PASS.

Nenhuma chamada externa, escrita em banco, alteração de autorização ou
mudança de shell global foi executada. A mudança de runtime ficou restrita à
publicação e proteção da recepção `/inicio`.

## Resposta aos findings

- F-MYSPACE-001: corrigido no runtime. `/inicio` agora é rota publicada e
  landing de primeiro release, sem redirect para `/admin/analytics`; o router
  usa `ReceptionGate`, que exige apenas autenticação e não exige Suporte,
  Analytics ou workspace. Isso encerra o ciclo observado sem liberar rotas
  operacionais.
- F-MYSPACE-002: o teste focused agora importa o manifest real, lê a composição
  do router, `ReceptionGate` e `SupportGate`, e executa `getReleaseLandingRoute`,
  `isRoutePublishedInRelease`, `resolveReleaseRedirect` e o fallback de
  navegação. A cobertura continua contratual, sem renderização browser.

Revalidação focused: 12/12 PASS. O teste amplo de `release-surface` ainda
apresenta falhas preexistentes relacionadas à publicação de `/admin/tenants`,
alteração fora deste lote; essa contaminação foi preservada e não foi incluída
na correção.

- F-MYSPACE-003: `ReceptionGate` agora lê `sessionExpired` e renderiza
  `SessionExpiredState` com ações de encerramento/limpeza antes de renderizar o
  shell. O teste focused verifica explicitamente esses elementos.
- F-MYSPACE-004: a evidência acima lista os arquivos de runtime realmente
  alterados e as contagens atualizadas do focused e do build.
