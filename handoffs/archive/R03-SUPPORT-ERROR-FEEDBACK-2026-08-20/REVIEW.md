# Review

## Task ID

R03-SUPPORT-ERROR-FEEDBACK-2026-08-20

## Reviewer

Claude, Principal Engineer / Independent Code Reviewer

## Commit revisado

Base SHA `729bf5d550e0c157d84cf625d20936f6eed76f29`, branch `main`, `ahead 6`.
Estado revisado: worktree não commitado sobre esse commit.
Ciclo 2, re-review incremental restrito aos dois findings do ciclo 1.

## Veredito

APPROVED.

Os dois findings do ciclo 1 estão resolvidos e verificados por execução. A
alteração de produto permanece a mesma que já havia sido considerada correta no
ciclo 1, e nada fora do escopo entrou.

## Resolução dos findings do ciclo 1

### R03-F01 - RESOLVED

O Base SHA declarado passou a ser o retorno literal de `git rev-parse HEAD` nos
três artefatos:

| Arquivo | Valor atual |
| --- | --- |
| `handoffs/current/STATUS.md:6` | `729bf5d550e0c157d84cf625d20936f6eed76f29` |
| `handoffs/current/TASK.md:99` | `729bf5d550e0c157d84cf625d20936f6eed76f29` |
| `handoffs/current/IMPLEMENTATION.md:13` | `729bf5d550e0c157d84cf625d20936f6eed76f29` |

O valor inexistente `729bf5d6dbf71a6ef227c2665b0f4ad7d5b292df` continua citado
apenas dentro deste veredito, como registro do finding. `git cat-file -t` sobre
ele segue respondendo `could not get object info`, o que preserva a evidência.

### R03-F02 - RESOLVED, com correção superior à recomendada

O padrão passou a ser construído assim, em
`tests/scripts/support-error-feedback.test.mjs`:

```js
new RegExp('const\\s*\\[\\s*,\\s*set' + capitalizedStateName + '\\s*\\]')
```

Duas melhorias em relação ao que eu havia recomendado. Primeira: `\s*` no lugar
de espaços literais, o que torna o guarda tolerante a quebra de linha, e a
declaração multilinha era exatamente o caso que escapava do gate determinístico
segundo o veredito do ciclo 0. Segunda: o teste agora prova o próprio guarda,
com uma asserção positiva contra uma regressão sintética antes de usar o padrão
como asserção negativa.

Verificação por execução, com o mesmo padrão do teste aplicado a quatro formas:

```
padrao: const\s*\[\s*,\s*setAgentsPhase\s*\]
uma linha                      -> casa: true
sem espaco                     -> casa: true
quebra de linha                -> casa: true
forma correta nao deve casar   -> casa: false
```

Os 4 estados que no ciclo 1 ficavam sem guarda nenhuma, `customerAccountContext`,
`customerRecentEvents`, `attachmentDownloadingId` e `selectedRecentEventsWindow`,
passam a estar cobertos. O requisito técnico do `TASK.md` está cumprido.

## Verificações reexecutadas neste ciclo

| Verificação | Comando | Resultado observado |
| --- | --- | --- |
| Guarda do teste, prova independente | probe própria com o mesmo padrão do teste | detecta uma linha, sem espaço e multilinha; não casa com a forma correta |
| Teste do lote | `node --test tests/scripts/support-error-feedback.test.mjs` | PASS, 2/2 |
| Suíte completa | `npm run test:all` | PASS, 555/555, exit 0 |
| Typecheck web | `npm run web:typecheck` | PASS, exit 0 |
| Gates determinísticos | `npm run review:gates` | 0 regressões, 8 itens do baseline resolvidos, `FRONT_DISCARDED_STATE` em 0 contra baseline 7 |
| Higiene do diff | `git diff --check` | limpo, exit 0 |
| Base SHA declarado | `git rev-parse HEAD` e `git cat-file -t` | coerente nos três artefatos |

Não reexecutei `npm run lint`, `npm run web:build` nem `docs:validate` neste
ciclo. Constam como declarados pelo implementador, não como verificados por mim.

## Escopo do ciclo de correção

A correção não tocou código de produto, como eu havia pedido.
`auxiliaryLoadFeedback` segue em `SupportWorkspacePage.tsx:4712`,
`visibleDetailNotice` em `4726` e a entrega ao `SupportTicketConversationSection`
em `5773-5774`, nas mesmas posições do ciclo 1. A contagem de entradas do
worktree permanece 76.

## O que segue não validado

- Comportamento em execução. O teste é de contrato sobre o texto-fonte, padrão
  aceito no repositório para `.tsx`, e não exercita render. O repositório não tem
  jsdom, vitest nem react-testing-library instalados.
- QA visual autenticado no Support Workspace com falha auxiliar simulada.
- `lint`, `web:build` e `docs:validate` neste ciclo.
- Comportamento com duas falhas auxiliares simultâneas. A prioridade é
  determinística por leitura, mas somente a primeira falha é exibida e isso não
  foi exercitado.

## Observação de governança, fora do escopo deste lote

A fila canônica em `handoffs/README.md` ainda não registra `DEV-CONTROL-MVP`, que
o proprietário autorizou como próximo item após R-03, antes de R-11 e R-14. A
evolução da fila contínua com estados `PROPOSED` e `APPROVED` também ainda não
apareceu no repositório. Registro como pendência do próximo lote de governança do
Codex, não como achado deste lote.

Quando essa evolução chegar, verificarei especificamente se ela não introduz
segunda fonte operacional de verdade, estado duplicado, concorrência, ambiguidade
entre a fila e `STATUS.md`, ou caminho para executar item não aprovado.

## Próximo passo recomendado

1. Integrar este lote em commit próprio, com `SupportWorkspacePage.tsx`, o teste
   novo e os artefatos de handoff.
2. Registrar `DEV-CONTROL-MVP` na fila canônica antes de abri-lo.
3. Não abrir R-11 antes disso.
