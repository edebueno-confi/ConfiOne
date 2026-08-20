# Review

## Task ID

R01-B-ACCESS-DENIAL-LOGIN-2026-08-20

## Reviewer

Claude, Principal Engineer / Independent Code Reviewer

## Commit revisado

Base SHA `c6bffd8c4a94d91714b9a14c2e285b5c37bf0727`, branch `main`.
Estado revisado: worktree não commitado sobre esse base SHA.

## Veredito

APPROVED.

O finding R01-F01 está resolvido pela via correta. A lógica de decisão saiu do
componente para um módulo puro exportado, o motivo só é anexado quando existe, o
caminho `destination = null` para `/access-denied` foi preservado e o teste desta
vez é comportamental, não asserção de texto.

## Escopo revisado

| Arquivo | Situação | Papel |
| --- | --- | --- |
| `apps/web/src/features/auth/post-login-navigation.ts` | novo | helper puro de estado de navegação |
| `apps/web/src/features/login/LoginPage.tsx` | modificado | passa a propagar `denialReason` no ramo `resolved` |
| `tests/scripts/post-login-denial-feedback.test.mjs` | novo | teste comportamental do helper mais contrato de ligação |
| `handoffs/README.md` | modificado | fila atualizada com R01-B ativo |
| Artefatos de handoff correntes | modificados | TASK, IMPLEMENTATION, STATUS, REVIEW |

Nenhum outro arquivo de produto entrou. Confirmado por `git status --short`:
não há migration nova, contrato novo, alteração de RLS nem alteração de
`apps/web/src/app/release-surface.mjs`. `post-login-redirect.ts` não precisou ser
tocado porque `PostLoginDenialReason` já era exportado e já era importado pelo
`LoginPage`.

## Verificação do finding R01-F01

RESOLVED.

Antes: `LoginPage` ramificava em `if (resolution.destination)` e retornava sem
olhar `denialReason`, então o único caso que produzia motivo visível era
`destination = null`.

Agora, rastreando os três caminhos:

| Caso | `destination` | `denialReason` | Navegação resultante |
| --- | --- | --- | --- |
| Rota pedida negada, perfil ativo | landing fallback, hoje `/inicio` | `missing-authorized-workspace` | destino com `state = { fromAccessDenied: true, reason }` |
| Rota pedida autorizada | a rota pedida | `null` | destino sem `state`, comportamento anterior preservado |
| Perfil inativo | `null` | `inactive-profile` | `/access-denied` com `state = { reason }`, comportamento anterior preservado |

`post-login-redirect.ts:202-206` só produz `denialReason` quando
`redirectTo && requestedRouteAllowed === false` ou quando `destination` é nulo,
portanto um login normal não gera aviso falso. Confirmei também o ramo sem perfil
interno, `post-login-redirect.ts:151-161`: ali o fallback também é `/inicio` e o
`HomePage` renderiza o aviso mesmo sem `gate.actor`, que é justamente o caso mais
relevante.

Todos os valores de `PostLoginDenialReason`, isto é `missing-profile`,
`inactive-profile` e `missing-authorized-workspace`, têm tratamento no
`describeAccessDeniedNotice` aprovado no lote R-01, os dois primeiros com
mensagem específica e o terceiro pela mensagem padrão.

## Verificações reexecutadas pelo revisor

| Verificação | Comando | Resultado observado |
| --- | --- | --- |
| Teste do lote | `node --test tests/scripts/post-login-denial-feedback.test.mjs` | PASS, 2/2 |
| Suíte completa | `npm run test:all` | PASS, 553/553, exit 0 |
| Typecheck web | `npm run web:typecheck` | PASS, exit 0 |
| Gates determinísticos | `npm run review:gates` | 0 regressões bloqueantes, baseline preservado |
| Higiene do diff | `git diff --check` | limpo, exit 0 |

Não reexecutei `npm run lint`, `npm run web:build` nem `npm run docs:validate`
neste ciclo. Constam como declarados pelo implementador, não como verificados por
mim.

A suíte passou de 551 para 553 testes, coerente com os 2 casos adicionados.

## Pendências do ciclo anterior, agora verificadas

| Item | Situação |
| --- | --- |
| Materialização do lote R-01 em commit | CONCRETIZADA. `git log --all -- apps/web/src/features/home/HomePage.tsx` e o mesmo comando para `tests/scripts/access-denied-feedback.test.mjs` retornam `c6bffd8`. |
| Release safety, D-02 | PRESERVADA. `git show --stat HEAD` lista 11 arquivos e nenhum é `release-surface.mjs`. O histórico do arquivo continua parando em `d9b74ae`, anterior ao takeover. |
| Preservação do veredito do lote R-01 | PRESERVADA. `handoffs/archive/R01-ACCESS-DENIAL-2026-08-20/REVIEW.md` mantém o veredito e os três findings. |
| R01-F02, teste que não podia falhar | ATENDIDO neste lote. A recomendação de extrair lógica pura exportada e testar comportamento foi seguida. |
| R01-F03, semântica dos campos de handoff | RESOLVIDO. `Last reviewer` e `Last review` estão coerentes em `NONE`, `Implementation SHA` deixou de ser `UNSET` e o resumo não declara mais "em andamento". |

## Findings

### R01B-F01 - LOW - Valor padrão duplicado em dois lugares

Classificação: manutenibilidade.

`apps/web/src/features/auth/post-login-navigation.ts` aplica
`reason ?? 'missing-authorized-workspace'` no ramo de destino nulo, mas
`apps/web/src/features/login/LoginPage.tsx:75` já aplica o mesmo padrão antes de
entrar em `phase: 'denied'`. O fallback do helper é, portanto, inalcançável a
partir do único chamador atual.

Não há efeito funcional hoje. O risco é de divergência futura: alterar o padrão em
um dos dois lugares passa a produzir comportamentos diferentes dependendo do
caminho. Recomendação: manter o padrão apenas no helper e deixar o `LoginPage`
passar `resolution.denialReason` cru, ou remover o `??` do helper e documentar que
o chamador é responsável.

## O que não é achado

- O teste importar `.ts` direto de um arquivo `.mjs`. É convenção estabelecida no
  repositório, por exemplo `minimal-navigation.test.mjs:9` e
  `release-surface.test.mjs`.
- O teste ler `LoginPage.tsx` por caminho relativo ao CWD. Há 40 ocorrências do
  mesmo padrão em `tests/scripts`.
- `state: undefined` no `<Navigate>` do caminho autorizado. O `HomePage` já trata
  `location.state` possivelmente nulo e a leitura é opcional.
- A segunda asserção do teste ser sobre texto do `LoginPage`. Aqui ela é
  complementar ao caso comportamental, não substituta dele.

## O que não foi validado

- QA visual autenticado do login com `?redirectTo=` para uma rota sem permissão.
  Nenhum render foi exercido; o repositório não tem infraestrutura de teste de
  render instalada.
- `lint`, `web:build` e `docs:validate` neste ciclo.
- O comportamento com `getReleaseSurfaceMode() === 'full'`, em que a landing
  fallback pode não ser `/inicio`. Ver a observação abaixo.

## Observações

- A eficácia do aviso continua condicionada a `/inicio` ser a landing fallback.
  `internal-route-access.ts:140` devolve `/inicio` porque
  `post-login-redirect.ts:190` fixa `hasReceptionAccess: true` e `/inicio` está
  publicado no release atual. Se `/inicio` deixar de ser publicado, o fluxo cai
  em `internal-route-access.ts:146-166` e o destino passa a ser uma rota que não
  consome `fromAccessDenied`, hoje só o `HomePage` consome. O estado seguiria
  anexado e seria ignorado em silêncio. Não é defeito deste lote, é dependência a
  considerar em qualquer mudança de release surface.
- Nenhum código de produto, migration, contrato, teste ou configuração executável
  foi alterado por esta revisão. Nenhum commit, push, merge, deploy ou operação
  remota foi executado.

## Próximo passo recomendado

1. Integrar este lote em commit próprio com `post-login-navigation.ts`,
   `LoginPage.tsx`, o teste novo, `handoffs/README.md` e os artefatos de handoff.
2. Com isso, R-01 pode ser fechado por completo na fila.
3. Seguir para R-03, conforme a fila autorizada, com TASK publicado e
   `Owner = Claude` ao chegar em `READY_FOR_REVIEW`.
