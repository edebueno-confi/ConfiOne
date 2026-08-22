# REVIEW

- Task ID: `DEV-CONTROL-VISUAL-V1-2026-08-22`
- Estado revisado: `READY_FOR_REVIEW` (re-review incremental)
- Veredito final: `APPROVED`
- Veredito inicial: `CHANGES_REQUESTED` (findings preservados abaixo)
- Reviewer: Sentinel (Codex Independent Reviewer)
- Review mode: `SENTINEL_REQUIRED`
- Base SHA: `1c8939583a78faffe8267bbbfdfb82c30a6af94c`
- HEAD observado: `1c8939583a78faffe8267bbbfdfb82c30a6af94c`
- Implementation SHA: `UNCOMMITTED_WORKTREE`
- Estado do worktree: alterações rastreadas e não rastreadas amplas, preservadas
  e fora da allowlist deste lote.

## Resumo da entrega

O lote evolui o Development Control Plane local com painel de agentes,
classificação bruto/canônica da fila, detalhes de handoff, gates, findings,
worktree, loading/erro/vazio e endpoint HTTP local read-only.

O ganho potencial para o SaaS é melhorar a observabilidade da execução de
engenharia sem criar uma segunda fila ou superfície de comando. A aprovação
fica pendente porque a resposta HTTP ainda entrega conteúdo bruto dos
handoffs e o detalhe de cards não é fiel para tasks que não são a corrente.

## Findings

### F-DEVCTRL-001 — HIGH — Endpoint read-only expõe documentos brutos dos handoffs

- **Evidência:** `tools/dev-control/server.mjs:140-173` retorna o objeto
  `documents` contendo o conteúdo integral de `TASK.md`, `IMPLEMENTATION.md`,
  `REVIEW.md` e `STATUS.md`. `tools/dev-control/server.mjs:377-408` incorpora
  `current` inteiro ao snapshot, e `tools/dev-control/server.mjs:457-460`
  serializa esse snapshot diretamente em `/api/snapshot`.
- **Impacto:** o endpoint sem autenticação, ainda que preso a loopback, expõe
  conteúdo que não é necessário para a visualização e que pode conter tokens,
  credenciais, dados sensíveis ou detalhes internos adicionados futuramente ao
  handoff. Isso contradiz o critério da TASK de não exibir conteúdo sensível
  além do necessário e torna o controle dependente de disciplina documental.
- **Correção esperada:** remover os documentos brutos do payload público e
  retornar somente campos derivados por allowlist. Se algum conteúdo textual
  for indispensável, aplicar sanitização/redação explícita e adicionar teste
  que confirme que o snapshot não contém o conteúdo integral nem padrões de
  secret/token/credencial.

### F-DEVCTRL-002 — MEDIUM — Detalhe de card exibe o estado da task corrente para outra task

- **Evidência:** `tools/dev-control/public/app.js:119-142` seleciona um item da
  fila, mas continua usando `snapshot.current.status` e
  `snapshot.current.review` para Task ID, estado, approval, review e findings.
  Assim, ao abrir um card diferente da task corrente, o painel pode mostrar o
  review e o estado da task corrente junto do título/dependências da task
  selecionada.
- **Impacto:** o painel pode induzir o proprietário a atribuir findings,
  approval ou estado de execução à task errada, contrariando a promessa do
  relatório de inspeção detalhada por card.
- **Correção esperada:** construir um modelo de detalhe por task, associando
  fila e arquivo arquivado/corrente antes de renderizar estado, review,
  findings, gates e evidências. Alternativamente, restringir explicitamente o
  detalhe à task corrente e remover a promessa de detalhe completo para os
  demais cards.

### F-DEVCTRL-003 — MEDIUM — Parser de review não reconhece `CHANGES_REQUESTED`

- **Evidência:** `tools/dev-control/server.mjs:96-100` reconhece somente
  `APPROVED`, `REQUEST_CHANGES` e `BLOCKED`. O protocolo e a fila canônica usam
  `CHANGES_REQUESTED`; o teste `tests/scripts/dev-control-mvp.test.mjs:145-176`
  cobre apenas `REQUEST_CHANGES`.
- **Impacto:** uma review corrente com `Veredito: CHANGES_REQUESTED` pode ser
  exibida como `PENDING`, ocultando o veredito atual embora o estado da fila
  esteja correto. Isso reduz a confiabilidade do painel justamente no fluxo
  que exige ação do Forge.
- **Correção esperada:** aceitar `CHANGES_REQUESTED` como forma canônica,
  preservar compatibilidade com `REQUEST_CHANGES` e adicionar teste para ambos,
  incluindo findings abertos/resolvidos.

## Validações independentes

- `node --test tests/scripts/dev-control-mvp.test.mjs` — **PASS**, 9/9.
- `node --input-type=module` com `readSnapshot()` — **PASS** estrutural, mas
  confirmou `current.documents` com as quatro chaves e conteúdo bruto, base
  objetiva do F-DEVCTRL-001.
- `npm run docs:validate` — **PASS**, 0 documentos bloqueados; alertas legados
  preservados.
- `npm run review:gates` — **PASS**, 0 regressões bloqueantes e 45 itens do
  baseline resolvidos.
- `node .agents/skills/genius-code-quality/scripts/run-quality-gate.mjs module tools/dev-control` — **PASS**, 0 blockers e 0 findings.
- `git diff --check` — **PASS**.
- Smoke HTTP/UI local e lint foram reportados pelo Forge como **PASS**.
- Não foi executado QA visual em navegador autenticado; essa limitação foi
  corretamente registrada e permanece pendente.

## Decisão inicial e próximo passo

`CHANGES_REQUESTED`. Forge deve corrigir F-DEVCTRL-001, F-DEVCTRL-002 e
F-DEVCTRL-003 dentro da allowlist, atualizar os testes focados e devolver o
handoff em `READY_FOR_REVIEW`. Nenhuma alteração de código de produto,
migration, contrato do ConfiOne, secret, produção ou ação externa foi realizada
pelo Sentinel.

## Re-review incremental — 2026-08-22

**Reviewer: Sentinel (Codex Independent Reviewer)**

- **Task ID:** `DEV-CONTROL-VISUAL-V1-2026-08-22`
- **Estado revisado:** `READY_FOR_REVIEW`
- **Base SHA:** `1c8939583a78faffe8267bbbfdfb82c30a6af94c`
- **HEAD observado:** `1c8939583a78faffe8267bbbfdfb82c30a6af94c`
- **Implementation SHA:** `UNCOMMITTED_WORKTREE`

### Findings reavaliados

- **F-DEVCTRL-001 — RESOLVIDO.** `readCurrentHandoff()` agora retorna apenas
  campos derivados allowlisted, sem `current.documents`. O snapshot público
  não contém o conteúdo integral dos handoffs. O teste confirma ausência do
  campo, de cabeçalhos brutos de documentos e de padrões
  `secret/token/credential`.
- **F-DEVCTRL-002 — RESOLVIDO.** `buildTaskDetails()` associa cada item da fila
  à task corrente ou ao archive correspondente por `task_id`. Tasks sem
  handoff não recebem owner, review, findings, gates ou estado observado
  inventados. `renderTaskDetail()` consome exclusivamente o registro associado.
- **F-DEVCTRL-003 — RESOLVIDO.** `parseReview()` reconhece tanto
  `CHANGES_REQUESTED` quanto `REQUEST_CHANGES`, mantendo compatibilidade e
  classificando findings abertos e resolvidos. Há teste dedicado para as duas
  formas.

### Gates independentes do re-review

- `node --test tests/scripts/dev-control-mvp.test.mjs` — **PASS**, 10/10.
- `readSnapshot()` estrutural — **PASS**: `current.documents` ausente,
  `taskDetails` gerado e tasks sem handoff permanecem sem evidência inventada.
- `npm run docs:validate` — **PASS**, 0 documentos bloqueados; alertas legados
  preservados.
- `npm run review:gates` — **PASS**, 0 regressões bloqueantes e 45 itens do
  baseline resolvidos.
- `node .agents/skills/genius-code-quality/scripts/run-quality-gate.mjs module tools/dev-control` — **PASS**, 0 blockers e 0 findings.
- `git diff --check` — **PASS**.
- Smoke HTTP/UI e lint foram reportados pelo Forge como **PASS**.
- QA visual em navegador autenticado não foi executado e permanece como
  limitação explicitamente registrada.

### Veredito final

`APPROVED`. Os três findings foram resolvidos dentro da allowlist, sem
alteração de código de produto, banco, migration, secret, integração externa
ou release surface. O próximo passo autorizado é o Forge finalizar localmente
o lote, arquivar o handoff e normalizar o estado. Push, merge, deploy,
migrations remotas, secrets e release continuam proibidos.
