# TASK

- Task ID: `DEV-CONTROL-VISUAL-V1-2026-08-22`
- State: `READY_FOR_REVIEW`
- Owner: `Sentinel`
- Role: `REVIEWER`
- Reviewer active: `Sentinel`
- Review mode: `SENTINEL_REQUIRED`
- Coordinator: `Codex`
- Agent coordination: `REVIEW_ACTIVE`
- Approval: `APPROVED`
- Base SHA: `1c8939583a78faffe8267bbbfdfb82c30a6af94c`
- Current SHA: `UNCOMMITTED_WORKTREE`
- Allowlist: `tools/dev-control/`, `tests/scripts/dev-control-mvp.test.mjs`,
  relatório de prontidão do control plane e documentação necessária para
  registrar a evolução; somente leitura local, sem ações externas.

## Objetivo

Evoluir o MVP local do Development Control Plane para um painel visual útil ao
proprietário acompanhar a construção do ConfiOne, reutilizando as fontes
canônicas do repositório e sem criar uma segunda fila ou fonte de verdade.

## Escopo obrigatório

- Exibir task corrente, estado, owner, fila, dependências, decisões, revisão,
  findings, gates, worktree e última evidência disponível.
- Exibir Forge, Sentinel e Codex com estado observável e heartbeat como
  fallback, distinguindo atividade confirmada de ausência de atualização.
- Mapear corretamente os estados canônicos da fila, incluindo `BACKLOG`,
  `READY`, `IMPLEMENTING`, `READY_FOR_REVIEW`, `CHANGES_REQUESTED`,
  `APPROVED`, `DONE`, `BLOCKED` e `OWNER_DECISION_REQUIRED`.
- Permitir inspeção visual de detalhes sem executar aprovação, transição,
  comando, escrita ou publicação.
- Cobrir loading, erro, vazio, worktree sujo e ausência de dados sem inventar
  progresso ou esconder bloqueios.
- Preservar segurança: não exibir secrets, tokens, credenciais, dados de
  clientes ou conteúdo sensível dos handoffs além do necessário ao controle.

## Critérios de aceite

- O painel usa `tools/dev-control` e os arquivos canônicos como fonte direta.
- A API e a interface permanecem locais e read-only.
- A visualização mostra claramente o que está ativo, aguardando, bloqueado,
  aprovado, concluído e pendente de revisão.
- Estados de agentes e heartbeats são rotulados como evidência, não como
  inferência de execução.
- Testes focados, `git diff --check` e validação documental passam.
- Nenhum código de produto, banco, migration, secret, integração externa,
  produção ou release surface é alterado.

## Fora do escopo

Não criar autenticação própria, banco paralelo, snapshot paralelo, comandos de
aprovação, execução de agentes pela UI, publicação online ou alteração do shell
do ConfiOne.
