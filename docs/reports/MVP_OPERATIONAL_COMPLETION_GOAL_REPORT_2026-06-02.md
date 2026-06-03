# MVP Operational Completion Goal Report - 2026-06-02

## Resumo executivo

Gate 0 de fixture local foi reforcado para validacao humana do MVP operacional. O fixture funcional existente continua sendo a base canonica de QA local e agora tambem hidrata OCP V1-E com uma subscription operacional real por RPC administrativa, duas features/entitlements e dois responsaveis internos.

Nao houve deploy remoto, migration remota, dado real, billing, preco, invoice, financeiro ou UI nova. O lote alterou apenas fixture local de QA e este relatorio.

## Escopo executado

- Reaproveitado `npm run supabase:qa:local-functional-fixture` como fixture local canonica.
- Atualizado `supabase/qa/create-local-support-fixture.mjs` para:
  - criar produto comercial local `genius_returns_local_qa` com display name `Genius Returns`;
  - criar plano `enterprise`;
  - criar duas features comerciais reais: `returns_portal` e `priority_support`;
  - criar uma subscription ativa para `support-qa-a`;
  - criar dois entitlements ativos;
  - criar dois owners internos ativos, sendo um por area `operations` e outro nominal para o support manager QA;
  - expor resumo OCP V1-E no JSON final do fixture via read models administrativos.

## Evidencia Gate 0

Resumo confirmado por query local apos reset e fixture:

- tickets totais: 25
- status presentes: `new`, `triage`, `in_progress`, `waiting_customer`, `waiting_engineering`, `waiting_support`
- ticket principal com timeline: 32 mensagens
- ticket principal com evidencias: 4 anexos
- vinculos ticket -> Knowledge: 8
- engineering work items: 8
- customer account profiles: 2
- artigos publicos com rota: 6
- OCP V1-E: 1 subscription, 2 entitlements ativos, 2 owners ativos

## Credenciais QA principais

- Platform admin: `qa.local.platform-admin@genius.local` / `Local-QA-Admin-2026!`
- Support manager: `qa.local.support-manager-a@genius.local` / `Local-QA-Manager-A-2026!`
- Support agent: `qa.local.support-agent-a@genius.local` / `Local-QA-Agent-A-2026!`
- Engineering member: `qa.local.engineering-member-a@genius.local` / `Local-QA-Engineering-A-2026!`
- Customer user: `marina.ops@support-qa-a.local` / `Local-QA-Customer-A-2026!`
- Customer manager: `gestao.portal@support-qa-a.local` / `Local-QA-Customer-Manager-A-2026!`
- Internal area member: `qa.local.internal-area-member@genius.local` / `Local-QA-Internal-Area-2026!`

## Rotas recomendadas para validacao humana

- Admin tenants: `/admin/tenants`
- OCP V1-E read-only: `/admin/tenants` > abrir `Support QA Tenant A Operação Enterprise` > aba `Subscriptions`
- Support queue: `/support/queue`
- Ticket principal: abrir `QA Support | Operação crítica com histórico extenso, anexos e retorno operacional`
- Customer profile/context: `/support/customers`
- Portal cliente: `/portal`
- Portal tickets: `/portal/tickets`
- Portal help autenticado: `/portal/help`
- Public Help: `/help/genius`
- Engineering workspace: `/engineering`
- Internal actions: `/internal-actions`

## O que validar visualmente

- A aba `Subscriptions` mostra 1 subscription sem duplicacao.
- A subscription mostra produto `Genius Returns` e plano `Enterprise`.
- A subscription mostra 2 entitlements/features.
- A subscription mostra 2 responsaveis internos.
- Campos ausentes aparecem como `Indisponível`.
- Nao ha botao fake de criar, editar ou arquivar subscription.
- Nao ha billing, preco, invoice, payment, revenue ou financeiro.
- A navegacao Admin continua funcionando.
- A fila de suporte mostra volume suficiente e status variados.
- O ticket principal mostra timeline longa, nota interna, mensagem publica, evidencias, Knowledge linkado e handoff/engenharia.
- O Portal nao vaza nota interna, engenharia, internal actions, audit bruto ou storage path.

## Validacoes executadas

- `git status --short`
- `npm run supabase:start`
- `npm run supabase:wait:ready`
- `npm run supabase:db:reset`
- `GENIUS_QA_SUPPORT_FIXTURE_TIMEOUT_MS=1200000 npm run supabase:qa:local-functional-fixture`
- `node --check supabase/qa/create-local-support-fixture.mjs`
- `npm run contracts:typecheck`
- `npm run web:typecheck`
- `npm run web:build`
- `npm run supabase:lint:db`
- `npm run supabase:test:db`
- check HTTP local do app: `HTTP 200 OK` em `http://127.0.0.1:5173`
- check de `VITE_SUPABASE_URL`: `http://127.0.0.1:54321`
- check DB Gate 0 com contagens de tickets, Knowledge, engenharia, Customer Account e OCP V1-E

Resultado dos gates: aprovados.

## Limitacoes conhecidas

- O fixture funcional e pesado em Windows local; a primeira execucao com timeout padrao de 10 minutos pode expirar. A execucao validada usou `GENIUS_QA_SUPPORT_FIXTURE_TIMEOUT_MS=1200000`.
- O fixture canonico ainda usa Auth Admin local/SERVICE_ROLE_KEY local para criar e atualizar usuarios QA. Nao houve uso remoto, dado real ou exposicao de secrets no relatorio.
- OCP V1-E esta disponivel em leitura Admin; nao ha UI nova de mutation de subscriptions.
- Billing, preco, invoice, payment, revenue e financeiro continuam fora do escopo e ausentes.
- Nao foi executado deploy remoto, staging, producao, provider externo ou IA real.

## Proximo lote recomendado

Proximo lote mais seguro: mutation governada de subscriptions no Admin, limitada a contratos V1-E ja existentes.

Justificativa:

- A leitura V1-E ja esta validada localmente.
- O fixture agora fornece massa suficiente para testar criacao/edicao/arquivamento governados.
- As RPCs administrativas ja existem, mas a UI ainda e read-only.

Antes de implementar, o lote deve declarar explicitamente:

- quais mutations entram no primeiro corte;
- quais campos ficam indisponiveis;
- ausencia de billing/financeiro;
- confirmacao de que a UI chama somente RPCs V1-E existentes;
- gates de RLS, auditoria, permissao e QA visual.

## Status de fechamento

- Branch: `codex/mvp-operational-completion-goal`
- Commit base: `1ebf12d fix: corrigir agregacoes de subscriptions ocp v1-e`
- Arquivos alterados neste lote:
  - `supabase/qa/create-local-support-fixture.mjs`
  - `docs/reports/MVP_OPERATIONAL_COMPLETION_GOAL_REPORT_2026-06-02.md`
- Commit: pendente ate revisao final do lote.
