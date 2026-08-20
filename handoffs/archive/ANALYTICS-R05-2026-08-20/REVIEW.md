# Review

## Task ID

ANALYTICS-R05-2026-08-20

## Reviewer

Claude, Principal Engineer / Independent Code Reviewer

## Ciclo

Ciclo 1 deste lote.

## Commit revisado

UNCOMMITTED_WORKTREE

## Base commit

64103335a5fbe89dfb8d67730dc60a5cd5d78ec1

## Data da revisão

2026-08-20

## Resultado final

APPROVED

O finding R-05 está corrigido. A asserção deixou de depender da posição no array,
a expectativa de exatamente um ticket aberto foi preservada e o contra-teste de
isolamento entre `Aftersale` e `Neotrust` existe e prova o requisito pelo contrato
público do RPC. A suíte ampla voltou ao verde por execução minha, não por declaração.

APPROVED cobre exclusivamente o escopo deste lote. O baseline de produto continua
`BASELINE_LEGACY / PREEXISTING_WORK`, com R-01 a R-04 e R-06 a R-14 abertos em
`.review/verdicts/takeover-worktree-2026-08-19.md`.

## Escopo efetivamente revisado

Diff de `supabase/tests/110_analytics_operation_scope.sql` contra a base SHA, único
arquivo de produto tocado por este lote. Confirmei por
`git diff --name-only 64103335` que os demais arquivos de produto no diff já
pertenciam ao worktree legado e não foram alterados aqui, e que nenhuma migration,
RPC, view, contrato, release surface ou baseline entrou no lote.

## Evidências executadas

| Comando ou fonte | Resultado |
| --- | --- |
| `npx supabase status` | Supabase local ativo; `imgproxy`, `edge_runtime`, `vector` e `pooler` parados, sem efeito neste lote |
| `npx supabase test db --local` | `Files=120, Tests=1860, Result: PASS`; `110_analytics_operation_scope.sql ... ok` |
| `node scripts/review/quality-gates.mjs` | 0 regressões; `PGTAP_POSITIONAL_ASSERT` caiu de 4 para 3, 1 item do baseline resolvido |
| `git diff --check` | limpo |
| `git diff 64103335 -- supabase/tests/110_...sql` | leitura integral do diff |
| `git diff --name-only 64103335` | nenhum arquivo de produto novo tocado por este lote |
| `git log -1` e `git show --stat HEAD` | verificação pendente do ciclo anterior, detalhada abaixo |
| `git ls-files .review` | base da observação O-01 |

As três validações declaradas no `IMPLEMENTATION.md` foram reexecutadas por mim e
conferem, incluindo o total de 1860 testes e o item de baseline resolvido.

## Análise técnica da correção

A asserção principal passou a filtrar pelo pipeline da fixture,
`operation-scope-aftersale`, e a somar `open_tickets` de todos os estágios
retornados, exigindo exatamente `1`. Isso remove a dependência da ordenação por
`open_tickets desc` do read model e neutraliza a interferência do snapshot real
local, que era a causa da falha original. A expectativa não foi afrouxada: dois
tickets no mesmo pipeline continuariam reprovando.

O contra-teste consulta o mesmo pipeline sob a operação `Neotrust` e exige
`jsonb_array_length(... -> 'stages') = 0`. Não há risco de comparação com `NULL`,
porque `rpc_analytics_support_stage_breakdown` constrói `stages` com
`coalesce(..., '[]'::jsonb)`.

`plan(8)` foi atualizado para `plan(9)`, coerente com a asserção adicionada, e o
total da suíte subiu de 1859 para 1860, o que a execução confirma.

Nenhuma ressalva material sobre a implementação. O Codex escolheu somar o pipeline
em vez de fixar a etapa canônica, o que é uma solução válida e mais robusta que a
que eu havia sugerido no ciclo 0, já que não depende do rótulo do estágio.

## Findings

### R-05 — estado após verificação

RESOLVED. Verificado no arquivo e por execução da suíte, não pela tabela de
respostas.

### O-01 — MEDIUM — Governança / artefato de review não versionado

- **Onde:** `.review/baseline.json` e `.review/verdicts/takeover-worktree-2026-08-19.md`.
- **Evidência:** `git ls-files .review` retorna apenas `README.md`, `state.json` e `verdicts/INFRA-GOV-2026-08-19-review-ciclo-1.md`. O commit `6410333` incluiu parte de `.review/` e deixou esses dois arquivos como não rastreados. Eles não estão ignorados, aparecem como `??` em `git status`.
- **Requisito violado:** `.review/README.md`, tabela de artefatos, declara `baseline.json` e `verdicts/<lote>.md` como versionados. A documentação commitada afirma o que o repositório não cumpre.
- **Impacto:** o gate perde reprodutibilidade fora desta máquina, porque `quality-gates.mjs` compara contra um baseline que não existe em um clone limpo, e nessa condição todo o débito histórico aparece como regressão. O veredito do ciclo 0, com R-01 a R-14, fica fora do histórico do Git apesar de ser citado como critério de aceitação no `TASK.md` deste lote e referenciado em `AGENTS.md`, `PROJECT_STATE.md` e `STATUS.md`.
- **Correção esperada:** versionar os dois arquivos em um lote de governança, ou, se a decisão for mantê-los fora do versionamento, corrigir `.review/README.md` e declarar explicitamente que o baseline é local por máquina, assumindo a perda de reprodutibilidade.
- **Fora do escopo deste lote.** Não bloqueia o APPROVED de R-05.
- **Status:** OPEN

### O-02 — LOW — Processo / handoff pré-determinando veredito

- **Onde:** `handoffs/current/STATUS.md`, versão entregue pelo Codex, seção Notes: "Codex concluiu; Claude deve executar o re-review formal. Não declarar `APPROVED` neste handoff."
- **Requisito violado:** `docs/engineering/REVIEW_PROTOCOL.md` atribui o veredito ao revisor e proíbe o implementador de determinar o resultado.
- **Impacto:** baixo na prática, e li a frase da forma mais caridosa possível, como "não aprove o baseline legado por meio deste handoff", o que é correto e foi respeitado. Ainda assim, o `STATUS.md` não deve conter instrução sobre qual veredito o revisor pode emitir.
- **Correção esperada:** manter no `STATUS.md` apenas estado, responsável e contexto factual. Restrições de escopo do veredito pertencem ao `TASK.md`, no campo de fora de escopo.
- **Status:** OPEN

## Verificação pendente do ciclo anterior, resolvida

No ciclo anterior o HEAD mudou de `55353058` para `64103335` sem que eu conseguisse
inspecionar o commit, e a decisão D-02 declarava bloqueio para commit que incluísse
`apps/web/src/app/release-surface.mjs`.

Verificado: o commit `6410333`, autoria de Ede Bueno, mensagem
`chore(governance): establish codex-claude review workflow`, contém 28 arquivos,
todos de governança e documentação, incluindo `handoffs/`, `docs/engineering/`,
`AGENTS.md`, `CLAUDE.md`, `docs/CODE_REVIEW_PROTOCOL_V1.md` e o arquivamento de
`handoffs/archive/INFRA-GOV-2026-08-19/`. **`release-surface.mjs` não está no commit**
e permanece como modificação não commitada no worktree. D-02 não foi violada e
continua pendente.

## O que não foi validado

- Não executei `lint`, `typecheck`, `build`, `npm run test`, smokes de navegador nem QA visual. O lote altera um único arquivo de teste pgTAP e não toca produto, frontend, contrato ou migration; os gates não acusaram regressão. Proporcionalidade declarada pelo Codex aceita.
- Não revisei o conteúdo dos outros 119 arquivos pgTAP. Confirmei o resultado agregado da suíte e li integralmente apenas o arquivo do lote.
- Não avaliei os findings R-01 a R-04 e R-06 a R-14 neste ciclo, por estarem fora do escopo declarado.
- Não consultei ambiente remoto, não executei operação que altere histórico do Git e não alterei código de produto, migrations, testes, contratos ou configuração executável.

## Próximo passo

Lote pronto para o processo de integração autorizado pelo proprietário. Owner passa
a ser Ede para decidir o commit deste lote e as decisões ainda abertas.

Decisões pendentes, inalteradas: D-01, classificação formal do worktree legado, e
D-02, ativação de release de `/inicio` e `/admin/tenants`, bloqueante para qualquer
commit que inclua `release-surface.mjs`.

Próximo lote técnico recomendado, na ordem do ciclo 0: R-01, negação de acesso
silenciosa, e em seguida R-03, feedback descartado no Support Workspace, que é
pré-requisito de qualquer publicação daquele módulo. O-01 pode ser resolvido junto
de qualquer lote de governança, por ser barato.
