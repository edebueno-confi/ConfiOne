# MVP Operational Completion Goal Report - 2026-06-02

## Resumo executivo

Gate 0 de fixture local foi reforcado para validacao humana do MVP operacional. O fixture funcional existente continua sendo a base canonica de QA local e agora tambem hidrata OCP V1-E com uma subscription operacional real por RPC administrativa, duas features/entitlements e dois responsaveis internos. O fixture local nao depende mais de Auth Admin/SERVICE_ROLE_KEY para materializar usuarios QA; usuarios Auth locais sao criados por SQL contra o banco local apos validacao de API_URL/DB_URL locais.

No sublote seguinte, a aba `Subscriptions` em `/admin/tenants` passou a operar criacao, edicao governada e arquivamento de subscriptions por RPCs administrativas V1-E existentes, com leitura do catalogo comercial por read models. Nao houve deploy remoto, migration remota, dado real, backend novo, Supabase novo, billing, preco, invoice ou financeiro.

No sublote `OCP V1-E Support Customer Product Context UI`, o Customer Account/Profile do suporte passou a consumir `vw_support_customer_product_context` em leitura para mostrar produto, plano, status da subscription, datas, features visiveis ao suporte e responsaveis internos. A superficie de suporte nao chama RPC administrativa de subscription, nao usa view administrativa V1-E e nao cria acao fake de editar contrato.

No sublote `CS Workspace Readiness Audit`, a proxima frente foi auditada antes de runtime. A auditoria confirmou que ainda nao existem `vw_cs_*`, `rpc_cs_*`, role/gate dedicado de Customer Success, rota `/cs` ou blueprint aprovado. Por isso, `/cs/portfolio` permanece bloqueado para UI imediata; o proximo passo seguro e uma fundacao backend-first de CS Portfolio.

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
- Atualizados `supabase/qa/create-local-support-fixture.mjs` e `supabase/qa/create-local-functional-fixture.mjs` para:
  - remover chamadas Auth Admin locais com SERVICE_ROLE_KEY;
  - criar/atualizar usuarios QA por SQL local em `auth.users` e `auth.identities`;
  - manter bloqueio de execucao fora de Supabase local;
  - tolerar falhas transitorias de Auth local apos reset (`502/503/504` e `JWT issued at future`) sem mascarar erro real de credencial.
- Conectada a UI existente de `/admin/tenants` > `Subscriptions` a contratos V1-E ja materializados para:
  - listar produtos comerciais ativos por `vw_admin_commercial_products`;
  - carregar planos por `vw_admin_commercial_product_detail`;
  - criar subscription por `rpc_admin_create_customer_product_subscription`;
  - atualizar plano, status, datas, referencia de contrato e notas por `rpc_admin_update_customer_product_subscription`;
  - arquivar subscription por `rpc_admin_archive_customer_product_subscription`.
- Mantidos em leitura neste corte:
  - entitlements/features comerciais;
  - responsaveis internos;
  - billing, preco, invoice, payment, revenue e financeiro.
- Conectado `/support/customers` e `/support/customers/:tenantId` ao read model support-safe `vw_support_customer_product_context` para:
  - substituir fallback de produto/plano por subscription real quando disponivel;
  - exibir painel `Produtos contratados`;
  - listar features visiveis ao suporte;
  - listar responsaveis internos por role/area;
  - manter estado `Indisponível` quando nao houver dado contratual.
- Auditado CS Workspace/Portfolio sem alterar runtime:
  - nao foram encontrados contratos materializados `vw_cs_*` ou `rpc_cs_*`;
  - nao existe rota `/cs`, gate CS ou redirect pos-login para Customer Success;
  - `vw_support_customer_product_context` permanece contrato de suporte, nao contrato CS;
  - health score, follow-ups, tarefas e projetos de CS seguem dependentes de decisao de produto e backend proprio.

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
- OCP V1-E Admin: `/admin/tenants` > abrir `Support QA Tenant A Operação Enterprise` > aba `Subscriptions`
- Support queue: `/support/queue`
- Ticket principal: abrir `QA Support | Operação crítica com histórico extenso, anexos e retorno operacional`
- Customer profile/context: `/support/customers`
- Customer profile com produto contratado: `/support/customers` > abrir `Support QA Tenant A Operação Enterprise`
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
- Os botoes `Nova subscription`, `Editar selecionada` e `Arquivar` chamam RPCs reais V1-E; nao ha acao fake.
- Entitlements/features e responsaveis internos continuam sem botao de mutation neste corte.
- Nao ha billing, preco, invoice, payment, revenue ou financeiro.
- A navegacao Admin continua funcionando.
- A fila de suporte mostra volume suficiente e status variados.
- O ticket principal mostra timeline longa, nota interna, mensagem publica, evidencias, Knowledge linkado e handoff/engenharia.
- O perfil do cliente em suporte mostra produto `Genius Returns`, plano `Enterprise`, 2 features e 2 responsaveis internos em leitura.
- O Portal nao vaza nota interna, engenharia, internal actions, audit bruto ou storage path.

## Validacoes executadas

- `git status --short`
- `npm run supabase:start`
- `npm run supabase:wait:ready`
- `npm run supabase:db:reset`
- `GENIUS_QA_SUPPORT_FIXTURE_TIMEOUT_MS=1200000 npm run supabase:qa:local-functional-fixture`
- `node --check supabase/qa/create-local-support-fixture.mjs`
- `node --check supabase/qa/create-local-functional-fixture.mjs`
- `npm run contracts:typecheck`
- `npm run web:typecheck`
- `npm run web:build`
- `npm run supabase:wait:ready`
- `npm run supabase:lint:db`
- `npm run supabase:test:db`
- check HTTP local do app: `HTTP 200 OK` em `http://127.0.0.1:5173`
- check de `VITE_SUPABASE_URL`: `http://127.0.0.1:54321`
- check DB Gate 0 com contagens de tickets, Knowledge, engenharia, Customer Account e OCP V1-E
- check REST autenticado dos read models V1-E: 1 linha em `vw_admin_customer_product_subscriptions`, 1 linha em `vw_admin_customer_product_subscription_detail`, 2 entitlements, 2 owners, produto `Genius Returns`, plano `Enterprise`
- smoke visual autenticado em `http://127.0.0.1:5173/admin/tenants` > `Support QA Tenant A Operação Enterprise` > aba `Subscriptions`
- smoke autenticado de mutacao governada em `Subscriptions`:
  - edicao de contrato da subscription A por RPC e restauracao do valor original;
  - criacao de subscription no tenant B por RPC;
  - arquivamento da subscription criada no tenant B por RPC;
  - reset + fixture apos smoke para restaurar a massa canonica;
  - smoke visual pos-reset confirmando 1 subscription, 2 entitlements, 2 owners e contrato `QA-OCP-V1E-LOCAL`.
- smoke autenticado em `/support/customers` e `/support/customers/:tenantId`, validando consumo de `vw_support_customer_product_context`.
- auditoria textual de CS Workspace/Portfolio em docs, migrations, testes, contratos TS, router e navegacao.
- `npm run documentation:validate:internal-docs`

Resultado dos gates: aprovados.

## Limitacoes conhecidas

- O fixture funcional e pesado em Windows local; a primeira execucao com timeout padrao de 10 minutos pode expirar. A execucao validada usou `GENIUS_QA_SUPPORT_FIXTURE_TIMEOUT_MS=1200000`.
- Apos reset local, o navegador pode manter refresh token antigo ou receber `JWT issued at future` por alguns segundos. Limpar sessao local e repetir login apos aguardar a readiness estabilizar resolveu o smoke validado.
- O fixture nao tenta iniciar `supabase functions serve` por conta propria quando o Edge Runtime local esta indisponivel, porque isso exigiria materializar SERVICE_ROLE_KEY em arquivo temporario. A execucao validada usa `npm run supabase:start` + `npm run supabase:wait:ready`.
- OCP V1-E agora tem UI Admin para criar, editar e arquivar subscriptions por RPCs existentes.
- Nao ha UI de mutation para entitlement/feature ou owner interno.
- Customer Account/Profile em suporte consome subscriptions em leitura, sem mutacao e sem view administrativa.
- CS Workspace/Portfolio ainda nao possui contrato proprio, role/gate dedicado ou rota `/cs`.
- Health score, follow-ups, tarefas e projetos de CS continuam bloqueados ate decisao de produto e fundacao backend.
- Billing, preco, invoice, payment, revenue e financeiro continuam fora do escopo e ausentes.
- Nao foi executado deploy remoto, staging, producao, provider externo ou IA real.

## Proximo lote recomendado

Proximo lote mais seguro: `CS Portfolio Contract Foundation`, backend-first, sem UI no primeiro corte salvo decisao humana explicita autorizando um portfolio read-only com contrato `vw_cs_*` materializado.

Justificativa:

- A leitura V1-E ja aparece no Admin e no Customer Account/Profile de suporte.
- A auditoria confirmou que CS ainda nao possui role/gate/read model proprio.
- Criar UI agora exigiria reaproveitar suporte ou compor portfolio no frontend, o que violaria os gates.

Antes de implementar, o lote deve declarar explicitamente:

- se CS usa role propria ou membership de area `customer_success`;
- qual read model CS materializa a carteira;
- quais sinais de health podem ser exibidos sem score canonico novo, ou se health fica fora;
- ausencia de billing/financeiro;
- confirmacao de que qualquer UI consome somente views/read models CS reais;
- gates de permissao, isolamento tenant e QA visual.

## Status de fechamento

- Branch: `codex/mvp-operational-completion-goal`
- Commit base: `cc94857 chore: remover service role do fixture local`
- Arquivos alterados nos sublotes registrados neste relatorio:
  - `apps/web/src/contracts/admin-contracts.ts`
  - `apps/web/src/features/admin/admin-api.ts`
  - `apps/web/src/features/tenants/TenantsPage.tsx`
  - `apps/web/src/contracts/support-contracts.ts`
  - `apps/web/src/features/support/support-api.ts`
  - `apps/web/src/features/support/SupportWorkspacePage.tsx`
  - `docs/PROJECT_STATE.md`
  - `docs/VIEW_RPC_CONTRACTS.md`
  - `docs/DOCUMENTATION_LEDGER.md`
  - `docs/README.md`
  - `docs/reports/CS_WORKSPACE_READINESS_AUDIT_2026-06-04.md`
  - `docs/reports/MVP_OPERATIONAL_COMPLETION_GOAL_REPORT_2026-06-02.md`
- Commit: registrado no fechamento do sublote.
