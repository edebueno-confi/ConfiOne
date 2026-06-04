# CS Workspace Readiness Audit - 2026-06-04

## Resumo executivo

O proximo passo seguro para CS ainda nao e abrir `/cs/portfolio` no frontend. A auditoria confirmou que o projeto ja possui contexto real de produto/assinatura em Admin e Support, mas ainda nao possui contrato CS materializado, gate proprio de CS, role global de Customer Success ou read model `vw_cs_*`.

Criar uma tela CS agora exigiria reutilizar permissao de suporte ou compor dados no frontend. Isso violaria as regras vigentes de backend como source of truth, leitura por view/read model, ausencia de mock e separacao entre suporte e CS.

Recomendacao deste sublote: manter CS como bloqueado para runtime amplo e executar primeiro um lote backend-first de fundacao CS Portfolio, ou uma decisao humana explicita autorizando um recorte read-only sob papel existente. Sem essa decisao, o menor lote correto e documental.

## O que foi auditado

- `AGENTS.md`
- `docs/GOAL_EXECUTION_PLAN.md`
- `docs/PROJECT_STATE.md`
- `docs/ROADMAP_BUILDOUT_V3.md`
- `docs/OPERATIONAL_CONTROL_PLANE_V1.md`
- `docs/VIEW_RPC_CONTRACTS.md`
- `docs/AUTH_CONTEXT_STRATEGY.md`
- `apps/web/src/app/router.tsx`
- `apps/web/src/features/auth/post-login-redirect.ts`
- `apps/web/src/features/navigation/UnifiedEnvironmentNavigation.tsx`
- `supabase/migrations/`
- `supabase/tests/`
- `packages/contracts/`
- `apps/web/src/`
- relatorios recentes em `docs/reports/`

## Evidencia encontrada

### Contratos existentes que ajudam CS no futuro

- `vw_admin_customer_product_subscriptions`
- `vw_admin_customer_product_subscription_detail`
- `vw_admin_customer_product_feature_entitlements`
- `vw_admin_customer_product_internal_owners`
- `vw_support_customer_product_context`
- `vw_support_customer_360`
- `vw_support_customer_account_context`
- `vw_support_customer_recent_tickets`
- `vw_support_customer_recent_events`

Esses contratos sustentam Admin e Support. Eles nao constituem ainda um contrato CS.

### Contratos CS ausentes

A busca textual nao encontrou contrato materializado para:

- `vw_cs_customer_portfolio`
- `vw_cs_customer_health_summary`
- `vw_cs_customer_product_portfolio`
- `vw_cs_customer_product_subscription_health_inputs`
- `rpc_cs_*`
- `customer_success_portfolio`
- `customer_health_signals`

### Auth e roteamento atuais

`docs/AUTH_CONTEXT_STRATEGY.md` e `apps/web/src/features/auth/post-login-redirect.ts` cobrem hoje:

- `platform_admin` -> `/admin`
- `support_manager` / `support_agent` -> `/support/queue`
- membro de area interna -> `/internal-actions`
- `engineering_member` / `engineering_manager` -> `/engineering`
- `customer_user` / `customer_manager` -> `/portal`

Nao existe destino `/cs`, gate CS ou permissao CS propria.

### Router e navegacao

`apps/web/src/app/router.tsx` possui rotas para:

- `/admin`
- `/support`
- `/engineering`
- `/internal-actions`
- `/portal`
- `/help`

Nao existe rota `/cs` ou shell CS. A navegacao interna tambem nao possui dominio CS separado.

## Lacunas reais

1. Falta role ou contexto executavel de CS.
2. Falta gate de rota CS baseado em read model.
3. Falta read model `vw_cs_customer_portfolio`.
4. Falta read model de health/sinais autorizados para CS.
5. Falta decisao de produto sobre diferenca entre carteira CS, suporte, ownership interno e follow-ups.
6. Falta decisao sobre health score: quais sinais entram, se existe score canonico, quem edita e quem ve.
7. Falta definicao de escrita CS: follow-up, tarefa, projeto, plano de acao ou apenas leitura.
8. Falta blueprint/screen spec para evitar CRM generico ou dashboard decorativo.

## Riscos de implementar CS agora

- Reaproveitar `support_manager` como CS sem decisao de produto criaria permissao ambigua.
- Usar `vw_support_customer_product_context` diretamente em `/cs` misturaria fronteiras de suporte e CS.
- Montar portfolio no frontend com multiplas views criaria regra de negocio local.
- Criar health score visual sem contrato backend canonico produziria indicador falso.
- Criar follow-up/tarefa/projeto sem RPC e auditoria geraria acao fake ou escrita sem governanca.
- Expor dados de produto/plano para CS antes de boundary explicita pode abrir risco de permissao futura.

## Recomendacao de execucao

Preparar antes de criar UI CS.

O proximo lote mais seguro e `CS Portfolio Contract Foundation`, backend-first e pequeno:

1. Decidir se CS usa role nova ou membership de area `customer_success` como gate inicial.
2. Materializar read model `vw_cs_customer_portfolio` com tenant, cliente, produto/plano permitido, owner CS, contadores agregados de tickets e estados `Indisponível` para dados ausentes.
3. Materializar read model separado para sinais de health somente se houver decisao de produto; caso contrario, expor apenas sinais brutos autorizados, sem score.
4. Cobrir RLS, grants, isolamento tenant e pgTAP.
5. Somente depois conectar `/cs/portfolio` read-only.

## O que nao fazer ainda

- Nao criar rota `/cs` sem gate backend.
- Nao usar support view como contrato CS definitivo.
- Nao criar health score no frontend.
- Nao criar follow-up, tarefa, projeto ou plano de acao sem RPC.
- Nao expor billing, preco, invoice, payment, revenue ou financeiro.
- Nao criar mock de portfolio.

## Stop conditions

Parar e pedir decisao humana se o proximo lote precisar definir:

- role propria de CS versus membership de area `customer_success`;
- quem e owner primario da carteira;
- quais sinais entram em health;
- se CS pode escrever follow-ups/tarefas/projetos;
- se dados financeiros aparecem para CS;
- se Support e CS podem compartilhar a mesma superficie ou precisam shells separados.

## Proximo lote recomendado

`CS Portfolio Contract Foundation`, sem UI no primeiro corte, salvo se a decisao humana autorizar explicitamente um portfolio read-only com contrato backend materializado no mesmo lote.

Validacoes esperadas para esse proximo lote:

- `git status --short`
- `git diff --check`
- `npm run contracts:typecheck`
- `npm run web:typecheck`
- `npm run web:build`
- `npm run supabase:lint:db`
- `npm run supabase:test:db`
- smoke autenticado apenas depois de UI real conectada a `vw_cs_*`

## Validacoes deste sublote

- `git status --short`
- busca textual em docs, migrations, testes, contratos TS, router e navegacao
- `git diff --check`
- `npm run contracts:typecheck`
- `npm run web:typecheck`
- `npm run web:build`
- `npm run supabase:lint:db`
- `npm run supabase:test:db`
- `npm run documentation:validate:internal-docs`

Nao houve smoke autenticado ou validacao visual nova porque o sublote nao alterou runtime nem UI.

## Status deste sublote

- Tipo: documental/readiness.
- Runtime alterado: nao.
- Backend/Supabase alterado: nao.
- Migrations criadas: nao.
- UI criada: nao.
- Scripts alterados: nao.
- Deploy remoto: nao.
