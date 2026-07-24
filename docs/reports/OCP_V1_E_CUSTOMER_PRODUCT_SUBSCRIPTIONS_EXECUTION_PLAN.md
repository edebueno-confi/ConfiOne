# OCP V1-E - Customer Product Subscriptions Execution Plan

Data: 2026-06-02

## Objetivo do proximo lote executavel

Implementar a fundacao backend de Customer Product Subscriptions do Operational Control Plane V1, com contrato multi-tenant seguro para vincular cliente B2B (`tenant`) a produto comercial, plano, status, features comerciais excepcionais e responsaveis internos.

O lote deve seguir o decision record `docs/product/OCP_V1_E_CUSTOMER_PRODUCT_SUBSCRIPTIONS_DECISION_RECORD.md`.

## Escopo permitido

- Criar migration local para tabelas, enums, views, RPCs, RLS, grants e audit do V1-E.
- Criar testes pgTAP locais.
- Atualizar contratos TypeScript em `packages/contracts`.
- Atualizar `docs/VIEW_RPC_CONTRACTS.md`.
- Atualizar `docs/PROJECT_STATE.md`, `docs/DOCUMENTATION_LEDGER.md` e relatório do lote.
- Criar fixture/seed local somente se necessario para teste e sem dado real.

## Escopo proibido

- UI.
- Frontend runtime.
- Billing completo.
- Preco real.
- Invoice.
- Integracao financeira.
- Portal customer-facing com plano/features.
- CS Workspace.
- Finance Workspace.
- Migration remota.
- Deploy remoto.
- Service role fora de scripts/testes locais ja autorizados.
- Dados reais de cliente.
- Migracao automatica de `product_line`, `account_tier` ou `customer_account_features`.
- Entitlement tecnico runtime para ligar/desligar features do produto.

## Tabelas candidatas

### `customer_product_subscriptions`

Finalidade: vinculo canonico `tenant -> product -> plan`.

Campos candidatos:

- `id uuid primary key`
- `tenant_id uuid not null references public.tenants(id)`
- `product_id uuid not null references public.commercial_products(id)`
- `plan_id uuid not null references public.commercial_product_plans(id)`
- `status public.customer_product_subscription_status not null`
- `started_at timestamptz`
- `ended_at timestamptz`
- `renewal_at timestamptz`
- `contract_reference text`
- `source text not null default 'manual_admin'`
- `notes_internal text`
- `metadata jsonb not null default '{}'::jsonb`
- `created_by uuid`
- `updated_by uuid`
- `created_at timestamptz not null`
- `updated_at timestamptz not null`
- `archived_at timestamptz`

Constraints esperadas:

- `plan_id` deve pertencer ao mesmo `product_id`.
- `tenant_id + product_id` deve ter no maximo uma subscription ativa corrente, com historico preservado por status/datas.
- `contract_reference`, `notes_internal` e `metadata` nao podem conter segredo/token/credencial.
- status arquivado/cancelado/expirado deve ser coerente com datas.

### `customer_product_feature_entitlements`

Finalidade: excecao comercial governada por subscription/feature quando plano nao basta.

Campos candidatos:

- `id uuid primary key`
- `subscription_id uuid not null references public.customer_product_subscriptions(id)`
- `feature_id uuid not null references public.commercial_product_features(id)`
- `status public.customer_product_feature_entitlement_status not null`
- `entitlement_source public.customer_product_feature_entitlement_source not null`
- `reason text not null`
- `starts_at timestamptz`
- `ends_at timestamptz`
- `metadata jsonb not null default '{}'::jsonb`
- `created_by uuid`
- `updated_by uuid`
- `created_at timestamptz not null`
- `updated_at timestamptz not null`
- `archived_at timestamptz`

Constraints esperadas:

- `feature_id` deve pertencer ao mesmo produto da subscription.
- entitlement ativo deve ser unico por `subscription_id + feature_id + entitlement_source` quando aplicavel.
- motivo obrigatorio.
- sem segredo/token/credencial.

### `customer_product_internal_owners`

Finalidade: responsaveis internos por subscription.

Campos candidatos:

- `id uuid primary key`
- `subscription_id uuid not null references public.customer_product_subscriptions(id)`
- `owner_user_id uuid references public.profiles(user_id)`
- `area_key text references public.internal_action_target_areas(area_key)`
- `owner_role public.customer_product_internal_owner_role not null`
- `status public.customer_product_internal_owner_status not null`
- `starts_at timestamptz`
- `ends_at timestamptz`
- `notes_internal text`
- `created_by uuid`
- `updated_by uuid`
- `created_at timestamptz not null`
- `updated_at timestamptz not null`
- `archived_at timestamptz`

Constraints esperadas:

- owner pode ser pessoa, area ou ambos conforme role.
- ownership nao concede permissao sozinho.
- pessoa owner precisa continuar governada por roles/memberships existentes para operar.

## Views candidatas

### Admin

- `vw_admin_customer_product_subscriptions`
- `vw_admin_customer_product_subscription_detail`
- `vw_admin_customer_product_feature_entitlements`
- `vw_admin_customer_product_internal_owners`

Conteudo permitido:

- tenant, produto, plano, status, datas, owner, features, metadata sanitizada e audit summary permitido.

### Support-safe

- `vw_support_customer_product_context`

Conteudo permitido:

- tenant acessivel ao suporte;
- produtos ativos;
- labels de plano;
- features support-visible;
- gaps seguros entre contratado e habilitado operacionalmente;
- owners de suporte/area relevantes.

Conteudo proibido:

- preco;
- invoice;
- contrato bruto;
- financeiro sensivel;
- audit bruto.

### Future-only, nao implementar se nao houver decisao adicional

- `vw_customer_portal_product_context`
- `vw_cs_customer_product_portfolio`
- `vw_finance_customer_product_subscriptions`

## RPCs candidatas

Admin-only:

- `rpc_admin_create_customer_product_subscription`
- `rpc_admin_update_customer_product_subscription`
- `rpc_admin_archive_customer_product_subscription`
- `rpc_admin_set_customer_product_feature_entitlement`
- `rpc_admin_archive_customer_product_feature_entitlement`
- `rpc_admin_assign_customer_product_internal_owner`
- `rpc_admin_archive_customer_product_internal_owner`

Regras:

- validar `platform_admin` no backend;
- validar tenant/produto/plano/status;
- validar que plan pertence ao product;
- validar que feature pertence ao product;
- sanitizar campos text/jsonb;
- registrar audit;
- retornar record ou read model minimo.

## RLS e grants esperados

- RLS habilitada em todas as tabelas novas.
- `anon` sem acesso.
- `authenticated` sem DML direto em tabelas base.
- `authenticated` com SELECT apenas nas views permitidas.
- `authenticated` com EXECUTE apenas nas RPCs aprovadas.
- `service_role` com grants tecnicos conforme padrao local, sem uso pelo app.
- Views com `security_barrier = true`.
- RPCs `SECURITY DEFINER` com `SET search_path = ''`.
- Policies devem preservar tenant boundary e role admin.

## Eventos e auditoria esperados

Eventos/audit logs para:

- subscription criada;
- subscription atualizada;
- subscription arquivada/cancelada/suspensa;
- entitlement definido;
- entitlement arquivado;
- owner atribuido;
- owner arquivado;
- tentativa bloqueada quando aplicavel.

Audit deve registrar entidade, ator, tenant, antes/depois sanitizado e motivo quando fornecido. Nao registrar segredo, token, credencial, contrato bruto, valor financeiro ou payload sensivel.

## Fixtures e testes esperados

Teste pgTAP dedicado:

- tabelas existem;
- enums existem;
- RLS habilitada;
- grants corretos;
- `anon` bloqueado;
- `authenticated` sem DML direto nas tabelas base;
- views com `security_barrier`;
- RPCs `SECURITY DEFINER` com `search_path` explicito;
- `platform_admin` consegue criar subscription;
- usuario sem admin nao consegue mutar;
- tenant cross-boundary bloqueado;
- plan de outro produto bloqueado;
- feature de outro produto bloqueada;
- entitlement sem motivo bloqueado;
- owner sem pessoa/area bloqueado se regra exigir;
- audit log criado;
- read models nao vazam financeiro/metadata sensivel.

Fixture local:

- tenant QA com Genius Returns ativo;
- tenant QA com After Sale ativo;
- tenant QA com ambos produtos ativos;
- plano basico/avancado por produto;
- feature inclusa por plano;
- entitlement excepcional opcional;
- owner de CS/suporte/tecnico por subscription.

## Contracts TypeScript esperados

Enums/tipos:

- `CustomerProductSubscriptionStatus`
- `CustomerProductFeatureEntitlementStatus`
- `CustomerProductFeatureEntitlementSource`
- `CustomerProductInternalOwnerRole`
- `CustomerProductInternalOwnerStatus`

Records/read models:

- `CustomerProductSubscriptionRecord`
- `CustomerProductFeatureEntitlementRecord`
- `CustomerProductInternalOwnerRecord`
- `AdminCustomerProductSubscription`
- `AdminCustomerProductSubscriptionDetail`
- `AdminCustomerProductFeatureEntitlement`
- `AdminCustomerProductInternalOwner`
- `SupportCustomerProductContext`

Payloads/responses:

- `RpcAdminCreateCustomerProductSubscriptionPayload`
- `RpcAdminUpdateCustomerProductSubscriptionPayload`
- `RpcAdminArchiveCustomerProductSubscriptionPayload`
- `RpcAdminSetCustomerProductFeatureEntitlementPayload`
- `RpcAdminArchiveCustomerProductFeatureEntitlementPayload`
- `RpcAdminAssignCustomerProductInternalOwnerPayload`
- `RpcAdminArchiveCustomerProductInternalOwnerPayload`

## Documentacao a atualizar

- `docs/VIEW_RPC_CONTRACTS.md`
- `docs/PROJECT_STATE.md`
- `docs/DOCUMENTATION_LEDGER.md`
- `docs/ROADMAP_BUILDOUT_V3.md`, apenas se a sequencia de lotes mudar.
- Relatorio do lote em `docs/reports/`.
- Este execution plan, se houver decisao de ajuste durante implementacao.

## Comandos de validacao

Obrigatorios:

- `git status --short`
- `git diff --check`
- `npm run contracts:typecheck`
- `npm run supabase:lint:db`
- `npm run supabase:test:db`

Quando migration for aplicada localmente:

- `npx supabase migration up --local`
- `npm run supabase:verify` se o contrato alterar baseline relevante.

Docs:

- `npm run documentation:validate:internal-docs` se Product Docs/catalogo interno forem afetados.

Nao rodar deploy remoto, migration remota, db push remoto ou teste com dado real.

## Stop conditions

Parar se:

- qualquer arquivo de UI/frontend for necessario para "completar" o lote;
- billing/preco/invoice virar requisito;
- Portal customer-facing precisar expor plano/features neste lote;
- Produto contestar After Sale como produto proprio;
- multiproduto por tenant for rejeitado;
- `customer_account_features` precisar ser migrado automaticamente;
- aparecer necessidade de service_role fora do fluxo local/teste existente;
- houver risco de vazamento cross-tenant;
- pgTAP de RLS/grants falhar;
- `git diff` incluir arquivo fora de `supabase/`, `packages/contracts` e docs esperadas sem justificativa explicita.

## Prompt recomendado para o proximo `/goal` de implementacao

```text
/goal
Atue como engenheiro de software sênior, arquiteto SaaS multi-tenant e operador Codex do Genius Support OS.

Objetivo:
Implementar OCP V1-E Customer Product Subscriptions Foundation como lote backend/contracts local, sem UI e sem billing completo.

Leia primeiro:
- AGENTS.md
- docs/GOAL_EXECUTION_PLAN.md
- docs/product/OCP_V1_E_CUSTOMER_PRODUCT_SUBSCRIPTIONS_DECISION_RECORD.md
- docs/reports/OCP_V1_E_CUSTOMER_PRODUCT_SUBSCRIPTIONS_EXECUTION_PLAN.md
- docs/VIEW_RPC_CONTRACTS.md
- docs/ARCHITECTURE_RULES.md
- docs/AUTH_CONTEXT_STRATEGY.md
- docs/VALIDATION_CHECKLIST.md

Escopo permitido:
- migration local de subscriptions, entitlements comerciais governados e internal owners;
- views admin e support-safe;
- RPCs admin-only;
- pgTAP;
- contracts TypeScript;
- documentação de contratos/estado/ledger/relatório.

Escopo proibido:
- UI/frontend runtime;
- billing, preço, invoice ou integração financeira;
- Portal customer-facing com plano/features;
- deploy remoto, migration remota, service_role fora do padrão local;
- dados reais;
- migrar customer_account_features/product_line/account_tier automaticamente.

Decisões fixas:
- After Sale é produto/plataforma própria em commercial_products.
- Um tenant pode ter múltiplos produtos ativos.
- Subscription é tenant -> product -> plan.
- Ownership de subscription não concede permissão sozinho.
- Visibilidade vem de views/RPCs.

Validações:
- git status --short
- git diff --check
- npm run contracts:typecheck
- npm run supabase:lint:db
- npm run supabase:test:db
- npm run supabase:verify se aplicável

Entrega:
- implementação local validada;
- relatório em docs/reports;
- recomendação de próximo lote;
- git status final;
- não fazer commit sem autorização explícita.
```
