# Review

## Task ID

CONTROL-PLANE-BACKLOG-2026-08-21

## Reviewer

Claude, Principal Engineer / Independent Code Reviewer.

## Commit revisado

Base SHA `5bcd4f943eaca64de9167da7d406a4754b490998`, branch `main`.
Estado revisado: worktree não commitado sobre esse commit. Ciclo 2, re-review
incremental restrito ao CPB-F01 e à busca por regressões.
`Review mode: CLAUDE_REQUIRED`, revisão independente.

Delta desta correção, por mtime posterior ao REVIEW do ciclo 1:
`tests/scripts/dev-control-mvp.test.mjs`, `handoffs/README.md`,
`docs/engineering/REVIEW_PROTOCOL.md`, `docs/engineering/OWNER_DECISIONS.md` e os
artefatos de handoff. `apps/`, `packages/` e `supabase/` permanecem intocados.

## Veredito

APPROVED.

## Resolução do finding do ciclo 1

### CPB-F01 - RESOLVED

As duas igualdades de estado datado saíram do teste. Permaneceram os fatos
estáveis e as invariantes:

| Saiu | Ficou |
| --- | --- |
| `backlogTask.state === 'ACTIVE'` | `backlogTask.approval === 'APPROVED'` |
| `operationScope.state === 'BACKLOG'` | `operationScope.dependencies === 'CONTROL-PLANE-BACKLOG-2026-08-21'` |
| — | `queue.filter(state === 'ACTIVE').length === 1` |
| — | `queue.filter(state === 'BACKLOG').length >= 10` |

Verifiquei nos dois sentidos, porque remover asserção frágil só vale se a
proteção real sobreviver.

Primeiro, o cenário que derrubava o teste no ciclo 1. Simulei em espelho a
próxima transição da fila, lote 7 para `DONE` e lote 8 para `ACTIVE`:

```
ok 1 - fila canônica expõe autorização, dependências e resumo estruturado
# pass 1  # fail 0
```

Verde. O que antes quebrava na primeira promoção agora atravessa a transição.

Segundo, o cenário que o teste precisa continuar pegando. Promovi um item extra
para `ACTIVE`, deixando dois simultâneos:

```
not ok 1 - fila canônica expõe autorização, dependências e resumo estruturado
  expected: 1
  actual:   2
```

Vermelho, como deve ser. A invariante de item ativo único continua com dentes. A
correção reduziu fragilidade sem reduzir cobertura, que era exatamente a
condição do finding.

## Pendências do ciclo 1 encerradas

- **INFO-1.** A autorização dos itens 7 a 26 está persistida como `OD-002` em
  `docs/engineering/OWNER_DECISIONS.md`, com o texto do proprietário preservado.
- **INFO-3.** O cross-link foi aplicado: `handoffs/README.md:14` e
  `docs/engineering/REVIEW_PROTOCOL.md:20` apontam para o registro de decisões.
  Conferi também a integridade do arquivo: as citações literais do proprietário
  em `OD-001` e `OD-002` permanecem intactas e nenhuma decisão foi reescrita.

## Pendência que permanece aberta, sem bloquear

- **INFO-2.** Segue a contradição normativa entre `AGENTS.md:214`, "nunca
  autodeclare APPROVED", e `docs/engineering/REVIEW_PROTOCOL.md:25`, "Codex não
  aprova formalmente a própria implementação", de um lado, e o fluxo
  `IMPLEMENTING -> VALIDATING -> APPROVED -> FINALIZING_LOCAL -> COMPLETED` com
  a exceção `OWNER_AUTHORIZED_SELF_REVIEW`, de outro. Não nasceu neste lote e
  não o bloqueia. Exige decisão do proprietário sobre se a auto-revisão é padrão
  ou exceção, e a harmonização do texto no lote em que isso for decidido.

## Verificações executadas neste ciclo

| Verificação | Resultado observado |
| --- | --- |
| `node --test tests/scripts/dev-control-mvp.test.mjs` | PASS, 8/8 |
| Mesmo teste após simular a próxima transição da fila | PASS, 1/1 |
| Mesmo teste com dois itens `ACTIVE` | FAIL, invariante detecta |
| `npm run test:all` em espelho com dependências | 566 testes, 564 PASS, 1 skip, 1 falha dependente de Supabase local |
| `npm run review:gates` | 0 regressões bloqueantes, 43 itens do baseline resolvidos |
| `git diff --check` | limpo, exit 0 |
| Fila | 1 item `ACTIVE`, 19 em `BACKLOG` |
| Integridade de `OWNER_DECISIONS.md` | OD-001 e OD-002 íntegras |
| Escopo | `apps/`, `packages/` e `supabase/` intocados |

A única falha da suíte é
`tests/scripts/access-profile-capabilities-stability.test.mjs`, que exige
Supabase local e é inalcançável do ambiente do revisor. Mesma falha do ciclo 1,
não é regressão.

Não reexecutei `lint`, `web:typecheck`, `web:build` nem `docs:validate` neste
ciclo. O delta é um arquivo de teste e documentação canônica, fora de `apps/web`
e de `packages/`. No ciclo 1 o `docs:validate` foi executado no checkout com 0
documentos bloqueados.

## Mérito, confirmado do ciclo 1

A decomposição da fila permanece aprovada: 20 itens com grafo de dependências
que ordena dados antes de tela, números da missão tratados como evidência a
investigar em vez de regra a reproduzir, e ausência de segunda fonte de verdade.

## Consequências da aprovação

Aprovado o lote como decomposição normativa e formalização de `BACKLOG` e
`READY`. Não autoriza push, merge, pull request, deploy, migration remota nem
alteração de release surface, conforme `OD-001`.

Aprovar o backlog não aprova nenhum lote futuro. Cada item de 8 a 26 exige TASK,
IMPLEMENTATION e REVIEW próprios, e a autorização do proprietário em `OD-002` é
de execução na ordem de dependências, não de aceite antecipado.

## Próximo passo

Owner retorna ao Codex. Cabem a ele, sob a autonomia da `OD-001`:

1. Integrar o lote por commit local restrito ao escopo.
2. Arquivar `handoffs/current/` como `CONTROL-PLANE-BACKLOG-2026-08-21`.
3. Atualizar `handoffs/README.md` aplicando, **na mesma edição**, a baixa deste
   lote e a promoção do próximo item elegível. A invariante de item `ACTIVE`
   único fica vermelha em qualquer janela intermediária.
4. Abrir o `DATA-OPERATION-SCOPE-2026-08-21`, primeiro item sem dependência
   pendente após este lote.
