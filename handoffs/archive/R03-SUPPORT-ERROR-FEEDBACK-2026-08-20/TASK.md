# Task

## Task ID

R03-SUPPORT-ERROR-FEEDBACK-2026-08-20

## Título

Restaurar feedback de erro no Support Workspace

## Contexto

O finding baseline `R-03` identificou estados de carregamento e erro do
Support Workspace que recebiam valores, mas eram declarados como
`const [, setX]`. O setter continuava sendo chamado, porém a interface não lia
o valor. O problema afetava carregamento de agentes, anexos, handoff técnico e
Knowledge, além de leituras de contexto sem consumidor no layout corrente.

## Objetivo

Garantir que falhas das cargas auxiliares do ticket sejam comunicadas ao
operador em uma superfície visível do Support Workspace, sem silenciar erros e
sem reintroduzir componentes removidos do layout atual.

## Escopo

- `apps/web/src/features/support/SupportWorkspacePage.tsx`.
- `tests/scripts/support-error-feedback.test.mjs`.
- Artefatos canônicos deste handoff.
- Atualização da fila em `handoffs/README.md`.

## Fora de escopo

- R-11, R-14 ou qualquer outro finding.
- Alterar migrations, RLS, RPCs, banco, contratos ou permissões.
- Alterar release surface, `/inicio` ou `/admin/tenants`.
- Reintroduzir o antigo `SupportOperationalWorkbenchPanel` ou outro componente
  paralelo que não seja consumidor do layout corrente.
- Corrigir mudanças preexistentes não relacionadas no Support Workspace.
- Commit, push, merge, deploy, migration remota ou alteração de secrets.

## Requisitos funcionais

- Falhas de agentes atribuíveis devem aparecer como aviso operacional visível.
- Falhas de anexos e handoff técnico devem aparecer como aviso operacional
  visível.
- Falhas do carregamento de Knowledge devem aparecer como aviso operacional
  visível.
- O aviso deve usar a mensagem classificada pelo backend e não pode ser
  descartado por estado sem consumidor.
- Estados de carregamento e sucesso existentes devem permanecer preservados.
- Leituras de contexto de cliente que não têm consumidor no layout corrente
  devem ser removidas junto com seus setters, sem permanecer como falsa
  aparência de suporte.

## Requisitos técnicos

- Reutilizar `detailNotice` e `detailNoticeTone`, já renderizados pela conversa
  operacional.
- Projetar a primeira falha auxiliar relevante de forma determinística, sem
  sobrescrever uma mensagem de ação já exibida.
- Manter `engineeringPhase`, `attachmentPhase`, `knowledgePhase` e
  `agentsPhase` como estado lido quando forem necessários para a interface.
- Adicionar teste de contrato que falhe se os estados voltarem a ser
  `const [, setX]` ou se o aviso auxiliar deixar de ser conectado ao
  `SupportTicketConversationSection`.
- Não enfraquecer o baseline nem alterar testes existentes para mascarar falhas.

## Critérios de aceitação

- O teste dedicado passa e confirma a leitura dos quatro grupos de erro.
- `SupportWorkspacePage.tsx` não contém os setters descartados do finding R-03.
- Uma mensagem de erro auxiliar chega à propriedade de aviso visível da
  conversa operacional.
- `npm run web:typecheck`, `npm run test:all`, `npm run review:gates` e
  `git diff --check` passam, quando executados.
- `STATUS.md` termina em `READY_FOR_REVIEW` com `Owner = Claude`.

## Documentos normativos aplicáveis

- `AGENTS.md`.
- `docs/engineering/REVIEW_PROTOCOL.md`.
- `handoffs/README.md`.
- `docs/SUPPORT_WORKFLOW.md`.
- `docs/SUPPORT_WORKSPACE_ARCHITECTURE_SPEC.md`.
- `docs/PROJECT_STATE.md`.

## Riscos conhecidos

- `SupportWorkspacePage.tsx` contém alterações preexistentes extensas no
  worktree. O lote deve alterar somente o feedback do finding R-03.
- QA visual autenticado depende do servidor local e de credenciais; se não for
  executado, registrar a limitação sem declarar o fluxo como validado.
- A remoção de leituras sem consumidor reduz chamadas inúteis, mas não substitui
  uma futura TASK de produto para publicar contexto adicional do cliente.

## Base commit SHA

729bf5d550e0c157d84cf625d20936f6eed76f29

## Branch

main

## Responsável atual

Codex implementa e valida; Claude revisa após `READY_FOR_REVIEW`.

## Observações do proprietário

Este é o próximo lote autorizado da fila. Não avançar para R-11 antes da
aprovação formal de R-03. D-02 permanece encerrada.
