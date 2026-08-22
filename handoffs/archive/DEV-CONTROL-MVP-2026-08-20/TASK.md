# Task

## Task ID

DEV-CONTROL-MVP

## Project

ConfiOne / Engineering Control Plane local

## Título

Development Control Plane MVP read-only

## Contexto

O lote R-03 foi aprovado pelo Claude e integrado no commit
`1ea22b20d9703b76c57aff53f7bee6e0c2c1ae93`. O proprietário autorizou a
evolução do fluxo multiagente para execução contínua e solicitou uma interface
local de acompanhamento do desenvolvimento.

O painel não é uma superfície de cliente do ConfiOne. É uma ferramenta local de
engenharia, sem release pública, autenticação, multiusuário ou integração
remota.

## Objetivo

Construir rapidamente um painel local, visual, denso e read-only que projete o
estado real do repositório, da fila canônica, dos handoffs, dos reviews, dos
gates e do Git.

## Escopo

- Estender a fila canônica em `handoffs/README.md` com os campos operacionais
  necessários para leitura automática.
- Criar o servidor local read-only em `tools/dev-control/server.mjs`.
- Criar a interface local em `tools/dev-control/public/index.html`,
  `tools/dev-control/public/app.js` e `tools/dev-control/public/styles.css`.
- Adicionar o script raiz `npm run dev-control`.
- Adicionar testes em `tests/scripts/dev-control-mvp.test.mjs`.
- Atualizar os artefatos deste handoff.

## Fora de escopo

- Alterar `apps/web`, rotas do produto ou release surface.
- Adicionar autenticação, multiusuário, deploy ou integração remota.
- Criar aprovação por botão, drag-and-drop, escrita em handoff ou criação de
  TASK pela interface.
- Criar banco, migration, RPC, API pública ou serviço persistente.
- Inventar dados para preencher cards ou alterar o estado operacional apenas
  para alimentar a UI.
- R-11, R-14 ou qualquer finding de produto.

## Requisitos funcionais

- `npm run dev-control` deve servir o painel em `http://127.0.0.1:4178`.
- O painel deve expor uma visão geral com projeto, branch, HEAD, tarefa
  corrente, Owner, status dos agentes, quantidade de tarefas, bloqueios,
  decisões pendentes e resultado dos gates principais.
- O painel deve expor um Kanban read-only com Proposed, Aguardando aprovação,
  Ready, Codex, Claude Review, Changes Requested, Owner Decision e Approved /
  Done.
- Cada card deve mostrar, quando disponível, Task ID, título, projeto,
  prioridade, Owner, State, SHAs, testes, findings, dependências e origem.
- A tarefa corrente deve mostrar TASK, IMPLEMENTATION, REVIEW, STATUS, ciclo,
  findings e última atividade.
- Deve existir timeline derivada de handoffs, reviews, commits e transições de
  estado.
- Deve existir área destacada para `OWNER_DECISION_REQUIRED` e `BLOCKED`.
- Os dados devem vir do repositório real, nunca de mocks ou estado duplicado.
- A atualização da interface deve ser automática e local, sem escrita no
  repositório.

## Requisitos técnicos

- Usar somente Node.js padrão no servidor local, sem dependências novas.
- Fixar a raiz do repositório a partir da localização do servidor e impedir
  path traversal.
- Invocar Git com argumentos separados, sem interpolar comandos recebidos da
  rede.
- Expor somente snapshot read-only por `GET /api/snapshot` e arquivos estáticos
  da própria ferramenta.
- O servidor deve falhar claramente se a porta 4178 já estiver ocupada, sem
  escolher porta alternativa silenciosamente.
- A interface não pode ser importada pelo router ou pelo build de `apps/web`.
- A fila deve ser adaptada da tabela canônica de `handoffs/README.md`; não
  criar arquivo paralelo de estado.
- Bloqueios e decisões devem ser inferidos somente de `STATUS.md`, `REVIEW.md`,
  `TASK.md`, `IMPLEMENTATION.md`, `.review/` e Git.

## Critérios de aceitação

- Abrir `http://127.0.0.1:4178` mostra dados reais do checkout atual.
- O painel mostra a tarefa `DEV-CONTROL-MVP`, o Owner, o state, a fila futura,
  R-03 concluído, R-11 e R-14 com suas dependências, reviews, findings, gates,
  branch e SHA.
- `GET /api/snapshot` retorna JSON sem segredo e sem conteúdo de produto
  inventado.
- Nenhum arquivo de `apps/web` ou release surface é alterado.
- O teste dedicado passa e cobre parser da fila, snapshot real, estados
  correntes e ausência de mutação.
- `npm run test:all`, `npm run lint`, `npm run web:typecheck`,
  `npm run web:build` e `git diff --check` passam quando aplicáveis.
- O lote termina em `READY_FOR_REVIEW` com `Owner = Claude`.

## Documentos normativos aplicáveis

- `AGENTS.md`.
- `docs/engineering/REVIEW_PROTOCOL.md`.
- `handoffs/README.md`.
- `docs/PROJECT_STATE.md`.
- `docs/ENGINEERING_WORKFLOW.md`.

## Riscos conhecidos

- O worktree contém alterações preexistentes extensas. O painel deve apenas
  lê-las e não pode incorporá-las ao estado da tarefa.
- O parser de Markdown depende da tabela canônica; mudanças estruturais devem
  ser detectadas pelo teste, não mascaradas com fallback silencioso.
- O painel mostra o estado local do Git, que pode estar sujo por trabalho
  preexistente. Isso deve ser visível, não tratado como falha do painel.

## Base commit SHA

1ea22b20d9703b76c57aff53f7bee6e0c2c1ae93

## Branch

main

## Priority

P0

## Approval

APPROVED — autorização explícita do proprietário em 2026-08-20.

## Dependencies

R-03 integrado; `handoffs/current/` normalizado.

## Origin

Solicitação do proprietário para evolução contínua do fluxo multiagente.

## Responsável atual

Codex implementa e valida; Claude revisa após `READY_FOR_REVIEW`.

## Observações do proprietário

O painel deve permitir enxergar antes de permitir operar. Não criar uma nova
fonte de verdade, não publicar no ConfiOne e não avançar automaticamente para
R-11 antes da aprovação deste lote.
