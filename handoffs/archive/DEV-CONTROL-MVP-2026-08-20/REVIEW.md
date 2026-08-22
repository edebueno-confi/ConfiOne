# Review

## Task ID

DEV-CONTROL-MVP

## Reviewer

Claude, Principal Engineer / Independent Code Reviewer.

## Commit revisado

Base SHA `1ea22b20d9703b76c57aff53f7bee6e0c2c1ae93`, branch `main`.
Estado revisado: worktree não commitado sobre esse commit. Ciclo 5, re-review
incremental restrito aos findings DC-F09 a DC-F12 e à busca por regressões.

`Base SHA` confere em `STATUS.md:6`, `TASK.md:125` e `IMPLEMENTATION.md:13`, e é
igual a `git rev-parse HEAD`.

Delta desta correção, por mtime posterior ao REVIEW do ciclo 4:
`tools/dev-control/server.mjs`, `tools/dev-control/public/app.js`,
`tools/dev-control/public/queue-state.js`, `tools/dev-control/public/index.html`,
`tests/scripts/dev-control-mvp.test.mjs` e os artefatos de handoff. Nenhum
arquivo de `apps/web`, `packages/`, `supabase/`, `scripts/` ou release surface foi
tocado.

## Veredito

APPROVED.

Os quatro findings do ciclo 4 estão resolvidos, cada um verificado por execução
contra a função real, e cada um com teste próprio que trava a regressão. A suíte
subiu de 561 para 563 testes sem nenhuma falha nova. Os pontos que restam são
INFO e não condicionam a aprovação.

## Resolução dos findings do ciclo 4

### DC-F09 - RESOLVED

Surgiu `createQueueCardModel` em `queue-state.js:3-17`, e `renderCard`
(`app.js:103-119`) passou a exibir `State` e `Origem` como campos próprios. O
estado exibido é o valor cru do item, não o rótulo da coluna: um item absorvido
pela coluna final continua declarando o estado que veio do README.

Verificado por execução:

```
{"id":"ITEM-FUTURO", ... "state":"FUTURE_STATE","origin":"Owner queue 2026-08-20", ...}
{"id":"SEM-ORIGEM",  ... "state":"UNRESOLVED","origin":"Origem indisponível", ...}
```

Contra a fila real do checkout, os seis cards trazem estado e origem verdadeiros,
incluindo `DEV-CONTROL-MVP | state= ACTIVE | origem= Owner request 2026-08-20`.
O caso que motivou o finding, item com estado real sob o rótulo "Estado
indisponível", deixou de existir: o card diz `State: FUTURE_STATE` e a coluna
apenas indica que a UI não tem faixa nomeada para ele.

### DC-F10 - RESOLVED

`formatWorktreeStatus` em `queue-state.js:19-38` separa os três casos, e
`renderOverview` (`app.js:46`) passou a consumir `project.gitAvailable`, que
antes era ignorado. Verificado por execução na matriz completa:

```
gitAvailable=false dirtyCount=null      -> {"value":"Indisponível","helper":"estado do Git desconhecido"}
gitAvailable=false dirtyCount=0         -> {"value":"Indisponível","helper":"estado do Git desconhecido"}
gitAvailable=true  dirtyCount=null      -> {"value":"Indisponível","helper":"estado do Git desconhecido"}
gitAvailable=true  dirtyCount=undefined -> {"value":"Indisponível","helper":"estado do Git desconhecido"}
gitAvailable=true  dirtyCount=0         -> {"value":"0","helper":"limpo"}
gitAvailable=true  dirtyCount=38        -> {"value":"38","helper":"alterações locais"}
```

O painel não afirma mais "limpo" sobre um worktree cujo estado não pôde ser lido.
A cobertura inclui `gitAvailable=false` com `dirtyCount=0`, que era o pior caso
possível e não estava no finding.

### DC-F11 - RESOLVED

`buildActivityTimeline` em `server.mjs:202-262` compõe commits, handoffs
arquivados, reviews arquivados, handoff corrente e review corrente, e
`snapshot.archives` deixou de ser dado morto. Verificado contra o checkout real:

```
eventos: 26
por fonte: {"Git":12,"Review arquivado":6,"Handoff arquivado":6,"Handoff corrente":1,"Review corrente":1}
```

A ordenação observada é coerente: commits de 2026-08-20 no topo, depois os
eventos de handoff e review do mesmo dia, depois commits mais antigos até
2026-08-12. As quatro fontes exigidas por `TASK.md:66-67` estão presentes.

O Codex optou por corrigir em vez de contestar ou deferir. A escolha é dele e o
resultado atende ao requisito.

### DC-F12 - RESOLVED

`queue-state.js:53` passou a usar `Object.hasOwn`. Verificado por execução com
quatro chaves herdadas, incluindo `valueOf`, que não constava do finding:

```
state=constructor -> ok, UNRESOLVED=1, ACTIVE=0, BLOCKED=0
state=toString    -> ok, UNRESOLVED=1, ACTIVE=0, BLOCKED=0
state=__proto__   -> ok, UNRESOLVED=1, ACTIVE=0, BLOCKED=0
state=valueOf     -> ok, UNRESOLVED=1, ACTIVE=0, BLOCKED=0
```

O item cai na coluna absorvente e o Kanban continua renderizando. A classe
inteira foi eliminada, não apenas os três casos citados.

## Observações INFO, sem efeito sobre o veredito

Nenhuma destas condiciona a aprovação. Registro para que fiquem visíveis a quem
evoluir o control plane, e para que não sejam redescobertas como novidade.

- **INFO-1.** Cada handoff arquivado gera dois eventos com o mesmo assunto e a
  mesma data, um como `Review arquivado` e outro como `Handoff arquivado`. São 12
  dos 26 eventos em pares redundantes. A timeline fica mais longa do que o
  conteúdo que carrega.
- **INFO-2.** O campo `date` de eventos de review recebe a linha crua do STATUS,
  por exemplo `2026-08-20 — REQUEST_CHANGES, ciclo 4; findings DC-F09 a DC-F12
  respondidos`, que ocupa o lugar de uma data. É verdadeiro e rastreável, mas
  mistura data e narrativa no mesmo campo.
- **INFO-3.** A ordenação usa `localeCompare` sobre strings com offsets mistos,
  `-03:00` para commits e `Z` para datas normalizadas de handoff. Hoje o
  resultado é cronologicamente correto porque as datas de handoff têm
  granularidade de dia. Não é comparação temporal real e pode divergir se algum
  artefato passar a registrar hora com outro offset.
- **INFO-4.** `renderActivity` (`app.js:153`) mantém o vazio "Nenhum commit
  disponível" mesmo agora que o painel é uma timeline de quatro fontes.

## Verificações reexecutadas neste ciclo

| Verificação | Comando | Resultado observado |
| --- | --- | --- |
| Teste do lote | `node --test tests/scripts/dev-control-mvp.test.mjs` | PASS, 8/8 |
| Suíte completa, em 4 shards | `node --test` sobre os 112 arquivos de `tests/**/*.test.mjs` | 563 testes, 560 PASS, 1 skip, 2 falhas de ambiente |
| Gates determinísticos | `npm run review:gates` | 0 regressões bloqueantes, 8 itens do baseline resolvidos |
| Higiene do diff | `git diff --check` | limpo, exit 0 |
| DC-F09 | probe sobre `createQueueCardModel` e a fila real | estado cru e origem presentes nos 6 cards |
| DC-F10 | probe sobre `formatWorktreeStatus`, matriz de 6 casos | indisponível, limpo e sujo distintos |
| DC-F11 | probe sobre `readSnapshot` no checkout real | 26 eventos, 5 fontes, ordem coerente |
| DC-F12 | probe com 4 chaves de protótipo | sem exceção, item absorvido |
| Escopo do diff | mtime posterior ao REVIEW do ciclo 4 | somente `tools/dev-control/`, teste do lote e handoffs |

O total de 563 confere com o declarado pelo Codex, contra 561 no ciclo 4, o que é
consistente com os dois testes adicionados. As duas falhas são as mesmas do ciclo
anterior e são de ambiente, não do lote:
`tests/scripts/access-profile-capabilities-stability.test.mjs` exige Supabase
local iniciado e `tests/scripts/supabase-cli-command.test.mjs` compara o caminho
resolvido do wrapper. Nenhuma toca `tools/dev-control/`.

## Adendo pós-veredito: causa exata da não reexecução

Diagnosticado após o APPROVED, a pedido do proprietário, e registrado aqui por
precisão. Não altera o veredito.

Nove pacotes de `node_modules/` estão instalados como link simbólico e a ponte de
arquivos usada por este revisor não consegue resolvê-los, retornando
`cannot read symbolic link ... Input/output error`: `typescript`, `eslint`,
`eslint-plugin-jsx-a11y`, `eslint-plugin-react-hooks`,
`eslint-plugin-react-refresh`, `typescript-eslint`, `globals`, `playwright` e
`supabase`. Os outros 284 pacotes são diretórios reais e leem normalmente, e é
por isso que `node --test`, `npm run review:gates` e `git` funcionam.

Isso explica exatamente o conjunto do que falhou: `web:typecheck` e `web:build`
param em `tsc`, `lint` para em `eslint`, e as duas falhas de suíte atribuídas a
"ambiente" dependem do pacote `supabase`. A caracterização anterior daquelas duas
falhas, "exige Supabase local iniciado", estava imprecisa quanto ao motivo. A
conclusão não muda: nenhuma é regressão do lote e nenhuma toca
`tools/dev-control/`.

O registro do npm neste ambiente também retorna 403 por política, então instalar
as dependências localmente não é alternativa.

## O que não foi validado

- `npm run lint`, `npm run web:typecheck`, `npm run web:build` e
  `npm run docs:validate`: não reexecutáveis no ambiente deste revisor, porque o
  toolchain não é resolvível a partir do `node_modules` do checkout nesta
  plataforma e não há rede para instalar. Permanecem como declaração do Codex em
  `IMPLEMENTATION.md`. Como o delta deste ciclo não toca `apps/web`, o risco
  associado é baixo, mas registro que não confirmei.
- Render no navegador. Nenhuma tela foi aberta. Toda a verificação de UI foi feita
  por leitura do código e por execução das funções reais que a UI consome.
- Smoke HTTP no bind fixo 4178. O teste do lote sobe o servidor em porta efêmera.

## Consequências da aprovação

A aprovação cobre o lote `DEV-CONTROL-MVP` como painel local read-only. Não
autoriza commit, push, merge, deploy, publicação no ConfiOne nem qualquer
release surface. O painel permanece ferramenta de engenharia local.

## Próximo passo

Owner retorna ao Codex, conforme a regra de fila para tarefas previamente
autorizadas pelo proprietário. Cabem ao Codex:

1. Integrar o lote pelo processo de integração aplicável.
2. Arquivar `handoffs/current/` como `DEV-CONTROL-MVP-2026-08-20`.
3. Atualizar `handoffs/README.md` promovendo o R-11. **Na mesma edição**, aplicar
   a baixa do `DEV-CONTROL-MVP` para `DONE` e a promoção do R-11 para `ACTIVE`.
   A invariante `activeCount === 1` de `dev-control-mvp.test.mjs` fica vermelha
   se as duas edições forem separadas.
4. Abrir a TASK do R-11, que está `APPROVED` na fila e cuja única dependência era
   este lote.

As observações INFO-1 a INFO-4 podem ser recolhidas em um item futuro de
evolução do control plane. Não são pendência deste lote.
