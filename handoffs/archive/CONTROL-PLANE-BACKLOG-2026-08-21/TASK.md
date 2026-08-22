# Task

## Task ID

CONTROL-PLANE-BACKLOG-2026-08-21

## Project

ConfiOne / Engineering Control Plane

## Título

Materializar backlog prolongado e estados de elegibilidade

## Contexto

A missão de desenvolvimento prolongado de 2026-08-21 solicita uma fila
persistente para Control Plane, dados, Dashboard Gerencial e domínios de
negócio. A fila canônica existente terminou no R-14 e não possui próxima task.
O Control Plane MVP legado já lê `handoffs/README.md`, handoffs, reviews, gates
declarados e Git; ele não deve ser reclassificado retroativamente como parte
deste lote.

## Objetivo

Converter a missão em backlog operacional persistido no artefato canônico,
decompondo os próximos lotes por domínio, prioridade, dependência e estado, e
formalizar `BACKLOG` e `READY` no protocolo sem criar uma fonte paralela.

## Escopo

- Estender a tabela canônica de `handoffs/README.md` com os lotes CONTROL PLANE,
  dados, Comercial, Dashboard, Customer Success, Support, Financeiro e Produto.
- Registrar prioridades P0 a P3, autorização, dependências, origem e resumo
  verificável para cada lote.
- Formalizar no protocolo os estados de fila `BACKLOG` e `READY`, mantendo
  `READY_FOR_IMPLEMENTATION` como estado corrente de abertura da TASK.
- Abrir este handoff como o único item `ACTIVE` e manter todos os demais em
  `BACKLOG` até suas dependências serem concluídas.
- Atualizar o teste existente do Control Plane para proteger a presença do
  backlog e a invariante de item ativo único.
- Atualizar TASK, IMPLEMENTATION, REVIEW e STATUS deste lote.

## Fora de escopo

- Alterar código de produto em `apps/web` ou `packages/`.
- Alterar banco, migrations, RLS, RPCs, contratos de produto ou release surface.
- Implementar filtros, KPIs, metas, Predição, contratos ou telas de domínio.
- Reclassificar ou incluir retroativamente o Control Plane MVP legado neste lote.
- Criar arquivo paralelo de backlog, banco de tarefas ou serviço remoto.
- Push, merge, pull request, deploy, migration remota ou alteração de secrets.

## Requisitos funcionais

1. A fila canônica deve conter os itens 7 a 26 desta missão com Task ID único.
2. Cada item deve declarar prioridade, estado, autorização, dependências e
   resumo, sem números de negócio tratados como regra confirmada.
3. Deve existir somente um item `ACTIVE`, correspondente a esta TASK.
4. Itens futuros devem permanecer `BACKLOG` quando ainda dependerem de outro
   lote; `READY` será reservado para item elegível após suas dependências.
5. A fila deve conservar R-14 como `DONE` e preservar os lotes históricos.

## Requisitos técnicos

- Usar a tabela canônica existente em `handoffs/README.md`.
- Manter o parser atual compatível com a tabela sem fallback silencioso.
- Atualizar `docs/engineering/REVIEW_PROTOCOL.md` com os estados e transições.
- O teste do Control Plane deve validar a fila real, não um mock paralelo.

## Critérios de aceitação

- `handoffs/README.md` contém a decomposição completa e parseável da missão.
- O item `CONTROL-PLANE-BACKLOG-2026-08-21` está `ACTIVE` e os itens futuros
  estão em `BACKLOG` ou, quando demonstravelmente elegíveis, `READY`.
- Não há mais de um item `ACTIVE`.
- O protocolo documenta `BACKLOG` e `READY` sem remover estados existentes.
- O teste dedicado do Control Plane passa.
- `npm run test:all`, `npm run docs:validate` e `git diff --check` são
  executados e registrados; limitações devem ser declaradas, não mascaradas.
- O handoff termina em `READY_FOR_REVIEW` com `Owner = Claude`.

## Documentos normativos aplicáveis

- `AGENTS.md`.
- `docs/engineering/REVIEW_PROTOCOL.md`.
- `handoffs/README.md`.
- `docs/PROJECT_STATE.md`.
- `docs/ROADMAP_BUILDOUT_V3.md`.

## Riscos conhecidos

- O worktree contém alterações extensas preexistentes. O staging deste lote
  deverá conter apenas documentação canônica, teste de governança e handoffs.
- A missão contém regras de negócio ainda não confirmadas. Os lotes futuros
  devem investigar código, contratos e dados antes de converter hipótese em
  regra.
- `BACKLOG` e `READY` são estados da fila; não devem ser confundidos com o
  estado corrente dos quatro artefatos em `handoffs/current/`.

## Base commit SHA

5bcd4f943eaca64de9167da7d406a4754b490998

## Branch

main

## Priority

P0

## Approval

APPROVED — missão explícita do proprietário em 2026-08-21.

## Dependencies

R-14 integrado e `handoffs/current/` normalizado para `IDLE`.

## Origin

Missão de primeiro ciclo prolongado de desenvolvimento autônomo, recebida em
2026-08-21.

## Responsável atual

Codex implementa e valida; Claude revisa independentemente após
`READY_FOR_REVIEW`.

## Observações do proprietário

Continuar enquanto houver trabalho seguro e elegível. Escalar somente decisão
de produto realmente desconhecida, conflito de escopo, risco relevante ou
operação externa protegida.
