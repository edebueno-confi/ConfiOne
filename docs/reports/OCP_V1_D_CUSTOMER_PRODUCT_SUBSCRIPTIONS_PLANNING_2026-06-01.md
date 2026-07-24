# OCP V1-D - Customer Product Subscriptions Planning

Data: 2026-06-01
Branch: `codex/project-forensic-recovery-audit`
Base: `6d474fc`
Escopo: planejamento contratual do vinculo cliente-produto-plano e entitlements comerciais. Este lote nao cria migration, schema, tabela, RPC, UI ou runtime.

## Resumo executivo

O OCP V1-C criou o catalogo comercial global. O V1-D planeja a proxima camada: vincular `tenants` a produtos e planos contratados, com possivel entitlement comercial por feature quando o plano nao for suficiente.

A implementacao ainda nao deve avancar porque persistem decisoes de produto inevitaveis: se o MVP cobre apenas Genius Returns ou tambem After Sale, como representar multiproduto por tenant, qual visibilidade suporte/portal/financeiro pode ter e quem mantem assinatura.

## Entidades auditadas

### `tenants`

Continua sendo a entidade canonica do cliente B2B. Qualquer subscription futura deve referenciar `tenants.id`; nao criar `customers`, `accounts` ou cliente comercial paralelo.

Uso futuro:

- FK obrigatoria em `customer_product_subscriptions`.
- ancora de RLS cross-tenant.
- fonte de identidade operacional do cliente para Admin, Support, Portal, CS e Financeiro.

### `customer_account_profiles`

Permanece como perfil operacional da conta. Campos como `product_line` e `account_tier` podem ser usados como contexto legado/resumo, mas nao devem virar contrato comercial canonico.

Uso futuro:

- read models podem exibir dados derivados de assinatura ativa.
- pode apoiar migracao assistida de clientes legados, com revisao humana.

Limite:

- nao representa produto/plano contratado.
- nao deve ser escrito automaticamente a partir de assinatura sem decisao de transicao.

### `customer_account_features`

Permanece como feature operacional habilitada por conta. Nao e catalogo, plano, add-on ou entitlement comercial.

Uso futuro:

- comparar contratado versus habilitado operacionalmente.
- representar override operacional temporario apenas se governado por motivo/auditoria.

Limite:

- nao migrar automaticamente para `customer_product_feature_entitlements`.
- nao usar para descobrir quais features vendidas existem.

### Catalogo V1-C

Entidades criadas:

- `commercial_products`
- `commercial_product_plans`
- `commercial_product_modules`
- `commercial_product_features`
- `commercial_plan_features`
- `product_area_ownerships`

Uso futuro:

- produto/plano/feature de assinatura devem referenciar esse catalogo.
- ownership interno segue separado de permissao individual.

Limite:

- catalogo nao indica cliente contratado.
- `commercial_plan_features` define oferta/plano; nao indica entitlement efetivo por tenant.

## Modelo futuro proposto

### `customer_product_subscriptions`

Finalidade: vinculo tenant-produto-plano contratado.

Campos provaveis:

- `id`
- `tenant_id`
- `product_id`
- `plan_id`
- `status`
- `starts_at`
- `ends_at`
- `contract_reference`
- `source`
- `created_at`
- `updated_at`
- `created_by_user_id`
- `updated_by_user_id`

Status provaveis:

- `pending`
- `active`
- `suspended`
- `cancelled`
- `expired`

Regras:

- `tenant_id` referencia `tenants`.
- `product_id` e `plan_id` devem pertencer ao mesmo produto.
- permitir multiproduto por tenant se Produto aprovar.
- nao armazenar preco, valor, moeda ou invoice no primeiro corte.
- `contract_reference` deve ser texto seguro, sem dado financeiro bruto ou segredo.

### `customer_product_feature_entitlements`

Criar apenas se Produto confirmar que plano nao basta.

Finalidade: direito efetivo de feature por subscription, derivado de add-on, piloto, excecao comercial ou override governado.

Campos provaveis:

- `id`
- `subscription_id`
- `feature_id`
- `entitlement_source`
- `status`
- `starts_at`
- `ends_at`
- `reason`
- `created_at`
- `updated_at`
- `created_by_user_id`
- `updated_by_user_id`

Sources provaveis:

- `plan`
- `addon`
- `pilot`
- `commercial_exception`
- `ops_override`
- `migration`

Regras:

- feature deve pertencer ao produto da subscription.
- entitlement nao substitui `customer_account_features`.
- entitlement customer-facing depende de decisao explicita de visibilidade.

## Views futuras provaveis

### Admin

- `vw_admin_customer_product_subscriptions`
- `vw_admin_customer_product_subscription_detail`
- `vw_admin_customer_product_entitlements`
- `vw_admin_customer_product_subscription_audit_summary`

Admin pode ver dados operacionais de assinatura, mas valores financeiros continuam fora ate decisao de produto.

### Support

- `vw_support_customer_product_context`
- `vw_support_ticket_customer_product_context`

Support deve ver produto/plano/status operacional e gaps seguros entre contratado e habilitado. Nao deve ver preco, contrato bruto, invoice ou nota financeira.

### Portal Cliente

- `vw_customer_portal_product_context`

Portal deve receber apenas produto/plano/features se Produto aprovar visibilidade customer-facing. Sem area ownership, auditoria, preco ou divergencia sensivel.

### CS futuro

- `vw_cs_customer_product_portfolio`
- `vw_cs_customer_product_subscription_health_inputs`

CS depende de assinatura ativa, mas health score fica fora ate lote proprio.

### Financeiro futuro

- `vw_finance_customer_contract_context`

Financeiro exige decisao se ve valores reais, status financeiro ou apenas status operacional. Nao implementar antes dessa decisao.

## RPCs futuras provaveis

- `rpc_admin_create_customer_product_subscription`
- `rpc_admin_update_customer_product_subscription`
- `rpc_admin_archive_customer_product_subscription`
- `rpc_admin_set_customer_product_feature_entitlement`
- `rpc_admin_archive_customer_product_feature_entitlement`

Regras obrigatorias:

- `SECURITY DEFINER` com `SET search_path = ''`.
- validar ator ativo.
- exigir `platform_admin` ou papel futuro explicitamente aprovado.
- validar tenant ativo ou tratar tenant inativo explicitamente.
- validar product/plan/feature do mesmo produto.
- bloquear texto com segredo/token/credencial.
- gerar `audit.audit_logs`.
- sem DML direto por `authenticated`.

## RLS e grants futuros

- RLS habilitada nas tabelas novas.
- `anon` sem SELECT.
- `authenticated` sem SELECT/DML direto nas bases.
- leitura por views segmentadas por superficie.
- escrita apenas por RPC.
- policies devem considerar `tenant_id`, papel global, membership e superficie.
- pgTAP deve cobrir cross-tenant, grants, DML direto, views `security_barrier`, `SECURITY DEFINER` e ausencia de exposicao sensivel.

## Convivencia com `customer_account_features`

Regra central: nao migrar nem apagar `customer_account_features` no lote de subscriptions.

Modelo de convivencia:

- `customer_product_subscriptions` representa direito contratado.
- `customer_product_feature_entitlements` representa direito comercial efetivo, se existir.
- `commercial_plan_features` representa oferta do plano.
- `customer_account_features` representa estado operacional habilitado por tenant.

Read model futuro pode comparar:

- contratado e habilitado;
- contratado mas desabilitado operacionalmente;
- habilitado operacionalmente sem entitlement comercial;
- piloto/excecao com data de fim.

Essa comparacao deve ser backend-derived e nao calculada pelo frontend.

## Impactos em contratos TS

Tipos futuros:

- `CustomerProductSubscriptionStatus`
- `CustomerProductSubscription`
- `CustomerProductFeatureEntitlementStatus`
- `CustomerProductFeatureEntitlementSource`
- `CustomerProductFeatureEntitlement`
- `AdminCustomerProductSubscription`
- `AdminCustomerProductSubscriptionDetail`
- `SupportCustomerProductContext`
- `CustomerPortalProductContext`, se aprovado
- payloads/responses das RPCs administrativas

## Impactos em frontend futuro

### Admin Console

Futuro Admin deve operar assinatura por cliente via views/RPCs, sem editar tabela base e sem montar entitlement localmente.

### Support Workspace

Support deve receber contexto resumido e seguro no rail do cliente/ticket. Nao deve alterar assinatura ou entitlement.

### Customer Account Profile

Pode exibir resumo derivado de assinatura, mas continua sendo estado operacional, nao fonte comercial.

### Portal Cliente

Depende de decisao de produto. Se habilitado, deve mostrar apenas dados customer-facing aprovados.

### CS e Financeiro

Continuam fora do escopo implementavel ate haver contrato e decisoes de visibilidade.

## Decisoes de produto pendentes

1. MVP inclui apenas `Genius Returns` ou tambem `After Sale`.
2. After Sale e produto separado, modulo ou familia futura.
3. Tenant pode ter multiplos produtos ativos simultaneamente.
4. Tenant pode ter mais de uma assinatura ativa para o mesmo produto.
5. Plano contratado pode ser visivel para suporte.
6. Plano/features podem ser visiveis no Portal Cliente.
7. Financeiro pode ver valores reais, status financeiro ou apenas status operacional.
8. Quem mantem assinatura: platform admin, Financeiro, CS ou owner da conta.
9. Add-on entra no MVP ou fica para depois.
10. `ops_override` deve existir como entitlement comercial ou ficar somente em `customer_account_features`.
11. Como tratar `product_line = hybrid` em clientes legados.
12. Como registrar piloto e excecao com data de expiracao.

## Stop condition

Nao implementar `customer_product_subscriptions` ainda enquanto nao houver decisao minima sobre:

- Genius Returns apenas ou After Sale tambem.
- multiproduto por tenant.
- visibilidade de plano/features para suporte, portal e financeiro.
- owner de manutencao de assinatura.
- diferenca final entre add-on, entitlement e override operacional.

## Primeiro lote implementavel recomendado

Nome recomendado: `OCP V1-E Customer Product Subscriptions Foundation`.

So deve iniciar apos fechar as decisoes minimas acima.

Escopo seguro:

- criar `customer_product_subscriptions`;
- criar `customer_product_feature_entitlements` apenas se Produto confirmar necessidade;
- criar views admin-only e support-safe minimas;
- criar RPCs admin-only;
- adicionar contratos TypeScript;
- adicionar pgTAP de RLS/grants/cross-tenant/cross-product/audit;
- nao criar UI;
- nao migrar `customer_account_features`.
