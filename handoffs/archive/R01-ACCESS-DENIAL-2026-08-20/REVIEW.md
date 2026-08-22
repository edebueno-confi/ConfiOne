# Review

## Task ID

R01-ACCESS-DENIAL-2026-08-20

## Reviewer

Claude, Principal Engineer / Independent Code Reviewer

## Commit revisado

Base SHA `eece172fba56f290fa03b025d33263c3ac3f6528`, branch `main`.
Estado revisado: worktree não commitado sobre esse base SHA.
`Implementation SHA` permanece `UNSET` porque o lote não foi commitado; o veredito
vale para o conteúdo do worktree verificado nesta data.

## Veredito

APPROVED, restrito ao escopo declarado no `TASK.md`.

A correção é mínima, fica no consumidor do estado, não toca autorização, release
surface, banco, contratos nem migrations, e todos os `reason` alcançáveis no
código produzem mensagem segura. Os gates determinísticos foram reexecutados por
mim e não apresentaram regressão.

Ressalva central: este lote resolve apenas metade do finding R-01. O caminho de
login continua descartando o motivo da negação. Ver R01-F01. R-01 não deve ser
fechado na fila.

## Escopo revisado

| Arquivo | Situação | Papel neste lote |
| --- | --- | --- |
| `apps/web/src/features/home/HomePage.tsx` | modificado | consumo do estado e renderização do aviso |
| `tests/scripts/access-denied-feedback.test.mjs` | novo | teste de contrato do lote |
| `handoffs/current/TASK.md`, `IMPLEMENTATION.md`, `STATUS.md` | modificados | artefatos de handoff |

Nenhum outro arquivo de produto entrou no lote. O worktree passou de 78 para 74
entradas: as 5 saídas correspondem ao commit `eece172` e a única entrada nova é o
teste do R-01.

`AccessDeniedPage.tsx` e `post-login-redirect.ts` aparecem como modificados, mas
são alterações preexistentes do worktree de takeover, não deste lote. Evidência:
o veredito do ciclo 0 já citava, na linha 68, exatamente o `<Navigate>` com
`fromAccessDenied` hoje presente no arquivo.

O bloco `isSupportOperator` que aparece no `git diff` de `HomePage.tsx` também é
preexistente, não foi introduzido por este lote. Evidência:
`.review/verdicts/takeover-worktree-2026-08-19.md` linha 124 já registrava que
`HomePage.tsx:76` deixou de chamar `listInboxItems()`. Registro isso de forma
explícita porque uma leitura ingênua do diff contra `eece172` atribuiria esse
bloco ao Codex.

## Verificações reexecutadas pelo revisor

| Verificação | Comando | Resultado observado |
| --- | --- | --- |
| Teste do lote | `node --test tests/scripts/access-denied-feedback.test.mjs` | PASS, 1/1 |
| Suíte completa | `npm run test:all` | PASS, 551/551, exit 0 |
| Typecheck web | `npm run web:typecheck` | PASS, exit 0 |
| Gates determinísticos | `npm run review:gates` | 0 regressões bloqueantes, 1 item de baseline resolvido |
| Higiene do diff | `git diff --check` | limpo, exit 0 |
| Integridade do baseline | `certutil -hashfile .review/baseline.json SHA256` | `dcc1214e...fa024`, idêntico ao declarado |
| Integridade do veredito do ciclo 0 | `certutil -hashfile .review/verdicts/takeover-worktree-2026-08-19.md SHA256` | `e582dce8...667ec`, idêntico ao declarado |
| Baseline não regravado | leitura de `.review/baseline.json` | 12 gates, `updatedAt` original `2026-08-19T23:55:51.762Z` |

Não executei `npm run lint`, `npm run web:build` nem QA visual autenticado neste
ciclo. O Codex declarou os dois primeiros como PASS; registro como declarado pelo
implementador, não como verificado por mim.

## Pendências do ciclo anterior, agora verificadas

| Item | Situação |
| --- | --- |
| Materialização do O-01 em commit | CONCRETIZADA. `git log --all -- .review/baseline.json` e o mesmo comando para o veredito retornam `eece172`. Os artefatos existem no histórico e um clone limpo passa a ter baseline. |
| Release safety, D-02 | PRESERVADA. `git show --stat HEAD` lista 10 arquivos e nenhum é `apps/web/src/app/release-surface.mjs`. O histórico do arquivo continua parando em `d9b74ae`, anterior ao takeover. |
| G-01, indentação do item 9 de `handoffs/README.md` | RESOLVIDO. O item 9 agora usa continuação de 3 espaços, coerente com a lista. |
| Preservação do veredito GOV-O01 | PRESERVADA. `handoffs/archive/GOV-O01-2026-08-20/REVIEW.md` mantém veredito `APPROVED`, O-01 RESOLVED, G-01 e O-02. `handoffs/current/REVIEW.md` foi corretamente reinicializado como template antes deste lote. |

## Verificação funcional do R-01

Rastreei os `reason` realmente emitidos no código e confrontei com o mapeamento
novo em `HomePage.tsx`:

| `reason` emitido | Onde é emitido | Tratamento no `/inicio` |
| --- | --- | --- |
| `missing-authorized-workspace` | `AccessPage:689`, `KnowledgePage:2110`, `SupportWorkspacePage:4696,6806,7220`, `SystemPage:571`, `TenantsPage:1747`, `InternalActionsWorkspacePage:623`, `LoginPage:75` | mensagem padrão, equivalente em conteúdo à do `AccessDeniedPage` |
| `route-not-authorized` | `AdminGate:130`, `CsGate:152`, `CustomerPortalPage:613`, `SupportGate:107,119`, fallbacks de `SupportGate:88` e `AccountSelfShell:67` | mensagem específica de permissão |
| `missing-profile`, `inactive-profile`, `missing-platform-admin` | `auth-api.ts:68,75,101` via `gate.denialReason` | mensagem específica por caso |

Nenhum `reason` alcançável cai em branch inexistente e nenhum branch do
`describeAccessDeniedNotice` é inalcançável. Nenhuma mensagem expõe rota, tabela,
policy, papel interno ou detalhe de implementação.

Caminho de entrega do estado, verificado por leitura: `AccessDeniedPage` emite
`<Navigate replace state={{ fromAccessDenied, reason }} to="/inicio" />`;
`router.tsx:574` mapeia `/inicio` para `ReceptionGate` envolvendo `HomePage`;
`ReceptionGate` retorna `children` no caso autenticado, sem `Navigate`
intermediário, portanto o `location.state` chega intacto ao `HomePage`.
`FIRST_RELEASE_REDIRECTS` contém apenas `['/admin','/admin/analytics']`, logo
`/inicio` não é redirecionado.

`MinimalNotice` aceita `tone="warning"`, usa tokens do design system e aplica
`role="status"` para tons não críticos, o que satisfaz o requisito de aviso
acessível e não bloqueante.

## Findings

### R01-F01 - MEDIUM - Negação silenciosa persiste no caminho de login

Classificação: FRONTEND_FIX_REQUIRED. Fora do escopo deste lote, exige lote próprio.

O R-01 tinha duas metades. Este lote fechou a primeira, o estado escrito pelo
`AccessDeniedPage` e nunca lido. A segunda continua aberta.

Evidência:

- `apps/web/src/features/auth/post-login-redirect.ts:194-206` sempre devolve
  `destination` não nulo para o perfil ativo, porque o fallback é
  `getDefaultInternalLandingRoute(context)`, e ainda assim calcula
  `denialReason: 'missing-authorized-workspace'` quando a rota pedida foi negada.
- `apps/web/src/features/login/LoginPage.tsx:65-76` ramifica em
  `if (resolution.destination)` e retorna antes de olhar `denialReason`. O motivo
  só é usado quando `destination` é nulo, o que hoje ocorre apenas no caso
  `!data.is_active` em `post-login-redirect.ts:166-176`.

Consequência: o usuário que faz login com `?redirectTo=` para uma área sem
permissão é levado para a landing padrão sem qualquer explicação. É a mesma classe
de perda de contexto que o R-01 descreveu, por outra porta.

Não bloqueia este lote porque o `TASK.md` colocou a lógica de autorização e o
`AccessDeniedPage` explicitamente fora de escopo. Recomendo um lote `R01-B` que
propague `denialReason` para o destino, provavelmente reaproveitando o mesmo
contrato `fromAccessDenied` já consumido pelo `/inicio`.

### R01-F02 - LOW - O teste não pode falhar na regressão mais provável

Classificação: test-coverage.

`tests/scripts/access-denied-feedback.test.mjs` faz apenas `assert.match` sobre o
texto dos dois arquivos. Ele passa mesmo que a condição seja invertida para
`!accessDeniedState?.fromAccessDenied`, mesmo que o mapeamento de `reason` retorne
a mensagem errada e mesmo que o aviso seja renderizado sempre. O critério de
aceitação "o aviso é renderizado apenas quando `fromAccessDenied` estiver
presente" não tem, portanto, nenhuma verificação executada: não há teste
comportamental e o QA visual autenticado não foi rodado, como o próprio
`IMPLEMENTATION.md` declara.

O padrão de asserção sobre fonte é legítimo no repositório para `.tsx`, por
exemplo `minimal-navigation.test.mjs:99-109`, então isto não é violação de
convenção e não justifica REQUEST_CHANGES. O ponto é que existe um padrão melhor
já em uso: `minimal-navigation.ts` exporta lógica pura e
`minimal-navigation.test.mjs:78-83` testa comportamento.

Recomendação: extrair o mapa `reason` para mensagem em um módulo exportado, por
exemplo `apps/web/src/features/home/access-denied-notice.ts`, e testar
comportamentalmente cada `reason` mais o caso ausente. O componente continua
coberto pela asserção de fonte para o `MinimalNotice`.

### R01-F03 - LOW - Semântica dos campos de handoff

Classificação: documentação. Reincidência da família do O-02.

- `handoffs/current/IMPLEMENTATION.md` abre com "Implementação em andamento do
  R-01" enquanto o `STATUS.md` do mesmo lote está em `READY_FOR_REVIEW`. Os dois
  não podem ser verdade ao mesmo tempo.
- `STATUS.md` traz `Last reviewer: NONE` e ao mesmo tempo
  `Last review: R-01 — negação de acesso silenciosa`. O campo foi usado para
  descrever o assunto do lote, não uma revisão ocorrida. Antes deste ciclo não
  havia revisão alguma para registrar.

Não afeta código. Afeta a leitura do estado por qualquer agente que confie nos
artefatos, que é justamente o mecanismo escolhido para o fluxo multiagente.

## O que não é achado

- O `missing-authorized-workspace` cair na mensagem padrão do `/inicio` em vez de
  ter branch próprio. O `TASK.md` previu exatamente isso no critério de aceitação
  e o texto padrão é equivalente em conteúdo ao do `AccessDeniedPage`.
- O bloco `isSupportOperator` e a mudança do `useEffect` em `HomePage.tsx`. São
  preexistentes ao lote, conforme evidência citada na seção de escopo.
- `PGTAP_POSITIONAL_ASSERT` marcar `total=3` contra `baseline=4`. É o item
  resolvido no lote ANALYTICS-R05 e o baseline foi deliberadamente mantido
  congelado.
- `Implementation SHA: UNSET`. Coerente com um lote ainda não commitado, mesma
  situação do GOV-O01.

## O que não foi validado

- Comportamento em execução: nenhum render foi exercido. O repositório não tem
  jsdom, vitest nem react-testing-library nas devDependencies, então não existe
  infraestrutura instalada para teste de render.
- QA visual autenticado no `/inicio` com e sem `fromAccessDenied`.
- `npm run lint` e `npm run web:build` neste ciclo.
- Persistência do aviso após recarregar `/inicio`. Como o `Navigate` usa
  `replace`, o `state` fica na entrada de histórico e o aviso deve reaparecer no
  refresh, sem ação de dispensar. Não testei e o `TASK.md` não pediu dispensa.

## Observações

- A eficácia do R-01 está acoplada à decisão D-02 / R-04, ainda aberta. Se a
  ativação de `/inicio` no release padrão for revertida e o redirect
  `['/inicio','/admin/analytics']` voltar, o aviso deixa de ser alcançável na
  superfície publicada. Vale considerar isso ao decidir o D-02.
- Nenhum código de produto, migration, contrato, teste ou configuração executável
  foi alterado por esta revisão. Nenhum commit, push, merge, deploy ou operação
  remota foi executado.

## Próximo passo recomendado

1. Integrar este lote em commit próprio, com `HomePage.tsx`, o teste novo e os
   artefatos de handoff.
2. Manter R-01 aberto na fila e abrir `R01-B` para o R01-F01.
3. Só depois seguir para R-03, conforme a fila autorizada em `handoffs/README.md`.
