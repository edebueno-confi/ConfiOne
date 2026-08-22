# Implementation

## Task ID

DEV-CONTROL-MVP

## Implementador

Codex

## Base SHA

1ea22b20d9703b76c57aff53f7bee6e0c2c1ae93

## Implementation SHA

UNCOMMITTED_WORKTREE

## Resumo

Implementado um control plane local read-only para projetar a fila e os
artefatos reais do fluxo Codex/Claude sem tocar a release surface do ConfiOne.
O painel é servido por Node em loopback, lê os arquivos canônicos sob demanda e
atualiza o snapshot automaticamente no navegador.

## Decisões tomadas

- Reutilizar `handoffs/README.md` como fila canônica, em vez de criar um segundo
  arquivo de estado.
- Servir a interface por um processo Node local independente de `apps/web`.
- Ler Git, handoffs e `.review/` sob demanda em cada snapshot.
- Manter o MVP sem escrita, autenticação, banco ou dependência externa.

## Arquivos adicionados

- `tools/dev-control/server.mjs`.
- `tools/dev-control/public/index.html`.
- `tools/dev-control/public/app.js`.
- `tools/dev-control/public/styles.css`.
- `tools/dev-control/public/queue-state.js`.
- `tests/scripts/dev-control-mvp.test.mjs`.

## Arquivos modificados

- `handoffs/README.md`.
- `package.json`.
- `handoffs/current/TASK.md`.
- `handoffs/current/IMPLEMENTATION.md`.
- `handoffs/current/REVIEW.md`.
- `handoffs/current/STATUS.md`.

## Migrations

Nenhuma.

## Testes adicionados

- Contrato do parser da fila e do snapshot local do Development Control Plane.
- Verificação de read-only, método HTTP permitido e isolamento do produto.
- Teste comportamental da normalização do Kanban para estado ausente.
- Testes comportamentais de card, estado cru, origem, Git indisponível,
  timeline composta e chaves herdadas do protótipo.

## Comandos de validação executados

- `node --test tests/scripts/dev-control-mvp.test.mjs`.
- `npm run test:all`.
- `npm run lint`.
- `npm run web:typecheck`.
- `npm run web:build`.
- `npm run review:gates`.
- `npm run docs:validate`.
- `git diff --check`.
- `node --check tools/dev-control/server.mjs`.
- `node --check tools/dev-control/public/app.js`.
- Smoke HTTP de `npm run dev-control` em `127.0.0.1:4178` para `/` e
  `/api/snapshot`.

## Resultados

- Teste dedicado: PASS, 4/4.
- Suíte ampla: PASS, 559/559.
- Lint: PASS, 0 erros e 160 warnings preexistentes no workspace.
- Web typecheck: PASS, exit 0.
- Web build: PASS, exit 0.
- Review gates: PASS, 0 regressões bloqueantes; 8 itens de baseline resolvidos
  pelo estado histórico do repositório.
- Documentação: PASS, 0 documentos bloqueados; alertas existentes preservados
  pelo modo dry-run.
- `git diff --check`: PASS, saída limpa.
- Sintaxe do servidor e cliente: PASS.
- Smoke local: HTTP 200 para a página e para o snapshot; snapshot reportou
  `DEV-CONTROL-MVP`, `READY_FOR_REVIEW`, `Claude` após a entrega do lote.

## Limitações conhecidas

QA visual autenticado do produto não é aplicável. A validação visual do painel
local não foi executada em navegador automatizado; foi executado smoke HTTP e o
teste de contrato. O MVP não oferece autenticação, histórico de eventos,
persistência própria, escrita, aprovação ou ações de Git.

## Possíveis riscos

- Mudanças futuras na tabela canônica podem exigir atualização do parser.
- O status sujo do worktree será exibido como evidência operacional, sem separar
  automaticamente autoria histórica de autoria corrente.

## Itens que o reviewer deve observar

- Confirmar que a interface usa somente dados reais do repositório.
- Confirmar que nenhuma rota ou build de `apps/web` foi alterada.
- Confirmar que o servidor não aceita escrita, path traversal ou shell injection.
- Confirmar que a fila continua sendo a única fonte canônica futura.
- Confirmar que o painel não oferece aprovação, criação ou mutação por UI.

## Respostas ao Review Cycle 1

- **DC-F01 — CONCORDO.** O teste deixou de fixar `READY_FOR_REVIEW` e `Claude`.
  Agora valida o conjunto canônico de estados e Owners, além de invariantes da
  fila e do snapshot. Assim, a aprovação, arquivamento e abertura de novos lotes
  não quebram a suíte por causa de estado transitório.
- **DC-F02 — CONCORDO.** `parseReview` reconhece o veredito estruturado no início
  da linha, inclusive `APPROVED, restrito ao escopo...`. O arquivo arquivado de
  R-01 passou a aparecer como `APPROVED` no snapshot.
- **DC-F03 — CONCORDO.** `findDecisions` ignora prosa, blocos de código e
  menções em requisitos. Só considera marcadores estruturados, `State: BLOCKED`
  no STATUS e linhas de lista que começam pelo marcador.
- **DC-F04 — CONCORDO PARCIALMENTE.** O MVP não executa gates a cada refresh nem
  cria artefato paralelo. Como a fonte atual é a seção `Resultados` do
  `IMPLEMENTATION.md`, a UI agora a rotula explicitamente como declaração do
  Codex, remove o realce heurístico e elimina o número mágico `555/555`.
- **DC-F05 — CONCORDO.** Falhas do Git agora retornam campos nulos, `gitAvailable:
  false`, `dirtyCount: null` e nenhuma mensagem interna de exceção.
- **DC-F06 — CONCORDO.** O processo registra erro operacional para porta 4178
  ocupada e encerra com código 1, sem selecionar porta alternativa.
- **DC-F07 — CONCORDO.** Item de fila sem estado passa a `UNRESOLVED` e é exibido
  em coluna própria `Estado indisponível`, sem inventar `PROPOSED`.

## Alterações desta correção

- `tools/dev-control/server.mjs`: parsing estruturado de review e decisões,
  snapshot Git degradado sem vazamento de erro, estado das validações declarado
  e tratamento de erro de bind.
- `tools/dev-control/public/app.js` e `index.html`: rótulo honesto das
  validações e coluna para estado ausente.
- `tests/scripts/dev-control-mvp.test.mjs`: invariantes não transitórias,
  veredito arquivado qualificado, decisões estruturadas e ausência de heurística
  obsoleta.
- Smoke adicional com Git indisponível: campos Git nulos e `available: false`.
- Smoke adicional com porta ocupada: mensagem clara e exit 1.

## Respostas ao Review Cycle 2

- **DC-F01 — CONCORDO.** Removi as quatro expectativas sobre conteúdo corrente:
  task id específico, lista de decisões vazia, estado `ACTIVE` do lote e estado
  `PROPOSED` de R-11. O teste agora verifica apenas que a tarefa corrente é uma
  string não vazia presente na fila, que decisões é um array, que há no máximo
  um item `ACTIVE` e, quando o estado não é `IDLE`, que há exatamente um item
  ativo. Dependências e vocabulário canônico permanecem cobertos.
- **DC-F07 — CONCORDO.** A normalização foi movida para
  `queue-state.js` e aplicada antes do filtro do Kanban. Um item com estado vazio
  passa a `UNRESOLVED` e entra na coluna `Estado indisponível`; o teste dedicado
  cobre esse comportamento sem depender do DOM.

## Validações do Review Cycle 2

- `node --test tests/scripts/dev-control-mvp.test.mjs`: PASS, 5/5.
- `npm run test:all`: PASS, 560/560.
- `npm run lint`: PASS, 0 erros e 160 warnings preexistentes.
- `npm run web:typecheck`: PASS, exit 0.
- `npm run web:build`: PASS, exit 0.
- `npm run review:gates`: PASS, 0 regressões bloqueantes.
- `npm run docs:validate`: PASS, 0 documentos bloqueados.
- `git diff --check`: PASS, limpo.
- `node --check` do servidor, cliente e módulo de estado: PASS.

## Respostas ao Review Cycle 3

- **DC-F08 — CONCORDO.** O Kanban agora possui coluna explícita `BLOCKED` e
  agrupa a fila por uma função única em `queue-state.js`. Estados futuros ou
  não reconhecidos são absorvidos pela última coluna, atualmente
  `UNRESOLVED`, preservando a visibilidade sem inventar um estado conhecido.
- Foi acrescentado um teste comportamental que verifica a presença do item
  `BLOCKED`, a absorção de um estado futuro e a igualdade entre a quantidade de
  itens agrupados e a fila normalizada. O finding não foi resolvido por
  alteração de asserção frágil ou por exclusão do item.

## Validações do Review Cycle 3

- `node --test tests/scripts/dev-control-mvp.test.mjs`: PASS, 6/6.
- `npm run test:all`: PASS, 561/561.
- `npm run lint`: PASS, 0 erros e 160 warnings preexistentes no workspace.
- `npm run web:typecheck`: PASS, exit 0.
- `npm run web:build`: PASS, exit 0.
- `npm run review:gates`: PASS, 0 regressões bloqueantes.
- `npm run docs:validate`: PASS, 0 documentos bloqueados; alertas existentes
  preservados pelo modo dry-run.
- `git diff --check`: PASS, saída limpa.
- Sintaxe de `server.mjs`, `app.js` e `queue-state.js` foi verificada com
  `node --check`.
- Smoke local de `npm run dev-control`: HTTP 200 para `/`, `/api/snapshot` e
  `/queue-state.js`; o snapshot reportou `DEV-CONTROL-MVP`,
  `READY_FOR_REVIEW` e `Claude`.

## Respostas ao Review Cycle 4

- **DC-F09 — CONCORDO.** O card agora exibe `State` e `Origin` em campos
  explícitos. O modelo do card preserva o valor cru do estado, inclusive
  `FUTURE_STATE`, enquanto a coluna absorvente continua apenas organizando o
  item. Assim, um estado desconhecido não é apresentado como se fosse
  `UNRESOLVED`.
- **DC-F10 — CONCORDO.** A UI diferencia Git indisponível, worktree limpo e
  worktree com alterações. `gitAvailable === false` ou `dirtyCount === null`
  resulta em `Indisponível / estado do Git desconhecido`; somente `0` resulta em
  `limpo`.
- **DC-F11 — CONCORDO.** O requisito do TASK exige timeline derivada de
  handoffs, reviews, commits e transições. `buildActivityTimeline` agora compõe
  o evento de commits do Git, reviews e arquivamentos, o handoff corrente e o
  review corrente, usando somente dados já lidos do checkout. O título da área
  foi ajustado para refletir as fontes reais.
- **DC-F12 — CONCORDO.** `groupQueueItems` usa `Object.hasOwn` para aceitar
  somente estados que são colunas próprias. Estados como `constructor`,
  `toString` e `__proto__` passam ao fallback sem lançar exceção.

## Validações do Review Cycle 4

- `node --test tests/scripts/dev-control-mvp.test.mjs`: PASS, 8/8.
- `npm run test:all`: PASS, 563/563.
- `npm run lint`: PASS, 0 erros e 160 warnings preexistentes no workspace.
- `npm run web:typecheck`: PASS, exit 0.
- `npm run web:build`: PASS, exit 0.
- `npm run review:gates`: PASS, 0 regressões bloqueantes; baseline intacto.
- `npm run docs:validate`: PASS, 0 documentos bloqueados; alertas existentes
  preservados pelo modo dry-run.
- `git diff --check`: PASS, saída limpa.
- `node --check` do servidor, cliente e módulo de estado: PASS.
- Smoke local de `npm run dev-control`: HTTP 200 para `/`, `/api/snapshot` e
  `/queue-state.js`; snapshot com `CHANGES_REQUESTED`, `Codex` e 26 eventos
  distribuídos entre Git, handoffs e reviews.

## Validações após a correção

- `node --test tests/scripts/dev-control-mvp.test.mjs`: PASS, 4/4.
- `npm run test:all`: PASS, 559/559.
- `npm run lint`: PASS, 0 erros e 160 warnings preexistentes.
- `npm run web:typecheck`: PASS, exit 0.
- `npm run web:build`: PASS, exit 0.
- `npm run review:gates`: PASS, 0 regressões bloqueantes.
- `npm run docs:validate`: PASS, 0 documentos bloqueados.
- `git diff --check`: PASS, limpo.
- `node --check` do servidor e cliente: PASS.
