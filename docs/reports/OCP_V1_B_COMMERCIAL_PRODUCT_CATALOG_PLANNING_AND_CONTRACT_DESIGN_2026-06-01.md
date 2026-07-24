# OCP V1-B - Commercial Product Catalog Planning & Contract Design

Data: 2026-06-01
Branch: `codex/project-forensic-recovery-audit`
Base: `c41e20d`
Escopo: auditoria e desenho contratual futuro. Este lote nao cria migration, schema, tabela, RPC, UI ou runtime.

## Resumo executivo

O Genius Support OS ja possui uma base operacional de cliente B2B em `tenants` e `customer_account_*`, mas ainda nao possui catalogo comercial canonico. O que existe hoje e suficiente para suporte e admin enxergarem contexto operacional de conta: linha de produto resumida, tier/plano textual, integracoes, features habilitadas por conta, customizacoes e alertas.

Essa base nao deve ser promovida a catalogo comercial. `customer_account_features` registra habilitacao operacional por tenant; nao representa produto, plano, modulo, feature vendida, limite contratado, add-on ou entitlement comercial. O catalogo comercial precisa nascer como dominio proprio, com produtos, planos, modulos, features comercializadas, relacao plano-feature, assinaturas cliente-produto-plano e ownership por area.

Recomendacao: o proximo lote implementavel deve criar apenas a fundacao backend do catalogo comercial, começando por produtos, planos, modulos, features canonicas e ownership de area, sem UI. O vinculo cliente-produto-plano deve vir em lote seguinte, depois de decisoes de produto sobre MVP, After Sale, multiproduto, limites e permissao financeira.

## Entidades existentes auditadas

### `tenants`

Representa o cliente B2B operacional. Deve continuar sendo a ancora de qualquer futura assinatura cliente-produto-plano. Nao deve ser duplicado por `customers`, `accounts` ou entidade comercial paralela.

Uso futuro:

- FK obrigatoria em `customer_product_subscriptions`.
- Filtro principal de RLS para dados de cliente.
- Base para read models de suporte, CS, financeiro e portal.

Limite:

- `tenants` nao descreve produto contratado, plano, modulo, limite, preco ou feature comercial.

### `customer_account_profiles`

Representa o perfil operacional principal por tenant. Campos atuais relevantes:

- `tenant_id`
- `product_line`
- `operational_status`
- `account_tier`
- `internal_notes`
- `operational_flags`

Uso futuro:

- continuar como resumo operacional e apoio a Support/Admin/Portal.
- pode receber referencia derivada de assinatura ativa via view futura, mas nao deve virar fonte de verdade de catalogo comercial.

Limite:

- `product_line` e `account_tier` sao resumo operacional legado/atual, nao substituem `commercial_products`, `commercial_product_plans` ou `customer_product_subscriptions`.

### `customer_account_features`

Representa feature operacional habilitada por conta. Campos atuais relevantes:

- `tenant_id`
- `feature_key`
- `enabled`
- `source`
- `notes`

Uso futuro:

- manter como override/habilitacao operacional por tenant.
- pode apontar no futuro para uma feature comercial canonica, se Produto aprovar, mas nao deve ser o catalogo.

Limite:

- nao representa feature vendida por si so.
- nao representa plano, modulo, add-on, limite ou entitlement comercial.
- nao deve ser usado para descobrir quais produtos existem.

### `customer_account_integrations`

Representa stack operacional e integracoes do cliente. Ajuda suporte e engenharia a entenderem contexto tecnico.

Uso futuro:

- pode alimentar read models de suporte, CS e produto.
- pode apoiar compatibilidade de modulo/feature, mas nao deve definir contratacao.

Limite:

- provider/status/ambiente nao equivalem a modulo vendido.
- nao deve armazenar segredo, token, endpoint sensivel ou payload tecnico bruto.

### `internal_action_target_areas` e `internal_area_memberships`

Depois do OCP V1-A, funcionam como base inicial de areas internas e membership operacional.

Uso futuro:

- `product_area_ownerships` deve apontar para area canonica por `area_key`.
- ownership de produto/modulo deve ser separado de membership de colaborador.

Limite:

- area interna nao e produto.
- membership de area nao e responsabilidade comercial por produto.

### Knowledge entitlements existentes

O dominio de Knowledge ja usa `knowledge_article_entitlements` para acesso customer-facing a conteudo publicado restrito.

Uso futuro:

- serve como referencia semantica para o termo "entitlement".

Limite:

- entitlement de Knowledge nao e entitlement comercial de feature/produto.
- nao deve ser misturado com `customer_product_feature_entitlements`.

## Riscos de reutilizacao indevida

- Usar `customer_account_features` como lista de features comercializadas.
- Usar `product_line` como catalogo de produtos.
- Usar `account_tier` como plano contratado canonico.
- Criar `customers` paralelo a `tenants`.
- Criar `customer_profiles_v2` para resolver multiproduto.
- Misturar entitlement de Knowledge com entitlement comercial.
- Usar `tenant_memberships` para responsavel interno por produto/cliente.
- Usar area interna como produto ou produto como area.
- Expor valores financeiros ou limites sensiveis em views de suporte/portal sem mascaramento e decisao de produto.
- Criar UI de Admin/CS/Financeiro antes dos read models/RPCs.

## Glossario semantico

| Termo | Definicao | Nao e |
| --- | --- | --- |
| Produto comercializado | Oferta vendavel de alto nivel, como `Genius Returns` ou `After Sale`. | Tenant, feature flag, integracao ou area interna. |
| Plano | Pacote comercial/operacional de um produto, com preco/escopo/limites definidos fora deste lote. | `account_tier` livre ou status operacional. |
| Modulo | Agrupamento de capacidades dentro de um produto, contratavel ou habilitavel conforme plano. | Feature isolada por tenant. |
| Feature comercial | Capacidade canonica do produto que pode estar inclusa em plano ou add-on. | `customer_account_features.feature_key` solto. |
| Feature operacional por conta | Habilitacao real/override de uma capacidade em um tenant. | Catalogo de produto ou garantia de contratacao. |
| Entitlement comercial | Direito efetivo de um tenant usar uma feature comercial, derivado de plano, add-on ou excecao governada. | Entitlement de Knowledge ou role de usuario. |
| Add-on | Feature/modulo contratado fora do plano base. | Customizacao interna ou flag temporaria de suporte. |
| Limite de plano | Quantidade, canal, volume, SLA ou restricao de uso vinculada ao plano/feature. | Alerta operacional ou health score. |
| Ownership interno por produto/area | Area interna responsavel por produto/modulo/feature. | Membership de colaborador ou responsavel CS por cliente. |

## Proposta de modelo futuro

### `commercial_products`

Finalidade: catalogo canonico de produtos comercializados.

Campos provaveis:

- `id`
- `product_key`
- `display_name`
- `description`
- `status`
- `created_at`
- `updated_at`
- `created_by_user_id`
- `updated_by_user_id`

Regras:

- `product_key` estavel, minusculo e unico.
- status controlado: `draft`, `active`, `deprecated`, `archived`.
- sem tenant_id; produto e catalogo global.

### `commercial_product_plans`

Finalidade: planos por produto.

Campos provaveis:

- `id`
- `product_id`
- `plan_key`
- `display_name`
- `description`
- `status`
- `billing_visibility`
- `created_at`
- `updated_at`
- `created_by_user_id`
- `updated_by_user_id`

Regras:

- plano pertence a um produto.
- valores financeiros ficam fora do primeiro corte ou mascarados, conforme decisao de produto.

### `commercial_product_modules`

Finalidade: agrupamentos de capacidades por produto.

Campos provaveis:

- `id`
- `product_id`
- `module_key`
- `display_name`
- `description`
- `status`
- `sort_order`
- `created_at`
- `updated_at`

Regras:

- modulo pode existir sem feature ativa.
- modulo nao concede acesso sozinho; concessao vem do plano/add-on/entitlement.

### `commercial_product_features`

Finalidade: catalogo canonico de features comercializadas/capacidades.

Campos provaveis:

- `id`
- `product_id`
- `module_id`
- `feature_key`
- `display_name`
- `description`
- `status`
- `customer_visible_default`
- `support_visible_default`
- `created_at`
- `updated_at`

Regras:

- `feature_key` canonico, nao derivado de texto livre.
- feature comercial nao equivale a estar habilitada em um tenant.

### `commercial_plan_features`

Finalidade: relacao plano-feature, incluindo default, opcionalidade e limites.

Campos provaveis:

- `id`
- `plan_id`
- `feature_id`
- `inclusion_type`
- `default_enabled`
- `limit_key`
- `limit_value`
- `limit_unit`
- `created_at`
- `updated_at`

Regras:

- `inclusion_type`: `included`, `optional`, `addon_available`, `excluded`.
- limites devem ser estruturados e auditaveis, nao JSON livre no primeiro corte.

### `customer_product_subscriptions`

Finalidade: vinculo tenant-produto-plano.

Campos provaveis:

- `id`
- `tenant_id`
- `product_id`
- `plan_id`
- `status`
- `starts_at`
- `ends_at`
- `contract_reference`
- `created_at`
- `updated_at`
- `created_by_user_id`
- `updated_by_user_id`

Regras:

- permite multiproduto por tenant.
- status controlado: `pending`, `active`, `suspended`, `cancelled`, `expired`.
- `contract_reference` deve ser seguro e nao conter dado financeiro sensivel bruto.

### `customer_product_feature_entitlements`

Finalidade: direito efetivo de feature por tenant/produto, quando o plano nao basta.

Criar apenas se fizer sentido apos decisao de produto. Pode representar add-on, excecao, piloto ou override.

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

Regras:

- `entitlement_source`: `plan`, `addon`, `pilot`, `ops_override`, `migration`.
- nao substitui `customer_account_features` automaticamente.
- pode alimentar uma view que compare contratado versus habilitado operacionalmente.

### `product_area_ownerships`

Finalidade: area interna dona/apoio por produto, modulo ou feature.

Campos provaveis:

- `id`
- `product_id`
- `module_id`
- `feature_id`
- `area_key`
- `ownership_role`
- `status`
- `created_at`
- `updated_at`

Regras:

- `area_key` referencia o catalogo de areas internas consolidado no OCP V1-A.
- ownership de area nao concede permissao individual; permissao individual continua em `internal_area_memberships`.

## Migrations provaveis futuras

### OCP V1-C Product Catalog Foundation

Criar:

- `commercial_products`
- `commercial_product_plans`
- `commercial_product_modules`
- `commercial_product_features`
- `commercial_plan_features`
- `product_area_ownerships`

Incluir:

- RLS habilitada.
- grants sem DML direto para app.
- RPCs admin-only.
- audit triggers.
- pgTAP de grants, RLS, DML direto, security_barrier e exposicao segura.

### OCP V1-D Customer Product Subscriptions

Criar:

- `customer_product_subscriptions`
- possivelmente `customer_product_feature_entitlements`

Incluir:

- FK para `tenants`.
- FK para catalogo comercial.
- views por superficie: admin, support, portal, CS e finance.
- comparacao segura entre contratado e habilitado operacionalmente.

## Views provaveis futuras

- `vw_admin_commercial_products`
- `vw_admin_commercial_product_detail`
- `vw_admin_commercial_product_plans`
- `vw_admin_commercial_plan_features`
- `vw_admin_product_area_ownerships`
- `vw_admin_customer_product_subscriptions`
- `vw_admin_customer_product_entitlements`
- `vw_support_customer_product_context`
- `vw_customer_portal_product_context`
- `vw_cs_customer_product_portfolio`
- `vw_finance_customer_contract_context`
- `vw_ai_product_context_readiness`

Regra: cada view deve ser pequena, orientada a superficie e sem payload sensivel bruto.

## RPCs provaveis futuras

- `rpc_admin_create_commercial_product`
- `rpc_admin_update_commercial_product`
- `rpc_admin_create_commercial_product_plan`
- `rpc_admin_update_commercial_product_plan`
- `rpc_admin_create_commercial_product_module`
- `rpc_admin_update_commercial_product_module`
- `rpc_admin_create_commercial_product_feature`
- `rpc_admin_update_commercial_product_feature`
- `rpc_admin_set_commercial_plan_feature`
- `rpc_admin_assign_product_area_ownership`
- `rpc_admin_archive_product_area_ownership`
- `rpc_admin_create_customer_product_subscription`
- `rpc_admin_update_customer_product_subscription`
- `rpc_admin_set_customer_product_feature_entitlement`
- `rpc_admin_archive_customer_product_feature_entitlement`

Todas as RPCs devem exigir ator ativo, papel autorizado, escopo explicito, validacao de texto seguro, motivo quando aplicavel e audit trail.

## Impactos em contratos TS

Tipos futuros provaveis:

- `CommercialProductStatus`
- `CommercialProduct`
- `CommercialProductPlan`
- `CommercialProductModule`
- `CommercialProductFeature`
- `CommercialPlanFeature`
- `ProductAreaOwnership`
- `CustomerProductSubscription`
- `CustomerProductFeatureEntitlement`
- payloads/responses de RPC administrativas
- read models separados para Admin, Support, Portal, CS e Financeiro

Regra:

- tipos de catalogo comercial devem ficar separados de `CustomerProductLine` e `AdminCustomerAccountFeature`.
- `CustomerProductLine` pode permanecer como compatibilidade/resumo operacional ate migration posterior de transicao.

## Impactos em frontend futuro

### Admin Console

Futuro Admin deve governar catalogo, planos, modulos, features, ownership de areas e assinaturas de cliente. Nao deve editar tabela base nem montar feature entitlement localmente.

### Support Workspace

Suporte deve receber resumo seguro: produto ativo, plano, modulos relevantes, features permitidas e alertas de diferenca entre contratado/habilitado. Nao deve alterar catalogo ou assinatura.

### Customer Account Profile

Deve continuar exibindo estado operacional. Futuramente pode mostrar dados derivados de assinatura, mas sem virar fonte de verdade comercial.

### CS futuro

CS precisa de carteira por produto/plano, health signals e ownership, mas isso depende de assinatura cliente-produto-plano. Nao implementar neste lote.

### Financeiro futuro

Financeiro precisa de contexto contratual e status permitido. Valores, vencimentos e inadimplencia exigem decisao de produto e mascaramento.

### Portal Cliente

Portal pode exibir produto/plano resumido e features contratadas apenas se Produto aprovar visibilidade customer-facing. Nunca deve expor notas internas, area ownership, audit bruto ou divergencia operacional sensivel.

### AI readiness futura

IA pode usar contexto de produto/plano apenas como fonte governada, com citacao, redacao segura, permissao por fonte e auditoria de uso. IA nao decide entitlement, plano, preco, downgrade, upgrade ou cancelamento.

## Riscos de seguranca

- vazamento cross-tenant em subscriptions ou entitlements.
- exposicao de preco, limite contratual ou status financeiro a suporte/portal sem decisao de produto.
- confundir feature operacional habilitada com direito comercial contratado.
- dar permissao por ownership de area sem membership individual.
- expor audit bruto, metadata ou contrato sensivel em view administrativa.
- criar `SECURITY DEFINER` sem `SET search_path = ''` em lote futuro.
- conceder DML direto para `authenticated` em tabelas de catalogo.
- deixar `anon` ler catalogo interno se houver planos/features nao publicos.
- permitir que frontend calcule entitlement por combinacao local.

## Decisoes de produto pendentes

1. Quais produtos entram no MVP do catalogo: apenas `Genius Returns` ou tambem `After Sale`.
2. `After Sale` e produto separado, modulo de outro produto ou familia futura.
3. Quais planos existem no MVP e quais nomes podem aparecer para suporte/cliente.
4. Quais modulos sao comercializados e quais sao apenas agrupamentos internos.
5. Quais features sao vendidas, quais sao operacionais e quais sao gates temporarios.
6. Add-on deve existir no MVP ou ficar fora ate haver cobranca/contrato real.
7. Um tenant pode ter multiplos produtos ativos ao mesmo tempo.
8. Uma assinatura pode ter multiplos planos historicos ou apenas plano atual.
9. Suporte pode ver limites de plano ou apenas resumo operacional.
10. Portal Cliente pode ver plano/features ou apenas produto/status operacional.
11. Financeiro pode ver valores, status resumido ou apenas alerta operacional.
12. Quem mantem catalogo: platform admin, produto, financeiro ou operacoes.
13. Quem mantem assinatura por cliente: admin, financeiro, CS ou owner de conta.
14. Como tratar cliente legado com `product_line = hybrid`.
15. Como reconciliar feature contratada versus feature operacional desabilitada.
16. Como registrar piloto, excecao comercial e override operacional.

## Primeiro lote implementavel recomendado apos aprovacao

Nome recomendado: `OCP V1-C Product Catalog Foundation`.

Escopo seguro:

- criar tabelas globais de catalogo:
  - `commercial_products`
  - `commercial_product_plans`
  - `commercial_product_modules`
  - `commercial_product_features`
  - `commercial_plan_features`
  - `product_area_ownerships`
- criar views admin-only:
  - `vw_admin_commercial_products`
  - `vw_admin_commercial_product_detail`
  - `vw_admin_commercial_product_plans`
  - `vw_admin_product_area_ownerships`
- criar RPCs admin-only de create/update/archive.
- adicionar pgTAP de RLS/grants/DML/security_barrier.
- nao criar UI.
- nao criar assinaturas por cliente ainda.
- nao migrar `customer_account_features`.

Fora do primeiro lote:

- `customer_product_subscriptions`.
- `customer_product_feature_entitlements`.
- CS Workspace.
- Finance Workspace.
- Portal com produto/plano.
- health score.
- valores financeiros.

## Boundary confirmado

- Nenhuma migration criada neste lote.
- Nenhum schema alterado neste lote.
- Nenhuma tabela criada neste lote.
- Nenhuma RPC criada neste lote.
- Nenhuma UI criada neste lote.
- Nenhum runtime alterado neste lote.
- Nenhuma alteracao em `supabase/` deve existir neste lote.
