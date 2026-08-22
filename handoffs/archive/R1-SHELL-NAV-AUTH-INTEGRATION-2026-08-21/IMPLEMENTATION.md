# IMPLEMENTATION

- Task ID: `R1-SHELL-NAV-AUTH-INTEGRATION-2026-08-21`
- State: READY_FOR_REVIEW
- Owner: Sentinel
- Reviewer active: Sentinel
- Review mode: SENTINEL_REQUIRED
- Agent coordination: REVIEW_ACTIVE
- Base SHA: `66952d6`
- Implementation SHA: UNCOMMITTED_WORKTREE

## Instrução operacional

Reconciliar shell, menu, header, busca global, guards e landing com a
autorização efetiva já existente. Fazer mudanças pequenas e limitadas à
allowlist. Preservar `/inicio`, o menu global único e os contratos reais.

## Entregáveis

- matriz de rotas e visibilidade de menu;
- testes focused de menu/guard/landing e estados;
- ausência de divergência e loop de navegação;
- gates e limitações de QA autenticado registrados antes de revisão.

## Diagnóstico e evidências

### Matriz factual

| Superfície | Fonte efetiva observada | Resultado local | Limitação |
|---|---|---|---|
| Sidebar e mobile drawer | `minimal-navigation.ts` + `release-surface.mjs` | itens derivados de `isScreenPublishedInRelease` e `screenKeys`; grupos vazios são omitidos | não houve browser autenticado |
| Header e busca global | `MinimalAppShell.tsx` + `GeniusGlobalSearch.tsx` | busca em ponto único; destinos passam pelo manifesto e pela permissão | busca de artigos depende de read model em runtime |
| Menu do usuário | `SidebarAccount` reutilizado na sidebar e no drawer mobile | um componente e uma fonte de identidade; não há menu duplicado no header | QA visual autenticado pendente |
| Rotas e guards | `router.tsx`, `ReleaseSurfaceGate`, `AdminGate`, `ReceptionGate`, `internal-route-access.ts` | `/inicio` é landing publicada; rotas não publicadas e sem grant são negadas | composição React não foi executada neste runner |
| Estados | `ReceptionGate.tsx`, `AccessDeniedPage.tsx`, `HomePage.tsx`, `router.tsx` | booting, anonymous/session expired, config-error, access denied e fallback têm caminhos explícitos | rede/sessão real não validada |

Fato reproduzido: no modo `first-release`, o menu de um administrador expõe somente
`/inicio`, `/admin/analytics`, `/admin/knowledge` e `/admin/access`, e cada destino
passa por `canOpenInternalRoute`; `/admin/tenants` e `/support/queue` não aparecem.
Para um perfil sem grants, somente `/inicio` aparece quando `hasReceptionAccess` é
verdadeiro, sem criação de rota por texto ou role implícito.

Fato reproduzido: o header renderiza `GeniusGlobalSearch` uma vez e o menu de usuário
é `SidebarAccount`, reutilizado pela sidebar desktop e pelo drawer mobile. Não foi
introduzido segundo ponto global de navegação.

Hipótese não declarada como fato: a composição deve permanecer coerente em browser
autenticado porque as decisões puras e as fontes usadas pelo runtime são as mesmas;
isso requer QA autenticado para confirmação end-to-end.

## Alteração do lote

Foi adicionado somente `tests/scripts/shell-navigation-auth-integration.test.mjs`,
com quatro regressões determinísticas para: coerência menu/guard/release, perfil sem
grants, unicidade de busca/menu do usuário e composição dos estados de recepção,
negação e fallback. Nenhum runtime, contrato backend, policy ou integração foi
alterado neste lote, pois a inspeção não encontrou divergência reproduzível que
justificasse mudança executável.

## Gates e limitações

Implementation SHA: `UNCOMMITTED_WORKTREE`.

Gates executados: após corrigir somente as expectativas do teste novo, a execução
focused final passou 20/20, incluindo as quatro regressões novas e os testes de
navegação existentes. `web:typecheck`
PASS, `web:build` PASS com 945 módulos transformados, `lint` PASS com 0 erros e
160 warnings legados, `docs:validate` PASS com 0 bloqueios, `review:gates` PASS
com 0 regressões bloqueantes e 47 itens baseline resolvidos, e `git diff --check`
PASS. A falha preexistente de `/admin/tenants` em `release-surface.test.mjs`
permanece fora da allowlist e não foi corrigida neste lote.

## Entrega para revisão

State: READY_FOR_REVIEW. Owner: Sentinel. Agent coordination: REVIEW_ACTIVE.
Sentinel e Codex devem revisar o diff seletivo, a matriz e a evidência dos testes.
