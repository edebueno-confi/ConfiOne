# Implementation

## Task ID

CONTROL-PLANE-BACKLOG-2026-08-21

## Implementador

Codex

## Base SHA

5bcd4f943eaca64de9167da7d406a4754b490998

## Implementation SHA

268132f38455d3beb26f795e3217da7c673af982

## Resumo

O lote materializou a missão de desenvolvimento prolongado na fila canônica
existente e formalizou os estados de elegibilidade sem alterar produto.

## Decisões tomadas

- Usar `handoffs/README.md` como único backlog, preservando o Control Plane MVP
  legado e os lotes já arquivados.
- Decompor requisitos por dependências de dados antes de telas, metas ou
  Predição.
- Tratar 208, 206, 118 e percentuais impossíveis como evidências para
  investigação, não como regras ou valores a serem forçados.

## Resposta ao review Cycle 1

### CPB-F01 — CONCORDO — RESOLVED

As duas asserções que fixavam `backlogTask.state === 'ACTIVE'` e
`operationScope.state === 'BACKLOG'` foram removidas de
`tests/scripts/dev-control-mvp.test.mjs`. Permanecem as invariantes estáveis:
item `ACTIVE` único, ao menos 10 itens `BACKLOG`, autorização do backlog e
dependência do próximo item.

Foi executada uma simulação em memória promovendo o lote atual para `DONE` e o
item de Operação para `ACTIVE`. O parser manteve exatamente um item ativo e a
dependência permaneceu intacta.

### INFO-1 — REGISTRADO

A autorização dos itens 7 a 26 está persistida em `OD-002` no
`docs/engineering/OWNER_DECISIONS.md`. Nenhuma alteração adicional foi feita.

### INFO-2 — FORA DO ESCOPO / OWNER DECISION

A contradição normativa sobre `OWNER_AUTHORIZED_SELF_REVIEW` é anterior a este
lote e não foi resolvida silenciosamente. O fluxo corrente está em
`CLAUDE_REQUIRED`; qualquer mudança de política deve ser decisão explícita do
proprietário em lote próprio.

### INFO-3 — RESOLVED

Foram adicionados cross-links para `docs/engineering/OWNER_DECISIONS.md` em
`handoffs/README.md` e `docs/engineering/REVIEW_PROTOCOL.md`.

## Arquivos adicionados

- Nenhum.

## Arquivos modificados

- `handoffs/README.md`.
- `docs/engineering/REVIEW_PROTOCOL.md`.
- `tests/scripts/dev-control-mvp.test.mjs`.
- `handoffs/current/TASK.md`.
- `handoffs/current/IMPLEMENTATION.md`.
- `handoffs/current/REVIEW.md`.
- `handoffs/current/STATUS.md`.

## Migrations

Nenhuma.

## Testes adicionados ou atualizados

- Invariantes da fila canônica e do backlog prolongado no teste existente do
  Control Plane.

## Comandos de validação executados

- `node --test tests/scripts/dev-control-mvp.test.mjs`.
- `npm run test:all`.
- `npm run docs:validate`.
- `npm run review:gates`.
- `git diff --check`.
- probe de transição em memória: `ACTIVE -> DONE` e `BACKLOG -> ACTIVE`.
- `git status --short --branch` e inspeção do diff para confirmar escopo.

## Resultados

- Teste do Control Plane: PASS, 8/8.
- Suíte ampla: PASS, 568/568.
- `docs:validate`: PASS, 0 documentos bloqueados; alertas históricos
  permanecem declarados pelo validador.
- `review:gates`: PASS, 0 regressões bloqueantes; 43 itens históricos
  resolvidos pelo baseline sem alteração do baseline.
- `git diff --check`: PASS, limpo.
- Commit local exclusivo de finalização: `268132f38455d3beb26f795e3217da7c673af982`.
- Stage conferido contra o allowlist: 7 caminhos, sem arquivos de produto,
  migrations, secrets ou alterações preexistentes fora do lote.
- Único item `ACTIVE`: `CONTROL-PLANE-BACKLOG-2026-08-21`.
- Itens 8 a 26: `BACKLOG`, com dependências explícitas.
- CPB-F01: RESOLVED; o teste não fixa estados transitórios individuais.
- INFO-3: RESOLVED; decisões do proprietário possuem cross-link canônico.
- Nenhum arquivo de `apps/`, `packages/`, `supabase/` ou release surface foi
  alterado por este lote.

## Limitações conhecidas

- O backlog registra intenção e dependências; cada lote futuro deverá confirmar
  fontes, fórmulas, permissões e decisões de produto antes de implementar.

## Possíveis riscos

- Uma dependência pode revelar conflito documental ou ausência de fonte real;
  nesse caso o lote correspondente deve ser marcado como
  `OWNER_DECISION_REQUIRED`.

## Itens que o reviewer deve observar

- Se todos os requisitos da missão foram decompostos sem criar segunda fonte de
  verdade.
- Se prioridades e dependências não escondem decisões de negócio ausentes.
- Se o item ativo é único e os lotes futuros não foram iniciados
  prematuramente.

## Estado de entrega

READY_FOR_REVIEW — Owner: Claude. Nenhum commit, push, merge, deploy ou operação
remota foi executado.
