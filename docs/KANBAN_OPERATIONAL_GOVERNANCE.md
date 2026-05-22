# KANBAN_OPERATIONAL_GOVERNANCE.md

## Objetivo

Registrar a operação durável de desenvolvimento do Genius Support OS no Hermes Kanban sem misturar esta governança com código de produto.

Esta fase cria a camada operacional para trabalho contínuo:

- board dedicado do projeto;
- perfis especializados;
- convenção de tarefas;
- backlog inicial com dependências;
- automações recorrentes seguras e read-only.

## Board oficial

- board slug: `genius-support-os`
- nome: `Genius Support OS`
- workdir padrão: `C:\Trabalho`
- objetivo: isolar o fluxo operacional do projeto em um board próprio, separado de outros contextos Hermes.

## Perfis especializados

Perfis criados a partir de `default`, com descrição operacional própria:

- `orchestrator`
  - coordena board, dependências, priorização, bloqueios e revisão de conclusão.
- `architect`
  - audita arquitetura, boundaries, contratos e risco técnico.
- `web`
  - opera frontend, fluxos de interface e estabilização de superfícies web.
- `supabase`
  - opera banco, RLS, RPCs, fixtures, verify e testes locais do backend Supabase.
- `qa`
  - conduz typecheck, build, smoke validation e checklist operacional.
- `docsgovernor`
  - mantém checkpoint, ledger, docs de área e coerência documental.
- `knowledgeops`
  - opera curadoria, importação, advisories e revisão do conhecimento interno.

### Observação de naming

O Hermes aceitou nomes alfanuméricos para profiles. Por isso, os papéis solicitados como `docs-governor` e `knowledge-ops` foram materializados como `docsgovernor` e `knowledgeops`.

## Convenção operacional do board

### Títulos

Usar o padrão:

```text
<LANE> <PRIORIDADE> · <resultado concreto>
```

Exemplos:

- `ARCH P0 · auditoria estrutural do repositório`
- `QA P0 · baseline de validação técnica`
- `WEB P1 · plano de estabilização do Support Workspace`

### Lanes oficiais

- `ARCH`
- `WEB`
- `SUPABASE`
- `DOCS`
- `QA`
- `KNOWLEDGE`
- `ORCH`

### Prioridade

- `P0`: bloqueio, fundação ou definição de continuidade.
- `P1`: estabilização operacional ou preparação de lote relevante.
- `P2`: melhoria incremental não bloqueante.

### Descrição mínima obrigatória da task

Toda task deve explicitar:

- objetivo;
- escopo;
- entregável esperado;
- restrições;
- validação esperada.

### Estados

Estados usados no board:

- `ready`: task pronta para execução.
- `running`: worker em execução.
- `todo`: task dependente de predecessoras.
- `blocked`: aguardando decisão humana, acesso ou resolução externa.
- `done`: concluída com handoff válido.

### Dependências

Regras:

- auditorias independentes devem nascer em paralelo;
- tasks de síntese ou plano devem depender explicitamente das auditorias predecessoras;
- não usar descrição textual como substituto de `parent`;
- toda task de fan-in deve começar apenas quando os insumos reais estiverem prontos.

### Bloqueios

Bloquear quando houver:

- acesso faltante;
- dependência externa real;
- risco de operação destrutiva;
- ambiguidade de produto/negócio;
- falha persistente de ambiente que impeça validação proporcional.

O motivo do bloqueio deve nomear a decisão ou o acesso faltante com objetividade.

## Backlog inicial criado

### Auditorias base

- `ARCH P0 · auditoria estrutural do repositório`
- `ARCH P0 · auditoria de contratos e boundaries`
- `DOCS P0 · auditoria de documentação interna`
- `QA P0 · baseline de validação técnica`
- `SUPABASE P1 · auditoria operacional de banco, RLS e verify`
- `KNOWLEDGE P1 · mapeamento de importação e review de conhecimento`

### Fan-in e continuidade

- `WEB P1 · plano de estabilização do Support Workspace`
  - depende de estrutura, contratos, baseline QA e auditoria Supabase.
- `DOCS P1 · rotina de governança documental`
  - depende da auditoria documental.
- `ORCH P0 · consolidar baseline operacional do board`
  - depende de todas as auditorias e planos anteriores.

## Tarefas longas/recorrentes mapeadas para operação contínua

Frentes adequadas para Kanban e/ou rotina recorrente:

- auditorias estruturais e de boundaries;
- baseline e regressão de validação técnica;
- governança de documentação interna;
- revisão contínua de curadoria knowledge;
- estabilização do Support Workspace;
- revisões operacionais de Supabase verify/RLS/fixtures.

## Automações recorrentes criadas

Jobs criados no cron do Hermes, todos em modo read-only e com `deliver=local`:

- `gso-docs-validation-review`
  - agenda: dias úteis `08:30`
  - perfil: `docsgovernor`
  - função: rodar `documentation:validate:internal-docs` e resumir alertas.

- `gso-knowledge-review-monitor`
  - agenda: dias úteis `10:00`
  - perfil: `knowledgeops`
  - função: inspecionar backlog/review atual da knowledge sem refresh com side effects.

- `gso-board-blockers-summary`
  - agenda: a cada `4h`
  - perfil: `orchestrator`
  - função: resumir bloqueios, diagnostics e travas aparentes no board.

- `gso-heartbeat-watch`
  - agenda: a cada `6h`
  - perfil: `orchestrator`
  - função: monitorar sinais de worker preso, retry e ausência de heartbeat observável.

- `gso-board-periodic-report`
  - agenda: dias úteis `17:30`
  - perfil: `orchestrator`
  - função: emitir panorama periódico do board e próximos movimentos.

## Automações recomendadas, mas não materializadas nesta fase

### Refresh automático do backlog de curadoria

Não foi automatizado nesta fase porque `knowledge:curation:backlog` regrava artefatos versionados em `docs/reports/`.

Risco:

- colisão com trabalho humano em andamento no repositório;
- geração recorrente de diffs operacionais fora de um lote explícito.

### Sync automático de advisories no Supabase local

Não foi automatizado nesta fase porque `knowledge:review:advisories:local` depende de contexto local explícito e pode interagir com o ambiente Supabase.

Risco:

- dependência de ambiente local não garantido no momento do cron;
- mistura entre monitoramento e mutação de estado operacional.

## Regra de uso daqui para frente

1. novas frentes entram primeiro como task explícita no board;
2. tasks multi-etapa devem declarar dependências reais;
3. conclusão sem validação proporcional não fecha card;
4. mudanças relevantes devem atualizar checkpoint e ledger documental;
5. automação só deve gravar estado quando o fluxo for explicitamente seguro para cron.
